module.exports = {
    patient: {
        insert: 'insert PatientBasicInfo set ?',
        findAll: 'select * from PatientBasicInfo',
        findByMobile: 'select * from PatientBasicInfo where mobile=?',
        findById: 'select * from PatientBasicInfo where id =?',
        updatePwd: 'update PatientBasicInfo set password = ? where mobile = ?',
        findByUid: 'select p.hospitalId, p.memberCardNo, p.memberType, p.balance, e.name as recommender, p.source, h.`name`,h.icon from Patient p INNER JOIN Hospital h on p.hospitalId=h.id LEFT JOIN Employee e on e.id = p.recommender where  p.patientBasicInfoId = ?',
        findByUidAndHospitalId: 'select p.hospitalId, p.memberCardNo, p.memberType, p.balance, e.name as recommender, p.source, h.`name`,h.icon from Patient p INNER JOIN Hospital h on p.hospitalId=h.id LEFT JOIN Employee e on e.id = p.recommender where  p.patientBasicInfoId = ? and p.hospitalId=?',
        updateById: 'update PatientBasicInfo set ? where id = ?',
        updateContact: 'update InvitationContact set ? where id =?',
        updatePerformance: 'update Performance set actualCount=actualCount+1 where businessPeopleId=? and yearMonth=?',
        findContactByInvitationCode: 'select ic.id, ic.mobile, ic.name, ic.source,iv.businessPeopleId, iv.contactId, e.hospitalId, h.name as hospitalName from Invitation iv, InvitationContact ic, Employee e, Hospital h where iv.contactId = ic.id and e.id = ic.businessPeopleId and h.id = e.hospitalId and iv.invitationCode=? and ic.mobile=?'
    },
    hospital: {
        findByNameLike: 'select id, name, tag from Hospital where name like ?',
        findById: 'select id, name, tag, images, address, icon, introduction, customerServiceUid from Hospital where id = ?',
        findByIdWith: 'select id, name, icon as headPic from Hospital where id=?',
        insertPatient: 'insert Patient set ?',
        findPatientByBasicInfoId: 'select * from Patient where patientBasicInfoId = ?',
        findCustomerServiceId: 'select customerServiceUid from Hospital where id =?',
        findPatientByBasicInfoIdAndHospitalId: 'select * from Patient where patientBasicInfoId = ? and hospitalId= ?'
    },

    department: {
        findByHospital: 'select id, name, introduction from Department where hospitalId = ?'
    },

    doctor: {
        findByDepartment: 'select id, name, departmentName, hospitalName, headPic,registrationFee, speciality,jobTitle from Doctor where hospitalId = ?  and departmentId = ?',
        findById: 'select id, name, departmentName,hospitalId, hospitalName, headPic,registrationFee, speciality,introduction, images,jobTitle, departmentId, jobTitleId from Doctor where id =?',
        findShitPlans: 'select p.`name` as period, `day`, actualQuantity, plannedQuantity, p.id as periodId from ShiftPlan sp, ShiftPeriod p where sp.shiftPeriod = p.id and sp.doctorId = ? and sp.day>? and sp.day<=? and sp.actualQuantity < sp.plannedQuantity and sp.plannedQuantity > 0 order by sp.day, sp.shiftPeriod',
        findBy: 'select id, name, departmentName,hospitalId, hospitalName, headPic,registrationFee, speciality,jobTitle from Doctor where departmentId=? and registrationFee=?'
    },

    registration: {
        insert: 'insert Registration set ?',
        updateShiftPlan: 'update ShiftPlan set actualQuantity = actualQuantity + 1 where doctorId = ? and day =? and shiftPeriod = ?',
        updateShiftPlanDec: 'update ShiftPlan set actualQuantity = actualQuantity - 1 where doctorId = ? and day =? and shiftPeriod = ?',
        findShiftPeriodById: 'select * from ShiftPeriod where hospitalId = ? and id =?',
        findRegistrationsByUid: 'select r.id, r.doctorId, doctorName, doctorHeadPic,registrationFee, departmentName,doctorJobTitle, hospitalName, patientName,concat(DATE_FORMAT(r.registerDate, \'%Y-%m-%d \') , s.`name`) as shiftPeriod, orderNo, r.status  from Registration r, ShiftPeriod s where r.shiftPeriod = s.id and paymentType =1 and patientBasicInfoId = ? order by r.id desc limit ?,?',
        findById: 'select * from Registration where id =?',
        updateRegistration: "update Registration set ? where id = ?",
        findPeriods: 'select id from ShiftPeriod where hospitalId = ? order by name',
        findRegistrationsByDate: 'select r.*, sp.`name` as shiftPeriodName from Registration r, ShiftPeriod sp where sp.id =r.shiftPeriod AND r.registerDate >= ? and r.outpatientStatus=5'
    },

    sysConfig: {
        findByKey: 'select * from SysConfig where `key`=?'
    },
    transactionFlow: {
        findByUid: 'select tf.amount, tf.type,tf.createDate, h.`name` as hospitalName, h.icon as hospitalIcon from TransactionFlow tf, Hospital h WHERE tf.hospitalId = h.id and tf.patientBasicInfoId=? order by tf.createDate desc limit ?, ?'
    },
    device: {
        insert: 'insert Device set ?',
        findByToken: 'select * from Device where token = ?',
        update: 'update Device set ? where id =?',
        findTokenByUid: 'select token from Device where uid=?',
        findByUid: 'select * from Device where uid=?'
    },
    notification: {
        insert: 'insert notification set ?',
        findAll: 'select * from Notification where uid=? order by id desc limit ?, ?'
    },
    medical: {
        findMedicalHistories: 'select m.id, m.chiefComplain, m.resumptiveDiagnosis, r.departmentName, r.hospitalName, r.doctorName, r.gender,p.birthday , concat(DATE_FORMAT(r.registerDate, \'%Y-%m-%d \') , s.`name`) as shiftPeriod, r.registrationType from MedicalHistory m left join Registration r on r.id = m.registrationId left JOIN ShiftPeriod s on s.id= r.shiftPeriod left join PatientBasicInfo p on p.id= r.patientBasicInfoId where r.patientBasicInfoId=? limit ?, ?'
    }
}
