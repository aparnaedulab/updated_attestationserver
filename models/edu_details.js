const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    var edu_details   = sequelize.define("edu_details",{
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        applying_for: {
            type: DataTypes.STRING(255),

        },
        enrollment_number: {
            type:  DataTypes.INTEGER,
        },
        user_id: {
            type: DataTypes.INTEGER,
        },
        PassingYear: {
            type: DataTypes.INTEGER,
        },
        app_id: {
            type: DataTypes.INTEGER,
        },
        stream: {
            type: DataTypes.STRING(255),
        },
        seat_no: {
            type: DataTypes.INTEGER,
        },
        passing_month: {
            type: DataTypes.STRING(255),
        },
        result: {
            type: DataTypes.STRING(255),
        },
        convocation: {
            type: DataTypes.STRING(255),
        },
        exam_pattern: {
            type: DataTypes.STRING(255),
        },
        college: {
            type: DataTypes.STRING(255),
        },
        subject1: {
            type: DataTypes.STRING(255),
        },
        aadhar_no: {
        type: DataTypes.INTEGER,
        },


        degree : {
            type : DataTypes.STRING(255)
        },
        edu_errata : {
            type:DataTypes.BOOLEAN()
        },
        marksheet_errata : {
            type:DataTypes.BOOLEAN()
        },
        photograph_errata : {
            type:DataTypes.BOOLEAN()
        },
        reason: {
            type: DataTypes.STRING(255),

        },   source: {
            type: DataTypes.STRING(255),

        },
        errata_msg:{
            type: DataTypes.STRING(255),

        }
    },{
        sequelize,
        tableName: 'edu_details',
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

    edu_details.deleteUserData = function(user_id){
        var query = "DELETE FROM edu_details WHERE user_id = " + user_id;
        return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
    }

    return edu_details;

};
