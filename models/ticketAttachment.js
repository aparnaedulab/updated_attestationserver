"use strict";


module.exports = function(sequelize, DataTypes) {
    var TicketAttachment = sequelize.define("TicketAttachment", {
        file_name: DataTypes.TEXT,
        ticket_id : DataTypes.INTEGER(100),
        owner_id :  DataTypes.STRING(100)
    });
    
  	var User = sequelize.define('User', {});
	//var College = sequelize.define('College', {});
	TicketAttachment.belongsTo(sequelize.models.User, {foreignKey: 'user_id'});
	
	return TicketAttachment;	
};