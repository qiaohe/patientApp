"use strict";
var md5 = require('md5');
var jwt = require("jsonwebtoken");
var config = require('../config');
var redis = require('../common/redisClient');
var i18n = require('../i18n/localeMessage');
var patientDAO = require('../dao/patientDAO');
var hospitalDAO = require('../dao/hospitalDAO');
var registrationDAO = require('../dao/registrationDAO');
var _ = require('lodash');
var moment = require('moment');
var rongcloudSDK = require('rongcloud-sdk');
rongcloudSDK.init(config.rongcloud.appKey, config.rongcloud.appSecret);
function acceptInvitation(uid, invitationCode, mobile, token, res) {
    var contact = {};
    patientDAO.findContactByInvitationCode(invitationCode, mobile).then(function (contacts) {
        if (!contacts.length) return res.send({ret: 1, message: i18n.get('invitation.code.invalid')});
        contact = contacts[0];
        return registrationDAO.updateInvitationContact({id: contact.id, inviteResult: '已绑定'}).then(function () {
            return registrationDAO.updatePerformance(contact.businessPeopleId, moment().format('YYYYMM')).then(function () {
                return registrationDAO.findPatientByBasicInfoIdAndHospitalId(uid, contact.hospitalId);
            });
        })
    }).then(function (patients) {
        if (!patients.length) {
            return redis.incrAsync('member.no.incr').then(function (memberNo) {
                return registrationDAO.insertPatient({
                    patientBasicInfoId: uid,
                    hospitalId: contact.hospitalId,
                    memberType: 1,
                    source: contact.source,
                    balance: 0.00,
                    recommender: contact.businessPeopleId,
                    memberCardNo: contact.hospitalId + '-1-' + _.padLeft(memberNo, 7, '0'),
                    createDate: new Date()
                });
            });
        }
    }).then(function () {
            var message = config.app.welcomeMessage.replace(':hospital', contact.hospitalName);
            hospitalDAO.findHospitalById(contact.hospitalId).then(function (hs) {
                rongcloudSDK.message.private.publish(contact.hospitalId + '-' + hs[0].customerServiceUid, uid, 'RC:TxtMsg', JSON.stringify({content: message}), message, 0, 1, 'json', function (err, resultText) {
                    if (err) throw err;
                    console.log(resultText);
                });
            });
        }
    )
    ;
}
module.exports = {
    register: function (req, res, next) {
        var user = req.body;
        if (!user.gender) user.gender = 0;
        redis.getAsync(user.mobile).then(function (reply) {
            if (!(reply && reply == user.certCode)) return res.send({ret: 1, message: i18n.get('sms.code.invalid')});
            return patientDAO.findByMobile(user.mobile).then(function (users) {
                if (users.length) return res.send({ret: 1, message: i18n.get('user.mobile.exists')});
                user = _.assign(_.omit(user, ['certCode', 'invitationCode']), {
                    createDate: new Date(),
                    password: md5(req.body.password),
                    name: user.name ? user.name : '患者' + user.mobile.substring(user.mobile.length - 4, user.mobile.length),
                    headPic: 'http://7xoadl.com2.z0.glb.qiniucdn.com/headDefaultMale.png'
                });
                return patientDAO.insert(user).then(function (result) {
                    var token = jwt.sign({
                        name: user.name,
                        mobile: user.mobile,
                        id: result.insertId
                    }, config.app.tokenSecret, {expiresIn: config.app.tokenExpire});
                    redis.set(token, JSON.stringify(user));
                    if (user.invitationCode)
                        acceptInvitation(result.insertId, user.invitationCode, user.mobile, token, res);
                    user.id = result.insertId;
                    rongcloudSDK.user.getToken(result.insertId, user.name, 'http://7xoadl.com2.z0.glb.qiniucdn.com/user58.png', function (err, resultText) {
                        if (err) throw err;
                        user.token = token;
                        user.rongToken = JSON.parse(resultText).token;
                        res.send({
                            ret: 0,
                            data: user
                        });
                    });
                });
            });
        });
        return next();
    },

    login: function (req, res, next) {
        var userName = (req.body && req.body.username) || (req.query && req.query.username);
        var password = (req.body && req.body.password) || (req.query && req.query.password);
        patientDAO.findByMobile(userName).then(function (users) {
            if (!users || !users.length) return res.send({ret: 1, message: i18n.get('member.not.exists')});
            var user = users[0];
            if (user.password != md5(password)) return res.send({
                ret: 1, message: i18n.get('member.password.error')
            });
            var token = jwt.sign({
                id: user.id,
                mobile: user.mobile,
                name: user.name
            }, config.app.tokenSecret, {expiresInMinutes: config.app.tokenExpire});
            redis.set(token, JSON.stringify(user));
            user.token = token;
            rongcloudSDK.user.getToken(user.id, userName, user.headPic, function (err, resultText) {
                user.rongToken = JSON.parse(resultText).token;
                res.send({ret: 0, data: user});
            });
        });
        return next();
    },

    logout: function (req, res, next) {
        var token = req.body.token || req.query.token || req.headers['token'];
        if (!token) return res.send(401, i18n.get('token.not.provided'));
        redis.delAsync(token).then(function () {
            res.send({ret: 0, message: i18n.get('logout.success')});
        });
        return next();
    }

    ,
    resetPwd: function (req, res, next) {
        var that = this;
        var mobile = req.body.username;
        var certCode = req.body.certCode;
        var newPwd = req.body.password;
        redis.getAsync(mobile).then(function (reply) {
            if (!(reply && reply == certCode)) return res.send({ret: 0, message: i18n.get('sms.code.invalid')});
            return patientDAO.update(md5(newPwd), mobile).then(function (result) {
                return patientDAO.findByMobile(mobile);
            }).then(function (users) {
                var token = jwt.sign({
                    name: users[0].name,
                    mobile: users[0].mobile,
                    id: users[0].id
                }, config.app.tokenSecret, {expiresIn: config.app.tokenExpire});
                redis.set(token, JSON.stringify(users[0]));
                res.send({ret: 0, data: {uid: users[0].id, token: token}});
            });
        });
        return next();
    }
}