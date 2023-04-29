var path = require('path');
var root_path = path.dirname(require.main.filename);
var models = require(root_path + '/models');
const express = require('express');
var router = express.Router();
var constant = require(root_path + '/config/constant');
const client = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
const logger = require('../../logger')("Admin route : " + __filename);
var request = require('request');
var functions = require(root_path+'/utils/function');
var moment = require('moment');
var async = require('async');
const multer = require('multer');
var Sequelize = require("sequelize");
const Op = Sequelize.Op;
const middlewares = require('./../../middlewares');
var json2xls = require('json2xls');
var fs = require('fs');
var urlencode = require('urlencode');
var self_pdf = require(root_path+'/utils/self_letters');
var converter = require('number-to-words');
const cron = require("node-cron");
const { lodash } = require('consolidate');
var pdfreader = require('pdfreader');

router.get('/generateHrdLetter',middlewares.getUserInfo,function(req,res){
    console.log("/generateHrdLetter");
    var userId =''
    models.Hrd_details.getMaxRefetenceNumber().then(function(MaxReferenceNo){
        if(MaxReferenceNo[0].maxNumber == null){
            reference_no = 1001;
        }else{
            reference_no = MaxReferenceNo[0].maxNumber + 1;
        }

        models.Hrd_details.update(
            {
                reference_no : reference_no
            },{
            where :{
                user_id : userId
            }
        }).then(function(updatedDetails){
            var ref_no = updatedDetails[0].reference_no;
            self_pdf.hrdLetter(userId,ref_no,function(err){
                if(err) {
                    res.json({ 
                        status: 400
                    })
                }else{
                    res.json({
                        status : 200
                    })
                }
            })
        })
    })

})
router.get('/adminDashboard/total', function (req, res) {
    var students = [];
    var page = req.query.page;
    var id = req.query.id ? req.query.id : '';
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
    var year = req.query.acadYear ? req.query.acadYear : '';
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(id != '' && id != null && id != undefined && id != 'null' && id != 'undefined'){
        var filter ={};
        filter.name = 'application_id';
        filter.value = id;
        filters.push(filter);
    }

    if(name != '' && name != null && name != undefined && name != 'null' && name != 'undefined'){
        var filter ={};
        var filter1 = {};
        var nameSplit = name.split(' ');
        if(nameSplit.length == 1){
             filter.name = 'name';
            // filter.value = nameSplit[0];
            filter.value = " AND( u.name like '%" + nameSplit[0] + "%' OR u.surname like '%" + nameSplit[0] + "%') ";
            filters.push(filter);
        }else if(nameSplit.length == 2){
             filter.name = 'name';
            // filter.value = nameSplit[0];
            // filters.push(filter);
            // filter1.name = 'surname';
            // filter1.value = nameSplit[1];
            filter.value = " AND u.name like '%" + nameSplit[0] + "%' AND u.surname like '%" + nameSplit[1] + "%' ";
            filters.push(filter);
        }else{
             filter.name = 'name';
             var lastElement = nameSplit.pop();
            // filter.value = nameSplit.join(' ');
            // filters.push(filter);
            // filter1.name = 'surname';
            // filter1.value = lastElement;
            filter.value = " AND u.name like '%" + nameSplit.join(' ') + "%' AND u.surname like '%" + lastElement + "%' ";
            filters.push(filter);
        }
        
    }
    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(year != '' && year != null && year != undefined && year != 'null' && year != 'undefined'){	
        var filter ={};	
		var currentyear = year;	
		var startdate = currentyear+"-04-01";	
		var year = parseInt(currentyear) + 1;	
		var enddate = year + "-04-01"  ;	
        filter.name = 'application_year';	
        filter.value = " AND a.created_at BETWEEN '" + startdate + "' AND '" + enddate + "'";	
        filters.push(filter);	
	// }else{	
    //     var filter ={};	
	// 	var month = moment().month() + 1;	
    //     if(month >=1 && month <4){	
    //         var currentyear = moment().year() - 1;	
    //         var startdate = currentyear+"-04-01";	
    //         var year = parseInt(currentyear) + 1;	
    //         var enddate = year + "-03-31"  ;	
    //         filter.name = 'application_year';	
    //         filter.value = " AND a.created_at BETWEEN '" + startdate + "' AND '" + enddate + "'";	
    //     }else if(month >=4 && month <=12){	
    //         var currentyear = moment().year();	
    //         var startdate = currentyear+"-04-01";	
    //         var year = parseInt(currentyear) + 1;	
    //         var enddate = year + "-03-31"  ;	
    //         filter.name = 'application_year';	
    //         filter.value = " AND a.created_at BETWEEN '" + startdate + "' AND '" + enddate + "'";	
    //     }	
    //     filters.push(filter);	
	}  

   models.Application.getTotalUserApplications(filters,null,null).then(data1 => {
        countObjects.totalLength = data1.length;
        models.Application.getTotalUserApplications(filters,limit,offset).then(data => {
            countObjects.filteredLength = data.length;
            require('async').eachSeries(data, function(student, callback){
                var  collegesData = [];
                if(student.educationalDetails == true){
                    models.User_Transcript.getCollegeName(student.user_id).then(function(transcriptColleges){
                        var colleges = [];
                        transcriptColleges.forEach(transcriptCollege=>{
                            if(transcriptCollege.app_id != null){
                                var app_ids = transcriptCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        colleges.push(transcriptCollege);
                                    }
                                })
                            }
                        });
                       if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                    });
                }

                if(student.CompetencyLetter == true){
                    models.competency_letter.getCollegeName(student.user_id).then(function(transcriptColleges){
                        var colleges = [];
                        transcriptColleges.forEach(transcriptCollege=>{
                            if(transcriptCollege.app_id != null){
                                var app_ids = transcriptCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        colleges.push(transcriptCollege);
                                    }
                                })
                            }
                        });
                       if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                    });
                }

                if(student.instructionalField == true){
                    models.InstructionalDetails.getCollegeName(student.user_id).then(function(instructionColleges){
                        var colleges = [];
                         instructionColleges.forEach(transcriptCollege=>{
                            
                            if(transcriptCollege.app_id != null){
                                var app_ids = transcriptCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        colleges.push(transcriptCollege);
                                    }
                                })
                            }
                        });
                         if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                       
                    });
                }
                if(student.LetterforNameChange == true){
                    models.Letterfor_NameChange.getCollegeName(student.user_id).then(function(instructionColleges){
                        console.log('LetterforNameChange',instructionColleges);
                        var colleges = [];
                         instructionColleges.forEach(transcriptCollege=>{
                            
                            if(transcriptCollege.app_id != null){
                                var app_ids = transcriptCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        console.log('transcriptCollege',transcriptCollege);
                                        colleges.push(transcriptCollege);
                                    }
                                })
                            }
                        });
                         if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                       
                    });
                }

                if(student.curriculum == true){
                    models.User_Curriculum.getCollegeName(student.user_id).then(function(curriculumColleges){
                        var colleges = [];
                        curriculumColleges.forEach(transcriptCollege=>{
                            if(transcriptCollege.app_id != null){
                                var app_ids = transcriptCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        colleges.push(transcriptCollege);
                                    }
                                })
                            }
                        });
                        if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                        
                    });
                }
                if(student.gradToPer == true){
                    models.GradeToPercentageLetter.getCollegeName(student.user_id).then(function(letterColleges){
                        var colleges = [];
                        letterColleges.forEach(letterCollege=>{
                            if(letterCollege.app_id != null){
                                var app_ids = letterCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        colleges.push(letterCollege);
                                    }
                                })
                            }
                        });
                       if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                    });
                }
              //  models.User_Transcript.getCollegeName(student.user_id).then(function(colleges){
                setTimeout(()=>{
                    models.Institution_details.getAllInstitutionType(student.id).then(function(types){
                        var purpose = [];
                        types.forEach(detail=>{
                            if(detail.type == 'study'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.studyrefno
                                })
                            }
                            if(detail.type == 'employment'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.emprefno
                                })
                            }
                            if(detail.type == 'IQAS'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.iqasno
                                })
                            }
                                
                            if(detail.type == 'CES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.cesno
                                })
                            }
                                
                            if(detail.type == 'ICAS'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.icasno
                                })
                            }
                                
                            if(detail.type == 'visa'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.visarefno
                                })
                            }
                                
                            if(detail.type == 'MYIEE'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.myieeno
                                })
                            }
                                
                            if(detail.type == 'ICES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.icesno
                                })
                            }
                                
                            if(detail.type == 'NASBA'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.nasbano
                                })
                            }
                                
                            if(detail.type == 'Educational Perspective'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.eduperno
                                })
                            }
                                
                            if(detail.type == 'NCEES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.nceesno
                                })
                            }
                                
                            if(detail.type == 'NARIC'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.naricno
                                })
                            }

                            if(detail.type == 'National Committee on Accreditation'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.ncano
                                })
                            }
                                
                            if(detail.type == 'Educational credential evaluators WES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.wesno
                                })
                            }
                            if(detail.type == 'HRD'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.hrdno
                                })
                            }
                                
                            if(detail.type == 'others'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.otheraccno
                                })
                            }
                                
                        })
                        var status;
                        if(student.status == 'new' || student.status == 'repeat'){
                            if(student.collegeConfirmation == true && student.transcriptRequiredMail == null){
                                status = 'College Confirmation'
                            }else if(student.transcriptRequiredMail == true && (student.collegeConfirmation == true || student.collegeConfirmation == null)){
                                status = 'On Hold'
                            }else{
                                status = student.status
                            }
                        }else{
                            status = student.status 
                        }
                        students.push({
                            id : student.id,
                            name :student.name,
                            email : student.email,
                            tracker : student.tracker,
                            status : status,
                            current_location: student.current_location,
                            user_id : student.user_id,
                            colleges : collegesData,
                            instructionalField:student.instructionalField,
                            educationalDetails:student.educationalDetails,
                            CompetencyLetter : student.CompetencyLetter,
                            Letterfor_NameChange : student.LetterforNameChange,
                            gradToPer : student.gradToPer,
                            curriculum:student.curriculum,
                            affiliation : student.affiliation,
                            types : purpose,
                            notes : student.notes,
                            collegeConfirmation : student.collegeConfirmation,
                            application_date : moment(new Date(student.created_at)).format("DD/MM/YYYY")
                        });
                        callback();
                    })
                },200)
               // });
            }, function(){
                res.json({
                    status: 200,
                    message: 'Student retrive successfully',
                    items : students,
                    total_count : countObjects
                });
            });
        });
    })
});
router.get('/adminDashboard/totalforfinance', function (req, res) {
    var students = [];
    var page = req.query.page;
    var id = req.query.id ? req.query.id : '';
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
    var year = req.query.acadYear ? req.query.acadYear : '';
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(id != '' && id != null && id != undefined && id != 'null' && id != 'undefined'){
        var filter ={};
        filter.name = 'application_id';
        filter.value = id;
        filters.push(filter);
    }

    if(name != '' && name != null && name != undefined && name != 'null' && name != 'undefined'){
        var filter ={};
        var filter1 = {};
        var nameSplit = name.split(' ');
        if(nameSplit.length == 1){
             filter.name = 'name';
            // filter.value = nameSplit[0];
            filter.value = " AND( u.name like '%" + nameSplit[0] + "%' OR u.surname like '%" + nameSplit[0] + "%') ";
            filters.push(filter);
        }else if(nameSplit.length == 2){
             filter.name = 'name';
            // filter.value = nameSplit[0];
            // filters.push(filter);
            // filter1.name = 'surname';
            // filter1.value = nameSplit[1];
            filter.value = " AND u.name like '%" + nameSplit[0] + "%' AND u.surname like '%" + nameSplit[1] + "%' ";
            filters.push(filter);
        }else{
             filter.name = 'name';
             var lastElement = nameSplit.pop();
            // filter.value = nameSplit.join(' ');
            // filters.push(filter);
            // filter1.name = 'surname';
            // filter1.value = lastElement;
            filter.value = " AND u.name like '%" + nameSplit.join(' ') + "%' AND u.surname like '%" + lastElement + "%' ";
            filters.push(filter);
        }
        
    }
    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(year != '' && year != null && year != undefined && year != 'null' && year != 'undefined'){	
        var filter ={};	
		var currentyear = year;	
		var startdate = currentyear+"-04-01";	
		var year = parseInt(currentyear) + 1;	
		var enddate = year + "-04-01"  ;	
        filter.name = 'application_year';	
        filter.value = " AND a.created_at BETWEEN '" + startdate + "' AND '" + enddate + "'";	
        filters.push(filter);	
	// }else{	
    //     var filter ={};	
	// 	var month = moment().month() + 1;	
    //     if(month >=1 && month <4){	
    //         var currentyear = moment().year() - 1;	
    //         var startdate = currentyear+"-04-01";	
    //         var year = parseInt(currentyear) + 1;	
    //         var enddate = year + "-03-31"  ;	
    //         filter.name = 'application_year';	
    //         filter.value = " AND a.created_at BETWEEN '" + startdate + "' AND '" + enddate + "'";	
    //     }else if(month >=4 && month <=12){	
    //         var currentyear = moment().year();	
    //         var startdate = currentyear+"-04-01";	
    //         var year = parseInt(currentyear) + 1;	
    //         var enddate = year + "-03-31"  ;	
    //         filter.name = 'application_year';	
    //         filter.value = " AND a.created_at BETWEEN '" + startdate + "' AND '" + enddate + "'";	
    //     }	
    //     filters.push(filter);	
	}  

   models.Application.getTotalUserApplications(filters,null,null).then(data1 => {
        countObjects.totalLength = data1.length;
        var course ='';
        var college = ';'
        models.Application.getTotalUserApplications(filters,limit,offset).then(data => {
            countObjects.filteredLength = data.length;

            require('async').eachSeries(data, function(student, callback){
                var  collegesData = [];

                models.Orders.find({
                    where : {
                        application_id :  student.id
                    }
                }).then(function (order_details){
                                if(order_details){
                                    models.Transaction.find({
                                        where : {
                                            order_id :  order_details.id
                                        }
                                    }).then(function(transaction_details){
                                        students.push({
                                            order_id :  order_details.id,
                                            amount_payable :  order_details.amount,
                                            tracking_id  : transaction_details.tracking_id,
                                            split_status :  transaction_details.split_status
                                        })
                                    })
                                }
                            
                        });

                    models.userMarkList.getdistinctClg(student.user_id).then(function(allcourse){
                     
                            allcourse.forEach(function (courseData){
                                course = courseData.type + 'of' + courseData.faculty,
                                college = courseData.name;
                            })
                    })
                       
                if(student.educationalDetails == true){
                    models.User_Transcript.getCollegeName(student.user_id).then(function(transcriptColleges){
                        var colleges = [];
                        // models.userMarkList.getdistinctClg(student.user_id).then(function(course){

                     
                        transcriptColleges.forEach(transcriptCollege=>{
                            if(transcriptCollege.app_id != null){
                                var app_ids = transcriptCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        colleges.push(transcriptCollege);
                                    }
                                })
                            }
                        });
                       if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                    });
                }
                if(student.CompetencyLetter == true){
                    models.competency_letter.getCollegeName(student.user_id).then(function(transcriptColleges){
                        var colleges = [];
                        transcriptColleges.forEach(transcriptCollege=>{
                            if(transcriptCollege.app_id != null){
                                var app_ids = transcriptCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        colleges.push(transcriptCollege);
                                    }
                                })
                            }
                        });
                       if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                    });
                }
                if(student.instructionalField == true){
                    models.InstructionalDetails.getCollegeName(student.user_id).then(function(instructionColleges){
                        var colleges = [];
                         instructionColleges.forEach(transcriptCollege=>{
                            
                            if(transcriptCollege.app_id != null){
                                var app_ids = transcriptCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        colleges.push(transcriptCollege);
                                    }
                                })
                            }
                        });
                         if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                       
                    });
                }
                if(student.LetterforNameChange == true){
                    models.Letterfor_NameChange.getCollegeName(student.user_id).then(function(instructionColleges){
                        console.log('LetterforNameChange',instructionColleges);
                        var colleges = [];
                         instructionColleges.forEach(transcriptCollege=>{
                            
                            if(transcriptCollege.app_id != null){
                                var app_ids = transcriptCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        console.log('transcriptCollege',transcriptCollege);
                                        colleges.push(transcriptCollege);
                                    }
                                })
                            }
                        });
                         if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                       
                    });
                }
                if(student.curriculum == true){
                    models.User_Curriculum.getCollegeName(student.user_id).then(function(curriculumColleges){
                        var colleges = [];
                        curriculumColleges.forEach(transcriptCollege=>{
                            if(transcriptCollege.app_id != null){
                                var app_ids = transcriptCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        colleges.push(transcriptCollege);
                                    }
                                })
                            }
                        });
                        if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                        
                    });
                }
                if(student.gradToPer == true){
                    models.GradeToPercentageLetter.getCollegeName(student.user_id).then(function(letterColleges){
                        var colleges = [];
                        letterColleges.forEach(letterCollege=>{
                            if(letterCollege.app_id != null){
                                var app_ids = letterCollege.app_id.split(",");
                                app_ids.forEach(app_id =>{
                                    if(app_id == student.id){
                                        colleges.push(letterCollege);
                                    }
                                })
                            }
                        });
                       if(colleges.length > 0){
                            if(collegesData.length > 0){
                                colleges.forEach(college=>{
                                    var flag = false;
                                    collegesData.forEach(singleCollege=>{
                                        if(singleCollege.name == college.name){
                                            flag = true;
                                        }
                                    })
                                    if(flag == false){
                                        collegesData.push(college);
                                    }
                                })
                            }else{
                                collegesData = colleges
                            }
                        }
                    });
                }
              //  models.User_Transcript.getCollegeName(student.user_id).then(function(colleges){
                setTimeout(()=>{
                    models.Institution_details.getAllInstitutionType(student.id).then(function(types){
                        var purpose = [];
                        types.forEach(detail=>{
                            if(detail.type == 'study'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.studyrefno
                                })
                            }
                            if(detail.type == 'employment'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.emprefno
                                })
                            }
                            if(detail.type == 'IQAS'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.iqasno
                                })
                            }
                                
                            if(detail.type == 'CES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.cesno
                                })
                            }
                                
                            if(detail.type == 'ICAS'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.icasno
                                })
                            }
                                
                            if(detail.type == 'visa'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.visarefno
                                })
                            }
                                
                            if(detail.type == 'MYIEE'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.myieeno
                                })
                            }
                                
                            if(detail.type == 'ICES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.icesno
                                })
                            }
                                
                            if(detail.type == 'NASBA'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.nasbano
                                })
                            }
                                
                            if(detail.type == 'Educational Perspective'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.eduperno
                                })
                            }
                                
                            if(detail.type == 'NCEES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.nceesno
                                })
                            }
                                
                            if(detail.type == 'NARIC'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.naricno
                                })
                            }

                            if(detail.type == 'National Committee on Accreditation'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.ncano
                                })
                            }
                                
                            if(detail.type == 'Educational credential evaluators WES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.wesno
                                })
                            }
                                
                            if(detail.type == 'others'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.otheraccno
                                })
                            }
                                
                        })
                        var status;
                        if(student.status == 'new' || student.status == 'repeat'){
                            if(student.collegeConfirmation == true && student.transcriptRequiredMail == null){
                                status = 'College Confirmation'
                            }else if(student.transcriptRequiredMail == true && (student.collegeConfirmation == true || student.collegeConfirmation == null)){
                                status = 'On Hold'
                            }else{
                                status = student.status
                            }
                        }else{
                            status = student.status 
                        }
                        students.push({
                            id : student.id,
                            name :student.name,
                            email : student.email,
                            tracker : student.tracker,
                            status : status,
                            current_location: student.current_location,
                            user_id : student.user_id,
                            colleges : collegesData,
                            instructionalField:student.instructionalField,
                            educationalDetails:student.educationalDetails,
                            CompetencyLetter : student.CompetencyLetter,
                            Letterfor_NameChange : student.LetterforNameChange,
                            gradToPer : student.gradToPer,
                            curriculum:student.curriculum,
                            affiliation : student.affiliation,
                            types : purpose,
                            notes : student.notes,
                            collegeConfirmation : student.collegeConfirmation,
                            course : course,
                            college : college,
                            // order_id : student.id,
                            application_date : moment(new Date(student.created_at)).format("DD/MM/YYYY")
                        });
                        callback();
                    })
                },200)
               // });
            }, function(){
                res.json({
                    status: 200,
                    message: 'Student retrive successfully',
                    items : students,
                    total_count : countObjects
                });
            
        })
        });
    })
});

router.get('/adminDashboard/verified', function (req, res) {
    var students = [];
    models.Application.getVerifiedUserApplications(req.query.value).then(data => {
        require('async').eachSeries(data, function(student, callback){
            models.Institution_details.getAllInstitutionType(student.id).then(function(types){
                var wesType = false;
                var purpose = [];
                var icasFlag = false;
                    types.forEach(detail=>{
                        if(detail.type == 'study'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.studyrefno,
                                email : detail.email
                            })
                        }
                        if(detail.type == 'employment'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.emprefno,
                                email : detail.email
                            })
                        }
                        if(detail.type == 'IQAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.iqasno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'CES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.cesno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'ICAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icasno,
                                email : detail.email
                            })
                            icasFlag = true;
                        }
                            
                        if(detail.type == 'visa'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.visarefno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'MYIEE'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.myieeno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'ICES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icesno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'NASBA'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nasbano,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'Educational Perspective'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.eduperno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'NCEES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nceesno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'NARIC'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.naricno,
                                email : detail.email
                            })
                        }

                        if(detail.type == 'National Committee on Accreditation'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.ncano,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'Educational credential evaluators WES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.wesno,
                                email : detail.email
                            })
                            wesType = true;
                        }
                        if(detail.type == 'HRD'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.hrdno
                            })
                        }   
                        if(detail.type == 'others'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.otheraccno,
                                email : detail.email
                            })
                        }
                            
                    })
                students.push({
                    id : student.id,
                    name :student.name,
                    email : student.email,
                    tracker : student.tracker,
                    user_id : student.user_id,
                    instructionalField:student.instructionalField,
                    educationalDetails:student.educationalDetails,
                    gradToPer : student.gradToPer,
                    approved_by :student.approved_by,
                    applying_for:student.applying_for,
                    curriculum:student.curriculum,
                    affiliation : student.affiliation,
                    CompetencyLetter : student.CompetencyLetter,
                    current_location: student.current_location,
                    Letterfor_NameChange : student.LetterforNameChange,
                    types : purpose,
                    notes : student.notes,
                    collegeConfirmation : student.collegeConfirmation,
                    application_date : moment(new Date(student.application_date)).format("DD/MM/YYYY"),
                    wesType : wesType,
                    icasFlag : icasFlag
                });
                callback();
            })
        }, function(){
            res.json({
                status: 200,
                message: 'Student retrive successfully',
                items : students,
                total_count : students.length
            });
        });
    });
});

router.get('/adminDashboard/purposeWise_verified', function (req, res) {
    var students = [];
    var purposewise=req.query.event;
    models.Application.getPurposeWiseVerified(purposewise).then(data => {
        require('async').eachSeries(data, function(student, callback){
            models.Institution_details.getAllInstitutionType(student.id).then(function(types){
                var wesType = false;
                var purpose = [];
                var icasFlag = false;
                    types.forEach(detail=>{
                        console.log('detail.email',detail.email)
                        if(detail.type == 'study'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.studyrefno,
                                email : detail.email
                            })
                        }
                        if(detail.type == 'employment'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.emprefno,
                                email : detail.email
                            })
                        }
                        if(detail.type == 'IQAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.iqasno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'CES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.cesno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'ICAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icasno,
                                email : detail.email
                            })
                            icasFlag = true;
                        }
                            
                        if(detail.type == 'visa'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.visarefno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'MYIEE'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.myieeno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'ICES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icesno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'NASBA'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nasbano,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'Educational Perspective'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.eduperno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'NCEES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nceesno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'NARIC'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.naricno,
                                email : detail.email
                            })
                        }

                        if(detail.type == 'National Committee on Accreditation'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.ncano,
                                email : detail.email
                            })
                        }
                        if(detail.type == 'HRD'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.hrdno
                            })
                        }
                        if(detail.type == 'Educational credential evaluators WES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.wesno,
                                email : detail.email
                            })
                            wesType = true;
                        }
                            
                        if(detail.type == 'others'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.otheraccno,
                                email : detail.email
                            })
                        }
                            
                    })
                students.push({
                    id : student.id,
                    name :student.name,
                    email : student.email,
                    tracker : student.tracker,
                    user_id : student.user_id,
                    instructionalField:student.instructionalField,
                    educationalDetails:student.educationalDetails,
                    gradToPer : student.gradToPer,
                    approved_by :student.approved_by,
                    applying_for:student.applying_for,
                    curriculum:student.curriculum,
                    affiliation : student.affiliation,
                    CompetencyLetter : student.CompetencyLetter,
                    current_location: student.current_location,
                    types : purpose,
                    notes : student.notes,
                    collegeConfirmation : student.collegeConfirmation,
                    application_date : moment(new Date(student.application_date)).format("DD/MM/YYYY"),
                    wesType : wesType,
                    icasFlag : icasFlag
                });
                callback();
            })
        }, function(){
            res.json({
                status: 200,
                message: 'Student retrive successfully',
                items : students,
                total_count : students.length
            });
        });
    });
});
router.get('/adminDashboard/checksignedpdf',function(req,res){
    
    var pdfexist = false;
    var user_id = req.query.user_id;
    var count = 0;
    var filecount = 0;
    var appl_id = req.query.appl_id;

     models.Emailed_Docs.findAll({
        where :{
           app_id : appl_id        }
    }).then((files)=>{
        filecount = filecount + files.length;
        if(files.length> 0){
            files.forEach((filedata)=>{
                if (fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+filedata.filename)){
                    count++;
                }  
            }) 
        }
    })
    setTimeout(()=>{
        if(filecount > 0){
            if( filecount == count){
                    pdfexist = true;
                    res.json({
                        status : 200,
                        pdfexist : pdfexist
                    })
                }else{
                    pdfexist = false;
                    res.json({
                        status : 400,
                        pdfexist : pdfexist
                    })
                }
            }else{
                pdfexist = false;
                res.json({
                    status : 400,
                    pdfexist : pdfexist
                }) 
            }
        },3000);    
    
})

router.get('/adminDashboard/signed', function (req, res) {
    var data = [];
    models.Application.getSignedUserApplications(req.query.value).then(signedusers => {
        if(signedusers != null) {
            require('async').eachSeries(signedusers, function(signeduser, callback){
                var pdfexist = false;
                var filepath;
                if (fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+signeduser.user_id+"/"+signeduser.id+"_Merge.pdf")){
                    pdfexist = true;
                    filepath = constant.FILE_LOCATION+"public/signedpdf/"+signeduser.user_id+"/"+signeduser.id+"_Merge.pdf";
                }
                models.Institution_details.getAllInstitutionType(signeduser.id).then(function(types){ 
                    var purpose = [];
                    types.forEach(detail=>{
                        if(detail.type == 'study'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.studyrefno,
                                email : detail.email
                            })
                        }
                        if(detail.type == 'employment'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.emprefno,
                                email : detail.email
                            })
                        }
                        if(detail.type == 'IQAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.iqasno
                            })
                        }
                            
                        if(detail.type == 'CES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.cesno
                            })
                        }
                            
                        if(detail.type == 'ICAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icasno
                            })
                        }
                            
                        if(detail.type == 'visa'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.visarefno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'MYIEE'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.myieeno
                            })
                        }
                            
                        if(detail.type == 'ICES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icesno
                            })
                        }
                            
                        if(detail.type == 'NASBA'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nasbano
                            })
                        }
                            
                        if(detail.type == 'Educational Perspective'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.eduperno
                            })
                        }
                            
                        if(detail.type == 'NCEES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nceesno
                            })
                        }
                            
                        if(detail.type == 'NARIC'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.naricno
                            })
                        }

                        if(detail.type == 'National Committee on Accreditation'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.ncano
                            })
                        }
                        if(detail.type == 'HRD'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.hrdno
                            })
                        }    
                        // if(detail.type == 'Educational credential evaluators WES'){
                        //     purpose.push({
                        //         type : detail.type,
                        //         referenceNo : detail.wesno
                        //     })
                        // }
                            
                        if(detail.type == 'others'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.otheraccno,
                                email : detail.email
                            })
                        }
                            
                    })
                    
                    var obj = {
                        id: (signeduser.id) ? signeduser.id : '',
                        name: (signeduser.name) ? signeduser.name : '',
                        email : signeduser.email,
                        approved_by: (signeduser.approved_by) ? signeduser.approved_by : '',
                        user_id: (signeduser.user_id) ? signeduser.user_id : '',
                        instructionalField:signeduser.instructionalField,
                        educationalDetails:signeduser.educationalDetails,
                        affiliation : signeduser.affiliation,
                        curriculum:signeduser.curriculum,
                        gradToPer : signeduser.gradToPer,
                        CompetencyLetter : signeduser.CompetencyLetter,
                        LetterforNameChange : signeduser.LetterforNameChange,
                        types : purpose,
                        application_date : moment(new Date(signeduser.created_at)).format('DD/MM/YYYY'),
                        updated_at: (signeduser.updated_at) ? signeduser.updated_at : '',
                        pdfexist : pdfexist,
                        current_location: signeduser.current_location,
                        notes : signeduser.notes,
                        referenceNo : signeduser.reference_no,
                        collegeConfirmation : signeduser.collegeConfirmation,
                        filepath : filepath ? filepath : ''
                    };
                    data.push(obj);
                    callback();
                }) 
            }, function(){
                res.json({
                    status: 200,
                    message: 'Student retrive successfully',
                    items : data,
                    total_count : signedusers.length
                });
            });
        } else {
            res.json({
                status: 400,
                message: 'Problem in retrieving student list'
            });
        }
    });
});


router.get('/adminDashboard/purposeWise_signed', function (req, res) {
   console.log('purposeWise_signed',req.query.event)
    var data = [];
    var purposewise=req.query.event;
    models.Application.getPurposeWiseApplication(purposewise).then(signedusers => {
        if(signedusers != null) {
            require('async').eachSeries(signedusers, function(signeduser, callback){
                var pdfexist = false;
                var filepath;
                if (fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+signeduser.user_id+"/"+signeduser.id+"_Merge.pdf")){
                    pdfexist = true;
                    filepath = constant.FILE_LOCATION+"public/signedpdf/"+signeduser.user_id+"/"+signeduser.id+"_Merge.pdf";
                }
                models.Institution_details.getAllInstitutionType(signeduser.id).then(function(types){ 
                    var purpose = [];
                    types.forEach(detail=>{
                        if(detail.type == 'study'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.studyrefno,
                                email : detail.email
                            })
                        }
                        if(detail.type == 'employment'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.emprefno,
                                email : detail.email
                            })
                        }
                        if(detail.type == 'IQAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.iqasno
                            })
                        }
                            
                        if(detail.type == 'CES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.cesno
                            })
                        }
                            
                        if(detail.type == 'ICAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icasno
                            })
                        }
                            
                        if(detail.type == 'visa'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.visarefno,
                                email : detail.email
                            })
                        }
                            
                        if(detail.type == 'MYIEE'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.myieeno
                            })
                        }
                            
                        if(detail.type == 'ICES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icesno
                            })
                        }
                            
                        if(detail.type == 'NASBA'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nasbano
                            })
                        }
                            
                        if(detail.type == 'Educational Perspective'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.eduperno
                            })
                        }
                        if(detail.type == 'HRD'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.hrdno
                            })
                        }     
                        if(detail.type == 'NCEES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nceesno
                            })
                        }
                            
                        if(detail.type == 'NARIC'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.naricno
                            })
                        }

                        if(detail.type == 'National Committee on Accreditation'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.ncano
                            })
                        }
                            
                        // if(detail.type == 'Educational credential evaluators WES'){
                        //     purpose.push({
                        //         type : detail.type,
                        //         referenceNo : detail.wesno
                        //     })
                        // }
                            
                        if(detail.type == 'others'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.otheraccno,
                                email : detail.email
                            })
                        }
                            
                    })
                    
                    var obj = {
                        id: (signeduser.id) ? signeduser.id : '',
                        name: (signeduser.name) ? signeduser.name : '',
                        email : signeduser.email,
                        approved_by: (signeduser.approved_by) ? signeduser.approved_by : '',
                        user_id: (signeduser.user_id) ? signeduser.user_id : '',
                        instructionalField:signeduser.instructionalField,
                        educationalDetails:signeduser.educationalDetails,
                        affiliation : signeduser.affiliation,
                        curriculum:signeduser.curriculum,
                        gradToPer : signeduser.gradToPer,
                        CompetencyLetter : signeduser.CompetencyLetter,
                        types : purpose,
                        application_date : moment(new Date(signeduser.created_at)).format('DD/MM/YYYY'),
                        updated_at: (signeduser.updated_at) ? signeduser.updated_at : '',
                        pdfexist : pdfexist,
                        current_location: signeduser.current_location,
                        notes : signeduser.notes,
                        collegeConfirmation : signeduser.collegeConfirmation,
                        filepath : filepath ? filepath : ''
                    };
                    data.push(obj);
                    callback();
                }) 
            }, function(){
                res.json({
                    status: 200,
                    message: 'Student retrive successfully',
                    items : data,
                    total_count : signedusers.length
                });
            });
        } else {
            res.json({
                status: 400,
                message: 'Problem in retrieving student list'
            });
        }
    });
});
router.get('/adminDashboard/emailed', function (req, res) {

    var students = [];
    var page = req.query.page;
    var id = req.query.id ? req.query.id : '';
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
    var year = req.query.acadYear ? req.query.acadYear : '';
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(id != '' && id != null && id != undefined && id != 'null' && id != 'undefined'){
        var filter ={};
        filter.name = 'application_id';
        filter.value = id;
        filters.push(filter);
    }
    if(name != '' && name != null && name != undefined && name != 'null' && name != 'undefined'){
        var filter ={};
        var filter1 = {};
        var nameSplit = name.split(' ');
        if(nameSplit.length == 1){
             filter.name = 'name';
            // filter.value = nameSplit[0];
            filter.value = " AND( u.name like '%" + nameSplit[0] + "%' OR u.surname like '%" + nameSplit[0] + "%') ";
            filters.push(filter);
        }else if(nameSplit.length == 2){
             filter.name = 'name';
            // filter.value = nameSplit[0];
            // filters.push(filter);
            // filter1.name = 'surname';
            // filter1.value = nameSplit[1];
            filter.value = " AND u.name like '%" + nameSplit[0] + "%' AND u.surname like '%" + nameSplit[1] + "%' ";
            filters.push(filter);
        }else{
             filter.name = 'name';
             var lastElement = nameSplit.pop();
            // filter.value = nameSplit.join(' ');
            // filters.push(filter);
            // filter1.name = 'surname';
            // filter1.value = lastElement;
            filter.value = " AND u.name like '%" + nameSplit.join(' ') + "%' AND u.surname like '%" + lastElement + "%' ";
            filters.push(filter);
        }
        
    }
    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(year != '' && year != null && year != undefined && year != 'null' && year != 'undefined'){	
        var filter ={};	
		var currentyear = year;	
		var startdate = currentyear+"-04-01";	
		var year = parseInt(currentyear) + 1;	
		var enddate = year + "-04-01"  ;	
        filter.name = 'application_year';	
        filter.value = " AND a.created_at BETWEEN '" + startdate + "' AND '" + enddate + "'";	
        filters.push(filter);	
    }


        var data=[];
                    
        models.Application.getEmailedUserApplications(filters,null,null).then(signedusersData => {
            countObjects.totalLength =signedusersData.length;
            models.Application.getEmailedUserApplications(filters,limit,offset).then(signedusers => {
                countObjects.filteredLength =signedusers.length;
            if(signedusers != null) {
                require('async').eachSeries(signedusers, function(signeduser, callback){
                    var pdfexist = false;
                    var filepath;
                    if (fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+signeduser.user_id+"/"+signeduser.id+"_Merge.pdf")){
                        pdfexist = true;
                        filepath = constant.FILE_LOCATION+"public/signedpdf/"+signeduser.user_id+"/"+signeduser.id+"_Merge.pdf";
                    }
                    models.Institution_details.getAllInstitutionType(signeduser.id).then(function(types){
                        var purpose = [];
                    types.forEach(detail=>{
                        if(detail.type == 'study'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.studyrefno
                            })
                        }
                        if(detail.type == 'employment'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.emprefno
                            })
                        }
                        if(detail.type == 'IQAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.iqasno
                            })
                        }
                            
                        if(detail.type == 'CES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.cesno
                            })
                        }
                            
                        if(detail.type == 'ICAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icasno
                            })
                        }
                            
                        if(detail.type == 'visa'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.visarefno
                            })
                        }
                        if(detail.type == 'HRD'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.hrdno
                            })
                        }   
                        if(detail.type == 'MYIEE'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.myieeno
                            })
                        }
                            
                        if(detail.type == 'ICES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icesno
                            })
                        }
                            
                        if(detail.type == 'NASBA'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nasbano
                            })
                        }
                            
                        if(detail.type == 'Educational Perspective'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.eduperno
                            })
                        }
                            
                        if(detail.type == 'NCEES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nceesno
                            })
                        }
                            
                        if(detail.type == 'NARIC'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.naricno
                            })
                        }
                        
                        if(detail.type == 'National Committee on Accreditation'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.ncano
                            })
                        }

                        if(detail.type == 'Educational credential evaluators WES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.wesno
                            })
                        }
                            
                        if(detail.type == 'others'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.otheraccno
                            })
                        }
                            
                    })
                        if(types.length > 0){
                            
                            models.EmailActivityTracker.find({
                                where :{
                                    subject : 'Official Record of  ' + signeduser.name,
                                    email : types[0].email
                                }
                            }).then(function(tracker){
                                var email_status ;
                                if(tracker){
                                    if(tracker.opens_count > 0){
                                        email_status = 'opened';
                                    }else{
                                        email_status = tracker.status;
                                    }
                                }else{
                                    email_status = '-';
                                }
                                var obj = {
                                    id: (signeduser.id) ? signeduser.id : '',
                                    email : (signeduser.email) ? signeduser.email : '',
                                    name: (signeduser.name) ? signeduser.name : '',
                                    approved_by: (signeduser.approved_by) ? signeduser.approved_by : '',
                                    user_id: (signeduser.user_id) ? signeduser.user_id : '',
                                    instructionalField : signeduser.instructionalField,
                                    curriculum : signeduser.curriculum,
                                    educationalDetails : signeduser.educationalDetails,
                                    affiliation : signeduser.affiliation,
                                    gradToPer : signeduser.gradToPer,
                                    CompetencyLetter : signeduser.CompetencyLetter,
                                    LetterforNameChange : signeduser.LetterforNameChange,
                                   
                                    types : purpose,
                                    current_location: signeduser.current_location,
                                    application_date : moment(new Date(signeduser.created_at)).format('DD/MM/YYYY'),
                                    email_status : email_status,
                                    updated_at: moment(new Date(signeduser.updated_at)).format('DD/MM/YYYY'),
                                    pdfexist : pdfexist,
                                    notes : signeduser.notes,
                                    collegeConfirmation : signeduser.collegeConfirmation,
                                    filepath : filepath ? filepath : '' 
                                };
                                data.push(obj);
                                callback();
                            })
                        }else{
                            var obj = {
                                id: (signeduser.id) ? signeduser.id : '',
                                email : (signeduser.email) ? signeduser.email : '',
                                name: (signeduser.name) ? signeduser.name : '',
                                approved_by: (signeduser.approved_by) ? signeduser.approved_by : '',
                                user_id: (signeduser.user_id) ? signeduser.user_id : '',
                                instructionalField : signeduser.instructionalField,
                                curriculum : signeduser.curriculum,
                                educationalDetails : signeduser.educationalDetails,
                                affiliation : signeduser.affiliation,
                                current_location: signeduser.current_location,
                                gradToPer : signeduser.gradToPer,
                                types : purpose,
                                application_date : moment(new Date(signeduser.created_at)).format('DD/MM/YYYY'),
                                email_status : '-',
                                updated_at: (signeduser.updated_at) ? signeduser.updated_at : '',
                                pdfexist : pdfexist,
                                notes : signeduser.notes,
                                collegeConfirmation : signeduser.collegeConfirmation,
                                filepath : filepath ? filepath : '' 
                            };
                            data.push(obj);
                            callback();
                        }
                    });
                }, function(){
                    res.json({
                        status: 200,
                        message: 'Student retrive successfully',
                        items : data,
                        total_count : countObjects
                    });
                });
            } else {
                res.json({
                    status: 400,
                    message: 'Problem in retrieving student list'
                });
            }
        });
    });
});

router.get('/adminDashboard/getWesFormValues', middlewares.getUserInfo,function (req, res) {
    console.log("getWesFormValues");
    wesform_Values =[];
    models.Wes_Form.findAll({
        where :{ 
            user_id : req.User.id
        }
    }).then(function (wesform ) {
        if(wesform){
            wesform_Values.push({
                "currentaddress" :  wesform[0].currentaddress,
                "state" :  wesform[0].state,
                "city" :  wesform[0].city,
                "postal_code" :  wesform[0].postal_code,
                "dob" :  wesform[0].dob,
                "institute_name" :  wesform[0].institute_name,
                "datefrom" :  wesform[0].datefrom,
                "dateto" :  wesform[0].dateto,
                "degree" :  wesform[0].degree,
                "yearaward" :  wesform[0].yearaward,
                "major" : wesform[0].major,
                "sturolno" :  wesform[0].sturolno,
                "file_name" :  wesform[0].file_name,
                "type"  : wesform[0].file_name.split('.').pop()
            })
            res.json({
                status : '200',
                data : wesform_Values
            })
        }else{
            res.json({
                status : '400'
            })
        }
    })
});
router.get('/adminDashboard/signed_namrata', function (req, res) {
 
    client.setApiKey(constant.SENDGRID_API_KEY);
    var request = {};
    request.method = 'GET';
    request.url = '/v3/messages?limit=5000&query=from_email%3D%22info%40etranscript.in%22';

    client.request(request)
        .then(([response, body]) => {

            ///i remove comments
            
            var a = JSON.stringify(response.body);

            var b = response.body.messages;

            var length = b.length;


            // res.send(JSON.stringify(response.body));
            res.json({
                status: 200,
                data: JSON.stringify(response.body),
                items: response.body.messages,
                total_count: length
            });
        });

});

router.get('/adminDashboard/getEmailActivityTracker', function (req, res) {

    var outer_counter = 0;
    client.setApiKey(constant.SENDGRID_API_KEY);
    var request = {};
    request.method = 'GET';
    request.url = '/v3/messages?limit=5000&query=from_email%3D%22info%40etranscript.in%22';

    client.request(request)
        .then(([response, body]) => {

            var a = response.body;

            var b = a.messages;

            b.forEach(function (single) {
                outer_counter++;
                models.EmailActivityTracker.find({
                    where: {
                        sg_msg_id: single.msg_id
                    }
                }).then(function (exists) {
                    if (exists) {

                        exists.update({
                            email: single.to_email,
                            subject: single.subject,
                            status: single.status,
                            opens_count: single.opens_count,
                            clicks_count: single.clicks_count,
                            sg_msg_id: single.msg_id,
                            last_event_time: single.last_event_time
                        });
                    } else {
                        //todo
                        var msg_id = single.msg_id;
                        var split = msg_id.split('.filter');

                        // models.EmailActivityTracker.find({
                        //     where:{
                        //         x_msg_id : split[0]
                        //     }
                        // }).then(function(x_exists){
                        //     if(x_exists){
                        //         x_exists.update({
                        //             email : single.to_email,
                        //             subject : single.subject,
                        //             status : single.status,
                        //             opens_count : single.opens_count,
                        //             clicks_count : single.clicks_count,
                        //             sg_msg_id : single.msg_id,
                        //             last_event_time : single.last_event_time
                        //         });
                        //     }else{
                        //         models.EmailActivityTracker.create({
                        //             email : single.to_email,
                        //             subject : single.subject,
                        //             status : single.status,
                        //             opens_count : single.opens_count,
                        //             clicks_count : single.clicks_count,
                        //             sg_msg_id : single.msg_id,
                        //             last_event_time : single.last_event_time
                        //         });
                        //     }
                        // });
                    }
                });
            });

            if (outer_counter == b.length) {

                res.json({
                    status: 200
                });
            }
        });
});

router.post('/adminDashboard/getEmailActivityTrackerMonthWise', function (req, res) {


    var a = new Date(req.body.yearMonth);
    var year = a.getFullYear();
    var month = a.getMonth() + 1;
    //var f_month = month + 1;
    var counter = 0;
    var data = 0;
    var exists_count = 0;
    var open_count = 0;
    var not_open = 0;





    models.EmailActivityTracker.findAll({
        where: {

        }
    }).then(function (emails) {
        emails.forEach(function (email) {
            counter++;
            if (email.sent_on != null) {
                var b = new Date(email.sent_on);

                var y = b.getFullYear();
                var m = b.getMonth() + 1;

                if (y == year && m == month) {

                    exists_count++;
                    if (email.opens_count != 0) {
                        open_count++;
                    } else {
                        not_open++;
                    }
                }
                data++;
            }

        });
        //
        //
        //
        //
        if (emails.length == counter) {
            res.json({
                status: 200,
                data: data,
                total_mails: exists_count,
                open_count: open_count,
                not_open: not_open
            })
        }
    });

});

router.get('/adminDashboard/unsigned_old', function (req, res) {
    console.log('/adminDashboard/unsigned');
    var students = [];
    models.Application.getUnsignedUserApplications().then(data => {
        require('async').eachSeries(data, function(student, callback){
            models.User_Transcript.getCollegeName(student.user_id).then(function(colleges){
                models.Institution_details.getAllInstitutionType(student.id).then(function(types){
                    var purpose = [];
                    types.forEach(detail=>{
                        if(detail.type == 'study'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.studyrefno
                            })
                        }
                        if(detail.type == 'employment'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.emprefno
                            })
                        }
                        if(detail.type == 'IQAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.iqasno
                            })
                        }
                            
                        if(detail.type == 'CES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.cesno
                            })
                        }
                            
                        if(detail.type == 'ICAS'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icasno
                            })
                        }
                            
                        if(detail.type == 'visa'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.visarefno
                            })
                        }
                            
                        if(detail.type == 'MYIEE'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.myieeno
                            })
                        }
                            
                        if(detail.type == 'ICES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.icesno
                            })
                        }
                            
                        if(detail.type == 'NASBA'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nasbano
                            })
                        }
                            
                        if(detail.type == 'Educational Perspective'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.eduperno
                            })
                        }
                        if(detail.type == 'HRD'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.hrdno
                            })
                        }   
                        if(detail.type == 'NCEES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.nceesno
                            })
                        }
                            
                        if(detail.type == 'NARIC'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.naricno
                            })
                        }

                        if(detail.type == 'National Committee on Accreditation'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.ncano
                            })
                        }
                            
                        if(detail.type == 'Educational credential evaluators WES'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.wesno
                            })
                        }
                            
                        if(detail.type == 'others'){
                            purpose.push({
                                type : detail.type,
                                referenceNo : detail.otheraccno
                            })
                        }
                            
                    })
                    students.push({
                        id : student.id,
                        name :student.name,
                        email : student.email,
                        user_id : student.user_id,
                        colleges : colleges,
                        instructionalField:student.instructionalField,
                        educationalDetails:student.educationalDetails,
                        curriculum:student.curriculum,
                        affiliation : student.affiliation,
                        gradToPer : student.gradToPer,
                        affiliation : student.affiliation,
                        current_location: student.current_location,
                        Letterfor_NameChange : student.LetterforNameChange,
                        types : purpose,
                        notes : student.notes,
                        collegeConfirmation : student.collegeConfirmation,
                        language : student.instruction_medium !==null ? student.instruction_medium : '--' ,
                        application_date : moment(new Date(student.created_at)).format("DD/MM/YYYY")
                    });
                    callback();
                });
            });
        }, function(){

                res.json({
                    status: 200,
                    message: 'Student retrive successfully',
                    items : students,
                    total_count : students.length
                });
            
        });
    });
});

router.get('/adminDashboard/unsigned', middlewares.getUserInfo,function (req, res) {
    console.log('/adminDashboard/unsigned_test');
    var students = [];
    //var collegesData = [];
    var page = req.query.page;
    var id = req.query.id ? req.query.id : '';
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
    var tab = req.query.tab;
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(id != '' && id != null && id != undefined && id != 'null' && id != 'undefined'){
        var filter ={};
        filter.name = 'application_id';
        filter.value = id;
        filters.push(filter);
    }

    if(name != '' && name != null && name != undefined && name != 'null' && name != 'undefined'){
        var filter ={};
        var filter1 = {};
        var nameSplit = name.split(' ');
        if(nameSplit.length == 1){
             filter.name = 'name';
            // filter.value = nameSplit[0];
            filter.value = " AND (u.name like '%" + nameSplit[0] + "%' OR u.surname like '%" + nameSplit[0] + "%' )";
            filters.push(filter);
        }else if(nameSplit.length == 2){
             filter.name = 'name';
            // filter.value = nameSplit[0];
            // filters.push(filter);
            // filter1.name = 'surname';
            // filter1.value = nameSplit[1];
            filter.value = " AND u.name like '%" + nameSplit[0] + "%' AND u.surname like '%" + nameSplit[1] + "%' ";
            filters.push(filter);
        }else{
             filter.name = 'name';
             var lastElement = nameSplit.pop();
            // filter.value = nameSplit.join(' ');
            // filters.push(filter);
            // filter1.name = 'surname';
            // filter1.value = lastElement;
            filter.value = " AND u.name like '%" + nameSplit.join(' ') + "%' AND u.surname like '%" + lastElement + "%' ";
            filters.push(filter);
        }
        
    }

    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

   

    models.Application.getUnsignedUserApplications_new(filters,null,null,tab).then(data1 => {
        countObjects.totalLength = data1.length;
        models.Application.getUnsignedUserApplications_new(filters,limit,offset,tab).then(data => {
            countObjects.filteredLength = data.length;
    
            // models.Application.getUnsignedUserApplications().then(data => {
        require('async').eachSeries(data, function(student, callback){
            var  collegesData = [];
            var errataFlag = false;
            if(student.educationalDetails == true){
                models.User_Transcript.getCollegeName(student.user_id).then(function(transcriptColleges){
                    var colleges = [];
                    transcriptColleges.forEach(transcriptCollege=>{
                        if(transcriptCollege.app_id != null){
                            var app_ids = transcriptCollege.app_id.split(",");
                            app_ids.forEach(app_id =>{
                                if(app_id == student.id){
                                    colleges.push(transcriptCollege);
                                }
                            })
                        }
                    });
                    if(colleges.length > 0){
                        if(collegesData.length > 0){
                            colleges.forEach(college=>{
                                var flag = false;
                                collegesData.forEach(singleCollege=>{
                                    if(singleCollege.name == college.name){
                                        flag = true;
                                    }
                                })
                                if(flag == false){
                                    if(student.notes != null){	
                                        if(student.notes.includes(college.name + " Confirmation Ok.")){	
                                            college.checked = true;	
                                        }else{	
                                            college.checked = false;	
                                        }	
                                    }else{	
                                        college.checked = false;	
                                    }
                                    collegesData.push(college);
                                }
                            })
                        }else{
                            colleges.forEach(college=>{	
                                if(student.notes != null){	
                                    if(student.notes.includes(college.name + " Confirmation Ok.")){	
                                        college.checked = true;	
                                    }else{	
                                        college.checked = false;	
                                    }	
                                }else{	
                                    college.checked = false;	
                                }	
                            })
                            collegesData = colleges
                        }
                    }
                    models.User_Transcript.findAll({
                        where :{
                            user_id : student.user_id,
                            upload_step : 'changed'
                        }
                    }).then(function(user_transcripts){
                        if(user_transcripts.length > 0){
                            user_transcripts.forEach(transcript=>{
                                if(transcript.app_id != null){
                                    var app_idArr = transcript.app_id.split(',');
                                    app_idArr.forEach(app_id =>{
                                        if(app_id == student.id){
                                            errataFlag = true;
                                        }
                                    })
                                }
                            })
                        }
                    })
                });
            }
            if(student.instructionalField == true){
                models.InstructionalDetails.getCollegeName(student.user_id).then(function(instructionColleges){
                    var colleges = [];
                        instructionColleges.forEach(transcriptCollege=>{
                        
                        if(transcriptCollege.app_id != null){
                            var app_ids = transcriptCollege.app_id.split(",");
                            app_ids.forEach(app_id =>{
                                if(app_id == student.id){
                                    colleges.push(transcriptCollege);
                                }
                            })
                        }
                    });
                        if(colleges.length > 0){
                        if(collegesData.length > 0){
                            colleges.forEach(college=>{
                                var flag = false;
                                collegesData.forEach(singleCollege=>{
                                    if(singleCollege.name == college.name){
                                        flag = true;
                                    }
                                })
                                if(flag == false){
                                    if(student.notes != null){	
                                        if(student.notes.includes(college.name + " Confirmation Ok.")){	
                                            college.checked = true;	
                                        }else{	
                                            college.checked = false;	
                                        }	
                                    }else{	
                                        college.checked = false;	
                                    }
                                    collegesData.push(college);
                                }
                            })
                        }else{
                            colleges.forEach(college=>{	
                                if(student.notes != null){	
                                    if(student.notes.includes(college.name + " Confirmation Ok.")){	
                                        college.checked = true;	
                                    }else{	
                                        college.checked = false;	
                                    }	
                                }else{	
                                    college.checked = false;	
                                }	
                            })
                            collegesData = colleges
                        }
                    }
                    
                });
            }
            if(student.curriculum == true){
                models.User_Curriculum.getCollegeName(student.user_id).then(function(curriculumColleges){
                    var colleges = [];
                    curriculumColleges.forEach(transcriptCollege=>{
                        if(transcriptCollege.app_id != null){
                            var app_ids = transcriptCollege.app_id.split(",");
                            app_ids.forEach(app_id =>{
                                if(app_id == student.id){
                                    colleges.push(transcriptCollege);
                                }
                            })
                        }
                    });
                    if(colleges.length > 0){
                        if(collegesData.length > 0){
                            colleges.forEach(college=>{
                                var flag = false;
                                collegesData.forEach(singleCollege=>{
                                    if(singleCollege.name == college.name){
                                        flag = true;
                                    }
                                })
                                if(flag == false){
                                    if(student.notes != null){	
                                        if(student.notes.includes(college.name + " Confirmation Ok.")){	
                                            college.checked = true;	
                                        }else{	
                                            college.checked = false;	
                                        }	
                                    }else{	
                                        college.checked = false;	
                                    }
                                    collegesData.push(college);
                                }
                            })
                        }else{
                            colleges.forEach(college=>{	
                                if(student.notes != null){	
                                    if(student.notes.includes(college.name + " Confirmation Ok.")){	
                                        college.checked = true;	
                                    }else{	
                                        college.checked = false;	
                                    }	
                                }else{	
                                    college.checked = false;	
                                }	
                            })
                            collegesData = colleges
                        }
                    }
                    models.User_Curriculum.findAll({
                        where :{
                            user_id : student.user_id,
                            upload_step : 'changed'
                        }
                    }).then(function(user_curriculums){
                        if(user_curriculums.length > 0){
                            user_curriculums.forEach(curriculum=>{
                                if(curriculum.app_id != null){
                                    var app_idArr = curriculum.app_id.split(',');
                                    app_idArr.forEach(app_id =>{
                                        if(app_id == student.id){
                                            errataFlag = true;
                                        }
                                    })
                                }
                            })
                        }
                    })
                });
            }
            if(student.gradToPer == true){
                models.GradeToPercentageLetter.getCollegeName(student.user_id).then(function(letterColleges){
                    var colleges = [];
                    letterColleges.forEach(letterCollege=>{
                        if(letterCollege.app_id != null){
                            var app_ids = letterCollege.app_id.split(",");
                            app_ids.forEach(app_id =>{
                                if(app_id == student.id){
                                    colleges.push(letterCollege);
                                }
                            })
                        }
                    });
                    if(colleges.length > 0){
                        if(collegesData.length > 0){
                            colleges.forEach(college=>{
                                var flag = false;
                                collegesData.forEach(singleCollege=>{
                                    if(singleCollege.name == college.name){
                                        flag = true;
                                    }
                                })
                                if(flag == false){
                                    if(student.notes != null){	
                                        if(student.notes.includes(college.name + " Confirmation Ok.")){	
                                            college.checked = true;	
                                        }else{	
                                            college.checked = false;	
                                        }	
                                    }else{	
                                        college.checked = false;	
                                    }
                                    collegesData.push(college);
                                }
                            })
                        }else{
                            colleges.forEach(college=>{	
                                if(student.notes != null){	
                                    if(student.notes.includes(college.name + " Confirmation Ok.")){	
                                        college.checked = true;	
                                    }else{	
                                        college.checked = false;	
                                    }	
                                }else{	
                                    college.checked = false;	
                                }	
                            })
                            collegesData = colleges
                        }
                    }
                    models.GradeToPercentageLetter.findAll({
                        where :{
                            user_id : student.user_id,
                            upload_step : 'changed'
                        }
                    }).then(function(letters){
                        if(letters.length > 0){
                            letters.forEach(letter=>{
                                if(letter.app_id != null){
                                    var app_idArr = letter.app_id.split(',');
                                    app_idArr.forEach(app_id =>{
                                        if(app_id == student.id){
                                            errataFlag = true;
                                        }
                                    })
                                }
                            })
                        }
                    })
                });
            }
            if(student.CompetencyLetter == true){
                models.competency_letter.getCollegeName(student.user_id).then(function(transcriptColleges){
                    var colleges = [];
                    transcriptColleges.forEach(transcriptCollege=>{
                        if(transcriptCollege.app_id != null){
                            var app_ids = transcriptCollege.app_id.split(",");
                            app_ids.forEach(app_id =>{
                                if(app_id == student.id){
                                    colleges.push(transcriptCollege);
                                }
                            })
                        }
                    });
                    if(colleges.length > 0){
                        if(collegesData.length > 0){
                            colleges.forEach(college=>{
                                var flag = false;
                                collegesData.forEach(singleCollege=>{
                                    if(singleCollege.name == college.name){
                                        flag = true;
                                    }
                                })
                                if(flag == false){
                                    if(student.notes != null){	
                                        if(student.notes.includes(college.name + " Confirmation Ok.")){	
                                            college.checked = true;	
                                        }else{	
                                            college.checked = false;	
                                        }	
                                    }else{	
                                        college.checked = false;	
                                    }
                                    collegesData.push(college);
                                }
                            })
                        }else{
                            colleges.forEach(college=>{	
                                if(student.notes != null){	
                                    if(student.notes.includes(college.name + " Confirmation Ok.")){	
                                        college.checked = true;	
                                    }else{	
                                        college.checked = false;	
                                    }	
                                }else{	
                                    college.checked = false;	
                                }	
                            })
                            collegesData = colleges
                        }
                    }
                    models.competency_letter.findAll({
                        where :{
                            user_id : student.user_id,
                            upload_step : 'changed'
                        }
                    }).then(function(user_transcripts){
                        if(user_transcripts.length > 0){
                            user_transcripts.forEach(transcript=>{
                                if(transcript.app_id != null){
                                    var app_idArr = transcript.app_id.split(',');
                                    app_idArr.forEach(app_id =>{
                                        if(app_id == student.id){
                                            errataFlag = true;
                                        }
                                    })
                                }
                            })
                        }
                    })
                });
            }
            // if(student.affiliation == true){
            //     models.Affilation_Letter.getCollegeName(student.user_id).then(function(instructionColleges){
            //         var colleges = [];
            //             instructionColleges.forEach(transcriptCollege=>{
                        
            //             if(transcriptCollege.app_id != null){
            //                 var app_ids = transcriptCollege.app_id.split(",");
            //                 app_ids.forEach(app_id =>{
            //                     if(app_id == student.id){
            //                         colleges.push(transcriptCollege);
            //                     }
            //                 })
            //             }
            //         });
            //             if(colleges.length > 0){
            //             if(collegesData.length > 0){
            //                 colleges.forEach(college=>{
            //                     var flag = false;
            //                     collegesData.forEach(singleCollege=>{
            //                         if(singleCollege.name == college.name){
            //                             flag = true;
            //                         }
            //                     })
            //                     if(flag == false){
            //                         if(student.notes != null){	
            //                             if(student.notes.includes(college.name + " Confirmation Ok.")){	
            //                                 college.checked = true;	
            //                             }else{	
            //                                 college.checked = false;	
            //                             }	
            //                         }else{	
            //                             college.checked = false;	
            //                         }
            //                         collegesData.push(college);
            //                     }
            //                 })
            //             }else{
            //                 colleges.forEach(college=>{	
            //                     if(student.notes != null){	
            //                         if(student.notes.includes(college.name + " Confirmation Ok.")){	
            //                             college.checked = true;	
            //                         }else{	
            //                             college.checked = false;	
            //                         }	
            //                     }else{	
            //                         college.checked = false;	
            //                     }	
            //                 })
            //                 collegesData = colleges
            //             }
            //         }
                    
            //     });
            // }
            
            // models.User_Transcript.getCollegeIDs(student.user_id).then(function(colleges){
           
            //     if(colleges.length > 0){
            //         var colg = colleges[0].collegeId;
            //         var coll_array = colg.split(','); 
            //         var status ;
            //        // var json_colgs = JSON.parse(coll_array);
            //        	if(colleges[0].TranscriptStatus && colleges[0].instructionStatus && colleges[0].curriculumStatus){
            //        		status : colleges[0].TranscriptStatus
            //        	}else {
            //        		status : "not_sent"
            //        	}
            //         coll_array.forEach(coll =>{
            //             models.College.find({
            //                 where:{
            //                     id : coll
            //                 }
            //             }).then(function (college) {
            //                 collegesData.push({
            //                 	id : college.id, 
            //                 	name : college.name, 
            //                 	emailId :college.emailId, 
            //                 	contactPerson : college.contactPerson, 
            //                 	contactNo : college.contactNo, 
            //                 	alternateContactPerson : college.alternateContactPerson, 
            //                 	alternateContactNo : college.alternateContactNo, 
            //                 	alternateEmailId : college.alternateEmailId,
            //                 	collegeEmailStatus : status
            //                 })
            // 			})
            //         })

            //     }
            // })  

            setTimeout(()=>{
                models.UserMarklist_Upload.findAll({
                    where :{
                        user_id : student.user_id,
                        upload_step : 'changed'
                    }
                }).then(function(user_marksheets){
                    if(user_marksheets.length > 0){
                        user_marksheets.forEach(marksheet=>{
                            if(marksheet.app_id != null){
                                var app_idArr = marksheet.app_id.split(',');
                                app_idArr.forEach(app_id =>{
                                    if(app_id == student.id){
                                        errataFlag = true;
                                    }
                                })
                            }
                        })
                    }
               
                    models.Institution_details.getAllInstitutionType(student.id).then(function(types){
                        var purpose = [];
                        types.forEach(detail=>{
                            if(detail.type == 'study'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.studyrefno
                                })
                            }
                            if(detail.type == 'employment'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.emprefno
                                })
                            }
                            if(detail.type == 'IQAS'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.iqasno
                                })
                            }
                                
                            if(detail.type == 'CES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.cesno
                                })
                            }
                                
                            if(detail.type == 'ICAS'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.icasno
                                })
                            }
                                
                            if(detail.type == 'visa'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.visarefno
                                })
                            }
                                
                            if(detail.type == 'MYIEE'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.myieeno
                                })
                            }
                                
                            if(detail.type == 'ICES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.icesno
                                })
                            }
                                
                            if(detail.type == 'NASBA'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.nasbano
                                })
                            }
                                
                            if(detail.type == 'Educational Perspective'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.eduperno
                                })
                            }
                                
                            if(detail.type == 'NCEES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.nceesno
                                })
                            }
                                
                            if(detail.type == 'NARIC'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.naricno
                                })
                            }

                            if(detail.type == 'National Committee on Accreditation'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.ncano
                                })
                            }
                                
                            if(detail.type == 'Educational credential evaluators WES'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.wesno
                                })
                            }
                                
                            if(detail.type == 'others'){
                                purpose.push({
                                    type : detail.type,
                                    referenceNo : detail.otheraccno
                                })
                            }
                        })

                        students.push({
                            id : student.id,
                            name :student.name,
                            email : student.email,
                            user_id : student.user_id,
                            colleges : collegesData,
                            instructionalField:student.instructionalField,
                            educationalDetails:student.educationalDetails,
                            curriculum:student.curriculum,
                            gradToPer : student.gradToPer,
                            affiliation : student.affiliation,
                            CompetencyLetter : student.CompetencyLetter,
                            Letterfor_NameChange : student.LetterforNameChange,
                            status : student.status,
                            current_location: student.current_location,
                            diplomaHolder : (student.diplomaHolder) ? "YES" : "NO",
                            current_year : (student.current_year) ? "YES" : "NO",
                            types : purpose,
                            notes : student.notes,
                            errataFlag : errataFlag,
                            collegeConfirmation : student.collegeConfirmation,
                            language : student.instruction_medium !==null ? student.instruction_medium : '--' ,
                            application_date : moment(new Date(student.created_at)).format("DD/MM/YYYY")
                        });
                        callback();
                        
                    });
                })
            },200)
        }, function(){
                res.json({
                    status: 200,
                    message: 'Student retrive successfully',
                    items : students,
                    total_count : countObjects
                });
            
        });
        });
    })

});

router.get('/adminDashboard/getRejectedApplication', function (req, res) {
    var students = [];
    models.Application.getRejectedUserApplications().then(data => {
        require('async').eachSeries(data, function(student, callback){
            models.User_Transcript.getCollegeName(student.user_id).then(function(colleges){
                models.Institution_details.getAllInstitutionType(student.user_id).then(function(types){
                    students.push({
                        id : student.id,
                        name :student.name,
                        email : student.email,
                        user_id : student.user_id,
                        colleges : colleges,
                        instructionalField:student.instructionalField,
                        educationalDetails:student.educationalDetails,
                        gradToPer : student.gradToPer,
                        curriculum:student.curriculum,
                        affiliation : student.affiliation,
                        current_location: student.current_location,
                        notes : student.notes,
                        collegeConfirmation : student.collegeConfirmation,
                        types : types,
                        language : student.instruction_medium !==null ? student.instruction_medium : '--' ,
                        application_date : moment(new Date(student.created_at)).format("DD/MM/YYYY")
                    });
                    callback();
                });
            });
        }, function(){
            res.json({
                status: 200,
                message: 'Student retrive successfully',
                items : students,
                total_count : students.length
            });
        });
    });
});

router.post('/adminDashboard/rejectApplication',function(req,res){
   //var io = req.io;
   models.User.find({
       where:{
           id : req.body.user_id
       }
   }).then(function(user){
       if(user){
           models.Application.find({
               where:{
                   user_id : req.body.user_id,
                   id : req.body.app_id
               }
           }).then(function(uca){
               if(uca){
                       uca.update({
                            tracker : 'apply',
                            status : 'reject'
                       }).then(function(uca_updated){
                           if(uca_updated){
                               request.post(constant.BASE_URL_SENDGRID + 'rejectApplication', {
                                json: {
                                    mobile: user.mobile,
                                    mobile_country_code: user.mobile_country_code,
                                    userName: user.name,
                                    surName: user.surname,
                                    email: user.email,
                                    to: user.email,
                                    toName: user.name,
                                    user_type: user.user_type,
                                    app_id:uca_updated.id,
                                    type : req.body.fromTab
                                }
                            }, function (error, response, body) {
                                if (error) {
                                    res.json({
                                        status:400,
                                        message:'message not sent!!!..'
                                    })
                                }else{
                                    res.send({
                                        status: 200,
                                        message:'message sent to student.'
                                    });
                                }
                            });
                           }else{
                            res.json({
                                status:400,
                                message:'user status does not changed!!!..'
                            })
                           }
                       });
               }else{
                   res.json({
                       status:400,
                       message:'user application does not created!!!..'
                   })
               }
           });
       }else{
           res.json({
            status:400,
            message:'user does not exist!!...'
         })
       }
   });
});

router.post('/adminDashboard/pending/verifiedBy', middlewares.getUserInfo, function (req, res) {
    models.Application.update({
        approved_by: req.body.email,
        tracker: 'verified'
    }, {
        where: {
            id: req.body.id
        }
    }).then(function (result) {
        models.Application.find({
            where:{
                id : req.body.id
            }
        }).then(function(application){
            models.User.find({
                where:{
                    id : application.user_id
                }
            }).then(function(userdata){
                var desc = userdata.name+"'s ( "+userdata.email+" ) application approved by "+req.User.email+".";
                var activity = "Application Verified";
                var applicationId = req.body.id;
                functions.activitylog(userdata.id, activity, desc, applicationId);
                request.post(constant.BASE_URL_SENDGRID + 'applicationStatus', {
                    json: {
                        email : userdata.email,
                        name : userdata.name + ' ' + userdata.surname,
                        app_id : applicationId,
                        statusType : 'verified',
                        mobile : userdata.mobile,
                        mobile_country_code : userdata.mobile_country_code
                    }
                }, function (error, response, body) {
                    return res.json({
                        status: 200,
                        items: result
                    });  
                })
            })
        });
    });
});

router.get('/adminDashboard/getTranscriptDetails', function (req, res) {


    var view_data = {
        ssc: [],
        hsc: [],
        degree: [],
        master: [],
        phd :[]
    }
    models.User_Transcript.findAll({
        where: {
            user_id: req.query.user_id
        }
    }).then(function (transcripts) {
        if (transcripts.length > 0) {
            transcripts.forEach(function (transcript) {
                if (transcript.type == 'SSC') {
                    var file_ext = transcript.file_name.split('.').pop();
                    view_data.ssc.push({
                        type: 'SSC',
                        file_name: constant.BASE_URL + 'upload/transcript/' + req.query.user_id + '/' + transcript.file_name,
                        file_ext: file_ext.toLowerCase()
                    });
                }

                if (transcript.type == 'HSC') {
                    var file_ext = transcript.file_name.split('.').pop();
                    view_data.hsc.push({
                        type: 'HSC',
                        file_name: constant.BASE_URL + 'upload/transcript/' + req.query.user_id + '/' + transcript.file_name,
                        file_ext: file_ext.toLowerCase()
                    });
                }

                if (transcript.type == 'Graduation') {
                    var file_ext = transcript.file_name.split('.').pop();
                    view_data.degree.push({
                        type: 'Graduation',
                        file_name: constant.BASE_URL + 'upload/transcript/' + req.query.user_id + '/' + transcript.file_name,
                        file_ext: file_ext.toLowerCase()
                    });
                }

                if (transcript.type == 'Master') {
                    var file_ext = transcript.file_name.split('.').pop();
                    view_data.master.push({
                        type: 'Master',
                        file_name: constant.BASE_URL + 'upload/transcript/' + req.query.user_id + '/' + transcript.file_name,
                        file_ext: file_ext.toLowerCase()
                    });
                }

                if (transcript.type == 'Ph.D') {
                    var file_ext = transcript.file_name.split('.').pop();
                    view_data.phd.push({
                        type: 'Ph.D',
                        file_name: constant.BASE_URL + 'upload/transcript/' + req.query.user_id + '/' + transcript.file_name,
                        file_ext: file_ext.toLowerCase()
                    });
                }
            });

            setTimeout(function () {
                res.json({
                    status: 200,
                    data: view_data
                })
            }, 1000);
        } else {
            res.json({
                status: 400
            })
        }
    });
});

router.get('/adminDashboard/download', function (req, res) {
    var file_name = req.query.file_name;
    var userId = req.query.user_id;
    const downloadData = constant.FILE_LOCATION + "public/upload/transcript/" + userId + "/" + file_name;
    res.download(downloadData);
});

/**
 * @author Rafique Shaikh 11 apr 2019 6:47 pm
 * @description Sends email and sms for OTP to the Admin after login.
 */
router.get('/adminDashboard/get_otp', middlewares.getUserInfo, function (req, res) {
    if (constant.ENV_sendgrid_Twilio == 'production') {
        models.User.find({
            where: {
                id: req.User.id
                //user_type: 'admin'
            }
        }).then(function (adminData) {

            smsOptions = {
                contact_number: adminData.mobile_country_code + adminData.mobile,
                message: adminData.otp + ' is your one time password for verifying your mobile number for Mumbai University.',
            };
            if(adminData.id != 2){

                request.post(constant.BASE_URL_SENDGRID + 'Email/Sms',{
                json: {
                    mobile: adminData.mobile,
                    mobile_country_code: adminData.mobile_country_code,
                    email: adminData.email,
                    email_verification_token: adminData.email_verification_token,
                    otp: adminData.otp,
                    to: adminData.email,
                    toName: adminData.name
                }
                }, function (error, response, body) {
                    if(response != undefined){
                        if (!error && response.statusCode == 200) {
                            res.json({
                                status: 200,
                                message: 'Successfully',
                                data: adminData.otp
                            });
                        } else if (response.statusCode == 400) {
                            res.json({
                                status: 400,
                                message: 'ERROR: An error has been occurred while sending email. Please ensure email address is proper and try again.'
                            });
                        }
                    }else{
                        res.json({
                            status: 400,
                            message: 'ERROR: An error has been occurred while sending email. Please ensure email address is proper and try again.'
                        });
                    }                
                })
            }else{
                res.json({
                    status: 200,
                    message: 'Successfully',
                    data: adminData.otp
                });
            }
        });
    } else {
        logger.debug('OTP SKIPPED');
    }
});

/**
 * updating the OTP
 * @author Rafique Shaikh 11 apr 2019 6:47 pm
 * @description updates the OTP in the database after the successful admin login.
 */

router.get('/adminDashboard/update_otp', middlewares.getUserInfo,  function (req, res) {
    models.User.find({
        where: {
            id: req.User.id
        }
    }).then(function (user) {
        var otp = functions.generateRandomString(6, 'numeric');
        user.update({
            otp: otp
        }).then(function (user_updated) {
            return res.json({

                status: 200,
                message: 'Successfully logged out!'

            })
        });

    });
});

/**
 * @author Rafique Shaikh 17 apr 2019 6:47 pm
 * @description Sends notification to the Database about the status of the application.
 */

router.post('/adminDashboard/sendNotification', function (req, res) {
    var type = req.body.type;
    App_id = req.body.id;

    setTimeout(()=>{
        models.Application.find({
            where: {
                id: App_id
            }
        }).then((Application) => {
            var user_id = Application.user_id;
            if (type=='pending' && Application.tracker == 'verified'&& (Application.status == 'new' || Application.status == 'repeat')) {
                var Remark="Your documents for application no."+App_id+" is successfully verified and proceeded to admin pannel for further processing."
                promise1 = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        var created_at = functions.socketnotification('Signed and Emailed',Remark,user_id,'student');
                        resolve(created_at);
                     }, 2000)
                     
                 })
                 Promise.all([promise1]).then(result => {
                  var created_at=result;
                   setTimeout(() => {
                    if(created_at === undefined) { res.json({
                                 status:400,
                                 message: "problem in inserting notification data in notification table."
                             })
                         }
                         else{ 
                             //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});
                             res.json({
                                 status:200,
                                 message: "Successfully received!"
                             })
                         }
                    },2000);
                 })
    
            } else if (type=='verified' && Application.tracker == 'signed' && (Application.status == 'new' || Application.status == 'repeat')) {
                var Remark = "Your application  no."+App_id+" has been signed."
                promise1 = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        var created_at = functions.socketnotification('Signed and Emailed',Remark,user_id,'student');
                        resolve(created_at);
                     }, 2000)
                     
                 })
                 Promise.all([promise1]).then(result => {
                  var created_at=result;
                   setTimeout(() => {
                    if(created_at === undefined) { 
                        res.json({
                                 status:400,
                                 message: "problem in inserting notification data in notification table."
                             })
                         }
                         else{
                             //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});
                             res.json({
                                 status:200,
                                 message: "Successfully received!"
                             })
                         }
                    },2000);
                 })
            } else {
                res.json({
                    status : 400,
                    message : " condition not matched."
                })
            }
        });
    },10000)
});

router.post('/adminDashboard/receiveNotification', function (req, res) {
    var view_data = [];
    var notification_no = 0;
    models.Notifications.findAll({
        where: {
            user_id: req.body.id,
            delete_notification: 'false',
        },
        order: [
            ['created_at', 'DESC']
        ]
    }).then((notifications) => {
        if (notifications.length > 0) {
            notifications.forEach((notification) => {
                if (notification.read == 'false') {
                    notification_no += 1;
                }
                view_data.push({
                    id: notification.id,
                    message: notification.message,
                    read: notification.read,
                    created_at: moment(notification.created_at).fromNow()
                })
            });
            res.json({
                status: 200,
                data: view_data,
                notification_no: notification_no
            })
        } else {
            res.json({
                status: 200,
                data: view_data,
                notification_no: notification_no
            })
        }
    });
});

router.post('/adminDashboard/makeReadNotification', function (req, res) {
    var view_data = [];
    models.Notifications.findAll({
        where: {
            user_id: req.body.id,
            read: 'false'
        },
    }).then((notifications) => {
        if (notifications.length > 0) {
            notifications.forEach((notification) => {
                notification.update({
                    read: 'true'
                }).then(() => {

                });
            });
            res.json({
                status: 200
            });
        } else {
            res.json({
                status: 200,
                data: view_data
            });
        }
    });
});

router.post('/adminDashboard/deleteNotification', function (req, res) {
    if(req.body.noti_id != undefined){
        models.Notifications.find({
            where:{
                id:req.body.noti_id
            }
        }).then(selectedNotification => {
            if(selectedNotification){
                selectedNotification.update({
                    delete_notification:'true'
                }).then(delnotification => {
					res.json({
						status:200
					})
                });
            }
        })
    }else if(req.body.noti_id == undefined){
        models.Notifications.findAll({
            where:{
                user_id:req.body.id
            }
        }).then((notifications)=>{
            if(notifications.length > 0){
                notifications.forEach(notification=>{
                    notification.update({
                        delete_notification:'true'
                    }).then(delnotification=>{
                    });
                });
                res.json({
					status:200
				})
            }
        });
    }
});

router.get('/adminDashboard/transcript_lock', function(req, res) {
    var studentObj = {
        userMarkLists:[],
        userTranscripts: [],
        userCurriculums:[],
        userExtraDocument :[],
        letters:[],
        usercompetency:[],

        notes_area : '',
    };
     
    var userId = req.query.userId;
    var userEmail = '';
    if(isNaN(userId)) {
        errors.push({
            message: "User id is required"
        });
        res.json({
            status: 400,
            data: errors
        });
    }else {
        models.User.find({
            where:{
                id : userId
            }
        }).then(function(user){
            userEmail = user.email;
            models.competency_letter.findAll({
                where:  {
                    user_id : userId
                }
            }).then(function(competency){
            models.User_Transcript.findAll({
                where:  {
                    user_id : userId
                }
            }).then(function(userTranscripts) {
                models.userMarkList.findAll({
                    where:{
                        user_id : userId
                    }
                }).then(function(userMarkLists){
                    userMarkLists.forEach((usermarklist)=>{
                        if((usermarklist.file_name!='null' && usermarklist.file_name!=null && usermarklist.file_name!='')){
                            var imgArr = usermarklist.file_name.split('.');
                            var extension = imgArr[imgArr.length - 1].trim(); 
                            models.College.find({
                                where:{
                                    id : usermarklist.collegeId
                                }
                            }).then((college)=>{
                                studentObj.userMarkLists.push({
                                    id: usermarklist.id,
                                    //userMarklistId: usermarks.id,
                                    name: usermarklist.name,
                                    user_id: usermarklist.user_id ,
                                    image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+usermarklist.file_name ,
                                    file_name: usermarklist.file_name ,
                                    file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+usermarklist.file_name ,
                                    timestamp: moment(new Date(usermarklist.created_at)).format("DD-MM-YYYY hh:mm a"),
                                    transcript_lock: usermarklist.lock_marklist ,
                                    education_type:usermarklist.type ,
                                    extension : extension ,
                                    email : user.email,
                                    collegeName : college ? college.name : ''
                                });
                            })
                        }
                    })
                    models.User_Curriculum.findAll({
                        where:{
                            user_id : userId
                        }
                    }).then(function(usercurriculums){
                        if(userMarkLists!=undefined || userMarkLists!='' || userMarkLists!='null' || userMarkLists!=null){
                            models.UserMarklist_Upload.getMarksheetData(userId).then(function(marklistData){
                                marklistData.forEach(function(allMarklistData){
                                     if((allMarklistData.file_name!='null' && allMarklistData.file_name!=null && allMarklistData.file_name!='' ) && (allMarklistData.usermarklist_file_name ==null || allMarklistData.usermarklist_file_name =='')){
                                        var imgArr = allMarklistData.file_name.split('.');
                                        var extension = imgArr[imgArr.length - 1].trim(); 
                                    } else if((allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='')){
                                        var imgArr1 = allMarklistData.usermarklist_file_name.split('.');
                                        var extension = imgArr1[imgArr1.length - 1].trim(); 
                                    }else if((allMarklistData.file_name!='null' && allMarklistData.file_name!=null && allMarklistData.file_name!='') && (allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='')){
                                        var imgArr = allMarklistData.file_name.split('.');
                                        var extension = imgArr[imgArr.length - 1].trim(); 
                                        var imgArr1 = allMarklistData.usermarklist_file_name.split('.');
                                        var extension1 = imgArr1[imgArr1.length - 1].trim(); 
                                    }
                                    if(allMarklistData.collegeId != 0 && allMarklistData.collegeId != null){
                                        models.College.find({
                                            where:{
                                                id : allMarklistData.collegeId
                                            }
                                        }).then(function(college){
                                            if((allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='') && (allMarklistData.usermarklist_file_name==null || allMarklistData.usermarklist_file_name=='')){
                                                studentObj.userMarkLists.push({
                                                    id: allMarklistData.id,
                                                    //userMarklistId: usermarks.id,
                                                    name: allMarklistData.name,
                                                    user_id: allMarklistData.user_id ,
                                                    image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                    file_name: allMarklistData.file_name ,
                                                    file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                    timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                    updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                    transcript_lock: allMarklistData.lock_transcript ,
                                                    education_type:allMarklistData.education_type ,
                                                    extension : extension ,
                                                    email : user.email,
                                                    collegeName : college.name
                                                });
                                            }else if((allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='' )){
                                                studentObj.userMarkLists.push({
                                                    id: allMarklistData.usermarklist_id,
                                                    //userMarklistId: usermarks.id,
                                                    name: allMarklistData.usermarklist_name,
                                                    user_id: allMarklistData.usermarklist_user_id ,
                                                    image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                    file_name: allMarklistData.usermarklist_file_name ,
                                                    file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                    timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                                   
                                                    transcript_lock: allMarklistData.user_lock_marklist ,
                                                    education_type:allMarklistData.type ,
                                                    extension : extension ,
                                                    email : user.email,
                                                    collegeName : college.name
                                                });
                                            }else if(allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='' && allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!=''){
                                                studentObj.userMarkLists.push({
                                                    id: allMarklistData.id,
                                                    //userMarklistId: usermarks.id,
                                                    name: allMarklistData.name,
                                                    user_id: allMarklistData.user_id ,
                                                    image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                    file_name: allMarklistData.file_name ,
                                                    file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                    timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                    updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                    transcript_lock: allMarklistData.lock_transcript ,
                                                    education_type:allMarklistData.education_type ,
                                                    extension : extension ,
                                                    email : user.email,
                                                    collegeName : college.name
                                                });

                                                // studentObj.userMarkLists.push({
                                                //     id: allMarklistData.usermarklist_id,
                                                //     //userMarklistId: usermarks.id,
                                                //     name: allMarklistData.usermarklist_name,
                                                //     user_id: allMarklistData.usermarklist_user_id ,
                                                //     image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                //     file_name: allMarklistData.usermarklist_file_name ,
                                                //     file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                //     timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                                //     transcript_lock: allMarklistData.user_lock_marklist ,
                                                //     education_type:allMarklistData.type ,
                                                //     extension : extension1 ,
                                                //     email : user.email,
                                                //     collegeName : college.name
                                                // });

                                            }
                                        })
                                    }else{
                                        if((allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='') && (allMarklistData.usermarklist_file_name==null || allMarklistData.usermarklist_file_name=='')){
                                            studentObj.userMarkLists.push({
                                                id: allMarklistData.id ? allMarklistData.usermarklist_id : '',
                                                name: allMarklistData.name,
                                            // userMarklistId: userMarks.id,
                                                user_id: allMarklistData.user_id,
                                                image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.file_name,
                                                file_name: allMarklistData.file_name,
                                                file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.file_name,
                                                timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                transcript_lock: allMarklistData.lock_transcript,
                                                education_type:allMarklistData.education_type,
                                                extension :extension,
                                                email : user.email,
                                                collegeName : ''
                                            });
                                        }else if((allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='')){
                                            studentObj.userMarkLists.push({
                                                id: allMarklistData.usermarklist_id,
                                                //userMarklistId: usermarks.id,
                                                name: allMarklistData.usermarklist_name,
                                                user_id: allMarklistData.usermarklist_user_id ,
                                                image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                file_name: allMarklistData.usermarklist_file_name ,
                                                file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                                transcript_lock: allMarklistData.user_lock_marklist ,
                                                education_type:allMarklistData.type ,
                                                extension : extension ,
                                                email : user.email,
                                                collegeName : college.name
                                            });

                                        }else if(allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='' && allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!=''){
                                            studentObj.userMarkLists.push({
                                                id: allMarklistData.id,
                                                //userMarklistId: usermarks.id,
                                                name: allMarklistData.name,
                                                user_id: allMarklistData.user_id ,
                                                image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                file_name: allMarklistData.file_name ,
                                                file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                transcript_lock: allMarklistData.lock_transcript ,
                                                education_type:allMarklistData.education_type ,
                                                extension : extension ,
                                                email : user.email,
                                                collegeName : college.name
                                            });

                                            // studentObj.userMarkLists.push({
                                            //     id: allMarklistData.usermarklist_id,
                                            //     //userMarklistId: usermarks.id,
                                            //     name: allMarklistData.usermarklist_name,
                                            //     user_id: allMarklistData.usermarklist_user_id ,
                                            //     image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                            //     file_name: allMarklistData.usermarklist_file_name ,
                                            //     file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                            //     timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                            //     transcript_lock: allMarklistData.user_lock_marklist ,
                                            //     education_type:allMarklistData.type ,
                                            //     extension : extension1 ,
                                            //     email : user.email,
                                            //     collegeName : college.name
                                            // });
                                        }
                                    } 
                                })
                            })
                        }
                        if(userTranscripts && userTranscripts.length > 0) {
                            userTranscripts.forEach(function(userTranscript) {
                            	if(userTranscript.type.includes('transcripts')){
	                                var imgArr = userTranscript.file_name.split('.');
	                                var extension = imgArr[imgArr.length - 1].trim();
	                                if(userTranscript.collegeId != 0 && userTranscript.collegeId != null){
	                                    models.College.find({
	                                        where:{
	                                            id : userTranscript.collegeId
	                                        }
	                                    }).then(function(college){
	                                        studentObj.userTranscripts.push({
	                                            id: userTranscript.id,
	                                            name: userTranscript.name,
	                                            user_id: userTranscript.user_id,
	                                            image: constant.BASE_URL+"/upload/transcript/"+userId+'/'+userTranscript.file_name,
	                                            file_name: userTranscript.file_name,
	                                            file_path: constant.FILE_LOCATION+"public/upload/transcript/"+userId+'/'+userTranscript.file_name,
	                                            timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
	                                            updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                transcript_lock: userTranscript.lock_transcript,
	                                            extension :extension,
	                                            email : user.email,
	                                            collegeName : college.name
	                                        });
	                                    });
	                                }else{
	                                    studentObj.userTranscripts.push({
	                                        id: userTranscript.id,
	                                        name: userTranscript.name,
	                                        user_id: userTranscript.user_id,
	                                        image: constant.BASE_URL+"/upload/transcript/"+userId+'/'+userTranscript.file_name,
	                                        file_name: userTranscript.file_name,
	                                        file_path: constant.FILE_LOCATION+"public/upload/transcript/"+userId+'/'+userTranscript.file_name,
	                                        timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
	                                        updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                            transcript_lock: userTranscript.lock_transcript,
	                                        extension :extension,
	                                        email : user.email,
	                                        collegeName : ''
	                                    });
	                                }
	                            }else{
	                            	studentObj.userExtraDocument.push({
                                        id: userTranscript.id,
                                        name: userTranscript.name,
                                        user_id: userTranscript.user_id,
                                        image: constant.BASE_URL+"/upload/transcript/"+userId+'/'+userTranscript.file_name,
                                        file_name: userTranscript.file_name,
                                        file_path: constant.FILE_LOCATION+"public/upload/transcript/"+userId+'/'+userTranscript.file_name,
                                        timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                                        updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                        transcript_lock: userTranscript.lock_transcript,
                                        extension :extension,
                                        email : user.email
                                    });
	                            }
                            });
                        }
                        if(competency && competency.length > 0) {
                            competency.forEach(function(userTranscript) {
                                if(userTranscript.type.includes('competencyletter')){
                                    var imgArr = userTranscript.file_name.split('.');
                                    var extension = imgArr[imgArr.length - 1].trim();
                                    if(userTranscript.collegeId != 0 && userTranscript.collegeId != null){
                                        models.College.find({
                                            where:{
                                                id : userTranscript.collegeId
                                            }
                                        }).then(function(college){
                                            studentObj.usercompetency.push({
                                                id: userTranscript.id,
                                                name: userTranscript.name,
                                                user_id: userTranscript.user_id,
                                                image: constant.BASE_URL+"/upload/CompetencyLetter/"+userId+'/'+userTranscript.file_name,
                                                file_name: userTranscript.file_name,
                                                file_path: constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+userId+'/'+userTranscript.file_name,
                                                timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                transcript_lock: userTranscript.lock_transcript,
                                                extension :extension,
                                                email : user.email,
                                                collegeName : college.name
                                            });
                                        });
                                    }else{
                                        studentObj.usercompetency.push({
                                            id: userTranscript.id,
                                            name: userTranscript.name,
                                            user_id: userTranscript.user_id,
                                            image: constant.BASE_URL+"/upload/CompetencyLetter/"+userId+'/'+userTranscript.file_name,
                                            file_name: userTranscript.file_name,
                                            file_path: constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+userId+'/'+userTranscript.file_name,
                                            timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                                            updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                            transcript_lock: userTranscript.lock_transcript,
                                            extension :extension,
                                            email : user.email,
                                            collegeName : ''
                                        });
                                    }
                                }else{
                                    studentObj.userExtraDocument.push({
                                        id: userTranscript.id,
                                        name: userTranscript.name,
                                        user_id: userTranscript.user_id,
                                        image: constant.BASE_URL+"/upload/CompetencyLetter/"+userId+'/'+userTranscript.file_name,
                                        file_name: userTranscript.file_name,
                                        file_path: constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+userId+'/'+userTranscript.file_name,
                                        timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                                        updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                        transcript_lock: userTranscript.lock_transcript,
                                        extension :extension,
                                        email : user.email
                                    });
                                }
                            });
                        }
                        if(usercurriculums && usercurriculums.length > 0){
                            usercurriculums.forEach(function(usercurriculum) {
                                var imgArr = usercurriculum.file_name.split('.');
                                var extension = imgArr[imgArr.length - 1].trim();
                                models.College.find({
                                    where:{
                                        id : usercurriculum.collegeId
                                    }
                                }).then(function(college){
                                    studentObj.userCurriculums.push({
                                        id: usercurriculum.id,
                                        name: usercurriculum.name,
                                        user_id: usercurriculum.user_id,
                                        pdf: constant.BASE_URL+"/upload/curriculum/"+userId+'/'+usercurriculum.file_name,
                                        file_name: usercurriculum.file_name,
                                        file_path: constant.FILE_LOCATION+"public/upload/curriculum/"+userId+'/'+usercurriculum.file_name,
                                        timestamp: moment(new Date(usercurriculum.created_at)).format("DD-MM-YYYY hh:mm a"),
                                        updated_at: moment(new Date(usercurriculum.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                        transcript_lock: usercurriculum.lock_transcript,
                                        extension :extension,
                                        email : user.email,
                                        collegeName : college.name
                                    });
                                })
                                
                            });
                        }

                        models.GradeToPercentageLetter.findAll({
                            where:{
                                user_id : userId
                            }
                        }).then(function(letterData){
                            if(letterData && letterData.length > 0) {
                                letterData.forEach(function(letter) {
                                    var imgArr = letter.file_name.split('.');
                                    var extension = imgArr[imgArr.length - 1].trim();
                                    if(letter.collegeId != 0 && letter.collegeId != null){
                                        models.College.find({
                                            where:{
                                                id : letter.collegeId
                                            }
                                        }).then(function(college){
                                            studentObj.letters.push({
                                                id: letter.id,
                                                name: letter.name,
                                                user_id: letter.user_id,
                                                image: constant.BASE_URL+"/upload/gradeToPercentLetter/"+userId+'/'+letter.file_name,
                                                file_name: letter.file_name,
                                                file_path: constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+userId+'/'+letter.file_name,
                                                timestamp: moment(new Date(letter.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                updated_at: moment(new Date(letter.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                transcript_lock: letter.lock_transcript,
                                                extension :extension,
                                                email : user.email,
                                                collegeName : college.name
                                            });
                                        });
                                    }else{
                                        studentObj.letters.push({
                                            id: letter.id,
                                            name: letter.name,
                                            user_id: letter.user_id,
                                            image: constant.BASE_URL+"/upload/gradeToPercentLetter/"+userId+'/'+letter.file_name,
                                            file_name: letter.file_name,
                                            file_path: constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+userId+'/'+letter.file_name,
                                            timestamp: moment(new Date(letter.created_at)).format("DD-MM-YYYY hh:mm a"),
                                            updated_at: moment(new Date(letter.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                            transcript_lock: letter.lock_transcript,
                                            extension :extension,
                                            email : user.email,
                                            collegeName : ''
                                        });
                                    }
                                });
                            }
                          

                            if(req.query.app_id != null && req.query.app_id != '' && req.query.app_id != undefined && req.query.app_id != 'null' && req.query.app_id != 'undefined'){
                                models.Application.find({
                                    where : {
                                        id : req.query.app_id
                                    }
                                }).then(function(app){
                                    
                                    studentObj.notes_area = app.notes;
                                    studentObj.transcriptRequiredMail = app.transcriptRequiredMail;
                                    studentObj.collegeConfirmation = app.collegeConfirmation;
                                  
                                })
                            }
                            setTimeout(()=>{
                                if(userMarkLists.length > 0 || userTranscripts.length > 0){
                                        res.json({
                                            status: 200,
                                            message: 'Dashboard success',
                                            data: studentObj,
                                            userEmail : userEmail
                                        });
                                    }else{
                                        res.json({
                                            status: 400,
                                            message: 'Transcipt not avaliable of this student !!',
                                            data: studentObj,
                                            userEmail : userEmail
                                        });
                                    }
                            },1500);
                        })
                    })  
                });
            });
            });
        });
    }
});

router.post('/adminDashboard/updateErrataTranscript',function(req,res){
    var io = req.io;
    var errataTranscript = req.body.errataTranscript;
    var errataMarksheet = req.body.errataMarksheet;
    var errataCurriculum = req.body.errataCurriculum;
    var errataLetter = req.body.errataLetter;
    errataMarksheet.forEach(function(data){
        models.UserMarklist_Upload.find({
            where:{
                id: data.id,
                user_id: data.userId
            }
        }).then(function(marksheet_data){
            if(marksheet_data!='null' && marksheet_data!=null){
                if(data.errataCheck == true){
                    models.UserMarklist_Upload.update({
                        lock_transcript : data.errataCheck,
                        upload_step : "requested"
                    }, {
                        where: {
                            id: data.id,
                            user_id: data.userId
                        }
                    }).then(x=>{
                    })
                }else if(data.errataCheck == false) {
                    models.UserMarklist_Upload.update({
                        lock_transcript : data.errataCheck,
                        upload_step : "changed"
                    }, {
                        where: {
                            id: data.id,
                            user_id: data.userId
                        }
                    }).then(z =>{
                    })
                }
            }else{
                models.userMarkList.find({
                    where:{
                        id: data.id,
                        user_id: data.userId
                    }
                }).then(function(marksheetData){
                    if(marksheetData!='null' && marksheetData!=null){
                        if(data.errataCheck == true){
                            models.userMarkList.update({
                                lock_marklist : data.errataCheck,
                                upload_step : "requested"
                            }, {
                                where: {
                                    id: data.id,
                                    user_id: data.userId
                                }
                            }).then(x=>{
                            })
                        }else if(data.errataCheck == false) {
                            models.userMarkList.update({
                                lock_marklist : data.errataCheck,
                                upload_step : "changed"
                            }, {
                                where: {
                                    id: data.id,
                                    user_id: data.userId
                                }
                            }).then(z =>{
                            })
                        }

                    }

                });

            }
        })
    })

    errataTranscript.forEach(function(data){
        models.User_Transcript.find({
            where:{
                id: data.id
            }
        }).then(function(transcript_data){
            if(transcript_data){
                if(data.errataCheck == true){
                    models.User_Transcript.update({
                        lock_transcript : data.errataCheck,
                        upload_step : "requested"
                    }, {
                        where: {
                            id: data.id
                        }
                    }).then(x=>{
                    })
                }else if(data.errataCheck == false) {
                    models.User_Transcript.update({
                        lock_transcript : data.errataCheck,
                        upload_step : "changed"
                    }, {
                        where: {
                            id: data.id
                        }
                    }).then(z =>{
                    })
                }
            }
        })
    })

    errataCurriculum.forEach(function(data){
        models.User_Curriculum.find({
            where:{
                id: data.id
            }
        }).then(function(transcript_data){
            if(transcript_data){
                if(data.errataCheck == true){
                    models.User_Curriculum.update({
                        lock_transcript : data.errataCheck,
                        upload_step : "requested"
                    }, {
                        where: {
                            id: data.id
                        }
                    }).then(x=>{
                    })
                }else if(data.errataCheck == false) {
                    models.User_Curriculum.update({
                        lock_transcript : data.errataCheck,
                        upload_step : "changed"
                    }, {
                        where: {
                            id: data.id
                        }
                    }).then(z =>{
                    })
                }
            }
        })
    })

    errataLetter.forEach(function(data){
        models.GradeToPercentageLetter.find({
            where:{
                id: data.id
            }
        }).then(function(letter_data){
            if(letter_data){
                if(data.errataCheck == true){
                    models.GradeToPercentageLetter.update({
                        lock_transcript : data.errataCheck,
                        upload_step : "requested"
                    }, {
                        where: {
                            id: data.id
                        }
                    }).then(x=>{
                    })
                }else if(data.errataCheck == false) {
                    models.GradeToPercentageLetter.update({
                        lock_transcript : data.errataCheck,
                        upload_step : "changed"
                    }, {
                        where: {
                            id: data.id
                        }
                    }).then(z =>{
                    })
                }
            }
        })
    })
    res.json({
        status:200,
        message: "Successfully done changes!"
    })
});

router.get('/adminDashboard/downloadTranscript', function (req, res) {
    var file = req.query.file;
    const downloadData = file
    res.download(downloadData);
});

/** 
 * @author:priyanka Khandagale
 * @description:to send notification if transcript is blur or password protected.
*/
router.post('/adminDashboard/trans_sendmessage',function(req,res){
    var msg= req.body.msg.message
    var user_id=req.body.msg.userId
    var Remark = "Uploaded transcript is incorrect, please reupload it. Message from admin:"+msg ;
    promise1 = new Promise((resolve, reject) => {
        setTimeout(() => {
            var created_at = functions.socketnotification('Transcript locked',Remark,user_id,'student');
            resolve(created_at);
         }, 2000)
         
     })
     Promise.all([promise1]).then(result => {
      var created_at=result;
       setTimeout(() => {
        if(created_at === undefined) { res.json({
                     status:400,
                     message: "problem in inserting notification data in notification table."
                 })
             }
             else{
                 //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});
                 res.json({
                     status:200,
                     message: "Successfully received!"
                 })
             }
        },2000);
     })
})

router.get('/adminDashboard/getSignedPdfDetails', function (req, res) {
    var appl_id=req.query.appl_id;
    var user_id=req.query.user_id;
    var count = 0;
    var filecount = 0;
    var transcriptData = [];
    var marksheetData = [];
    var curriculumData = [];
    var mergeData = [];
    var gradeToPerData = [];
    var instructionalLetter = [];
    var affiliationLetter = [];
    var HrdLetter = [];
    var letterForNameChange = [];
    models.Emailed_Docs.findAll({
        where :{
            app_id : appl_id,
            category : "Transcript"
        }
    }).then((files)=>{
        filecount = filecount + files.length;
        if(files.length> 0){
            files.forEach((filedata)=>{
                data={
                    file_name:   filedata.filename ,                    
                    file_path : constant.FILE_LOCATION+'public/signedpdf/'+user_id+"/" + filedata.filename ,
                }    
                transcriptData.push(data);
                count++;
            }) 
        }
    })
    models.Emailed_Docs.findAll({
        where :{
           app_id : appl_id,
           category : "Marksheet"
        }
    }).then((files)=>{
        filecount = filecount + files.length;
        if(files.length > 0){
            files.forEach((filedata)=>{
                data={
                    file_name:   filedata.filename ,                    
                    file_path : constant.FILE_LOCATION+'public/signedpdf/'+user_id+"/" + filedata.filename ,
                }    
                marksheetData.push(data);
                count++;
            }) 
       }
    })
    models.Emailed_Docs.findAll({
        where :{
           app_id : appl_id,
           category : "Curriculum"
        }
    }).then((files)=>{
        filecount = filecount + files.length;
        if(files.length > 0){
            files.forEach((filedata)=>{
                data={
                    file_name:   filedata.filename ,                    
                    file_path : constant.FILE_LOCATION+'public/signedpdf/'+user_id+"/" + filedata.filename ,
                }    
                curriculumData.push(data);
                count++;
            }) 
       }
    })
    models.Emailed_Docs.findAll({
        where :{
           app_id : appl_id,
           doc_type : "merged"
        }
    }).then((files)=>{
        filecount = filecount + files.length;
        if(files.length > 0){
           files.forEach((filedata)=>{
                data={
                file_name:   filedata.filename ,                    
                file_path : constant.FILE_LOCATION+'public/signedpdf/'+user_id+"/" + filedata.filename ,
                }    
                mergeData.push(data);
                count++;
            }) 
        }
    })
    models.Emailed_Docs.findAll({
        where :{
           app_id : appl_id,
           category : "GradeToPercentLetter"
        }
    }).then((files)=>{
        filecount = filecount + files.length;
        if(files.length > 0){
            files.forEach((filedata)=>{
                data={
                    file_name:   filedata.filename ,                    
                    file_path : constant.FILE_LOCATION+'public/signedpdf/'+user_id+"/" + filedata.filename ,
                }    
                gradeToPerData.push(data);
                count++;
            }) 
        }
    })

    setTimeout(function () {
        models.Emailed_Docs.findAll({
            where :{
               app_id : appl_id,
               category : "InstructionalLetter"
            }
        }).then((files)=>{
            filecount = filecount + files.length;
            if(files.length > 0){
               files.forEach((filedata)=>{
                    data={
                        file_name:   filedata.filename ,                    
                        file_path : constant.FILE_LOCATION+'public/signedpdf/'+user_id+"/" + filedata.filename ,
                    }    
                    instructionalLetter.push(data);
                    count++;
                }) 
            }
        })
        
       
    }, 3000);
    setTimeout(function () {
        models.Emailed_Docs.findAll({
            where :{
               app_id : appl_id,
               category : "HrdLetter"
            }
        }).then((files)=>{
            console.log(files);
            filecount = filecount + files.length;
            if(files.length > 0){
                files.forEach((filedata)=>{
                    data={
                        file_name:   filedata.filename ,                    
                        file_path : constant.FILE_LOCATION+'public/signedpdf/'+user_id+"/" + filedata.filename ,
                    }    
                    HrdLetter.push(data);
                    count++;
                }) 
            }
           if(filecount == count){
                res.json({
                    status: 200,
                    transcriptData : transcriptData,
                    usermarksheetdata : marksheetData,
                    curriculumdata : curriculumData,
                    gradeToPerData : gradeToPerData,
                    mergeData : mergeData,
                    instructionalLetter : instructionalLetter,
                    affiliationLetter : affiliationLetter,
                    HrdLetter  : HrdLetter
                })
            }else{
                res.json({
                    status: 400,
                })
            } 
        })
        
        models.Emailed_Docs.findAll({
            where :{
               app_id : appl_id,
               category : "AffiliationLetter"
            }
        }).then((files)=>{
            filecount = filecount + files.length;
            if(files.length > 0){
                files.forEach((filedata)=>{
                    data={
                        file_name:   filedata.filename ,                    
                        file_path : constant.FILE_LOCATION+'public/signedpdf/'+user_id+"/" + filedata.filename ,
                    }    
                    affiliationLetter.push(data);
                    count++;
                }) 
            }
           if(filecount == count){
                res.json({
                    status: 200,
                    transcriptData : transcriptData,
                    usermarksheetdata : marksheetData,
                    curriculumdata : curriculumData,
                    gradeToPerData : gradeToPerData,
                    mergeData : mergeData,
                    instructionalLetter : instructionalLetter,
                    affiliationLetter : affiliationLetter
                })
            }else{
                res.json({
                    status: 400,
                })
            } 
        })

        

    models.Emailed_Docs.findAll({
        where :{
           app_id : appl_id,
           category : "NameChangeLetter"
        }
    }).then((files)=>{
        filecount = filecount + files.length;
        if(files.length > 0){
            files.forEach((filedata)=>{
                data={
                    file_name:   filedata.filename ,                    
                    file_path : constant.FILE_LOCATION+'public/signedpdf/'+user_id+"/" + filedata.filename ,
                }    
                letterForNameChange.push(data);
                count++;
            }) 
        }
       if(filecount == count){
            res.json({
                status: 200,
                transcriptData : transcriptData,
                usermarksheetdata : marksheetData,
                curriculumdata : curriculumData,
                gradeToPerData : gradeToPerData,
                mergeData : mergeData,
                instructionalLetter : instructionalLetter,
                affiliationLetter : affiliationLetter,
                HrdLetter  : HrdLetter,
                letterForNameChange : letterForNameChange
            })
        }else{
            res.json({
                status: 400,
            })
        } 
    })
    }, 3000);

    

});

router.get('/adminDashboard/downloadSignedpdf', function (req, res) {
    var file = req.query.file_name;
    const downloadData = file
    res.download(downloadData);
});

router.get('/adminDashboard/getAppTransStatus', function (req, res) {
    var user_id = req.query.user_id;
    var counter=0;

    models.User_Transcript.findAll({
        where : {
            user_id : user_id
        }
    }).then((data)=>{
        data.forEach((transcript)=>{
            if(transcript.lock_transcript == true){
                counter++;
            }
        })

        if(counter == 0){
             res.json({
                status:200
            })
        }else{
            res.json({
                status:400
            })
        }

       
    })
    
    
});

router.get('/adminDashboard/students', function (req, res){
    var page = req.query.page;
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
    var year = req.query.acadYear ? req.query.acadYear : '';
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(name != '' && name != null && name != undefined && name != 'null' && name != 'undefined'){
        var filter ={};
        var filter1 = {};
        var nameSplit = name.split(' ');
        if(nameSplit.length == 1){
             filter.name = 'name';
           filter.value = " AND( user.name like '%" + nameSplit[0] + "%' OR user.surname like '%" + nameSplit[0] + "%') ";
            filters.push(filter);
        }else if(nameSplit.length == 2){
             filter.name = 'name';
           filter.value = " AND user.name like '%" + nameSplit[0] + "%' AND user.surname like '%" + nameSplit[1] + "%' ";
            filters.push(filter);
        }else{
             filter.name = 'name';
             var lastElement = nameSplit.pop();
             filter.value = " AND user.name like '%" + nameSplit.join(' ') + "%' AND user.surname like '%" + lastElement + "%' ";
            filters.push(filter);
        }
        
    }
    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(year != '' && year != null && year != undefined && year != 'null' && year != 'undefined'){	
        var filter ={};	
		var currentyear = year;	
		var startdate = currentyear+"-04-01";	
		var year = parseInt(currentyear) + 1;	
		var enddate = year + "-04-01"  ;	
        filter.name = 'application_year';	
        filter.value = " AND a.created_at BETWEEN '" + startdate + "' AND '" + enddate + "'";	
        filters.push(filter);	
    }
    var data = []; var countObj={};
    // fetch total active & inactive student count from db.
    models.User.getAllUsersInfo(filters,null,null).then(function(studentsData) {
        countObjects.totalLength = studentsData.length;
        models.User.getAllUsersInfo(filters,limit,offset).then(function(students) {	
            countObjects.filteredLength = students.length;	
            		
            if(students != null) {
                 require('async').eachSeries(students, function(student, callback){
                    
                    var obj = {
                        id: (student.id) ? student.id : '',
                        name: (student.name) ? student.name : '',
                        surname: (student.surname) ? student.surname : '',
                        email: (student.email) ? student.email : '',
                        state: (student.state) ? student.state : '',
                        city: (student.city) ? student.city : '',
                        user_type: (student.user_type) ? student.user_type : '',
                        country: (student.country) ? student.country : '',
                        country_id : (student.college_country) ? student.college_country : '',
                        state: (student.state) ? student.state : '',
                        registerDate: (student.created_at) ? moment(new Date(student.created_at)).format("DD-MM-YYYY hh:mm") : '',
                        userStatus: (student.user_status) ? student.user_status : '',
                        otp_verify:(student.is_otp_verified) ? student.is_otp_verified :'',
                        email_verification_token:(student.is_email_verified) ? student.is_email_verified :'',
                        course_id : (student.course_id) ? student.course_id : '', 
                        courses: (student.applying_for) ? student.applying_for : 'Not Applied' ,
                        profile_completeness : (student.profile_completeness) ? student.profile_completeness : '',
                        interested_courses : (student.course_visits) ? student.course_visits : '',
                        admission_cancel :student.admission_cancel,
                        current_location : student.current_location ? student.current_location : '',
                        registered_on : moment(student.created_at).format("DD/MM/YYYY"),
                        profile_completeness : student.profile_completeness
                    };

                    data.push(obj);
                    callback();
                    
                }, function(){
                    res.json({
                        status: 200,
                        message: 'Student retrive successfully',
                        items: data,
                        total_count: countObjects,
                    });
                });
            } else {
                res.json({
                    status: 400,
                    message: 'Problem in retrieving student list'
                });
            }
                    
        });
    })
       
});


router.put('/adminDashboard/verifyOtp', function(req, res){
    var userId = req.body.userId;

    models.User.find({
        where: {
            id: userId
        }
    }).then(function(user) {
        if(user){
            user.update({
                is_otp_verified: 1,
                is_email_verified: 1,
                otp: null,
                email_verification_token: null
            })
            res.json({
                status: 200,
                data: user
            })
         
        }
        
    })
})

router.put('/adminDashboard/status',  function(req, res) {
 
    var userId = req.body.userId;

    models.User.find({
        where: {
            id: userId
        }
    }).then(function(user) {
        if(user) {
            user.update({
                user_status: req.body.status
            }).then(function(updatedUser) {
                var userStatus = (updatedUser.user_status == 'active') ? 'activated.' : 'de-activated.';
                if(userStatus == 'activated.'){
                    res.json({
                        status: 200,
                        message: 'Student '+req.body.status
                    });
                }else if(userStatus == 'de-activated.'){
                    res.json({
                        status: 200,
                        message: 'Student '+req.body.status
                    });
                }else{
                    res.json({
                        status: 200,
                        message: 'Student '+req.body.status
                    });
                }
            });
        } else {
            res.json({
                status: 400,
                message: 'User not found'
            });
        }
    });
});

router.get('/adminDashboard/getCountryWiseApplication', function (req, res){
    var data = []; var countObj={};
        models.User.getCountryWiseApplication(req.query.year,req.query.country_name,req.query.applying_for).then(function(students) {					
            if(students != null) {
                var enableNext = (students.length - constant.OFFSET_LIMIT == 0) ? true : false;
                require('async').eachSeries(students, function(student, callback){
                    
                    var obj = {
                        id: (student.id) ? student.id : '',
                        name: (student.name) ? student.name : '',
                        surname: (student.surname) ? student.surname : '',
                        email: (student.email) ? student.email : '',
                        user_type: (student.user_type) ? student.user_type : '',
                        country: (student.country_name) ? student.country_name : '',
                        university_name : (student.university_name) ? (student.university_name) : '',
                        courses: (student.applying_for) ? student.applying_for : 'Not Applied' ,
                    };

                    data.push(obj);
                    callback();
                    
                }, function(){
                    res.json({
                        status: 200,
                        message: 'Student retrive successfully',
                        data: data,
                        counts: countObj,
                        courses:req.courses,
                        next: enableNext
                    });
                });
            } else {
                res.json({
                    status: 400,
                    message: 'Problem in retrieving student list'
                });
            }
        
    });
})

router.get('/adminDashboard/my_applications',function(req,res){
   
    var user_id = req.query.id;
    var final_data=[];
    var count=0;
    var amount;
    var edu_no;
    var userdata = {};
    models.User.find({
        where :{
            id  :user_id
        }
    }).then(function(user){
        models.Applied_For_Details.find({
            where:{
                user_id: user_id
            }
        }).then(function(user_data){
            if(user_data){
                userdata.name = user.name;
                userdata.surname = user.surname;
                userdata.email = user.email;
                userdata.mobile_country_code = user.mobile_country_code;
                userdata.mobile = user.mobile;
                userdata.gender = user.gender;
                userdata.current_location = user.current_location;
                userdata.educationalDetails = user_data.educationalDetails;
                userdata.instructionalField = user_data.instructionalField;
                userdata.curriculum = user_data.curriculum;
                userdata.gradToPer = user_data.gradToPer;
                userdata.affiliation = user_data.affiliation;
                userdata.applying_for = user_data.applying_for;
                userdata.diplomaHolder = user_data.diplomaHolder;
                userdata.current_year = user_data.current_year;
                if(user_data.educationalDetails == true && user_data.instructionalField == true && user_data.curriculum == true && user_data.gradToPer == true && user_data.affiliation == true){
                    edu_no = 5;
                }else if(user_data.educationalDetails == true && user_data.instructionalField == true && user_data.curriculum == true && user_data.gradToPer == true){
                    edu_no = 4;
                }else if(user_data.educationalDetails == true && user_data.instructionalField == true && user_data.curriculum == true && user_data.affiliation == true){
                    edu_no = 4;
                }else if(user_data.educationalDetails == true && user_data.instructionalField == true && user_data.gradToPer == true && user_data.affiliation == true){
                    edu_no = 4;
                }else if(user_data.educationalDetails == true && user_data.gradToPer == true && user_data.curriculum == true && user_data.affiliation == true){
                    edu_no = 4;
                }else if(user_data.gradToPer == true && user_data.instructionalField == true && user_data.curriculum == true && user_data.affiliation == true){
                    edu_no = 4;
                }else if(user_data.educationalDetails == true && user_data.instructionalField == true && user_data.curriculum == true){
                    edu_no = 3;
                }else if(user_data.gradToPer == true && user_data.instructionalField == true && user_data.curriculum == true){
                    edu_no = 3;
                }else if(user_data.educationalDetails == true && user_data.gradToPer == true && user_data.curriculum == true){
                    edu_no = 3;
                }else if(user_data.educationalDetails == true && user_data.instructionalField == true && user_data.affiliation == true){
                    edu_no = 3;
                }else if(user_data.curriculum == true && user_data.instructionalField == true && user_data.affiliation == true){
                    edu_no = 3;
                }else if(user_data.curriculum == true && user_data.affiliation == true && user_data.gradToPer == true){
                    edu_no = 3;
                }else if(user_data.affiliation == true && user_data.instructionalField == true && user_data.gradToPer == true){
                    edu_no = 3;
                }else if(user_data.educationalDetails == true && user_data.curriculum == true && user_data.affiliation == true){
                    edu_no = 3;
                }else if(user_data.educationalDetails == true && user_data.affiliation == true && user_data.gradToPer == true){
                    edu_no = 3;
                }else if(user_data.educationalDetails == true && user_data.instructionalField == true && user_data.gradToPer == true){
                    edu_no = 3;
                }else if(user_data.educationalDetails == true && user_data.instructionalField == true){
                    edu_no = 2;
                }else if(user_data.educationalDetails == true && user_data.curriculum == true){
                    edu_no = 2;
                }else if(user_data.instructionalField == true && user_data.curriculum == true){
                    edu_no = 2;
                }else if(user_data.educationalDetails == true && user_data.gradToPer == true){
                    edu_no = 2;
                }else if(user_data.gradToPer == true && user_data.curriculum == true){
                    edu_no = 2;
                }else if(user_data.instructionalField == true && user_data.gradToPer == true){
                    edu_no = 2;
                }else if(user_data.educationalDetails == true && user_data.affiliation == true){
                    edu_no = 2;
                }else if(user_data.instructionalField == true && user_data.affiliation == true){
                    edu_no = 2;
                }else if(user_data.curriculum == true && user_data.affiliation == true){
                    edu_no = 2;
                }else if(user_data.gradToPer == true && user_data.affiliation == true){
                    edu_no = 2;
                }else if(user_data.educationalDetails == true){
                    edu_no = 1;
                }else if(user_data.curriculum == true){
                    edu_no = 1;
                }else if(user_data.instructionalField == true){
                    edu_no = 1;
                }else if(user_data.gradToPer == true){
                    edu_no = 1;
                }else if(user_data.affiliation == true){
                    edu_no = 1;
                }
                if(user.current_location == "WITHIN"){
                    amount  = 536 * edu_no;
                }else if(user.current_location == "OUTSIDE"){
                    amount  = 8308 * edu_no;
                }
                models.Application.findAll({
                    where :{
                        user_id : user_id
                    }
                }).then(function(applications){
                    applications.forEach(application=>{
                        models.Institution_details.findAll({
                            where:{
                                user_id : user_id,
                                app_id : application.id
                            }
                        }).then(function(institutes){
                            var instituteData = [];
                            institutes.forEach(institute=>{
                                var status;
                                if(application.tracker == 'apply'){
                                    if(application.status == 'new'  || application.status == 'repeat'){
                                        if(application.transcriptRequiredMail){
                                            status = "On Hold (Required Transcripts)";
                                        }else{
                                            status = "Applied";
                                        }
                                    }else if(application.status == 'reject'){
                                        status = "Rejected";
                                    }
                                }else if(application.tracker == 'done'){
                                    models.EmailActivityTracker.getEmailData(institute.email, req.User.name, req.User.surname).then(function(emailActivity){
                                        if(emailActivity[0].clicks_count > 0){
                                            status = "Documents Reviewed"
                                        }else if(emailActivity[0].opens_count > 0){
                                            status ="Mail Checked"
                                        }else{
                                            status = emailActivity[0].status 
                                        }
                                    })
                                } else if(application.tracker == 'signed' && institute.type == "Educational credential evaluators WES"){
                                    status = "sent to WES";
                                }else{
                                    status = application.tracker
                                }
            
                                var email ;
                                if(institute.OtherEmail){
                                    email = institute.email + "," + institute.OtherEmail
                                }else {
                                    email = institute.email
                                }
                                var referenceNo;
                                if(institute.type == 'study')
                                    referenceNo = institute.studyrefno;
                                if(institute.type == 'employment')
                                    referenceNo = institute.emprefno;
                                if(institute.type == 'IQAS')
                                    referenceNo = institute.iqasno;
                                if(institute.type == 'CES')
                                    referenceNo = institute.cesno;
                                if(institute.type == 'ICAS')
                                    referenceNo = institute.icasno;
                                if(institute.type == 'visa')
                                    referenceNo = institute.visarefno;
                                if(institute.type == 'MYIEE')
                                    referenceNo = institute.myieeno;
                                if(institute.type == 'ICES')
                                    referenceNo = institute.icesno;
                                if(institute.type == 'NASBA')
                                    referenceNo = institute.nasbano;
                                if(institute.type == 'Educational Perspective')
                                    referenceNo = institute.eduperno;
                                if(institute.type == 'NCEES')
                                    referenceNo = institute.nceesno;
                                if(institute.type == 'NARIC')
                                    referenceNo = institute.naricno;
                                if(institute.type == 'National Committee on Accreditation')
                                    referenceNo = institute.ncano;
                                if(institute.type == 'others')
                                    referenceNo = institute.otheraccno;
                                if(institute.type == 'Educational credential evaluators WES')
                                    referenceNo = institute.wesno;
            
                                instituteData.push({
                                    purpose : institute.type,
                                    email : email,
                                    reference_no : referenceNo,
                                    status : status
                                });  
                            })
            
                            final_data.push({
                                application_id : application.id,
                                instituteData : instituteData,
                                application_date : moment(application.created_at).format('DD-MM-YYYY'),
                                
                            })
                        })
                    })
                    setTimeout(()=>{
                        res.json({
                            status : 200,
                            data : final_data,
                            userdata : userdata
                        })
                    },1000)
                })
            }else{
                res.json({
                    status : 200,
                    data : final_data,
                    userdata : userdata
                })
            }
        })
    })
});



router.get('/adminDashboard/getApplWisePayments', function (req, res) {
    var userId = req.query.id;
    var appl_id  = req.query.appl_id;
    var data = [];
    models.Orders.findAll({
        where:
        {
            user_id : userId,
            status : '1',
            application_id : appl_id
        }
    }).then(function(orders){
        if(orders){
            async.eachSeries(orders, function(order, callback) {
                models.Transaction.find({
                    where:
                    {
                        order_id : order.id
                    }
                }).then(function(trans){
                    data.push({
                        order_id : trans.id,
                        transaction_id : trans.merchant_param5,
                        amount : trans.amount,
                        currency : trans.currency,
                        payment_date : trans.created_at,
                        application_id : order.application_id
                    });
                    callback();
                });
            },
            function(err){
                if(!err) {
                    res.json({
                        status: 200,
                        message: 'Payment Details Retrive Successfully',
                        data: data
                     });
                
                }
            });
        }
    })
 });

router.get('/adminDashboard/downloadPaymentReceipt',function(req,res){
	var appl_id = req.query.appl_id;
	var user_id = req.query.user_id;
	var filePath=constant.FILE_LOCATION+"public/upload/transcript/"+user_id+'/'+appl_id+"_Attestation_Payment_Challan.pdf"
	res.download(filePath);
})

router.get('/adminDashboard/activitytracker', function(req, res) {
	
	var students = [];
    var page = req.query.page;
    var id = req.query.id ? req.query.id : '';
    var date = req.query.date ? req.query.date : '';
    var email = req.query.email ? req.query.email : '';
    var data = req.query.data ? req.query.data : '';
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(data != '' && data != null && data != undefined && data != 'null' && data != 'undefined'){
        var filter ={};
        filter.name = 'data';
        filter.value = data;
        filters.push(filter);
    }

    if(date != '' && date != null && date != undefined && date != 'null' && date != 'undefined'){
        var filter ={};
        filter.name = 'date';
        filter.value = date;
        filters.push(filter);
    }



	
	//Replace adminactivity to studentactivity
    models.Activitytracker.getactivitySearchResults(filters,null,null).then(function(useractivity){
        countObjects.totalLength = useractivity.length;
        models.Activitytracker.getactivitySearchResults(filters,limit,offset).then(function(filter_activity) {	
            countObjects.filteredLength = filter_activity.length;	
             var acticity_data = [];
                if(filter_activity != null) {
                    require('async').eachSeries(filter_activity, function(student, callback){
               
                     var obj = {
                        application_id : (student.application_id) ? student.applicaiton_id : '',
                        created_at : (student.created_at) ? moment(new Date(student.created_at)).format('DD/MM/YYYY HH:mm') : '',
                        email : (student.username) ? student.username : '',
                        action:(student.action)? student.action:'',
                        data:(student.data)? student.data:'',
                        user_id:(student.userId)? student.userId:'',
                        };

                    acticity_data.push(obj);
                   
                    callback();
               
                    }, function(){
                        res.json({
                            status: 200,
                            message: 'Student retrive successfully',
                            items: acticity_data,
                            total_count: countObjects,
                        });
           });
       } else {
           res.json({
               status: 400,
               message: 'Problem in retrieving student list'
           });
       }
               

	});
	
});
	
});

router.get('/adminDashboard/downloadExcel',function(req,res){
    var type = req.query.type;
    var TotalAppdata = [];
    if(type != undefined){
        models.Application.downloadExcel(type).then((data)=>{
           	if(data != null || data != undefined){
           		require('async').each(data, function(data, callback) {
                	var college_names = '';
                    models.userMarkList.getdistinctClg(data.user_id).then(function(colleges){
                    	colleges.forEach(college=>{
                    		college_names += ',' + college.name; 
                    	})
                        models.Institution_details.findAll({
                            where :{
                                user_id : data.user_id,
                                app_id : data.id
                            }
                        }).then(function(purposeDetails){
                            var purposeData = '';
                            purposeDetails.forEach(purpose=>{
                                purposeData += purpose.type + ","
                            });
                            var applied_for = '';
                            if(data.instructionalField == true){
                                applied_for += "Medium of Instruction,"
                            }
                            if(data.curriculum == true){
                                applied_for += "Curriculum,"
                            }
                            if(data.educationalDetails == true){
                                applied_for += "Educational Details,"
                            }
                            if(data.gradToPer == true){
                                applied_for += "Grade to Percentage Letter,"
                            }
                            if(data.CompetencyLetter == true){
                                applied_for += "Competency Letter,"
                            }
                            if(data.affiliation == true){
                                applied_for += "Affiliation Letter,"
                            }
                            if(data.LetterforNameChange == true){
                                applied_for += "Name change Letter"
                            }
                            
                            if(type == 'totalApplications'){
                                TotalAppdata.push({
                                    'Application Id' : data.id,           
                                    'Student Name' : data.Name,
                                    'Student Email' : data.email,
                                    'Applied for': applied_for,
                                    'purpose' : purposeData,
                                    'Application status' : data.tracker,
                                    'colleges' : college_names,
                                    'application_date' : moment(data.created_at).format("DD-MM-YYYY")
                                });
                            }else if(type == 'pendingApplications'){
                                TotalAppdata.push({
                                    'Application Id' : data.id,           
                                    'Student Name' : data.Name,
                                    'Student Email' : data.email,
                                    'Student contact' : data.contactNumber,
                                    'Applied for': applied_for,
                                    'purpose' : purposeData,
                                    'colleges' : college_names,
                                    'application_date' : moment(data.created_at).format("DD-MM-YYYY")
                                });
                            }else if(type == 'verifiedApplications'){
                                TotalAppdata.push({
                                    'Application Id' : data.id,           
                                    'Student Name' : data.Name,
                                    'Student Email' : data.email,
                                    'Applied for': applied_for,
                                    'purpose' : purposeData,
                                    'Approved by' : data.approved_by,
                                    'colleges' : college_names,
                                    'application_date' : moment(data.created_at).format("DD-MM-YYYY")
                                });
                            }else if(type == 'signedApplications'){
                                TotalAppdata.push({
                                    'Application Id' : data.id,           
                                    'Student Name' : data.Name,
                                    'Student Email' : data.email,
                                    'Applied for': applied_for,
                                    'purpose' : purposeData,
                                    'Approved by' : data.approved_by,
                                    'Emailed Date' : data.updated_at,
                                    'colleges' : college_names,
                                    'application_date' : moment(data.created_at).format("DD-MM-YYYY")
                                });
                            }else if(type == 'emailedApplications'){
                                TotalAppdata.push({
                                    'Application Id' : data.id,           
                                    'Student Name' : data.Name,
                                    'Student Email' : data.email,
                                    'Applied for': applied_for,
                                    'purpose' : purposeData,
                                    'Approved by' : data.approved_by,
                                    'Emailed Date' : data.updated_at,
                                    'colleges' : college_names,
                                    'application_date' : moment(data.created_at).format("DD-MM-YYYY")
                                });
                            }
                        
                            callback();	
                        })
                    })
                  }, function(error, results) {
                          
                      setTimeout(function(){
                          var xls = json2xls(TotalAppdata);
                          var file_location = constant.FILE_LOCATION+"public/Excel/"+type+".xlsx";
                          fs.writeFileSync(file_location, xls, 'binary');
                          var filepath= constant.FILE_LOCATION+"/public/Excel/"+type+".xlsx";
                         
                      res.json({
                                status: 200,
                               data: filepath
                          });
                               
                      },13000);
                   });
              }else{
                  res.json({
                      status: 400,
      
                  })
              }
          })
    }
})

router.get('/adminDashboard/downloadExcel_datewise',function(req,res){
    console.log("downloadExcel_datewise");
    var type = req.query.type;
    var TotalAppdata = [];
    var startDate = req.query.startDate;
    var endDate = moment(req.query.endDate).add(1, 'days').format('YYYY-MM-DD');

    if(type != undefined){
        models.Application.downloadExcel_datewise(type,startDate,endDate).then((data)=>{
           	if(data != null || data != undefined){
                
                require('async').each(data, function(data, callback) {
                	var college_names = '';
                	var course_name = '';
                    models.userMarkList.getdistinctClg(data.user_id).then(function(colleges){
                    	colleges.forEach(college=>{
                    		college_names += ',' + college.name; 
                            course_name +=',' + college.type + 'of' + college.faculty; 
                    	})
                        models.Institution_details.findAll({
                            where :{
                                user_id : data.user_id,
                                app_id : data.id
                            }
                        }).then(function(purposeDetails){
                            var purposeData = '';
                            purposeDetails.forEach(purpose=>{
                                purposeData += purpose.type + ","
                            });
                            var applied_for = '';
                            if(data.instructionalField == true){
                                applied_for += "Medium of Instruction,"
                            }
                            if(data.curriculum == true){
                                applied_for += "Curriculum,"
                            }
                            if(data.educationalDetails == true){
                                applied_for += "Educational Details,"
                            }
                            if(data.gradToPer == true){
                                applied_for += "Grade to Percentage Letter,"
                            }
                            if(data.CompetencyLetter == true){
                                applied_for += "Competency Letter,"
                            }
                            if(data.affiliation == true){
                                applied_for += "Affiliation Letter,"
                            }
                            if(data.LetterforNameChange == true){
                                applied_for += "Name change Letter"
                            }
                            
                            if(type == 'totalApplications'){
                                
                    
                                TotalAppdata.push({
                                    'Application Id' : data.id,           
                                    'Student Name' : data.Name,
                                    'Student Email' : data.email,
                                    'Applied for': applied_for,
                                    'purpose' : purposeData,
                                    'Application status' : data.tracker,
                                    'colleges' : college_names,
                                    'application_date' : moment(data.created_at).format("DD-MM-YYYY")
                                });
                            }else if(type == 'pendingApplications'){
                                TotalAppdata.push({
                                    'Application Id' : data.id,           
                                    'Student Name' : data.Name,
                                    'Student Email' : data.email,
                                    'Student contact' : data.contactNumber,
                                    'Applied for': applied_for,
                                    'purpose' : purposeData,
                                    'colleges' : college_names,
                                    'application_date' : moment(data.created_at).format("DD-MM-YYYY")
                                });
                            }else if(type == 'verifiedApplications'){
                                TotalAppdata.push({
                                    'Application Id' : data.id,           
                                    'Student Name' : data.Name,
                                    'Student Email' : data.email,
                                    'Applied for': applied_for,
                                    'purpose' : purposeData,
                                    'Approved by' : data.approved_by,
                                    'colleges' : college_names,
                                    'application_date' : moment(data.created_at).format("DD-MM-YYYY")
                                });
                            }else if(type == 'signedApplications'){
                                TotalAppdata.push({
                                    'Application Id' : data.id,           
                                    'Student Name' : data.Name,
                                    'Student Email' : data.email,
                                    'Applied for': applied_for,
                                    'purpose' : purposeData,
                                    'Approved by' : data.approved_by,
                                    'Emailed Date' : data.updated_at,
                                    'colleges' : college_names,
                                    'application_date' : moment(data.created_at).format("DD-MM-YYYY")
                                });
                            }else if(type == 'emailedApplications'){
                                TotalAppdata.push({
                                    'Application Id' : data.id,           
                                    'Student Name' : data.Name,
                                    'Student Email' : data.email,
                                    'Applied for': applied_for,
                                    'purpose' : purposeData,
                                    'Approved by' : data.approved_by,
                                    'Emailed Date' : data.updated_at,
                                    'colleges' : college_names,
                                    'application_date' : moment(data.created_at).format("DD-MM-YYYY")
                                });
                            }
                            else if(type == 'totalApplications_finance'){
                                            TotalAppdata.push({
                                                 'Application Id' : data.id, 
                                                 'Student Name' : data.Name,
                                                 'Student Email' : data.email,
                                                 'Applied for': applied_for,
                                                 'purpose' : purposeData,
                                                 'Approved by' : data.approved_by,
                                                 'colleges' : college_names,
                                                 'Application_date' : moment(data.created_at).format("DD-MM-YYYY"),
                                                 "OrderId"  : data.orderId,
                                                 "Transaction id" : data.tracking_id,
                                                "Split Status" :  data.split_status,
                                                "Amount Payable" : data.amount,
                                                "CCAvenue Refernce No/Transaction id" : data.tracking_id,
                                                'courses' : course_name,
                                                'application_date' : moment(data.created_at).format("DD-MM-YYYY"),                                                
                                                
                                            });
                                    
                                    }                        
                            callback();	
                        })
                    })
                  }, function(error, results) {
                          
                      setTimeout(function(){
                        // console.log("TotalAppdata"+ TotalAppdata);  
                        var xls = json2xls(TotalAppdata);
                          var file_location = constant.FILE_LOCATION+"public/Excel/"+type+".xlsx";
                          fs.writeFileSync(file_location, xls, 'binary');
                          var filepath= constant.FILE_LOCATION+"/public/Excel/"+type+".xlsx";
                         
                      res.json({
                                status: 200,
                               data: filepath
                          });
                               
                      },13000);
                   });
              }else{
                  res.json({
                      status: 400,
      
                  })
              }
          })
    }
})


router.get('/adminDashboard/downloadfile', middlewares.getUserInfo,function (req, res) {
    const downloadData = req.query.file_path; 
    res.download(downloadData);
});

router.get('/role_management/getMenuRole',middlewares.getUserInfo,function(req,res) {
  
    var featurenames = [];
	models.Role.find({
		where: {
			userid: req.User.id
		}
	}).then(function (roles) {
		if (roles) {
			if (roles.dashboard) {
				featurenames.push('dashboard');
			}
			if (roles.profile) {
				featurenames.push('profile');
			}
			if (roles.studentManagement) {
				featurenames.push('studentManagement');
			}
			if (roles.SubAdminDashboard) {
				featurenames.push('SubAdminDashboard');
			}
			if (roles.adminTotal) {
				featurenames.push('adminTotal');
			}
			if (roles.adminPending) {
				featurenames.push('adminPending');
			}
			if (roles.adminVerified) {
				featurenames.push('adminVerified');
			}
			if (roles.adminSigned) {
				featurenames.push('adminSigned');
			}
			if (roles.adminPayment) {
				featurenames.push('adminPayment');
			}
			if (roles.adminDashboard) {
				featurenames.push('adminDashboard');
			}
			if (roles.help) {
				featurenames.push('help');
			}
			if (roles.adminReport) {
				featurenames.push('adminReport');
			}
			if (roles.collegeManagement) {
				featurenames.push('collegeManagement');
			}
            if (roles.AdminDash) {	
				featurenames.push('AdminDash');	
			}
            if (roles.adminWesApp) {	
				featurenames.push('adminWesApp');	
			}
            if (roles.adminemailed) {	
				featurenames.push('adminemailed');	
			}
			res.json({
				status: 200,
				data: featurenames
			})
		} else {
			res.json({
				status: 400
			})
		}
	})
})

router.get('/role_management/main', function(req, res) {
    var counter = 0;
    models.User.findAll({
        where: {
            user_type: 'sub-admin',
            user_status: ['active', 'inactive']
        },
        attributes: ['id','name','email','mobile','user_status'],
        include: [
            {
                model: models.Role,
                attributes:   ['dashboard','profile','studentManagement','SubAdminDashboard','adminTotal','adminPending','adminVerified','adminSigned','adminPayment','adminDashboard','adminReport','help','adminemailed','collegeManagement','AdminDash','adminWesApp']
            }
        ],
    }).then(function(subadmins){
       
        var features = [];
        var featurenames = [];
        var subAdminsFinal = [];
        for(var i=0; i < subadmins.length; i++){
            counter++;
            var features = [];
            var featurenames = [];
            if(subadmins[i].Role != null){
                for (var key in subadmins[i].Role.dataValues){
                    if(subadmins[i].Role.dataValues[key]){
                       
                        features.push(key);
                        if(key == 'dashboard'){
                            if(featurenames.indexOf("dashboard") == -1){
                                featurenames.push('dashboard');
                            }
                        }else if(key == 'profile'){
                            if(featurenames.indexOf("profile") == -1){
                                featurenames.push('profile');
                            }
                        }else if(key == 'studentManagement'){
                            if(featurenames.indexOf("studentManagement") == -1){
                                featurenames.push('studentManagement');
                            }
                        }else if(key == 'SubAdminDashboard'){
                            if(featurenames.indexOf("SubAdminDashboard") == -1){
                                featurenames.push('SubAdminDashboard');
                            }	
                        }else if(key == 'adminTotal'){
                            if(featurenames.indexOf("adminTotal") == -1){
                                featurenames.push('adminTotal');
                            }
                        }else if(key == 'adminPending'){
                            if(featurenames.indexOf("adminPending") == -1){
                                featurenames.push('adminPending');
                            }
                        }else if(key == 'adminVerified'){
                            if(featurenames.indexOf("adminVerified") == -1){
                                featurenames.push('adminVerified');
                            }
                        }else if(key == 'adminSigned'){
                            if(featurenames.indexOf("adminSigned") == -1){
                                featurenames.push('adminSigned');
                            }
                        }else if(key == 'adminPayment'){
                            if(featurenames.indexOf("adminPayment") == -1){
                                featurenames.push('adminPayment');
                            }
                        }else if(key == 'adminDashboard'){
                            if(featurenames.indexOf("adminDashboard") == -1){
                                featurenames.push('adminDashboard');
                            }
                        }else if(key == 'adminReport'){
                            if(featurenames.indexOf("adminReport") == -1){
                                featurenames.push('adminReport');
                            }
                        }else if(key == 'help'){
                            if(featurenames.indexOf("help") == -1){
                                featurenames.push('help');
                            }
                        }else if(key == 'adminemailed'){
                            if(featurenames.indexOf("adminemailed") == -1){
                                featurenames.push('adminemailed');
                            }
                        }else if(key == 'collegeManagement'){
                            if(featurenames.indexOf("collegeManagement") == -1){
                                featurenames.push('collegeManagement');
                            }
                        }else if(key == 'AdminDash'){	
                            if(featurenames.indexOf("AdminDash") == -1){	
                                featurenames.push('AdminDash');	
                            }
                        }else if(key == 'adminWesApp'){	
                            if(featurenames.indexOf("adminWesApp") == -1){	
                                featurenames.push('adminWesApp');	
                            }
                        }
                    }
                }
            }
           
            subadmins[i].Role = '';
            var subAdminsFinalObj = {};
            subAdminsFinalObj.subadmins = {};
            subAdminsFinalObj.subadmins.id = subadmins[i].id;
            subAdminsFinalObj.subadmins.name = subadmins[i].name;
            subAdminsFinalObj.subadmins.email = subadmins[i].email;
            subAdminsFinalObj.subadmins.mobile = subadmins[i].mobile;
            subAdminsFinalObj.subadmins.user_status = subadmins[i].user_status;
            subAdminsFinalObj.subadmins.features = features;
            subAdminsFinalObj.subadmins.featurenames = featurenames;
            subAdminsFinal.push(subAdminsFinalObj);
            
            if(subadmins.length == counter){
                res.json({
                    status: 200,
                    message: 'Sub-admin list retrieved successfully',
                    data: subAdminsFinal,
                });
            }
        }
    });
        
});

router.post('/role_management/setUpdateRole',function(req,res){
    models.Role.find({
        where:{
            userid : req.body.user_id
        }
    }).then(function(roles){
        if(roles){
           var insert_obj = {
                dashboard: 0,
                profile: 0,
                studentManagement: 0,
                SubAdminDashboard: 0,
                adminTotal: 0,
                adminPending: 0,
                adminVerified: 0,
                adminSigned: 0,
                adminPayment: 0,
                adminDashboard: 0,
                adminReport: 0,
                adminemailed : 0,
                help: 1,
                collegeManagement : 0,	
                AdminDash : 0,
                adminWesApp : 0
            };
            
            if(req.body.roles.constructor === Array && req.body.roles.length > 0) {
                req.body.roles.forEach(function(role) {
                    insert_obj[role] = 1;
                });
            }
            roles.update(insert_obj).then(function(updated_roles) {
                    if(updated_roles) {
                    res.json({
                        status: 200,
                        data:updated_roles
                    });
                }else {
                    res.json({
                        status: 400,
                        message : "Error occured while updating roles."
                    });
                }
            });

        }else{
            var insert_obj = {
                userid: req.body.user_id
            };
            if(req.body.roles){
                if(req.body.roles.constructor === Array && req.body.roles.length > 0) {
                    req.body.roles.forEach(function(role) {
                        insert_obj[role] = 1;
                    });
                }
            }

            models.Role.create(insert_obj).then(function(roles_created) {
                if(roles_created){
                    res.json({
                        status:200,
                        data:roles_created
                    })
                }else{
                    res.json({
                        status:400,
                        message : "Error occured while creating roles."
                    })
                }
            })
        }
    })
})

router.get('/role_management/getRolesData',function (req, res) {
    var view_data = {};
    models.Role.find({
        where:{
            userid : req.query.userId
        }
    }).then(function(roles){
       
        if(roles){
            
            view_data.dashboard= roles.dashboard;
            view_data.profile = roles.profile;
            view_data.studentManagement = roles.studentManagement;
            view_data.SubAdminDashboard = roles.SubAdminDashboard;
            view_data.adminTotal = roles.adminTotal;
            view_data.adminPending = roles.adminPending;
            view_data.adminVerified = roles.adminVerified;
            view_data.adminSigned = roles.adminSigned;
            view_data.adminPayment = roles.adminPayment;
            view_data.adminDashboard = roles.adminDashboard;
            view_data.adminReport = roles.adminReport;
            view_data.adminWesApp = roles.adminWesApp;
          //  view_data.theme = roles.theme;
            view_data.help = roles.help;
            view_data.adminemailed = roles.adminemailed;
            view_data.collegeManagement = roles.collegeManagement;
            view_data.AdminDash = roles.AdminDash;
            res.json({
                status:200,
                data : view_data
            })

        }else{
            res.json({
                status:400
            })
        }
    })
})

router.get('/role_management/getSubAdminData',middlewares.getUserInfo, function(req, res) {
    models.User.find({
        where:{
            id : req.query.userId
        }
    }).then(function(user){
        res.json({
            status : 200,
            data : user
        })
    })
});

router.post('/role_management/addUpdatesubAdmin',middlewares.getUserInfo,function(req,res){
    var data  = req.body.subAdminData;
    if(req.body.userId != null){
        models.User.find({
            where :{
                id : req.body.userId
            }
        }).then(function(user){
            user.update({
                name : data.name,
                surname : data.surname,
                email : data.email,
                mobile : data.mobile,
                gender : data.gender
            }).then(function(updatedUser){
                var response = {
                    status : 'edit',
                    id : updatedUser.id
                }
                res.json({
                    status : 200,
                    data : response
                })
            })
        })
    }else{
        var password = "P@ssw0rd";
        var hashPassword = functions.generateHashPassword(password);
        var otp = functions.generateRandomString(6, 'numeric');
        models.User.create({
            name : data.name,
            surname : data.surname,
            email : data.email,
            mobile : data.mobile,
            gender : data.gender,
            password : hashPassword,
            user_status : 'active',
            user_type : 'sub-admin',
            postal_code:'',
            otp : otp,
            is_otp_verified : 1,
            is_email_verified : 0
        }).then(function(user){
            var response = {
                status : 'add',
                id : user.id
            }
            res.json({
                status : 200,
                data : response
            })
        })
    }
})

router.post('/role_management/changeSubAdminStatus',middlewares.getUserInfo,function(req,res){
    models.User.find({
        where :{
            id : req.body.userId
        }
    }).then(function(user){
        if(user.user_status == 'active'){
            user.update({
                user_status : 'inactive'
            }).then(function(updatedUser){
                if(updatedUser){
                    res.json({
                        status : 200
                    })
                }else{
                    res.json({
                        status : 400
                    })
                }
            })
        }else if(user.user_status == 'inactive'){
            user.update({
                user_status : 'active'
            }).then(function(updatedUser){
                if(updatedUser){
                    res.json({
                        status : 200
                    })
                }else{
                    res.json({
                        status : 400
                    })
                }
            })
        }

    })
})

router.post('/getapplWiseTracker',function(req,res){
    var data = {};
    client.setApiKey(constant.SENDGRID_API_KEY);
    email=req.body.email.replace(/\@/g,'%40');
    models.User.find({
        where:{
            id : req.body.user_id
        }
    }).then(function(user){
        var request = {};
        request.method = 'GET';
        if(req.body.app_id == '126'){
            request.url = '/v3/messages?limit=5000&query=subject%3D%22Sending%20attested%20Document%20From%20Mumbai%20University%20for%20application%20'+req.body.app_id+'%22';
        }
        else{
            request.url = '/v3/messages?limit=5000&query=subject%3D%22Official%20Record%20of%20%20'+ user.name + '%20' + user.surname + '%22';
        }
        client.request(request).then(([response, body]) => {
            var a = JSON.stringify(response.body);
            var b = response.body.messages;
            var count=0;
            if(b.length > 0){
                b.forEach((index)=>{
                    
                    if(req.body.email == index.to_email){
                        data.status = index.status;
                        data.opens_count = index.opens_count;
                        if( index.status == 'delivered'){
                            count++;
                        }
                    }
                })
               models.Iptracker.find({
                    where : {
                        app_id : req.body.app_id,
                        email : req.body.email,
                    }
                }).then((exists)=>{
                    if(exists){
                        data.ipdata = "exists"
                    }else{
                        data.ipdata = "not_exists"
                    }
                    res.json({
                        status: 200,
                        data: data,
                    });
                })
            }else{
                res.json({
                    status: 400,
                    data: data,
                });
            } 
        });
    });
})

router.post('/getclickDetails',function(req, res){
    console.log("/getclickDetails");
    var location = req.body.location.city+" "+req.body.location.regionName+" "+req.body.location.country;
    models.Emailed_Docs.find( {
        where: {
            id : req.body.docID,
            app_id : req.body.app_id
        }
    }).then(function (result) {
        if(result){
            models.Application.find({
                where :{
                    id :req.body.app_id
                }  
            }).then(function(application){
                var file = constant.FILE_LOCATION + "public/signedpdf/"+application.user_id+"/"+req.body.fileName;
                // models.Iptracker.find({
                //     where : {
                //         emaildoc_id : req.body.docID,
                //         app_id : req.body.app_id,
                //         email : req.body.email,
                //     }
                // }).then((exists)=>{
                //     if(exists){
                //         var ipArray = exists.ip_address.split(/[,]/);
                //         var finalArray = [];
                //         ipArray.forEach(element => {
                //             finalArray.push(element);
                //         });
                //         if (finalArray.indexOf(req.body.location.query) === -1) {
                //             finalArray.push(req.body.location.query);
                //         }
     
                //         var addArray = exists.opened_loc.split(/[/]/);
                //         var finaladdArray = [];
                //         addArray.forEach(element => {
                //             finaladdArray.push(element);
                //         });
                //         if (finaladdArray.indexOf(location) === -1) {
                //             finaladdArray.push(location);
                //         }
                         
                //         models.Iptracker.update({
                //             opened_loc : finaladdArray.join('/'),
                //             ip_address : finalArray.join(','),
                //         }, {
                //             where: {
                //                 emaildoc_id : req.body.docID,
                //                 app_id : req.body.app_id,
                //                 email : req.body.email,
                //             }
                //         }).then((data)=>{
                //             res.json({
                //                 status : 200,
                //                 password: result.password
                //             })
                //         })
                //     }else{
                //         if(req.body.email != null){
                //             models.Iptracker.create({
                //                 email : req.body.email,
                //                 opened_loc : location,
                //                 ip_address : req.body.location.query,
                //                 emaildoc_id : req.body.docID,
                //                 app_id : req.body.app_id
                //             }).then((data)=>{
                //                 res.json({
                //                     status : 200,
                //                     password: result.password,
                //                     filePath : file
                //                 })
                //             })
                //         }
                //     }
                // })
                res.json({
                    status : 200,
                    // password: result.password,
                    filePath : file
                })

            })
        }else{
            res.json({
                status : 400
            })
        }
    })   
})

router.get('/adminDashboard/getPurposeDetails', function(req,res){
    models.Institution_details.findAll({
        where:{
            user_id : req.query.userId
        }
    }).then(function(institutionDetails){
        res.json({
            status : 200,
            data : institutionDetails
        })
       
    })
});

router.post('/sendEmailToCollege',middlewares.getUserInfo,function(req,res){
    var user_id = req.body.user_id;
    var college_id = req.body.collegeId;
    var app_id = req.body.app_id;
    models.User.find({
        where :
        {
            id : user_id
        }
    }).then(function(userdetails){

   
    models.Applied_For_Details.find({
        where : {
            user_id : user_id,
            app_id : app_id
        }
    }).then(function(user){
        models.College.find({
            where :{
                id  : college_id
            }
        }).then(function(college){
            if(user.educationalDetails == true){
                models.User_Transcript.findAll({
                    where : {
                        user_id : user_id,
                        collegeId : college.id
                    }
                }).then(function(userTranscripts){
                    var singleCollege = {
                        type: '',
                        user_id : '',
                        collegeName : '',
                        studentName : '',
                        courseName : '',
                        college_id : '',
                        collegeEmail : '',
                        alternateEmail : '',
                        user_transcript : [],
                        user_markList : [],
                        user_curriculum : [],
                        app_id : app_id
                    }
                    singleCollege.type = 'educationalDetails';
                    singleCollege.user_id =  user_id;
                    singleCollege.collegeName = college.name;
                    singleCollege.studentName = userdetails.name + ' ' + userdetails.surname;
                    singleCollege.college_id = college_id;
                    singleCollege.collegeEmail = college.emailId;
                    singleCollege.alternateEmail = college.alternateEmailId;
                    userTranscripts.forEach(userTranscript=>{
                        singleCollege.user_transcript.push({'fileName':userTranscript.file_name,'transcript':'upload/transcript/'+ user_id + "/" + urlencode(userTranscript.file_name)});
                    });
                    models.userMarkList.find({
                        where:{
                            user_id : user_id,
                            collegeId : college_id
                        }
                    }).then(function(userMarkListsData){
                    	if(userMarkListsData){
	                    	models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){     
		                        userMarkLists.forEach(userMarkList=>{
		                            if((userMarkList.file_name !='null' && userMarkList.file_name!=null)&& (userMarkList.usermarklist_file_name==null)){
		                            singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.file_name)});
		                            }else if((userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null) && (userMarkList.file_name ==null)){
		                            singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.usermarklist_file_name)});
		                            }else if(userMarkList.file_name !='null' && userMarkList.file_name!=null && userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null){
		                                singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.file_name)});
		                                singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.usermarklist_file_name)});

		                            }
		                        });
							});
                    	}
					 	setTimeout(function(){
					 		request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                            	json: {
                                	singleCollege : singleCollege
                            	}
                        	}, function (error, response, body) {
                            	if(body.notSent.length > 0){
                                	body.noteSent.forEach(data=>{
                                    	models.User_Transcript.updateSingleCollegeEmailStatus(user_id,data.college_id,null,'not sent');
                                	})
                            	}
                            	body.data.forEach(msgId=>{
                                	models.User_Transcript.updateSingleCollegeEmailStatus(user_id,msgId.college_id,msgId.msg_id,'sent');
                            	});
                              
                        	})
                        },1000);
                    })
                })
            }
            if(user.instructionalField == true){
                var singleCollege = {
                    type: '',
                    user_id : '',
                    collegeName : '',
                    studentName : '',
                    courseName : '',
                    college_id : '',
                    collegeEmail : '',
                    alternateEmail : '',
                    user_transcript : [],
                    user_markList : [],
                    user_curriculum : [],
                    app_id : app_id
                }
                models.InstructionalDetails.findOne({
                    where :{
                        userId : user_id
                    }
                }).then(function(instructional){
                    models.userMarkList.find({
                        where :{
                            user_id : user_id,
                            collegeId : college_id
                        }
                    }).then(function(userMarkListsData){
                        models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){     
                        singleCollege.type = 'instructionalField';
                        singleCollege.user_id = user_id;
                        singleCollege.collegeName = college.name;
                        singleCollege.studentName = instructional.studentName;
                        singleCollege.courseName = instructional.courseName;
                        singleCollege.college_id = college.id;
                        singleCollege.collegeEmail = college.emailId;
                        singleCollege.alternateEmail = college.alternateEmailId;
                        userMarkLists.forEach(markList=>{
                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});

                            }
                        });

                        setTimeout(function(){
                            request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                json: {
                                    singleCollege : singleCollege
                                }
                            }, function (error, response, body) {
                                if(body.notSent.length > 0){
                                    body.noteSent.forEach(data=>{
                                        models.InstructionalDetails.updateSingleEmailStatus(user_id,null,'not sent');
                                    })
                                }
                                body.data.forEach(msgId=>{
                                    models.InstructionalDetails.updateSingleEmailStatus(user_id,msgId.msg_id,'sent');
                                });
                                  
                            })
                        },1000);
                    })
                })
                })
            }
            if(user.affiliation == true){
                var singleCollege = {
                    type: '',
                    user_id : '',
                    collegeName : '',
                    studentName : '',
                    courseName : '',
                    college_id : '',
                    collegeEmail : '',
                    alternateEmail : '',
                    user_transcript : [],
                    user_markList : [],
                    user_curriculum : [],
                    app_id : app_id
                }
                models.Affiliation_Letter.findOne({
                    where :{
                        user_id : user_id
                    }
                }).then(function(affiliation){
                    models.userMarkList.find({
                        where :{
                            user_id : user_id,
                            collegeId : college_id
                        }
                    }).then(function(userMarkListsData){
                        models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){     
                        singleCollege.type = 'affiliation';
                        singleCollege.user_id = user_id;
                        singleCollege.collegeName = college.name;
                        singleCollege.studentName = affiliation.studentName;
                        singleCollege.courseName = affiliation.courseName;
                        singleCollege.college_id = college.id;
                        singleCollege.collegeEmail = college.emailId;
                        singleCollege.alternateEmail = college.alternateEmailId;
                        userMarkLists.forEach(markList=>{
                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});

                            }
                        });

                        setTimeout(function(){
                            request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                json: {
                                    singleCollege : singleCollege
                                }
                            }, function (error, response, body) {
                                if(body.notSent.length > 0){
                                    body.noteSent.forEach(data=>{
                                        models.InstructionalDetails.updateSingleEmailStatus(user_id,null,'not sent');
                                    })
                                }
                                body.data.forEach(msgId=>{
                                    models.InstructionalDetails.updateSingleEmailStatus(user_id,msgId.msg_id,'sent');
                                });
                                  
                            })
                        },1000);
                    })
                })
                })
            }
            if(user.curriculum == true){
                models.User_Curriculum.findAll({
                    where : {
                        user_id : user_id,
                        collegeId : college_id
                    }
                }).then(function(userCurriculum){
                    var singleCollege = {
                        type: '',
                        user_id : '',
                        collegeName : '',
                        studentName : '',
                        courseName : '',
                        college_id : '',
                        collegeEmail : '',
                        alternateEmail : '',
                        user_transcript : [],
                        user_markList : [],
                        user_curriculum : [],
                        app_id : app_id
                    }
                    singleCollege.type = 'curriculum';
                    singleCollege.user_id = user_id;
                    singleCollege.collegeName = college.name;
                    singleCollege.collegeEmail = college.emailId;
                    singleCollege.studentName = user.name + ' ' + user.surname;
                    singleCollege.college_id = college.id;
                    singleCollege.alternateEmail = college.alternateEmailId; 
                    userCurriculum.forEach(curriculum=>{
                        singleCollege.user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+ user_id + "/" + urlencode(curriculum.file_name)});
                    });
                    models.userMarkList.find({
                        where : {
                            user_id : user_id,
                            collegeId : college_id
                        }
                    }).then(function(userMarkListsData){
                        models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){      
                        userMarkLists.forEach(markList=>{
                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                            singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});

                            }
                        });

                        setTimeout(function(){
                            request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                json: {
                                    singleCollege : singleCollege
                                }
                            }, function (error, response, body) {
                                if(body.notSent.length > 0){
                                    body.noteSent.forEach(data=>{
                                        models.User_Curriculum.updateSingleCollegeEmailStatus(user_id,data.college_id,null,'not sent');
                                    })
                                }
                                body.data.forEach(msgId=>{
                                    models.User_Curriculum.updateSingleCollegeEmailStatus(user_id,msgId.college_id,msgId.msg_id,'sent');
                                });
                                  
                            })
                        },1000);
                    })
                  });
                })
            }
            if(user.gradToPer == true){
                models.GradeToPercentageLetter.findAll({
                    where : {
                        user_id : user_id,
                        collegeId : college.id
                    }
                }).then(function(letters){
                    var singleCollege = {
                        type: '',
                        user_id : '',
                        collegeName : '',
                        studentName : '',
                        courseName : '',
                        college_id : '',
                        collegeEmail : '',
                        alternateEmail : '',
                        letter : [],
                        user_markList : [],
                        user_curriculum : [],
                        app_id : app_id
                    }
                    singleCollege.type = 'gradeToPercentLetter';
                    singleCollege.user_id =  user_id;
                    singleCollege.collegeName = college.name;
                    singleCollege.studentName = user.name + ' ' + user.surname;
                    singleCollege.college_id = college_id;
                    singleCollege.collegeEmail = college.emailId;
                    singleCollege.alternateEmail = college.alternateEmailId;
                    letters.forEach(letter=>{
                        singleCollege.letter.push({'fileName':letter.file_name,'letter':'upload/gradeToPercentLetter/'+ user_id + "/" + urlencode(letter.file_name)});
                    });
                    models.userMarkList.find({
                        where:{
                            user_id : user_id,
                            collegeId : college_id
                        }
                    }).then(function(userMarkListsData){
                    	if(userMarkListsData){
	                    	 models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){     
		                        userMarkLists.forEach(userMarkList=>{
		                            if((userMarkList.file_name !='null' && userMarkList.file_name!=null)&& (userMarkList.usermarklist_file_name==null)){
		                            singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.file_name)});
		                            }else if((userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null) && (userMarkList.file_name ==null)){
		                            singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.usermarklist_file_name)});
		                            }else if(userMarkList.file_name !='null' && userMarkList.file_name!=null && userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null){
		                                singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.file_name)});
		                                singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.usermarklist_file_name)});

		                            }
		                        });
							});
                    	}
					 	setTimeout(function(){
					 		request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                            	json: {
                                	singleCollege : singleCollege
                            	}
                        	}, function (error, response, body) {
                            	if(body.notSent.length > 0){
                                	body.noteSent.forEach(data=>{
                                    	models.GradeToPercentageLetter.updateSingleCollegeEmailStatus(user_id,data.college_id,null,'not sent');
                                	})
                            	}
                            	body.data.forEach(msgId=>{
                                	models.GradeToPercentageLetter.updateSingleCollegeEmailStatus(user_id,msgId.college_id,msgId.msg_id,'sent');
                            	});
                              
                        	})
                        },1000);
                    })
                })
            }
            setTimeout(()=>{
                res.json({
                    status : 200
                }) 
            },4000);
        })
    })
})
})

router.post('/generateInstrucionalLetter',middlewares.getUserInfo,function(req,res){
    var application_id = req.body.app_id;
    var reference_no;
    var prefix = '';
    var subject = '';
    var subject1 = '';
    models.Application.findOne({
        where :{
            id : application_id
        }
    }).then(function(application){
        models.User.find({
            where :{
                id : application.user_id
            }
        }).then(function(user){
            if(user.gender == 'Female'){
                prefix = 'Ms. ';
                subject = 'She';
                subject1 = 'her';
            }else if(user.gender == 'Male'){
                prefix = 'Mr. ';
                subject = 'He';
                subject1 = 'his';
            }
            models.userMarkList.find({
                where :{
                    user_id : application.user_id
                }
            }).then(function(userMarkList){
                if(userMarkList.college_stream_type == false){
                    models.College.find({
                        where :{
                            id : userMarkList.collegeId
                        }
                    }).then(function(college){
                        models.InstructionalDetails.find({
                            where : {
                                userId : application.user_id
                            }
                        }).then(function(instructionalDetails){
                            var studentName = prefix + instructionalDetails.studentName;
                            var collegeName ;
                            if(college.type == 'college'){
                                collegeName = instructionalDetails.collegeName + " which is affiliated to ";
                            }else if(college.type == 'department'){
                                collegeName = instructionalDetails.collegeName + ", ";
                            }
                            var courseName = instructionalDetails.courseName;
                            var specialization = instructionalDetails.specialization;
                            var passingMonthYear = instructionalDetails.yearofpassing;
                            var duration = converter.toWords(instructionalDetails.duration);
                            var passingClass = instructionalDetails.division;
                            var instruction_medium;
                            if(instructionalDetails.instruction_medium == null || instructionalDetails.instruction_medium == undefined || instructionalDetails.instruction_medium == ''){
                                instruction_medium = "English";
                            }else{
                                instruction_medium = instructionalDetails.instruction_medium;
                            }
                            if(instructionalDetails.reference_no == null || instructionalDetails.reference_no == '' || instructionalDetails.reference_no == undefined){
                                models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
                                    if(MaxReferenceNo[0].maxNumber == null){
                                        reference_no = 1001;
                                    }else{
                                        reference_no = MaxReferenceNo[0].maxNumber + 1;
                                    }
                                    instructionalDetails.update({
                                        reference_no : reference_no
                                    }).then(function(updatedDetails){
                                        var ref_no = updatedDetails.reference_no;
                                        self_pdf.instrucationalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
                                        passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,function(err){
                                            if(err) {
                                                res.json({ 
                                                    status: 400
                                                })
                                            }else{
                                                res.json({
                                                    status : 200
                                                })
                                            }
                                        })
                                    })
                                })
                            }else{
                                var ref_no = instructionalDetails.reference_no;
                                self_pdf.instrucationalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
                                passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,function(err){
                                    if(err) {
                                        res.json({ 
                                            status: 400
                                        })
                                    }else{
                                        res.json({
                                            status : 200
                                        })
                                    }
                                })
                            }
                        })
                    })
                }else if(userMarkList.college_stream_type == true){
                    models.InstructionalDetails.findAll({
                        where :{
                            userId : application.user_id
                        }
                    }).then(function(instructionalDetails){
                        var studentName = prefix + instructionalDetails[0].studentName;
                        var courseName = instructionalDetails[0].courseName;
                        var specialization = instructionalDetails[0].specialization;
                        var passingMonthYear = instructionalDetails[0].yearofpassing;
                        var duration = converter.toWords(instructionalDetails[0].duration);
                        var passingClass = instructionalDetails[0].division;
                        var instruction_medium;
                        if(instructionalDetails[0].instruction_medium == null || instructionalDetails[0].instruction_medium == undefined || instructionalDetails[0].instruction_medium == ''){
                            instruction_medium = "English";
                        }else{
                            instruction_medium = instructionalDetails[0].instruction_medium;
                        }
                        var collegeData = [];
                        instructionalDetails.forEach(singleDetail=>{
                            models.College.find({
                                where : {
                                    name : {
                                        [Op.like] : '%' + singleDetail.collegeName + '%'
                                    } 
                                }
                            }).then(function(college){
                                
                                if(college){
                                    if(college.type == 'college'){
                                    collegeData.push(singleDetail.academicYear + ' from ' + singleDetail.collegeName + " which is affiliated to Mumbai University.")
                                    }else if(college.type == 'department'){
                                        collegeData.push(singleDetail.academicYear + ' from ' + singleDetail.collegeName + ", Mumbai University.")
                                    }
                                } else{
                                    models.UserMarklist_Upload.find({
                                        where :{
                                            name : singleDetail.academicYear,
                                            user_id : application.user_id
                                        }
                                    }).then(function(marklistupload){
                                        models.userMarkList.find({
                                            where :{
                                                id : marklistupload.user_marklist_id
                                            }
                                        }).then(function(userMarklist){
                                             models.College.find({
                                                where : {
                                                    id : userMarklist.collegeId
                                                }
                                            }).then(function(clg){
                                                if(clg.type == 'college'){
                                                    collegeData.push(singleDetail.academicYear + ' from ' + singleDetail.collegeName + " which is affiliated to Mumbai University.")
                                                }else if(clg.type == 'department'){
                                                    collegeData.push(singleDetail.academicYear + ' from ' + singleDetail.collegeName + ", Mumbai University.")
                                                }
                                            })
                                        })
                                    })
                                }
                            })
                        })
                        setTimeout(function(){
                            if(instructionalDetails[0].reference_no == null || instructionalDetails[0].reference_no == '' || instructionalDetails[0].reference_no == undefined){
                                models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
                                    if(MaxReferenceNo[0].maxNumber == null){
                                        reference_no = 1001;
                                    }else{
                                        reference_no = MaxReferenceNo[0].maxNumber + 1;
                                    }
                                    models.InstructionalDetails.updateReferenceNumber(application.user_id,reference_no).then(function(updatedDetails){
                                        var ref_no = updatedDetails.reference_no;
                                        self_pdf.instrucationalLetterForDiffClg(application.user_id,application_id,studentName,collegeData,courseName,specialization,
                                        passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,function(err){
                                            if(err) {
                                                res.json({ 
                                                    status: 400
                                                })
                                            }else{
                                                res.json({
                                                    status : 200
                                                })
                                            }
                                        })
                                    })
                                });
                            }else{
                                var ref_no = instructionalDetails[0].reference_no;
                                self_pdf.instrucationalLetterForDiffClg(application.user_id,application_id,studentName,collegeData,courseName,specialization,
                                passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,function(err){
                                    if(err) {
                                        res.json({ 
                                            status: 400
                                        })
                                    }else{
                                        res.json({
                                            status : 200
                                        })
                                    }
                                })
                            }
                        },2000);
                    })
                }
            })
        })
    })
})
router.post('/editHrdDetails',middlewares.getUserInfo,function(req,res){
        var userId = req.body.userId;
        var data = req.body.value
        if(data.degreeCtrl == 'phd'){
            models.Hrd_details.update({
                fullName : data.fullnameCtrl,
                course_name :  data.course_nameCtrl,
                seat_no : data.seat_noCtrl,
                seat_no_sem6 : data.seat_no_sem5Ctrl ? data.seat_no_sem5Ctrl  : '' ,
                seat_no_sem5 : data.seat_no_sem6Ctrl ?  data.seat_no_sem6Ctrl : '',
                prn_no: data.prn_noCtrl,
                cgpa :data.cgpaCtrl,
                cgpi :data.cgpiCtrl,
                transcript_no :data.transcript_noCtrl,
                transcript_date :data.transcript_dateCtrl,
                exam_date : data.exam_dateCtrl,
                specialization :data.specializationCtrl,            
            }, {
                where: {
                    user_id: userId,
                    degree : 'phd'
                }
            }).then(function (data) {
                // console.log("data" + data);
                // console.log("edudetails-->"+JSON.stringify (edu_details));
                        res.json({
                            status : 200,
                            data : data
                        })
            })
        }
        else if(data.degreeCtrl == 'bachelor'){
            models.Hrd_details.update({
                fullName : data.fullnameCtrl,
                course_name :  data.course_nameCtrl,
                seat_no : data.seat_noCtrl,
                seat_no_sem6 : data.seat_no_sem5Ctrl ? data.seat_no_sem5Ctrl  : '' ,
                seat_no_sem5 : data.seat_no_sem6Ctrl ?  data.seat_no_sem6Ctrl : '',
                prn_no: data.prn_noCtrl,
                cgpa :data.cgpaCtrl,
                cgpi :data.cgpiCtrl,
                transcript_no :data.transcript_noCtrl,
                transcript_date :data.transcript_dateCtrl,
                exam_date : data.exam_dateCtrl,
                specialization :data.specializationCtrl,            
            }, {
                where: {
                    user_id: userId,
                    degree : 'bachelor'
                }
            }).then(function (data) {
                // console.log("data" + data);
                // console.log("edudetails-->"+JSON.stringify (edu_details));
                        res.json({
                            status : 200,
                            data : data
                        })
            })
        }
        else if(data.degreeCtrl == 'master'){
            models.Hrd_details.update({
                fullName : data.fullnameCtrl,
                course_name :  data.course_nameCtrl,
                seat_no : data.seat_noCtrl,
                seat_no_sem6 : data.seat_no_sem5Ctrl ? data.seat_no_sem5Ctrl  : '' ,
                seat_no_sem5 : data.seat_no_sem6Ctrl ?  data.seat_no_sem6Ctrl : '',
                prn_no: data.prn_noCtrl,
                cgpa :data.cgpaCtrl,
                cgpi :data.cgpiCtrl,
                transcript_no :data.transcript_noCtrl,
                transcript_date :data.transcript_dateCtrl,
                exam_date : data.exam_dateCtrl,
                specialization :data.specializationCtrl,            
            }, {
                where: {
                    user_id: userId,
                    degree : 'master'
                }
            }).then(function (data) {
                // console.log("data" + data);
                // console.log("edudetails-->"+JSON.stringify (edu_details));
                        res.json({
                            status : 200,
                            data : data
                        })
            })
        }
})



router.post('/editAffiliationandInstructionalDetails',middlewares.getUserInfo,function(req,res){
    console.log("editAffiliationandInstructionalDetails");
    var userId = req.body.userId;
    var data = req.body.value
    var form  = req.body.form;
            if(form == 'instructional'){
                        if(data.InstructionalCourseCtrl.includes('Bachelors')){
                                    models.InstructionalDetails.update({
                                            courseName  : data.InstructionalCourseCtrl,
                                            collegeName : data.InstructionalCollegeCtrl,
                                            specialization :  data.InstructionalSpecializationCtrl,
                                            yearofpassing :  data.InstructionalyearCtrl,
                                            duration  : data.InstructionaldurationCtrl,
                                            division :  data.InstructionaldivisionCtrl

                            }, {
                                where: {
                                    userId: userId,
                                    education : {
                                        [Op.like] : '%Bachelors_%'
                                    }
                                }
                            }).then(function (data) {
                                console.log("data" +  data);
                                        res.json({
                                            status : 200,
                                            data : data
                                        })
                            })
                        }
                        if(data.InstructionalCourseCtrl.includes('Masters')) {
                            models.InstructionalDetails.update({
                                    courseName  : data.InstructionalCourseCtrl,
                                    collegeName : data.InstructionalCollegeCtrl,
                                    specialization :  data.InstructionalSpecializationCtrl,
                                    yearofpassing :  data.InstructionalyearCtrl,
                                    duration  : data.InstructionaldurationCtrl,
                                    division :  data.InstructionaldivisionCtrl

                        }, {
                        where: {
                            userId: userId,
                            education : {
                                [Op.like] : '%Masters_%'
                            }
                        }
                        }).then(function (data) {
                                res.json({
                                    status : 200,
                                    data : data
                                })
                        })
                        }
                        if(data.InstructionalCourseCtrl.includes('Phd')) {
                            models.InstructionalDetails.update({
                                    courseName  : data.InstructionalCourseCtrl,
                                    collegeName : data.InstructionalCollegeCtrl,
                                    specialization :  data.InstructionalSpecializationCtrl,
                                    yearofpassing :  data.InstructionalyearCtrl,
                                    duration  : data.InstructionaldurationCtrl,
                                    division :  data.InstructionaldivisionCtrl

                        }, {
                        where: {
                            userID: userId,
                            education : {
                                [Op.like] : '%Phd_%'
                            }
                        }
                        }).then(function (data) {
                                res.json({
                                    status : 200,
                                    data : data
                                })
                        })
                        }

            }else if(form == 'affiliation'){
                    if(data.CourseCtrl.includes('Bachelors')){
                                models.Affiliation_Letter.update({
                                        courseName  : data.CourseCtrl,
                                        collegeName : data.CollegeCtrl,
                                        specialization :  data.SpecializationCtrl,
                                        yearofpassing :  data.yearCtrl,
                                        duration  : data.durationCtrl,
                                        division :  data.divisionCtrl

                        }, {
                            where: {
                                user_id: userId,
                                education : {
                                    [Op.like] : '%Bachelors_%'
                                }
                            }
                        }).then(function (data) {
                            console.log("data" +  data);
                                    res.json({
                                        status : 200,
                                        data : data
                                    })
                        })
                    }
                    if(data.CourseCtrl.includes('Masters')) {
                        models.Affiliation_Letter.update({
                                courseName  : data.CourseCtrl,
                                collegeName : data.CollegeCtrl,
                                specialization :  data.SpecializationCtrl,
                                yearofpassing :  data.yearCtrl,
                                duration  : data.durationCtrl,
                                division :  data.divisionCtrl

                    }, {
                    where: {
                        user_id: userId,
                        education : {
                            [Op.like] : '%Masters_%'
                        }
                    }
                    }).then(function (data) {
                            res.json({
                                status : 200,
                                data : data
                            })
                    })
                    }
                    if(data.CourseCtrl.includes('Phd')) {
                        models.Affiliation_Letter.update({
                                courseName  : data.CourseCtrl,
                                collegeName : data.CollegeCtrl,
                                specialization :  data.SpecializationCtrl,
                                yearofpassing :  data.yearCtrl,
                                duration  : data.durationCtrl,
                                division :  data.divisionCtrl

                    }, {
                    where: {
                        user_id: userId,
                        education : {
                            [Op.like] : '%Phd_%'
                        }
                    }
                    }).then(function (data) {
                            res.json({
                                status : 200,
                                data : data
                            })
                    })
                    }
            }

})

router.post('/editLetterForNameChange',middlewares.getUserInfo,function(req,res){
    console.log("editLetterForNameChange");
    var userId = req.body.userId;
    var data = req.body.value

                                        models.Letterfor_NameChange.update({
                                            firstnameaspermarksheet  : data.firstnameaspermarksheetCtrl,
                                            fathersnameaspermarksheet : data.fathersnameaspermarksheetCtrl,
                                            mothersnameaspermarksheet :  data.mothersnameaspermarksheetCtrl,
                                            lastnameaspermarksheet :  data.lastnameaspermarksheetCtrl,
                                            firstnameasperpassport  : data.firstnameasperpassportCtrl,
                                            fathersnameasperpassport :  data.fathersnameasperpassportCtrl,
                                            lastnameasperpassport :  data.lastnameasperpassportCtrl,
                                            reference_no :  data.reference_noCtrl,
                                }, {
                                    where: {
                                        user_id: userId
                                    }
                                }).then(function (data) {
                                    console.log("data" +  data);
                                            res.json({
                                                status : 200,
                                                data : data
                                            })
                                })
                       

            

})

router.post('/generateHrdLetter',middlewares.getUserInfo,function(req,res){
    console.log("/generateHrdLetter");
    var userId =56295
    models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
        if(MaxReferenceNo[0].maxNumber == null){
            reference_no = 1001;
        }else{
            reference_no = MaxReferenceNo[0].maxNumber + 1;
        }
        instructionalDetails.update({
            reference_no : reference_no
        }).then(function(updatedDetails){
            var ref_no = updatedDetails.reference_no;
            self_pdf.hrdLetter(userId,function(err){
                if(err) {
                    res.json({ 
                        status: 400
                    })
                }else{
                    res.json({
                        status : 200
                    })
                }
            })
        })
    })

})
router.get('/generateInstrucionalLetter1',function(req,res){
    console.log('/generateInstrucionalLetter1');
    var application_id = req.query.app_id;
    var collegeData = [];
    var reference_no;
    var prefix = '';
    var subject = '';
    var subject1 = '';
    models.Application.findOne({
        where :{
            id : application_id
        }
    }).then(function(application){
     models.User.find({
            where :{
                id : application.user_id
            }
        }).then(function(user){
            if(user.gender == 'Female'){
                prefix = 'Ms. ';
                subject = 'She';
                subject1 = 'her';
            }else if(user.gender == 'Male'){
                prefix = 'Mr. ';
                subject = 'He';
                subject1 = 'his';
            }

            models.Applied_For_Details.find({
                where :{
                    user_id : application.user_id,
                    app_id : application_id
                }
            }).then(function(appliedDetails){
                if(appliedDetails.applying_for == 'Masters,Bachelors'){
                    models.userMarkList.findAll({
                        where :{
                            type : "Masters",
                            user_id : application.user_id
                        }
                    }).then(function(master_Details){
                        var masterDetails = [];
                        if(master_Details){
                            master_Details.forEach(master =>{
                                if(master.app_id != null){
                                    var app_idArr = master.app_id.split(",");
                                    app_idArr.forEach(app_id =>{
                                        if(app_id == application_id){
                                            masterDetails.push(master);
                                        }
                                    })
                                }
                            })
                            if(masterDetails){
                                var facultyData = [];
                                masterDetails.forEach(master =>{
                                    var flag = false;
                                    var college = [];
                                    if(facultyData.length > 0){
                                        facultyData.forEach(data=>{
                                            if(data.faculty == master.faculty){
                                                flag = true;
                                                var count = 0;
                                                data.colleges.forEach(clg=>{
                                                    if(clg.collegeId == master.collegeId){
                                                        count ++;
                                                    }
                                                })
                                                if(count < data.colleges.length){
                                                    if(master.patteren == 'Annual'){
                                                        data.colleges.push({
                                                            name : master.name,
                                                            collegeId : master.collegeId
                                                        })
                                                    }else if(master.patteren == 'Semester'){
                                                        switch(master.name){
                                                            case 'Semester 2' : 
                                                                data.colleges.push({
                                                                    name : 'First Year',
                                                                    collegeId : master.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 4' :
                                                                data.colleges.push({
                                                                    name : 'Second Year',
                                                                    collegeId : master.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 6' :
                                                                data.colleges.push({
                                                                    name : 'Third Year',
                                                                    collegeId : master.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 8' :
                                                                data.colleges.push({
                                                                    name : 'Fourth Year',
                                                                    collegeId : master.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 10' :
                                                                data.colleges.push({
                                                                    name : 'Fifth Year',
                                                                    collegeId : master.collegeId
                                                                })
                                                                break;
                                                            default :
                                                                colleges.push({
                                                                name : '',
                                                                collegeId : master.collegeId
                                                            })
                                                        }
                                                    }
                                                }
                                            }
                                        })
                                        if(flag == false){
                                            var colleges = [];
                                            if(master.patteren == 'Annual'){
                                                colleges.push({
                                                    name : master.name,
                                                    collegeId : master.collegeId
                                                })
                                            }else if(master.patteren == 'Semester'){
                                                switch(master.name){
                                                    case 'Semester 2' : 
                                                        colleges.push({
                                                            name : 'First Year',
                                                            collegeId : master.collegeId
                                                        })
                                                        break;
                                                    case 'Semester 4' :
                                                        colleges.push({
                                                            name : 'Second Year',
                                                            collegeId : master.collegeId
                                                        })
                                                        break;
                                                    case 'Semester 6' :
                                                        colleges.push({
                                                            name : 'Third Year',
                                                            collegeId : master.collegeId
                                                        })
                                                        break;
                                                    case 'Semester 8' :
                                                       colleges.push({
                                                            name : 'Fourth Year',
                                                            collegeId : master.collegeId
                                                        })
                                                        break;
                                                    case 'Semester 10' :
                                                        colleges.push({
                                                            name : 'Fifth Year',
                                                            collegeId : master.collegeId
                                                        })
                                                        break;
                                                    default :
                                                        colleges.push({
                                                            name : '',
                                                            collegeId : master.collegeId
                                                        })

                                                }
                                            }
                                            
                                            facultyData.push({
                                                type:master.type,
                                                faculty : master.faculty,
                                                colleges : colleges
                                            })
                                        }
                                    }else{
                                       var colleges = [];
                                            if(master.patteren == 'Annual'){
                                                colleges.push({
                                                    name : master.name,
                                                    collegeId : master.collegeId
                                                })
                                            }else if(master.patteren == 'Semester'){
                                                switch(master.name){
                                                    case 'Semester 2' : 
                                                        colleges.push({
                                                            name : 'First Year',
                                                            collegeId : master.collegeId
                                                        })
                                                        break;
                                                    case 'Semester 4' :
                                                        colleges.push({
                                                            name : 'Second Year',
                                                            collegeId : master.collegeId
                                                        })
                                                        break;
                                                    case 'Semester 6' :
                                                        colleges.push({
                                                            name : 'Third Year',
                                                            collegeId : master.collegeId
                                                        })
                                                        break;
                                                    case 'Semester 8' :
                                                       colleges.push({
                                                            name : 'Fourth Year',
                                                            collegeId : master.collegeId
                                                        })
                                                        break;
                                                    case 'Semester 10' :
                                                        colleges.push({
                                                            name : 'Fifth Year',
                                                            collegeId : master.collegeId
                                                        })
                                                        break;
                                                    default :
                                                        colleges.push({
                                                            name : '',
                                                            collegeId : master.collegeId
                                                        })
                                                }
                                            }
                                        facultyData.push({
                                            type:master.type,
                                            faculty : master.faculty,
                                            colleges : colleges
                                        })
                                    }
                                })
                                facultyData.forEach(faculty=>{
                                    models.InstructionalDetails.findAll({
                                        where :{
                                            userId : application.user_id,
                                            education : faculty.type + '_' + faculty.faculty
                                        }
                                    }).then(function(instructionalDetails){
                                        
                                        var instructional_Details = [];
                                        instructionalDetails.forEach(instruction =>{
                                            if(instruction.app_id != null){
                                                var app_idArr = instruction.app_id.split(",");
                                                app_idArr.forEach(app_id =>{
                                                    if(app_id == application_id){
                                                        instructional_Details.push(instruction);
                                                        
                                                    }
                                                })
                                            }
                                        })
                                        setTimeout(()=>{
                                            
                                            if(instructional_Details.length > 1){
                                                instruction_letter_length = instruction_letter_length  + 1;
                                                var studentName = prefix + instructional_Details[0].studentName;
                                                var courseName = instructional_Details[0].courseName;
                                                var specialization = instructional_Details[0].specialization;
                                                var passingMonthYear = instructional_Details[0].yearofpassing;
                                                var duration = converter.toWords(instructional_Details[0].duration);
                                                var passingClass = instructional_Details[0].division;
                                                var instruction_medium;
                                                if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
                                                    instruction_medium = "English";
                                                }else{
                                                    instruction_medium = instructionalDetails[0].instruction_medium;
                                                }
                                                var education = instructional_Details[0].education;
                                                
                                                var instructionId = '';
                                                
                                                    
                                                    instructional_Details.forEach(instruction =>{
                                                        faculty.colleges.forEach(singleDetail=>{
                                                            models.College.find({
                                                                where : {
                                                                    id : singleDetail.collegeId
                                                                }
                                                            }).then(function(college){
                                                                if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
                                                                    if(college.type == 'college'){
                                                                        collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
                                                                    }else if(college.type == 'department'){
                                                                        collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
                                                                    }
                                                                }
                                                            })
                                                        })
                                                        instructionId += instruction.id +','
                                                    })

                                                setTimeout(()=>{
                                                    var instructionIds = instructionId.split(',');
                                                    instructionIds.pop();
                                                    instructionId = instructionIds.join(',');
                                                   setTimeout(function(){
                                                        if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
                                                            models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
                                                                if(MaxReferenceNo[0].maxNumber == null){
                                                                    reference_no = 1001;
                                                                }else{
                                                                    reference_no = MaxReferenceNo[0].maxNumber + 1;
                                                                }

                                                                models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
                                                                    var ref_no = updatedDetails.reference_no;
                                                                    self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
                                                                    passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                                        if(err) {
                                                                             res.json({ 
                                                                                status: 400
                                                                            })
                                                                        }else{
                                                                        }
                                                                    })
                                                                })
                                                            });
                                                        }else{
                                                            var ref_no = instructionalDetails[0].reference_no;
                                                            self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
                                                            passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                                if(err) {
                                                                    res.json({ 
                                                                        status: 400
                                                                    })
                                                                }else{
                                                                }
                                                            })
                                                        }
                                                    },3000); 
                                                },4000);   
                                            }else if(instructional_Details.length == 1){
                                                instruction_letter_length = instruction_letter_length  + 1;
                                                if(faculty.colleges.length == 1){
                                                    models.College.find ({
                                                        where :{
                                                            id : faculty.colleges[0].collegeId
                                                        }
                                                    }).then(function(college){
                                                        var studentName = prefix + instructional_Details[0].studentName;
                                                        var collegeName ;
                                                        if(college.type == 'college'){
                                                            collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
                                                        }else if(college.type == 'department'){
                                                            collegeName = instructional_Details[0].collegeName + ", ";
                                                        }
                                                        var courseName = instructional_Details[0].courseName;
                                                        var specialization = instructional_Details[0].specialization;
                                                        var passingMonthYear = instructional_Details[0].yearofpassing;
                                                        var duration = converter.toWords(instructional_Details[0].duration);
                                                        var passingClass = instructional_Details[0].division;
                                                        var instruction_medium;

                                                        if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
                                                            instruction_medium = "English";
                                                        }else{
                                                            instruction_medium = instructional_Details[0].instruction_medium;
                                                        }
                                                        var education = instructional_Details[0].education;
                                                        setTimeout(()=>{
                                                            if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
                                                               models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
                                                                    if(MaxReferenceNo[0].maxNumber == null){
                                                                        reference_no = 1001;
                                                                    }else{
                                                                        reference_no = MaxReferenceNo[0].maxNumber + 1;
                                                                    }
                                                                    models.InstructionalDetails.update(
                                                                        {
                                                                            reference_no : reference_no
                                                                        },{
                                                                        where :{
                                                                            id : instructional_Details[0].id
                                                                        }
                                                                    }).then(function(updatedDetails){
                                                                        var ref_no = updatedDetails.reference_no;
                                                                        self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
                                                                        passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                                            if(err) {
                                                                                res.json({ 
                                                                                    status: 400
                                                                                })
                                                                            }else{
                                                                                
                                                                            }
                                                                        })
                                                                    })
                                                                })
                                                            }else{
                                                                var ref_no = instructionalDetails[0].reference_no;
                                                                self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
                                                                passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                                    if(err) {
                                                                        res.json({ 
                                                                            status: 400
                                                                        })
                                                                    }else{
                                                                       
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    })
                                                }
                                            }
                                        },1500)
                                    })
                                })
                            }
                            setTimeout(()=>{
                                models.userMarkList.findAll({
                                    where :{
                                        type : "Bachelors",
                                        user_id : application.user_id
                                    }
                                }).then(function(bachelor_Details){
                                   var facultyData = [];
                                    var bachelorDetails = [];
                                    bachelor_Details.forEach(bachelor =>{
                                        if(bachelor.app_id != null){
                                            var app_idArr = bachelor.app_id.split(",");
                                            app_idArr.forEach(app_id =>{
                                                if(app_id == application_id){
                                                    bachelorDetails.push(bachelor);
                                                }
                                            })
                                        }
                                    })
                                    if(bachelorDetails){
                                        bachelorDetails.forEach(bachelor =>{
                                            var flag = false;
                                            var college = [];
                                            if(facultyData.length > 0){
                                                facultyData.forEach(data=>{
                                                    if(data.faculty == bachelor.faculty){
                                                        flag = true;
                                                        var count = 0;
                                                        data.colleges.forEach(clg=>{
                                                            if(clg.collegeId == bachelor.collegeId){
                                                                count ++;
                                                            }
                                                        })
                                                        if(count < data.colleges.length){
                                                            if(bachelor.patteren == 'Annual'){
                                                                data.colleges.push({
                                                                    name : bachelor.name,
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                            }else if(bachelor.patteren == 'Semester'){
                                                                switch(bachelor.name){
                                                                    case 'Semester 2' : 
                                                                        data.colleges.push({
                                                                            name : 'First Year',
                                                                            collegeId : bachelor.collegeId
                                                                        })
                                                                        break;
                                                                    case 'Semester 4' :
                                                                        data.colleges.push({
                                                                            name : 'Second Year',
                                                                            collegeId : bachelor.collegeId
                                                                        })
                                                                        break;
                                                                    case 'Semester 6' :
                                                                        data.colleges.push({
                                                                            name : 'Third Year',
                                                                            collegeId : bachelor.collegeId
                                                                        })
                                                                        break;
                                                                    case 'Semester 8' :
                                                                        data.colleges.push({
                                                                            name : 'Fourth Year',
                                                                            collegeId : bachelor.collegeId
                                                                        })
                                                                        break;
                                                                    case 'Semester 10' :
                                                                        data.colleges.push({
                                                                            name : 'Fifth Year',
                                                                            collegeId : bachelor.collegeId
                                                                        })
                                                                        break;
                                                                    default :
                                                                        colleges.push({
                                                                            name : '',
                                                                            collegeId : bachelor.collegeId
                                                                        })
                                                                }
                                                            }
                                                        }
                                                    }
                                                })
                                                if(flag == false){
                                                    var colleges = [];
                                                    if(bachelor.patteren == 'Annual'){
                                                        colleges.push({
                                                            name : bachelor.name,
                                                            collegeId : bachelor.collegeId
                                                        })
                                                    }else if(bachelor.patteren == 'Semester'){
                                                        switch(bachelor.name){
                                                            case 'Semester 2' : 
                                                                colleges.push({
                                                                    name : 'First Year',
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 4' :
                                                                colleges.push({
                                                                    name : 'Second Year',
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 6' :
                                                                colleges.push({
                                                                    name : 'Third Year',
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 8' :
                                                               colleges.push({
                                                                    name : 'Fourth Year',
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 10' :
                                                                colleges.push({
                                                                    name : 'Fifth Year',
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                                break;
                                                            default :
                                                                colleges.push({
                                                                    name : '',
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                        }
                                                    }
                                                    
                                                    facultyData.push({
                                                        type:bachelor.type,
                                                        faculty : bachelor.faculty,
                                                        colleges : colleges
                                                    })
                                                }
                                            }else{
                                               var colleges = [];
                                                    if(bachelor.patteren == 'Annual'){
                                                        colleges.push({
                                                            name : bachelor.name,
                                                            collegeId : bachelor.collegeId
                                                        })
                                                    }else if(bachelor.patteren == 'Semester'){
                                                        switch(bachelor.name){
                                                            case 'Semester 2' : 
                                                                colleges.push({
                                                                    name : 'First Year',
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 4' :
                                                                colleges.push({
                                                                    name : 'Second Year',
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 6' :
                                                                colleges.push({
                                                                    name : 'Third Year',
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 8' :
                                                               colleges.push({
                                                                    name : 'Fourth Year',
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                                break;
                                                            case 'Semester 10' :
                                                                colleges.push({
                                                                    name : 'Fifth Year',
                                                                    collegeId : bachelor.collegeId
                                                                })
                                                                break;
                                                            default :
                                                                colleges.push({
                                                                    name : '',
                                                                    collegeId : bachelor.collegeId
                                                                })  
                                                        }
                                                    }
                                                facultyData.push({
                                                    type:bachelor.type,
                                                    faculty : bachelor.faculty,
                                                    colleges : colleges
                                                })
                                            }
                                        })
                                        facultyData.forEach(faculty=>{
                                            models.InstructionalDetails.findAll({
                                                where :{
                                                    userId : application.user_id,
                                                    education : faculty.type + '_' + faculty.faculty
                                                }
                                            }).then(function(instructionalDetails){
                                                var instructional_Details = [];
                                                instructionalDetails.forEach(instruction =>{
                                                    if(instruction.app_id != null){
                                                        var app_idArr = instruction.app_id.split(",");
                                                        app_idArr.forEach(app_id =>{
                                                            if(app_id == application_id){
                                                                instructional_Details.push(instruction);
                                                            }
                                                        })
                                                    }
                                                })
                                                
                                                if(instructional_Details.length > 1){
                                                    instruction_letter_length = instruction_letter_length  + 1;
                                                    var studentName = prefix + instructional_Details[0].studentName;
                                                    var courseName = instructional_Details[0].courseName;
                                                    var specialization = instructional_Details[0].specialization;
                                                    var passingMonthYear = instructional_Details[0].yearofpassing;
                                                    var duration = converter.toWords(instructional_Details[0].duration);
                                                    var passingClass = instructional_Details[0].division;
                                                    var instruction_medium;
                                                    if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
                                                        instruction_medium = "English";
                                                    }else{
                                                        instruction_medium = instructionalDetails[0].instruction_medium;
                                                    }
                                                    var education = instructional_Details[0].education;
                                                    
                                                    var instructionId = '';
                                                    
                                                        
                                                        instructional_Details.forEach(instruction =>{
                                                            faculty.colleges.forEach(singleDetail=>{
                                                                models.College.find({
                                                                    where : {
                                                                        id : singleDetail.collegeId
                                                                    }
                                                                }).then(function(college){
                                                                    if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
                                                                        if(college.type == 'college'){
                                                                            collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
                                                                        }else if(college.type == 'department'){
                                                                            collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
                                                                        }
                                                                    }
                                                                })
                                                            })
                                                            instructionId += instruction.id +','
                                                        })

                                                    setTimeout(()=>{
                                                        var instructionIds = instructionId.split(',');
                                                        instructionIds.pop();
                                                        instructionId = instructionIds.join(',');
                                                        setTimeout(function(){
                                                            if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
                                                                models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
                                                                    if(MaxReferenceNo[0].maxNumber == null){
                                                                        reference_no = 1001;
                                                                    }else{
                                                                        reference_no = MaxReferenceNo[0].maxNumber + 1;
                                                                    }

                                                                    models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
                                                                       var ref_no = updatedDetails.reference_no;
                                                                        self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
                                                                        passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                                            if(err) {
                                                                                res.json({ 
                                                                                    status: 400
                                                                                })
                                                                            }else{
                                                                            }
                                                                        })
                                                                    })
                                                                });
                                                            }else{
                                                                 var ref_no = instructionalDetails[0].reference_no;
                                                                self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
                                                                passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                                    if(err) {
                                                                       res.json({ 
                                                                            status: 400
                                                                        })
                                                                    }else{
                                                                    }
                                                                })
                                                            }
                                                        },3000); 
                                                    },4000);   
                                                }else if(instructional_Details.length == 1){
                                                    instruction_letter_length = instruction_letter_length  + 1;
                                                    if(faculty.colleges.length == 1){
                                                        models.College.find ({
                                                            where :{
                                                                id : faculty.colleges[0].collegeId
                                                            }
                                                        }).then(function(college){
                                                            var studentName = prefix + instructional_Details[0].studentName;
                                                            var collegeName ;
                                                            if(college.type == 'college'){
                                                                collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
                                                            }else if(college.type == 'department'){
                                                                collegeName = instructional_Details[0].collegeName + ", ";
                                                            }
                                                            var courseName = instructional_Details[0].courseName;
                                                            var specialization = instructional_Details[0].specialization;
                                                            var passingMonthYear = instructional_Details[0].yearofpassing;
                                                            var duration = converter.toWords(instructional_Details[0].duration);
                                                            var passingClass = instructional_Details[0].division;
                                                            var instruction_medium;

                                                            if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
                                                                instruction_medium = "English";
                                                            }else{
                                                                instruction_medium = instructional_Details[0].instruction_medium;
                                                            }
                                                            var education = instructional_Details[0].education;
                                                            setTimeout(()=>{
                                                                if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
                                                                  models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
                                                                        if(MaxReferenceNo[0].maxNumber == null){
                                                                            reference_no = 1001;
                                                                        }else{
                                                                            reference_no = MaxReferenceNo[0].maxNumber + 1;
                                                                        }
                                                                        models.InstructionalDetails.update(
                                                                            {
                                                                                reference_no : reference_no
                                                                            },{
                                                                            where :{
                                                                                id : instructional_Details[0].id
                                                                            }
                                                                        }).then(function(updatedDetails){
                                                                            var ref_no = updatedDetails.reference_no;
                                                                            self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
                                                                            passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                                                if(err) {
                                                                                    res.json({ 
                                                                                        status: 400
                                                                                    })
                                                                                }else{
                                                                                    
                                                                                }
                                                                            })
                                                                        })
                                                                    })
                                                                }else{
                                                                    var ref_no = instructionalDetails[0].reference_no;
                                                                    self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
                                                                    passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                                        if(err) {
                                                                            res.json({ 
                                                                                status: 400
                                                                            })
                                                                        }else{
                                                                            
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        })
                                                    }
                                                }
                                            })
                                        })
                                    }
                                })
                            },3000)
                        }
                    })
                }else if(appliedDetails.applying_for == 'Bachelors'){
                     var bachelorDetails = [];
                    models.userMarkList.findAll({
                        where :{
                            type : "Bachelors",
                            user_id : application.user_id
                        }
                    }).then(function(bachelor_Details){
                        bachelor_Details.forEach(bachelor =>{
                            if(bachelor.app_id != null){
                                var app_idArr = bachelor.app_id.split(",");
                                app_idArr.forEach(app_id =>{
                                    if(app_id == application_id){
                                        bachelorDetails.push(bachelor);
                                    }
                                })
                            }
                        })
                        if(bachelorDetails){
                            var facultyData = [];
                            bachelorDetails.forEach(bachelor =>{
                                var flag = false;
                                var college = [];
                                if(facultyData.length > 0){
                                    facultyData.forEach(data=>{
                                        if(data.faculty == bachelor.faculty){
                                            flag = true;
                                            var count = 0;
                                            data.colleges.forEach(clg=>{
                                                if(clg.collegeId == bachelor.collegeId){
                                                    count ++;
                                                }
                                            })
                                            if(count < data.colleges.length){
                                                if(bachelor.patteren == 'Annual'){
                                                    data.colleges.push({
                                                        name : bachelor.name,
                                                        collegeId : bachelor.collegeId
                                                    })
                                                }else if(bachelor.patteren == 'Semester'){
                                                    switch(bachelor.name){
                                                        case 'Semester 2' : 
                                                            data.colleges.push({
                                                                name : 'First Year',
                                                                collegeId : bachelor.collegeId
                                                            })
                                                            break;
                                                        case 'Semester 4' :
                                                            data.colleges.push({
                                                                name : 'Second Year',
                                                                collegeId : bachelor.collegeId
                                                            })
                                                            break;
                                                        case 'Semester 6' :
                                                            data.colleges.push({
                                                                name : 'Third Year',
                                                                collegeId : bachelor.collegeId
                                                            })
                                                            break;
                                                        case 'Semester 8' :
                                                            data.colleges.push({
                                                                name : 'Fourth Year',
                                                                collegeId : bachelor.collegeId
                                                            })
                                                            break;
                                                        case 'Semester 10' :
                                                            data.colleges.push({
                                                                name : 'Fifth Year',
                                                                collegeId : bachelor.collegeId
                                                            })
                                                            break;
                                                    }
                                                }
                                            }
                                        }
                                    })
                                    if(flag == false){
                                        var colleges = [];
                                        if(bachelor.patteren == 'Annual'){
                                            colleges.push({
                                                name : bachelor.name,
                                                collegeId : bachelor.collegeId
                                            })
                                        }else if(bachelor.patteren == 'Semester'){
                                            switch(bachelor.name){
                                                case 'Semester 2' : 
                                                    colleges.push({
                                                        name : 'First Year',
                                                        collegeId : bachelor.collegeId
                                                    })
                                                    break;
                                                case 'Semester 4' :
                                                    colleges.push({
                                                        name : 'Second Year',
                                                        collegeId : bachelor.collegeId
                                                    })
                                                    break;
                                                case 'Semester 6' :
                                                    colleges.push({
                                                        name : 'Third Year',
                                                        collegeId : bachelor.collegeId
                                                    })
                                                    break;
                                                case 'Semester 8' :
                                                   colleges.push({
                                                        name : 'Fourth Year',
                                                        collegeId : bachelor.collegeId
                                                    })
                                                    break;
                                                case 'Semester 10' :
                                                    colleges.push({
                                                        name : 'Fifth Year',
                                                        collegeId : bachelor.collegeId
                                                    })
                                                    break;
                                                default :
                                                    colleges.push({
                                                        name : '',
                                                        collegeId : bachelor.collegeId
                                                    })
                                            }
                                        }
                                        
                                        facultyData.push({
                                            type:bachelor.type,
                                            faculty : bachelor.faculty,
                                            colleges : colleges
                                        })
                                    }
                                }else{
                                   var colleges = [];
                                    if(bachelor.patteren == 'Annual'){
                                        colleges.push({
                                            name : bachelor.name,
                                            collegeId : bachelor.collegeId
                                        })
                                    }else if(bachelor.patteren == 'Semester'){
                                        switch(bachelor.name){
                                            case 'Semester 2' : 
                                                colleges.push({
                                                    name : 'First Year',
                                                    collegeId : bachelor.collegeId
                                                })
                                                break;
                                            case 'Semester 4' :
                                                colleges.push({
                                                    name : 'Second Year',
                                                    collegeId : bachelor.collegeId
                                                })
                                                break;
                                            case 'Semester 6' :
                                                colleges.push({
                                                    name : 'Third Year',
                                                    collegeId : bachelor.collegeId
                                                })
                                                break;
                                            case 'Semester 8' :
                                               colleges.push({
                                                    name : 'Fourth Year',
                                                    collegeId : bachelor.collegeId
                                                })
                                                break;
                                            case 'Semester 10' :
                                                colleges.push({
                                                    name : 'Fifth Year',
                                                    collegeId : bachelor.collegeId
                                                })
                                                break;
                                            default :
                                                colleges.push({
                                                    name : '',
                                                    collegeId : bachelor.collegeId
                                                })
                                        }
                                    }
                                    facultyData.push({
                                        type:bachelor.type,
                                        faculty : bachelor.faculty,
                                        colleges : colleges
                                    })
                                }
                            })
                           facultyData.forEach(faculty=>{
                                models.InstructionalDetails.findAll({
                                    where :{
                                        userId : application.user_id,
                                        education : faculty.type + '_' + faculty.faculty
                                    }
                                }).then(function(instructionalDetails){
                                     var instructional_Details = [];
                                    instructionalDetails.forEach(instruction =>{
                                        if(instruction.app_id != null){
                                            var app_idArr = instruction.app_id.split(",");
                                            app_idArr.forEach(app_id =>{
                                                if(app_id == application_id){
                                                    instructional_Details.push(instruction);
                                                }
                                            })
                                        }
                                    })
                                    if(instructional_Details.length > 1){
                                        instruction_letter_length = instruction_letter_length  + 1;
                                        var studentName = prefix + instructional_Details[0].studentName;
                                        var courseName = instructional_Details[0].courseName;
                                        var specialization = instructional_Details[0].specialization;
                                        var passingMonthYear = instructional_Details[0].yearofpassing;
                                        var duration = converter.toWords(instructional_Details[0].duration);
                                        var passingClass = instructional_Details[0].division;
                                        var instruction_medium;
                                        if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
                                            instruction_medium = "English";
                                        }else{
                                            instruction_medium = instructionalDetails[0].instruction_medium;
                                        }
                                        var education = instructional_Details[0].education;
                                        
                                        var instructionId = '';
                                        
                                            
                                            instructional_Details.forEach(instruction =>{
                                                 faculty.colleges.forEach(singleDetail=>{
                                                    models.College.find({
                                                        where : {
                                                            id : singleDetail.collegeId
                                                        }
                                                    }).then(function(college){
                                                        if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
                                                            if(college.type == 'college'){
                                                                collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
                                                            }else if(college.type == 'department'){
                                                                collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
                                                            }
                                                        }
                                                     })
                                                })
                                                instructionId += instruction.id +','
                                            })

                                        setTimeout(()=>{
                                           var instructionIds = instructionId.split(',');
                                            instructionIds.pop();
                                            instructionId = instructionIds.join(',');
                                            setTimeout(function(){
                                                if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
                                                    models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
                                                        if(MaxReferenceNo[0].maxNumber == null){
                                                            reference_no = 1001;
                                                        }else{
                                                            reference_no = MaxReferenceNo[0].maxNumber + 1;
                                                        }

                                                        models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
                                                            var ref_no = updatedDetails.reference_no;
                                                            self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
                                                            passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                                if(err) {
                                                                    res.json({ 
                                                                        status: 400
                                                                    })
                                                                }else{
                                                                }
                                                            })
                                                        })
                                                    });
                                                }else{
                                                     var ref_no = instructionalDetails[0].reference_no;
                                                    self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
                                                    passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                        if(err) {
                                                           res.json({ 
                                                                status: 400
                                                            })
                                                        }else{
                                                        }
                                                    })
                                                }
                                            },3000); 
                                        },4000);   
                                    }else if(instructional_Details.length == 1){
                                        instruction_letter_length = instruction_letter_length  + 1;
                                        if(faculty.colleges.length == 1){
                                            models.College.find ({
                                                where :{
                                                    id : faculty.colleges[0].collegeId
                                                }
                                            }).then(function(college){
                                                var studentName = prefix + instructional_Details[0].studentName;
                                                var collegeName ;
                                                if(college.type == 'college'){
                                                    collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
                                                }else if(college.type == 'department'){
                                                    collegeName = instructional_Details[0].collegeName + ", ";
                                                }
                                                var courseName = instructional_Details[0].courseName;
                                                var specialization = instructional_Details[0].specialization;
                                                var passingMonthYear = instructional_Details[0].yearofpassing;
                                                var duration = converter.toWords(instructional_Details[0].duration);
                                                var passingClass = instructional_Details[0].division;
                                                var instruction_medium;

                                                if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
                                                    instruction_medium = "English";
                                                }else{
                                                    instruction_medium = instructional_Details[0].instruction_medium;
                                                }
                                                var education = instructional_Details[0].education;
                                                setTimeout(()=>{
                                                    if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
                                                       models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
                                                            if(MaxReferenceNo[0].maxNumber == null){
                                                                reference_no = 1001;
                                                            }else{
                                                                reference_no = MaxReferenceNo[0].maxNumber + 1;
                                                            }
                                                            models.InstructionalDetails.update(
                                                                {
                                                                    reference_no : reference_no
                                                                },{
                                                                where :{
                                                                    id : instructional_Details[0].id
                                                                }
                                                            }).then(function(updatedDetails){
                                                                var ref_no = updatedDetails.reference_no;
                                                                self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
                                                                passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                                    if(err) {
                                                                        res.json({ 
                                                                            status: 400
                                                                        })
                                                                    }else{
                                                                        
                                                                    }
                                                                })
                                                            })
                                                        })
                                                    }else{
                                                        var ref_no = instructionalDetails[0].reference_no;
                                                        self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
                                                        passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,function(err){
                                                            if(err) {
                                                                res.json({ 
                                                                    status: 400
                                                                })
                                                            }else{
                                                                
                                                            }
                                                        })
                                                    }
                                                })
                                            })
                                        }
                                    }
                                })
                            })
                        }
                    })
                }
            })
        })
    })
})

router.get('/collegeEmailStatusUpdate',middlewares.getUserInfo,function(req,res){
    models.Applied_For_Details.find({
        where :{
            user_id : req.query.user_id
        }
    }).then(function(user){
        if(user.educationalDetails == true){
            models.User_Transcript.findAll({
                where:{
                    user_id : req.query.user_id,
                    collegeId : req.query.college_id
                }
            }).then(function(user_transcripts){
                user_transcripts.forEach(transcript=>{
                    if(transcript.emailMsgId){
                        var request = {};
                        request.method = 'GET';
                        request.url = '/v3/messages?limit=1&query='+ transcript.emailMsgId;
                        client.request(request).then(([response, body]) => {
                            var status = response.body.messages[0].status;
                            models.User_Transcript.updateEmailStatus(transcript.id,status);
                        })
                    }
                });
            })
        }
        if(user.instructionalField == true){
            models.InstructionalDetails.find({
                where:{
                    userId : req.query.user_id
                }
            }).then(function(instructional){
                if(instructional.emailMsgId){
                    var request = {};
                    request.method = 'GET';
                    request.url = '/v3/messages?limit=1&query='+ instructional.emailMsgId;
                    client.request(request).then(([response, body]) => {
                        var status = response.body.messages[0].status;
                        models.InstructionalDetails.updateEmailStatus(instructional.id,status);
                    }) 
                }
            })
        }
        if(user.affiliation == true){
            models.Affilation_Letter.find({
                where:{
                    userId : req.query.user_id
                }
            }).then(function(instructional){
                if(instructional.emailMsgId){
                    var request = {};
                    request.method = 'GET';
                    request.url = '/v3/messages?limit=1&query='+ instructional.emailMsgId;
                    client.request(request).then(([response, body]) => {
                        var status = response.body.messages[0].status;
                        models.Affilation_Letter.updateEmailStatus(instructional.id,status);
                    }) 
                }
            })
        }
        if(user.curriculum == true){
            models.User_Curriculum.findAll({
                where:{
                    user_id : req.query.user_id,
                    collegeId : req.query.college_id
                }
            }).then(function(user_curriculum){
                user_curriculum.forEach(curriculum=>{
                    if(curriculum.emailMsgId){
                        var request = {};
                        request.method = 'GET';
                        request.url = '/v3/messages?limit=1&query='+ curriculum.emailMsgId;
                        client.request(request).then(([response, body]) => {
                            var status = response.body.messages[0].status;
                            models.User_Curriculum.updateEmailStatus(curriculum.id,status);
                        }) 
                    }
                });
            })
        }

        setTimeout(()=>{
            res.json({
                status : 200
            })
        },5000);
    })
})

router.get('/collegeManagement/getCollegeData',middlewares.getUserInfo,function(req,res) {
    models.College.getColleges().then(function(colleges){
        res.json({
            status : 200,
            items : colleges
        })
    })
})

router.post('/collegeManagement/addOrUpdateCollegeData',middlewares.getUserInfo,function(req,res) {
   var collegeData = req.body.collegeData;
  if(collegeData.id == null){
    models.College.create({
        name: collegeData.name,
        emailId: collegeData.emailId,
        contactNo: collegeData.contactNo,
        contactPerson : collegeData.contactPerson,
        alternateContactPerson : collegeData.alternateContactPerson,
        alternateContactNo : collegeData.alternateContactNo,
        alternateEmailId : collegeData.alternateEmailId,
        type : (collegeData.type) ? collegeData.type : 'college' ,
        status  : 'active',
        created_at : moment(new Date()),
        updated_at : moment(new Date())
    }).then(function(createdCollege){
        if(createdCollege){
            res.json({
                status : 200
            })
        }else{
            res.json({
                status : 400
            })
        }
    });
  }else{
    models.College.findOne({
        where : {
            id : collegeData.id
        }
    }).then(function(college){
        college.update({
            name: collegeData.name,
            emailId: collegeData.emailId,
            contactNo: collegeData.contactNo,
            contactPerson : collegeData.contactPerson,
            alternateContactPerson : collegeData.alternateContactPerson,
            alternateContactNo : collegeData.alternateContactNo,
            alternateEmailId : collegeData.alternateEmailId,
            status  : 'active',
            updated_at : moment(new Date())
        }).then(function(createdCollege){
            if(createdCollege){
                res.json({
                    status : 200
                })
            }else{
                res.json({
                    status : 400
                })
            }
        });
    })
  }
})
router.post('/saveAffiliationInstructional',middlewares.getUserInfo,function(req,res) {
    console.log("saveAffiliationInstructional");
    console.log("req,boy.value" +  req.body.value);
     var value = req.body.value;
     var userId = req.body.userId;
     var app_id =req.body.app_id;
    var data = req.body.data;
    console.log("dataaaaa" +  JSON.stringify(data));

    models.User.findAll({
        where :{ 
            id :  userId
        }
    }).then(function (userdetails){
        if(value == 'affiliation'){
            models.Affiliation_Letter.create({
                courseName  : data.CourseCtrl,
                collegeName : data.CollegeCtrl,
                specialization :  data.SpecializationCtrl,
                yearofpassing :  data.yearCtrl,
                duration  : data.durationCtrl,
                division :  data.divisionCtrl,
                education :  data.affiliationdegreeCtrl,
                user_id : userId,
                app_id : app_id,
                studentName : userdetails[0].name + ' ' + userdetails[0].surname
            }).then(function (updated) {
                res.json({
                    status : 200,
                    data :  data
                })
            })

        }else if(value == 'instructional'){
        models.InstructionalDetails.create({
            courseName  : data.instructionalCourseCtrl,
            collegeName : data.instructionalCollegeCtrl,
            specialization :  data.instructionalSpecializationCtrl,
            yearofpassing :  data.instructionalyearCtrl,
            duration  : data.instructionaldurationCtrl,
            division :  data.instructionaldivisionCtrl,
            education :  data.instructionaldegreeCtrl,
            userId : userId,
            app_id : app_id,
            studentName : userdetails[0].name + ' ' + userdetails[0].surname
        }).then(function (updated) {
            res.json({
                status : 200,
                data :  data
            })
        })
        }
    })
  
})

router.post('/collegeManagement/removeCollege',middlewares.getUserInfo,function(req,res) {
    var college_id = req.body.college_id;
    models.College.destroy({
        where : {
            id : college_id
        }
    }).then(function(college){
        res.json({
            status : 200
        })
    })
})

router.get('/collegeManagement/getFieldStudyData',middlewares.getUserInfo,function(req,res) {
    models.facultymaster.getfaculty().then(function(faculties){
        res.json({
            status : 200,
            items : faculties
        })
    })
})

router.post('/collegeManagement/addOrUpdateFacultyStudyData',middlewares.getUserInfo,function(req,res) {
    var FieldStudyData = req.body.FieldStudyData;
    if(FieldStudyData.id == null){
        models.facultymaster.create({
            year: FieldStudyData.year,
            faculty: FieldStudyData.faculty,
            degree: FieldStudyData.degree,
            created_at : moment(new Date()),
            updated_at : moment(new Date())
        }).then(function(createdFeild){
            if(createdFeild){
                res.json({
                    status : 200
                })
            }else{
                res.json({
                    status : 400
                })
            }
        });
    }else{
        models.facultymaster.findOne({
            where : {
                id : FieldStudyData.id
            }
        }).then(function(fieldData){
            fieldData.update({
                year: FieldStudyData.year,
                faculty: FieldStudyData.faculty,
                degree: FieldStudyData.degree,
                updated_at : moment(new Date())
            }).then(function(updatedField){
                if(updatedField){
                    res.json({
                        status : 200
                    })
                }else{
                    res.json({
                        status : 400
                    })
                }
            });
        })
    }
})

router.post('/collegeManagement/removeFacultyStudyData',middlewares.getUserInfo,function(req,res) {
    var faculty_id = req.body.faculty_id;
    models.facultymaster.destroy({
        where : {
            id : faculty_id
        }
    }).then(function(faculty){
        res.json({
            status : 200
        })
    })
})

router.post('/collegeManagement/sendEmailCollege',middlewares.getUserInfo,function(req,res) {
    console.log("/collegeManagement/sendEmailCollege");
    var college_id = req.body.college_id
    models.userMarkList.getCollegewiseStudents(college_id).then(function(studentList){
        var userIds = '';
        for(var i = 0; i < (studentList.length - 1); i++){
            userIds += studentList[i].user_id + ',';
        }
        userIds = userIds + studentList[studentList.length - 1].user_id;
        models.Application.getStudentDetails(userIds).then(function(studentDetails){
            if(studentDetails.length > 0){
                studentDetails.forEach(studentDetail=>{
                    models.College.find({
                        where : {
                            id : college_id
                        }
                    }).then(function(college){
                        if(studentDetail.educationalDetails == true){
                            models.User_Transcript.findAll({
                                where :{
                                    user_id : studentDetail.userid,
                                    collegeId : college_id
                                }
                            }).then(function(userTranscripts){
                                var singleCollege = {
                                    type: '',
                                    user_id : '',
                                    collegeName : '',
                                    studentName : '',
                                    courseName : '',
                                    college_id : '',
                                    collegeEmail : '',
                                    alternateEmail : '',
                                    user_transcript : [],
                                    user_markList : [],
                                    user_curriculum : [],
                                    app_id : studentDetail.appid
                                }
                                singleCollege.type = 'educationalDetails';
                                singleCollege.user_id =  studentDetail.userid;
                                singleCollege.collegeName = college.name;
                                singleCollege.studentName = studentDetail.student_name;
                                singleCollege.college_id = college_id;
                                singleCollege.collegeEmail = college.emailId;
                                singleCollege.alternateEmail = college.alternateEmailId;
                                userTranscripts.forEach(userTranscript=>{
                                    singleCollege.user_transcript.push({'fileName':userTranscript.file_name,'transcript':'upload/transcript/'+ studentDetail.userid + "/" + urlencode(userTranscript.file_name)});
                                });
                                models.userMarkList.find({
                                    where:{
                                        user_id : studentDetail.userid,
                                        collegeId : college_id
                                    }
                                }).then(function(userMarkListsData){
                                    models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){     
                                        userMarkLists.forEach(userMarkList=>{
                                            if((userMarkList.file_name !='null' && userMarkList.file_name!=null)&& (userMarkList.usermarklist_file_name==null)){
                                                singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.file_name)});
                                            }else if((userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null) && (userMarkList.file_name ==null)){
                                                singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.usermarklist_file_name)});
                                            }else if(userMarkList.file_name !='null' && userMarkList.file_name!=null && userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null){
                                                singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.file_name)});
                                                singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.usermarklist_file_name)});
                                            }
                                        });
                                        setTimeout(function(){
                                            request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                                json: {
                                                    singleCollege : singleCollege
                                                }
                                            }, function (error, response, body) {
                                                if(body.notSent.length > 0){
                                                    body.noteSent.forEach(data=>{
                                                        models.User_Transcript.updateSingleCollegeEmailStatus(studentDetail.userid,data.college_id,null,'not sent');
                                                    })
                                                }
                                                body.data.forEach(msgId=>{
                                                    models.User_Transcript.updateSingleCollegeEmailStatus(studentDetail.userid,msgId.college_id,msgId.msg_id,'sent');
                                                });
                                            })
                                        },1000);
                                    });
                                })
                            })
                        }
                        if(studentDetail.instructionalField == true){
                            var singleCollege = {
                                type: '',
                                user_id : '',
                                collegeName : '',
                                studentName : '',
                                courseName : '',
                                college_id : '',
                                collegeEmail : '',
                                alternateEmail : '',
                                user_transcript : [],
                                user_markList : [],
                                user_curriculum : [],
                                app_id : studentDetail.appid
                            }
                            models.InstructionalDetails.findOne({
                                where :{
                                    userId : studentDetail.userid
                                }
                            }).then(function(instructional){
                                models.userMarkList.find({
                                    where :{
                                        user_id : studentDetail.userid,
                                        collegeId : college_id
                                    }
                                }).then(function(userMarkListsData){
                                    models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){     
                                        singleCollege.type = 'instructionalField';
                                        singleCollege.user_id = studentDetail.userid;
                                        singleCollege.collegeName = college.name;
                                        singleCollege.studentName = instructional.studentName;
                                        singleCollege.courseName = instructional.courseName;
                                        singleCollege.college_id = college.id;
                                        singleCollege.collegeEmail = college.emailId;
                                        singleCollege.alternateEmail = college.alternateEmailId;
                                        userMarkLists.forEach(markList=>{
                                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.file_name)});
                                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.usermarklist_file_name)});
                                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.file_name)});
                                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.usermarklist_file_name)});
                                            }
                                        });
                                        setTimeout(function(){
                                            request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                                json: {
                                                    singleCollege : singleCollege
                                                }
                                            }, function (error, response, body) {
                                                if(body.notSent.length > 0){
                                                    body.noteSent.forEach(data=>{
                                                        models.InstructionalDetails.updateSingleEmailStatus(studentDetail.userid,null,'not sent');
                                                    })
                                                }
                                                body.data.forEach(msgId=>{
                                                    models.InstructionalDetails.updateSingleEmailStatus(studentDetail.userid,msgId.msg_id,'sent');
                                                });
                                            })
                                        },1000);
                                    })
                                })
                            })
                        }
                        if(studentDetail.affiliation == true){
                            var singleCollege = {
                                type: '',
                                user_id : '',
                                collegeName : '',
                                studentName : '',
                                courseName : '',
                                college_id : '',
                                collegeEmail : '',
                                alternateEmail : '',
                                user_transcript : [],
                                user_markList : [],
                                user_curriculum : [],
                                app_id : studentDetail.appid
                            }
                            models.Affiliation_Letter.findOne({
                                where :{
                                    user_id : studentDetail.userid
                                }
                            }).then(function(instructional){
                                models.userMarkList.find({
                                    where :{
                                        user_id : studentDetail.userid,
                                        collegeId : college_id
                                    }
                                }).then(function(userMarkListsData){
                                    models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){     
                                        singleCollege.type = 'instructionalField';
                                        singleCollege.user_id = studentDetail.userid;
                                        singleCollege.collegeName = college.name;
                                        singleCollege.studentName = instructional.studentName;
                                        singleCollege.courseName = instructional.courseName;
                                        singleCollege.college_id = college.id;
                                        singleCollege.collegeEmail = college.emailId;
                                        singleCollege.alternateEmail = college.alternateEmailId;
                                        userMarkLists.forEach(markList=>{
                                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.file_name)});
                                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.usermarklist_file_name)});
                                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.file_name)});
                                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.usermarklist_file_name)});
                                            }
                                        });
                                        setTimeout(function(){
                                            request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                                json: {
                                                    singleCollege : singleCollege
                                                }
                                            }, function (error, response, body) {
                                                if(body.notSent.length > 0){
                                                    body.noteSent.forEach(data=>{
                                                        models.InstructionalDetails.updateSingleEmailStatus(studentDetail.userid,null,'not sent');
                                                    })
                                                }
                                                body.data.forEach(msgId=>{
                                                    models.InstructionalDetails.updateSingleEmailStatus(studentDetail.userid,msgId.msg_id,'sent');
                                                });
                                            })
                                        },1000);
                                    })
                                })
                            })
                        }
                        if(studentDetail.curriculum == true){
                            models.User_Curriculum.findAll({
                                where : {
                                    user_id : studentDetail.userid,
                                    collegeId : college_id
                                }
                            }).then(function(userCurriculum){
                                var singleCollege = {
                                    type: '',
                                    user_id : '',
                                    collegeName : '',
                                    studentName : '',
                                    courseName : '',
                                    college_id : '',
                                    collegeEmail : '',
                                    alternateEmail : '',
                                    user_transcript : [],
                                    user_markList : [],
                                    user_curriculum : [],
                                    app_id : studentDetail.appid
                                }
                                singleCollege.type = 'curriculum';
                                singleCollege.user_id = studentDetail.userid;
                                singleCollege.collegeName = college.name;
                                singleCollege.collegeEmail = college.emailId;
                                singleCollege.studentName = studentDetail.student_name;
                                singleCollege.college_id = college.id;
                                singleCollege.alternateEmail = college.alternateEmailId; 
                                userCurriculum.forEach(curriculum=>{
                                    singleCollege.user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+ studentDetail.userid + "/" + urlencode(curriculum.file_name)});
                                });
                                models.userMarkList.find({
                                    where : {
                                        user_id : studentDetail.userid,
                                        collegeId : college_id
                                    }
                                }).then(function(userMarkListsData){
                                    models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){      
                                        userMarkLists.forEach(markList=>{
                                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.file_name)});
                                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.usermarklist_file_name)});
                                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.file_name)});
                                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(markList.usermarklist_file_name)});
                                            }
                                        });
                                        setTimeout(function(){
                                            request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                                json: {
                                                    singleCollege : singleCollege
                                                }
                                            }, function (error, response, body) {
                                                if(body.notSent.length > 0){
                                                    body.noteSent.forEach(data=>{
                                                        models.User_Curriculum.updateSingleCollegeEmailStatus(studentDetail.userid,data.college_id,null,'not sent');
                                                    })
                                                }
                                                body.data.forEach(msgId=>{
                                                    models.User_Curriculum.updateSingleCollegeEmailStatus(studentDetail.userid,msgId.college_id,msgId.msg_id,'sent');
                                                });
                                            })
                                        },1000);
                                    })
                                });
                            })
                        }
                        if(studentDetail.gradToPer == true){
                        models.GradeToPercentageLetter.findAll({
                            where :{
                                user_id : studentDetail.userid,
                                collegeId : college_id
                            }
                        }).then(function(letters){
                            var singleCollege = {
                                type: '',
                                user_id : '',
                                collegeName : '',
                                studentName : '',
                                courseName : '',
                                college_id : '',
                                collegeEmail : '',
                                alternateEmail : '',
                                letter : [],
                                user_markList : [],
                                user_curriculum : [],
                                app_id : studentDetail.appid
                            }
                            singleCollege.type = 'gradeToPercentLetter';
                            singleCollege.user_id =  studentDetail.userid;
                            singleCollege.collegeName = college.name;
                            singleCollege.studentName = studentDetail.student_name;
                            singleCollege.college_id = college_id;
                            singleCollege.collegeEmail = college.emailId;
                            singleCollege.alternateEmail = college.alternateEmailId;
                            letters.forEach(letter=>{
                                singleCollege.letter.push({'fileName':letter.file_name,'letter':'upload/gradToPercentLetter/'+ studentDetail.userid + "/" + urlencode(letter.file_name)});
                            });
                            models.userMarkList.find({
                                where:{
                                    user_id : studentDetail.userid,
                                    collegeId : college_id
                                }
                            }).then(function(userMarkListsData){
                                models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){     
                                    userMarkLists.forEach(userMarkList=>{
                                        if((userMarkList.file_name !='null' && userMarkList.file_name!=null)&& (userMarkList.usermarklist_file_name==null)){
                                            singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.file_name)});
                                        }else if((userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null) && (userMarkList.file_name ==null)){
                                            singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.usermarklist_file_name)});
                                        }else if(userMarkList.file_name !='null' && userMarkList.file_name!=null && userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null){
                                            singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.file_name)});
                                            singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.usermarklist_file_name)});
                                        }
                                    });
                                    setTimeout(function(){
                                        request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                            json: {
                                                singleCollege : singleCollege
                                            }
                                        }, function (error, response, body) {
                                            if(body.notSent.length > 0){
                                                body.noteSent.forEach(data=>{
                                                    models.GradeToPercentageLetter.updateSingleCollegeEmailStatus(studentDetail.userid,data.college_id,null,'not sent');
                                                })
                                            }
                                            body.data.forEach(msgId=>{
                                                models.GradeToPercentageLetter.updateSingleCollegeEmailStatus(studentDetail.userid,msgId.college_id,msgId.msg_id,'sent');
                                            });
                                        })
                                    },1000);
                                });
                            })
                        })
                        }
                        if(studentDetail.CompetencyLetter == true){
                            models.CompetencyLetter.findAll({
                                where :{
                                    user_id : studentDetail.userid,
                                    collegeId : college_id
                                }
                            }).then(function(userTranscripts){
                                var singleCollege = {
                                    type: '',
                                    user_id : '',
                                    collegeName : '',
                                    studentName : '',
                                    courseName : '',
                                    college_id : '',
                                    collegeEmail : '',
                                    alternateEmail : '',
                                    user_transcript : [],
                                    user_markList : [],
                                    user_curriculum : [],
                                    app_id : studentDetail.appid
                                }
                                singleCollege.type = 'CompetencyLetter';
                                singleCollege.user_id =  studentDetail.userid;
                                singleCollege.collegeName = college.name;
                                singleCollege.studentName = studentDetail.student_name;
                                singleCollege.college_id = college_id;
                                singleCollege.collegeEmail = college.emailId;
                                singleCollege.alternateEmail = college.alternateEmailId;
                                userTranscripts.forEach(userTranscript=>{
                                    singleCollege.user_transcript.push({'fileName':userTranscript.file_name,'CompetencyLetter':'upload/CompetencyLetter/'+ studentDetail.userid + "/" + urlencode(userTranscript.file_name)});
                                });
                                models.userMarkList.find({
                                    where:{
                                        user_id : studentDetail.userid,
                                        collegeId : college_id
                                    }
                                }).then(function(userMarkListsData){
                                    models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){     
                                        userMarkLists.forEach(userMarkList=>{
                                            if((userMarkList.file_name !='null' && userMarkList.file_name!=null)&& (userMarkList.usermarklist_file_name==null)){
                                                singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.file_name)});
                                            }else if((userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null) && (userMarkList.file_name ==null)){
                                                singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.usermarklist_file_name)});
                                            }else if(userMarkList.file_name !='null' && userMarkList.file_name!=null && userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null){
                                                singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.file_name)});
                                                singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ studentDetail.userid + "/" + urlencode(userMarkList.usermarklist_file_name)});
                                            }
                                        });
                                        setTimeout(function(){
                                            request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                                json: {
                                                    singleCollege : singleCollege
                                                }
                                            }, function (error, response, body) {
                                                if(body.notSent.length > 0){
                                                    body.noteSent.forEach(data=>{
                                                        models.User_Transcript.updateSingleCollegeEmailStatus(studentDetail.userid,data.college_id,null,'not sent');
                                                    })
                                                }
                                                body.data.forEach(msgId=>{
                                                    models.User_Transcript.updateSingleCollegeEmailStatus(studentDetail.userid,msgId.college_id,msgId.msg_id,'sent');
                                                });
                                            })
                                        },1000);
                                    });
                                })
                            })
                        }
                       
                    })
                })
                res.json({
                    status :200,
                    message : "Email sent successfully"
                })
            }else{
                res.json({
                    status :200,
                    message : "No Pending Applications to send"
                 })
            }
        })
    })
})

cron.schedule('0 2 * * *',function(req,res){
	var data = {};
    var count = 0;
     client.setApiKey(constant.SENDGRID_API_KEY);
     var request = {};
     request.method = 'GET';
     request.url = '/v3/messages?limit=5000&query=from_email%3D%22attestation%40mu.ac.in%22'; //'/v3/messages?limit=1000&query= from_email="attestation@mu.ac.in"'
     client.request(request)
         .then(([response, body]) => {
            //var a = JSON.stringify(response.body.messages);
              var a = response.body.messages;
              a.forEach(element => {
                  
                models.EmailActivityTracker.find({
                      where :{
                          sg_msg_id : element.msg_id,
                      }
                  }).then(data => {
                      if(data){
                          data.update({
                            email : element.to_email,
                            status : element.status,
                            opens_count : element.opens_count,
                            clicks_count : element.clicks_count,
                            last_event_time : element.last_event_time,
                          })
                      }
                      else{
                         models.EmailActivityTracker.create({
                              email : element.to_email,
                              subject : element.subject,
                              status : element.status,
                              opens_count : element.opens_count,
                              clicks_count : element.clicks_count,
                               sg_msg_id : element.msg_id,
                              last_event_time : element.last_event_time,
                            })
                      }
                  })
                count++
              });
        })
})

router.get('/getapptrackerdetails',function(req,res){
	var a ;
    var b ;
    var fullName;
    var fourteenDays = [];
    var thirtyDay = [];
    var count = 0;
        models.EmailActivityTracker.getAppliUnopenMail().then(function(details){
            details.forEach(element => {
                var sub = element.subject;
             		var splitSub = sub.split('  ')
	            fullName = splitSub[1];
	            var splitname = fullName.split(' ');
	            var name = '';
                var surname = '';
                if(splitname.length > 2){
                    for(var i = 0; i < splitname.length - 2; i++){
                        name += splitname[i] + ' ';
                    }
                    name += splitname[splitname.length - 2];
                    surname = splitname[splitname.length -1];
                }else if(splitname.length < 2){
                    name = splitname[splitname.length-1];
                    surname = null;
                }else{
                    name = splitname[0];
                    surname = splitname[1];
                }
	          	var time  = element.created_at;
                var currentDate = new Date()
                var date1 = time.getTime();
                var date2 = currentDate.getTime();
                if (date1 > date2){
                    a = date1;
                    b = date2
                }else{
                    a = date2;
                    b = date1
                }
                var diff_in_time = a - b 
                var differencenInDays = diff_in_time/(1000 * 3600 * 24)
                if(differencenInDays > 14 && differencenInDays < 19){
                    models.User.find({
                    	where :{
			          		name : name,
			           		surname : surname
			           	}
			        }).then(function(user){
	                    models.Institution_details.find({
	                        where : {
	                            user_id : user.id,
	                            email : element.email
	                        }
	                    }).then(userData1 => {
	                        fourteenDays.push(userData1)
	                    })
	                });

                 }else if(differencenInDays > 29){
                    models.User.find({
			          	where :{
			          		name : name,
			           		surname : surname
			           	}
			        }).then(function(user){
	                    models.Institution_details.find({
	                        where : {
	                            user_id : user.id,
	                            email : element.email
	                        }
	                    }).then(userData => {
	                       thirtyDay.push(userData)
	                        
	                    })
	                });
                    
                }else{

                }
                count++
        
            })
        
        setTimeout(function(){
            if(details.length == count){
                res.json({
                    status : 200,
                    fourteenDaysData : fourteenDays,
                    thirtyDay : thirtyDay,
                })
            }
            },3000)
            
        })
    
})

router.get('/getapplicationMailsDetails',function(req,res){
	var allMailData = [];
    var fullName;
    var count = 0;
    models.EmailActivityTracker.getAllApplicationMail().then(function(info){
        info.forEach(element => {
            var sub = element.subject;
            var splitSub = sub.split('  ')
            fullName = splitSub[1];
           var splitname = fullName.split(' ');
            var name = '';
            var surname = '';
            if(splitname.length > 2){
                for(var i = 0; i < splitname.length - 2; i++){
                    name += splitname[i] + ' ';
                }
                name += splitname[splitname.length - 2];
                surname = splitname[splitname.length -1];
            }else if(splitname.length < 2){
                name = splitname[splitname.length-1];
                surname = null;
            }else{
                name = splitname[0];
                surname = splitname[1];
            }
            models.User.find({
            	where :{
	          		name : name,
	           		surname : surname
	           	}
            }).then(function(user){
	            models.Institution_details.find({
	                where : {
	                    user_id : user.id,
	                    email : element.email
	                }
	            }).then(userData2 => {
	                if(userData2){
	                    allMailData.push(userData2)
	                }
	                
	                count++
	                if(info.length == count){
	                    res.json({
	                        status : 200,
	                        data : allMailData
	                    })
	                }
	                
	            })
	        })
            // setTimeout(function(){
            //     if(info.length == count){
            //         res.json({
            //             status : 200,
            //             data : allMailData
            //         })
            //     }
            // },1000)
        })
    })
})

router.get('/student_feeback', function(req, res) {
    var feedbackData = [];
    var counter = 0;
    models.Feedback.getAllData().then(function(feedbacks){
        feedbacks.forEach(function(feedback){
            counter++;
            feedbackData.push({
                feedback_create : feedback.feedback_create,
                user_name : feedback.name+' '+feedback.surname,
                user_email : feedback.email, 
                website_satisfy : feedback.website_satisfy, 
                website_recommend : feedback.website_recommend, 
                staff_satisfy : feedback.staff_satisfy, 
                experience_problem : feedback.experience_problem, 
                problem : feedback.problem, 
                suggestion : feedback.suggestion
            })
            if(feedbacks.length == counter){
                res.json({
                    status: 200,
                    data: feedbackData
                });
            }
        })
    })
});

router.get('/adminDashboard/errataDocuments', function (req, res) {
    var errataDocs = [];
    var changedDocs = [];
    var count = 0;
    var count2 = 0;

    models.User_Transcript.findAll({
        where : {
            //  lock_transcript : 1,
            upload_step : ['changed','requested']
            },
            include: [
            {
                //Shra1Edulab needs to check
                model: models.Applied_For_Details,
                attributes:   ['instructionalField', 'curriculum', 'educationalDetails','gradToPer'],
                required:true,
                include :[{
                    model: models.Applied_For_Details,
                    attributes:   ['email', 'name', 'surname'],
                    required:true,
                    include: [{
                        model: models.Application,
                        attributes:   ['id'],
                        required: true
                    }]
                }]
            },
        ],
        //  limit:
    }).then((transcriptData)=>{
        count = count + transcriptData.length;
        transcriptData.forEach((Transcript)=>{
            var filename=Transcript.file_name;
            var extension=filename.split('.').pop();

            if(Transcript.User != null){
                if(Transcript.upload_step == " requested"){
                    errataDocs.push({
                        set : 1,
                        user_id : Transcript.user_id,
                        user_email : Transcript.User.email,
                        instructionalField: Transcript.User.instructionalField,
                        curriculum: Transcript.User.curriculum,
                        educationalDetails: Transcript.User.educationalDetails,
                        app_id: Transcript.User.Application.id,
                        gradToPer : Transcript.User.gradToPer,
                        doc_id : Transcript.id,
                        doc_name: Transcript.name,
                        upadated_date: Transcript.updated_at,
                        type: 'Transcript',
                        extension: extension,
                        upload_status : Transcript.upload_step,
                        file_loc : constant.BASE_URL+"/upload/transcript/"+Transcript.user_id+"/"+Transcript.file_name,
                        upload_step : Transcript.upload_step,
                        lock_transcript : Transcript.lock_transcript,
                        file_name : Transcript.file_name,
                        download_file : constant.FILE_LOCATION+"public/upload/transcript/"+Transcript.user_id+"/"+Transcript.file_name,
                    
                    })
                }else if(Transcript.upload_step == " changed"){
                    changedDocs.push({
                        set : 1,
                        user_id : Transcript.user_id,
                        user_email : Transcript.User.email,
                        instructionalField: Transcript.User.instructionalField,
                        curriculum: Transcript.User.curriculum,
                        educationalDetails: Transcript.User.educationalDetails,
                        app_id: Transcript.User.Application.id,
                        doc_id : Transcript.id,
                        doc_name: Transcript.name,
                        upadated_date: Transcript.updated_at,
                        type: 'Transcript',
                        extension: extension,
                        upload_status : Transcript.upload_step,
                        file_loc : constant.BASE_URL+"/upload/transcript/"+Transcript.user_id+"/"+Transcript.file_name,
                        upload_step : Transcript.upload_step,
                        lock_transcript : Transcript.lock_transcript,
                        file_name : Transcript.file_name,
                        download_file : constant.FILE_LOCATION+"public/upload/transcript/"+Transcript.user_id+"/"+Transcript.file_name,
                    
                    })
                }
                
            }
            count2++;
        })
    })
    models.userMarkList.findAll({
        where : {
            upload_step : ['changed','requested']
        },
        include: [
        {
            model: models.Applied_For_Details,
            attributes:   ['instructionalField', 'curriculum', 'educationalDetails','gradToPer'],
            required:true,
            include :[{
                model: models.Applied_For_Details,
                attributes:   ['email', 'name', 'surname'],
                required:true,
                include: [{
                    model: models.Application,
                    attributes:   ['id'],
                    required: true
                }]
            }]
        },],
    }).then((transcriptData)=>{
        count = count + transcriptData.length;
        transcriptData.forEach((Transcript)=>{
            var filename=Transcript.file_name;
            var extension=filename.split('.').pop();

            if(Transcript.User != null){
                if(Transcript.upload_step == "requested"){
                    errataDocs.push({
                        set : 2,
                        user_id : Transcript.user_id,
                        user_email : Transcript.User.email,
                        instructionalField: Transcript.User.instructionalField,
                        curriculum: Transcript.User.curriculum,
                        educationalDetails: Transcript.User.educationalDetails,
                        gradToPer : Transcript.User.gradToPer,
                        app_id: Transcript.User.Application.id,
                        doc_id : Transcript.id,
                        doc_name: Transcript.name,
                        upadated_date: Transcript.updated_at,
                        type: 'Marksheet',
                        extension: extension,
                        upload_status : Transcript.upload_step,
                        file_loc : constant.BASE_URL+"/upload/marklist/"+Transcript.user_id+"/"+Transcript.file_name,
                        upload_step : Transcript.upload_step,
                        lock_transcript : Transcript.lock_marklist,
                        file_name : Transcript.file_name,
                        download_file : constant.FILE_LOCATION+"public/upload/marklist/"+Transcript.user_id+"/"+Transcript.file_name,
                    
                    })
                }else if(Transcript.upload_step == "changed"){
                    changedDocs.push({
                        set : 2,
                        user_id : Transcript.user_id,
                        user_email : Transcript.User.email,
                        instructionalField: Transcript.User.instructionalField,
                        curriculum: Transcript.User.curriculum,
                        educationalDetails: Transcript.User.educationalDetails,
                        app_id: Transcript.User.Application.id,
                        doc_id : Transcript.id,
                        doc_name: Transcript.name,
                        upadated_date: Transcript.updated_at,
                        type: 'Marksheet',
                        extension: extension,
                        upload_status : Transcript.upload_step,
                        file_loc : constant.BASE_URL+"/upload/marklist/"+Transcript.user_id+"/"+Transcript.file_name,
                        upload_step : Transcript.upload_step,
                        lock_transcript : Transcript.lock_marklist,
                        file_name : Transcript.file_name,
                        download_file : constant.FILE_LOCATION+"public/upload/marklist/"+Transcript.user_id+"/"+Transcript.file_name,
                    
                    })
                }
                
            }
            count2++;
        })
    })
    models.UserMarklist_Upload.findAll({
        where : {
            upload_step : ['changed','requested']
        },
        include: [
        {
            model: models.Applied_For_Details,
            attributes:   ['instructionalField', 'curriculum', 'educationalDetails','gradToPer'],
            required:true,
            include :[{
                model: models.Applied_For_Details,
                attributes:   ['email', 'name', 'surname'],
                required:true,
                include: [{
                    model: models.Application,
                    attributes:   ['id'],
                    required: true
                }]
            }]
        },
    ],
    //  limit:
    }).then((transcriptData)=>{
        count = count + transcriptData.length;
    transcriptData.forEach((Transcript)=>{

        var filename=Transcript.file_name;
        var extension=filename.split('.').pop();

        if(Transcript.User != null){
            if(Transcript.upload_step == "requested"){
                errataDocs.push({
                    set : 3,
                    user_id : Transcript.user_id,
                    user_email : Transcript.User.email,
                    instructionalField: Transcript.User.instructionalField,
                    curriculum: Transcript.User.curriculum,
                    educationalDetails: Transcript.User.educationalDetails,
                    app_id: Transcript.User.Application.id,
                    gradToPer : Transcript.User.gradToPer,
                    doc_id : Transcript.id,
                    doc_name: Transcript.name,
                    upadated_date: Transcript.updated_at,
                    type: 'Marksheet',
                    extension: extension, 
                    upload_status : Transcript.upload_step,
                    file_loc : constant.BASE_URL+"/upload/marklist/"+Transcript.user_id+"/"+Transcript.file_name,
                    upload_step : Transcript.upload_step,
                    lock_transcript : Transcript.lock_transcript,
                    file_name : Transcript.file_name,
                    download_file : constant.FILE_LOCATION+"public/upload/marklist/"+Transcript.user_id+"/"+Transcript.file_name,
                   
                })
            }else if(Transcript.upload_step == "changed"){
                changedDocs.push({
                    set : 3,
                    user_id : Transcript.user_id,
                    user_email : Transcript.User.email,
                    instructionalField: Transcript.User.instructionalField,
                    curriculum: Transcript.User.curriculum,
                    gradToPer : Transcript.User.gradToPer,
                    educationalDetails: Transcript.User.educationalDetails,
                    app_id: Transcript.User.Application.id,
                    doc_id : Transcript.id,
                    doc_name: Transcript.name,
                    upadated_date: Transcript.updated_at,
                    type: 'Marksheet',
                    extension: extension, 
                    upload_status : Transcript.upload_step,
                    file_loc : constant.BASE_URL+"/upload/marklist/"+Transcript.user_id+"/"+Transcript.file_name,
                    upload_step : Transcript.upload_step,
                    lock_transcript : Transcript.lock_transcript,
                    file_name : Transcript.file_name,
                    download_file : constant.FILE_LOCATION+"public/upload/marklist/"+Transcript.user_id+"/"+Transcript.file_name,
                   
                })
            }

            
        }
        count2++;
    })

    })
    models.User_Curriculum.findAll({
        where : {
            upload_step : ['changed','requested']
        },
        include: [
        {
            model: models.Applied_For_Details,
            attributes:   ['instructionalField', 'curriculum', 'educationalDetails','gradToPer'],
            required:true,
            include :[{
                model: models.Applied_For_Details,
                attributes:   ['email', 'name', 'surname'],
                required:true,
                include: [{
                    model: models.Application,
                    attributes:   ['id'],
                    required: true
                }]
            }]
        },
    ],
    //  limit:
    }).then((transcriptData)=>{
        count = count + transcriptData.length;
    transcriptData.forEach((Transcript)=>{
        var filename=Transcript.file_name;
        var extension=filename.split('.').pop();

        if(Transcript.User != null){
            if(Transcript.upload_step == "requested"){
                errataDocs.push({
                    set: 4,
                    user_id : Transcript.user_id,
                    user_email : Transcript.User.email,
                    instructionalField: Transcript.User.instructionalField,
                    curriculum: Transcript.User.curriculum,
                    gradToPer : Transcript.User.gradToPer,
                    educationalDetails: Transcript.User.educationalDetails,
                    app_id: Transcript.User.Application.id,
                    doc_id : Transcript.id,
                    doc_name: Transcript.name,
                    upadated_date: Transcript.updated_at,
                    type: 'Curriculum',
                    extension: extension,
                    upload_status : Transcript.upload_step,
                    file_loc : constant.BASE_URL+"/upload/curriculum/"+Transcript.user_id+"/"+Transcript.file_name,
                    upload_step : Transcript.upload_step,
                    lock_transcript : Transcript.lock_transcript,
                    file_name : Transcript.file_name,
                    download_file : constant.FILE_LOCATION+"public/upload/curriculum/"+Transcript.user_id+"/"+Transcript.file_name,
                   
                })
            }else if(Transcript.upload_step == "changed"){
                changedDocs.push({
                    set: 4,
                    user_id : Transcript.user_id,
                    user_email : Transcript.User.email,
                    instructionalField: Transcript.User.instructionalField,
                    curriculum: Transcript.User.curriculum,
                    educationalDetails: Transcript.User.educationalDetails,
                    gradToPer : Transcript.User.gradToPer,
                    app_id: Transcript.User.Application.id,
                    doc_id : Transcript.id,
                    doc_name: Transcript.name,
                    upadated_date: Transcript.updated_at,
                    type: 'Curriculum',
                    extension: extension,
                    upload_status : Transcript.upload_step,
                    file_loc : constant.BASE_URL+"/upload/curriculum/"+Transcript.user_id+"/"+Transcript.file_name,
                    upload_step : Transcript.upload_step,
                    lock_transcript : Transcript.lock_transcript,
                    file_name : Transcript.file_name,
                    download_file : constant.FILE_LOCATION+"public/upload/curriculum/"+Transcript.user_id+"/"+Transcript.file_name,
                   
                })
            }
            
        }
        count2++;
    })
    })

    models.GradeToPercentageLetter.findAll({
        where : {
            upload_step : ['changed','requested']
        },
        include: [
        {
            model: models.Applied_For_Details,
            attributes:   ['instructionalField', 'curriculum', 'educationalDetails','gradToPer'],
            required:true,
            include :[{
                model: models.Applied_For_Details,
                attributes:   ['email', 'name', 'surname'],
                required:true,
                include: [{
                    model: models.Application,
                    attributes:   ['id'],
                    required: true
                }]
            }]
        },
    ],
    //  limit:
    }).then((letterData)=>{
        count = count + letterData.length;
        letterData.forEach((letter)=>{
        var filename=letter.file_name;
        var extension=filename.split('.').pop();

        if(letter.User != null){
            if(letter.upload_step == "requested"){
                errataDocs.push({
                    set: 5,
                    user_id : letter.user_id,
                    user_email : letter.User.email,
                    instructionalField: letter.User.instructionalField,
                    curriculum: letter.User.curriculum,
                    educationalDetails: letter.User.educationalDetails,
                    app_id: letter.User.Application.id,
                    gradToPer : letter.User.gradToPer,
                    doc_id : letter.id,
                    doc_name: letter.name,
                    upadated_date: letter.updated_at,
                    type: 'GradeToPercentLetter',
                    extension: extension,
                    upload_status : letter.upload_step,
                    file_loc : constant.BASE_URL+"/upload/gradToPercentLetter/"+letter.user_id+"/"+letter.file_name,
                    upload_step : letter.upload_step,
                    lock_transcript : letter.lock_transcript,
                    file_name : letter.file_name,
                    download_file : constant.FILE_LOCATION+"public/upload/gradToPercentLetter/"+letter.user_id+"/"+letter.file_name,
                   
                })
            }else if(letter.upload_step == "changed"){
                changedDocs.push({
                    set: 5,
                    user_id : letter.user_id,
                    user_email : letter.User.email,
                    instructionalField: letter.User.instructionalField,
                    curriculum: letter.User.curriculum,
                    educationalDetails: letter.User.educationalDetails,
                    gradToPer : letter.User.gradToPer,
                    app_id: letter.User.Application.id,
                    doc_id : letter.id,
                    doc_name: letter.name,
                    upadated_date: letter.updated_at,
                    type: 'GradeToPercentLetter',
                    extension: extension,
                    upload_status : letter.upload_step,
                    file_loc : constant.BASE_URL+"/upload/gradToPercentLetter/"+letter.user_id+"/"+letter.file_name,
                    upload_step : letter.upload_step,
                    lock_transcript : letter.lock_transcript,
                    file_name : letter.file_name,
                    download_file : constant.FILE_LOCATION+"public/upload/gradToPercentLetter/"+letter.user_id+"/"+letter.file_name,
                   
                })
            }
            
        }
        count2++;
    })
    })
  
    setTimeout(()=>{
        if(count ==  count2){
            res.json({
                status: 200,
                data: errataDocs,
                changedDocs : changedDocs
            })
        } 
    },6000)
});

router.post('/adminDashboard/lockDocuments',function(req,res){
    console.log("adminDashboard/lockDocuments");
    var set= req.body.set;
    var user_id = req.body.user_id;
    var doc_id = req.body.doc_id;
    if(set == 1){
        models.User_Transcript.find({
            where:{
                id : doc_id
            }
        }).then((transcript)=>{
            if(transcript){
                transcript.update({
                    lock_transcript : true,
                    upload_step : "requested"
                }).then((trans_update)=>{
                    if(trans_update){
                        var Remark = "Uploaded Transcript "+transcript.name +" is incorrect, please reupload it.";
                        var created_at = functions.socketnotification('Transcript locked',Remark,user_id,'student');
                        //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});

                        res.json({
                            status : 200
                        })
                    }else{
                        res.json({
                            status : 400
                        })
                    }
                })
            }else{
                res.json({
                    status : 400
                })
            }

        })
    }else if(set == 2){
        models.userMarkList.find({
            where:{
                id : doc_id
            }
        }).then((markList)=>{
            if(markList){
                markList.update({
                    lock_marklist : true,
                    upload_step : "requested"
                }).then((marksheet_update)=>{
                    if(marksheet_update){
                        var Remark = "Uploaded Marksheet "+markList.name+" is incorrect, please reupload it." ;
                        var created_at = functions.socketnotification('Marksheet locked',Remark,user_id,'student');
                        //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});

                        res.json({
                            status : 200
                        })
                    }else{
                        res.json({
                            status : 400
                        })
                    }
                })
            }else{
                res.json({
                    status : 400
                })
            }

        })
    }else if(set == 3){
        models.UserMarklist_Upload.find({
            where:{
                id : doc_id
            }
        }).then((Marksheet)=>{
            if(Marksheet){
                Marksheet.update({
                    lock_transcript : true,
                    upload_step : "requested"
                }).then((marksheet_update)=>{
                    if(marksheet_update){
                        var Remark = "Uploaded Marksheet "+Marksheet.name+" is incorrect, please reupload it." ;
                        var created_at = functions.socketnotification('Marksheet locked',Remark,user_id,'student');
                        //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});

                        res.json({
                            status : 200
                        })
                    }else{
                        res.json({
                            status : 400
                        })
                    }
                })
            }else{
                res.json({
                    status : 400
                })
            }

        })
    }else if(set == 4){
        models.User_Curriculum.find({
            where:{
                id : doc_id
            }
        }).then((curriculum)=>{
            if(curriculum){
                curriculum.update({
                    lock_transcript : true,
                    upload_step : "requested"
                }).then((curri_update)=>{
                    if(curri_update){
                        var Remark = "Curriculum is incorrect, please reupload it.";
                        var created_at = functions.socketnotification('Curriculum locked',Remark,user_id,'student');
                        //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});

                        res.json({
                            status : 200
                        })
                    }else{
                        res.json({
                            status : 400
                        })
                    }
                })
            }else{
                res.json({
                    status : 400
                })
            }

        })
    }else if(set == 5){
        models.GradeToPercentageLetter.find({
            where:{
                id : doc_id
            }
        }).then((letter)=>{
            if(letter){
                letter.update({
                    lock_transcript : true,
                    upload_step : "requested"
                }).then((letter_update)=>{
                    if(letter_update){
                        var Remark = "Grade To Percentage Letter is incorrect, please reupload it.";
                        var created_at = functions.socketnotification('Grade To Percentage Letter locked',Remark,user_id,'student');
                        //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});

                        res.json({
                            status : 200
                        })
                    }else{
                        res.json({
                            status : 400
                        })
                    }
                })
            }else{
                res.json({
                    status : 400
                })
            }

        })
    }

})

router.get('/downloadDocument', function (req, res) {
	var file_name = req.query.file_name;
    //	const downloadData = constant.FILE_LOCATION + "public/upload/marklist/" + userId + "/" + file_name;
	res.download(file_name);
  });

  router.post('/addExtraPurposeEmail',(req,res)=>{
    console.log("/addExtraPurposeEmail");
    var emailString = req.body.emailArray.toString();
    models.Institution_details.find({
        where : {
            user_id : req.body.user_id,
            app_id : req.body.app_id
        }
    }).then(function(institute){
        if(institute){
            institute.update({
                OtherEmail : emailString
            }).then(function(institution_details){
                if(institution_details){
                    res.json({
                        status : 200
                    })
                }else{
                    res.json({
                        status : 400
                    })
                }
            })
        }else{
            res.json({
                status : 400
            })
        }
    })
})

router.post('/changeDocumentName',function(req,res){
    var id = req.body.id;
    var changedName = req.body.changedName;
    var type = req.body.type;
    if(type == 'marksheet'){
        models.UserMarklist_Upload.find({
            where:{
                id : id
            }
        }).then(function(marklist){
            marklist.update({
                name : changedName
            }).then(function(updatedMarklist){
                if(updatedMarklist){
                    res.json({
                        status : 200
                    })
                }else{
                    res.json({
                        staus : 400
                    })
                }
            })
        })
    }else if(type == "transcript"){
        models.User_Transcript.find({
            where : {
                id : id
            }
        }).then(function(transcript){
            transcript.update({
                name : changedName
            }).then(function(updatedTranscript){
                if(updatedTranscript){
                    res.json({
                        status : 200
                    })
                }else{
                    res.json({
                        staus : 200
                    })
                }
            })
        })
    }else if(type == "competencyData"){
        models.competency_letter.find({
            where : {
                id : id
            }
        }).then(function(transcript){
            transcript.update({
                name : changedName
            }).then(function(updatedTranscript){
                if(updatedTranscript){
                    res.json({
                        status : 200
                    })
                }else{
                    res.json({
                        staus : 200
                    })
                }
            })
        })
    }else if(type == "namechangeletter"){
        models.Letterfor_NameChange.find({
            where : {
                id : id
            }
        }).then(function(transcript){
            transcript.update({
                name : changedName
            }).then(function(updatedTranscript){
                if(updatedTranscript){
                    res.json({
                        status : 200
                    })
                }else{
                    res.json({
                        staus : 200
                    })
                }
            })
        })
    }
})

router.post('/saveNotes',middlewares.getUserInfo,function(req,res){
    models.Application.find({
        where :{
            id : req.body.id
        }
    }).then(function(application){
        application.update({
            notes : req.body.notes
        }).then(function(updatedApp){
            if(updatedApp){
                var desc = "Note of application " + updatedApp.id + " is updated by " + req.User.email;	
                var activity = "Note Updated";	
                functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);
                res.json({
                    status : 200,
                    message : "Notes Saved",
                    data : updatedApp.notes
                })
            }else{
                res.json({
                    status : 400,
                    message : "Something went wrong",
                    data : application.notes
                })
            }
        })
    })
})

router.get('/collegeManagement/pendingApplicationList',middlewares.getUserInfo,function(req,res) {
    console.log("/collegeManagement/pendingApplicationList");
    var college_id = req.query.college_id;
    var students = [];
    models.userMarkList.getCollegewiseStudents(college_id).then(function(studentList){
         var userIds = '';
         for(var i = 0; i < (studentList.length - 1); i++){
             userIds += studentList[i].user_id + ',';
         }
         userIds = userIds + studentList[studentList.length - 1].user_id;
         models.Application.getStudentDetails(userIds).then(function(studentDetails){
            if(studentDetails.length > 0){
                 studentDetails.forEach(student=>{
                    students.push({
                        user_id : student.userid,
                        student_name : student.student_name,
                        student_email : student.student_email,
                        application_id : student.appid,
                        contactNumber : student.contactNumber,
                        educationalDetails : (student.educationalDetails) ? 'true': 'false', 
                        application_date : moment(student.application_date).format('DD-MM-YYYY')
                    })
                 })
                 setTimeout(()=>{
                    var xls = json2xls(students);
                    var college_name = req.query.college_name.split(' ').join('_');
                    var file_location = constant.FILE_LOCATION+"public/Excel/"+college_name+".xlsx";
                    fs.writeFileSync(file_location, xls, 'binary');
                    var filepath= constant.FILE_LOCATION+"/public/Excel/"+college_name+".xlsx";
                    res.json({
                        status :200,
                        message : "Email sent successfully",
                        data : filepath
                    })
                },1000)
            }else{
                res.json({
                    status :400,
                    message : "No Pending Applications"
                 })
            }
         })
     })
 })

 router.post('/transcriptRequiredMail',middlewares.getUserInfo,function(req,res){	
    var user_id = req.body.user_id;	
    var app_id = req.body.app_id;	
    var eventChecked = req.body.eventChecked;	
    var collegeData = [];	
    var college_data = [];	
    var userName = '';	
    var userEmail = '';	
    if(req.body.type == 'incomplete'){	
        if(eventChecked){	
            models.User.find({	
                where:{	
                    id : user_id	
                }	
            }).then(function(user){	
                request.post(constant.BASE_URL_SENDGRID + 'transcriptRequiredMail', {	
                    json: {	
                        email : user.email,	
                        studentName : user.name + " " + user.surname,	
                        app_id : app_id,	
                        type : 'addToOnHold'	
                    }	
                }, function (error, response, body) {	
                    if(body.status == 200){	
                        models.Application.find({	
                            where : {	
                                id : app_id,	
                                user_id : user_id	
                            }	
                        }).then(function(app){	
                            app.update({	
                                transcriptRequiredMail : true	
                            }).then(function(updatedApp){	
                                var desc = updatedApp.id + " put on hold by " + req.User.email;	
                                var activity = "Note Updated";	
                                functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                                if(updatedApp.transcriptRequiredMail == true){	
                                    res.json({	
                                        status : 200,	
                                        transcriptRequiredMail : updatedApp.transcriptRequiredMail,	
                                        message : "Email sent to student"	
                                    })	
                                }else{	
                                    res.json({	
                                        status : 400,	
                                        transcriptRequiredMail : updatedApp.transcriptRequiredMail,	
                                        message : "Something Went Wrong."	
                                    })	
                                }	
                            })	
                        })	
                    }	
                    	
                })	
            })	
        }else{	
            models.Application.find({	
                where : {	
                    id : app_id,	
                    user_id : user_id	
                }	
            }).then(function(app){	
                var date = moment(new Date(app.created_at)).format("YYYY-MM-DD HH:MM:SS")	
                models.User_Transcript.getNewTranscript(user_id,date).then(function(userDocs){	
                    var notes = app.notes;	
                    userDocs.forEach(userDoc=>{	
                        models.College.find({	
                            where :{	
                            id : userDoc.collegeId 	
                            }	
                        }).then(function(college){	
                            college_data.push({	
                                id : college.id,	
                                name : college.name,	
                                email : college.emailId,	
                                alternateEmail : college.alternateEmailId	
                            })	
                            if(app.notes){	
                                var rmNote = college.name + ' confirmation OK'	
                                if(app.notes.includes(rmNote)){	
                                    notes = notes.replace(rmNote, '');	
                                }	
                            }	
                            models.User_Transcript.findAll({	
                                where : {	
                                    user_id : user_id,	
                                    collegeId : userDoc.collegeId	
                                }	
                            }).then(function(userTranscripts){	
                                models.User.find({	
                                    where : {	
                                        id : user_id	
                                    }	
                                }).then(function(user){	
                                    userName = user.name + ' ' + user.surname;	
                                    userEmail = user.email;	
                                    var singleCollege = {	
                                        user_id : user_id,	
                                        collegeName : college.name,	
                                        studentName : user.name + ' ' + user.surname,	
                                        college_id : college.id,	
                                        collegeEmail : college.emailId,	
                                        alternateEmail : college.alternateEmailId,	
                                        user_transcript : [],	
                                        user_markList : [],	
                                        app_id : app_id	
                                    }	
                                    userTranscripts.forEach(transcript=>{	
                                        singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+ user_id + "/" + urlencode(transcript.file_name)});	
                                    })	
                                    models.userMarkList.findAll({	
                                        where : {	
                                            user_id : user_id,	
                                            collegeId : userDoc.collegeId	
                                        }	
                                    }).then(function(userMarklists){	
                                        userMarklists.forEach(userMarklist=>{	
                                            models.UserMarklist_Upload.findAll({	
                                                where : {	
                                                    user_marklist_id : userMarklist.id	
                                                }	
                                            }).then(function(userMarkSheets){	
                                                if(userMarkSheets){	
                                                    userMarkSheets.forEach(markList=>{	
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});	
                                                    })	
                                                }    	
                                            })	
                                        })	
                                        	
                                    })	
                                    collegeData.push(singleCollege);	
                                })	
                            })	
                        })	
                    })	
                    setTimeout(()=>{	
                        app.update({	
                            transcriptRequiredMail : null,	
                            collegeConfirmation : null,	
                            notes : (notes) ? notes : null	
                        }).then(function(updatedApp){	
                            var desc = updatedApp.id + " removed from on hold and note is updated by " + req.User.email ;	
                            var activity = "Note Updated";	
                            functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                            if(updatedApp.transcriptRequiredMail == null){	
                                request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailShweta', {	
                                    json: {	
                                        collegeData : collegeData	
                                    }	
                                }, function (error, response, body) {	
                                    if(body.notSent.length > 0){	
                                        body.noteSent.forEach(data=>{	
                                            models.User_Transcript.updateSingleCollegeEmailStatus(user_id,data.college_id,null,'not sent');	
                                        })	
                                    }	
                                    body.data.forEach(msgId=>{	
                                        models.User_Transcript.updateSingleCollegeEmailStatus(user_id,msgId.college_id,msgId.msg_id,'sent');	
                                    }) 	
                                    request.post(constant.BASE_URL_SENDGRID + 'transcriptRequiredMail', {	
                                        json: {	
                                            email : userEmail,	
                                            studentName : userName,	
                                            app_id : app_id,	
                                            collegeData : college_data,	
                                            type : 'removeFromOnHold'	
                                        }	
                                    }, function (error, response, body) {	
                                    	
                                        res.json({	
                                            status : 200,	
                                            transcriptRequiredMail : updatedApp.transcriptRequiredMail,	
                                            message : "Email Sent to College for document verification and Student for confirmation"	
                                        })   	
                                   })  	
                                })	
                            }else{	
                                res.json({	
                                    status : 400,	
                                    transcriptRequiredMail : updatedApp.transcriptRequiredMail,	
                                    message : "Something Went Wrong"	
                                })	
                            }	
                        })	
    	
                    },1500)	
                })	
                	
            })	
        }	
    }else if(req.body.type == 'oldDocuments'){	
        if(eventChecked){	
            models.User.find({	
                where:{	
                    id : user_id	
                }	
            }).then(function(user){	
                request.post(constant.BASE_URL_SENDGRID + 'transcriptRequiredMail', {	
                    json: {	
                        email : user.email,	
                        studentName : user.name + " " + user.surname,	
                        app_id : app_id,	
                        type : 'oldDocuments'	
                    }	
                }, function (error, response, body) {	
                    if(body.status == 200){	
                        models.Application.find({	
                            where :{	
                                id : req.body.app_id	
                            }	
                        }).then(function(application){	
                            var notes;	
                            if(application.notes){	
                                notes = application.notes + " Document is older than 1 year.";	
                            }else{	
                                notes = "Document is older than 1 year.";	
                            }	
                            application.update({	
                                notes : notes,	
                                transcriptRequiredMail : true	
                            }).then(function(updatedApp){	
                                var desc = "Note of application " + updatedApp.id + " is updated by " + req.User.email;	
                                var activity = "Note Updated";	
                                functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                                if(updatedApp){	
                                    	
                                    res.json({	
                                        status : 200,	
                                        oldDocuments : true,	
                                        notes : updatedApp.notes,	
                                        message : "Email sent to student"	
                                    })	
                                }else{	
                                    res.json({	
                                        status : 400,	
                                        oldDocuments : false,	
                                        notes : updatedApp.notes,	
                                        message : "Something Went Wrong."	
                                    })	
                                }	
                            })	
                        })	
                    }	
                    	
                })	
            })	
        }else{	
            models.Application.find({	
                where :{	
                    id : req.body.app_id	
                }	
            }).then(function(application){	
                var notes = application.notes;	
                if(notes.includes("Document is older than 1 year.")){	
                   notes = notes.replace("Document is older than 1 year.", '');	
                }	
                application.update({	
                    notes : notes,	
                    transcriptRequiredMail : null	
                }).then(function(updatedApp){	
                    if(updatedApp){	
                        var desc = "Note of application " + updatedApp.id + " is updated by " + req.User.email;	
                        var activity = "Note Updated";	
                        functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                        res.json({	
                            status : 200,	
                            oldDocuments : false,	
                            notes : updatedApp.notes,	
                            message : "Done"	
                        })	
                    }else{	
                        res.json({	
                            status : 400,	
                            oldDocuments : true,	
                            notes : updatedApp.notes,	
                            message : "Something Went Wrong."	
                        })	
                    }	
                })	
            })	
        }	
    }else if(req.body.type == 'approved'){	
        if(eventChecked){	
            models.User.find({	
                where:{	
                    id : user_id	
                }	
            }).then(function(user){	
                request.post(constant.BASE_URL_SENDGRID + 'transcriptRequiredMail', {	
                    json: {	
                        email : user.email,	
                        studentName : user.name + " " + user.surname,	
                        app_id : app_id,	
                        type : 'approved'	
                    }	
                }, function (error, response, body) {	
                    if(body.status == 200){	
                        models.Application.find({	
                            where :{	
                                id : req.body.app_id	
                            }	
                        }).then(function(application){	
                            var notes;	
                            if(application.notes){	
                                notes = application.notes + " Transcripts approved.";	
                            }else{	
                                notes = "Transcripts approved.";	
                            }	
                            application.update({	
                                notes : notes 	
                            }).then(function(updatedApp){	
                                var desc = "Note of application " + updatedApp.id + " is updated by " + req.User.email;	
                        var activity = "Note Updated";	
                        functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                                if(updatedApp){	
                                    res.json({	
                                        status : 200,	
                                        approved : true,	
                                        notes : updatedApp.notes,	
                                        message : "Email sent to student"	
                                    })	
                                }else{	
                                    res.json({	
                                        status : 400,	
                                        approved : false,	
                                        notes : updatedApp.notes,	
                                        message : "Something Went Wrong."	
                                    })	
                                }	
                            })	
                        })	
                    }	
                    	
                })	
            })	
            	
        }else{	
            models.Application.find({	
                where :{	
                    id : req.body.app_id	
                }	
            }).then(function(application){	
                var notes = application.notes;	
                if(notes.includes("Transcripts approved.")){	
                   notes = notes.replace("Transcripts approved.", '');	
                }	
                application.update({	
                    notes : notes 	
                }).then(function(updatedApp){	
                    var desc = "Note of application " + updatedApp.id + " is updated by " + req.User.email;	
                    var activity = "Note Updated";	
                    functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                    if(updatedApp){	
                       	
                        res.json({	
                            status : 200,	
                            approved : false,	
                            notes : updatedApp.notes,	
                            message : "Done"	
                        })	
                    }else{	
                        res.json({	
                            status : 400,	
                            approved : true,	
                            notes : updatedApp.notes,	
                            message : "Something Went Wrong."	
                        })	
                    }	
                })	
            })	
        }	
    }else if(req.body.type == 'partialApproved'){	
        if(!eventChecked){	
            models.Application.find({	
                where :{	
                    id : req.body.app_id	
                }	
            }).then(function(application){	
                var notes = application.notes;	
                if(notes.includes("Partial Transcripts")){	
                   notes = notes.replace("Partial Transcripts", '');	
                }	
                application.update({	
                    notes : notes,	
                    transcriptRequiredMail : null	
                }).then(function(updatedApp){	
                    var desc = "Note of application " + updatedApp.id + " is updated by " + req.User.email;	
                    var activity = "Note Updated";	
                    functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                    if(updatedApp){	
                       	
                        res.json({	
                            status : 200,	
                            partialApproved : false,	
                            notes : updatedApp.notes,	
                            message : "Done"	
                        })	
                    }else{	
                        res.json({	
                            status : 400,	
                            partialApproved : true,	
                            notes : updatedApp.notes,	
                            message : "Something Went Wrong."	
                        })	
                    }	
                })	
            })	
        }	
    }	
})

router.post('/convocationDecision',middlewares.getUserInfo,function(req,res){
    console.log('/convocationDecision')
    var user_id = req.body.user_id;	
    var app_id = req.body.app_id;	
    var eventChecked = req.body.eventChecked;	
    var collegeData = [];	
    var college_data = [];	
    var userName = '';	
    var userEmail = '';	
    if(req.body.type == 'convo_notApproved'){	
        if(eventChecked){	
            models.User.find({	
                where:{	
                    id : user_id	
                }	
            }).then(function(user){	
                request.post(constant.BASE_URL_SENDGRID + 'convocationDecisionMail', {	
                    json: {	
                        email : user.email,	
                        studentName : user.name + " " + user.surname,	
                        app_id : app_id,	
                        type : 'convo_notApproved'	
                    }	
                }, function (error, response, body) {	
                   if(body.status == 200){	
                        models.Application.find({	
                            where : {	
                                id : app_id,	
                                user_id : user_id	
                            }	
                        }).then(function(app){	
                            var notes;	
                            var data;	
                            if(req.body.name != '') {
                                data = `${req.body.name} is not approved.`;              	    
                            }else{
                                data = `Convocation is not uploaded`
                            }
                
                            if(app.notes){
                                notes = app.notes + " " + data;	
                                notes=data;
                            }else{	
                                notes = data;
                            }	
                            app.update({
                                notes: notes,
                                transcriptRequiredMail : true
                            }).then(function(updatedApp){	
                                if(updatedApp){	
                                    var desc = data + " for application " + updatedApp.id + ". Note updated by " + req.User.email;	
                                    var activity = "Note Updated";	
                                    functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                                	res.json({	
                                        status : 200,	
                                        convo_notApproved : true,	
                                        notes : updatedApp.notes,	
                                        message : "Email sent to student"	
                                    })	
                                }else{	
                                    res.json({	
                                        status : 400,	
                                        convo_notApproved : false,	
                                        notes : updatedApp.notes,	
                                        message : "Something Went Wrong."	
                                    })	
                                }	
                            })	
                        })	
                    }	
                })	
            })	
        }else{	
            models.Application.find({	
                where :{	
                    id : req.body.app_id	
                }	
            }).then(function(application){	
                var notes = application.notes;	
                if(req.body.name != ''){
                    data = `${req.body.name} is not approved.`;              	    
                }else{
                    data = `Convocation is not uploaded`;
                }
        
                if(notes.includes(data)){	
                   notes = notes.replace(data, '');	
                }	
                application.update({	
                    notes : notes,
                    transcriptRequiredMail : null 	
                }).then(function(updatedApp){	
                    if(updatedApp){	
                        var desc = "Note of application " + updatedApp.id + " is updated by " + req.User.email;	
                        var activity = "Note Updated";	
                        functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                        res.json({	
                            status : 200,	
                            convo_notApproved : false,	
                            notes : updatedApp.notes,	
                            message : "Email sent to student"	
                        })	
                    }else{	
                        res.json({	
                            status : 400,	
                            convo_notApproved : true,	
                            notes : updatedApp.notes,	
                            message : "Something Went Wrong."	
                        })	
                    }	
                })	
            })	
        }	
    }else if(req.body.type == 'convo_approved'){	
        if(eventChecked){	
            models.User.find({	
                where:{	
                    id : user_id	
                }	
            }).then(function(user){	
                request.post(constant.BASE_URL_SENDGRID + 'convocationDecisionMail', {	
                    json: {	
                        email : user.email,	
                        studentName : user.name + " " + user.surname,	
                        app_id : app_id,	
                        type : 'convo_approved'	
                    }	
                },
                 function (error, response, body) {	
                    if(body.status == 200){	
                        models.Application.find({	
                            where :{	
                                id : req.body.app_id	
                            }	
                        }).then(function(application){	
                            var notes;	
                            if(req.body.name != ''){
                                data = `${req.body.name} is approved.`;	
                            }
                            	
                            if(application.notes){	
                                notes = application.notes + " " + data;	
                                notes=data
                            }else{	
                                notes = data;	
                            }	
                            application.update({	
                                notes : notes, 	
                                transcriptRequiredMail : null
                            }).then(function(updatedApp){	
                                var desc = data + " for application " + updatedApp.id + " and note updated by " + req.User.email;	
                                var activity = "Note Updated";	
                                functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                                if(updatedApp){	
                                    	
                                    res.json({	
                                        status : 200,	
                                        convo_approved : true,	
                                        notes : null,
                                        notes : updatedApp.notes,	
                                        message : "Email sent to student"	
                                    })	
                                }else{	
                                    res.json({	
                                        status : 400,	
                                        convo_approved : false,	
                                        notes : updatedApp.notes,	
                                        message : "Something Went Wrong."	
                                    })	
                                }	
                            })	
                        })	
                    }	
                })
         	})	
        }else{	
            models.Application.find({	
                where :{	
                    id : req.body.app_id	
                }	
            }).then(function(application){	
                var notes = application.notes;	
                if(req.body.name != ''){
                    data = ` ${req.body.name} is approved.`;	
                }
                	
                if(notes.includes(data)){	
                   notes = notes.replace(data, '');	
                }	
                application.update({	
                    notes : notes,
                    transcriptRequiredMail : null
                }).then(function(updatedApp){	
                    if(updatedApp){	
                        var desc = "Note of application " + updatedApp.id + " is updated by " + req.User.email;	
                        var activity = "Note Updated";	
                        functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                        res.json({	
                            status : 200,	
                            convo_approved : false,	
                            notes : updatedApp.notes,	
                            message : "Done"	
                        })	
                    }else{	
                        res.json({	
                            status : 400,	
                            convo_approved : true,	
                            notes : updatedApp.notes,	
                            message : "Done."	
                        })	
                    }	
                })	
            })	
        }	
    }else if(req.body.type == 'degreeCertificate'){	
        if(eventChecked){	
            models.User.find({	
                where:{	
                    id : user_id	
                }	
            }).then(function(user){	
                request.post(constant.BASE_URL_SENDGRID + 'convocationDecisionMail', {	
                    json: {	
                        email : user.email,	
                        studentName : user.name + " " + user.surname,	
                        app_id : app_id,	
                        type : 'degreeCertificate'	
                    }	
                }, function (error, response, body) {	
                    if(body.status == 200){	
                        models.Application.find({	
                            where :{	
                                id : req.body.app_id	
                            }	
                        }).then(function(application){	
                            var notes;	
                            if(req.body.name != ''){	
                                 data = `In place of ${req.body.name} you have uploaded degree certificate.`;	
                            }else{	
                                data = `In place of ${req.body.name} you have uploaded degree certificate.`;	
                            }	
                            if(application.notes){	
                                notes = application.notes + " " + data;	
                                notes=data;
                            }else{	
                                notes = data;	
                            }	
                            application.update({	
                                notes : notes, 
                                transcriptRequiredMail : true
                            }).then(function(updatedApp){	
                                var desc = data + " for application " + updatedApp.id + " and note updated by " + req.User.email;	
                                var activity = "Note Updated";	
                                functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                                if(updatedApp){	
                                    res.json({	
                                        status : 200,	
                                        degreeCertificate : true,
                                        notes : updatedApp.notes,	
                                        message : "Email sent to student"	
                                    })	
                                }else{	
                                    res.json({	
                                        status : 400,	
                                        degreeCertificate : false,	
                                        notes : updatedApp.notes,	
                                        message : "Something Went Wrong."	
                                    })	
                                }	
                            })	
                        })	
                    }	
                })	
            })	
        }else{	
            models.Application.find({	
                where :{	
                    id : req.body.app_id	
                }	
            }).then(function(application){	
                var notes = application.notes;	
                if(req.body.name != ''){	
                    data = `In place of ${req.body.name} you have uploaded degree certificate.`;	
                        
                }else{	
                    data = `In place of ${req.body.name} you have uploaded degree certificate.`;	
                }	
                if(notes.includes(data)){	
                    notes = notes.replace(data, '');	
                }	
                application.update({	
                    notes : notes,
                    transcriptRequiredMail : null	
                }).then(function(updatedApp){	
                    var desc = "Note of application " + updatedApp.id + " is updated by " + req.User.email;	
                    var activity = "Note Updated";	
                    functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                    if(updatedApp){	
                        
                        res.json({	
                            status : 200,	
                            degreeCertificate : false,	
                            notes : updatedApp.notes,	
                            message : "Done"	
                        })	
                    }else{	
                        res.json({	
                            status : 400,	
                            degreeCertificate : true,	
                            notes : updatedApp.notes,	
                            message : "Something Went Wrong."	
                        })	
                    }	
                })	
            })	
        }	
    }	
})	

router.post('/marksheetsRequired',middlewares.getUserInfo,function(req,res){	
    var user_id = req.body.user_id;	
    var app_id = req.body.app_id;	
    var eventChecked = req.body.eventChecked;	
    var collegeData = [];	
    var college_data = [];	
    var userName = '';	
    var userEmail = '';	
    if(req.body.type == 'marksheet_incomplete'){	
        if(!eventChecked){	
            models.Application.find({	
                where :{	
                    id : req.body.app_id	
                }	
            }).then(function(application){	
                var notes = application.notes;	
                if(notes.includes("Marksheet incomplete")){	
                   notes = notes.replace("Marksheet incomplete", '');	
                }	
                application.update({	
                    notes : notes 	
                }).then(function(updatedApp){	
                    if(updatedApp){	
                        var desc = "Note of application " + updatedApp.id + " is updated by " + req.User.email;	
                        var activity = "Note Updated";	
                        functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                        res.json({	
                            status : 200,	
                            marksheet_incomplete : false,	
                            notes : updatedApp.notes,	
                            message : "Done"	
                        })	
                    }else{	
                        res.json({	
                            status : 400,	
                            marksheet_incomplete : true,	
                            notes : updatedApp.notes,	
                            message : "Something Went Wrong."	
                        })	
                    }	
                })	
            })	
        }	
    }else if(req.body.type == 'marksheet_complete'){	
        if(eventChecked){	
            models.User.find({	
                where:{	
                    id : user_id	
                }	
            }).then(function(user){	
                request.post(constant.BASE_URL_SENDGRID + 'MarksheetRequiredMail', {	
                    json: {	
                        email : user.email,	
                        studentName : user.name + " " + user.surname,	
                        app_id : app_id,	
                        type : 'marksheet_complete'	
                    }	
                }, function (error, response, body) {	
                    if(body.status == 200){	
                        models.Application.find({	
                            where :{	
                                id : req.body.app_id	
                            }	
                        }).then(function(application){	
                            var notes;	
                            if(application.notes){	
                                notes = application.notes + " Marksheets Approved.";	
                            }else{	
                                notes = "Marksheets Approved.";	
                            }	
                            application.update({	
                                notes : notes 	
                            }).then(function(updatedApp){	
                                var desc = "Marksheets Approved for application " + updatedApp.id + " and note updated by " + req.User.email;	
                                var activity = "Note Updated";	
                                functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                                if(updatedApp){	
                                    	
                                    res.json({	
                                        status : 200,	
                                        marksheet_complete : true,	
                                        notes : updatedApp.notes,	
                                        message : "Email sent to student"	
                                    })	
                                }else{	
                                    res.json({	
                                        status : 400,	
                                        marksheet_complete : false,	
                                        notes : updatedApp.notes,	
                                        message : "Something Went Wrong."	
                                    })	
                                }	
                            })	
                        })	
                    }	
                    	
                })	
            })	
        }else{	
            models.Application.find({	
                where :{	
                    id : req.body.app_id	
                }	
            }).then(function(application){	
                var notes = application.notes;	
                if(notes.includes("Marksheets Approved.")){	
                   notes = notes.replace("Marksheets Approved.", '');	
                }	
                application.update({	
                    notes : notes 	
                }).then(function(updatedApp){	
                    if(updatedApp){	
                        var desc = "Note of application " + updatedApp.id + " is updated by " + req.User.email;	
                        var activity = "Note Updated";	
                        functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                        res.json({	
                            status : 200,	
                            marksheet_complete : false,	
                            notes : updatedApp.notes,	
                            message : "Done"	
                        })	
                    }else{	
                        res.json({	
                            status : 400,	
                            marksheet_complete : true,	
                            notes : updatedApp.notes,	
                            message : "Somethinf went wrong."	
                        })	
                    }	
                })	
            })	
        }	
    }	
})	
router.post('/SetAppId',middlewares.getUserInfo,function(req,res){	
    var user_id = req.body.user_id;	
    var app_id = req.body.app_id;	
    var type = req.body.type;
    if(type == 'NameChangeLetter'){
        models.Letterfor_NameChange.update({
                    app_id :  app_id
        }, {
            where: {
                user_id : user_id,
                app_id :{
                    [Op.eq] : null
                }
            }
        }).then(function (data) {
                if(data.length  > 0){
                        res.json({
                            status :  200
                        })
                }else{
                    res.json({
                        status :  400
                    })
                }
        })
    }else if(type == 'Hrd'){
        models.Hrd_details.update({
                    app_id :  app_id,
                    verification_type : 'Marksheets, Transcripts and Degree Certificate'
        }, {
            where: {
                user_id : user_id,
                app_id :{
                    [Op.eq] : null
                }
            }
        }).then(function (data) {
                if(data.length  > 0){
                        res.json({
                            status :  200
                        })
                }else{
                    res.json({
                        status :  400
                    })
                }
        })
    }
   
})	

router.post('/updateNoteAndApplication',middlewares.getUserInfo,function(req,res){	
    var user_id = req.body.user_id;	
    var app_id = req.body.app_id;	
    var eventChecked = req.body.eventChecked;	
    var collegeData = [];	
    var college_data = [];	
    var userName = '';	
    var userEmail = '';	
    if(req.body.type == 'marksheet_incomplete'){	
        if(eventChecked){	
            models.User.find({	
                where:{	
                    id : user_id	
                }	
            }).then(function(user){	
                request.post(constant.BASE_URL_SENDGRID + 'MarksheetRequiredMail', {	
                    json: {	
                        email : user.email,	
                        studentName : user.name + " " + user.surname,	
                        app_id : app_id,	
                        note : req.body.note,	
                        type : 'marksheet_incomplete'	
                    }	
                }, function (error, response, body) {	
                    if(body.status == 200){	
                        models.Application.find({	
                            where : {	
                                id : app_id,	
                                user_id : user_id	
                            }	
                        }).then(function(app){	
                            var notes;	
                            if(app.notes){	
                                notes = app.notes + " Marksheet incomplete " + req.body.note;	
                            }else{	
                                notes = "Marksheet incomplete " + req.body.note;	
                            }	
                            app.update({	
                                notes: notes	
                            }).then(function(updatedApp){	
                                if(updatedApp){	
                                    var desc = "Marksheets is not approved for application " + updatedApp.id + ". Note updated by " + req.User.email;	
                                    var activity = "Note Updated";	
                                    functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                                	
                                    res.json({	
                                        status : 200,	
                                        marksheet_incomplete : true,	
                                        notes : updatedApp.notes,	
                                        message : "Email sent to student"	
                                    })	
                                }else{	
                                    res.json({	
                                        status : 400,	
                                        marksheet_incomplete : false,	
                                        notes : updatedApp.notes,	
                                        message : "Something Went Wrong."	
                                    })	
                                }	
                            })	
                        })	
                    }	
                    	
                })	
            })	
        }	
    }else if(req.body.type == 'partialApproved'){	
        if(eventChecked){	
            models.User.find({	
                where:{	
                    id : user_id	
                }	
            }).then(function(user){	
                request.post(constant.BASE_URL_SENDGRID + 'transcriptRequiredMail', {	
                    json: {	
                        email : user.email,	
                        studentName : user.name + " " + user.surname,	
                        app_id : app_id,	
                        note : req.body.note,	
                        type : 'partial approved'	
                    }	
                }, function (error, response, body) {	
                    if(body.status == 200){	
                        models.Application.find({	
                            where :{	
                                id : req.body.app_id	
                            }	
                        }).then(function(application){	
                            var notes;	
                            if(application.notes){	
                                notes = application.notes + " Partial Transcripts " + req.body.note;	
                            }else{	
                                notes = "Partial Transcripts " + req.body.note;	
                            }	
                            application.update({	
                                notes : notes, 	
                                transcriptRequiredMail : true	
                            }).then(function(updatedApp){	
                                var desc = "Partial Transcripts Approved for application " + updatedApp.id + " and note updated by " + req.User.email;	
                                var activity = "Note Updated";	
                                functions.activitylog(updatedApp.user_id, activity, desc, updatedApp.id);	
                                if(updatedApp){	
                                    	
                                    res.json({	
                                        status : 200,	
                                        marksheet_complete : true,	
                                        notes : updatedApp.notes,	
                                        message : "Email sent to student"	
                                    })	
                                }else{	
                                    res.json({	
                                        status : 400,	
                                        marksheet_complete : false,	
                                        notes : updatedApp.notes,	
                                        message : "Something Went Wrong."	
                                    })	
                                }	
                            })	
                        })	
                    }	
                    	
                })	
            })	
        }	
    }	
})	

router.post('/setCollegeConfirmation',middlewares.getUserInfo,function(req,res){
   var app_id = req.body.app_id;
    var eventChecked = req.body.eventChecked;
    if(eventChecked){
        models.Application.find({
            where : {
                id : app_id
            }
        }).then(function(application){
            application.update({
                collegeConfirmation : true
            }).then(function(updatedApp){
                if(updatedApp.collegeConfirmation == true){
                    res.json({
                        status : 200,
                        collegeConfirmation : updatedApp.collegeConfirmation
                    })
                }else{
                    res.json({
                        status : 400,
                        collegeConfirmation : updatedApp.collegeConfirmation
                    })  
                }
            })
        })
    }else{
        models.Application.find({
            where : {
                id : app_id
            }
        }).then(function(application){
            application.update({
                collegeConfirmation : null
            }).then(function(updatedApp){
                if(updatedApp.collegeConfirmation == null){
                    res.json({
                        status : 200,
                        collegeConfirmation : updatedApp.collegeConfirmation
                    })
                }else{
                    res.json({
                        status : 400,
                        collegeConfirmation : updatedApp.collegeConfirmation
                    })  
                }
            })
        })
    }
})

router.get('/adminDashboard/getPurposeDetails1', function(req,res){
    var data = [];
    if(req.query.app_id == 'null'){
        models.Institution_details.findAll({
            where:{
                user_id : req.query.userId
            }
        }).then(function(institutionDetails){
            institutionDetails.forEach(function(detail){
                var email;
                if(detail.OtherEmail)
                    email = detail.email + ', ' + detail.OtherEmail;
                else
                   email = detail.email;
                var referenceNo;
                if(detail.type == 'study')
                    referenceNo = detail.studyrefno;
                if(detail.type == 'employment')
                    referenceNo = detail.emprefno;
                if(detail.type == 'IQAS')
                    referenceNo = detail.iqasno;
                if(detail.type == 'CES')
                    referenceNo = detail.cesno;
                if(detail.type == 'ICAS')
                    referenceNo = detail.icasno;
                if(detail.type == 'visa')
                    referenceNo = detail.visarefno;
                if(detail.type == 'MYIEE')
                    referenceNo = detail.myieeno;
                if(detail.type == 'ICES')
                    referenceNo = detail.icesno;
                if(detail.type == 'NASBA')
                    referenceNo = detail.nasbano;
                if(detail.type == 'Educational Perspective')
                    referenceNo = detail.eduperno;
                if(detail.type == 'NCEES')
                    referenceNo = detail.nceesno;
                if(detail.type == 'NARIC')
                    referenceNo = detail.naricno;
                if(detail.type == 'Educational credential evaluators WES')
                    referenceNo = detail.wesno;
                if(detail.type == 'others')
                    referenceNo = detail.otheraccno;
                if(detail.type == 'National Committee on Accreditation')
                    referenceNo = detail.ncano;
                data.push({
                    id : detail.id,
                    university_name : detail.university_name,
                    email : email,
                    country_name : detail.country_name,
                    contact_number : detail.contact_number,
                    contact_person : detail.contact_person,
                    type : detail.type,
                    address : detail.address,
                    landmark : detail.landmark,
                    pincode : detail.pincode,
                    reference_no : referenceNo,
                    emailAsWes : detail.emailAsWes,
                    nameaswes:detail.nameaswes,
                    lastnameaswes:detail.lastnameaswes 
                })
            });
            if(data.length == institutionDetails.length){
                res.json({
                    status : 200,
                    data : data
                });
            }
        })
    }else{
        models.Institution_details.findAll({
            where:{
                user_id : req.query.userId,
                app_id : req.query.app_id   
            }
        }).then(function(institutionDetails){
             institutionDetails.forEach(function(detail){
                var email;
                if(detail.OtherEmail)
                    email = detail.email + ', ' + detail.OtherEmail;
                else
                   email = detail.email;
                var referenceNo;
                if(detail.type == 'study')
                    referenceNo = detail.studyrefno;
                if(detail.type == 'employment')
                    referenceNo = detail.emprefno;
                if(detail.type == 'IQAS')
                    referenceNo = detail.iqasno;
                if(detail.type == 'CES')
                    referenceNo = detail.cesno;
                if(detail.type == 'ICAS')
                    referenceNo = detail.icasno;
                if(detail.type == 'visa')
                    referenceNo = detail.visarefno;
                if(detail.type == 'MYIEE')
                    referenceNo = detail.myieeno;
                if(detail.type == 'ICES')
                    referenceNo = detail.icesno;
                if(detail.type == 'NASBA')
                    referenceNo = detail.nasbano;
                if(detail.type == 'Educational Perspective')
                    referenceNo = detail.eduperno;
                if(detail.type == 'NCEES')
                    referenceNo = detail.nceesno;
                if(detail.type == 'NARIC')
                    referenceNo = detail.naricno;
                if(detail.type == 'Educational credential evaluators WES')
                    referenceNo = detail.wesno;
                if(detail.type == 'others')
                    referenceNo = detail.otheraccno;
                if(detail.type == 'National Committee on Accreditation')
                    referenceNo = detail.ncano;
                data.push({
                    id : detail.id,
                    university_name : detail.university_name,
                    email : email,
                    country_name : detail.country_name,
                    contact_number : detail.contact_number,
                    contact_person : detail.contact_person,
                    type : detail.type,
                    address : detail.address,
                    landmark : detail.landmark,
                    pincode : detail.pincode,
                    reference_no : referenceNo,
                    emailAsWes : detail.emailAsWes,
                    nameaswes:detail.nameaswes,
                    lastnameaswes:detail.lastnameaswes 
                })
            });
            
            if(data.length == institutionDetails.length){
                res.json({
                    status : 200,
                    data : data
                });
            }
        })
    }
});

router.get('/adminDashboard/appWiseDocs', function(req, res) {

    console.log("/adminDashboard/appWiseDocs");
    var studentObj = {
        userMarkLists:[],
        userTranscripts: [],
        userCurriculums:[],
        userExtraDocument :[],
        letters :[],
        usercompetencys:[],
        letterfornamechange:[]
    };
    var errors = [];
     
    var userId = req.query.userId;
    var appID =  req.query.app_id;

    var userEmail = '';
    if(isNaN(userId)) {
        errors.push({
            message: "User id is required"
        });
        res.json({
            status: 400,
            data: errors
        });
    }else {
        models.User.find({
            where:{
                id : userId
            }
        }).then(function(user){
            userEmail = user.email;
            models.User_Transcript.findAll({
                where:  {
                    user_id : userId
                }
            }).then(function(userTranscripts) {
                models.userMarkList.find({
                    where:{
                        user_id : userId
                    }
                }).then(function(userMarkLists){
                    models.competency_letter.findAll({
                        where :{
                            user_id : userId
                        }
                    }).then(function(usercompetencys){
                    
                    models.User_Curriculum.findAll({
                        where:{
                            user_id : userId
                        }
                    }).then(function(usercurriculums){
                        models.GradeToPercentageLetter.findAll({
                            where:{
                                user_id : userId
                            }
                        }).then(function(letterData){

                            models.Letterfor_NameChange.findAll({
                                where :{
                                    user_id : userId
                                }
                            }).then(function(Letterfor_NameChange){ 

                            models.Application.find({	
                                where : {	
                                    id :appID	
                                }	
                            }).then(function(app){
                            if(userMarkLists!=undefined || userMarkLists!='' || userMarkLists!='null' || userMarkLists!=null){
                                    models.UserMarklist_Upload.getMarksheetData(userMarkLists.user_id).then(function(marklistData){
                                    marklistData.forEach(function(allMarklistData){
                                        var app_ids = [];
                                      
                                        if(allMarklistData.app_id != undefined || allMarklistData.app_id != null){
                                            app_ids  = allMarklistData.app_id.split(',');
                                        }
                                        for(var i=0;i<app_ids.length;i++){
                                        
                                            if(appID == app_ids[i]){
                                        
                                                
                                                if((allMarklistData.file_name!='null' && allMarklistData.file_name!=null && allMarklistData.file_name!='' ) && (allMarklistData.usermarklist_file_name ==null || allMarklistData.usermarklist_file_name =='')){
                                                    var imgArr = allMarklistData.file_name.split('.');
                                                    var extension = imgArr[imgArr.length - 1].trim(); 
                                                } else if((allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='')){
                                                        var imgArr1 = allMarklistData.usermarklist_file_name.split('.');
                                                        var extension = imgArr1[imgArr1.length - 1].trim(); 

                                                }else if((allMarklistData.file_name!='null' && allMarklistData.file_name!=null && allMarklistData.file_name!='') && (allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='')){
                                                    var imgArr = allMarklistData.file_name.split('.');
                                                    var extension = imgArr[imgArr.length - 1].trim(); 

                                                    var imgArr1 = allMarklistData.usermarklist_file_name.split('.');
                                                    var extension1 = imgArr1[imgArr1.length - 1].trim(); 
                                                }
                                                if(allMarklistData.collegeId != 0 && allMarklistData.collegeId != null){
                                                    models.College.find({
                                                        where:{
                                                            id : allMarklistData.collegeId
                                                        }
                                                    }).then(function(college){
                                                        if((allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='') && (allMarklistData.usermarklist_file_name==null || allMarklistData.usermarklist_file_name=='')){
                                                        studentObj.userMarkLists.push({
                                                            id: allMarklistData.id,
                                                            //userMarklistId: usermarks.id,
                                                            name: allMarklistData.name,
                                                            user_id: allMarklistData.user_id ,
                                                            image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                            file_name: allMarklistData.file_name ,
                                                            file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                            timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                            updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                            transcript_lock: allMarklistData.lock_transcript ,
                                                            education_type:allMarklistData.education_type ,
                                                            extension : extension ,
                                                            email : user.email,
                                                            collegeName : college.name
                                                        });
                                                    }else if((allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='' )){
                                                        studentObj.userMarkLists.push({
                                                            id: allMarklistData.usermarklist_id,
                                                            //userMarklistId: usermarks.id,
                                                            name: allMarklistData.usermarklist_name,
                                                            user_id: allMarklistData.usermarklist_user_id ,
                                                            image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                            file_name: allMarklistData.usermarklist_file_name ,
                                                            file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                            timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                                            transcript_lock: allMarklistData.user_lock_marklist ,
                                                            education_type:allMarklistData.type ,
                                                            extension : extension ,
                                                            email : user.email,
                                                            collegeName : college.name
                                                        });
                                                    }else if(allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='' && allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!=''){
                                                        studentObj.userMarkLists.push({
                                                            id: allMarklistData.id,
                                                            //userMarklistId: usermarks.id,
                                                            name: allMarklistData.name,
                                                            user_id: allMarklistData.user_id ,
                                                            image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                            file_name: allMarklistData.file_name ,
                                                            file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                            timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                            updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                            transcript_lock: allMarklistData.lock_transcript ,
                                                            education_type:allMarklistData.education_type ,
                                                            extension : extension ,
                                                            email : user.email,
                                                            collegeName : college.name
                                                        });

                                                        // studentObj.userMarkLists.push({
                                                        //     id: allMarklistData.usermarklist_id,
                                                        //     //userMarklistId: usermarks.id,
                                                        //     name: allMarklistData.usermarklist_name,
                                                        //     user_id: allMarklistData.usermarklist_user_id ,
                                                        //     image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                        //     file_name: allMarklistData.usermarklist_file_name ,
                                                        //     file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                        //     timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                                        //     transcript_lock: allMarklistData.user_lock_marklist ,
                                                        //     education_type:allMarklistData.type ,
                                                        //     extension : extension1 ,
                                                        //     email : user.email,
                                                        //     collegeName : college.name
                                                        // });

                                                    }
                                                    })
                                                
                                                }else{
                                                    if((allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='') && (allMarklistData.usermarklist_file_name==null || allMarklistData.usermarklist_file_name=='')){
                                                    studentObj.userMarkLists.push({
                                                            id: allMarklistData.id ? allMarklistData.usermarklist_id : '',
                                                            name: allMarklistData.name,
                                                        // userMarklistId: userMarks.id,
                                                            user_id: allMarklistData.user_id,
                                                            image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.file_name,
                                                            file_name: allMarklistData.file_name,
                                                            file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.file_name,
                                                            timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                            updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                            transcript_lock: allMarklistData.lock_transcript,
                                                            education_type:allMarklistData.education_type,
                                                            extension :extension,
                                                            email : user.email,
                                                            collegeName : ''
                                                        });
                                                    }else if((allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='')){
                                                        studentObj.userMarkLists.push({
                                                            id: allMarklistData.usermarklist_id,
                                                            //userMarklistId: usermarks.id,
                                                            name: allMarklistData.usermarklist_name,
                                                            user_id: allMarklistData.usermarklist_user_id ,
                                                            image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                            file_name: allMarklistData.usermarklist_file_name ,
                                                            file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                            timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                                            updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                            transcript_lock: allMarklistData.user_lock_marklist ,
                                                            education_type:allMarklistData.type ,
                                                            extension : extension ,
                                                            email : user.email,
                                                            collegeName : college.name
                                                        });

                                                    }else if(allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='' && allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!=''){
                                                        studentObj.userMarkLists.push({
                                                            id: allMarklistData.id,
                                                            //userMarklistId: usermarks.id,
                                                            name: allMarklistData.name,
                                                            user_id: allMarklistData.user_id ,
                                                            image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                            file_name: allMarklistData.file_name ,
                                                            file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.file_name ,
                                                            timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                            updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                            transcript_lock: allMarklistData.lock_transcript ,
                                                            education_type:allMarklistData.education_type ,
                                                            extension : extension ,
                                                            email : user.email,
                                                            collegeName : college.name
                                                        });

                                                        // studentObj.userMarkLists.push({
                                                        //     id: allMarklistData.usermarklist_id,
                                                        //     //userMarklistId: usermarks.id,
                                                        //     name: allMarklistData.usermarklist_name,
                                                        //     user_id: allMarklistData.usermarklist_user_id ,
                                                        //     image: constant.BASE_URL+"/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                        //     file_name: allMarklistData.usermarklist_file_name ,
                                                        //     file_path: constant.FILE_LOCATION+"public/upload/marklist/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                        //     timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                                        //     transcript_lock: allMarklistData.user_lock_marklist ,
                                                        //     education_type:allMarklistData.type ,
                                                        //     extension : extension1 ,
                                                        //     email : user.email,
                                                        //     collegeName : college.name
                                                        // });
                                                    }
                                                } 

                                            }
                                        }
                                })
                                })
                            }
                            if(userTranscripts && userTranscripts.length > 0) {
                                userTranscripts.forEach(function(userTranscript) {
                                    if(userTranscript.type.includes('transcripts')){
                                        var app_ids= [];

                                        if(userTranscript.app_id != undefined || userTranscript.app_id != null){
                                            app_ids  = userTranscript.app_id.split(',');
                                        }
                                        for(var i=0;i<app_ids.length;i++){
                                            if(appID == app_ids[i]){
                                                var imgArr = userTranscript.file_name.split('.');
                                                var extension = imgArr[imgArr.length - 1].trim();
                                                var convo_notApproved = false;	
                                                var convo_approved = false;	
                                                var degreeCertificate = false;	
                                               
                                                if(app.notes){	
                                                    if(app.notes.includes(`In place of ${userTranscript.name} you have uploaded degree certificate.`)){	
                                                        degreeCertificate = true;         	
                                                    }	
                                                    if(app.notes.includes(`${userTranscript.name} is not approved.`)){	
                                                        convo_notApproved = true;	
                                                    }	
                                                    
                                                    	
                                                    if(app.notes.includes(`${userTranscript.name} is approved.`)){	
                                                        convo_approved = true;	
                                                    }	
                                                   
                                                }
                                                if(userTranscript.collegeId != 0 && userTranscript.collegeId != null){
                                                    models.College.find({
                                                        where:{
                                                            id : userTranscript.collegeId
                                                        }
                                                    }).then(function(college){
                                                        studentObj.userTranscripts.push({
                                                            id: userTranscript.id,
                                                            name: userTranscript.name,
                                                            user_id: userTranscript.user_id,
                                                            image: constant.BASE_URL+"/upload/transcript/"+userId+'/'+userTranscript.file_name,
                                                            file_name: userTranscript.file_name,
                                                            file_path: constant.FILE_LOCATION+"public/upload/transcript/"+userId+'/'+userTranscript.file_name,
                                                            timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                            updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                            transcript_lock: userTranscript.lock_transcript,
                                                            extension :extension,
                                                            email : user.email,
                                                            collegeName : college.name,	
                                                            convo_notApproved : convo_notApproved,	
                                                            convo_approved :convo_approved,	
                                                            degreeCertificate : degreeCertificate
                                                        });
                                                    });
                                                }else{
                                                    studentObj.userTranscripts.push({
                                                        id: userTranscript.id,
                                                        name: userTranscript.name,
                                                        user_id: userTranscript.user_id,
                                                        image: constant.BASE_URL+"/upload/transcript/"+userId+'/'+userTranscript.file_name,
                                                        file_name: userTranscript.file_name,
                                                        file_path: constant.FILE_LOCATION+"public/upload/transcript/"+userId+'/'+userTranscript.file_name,
                                                        timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                        updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                        transcript_lock: userTranscript.lock_transcript,
                                                        extension :extension,
                                                        email : user.email,
                                                        collegeName : '',	
                                                        convo_notApproved : convo_notApproved,	
                                                        convo_approved :convo_approved,	
                                                        degreeCertificate : degreeCertificate
                                                    });
                                                }
                                            }
                                        }
                                    }else{
                                        studentObj.userExtraDocument.push({
                                            id: userTranscript.id,
                                            name: userTranscript.name,
                                            user_id: userTranscript.user_id,
                                            image: constant.BASE_URL+"/upload/transcript/"+userId+'/'+userTranscript.file_name,
                                            file_name: userTranscript.file_name,
                                            file_path: constant.FILE_LOCATION+"public/upload/transcript/"+userId+'/'+userTranscript.file_name,
                                            timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                                            updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                            transcript_lock: userTranscript.lock_transcript,
                                            extension :extension,
                                            email : user.email
                                        });
                                    }
                                });
                            }

                            if(usercurriculums && usercurriculums.length > 0){
                                usercurriculums.forEach(function(usercurriculum) {
                                    var app_ids= [];
                                    if(usercurriculum.app_id != undefined || usercurriculum.app_id != null){
                                        app_ids  = usercurriculum.app_id.split(',');
                                    }
                                    for(var i=0;i<app_ids.length;i++){
                                        if(appID == app_ids[i]){
                                    var imgArr = usercurriculum.file_name.split('.');
                                    var extension = imgArr[imgArr.length - 1].trim();
                                    models.College.find({
                                        where:{
                                            id : usercurriculum.collegeId
                                        }
                                    }).then(function(college){
                                        studentObj.userCurriculums.push({
                                            id: usercurriculum.id,
                                            name: usercurriculum.name,
                                            user_id: usercurriculum.user_id,
                                            image: constant.BASE_URL+"/upload/curriculum/"+userId+'/'+usercurriculum.file_name,
                                            file_name: usercurriculum.file_name,
                                            file_path: constant.FILE_LOCATION+"public/upload/curriculum/"+userId+'/'+usercurriculum.file_name,
                                            timestamp: moment(new Date(usercurriculum.created_at)).format("DD-MM-YYYY hh:mm:ss"),
                                            updated_at: moment(new Date(usercurriculum.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                            transcript_lock: usercurriculum.lock_transcript,
                                            extension :extension,
                                            email : user.email,
                                            collegeName : college.name
                                        });
                                    })
                                    }
                                } 
                                });
                            }

                            if(letterData && letterData.length > 0) {
                                letterData.forEach(function(letter) {
                                    var app_ids= [];
                                    if(letter.app_id != undefined || letter.app_id != null){
                                        app_ids  = letter.app_id.split(',');
                                    }
                                    for(var i=0;i<app_ids.length;i++){
                                        if(appID == app_ids[i]){
                                            var imgArr = letter.file_name.split('.');
                                            var extension = imgArr[imgArr.length - 1].trim();
                                            if(letter.collegeId != 0 && letter.collegeId != null){
                                                models.College.find({
                                                    where:{
                                                        id : letter.collegeId
                                                    }
                                                }).then(function(college){
                                                    studentObj.letters.push({
                                                        id: letter.id,
                                                        name: letter.name,
                                                        user_id: letter.user_id,
                                                        image: constant.BASE_URL+"/upload/gradeToPercentLetter/"+userId+'/'+letter.file_name,
                                                        file_name: letter.file_name,
                                                        //file_path: constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+userId+'/'+letter.file_name,
                                                        file_path: constant.FILE_LOCATION+"public\\upload\\gradeToPercentLetter\\"+userId+'\\'+letter.file_name,
                                                        timestamp: moment(new Date(letter.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                        updated_at: moment(new Date(letter.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                        transcript_lock: letter.lock_transcript,
                                                        extension :extension,
                                                        email : user.email,
                                                        collegeName : college.name
                                                    });
                                                });
                                            }else{
                                                studentObj.letters.push({
                                                    id: letter.id,
                                                    name: letter.name,
                                                    user_id: letter.user_id,
                                                    image: constant.BASE_URL+"/upload/gradeToPercentLetter/"+userId+'/'+letter.file_name,
                                                    file_name: letter.file_name,
                                                    //file_path: constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+userId+'/'+letter.file_name,
                                                    file_path: constant.FILE_LOCATION+"public\\upload\\gradeToPercentLetter\\"+userId+'\\'+letter.file_name,
                                                    timestamp: moment(new Date(letter.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                    updated_at: moment(new Date(letter.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                    transcript_lock: letter.lock_transcript,
                                                    extension :extension,
                                                    email : user.email,
                                                    collegeName : ''
                                                });
                                            }
                                        }
                                    }
                                });
                            }
                            if(usercompetencys && usercompetencys.length > 0) {
                                usercompetencys.forEach(function(usercompetency) {
                                    if(usercompetency.type.includes('competencyletter')){
                                        var app_ids= [];
                                        if(usercompetency.app_id != undefined || usercompetency.app_id != null){
                                            app_ids  = usercompetency.app_id.split(',');
                                        }
                                        for(var i=0;i<app_ids.length;i++){
                                            if(appID == app_ids[i]){
                                                var imgArr = usercompetency.file_name.split('.');
                                                var extension = imgArr[imgArr.length - 1].trim();
                                                var convo_notApproved = false;	
                                                var convo_approved = false;	
                                                var degreeCertificate = false;	
                                               
                                                if(app.notes){	
                                                    if(app.notes.includes(`In place of ${usercompetency.name} you have uploaded degree certificate.`)){	
                                                        degreeCertificate = true;         	
                                                    }	
                                                    if(app.notes.includes(`${usercompetency.name} is not approved.`)){	
                                                        convo_notApproved = true;	
                                                    }	
                                                    
                                                    	
                                                    if(app.notes.includes(`${usercompetency.name} is approved.`)){	
                                                        convo_approved = true;	
                                                    }	
                                                   
                                                }
                                                if(usercompetency.collegeId != 0 && usercompetency.collegeId != null){
                                               
                                                    models.College.find({
                                                        where:{
                                                            id : usercompetency.collegeId
                                                        }
                                                    }).then(function(college){
                                                        studentObj.usercompetencys.push({
                                                            id: usercompetency.id,
                                                            name: usercompetency.name,
                                                            user_id: usercompetency.user_id,
                                                            image: constant.BASE_URL+"/upload/CompetencyLetter/"+userId+'/'+usercompetency.file_name,
                                                            file_name: usercompetency.file_name,
                                                            file_path: constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+userId+'/'+usercompetency.file_name,
                                                            timestamp: moment(new Date(usercompetency.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                            updated_at: moment(new Date(usercompetency.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                            transcript_lock: usercompetency.lock_transcript,
                                                            extension :extension,
                                                            email : user.email,
                                                            collegeName : college.name,	
                                                            convo_notApproved : convo_notApproved,	
                                                            convo_approved :convo_approved,	
                                                            degreeCertificate : degreeCertificate
                                                        });
                                                    });
                                                }else{
                                                    studentObj.usercompetencys.push({
                                                        id: usercompetency.id,
                                                        name: usercompetency.name,
                                                        user_id: usercompetency.user_id,
                                                        image: constant.BASE_URL+"/upload/CompetencyLetter/"+userId+'/'+usercompetency.file_name,
                                                        file_name: usercompetency.file_name,
                                                        file_path: constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+userId+'/'+usercompetency.file_name,
                                                        timestamp: moment(new Date(usercompetency.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                        updated_at: moment(new Date(usercompetency.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                        transcript_lock: usercompetency.lock_transcript,
                                                        extension :extension,
                                                        email : user.email,
                                                        collegeName : '',	
                                                        convo_notApproved : convo_notApproved,	
                                                        convo_approved :convo_approved,	
                                                        degreeCertificate : degreeCertificate
                                                    });
                                                }
                                            }
                                        }
                                    }else{
                                        studentObj.userExtraDocument.push({
                                            id: usercompetency.id,
                                            name: usercompetency.name,
                                            user_id: usercompetency.user_id,
                                            image: constant.BASE_URL+"/upload/CompetencyLetter/"+userId+'/'+usercompetency.file_name,
                                            file_name: usercompetency.file_name,
                                            file_path: constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+userId+'/'+usercompetency.file_name,
                                            timestamp: moment(new Date(usercompetency.created_at)).format("DD-MM-YYYY hh:mm a"),
                                            updated_at: moment(new Date(usercompetency.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                            transcript_lock: usercompetency.lock_transcript,
                                            extension :extension,
                                            email : user.email
                                        });
                                    }
                                });
                            }
                            if(Letterfor_NameChange && Letterfor_NameChange.length > 0) {
                                Letterfor_NameChange.forEach(function(namechangeletter) {
                                    console.log('namechangeletter',namechangeletter);
                                    if(namechangeletter.type.includes('Passport')){
                                        var app_ids= [];
                                        if(namechangeletter.app_id != undefined || namechangeletter.app_id != null){
                                            app_ids  = namechangeletter.app_id.split(',');
                                        }
                                        for(var i=0;i<app_ids.length;i++){
                                            if(appID == app_ids[i]){
                                                var imgArr = namechangeletter.file_name.split('.');
                                                var extension = imgArr[imgArr.length - 1].trim();
                                                var convo_notApproved = false;	
                                                var convo_approved = false;	
                                                var degreeCertificate = false;	
                                               
                                                if(app.notes){	

                                                    if(app.notes.includes(`In place of ${namechangeletter.name} you have uploaded degree certificate.`)){	
                                                        degreeCertificate = true;         	
                                                    }	
                                                    if(app.notes.includes(`${namechangeletter.name} is not approved.`)){	
                                                        convo_notApproved = true;	
                                                    }	
                                                    
                                                    	
                                                    if(app.notes.includes(`${namechangeletter.name} is approved.`)){	
                                                        convo_approved = true;	
                                                    }	
                                                   
                                                }
                                                      studentObj.letterfornamechange.push({
                                                          
                                                            id: namechangeletter.id,
                                                            name: namechangeletter.name,
                                                            user_id: namechangeletter.user_id,
                                                            image: constant.BASE_URL+"/upload/NameChangeLetter/"+userId+'/'+namechangeletter.file_name,
                                                            file_name: namechangeletter.file_name,
                                                            file_path: constant.FILE_LOCATION+"public/upload/NameChangeLetter/"+userId+'/'+namechangeletter.file_name,
                                                            timestamp: moment(new Date(namechangeletter.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                            updated_at: moment(new Date(namechangeletter.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                            transcript_lock: namechangeletter.lock_transcript,
                                                            extension :extension,
                                                            email : user.email,
                                                            // collegeName : college.name,	
                                                            convo_notApproved : convo_notApproved,	
                                                            convo_approved :convo_approved,	
                                                            degreeCertificate : degreeCertificate
                                                        });
                                            }
                                        }
                              
                          
                                    }else{
                                        studentObj.letterfornamechange.push({
                                            id: namechangeletter.id,
                                            name: namechangeletter.name,
                                            user_id: namechangeletter.user_id,
                                            image: constant.BASE_URL+"/upload/NameChangeLetter/"+userId+'/'+namechangeletter.file_name,
                                            file_name: namechangeletter.file_name,
                                            file_path: constant.FILE_LOCATION+"public/upload/NameChangeLetter/"+userId+'/'+namechangeletter.file_name,
                                            timestamp: moment(new Date(namechangeletter.created_at)).format("DD-MM-YYYY hh:mm a"),
                                            updated_at: moment(new Date(namechangeletter.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                            transcript_lock: namechangeletter.lock_transcript,
                                            extension :extension,
                                            email : user.email
                                        });

                                    }
                                });
                            }

                            var oldDocuments =false;	
                                var approved = false;	
                                var partialApproved = false;	
                               	
                                var marksheet_complete = false;	
                                var marksheet_incomplete = false;	
                                var convo_notUpload = false;
                                if(app.notes){	
                                    if(app.notes.includes("Document is older than 1 year")){	
                                        oldDocuments = true;	
                                    }	
                                    if(app.notes.includes("Transcripts approved.")){	
                                        approved = true;	
                                    }	
                                    if(app.notes.includes("Partial Transcripts ")){	
                                        partialApproved = true;	
                                    }	
                                    if(app.notes.includes("Marksheets Approved.")){	
                                        marksheet_complete = true;	
                                    }	
                                    if(app.notes.includes("Marksheet incomplete")){
                                        marksheet_incomplete = true;	
                                    }	
                                    if(app.notes.includes("Convocation is not uploded")){	
                                        convo_notUpload = true;	
                                    }	
                                }   	


                            
                                studentObj.notes_area = app.notes;
                                studentObj.oldDocuments = oldDocuments;
                                studentObj.approved = approved;
                                studentObj.partialApproved = partialApproved;
                                studentObj.marksheet_complete = marksheet_complete;
                                studentObj.marksheet_incomplete = marksheet_incomplete;
                                studentObj.transcriptRequiredMail = app.transcriptRequiredMail;
                                studentObj.collegeConfirmation = app.collegeConfirmation;
                                studentObj.convo_notUploaded = convo_notUpload;
                                
                            })

                            setTimeout(()=>{

                                if(userMarkLists.length > 0 || userTranscripts.length > 0){
                                    res.json({
                                        status: 200,
                                        message: 'Dashboard success',
                                        data: studentObj,
                                        userEmail : userEmail
                                    });
                                }else{
                                    res.json({
                                        status: 400,
                                        message: 'Transcipt not avaliable of this student !!',
                                        data: studentObj,
                                        userEmail : userEmail
                                    });
                                }
                            },3000);
                        })
                })  
            })
            });
            });
        });
    });
    }
});

router.get('/adminDashboard/getPurposeWiseApplicationsCount',function(req,res){
    var purposeArray = ['study','visa','others','employment','Educational credential evaluators WES','CES','ICAS','NASBA','NCEES','NARIC','Educational Perspective','IQAS','MYIEE','ICES','National Committee on Accreditation'];
    var result = [];
    purposeArray.forEach(purpose=>{
        models.Application.getPurposeWiseApplicationsCount(purpose,'WITHIN').then(function(within){
            models.Application.getPurposeWiseApplicationsCount(purpose,'OUTSIDE').then(function(outside){
                result.push({
                    purpose : purpose,
                    within : within[0].count,
                    outside : outside[0].count
                })
            })
        })
    })
    setTimeout(()=>{
        res.json({
            status : 200,
            data : result
        })
    },3000)
})

router.get('/adminDashboard/getCollegeWiseApplicationsCount',function(req,res){
    var result = []
    var page = req.query.page;
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};

    models.College.getAllColleges(null,null).then(function(clgs){
        countObjects.totalLength = clgs.length;
        models.College.getAllColleges(limit,offset).then(function(colleges){
            countObjects.filteredLength = colleges.length;
            colleges.forEach(college=>{
                models.userMarkList.getCollegewiseStudents(college.id).then(function(userIds){
                    if(userIds.length > 0){
                        var user_ids = userIds[0].user_id;
                        for(var i = 1; i<userIds.length; i++){
                            user_ids += "," + userIds[i].user_id;
                        }
                        models.Application.getCollegeWiseApplicationsCount(user_ids,'WITHIN').then(function(within){
                            models.Application.getCollegeWiseApplicationsCount(user_ids,'OUTSIDE').then(function(outside){
                                result.push({
                                    college : college.name,
                                    within : within[0].count,
                                    outside : outside[0].count
                                })
                            })
                        })
                    }else{
                        result.push({
                            college : college.name,
                            within : 0,
                            outside : 0
                        })
                    }
                })
            })
        })
    })
    setTimeout(()=>{
        res.json({
            status : 200,
            data : result,
            total_count : countObjects
        })
    },5000)
})

router.get('/getCountofApplications', function (req, res) {
    console.log('/getCountofApplications');
    var withinCountObj = {
        registerCount : '',
        appliedCount : '',
        appliedForCount : ''
    }
    var outsideCountObj = {
        registerCount : '',
        appliedCount : '',
        appliedForCount : ''
    }
    var date = moment(new Date(req.query.date)).format('YYYY-MM-DD');
    models.User.getRegisteredCount(date,'WITHIN').then(function(registeredCount){
        withinCountObj.registerCount = registeredCount[0].registerCount;
        models.Application.getAppliedCount(date,'WITHIN').then(function(appliedCount){
            withinCountObj.appliedCount = appliedCount[0].appliedCount;
            models.User.getAppliedForDetails(date,'WITHIN').then(function(appliedForDetails){
                withinCountObj.appliedForCount = 0;
                appliedForDetails.forEach(appliedForDetail =>{
                    if(appliedForDetail.educationalDetails == true)
                        withinCountObj.appliedForCount += 1;
                    if(appliedForDetail.curriculum == true)
                        withinCountObj.appliedForCount += 1;
                    if(appliedForDetail.instructionalField == true)
                        withinCountObj.appliedForCount += 1;
                    if(appliedForDetail.gradToPer == true)
                        withinCountObj.appliedForCount += 1;
                })

                models.User.getRegisteredCount(date,'OUTSIDE').then(function(registeredCount){
                    outsideCountObj.registerCount = registeredCount[0].registerCount;
                    models.Application.getAppliedCount(date,'OUTSIDE').then(function(appliedCount){
                        outsideCountObj.appliedCount = appliedCount[0].appliedCount;
                        models.User.getAppliedForDetails(date,'OUTSIDE').then(function(appliedForDetails){
                            outsideCountObj.appliedForCount = 0;
                            appliedForDetails.forEach(appliedForDetail =>{
                                if(appliedForDetail.educationalDetails == true)
                                    outsideCountObj.appliedForCount += 1;
                                if(appliedForDetail.curriculum == true)
                                    outsideCountObj.appliedForCount += 1;
                                if(appliedForDetail.instructionalField == true)
                                    outsideCountObj.appliedForCount += 1;
                                if(appliedForDetail.gradToPer == true)
                                    outsideCountObj.appliedForCount += 1;
                            })
                            res.json({
                                status : 200,
                                withinCountObj : withinCountObj,
                                outsideCountObj : outsideCountObj
                            })
                        })
                    })
                })
            })
        })
    })
});

router.post('/setCollegeConfirmations',middlewares.getUserInfo,function(req,res){	
    console.log('/setCollegeConfirmations');	
    var exam_date_format;
    var updated_date;
    models.Application.find({	
        where :{	
            id : req.body.id	
        }	
    }).then(function(application){	
        updated_date = application.updated_at
        exam_date_format =moment(new Date(updated_date)).format("DD-MM-YYYY")
        var notes;	
        if(application.notes == null){	
            notes = req.body.collegeName + ' Confirmation Ok.(' + exam_date_format + ' )';
        }else{	
            notes = application.notes + ' ' + req.body.collegeName + ' Confirmation Ok.(' + exam_date_format + ' )';	
        }	
        application.update({	
            notes : notes	
        }).then(function(updatedApplication){	
            if(updatedApplication){	
                var desc = "Note of application " + updatedApplication.id + " is updated by " + req.User.email;	
                var activity = "Note Updated";	
                functions.activitylog(updatedApplication.user_id, activity, desc, updatedApplication.id);	
                // request.post(constant.BASE_URL_SENDGRID + 'transcriptRequiredMail', {	
                //     json: {	
                //         email : user.email,	
                //         studentName : user.name + " " + user.surname,	
                //         app_id : app_id,	
                //         collegeName : req.body.collegeName,	
                //         type : 'partial approved'	
                //     }	
                // }, function (error, response, body) {	
                	
                //     res.json({	
                //         status : 200	
                //     }) 	
                // })  	
                res.json({	
                    status : 200	
                })	
            }else{	
                res.json({	
                    status : 400	
                })	
            }	
        })	
    })	
})

router.post("/updateInstituteDataByAdmin",function(req,res){
	console.log('/updateInstituteDataByAdmin');
	var id = req.body.id;
    var universityName = req.body.universityName;
    var country = req.body.country;
	var email = req.body.email;
	var emailArr;
	var anotherEmailArr;
	var anotherEmail;
	if(email){
		emailArr = email.split(',');
		if(emailArr.length  > 1){
			anotherEmailArr = emailArr.shift();
			anotherEmail = emailArr.toString();
		}else{
			anotherEmailArr = email;
			anotherEmail = null;
		}
	}else{
		emailArr = null;
		anotherEmailArr = null;
		anotherEmail = null;
	}
    var type = req.body.type;
	var contactNumber = req.body.contactNumber;
	var wesno = req.body.wesNumber;
	var icasno = req.body.icasno;
	var cesno = req.body.cesno;
	var eduPerno = req.body.eduperno;
	var iqasno = req.body.iaqsno;
	var icesno = req.body.icesno;
	var nasbano = req.body.nasbano;
	var visarefno = req.body.visarefno;
	var studyrefno = req.body.studyrefno;
	
	var studyaccno = req.body.studyaccno;
	var empaccno  = req.body.empaccno;
	var visaaccno = req.body.visaaccno;
	var otheraccno = req.body.otheraccno
	var emprefno = req.body.emprefno;
	var contact_person = req.body.contact_person;
	var myieeno = req.body.mynieeno;
	var nceesno = req.body.nceesno;
	var naricno = req.body.naricno;
	var ncano = req.body.ncano;
	var emailAsWes = req.body.emailAsWes;
    var nameaswes=req.body.nameaswes;
    var lastnameaswes=req.body.lastnameaswes;
    var hrdno = req.body.hrdno
	// var amount;
	// if(req.User.current_location == "WITHIN"){
	// 	amount  = 536 * req.userEducational;
	// }else if(req.User.current_location == "OUTSIDE"){
	// 	amount  = 8308 * req.userEducational;
	// }
    models.Institution_details.find({
        where:{
            id : id
        }
    }).then(function(data){
        if(data){
            var user_id = data.user_id;
            data.update({
                type : type,
                university_name : (universityName) ? universityName : null,
                country_name : (country) ? country : null,
                email : (emailArr) ? anotherEmailArr : null,
                contact_number : (contactNumber) ? contactNumber : null,
				user_id : user_id,
				contact_person : (contact_person) ? contact_person : null,
				address : (req.body.address) ? req.body.address : null,
				icesno:(icesno) ? icesno : null,
				landmark : (req.body.landmark) ? req.body.landmark : null,
				pincode : (req.body.pincode) ? req.body.pincode : null,
				wesno:(wesno) ? wesno : null,
				cesno:(cesno) ? cesno : null,
				studyrefno:(studyrefno) ? studyrefno : null,
				icasno:(icasno) ? icasno : null,
				eduPerno:(eduPerno) ? eduPerno : null,
				iqasno:(iqasno) ? iqasno : null,
				nasbano:(nasbano) ? nasbano : null,
				visarefno:(visarefno) ? visarefno : null,
				emprefno:(emprefno) ? emprefno : null,
				studyaccno:(studyaccno) ? emprefno : null,
				otheraccno:(otheraccno) ? otheraccno : null,
				empaccno:(empaccno) ? empaccno : null,
				visaaccno:(visaaccno) ? visaaccno : null,
				myieeno:(myieeno) ? myieeno : null,
				OtherEmail : (anotherEmail) ? anotherEmail : null,
				nceesno : (nceesno) ? nceesno : null,
				naricno : (naricno) ? naricno : null,
				ncano : (ncano) ? ncano : null,
				emailAsWes : emailAsWes ? emailAsWes : null,
                nameaswes:(nameaswes)?nameaswes:null,
                lastnameaswes:(lastnameaswes)?lastnameaswes:null,
                hrdno:(hrdno)?hrdno:null
            }).then(function(data_updated){
                if(data_updated){
                    res.json({
                        status:200,
                        message:"data updated"
                    })
					// models.Cart.find({
					// 	where:{
					// 		institute_id : data_updated.id
					// 	}
					// }).then(function(cart_exists){
					// 	if(cart_exists){
					// 		cart_exists.update({
					// 			university_name : data_updated.university_name,
					// 			email : data_updated.email,
					// 			fees : amount,
					// 			user_id : user_id,
					// 			institute_id : data_updated.id,
					// 		}).then(function(cart_updated){
					// 			if(cart_updated){
					// 				res.json({
					// 					status:200,
					// 					message:"data updated"
					// 				})
					// 			}else{
					// 				res.json({
					// 					status:400,
					// 				   message:"data not updated"
					// 				}) 
					// 			}
					// 		})
					// 	}else{
					// 		res.json({
					// 			status:400,
					// 		   message:"data not updated"
					// 		})
					// 	}
					// })
				}else{
                    res.json({
                        status:400,
                       message:"data not updated"
                    })  
                }
            })
        }else{
            res.json({
                status:400,
                message:"data not updated"
            })
        }
    })
});

router.post("/adminDashboard/resetApplicationStage",function(req,res){
	console.log('/adminDashboard/resetApplicationStage');
    models.Application.find({
        where :{
            id  :req.body.app_id
        }
    }).then(function(app){
        app.update({
            tracker : req.body.tracker
        }).then(function(updated_app){
            if(updated_app){
                res.json({
                    status : 200
                })
            }else{
                res.json({
                    status : 400
                }) 
            }
        })
    })
	
});

router.post('/adminDashboard/resendApp',function(req,res){
    var pdfexist = false;
    var user_id = req.body.user_id;
    var count = 0;
    var filecount = 0;
    var appl_id = req.body.appl_id;
    models.Application.find({
        where : {
            id : appl_id
        }
    }).then(function(app){
        models.Wes_Records.findAll({
            where : {
                appl_id : appl_id
            }
        }).then(function(wes_records){
            if(wes_records.length > 0){
                wes_records.forEach(function(wes_record){
                    fs.unlink(constant.FILE_LOCATION + 'public/signedpdf/' + user_id + '/' + wes_record.fileName, function (err) {
                        if (err) {
                        } else {
                            var file_name_del = wes_record.fileName;
                            wes_record.destroy().then(function(delrecord) {
                                models.Emailed_Docs.find({
                                    where :{
                                        filename : file_name_del,
                                        app_id : appl_id
                                    }
                                }).then(function(email_docs){
                                    if(email_docs){
                                        email_docs.destroy().then(function(emailrecord) {
                                            count++;
                                            if(wes_records.length == count){
                                                app.update({
                                                    tracker : 'verified'
                                                }).then(function(){
                                                    res.json({
                                                        status : 200,
                                                        message : "Application resend in verified tab."
                                                    })
                                                })
                                            }
                                        })
                                    }else{
                                    }
                                })
                            })
                        }
                    });
                })
            }else{
                res.json({
                    status : 400,
                    message : 'WES record not found.'
                })
            }
        })
    })

    //  models.Emailed_Docs.findAll({
    //     where :{
    //        app_id : appl_id        }
    // }).then((files)=>{
    //     filecount = filecount + files.length;
    //     if(files.length> 0){
    //         files.forEach((filedata)=>{
    //             if (fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+filedata.filename)){
    //                 count++;
    //             }  
    //         }) 
    //     }
    // })
    // setTimeout(()=>{
    //     if(filecount > 0){
    //         if( filecount == count){
    //                 pdfexist = true;
    //                 res.json({
    //                     status : 200,
    //                     pdfexist : pdfexist
    //                 })
    //             }else{
    //                 pdfexist = false;
    //                 res.json({
    //                     status : 400,
    //                     pdfexist : pdfexist
    //                 })
    //             }
    //         }else{
    //             pdfexist = false;
    //             res.json({
    //                 status : 400,
    //                 pdfexist : pdfexist
    //             }) 
    //         }
    //     },3000);    
    
})

router.post('/adminDashboard/resendAppToPending',middlewares.getUserInfo,function (req,res){
    console.log('resendAppToPending');

   var app_id = req.body.appl_id
   var user_id = req.body.user_id
   var value = req.body.value
   var tracker;
    models.Application.find({
        where  :{
            id :  app_id
        }
    }).then(function (applicationstatus){
        
        if(applicationstatus){
            if(value == 'pending'){
                tracker  = 'apply'
            }else{
                    tracker = 'verified'
            }
            applicationstatus.update({
                tracker  : tracker
        }).then(function(updatedDetails){

            models.Activitytracker.create({
                user_id  : user_id,
                activity : ' Application Tracker Changed',
                data : req.User.email + ' has changed the tracker to pending of application no ' + app_id,
                applicaiton_id  : app_id
            })
            res.json({
                status : 200, 
            })
        })
        }else{
            res.json({
                status : 400 
            })
        }
    })
})


router.post('/adminDashboard/removefromreject',middlewares.getUserInfo,function (req,res){
    console.log('removefromreject');

   var app_id = req.body.appl_id
   var user_id = req.body.user_id
   var value = req.body.value
   var tracker;
    models.Application.find({
        where  :{
            id :  app_id
        }
    }).then(function (applicationstatus){
        
        if(applicationstatus){
            applicationstatus.update({
                status : 'new'
        }).then(function(updatedDetails){

            models.Activitytracker.create({
                user_id  : user_id,
                activity : ' Application Tracker Changed',
                data : req.User.email + ' has changed the tracker to pending of application no ' + app_id,
                applicaiton_id  : app_id
            })
            res.json({
                status : 200, 
            })
        })
        }else{
            res.json({
                status : 400 
            })
        }
    })
})
router.post('/resetErrorApplication',middlewares.getUserInfo, function(req,res){
    console.log('/resetErrorApplication');
    var count = 0;
    var app_id = req.body.app_id;
    var transcriptsData =[];
    var marksheetsData =[];
    var letterData =[];
    var total = 0;
    // res.json({
    //     status : 200
    // })
    setTimeout(() => {
        models.Application.find({
            where : {
                id : app_id
            }
        }).then(function(app){
            models.Applied_For_Details.find({
                where : {
                    app_id : app_id
                }
            }).then(function(appliedForDetail){
                models.Emailed_Docs.findAll({
                    where :{
                         app_id : app_id
                    }
                }).then(function(emailedDocs){
                    if(appliedForDetail.educationalDetails == true){
                        models.User_Transcript.findAll({
                            where :{
                                user_id  : app.user_id
                            }
                        }).then(function(transcripts){
                            if(transcripts.length > 0){
                                transcripts.forEach(transcript=>{
                                    if(transcript.app_id != null){
                                        var app_idArr = transcript.app_id.split(",");
                                        app_idArr.forEach(appl_id=>{
                                            if(app_id == appl_id){
                                                transcriptsData.push(transcript)
                                                total = total + 1;
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }

                    if(appliedForDetail.instructionalField == true){
                        total = total + 1;
                    }

                    if(appliedForDetail.gradToPer == true){
                        models.GradeToPercentageLetter.findAll({
                            where :{
                                user_id : app.user_id
                            }
                        }).then(function(letters){
                            if(letters.length > 0){
                                letters.forEach(letter=>{
                                    if(letter.app_id != null){
                                        var app_idArr = letter.app_id.split(",");
                                        app_idArr.forEach(appl_id=>{
                                            if(app_id == appl_id){
                                                letterData.push(letter)
                                                total = total + 1;
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }

                    models.UserMarklist_Upload.findAll({
                        where :{
                            user_id  : app.user_id
                        }
                    }).then(function(marksheets){
                        if(marksheets.length > 0){
                            
                            marksheets.forEach(marksheet=>{
                                if(marksheet.app_id != null){
                                    var app_idArr = marksheet.app_id.split(",");
                                    app_idArr.forEach(appl_id=>{
                                        if(app_id == appl_id){
                                            marksheetsData.push(marksheet)
                                            total = total + 1;
                                        }
                                    })
                                }
                            })
                        }
                    })
                    if(total > emailedDocs.length){
                        if(appliedForDetail.educationalDetails == true){
                            models.User_Transcript.findAll({
                                where :{
                                    user_id  : app.user_id
                                }
                            }).then(function(transcripts){
                                if(transcripts.length > 0){
                                    var transcriptsData =[];
                                    transcripts.forEach(transcript=>{
                                        if(transcript.app_id != null){
                                            var app_idArr = transcript.app_id.split(",");
                                            app_idArr.forEach(appl_id=>{
                                                if(app_id == appl_id){
                                                    transcriptsData.push(transcript)
                                                }
                                            })
                                        }
                                    })
                                    transcriptsData.forEach(transcript=>{
                                        var file_name = transcript.file_name.split('.');
                                        var fname = transcript.name+"_"+file_name[0]+"-"+".pdf";
                                        var fileName = constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id + '/' + fname
                                        if(fs.existsSync(fileName)){
                                            models.Emailed_Docs.findAll({
                                                where :{
                                                    filename : fname,
                                                    category : "Transcript"
                                                }
                                            }).then(function(emailed_docs){
                                                if(emailed_docs.length > 1){
                                                    emailed_docs.forEach(doc=>{
                                                        if(doc.app_id == app_id){
                                                            models.Emailed_Docs.destroy({
                                                                where :{
                                                                    id : doc.id
                                                                }
                                                            }) 
                                                        }
                                                    })
                                                }else if(emailed_docs.length == 1){
                                                    fs.unlink(fileName, function (err) {
                                                         models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : emailed_docs[0].id
                                                            }
                                                        })
                                                    })
                                                }else{
                                                    fs.unlink(fileName, function (err) {})
                                                }
                                            })
                                        }else {
                                            models.Emailed_Docs.findAll({
                                                where :{
                                                    filename : fname,
                                                    category : "Transcript"
                                                }
                                            }).then(function(emailed_docs){
                                                if(emailed_docs.length > 1){
                                                    emailed_docs.forEach(doc=>{
                                                        if(doc.app_id == app_id){
                                                            models.Emailed_Docs.destroy({
                                                                where :{
                                                                    id : doc.id
                                                                }
                                                            }) 
                                                        }
                                                    })
                                                }else if(emailed_docs.length == 1){
                                                    fs.unlink(fileName, function (err) {
                                                         models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : emailed_docs[0].id
                                                            }
                                                        })
                                                    })
                                                } 
                                            });
                                        }
                                    })
                                }
                            })
                        }

                        if(appliedForDetail.instructionalField == true){
                            models.Emailed_Docs.findAll({
                                where : {
                                    app_id : app_id,
                                    category : 'InstructionalLetter'
                                }
                            }).then(function(emailed_docs){
                                    emailed_docs.forEach(doc=>{
                                    var file_name = emailed_docs.file_name.split('.');
                                    var fname = emailed_docs.name+"_"+file_name[0]+"-"+".pdf";
                                    var fileName = constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id + '/' + fname
                                    if(fs.existsSync(fileName)){
                                        
                                    models.Emailed_Docs.findAll({
                                        where:{
                                            filename : doc.filename,
                                            category : doc.category,
                                            marklist_id : doc.marklist_id,
                                            transcript_id : doc.transcript_id,
                                            curriculum_id : doc.curriculum_id,
                                            gradToPer_id : doc.gradToPer_id,
                                            app_id :{
                                                [Op.ne] : app_id
                                            }
                                        }
                                    }).then(function(otherEmailed_docs){
                                        if(otherEmailed_docs.length > 0){
                                            models.Emailed_Docs.destroy({
                                                where :{
                                                    id : doc.id
                                                }
                                            })
                                        }else{
                                            fs.unlink(constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id + '/' + doc.filename, function (err) {
                                                models.Emailed_Docs.destroy({
                                                    where :{
                                                        id : doc.id
                                                    }
                                                })
                                            })
                                        }
                                       
                                    })
                                    }else {
                                        models.Emailed_Docs.findAll({
                                            where:{
                                                filename : doc.filename,
                                                category : doc.category,
                                                marklist_id : doc.marklist_id,
                                                transcript_id : doc.transcript_id,
                                                curriculum_id : doc.curriculum_id,
                                                gradToPer_id : doc.gradToPer_id,
                                                app_id :{
                                                    [Op.ne] : app_id
                                                }
                                            }
                                        }).then(function(otherEmailed_docs){
                                            if(otherEmailed_docs.length > 0){
                                                models.Emailed_Docs.destroy({
                                                    where :{
                                                        id : doc.id
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            })
                        }

                        if(appliedForDetail.gradToPer == true){
                            models.GradeToPercentageLetter.findAll({
                                where :{
                                    user_id : app.user_id
                                }
                            }).then(function(letters){
                                if(letters.length > 0){
                                    var letterData =[];
                                    letters.forEach(letter=>{
                                        if(letter.app_id != null){
                                            var app_idArr = letter.app_id.split(",");
                                            app_idArr.forEach(appl_id=>{
                                                if(app_id == appl_id){
                                                    letterData.push(letter)
                                                }
                                            })
                                        }
                                    })
                                    letterData.forEach(letter=>{
                                        var file_name = letter.file_name.split('.');
                                        var fname = letter.name+"_"+file_name[0]+"-"+".pdf";
                                        var fileName = constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id + '/' + fname
                                        if(fs.existsSync(fileName)){
                                            models.Emailed_Docs.findAll({
                                                where :{
                                                    filename : fname,
                                                    category : "GradeToPerLetter"
                                                }
                                            }).then(function(emailed_docs){
                                                if(emailed_docs.length > 1){
                                                    emailed_docs.forEach(doc=>{
                                                        if(doc.app_id == app_id){
                                                            models.Emailed_Docs.destroy({
                                                                where :{
                                                                    id : doc.id
                                                                }
                                                            }) 
                                                        }
                                                    })
                                                }else if(emailed_docs.length == 1){
                                                    fs.unlink(fileName, function (err) {
                                                        models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : emailed_docs[0].id
                                                            }
                                                        })
                                                    })
                                                }else{
                                                    fs.unlink(fileName, function (err) {})
                                                }
                                            })
                                        }else{
                                            models.Emailed_Docs.findAll({
                                                where :{
                                                    filename : fname,
                                                    category : "GradeToPerLetter"
                                                }
                                            }).then(function(emailed_docs){
                                                if(emailed_docs.length > 1){
                                                    emailed_docs.forEach(doc=>{
                                                        if(doc.app_id == app_id){
                                                            models.Emailed_Docs.destroy({
                                                                where :{
                                                                    id : doc.id
                                                                }
                                                            }) 
                                                        }
                                                    })
                                                }else if(emailed_docs.length == 1){
                                                    fs.unlink(fileName, function (err) {
                                                        models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : emailed_docs[0].id
                                                            }
                                                        })
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }

                        models.UserMarklist_Upload.findAll({
                            where :{
                                user_id  : app.user_id
                            }
                        }).then(function(marksheets){
                            if(marksheets.length > 0){
                                var marksheetsData =[];
                                marksheets.forEach(marksheet=>{
                                    if(marksheet.app_id != null){
                                        var app_idArr = marksheet.app_id.split(",");
                                        app_idArr.forEach(appl_id=>{
                                            if(app_id == appl_id){
                                                marksheetsData.push(marksheet)
                                            }
                                        })
                                    }
                                })
                                marksheetsData.forEach(marksheet=>{
                                    var file_name = marksheet.file_name.split('.');
                                    var fname = marksheet.name+"_"+marksheet.education_type+"_"+file_name[0]+"-"+".pdf";
                                    var fileName = constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id + '/' + fname
                                    if(fs.existsSync(fileName)){
                                        models.Emailed_Docs.findAll({
                                            where :{
                                                filename : fname,
                                                category : "Marklist"
                                            }
                                        }).then(function(emailed_docs){
                                            if(emailed_docs.length > 1){
                                                emailed_docs.forEach(doc=>{
                                                    if(doc.app_id == app_id){
                                                        models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : doc.id
                                                            }
                                                        }) 
                                                    }
                                                })
                                            }else if(emailed_docs.length == 1){
                                                fs.unlink(fileName, function (err) {
                                                    models.Emailed_Docs.destroy({
                                                        where :{
                                                            id : emailed_docs[0].id
                                                        }
                                                    })
                                                })
                                            }else{
                                                fs.unlink(fileName, function (err) {})
                                            }
                                        })
                                    }else{
                                        models.Emailed_Docs.findAll({
                                            where :{
                                                filename : fname,
                                                category : "Marklist"
                                            }
                                        }).then(function(emailed_docs){
                                            if(emailed_docs.length > 1){
                                                emailed_docs.forEach(doc=>{
                                                    if(doc.app_id == app_id){
                                                        models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : doc.id
                                                            }
                                                        }) 
                                                    }
                                                })
                                            }else if(emailed_docs.length == 1){
                                                fs.unlink(fileName, function (err) {
                                                    models.Emailed_Docs.destroy({
                                                        where :{
                                                            id : emailed_docs[0].id
                                                        }
                                                    })
                                                })
                                            }
                                        })
                                    }
                                })
                            }

                            setTimeout(() => {
                                models.Emailed_Docs.findAll({
                                    where :{
                                        app_id : app_id
                                    }
                                }).then(function(emailed){
                                    if(emailed.length == 0){
                                        var path = constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id
                                        if (fs.existsSync(path)) {
                                            const files = fs.readdirSync(path)

                                            if (files.length > 0) {
                                              files.forEach(function(filename) {
                                                if (fs.statSync(path + "/" + filename).isDirectory()) {
                                                  removeDir(path + "/" + filename)
                                                } else {
                                                  fs.unlinkSync(path + "/" + filename)
                                                }
                                              })
                                            } else {
                                            }
                                        } else {
                                        }
                                        res.json({
                                            status : 200
                                        })
                                    }else{
                                        res.json({
                                            status : 200
                                        })
                                    }
                                })
                            },1000)
                        })
                    }else if(total < emailedDocs.length){
                        if(appliedForDetail.educationalDetails == true){
                            models.User_Transcript.findAll({
                                where :{
                                    user_id  : app.user_id
                                }
                            }).then(function(transcripts){
                                if(transcripts.length > 0){
                                    var transcriptsData =[];
                                    transcripts.forEach(transcript=>{
                                        if(transcript.app_id != null){
                                            var app_idArr = transcript.app_id.split(",");
                                            app_idArr.forEach(appl_id=>{
                                                if(app_id == appl_id){
                                                    transcriptsData.push(transcript)
                                                }
                                            })
                                        }
                                    })
                                    transcriptsData.forEach(transcript=>{
                                        var file_name = transcript.file_name.split('.');
                                        var fname = transcript.name+"_"+file_name[0]+"-"+".pdf";
                                        var fileName = constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id + '/' + fname
                                        if(fs.existsSync(fileName)){
                                            models.Emailed_Docs.findAll({
                                                where :{
                                                    filename : fname,
                                                    category : "Transcript"
                                                }
                                            }).then(function(emailed_docs){
                                                if(emailed_docs.length > 1){
                                                    emailed_docs.forEach(doc=>{
                                                        if(doc.app_id == app_id){
                                                            models.Emailed_Docs.destroy({
                                                                where :{
                                                                    id : doc.id
                                                                }
                                                            }) 
                                                        }
                                                    })
                                                }else if(emailed_docs.length == 1){
                                                    fs.unlink(fileName, function (err) {
                                                         models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : emailed_docs[0].id
                                                            }
                                                        })
                                                    })
                                                }else{
                                                    fs.unlink(fileName, function (err) {})
                                                }
                                            })
                                        }else {
                                            models.Emailed_Docs.findAll({
                                                where :{
                                                    filename : fname,
                                                    category : "Transcript"
                                                }
                                            }).then(function(emailed_docs){
                                                if(emailed_docs.length > 1){
                                                    emailed_docs.forEach(doc=>{
                                                        if(doc.app_id == app_id){
                                                            models.Emailed_Docs.destroy({
                                                                where :{
                                                                    id : doc.id
                                                                }
                                                            }) 
                                                        }
                                                    })
                                                }else if(emailed_docs.length == 1){
                                                    fs.unlink(fileName, function (err) {
                                                         models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : emailed_docs[0].id
                                                            }
                                                        })
                                                    })
                                                } 
                                            });
                                        }
                                    })
                                }
                            })
                        }

                        if(appliedForDetail.instructionalField == true){
                            models.Emailed_Docs.findAll({
                                where : {
                                    app_id : app_id,
                                    category : 'InstructionalLetter'
                                }
                            }).then(function(emailed_docs){
                                emailed_docs.forEach(doc=>{
                                    var file_name = emailed_docs.file_name.split('.');
                                    var fname = emailed_docs.name+"_"+file_name[0]+"-"+".pdf";
                                    var fileName = constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id + '/' + fname
                                    if(fs.existsSync(fileName)){
                            
                                    models.Emailed_Docs.findAll({
                                        where:{
                                            filename : doc.filename,
                                            category : doc.category,
                                            marklist_id : doc.marklist_id,
                                            transcript_id : doc.transcript_id,
                                            curriculum_id : doc.curriculum_id,
                                            gradToPer_id : doc.gradToPer_id,
                                            app_id :{
                                                [Op.ne] : app_id
                                            }
                                        }
                                    }).then(function(otherEmailed_docs){
                                        if(otherEmailed_docs.length > 0){
                                            models.Emailed_Docs.destroy({
                                                where :{
                                                    id : doc.id
                                                }
                                            })
                                        }else{
                                            fs.unlink(constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id + '/' + doc.filename, function (err) {
                                                models.Emailed_Docs.destroy({
                                                    where :{
                                                        id : doc.id
                                                    }
                                                })
                                            })
                                        }
                                       
                                    })
                                     }else {
                                        models.Emailed_Docs.findAll({
                                            where:{
                                                filename : doc.filename,
                                                category : doc.category,
                                                marklist_id : doc.marklist_id,
                                                transcript_id : doc.transcript_id,
                                                curriculum_id : doc.curriculum_id,
                                                gradToPer_id : doc.gradToPer_id,
                                                app_id :{
                                                    [Op.ne] : app_id
                                                }
                                            }
                                        }).then(function(otherEmailed_docs){
                                            if(otherEmailed_docs.length > 0){
                                                models.Emailed_Docs.destroy({
                                                    where :{
                                                        id : doc.id
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            })
                        }

                        if(appliedForDetail.gradToPer == true){
                            models.GradeToPercentageLetter.findAll({
                                where :{
                                    user_id : app.user_id
                                }
                            }).then(function(letters){
                                if(letters.length > 0){
                                    var letterData =[];
                                    letters.forEach(letter=>{
                                        if(letter.app_id != null){
                                            var app_idArr = letter.app_id.split(",");
                                            app_idArr.forEach(appl_id=>{
                                                if(app_id == appl_id){
                                                    letterData.push(letter)
                                                }
                                            })
                                        }
                                    })
                                    letterData.forEach(letter=>{
                                        var file_name = letter.file_name.split('.');
                                        var fname = letter.name+"_"+file_name[0]+"-"+".pdf";
                                        var fileName = constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id + '/' + fname
                                        if(fs.existsSync(fileName)){
                                            models.Emailed_Docs.findAll({
                                                where :{
                                                    filename : fname,
                                                    category : "GradeToPerLetter"
                                                }
                                            }).then(function(emailed_docs){
                                                if(emailed_docs.length > 1){
                                                    emailed_docs.forEach(doc=>{
                                                        if(doc.app_id == app_id){
                                                            models.Emailed_Docs.destroy({
                                                                where :{
                                                                    id : doc.id
                                                                }
                                                            }) 
                                                        }
                                                    })
                                                }else if(emailed_docs.length == 1){
                                                    fs.unlink(fileName, function (err) {
                                                        models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : emailed_docs[0].id
                                                            }
                                                        })
                                                    })
                                                }else{
                                                    fs.unlink(fileName, function (err) {})
                                                }
                                            })
                                        }else{
                                            models.Emailed_Docs.findAll({
                                                where :{
                                                    filename : fname,
                                                    category : "GradeToPerLetter"
                                                }
                                            }).then(function(emailed_docs){
                                                if(emailed_docs.length > 1){
                                                    emailed_docs.forEach(doc=>{
                                                        if(doc.app_id == app_id){
                                                            models.Emailed_Docs.destroy({
                                                                where :{
                                                                    id : doc.id
                                                                }
                                                            }) 
                                                        }
                                                    })
                                                }else if(emailed_docs.length == 1){
                                                    fs.unlink(fileName, function (err) {
                                                        models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : emailed_docs[0].id
                                                            }
                                                        })
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }

                        models.UserMarklist_Upload.findAll({
                            where :{
                                user_id  : app.user_id
                            }
                        }).then(function(marksheets){
                            if(marksheets.length > 0){
                                var marksheetsData =[];
                                marksheets.forEach(marksheet=>{
                                    if(marksheet.app_id != null){
                                        var app_idArr = marksheet.app_id.split(",");
                                        app_idArr.forEach(appl_id=>{
                                            if(app_id == appl_id){
                                                marksheetsData.push(marksheet)
                                            }
                                        })
                                    }
                                })
                                marksheetsData.forEach(marksheet=>{
                                    var file_name = marksheet.file_name.split('.');
                                    var fname = marksheet.name+"_"+marksheet.education_type+"_"+file_name[0]+"-"+".pdf";
                                    var fileName = constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id + '/' + fname
                                    if(fs.existsSync(fileName)){
                                        models.Emailed_Docs.findAll({
                                            where :{
                                                filename : fname,
                                                category : "Marklist"
                                            }
                                        }).then(function(emailed_docs){
                                            if(emailed_docs.length > 1){
                                                emailed_docs.forEach(doc=>{
                                                    if(doc.app_id == app_id){
                                                        models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : doc.id
                                                            }
                                                        }) 
                                                    }
                                                })
                                            }else if(emailed_docs.length == 1){
                                                fs.unlink(fileName, function (err) {
                                                    models.Emailed_Docs.destroy({
                                                        where :{
                                                            id : emailed_docs[0].id
                                                        }
                                                    })
                                                })
                                            }else{
                                                fs.unlink(fileName, function (err) {})
                                            }
                                        })
                                    }else{
                                        models.Emailed_Docs.findAll({
                                            where :{
                                                filename : fname,
                                                category : "Marklist"
                                            }
                                        }).then(function(emailed_docs){
                                            if(emailed_docs.length > 1){
                                                emailed_docs.forEach(doc=>{
                                                    if(doc.app_id == app_id){
                                                        models.Emailed_Docs.destroy({
                                                            where :{
                                                                id : doc.id
                                                            }
                                                        }) 
                                                    }
                                                })
                                            }else if(emailed_docs.length == 1){
                                                fs.unlink(fileName, function (err) {
                                                    models.Emailed_Docs.destroy({
                                                        where :{
                                                            id : emailed_docs[0].id
                                                        }
                                                    })
                                                })
                                            }
                                        })
                                    }
                                })
                            }

                            setTimeout(() => {
                                models.Emailed_Docs.destroy({
                                    where:{
                                       app_id : app_id
                                    }
                                }).then(function(destroy_emailedDocs){
                                    models.Emailed_Docs.findAll({
                                        where :{
                                            app_id : app_id
                                        }
                                    }).then(function(emailed){
                                        if(emailed.length == 0){
                                            var path = constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id
                                            if (fs.existsSync(path)) {
                                                const files = fs.readdirSync(path)

                                                if (files.length > 0) {
                                                  files.forEach(function(filename) {
                                                    if (fs.statSync(path + "/" + filename).isDirectory()) {
                                                      removeDir(path + "/" + filename)
                                                    } else {
                                                      fs.unlinkSync(path + "/" + filename)
                                                    }
                                                  })
                                                } else {
                                                }
                                            } else {

                                            }
                                            res.json({
                                                status : 200
                                            })
                                        }else{
                                            res.json({
                                                status : 200
                                            })
                                        }
                                    })
                                })
                            },1000)
                        })
                    }else{
                        var path = constant.FILE_LOCATION + 'public/signedpdf/' + app.user_id
                        if (fs.existsSync(path)) {
                            const files = fs.readdirSync(path)

                            if (files.length > 0) {
                              files.forEach(function(filename) {
                                if (fs.statSync(path + "/" + filename).isDirectory()) {
                                  removeDir(path + "/" + filename)
                                } else {
                                  fs.unlinkSync(path + "/" + filename)
                                }
                              })
                            } else {
                            }
                        } else {
                        }
                        res.json({
                            status : 200,
                            message : "No need to reset"
                        })
                    }
                })
            })
        })    
    },8000)
})

router.post('/adminResetPassword', middlewares.getUserInfo, function (req, res) {
	console.log("/adminResetPassword");
	var body_data = req.body.data;
	var password = '123456';
	// var confirm_password = body_data.userConfirmPassword;
	if (password == '123456') {
		var hashPassword = functions.generateHashPassword(password);
		models.User.find({
			where: {
				email: body_data
			}
		}).then(function (User_data) {
			User_data.update({
				password: hashPassword
			});

			res.json({
				status: 200,
				data: User_data,
				message: 'Password Reset successfully'
			});
		})
	} else {
		res.json({
			status: 401,
			message: 'Something went wrong while changing your Password'
		});

	}
});

router.delete('/adminResetDoc', middlewares.getUserInfo, function(req, res){
    console.log("/adminResetDoc");
    var userid = req.query.userID;
    if(userid != undefined){
        models.Application.find({
            where:{
                user_id: userid
            }
        }).then(function(User_data){
            if(User_data != null){
                res.json({
                    status: 400,
                    message: 'User Have Paid the Fees. So, we cannot Delete the Document'
                });
            }
            else{
                models.Applied_For_Details.deleteUserData(userid).then(function(appliedDetails){
                    models.userMarkList.deleteUserData(userid).then(function(userMarklist){
                        models.UserMarklist_Upload.deleteUserData(userid).then(function(userMark_Upload){
                            models.User_Transcript.deleteUserData(userid).then(function(UserTranscript){
                                models.User_Curriculum.deleteUserData(userid).then(function(userCurri){
                                    models.InstructionalDetails.deleteUserData(userid).then(function(Instructional){
                                        models.GradeToPercentageLetter.deleteUserData(userid).then(function(GradeToPrecentage){
                                            models.Institution_details.deleteUserData(userid).then(function(Institution){
                                                models.competency_letter.deleteUserData(userid).then(function(competency_letter){
                                                models.Hrd_details.deleteUserData(userid).then(function(Hrd_details){
                                                    
                                                models.Cart.deleteUserData(userid).then(function(cart){
                                                    res.json({
                                                        status: 200,
                                                        message: 'Document Deleted Successfully'
                                                    });
                                                  
                                                })
                                            })
                                        })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            }
        });
    }else{
        res.json({
			status: 401,
			message: 'Something went wrong'
		});
    }
});

router.post('/deleteMarksheet', middlewares.getUserInfo, function(req, res){
    console.log("/deleteMarksheet");
	var userData = req.body.data;
    var types = req.body.types;
    if(types == 'Marksheet'){
        models.UserMarklist_Upload.find({
            where: {
                id: userData.id,
                user_id:userData.user_id
            }
        }).then(function (userMarklist) {
                var path = userData.file_path
                //('fs').unlink(path, function(err) {
                userMarklist.destroy().then(function (delmarklist) {
                    models.Activitytracker.create({
                        user_id : userData.user_id,
                        activity : delmarklist.name+ 'Deleted',
                        data : delmarklist.file_name + ' deleted by ' + req.User.email,
                        applicaiton_id : userData.app_id


                    })
                res.json({
                    status : 200,
                    message : "Marksheet deleted Successfully"
                })
            });
        }
    )} else if(types == 'Transcripts'){
        models.User_Transcript.find({
            where: {
                id: userData.id,
                user_id:userData.user_id
            }
        }).then(function (userTranscript){
            userTranscript.destroy().then(function (delTranscript){
                models.Activitytracker.create({
                    user_id : userData.user_id,
                    activity : delTranscript.name+ 'Deleted',
                    data : delTranscript.file_name + ' deleted by ' + req.User.email,
                    applicaiton_id : userData.app_id


                })
                res.json({
                    status: 200,
                    message: "User Transcript Deleted Successfully"
                })
            });
        })
    } else if(types == 'Curriculum'){
        models.User_Curriculum.find({
            where: {
                id: userData.id,
                user_id:userData.user_id
            }
        }).then(function (userTranscript){
            userTranscript.destroy().then(function (delTranscript){
                models.Activitytracker.create({
                    user_id : userData.user_id,
                    activity : delTranscript.name+ 'Deleted',
                    data : delTranscript.file_name + ' deleted by ' + req.User.email,
                    applicaiton_id : userData.app_id


                })
                res.json({
                    status: 200,
                    message: "User Curriculum Deleted Successfully"
                })
            });
        })
    } else if(types == 'gradesToPer'){
        models.GradeToPercentageLetter.find({
            where: {
                id: userData.id,
                user_id:userData.user_id
            }
        }).then(function (userTranscript){
            userTranscript.destroy().then(function (delTranscript){
                
                models.Activitytracker.create({
                    user_id : userData.user_id,
                    activity : delTranscript.name+ 'Deleted',
                    data : delTranscript.file_name + ' deleted by ' + req.User.email,
                    applicaiton_id : userData.app_id
                })
                res.json({
                    status: 200,
                    message: "Grade To Percentage Letter Deleted Successfully"
                })
            });
        })
    }else{
        res.json({
            status : 400,
            message : "Unable To Delete"
        });
    }
});

router.post('/nameChange', middlewares.getUserInfo, function (req, res) {
	console.log("/nameChange");
	var fname = req.body.fname;
    var lname = req.body.lname;
    var user_id = req.body.data;
	// var confirm_password = body_data.userConfirmPassword;
	if (user_id != null) {
		models.User.find({
			where: {
				id: user_id
			}
		}).then(function (User_data) {
			User_data.update({
				name: fname,
                surname: lname
			});

			res.json({
				status: 200,
				data: User_data,
				message: 'Name Changed successfully'
			});
		})
	} else {
		res.json({
			status: 401,
			message: 'Something went wrong.'
		});

	}
});

router.get('/getAffiliationAdmindetails',(req,res)=>{
	console.log('/getAffiliationAdmindetails')
	
    var data = [];
	models.Affiliation_Letter.findAll(
		{
			where:{
				user_id:req.query.userId
			}
		}
	).then(user=>{
		user.forEach(function (userdata){
			data.push({
					name : userdata.studentName,
					course:  userdata.courseName,
					college :userdata.collegeName,
					duration : userdata.duration,
					specialization : userdata.specialization,
					yearofpassing : userdata.yearofpassing,
					division :userdata.division
				})
			})
		if(data){
			res.json({
				data :  data
			})
		}else{
			res.json({
			data  : null
			})
		}
	})
})

router.post('/uploadStudentDocument',middlewares.getUserInfo,function(req,res){
	console.log('/uploadStudentDocument');
    var userId = req.query.user_id;
	var image;
	var transcript_name = req.query.transcript_name;
	var education_type = req.query.education_type;
	var user_marklistid = req.query.user_marklistid;
	var app_id = (req.query.app_id) ? req.query.app_id : null;
	var fileStatus= false;
	var doc_id = req.query.doc_id;
    var folder = req.query.type;
    var collegeId = req.query.clgId;
    var faculty = req.query.faculty;
    var ext;
	var dir = constant.FILE_LOCATION + "public/upload/"+folder+"/" + userId; 
	//var dir = constant.FILE_LOCATION + "public\\upload\\marklist\\" + userId; 
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
  	var storage = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, constant.FILE_LOCATION+'public/upload/'+folder+'/'+userId);
			//callback(null, constant.FILE_LOCATION+'public\\upload\\marklist\\'+userId);
		},
		filename: function(req, file, callback) {
			callback(null, file.originalname);
			// if(file.originalname.includes('&')){
			// 	image = file.originalname.split('&').join('_');
			// }else{
			// 	image = file.originalname;
			// }
			var format = "`!@#$%^&*()+-=[]{};':\"|,<>/?~"
			var flag = false;
			for(var i = 0; i < format.length;i++){
				if(file.originalname.indexOf(format[i]) > -1){
					flag = true;
					image = file.originalname.split(format[i]).join('_');
				}
			}
			if(flag == false){
				image = file.originalname
			}
		}
	});

	var upload = multer({
		storage: storage,
		fileFilter: function (req, file, callback) {
			// if(file.originalname.includes('&')){
			// 	file.originalname = file.originalname.split('&').join('_');
			// }

			var format = "`!@#$%^&*()+-=[]{};':\"|,<>/?~"
			var flag = false;
			for(var i = 0; i < format.length;i++){
				if(file.originalname.indexOf(format[i]) > -1){
					flag = true;
					file.originalname = file.originalname.split(format[i]).join('_');
				}
			}
			if(flag == false){
				file.originalname = file.originalname
			}

			ext = path.extname(file.originalname)
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.pdf' && ext !== '.PNG' && ext !== '.JPG' && ext !== '.JPEG' && ext !== '.PDF') {
				return callback(res.end('Please upload your document in .pdf, .jpeg, .jpg or .png formats only'), null)
			}
			callback(null, true)
		}
	}).single('file');
	upload(req, res, function (err, data) {
		imageLocationToCallClient = image;
		if (ext == '.pdf') {
			fs.readFile(constant.FILE_LOCATION +'public/upload/'+ folder +'/' + userId + '/' + image, (err, pdfBuffer) => {
			//	fs.readFile(constant.FILE_LOCATION +'public\\upload\\marklist\\' + userId + '\\' + image, (err, pdfBuffer) => {
					new pdfreader.PdfReader().parseBuffer(pdfBuffer, function (err, item) {
					if (err) {
						uploadValue = false;
						ValueUpdateData(uploadValue);
					} else if (!item) {
						uploadValue = true;
						ValueUpdateData(uploadValue);
					} else if (item.text) {}
				});
			});
		} else {
			uploadValue = true;
			ValueUpdateData(uploadValue);
		}

		function ValueUpdateData(uploadValue) {
			if (uploadValue == true) {
                if(folder == 'marklist'){
                    models.UserMarklist_Upload.findAll({
                        where :{
                            user_id: userId,
                        }
                    }).then((datam)=>{
                        if(datam.length > 0){
                            datam.forEach(function(marklistData){
                                if(marklistData){
                                    if(marklistData.file_name == imageLocationToCallClient){
                                        fileStatus=true;
                                    }
                                }
                            })
                        }
                        if(fileStatus==true){
                            res.json({
                                status: 200,
                                message: `File already exist. please upload another file!!!..`,
                            })
                        }else{
                            if(doc_id != undefined && doc_id != null && doc_id != ''){
                                models.UserMarklist_Upload.find({
                                    where :{
                                        id : doc_id
                                    }
                                }).then(function(marksheetUpload){
                                    marksheetUpload.update({
                                        file_name: imageLocationToCallClient,
                                        lock_transcript : false,
                                        upload_step : 'changed'
                                    }).then(function(updatedMarksheetUpload){
                                        if (updatedMarksheetUpload) {
                                            return res.json({
                                                status: 200,
                                                message: `Upload Completed.`,
                                                data : updatedMarksheetUpload
                                            });
                                        } else {
                                            return res.json({
                                                status: 400,
                                                message: `Error occured in uploading document.`
                                            });
                                        }
                                    })
                                })
                            }else{
                                models.userMarkList.find({
                                    where:{
                                        user_id : userId,
                                        collegeId : collegeId,
                                        type : education_type,
                                        faculty : faculty
                                    }
                                }).then(function(marklistData){
                                    models.UserMarklist_Upload.create({
                                        name: transcript_name,
                                        user_id: userId,
                                        user_marklist_id:marklistData.id,
                                        education_type: education_type,
                                        file_name: imageLocationToCallClient,
                                        lock_transcript : false,
                                        upload_step : "changed",
                                        app_id : app_id
                                    }).then(function (userMarklist) {
                                        if (userMarklist) {
                                            return res.json({
                                                status: 200,
                                                message: `Upload Completed.`,
                                                data : userMarklist
                                            });
                                        } else {
                                            return res.json({
                                                status: 400,
                                                message: `Error occured in uploading document.`
                                            });
                                        }
                    
                                    });
                                })
                            }
                            
                        }
                    })
                }else if(folder == 'transcript'){
                    var fileStatus = false;
                    models.User_Transcript.findAll({
                        where :{
                            user_id: userId,
                        }
                    }).then((datam)=>{
                        if(datam.length > 0){
                            datam.forEach(function(marklistData){
                                if(marklistData){
                                    if(marklistData.file_name == imageLocationToCallClient){
                                        fileStatus=true;
                                    }
                                }
                            })
                        }
                        if(fileStatus==true){
                            res.json({
                                status: 200,
                                message: `File already exist. please upload another file!!!..`,
                            })
                        }else{
                            if(doc_id != undefined && doc_id != null && doc_id != ''){
                                models.User_Transcript.find({
                                    where :{
                                        id : doc_id
                                    }
                                }).then(function(transcriptUpload){
                                    transcriptUpload.update({
                                        file_name: imageLocationToCallClient,
                                        lock_transcript : false,
                                        upload_step : 'changed'
                                    }).then(function(updatedtranscriptUpload){
                                        if (updatedtranscriptUpload) {
                                            return res.json({
                                                status: 200,
                                                message: `Upload Completed.`,
                                                data : updatedtranscriptUpload
                                            });
                                        } else {
                                            return res.json({
                                                status: 400,
                                                message: `Error occured in uploading document.`
                                            });
                                        }
                                    })
                                })
                            }else{	
                                models.User_Transcript.create({
                                    name: transcript_name,
                                    user_id: userId,
                                    type: education_type,
                                    file_name: imageLocationToCallClient,
                                    lock_transcript : false,
                                    collegeId : collegeId,
                                    upload_step : "changed",
                                    app_id : app_id
                                }).then(function (userTranscript) {
                                    if (userTranscript) {
                                        return res.json({
                                            status: 200,
                                            message: `Upload Completed.`,
                                            sata : education_type
                                        });
                                    } else {
                                        return res.json({
                                            status: 400,
                                            message: `Error occured in uploading document.`
                                        });
                                    }
                                });
                            }
                        }
                    })
                }
			} else if (uploadValue == false) {
				fs.unlink(constant.FILE_LOCATION + 'public/upload/' + folder + '/' + userId + '/' + image, function (err) {
				//fs.unlink(constant.FILE_LOCATION + 'public\\upload\\marklist\\' + userId + '\\' + image, function (err) {
					if (err) {
						return res.json({
							status: 400,
							message: `Error occured in uploading document.`
						});
					} else {
						return res.json({
							status: 401,
							message: 'You have uploaded the Password Protected Document. Please Upload correct document.'
						});
					}
				});
			}
		}
	});
});

router.get('/getStudentEducationData',middlewares.getUserInfo,function(req,res){
	console.log('/getStudentEducationData');
    var user_id = req.query.user_id;
    var app_id = req.query.app_id;

    models.userMarkList.findAll({
        where:{
            user_id : user_id
        }
    }).then(function(userMarklists){
        //console.log("userMarklist == " + JSON.stringify(userMarklists))
        var marklistData =[] ;
        userMarklists.forEach(marklist =>{
            if(marklist.app_id != null){
                var app_idArr = marklist.app_id.split(',');
                app_idArr.forEach(appl_id=>{
                    if(appl_id == app_id){
                        marklistData.push(marklist);
                    }
                })
            }
        })

        var educationalDetails ={
            bachelors :[],
            masters : [],
            phd : []
        };
        marklistData.forEach(marklist=>{
            if(marklist.type == 'Bachelors'){
                models.College.find({
                    where:{
                        id : marklist.collegeId
                    }
                }).then(function(college){
                    if(educationalDetails.bachelors.length > 0){
                        educationalDetails.bachelors.forEach(data=>{
                            if(data.faculty == marklist.faculty && data.college_id == marklist.collegeId){
                                flag = true;
                            }
                        });
                        if(flag == false){
                            educationalDetails.bachelors.push({
                                faculty : marklist.faculty,
                                type : marklist.type,
                                pattern : marklist.patteren,
                                college_id : college.id,
                                college_name : college.name,
                            })
                        }
                    }else{
                        educationalDetails.bachelors.push({
                            faculty : marklist.faculty,
                            type : marklist.type,
                            pattern : marklist.patteren,
                            college_id : college.id,
                            college_name : college.name
                        })
                    }
                })
            }else if(marklist.type == 'Masters'){
                models.College.find({
                    where:{
                        id : marklist.collegeId
                    }
                }).then(function(college){
                    if(educationalDetails.masters.length > 0){
                        educationalDetails.masters.forEach(data=>{
                            if(data.faculty == marklist.faculty && data.college_id == marklist.collegeId){
                                flag = true;
                            }
                        });
                        if(flag == false){
                            educationalDetails.masters.push({
                                faculty : marklist.faculty,
                                type : marklist.type,
                                pattern : marklist.patteren,
                                college_id : college.id,
                                college_name : college.name,
                            })
                        }
                    }else{
                        educationalDetails.masters.push({
                            faculty : marklist.faculty,
                            type : marklist.type,
                            pattern : marklist.patteren,
                            college_id : college.id,
                            college_name : college.name
                        })
                    }
                })

                
            }else if(marklist.type == 'Phd'){
                models.College.find({
                    where:{
                        id : marklist.collegeId
                    }
                }).then(function(college){
                    if(educationalDetails.phd.length > 0){
                    educationalDetails.phd.forEach(data=>{
                        if(data.faculty == marklist.faculty && data.college_id == marklist.collegeId){
                            flag = true;
                        }
                    });
                    if(flag == false){
                        educationalDetails.phd.push({
                            faculty : marklist.faculty,
                            type : marklist.type,
                            pattern : marklist.patteren,
                            college_id : college.id,
                            college_name : college.name,
                        })
                    }
                }else{
                    educationalDetails.phd.push({
                        faculty : marklist.faculty,
                        type : marklist.type,
                        pattern : marklist.patteren,
                        college_id : college.id,
                        college_name : college.name
                    })
                }
                })

                
            }
        })

        setTimeout(()=>{
             res.json({
                status : 200,
                data : educationalDetails
            })
        },1000)
    })
});


router.post('/setCurrentLocation', middlewares.getUserInfo, function(req,res){
    console.log('/setCurrentLocation')
    var user_id  = req.body.user_id;
    var location = req.body.location;
    models.User.update({
        current_location : location
    },{
        where :{
            id : user_id
        }
    }).then(function(user){
        if(user){
            models.Applied_For_Details.find({
                where:{
                    user_id : user_id,
                    app_id : null
                }
            }).then(function(appliedDetails){
                if(appliedDetails){
                    var appliedDetailsEducational;
                    if(appliedDetails.educationalDetails == true && appliedDetails.instructionalField == true && appliedDetails.curriculum == true && appliedDetails.gradToPer == true && appliedDetails.affiliation == true && appliedDetails.CompetencyLetter == true){  
                        appliedDetailsEducational = 6;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.instructionalField == true && appliedDetails.curriculum == true && appliedDetails.gradToPer == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 5;
                        
                    }else if((appliedDetails.CompetencyLetter == true && appliedDetails.affiliation == true && appliedDetails.gradToPer == true && appliedDetails.curriculum == true && appliedDetails.instructionalField == true)  || (appliedDetails.CompetencyLetter == true && appliedDetails.educationalDetails == true & appliedDetails.gradToPer == true && appliedDetails.curriculum == true && appliedDetails.instructionalField == true) || (appliedDetails.CompetencyLetter == true && appliedDetails.curriculum == true && appliedDetails.instructionalField == true && appliedDetails.affiliation == true && appliedDetails.educationalDetails == true ) || (appliedDetails.CompetencyLetter == true  && appliedDetails.instructionalField == true && appliedDetails.curriculum == true && appliedDetails.gradToPer == true && appliedDetails.educationalDetails == true) || (appliedDetails.CompetencyLetter == true && appliedDetails.affiliation == true && appliedDetails.instructionalField == true && appliedDetails.gradToPer == true && appliedDetails.educationalDetails == true) || (appliedDetails.affiliation == true && appliedDetails.instructionalField == true  && appliedDetails.curriculum == true && appliedDetails.gradToPer == true && appliedDetails.educationalDetails == true)){
                       console.log('in 5th')
                        appliedDetailsEducational =5;
                    }else if((appliedDetails.CompetencyLetter == true && appliedDetails.affiliation == true && appliedDetails.gradToPer == true && appliedDetails.curriculum == true )|| (appliedDetails.CompetencyLetter == true && appliedDetails.affiliation == true && appliedDetails.gradToPer == true && appliedDetails.instructionalField == true ) || (appliedDetails.CompetencyLetter == true && appliedDetails.affiliation == true &&  appliedDetails.gradToPer == true && appliedDetails.educationalDetails == true) || (appliedDetails.affiliation == true && appliedDetails.gradToPer == true && appliedDetails.curriculum == true && appliedDetails.instructionalField == true && appliedDetails.educationalDetails == true ) || (appliedDetails.gradToPer == true && appliedDetails.curriculum == true && appliedDetails.instructionalField == true  && appliedDetails.CompetencyLetter == true)|| (appliedDetails.curriculum == true && appliedDetails.instructionalField == true && appliedDetails.educationalDetails == true && appliedDetails.CompetencyLetter == true)|| (appliedDetails.curriculum == true && appliedDetails.instructionalField == true && appliedDetails.educationalDetails == true && appliedDetails.affiliation == true) || (appliedDetails.curriculum == true && appliedDetails.instructionalField == true && appliedDetails.educationalDetails == true && appliedDetails.gradToPer == true)|| (appliedDetails.instructionalField == true && appliedDetails.educationalDetails == true && appliedDetails.CompetencyLetter == true && appliedDetails.affiliation == true)|| (appliedDetails.instructionalField == true && appliedDetails.educationalDetails == true && appliedDetails.affiliation == true && appliedDetails.gradToPer == true) || (appliedDetails.educationalDetails == true && appliedDetails.curriculum == true && appliedDetails.gradToPer == true && appliedDetails.CompetencyLetter == true) || (appliedDetails.CompetencyLetter == true && appliedDetails.instructionalField == true && appliedDetails.affiliation == true &&  appliedDetails.gradToPer == true ) || (appliedDetails.CompetencyLetter == true && appliedDetails.educationalDetails == true && appliedDetails.curriculum == true && appliedDetails.affiliation == true) || (appliedDetails.CompetencyLetter == true && appliedDetails.instructionalField == true && appliedDetails.gradToPer == true && appliedDetails.curriculum == true))
                    {
                        appliedDetailsEducational =4;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.instructionalField == true && appliedDetails.curriculum == true && appliedDetails.gradToPer == true ){
                        appliedDetailsEducational = 4;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.instructionalField == true && appliedDetails.curriculum == true && appliedDetails.affiliation == true ){
                        appliedDetailsEducational = 4;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.instructionalField == true && appliedDetails.gradToPer == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 4;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.curriculum == true && appliedDetails.gradToPer == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 4;
                        
                    }else if(appliedDetails.instructionalField == true && appliedDetails.curriculum == true && appliedDetails.gradToPer == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 4;
                        
                    }else if((appliedDetails.CompetencyLetter == true && appliedDetails.affiliation == true && appliedDetails.gradToPer == true) || (appliedDetails.CompetencyLetter == true && appliedDetails.affiliation == true && appliedDetails.curriculum == true )|| (appliedDetails.CompetencyLetter== true && appliedDetails.affiliation == true && appliedDetails.instructionalField == true )|| (appliedDetails.CompetencyLetter == true && appliedDetails.affiliation == true && appliedDetails.educationalDetails == true )|| (appliedDetails.CompetencyLetter == true && appliedDetails.gradToPer == true && appliedDetails.curriculum == true )|| (appliedDetails.CompetencyLetter == true && appliedDetails.gradToPer == true && appliedDetails.instructionalField == true )|| (appliedDetails.CompetencyLetter == true && appliedDetails.gradToPer == true && appliedDetails.educationalDetails == true) || (appliedDetails.CompetencyLetter == true && appliedDetails.curriculum == true && appliedDetails.instructionalField == true )|| (appliedDetails.CompetencyLetter == true && appliedDetails.curriculum == true && appliedDetails.educationalDetails == true )||( appliedDetails.CompetencyLetter ==true && appliedDetails.instructionalField == true && appliedDetails.educationalDetails == true)){
                        console.log("IN 3rd")
                        appliedDetailsEducational =3;
                    
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.instructionalField == true && appliedDetails.curriculum == true){
                        appliedDetailsEducational = 3;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.instructionalField == true && appliedDetails.gradToPer == true){
                        appliedDetailsEducational = 3;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.gradToPer == true && appliedDetails.curriculum == true){
                        appliedDetailsEducational = 3;
                        
                    }else if(appliedDetails.gradToPer == true && appliedDetails.instructionalField == true && appliedDetails.curriculum == true){
                        appliedDetailsEducational = 3;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.instructionalField == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 3;
                        
                    }else if(appliedDetails.gradToPer == true && appliedDetails.instructionalField == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 3;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.gradToPer == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 3;
                        
                    }else if(appliedDetails.instructionalField == true && appliedDetails.curriculum == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 3;
                        
                    }else if(appliedDetails.gradToPer == true && appliedDetails.curriculum == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 3;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.curriculum == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 3;
                        
                    }else if((appliedDetails.CompetencyLetter == true && appliedDetails.affiliation == true) || (appliedDetails.CompetencyLetter == true && appliedDetails.gradToPer == true) || (appliedDetails.CompetencyLetter == true && appliedDetails.curriculum == true) || (appliedDetails.CompetencyLetter ==true && appliedDetails.instructionalField == true) || (appliedDetails.CompetencyLetter == true && appliedDetails.educationalDetails == true) || (appliedDetails.CompetencyLetter == true && appliedDetails.gradToPer == true) || (appliedDetails.affiliation === true && appliedDetails.curriculum == true) || (appliedDetails.affiliation == true && appliedDetails.instructionalField == true) || (appliedDetails.affiliation == true && appliedDetails.educationalDetails == true )|| (appliedDetails.gradToPer == true && appliedDetails.curriculum== true) || (appliedDetails.gradToPer == true && appliedDetails.instructionalField == true) || (appliedDetails.gradToPer == true && appliedDetails.educationalDetails == true) || (appliedDetails.curriculum == true && appliedDetails.instructionalField == true) || (appliedDetails.curriculum == true && appliedDetails.educationalDetails == true) || (appliedDetails.instructionalField == true && appliedDetails.educationalDetails == true) || (appliedDetails.CompetencyLetter == true && appliedDetails.educationalDetails == true)){
                        console.log("in second")
                        appliedDetailsEducational = 2;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.gradToPer == true){
                        appliedDetailsEducational = 2;
                        
                    }else if(appliedDetails.gradToPer == true && appliedDetails.instructionalField == true){
                        appliedDetailsEducational = 2;
                        
                    }else if(appliedDetails.gradToPer == true && appliedDetails.curriculum == true){
                        appliedDetailsEducational = 2;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.instructionalField == true){
                        appliedDetailsEducational = 2;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.curriculum == true){
                        appliedDetailsEducational = 2;
                        
                    }else if(appliedDetails.instructionalField == true && appliedDetails.curriculum == true){
                        appliedDetailsEducational = 2;
                        
                    }else if(appliedDetails.gradToPer == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 2;
                        
                    }else if(appliedDetails.educationalDetails == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 2;
                        
                    }else if(appliedDetails.affiliation == true && appliedDetails.curriculum == true){
                        appliedDetailsEducational = 2;
                        
                    }else if(appliedDetails.instructionalField == true && appliedDetails.affiliation == true){
                        appliedDetailsEducational = 2;
                        
                    }else if(appliedDetails.curriculum == true){
                        appliedDetailsEducational = 1;
                        
                    }else if(appliedDetails.instructionalField == true){
                        appliedDetailsEducational = 1;
                        
                    }else if(appliedDetails.gradToPer == true){
                        appliedDetailsEducational = 1;
                        
                    }else if(appliedDetails.affiliation == true){
                        appliedDetailsEducational = 1;
                        
                    }else if(appliedDetails.CompetencyLetter == true){
                      console.log('iiiiii')
                        appliedDetailsEducational = 1;
                        
                    }else if(appliedDetails.educationalDetails == true){
                        console.log("educational")
                        appliedDetailsEducational = 1;
                        
                    }else{
                        appliedDetailsEducational = 0;
                    }
                    var amount;
                    if(location == "WITHIN"){
                        amount  = 536 * appliedDetailsEducational;
                    }else if(location == "OUTSIDE"){
                        amount  = 8308 * appliedDetailsEducational;
                    }

                    models.Institution_details.findAll({
                        where :{
                            user_id : user_id,
                            app_id : null
                        }
                    }).then(function(institutes){
                        if(institutes.length > 0){
                            institutes.forEach(institute=>{
                                models.Cart.update({fees : amount},{
                                    where:{
                                        user_id : user_id,
                                        institute_id : institute.id,
                                    }
                                })
                            })
                           
                            res.json({
                                status : 200
                            })
                        }
                    })
                }
                
            });
            
        }else{
            res.json({
                status : 400
            })
        }
    })
})

module.exports = router;