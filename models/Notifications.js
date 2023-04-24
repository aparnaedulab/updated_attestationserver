"use strict";

module.exports = function(sequelize, DataTypes) {
	var Notifications = sequelize.define("Notifications", {
        message: DataTypes.STRING(500),
        read: DataTypes.ENUM('true', 'false'),
		created_at: DataTypes.DATE,
        delete_notification : DataTypes.ENUM('true', 'false'),
        action: DataTypes.STRING(50),
        flag: DataTypes.ENUM('student', 'admin', 'sub-admin'),
    },
   	{
		timestamps: true
    });

    Notifications.UserNotifications = function(App_ID) {
        
      var query = "select a.user_id, a.tracker, a.`status`, n.message, n.`read`, n.delete_notification, n.created_at FROM notifications as n JOIN application as a on a.user_id = n.user_id where a.`status`='new' and a.id ="+ App_ID;
      return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
    };

    Notifications.associate = (models) => {
    Notifications.belongsTo(models.User, {foreignKey: 'user_id'});
    };
	return Notifications;
};
