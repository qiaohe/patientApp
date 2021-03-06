var authController = require('./controller/authController');
var thirdPartyController = require('./controller/thirdPartyController');
var hospitalController = require('./controller/hospitalController');
var patientController = require('./controller/patientController');
var deviceController = require('./controller/deviceController');
var medicalController = require('./controller/medicalController');
module.exports = [
    {
        method: "post",
        path: "/api/register",
        handler: authController.register
    },
    {
        method: "post",
        path: "/api/login",
        handler: authController.login
    },
    {
        method: "post",
        path: "/api/logout",
        handler: authController.logout,
        secured: "user"
    },
    {
        method: "post",
        path: "/api/resetPwd",
        handler: authController.resetPwd
    },
    {
        method: "get",
        path: "/api/sms/:mobile",
        handler: thirdPartyController.sendSMS
    },
    {
        method: "get",
        path: "/api/hospitals/search",
        handler: hospitalController.searchHospital,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/hospitals",
        handler: hospitalController.getHospitals,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/doctors/search",
        handler: hospitalController.searchDoctor,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/search",
        handler: hospitalController.search,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/hospitals/:hospitalId/departments",
        handler: hospitalController.getDepartments,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/hospitals/:hospitalId/departments/:departmentId/doctors",
        handler: hospitalController.getDoctorsByDepartment,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/hospitals/:hospitalId",
        handler: hospitalController.getHospitalById,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/doctors/:doctorId",
        handler: hospitalController.getDoctorById,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/ad/images",
        handler: thirdPartyController.getAdImages,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/doctors/:doctorId/shiftPlans",
        handler: hospitalController.getShitPlan,
        secured: "user"
    },
    {
        method: "post",
        path: "/api/preRegistration",
        handler: patientController.preRegistration,
        secured: "user"
    },
    {
        method: "put",
        path: "/api/preRegistration",
        handler: patientController.changePreRegistration,
        secured: "user"
    },
    {
        method: "del",
        path: "/api/preRegistration/:rid",
        handler: patientController.removePreRegistration,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/preRegistration",
        handler: patientController.getMyPreRegistrations,
        secured: "user"
    },
    {
        method: "post",
        path: "/api/favorites/doctors",
        handler: patientController.favoriteDoctor,
        secured: "user"
    },
    {
        method: "post",
        path: "/api/favorites/hospitals",
        handler: patientController.favoriteHospital,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/favorites/doctors",
        handler: patientController.getFavouritedDoctors,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/favorites/hospitals",
        handler: patientController.getFavouritedHospitals,
        secured: "user"
    },

    {
        method: "get",
        path: "/api/preRegistration/:rid/doctors",
        handler: patientController.getDoctorsWithSameRegistrationId,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/prePaidCards",
        handler: patientController.getPrePaidCards,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/transactionFlows",
        handler: patientController.getTransactionFlows,
        secured: "user"
    },
    {
        method: "post",
        path: "/api/acceptInvitation",
        handler: patientController.acceptInvitation,
        secured: "user"
    },

    {
        method: "get",
        path: "/api/me",
        handler: patientController.getMemberInfo,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/members/:id",
        handler: patientController.getMemberInfoBy,
        secured: "user"
    },
    {
        method: "get",
        path: "/api/hospitals/:id/cards",
        handler: patientController.getCardsByHospitalId,
        secured: 'user'
    },
    {
        method: "put",
        path: "/api/me",
        handler: patientController.updateMemberInfo,
        secured: "user"
    },
    {
        method: 'get',
        path: '/api/qiniu/token',
        handler: thirdPartyController.getQiniuToken
    },
    {
        method: "post",
        path: "/api/devices",
        handler: deviceController.addDevice,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/notifications",
        handler: deviceController.pushNotification,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/notifications",
        handler: deviceController.getNotifications,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/welcomeMessages",
        handler: patientController.sendWelcomeMessages,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/changeMobile",
        handler: patientController.changeMobile,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/medicalHistories",
        handler: medicalController.getMedicalHistories,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/recipes",
        handler: medicalController.getRecipes,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/orders",
        handler: medicalController.getOrders,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/orders/:orderNo",
        handler: medicalController.getOrdersBy,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/doctors/:id/comments",
        handler: medicalController.getComments,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/orders/:orderNo/comments",
        handler: medicalController.addComment,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/paymentCharge/orderNo/:orderNo/paymentType/:paymentType",
        handler: thirdPartyController.getPaymentCharge,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/payment/callback",
        handler: thirdPartyController.handlePaymentCallback
    },
    {
        method: "post",
        path: "/api/payment/card",
        handler: patientController.payByMemberCard,
        secured: 'user'
    },
    {
        method: "post",
        path: "/api/notifications/:id/unread/:status",
        handler: patientController.changeUnreadStatus,
        secured: 'user'
    },
    {
        method: "del",
        path: "/api/notifications/:id",
        handler: patientController.removeNotification,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/rongToken",
        handler: authController.getRongToken,
        secured: 'user'
    },
    {
        method: "get",
        path: "/api/ttl",
        handler: deviceController.getCurrentDate
    },
    {
        method: "get",
        path: "/api/versionInfo",
        handler: thirdPartyController.getVersionInfo
    }
];