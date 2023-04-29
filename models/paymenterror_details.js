"use strict";

module.exports = function(sequelize, DataTypes) {
  var paymenterror_details = sequelize.define("paymenterror_details", {
    
    email : DataTypes.TEXT,
    file_name: DataTypes.TEXT,
    transaction_id: DataTypes.STRING(100),
    date :  DataTypes.STRING(100), 
    bank_refno :  DataTypes.STRING(100),
    order_id :  DataTypes.STRING(100),
    user_id : DataTypes.INTEGER,
    name : DataTypes.STRING,
    amount : DataTypes.STRING(100),
    note : DataTypes.STRING(100)

   

  });


  // paymenterror_details.belongsTo(sequelize.models.User, {foreignKey: 'user_id'});
  // paymenterror_details.hasOne(sequelize.models.Emailed_Docs, { foreignKey: 'transcript_id' });
  // paymenterror_details.belongsTo(sequelize.models.Application, {foreignKey: 'app_id'});
  
  return paymenterror_details;
};
