"use strict";
var db = require('../common/db');
var sqlMapping = require('./sqlMapping');
var moment = require('moment');
module.exports = {
    searchHospital: function (name, page, lat, lng) {
        if (lat && lng) {
            return db.query('select Hospital.id, name, tag, icon, concat(provId,cityId, districtId) as city,ROUND(6378.138*2*ASIN(SQRT(POW(SIN(( ? * PI()/180-lat*PI()/180)/2),2)+COS( ? *PI()/180)*COS(lat*PI()/180)*POW(SIN(( ? * PI()/180-lng*PI()/180)/2),2)))*1000) AS distance from Hospital where name like \'%' + name + '%\' order by distance limit ' + page.from + ',' + page.size, [lat, lat, lng])
        }
        return db.query('select id, name, tag, icon, concat(provId,cityId, districtId) as city from Hospital where name like \'%' + name + '%\' limit ' + page.from + ',' + page.size);
    },

    searchDoctor: function (name, page) {
        return db.query('select id, name, departmentName, hospitalName, headPic,registrationFee, speciality,jobTitle from Doctor where name like \'%' + name + '%\' limit ' + page.from + ',' + page.size);
    },

    findAll: function (page, lat, lng) {
        if (lat && lng) {
            return db.query('select Hospital.id, name, tag, icon, concat(provId,cityId, districtId) as city,ROUND(6378.138*2*ASIN(SQRT(POW(SIN(( ? * PI()/180-lat*PI()/180)/2),2)+COS( ? *PI()/180)*COS(lat*PI()/180)*POW(SIN(( ? * PI()/180-lng*PI()/180)/2),2)))*1000) AS distance from Hospital order by distance limit ' + page.from + ',' + page.size, [lat, lat, lng])
        }
        return db.query('select Hospital.id, name, tag, icon, concat(provId,cityId, districtId) as city from Hospital limit ' + page.from + ',' + page.size)
    },

    findDepartmentsBy: function (hospitalId) {
        return db.query(sqlMapping.department.findByHospital, hospitalId);
    },

    findDoctorsByDepartment: function (hospitalId, departmentId) {
        return db.query(sqlMapping.doctor.findByDepartment, [hospitalId, departmentId]);
    },

    findHospitalById: function (hospitalId) {
        return db.query(sqlMapping.hospital.findById, hospitalId);
    },

    findHospitalByIdWith: function (hospitalId) {
        return db.query(sqlMapping.hospital.findByIdWith, hospitalId);
    },

    findDoctorByIds: function (ids) {
        var sql = 'select id, name, departmentName,hospitalId, hospitalName, headPic,registrationFee, speciality,jobTitle ' +
            'from Doctor where id in(' + ids + ') order by field(id, ' + ids + ')';
        return db.query(sql);
    },

    findHospitalsByIds: function (ids) {
        var sql = 'select id, name, tag, images, address, icon, introduction, customerServiceUid from Hospital where id in(' + ids + ') order by field(id, ' + ids + ')';
        return db.query(sql);
    },

    findHospitalsByIdsMin: function (ids) {
        var sql = 'select id, name, tag, images, address, icon, customerServiceUid from Hospital where id in(' + ids + ') order by field(id, ' + ids + ')';
        return db.query(sql);
    },

    findDoctorById: function (doctorId) {
        return db.query(sqlMapping.doctor.findById, doctorId);
    },

    findShiftPlans: function (doctorId, start, uid) {
        var end = moment(start).add(1, 'w').format('YYYY-MM-DD');
        return db.query(sqlMapping.doctor.findShitPlans, [+doctorId, start, end, +doctorId, +uid]);
    },

    findTransactionFlowsByUid: function (uid, from, size) {
        return db.query(sqlMapping.transactionFlow.findByUid, [uid, from, size]);
    },
    findCustomerServiceId: function (hospitalId) {
        return db.query(sqlMapping.hospital.findCustomerServiceId, hospitalId);
    }
}
