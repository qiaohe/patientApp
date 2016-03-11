"use strict";
var config = require('../config');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var redis = require('../common/redisClient');
var _ = require('lodash');
var i18n = require('../i18n/localeMessage');
var sysConfigDAO = require('../dao/sysConfig');
var medicalDAO = require('../dao/medicalDAO');
var qiniu = require('qiniu');
var pingpp = require('pingpp')(config.ping.appSecret);
pingpp.setPrivateKeyPath("./rsa_private_key.pem");
module.exports = {
    sendSMS: function (req, res, next) {
        var smsConfig = config.sms;
        var code = _.random(1000, 9999);
        var content = smsConfig.template.replace(':code', code);
        var option = {mobile: req.params.mobile, text: content, apikey: config.sms.apikey};
        request.postAsync({url: smsConfig.providerUrl, form: option}).then(function (response, body) {
            console.log(response);
        }).then(function () {
            return redis.set(option.mobile, code);
        }).then(function () {
            return redis.expireAsync(option.mobile, smsConfig.expireTime);
        }).then(function (reply) {
            res.send({ret: 0, message: i18n.get('sms.send.success')});
        });
        return next();
    },

    getAdImages: function (req, res, next) {
        sysConfigDAO.findByKey('sys.ad.images').then(function (configItem) {
            res.send({ret: 0, data: configItem[0].value.split(",")});
        })
    },
    getQiniuToken: function (req, res, next) {
        qiniu.conf.ACCESS_KEY = 'ZNrhKtanGiBCTOPg4XRD9SMOAbLzy8iREzQzUP5T';
        qiniu.conf.SECRET_KEY = 'L6VfXirR55Gk6mQ67Jn4pg7bksMpc-F5mghT0GK4';
        var bucket = 'hisforce';
        var putPolicy = new qiniu.rs.PutPolicy(bucket);
        putPolicy.expires = 3600;
        res.send({
            token: putPolicy.token()
        });
        return next();
    },

    getPaymentCharge: function (req, res, next) {
        var orderNo = req.params.orderNo;
        var paymentType = req.params.paymentType;
        var remoteId = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
        medicalDAO.findOrdersBy(orderNo).then(function (orders) {
            if (!orders.length) return res.send({ret: 0, data: {}});
            pingpp.charges.create({
                subject: config.orderType[+orders[0].type],
                body: config.orderType[+orders[0].type],
                amount: +orders[0].paymentAmount,
                order_no: orderNo,
                channel: +paymentType == 0 ? "alipay" : 'wx',
                currency: "cny",
                client_ip: remoteId,
                metadata: {uid: req.user.id, type: +orders[0].type},
                app: {id: config.ping.appId}
            }, function (err, charge) {
                if (err) throw err;
                res.send({ret: 0, data: charge});
            });
        })
        return next();
    },
    handlePaymentCallback: function (req, res, next) {
        var orderNo = req.body.data.object.order_no;
        if (!orderNo) return res.send({ret: 0, data: '没有提供正确的支付Charge对象。'});
        var paymentType = (req.body.data.object.channel == 'alipay' ? 0 : 1);
        medicalDAO.updateOrder({
            orderNo: orderNo,
            status: 1,
            paymentType: paymentType,
            paidAmount: req.body.data.object.amount,
            paymentDate: new Date()
        }).then(function () {
            medicalDAO.insertTransactionFlow({
                amount: req.body.data.object.amount,
                name: req.body.data.object.subject,
                transactionNo: req.body.data.object.transaction_no,
                paymentType: paymentType,
                orderNo: orderNo,
                hospitalId: +(orderNo.substring(0, 4)),
                createDate: new Date(),
                patientBasicInfoId: req.body.data.object.metadata.uid,
                type: req.body.data.object.metadata.type
            })
        }).then(function (result) {
            res.send({ret: 0, data: '支付回调处理成功。'});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }
}