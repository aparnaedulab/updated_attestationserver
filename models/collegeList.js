"use strict";

module.exports = function(sequelize, DataTypes) {
  var collegeList = sequelize.define("College", {
    name: DataTypes.STRING(100),
    emailId: DataTypes.STRING(100),
    contactNo: DataTypes.STRING(17),
    contactPerson : DataTypes.STRING(100),
    alternateContactPerson : DataTypes.STRING(100),
    alternateContactNo : DataTypes.STRING(17),
    alternateEmailId : DataTypes.STRING(100),
    status  : DataTypes.ENUM('active', 'inactive'),
    type : DataTypes.STRING(20)
});

collegeList.getColleges = function(){
  var query = "SELECT * FROM College ORDER BY name";
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

collegeList.getAllColleges = function(limit,offset){
  var limitOffset = '';
  if (limit != null && offset != null) {
    limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
  }
  var query = "SELECT * FROM College ORDER BY name";
  query += limitOffset;
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

return collegeList;
};