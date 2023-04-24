"use strict";

module.exports = function(sequelize, DataTypes) {
  var Educational_Details = sequelize.define("Educational_Details", {
    university_name: DataTypes.STRING(200),
    school_name: DataTypes.STRING(200),
    totalmarks: DataTypes.INTEGER(3),
    outofmarks: DataTypes.INTEGER(3),
    type: DataTypes.STRING(30),
  });




Educational_Details.associate = (models) => {
  Educational_Details.belongsTo(models.User, {foreignKey: 'user_id'});
};
  
  return Educational_Details;
};


