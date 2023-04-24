"use strict";

module.exports = function(sequelize, DataTypes) {
	var Courier_Sheets_Data = sequelize.define("Courier_Sheets_Data", {
		barcode : DataTypes.STRING(255),
		ref : DataTypes.STRING(255),
		city : DataTypes.STRING(255),
		pincode : DataTypes.STRING(255),
		name : DataTypes.STRING(255),
		address : DataTypes.STRING(255),
		email : DataTypes.STRING(255),
		mobile : DataTypes.STRING(255),
		sender_mobile : DataTypes.STRING(255),
		weight : DataTypes.STRING(255),
		application_id : DataTypes.STRING(255),
		updated_status : DataTypes.STRING(255),
	});

	return Courier_Sheets_Data;
};