"use strict";
var config = require('../config');
var _ = require('lodash');
var patientDAO = require('../dao/patientDAO');
var Promise = require('bluebird');
var medicalDAO = require('../dao/medicalDAO');
module.exports = {
    getMedicalHistories: function (req, res, next) {
        var uid = req.user.id;
        medicalDAO.findMedicalHistories(uid, {
            from: +req.query.from,
            size: +req.query.size
        }).then(function (medicalHistories) {
            if (!medicalHistories.length) return res.send({ret: 0, data: []});
            medicalHistories.forEach(function (history) {
                history.registrationType = history.registrationType == 3 ? '复诊' : '初诊';
                history.gender = config.gender[history.gender];
            });
            res.send({ret: 0, data: medicalHistories});
        }).catch(function (err) {
            res.send(err);
        });
        return next();
    },
    getRecipes: function (req, res, next) {
        var uid = req.user.id;
        medicalDAO.findRecipes(101, {
            from: +req.query.from,
            size: +req.query.size
        }).then(function (recipes) {
            if (!recipes.length) return res.send({ret: 0, data: []});
            Promise.map(recipes, function (recipe) {
                return medicalDAO.findRecipesByRegistrationId(recipe.registrationId).then(function (drugs) {
                    recipe.drugs = drugs;
                })
            }).then(function () {
                res.send({ret: 0, data: recipes});
            })
        }).catch(function (err) {
            res.send(err);
        });
        return next();
    },
    getOrders: function (req, res, next) {
        var uid = req.user.id;
        var status = req.query.status;
        medicalDAO.findOrders(105, status, {
            from: +req.query.from,
            size: +req.query.size
        }).then(function (orders) {
            if (!orders.length) return res.send({ret: 0, data: []});
            orders.forEach(function (order) {
                order.status = config.orderStatus[order.status];
                order.type = config.orderType[order.type];
            })
            return res.send({ret: 0, data: orders});
        }).catch(function (err) {
            res.send(err);
        });
        return next();
    },

    getOrdersBy: function (req, res, next) {
        var orderNo = req.params.orderNo;
        medicalDAO.findOrdersBy(orderNo).then(function (order) {
            order.status = config.orderStatus[order.status];
            order.type = config.orderType[order.type];
            res.send({ret: 0, data: order});
        });
        return next();
    },
    addComment: function (req, res, next) {
        var orderNo = req.params.orderNo;
        var uid = req.user.id;
        var comment = req.body;
        medicalDAO.findOrdersBy(orderNo).then(function (orders) {
            if (!orders.length) return res.send({ret: 0, message: '订单不存在。'});
            if (orders[0].commented) return res.send({ret: 0, message: '订单已评价。'});
            comment.doctorId = orders[0].doctorId;
            comment.hospitalId = orders[0].hospitalId;
            return patientDAO.findById(uid);
        }).then(function (patients) {
            comment = _.assign(comment, {
                createDate: new Date(),
                orderNo: orderNo,
                uid: uid,
                headPic: patients[0].headPic,
                nickName: patients[0].name
            });
            return medicalDAO.insertComment(comment);
        }).then(function (result) {
            return medicalDAO.updateCommentCount(comment.doctorId);
        }).then(function () {
            return medicalDAO.updateCommentStatus(comment.orderNo);
        }).then(function () {
            res.send({ret: 0, message: '评论成功。'})
        }).catch(function (err) {
            res.send(err);
        });
        return next();
    },

    getComments: function (req, res, next) {
        var doctorId = req.params.id;
        medicalDAO.findCommentBy(doctorId, {
            from: +req.query.from,
            size: +req.query.size
        }).then(function (comments) {
            res.send({ret: 0, data: comments});
        }).catch(function (err) {
            res.send(err);
        });
        return next();
    }
}