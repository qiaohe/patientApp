"use strict";
var config = require('../config');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var redis = require('../common/redisClient');
var _ = require('lodash');
var i18n = require('../i18n/localeMessage');
var sysConfigDAO = require('../dao/sysConfig');
var medicalDAO = require('../dao/medicalDAO');
var registrationDAO = require('../dao/registrationDAO');
var deviceDAO = require('../dao/deviceDAO');
var qiniu = require('qiniu');
var pusher = require('../domain/NotificationPusher');
var pingpp = require('pingpp')(config.ping.appSecret);
pingpp.setPrivateKeyPath("./rsa_private_key.pem");
var util = require('util');
var moment = require('moment');
module.exports = {
    sendSMS: function (req, res, next) {
        var smsConfig = config.sms;
        var code = '0000';//_.random(1000, 9999);
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
        qiniu.conf.ACCESS_KEY = '0d02DpW7tBPiN3TuZYV7WcxmN1C9aCiNZeW9fp5W';
        qiniu.conf.SECRET_KEY = '7zD3aC6xpvp_DfDZ0LJhjMq6n6nB6UVDbl37C5FZ';
        var bucket = 'hisforce';
        var putPolicy = new qiniu.rs.PutPolicy(bucket);
        putPolicy.expires = 3600;
        res.send({
            ret: 0, data: {
                token: putPolicy.token()
            }
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
                metadata: {uid: req.user.id, type: +orders[0].type, rid: +orders[0].registrationId},
                app: {id: config.ping.appId}
            }, function (err, charge) {
                if (err) throw err;
                res.send({ret: 0, data: charge});
            });
        });
        return next();
    },
    handlePaymentCallback: function (req, res, next) {
        var orderNo = req.body.data.object.order_no;
        if (!orderNo) return res.send({ret: 0, data: '没有提供正确的支付Charge对象。'});
        var paymentType = (req.body.data.object.channel == 'alipay' ? 0 : 1);
        var registration = {};
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
            return registrationDAO.findRegistrationById(req.body.data.object.metadata.rid);
        }).then(function (registrations) {
            registration = registrations[0];
            return redis.incrAsync('doctor:' + registration.doctorId + ':d:' + registration.registerDate + ':period:' + registration.shiftPeriod + ':incr').then(function (seq) {
                return redis.getAsync('h:' + registration.hospitalId + ':p:' + registration.shiftPeriod).then(function (sp) {
                    registration.sequence = sp + seq;
                    return registrationDAO.updateRegistration({id: registration.id, sequence: registration.sequence});
                });
            });
        }).then(function () {
            return registrationDAO.findShiftPeriodById(registration.hospitalId, registration.shiftPeriod);
        }).then(function (result) {
            deviceDAO.findTokenByUid(registration.patientBasicInfoId).then(function (tokens) {
                if (tokens.length && tokens[0]) {
                    var notificationBody = {};
                    if (req.body.data.object.metadata.type == 0) {
                        notificationBody = util.format(config.registrationNotificationTemplate, registration.patientName + (registration.gender == 0 ? '先生' : '女士'),
                            registration.hospitalName + registration.departmentName + registration.doctorName, moment(registration.registerDate).format('YYYY-MM-DD') + ' ' + result[0].name);
                    } else if (req.body.data.object.metadata.type == 1) {
                        notificationBody = '您好，支付成功！请及时取药！';
                    } else if (req.body.data.object.metadata.type == 2) {
                        notificationBody = '您好，支付成功！请及时就诊！';
                    }
                    pusher.push({
                        body: notificationBody,
                        title: '支付成功',
                        audience: {registration_id: [tokens[0].token]},
                        patientName: registration.patientName,
                        patientMobile: registration.patientMobile,
                        uid: registration.patientBasicInfoId,
                        type: 0,
                        hospitalId: registration.hospitalId
                    }, function (err, result) {
                        if (err) throw err;
                    });
                }
            });
            res.send({ret: 0, data: '支付回调处理成功。'});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }
}