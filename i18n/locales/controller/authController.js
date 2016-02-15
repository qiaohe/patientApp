"use strict";
var md5 = require('md5');
var jwt = require("jsonwebtoken");
var config = require('../config');
var redis = require('../common/redisClient');
var i18n = require('../i18n/localeMessage');
var patientDAO = require('../dao/patientDAO');
var _ = require('lodash');
module.exports = {
    register: function (req, res, next) {
        var user = req.body;
        redis.getAsync(user.mobile).then(function (reply) {
            if (!(reply && reply == user.certCode)) return res.send({ret: 0, message: i18n.get('sms.code.invalid')});
            return patientDAO.findByMobile(user.mobile).then(function (users) {
                if (users.length) return res.send({ret: 0, message: i18n.get('user.mobile.exists')});
                return patientDAO.insert(_.assign(_.omit(user, 'certCode'), {
                    createDate: new Date(),
                    password: md5(req.body.password)
                })).then(function (result) {
                    var token = jwt.sign({
                        name: user.name,
                        mobile: user.mobile,
                        id: result.insertId
                    }, config.app.tokenSecret, {expiresIn: config.app.tokenExpire});
                    redis.set(token, JSON.stringify(user));
                    res.send({ret: 0, data: {uid: result.insertId, token: token}});
                });
            });
        });
        return next();
    },

    login: function (req, res, next) {
        var userName = (req.body && req.body.username) || (req.query && req.query.username);
        var password = (req.body && req.body.password) || (req.query && req.query.password);
        patientDAO.findByMobile(userName).then(function (users) {
            if (!users || !users.length) return res.send({ret: 0, message: i18n.get('member.not.exists')});
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
            res.send({ret: 0, data: user});
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
    },
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