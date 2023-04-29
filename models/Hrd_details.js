"use strict";

module.exports = function(sequelize, DataTypes) {
  var Hrd_details = sequelize.define("Hrd_details", {
    fullName: DataTypes.STRING(100),
    course_name: DataTypes.STRING(100),
    seat_no: DataTypes.STRING(100),
    seat_no_sem6: DataTypes.STRING(100),
    seat_no_sem5: DataTypes.STRING(100),
    prn_no : DataTypes.TEXT(100),
    cgpa : DataTypes.STRING(100),
    cgpi  : DataTypes.STRING(100),
    transcript_no :DataTypes.STRING(100),
    transcript_date:DataTypes.STRING(100),
    exam_date : DataTypes.STRING(100),
    specialization : DataTypes.STRING(100),
    degree : DataTypes.STRING(100),
    reference_no : DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    app_id: DataTypes.INTEGER,
    verification_type : DataTypes.STRING(100),
    secondlastsem : DataTypes.STRING(100),
    lastsem : DataTypes.STRING(100),
  });

  Hrd_details.getAllInstitutionType = function(id){
    var query = "select email,type,wesno,cesno,iqasno,eduPerno,icasno,wesupload,studyrefno,emprefno,";
    query += "visarefno,visaaccno,empaccno,studyaccno,otheraccno,myieeno,icesno,nasbano,OtherEmail,nceesno,hrdno,";
    query += "naricno,ncano from Hrd_details where app_id =" + id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  
  }
  Hrd_details.deleteUserData = function(user_id){
    var query = "DELETE FROM Hrd_details WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }

  Hrd_details.getMaxRefetenceNumber = function(){
    var query = "SELECT MAX(reference_no) as maxNumber FROM Hrd_details";// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

  }
  Hrd_details.getWesStudents = function(filters,limit,offset) {
    var where_student_name = '',
      where_application_id = '',
      where_application_email = '',
      where_application_wesno = '',
      where_application_date = '';
    var limitOffset = '';
    if (filters.length > 0) {
      filters.forEach(function(filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
        } else if (filter.name == "surname") {
          where_student_surname = " AND u.surname LIKE '%" + filter.value + "%' ";
        } else if (filter.name == "application_id") {
          where_application_id = " AND i.app_id = " + filter.value + " ";
        } else if (filter.name == "email") {
          where_application_email = " AND u.email like '%" + filter.value  + "%' ";
        } else if (filter.name == "wesno") {
          where_application_wesno = " AND i.wesno like '%" + filter.value  + "%' ";
        }else if(filter.name == 'application_year'){
          where_application_date = filter.value
        }
      }); 
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
    var query ="select  concat(u.name,' ',u.surname) as name ,u.email, i.app_id , i.type, i.wesno ,i.user_id, i.wesupload , ";
    query +=" i.updated_at,u.current_location from Hrd_details as i ";
    query +=" join User as u on i.user_id = u.id ";
    query +=" where i.type = 'Educational credential evaluators WES' and i.wesupload is not null";
    query += where_application_id;
    query += where_application_email;
    query += where_application_wesno;
    query += where_student_name;
    query += where_application_date;
    query += " order by updated_at desc";
    query += limitOffset;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  Hrd_details.getInvalidWesStudents = function(user_id){
    var query = "select  concat(u.name,' ',u.surname) as name ,u.email, i.app_id , i.type, i.wesno ,i.user_id,i.updated_at,i.wesrecord from Hrd_details as i join User as u on i.user_id = u.id where i.wesrecord='Not found' and  i.type = 'Educational credential evaluators WES'and i.wesupload is null order by updated_at desc;" 
     return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  

  Hrd_details.getWESApplications = function(date){
    var query = "select id, type,wesno,wesupload,app_id,user_id from Hrd_details where type = 'Educational credential evaluators WES' and wesupload = '" + date +"' and wesno is not null and app_id is not null";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Hrd_details.deleteUserData = function(user_id){
    var query = "DELETE FROM Hrd_details WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }


  // Hrd_details.belongsTo(sequelize.models.Application, {foreignKey: 'app_id'});
  // Hrd_details.associate = (models) => {
  //   Hrd_details.belongsTo(models.User, {foreignKey: 'user_id'});
  // };

  

return Hrd_details;
};