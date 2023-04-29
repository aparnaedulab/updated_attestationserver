
"use strict"

module.exports = function(sequelize, DataTypes) {
var instructionaldetails = sequelize.define("InstructionalDetails", {
    userId: DataTypes.INTEGER,
    studentName: DataTypes.STRING(255),
    courseName: DataTypes.STRING(255),
    collegeName : DataTypes.STRING(255),
    emailStatus : DataTypes.STRING(20),
    duration: DataTypes.STRING(10),
    division: DataTypes.STRING(255),
    yearofpassing: DataTypes.STRING(255),
    specialization: DataTypes.STRING(255),
    emailMsgId : DataTypes.TEXT,
    instruction_medium : DataTypes.STRING(30),
    academicYear : DataTypes.STRING(20),
    reference_no : DataTypes.INTEGER(11),
    education : DataTypes.STRING(255)
 });

 instructionaldetails.updateEmailStatus = function(id,status){
    var query = "Update InstructionalDetails set emailStatus = '" + status + "' where id = " + id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  instructionaldetails.updateSingleEmailStatus = function(user_id,msgID,value){
    var query = "Update InstructionalDetails set emailStatus = '" + value + "', emailMsgId='" + msgID +"' where userId = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  instructionaldetails.getMaxRefetenceNumber = function(){
    var query = "SELECT MAX(reference_no) as maxNumber FROM InstructionalDetails";// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

  },

  instructionaldetails.updateReferenceNumber = function(user_id,reference_no){
    var query = "Update InstructionalDetails set reference_no = " + reference_no + " where userId =" + user_id;// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  instructionaldetails.updateReferenceNumber_new = function(id,reference_no){
    var query = "Update InstructionalDetails set reference_no = " + reference_no + " where id in (" + id + ")";// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  instructionaldetails.getCollegeName = function(user_id){
    var query = "SELECT DISTINCT college.id, college.name, college.emailId, college.contactPerson, college.contactNo, college.alternateContactPerson, college.alternateContactNo, college.alternateEmailId, inst.emailStatus as collegeEmailStatus, transcript.app_id FROM userMarkList AS transcript ";
    query += " JOIN InstructionalDetails AS inst ON inst.userId = transcript.user_id ";
    query += " JOIN College AS college ON college.id = transcript.collegeId ";
    query += " WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  instructionaldetails.setAppIds = function(user_id, app_id){
    var query = "Update InstructionalDetails set app_id = '" + app_id + "' where app_id is null and userId =" + user_id;// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  instructionaldetails.deleteUserData = function(user_id){
    var query = "DELETE FROM InstructionalDetails WHERE userId = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }
  
  instructionaldetails.belongsTo(sequelize.models.Application, {foreignKey: 'app_id'});

 return instructionaldetails;
};