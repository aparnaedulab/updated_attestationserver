"use strict";
module.exports = function(sequelize, DataTypes) {
  var Applicant_Marksheet = sequelize.define("Applicant_Marksheet", {
    name: DataTypes.TEXT,
    file_name: DataTypes.TEXT,
    type: DataTypes.STRING(30),
    lock_transcript: {
      type: DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: 0
    },
    user_id :  DataTypes.STRING(30),
    marksheet_for : DataTypes.ENUM('Degree', 'Masters'),
    collegeId :  DataTypes.STRING(30),
    emailMsgId : DataTypes.TEXT,
    collegeEmailStatus : DataTypes.STRING(20),
    upload_step: {
      type: DataTypes.ENUM('default', 'requested','changed'),
      allowNull: false,
      defaultValue: 'default'
    },
    errata_msg :  DataTypes.STRING(500),
    reason : DataTypes.STRING(500),
    app_id :  DataTypes.STRING(30),
    source :  DataTypes.STRING(100),
    applied_for_degree : DataTypes.STRING(100)
  });

  return Applicant_Marksheet;
};