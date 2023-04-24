"use strict";

module.exports = function(sequelize, DataTypes) {
  var Applicant_Educational_Details = sequelize.define("Applicant_Educational_Details", {
    CollegeName:DataTypes.STRING(255),
    CollegeAddress:DataTypes.STRING(255),
    CourseName:DataTypes.STRING(255),
    CollegeYear:DataTypes.STRING(255),
    Semester:DataTypes.STRING(50),
    Month:DataTypes.STRING(50),
    Year :DataTypes.STRING(50),
    OverAllGrade :DataTypes.STRING(10),
    rollNo:DataTypes.STRING(255),
    user_id: DataTypes.STRING(30),
    medium_instruction : DataTypes.STRING(20),
    PartName : DataTypes.STRING(50),
    otherUniversity : DataTypes.STRING(50),
    otherCollege : DataTypes.STRING(150),
    otherCourse : DataTypes.STRING(50),
    pattern : DataTypes.STRING(10),
    result : DataTypes.STRING(25),
    //Attempt :DataTypes.STRING(10),
    // Subject_First: DataTypes.STRING(255),
    // grade_First: DataTypes.STRING(10),
    // Subject_Second: DataTypes.STRING(255),
    // grade_Second: DataTypes.STRING(10),
    // Subject_Third: DataTypes.STRING(255),
    // grade_Third: DataTypes.STRING(10),
    // Subject_Fourth: DataTypes.STRING(255),
    // grade_Fourth: DataTypes.STRING(10),
    // Subject_Fifth: DataTypes.STRING(255),
    // grade_Fifth: DataTypes.STRING(10),
    // Subject_Six: DataTypes.STRING(255),
    // grade_Six : DataTypes.STRING(10),
    // Subject_Seventh : DataTypes.STRING(255),
    // grade_Seventh : DataTypes.STRING(10),
    // Subject_Eighth : DataTypes.STRING(255),
    // grade_Eighth : DataTypes.STRING(10),
    // Subject_Ninth : DataTypes.STRING(255),
    // grade_Ninth : DataTypes.STRING(10),
    // Subject_Tenth : DataTypes.STRING(255),
    // grade_Tenth : DataTypes.STRING(10),
    // marks_out_First : DataTypes.STRING(20),
    // marks_out_Second : DataTypes.STRING(20),
    // marks_out_Third : DataTypes.STRING(20),
    // marks_out_Fourth : DataTypes.STRING(20),
    // marks_out_Fifth : DataTypes.STRING(20),
    // marks_out_Six : DataTypes.STRING(20),
    // marks_out_Seventh : DataTypes.STRING(20),
    // marks_out_Eighth : DataTypes.STRING(20),
    // marks_out_Ninth : DataTypes.STRING(20),
    // marks_out_Tenth : DataTypes.STRING(20),
    // marks_obt_First : DataTypes.STRING(20),
    // marks_obt_Second : DataTypes.STRING(20),
    // marks_obt_Third : DataTypes.STRING(20),
    // marks_obt_Fourth : DataTypes.STRING(20),
    // marks_obt_Fifth : DataTypes.STRING(20),
    // marks_obt_Six : DataTypes.STRING(20),
    // marks_obt_Seventh : DataTypes.STRING(20),
    // marks_obt_Eighth : DataTypes.STRING(20),
    // marks_obt_Ninth : DataTypes.STRING(20),
    // marks_obt_Tenth : DataTypes.STRING(20),
    // lecture_hour_First : DataTypes.STRING(20),
    // lecture_hour_Second : DataTypes.STRING(20),
    // lecture_hour_Third : DataTypes.STRING(20),
    // lecture_hour_Fourth : DataTypes.STRING(20),
    // lecture_hour_Fifth : DataTypes.STRING(20),
    // lecture_hour_Six : DataTypes.STRING(20),
    // lecture_hour_Seventh : DataTypes.STRING(20),
    // lecture_hour_Eighth : DataTypes.STRING(20),
    // lecture_hour_Ninth : DataTypes.STRING(20),
    // lecture_hour_Tenth : DataTypes.STRING(20),
    // overall_marks_obt : DataTypes.STRING(20),
    // overall_marks_out : DataTypes.STRING(20),
    // overall_class : DataTypes.STRING(20),
    // total_weeks : DataTypes.STRING(20),
    // overall_gpa_sgpi : DataTypes.STRING(20),
    // grade_points_First : DataTypes.STRING(20),
    // grade_points_Second : DataTypes.STRING(20),
    // grade_points_Third : DataTypes.STRING(20),
    // grade_points_Fourth : DataTypes.STRING(20),
    // grade_points_Fifth : DataTypes.STRING(20),
    // grade_points_Six : DataTypes.STRING(20),
    // grade_points_Seventh : DataTypes.STRING(20),
    // grade_points_Eighth : DataTypes.STRING(20),
    // grade_points_Ninth : DataTypes.STRING(20),
    // grade_points_Tenth : DataTypes.STRING(20),
    // grade_credits_First : DataTypes.STRING(20),
    // grade_credits_Second : DataTypes.STRING(20),
    // grade_credits_Third : DataTypes.STRING(20),
    // grade_credits_Fourth : DataTypes.STRING(20),
    // grade_credits_Fifth : DataTypes.STRING(20),
    // grade_credits_Six : DataTypes.STRING(20),
    // grade_credits_Seventh : DataTypes.STRING(20),
    // grade_credits_Eighth : DataTypes.STRING(20),
    // grade_credits_Ninth : DataTypes.STRING(20),
    // grade_credits_Tenth : DataTypes.STRING(20),
    // practical_hour_First : DataTypes.STRING(20),
    // practical_hour_Second : DataTypes.STRING(20),
    // practical_hour_Third : DataTypes.STRING(20),
    // practical_hour_Fourth : DataTypes.STRING(20),
    // practical_hour_Fifth : DataTypes.STRING(20),
    // practical_hour_Six : DataTypes.STRING(20),
    // practical_hour_Seventh : DataTypes.STRING(20),
    // practical_hour_Eighth : DataTypes.STRING(20),
    // practical_hour_Ninth : DataTypes.STRING(20),
    // practical_hour_Tenth : DataTypes.STRING(20),
    // special_instruction : DataTypes.STRING(255),
    // final_grade_special_instruction : DataTypes.STRING(255),
  });

  Applicant_Educational_Details.getCourseName = function(user_id) {
    var query = "SELECT aed.CourseName as Course_full_name, aed.CollegeName, aed.Semester, aed.Year from Applicant_Educational_Details as aed ";
    // query += " Left Join Course as cour on cour.CourseShortForm = aed.CourseName "; , cour.CourseName as Course_full_name, cour.CourseShortForm, 
    //query += " Left Join Course as cour on cour.CourseName = aed.CourseName ";
    query += " WHERE aed.user_id ="+ user_id ;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Applicant_Educational_Details.coursewisestats = function(user_id) {
    var query = "SELECT GROUP_CONCAT(DISTINCT(c.CourseName)) as CourseName from Application as app ";
    query += " LEFT JOIN Applicant_Educational_Details as aed on aed.user_id = app.user_id ";
    query += " LEFT JOIN Course as c on c.CourseShortForm = aed.courseName ";
    query += " GROUP BY c.CourseShortForm, aed.user_id ";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Applicant_Educational_Details.getCheckDuplicate = function(name,fathername,surname,CollegeName,CourseName){
    var query = "Select u.id from User as u Join Applicant_Educational_Details as aed on aed.user_id = u.id ";
    query += "Left Join Application as app on app.user_id = u.id ";
    query += " where u.name = '"+name+"' and u.fathername = '"+fathername+"' and u.surname = '"+surname+"' and aed.CollegeName = '"+CollegeName+"' and aed.CourseName = '"+CourseName+"'";
    console.log("query",query)
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  return Applicant_Educational_Details;
};


