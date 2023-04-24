"use strict";

module.exports = function(sequelize, DataTypes) {
  var appliedForDetails = sequelize.define("Applied_For_Details", {
    applying_for: DataTypes.TEXT,
    attestedfor: DataTypes.STRING(),
    instructionalField : DataTypes.BOOLEAN(),
    curriculum : DataTypes.BOOLEAN(),
    educationalDetails : DataTypes.BOOLEAN(),
    gradToPer : DataTypes.BOOLEAN(),
    current_year : DataTypes.BOOLEAN(),
    diplomaHolder : DataTypes.BOOLEAN(),
    affiliation : DataTypes.BOOLEAN(),
    CompetencyLetter : DataTypes.BOOLEAN(),
    LetterforNameChange : DataTypes.BOOLEAN(),
    enrollment_number : DataTypes.JSON(),
    app_id : DataTypes.STRING(),
    previous_data : DataTypes.JSON(),
    source : DataTypes.STRING()
  });


  appliedForDetails.deleteUserData = function(user_id){
    var query = "DELETE FROM Applied_For_Details WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }
  appliedForDetails.getAttestationFor = function(user_id){
    var query = "SELECT * FROM Applied_For_Details WHERE user_id = " + user_id + " and app_id is null and source like '%guattestation%'" ;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }


  appliedForDetails.associate = (models) => {
    appliedForDetails.belongsTo(models.User, {foreignKey: 'user_id'});
    appliedForDetails.belongsTo(models.Application, {foreignKey: 'app_id'});
};
  
  return appliedForDetails;
};
