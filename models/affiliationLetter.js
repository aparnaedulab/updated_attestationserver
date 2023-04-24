"use strict"

module.exports = function(sequelize, DataTypes) {
var affiliation_Letter = sequelize.define("Affiliation_Letter", {
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

 affiliation_Letter.updateEmailStatus = function(id,status){
    var query = "Update Affiliation_Letter set emailStatus = '" + status + "' where id = " + id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  affiliation_Letter.updateSingleEmailStatus = function(user_id,msgID,value){
    var query = "Update Affiliation_Letter set emailStatus = '" + value + "', emailMsgId='" + msgID +"' where user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  affiliation_Letter.getMaxRefetenceNumber = function(){
    var query = "SELECT MAX(reference_no) as maxNumber FROM Affiliation_Letter";// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

  },

  affiliation_Letter.updateReferenceNumber = function(user_id,reference_no){
    var query = "Update Affiliation_Letter set reference_no = " + reference_no + " where user_id =" + user_id;// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  affiliation_Letter.getCollegeName = function(user_id){
    var query = "SELECT DISTINCT college.id, college.name, college.emailId, college.contactPerson, college.contactNo, college.alternateContactPerson, college.alternateContactNo, college.alternateEmailId, inst.emailStatus as collegeEmailStatus, transcript.app_id FROM userMarkList AS transcript ";
    query += " JOIN Affiliation_Letter AS inst ON inst.user_id = transcript.user_id ";
    query += " JOIN College AS college ON college.id = transcript.collegeId ";
    query += " WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  affiliation_Letter.setAppIds = function(user_id, app_id){
    var query = "Update Affiliation_Letter set app_id = '" + app_id + "' where app_id is null and user_id =" + user_id;// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  affiliation_Letter.deleteUserData = function(user_id){
    var query = "DELETE FROM Affiliation_Letter WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }
  
  affiliation_Letter.associate = (models) => {
    affiliation_Letter.belongsTo(models.User, {foreignKey: 'user_id'});
    affiliation_Letter.belongsTo(models.Application, {foreignKey: 'app_id'});
  };
 return affiliation_Letter;
};