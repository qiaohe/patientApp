'use strict';

module.exports = {
    server: {
        name: '云诊宝APP',
        version: '0.0.1',
        host: '121.42.171.213',
        port: 3001
    },
    db: {
        host: '121.42.171.213',
        port: '3306',
        user: 'root',
        password: 'heqiao75518',
        debug: false,
        multipleStatements: true,
        dateStrings: true,
        database: 'medicalDB'
    },
    app: {
        locale: 'zh_CN',
        tokenSecret: '1~a',
        tokenExpire: 86400,
        dateStrings:'true',
        welcomeMessage: '欢迎来到:hospital！'
    },
    redis: {
        host: '127.0.0.1',
        port: 6379
    },
    sms: {
        providerUrl: 'https://sms.yunpian.com/v1/sms/send.json',
        template: '【云诊宝】您的短信验证码是:code,在30分钟内输入有效。',
        expireTime: 1800000,
        apikey: '410ac09436843c0270f513a0d84802cc'
    },
    qiniu: {
        ak: "0d02DpW7tBPiN3TuZYV7WcxmN1C9aCiNZeW9fp5W",
        sk: "7zD3aC6xpvp_DfDZ0LJhjMq6n6nB6UVDbl37C5FZ",
        prefix: "http://7xrtp2.com2.z0.glb.qiniucdn.com/"
    },
    jpush: {
        masterSecret: "746f077c505f3195a4abf5a3",
        appKey: "21bd61c93392c3e2d1e48d4c"
    },
    rongcloud: {
        appKey: 'z3v5yqkbvtei0',
        appSecret: 'BDcA3iRjgFp'
    },
    ping: {
        appId: 'app_yf1SyDmT0Wj1eznT',
        appSecret: 'sk_test_8WDC8S5W9W5GSybrT4fvfr5S'
    },
    registrationType: ["线上预约", "线下预约", "现场挂号", "复诊预约", "转诊挂号", "现场加号", "线上加号", "销售预约", "销售加号"],
    registrationStatus: ["预约成功", "预约未支付", "预约失败", "预约变更", "预约取消"],
    transactionType: ["付款交易", '充值交易'],
    memberType: ['初级用户', '银卡用户', '金卡用户', '学校用户', '企业用户', '儿童用户'],
    sourceType: ['陌生拜访', '市场活动', '门诊转化', '内部转移', '特殊推荐', '广告推广'],
    gender: ['男', '女'],
    outPatientType: ["初诊", "复诊", "院内转诊", "跨院转诊", "远程会诊", "远程初诊", "远程复诊"],
    outpatientStatus: ['未到', '结束', '已转诊', '已预约复诊', '转诊中', '待诊中', '已取消'],
    cashbackType: ['赠劵', '优惠券', '免单'],
    paymentType: ['支付宝', '微信支付', '会员卡支付', '银行卡', '储值卡', '现金', '代付'],
    consumptionLevel: ['<1000', '1000~3000', '3000~5000', '5000~10000', '>10000'],
    preRegistrationTemplate:'【%s】 ，您预约挂号成功，请在30分钟内完成支付，逾时自动取消',
    registrationNotificationTemplate: '【%s】，您已预约【%s医生】门诊，就诊时间%s。请提前半小时到分诊台，进行取号确认。',
    changeRegistrationTemplate: '【%s】，您已改约【%s医生】门诊，就诊时间%s。请提前半小时到分诊台，进行取号确认。',
    cancelRegistrationTemplate: '【%s】，您已取消预约【%s医生】%s门诊，如有需要请再次预约，谢谢！',
    outPatientReminderTemplate: '【%s】，您预约的【%s医生】门诊，就诊时间%s，现在离就诊时间还剩1小时，请提前到分诊台，进行确认。',
    outPatientCallTemplate: '【%s】，请您到%s诊室就诊，接诊医生：【%s】。',
    notAvailableTemplate: '【%s】，很抱歉，您预约的【%s医生】门诊，就诊时间%s已过，请及时与前台联系，谢谢！',
    returnRegistrationTemplte: '【%s】，很抱歉，您预约的【%s医生】门诊，就诊时间%s已过，请及时与前台联系，谢谢！',
    orderStatus: ['未支付', '已支付', '已取消', '完成'],
    orderType: ["挂号费", "药费", "诊疗费"]
};

