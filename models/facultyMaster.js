"use strict";

module.exports = function(sequelize, DataTypes) {
  var facultymaster = sequelize.define("facultymaster", {
    year : DataTypes.STRING(3),
    faculty: DataTypes.STRING(30),
    degree : DataTypes.STRING(255)
  });

  facultymaster.getfaculty = function(){
    var query = "SELECT * FROM facultymaster ";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  
  return facultymaster;
};