"use strict";
var db = require('../common/db');
var sqlMapping = require('./sqlMapping');
var moment = require('moment');
module.exports = {
    findMedicalHistories: function (uid, page) {
        return db.query(sqlMapping.medical.findMedicalHistories, [uid, page.from, page.size]);
    },
    findRecipes: function (uid, page) {
        return db.query(sqlMapping.medical.findRecipes, [uid, page.from, page.size]);
    },

    findRecipesByRegistrationId: function (registrationId) {
        return db.query(sqlMapping.medical.findRecipesByRegistrationId, [registrationId]);
    },
    findRecipesByOrderNo: function (orderNo) {
        return db.query(sqlMapping.medical.findRecipesByOrderNo, orderNo);
    },
    findPrescriptionByOrderNo: function (orderNo) {
        return db.query(sqlMapping.medical.findPrescriptionByOrderNo, orderNo);
    },
    findOrders: function (uid, status, page) {
        if (status) return db.query(sqlMapping.medical.findOrdersWithStatus, [uid, status, page.from, page.size]);
        return db.query(sqlMapping.medical.findOrders, [uid, page.from, page.size]);
    },
    findOrdersBy: function (orderNo) {
        return db.query(sqlMapping.medical.findOrdersBy, [orderNo]);
    }
}
