"use strict";

module.exports = function(sequelize, DataTypes) {


	var Activitytracker = sequelize.define("Activitytracker", {
		user_id: DataTypes.STRING(10),
		activity: DataTypes.STRING(500),
		data: DataTypes.STRING(500),
		application_id: DataTypes.STRING(10),
		created_at: DataTypes.DATE,
		source: DataTypes.STRING(50),
	});

	Activitytracker.getactivitySearchResults= function(filters,limit,offset){  
		var where_student_name = '',
     		where_application_email = '',
      		where_application_date = '',
      		where_application_data = '';
   		var limitOffset = '';
   		if (filters.length > 0) {
    		filters.forEach(function(filter) {
        		if (filter.name == "name") {
          			where_student_name = filter.value;
        		}  else if (filter.name == "date") {
          			where_application_date = " AND sa.created_at like '%" + filter.value + "%' ";
        		} else if (filter.name == "email") {
          			where_application_email = " AND usr.email like '%" + filter.value  + "%' ";
        		} else if(filter.name == 'data'){
          			where_application_data ="AND sa.data like '%" + filter.value +"%' ";
        		}
    		});
		}
  		if (limit != null && offset != null) {
    		limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
  		}
  		var query = 'SELECT sa.created_at as created_at, usr.email as username, sa.activity as action, sa.data as data';
		query += ' FROM Activitytracker sa ';
  		query += 'JOIN User as usr on usr.id = sa.user_id ';
  		query += where_application_data;
  		query += where_application_email;
  		query += where_application_date;
  		query += 'ORDER BY sa.created_at DESC';
  		query += limitOffset;
  		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	};

	Activitytracker.getsuperactivitySearchResults= function(filters,limit,offset){  
		var where_student_name = '',
     		where_application_email = '',
      		where_application_date = '',
      		where_application_data = '';
   		var limitOffset = '';
   		if (filters.length > 0) {
    		filters.forEach(function(filter) {
        		if (filter.name == "name") {
          			where_student_name = filter.value;
        		}  else if (filter.name == "date") {
          			where_application_date = " AND sa.created_at like '%" + filter.value + "%' ";
        		} else if (filter.name == "email") {
          			where_application_email = " AND usr.email like '%" + filter.value  + "%' ";
        		} else if(filter.name == 'data'){
          			where_application_data ="AND sa.data like '%" + filter.value +"%' ";
        		}
    		});
		}
  		if (limit != null && offset != null) {
    		limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
  		}
  		var query = 'SELECT sa.created_at as created_at, usr.email as username, sa.activity as action, sa.data as data, sa.source as source_from';
		query += ' FROM Activitytracker sa ';
  		query += 'JOIN User as usr on usr.id = sa.user_id ';
  		query += where_application_data;
  		query += where_application_email;
  		query += where_application_date;
  		query += 'ORDER BY sa.created_at DESC';
  		query += limitOffset;
  		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	};



	return Activitytracker;
};

