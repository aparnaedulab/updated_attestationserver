"use strict";

module.exports = function(sequelize, DataTypes) {
  var Letterfor_NameChange = sequelize.define("Letterfor_NameChange", {
    name : DataTypes.TEXT,
    firstnameaspermarksheet : DataTypes.STRING(255),
    fathersnameaspermarksheet: DataTypes.STRING(255),
    mothersnameaspermarksheet : DataTypes.STRING(255),
    lastnameaspermarksheet : DataTypes.STRING(255),
    firstnameasperpassport : DataTypes.STRING(255),
    fathersnameasperpassport : DataTypes.STRING(255),
    lastnameasperpassport : DataTypes.STRING(255),
    reference_no : DataTypes.STRING(20),
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
       user_id :DataTypes.INTEGER(20),
       app_id :DataTypes.STRING(20),

  });

  Letterfor_NameChange.updateEmailStatus = function(id,status){
    var query = "Update Letterfor_NameChange set collegeEmailStatus = '" + status + "' where id = " + id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  Letterfor_NameChange.updateSingleCollegeEmailStatus = function(user_id,college_id, msgID,value){
    var query = "Update Letterfor_NameChange set collegeEmailStatus = '" + value + "', emailMsgId='" + msgID +"' where user_id = " + user_id + " and collegeId = " + college_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  Letterfor_NameChange.updateSingleEmailStatus = function(user_id,msgID,value){
    var query = "Update Letterfor_NameChange set emailStatus = '" + value + "', emailMsgId='" + msgID +"' where userId = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },


  Letterfor_NameChange.getCollegeName = function(user_id){
    var query = "SELECT DISTINCT college.id, college.name, college.emailId, college.contactPerson, college.contactNo, college.alternateContactPerson, college.alternateContactNo, college.alternateEmailId, transcript.app_id FROM userMarkList AS transcript ";
    query += " JOIN Letterfor_NameChange AS inst ON inst.user_id = transcript.user_id ";
    query += " JOIN College AS college ON college.id = transcript.collegeId ";
    query += " WHERE transcript.user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  },

  Letterfor_NameChange.getCollegeIDs = function(user_id){
    // var query = "SELECT DISTINCT college.id, college.name, college.emailId, college.contactPerson, college.contactNo, college.alternateContactPerson, college.alternateContactNo, college.alternateEmailId, transcript.collegeEmailStatus FROM Letterfor_NameChange AS transcript ";
    // query += " JOIN College AS college ON college.id = transcript.collegeId ";
    // query += " WHERE user_id = " + user_id;

    var query = "SELECT CONCAT_WS( GROUP_CONCAT(distinct(ut.collegeId)), GROUP_CONCAT(distinct(insd.collegeId)), GROUP_CONCAT(distinct(uc.collegeId)) ) as collegeId, GROUP_CONCAT( DISTINCT ( ut.collegeEmailStatus ) ) as TranscriptStatus, GROUP_CONCAT( DISTINCT ( isd.emailStatus ) ) as instructionStatus, GROUP_CONCAT( DISTINCT ( uc.emailStatus ) ) as curriculumStatus, ut.user_id from Letterfor_NameChange as ut ";
	  query += " Left Join userMarkList as insd on insd.user_id = ut.user_id ";
    query += " Left Join InstructionalDetails as isd on isd.userId = insd.user_id" ;
    query += " Left Join User_Curriculum as uc on uc.user_id = ut.user_id" ;
    query += " where ut.user_id = " + user_id;
    query += " GROUP BY ut.user_id";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  },

  Letterfor_NameChange.updateReferenceNumber_new = function(id,reference_no){
    var query = "Update Letterfor_NameChange set reference_no = " + reference_no + " where id in (" + id + ")";// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },
  
  Letterfor_NameChange.getMaxRefetenceNumber = function(){
    var query = "SELECT MAX(reference_no) as maxNumber FROM Letterfor_NameChange";// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

  },

  Letterfor_NameChange.getDistinctCollege = function(user_id) {
    var query = "SELECT DISTINCT collegeId FROM letterfor_namechange WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Letterfor_NameChange.setAppIds = function(user_id, app_id){
    var query = "Update Letterfor_NameChange set app_id = '" + app_id + "' where app_id is null and user_id =" + user_id;// WHERE created_at between '" + condition + "'";
   return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  Letterfor_NameChange.getNewTranscript = function(user_id, app_date){
    var query = "select DISTINCT collegeId from Letterfor_NameChange where user_id = " + user_id + " AND updated_at > '" + app_date + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Letterfor_NameChange.deleteUserData = function(user_id){
    var query = "DELETE FROM Letterfor_NameChange WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }

  // Letterfor_NameChange.belongsTo(sequelize.models.User, {foreignKey: 'user_id'});
  // Letterfor_NameChange.hasOne(sequelize.models.Emailed_Docs, { foreignKey: 'transcript_id' });
  // Letterfor_NameChange.belongsTo(sequelize.models.Application, {foreignKey: 'app_id'});
  
  return Letterfor_NameChange;
};
