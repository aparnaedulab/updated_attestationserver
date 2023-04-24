"use strict";

module.exports = function(sequelize, DataTypes) {
	var Board_Details = sequelize.define("Board_Details", {
		board_name: DataTypes.STRING(100),
		sss_name: DataTypes.STRING(100),
		hsc_name: DataTypes.STRING(100)
	}, {
        timestamps: false
    });

	Board_Details.getalldata = function(){
		var query = "select * from Board_Details ";
		return sequelize.query(query, {
			type: sequelize.QueryTypes.SELECT
		});
	};
        // Board_Details.getPreferenceIntakeAnotherColleges =  function(preferences) {
		// 	var pref = 0;
		// 	var query = "select c.name as college_name,c.short_form,i.id,i.intake_for_id,i.seats from Intake as i join College_Course as cc on cc.id = i.intake_for_id join College as c on c.id = cc.college_id where cc.status='active' AND i.intake_for_id in (";
		// 	for(pref = 0 ;pref < preferences.length - 1; pref++){
		// 		query += "'" + preferences[pref] +"',";
		// 	}
		// 	query += "'" + preferences[pref] +"')"; 
		// 	return sequelize.query(query, {
		// 		type: sequelize.QueryTypes.SELECT
		// 	});
		// };
			
	return Board_Details;
};