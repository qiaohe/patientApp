"use strict";
var db = require('../common/db');
var sqlMapping = require('./sqlMapping');
module.exports = {
    insert: function (notification) {
        return db.query(sqlMapping.notification.insert, notification);
    },
    findNotifications: function (uid, page, search) {
        if (search) return db.query('select * from Notification where uid=? and body like \'%' + search + '%\'' + ' order by id desc limit ?, ?', [uid, page.from, page.size]);
        return db.query(sqlMapping.notification.findAll, [uid, page.from, page.size]);
    }
}