"use strict";
var config = require('../config');
var redis = require('../common/redisClient');
var i18n = require('../i18n/localeMessage');
var hospitalDAO = require('../dao/hospitalDAO');
var medicalDAO = require('../dao/medicalDAO');
var _ = require('lodash');
var moment = require('moment');
var rongcloudSDK = require('rongcloud-sdk');
rongcloudSDK.init(config.rongcloud.appKey, config.rongcloud.appSecret);
module.exports = {
    searchHospital: function (req, res, next) {
        hospitalDAO.searchHospital(req.query.name, {
            from: req.query.from,
            size: req.query.size
        }, req.query.lat, req.query.lng).then(function (hospitals) {
            hospitals && hospitals.forEach(function (hospital) {
                if (hospital.distance) {
                    hospital.distance = hospital.distance < 1000 ? hospital.distance + '米' : (hospital.distance / 1000).toFixed(2) + '公里';
                } else {
                    hospital.distance = '0';
                }
            });
            return res.send({ret: 0, data: hospitals});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    searchDoctor: function (req, res, next) {
        hospitalDAO.searchDoctor(req.query.name, {from: req.query.from, size: req.query.size}).then(function (doctors) {
            if (!doctors) return res.send({ret: 0, data: []});
            return res.send({ret: 0, data: doctors});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    search: function (req, res, next) {
        var data = {};
        hospitalDAO.searchHospital(req.query.name, {from: 0, size: 3}).then(function (hopitals) {
            data.hopitals = hopitals;
            return hospitalDAO.searchDoctor(req.query.name, {from: 0, size: 3});
        }).then(function (doctors) {
            data.doctors = doctors;
            return res.send({ret: 0, data: data});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    getHospitals: function (req, res, next) {
        hospitalDAO.findAll({
            from: req.query.from,
            size: req.query.size
        }, req.query.lat, req.query.lng).then(function (hospitals) {
            hospitals && hospitals.forEach(function (hospital) {
                if (hospital.distance) {
                    hospital.distance = hospital.distance < 1000 ? hospital.distance + '米' : (hospital.distance / 1000).toFixed(2) + '公里';
                } else {
                    hospital.distance = 0;
                }
            });
            return res.send({ret: 0, data: hospitals});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    getDepartments: function (req, res, next) {
        var hospitalId = req.params.hospitalId;
        hospitalDAO.findDepartmentsBy(hospitalId).then(function (departments) {
            return res.send({ret: 0, data: departments});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    getDoctorsByDepartment: function (req, res, next) {
        var departmentId = req.params.departmentId;
        var hospitalId = req.params.hospitalId;
        hospitalDAO.findDoctorsByDepartment(hospitalId, departmentId).then(function (doctors) {
            return res.send({ret: 0, data: doctors});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    getHospitalById: function (req, res, next) {
        var queue = 'uid:' + req.user.id + ':favorite:' + 'hospitals';
        hospitalDAO.findHospitalById(req.params.hospitalId).then(function (hospitals) {
            if (!hospitals.length) return res.send({ret: 0, data: null});
            var hospital = hospitals[0];
            hospital.images = hospital.images ? hospital.images.split(',') : [];
            return redis.zrankAsync(queue, req.params.hospitalId).then(function (index) {
                hospital.favorited = (index != null);
                hospital.customerServiceUid = 'cs';
                res.send({ret: 0, data: hospital});
            });
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    getDoctorById: function (req, res, next) {
        var queue = 'uid:' + req.user.id + ':favorite:' + 'doctors';
        var doctor = {};
        hospitalDAO.findDoctorById(req.params.doctorId).then(function (doctors) {
            doctor = doctors[0];
            doctor.images = doctor.images ? doctor.images.split(',') : [];
            return redis.zrankAsync(queue, req.params.doctorId);
        }).then(function (index) {
            doctor.favorited = (index != null);
            return medicalDAO.findCommentBy(req.params.doctorId, {from: 0, size: 2});
        }).then(function (comments) {
            doctor.comments = comments;
            res.send({ret: 0, data: doctor});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    getShitPlan: function (req, res, next) {
        var doctorId = req.params.doctorId;
        var start = req.query.d;
        hospitalDAO.findShiftPlans(doctorId, start, req.user.id).then(function (plans) {
            var data = _.groupBy(plans, function (plan) {
                moment.locale('zh_CN');
                return moment(plan.day).format('YYYY-MM-DD dddd');
            });
            var result = [];
            for (var key in data) {
                var p = key.split(' ');
                var item = {
                    day: p[0], weekName: p[1], actualQuantity: _.sum(data[key], function (item) {
                        return item.actualQuantity;
                    }), plannedQuantity: _.sum(data[key], function (item) {
                        return item.plannedQuantity;
                    }), periods: data[key]
                };
                item.periods.forEach(function (object) {
                    delete object.day;
                })
                result.push(item);
            }
            res.send({ret: 0, data: result});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }
}