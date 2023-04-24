
"use strict"

module.exports = function(sequelize, DataTypes) {
var GradToPerdetails = sequelize.define("GradeToPercentageLetter", {
    name: DataTypes.TEXT,
  	file_name: DataTypes.TEXT,
    type: DataTypes.STRING(30),
    collegeId :  DataTypes.STRING(30),
    lock_transcript: {
      type: DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: 0
    },
    emailMsgId : DataTypes.TEXT,
    collegeEmailStatus : DataTypes.STRING(20),
    upload_step: {
      type: DataTypes.ENUM('default', 'requested','changed'),
      allowNull: false,
      defaultValue: 'default'
    },
 });

 GradToPerdetails.updateEmailStatus = function(id,status){
  var query = "Update GradeToPercentageLetter set emailStatus = '" + status + "' where id = " + id;
  return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
},

GradToPerdetails.updateSingleCollegeEmailStatus = function(user_id,college_id, msgID,value){
  var query = "Update GradeToPercentageLetter set collegeEmailStatus = '" + value + "', emailMsgId='" + msgID +"' where user_id = " + user_id + " and collegeId = " + college_id;
  return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
},

GradToPerdetails.getCollegeName = function(user_id){
  var query = "SELECT DISTINCT college.id, college.name, college.emailId, college.contactPerson, college.contactNo, college.alternateContactPerson, college.alternateContactNo, college.alternateEmailId, letter.collegeEmailStatus as collegeEmailStatus, letter.app_id FROM GradeToPercentageLetter AS letter ";
  query += " JOIN College AS college ON college.id = letter.collegeId ";
  query += " WHERE user_id = " + user_id;
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
},

GradToPerdetails.getDistinctCollege = function(user_id) {
  var query = "SELECT DISTINCT collegeId FROM GradeToPercentageLetter WHERE user_id = " + user_id;
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
},

GradToPerdetails.deleteUserData = function(user_id){
  var query = "DELETE FROM GradeToPercentageLetter WHERE user_id = " + user_id;
  return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
}

 GradToPerdetails.associate = (models) => {
  GradToPerdetails.belongsTo(models.User, {foreignKey: 'user_id'});
  GradToPerdetails.belongsTo(models.Application, {foreignKey: 'app_id'});
  };
 
 return GradToPerdetails;
};