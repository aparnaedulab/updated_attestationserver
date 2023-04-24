var path = require('path');
var root_path = path.dirname(require.main.filename);
var models = require(root_path + '/models');
const express = require('express');
var router = express.Router();
var constant = require(root_path + '/config/constant');
const client = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
const logger = require('../logger')("Admin route : " + __filename);
var request = require('request');
var functions = require(root_path+'/utils/function');
var functions = require('../utils/function');
const viewfileurl = "http://localhost:4001"

var moment = require('moment');
var async = require('async');
const multer = require('multer');
var Sequelize = require("sequelize");
const Op = Sequelize.Op;
const middlewares = require('../middlewares');
var json2xls = require('json2xls');
var fs = require('fs');
var urlencode = require('urlencode');
var self_pdf = require(root_path+'/utils/self_letters');
var converter = require('number-to-words');

router.get('/getApplicationDetailsByUser', function (req, res) {
    var students = [];
    var page = req.query.page;
    var id = req.query.id ? req.query.id : '';
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
    var source_from = req.query.source_from ? req.query.source_from : '';
    var tracker = req.query.tracker ? req.query.tracker : null;
    var status = req.query.status ? req.query.status : null;
    console.log("page" + page);
    console.log("name" + name);
    console.log("email" + email);
    console.log("source_from" + source_from);
    console.log("tracker" + tracker);
    console.log("status" + status);
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
            filter.value = " AND( usr.name like '%" + nameSplit[0] + "%' OR usr.surname like '%" + nameSplit[0] + "%') ";
            filters.push(filter);
        }else if(nameSplit.length == 2){
             filter.name = 'name';
            filter.value = " AND usr.name like '%" + nameSplit[0] + "%' AND usr.surname like '%" + nameSplit[1] + "%' ";
            filters.push(filter);
        }else{
             filter.name = 'name';
             var lastElement = nameSplit.pop();
            filter.value = " AND usr.name like '%" + nameSplit.join(' ') + "%' AND usr.surname like '%" + lastElement + "%' ";
            filters.push(filter);
        }

    }
    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(source_from != '' && source_from != null && source_from != undefined && source_from != 'null' && source_from != 'undefined'){
        var filter ={};
        filter.name = 'source_from';
        filter.value = source_from;
        filters.push(filter);
	}



   models.Application.getApplicationByUser(filters,tracker,status,null,null).then(data1 => {
        countObjects.totalLength = data1.length;
        models.Application.getApplicationByUser(filters,tracker,status,limit,offset).then(data => {
            countObjects.filteredLength = data.length;
            require('async').eachSeries(data, function(student, callback){
                students.push({
                    user_id : student.user_id,
                    name :student.name,
                    email : student.email,
                    services : student.app_data
                });
                callback();
            }, function(){
                res.json({
                    status: 200,
                    message: 'Student retrive successfully',
                    items : students,
                    total_count : countObjects
                });
            });
        });
    });
});

router.get('/checksignedpdf',function (req, res) {
    console.log("checksignedpdfchecksignedpdf");
    var userId = req.query.userId;
    var app_id = req.query.id;

    models.VerificationTypes.findOne({
        where :{
            user_id : userId
        }
    }).then(function(verificationType){
        var count = 0;
        var file_count = 0;
        if(verificationType.marksheet  == true){
            count++;
            var file = constant.FILE_LOCATION + "public/upload/documents/" + userId + "/" + app_id +'_marksheetVerificationCertificate.pdf';
            if(fs.existsSync(file)){
                file_count++;
            }
        }
        if(verificationType.transcript  == true){
            count++;
            var file = constant.FILE_LOCATION + "public/upload/documents/" + userId + "/" + app_id +'_transcriptVerificationCertificate.pdf';
            if(fs.existsSync(file)){
                file_count++;
            }
        }
        if(verificationType.degreeCertificate  == true){
            count++;
            var file = constant.FILE_LOCATION + "public/upload/documents/" + userId + "/" + app_id +'_degreeVerificationCertificate.pdf';
            if(fs.existsSync(file)){
                file_count++;
            }
        }

        if(count == file_count){
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

router.get('/superview', async function (req, res) {
    console.log("iddd mila", req.query.userId);
    var user_id = req.query.userId
    // var app_id=req.query.app_id
    // console.log("app_id",app_id);
    var studentObj = {
        personal_info: {},
        pdcedudetail: [],
        convactionedudetail: [],
        userTranscripts: [],
        userTranscriptmigration: [],
        gumigrationedu: [],
        convactiondocs: [],
        marksheetDetails: [],
        transcriptDetails: [],
        degreeDetails: [],
        migrationapplication: []

    };
    var array = ['Photo', 'Sign', 'Transfer Certificate', 'Enrollment Letter', 'Bonafide Letter', 'PRN Status Report', 'SemesterOne', 'SemesterTwo', 'SemesterThree', 'SemesterFour', 'SemesterFive', 'SemesterSix', 'SemesterSeven', 'SemesterEight', 'SemesterNine', 'SemesterTen']
    //To Get User Data
    let userdata = await functions.getuserdetail(user_id);
    for (let data of userdata) {
        console.log("ddddd", JSON.stringify(data));
        studentObj.personal_info.userid = data.id,
            studentObj.personal_info.name = data.name,
            studentObj.personal_info.surname = data.surname,
            studentObj.personal_info.email = data.email,
            studentObj.personal_info.mobile_country_code = data.mobile_country_code,
            studentObj.personal_info.mobile = data.mobile,
            studentObj.personal_info.gender = data.gender,
            studentObj.personal_info.city = data.city,
            studentObj.personal_info.postal_code = data.postal_code,
            studentObj.personal_info.address = data.address,
            studentObj.personal_info.what_mobile_country_code = data.what_mobile_country_code,
            studentObj.personal_info.what_mobile = data.what_mobile,
            studentObj.personal_info.current_location = data.current_location
        studentObj.personal_info.dob = data.dob

    }
    //To Get PDC Education Data
    let edudetail = await functions.getedudetailpdc(user_id, 'pdc')
    studentObj.pdcedudetail.push(...edudetail)
    //To Get Convaction Education Data
    let edudetailconavction = await functions.getedudetailpdc(user_id, 'guconvocation')
    studentObj.convactionedudetail.push(...edudetailconavction)
    let docdata = await functions.getdocdetailpdc(user_id, 'pdc')
    if (docdata.length > 0) {
        for (let usertranscript of docdata) {
            console.log("6666666", usertranscript);
            var imgArr = usertranscript.file_name.split('.');
            var extension = imgArr[imgArr.length - 1].trim();
            var docname
            var app_id = usertranscript.app_id
            var documents
            if (usertranscript.name == 'YearThird' || usertranscript.name == 'SemesterSix') {
                docname = 'Final Year Marksheet'
            }
            else if (usertranscript.name == 'Photo' || usertranscript.name == 'extra' || usertranscript.name == 'Convaction Fee') {
                docname = usertranscript.name
            }
            console.log("docname", docname);
            studentObj.userTranscripts.push({
                id: usertranscript.id,
                name: usertranscript.name,
                pdfimage: 'https://cdn.elegantthemes.com/blog/wp-content/uploads/2016/09/wordpress-pdf-icon.png',
                file_name: usertranscript.file_name,
                file: viewfileurl + "/upload/documents/" + usertranscript.user_id + "/" + usertranscript.file_name,
                extension: extension,
                source: usertranscript.source,
                userid: usertranscript.user_id,
                docname: docname,
                app_id: app_id,

            });

        }

    }
    //To Get Convaction Document Data Data
    let docdataconvacttion = await functions.getdocdetailpdc(user_id, 'guconvocation')
    if (docdataconvacttion.length > 0) {
        for (let usertranscript of docdataconvacttion) {
            var imgArr = usertranscript.file_name.split('.');
            var extension = imgArr[imgArr.length - 1].trim();
            var docname
            var app_id = usertranscript.app_id
            var documents
            if (usertranscript.name == 'YearThird' || usertranscript.name == 'SemesterSix') {
                docname = 'Final Year Marksheet'
            }
            else if (usertranscript.name == 'Photo' || usertranscript.name == 'extra' || usertranscript.name == 'Convaction Fee') {
                docname = usertranscript.name
            }
            console.log("docname", docname);
            studentObj.convactiondocs.push({
                id: usertranscript.id,
                name: usertranscript.name,
                pdfimage: 'https://cdn.elegantthemes.com/blog/wp-content/uploads/2016/09/wordpress-pdf-icon.png',
                file_name: usertranscript.file_name,
                file: viewfileurl + "/upload/documents/" + usertranscript.user_id + "/" + usertranscript.file_name,
                extension: extension,
                source: usertranscript.source,
                userid: usertranscript.user_id,
                docname: docname,
                app_id: app_id,

            });

        }
    }
    //To Get Migration Education Data
    console.log("user_id",user_id);
    let edumigration = await functions.getedumigration(user_id)
    if(edumigration.length>0){
        let Application = await functions.getapplicationmig(user_id, 'gumigration')
        if(Application.length>0){
            edumigration.map((data) => {
                let data22 = { ...data, app_id:Application[0].id,education_lock :Application[0].education_lock,notes:Application[0].notes};
                    studentObj.gumigrationedu.push(data22)
                });
        }
   
        //To Get Migration Document
        let migrationmarksheet = await functions.getdocdetailmig(user_id, 'gumigration')
        for (let userTranscript of migrationmarksheet) {
            var index = array.indexOf(userTranscript.name);
            if (index !== -1) {
                array.splice(index, 1);
            }
            var imgArr = userTranscript.file_name.split('.');
            var extension = imgArr[imgArr.length - 1].trim();
            studentObj.userTranscriptmigration.push({
                id: userTranscript.id,
                name: userTranscript.name,
                userid: userTranscript.user_id,
                image: "https://gumigration.studentscenter.in/api/" + "upload/documents/" + userTranscript.user_id + '/' + userTranscript.file_name,
                file_name: userTranscript.file_name,
                file_path: '/var/www/' + "public/upload/documents/" + userTranscript.user_id + '/' + userTranscript.file_name,
                timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                transcript_lock: userTranscript.lock_transcript,
                extension: extension,
                type: userTranscript.type
                //collegeName : college.name
            });
        }
    }
  
    //To Get Verifcation Data
    let verification = await functions.getverification(user_id)
    if (verification.length > 0) {
        for (let document of verification) {
            var extension = document.file.split('.');
            if (document.type == 'marksheet') {
                studentObj.marksheetDetails.push({
                    id: document.id,
                    userid: document.user_id,
                    app_id: document.app_id,
                    courseName: document.courseName,
                    seatNo: document.seatNo,
                    passingMonthYear: moment(new Date(document.PassingMonthYear)).format('MMM YYYY'),
                    fileName: document.file,
                    fileSrc: 'https://guverify.studentscenter.in/api/' + 'upload/documents/' + user_id + '/' + document.file,
                    fileExtension: extension[1],
                    lock_transcript: (document.lock_transcript == 'requested') ? true : false,
                    upload_step: (document.upload_step == 'requested') ? true : false
                })
            } else if (document.type == 'transcript') {
                studentObj.transcriptDetails.push({
                    id: document.id,
                    userid: document.user_id,
                    app_id: document.app_id,
                    courseName: document.courseName,
                    seatNo: document.seatNo,
                    passingMonthYear: moment(new Date(document.PassingMonthYear)).format('MMM YYYY'),
                    fileName: document.file,
                    fileSrc: 'https://guverify.studentscenter.in/api/' + 'upload/documents/' + user_id + '/' + document.file,
                    fileExtension: extension[1],
                    lock_transcript: (document.lock_transcript == 'requested') ? true : false,
                    upload_step: (document.upload_step == 'requested') ? true : false
                })
            } else if (document.type == 'degree') {
                studentObj.degreeDetails.push({
                    id: document.id,
                    courseName: document.courseName,
                    seatNo: document.seatNo,
                    userid: document.user_id,
                    app_id: document.app_id,
                    passingMonthYear: moment(new Date(document.PassingMonthYear)).format('MMM YYYY'),
                    fileName: document.file,
                    fileSrc: 'https://guverify.studentscenter.in/api/' + 'upload/documents/' + user_id + '/' + document.file,
                    fileExtension: extension[1],
                    lock_transcript: (document.lock_transcript == 'requested') ? true : false,
                    upload_step: (document.upload_step == 'requested') ? true : false
                })
            }
        }
    }
    res.json({
        status: 200,
        data: studentObj
    })


});

  // sending email to institutte and then to the student on signed application
  router.post('/sendEmail',middlewares.getUserInfo, function (req, res) {
    console.log('/sendEmail');
    var app_id = req.body.id;
    var istituteEmails = [];
    var attachments = [];
    var studentData = {};
    // var url =constant.BASE_URL_SENDGRID + '_SendVerificationEmail'
    // models.User.findOne({
    //     where : {
    //         id :  req.User.id
    //     }
    // }).then(function (UserDetail){
    //     models.Application.findOne({
    //         where :{
    //             id : app_id
    //         }
    //     }).then(function(application){
    //         models.InstituteDetails.findAll({
    //             where:{
    //                 user_id : application.user_id,
    //                 app_id : app_id
    //             }
    //         }).then(function(instituteDetails){
    //             instituteDetails.forEach(institute=>{
    //                 if(!(instituteEmails.includes(institute.email))){
    //                     instituteEmails.push({
    //                         email : institute.email,
    //                         type : institute.type,
    //                         referenceNo  : institute.referenceNo
    //                     })
    //                 }
    //             })
    //             if(instituteEmails.length > 1){
    //                 instituteEmails.forEach(inst=>{
    //                     if(inst.type == 'marksheet'){
    //                         var file = constant.FILE_LOCATION + 'public/upload/documents/' + application.user_id + '/' + app_id + "_marksheetVerificationCertificate.pdf";
    //                         if(fs.existsSync(file)){
    //                             var attachment = {};
    //                             var base64String = fs.readFileSync(file).toString("base64");
    //                             attachment = {
    //                                 content: base64String,
    //                                 filename: app_id + "_marksheetVerificationCertificate.pdf",
    //                                 type: 'application/pdf',
    //                                 disposition: 'attachment',
    //                                 contentId: 'mytext'
    //                             }
    //                             attachments.push(attachment);
    //                         }
    //                         inst.attachments = attachments;
    //                     }
    //                     if(inst.type == 'transcript'){
    //                         var file = constant.FILE_LOCATION + 'public/upload/documents/' + application.user_id + '/' + app_id + "_transcriptVerificationCertificate.pdf";
    //                         if(fs.existsSync(file)){
    //                             var attachment = {};
    //                             var base64String = fs.readFileSync(file).toString("base64");
    //                             attachment = {
    //                                 content: base64String,
    //                                 filename: app_id + "_transcriptVerificationCertificate.pdf",
    //                                 type: 'application/pdf',
    //                                 disposition: 'attachment',
    //                                 contentId: 'mytext'
    //                             }
    //                            attachments.push(attachment);
    //                         }
    //                         inst.attachments = attachments;
    //                     }
    //                     if(inst.type == 'degree'){
    //                         var file = constant.FILE_LOCATION + 'public/upload/documents/' + application.user_id + '/' + app_id + "_degreeVerificationCertificate.pdf";
    //                         if(fs.existsSync(file)){
    //                             var attachment = {};
    //                             var base64String = fs.readFileSync(file).toString("base64");
    //                             attachment = {
    //                                 content: base64String,
    //                                 filename: app_id + "_degreeVerificationCertificate.pdf",
    //                                 type: 'application/pdf',
    //                                 disposition: 'attachment',
    //                                 contentId: 'mytext'
    //                             }
    //                             attachments.push(attachment);
    //                         }
    //                         inst.attachments = attachments;
    //                     }
    //                 })
    //                  if(attachments.length > 0){
    //                         request.post(constant.BASE_URL_SENDGRID + 'pdf_send_email1_verification', {
    //                           json: {
    //                                 userName : UserDetail.name,
    //                                 surname : UserDetail.surname,
    //                                 userEmail : UserDetail.email,
    //                                 mobile : UserDetail.mobile,
    //                                 instituteEmails : instituteEmails,
    //                                 attachments : (attachments.length) > 0 ? attachments : null,
    //                                 source : 'verification'
    //                           }
    //                         }, function (error, response, body) {
    //                           if (error || body.status == 400) {
    //                                 return  res.json({
    //                                   status : 400,
    //                                   message : 'Error in sending Signed Document to email',
    //                                 })
    //                           }else if(body.status == 200){
    //                                 //TODO: HERE UPDATING THE STATUS OF APPLICATION FROM SIGNED TO DONE
    //                                 application.update({
    //                                   tracker: 'done'
    //                                 }).then(function (result) {
    //                                     if(result){
    //                                     //   var userName = student[0].name + ' ' + student[0].surname;
    //                                     //   var Remark = "Your application  no."+app_id+" has been sent to the "+email_arr+" you mentioned."
    //                                     //   var xls = json2xls(sentDocuments);
    //                                     //   var attachments = {};
    //                                         // var file_location = constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+app_id+".xlsx";
    //                                         // fs.writeFileSync(file_location, xls, 'binary');
    //                                         // var file_name = student[0].name+student[0].surname+'_'+app_id+".xlsx";
    //                                         // base64.encode(constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+app_id+".xlsx", function(err, base64String) {
    //                                         //    attachments = {
    //                                         //         content: base64String,
    //                                         //         filename: file_name,
    //                                         //         type: 'application/xlsx',
    //                                         //         disposition: 'attachment',
    //                                         //         contentId: 'mytext'
    //                                         //     }
    //                                             studentData.userName = UserDetail.name;
    //                                             studentData.userEmail = UserDetail.email;
    //                                             // studentData.attachments = attachments;
    //                                             studentData.purpose = instituteEmails.email;
    //                                             studentData.emailSent = moment(result.updated_at).format("YYYY-MM-DD HH:MM:SS");
    //                                         // })
    //                                         setTimeout(()=>{
    //                                             // console.log("studentData == " + JSON.stringify(studentData));
    //                                                 request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent_other_verification', {
    //                                                 json: {
    //                                                     studentData : studentData,
    //                                                     source : 'verification'
    //                                                 }
    //                                             })
    //                                           res.json({
    //                                               status : 200,
    //                                               message : 'signed pdf emailed to institute successfully!',
    //                                           })
    //                                       },1000);
    //                                     }else{
    //                                       res.json({
    //                                       status : 400,
    //                                       message : 'Email not sent!',
    //                                       })
    //                                     }
    //                                 })


    //                           }
    //                         });
    //                  }else{
    //                       return  res.json({
    //                           status : 400,
    //                           message : 'There is no signed documents so that can not process application further',
    //                       })
    //                  }

    //             }else if(instituteEmails.length == 1){
    //                 models.VerificationTypes.findOne({
    //                     where :{
    //                         user_id : application.user_id
    //                     }
    //                 }).then(function(verificationTypes){
    //                     if(verificationTypes.marksheet == true){
    //                         var file = constant.FILE_LOCATION + 'public/upload/documents/' + application.user_id + '/' + app_id + "_marksheetVerificationCertificate.pdf";
    //                         if(fs.existsSync(file)){
    //                             var attachment = {};
    //                             var base64String = fs.readFileSync(file).toString("base64");
    //                             attachment = {
    //                                 content: base64String,
    //                                 filename: app_id + "_marksheetVerificationCertificate.pdf",
    //                                 type: 'application/pdf',
    //                                 disposition: 'attachment',
    //                                 contentId: 'mytext'
    //                             }
    //                             attachments.push(attachment);
    //                         }
    //                     }
    //                     if(verificationTypes.transcript == true){
    //                         var file = constant.FILE_LOCATION + 'public/upload/documents/' + application.user_id + '/' + app_id + "_transcriptVerificationCertificate.pdf";
    //                         if(fs.existsSync(file)){
    //                             var attachment = {};
    //                             var base64String = fs.readFileSync(file).toString("base64");
    //                             attachment = {
    //                                 content: base64String,
    //                                 filename: app_id + "_transcriptVerificationCertificate.pdf",
    //                                 type: 'application/pdf',
    //                                 disposition: 'attachment',
    //                                 contentId: 'mytext'
    //                             }
    //                             attachments.push(attachment);
    //                         }
    //                     }
    //                     if(verificationTypes.degreeCertificate == true){
    //                         var file = constant.FILE_LOCATION + 'public/upload/documents/' + application.user_id + '/' + app_id + "_degreeVerificationCertificate.pdf";
    //                         if(fs.existsSync(file)){
    //                             var attachment = {};
    //                             var base64String = fs.readFileSync(file).toString("base64");
    //                             attachment = {
    //                                 content: base64String,
    //                                 filename: app_id + "_degreeVerificationCertificate.pdf",
    //                                 type: 'application/pdf',
    //                                 disposition: 'attachment',
    //                                 contentId: 'mytext'
    //                             }
    //                             attachments.push(attachment);
    //                         }
    //                     }

    //                     instituteEmails.push({
    //                         attachments : attachments,
    //                         email : instituteDetails[0].email,
    //                         referenceNo  : instituteDetails[0].referenceNo

    //                     })

    //                     if(attachments.length > 0){
    //                         request.post(constant.BASE_URL_SENDGRID + 'pdf_send_email1_verification', {
    //                           json: {
    //                                 userName : UserDetail.name,
    //                                 surname : UserDetail.surname,
    //                                 userEmail : UserDetail.email,
    //                                 mobile : UserDetail.mobile,
    //                                 instituteEmails : instituteEmails,
    //                                 attachments : (attachments.length) > 0 ? attachments : null,
    //                                 source : 'verification'
    //                           }
    //                         }, function (error, response, body) {
    //                             if (error || body.status == 400) {
    //                                 return  res.json({
    //                                   status : 400,
    //                                   message : 'Error in sending Signed Document to email',
    //                                 })
    //                           }else if(body.status == 200){
    //                                 //TODO: HERE UPDATING THE STATUS OF APPLICATION FROM SIGNED TO DONE
    //                                 application.update({
    //                                   tracker: 'done'
    //                                 }).then(function (result) {
    //                                     if(result){
    //                                     //   var userName = student[0].name + ' ' + student[0].surname;
    //                                     //   var Remark = "Your application  no."+app_id+" has been sent to the "+email_arr+" you mentioned."
    //                                     //   var xls = json2xls(sentDocuments);
    //                                     //   var attachments = {};
    //                                         // var file_location = constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+app_id+".xlsx";
    //                                         // fs.writeFileSync(file_location, xls, 'binary');
    //                                         // var file_name = student[0].name+student[0].surname+'_'+app_id+".xlsx";
    //                                         // base64.encode(constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+app_id+".xlsx", function(err, base64String) {
    //                                         //    attachments = {
    //                                         //         content: base64String,
    //                                         //         filename: file_name,
    //                                         //         type: 'application/xlsx',
    //                                         //         disposition: 'attachment',
    //                                         //         contentId: 'mytext'
    //                                         //     }
    //                                             studentData.userName = UserDetail.name;
    //                                             studentData.userEmail = UserDetail.email;
    //                                             // studentData.attachments = attachments;
    //                                             studentData.purpose = instituteEmails.email;
    //                                             studentData.emailSent = moment(result.updated_at).format("YYYY-MM-DD HH:MM:SS");
    //                                         // })
    //                                         setTimeout(()=>{
    //                                             // console.log("studentData == " + JSON.stringify(studentData));
    //                                                 request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent_other_verification', {
    //                                                 json: {
    //                                                     studentData : studentData,
    //                                                     source : 'verification'
    //                                                 }
    //                                             })
    //                                           res.json({
    //                                               status : 200,
    //                                               message : 'signed pdf emailed to institute successfully!',
    //                                           })
    //                                       },1000);
    //                                     }else{
    //                                       res.json({
    //                                       status : 400,
    //                                       message : 'Email not sent!',
    //                                       })
    //                                     }
    //                                 })


    //                           }
    //                         });
    //                  }else{
    //                       return  res.json({
    //                           status : 400,
    //                           message : 'There is no signed documents so that can not process application further',
    //                       })
    //                  }
    //                 })
    //             }


    //         })
    //     })
    // })

    request.post(constant.VERIFY_BASE_URL+'/application/sendEmail',{json:{"app_id":app_id,"email":req.User.email}},
    function(error, response, VERIFY){
        if(!error){
            console.log("VERIFY==>",VERIFY);
        }else{
            console.log("response",VERIFY);
            if(VERIFY.status == 200){
                res.json({
                    status:200,
                    message:'Application Sent Successfullly..'
                })
            }
        }
    })

})

//Auther Shweta Vaidya
//Get all data from activity tracker tab
router.get('/superactivitytracker', function(req, res) {
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
    models.Activitytracker.getsuperactivitySearchResults(filters,null,null).then(function(useractivity){
        countObjects.totalLength = useractivity.length;
        models.Activitytracker.getsuperactivitySearchResults(filters,limit,offset).then(function(filter_activity) {
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
                        source_from:(student.source_from)? student.source_from:'',
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


router.get('/students', function (req, res){
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

/*  Author : Priyanka Divekar
    Route : Set tracker to verified and status to accept
    Paramater : user id and application id  and type as current tab*/

    router.post('/setTrackerStatus', middlewares.getUserInfo, (req,res,next)=>{
        console.log('/setTrackerStatus');
        var user_id = req.body.user_id;
        var type = req.body.type;
        var app_id = req.body.id;
        var source_from = req.body.source_from;
        if(source_from == 'guverification'){
            request.post(constant.VERIFY_BASE_URL+'/application/setVerified',{json:{"app_id":req.body.id,"userId":req.body.user_id,"value":type,"adminEmail":req.User.email}},
            function(error, response, VERIFY){
                if(!error){
                    console.log("VERIFY==>",VERIFY);
                }else{
                    console.log("response",VERIFY);
                    if(VERIFY.status == 200){
                        res.json({
                            status:200,
                            message:'Application Verified Successfullly..'
                        })
                    }
                }
            })
        }else {
            models.Application.findOne({
                where :{
                    user_id : user_id,
                    id : app_id
                }
            }).then(function(application){
                if(type == 'pending'){
                    application.update({
                        tracker : 'verified',
                        status : 'accept',
                        approved_by : req.User.email
                    }).then(function(updated){
                        if(updated){
                            models.Activitytracker.create({
                                user_id  : req.User.id,
                                activity : 'Application Verified',
                                data : 'Application ' + app_id + ' is verified by ' + req.User.email,
                                applicaiton_id  : app_id
                            }).then(function(activityCreated){
                                models.User.findOne({
                                    where :{
                                        id  :user_id
                                    }
                                }).then(function(userdata){
                                    request.post(constant.BASE_URL_SENDGRID + 'applicationStatus', {
                                        json: {
                                            email : userdata.email,
                                            name : userdata.name + ' ' + userdata.surname,
                                            app_id : app_id,
                                            statusType : 'verified',
                                            mobile : userdata.mobile,
                                            mobile_country_code : userdata.mobile_country_code,
                                            source : 'gu',
                                            source_from : application.source_from
                                        }
                                    }, function (error, response, body) {
                                        return res.json({
                                            status: 200,
        
                                        });
                                    })
                                })
                            })
                        }else{
                            res.json({
                                status : 400
                            })
                        }
                    })
                }
            })
        }
        
    })
    
    router.post('/printSuperAdmin',middlewares.getUserInfo,function(req,res){
        // console.log("/printSuperAdmin",req);
        var source_from = req.body.source_from;
        if(source_from == 'gumigration'){
            request.post(constant.MIG_BASE_URL+'/api/signpdf/migration_certificate',{json:{"appl_id":req.body.app_id,"user_id":req.body.user_id,"data_Values":req.body.dataValues,"email_Admin":req.User.email}},
            function(error, response, MIG){
                if(!error){
                    console.log("MIG",MIG);
                }else{
                    console.log("response",MIG);
                    if(MIG.status == 200){
                        res.json({
                            status:200,
                            message:'Signed Successfullly..'
                        })
                    }
                }
            })
        }else if(source_from == 'guverification'){console.log("=========>",constant.VERIFY_BASE_URL+'/application/generateCertificate');
            request.post(constant.VERIFY_BASE_URL+'/application/generateCertificate',{json:{"app_id":req.body.app_id,"userId":req.body.user_id,"email":req.User.email}},
            function(error, response, VERIFY){
                if(!error){
                    console.log("VERIFY==>",VERIFY);
                }else{
                    console.log("response",VERIFY);
                    if(VERIFY.status == 200){
                        res.json({
                            status:200,
                            message:'Signed Successfullly..'
                        })
                    }
                }
            })
        }else if(source_from == 'guconvocation'){
    
        }else if(source_from == 'pdc'){
    
        }else if(source_from == 'attestation'){
            request.post(constant.VERIFY_BASE_URL+'/signpdf/documentSigning',{json:{"appl_id":req.body.app_id,"type":req.body.type,"degree":''}},
            function(error, response, VERIFY){
                if(!error){
                    console.log("VERIFY==>",VERIFY);
                }else{
                    console.log("response",VERIFY);
                    if(VERIFY.status == 200){
                        res.json({
                            status:200,
                            message:'Signed Successfullly..'
                        })
                    }
                }
            })
        }
    })
    
    /*  Author : Priyanka Divekar
    Route : get college wise application count for report
    Paramater : source_from as serive*/
    
    router.get('/collegeWiseApplicationCount', function (req, res){
        console.log("/collegeWiseApplicationCount",req.query.page);
        console.log("source_from ",req.query.source_from);
        var page = req.query.page;
        var limit = 10;
        var offset = (page - 1) * limit;
        var source_from = req.query.source_from;
        models.Program_List.getCollegeCourse(source_from).then(function(collegeDetails){
            console.log("collegeDetails == " + JSON.stringify(collegeDetails));
            res.json({
                status : 200,
                data : collegeDetails
            })
        });
    
        
    });
    
    /*  Author : Priyanka Divekar
    Route : get documents for printing the documents
    Paramater : application id and user id for getting document of the specified document and source_from  as serive*/
    
    router.get('/printDocuments',middlewares.getUserInfo,function(req,res){
        console.log("/printDocuments");
        var source_from = req.query.source_from;
        if(source_from == "guattestation"){
            var file_url = constant.BASE_URL+"/signedpdf/"+req.query.user_id+'/'+req.query.app_id+'_Merge.pdf';
            var file_path = constant.FILE_LOCATION +"public/signedpdf/"+req.query.user_id+'/'+req.query.app_id+'_Merge.pdf'
            if(fs.existsSync(file_path)){
                res.json({
                    status : 200,
                    data : file_url
                })
            }else{
                res.json({
                    status : 400,
                    data : null
                })
            }
        }else if(source_from == 'gumigration'){
            var file_url = constant.BASE_URL+"/upload/transcript/"+req.query.user_id+'/'+req.query.app_id+'_migration_certificate.pdf';
            var file_path = constant.FILE_LOCATION +"public/upload/transcript/"+req.query.user_id+'/'+req.query.app_id+'_migration_certificate.pdf'
            if(fs.existsSync(file_path)){
                res.json({
                    status : 200,
                    data : file_url
                })
            }else{
                res.json({
                    status : 400,
                    data : null
                })
            }
        }else if(source_from == 'guverification'){
            request.get(constant.VERIFY_BASE_URL+'/application/getVerificationLetters?id=' + req.query.app_id+ '&userId=' + req.query.user_id + '&email=' + req.User.email,
            function(error, response, VERIFY){
                console.log("in response")
                if(error){
                    
                }else{
                    console.log("response",VERIFY.status);
                    var data = JSON.parse(VERIFY);
                    if(data.status == 200){
                        console.log("in data 200")
                        res.json({
                            status:200,
                            data :data.data
                        })
                    }
                }
            })
        }else if(source_from == 'guconvocation'){
            var file_url = constant.BASE_URL+"/upload/certificate/"+req.query.user_id+'/'+req.query.app_id+'_convocationcertificate.pdf';
            var file_path = constant.FILE_LOCATION +"public/upload/certificate/"+req.query.user_id+'/'+req.query.app_id+'_convocationcertificate.pdf'
            if(fs.existsSync(file_path)){
                res.json({
                    status : 200,
                    data : file_url
                })
            }else{
                res.json({
                    status : 400,
                    data : null
                })
            }
        }else if(source_from == 'pdc'){
            var file_url = constant.BASE_URL+"/upload/certificate/"+req.query.user_id+'/'+req.query.app_id+'provisionaldegreecertificate.pdf';
            var file_path = constant.FILE_LOCATION +"public/upload/certificate/"+req.query.user_id+'/'+req.query.app_id+'provisionaldegreecertificate.pdf'
            if(fs.existsSync(file_path)){
                res.json({
                    status : 200,
                    data : file_url
                })
            }else{
                res.json({
                    status : 400,
                    data : null
                })
            }
        }
    })
    
    /*  Author : Priyanka Divekar
    Route : get delivery type and mode wise application count for each and ecvery portal
    Paramater : N/A*/
    
    router.get('/deliveryTypeModeWiseAppCount', function (req, res){
        console.log("/deliveryTypeModeWiseAppCount");
        var deliveryDetails = {
                attestation : {},
                verification :{},
                migration : {},
                convocation : {},
                pdc :{}
            }
    
            models.InstituteDetails.getDeliveryTypeModeWiseAppCount('guverification','Digital','Normal').then(function(deliveryTypeModeDetails){
                console.log("deliveryTypeModeDetails == "  + JSON.stringify(deliveryTypeModeDetails))
                deliveryDetails.verification.DN =  deliveryTypeModeDetails[0].app_count;
                models.InstituteDetails.getDeliveryTypeModeWiseAppCount('guverification','Digital','Urgent').then(function(deliveryTypeModeDetails){
                    deliveryDetails.verification.DU =  deliveryTypeModeDetails[0].app_count;
                    models.InstituteDetails.getDeliveryTypeModeWiseAppCount('guverification','Physical','Normal').then(function(deliveryTypeModeDetails){
                        deliveryDetails.verification.PN =  deliveryTypeModeDetails[0].app_count;
                        models.InstituteDetails.getDeliveryTypeModeWiseAppCount('guverification','Physical','Urgent').then(function(deliveryTypeModeDetails){
                            deliveryDetails.verification.PU =  deliveryTypeModeDetails[0].app_count;
                            models.Institution_details.getDeliveryTypeModeWiseAppCount('guattestation','Digital','Normal').then(function(deliveryTypeModeDetails){
                                deliveryDetails.attestation.DN =  deliveryTypeModeDetails[0].app_count;
                                models.Institution_details.getDeliveryTypeModeWiseAppCount('guattestation','Digital','quick').then(function(deliveryTypeModeDetails){
                                    deliveryDetails.attestation.DU =  deliveryTypeModeDetails[0].app_count;
                                    models.Institution_details.getDeliveryTypeModeWiseAppCount('guattestation','Physical','Normal').then(function(deliveryTypeModeDetails){
                                        deliveryDetails.attestation.PN =  deliveryTypeModeDetails[0].app_count;
                                        models.Institution_details.getDeliveryTypeModeWiseAppCount('guattestation','Physical','quick').then(function(deliveryTypeModeDetails){
                                            deliveryDetails.attestation.PU =  deliveryTypeModeDetails[0].app_count; 
                                            models.Application.getDeliveryTypeModeWiseAppCount('gumigration','Normal').then(function(deliveryTypeModeDetails){
                                                deliveryDetails.migration.PN =  deliveryTypeModeDetails[0].app_count;
                                                models.Application.getDeliveryTypeModeWiseAppCount('gumigration','Quick').then(function(deliveryTypeModeDetails){
                                                    deliveryDetails.migration.PU =  deliveryTypeModeDetails[0].app_count; 
                                                    models.Application.getDeliveryTypeModeWiseAppCount('guconvocation','Normal').then(function(deliveryTypeModeDetails){
                                                        deliveryDetails.convocation.PN =  deliveryTypeModeDetails[0].app_count;
                                                        models.Application.getDeliveryTypeModeWiseAppCount('guconvocation','Immediate').then(function(deliveryTypeModeDetails){
                                                            deliveryDetails.convocation.PU =  deliveryTypeModeDetails[0].app_count; 
                                                            models.Application.getDeliveryTypeModeWiseAppCount('pdc','Normal').then(function(deliveryTypeModeDetails){
                                                                deliveryDetails.pdc.PN =  deliveryTypeModeDetails[0].app_count;
                                                                models.Application.getDeliveryTypeModeWiseAppCount('pdc','Immediate').then(function(deliveryTypeModeDetails){
                                                                    deliveryDetails.pdc.PU =  deliveryTypeModeDetails[0].app_count; 
                                                                    deliveryDetails.migration.DN = 'N/A';
                                                                    deliveryDetails.migration.DU = 'N/A';
                                                                    deliveryDetails.convocation.DN = 'N/A';
                                                                    deliveryDetails.convocation.DU = 'N/A';
                                                                    deliveryDetails.pdc.DN = 'N/A';
                                                                    deliveryDetails.pdc.DU = 'N/A';
    
                                                                    res.json({
                                                                        status : 200,
                                                                        data : deliveryDetails
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
                        })
                    })
                })
            });
            
        
        
    });
    
    /*  Author : Priyanka Divekar
    Route : get student application details (showing services with count of each)
    Paramater : page is madetory, student name and email are optional. sudent name and email use for searching particular student data */
    
    router.get('/getStudentDetails', function (req, res) {
        var students = [];
        var page = req.query.page;
        var name = req.query.name ? req.query.name : '';
        var email = req.query.email ? req.query.email : '';
        console.log("page" + page);
        console.log("name" + name);
        console.log("email" + email);
        var limit = 10;
        var offset = (page - 1) * limit;
        var countObjects = {};
        var filters =[];
    
        models.Application.getStudentReportDetails(filters,null,null).then(data1 => {
            countObjects.totalLength = data1.length;
            models.Application.getStudentReportDetails(filters,limit,offset).then(data => {
                countObjects.filteredLength = data.length;
                require('async').eachSeries(data, function(student, callback){
                    students.push({
                        name :student.name,
                        email : student.email,
                        services : student.app_data
                    });
                    callback();
                }, function(){
                    res.json({
                        status: 200,
                        message: 'Student retrive successfully',
                        items : students,
                        total_count : countObjects
                    });
                });
            });
        });
    });

    /*  Author : Priyanka Divekar
    Route : get documents for printing the documents
    Paramater : application id and user id for getting document of the specified document and source_from  as serive*/
    
router.post('/printAddress',middlewares.getUserInfo,function(req,res){
    console.log("/printAddress");
    var source_from = req.body.source_from;
    var user_id = req.body.user_id;
    var app_id = req.body.appl_id;
    var section = req.body.section;
    var addressid = req.body.addressid;
    if(source_from == 'gumigration'){
        request.post(constant.MIG_BASE_URL+'/signpdf/printAddress',
        {json:{
            "user_id":user_id, "appl_id": app_id, "section":section
        }},
        function(error, response, VERIFY){
            console.log("in response")
            if(error){
                
            }else{
                console.log("response",VERIFY);
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    console.log("in data 200")
                    res.json({
                        status:200,
                        data :data.data
                    })
                }
            }
        })
    }else if(source_from == 'guverification'){
        request.get(constant.VERIFY_BASE_URL+'/application/getInstituteAddress?id=' + app_id+ '&userId=' +user_id + '&email=' + req.User.email + '&section=' + section,
        function(error, response, VERIFY){
            console.log("in response")
            if(error){
                
            }else{
                console.log("response",VERIFY.status);
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    console.log("in data 200")
                    res.json({
                        status:200,
                        data :data.data
                    })
                }
            }
        })
    }else if(source_from == 'guconvocation'){
        request.get(constant.CONVO_BASE_URL+'/getAddressAdmin?id=' + app_id + "&user_id=" + user_id + "&addressid=" + addressid,
        function(error, response, VERIFY){
            console.log("in response")
            if(error){
                
            }else{
                console.log("response",VERIFY.status);
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    console.log("in data 200")
                    res.json({
                        status:200,
                        data :data.data
                    })
                }
            }
        })
    }else if(source_from == 'pdc'){
        request.get(constant.PDC_BASE_URL+'/getAddressAdmin?id=' + app_id + "&user_id=" + user_id + "&addressid=" + addressid,
        function(error, response, VERIFY){
            console.log("in response")
            if(error){
                
            }else{
                console.log("response",VERIFY.status);
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    console.log("in data 200")
                    res.json({
                        status:200,
                        data :data.data
                    })
                }
            }
        })
    }
})


module.exports = router;