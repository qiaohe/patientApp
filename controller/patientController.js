"use strict";
var config = require('../config');
var redis = require('../common/redisClient');
var i18n = require('../i18n/localeMessage');
var registrationDAO = require('../dao/registrationDAO');
var hospitalDAO = require('../dao/hospitalDAO');
var patientDAO = require('../dao/patientDAO');
var deviceDAO = require('../dao/deviceDAO');
var medicalDAO = require('../dao/medicalDAO');
var notificationDAO = require('../dao/notificationDAO');
var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var pusher = require('../domain/NotificationPusher');
var util = require('util');
var rongcloudSDK = require('rongcloud-sdk');
rongcloudSDK.init(config.rongcloud.appKey, config.rongcloud.appSecret);
var queue = require('../common/queue');
module.exports = {
    preRegistration: function (req, res, next) {
        var registration = req.body;
        registration.createDate = new Date();
        registration.patientBasicInfoId = req.user.id;
        var orderNo = {};
        patientDAO.findById(req.user.id).then(function (basicInfoIds) {
            registration.patientName = registration.patientName ? registration.patientName : basicInfoIds[0].realName;
            registration.patientMobile = basicInfoIds[0].mobile;
            registration.gender = basicInfoIds[0].gender;
            return hospitalDAO.findDoctorById(registration.doctorId);
        }).then(function (doctors) {
            var doctor = doctors[0];
            registration.departmentId = doctor.departmentId;
            registration.departmentName = doctor.departmentName;
            registration.hospitalId = doctor.hospitalId;
            registration.hospitalName = doctor.hospitalName;
            registration.registrationFee = doctor.registrationFee;
            registration.doctorName = doctor.name;
            registration.doctorJobTitle = doctor.jobTitle;
            registration.doctorJobTitleId = doctor.jobTitleId;
            registration.doctorHeadPic = doctor.headPic;
            registration.status = 0;
            registration.registrationType = 0;
            registration.outPatientType = 0;
            registration.outpatientStatus = 5;
            registration.memberType = 1;
            registration.creator = req.user.id;
            registration.hospitalId = doctor.hospitalId;
            return registrationDAO.findPatientByBasicInfoIdAndHospitalId(req.user.id, registration.hospitalId)
        }).then(function (patients) {
            if (patients.length) {
                registration.patientId = patients[0].id;
            } else {
                return redis.incrAsync('member.no.incr').then(function (memberNo) {
                    return registrationDAO.insertPatient({
                        patientBasicInfoId: req.user.id,
                        hospitalId: registration.hospitalId,
                        memberType: 1,
                        balance: 0.00,
                        memberCardNo: registration.hospitalId + '-1-' + _.padLeft(memberNo, 7, '0'),
                        createDate: new Date()
                    }).then(function (result) {
                        registration.patientId = result.insertId;
                    });
                });
            }
        }).then(function () {
            return registrationDAO.insert(registration);
        }).then(function (result) {
            registration.id = result.insertId;
            return registrationDAO.updateShiftPlan(registration.doctorId, registration.registerDate, registration.shiftPeriod);
        }).then(function () {
            return redis.incrAsync('h:' + registration.hospitalId + ':' + moment().format('YYYYMMDD') + ':0:incr').then(function (reply) {
                orderNo = _.padLeft(registration.hospitalId, 4, '0') + moment().format('YYYYMMDD') + '0' + _.padLeft(reply, 3, '0');
                var o = {
                    orderNo: orderNo,
                    registrationId: registration.id,
                    hospitalId: registration.hospitalId,
                    amount: registration.registrationFee,
                    paidAmount: 0.00,
                    paymentAmount: registration.registrationFee,
                    status: 0,
                    createDate: new Date(),
                    type: 0
                };
                var job = queue.create('orderPayDelayedQueue', {
                    title: '订单延迟支付',
                    orderNo: orderNo
                }).delay(config.app.orderDelayMinutes * 60 * 1000).save(function (err) {
                    if (!err) console.log(job.id);
                });
                return registrationDAO.insertOrder(o);
            });
        }).then(function () {
            return registrationDAO.findShiftPeriodById(registration.hospitalId, registration.shiftPeriod);
        }).then(function (result) {
            deviceDAO.findTokenByUid(req.user.id).then(function (tokens) {
                if (tokens.length && tokens[0]) {
                    var notificationBody = util.format(config.preRegistrationTemplate, registration.patientName + (registration.gender == 0 ? '先生' : '女士'), registration.hospitalName, orderNo);
                    pusher.push({
                        body: notificationBody,
                        title: '生成订单',
                        audience: {registration_id: [tokens[0].token]},
                        patientName: registration.patientName,
                        patientMobile: registration.patientMobile,
                        uid: req.user.id,
                        type: 0,
                        hospitalId: registration.hospitalId
                    }, function (err, result) {
                        if (err) throw err;
                    });
                }
                return res.send({
                    ret: 0,
                    data: {
                        id: registration.id,
                        registerDate: registration.registerDate,
                        hospitalName: registration.hospitalName,
                        departmentName: registration.departmentName,
                        doctorName: registration.doctorName, jobTtile: registration.doctorJobTtile,
                        shiftPeriod: result[0].name,
                        orderNo: orderNo,
                        registrationFee: registration.registrationFee
                    }
                });
            });
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    changePreRegistration: function (req, res, next) {
        var registration = req.body;
        registration.updateDate = new Date();
        registration.patientBasicInfoId = req.user.id;
        registrationDAO.findRegistrationById(registration.id).then(function (rs) {
            var oldRegistration = rs[0];
            registration.patientName = rs[0].patientName;
            registration.patientMobile = rs[0].patientMobile;
            registration.gender = rs[0].gender;
            return registrationDAO.updateShiftPlanDec(rs[0].doctorId, rs[0].registerDate, rs[0].shiftPeriod);
        }).then(function () {
            return hospitalDAO.findDoctorById(registration.doctorId)
        }).then(function (doctors) {
            var doctor = doctors[0];
            registration.departmentId = doctor.departmentId;
            registration.departmentName = doctor.departmentName;
            registration.hospitalId = doctor.hospitalId;
            registration.hospitalName = doctor.hospitalName;
            registration.registrationFee = doctor.registrationFee;
            registration.doctorName = doctor.name;
            registration.doctorJobTitle = doctor.jobTitle;
            registration.doctorJobTitleId = doctor.jobTitleId;
            registration.doctorHeadPic = doctor.headPic;
            registration.status = 3;
            registration.outPatientType = 0;
            registration.outpatientStatus = 5;
            return redis.incrAsync('doctor:' + registration.doctorId + ':d:' + registration.registerDate + ':period:' + registration.shiftPeriod + ':incr').then(function (seq) {
                return redis.getAsync('h:' + doctor.hospitalId + ':p:' + registration.shiftPeriod).then(function (sp) {
                    registration.sequence = sp + seq;
                    return registrationDAO.updateRegistration(registration);
                });
            });
        }).then(function (result) {
            return registrationDAO.updateShiftPlan(registration.doctorId, registration.registerDate, registration.shiftPeriod);
        }).then(function (result) {
            return registrationDAO.findPatientByBasicInfoId(req.user.id);
        }).then(function () {
            return registrationDAO.findShiftPeriodById(registration.hospitalId, registration.shiftPeriod);
        }).then(function (result) {
            deviceDAO.findTokenByUid(req.user.id).then(function (tokens) {
                if (tokens.length && tokens[0]) {
                    var notificationBody = util.format(config.changeRegistrationTemplate, registration.patientName + (registration.gender == 0 ? '先生' : '女士'),
                        registration.hospitalName + registration.departmentName + registration.doctorName, registration.registerDate + ' ' + result[0].name);
                    pusher.push({
                        body: notificationBody,
                        title: '改约成功',
                        audience: {registration_id: [tokens[0].token]},
                        patientName: registration.patientName,
                        patientMobile: registration.patientMobile,
                        uid: req.user.id,
                        type: 0,
                        hospitalId: registration.hospitalId
                    }, function (err, result) {
                        if (err) throw err;
                    });
                }
            });
            return res.send({
                ret: 0,
                data: {
                    registerDate: registration.registerDate,
                    hospitalName: registration.hospitalName,
                    departmentName: registration.departmentName,
                    doctorName: registration.doctorName, jobTtile: registration.doctorJobTtile,
                    shiftPeriod: result[0].name
                }
            });
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    removePreRegistration: function (req, res, next) {
        var rid = req.params.rid;
        var registration = {};
        registrationDAO.findRegistrationById(rid).then(function (rs) {
            registration = rs[0];
            return registrationDAO.updateShiftPlanDec(registration.doctorId, moment(registration.registerDate).format('YYYY-MM-DD'), registration.shiftPeriod)
        }).then(function () {
            return registrationDAO.updateRegistration({id: rid, status: 4, updateDate: new Date()})
        }).then(function () {
            deviceDAO.findTokenByUid(req.user.id).then(function (tokens) {
                if (tokens.length && tokens[0]) {
                    registrationDAO.findShiftPeriodById(registration.hospitalId, registration.shiftPeriod).then(function (result) {
                        var notificationBody = util.format(config.cancelRegistrationTemplate, registration.patientName + (registration.gender == 0 ? '先生' : '女士'),
                            registration.hospitalName + registration.departmentName + registration.doctorName, moment(registration.registerDate).format('YYYY-MM-DD') + ' ' + result[0].name);
                        pusher.push({
                            body: notificationBody,
                            title: '取消预约',
                            audience: {registration_id: [tokens[0].token]},
                            patientName: registration.patientName,
                            patientMobile: registration.patientMobile,
                            uid: req.user.id,
                            type: 0,
                            hospitalId: registration.hospitalId
                        }, function (err, result) {
                            if (err) throw err;
                        });
                    });
                }
            });
            res.send({ret: 0, message: i18n.get('preRegistration.cancel.success')});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    favoriteDoctor: function (req, res, next) {
        var uid = req.user.id;
        var queue = 'uid:' + uid + ':favorite:' + 'doctors';
        var doctorId = req.body.doctorId;
        var result = {uid: uid, doctorId: doctorId, favourited: true};
        redis.zrankAsync(queue, doctorId).then(function (index) {
            if (index == null) return redis.zadd(queue, new Date().getTime(), doctorId);
            result.favourited = false;
            return redis.zrem(queue, doctorId);
        }).then(function () {
            res.send({ret: 0, data: result});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    favoriteHospital: function (req, res, next) {
        var uid = req.user.id;
        var queue = 'uid:' + uid + ':favorite:' + 'hospitals';
        var hospitalId = req.body.hospitalId;
        var result = {uid: uid, hospitalId: hospitalId, favourited: true};
        redis.zrankAsync(queue, hospitalId).then(function (index) {
            if (index == null) return redis.zadd(queue, new Date().getTime(), hospitalId);
            result.favourited = false;
            return redis.zrem(queue, hospitalId);
        }).then(function () {
            return hospitalDAO.findHospitalById(hospitalId);
        }).then(function (cs) {
            if (result.favourited && cs.length) {
                var message = config.app.welcomeMessage.replace(':hospital', cs[0].name);
                rongcloudSDK.message.private.publish(hospitalId + '-' + cs[0].customerServiceUid, uid, 'RC:TxtMsg', JSON.stringify({content: message}), message, 0, 1, 'json', function (err, resultText) {
                    if (err) throw err;
                    res.send({ret: 0, data: result});
                });
            } else {
                res.send({ret: 0, data: result});
            }
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    getFavouritedDoctors: function (req, res, next) {
        var uid = req.user.id;
        var queue = 'uid:' + uid + ':favorite:' + 'doctors';
        redis.zrangeAsync([queue, +req.query.from, +req.query.from + (+req.query.size) - 1]).then(function (ids) {
            if (!ids.length) return [];
            return hospitalDAO.findDoctorByIds(ids.join(','));
        }).then(function (doctors) {
            res.send({ret: 0, data: doctors});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    getFavouritedHospitals: function (req, res, next) {
        var uid = req.user.id;
        var queue = 'uid:' + uid + ':favorite:' + 'hospitals';
        redis.zrangeAsync([queue, +req.query.from, +req.query.from + (+req.query.size) - 1]).then(function (ids) {
            if (!ids.length) return [];
            return hospitalDAO.findHospitalsByIdsMin(ids.join(','));
        }).then(function (hospitals) {
            hospitals && hospitals.forEach(function (h) {
                if (h.customerServiceUid)
                    h.rongCloudUid = h.id + '-' + h.customerServiceUid;
                delete h.customerServiceUid;
            });
            res.send({ret: 0, data: hospitals});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    sendWelcomeMessages: function (req, res, next) {
        var uid = req.user.id;
        var queue = 'uid:' + uid + ':favorite:' + 'hospitals';
        redis.zrangeAsync([queue, 0, 1000]).then(function (ids) {
            if (!ids.length) return [];
            return hospitalDAO.findHospitalsByIdsMin(ids.join(','));
        }).then(function (hospitals) {
            Promise.map(hospitals, function (h, index) {
                var message = config.app.welcomeMessage.replace(':hospital', h.name);
                rongcloudSDK.message.private.publish(h.id + '-' + h.customerServiceUid, uid, 'RC:TxtMsg', JSON.stringify({content: message}), message, 0, 1, 'json', function (err, resultText) {
                    if (err) throw err;
                    res.send({ret: 0, data: result});
                });
            }).then(function () {
                res.send({ret: 0, message: '发送欢迎消息成功'});
            })
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
    },

    getMyPreRegistrations: function (req, res, next) {
        var uid = req.user.id;
        registrationDAO.findRegistrationByUid(uid, {
            from: +req.query.from,
            size: +req.query.size
        }).then(function (registrations) {
            registrations && registrations.forEach(function (registration) {
                registration.status = config.registrationStatus[registration.status];
            });
            res.send({ret: 0, data: registrations});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }

    ,

    getDoctorsWithSameRegistrationId: function (req, res, next) {
        var rid = req.params.rid;
        registrationDAO.findRegistrationById(rid).then(function (registrations) {
            var r = registrations[0];
            return registrationDAO.findDoctorsBy(r.departmentId, r.registrationFee);
        }).then(function (doctors) {
            return res.send({ret: 0, data: doctors});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }
    ,
    getPrePaidCards: function (req, res, next) {
        var uid = req.user.id;
        patientDAO.findByUid(uid).then(function (cards) {
            if (!cards.length) return res.send({ret: 0, data: []});
            cards.forEach(function (card) {
                card.memberType = config.memberType[card.memberType];
                card.source = config.sourceType[card.source];
            });
            res.send({ret: 0, data: cards});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    getCardsByHospitalId: function (req, res, next) {
        var hospitalId = req.params.id;
        patientDAO.findCardByHospital(hospitalId, req.user.id).then(function (cards) {
            if (!cards.length) return res.send({ret: 0, data: {}});
            res.send({ret: 0, data: cards[0]});
        });
        return next();
    },

    getTransactionFlows: function (req, res, next) {
        hospitalDAO.findTransactionFlowsByUid(req.user.id, +req.query.from, +req.query.size).then(function (flows) {
            if (!flows.length) return res.send({ret: 0, data: []});
            flows.forEach(function (flow) {
                flow.type = config.transactionType[flow.type];
                flow.paymentType = config.paymentType[flow.paymentType];
            });
            return res.send({ret: 0, data: flows});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }
    ,
    getMemberInfo: function (req, res, next) {
        var uid = req.user.id;
        patientDAO.findById(uid).then(function (members) {
            rongcloudSDK.user.getToken(members[0].id, members[0].name, members[0].headPic, function (err, resultText) {
                members[0].rongToken = JSON.parse(resultText).token;
                if (members[0].birthday)
                    members[0].birthday = moment(members[0].birthday).format('YYYY-MM-DD');
                res.send({ret: 0, data: members[0]});
            });
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }
    ,
    getMemberInfoBy: function (req, res, next) {
        var mid = req.params.id;
        if (mid.indexOf('-') > -1) {
            hospitalDAO.findHospitalById(mid.split('-')[0]).then(function (hs) {
                res.send({ret: 0, data: hs[0]});
            }).catch(function (err) {
                res.send({ret: 1, message: err.message});
            });
        } else {
            patientDAO.findById(mid).then(function (members) {
                res.send({ret: 0, data: members[0]});
            }).catch(function (err) {
                res.send({ret: 1, message: err.message});
            });
        }
        return next();
    }
    ,
    updateMemberInfo: function (req, res, next) {
        req.body.id = req.user.id;
        patientDAO.updateByUid(req.body).then(function (result) {
            return patientDAO.findById(req.user.id);
        }).then(function (members) {
            if (members[0].birthday)
                members[0].birthday = moment(members[0].birthday).format('YYYY-MM-DD');
            res.send({ret: 0, data: members[0]});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }
    ,
    acceptInvitation: function (req, res, next) {
        var uid = req.user.id;
        var contact = {};
        patientDAO.findContactByInvitationCode(req.body.invitationCode, req.user.mobile).then(function (contacts) {
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
                        patientBasicInfoId: req.user.id,
                        hospitalId: contact.hospitalId,
                        memberType: 1,
                        source: contact.source,
                        balance: 0.00,
                        recommender: contact.businessPeopleId,
                        memberCardNo: contact.hospitalId + '-1-' + _.padLeft(memberNo, 7, '0'),
                        createDate: new Date()
                    });
                });
            } else {
                return res.send({ret: 1, message: i18n.get('invitation.used.success')});
            }
        }).then(function (result) {
            return patientDAO.findByUidAndHospitalId(req.user.id, contact.hospitalId);
        }).then(function (cards) {
            var message = config.app.welcomeMessage.replace(':hospital', contact.hospitalName);
            hospitalDAO.findHospitalById(contact.hospitalId).then(function (hs) {
                rongcloudSDK.message.private.publish(contact.hospitalId + '-' + hs[0].customerServiceUid, uid, 'RC:TxtMsg', JSON.stringify({content: message}), message, 0, 1, 'json', function (err, resultText) {
                    if (err) throw err;
                    console.log(resultText);
                });
            });
            cards[0].source = config.sourceType[cards[0].source];
            return res.send({ret: 0, data: cards[0]});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    changeMobile: function (req, res, next) {
        var uid = req.user.id;
        redis.getAsync(req.body.mobile).then(function (reply) {
            if (!(reply && reply == req.body.certCode)) return res.send({
                ret: 1,
                message: i18n.get('sms.code.invalid')
            });
            return patientDAO.updateByUid({id: uid, mobile: req.body.mobile})
        }).then(function () {
            res.send({ret: 0, message: '修改绑定手机成功'});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    payByMemberCard: function (req, res, next) {
        var payObject = req.body;
        var order = {};
        redis.getAsync(payObject.mobile).then(function (reply) {
            if (!(reply && reply == payObject.certCode)) throw new Error(i18n.get('sms.code.invalid'));
            return patientDAO.updateBalance(payObject.paymentAmount, payObject.memberCardNo);
        }).then(function (result) {
            return medicalDAO.updateOrder({
                orderNo: payObject.orderNo,
                status: 1,
                paymentType: 2,
                paidAmount: payObject.paymentAmount,
                paymentDate: new Date()
            });
        }).then(function () {
            return medicalDAO.findOrdersBy(payObject.orderNo);
        }).then(function (orders) {
            order = orders[0];
            return medicalDAO.insertTransactionFlow({
                amount: payObject.paymentAmount,
                name: config.orderType[order.type],
                transactionNo: moment().format('YYYYMMDDhhmmss') + '-' + order.hospitalId + '-' + order.patientId,
                paymentType: 2,
                orderNo: payObject.orderNo,
                hospitalId: +(payObject.orderNo.substring(0, 4)),
                createDate: new Date(),
                patientBasicInfoId: req.user.id,
                type: 0
            })
        }).then(function (result) {
            registrationDAO.findRegistrationById(order.rid).then(function (registrations) {
                var registration = registrations[0];
                deviceDAO.findTokenByUid(registration.patientBasicInfoId).then(function (tokens) {
                    if (tokens.length && tokens[0]) {
                        var notificationBody = {};
                        if (req.body.data.object.metadata.type == 0) {
                            notificationBody = util.format(config.registrationNotificationTemplate, registration.patientName + (registration.gender == 0 ? '先生' : '女士'),
                                registration.hospitalName + registration.departmentName + registration.doctorName, moment(registration.registerDate).format('YYYY-MM-DD') + ' ' + result[0].name);
                            pusher.push({
                                body: notificationBody,
                                title: '预约挂号成功',
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
                        var template = config.preRegistrationPaymentSuccessTemplate;
                        if (req.body.data.object.metadata.type == 1) template = config.recipePaymentSuccessTemplate;
                        if (req.body.data.object.metadata.type == 2) template = config.preRegistrationPaymentSuccessTemplate;
                        notificationBody = util.format(template, registration.patientName + (registration.gender == 0 ? '先生' : '女士'),
                            registration.hospitalName + registration.departmentName + registration.doctorName, config.orderType[req.body.data.object.metadata.type] + '订单' + orderNo, req.body.data.object.amount);
                        pusher.push({
                            body: notificationBody,
                            title: '订单支付成功',
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
            });
            res.send({ret: 0, message: '支付成功。'});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next()
    },
    changeUnreadStatus: function (req, res, next) {
        var notificationId = req.params.id;
        var status = req.params.status;
        notificationDAO.update({id: notificationId, unread: status}).then(function (result) {
            res.send({ret: 0, message: '更新消息未读已读状态成功'});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    removeNotification: function (req, res, next) {
        notificationDAO.delete(req.params.id).then(function (result) {
            res.send({ret: 0, message: '删除成功'});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }
}