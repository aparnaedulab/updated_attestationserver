const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  var InstituteDetails = sequelize.define('InstituteDetails', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    referenceNo: {
      type: DataTypes.STRING(100)
    },
    name: {
      type: DataTypes.TEXT
    },
    address: {
      type: DataTypes.TEXT
    },
    student_address:{
      type: DataTypes.TEXT
    },
    email:{
      type: DataTypes.STRING(50)
    },
    deliveryOption:{
      type : DataTypes.STRING(50)
    },
    deliveryMode : {
      type : DataTypes.STRING(50)
    },
    type:{
      type: DataTypes.STRING(50)
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    user_id_byAgent: {
      type: DataTypes.INTEGER
    },
    app_id : {
      type : DataTypes.TEXT
    }
    
  }, {
    sequelize,
    tableName: 'InstituteDetails',
    createdAt : 'createdAt',
    updatedAt : 'updatedAt',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  InstituteDetails.setAppId = function(user_id,app_id){
    var query = "UPDATE InstituteDetails SET app_id = " + app_id + " WHERE app_id = null AND user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  InstituteDetails.getDeliveryTypeModeWiseAppCount = function(source_from,type,mode){
    var query = "SELECT count( DISTINCT(app.id) ) AS app_count from Application as app";
    query += " JOIN User AS usr  ON app.user_id = usr.id";
    query += " JOIN InstituteDetails AS inst ON inst.user_id = usr.id "
    query += " WHERE app.source_from = '" + source_from + "' AND inst.deliveryOption = '" + type + "' ";
    query += " AND inst.deliveryMode = '" + mode + "'";
    console.log("query == " + query);
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  
  return InstituteDetails;

};
