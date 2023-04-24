"use strict";

module.exports = function(sequelize, DataTypes) {
    var Iptracker = sequelize.define("Iptracker",{
      email :  DataTypes.TEXT,
        opened_loc : DataTypes.TEXT,
        ip_address :  DataTypes.TEXT,
    });

    Iptracker.associate = (models) => {
        
        Iptracker.belongsTo(models.Application, {foreignKey: 'app_id'});
        Iptracker.belongsTo(models.Emailed_Docs, {foreignKey: 'emaildoc_id'});

      };
     
    return Iptracker;
}