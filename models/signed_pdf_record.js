"use strict";

module.exports = function(sequelize, DataTypes) {
    var signed_pdf_record = sequelize.define("signed_pdf_record",{
      
        filename : DataTypes.STRING(150),

    });

    signed_pdf_record.associate = (models) => {
        signed_pdf_record.belongsTo(models.User_Transcript, {foreignKey: 'transcript_id'});
        signed_pdf_record.belongsTo(models.Application, {foreignKey: 'app_id'});
        signed_pdf_record.belongsTo(models.User, {foreignKey: 'user_id'});
        signed_pdf_record.belongsTo(models.userMarkList, {foreignKey: 'marksheet_id'});
    };
     
    return signed_pdf_record;
}