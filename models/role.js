"use strict";

module.exports = function(sequelize, DataTypes) {
	var Role = sequelize.define("Role", {
		dashboard: {
	      type: DataTypes.BOOLEAN,
	      allowNull: false,
	      defaultValue: false
	    },
	  
		profile: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        studentManagement: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        SubAdminDashboard: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
         
        adminTotal: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        adminPending: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        adminVerified: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
         
        adminSigned: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        adminPayment: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        adminDashboard: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        adminReport: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        help: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
		 
		adminemailed :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		collegeManagement :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		AdminDash :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		adminWesApp :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
	},
	{
		classMethods: {
			
		}
	});
	
    Role.associate = (models) => {
        Role.belongsTo(models.User, {foreignKey: 'userid'});
      };

	return Role;
};