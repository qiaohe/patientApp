'use strict';
var restify = require('restify');
var config = require('./config');
var redis = require('./common/redisClient');
var router = require('./common/router');
var auth = require('./common/auth');
var logger = require('./common/logger');
var server = restify.createServer(config.server);
var schedule = require('node-schedule');
var registrationDAO = require('./dao/registrationDAO');
var deviceDAO = require('./dao/deviceDAO');
var medicalDAO = require('./dao/medicalDAO');
var moment = require('moment');
var util = require('util');
var queue = require('./common/queue');
var pusher = require('./domain/NotificationPusher');
restify.CORS.ALLOW_HEADERS.push('Access-Control-Allow-Origin');
server.use(restify.CORS());
server.opts(/.*/, function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
    res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
    res.send(200);
    return next();
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.dateParser());
server.use(restify.queryParser({
    mapParams: false
}));
server.use(restify.gzipResponse());
server.use(restify.bodyParser());
server.use(logger());
server.use(auth());
router.route(server);
server.on("uncaughtException", function (req, res, route, err) {
    res.send({ret: 1, message: err.message});
});

registrationDAO.findRegistrationByDate(moment().format('YYYY-MM-DD')).then(function (rs) {
    rs.length && rs.forEach(function (r) {
        var d = moment(moment(r.registerDate).format('YYYY-MM-DD') + ' ' + r.shiftPeriodName.split('-')[0], 'YYYY-MM-DD h:m').add(-1, 'h');
        if (!d.isBefore(moment())) {
            var k = schedule.scheduleJob(d.toDate(), function () {
                deviceDAO.findTokenByUid(r.patientBasicInfoId).then(function (tokens) {
                    if (tokens.length && tokens[0]) {
                        var notificationBody = util.format(config.outPatientReminderTemplate, r.patientName + (r.gender == 0 ? '先生' : '女士'),
                            r.hospitalName + r.departmentName + r.doctorName, moment(r.registerDate).format('YYYY-MM-DD') + ' ' + r.shiftPeriodName);
                        pusher.push({
                            body: notificationBody,
                            title: '就诊提醒',
                            audience: {registration_id: [tokens[0].token]},
                            patientName: r.patientName,
                            patientMobile: r.patientMobile,
                            uid: r.patientBasicInfoId,
                            type: 1,
                            hospitalId: rs[0].hospitalId
                        }, function (err, result) {
                            if (err) throw err;
                        });
                    }
                });
            });
        }
    })
});

registrationDAO.findPeriods(1).then(function (periods) {
    periods.forEach(function (item, index) {
        var key = 'h:' + 1 + ':p:' + item.id;
        redis.set(key, String.fromCharCode(65 + index))
    })
});
queue.process('orderPayDelayedQueue', function (job, done) {
    var orderNo = job.data.orderNo;
    medicalDAO.findOrdersBy(orderNo).then(function (orders) {
        var o = orders[0];
        if (o.status == 0) {
            medicalDAO.updateOrder({orderNo: orderNo, status: 2}).then(function (result) {
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
                            if (err) throw err;
                        });
                    }
                });
            });
        }
    }).catch(function (err) {
        if (err) throw err;
        console.log('Job', job.id, 'is done' + job.orderNo);
    });
});
server.listen(config.server.port, config.server.host, function () {
    console.log('%s listening at %s', server.name, server.url);
});
