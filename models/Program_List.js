"use strict";
module.exports = function(sequelize, DataTypes) {
    var Program_List = sequelize.define("Program_List", {
        college_code : DataTypes.STRING(20),
        college_name : DataTypes.STRING(500),
        college_address : DataTypes.STRING(500),
        course_code : DataTypes.STRING(20),
        programme_pattern : DataTypes.STRING(250),
        part_name : DataTypes.STRING(100),
        term_name : DataTypes.STRING(100),
        year: DataTypes.STRING(20),
        course_short_form: DataTypes.STRING(255),
        college_short_form: DataTypes.STRING(500),
        college_status  : DataTypes.ENUM('active', 'inactive'),
        course_status  : DataTypes.ENUM('active', 'inactive'),
        emailId: DataTypes.STRING(100),
        contactNo: DataTypes.STRING(30),
        contactPerson : DataTypes.STRING(100),
        alternateContactPerson : DataTypes.STRING(100),
        alternateContactNo : DataTypes.STRING(30),
        alternateEmailId : DataTypes.STRING(100),
        course_name : DataTypes.STRING(500),
        duration : DataTypes.STRING(20),
        degree_type : DataTypes.STRING(100),
        faculty : DataTypes.STRING(255),
        student_status :DataTypes.STRING(255),
        new_course_faculty : DataTypes.STRING(255),
    }, {
        sequelize,
        tableName: 'Program_List',
        timestamps: true,
        createdAt : 'created_at',
        updatedAt :  'updated_at',
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
    Program_List.getCollegeName = function(){
        // var query = "select DISTINCT college_name , college_address, college_short_form, college_status, college_code, emailId, contactNo, contactPerson, alternateContactPerson, alternateContactNo, alternateEmailId from Program_List ";
        var query = "select DISTINCT college_name , college_address, college_short_form, college_status, college_code from Program_List ";
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };
    Program_List.getalldata = function(){
        var query = "select * from Program_List ";
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };
    Program_List.getCollegeCourse = function(source_from){
        if(source_from == 'guattestation' || source_from == 'gumoi'){
           
        }else if(source_from == 'gumigration'){
            var query = "select DISTINCT(aed.CollegeName) as college_name, COUNT(app.id) as count from Applicant_Educational_Details as aed JOIN Application as app on app.user_id = aed.user_id ";
            query += "WHERE app.source_from = 'gumigration' GROUP BY aed.CollegeName";
        }else if(source_from == 'pdc'){
            var query = "select DISTINCT(ed.college) as college_name, COUNT(app.id) as count from edu_details as ed JOIN Application as app on app.user_id = ed.user_id ";
            query += "WHERE app.source_from = 'pdc' and ed.source = 'pdc' GROUP BY ed.college";
        }else if(source_from == 'guconvocation'){
            var query = "select COUNT(ed.college) as college_name, COUNT(app.id) as count from edu_details as ed JOIN Application as app on app.user_id = ed.user_id ";
            query += "WHERE app.source_from = 'guconvocation' and ed.source = 'guconvocation' GROUP BY ed.college";
        }
        console.log("query==>",query);
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    }
    Program_List.activeInactiveCollege = function(college_name, college_status){
        var query = 'Update Program_List set college_status = '+'"'+college_status+'"'+' where college_name= "'+college_name+'"';
        return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
    };
    Program_List.updateCollege = function(college_name, college_code, college_Address, college_short_form){
        var query = 'Update Program_List set college_name = "'+college_name+'", college_code = "'+ college_code +'" , college_Address = "'+ college_Address +'" , college_short_form = "'+ college_short_form +'" where college_name = "'+ college_name +'"';
        //var query = "Update Program_List set college_name = '" + college_name + "', college_code = '" + college_code + "', college_Address = '" + college_Address + "' where college_name = '" + college_name +"'";
        return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
    };
    Program_List.updateAllCourse = function(college_name, course_code, emailId, contactNo, contactPerson, alternateEmailId, alternateContactPerson, alternateContactNo, replacestring){
        var query = 'Update Program_List set emailId = "' + emailId + '" , contactNo = "'+ contactNo +'" , contactPerson = "'+ contactPerson +'", alternateEmailId = "'+ alternateEmailId +'", alternateContactPerson = "'+ alternateContactPerson + '", alternateContactNo ="'+ alternateContactNo + '" where college_name = "'+college_name+'" and course_code = "'+course_code+'" and course_code IS not null';
        //var query = "Update Program_List set emailId = '" + emailId + "', contactNo = '" + contactNo + "', contactPerson = '" + contactPerson + "', alternateEmailId = '" + alternateEmailId + "', alternateContactPerson = '" + alternateContactPerson + "', alternateContactNo = '" + alternateContactNo + "' where college_name = '"+college_name+"' and course_code = '"+course_code+"' and course_code IS not null";
        //console.log("query=======>"+query);
        return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
    };
    Program_List.getCourseList = function(college_name){
        var query = 'select DISTINCT course_name from Program_List where college_name Like "%'+college_name+'%" ';
        console.log("query====>"+query);
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };
    Program_List.getPatterndata = function(college_name,course){
        var query = 'select term_name, year from Program_List where college_name Like "%'+college_name+'%" and course_name like "%'+course+'%"';
        console.log("query====>"+query);
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };
    Program_List.getCollegeNameAdmin = function(){
        var query = "select DISTINCT college_name , college_address, college_status, college_code from Program_List ";
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };
    Program_List.getCollegeEmailList = function(){
        var query = "SELECT DISTINCT emailId,alternateEmailId FROM Program_List where alternateEmailId is not null and emailId is not null";
        //console.log("query=====>"+query);
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };

    Program_List.getCollegeCourse = function(){
        var query = "select * from User";
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    }
    
    return Program_List;
};