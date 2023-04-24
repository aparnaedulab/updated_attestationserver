"use strict";

const { DateRange } = require("moment-range");

module.exports = function(sequelize, DataTypes) {
  var User_Course_Enrollment_Detail_Attestation = sequelize.define("User_Course_Enrollment_Detail_Attestation", {
    enrollment_no: DataTypes.STRING(30),
    application_date: DataTypes.DATEONLY,
    application_id: {
      type: DataTypes.INTEGER,
  },
  user_id:{
    type: DataTypes.INTEGER,
  },
   barcode: DataTypes.STRING(30),
   inward : DataTypes.STRING(100),
   outward : DataTypes.STRING(100),
   type : DataTypes.STRING(100),
   source : DataTypes.STRING(100),
   degree_type : DataTypes.STRING(100),
  },{

    sequelize,
    tableName: 'User_Course_Enrollment_Detail_Attestation',
    timestamps: true,
    createdAt:"created_at",
    updatedAt:"updated_at",
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
  // },
  // {
  //   classMethods: {
    User_Course_Enrollment_Detail_Attestation.assigndata = function(user_id){
          var query='';
            query += " Select * from User_Course_Enrollment_Detail WHERE user_id="+user_id;
            query += " AND college_name!='null'";
 
            return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

          };
          User_Course_Enrollment_Detail_Attestation.getAlldata = function() {
        var query = 'Select * from User_Course_Enrollment_Detail';
        // 
        return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
        };
        User_Course_Enrollment_Detail_Attestation.getListLastData = function() {
          var query='';
          // var query = "SELECT DISTINCT TRIM(name) AS name, TRIM(LOWER(REPLACE(REPLACE(name,' ',''), '\t', ''))) as lowCourse FROM College_Course WHERE status='active' GROUP BY lowCourse ORDER BY REPLACE(lowCourse,'(','') asc";
          query +=" SELECT id , enrollment_no From User_Course_Enrollment_Detail_Attestation ";
          query +=" WHERE id=(SELECT MAX(id) FROM User_Course_Enrollment_Detail_Attestation)";
 
          // 
          return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
        };
  //       }
  // });

  // User_Course_Enrollment_Detail_Attestation.belongsTo(sequelize.models.User, {foreignKey: 'user_id'});
  // User_Course_Enrollment_Detail_Attestation.belongsTo(sequelize.models.Application, {foreignKey: 'application_id'});
  
  return User_Course_Enrollment_Detail_Attestation;
};
