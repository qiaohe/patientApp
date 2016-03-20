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
        updatePatientBalance: 'update Patient set balance = balance - ? where memberCardNo=?',
        updatePerformance: 'update Performance set actualCount=actualCount+1 where businessPeopleId=? and yearMonth=?',
        findContactByInvitationCode: 'select ic.id, ic.mobile, ic.name, ic.source,iv.businessPeopleId, iv.contactId, e.hospitalId, h.name as hospitalName from Invitation iv, InvitationContact ic, Employee e, Hospital h where iv.contactId = ic.id and e.id = ic.businessPeopleId and h.id = e.hospitalId and iv.invitationCode=? and ic.mobile=?',
        findCardByHospital: 'select p.memberCardNo, p.memberType, pf.mobile, p.balance from Patient p left JOIN PatientBasicInfo pf on p.patientBasicInfoId = pf.id  where hospitalId=? and patientBasicInfoId=?'
    },
    hospital: {
        findByNameLike: 'select id, name, tag from Hospital where name like ?',
        findById: 'select id, name, tag, images, address, icon, introduction, customerServiceUid, contactMobile, contact,telephone, trafficRoute from Hospital where id = ?',
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
        findById: 'select id, name, departmentName,hospitalId, hospitalName, headPic,registrationFee, speciality,introduction, images,jobTitle, departmentId, jobTitleId,commentCount from Doctor where id =?',
        findShitPlans: 'select p.`name` as period, `day`, actualQuantity, plannedQuantity, p.id as periodId from ShiftPlan sp, ShiftPeriod p where sp.shiftPeriod = p.id and sp.doctorId = ? and sp.day>? and sp.day<=? and sp.actualQuantity < sp.plannedQuantity and sp.plannedQuantity > 0 and p.id not in (select shiftPeriod from Registration where doctorId=? and registerDate=sp.`day` and patientBasicInfoId=?) order by sp.day, sp.shiftPeriod',
        findBy: 'select id, name, departmentName,hospitalId, hospitalName, headPic,registrationFee, speciality,jobTitle from Doctor where departmentId=? and registrationFee=?'
    },

    registration: {
        insert: 'insert Registration set ?',
        updateShiftPlan: 'update ShiftPlan set actualQuantity = actualQuantity + 1 where doctorId = ? and day =? and shiftPeriod = ?',
        updateShiftPlanDec: 'update ShiftPlan set actualQuantity = actualQuantity - 1 where doctorId = ? and day =? and shiftPeriod = ?',
        findShiftPeriodById: 'select * from ShiftPeriod where hospitalId = ? and id =?',
        findRegistrationsByUid: 'select r.id, r.doctorId, doctorName, doctorHeadPic,registrationFee, departmentName,doctorJobTitle, hospitalName, patientName,concat(DATE_FORMAT(r.registerDate, \'%Y-%m-%d \') , s.`name`) as shiftPeriod, r.status, r.sequence  from Registration r, ShiftPeriod s where r.shiftPeriod = s.id and patientBasicInfoId = ? and r.sequence is not NULL order by r.id desc limit ?,?',
        findById: 'select * from Registration where id =?',
        updateRegistration: "update Registration set ? where id = ?",
        findPeriods: 'select id from ShiftPeriod where hospitalId = ? order by name',
        insertOrder: 'insert MedicalOrder set ?',
        findRegistrationsByDate: 'select r.*, sp.`name` as shiftPeriodName from Registration r, ShiftPeriod sp where sp.id =r.shiftPeriod AND r.registerDate >= ? and r.outpatientStatus=5'
    },

    sysConfig: {
        findByKey: 'select * from SysConfig where `key`=?'
    },
    transactionFlow: {
        findByUid: 'select tf.amount, tf.transactionNo, tf.name, tf.paymentType,tf.type,tf.createDate, h.`name` as hospitalName, h.icon as hospitalIcon from TransactionFlow tf, Hospital h WHERE tf.hospitalId = h.id and tf.patientBasicInfoId=? order by tf.createDate desc limit ?, ?'
    },
    device: {
        insert: 'insert Device set ?',
        findByToken: 'select * from Device where token = ?',
        update: 'update Device set ? where id =?',
        findTokenByUid: 'select token from Device where uid=?',
        findByUid: 'select * from Device where uid=?'
    },
    notification: {
        insert: 'insert Notification set ?',
        findAll: 'select * from Notification where uid=? order by id desc limit ?, ?'
    },
    medical: {
        findMedicalHistories: 'select m.id,m.createDate, m.chiefComplain, m.resumptiveDiagnosis, r.departmentName, r.hospitalName, r.hospitalId, r.doctorName, r.gender,p.birthday , concat(DATE_FORMAT(r.registerDate, \'%Y-%m-%d \') , s.`name`) as shiftPeriod, r.registrationType, r.patientName from MedicalHistory m left join Registration r on r.id = m.registrationId left JOIN ShiftPeriod s on s.id= r.shiftPeriod left join PatientBasicInfo p on p.id= r.patientBasicInfoId where r.patientBasicInfoId=? order by m.createDate desc limit ?, ?',
        findRecipes: 'select r.id as registrationId, h.resumptiveDiagnosis, h.createDate, r.doctorName, r.departmentName, r.hospitalName,r.hospitalId, concat(DATE_FORMAT(r.registerDate, \'%Y-%m-%d \') , s.`name`) as shiftPeriod from MedicalHistory h left JOIN Registration r on h.registrationId = r.id left JOIN ShiftPeriod s on s.id= r.shiftPeriod  where r.patientBasicInfoId=? order by h.createDate desc limit ?, ?',
        findRecipesByRegistrationId: 'select id, name, specification, quantity, unit, `usage`,dosage, dosageForm, factor from Recipe where registrationId = ?',
        findOrders: 'select m.orderNo,m.commented, m.type, m.createDate, r.doctorName, r.departmentName, r.hospitalName,r.hospitalId, h.icon as hospitalIcon, m.`status`, m.amount,concat(DATE_FORMAT(r.registerDate, \'%Y-%m-%d \') , s.`name`) as shiftPeriod from MedicalOrder m LEFT JOIN Registration r on r.id = m.registrationId left join ShiftPeriod s on s.id = r.shiftPeriod left join Hospital h on h.id=r.hospitalId where r.patientBasicInfoId=? order by m.createDate desc limit ?,?',
        findOrdersWithStatus: 'select m.orderNo, m.commented, m.type, m.createDate, r.doctorName, r.departmentName, r.hospitalName,r.hospitalId, h.icon as hospitalIcon, m.`status`, m.amount,concat(DATE_FORMAT(r.registerDate, \'%Y-%m-%d \') , s.`name`) as shiftPeriod from MedicalOrder m LEFT JOIN Registration r on r.id = m.registrationId left join ShiftPeriod s on s.id = r.shiftPeriod left join Hospital h on h.id=r.hospitalId where r.patientBasicInfoId=? and m.status=? order by m.createDate desc limit ?,?',
        findOrdersBy: 'select m.orderNo,m.type, m.commented, m.`status`, r.patientId, m.paymentAmount, m.amount, m.createDate, m.hospitalId,m.registrationId, r.doctorId, r.doctorName, r.departmentName, r.hospitalName,r.hospitalId, r.patientName, concat(DATE_FORMAT(r.registerDate, \'%Y-%m-%d \') , s.`name`) as shiftPeriod, m.paymentType, r.id as rid, r.patientBasicInfoId,r.gender from MedicalOrder m left join Registration r on r.id = m.registrationId left JOIN ShiftPeriod s on s.id=r.shiftPeriod where m.orderNo =?',
        findCommentsByDoctor: 'select uid, nickName, headPic, createDate, medicalSkill, attitude, content from `Comment` where doctorId=? order by createDate desc limit ?, ?',
        insertComment: 'insert Comment set ?',
        insertTransactionFlow: 'insert TransactionFlow set ?',
        updateCommentCount: 'update Doctor set commentCount=commentCount+1 where id=?',
        updateCommentStatus: 'update MedicalOrder set commented=1 where orderNo=?',
        findRecipesByOrderNo: 'select name, quantity, unit, totalPrice from Recipe where orderNo=?',
        findPrescriptionByOrderNo: 'select `name`, quantity, totalPrice, unit from Prescription where orderNo=?',
        updateOrder: 'update MedicalOrder set ? where orderNo=?'
    }
}
