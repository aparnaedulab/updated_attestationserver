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
                app_id : null
            }
        }).then(function(User){
            if(User){
                if(User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true && User.CompetencyLetter == true && User.LetterforNameChange == true){  
                    req.userEducational = 7;
                        next();
                }else if((User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true && User.CompetencyLetter)  || (User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true &&User.LetterforNameChange) || (User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.affiliation == true && User.CompetencyLetter == true && User.LetterforNameChange ) || (User.educationalDetails == true  && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.CompetencyLetter == true && User.LetterforNameChange)  || (User.educationalDetails == true && User.instructionalField == true && User.gradToPer == true && User.affiliation == true && User.CompetencyLetter == true && User.LetterforNameChange)  || (User.educationalDetails == true && User.curriculum == true  && User.gradToPer == true && User.affiliation == true && User.CompetencyLetter == true && User.LetterforNameChange) || (User.educationalDetails == true && User.curriculum == true  && User.gradToPer == true && User.affiliation == true && User.CompetencyLetter == true && User.LetterforNameChange) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true && User.affiliation == true && User.CompetencyLetter == true && User.LetterforNameChange)){
                    req.userEducational = 6;
                    next();
                }else if((User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true && User.affiliation == true)){
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

                }else if((User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.gradToPer == true ) || (User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.affiliation == true ) || (User.educationalDetails == true && User.instructionalField == true && User.curriculum == true && User.CompetencyLetter == true ) || (User.educationalDetails == true  && User.instructionalField == true && User.curriculum == true && User.LetterforNameChange == true ) || (User.educationalDetails == true && User.instructionalField == true && User.gradToPer == true && User.affiliation == true )  || (User.educationalDetails == true && User.instructionalField == true  && User.gradToPer == true && User.CompetencyLetter == true ) || (User.educationalDetails == true && User.instructionalField == true  && User.gradToPer == true && User.LetterforNameChange == true ) || (User.educationalDetails == true && User.curriculum == true  && User.gradToPer == true && User.affiliation == true ) || (User.educationalDetails == true && User.curriculum == true  && User.gradToPer == true && User.CompetencyLetter == true) || (User.educationalDetails == true && User.curriculum == true  && User.gradToPer == true && User.LetterforNameChange == true ) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true && User.affiliation == true ) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true && User.CompetencyLetter == true ) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true && User.LetterforNameChange == true ) || (User.instructionalField == true && User.curriculum == true  && User.affiliation == true && User.CompetencyLetter == true ) || (User.instructionalField == true && User.curriculum == true  && User.affiliation == true && User.LetterforNameChange == true ) || (User.instructionalField == true && User.curriculum == true  && User.CompetencyLetter == true && User.LetterforNameChange == true ) || (User.curriculum == true && User.gradToPer == true  && User.affiliation == true && User.CompetencyLetter == true) || (User.curriculum == true && User.gradToPer == true  && User.affiliation == true && User.LetterforNameChange == true) || (User.curriculum == true && User.affiliation == true  && User.CompetencyLetter == true && User.LetterforNameChange == true)){
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
                }else if((User.educationalDetails == true && User.instructionalField == true && User.curriculum == true) || (User.educationalDetails == true && User.instructionalField == true && User.gradToPer == true) || (User.educationalDetails == true && User.instructionalField == true && User.affiliation == true) || (User.educationalDetails == true  && User.instructionalField == true && User.CompetencyLetter == true) || (User.educationalDetails == true && User.instructionalField == true && User.LetterforNameChange == true )  || (User.educationalDetails == true && User.gradToPer == true  && User.curriculum == true  ) || (User.educationalDetails == true && User.curriculum == true  && User.affiliation == true ) || (User.educationalDetails == true && User.curriculum == true  && User.CompetencyLetter == true  ) || (User.educationalDetails == true && User.curriculum == true  && User.LetterforNameChange == true ) || (User.educationalDetails == true && User.gradToPer == true  && User.affiliation == true  ) || (User.educationalDetails == true && User.gradToPer == true  && User.CompetencyLetter == true  ) || (User.educationalDetails == true && User.gradToPer == true  && User.LetterforNameChange == true ) || (User.educationalDetails == true && User.affiliation == true  && User.CompetencyLetter == true ) || (User.educationalDetails == true && User.affiliation == true  && User.LetterforNameChange == true  ) || (User.affiliation == true && User.CompetencyLetter == true  && User.LetterforNameChange == true  ) || (User.instructionalField == true && User.curriculum == true  && User.gradToPer == true  ) || (User.instructionalField == true && User.curriculum == true  && User.affiliation == true ) || (User.instructionalField == true && User.curriculum == true  && User.CompetencyLetter == true ) || (User.instructionalField == true && User.CompetencyLetter == true  && User.LetterforNameChange == true) || (User.instructionalField == true && User.gradToPer == true  && User.affiliation == true) || (User.instructionalField == true && User.gradToPer == true  && User.CompetencyLetter == true) || (User.instructionalField == true && User.gradToPer == true  && User.LetterforNameChange == true) || (User.instructionalField == true && User.affiliation == true  && User.CompetencyLetter == true) || (User.instructionalField == true && User.affiliation == true  && User.LetterforNameChange == true) ){
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
                }else if(User.curriculum == true){
                    req.userEducational = 1;
                    next();
                }else if(User.instructionalField == true){
                    req.userEducational = 1;
                    next();
                }else if(User.gradToPer == true){
                    req.userEducational = 1;
                    next();
                }else if(User.affiliation == true){
                    req.userEducational = 1;
                    next();
                }else if(User.CompetencyLetter == true){
                  console.log('iiiiii')
                    req.userEducational = 1;
                    next();
                }else if(User.educationalDetails == true){
                    console.log("educational")
                    req.userEducational = 1;
                    next();
                }else if(User.LetterforNameChange == true){
                    console.log("LetterforNameChange")
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
        console.log("getTranscriptDetails");
        var option;
        if(req.query.editFlag == 'true'){
            models.Applied_For_Details.find({
                where:{
                    user_id : req.user_id,
                    app_id : req.query.app_id
                }
            }).then(function(user_data){
                models.User_Transcript.findAll({
                    where:{
                        user_id : req.user_id,
                        app_id : {
                            [Op.ne] : null
                        }
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
                            }else if(user_data.applying_for == 'Masters,Bachelors'){
                                userTranscripts.forEach(function (userTranscript) {
                                    if ( userTranscript.type == 'Bachelors_transcripts' && userTranscript.name.includes('_Transcript Page')) {
                                        if(userTranscript.type == 'Masters_transcripts'){
                                            i += 1;
                                        }
                                       
                                    }
                                })
                                console.log("ii value ======>" + i);
                                if(i>0){
                                    req.userTranscript = true;
                                    next();
                                }else{
                                    req.userTranscript = false;
                                    next();
                                }
                            }else if(user_data.applying_for == 'Phd,Masters,Bachelors'){
                                models.userMarkList.find({
                                    where :{
                                        type : 'Phd',
                                        user_id : req.user_id,
                                        app_id : {
                                            [Op.ne] : null
                                        }
                                    }
                                }).then(function(userMarklist){
                                    if(userMarklist){
                                        var str = 'Phd_' + userMarklist.faculty
                                        userTranscripts.forEach(function (userTranscript) {
                                            if (userTranscript.type == 'Phd_transcripts' && userTranscript.name.includes(str)) {
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
                                    }else{
                                        req.userTranscript = false;
                                        next();
                                    }
                                })
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
                        }else{
                            req.userTranscript = false;
                            next();
                        }
                    }else{
                        req.userTranscript = false;
                        next(); 
                    }
                   
                })
            })
        }else{
            models.Applied_For_Details.find({
                where:{
                    user_id : req.user_id,
                    app_id : {
                        [Op.eq] : null
                    }
                }
            }).then(function(user_data){
                if(user_data){
                    if(user_data.applying_for != null){
                        models.userMarkList.find({
                            where :{
                                user_id : req.user_id
                            }
                        }).then(function(userMarkList){
                            if(userMarkList){
                                if(userMarkList.previous_data == true){
                                    models.User_Transcript.findAll({
                                        where:{
                                            user_id : req.user_id
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
                                               
                                                models.User_Transcript.findAll({
                                                    where:{
                                                        user_id : req.user_id,
                                                        type :{
                                                            [Op.like] : '%Bachelors_transcripts%'
                                                        }
                                                    }
                                                }).then(function(userTranscripts){
                                                        if(userTranscripts.length > 0){
                                                            models.User_Transcript.findAll({
                                                                where:{
                                                                    user_id : req.user_id,
                                                                    type :{
                                                                        [Op.like] : '%Masters_transcripts%'
                                                                    }
                                                                }
                                                            }).then(function(userTranscripts_master){
                                                                if(userTranscripts_master.length > 0){
                                                                    req.userTranscript = true;
                                                                    next();
                                                                    option = true;
                                                                }else{
                                                                    req.userTranscript = false;
                                                                        next();
                                                                }
                                                            })
                                                        }else{
                                                            req.userTranscript = false;
                                                                        next();
                                                        }
                                                })
                                                // userTranscripts.forEach(function (userTranscript) {
                                                //     if (userTranscript.type == 'Bachelors_transcripts' &&  userTranscript.name.includes('_Transcript Page')) {
                                                //         if(userTranscript.type == 'Masters_transcripts'){
                                                //             i += 1;
                                                //         }
                                                      
                                                //     }
                                                // })
                                                // if(i>0){
                                                //     req.userTranscript = true;
                                                //     next();
                                                // }else{
                                                //     req.userTranscript = false;
                                                //     next();
                                                // }
                                            }else if(user_data.applying_for == 'Phd,Masters,Bachelors'){
                                                models.userMarkList.find({
                                                    where :{
                                                        type : 'Phd',
                                                        user_id : req.user_id,
                                                        app_id : {
                                                            [Op.eq] : null
                                                        }
                                                    }
                                                }).then(function(userMarklist){
                                                    if(userMarklist){
                                                        var str = 'Phd_' + userMarklist.faculty
                                                        userTranscripts.forEach(function (userTranscript) {
                                                            if (userTranscript.name.includes(str)) {
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
                                                    }else{
                                                        req.userTranscript = false;
                                                        next();  
                                                    }
                                                })
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
                                            }
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
                                                models.User_Transcript.findAll({
                                                    where:{
                                                        user_id : req.user_id,
                                                        app_id : {
                                                            [Op.eq] : null      
                                                        },
                                                        type :{
                                                            [Op.like] : '%Bachelors_transcripts%'
                                                        }
                                                    }
                                                }).then(function(userTranscripts){
                                                        if(userTranscripts.length > 0){
                                                            models.User_Transcript.findAll({
                                                                where:{
                                                                    user_id : req.user_id,
                                                                    app_id : {
                                                                        [Op.eq] : null      
                                                                    },
                                                                    type :{
                                                                        [Op.like] : '%Masters_transcripts%'
                                                                    }
                                                                }
                                                            }).then(function(userTranscripts_master){
                                                                if(userTranscripts_master.length > 0){
                                                                    req.userTranscript = true;
                                                                    next();
                                                                    option = true;
                                                                }else{
                                                                    req.userTranscript = false;
                                                                        next();
                                                                }
                                                            })
                                                        }else{
                                                            req.userTranscript = false;
                                                                        next();
                                                        }
                                                })

                                                // userTranscripts.forEach(function (userTranscript) {
                                                //     // if (userTranscript.type == 'Bachelors_transcripts' && userTranscript.name.includes('_Transcript Page') ) {
                                                //     //     console.log("inside first if");
                                                //     // if(userTranscript.type == 'Masters_transcripts' && userTranscript.name.includes('_Transcript Page') ) {
                                                //     //         console.log("inside 2nd if");
                                                //     //         i += 1;
                                                //     //     }
                                                //     // }
                                                // })

                                                 
                                                // if(i>0){
                                                //     req.userTranscript = true;
                                                //     next();
                                                // }else{
                                                //     req.userTranscript = false;
                                                //     next();
                                                // }
                                            }else if(user_data.applying_for == 'Phd,Masters,Bachelors'){
                                                models.userMarkList.find({
                                                    where :{
                                                        type : 'Phd',
                                                        user_id : req.user_id,
                                                        app_id : {
                                                            [Op.eq] : null
                                                        }
                                                    }
                                                }).then(function(userMarklist){
                                                    if(userMarklist){
                                                        var str = 'Phd_' + userMarklist.faculty
                                                        userTranscripts.forEach(function (userTranscript) {
                                                            if (userTranscript.name.includes(str)) {
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
                                                    }else{
                                                        req.userTranscript = false;
                                                        next();
                                                    }
                                                })
                                            }else  if(user_data.applying_for == 'Masters'){
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
                    req.userTranscript = false;
                    next();
                }   
            })
        }
    }

}
    