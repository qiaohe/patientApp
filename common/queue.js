var config = require('../config');
var kue = require('kue');
var medicalDAO = require('../dao/medicalDAO');
var pusher = require('../domain/NotificationPusher');
var deviceDAO = require('../dao/deviceDAO');
var util = require('util');
var queue = kue.createQueue({
    redis: {
        port: config.redis.port,
        host: config.redis.host
    }
});
queue.processCallback = function (orderNo, callback) {
    var o = {};
    medicalDAO.findOrdersBy(orderNo).then(function (orders) {
        var o = orders[0];
        if (o.status == 0) {
            var template = o.type == 0 ? config.paymentDelayRegistrationTemplate : config.paymentDelayRecipeTemplate;
            deviceDAO.findTokenByUid(o.patientBasicInfoId).then(function (tokens) {
                if (tokens.length && tokens[0]) {
                    var notificationBody = {};
                    notificationBody = util.format(template, o.patientName + (o.gender == 0 ? '先生' : '女士'),
                        o.hospitalName + '的' + config.orderType[o.type], orderNo);
                    pusher.push({
                        body: notificationBody,
                        title: config.orderType[o.type] + '订单失效',
                        audience: {registration_id: [tokens[0].token]},
                        patientName: o.patientName,
                        patientMobile: o.patientMobile,
                        uid: o.patientBasicInfoId,
                        type: 1,
                        hospitalId: o.hospitalId
                    }, function (err, result) {
                        callback(err, null);
                    });
                }
            });
            medicalDAO.updateOrder({orderNo: orderNo, status: 2}).then(function (result) {
                callback(null, null);
            });
        }
    }).catch(function (err) {
        callback(err, null);
    })
}
module.exports = queue;