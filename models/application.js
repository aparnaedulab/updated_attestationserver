"use strict";

module.exports=function(sequelize , DataTypes){
 var Application   = sequelize.define("Application",{
    tracker: DataTypes.ENUM('preapply','apply','verification','verified','done','signed','print_signed'),
    status: {
                type: DataTypes.ENUM('new','accept', 'reject','repeat'),
                allowNull: false
                //defaultValue: 'accept'
      },

    total_amount: {
                 type: DataTypes.DECIMAL(12, 2),
                 defaultValue: 0.00
      },
    approved_by: DataTypes.STRING(100),
    verified_by: DataTypes.STRING(100),
    notes : DataTypes.TEXT,
    transcriptRequiredMail : DataTypes.BOOLEAN(),
    collegeConfirmation : DataTypes.BOOLEAN(),
    source_from  :  DataTypes.STRING(255),
    inward  :  DataTypes.STRING(255),
    outward  :  DataTypes.STRING(255),
    deliveryType : DataTypes.STRING(255),
    Pickupdate:DataTypes.DATE,
    signed_date:DataTypes.DATE,
    verified_date:DataTypes.DATE,
    print_date:DataTypes.DATE,
    courier_date:DataTypes.DATE,
    regenerate_reason : DataTypes.STRING(255),
    servicetype : DataTypes.STRING(255),
    print_by : DataTypes.STRING(255),
    print_signedstatus :{
      type: DataTypes.STRING(100),
    },
  });

  Application.getTotalUserApplications = function(filters,limit,offset) {
    var where_student_name = '',
     // where_student_surname = '',
      where_application_id = '',
      where_application_email = '',
      where_application_date = '';
   var limitOffset = '';
   if (filters.length > 0) {
    filters.forEach(function(filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
        } else if (filter.name == "surname") {
          where_student_surname = " AND u.surname LIKE '%" + filter.value + "%' ";
        } else if (filter.name == "application_id") {
          where_application_id = " AND a.id = " + filter.value + " ";
        } else if (filter.name == "email") {
          where_application_email = " AND u.email like '%" + filter.value  + "%' ";
        } else if(filter.name == 'application_year'){
          where_application_date = filter.value;
        }
    });
}
  if (limit != null && offset != null) {
    limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
  }
  var query = "SELECT a.id,u.email,CONCAT(u.name,' ',u.surname) as name,a.tracker,a.status,a.user_id,a.created_at,";
  query += " app.applying_for, app.educationalDetails, app.gradToPer, app.instructionalField, app.curriculum ,app.CompetencyLetter, app.affiliation, a.notes,app.LetterforNameChange,";
  query += " a.collegeConfirmation, a.transcriptRequiredMail,u.current_location";
  query += " FROM Application as a JOIN User as u on u.id = a.user_id ";
  query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
  query += " WHERE 1 = 1";
  query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
  query += where_application_id;
  query += where_application_email;
  query += where_student_name;
  query += where_application_date;
  query += " ORDER BY a.created_at desc ";
  query += limitOffset;
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};


Application.getVerifiedUserApplications = function(value) {
  if(value == 'undefined' || value ==undefined){
    var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id, a.approved_by,";
    query += " app.educationalDetails, app.gradToPer, app.instructionalField, app.curriculum,app.CompetencyLetter,app.affiliation,app.LetterforNameChange,";
    query +="  app.applying_for ,a.created_at as application_date, a.notes, a.collegeConfirmation,u.current_location";
    query += " FROM Application as a JOIN User as u on u.id = a.user_id ";
    query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
    query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
    query += " where a.tracker = 'verified' ORDER BY u.updated_at desc";
   
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }else if(value != 'undefined' || value != undefined){
    var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id, a.approved_by,";
    query += " app.educationalDetails, app.gradToPer, app.instructionalField, app.curriculum,app.CompetencyLetter,app.affiliation,app.LetterforNameChange,";
    query +="  app.applying_for ,a.created_at as application_date, a.notes, a.collegeConfirmation,u.current_location,i.type";
    query += " FROM Application as a JOIN User as u on u.id = a.user_id ";
    query += " left join Institution_details as i on a.id = i.app_id  ";
    query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
    query += " where a.tracker = 'verified' and  i.type LIKE '%" + value + "%'  ORDER BY u.updated_at desc";
    query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

};


Application.getPurposeWiseVerified = function(purposewise) {
  var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id, a.approved_by,";
  query += " app.educationalDetails, app.gradToPer, app.instructionalField, app.curriculum,app.CompetencyLetter,app.affiliation,";
  query +=" app.applying_for ,a.created_at as application_date, a.notes, a.collegeConfirmation,u.current_location,i.type";
  query += " FROM Application as a JOIN User as u on u.id = a.user_id ";
  query += " left join Institution_details as i on a.id = i.app_id  ";
  query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
  query += " where a.tracker = 'verified' and  i.type LIKE '%" + purposewise + "%' ORDER BY u.updated_at desc";
  query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

Application.getSignedUserApplications = function(value) {
  if(value == 'undefined' || value ==undefined){
    var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id,a.approved_by,a.created_at,a.updated_at,";
    query += " app.educationalDetails, app.gradToPer, app.instructionalField, app.curriculum ,app.affiliation,app.CompetencyLetter,app.LetterforNameChange,";
    query +=" i.wesupload,i.type,i.wesno,a.notes, a.collegeConfirmation,u.current_location,inst.reference_no";
    query += " FROM Application as a JOIN User as u on u.id = a.user_id";
    query += " left join Institution_details as i on a.id = i.app_id  ";
    query+="left join InstructionalDetails as inst on inst.app_id =  i.app_id";
    query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
    query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";//+" LIMIT  "+per_page;
    query += " where a.tracker = 'signed' or  a.tracker = 'print_signed' and signed_date is  null and i.wesupload is null ORDER BY a.updated_at desc";
    
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
  }else if(value != 'undefined' || value != undefined){
    var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id,a.approved_by,a.created_at,a.updated_at,";
    query += " app.educationalDetails, app.gradToPer, app.instructionalField, app.curriculum ,app.affiliation,app.CompetencyLetter,app.LetterforNameChange,";
    query +=" i.wesupload,i.type,i.wesno,a.notes, a.collegeConfirmation,u.current_location";
    query += " FROM Application as a JOIN User as u on u.id = a.user_id";
    query += " left join Institution_details as i on a.id = i.app_id  ";
    query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
    query += " and a.source_from = 'guattestation'";
    query += " where a.tracker = 'signed'  or   a.tracker = 'print_signed' and signed_date is  null and  i.type LIKE '%" + value + "%' and i.wesupload is null ORDER BY a.updated_at desc"; //+" LIMIT  "+per_page;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

};

Application.getPrintUserApplications = function(value) {
  if(value == 'undefined' || value ==undefined){
    var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id,a.approved_by,a.created_at,a.updated_at,";
    query += " app.educationalDetails, app.gradToPer, app.instructionalField a.tracker = 'print_signed', app.curriculum ,app.affiliation,app.CompetencyLetter,app.LetterforNameChange,";
    query +=" i.wesupload,i.type,i.wesno,a.notes, a.collegeConfirmation,u.current_location,inst.reference_no";
    query += " FROM Application as a JOIN User as u on u.id = a.user_id";
    query += " left join Institution_details as i on a.id = i.app_id  ";
    query+="left join InstructionalDetails as inst on inst.app_id =  i.app_id";
    query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
    query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
    query += " where a.tracker = 'print' or   a.tracker = 'print_signed' and Pickupdate is  null and i.wesupload is null ORDER BY a.updated_at desc"; //+" LIMIT  "+per_page;
 
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }else if(value != 'undefined' || value != undefined){
    var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id,a.approved_by,a.created_at,a.updated_at,";
    query += " app.educationalDetails, app.gradToPer, app.instructionalField, app.curriculum ,app.affiliation,app.CompetencyLetter,app.LetterforNameChange,";
    query +=" i.wesupload,i.type,i.wesno,a.notes, a.collegeConfirmation,u.current_location";
    query += " FROM Application as a JOIN User as u on u.id = a.user_id";
    query += " left join Institution_details as i on a.id = i.app_id  ";
    query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
    query += " where a.tracker = 'print' or   a.tracker = 'print_signed' and Pickupdate is  null and  i.type LIKE '%" + value + "%' and i.wesupload is null ORDER BY a.updated_at desc"; //+" LIMIT  "+per_page;
    query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

};

Application.getPurposeWiseApplication = function(purposewise) {
  var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id,a.approved_by,a.created_at,a.updated_at,";
  query += " app.educationalDetails, app.gradToPer, app.instructionalField, app.curriculum ,app.affiliation,app.CompetencyLetter,";
  query +=" i.wesupload,i.type,i.wesno,a.notes, a.collegeConfirmation,u.current_location";
  query += " FROM Application as a JOIN User as u on u.id = a.user_id";
  query += " left join Institution_details as i on a.id = i.app_id  ";
  query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
  query += " where a.tracker = 'signed'and  i.type LIKE '%" + purposewise + "%' and i.wesupload is null ORDER BY a.updated_at desc"; //+" LIMIT  "+per_page;
  query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

Application.getEmailedUserApplications = function(filters,limit,offset) {
  var where_student_name = '',
   // where_student_surname = '',
    where_application_id = '',
    where_application_email = '',
    where_application_date = '';
 var limitOffset = '';
 if (filters.length > 0) {
  filters.forEach(function(filter) {
      if (filter.name == "name") {
        where_student_name = filter.value;
      } else if (filter.name == "surname") {
        where_student_surname = " AND u.surname LIKE '%" + filter.value + "%' ";
      } else if (filter.name == "application_id") {
        where_application_id = " AND a.id = " + filter.value + " ";
      } else if (filter.name == "email") {
        where_application_email = " AND u.email like '%" + filter.value  + "%' ";
      } else if(filter.name == 'application_year'){
        where_application_date = filter.value;
      }
  });
}
if (limit != null && offset != null) {
  limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
}
var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id, a.approved_by,a.created_at, a.updated_at,";
query += " app.educationalDetails, app.gradToPer, app.instructionalField, app.curriculum ,app.affiliation,app.CompetencyLetter,app.LetterforNameChange,";
query += " a.notes, a.collegeConfirmation,u.current_location";
query += " FROM Application as a JOIN User as u on u.id = a.user_id ";
query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
query += " where a.tracker = 'done' or a.tracker = 'print_signed' and a.signed_date is not null or Pickupdate is not null " ;
query += where_application_id;
query += where_application_email;
query += where_student_name;
query += where_application_date;
query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
query += " ORDER BY a.created_at desc ";
 query += limitOffset;
return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};


Application.getUnsignedUserApplications_new = function(filters,limit,offset,tab,status) {
  var where_student_name = '',
   // where_student_surname = '',
    where_application_id = '',
    where_application_email = '',
    where_transcriptRequiredMail = '',
    where_collegeConfirmation = '';
  var limitOffset = '';
  if(tab == 'tab1'){
    where_transcriptRequiredMail = " AND transcriptRequiredMail is null "
    where_collegeConfirmation = "AND collegeConfirmation is null "
  }else if(tab == 'tab3'){
    where_transcriptRequiredMail = " AND transcriptRequiredMail = 1 "
  }else if(tab == 'tab4'){
    where_transcriptRequiredMail = " AND transcriptRequiredMail is null "
    where_collegeConfirmation = "AND collegeConfirmation = 1 "
  }
  if (filters.length > 0) {
    filters.forEach(function(filter) {
      if (filter.name == "name") {
        where_student_name = filter.value;
      // } else if (filter.name == "surname") {
      //   where_student_surname = " AND u.surname LIKE '%" + filter.value + "%' ";
      } else if (filter.name == "application_id") {
        where_application_id = " AND a.id = " + filter.value + " ";
      } else if (filter.name == "email") {
        where_application_email = " AND u.email like '%" + filter.value  + "%' ";
      }
    });
  }
  if (limit != null && offset != null) {
    limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
  }
  var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id, app.educationalDetails, app.gradToPer,";
  query +=" app.affiliation, app.instructionalField, app.curriculum,a.created_at, a.notes,a.collegeConfirmation,u.current_location,app.CompetencyLetter,app.LetterforNameChange,";
  query +=" a.status, app.diplomaHolder, app.current_year";
  query += " FROM Application as a JOIN User as u on u.id = a.user_id  ";
  query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
  query += " where a.tracker = 'apply' and  a.status = '" +status + "' or a.status = 'accept'" ;
  query += where_application_id;
  query += where_application_email;
 // query += where_student_surname;
  query += where_transcriptRequiredMail;
  query += where_collegeConfirmation;
  query += where_student_name;
  query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
  query += " ORDER BY a.created_at desc ";
  query += limitOffset;
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

Application.getUnsignedUserApplications = function() {
  var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id, app.educationalDetails, app.gradToPer, ";
  query += "app.affiliation,app.instructionalField, app.curriculum,a.created_at, a.notes, a.collegeConfirmation,u.current_location,app.LetterforNameChange";
  query += " FROM Application as a JOIN User as u on u.id = a.user_id  ";
  query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
  query += " where a.tracker = 'apply' and a.status = 'new' ORDER BY a.created_at desc" //+" LIMIT  "+per_page;
  query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

Application.getRejectedUserApplications = function(){
  var query = "SELECT a.id,CONCAT(u.name,' ',u.surname) as name,u.email,a.user_id,app.educationalDetails, app.gradToPer,";
  query += " app.affiliation, app.instructionalField, app.curriculum,a.created_at, a.notes, a.collegeConfirmation,u.current_location ";
  query += " FROM Application as a JOIN User as u on u.id = a.user_id ";
  query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
  query += " where a.tracker = 'apply' and a.status = 'reject' ORDER BY a.created_at desc";
  query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}


Application.emailInstitute = function(Appid){
  var query ="SELECT 	u.id as userid,a.id as appid, a.status, I.email, UT.file_name, UT.type ";
  query += " FROM Application as a join User as u ON u.id = a.user_id ";
  query += " join Institution_details as I ON I.app_id = a.id ";
  query += " join User_Transcript as UT ON UT.user_id = u.id ";
  query += " where a.status = 'new' AND (UT.type = 'Master' OR UT.type = 'Graduation') AND a.id= "+Appid;
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

Application.downloadExcel = function(type){
  var query;
 if(type == 'totalApplications'){
  query="select u.email , CONCAT( u.name, ' ', u.surname) as Name ,u.applying_for, ";
  query += "a.id , a.tracker , a.user_id, a.created_at, app_det.educationalDetails,";
  query += "app_det.instructionalField, app_det.curriculum, app_det.gradToPer,";
  query += "app_det.affiliation,app_det.CompetencyLetter,app_det.LetterforNameChange";
  query += "from Application as a JOIN User as u on  a.user_id = u.id";
  query += "JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id"
 }else if(type == 'pendingApplications'){
  query="select a.id, u.email, concat(u.name, ' ' , u.surname) as Name,";
  query += "CONCAT(u.mobile_country_code,'-', u.mobile) as contactNumber,app_det.educationalDetails,";
  query += "u.applying_for, a.user_id,a.approved_by, a.created_at, app_det.gradToPer,"
  query +=  "app_det.instructionalField, app_det.curriculum,app_det.affiliation,"
  query += "app_det.CompetencyLetter,app_det.LetterforNameChange From  Application as a";
  query += " join User as u on u.id = a.user_id";
  query += " JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id";
  query +=" where a.tracker = 'apply' and a.status in ('new','repeat') and a.transcriptRequiredMail is null";
 }else if(type == 'verifiedApplications'){
    query = "SELECT a.id, CONCAT( u.name, ' ', u.surname) as Name, u.email, u.applying_for,";
    query += "a.user_id,a.approved_by,a.created_at,app_det.educationalDetails,app_det.gradToPer,";
    query += "app_det.curriculum,app_det.affiliation,app_det.CompetencyLetter,app_det.LetterforNameChange,";
    query += "app_det.instructionalField FROM Application as a JOIN User as u on u.id = a.user_id";
    query += " JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id";
    query += " where a.tracker = 'verified'";
 }else if(type == 'signedApplications'){
    query = "SELECT a.id, CONCAT( u.name, ' ', u.surname) as Name, u.email, a.user_id,";
    query += "a.approved_by,a.updated_at, a.created_at,app_det.educationalDetails,app_det.gradToPer,"
    query += "app_det.curriculum,app_det.affiliation,app_det.CompetencyLetter,app_det.LetterforNameChange,";
    query += "app_det.instructionalField FROM Application as a JOIN User as u on u.id = a.user_id";
    query += " JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id";
    query += " where a.tracker = 'signed'";
 }else if(type == 'emailedApplications'){
  query = "SELECT a.id, CONCAT( u.name, ' ', u.surname) as Name, u.email, a.user_id,";
  query += "a.approved_by,a.updated_at, a.created_at,app_det.educationalDetails,app_det.gradToPer,";
  query += "app_det.curriculum,app_det.affiliation,app_det.CompetencyLetter,app_det.LetterforNameChange,";
  query += "app_det.instructionalField FROM Application as a JOIN User as u on u.id = a.user_id";
  query += " JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id";
  query += " where a.tracker = 'done'";
 }else if(type == 'totalApplications_finance'){
  query="select u.email , CONCAT( u.name, ' ', u.surname) as Name ,u.applying_for, ";
  query += "a.id , a.tracker , a.user_id, a.created_at, app_det.educationalDetails,";
  query += "app_det.instructionalField, app_det.curriculum, app_det.gradToPer,";
  query += "app_det.affiliation,app_det.CompetencyLetter,app_det.LetterforNameChange ";
  query += "from Application as a JOIN User as u on  a.user_id = u.id ";
  query += "JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id "
  query += " where 1=1 "+whereCreated_at+" ORDER BY a.id desc ";
}
 return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

Application.downloadExcel_finance = function(type,startDate,endDate){
  var whereCreated_at = '';
  if(startDate && endDate){
      whereCreated_at = 'and a.created_at BETWEEN "'+startDate+'" AND "'+endDate+'"'
  }
  var query;
  if(type == 'totalApplications_finance'){
  query="SELECT usr.id AS user_id, usr.`name`, usr.email,"
  query+="app.created_at,ord.application_id AS application_id,ord.source,ord.amount,afd.attestedfor,"
  query+='if( afd.educationalDetails = 1, "applied for educational deatils", "NA") AS Educational_details,'
  query+='if( afd.instructionalField = 1, "applied for moi", "NA") AS MOI,'
  query+="if (( afd.attestedfor REGEXP 'newmark'), 0 , count( DISTINCT(umu.id) ) )as no_of_marksheets,"
  query+="count( DISTINCT(ut.id) ) as no_of_transcripts,count( DISTINCT(ud.id) ) as no_of_degree,app.deliveryType as app_type "
  query+="FROM Orders AS ord "
  query+="LEFT JOIN `Transaction` AS tran ON tran.order_id = ord.id "
  query+="LEFT JOIN `User` AS usr ON usr.id = ord.user_id "
  query+="LEFT JOIN Applied_For_Details AS afd ON afd.app_id = ord.application_id "
  query+="LEFT JOIN UserMarklist_Upload AS umu ON umu.app_id = ord.application_id "
  query+="LEFT JOIN User_Transcript AS ut ON ut.app_id = ord.application_id and ut.type like '%_transcripts%' "
  query+="LEFT JOIN User_Transcript AS ud ON ud.app_id = ord.application_id and ud.type like '%_degree%' "
  query+="LEFT JOIN Application As app on app.id = ord.application_id "
  query+="WHERE ord.`status` = '1' AND ( ord.amount != '1.00' AND ord.amount != '2.00' ) AND ( ord.source = 'guattestation' or ord.source = 'gumoi' ) GROUP BY ord.application_id"
  }
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}
Application.download_dailyData = function(yesterdayNew,todayNew){
  var whereCreated_at = '';
  if(yesterdayNew && todayNew){
      whereCreated_at = 'and a.created_at BETWEEN "'+yesterdayNew+'" AND "'+todayNew+'"'
  }
  var query;
  query="SELECT usr.id AS user_id, usr.`name`, usr.email,usr.mobile, "
  query+="app.created_at as applicationDate,ord.application_id AS application_id,ord.source,ord.amount,afd.attestedfor,ord.id as orderId,tran.tracking_id as TrackingId,tran.bank_ref_no,ord.amount as ord_amount,  "
  query+='if( afd.educationalDetails = 1, "applied for educational deatils", "NA") AS Educational_details,'
  query+='if( afd.instructionalField = 1, "applied for moi", "NA") AS MOI,'
  query+="if (( afd.attestedfor REGEXP 'newmark'), 0 , count( DISTINCT(umu.id) ) )as no_of_marksheets,"
  query+="count( DISTINCT(ut.id) ) as no_of_transcripts,count( DISTINCT(ud.id) ) as no_of_degree,app.deliveryType as app_type "
  query+="FROM Orders AS ord "
  query+="LEFT JOIN `Transaction` AS tran ON tran.order_id = ord.id "
  query+="LEFT JOIN `User` AS usr ON usr.id = ord.user_id "
  query+="LEFT JOIN Applied_For_Details AS afd ON afd.app_id = ord.application_id "
  query+="LEFT JOIN UserMarklist_Upload AS umu ON umu.app_id = ord.application_id "
  query+="LEFT JOIN User_Transcript AS ut ON ut.app_id = ord.application_id and ut.type like '%_transcripts%' "
  query+="LEFT JOIN User_Transcript AS ud ON ud.app_id = ord.application_id and ud.type like '%_degree%' "
  query+="LEFT JOIN Application As app on app.id = ord.application_id "
  query+="WHERE ord.`status` = '1' AND ( ord.amount != '1.00' AND ord.amount != '2.00' ) AND ( ord.source = 'guattestation' or ord.source = 'gumoi' ) GROUP BY ord.application_id"
  console.log("QUERY==> "+ query);
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}
Application.downloadExcel_datewise = function(type,startDate,endDate){

  // console.log("enddatee"+end);
  var whereCreated_at = '';
  if(startDate && endDate){
      whereCreated_at = 'and a.created_at BETWEEN "'+startDate+'" AND "'+endDate+'"'

  }

  var query;
 if(type == 'totalApplications'){
  query="select u.email , CONCAT( u.name, ' ', u.surname) as Name ,u.applying_for, ";
  query += "a.id , a.tracker , a.user_id, a.created_at, app_det.educationalDetails,";
  query += "app_det.instructionalField, app_det.curriculum, app_det.gradToPer,";
  query += "app_det.affiliation,app_det.CompetencyLetter,app_det.LetterforNameChange ";
  query += "from Application as a JOIN User as u on  a.user_id = u.id ";
  query += "JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id "
  query += " where 1=1 "+whereCreated_at+" ORDER BY a.id desc ";
}else if(type == 'pendingApplications'){
  query="select a.id, u.email, concat(u.name, ' ' , u.surname) as Name,";
  query += "CONCAT(u.mobile_country_code,'-', u.mobile) as contactNumber,app_det.educationalDetails,";
  query += "u.applying_for, a.user_id,a.approved_by, a.created_at, app_det.gradToPer,"
  query +=  "app_det.instructionalField, app_det.curriculum,app_det.affiliation,"
  query += "app_det.CompetencyLetter,app_det.LetterforNameChange From  Application as a ";
  query += " join User as u on u.id = a.user_id ";
  query += " JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id ";
  query +=" where a.tracker = 'apply' and a.status in ('new','repeat') and a.transcriptRequiredMail is null ";
  query += ""+whereCreated_at+" ORDER BY a.id desc ";
 }else if(type == 'verifiedApplications'){
    query = "SELECT a.id, CONCAT( u.name, ' ', u.surname) as Name, u.email, u.applying_for,";
    query += "a.user_id,a.approved_by,a.created_at,app_det.educationalDetails,app_det.gradToPer,";
    query += "app_det.curriculum,app_det.affiliation,app_det.CompetencyLetter,app_det.LetterforNameChange,";
    query += "app_det.instructionalField FROM Application as a JOIN User as u on u.id = a.user_id ";
    query += " JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id ";
    query += " where a.tracker = 'verified' ";
    query += ""+whereCreated_at+" ORDER BY a.id desc ";

 }else if(type == 'signedApplications'){
    query = "SELECT a.id, CONCAT( u.name, ' ', u.surname) as Name, u.email, a.user_id,";
    query += "a.approved_by,a.updated_at, a.created_at,app_det.educationalDetails,app_det.gradToPer,"
    query += "app_det.curriculum,app_det.affiliation,app_det.CompetencyLetter,app_det.LetterforNameChange,";
    query += "app_det.instructionalField FROM Application as a JOIN User as u on u.id = a.user_id ";
    query += " JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id ";
    query += " where a.tracker = 'signed' ";
    query += ""+whereCreated_at+" ORDER BY a.id desc ";

 }else if(type == 'emailedApplications'){
  query = "SELECT a.id, CONCAT( u.name, ' ', u.surname) as Name, u.email, a.user_id,";
  query += "a.approved_by,a.updated_at, a.created_at,app_det.educationalDetails,app_det.gradToPer,";
  query += "app_det.curriculum,app_det.affiliation,app_det.CompetencyLetter,app_det.LetterforNameChange,";
  query += "app_det.instructionalField FROM Application as a JOIN User as u on u.id = a.user_id ";
  query += " JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id ";
  query += " where a.tracker = 'done' ";
  query += ""+whereCreated_at+" ORDER BY a.id desc ";

 }else if(type == 'totalApplications_finance'){
  query="select u.email , CONCAT( u.name, ' ', u.surname) as Name ,u.applying_for, ";
  query += "a.id , a.tracker , a.user_id, a.created_at, app_det.educationalDetails,";
  query += "app_det.instructionalField, app_det.curriculum, app_det.gradToPer,";
  query += "app_det.affiliation,app_det.CompetencyLetter,app_det.LetterforNameChange ";
  query += "from Application as a JOIN User as u on  a.user_id = u.id ";
  query += "JOIN Applied_For_Details AS app_det ON app_det.app_id = a.id "
  query += " where 1=1 "+whereCreated_at+" ORDER BY a.id desc ";
}
 return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

Application.paymentExcel = function(tracker,status){
  if(tracker == null && status == null){
    var query = "SELECT id FROM Application WHERE source_from='guattestation' ORDER BY created_at ASC";
  }else{
    var query = "SELECT id FROM Application WHERE tracker = '" + tracker + "' AND STATUS = '" + status + "' and source_from='guattestation' ORDER BY created_at ASC";
    console.log('query' + query);
  }
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

Application.getStudentDetails = function(userIds){
  var query ="SELECT user.id as userid, CONCAT(user.name, ' ', user.surname) as student_name, user.email as student_email,";
  query +=" CONCAT(user.mobile_country_code ,'+',user.mobile) as contactNumber, application.created_at as application_date,";
  query +=" applied_for_details.educationalDetails, applied_for_details.gradToPer, applied_for_details.instructionalField,";
  query +=" applied_for_details.curriculum,applied_for_details.id as applyingId,applied_for_details.affiliation,";
  query += " application.id as appid  FROM Application as application JOIN User as user ON user.id = application.user_id";
  query +=" JOIN Applied_For_Details  as applied_for_details ON applied_for_details.user_id = application.user_id";
  query +="  WHERE application.status in ('new', 'repeat') and application.tracker = 'apply' and application.user_id in (" + userIds + ")";
  query += " and application.source_from = 'guattestation' or application.source_from = 'gumoi'";
  //var query ="SELECT  u.id as userid, CONCAT(u.name, ' ', u.surname) as student_name, u.educationalDetails, u.instructionalField, u.curriculum, a.id as appid FROM Application as a join User as u ON u.id = a.user_id where a.user_id in (" + userIds + ")";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

Application.getDoneApplications = function(date){
  var query = "SELECT a.id as app_id,u.id as user_id,CONCAT(u.name,' ',u.surname) as studentName,u.email as studentEmail,";
  query += " i.type as purpose,i.email as purposeEmail,a.updated_at  as emailSent , i.otherEmail from Application as a ";
  query += " join User as u on u.id = a.user_id ";
  query += " join Institution_details as i on a.id = i.app_id ";
  query += " where a.tracker = 'done' and a.updated_at like '%" + date + "%'";
  query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

Application.getPendingApplications = function(){
  var query = "SELECT u.id as user_id, a.id as app_id, CONCAT(u.name,' ',u.surname) as studentName, app.educationalDetails,";
  query += " app.affiliation, app.gradToPer, app.instructionalField, app.curriculum FROM Application AS a ";
  query += " JOIN User AS u ON u.id = a.user_id ";
  query += " JOIN Applied_For_Details as app ON app.app_id = a.id ";
  query += " WHERE a.tracker = 'apply' and a.status = 'new' and a.transcriptRequiredMail is null ";
  query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

Application.getPurposeWiseApplicationsCount = function(purpose,location) {
  var query = "SELECT COUNT(i.app_id) as count FROM Institution_details AS i JOIN Application AS a ON i.app_id = a.id ";
  query += " JOIN User AS u ON u.id = i.user_id WHERE ";
  query += " i.type = '" + purpose + "' AND ";
  query += "u.current_location = '" + location + "'  ORDER BY count desc";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

Application.getCollegeWiseApplicationsCount = function(user_ids,location) {
  var query = "SELECT COUNT(a.id) as count FROM Application AS a JOIN User AS u ON u.id = a.user_id WHERE ";
  query += " u.id in (" + user_ids + ") AND source_from = 'guattestation' or source_from = 'gumoi' AND ";
  query += "u.current_location = '" + location + "'";
  console.log(query);
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

Application.getOnHoldApplications = function(){
  var query = "SELECT CONCAT(u.name, ' ', u.surname) as stduent_name, u.email, u.mobile_country_code,u.mobile, a.id as application_id";
  query += " FROM User AS u JOIN Application AS a ON u.id = a.user_id ";
  query += "WHERE a.transcriptRequiredMail = 1 and a.tracker = 'apply' and a.status in ('new','repeat')";
  query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

Application.getOnHoldApplications_date = function(){
  var query = "SELECT CONCAT(u.name, ' ', u.surname) as stduent_name, u.email, u.mobile_country_code,u.mobile, a.id as application_id";
  query += " FROM User AS u JOIN Application AS a ON u.id = a.user_id ";
  query += "WHERE a.transcriptRequiredMail = 1 and a.tracker = 'apply' and a.status in ('new','repeat')";
  query += " and a.created_at between '2022-02-01' and '2022-02-22' ";
  query += " and a.source_from = 'guattestation' or a.source_from = 'gumoi'";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

Application.getAppliedCount = function(date,type){
  var query = "SELECT count(a.id) as appliedCount FROM Application AS a JOIN User AS u ON u.id = a.user_id "
  query += " WHERE a.created_at like '%" + date + "%' AND u.current_location = '" + type +"'";
  return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
}

Application.getUserApplicationData = function(email) {
  var query = "SELECT CONCAT(u.name, ' ', u.surname) as student_name, u.email as student_email, a.status, a.tracker FROM Application as a";
  query += " JOIN User AS u ON u.id = a.user_id ";
  query += " WHERE u.email = '" + email + "'";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

Application.getAllApplicationsDetails = function(email) {
  var query = "SELECT app.* FROM Application as app";
  query += " JOIN User AS u ON u.id = app.user_id ";
  query += " WHERE u.email = '" + email + "'";
  query += " and app.source_from = 'guattestation' or app.source_from = 'gumoi'";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

//Super Admin Queries

  Application.getApplicationByUser = function(filters,tracker,status,limit,offset) {
    console.log("filters=" + JSON.stringify(filters));
    console.log("tracker" + tracker);
    console.log("status" + status);
    console.log("limit" + limit);
    var where_student_name = '',
    where_application_id = '',
    where_application_email = '',
    where_source_from = '',
    where_tracker = '',
    where_status = '';
 var limitOffset = '';
 if (filters.length > 0) {
  filters.forEach(function(filter) {
      if (filter.name == "name") {
        where_student_name = filter.value;
      }  else if (filter.name == "application_id") {
        where_application_id = " AND app.id = " + filter.value + " ";
      } else if (filter.name == "email") {
        where_application_email = " AND usr.email like '%" + filter.value  + "%' ";
      } else if(filter.name == 'source_from'){
        where_source_from = " AND app.source_from = " + filter.value + " ";
      }
  });
}
if (limit != null && offset != null) {
  limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
}
if(tracker != null){
  where_tracker = " AND app.tracker = '" + tracker + "'";
}
if(status != null){
  where_status = " AND app.status = '" + status + "'";
}
var query = "SELECT app.user_id as user_id, CONCAT(usr.name,' ', usr.surname) AS name, usr.email,";
query += " JSON_ARRAYAGG(JSON_OBJECT( 'app_id', app.id, 'tracker', app.tracker, 'status', app.status, 'source_from', app.source_from,'created_at' , app.created_at,'addressid',app.address_id  )) As app_data  ";
query += " FROM Application AS app ";
query += " Join User AS usr ON usr.id = app.user_id ";
query += " WHERE 1 = 1";
query += where_tracker;
query += where_status;
query += where_application_id;
query += where_application_email;
query += where_student_name;
query += where_source_from;
query += " GROUP BY app.user_id "
query += " ORDER BY app.created_at DESC";
query += limitOffset;

console.log(query);
return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

Application.getDeliveryTypeModeWiseAppCount = function(source_from,mode){
  var query = "SELECT count( DISTINCT(app.id) ) AS app_count from Application as app";
  query += " WHERE app.source_from = '" + source_from + "' AND app.deliveryTime = '" + mode + "' ";
  console.log("query == " + query);
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

Application.getStudentReportDetails = function(filters,limit,offset) {
  console.log("filters=" + JSON.stringify(filters));
  console.log("limit" + limit);
  var where_student_name = '',
    where_application_email = '';
  var limitOffset = '';
  if (filters.length > 0) {
    filters.forEach(function(filter) {
      if (filter.name == "name") {
        where_student_name = filter.value;
      }else if (filter.name == "email") {
        where_application_email = " AND usr.email like '%" + filter.value  + "%' ";
      }
    });
  }
  if (limit != null && offset != null) {
    limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
  }
  
  var query = "SELECT CONCAT( usr.name, ' ', usr.surname ) AS name, usr.email, ";
  query += " JSON_ARRAYAGG(JSON_OBJECT( 'source_from', source.source_from ,'count', source.source_count )) AS app_data ";
  query += " FROM User as usr JOIN ";
  query += " (SELECT user_id, source_from, count(source_from) AS source_count ";
  query += " FROM Application GROUP BY user_id,source_from) source";
  query += " ON usr.id = source.user_id";
  query += " WHERE 1 = 1";
  query += where_application_email;
  query += where_student_name;
  query += " GROUP BY usr.id"
  query += limitOffset;

  console.log(query);
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

Application.getMarksheets_convo_pdc = function(user_id) {
  var query = "SELECT  pl.degree_type,pl.faculty as plfaculty,pl.duration,am.file_name,uml.faculty,uml.id,am.lock_transcript FROM Applicant_Marksheet am JOIN userMarkList uml ON am.user_id = uml.user_id join Program_List pl on uml.faculty = pl.course_name where uml.user_id  =  " +  user_id
  query += " and am.applied_for_degree = uml.faculty and am.lock_transcript = 0"
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

Application.getMarksheets_migartion = function(user_id) {
  var query = "SELECT  pl.degree_type,pl.faculty as plfaculty,pl.duration,am.file_name,uml.id,am.lock_transcript FROM Applicant_Marksheet am JOIN userMarkList uml ON am.user_id = uml.user_id join Program_List pl on uml.faculty = pl.course_name where uml.user_id  =  " +  user_id
  query += " and am.applied_for_degree = uml.faculty and am.lock_transcript = 0"
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};
Application.getExtraDocuments = function(user_id) {
  var query = "select file_name,lock_transcript, name from Applicant_Marksheet  where user_id =  " +  user_id
  query += " and lock_transcript = 0 and name like '%Aadhar Card%'"
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

Application.printapp = function (startTime,currentTime) {
  var query = " SELECT JSON_ARRAYAGG(JSON_OBJECT( 'app_id', app.id, 'app_inward_no', app.inward ,'usr_name', usr.name , 'usr_surname', usr.surname , 'user_id', usr.id )) As app_data , COUNT(*) As count, app.source_from FROM Application  AS app ";
  query += " Join User AS usr ON usr.id = app.user_id ";
  query += " WHERE app.created_at BETWEEN '"+startTime+"' AND '"+currentTime+"' ";
  query += " GROUP BY app.source_from ";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
};

 Application.associate = (models) => {
  Application.belongsTo(models.User, {foreignKey: 'user_id'});
  Application.hasOne(models.Emailed_Docs, { foreignKey: 'app_id' });
};
 return Application;
};