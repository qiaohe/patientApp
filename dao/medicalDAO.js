"use strict";
var db = require('../common/db');
var sqlMapping = require('./sqlMapping');
var moment = require('moment');
module.exports = {
    findMedicalHistories: function (uid, page) {
        return db.query(sqlMapping.medical.findMedicalHistories, [uid, page.from, page.size]);
    }
}
