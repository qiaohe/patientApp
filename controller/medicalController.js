"use strict";
var config = require('../config');
var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var medicalDAO = require('../dao/medicalDAO');
var util = require('util');
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
            });
            return res.send({ret: 0, data: orders});
        }).catch(function (err) {
            res.send(err);
        });
        return next();
    },

    getOrdersBy: function (req, res, next) {
        var orderNo = req.params.orderNo;
        var order = {};
        medicalDAO.findOrdersBy(orderNo).then(function (orders) {
            order = orders[0];
            if (order.type == 0) return res.send({ret: 0, data: order});
            if (order.type == 1) return medicalDAO.findRecipesByOrderNo(orderNo);
            if (order.type == 2) return medicalDAO.findPrescriptionByOrderNo(orderNo);
        }).then(function (items) {
            order.detail = items;
            order.status = config.orderStatus[order.status];
            order.type = config.orderType[order.type];
            order.paymentType = config.paymentType[order.paymentType];
            return res.send({ret: 0, data: order});
        }).catch(function (err) {
            res.send(err);
        });
        return next();
    }
}