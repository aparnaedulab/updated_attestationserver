var jwtorig = require('jsonwebtoken');
var models  = require('./models');
var _ = require('lodash');
var cfg = require('./auth/config.js');
var path = require('path');
var root_path = path.dirname(require.main.filename);
var constant = require(root_path+'/config/constant');
var request = require('request');
var Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = {
	getUserInfo: function(req, res, next){
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            var token =req.headers.authorization.split(' ')[1];
            decoded = jwtorig.verify(token, cfg.jwtSecret);
            req.user_id = decoded.id;
            models.User.find({
                where:{
                    id : req.user_id
                }
            }).then(function(User){
                req.User = User;
                next();
             });
       
        }else{
            req.User = null;
            req.sendGuardianEmail = false; 
            //req.User_Guardian = User_Guardian;
            req.User_Guardian = null;
            next();
        }
      },

       getUserInfoForAdmin: function(req, res, next) {
        var errors = [];
        var filter = {};
        models.User.find(filter).then(function(user) {
            req.isLoggedIn = true;
            req.currentUser = user;
            req.isAuthorized = true;
            next();
                        
        });
    },

    getDegrees: function(req, res, next) {
        models.Degree.findAll({
            attributes: ['name']
        }).then(function(degrees) {
            req.degrees = degrees;
            next();
        });
    },

    getAllCourses: function(req,res,next){
        models.College_Course.getCourseList().then(function(courses){
            req.courses =courses;
            next();
        })
    },

    getAllCountries: function(req,res,next){
        models.Country.getCountryList().then(function(countries){
            req.countries =countries;
            next();
        })
    },

    getAllColleges: function(req,res,next){
        models.College.getCollegeList().then(function(colleges){
            req.colleges =colleges;
            next();
        })
    },

    getUserEducationalInfo: function(req, res, next){
        models.Applied_For_Details.find({
            where:{
                user_id : req.user_id,
                app_id : null,
                source : 'guattestation'
            }
        }).then(function(User){
            if(User){
                if(User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true){  
                    req.userEducational = 6;
                        next();
                }else if(User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 5;
                    next();
                }else if(User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.LetterforNameChange == true){
                    req.userEducational = 5;
                    next();
                }else if(User.educationalDetails == true && User.instructionalField == true && User.gradToPer == true && User.LetterforNameChange == true){
                    req.userEducational = 5;
                    next();
                }else if(User.educationalDetails == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true){
                    req.userEducational = 5;
                    next();
                }else if(User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true){
                    req.userEducational = 5;
                    next();
                }else if(User.curriculum == true && User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true && User.educationalDetails == true){
                    req.userEducational = 5;
                    next();
                }else if(User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true && User.educationalDetails == true && User.instructionalField == true){
                    req.userEducational = 5;
                    next();
                }
                else if((User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true)){
                     req.userEducational = 5;
                    next();
                }else if((User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true) || (User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.CompetencyLetter == true) || (User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.LetterforNameChange == true ) || (User.educationalDetails == true  && User.instructionalField == true && User.curriculum == true && User.affiliation == true && User.CompetencyLetter == true ) || (User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.CompetencyLetter == true && User.LetterforNameChange == true ) || (User.educationalDetails == true && User.instructionalField == true  && User.gradToPer == true && User.affiliation == true && User.CompetencyLetter == true) || (User.educationalDetails == true && User.instructionalField == true  && User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true) || (User.educationalDetails == true && User.instructionalField == true  && User.gradToPer == true && User.CompetencyLetter == true && User.LetterforNameChange == true) || (User.educationalDetails == true && User.curriculum == true  && User.gradToPer == true && User.affiliation == true && User.CompetencyLetter == true) || (User.educationalDetails == true && User.curriculum == true  && User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true) || (User.educationalDetails == true && User.curriculum == true  && User.gradToPer == true && User.CompetencyLetter == true && User.LetterforNameChange == true) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true && User.affiliation == true && User.CompetencyLetter == true) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true && User.CompetencyLetter == true && User.LetterforNameChange == true) || (User.instructionalField == true && User.curriculum == true  && User.affiliation == true && User.CompetencyLetter == true && User.LetterforNameChange == true)){
                    req.userEducational = 5;
                    next();
                }else if((User.instructionalField == true && User.gradToPer == true  && User.affiliation == true && User.CompetencyLetter == true && User.LetterforNameChange == true) || (User.educationalDetails == true && User.instructionalField == true  && User.affiliation == true && User.CompetencyLetter == true && User.LetterforNameChange == true)){
                    
                    req.userEducational = 5;
                    next();
                // }else if(User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true){
                //     console.log("set");
                //     req.userEducational = 5;
                //     next();
                }else if((User.CompetencyLetter == true && User.affiliation == true && User.gradToPer == true && User.curriculum == true && User.instructionalField == true)  || (User.CompetencyLetter == true && User.educationalDetails == true && User.gradToPer == true && User.curriculum == true && User.instructionalField == true) || (User.CompetencyLetter == true && User.curriculum == true && User.instructionalField == true && User.affiliation == true && User.educationalDetails == true ) || (User.CompetencyLetter == true  && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.educationalDetails == true) || (User.CompetencyLetter == true && User.affiliation == true && User.instructionalField == true && User.gradToPer == true && User.educationalDetails == true) || (User.affiliation == true && User.instructionalField == true  && User.curriculum == true && User.gradToPer == true && User.educationalDetails == true)){
                   console.log('in 5th')
                    req.userEducational =5;
                    next();
            
                }else if(User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true){
                    req.userEducational = 4;
                    next();
                }
            
                else if(User.educationalDetails == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 4;
                    next();
                }else if(User.educationalDetails == true && User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true){
                    req.userEducational = 4;
                    next();
                }else if(User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 4;
                    next();
                }else if(User.instructionalField == true && User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true){
                    req.userEducational = 4;
                    next();
                }else if(User.instructionalField == true && User.affiliation == true && User.LetterforNameChange == true && User.educationalDetails == true){
                    req.userEducational = 4;
                    next();
                }else if(User.instructionalField == true && User.LetterforNameChange == true && User.educationalDetails == true && User.instructionalField == true){
                    req.userEducational = 4;
                    next();
                }else if(User.curriculum == true && User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true){
                    req.userEducational = 4;
                    next();
                }else if(User.curriculum == true && User.affiliation == true && User.LetterforNameChange == true && User.educationalDetails == true){
                    req.userEducational = 4;
                    next();
                }else if(User.curriculum == true && User.LetterforNameChange == true && User.educationalDetails == true && User.instructionalField == true){
                    req.userEducational = 4;
                    next();
                }
                else if(User.curriculum == true && User.LetterforNameChange == true && User.educationalDetails == true && User.curriculum == true){
                    req.userEducational = 4;
                    next();
                }else if(User.curriculum == true && User.LetterforNameChange == true && User.educationalDetails == true && User.gradToPer == true){
                    req.userEducational = 4;
                    next();
                }else if(User.curriculum == true && User.LetterforNameChange == true && User.educationalDetails == true && User.affiliation == true){
                    req.userEducational = 4;
                    next();
                }
                else if((User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true ) || (User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.affiliation == true ) || (User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.CompetencyLetter == true ) || (User.educationalDetails == true  && User.instructionalField == true && User.curriculum == true && User.LetterforNameChange == true ) || (User.educationalDetails == true && User.instructionalField == true && User.gradToPer == true && User.affiliation == true )  || (User.educationalDetails == true && User.instructionalField == true  && User.gradToPer == true && User.CompetencyLetter == true ) || (User.educationalDetails == true && User.instructionalField == true  && User.gradToPer == true && User.LetterforNameChange == true ) || (User.educationalDetails == true && User.curriculum == true  && User.gradToPer == true && User.affiliation == true ) || (User.educationalDetails == true && User.curriculum == true  && User.gradToPer == true && User.CompetencyLetter == true) || (User.educationalDetails == true && User.curriculum == true  && User.gradToPer == true && User.LetterforNameChange == true ) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true && User.affiliation == true ) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true && User.CompetencyLetter == true ) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true && User.LetterforNameChange == true ) || (User.instructionalField == true && User.curriculum == true  && User.affiliation == true && User.CompetencyLetter == true ) || (User.instructionalField == true && User.curriculum == true  && User.affiliation == true && User.LetterforNameChange == true ) || (User.instructionalField == true && User.curriculum == true  && User.CompetencyLetter == true && User.LetterforNameChange == true ) || (User.curriculum == true && User.gradToPer == true  && User.affiliation == true && User.CompetencyLetter == true) || (User.curriculum == true && User.gradToPer == true  && User.affiliation == true && User.LetterforNameChange == true) || (User.curriculum == true && User.affiliation == true  && User.CompetencyLetter == true && User.LetterforNameChange == true)){
                    req.userEducational = 4;
                    next();
                }else if((User.CompetencyLetter == true && User.affiliation == true && User.gradToPer == true && User.curriculum == true )|| (User.CompetencyLetter == true && User.affiliation == true && User.gradToPer == true && User.instructionalField == true ) || (User.CompetencyLetter == true && User.affiliation == true &&  User.gradToPer == true && User.educationalDetails == true) || (User.affiliation == true && User.gradToPer == true && User.curriculum == true && User.instructionalField == true && User.educationalDetails == true ) || (User.gradToPer == true && User.curriculum == true && User.instructionalField == true  && User.CompetencyLetter == true)|| (User.curriculum == true && User.instructionalField == true && User.educationalDetails == true && User.CompetencyLetter == true)|| (User.curriculum == true && User.instructionalField == true && User.educationalDetails == true && User.affiliation == true) || (User.curriculum == true && User.instructionalField == true && User.educationalDetails == true && User.gradToPer == true)|| (User.instructionalField == true && User.educationalDetails == true && User.CompetencyLetter == true && User.affiliation == true)|| (User.instructionalField == true && User.educationalDetails == true && User.affiliation == true && User.gradToPer == true) || (User.educationalDetails == true && User.curriculum == true && User.gradToPer == true && User.CompetencyLetter == true) || (User.CompetencyLetter == true && User.instructionalField == true && User.affiliation == true &&  User.gradToPer == true ) || (User.CompetencyLetter == true && User.educationalDetails == true && User.curriculum == true && User.affiliation == true) || (User.CompetencyLetter == true && User.instructionalField == true && User.gradToPer == true && User.curriculum == true))
                {
                    req.userEducational =4;
                    next();
                }else if(User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true ){
                    req.userEducational = 4;
                    next();
                }else if(User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.affiliation == true ){
                    req.userEducational = 4;
                    next();
                }else if(User.educationalDetails == true && User.instructionalField == true && User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 4;
                    next();
                }else if(User.educationalDetails == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 4;
                    next();
                }else if(User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 4;
                    next();
                }
                else if(User.educationalDetails == true && User.instructionalField == true && User.curriculum == true){
                    req.userEducational = 3;
                    next();
                }
                
                else if(User.educationalDetails == true && User.curriculum == true && User.gradToPer == true){
                    req.userEducational = 3;
                    next();
                }
                else if(User.educationalDetails == true && User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 3;
                    next();
                }
                else if(User.educationalDetails == true && User.affiliation == true && User.LetterforNameChange == true){
                    req.userEducational = 3;
                    next();
                }
                else if(User.instructionalField == true && User.curriculum == true && User.gradToPer == true){
                    req.userEducational = 3;
                    next();
                }
                else if(User.instructionalField == true && User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 3;
                    next();
                }
                else if(User.instructionalField == true && User.affiliation == true && User.LetterforNameChange == true){
                    req.userEducational = 3;
                    next();
                }
                else if(User.curriculum == true && User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 3;
                    next();
                }
                else if(User.curriculum == true && User.affiliation == true && User.LetterforNameChange == true){
                    req.userEducational = 3;
                    next();
                }
                else if(User.gradToPer == true && User.affiliation == true && User.LetterforNameChange == true){
                    req.userEducational = 3;
                    next();
                }
                else if((User.educationalDetails == true && User.instructionalField == true && User.curriculum == true) || (User.educationalDetails == true && User.instructionalField == true && User.gradToPer == true) || (User.educationalDetails == true && User.instructionalField == true && User.affiliation == true) || (User.educationalDetails == true  && User.instructionalField == true && User.CompetencyLetter == true) || (User.educationalDetails == true && User.instructionalField == true && User.LetterforNameChange == true )  || (User.educationalDetails == true && User.gradToPer == true  && User.curriculum == true  ) || (User.educationalDetails == true && User.curriculum == true  && User.affiliation == true ) || (User.educationalDetails == true && User.curriculum == true  && User.CompetencyLetter == true  ) || (User.educationalDetails == true && User.curriculum == true  && User.LetterforNameChange == true ) || (User.educationalDetails == true && User.gradToPer == true  && User.affiliation == true  ) || (User.educationalDetails == true && User.gradToPer == true  && User.CompetencyLetter == true  ) || (User.educationalDetails == true && User.gradToPer == true  && User.LetterforNameChange == true ) || (User.educationalDetails == true && User.affiliation == true  && User.CompetencyLetter == true ) || (User.educationalDetails == true && User.affiliation == true  && User.LetterforNameChange == true  ) || (User.affiliation == true && User.CompetencyLetter == true  && User.LetterforNameChange == true  ) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true  ) || (User.instructionalField == true && User.curriculum == true  && User.affiliation == true ) || (User.instructionalField == true && User.curriculum == true  && User.CompetencyLetter == true ) || (User.instructionalField == true && User.CompetencyLetter == true  && User.LetterforNameChange == true) || (User.instructionalField == true && User.gradToPer == true  && User.affiliation == true) || (User.instructionalField == true && User.gradToPer == true  && User.CompetencyLetter == true) || (User.instructionalField == true && User.gradToPer == true  && User.LetterforNameChange == true) || (User.instructionalField == true && User.affiliation == true  && User.CompetencyLetter == true) || (User.instructionalField == true && User.affiliation == true  && User.LetterforNameChange == true) ){
                    req.userEducational = 3;
                    next();
                }else if((User.instructionalField == true && User.CompetencyLetter == true  && User.LetterforNameChange == true) || (User.curriculum == true && User.gradToPer == true  && User.affiliation == true) || (User.curriculum == true && User.gradToPer == true  && User.CompetencyLetter == true) || (User.curriculum == true && User.gradToPer == true  && User.LetterforNameChange == true) || (User.gradToPer == true && User.affiliation == true  && User.CompetencyLetter == true) || (User.gradToPer == true && User.affiliation == true  && User.LetterforNameChange == true) || (User.affiliation == true && User.CompetencyLetter == true  && User.LetterforNameChange == true)){
                    req.userEducational = 3;
                    next();
                }else if((User.CompetencyLetter == true && User.affiliation == true && User.gradToPer == true) || (User.CompetencyLetter == true && User.affiliation == true && User.curriculum == true )|| (User.CompetencyLetter== true && User.affiliation == true && User.instructionalField == true )|| (User.CompetencyLetter == true && User.affiliation == true && User.educationalDetails == true )|| (User.CompetencyLetter == true && User.gradToPer == true && User.curriculum == true )|| (User.CompetencyLetter == true && User.gradToPer == true && User.instructionalField == true )|| (User.CompetencyLetter == true && User.gradToPer == true && User.educationalDetails == true) || (User.CompetencyLetter == true && User.curriculum == true && User.instructionalField == true )|| (User.CompetencyLetter == true && User.curriculum == true && User.educationalDetails == true )||( User.CompetencyLetter ==true && User.instructionalField == true && User.educationalDetails == true)){
                    console.log("IN 3rd")
                req.userEducational =3;
                next();
                }else if(User.educationalDetails == true && User.instructionalField == true && User.curriculum == true){
                    req.userEducational = 3;
                    next();
                }else if(User.educationalDetails == true && User.instructionalField == true && User.gradToPer == true){
                    req.userEducational = 3;
                    next();
                }else if(User.educationalDetails == true && User.gradToPer == true && User.curriculum == true){
                    req.userEducational = 3;
                    next();
                }else if(User.gradToPer == true && User.instructionalField == true && User.curriculum == true){
                    req.userEducational = 3;
                    next();
                }else if(User.educationalDetails == true && User.instructionalField == true && User.affiliation == true){
                    req.userEducational = 3;
                    next();
                }else if(User.gradToPer == true && User.instructionalField == true && User.affiliation == true){
                    req.userEducational = 3;
                    next();
                }else if(User.educationalDetails == true && User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 3;
                    next();
                }else if(User.instructionalField == true && User.curriculum == true && User.affiliation == true){
                    req.userEducational = 3;
                    next();
                }else if(User.gradToPer == true && User.curriculum == true && User.affiliation == true){
                    req.userEducational = 3;
                    next();
                }else if(User.educationalDetails == true && User.curriculum == true && User.affiliation == true){
                    req.userEducational = 3;
                    next();
                }else if((User.educationalDetails == true && User.instructionalField == true ) || (User.educationalDetails == true && User.curriculum == true ) || (User.educationalDetails == true && User.gradToPer == true ) || (User.educationalDetails == true && User.affiliation == true ) || (User.educationalDetails == true && User.CompetencyLetter == true ) || (User.educationalDetails == true && User.LetterforNameChange == true ) || (User.instructionalField == true && User.curriculum == true ) || (User.instructionalField == true && User.gradToPer == true ) || (User.instructionalField == true && User.affiliation == true ) || (User.instructionalField == true && User.CompetencyLetter == true ) ||(User.instructionalField == true && User.LetterforNameChange == true ) || (User.curriculum == true && User.gradToPer == true ) || (User.curriculum == true && User.affiliation == true ) || (User.curriculum == true && User.CompetencyLetter == true ) || (User.curriculum == true && User.LetterforNameChange == true ) || (User.gradToPer == true && User.affiliation == true ) || (User.gradToPer == true && User.CompetencyLetter == true ) || (User.gradToPer == true && User.LetterforNameChange == true ) || (User.affiliation == true && User.CompetencyLetter == true ) || (User.affiliation == true && User.LetterforNameChange == true ) || (User.CompetencyLetter == true && User.LetterforNameChange == true )){
                    req.userEducational = 2;
                    next();
                }else if((User.CompetencyLetter == true && User.affiliation == true) || (User.CompetencyLetter == true && User.gradToPer == true) || (User.CompetencyLetter == true && User.curriculum == true) || (User.CompetencyLetter ==true && User.instructionalField == true) || (User.CompetencyLetter == true && User.educationalDetails == true) || (User.CompetencyLetter == true && User.gradToPer == true) || (User.affiliation === true && User.curriculum == true) || (User.affiliation == true && User.instructionalField == true) || (User.affiliation == true && User.educationalDetails == true )|| (User.gradToPer == true && User.curriculum== true) || (User.gradToPer == true && User.instructionalField == true) || (User.gradToPer == true && User.educationalDetails == true) || (User.curriculum == true && User.instructionalField == true) || (User.curriculum == true && User.educationalDetails == true) || (User.instructionalField == true && User.educationalDetails == true) || (User.CompetencyLetter == true && User.educationalDetails == true)){
                    console.log("in second")
                    req.userEducational = 2;
                    next();
                }else if(User.educationalDetails == true && User.gradToPer == true){
                    req.userEducational = 2;
                    next();
                }else if(User.gradToPer == true && User.instructionalField == true){
                    req.userEducational = 2;
                    next();
                }else if(User.gradToPer == true && User.curriculum == true){
                    req.userEducational = 2;
                    next();
                }else if(User.educationalDetails == true && User.instructionalField == true){
                    req.userEducational = 2;
                    next();
                }else if(User.educationalDetails == true && User.curriculum == true){
                    req.userEducational = 2;
                    next();
                }else if(User.instructionalField == true && User.curriculum == true){
                    req.userEducational = 2;
                    next();
                }else if(User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 2;
                    next();
                }else if(User.educationalDetails == true && User.affiliation == true){
                    req.userEducational = 2;
                    next();
                }else if(User.affiliation == true && User.curriculum == true){
                    req.userEducational = 2;
                    next();
                }else if(User.instructionalField == true && User.affiliation == true){
                    req.userEducational = 2;
                    next();
                }else if(User.educationalDetails == true && User.instructionalField == true){
                    req.userEducational = 2;
                    next();
                }
              
                else if(User.educationalDetails == true && User.curriculum == true){
                    req.userEducational = 2;
                    next();
                }
                else if(User.educationalDetails == true && User.gradToPer == true){
                    req.userEducational = 2;
                    next();
                }
                else if(User.educationalDetails == true && User.affiliation == true){
                    req.userEducational = 2;
                    next();
                }
                else if(User.educationalDetails == true && User.LetterforNameChange == true){
                    req.userEducational = 2;
                    next();
                }
                else if(User.instructionalField == true && User.curriculum == true){
                    req.userEducational = 2;
                    next();
                }
                else if(User.instructionalField == true && User.gradToPer == true){
                    req.userEducational = 2;
                    next();
                }
                else if(User.instructionalField == true && User.affiliation == true){
                    req.userEducational = 2;
                    next();
                }
                else if(User.instructionalField == true && User.LetterforNameChange == true){
                    req.userEducational = 2;
                    next();
                }
                else if(User.curriculum == true && User.gradToPer == true){
                    req.userEducational = 2;
                    next();
                }
                else if(User.gradToPer == true && User.affiliation == true){
                    req.userEducational = 2;
                    next();
                }
                else if(User.curriculum == true && User.affiliation == true){
                    req.userEducational = 2;
                    next();
                }
                else if(User.educationalDetails == true){
                    req.userEducational = 1;
                    next();
                }
                else if(User.instructionalField == true){
                    req.userEducational = 1;
                    next();
                } else if(User.curriculum == true){
                    req.userEducational = 1;
                    next();
                } else if(User.gradToPer == true){
                    req.userEducational = 1;
                    next();
                } else if(User.affiliation == true){
                    req.userEducational = 1;
                    next();
                } else if(User.LetterforNameChange == true){
                    req.userEducational = 1;
                    next();
                }
              
                else{
                req.userEducational = 0;
                next();
            }
            }
        });
    },


    getTranscriptDetails: function(req, res, next){
        if(req.query.editFlag == 'true'){
            models.Applied_For_Details.find({
                where:{
                    user_id : req.user_id,
                    app_id : req.query.app_id,
                    source : 'guattestation'
                }
            }).then(function(user_data){
                if(user_data){
                    if(user_data.attestedfor != null){
                        if(user_data.attestedfor.includes('transcript')){
                            models.User_Transcript.findAll({
                                where:{
                                    user_id : req.user_id,
                                    app_id : {
                                        [Op.ne] : null
                                    },source : 'guattestation' 
                                }
                            }).then(function(user_Transcripts){
                                
                                var userTranscripts = [];
                                if( user_Transcripts.length > 0){
                                    user_Transcripts.forEach(transcript=>{
                                        var app_idArr = transcript.app_id.split(",");
                                        app_idArr.forEach(app_id=>{
                                            if(app_id == req.query.app_id){
                                                userTranscripts.push(transcript);
                                            }
                                        })
                                    })
                                    if(userTranscripts.length > 0){
                                        var i = 0;
                                        if(user_data.applying_for == 'Bachelors'){
                                            userTranscripts.forEach(function (userTranscript) {
                                                if (userTranscript.type == 'Bachelors_transcripts' && userTranscript.name.includes('_Transcript Page')) {
                                                    i += 1;
                                                }
                                            })
                                            if(i>0){
                                                req.userTranscript = true;
                                                next();
                                            }else{
                                                req.userTranscript = false;
                                                next();
                                            }
                                        }
                                        else if(user_data.applying_for == 'Masters,Bachelors'){
                                            var mastbach;
                                            userTranscripts.forEach(function (userTranscript) {
                                                mastbach = userTranscript.type + mastbach ;
                                            })
                                               if (mastbach.includes('Bachelors_transcripts') && mastbach.includes('Masters_transcripts')) {
                                                            i += 1;
                                                    }
                                            if(i>0){
                                                req.userTranscript = true;
                                                next();
                                            }else{
                                                req.userTranscript = false;
                                                next();
                                            }
                                        }
                                        else if(user_data.applying_for == 'Phd,Masters,Bachelors'){
                                            userTranscripts.forEach(function (userTranscript) {
                                                if (userTranscript.type == 'Phd_transcripts' || userTranscript.type == 'Phd_degree') {
                                                    i += 1;
                                                }
                                            })
                                            if(i>0){
                                                req.userTranscript = true;
                                                next();
                                            }else{
                                                req.userTranscript = false;
                                                next();
                                            }
                                        }else if(user_data.applying_for == 'Masters'){
                                            userTranscripts.forEach(function (userTranscript) {
                                                if (userTranscript.type == 'Masters_transcripts' && userTranscript.name.includes('_Transcript Page')) {
                                                    i += 1;
                                                }
                                            })
                                            if(i>0){
                                                req.userTranscript = true;
                                                next();
                                            }else{
                                                req.userTranscript = false;
                                                next();
                                            }
                                        }else if(user_data.applying_for == 'Phd'){
                                            userTranscripts.forEach(function (userTranscript) {
                                                if (userTranscript.type == 'Masters_degree' && userTranscript.type == 'Bachelors_degree' && userTranscript.type == 'Phd_degree' && userTranscript.name.includes('_Degree Page')) {
                                                    i += 1;
                                                }
                                            })
                                            if(i>0){
                                                req.userDegree = true;
                                                next();
                                            }else{
                                                req.userDegree = false;
                                                next();
                                            }
                                        }
                                    }else{
                                        req.userTranscript = false;
                                        next();
                                    }
                                }else{
                                    req.userTranscript = false;
                                    next(); 
                                }
                               
                            })
                        }else{
                            req.userTranscript = true;
                            next();
                        }
                    }else{
                        req.userTranscript = true;
                        next();
                    }
                   
                }else{
                    req.userTranscript = true;
                    next();
                }
              
              
            })
        }else{
            models.Applied_For_Details.find({
                where:{
                    user_id : req.user_id,
                    app_id : {
                        [Op.eq] : null
                    },
                    source : 'guattestation'
                }
            }).then(function(user_data){
                if(user_data){
                    if(user_data.attestedfor != null){

                        if(user_data.attestedfor.includes('transcript')){
                            if(user_data.applying_for != null){
                                models.userMarkList.find({
                                    where :{
                                        user_id : req.user_id,source : 'guattestation'
                                    }
                                }).then(function(userMarkList){
                                    if(userMarkList){
                                        if(userMarkList.previous_data == true){
                                            models.User_Transcript.findAll({
                                                where:{
                                                    user_id : req.user_id,
    
                                                    type : {
                                                        [Op.like] : '%transcript%'
                                                    },source : 'guattestation' 
                                                }
                                            }).then(function(userTranscripts){
                                                if(userTranscripts.length > 0){
                                                    var i = 0;
                                                    if(user_data.applying_for == 'Bachelors'){
                                                        userTranscripts.forEach(function (userTranscript) {
                                                            if (userTranscript.type == 'Bachelors_transcripts' && userTranscript.name.includes('_Transcript Page')) {
                                                                i += 1;
                                                            }
                                                        })
                                                        if(i>0){
                                                            req.userTranscript = true;
                                                            next();
                                                        }else{
                                                            req.userTranscript = false;
                                                            next();
                                                        }
                                                    }else if(user_data.applying_for == 'Masters,Bachelors'){
                                                        userTranscripts.forEach(function (userTranscript) {
                                                            if (userTranscript.type == 'Masters_transcripts' && userTranscript.type == 'Bachelors_transcripts' && userTranscript.name.includes('_Transcript  Page')) {
                                                                i += 1;
                                                            }
                                                        })
                                                        if(i>0){
                                                            req.userTranscript = true;
                                                            next();
                                                        }else{
                                                            req.userTranscript = false;
                                                            next();
                                                        }
                                                    }else if(user_data.applying_for == 'Phd,Masters,Bachelors'){
                                                        userTranscripts.forEach(function (userTranscript) {
                                                            if (userTranscript.type == 'Phd_transcripts' && userTranscript.name.includes('_Transcript Page')) {
                                                                i += 1;
                                                            }
                                                        })
                                                        if(i>0){
                                                            req.userTranscript = true;
                                                            next();
                                                        }else{
                                                            req.userTranscript = false;
                                                            next();
                                                        }
                                                    }
                                                }else{
                                                    req.userTranscript = false;
                                                    next();
                                                }
                                            })
                                        }else if(userMarkList.previous_data == false){
                                            models.User_Transcript.findAll({
                                                where:{
                                                    user_id : req.user_id,
                                                    app_id : {
                                                        [Op.eq] : null
                                                    },
                                                    type : {
                                                        [Op.like] : '%transcript%'
                                                    },source : 'guattestation' 
                                                }
                                            }).then(function(userTranscripts){
                                                
                                                console.log("userTranscripts.length>>>" +userTranscripts.length);
                                                if(userTranscripts.length > 0){
                                                    console.log("in trueeeee");
                                                    var i = 0;
                                                    if(user_data.applying_for == 'Bachelors'){
                                                        userTranscripts.forEach(function (userTranscript) {
                                                            if (userTranscript.type == 'Bachelors_transcripts' && userTranscript.name.includes('_Transcript Page')) {
                                                                i += 1;
                                                            }
                                                        })
                                                        if(i>0){
                                                            req.userTranscript = true;
                                                            next();
                                                        }else{
                                                            req.userTranscript = false;
                                                            next();
                                                        }
                                                    }
                                                    else if(user_data.applying_for == 'Masters,Bachelors'){
                                                        var mastbach;
                                                        userTranscripts.forEach(function (userTranscript) {
                                                            mastbach = userTranscript.type + mastbach ;
                                                        })
                                                           if (mastbach.includes('Bachelors_transcripts') && mastbach.includes('Masters_transcripts')) {
                                                                        i += 1;
                                                                }
                                                        if(i>0){
                                                            req.userTranscript = true;
                                                            next();
                                                        }else{
                                                            req.userTranscript = false;
                                                            next();
                                                        }
                                                    }
                                                    else if(user_data.applying_for == 'Phd,Masters,Bachelors'){
                                                       
                                                        userTranscripts.forEach(function (userTranscript) {
                                                            console.log("userTranscript.type" + userTranscript.type);
                                                            console.log("userTranscript.name" + userTranscript.name);
                                                            if (userTranscript.type == 'Phd_transcripts' || userTranscript.type == 'Phd_degree') {
                                                                console.log("insideeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
                                                                i += 1;
                                                            }
                                                        })
                                                        if(i>0){
                                                            console.log("trueeee value");
                                                            req.userTranscript = true;
                                                            next();
                                                        }else{
                                                            req.userTranscript = false;
                                                            next();
                                                        }
                                                    }else if(user_data.applying_for == 'Masters'){
                                                        userTranscripts.forEach(function (userTranscript) {
                                                            if (userTranscript.type == 'Masters_transcripts' && userTranscript.name.includes('_Transcript Page')) {
                                                                i += 1;
                                                            }
                                                        })
                                                        if(i>0){
                                                            req.userTranscript = true;
                                                            next();
                                                        }else{
                                                            req.userTranscript = false;
                                                            next();
                                                        }
                                                    }
                                                    else if(user_data.applying_for == 'Phd'){
                                                        var phddata;
                                                        userTranscripts.forEach(function (userTranscript) {
                                                            phddata = userTranscript.type + phddata ;
                                                        })
                                                        console.log('phddataphddataphddataphddata' + phddata)
                                                           if (phddata.includes('Phd_transcripts') && phddata.includes('Masters_transcripts') && phddata.includes('Bachelors_transcripts')) {
                                                                        i += 1;
                                                                }
                                                        if(i>0){
                                                            req.userTranscript = true;
                                                            next();
                                                        }else{
                                                            req.userTranscript = false;
                                                            next();
                                                        }
                                                        console.log("req.userTranscript" + req.userTranscript);
                                                    }
                                                }else{
                                                    req.userTranscript = false;
                                                    next();
                                                }
                                            })
                                        }
                                    }else{
                                        req.userTranscript = false;
                                        next();
                                    }
                                })
                            }else{
                                req.userTranscript = false;
                                next();
                            }
                        }else{
    
                            req.userTranscript = true;
                            next();
                        }
                    }else{
                        req.userTranscript = true;
                        next();
                    }
                }else{
                    req.userTranscript = false;
                    next();
                }   
            })
        }
    },

    getDegreeDetails: function(req, res, next){
        console.log("getDegreeDetails");
        if(req.query.editFlag == 'true'){
            models.Applied_For_Details.find({
                where:{
                    user_id : req.user_id,
                    app_id : req.query.app_id,
                    source : 'guattestation'
                }
            }).then(function(user_data){
                if(user_data){
                    if(user_data.attestedfor != null){
                        if(user_data.attestedfor.includes('degree')){
                            models.User_Transcript.findAll({
                                where:{
                                    user_id : req.user_id,
                                    app_id : {
                                        [Op.ne] : null
                                    },
                                    type : {
                                        [Op.like] : '%degree%'
                                    },source : 'guattestation' 
                                }
                            }).then(function(user_Transcripts){
                                
                                var userTranscripts = [];
                                if( user_Transcripts.length > 0){
                                    user_Transcripts.forEach(transcript=>{
                                        var app_idArr = transcript.app_id.split(",");
                                        app_idArr.forEach(app_id=>{
                                            if(app_id == req.query.app_id){
                                                userTranscripts.push(transcript);
                                            }
                                        })
                                    })
                                    if(userTranscripts.length > 0){
                                        var i = 0;
                                        if(user_data.applying_for == 'Bachelors'){
                                            userTranscripts.forEach(function (userTranscript) {
                                                if (userTranscript.type == 'Bachelors_degree'  && userTranscript.name.includes('_Degree Page')) {
                                                    i += 1;
                                                }
                                            })
                                            if(i>0){
                                                req.userDegree = true;
                                                next();
                                            }else{
                                                req.userDegree = false;
                                                next();
                                            }
                                        }
                                        else if(user_data.applying_for == 'Masters,Bachelors'){
                                            var mastbach;
                                            userTranscripts.forEach(function (userTranscript) {
                                                mastbach = userTranscript.type + mastbach ;
                                            })
                                               if (mastbach.includes('Bachelors_degree') && mastbach.includes('Masters_degree')) {
                                                            i += 1;
                                                    }
                                            if(i>0){
                                                req.userDegree = true;
                                                next();
                                            }else{
                                                req.userDegree = false;
                                                next();
                                            }
                                        }
                                        else if(user_data.applying_for == 'Phd,Masters,Bachelors'){
                                            userTranscripts.forEach(function (userTranscript) {
                                                if (userTranscript.type == 'Phd_degree' || userTranscript.type == 'Phd_transcript') {
                                                    i += 1;
                                                }
                                            })
                                            if(i>0){
                                                req.userDegree = true
                                                next();
                                            }else{
                                                req.userDegree = false;
                                                next();
                                            }
                                        }else if(user_data.applying_for == 'Masters'){
                                            userTranscripts.forEach(function (userTranscript) {
                                                if (userTranscript.type == 'Masters_degree' && userTranscript.name.includes('_Degree Page')) {
                                                    i += 1;
                                                }
                                            })
                                            if(i>0){
                                                req.userDegree = true;
                                                next();
                                            }else{
                                                req.userDegree = false;
                                                next();
                                            }
                                        }else if(user_data.applying_for == 'Phd'){
                                            userTranscripts.forEach(function (userTranscript) {
                                                if (userTranscript.type == 'Masters_degree' && userTranscript.type == 'Bachelors_degree' && userTranscript.type == 'Phd_degree' && userTranscript.name.includes('_Degree Page')) {
                                                    i += 1;
                                                }
                                            })
                                            if(i>0){
                                                req.userDegree = true;
                                                next();
                                            }else{
                                                req.userDegree = false;
                                                next();
                                            }
                                        }
                                    }else{
                                        req.userDegree = false;
                                        next();
                                    }
                                }else{
                                    req.userDegree = false;
                                    next(); 
                                }
                               
                            })
                        }else{
                            req.userDegree = true;
                            next();
                        }
                    }else{
                        req.userDegree = true;
                        next();
                    }
                }else{
                    req.userDegree = true;
                    next();
                }
               
               
              
            })
        }else{
            models.Applied_For_Details.find({
                where:{
                    user_id : req.user_id,
                    app_id : {
                        [Op.eq] : null
                    },
                    source : 'guattestation'
                }
            }).then(function(user_data){
                if(user_data){
                    if(user_data.attestedfor != null){
                        if(user_data.attestedfor.includes('degree')){
                           
                                // if(user_data.instructionalField == true){
                                //     models.User_Transcript.findAll({
                                //         where:{
                                //             user_id : req.user_id,
                                //             name  : 'Bonafied'
                                //         }
                                //     }).then(function(userBonfied){
                                //             if(userBonfied.length > 0){
                                //                 req.userDegree = true;
                                //                 next();  
                                //             }else{
                                //                 req.userDegree = false;
                                //                 next();
                                //             }
                                //     })
                                // }
                                // if(user_data.instructionalField == true ){
                                    if(user_data.applying_for != null){
                                        models.userMarkList.find({
                                            where :{
                                                user_id : req.user_id,source : 'guattestation'
                                            }
                                        }).then(function(userMarkList){
                                            if(userMarkList){
                                                if(userMarkList.previous_data == true){
                                                    models.User_Transcript.findAll({
                                                        where:{
                                                            user_id : req.user_id,source : 'guattestation' 
                                                        }
                                                    }).then(function(userTranscripts){
                                                        if(userTranscripts.length > 0){
                                                            var i = 0;
                                                            if(user_data.applying_for == 'Bachelors'){
                                                                userTranscripts.forEach(function (userTranscript) {
                                                                    if (userTranscript.type == 'Bachelors_degree' && userTranscript.name.includes('_Degree Page')) {
                                                                        i += 1;
                                                                    }
                                                                })
                                                                if(i>0){
                                                                    req.userDegree = true;
                                                                    next();
                                                                }else{
                                                                    req.userDegree = false;
                                                                    next();
                                                                }
                                                            }else if(user_data.applying_for == 'Masters,Bachelors'){
                                                                userTranscripts.forEach(function (userTranscript) {
                                                                    if (userTranscript.type == 'Masters_degree' && userTranscript.type == 'Bachelors_degree' && userTranscript.name.includes('_Degree Page')) {
                                                                        i += 1;
                                                                    }
                                                                })
                                                                if(i>0){
                                                                    req.userDegree = true;
                                                                    next();
                                                                }else{
                                                                    req.userDegree = false;
                                                                    next();
                                                                }
                                                            }else if(user_data.applying_for == 'Phd,Masters,Bachelors'){
                                                                userTranscripts.forEach(function (userTranscript) {
                                                                    if (userTranscript.type == 'Phd_degree'  && userTranscript.name.includes('_Degree Page')) {
                                                                        i += 1;
                                                                    }
                                                                })
                                                                if(i>0){
                                                                    req.userDegree = true;
                                                                    next();
                                                                }else{
                                                                    req.userDegree = false;
                                                                    next();
                                                                }
                                                            }
                                                        }else{
                                                            req.userDegree = false;
                                                            next();
                                                        }
                                                    })
                                                }else if(userMarkList.previous_data == false){
                                                    models.User_Transcript.findAll({
                                                        where:{
                                                            user_id : req.user_id,
                                                            app_id : {
                                                                [Op.eq] : null      
                                                            },
                                                            type : {
                                                                [Op.like] : '%degree%'
                                                            },source : 'guattestation' 
                                                        }
                                                    }).then(function(userTranscripts){
                                                        if(userTranscripts.length > 0){
                                                            var i = 0;
                                                            if(user_data.applying_for == 'Bachelors'){
                                                                userTranscripts.forEach(function (userTranscript) {
                                                                    if (userTranscript.type == 'Bachelors_degree' && userTranscript.name.includes('_Degree Page')) {
                                                                        i += 1;
                                                                    }
                                                                })
                                                                if(i>0){
                                                                    req.userDegree = true;
                                                                    next();
                                                                }else{
                                                                    req.userDegree = false;
                                                                    next();
                                                                }
                                                            }
                                                            else if(user_data.applying_for == 'Masters,Bachelors'){
                                                                var mastbach;
                                                                userTranscripts.forEach(function (userTranscript) {
                                                                    mastbach = userTranscript.type + mastbach ;
                                                                })
                                                                   if (mastbach.includes('Bachelors_degree') && mastbach.includes('Masters_degree')) {
                                                                                i += 1;
                                                                        }
                                                                if(i>0){
                                                                    req.userDegree = true;
                                                                    next();
                                                                }else{
                                                                    req.userDegree = false;
                                                                    next();
                                                                }
                                                            }
                                                            else if(user_data.applying_for == 'Phd,Masters,Bachelors'){
                                                                userTranscripts.forEach(function (userTranscript) {
                                                                    if (userTranscript.type == 'Phd_degree' || userTranscript.type == 'Phd_transcript' || userTranscript.type =='PHD_degree')
                                                                    {
                                                                        i += 1;
                                                                    }
                                                                })
                                                                if(i>0){
                                                                    req.userDegree = true;
                                                                    next();
                                                                }else{
                                                                    req.userDegree = false;
                                                                    next();
                                                                }
                                                            }else if(user_data.applying_for == 'Masters'){
                                                                userTranscripts.forEach(function (userTranscript) {
                                                                    if (userTranscript.type == 'Masters_degree' && userTranscript.name.includes('_Degree Page')) {
                                                                        i += 1;
                                                                    }
                                                                })
                                                                if(i>0){
                                                                    req.userDegree = true;
                                                                    next();
                                                                }else{
                                                                    req.userDegree = false;
                                                                    next();
                                                                }
                                                            }
                                                            else if(user_data.applying_for == 'Phd'){
                                                                var phddata;
                                                                userTranscripts.forEach(function (userTranscript) {
                                                                    phddata = userTranscript.type + phddata ;
                                                                })
                                                                   if (phddata.includes('Phd_degree') && phddata.includes('Masters_degree') && phddata.includes('Bachelors_degree')) {
                                                                                i += 1;
                                                                        }
                                                                if(i>0){
                                                                    req.userDegree = true;
                                                                    next();
                                                                }else{
                                                                    req.userDegree = false;
                                                                    next();
                                                                }
                                                            }
                                                        }else{
                                                            req.userDegree = false;
                                                            next();
                                                        }
                                                    })
                                                }
                                            }else{
                                                req.userDegree = false;
                                                next();
                                            }
                                        })
                                    }else{
                                        req.userDegree = false;
                                        next();
                                    }
                                // }
                            
                        }else{
                               req.userDegree = true;
                            next();
                        }
                    }else{
                        req.userDegree = true;
                        next();
                    }
                }else{
                    req.userDegree = true;
                    next();
                }
               
               
                  
            })
        }
    }

}
    