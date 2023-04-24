"use strict";

module.exports = function(sequelize, DataTypes) {
  var userMarkList = sequelize.define("userMarkList", {
    name: DataTypes.STRING(30),
  	file_name: DataTypes.TEXT,
    type: DataTypes.STRING(30),
    faculty: DataTypes.STRING(100),
    course_faculty: DataTypes.STRING(255),
    patteren: DataTypes.STRING(30),
    enrollment_number: DataTypes.STRING(255), 
    lock_marklist: {
      type: DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: 0
    },
    college_stream_type:{
      type:DataTypes.BOOLEAN(),
      allowNull:false,
      defaultValue:0
    },
    upload_step: {
      type: DataTypes.ENUM('default', 'requested','changed'),
      allowNull: false,
      defaultValue: 'default'
    },
    previous_data:{
      type:DataTypes.BOOLEAN(),
      allowNull:false,
      defaultValue:0
    },
    source : DataTypes.STRING()
  });

  userMarkList.getdistinctClg = function(userId){
    var query="SELECT DISTINCT u.collegeId,c.name,u.faculty,u.type, u.user_id FROM userMarkList as u join College as c on c.id = u.collegeId WHERE u.user_id = "+userId;
   return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  userMarkList.getCollegewiseStudents = function(collegeId){
    var query = "SELECT DISTINCT user_id FROM userMarkList WHERE collegeId = " + collegeId;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  userMarkList.setAppIds = function(user_id, app_id){
    var query = "Update userMarkList set app_id = '" + app_id + "' where app_id is null and user_id =" + user_id;// WHERE created_at between '" + condition + "'";
   return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  userMarkList.updatePrevData = function(user_id,value){
    var query = "Update userMarkList set previous_data = " + value + " where user_id =" + user_id;// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  userMarkList.deleteUserData = function(user_id){
    var query = "DELETE FROM userMarkList WHERE user_id = " + user_id;
   return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }

  userMarkList.belongsTo(sequelize.models.User, {foreignKey: 'user_id'});
  userMarkList.belongsTo(sequelize.models.College, {foreignKey: 'collegeId'});
  userMarkList.belongsTo(sequelize.models.Application, {foreignKey: 'app_id'});

//   userMarkList.hasOne(sequelize.models.Emailed_Docs, { foreignKey: 'transcript_id' });
  
  return userMarkList;
};
