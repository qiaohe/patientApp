"use strict";
var config = require('../config');
var _ = require('lodash');
var deviceDAO = require('../dao/deviceDAO');
var i18n = require('../i18n/localeMessage');
var pusher = require('../domain/NotificationPusher');
var notificationDAO = require('../dao/notificationDAO');
module.exports = {
    addDevice: function (req, res, next) {
        var device = req.body;
        device.createDate = new Date();
        if (!device.token) return res.send({ret: 0, message: '无效的Token'});
        deviceDAO.findByUid(device.uid).then(function (oldDevice) {
            if (oldDevice.length) device.id = oldDevice[0].id;
            return oldDevice.length ? deviceDAO.update(device) : deviceDAO.insert(device);
        }).then(function (result) {
            return res.send({ret: 0, message: i18n.get('device.add.success')})
        }).catch(function (err) {
            return res.send({ret: 1, message: err.message})
        });
        return next();
    },
    pushNotification: function (req, res, next) {
        pusher.push(req.body, function (err, result) {
            if (err) throw err;
            if (result) res.send({ret: 0, message: i18n.get('notification.send.success')});
        });
        return next();
    },
    getNotifications: function (req, res, next) {
        var uid = req.user.id;
        var search = req.query.q;
        notificationDAO.findNotifications(uid, {
            from: +req.query.from,
            size: +req.query.size
        }, search).then(function (ns) {
            ns && ns.forEach(function (notification) {
                    if (notification.type == 2) {
                        notification.color = '#fa5858';
                        notification.icon = config.qiniu.prefix + 'notification_alarm.png';
                    } else if (notification.type == 1) {
                        notification.color = '#0096ff';
                        notification.icon = config.qiniu.prefix + 'notification_alert.png';
                    } else if (notification.type == 0) {
                        notification.icon = config.qiniu.prefix + 'notification_message.png';
                        notification.color = '#49c810';
                    }
                }
            )
            res.send({ret: 0, data: ns});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }
}
