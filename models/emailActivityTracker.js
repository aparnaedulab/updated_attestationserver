"use strict";

module.exports = function(sequelize, DataTypes) {
  var moment = require('moment');
  var EmailActivityTracker = sequelize.define("EmailActivityTracker",{
    email: DataTypes.STRING(300),
    subject: DataTypes.TEXT,
    status: DataTypes.TEXT,
    opens_count: DataTypes.STRING(100),
    clicks_count: DataTypes.STRING(100),
    x_msg_id: DataTypes.TEXT,
    sg_msg_id: DataTypes.TEXT,
    sent_on:DataTypes.TEXT,
    last_event_time: DataTypes.TEXT
  },{
  	
  	classMethods: {

  	}
  	
  });


  EmailActivityTracker.getAppliUnopenMail=function(user_status){
    var query='';
    var currentDate = moment().format('YYYY-MM-DD');
    var thirtyDate = moment().subtract(30,'d').format('YYYY-MM-DD')
    var seventeenDay = moment().subtract(17,'d').format('YYYY-MM-DD')
    //query += 'SELECT * FROM  `EmailActivityTracker` WHERE opens_count =  0 AND subject LIKE "%'+send+'%"' ;
    query += "SELECT * FROM  `EmailActivityTracker` WHERE opens_count =  0 AND subject LIKE '%Official Record%' AND created_at between '"+thirtyDate+"' "+" AND '"+currentDate+"'"  ;
   // query += "SELECT * FROM  `EmailActivityTracker` WHERE opens_count =  0 AND subject LIKE '%Sending attested%' AND created_at LIKE '%"+thirtyDate+"%' "
   return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
  };

  EmailActivityTracker.getAllApplicationMail=function(user_status){
    var query='';
    //query += 'SELECT * FROM  `EmailActivityTracker` WHERE opens_count =  0 AND subject LIKE "%'+send+'%"' ;
    query += "SELECT * FROM  `EmailActivityTracker` WHERE  subject LIKE '%Official Record%' "  ;
   // query += "SELECT * FROM  `EmailActivityTracker` WHERE opens_count =  0 AND subject LIKE '%Sending attested%' AND created_at LIKE '%"+thirtyDate+"%' "
  return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
  };
  

  EmailActivityTracker.getEmailData = function(email,name,surname){
    var query='';
    query += "SELECT * FROM EmailActivityTracker WHERE last_event_time = ( " 
    query += "SELECT max(last_event_time) FROM EmailActivityTracker ";
    query += " WHERE email = '" + email;
    query += "' AND SUBJECT = 'Official Record of  " + name + " " + surname + "')";
    return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
  };

    return EmailActivityTracker;
};