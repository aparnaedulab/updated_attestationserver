"use strict";

module.exports = function(sequelize, DataTypes) {
  var UserEnrollmentDetail = sequelize.define("User_Enrollment_Detail", {
    enrollment_no: DataTypes.STRING(30),
    application_date: DataTypes.DATEONLY,
    user_id : DataTypes.INTEGER(11),
    application_id : DataTypes.INTEGER(11),
  });

  UserEnrollmentDetail.getAlldata = function() {
    var query = 'Select * from User_Enrollment_Detail';
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  UserEnrollmentDetail.getListLastData = function() {
    var query='';
    query +=" SELECT id , enrollment_no From User_Enrollment_Detail ";
    query +=" WHERE id=(SELECT MAX(id) FROM User_Enrollment_Detail)";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  return UserEnrollmentDetail;
};
