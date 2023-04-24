"use strict";

module.exports = function(sequelize, DataTypes) {
	var Split_Sheets_Data = sequelize.define("Split_Sheets_Data", {
		reference_no : DataTypes.STRING(255),
		edu_share : DataTypes.STRING(255),
		uni_share : DataTypes.STRING(255),
		ccavenue_share : DataTypes.STRING(255),
		stu_name : DataTypes.STRING(255),
		stu_email : DataTypes.STRING(255),
		updated_status : DataTypes.STRING(255),
	});

	return Split_Sheets_Data;
};