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
            from: req.query.from,
            size: req.query.size
        }).then(function (medicalHistories) {
            if (!medicalHistories.length) return res.send({ret: 0, data: []});
            medicalHistories.forEach(function (history) {
                history.registrationType = history.registrationType == 3 ? '∏¥’Ô' : '≥ı’Ô';
                history.gender = config.gender[history.gender];
            });
            res.send({ret: 0, data: medicalHistories});
        })
    }
}