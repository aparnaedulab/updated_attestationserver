"use strict";

module.exports = function(sequelize, DataTypes) {
  var Wes_Form = sequelize.define("Wes_Form", {
    currentaddress: DataTypes.STRING(100),
    state: DataTypes.STRING(100),
    city: DataTypes.STRING(100),
    postal_code: DataTypes.STRING(100),
    dob: DataTypes.STRING(100),
    institute_name: DataTypes.STRING(100),
    datefrom: DataTypes.STRING(100),
    dateto: DataTypes.STRING(100),
    degree: DataTypes.STRING(100),
    yearaward: DataTypes.STRING(100),
    major: DataTypes.STRING(100),
    sturolno: DataTypes.STRING(100),
    file_name: DataTypes.STRING(100),
    user_id: DataTypes.INTEGER
  });




//   Wes_Form.belongsTo(sequelize.models.Application, {foreignKey: 'app_id'});
//   Wes_Form.associate = (models) => {
//     Wes_Form.belongsTo(models.User, {foreignKey: 'user_id'});
//   };

  

return Wes_Form;
};