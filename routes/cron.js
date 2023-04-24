var path = require('path');
var root_path = path.dirname(require.main.filename);
var models  = require(root_path+'/models');
const express = require('express');
var router  = express.Router();
const middlewares = require('../middlewares');
var fs = require('fs');
var constant = require(root_path+'/config/constant');
var moment=require('moment');
var models = require("../models");
var CronJob = require('cron').CronJob;
var cron = require('node-cron');
var request = require("request");
var json2xls = require('json2xls');
var base64 = require('file-base64');
const client = require('@sendgrid/client');
client.setApiKey(constant.SENDGRID_API_KEY);
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(constant.SENDGRID_API_KEY);
var urlencode = require('urlencode');
var fn = require(root_path+'/routes/signpdf/signfn');
var self_PDF = require(root_path+'/utils/self_letters');


cron.schedule('0 9,21 * * *', () => {
//router.get('/autoMergeApp',function(req,res) {
    var print_array = [];
    var count = 0;

    var date = new Date(); // current time
    console.log("date=====>"+date);
    var hours = date.getHours();
    console.log("hours=====>"+hours);
    if(hours == 09){
        currentHoursMinutes = "09";
    }else if(hours == 21){
        currentHoursMinutes = "21";
    }else{
        currentHoursMinutes = hours;
    }

    var current_day = moment(new Date()).tz(constant.SYSTEM_TIMEZONE).format('YYYY-MM-DD');
    var outputDirectory = constant.FILE_LOCATION + "public/upload/autoprint/" + current_day+'_'+currentHoursMinutes;
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
    }

    var currentTime = moment().format('YYYY-MM-DD HH:mm:ss'); //now time
    console.log("currentTime====>"+currentTime)

    var today1  = moment().subtract(12, 'hours');
    var startTime = today1.format('YYYY-MM-DD HH:mm:ss');
    console.log("startTime====>"+startTime)

    //Merge students pdf array starts//
    var guconvocationstudent = " ";
    var gupdcdatastudent = " ";
    var guverificationstudent = " ";
    var gumigrationstudent = " ";
    var guattestationstudent = " ";
    var guinternship = " ";
    //Merge students pdf array ends//

    //Not Exist pdf array starts//
    var notExist = [];
    //Not Exist pdf array ends//

    models.Application.printapp(startTime,currentTime).then((results) => {
        //results.forEach(function(result){
        require('async').eachSeries(results, function(result, callback){
        //    console.log("result.app_data===>"+result.app_data);
        //    console.log("result.COUNT(*)===>"+result.count);
        //    console.log("result.source_from===>"+result.source_from);
            if(result.source_from == 'guinternship'){
                    var count1 = 0;
                    console.log("result.app_data.length====>"+result.app_data.length);
                    result.app_data.forEach(function(app){
                        count1++

                        var filePath = constant.FILE_LOCATION+"public/upload/documents/"+app.user_id+"/"+app.app_id +"_Merge.pdf";
                        if(fs.existsSync(filePath)){
                            console.log("existssss");
                            guinternshipstudent = guinternshipstudent+' "'+filePath+'" ';
                        }else{
                            console.log("not existssss 1");
                            notExist.push(app.app_id)
                        }

                        if(result.app_data.length == count1){
                            console.log("guconvocationstudent====>"+guinternshipstudent)
                            if(guinternshipstudent != " "){
                                console.log("------------- merge------------")
                                fn.mergeAutoPrint(currentHoursMinutes, result.source_from, outputDirectory, guinternshipstudent, function(err){
                                    if(err){
                                        
                                    }else{
                                        callback();
                                    }
                                })
                            }else{
                                console.log("-------------not merge------------")
                                callback();
                            }
                        }
                    })
            }

            if(result.source_from == 'pdc'){
                var count1 = 0;
                console.log("result.app_data.length====>"+result.app_data.length);
                result.app_data.forEach(function(app){
                    count1++

                    var filePath = constant.FILE_LOCATION+"public/upload/documents/"+app.user_id+"/"+app.app_id +"_Merge.pdf";
                    if(fs.existsSync(filePath)){
                        console.log("existssss");
                        gupdcdatastudent = gupdcdatastudent+' "'+filePath+'" ';
                    }else{
                        console.log("not existssss 2");
                        notExist.push(app.app_id)
                    }

                    if(result.app_data.length == count1){
                        console.log("gupdcdatastudent====>"+gupdcdatastudent)
                        if(gupdcdatastudent != " "){
                            console.log("------------- merge------------")
                            fn.mergeAutoPrint(currentHoursMinutes, result.source_from, outputDirectory, gupdcdatastudent, function(err){
                                if(err){
                                    
                                }else{
                                    callback();
                                }
                            })
                        }else{
                            console.log("-------------not merge------------")
                            callback();
                        }
                    }
                })
            }

            if(result.source_from == 'guverification'){
                var count1 = 0;
                console.log("result.app_data.length====>"+result.app_data.length);
                result.app_data.forEach(function(app){
                    count1++

                    var filePath = constant.FILE_LOCATION+"public/upload/documents/"+app.user_id+"/"+app.app_id +"_Merge.pdf";
                    if(fs.existsSync(filePath)){
                        console.log("existssss");
                        guverificationstudent = guverificationstudent+' "'+filePath+'" ';
                    }else{
                        console.log("not existssss 3");
                        notExist.push(app.app_id)
                    }

                    if(result.app_data.length == count1){
                        console.log("guverificationstudent====>"+guverificationstudent)
                        if(guverificationstudent != " "){
                            console.log("------------- merge------------")
                            fn.mergeAutoPrint(currentHoursMinutes, result.source_from, outputDirectory, guverificationstudent, function(err){
                                if(err){
                                    
                                }else{
                                    callback();
                                }
                            })
                        }else{
                            console.log("-------------not merge------------")
                            callback();
                        }
                    }
                })
            }

            if(result.source_from == 'gumigration'){
                var count1 = 0;
                console.log("result.app_data.length====>"+result.app_data.length);
                result.app_data.forEach(function(app){
                    count1++

                    var filePath = constant.FILE_LOCATION+"public/upload/documents/"+app.user_id+"/"+app.app_id +"_Merge.pdf";
                    if(fs.existsSync(filePath)){
                        console.log("existssss");
                        gumigrationstudent = gumigrationstudent+' "'+filePath+'" ';
                    }else{
                        console.log("not existssss 4");
                        notExist.push(app.app_id)
                    }


                    if(result.app_data.length == count1){
                        console.log("gumigrationstudent====>"+gumigrationstudent)
                        if(gumigrationstudent != " "){
                            console.log("------------- merge------------")
                            fn.mergeAutoPrint(currentHoursMinutes, result.source_from, outputDirectory, gumigrationstudent, function(err){
                                if(err){
                                    
                                }else{
                                    callback();
                                }
                            })
                        }else{
                            console.log("-------------not merge------------")
                            callback();
                        }
                    }
                })
            }

            if(result.source_from == 'guattestation' || result.source_from == 'gumoi'){
                var count1 = 0;
                console.log("result.app_data.length====>"+result.app_data.length);
                result.app_data.forEach(function(app){
                    count1++

                    var filePath = constant.FILE_LOCATION+"public/upload/documents/"+app.user_id+"/"+app.app_id +"_Merge.pdf";
                    if(fs.existsSync(filePath)){
                        console.log("existssss");
                        guattestationstudent = guattestationstudent+' "'+filePath+'" ';
                    }else{
                        console.log("not existssss 5");
                        notExist.push(app.app_id)
                    }

                    if(result.app_data.length == count1){
                        console.log("guattestationstudent====>"+guattestationstudent)
                        if(guattestationstudent != " "){
                            console.log("-------------merge------------")
                            fn.mergeAutoPrint(currentHoursMinutes, result.source_from, outputDirectory, guattestationstudent, function(err){
                                if(err){
                                    
                                }else{
                                    callback();
                                }
                            })
                        }else{
                            console.log("-------------not merge------------")
                            callback();
                        }
                    }
                })
            }
        }, function(){
            console.log("coming here after done");
            console.log("notExist=====>"+notExist);

            res.json({
                status : 200,
                data : notExist
            })
            //Send Email with application_id array
            // request.post(constant.BASE_URL_SENDGRID + 'mergePdfNotExistMail', {
            //     json: {	
            //         app_id : notExist,
            //         type : 'merge_Pdf_App_Not_Exist',
            //     }	
            // }, function (error, response, body) {	
            //     if(body.status == 200){	
            //         res.json({
            //             status : 200
            //         })
            //     }else{
            //         res.json({
            //             status : 400
            //         })
            //     }
            // })
        })
    }).catch((error) => {
        console.log("error====>"+JSON.stringify(error));
    });
})

router.get('/autoprint', function(req,res) {
    var print_array = [];
    var count = 0;
    var currentTime;
    var startTime;
    var currentHoursMinutes;
    var date = new Date(); // current time
    var hours = date.getHours();
    var notExist = [];

    var current_day = moment(new Date()).tz(constant.SYSTEM_TIMEZONE).format('YYYY-MM-DD');
    var previous_day = moment().subtract(1, 'days').format('YYYY-MM-DD');
    var countall = 0;

    if(hours == 09){
        currentHoursMinutes = "09";
        currentTime = current_day+' 09:00:00';
        startTime = previous_day+' 21:00:00';
    }else if(hours == 21){
        currentHoursMinutes = "21";
        currentTime = current_day+' 21:00:00';
        startTime = current_day+' 09:00:00';
    }else{
        currentHoursMinutes = hours;
        currentTime = moment().format('YYYY-MM-DD HH:mm:ss'); //now time
        var today1  = moment().subtract(12, 'hours');
        startTime = today1.format('YYYY-MM-DD HH:mm:ss');
    }

    var outputDirectory = constant.FILE_LOCATION + "public/upload/autoprint/" + current_day+'_'+currentHoursMinutes;
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
    }
    
    console.log("currentTime====>"+currentTime)
    console.log("startTime====>"+startTime)

    //Cover letter array starts//
    var allstudentdata = [];
    //Cover letter array ends//

    //Merge array starts//
    var guportalmerge = " ";
    //Merge array ends//

    allstudentdata.push(
        [{ text: 'Portal Name', bold: true}, { text: 'Count', bold: true },{ text: 'Inword No', bold: true }]
    )

    models.Application.printapp(startTime,currentTime).then((results) => {
        //results.forEach(function(result){
        require('async').eachSeries(results, function(result, callback){
        //    console.log("result.app_data===>"+result.app_data);
        //    console.log("result.COUNT(*)===>"+result.count);
        //    console.log("result.source_from===>"+result.source_from);
            var guportal = [];
            guportal.push(
                [{ text: 'Application No', bold: true}, { text: 'Student Name', bold: true }]
            )

            var count1 = 0;
            console.log("result.app_data.length====>"+result.app_data.length);
            result.app_data.forEach(function(app){
                var inword_no = result.app_data.app_inward_no;
                guportal.push(       
                    [{text:app.app_id},{text:app.usr_name +' '+app.usr_surname }]
                )
                count1++

                if(result.app_data.length == count1){
                    self_PDF.gucover(inword_no, outputDirectory, hours, result.source_from, guportal,function(err){
                        if(err) {
                        }else{
                             callback();
                        }
                    })
                }
            })

            countall++
            allstudentdata.push(   
                [{text:''+result.source_from},{text:''+result.count },{text:''+result.app_data.app_inward_no}],      
            )

            if(results.length == countall){
                self_PDF.allstudentdata( outputDirectory, hours, 'all_portal', allstudentdata, function(err){
                    if(err) {
                    }else{
                    }
                })
            }

        }, function(){
            console.log("coming here after done");
            //console.log("notExist=====>"+notExist);
            var outercount = 0;
            var output_array = [];
            setTimeout(() => {
                results.forEach(function(result){
                    var filePath = constant.FILE_LOCATION+"public/upload/autoprint/" + current_day+'_'+currentHoursMinutes +"/"+currentHoursMinutes+"_"+result.source_from+".pdf";
                    var generated_pdf = constant.FILE_LOCATION+"public/upload/autoprint/" + current_day+'_'+currentHoursMinutes +"/"+currentHoursMinutes+"_"+result.source_from+"_cover"+".pdf";
                    if(fs.existsSync(filePath)){
                        console.log("existssss");
                        guportalmerge = ' "'+generated_pdf+'" '+' "'+filePath+'" ';
                        fn.mergeCoverAppPrint(currentHoursMinutes, result.source_from, outputDirectory, guportalmerge, function(err){
                            if(err){
                                sendresponse(err, "error", "")
                            }else{
                                console.log("Merge Done");
                                var file_url = constant.BASE_URL+'/upload/autoprint/'+ current_day+'_'+currentHoursMinutes + '/' +currentHoursMinutes+"_"+result.source_from+'_merge.pdf';
                                output_array.push(file_url)
                                outercount++;

                                console.log("output_array----->"+output_array)
                                console.log("outercount----->"+outercount)
                                console.log("results.length----->"+results.length)
                                if(results.length == outercount){
                                    console.log("outercountinside====>"+outercount)
                                    var file_url = constant.BASE_URL+'/upload/autoprint/'+ current_day+'_'+currentHoursMinutes + '/' +currentHoursMinutes+'_all_portal_cover.pdf';
                                    output_array.push(file_url)
                                    sendresponse(output_array, "sucess", results)
                                }else{
                                    console.log("outercountinside error==>"+outercount)
                                    sendresponse(err, "error","")
                                }
                            }
                        })
                    }else{
                        outercount++;
                        sendresponse("File not exist:" +filePath, "error", "")
                    }
                })
            }, 5000);
        })
    }).catch((error) => {
        console.log("error====>"+JSON.stringify(error));
    });


    function sendresponse(array, type, results){
        console.log("array====>"+array);
        if(type == "sucess"){
            console.log("results.length--->"+results.length);
            res.json({
                status : 200,
                data : array
            })
        }else if(type == "error"){
            console.log("err=======>"+array);
        }
        
    }


})


router.get('/collegeEmailStatusUpdate',function(req,res) {
    models.User_Transcript.findAll().then(function(user_transcripts){
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
        setTimeout(()=>{
            res.json({
                status : 200
            })
        },5000);
    });
});

router.get('/purposeEmailUpdate',function(req,res){
    client.setApiKey(constant.SENDGRID_API_KEY);
    var count = 0;
     var request = {};
     request.method = 'GET';
     //request.url = '/v3/messages?limit=1000&query= subject like "%Sending attested Document From Gujarat University for application%"';
     request.url = '/v3/messages?limit=1000&query=from_email%3D%22attestation%40mu.ac.in%22'; //'/v3/messages?limit=1000&query= from_email="attestation@mu.ac.in"'
     client.request(request)
         .then(([response, body]) => {
            //var a = JSON.stringify(response.body.messages);
              var a = response.body.messages;
              a.forEach(element => {
                  
                //   if(element.subject){
                //     var sub = element.subject
                //     var splitAppId = sub.split('application')
                //     var splitData = splitAppId[0]
                   
                //     if(splitAppId){
                //         if(splitAppId[0] == "Sending attested Document From Gujarat University for"){
                //         }else{

                //         }
                //     }
                //   }
                  models.EmailActivityTracker.find({
                      where :{
                          //email : element.from_email,
                          sg_msg_id : element.msg_id,
                      }
                  }).then(data => {
                      if(data){
                          data.update({
                            email : element.to_email,
                            //subject : element.subject,
                            status : element.status,
                            opens_count : element.opens_count,
                            clicks_count : element.clicks_count,
                            //x_msg_id : '',
                            //sg_msg_id : element.msg_id,
                            //sent_on : element.last_event_time,
                            last_event_time : element.last_event_time,
                            //app_id :splitAppId[1]
                          })
                      }
                      else{
                         models.EmailActivityTracker.create({
                              email : element.to_email,
                              subject : element.subject,
                              status : element.status,
                              opens_count : element.opens_count,
                              clicks_count : element.clicks_count,
                              //x_msg_id : '',
                              sg_msg_id : element.msg_id,
                              //sent_on : element.last_event_time,
                              last_event_time : element.last_event_time,
                               // app_id :splitAppId[1]

                          })
                      }
                  })
                count++
              });
        })
});

router.get('/WESApplicationUploadStatus',function(req,res){
    var attachments = [];
    var date = moment(new Date()).format("YYYY-MM-DD");
    models.Institution_details.getWESApplications(date).then(function(WESApplications){
        WESApplications.forEach(application=>{
            models.User.find({
                where:{
                    id : application.user_id
                }
            }).then(function(user){
                models.Wes_Records.findAll({
                    where:{
                        wesnumber : application.wesno
                    }
                }).then(function(wesRecords){
                    var wesData = [];
                    wesRecords.forEach(wesRecord=>{
                        wesData.push({
                            FileName : wesRecord.fileName,
                            UploadStatus : wesRecord.status,
                            reference_no : wesRecord.reference_no,
                            application_no : wesRecord.appl_id
                        })
                    })
                    var xls = json2xls(wesData);
                    var file_location = constant.FILE_LOCATION+"public/Excel/"+user.name+user.surname+'_'+application.wesno+".xlsx";
                    fs.writeFileSync(file_location, xls, 'binary');
                    var file_name = user.name+user.surname+'_'+application.wesno+".xlsx";
                    base64.encode(constant.FILE_LOCATION+"public/Excel/"+user.name+user.surname+'_'+application.wesno+".xlsx", function(err, base64String) {
                        attachments.push({
                            content: base64String,
                            filename: file_name,
                            type: 'application/xlsx',
                            disposition: 'attachment',
                            contentId: 'mytext'
                        })
                    })
                }) 
            })
        });
        setTimeout(()=>{
            // models.User.findAll({
            //     where : {
            //         user_type : 'admin',
            //         user_status : 'active'
            //     }
            // }).then(function(adminUsers){
            //     var admin = [];
            //     adminUsers.forEach(adminUser=>{
            //         admin.push(adminUser.email);
            //     })
                const msg = {
                    to: ['pratik@edulab.in','kumar@edulab.in'],
                    from: 'info@etranscript.in',
                    subject: 'WES Application Record',
                    text:  '<br>Kindly check attached excel sheets for WES Application Record \n\n',
                    html: 
                        '<br>Kindly check attached excel sheets for WES Application Record \n\n',
                    attachments: attachments,
                };
                sgMail.send(msg);
            //})
            
        },1000);
    })
});

router.get('/statusEmailSendtoStudent',function(req,res){
    
    var studentData = [];
    var date = moment(new Date()).format("YYYY-MM-DD");
    models.Institution_details.getWESApplications(date).then(function(WESApplications){
        WESApplications.forEach(application=>{
            models.User.find({
                where:{
                    id : application.user_id
                }
            }).then(function(user){
                var attachments = {};
                models.Wes_Records.findAll({
                    where:{
                        wesnumber : application.wesno
                    }
                }).then(function(wesRecords){
                    var wesData = [];
                    wesRecords.forEach(wesRecord=>{
                        wesData.push({
                            FileName : wesRecord.fileName,
                            UploadStatus : wesRecord.status,
                            reference_no : wesRecord.reference_no,
                            application_no : wesRecord.appl_id
                        })
                    })
                    var xls = json2xls(wesData);
                    var file_location = constant.FILE_LOCATION+"public/Excel/"+user.name+user.surname+'_'+application.wesno+".xlsx";
                    fs.writeFileSync(file_location, xls, 'binary');
                    var file_name = user.name+user.surname+'_'+application.wesno+".xlsx";
                    base64.encode(constant.FILE_LOCATION+"public/Excel/"+user.name+user.surname+'_'+application.wesno+".xlsx", function(err, base64String) {
                        attachments = {                             
                            content: base64String,
                            filename: file_name,
                            type: 'application/xlsx',
                            disposition: 'attachment',
                            contentId: 'mytext'
                        }
                        studentData.push({
                            username : user.name + ' ' + user.surname,
                            userEmail : user.email,
                            attachments : attachments
                        })
                    });

                }) 
            })
        });
        setTimeout(()=>{
            request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent', {
                json: {
                    studentData : studentData,
                    source : 'gu'
                }
              });
            
         },1000);
    })
});

router.get('/statusEmailSendtoStudent_other',function(req,res){
    
    var studentData = [];
    var date = moment('2020-12-15').format("YYYY-MM-DD");//moment(new Date()).format("YYYY-MM-DD");
    models.Application.getDoneApplications(date).then(function(applications){
        applications.forEach(application=>{
            models.Emailed_Docs.findAll({
                where:{
                    app_id : application.app_id
                }
            }).then(function(documents){
                var documentData = [];
                documents.forEach(document=>{
                    documentData.push({
                        fileName : document.filename,
                        documentType : document.doc_type,
                        category : document.category
                    })
                });
                var xls = json2xls(documentData);
                var file_location = constant.FILE_LOCATION+"public/Excel/"+application.studentName+'_'+application.app_id+".xlsx";
                fs.writeFileSync(file_location, xls, 'binary');
                var file_name = application.studentName+'_'+application.app_id+".xlsx";
                base64.encode(constant.FILE_LOCATION+"public/Excel/"+application.studentName+'_'+application.app_id+".xlsx", function(err, base64String) {
                    attachments = {                             
                        content: base64String,
                        filename: file_name,
                        type: 'application/xlsx',
                        disposition: 'attachment',
                        contentId: 'mytext'
                    }
                    studentData.push({
                        userName : application.studentName,
                        userEmail : application.studentEmail,
                        attachments : attachments,
                        purpose : application.purpose,
                        purposeEmail : (application.otherEmail) ? application.purposeEmail.concat(',',application.otherEmail) : application.purposeEmail,
                        emailSent : moment(application.emailSent).format("YYYY-MM-DD HH:MM:SS")
                    })
                })
            })
        })
        setTimeout(()=>{
             request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent_other', {
                json: {
                    studentData : studentData,
                    source : 'gu'
                }
              });
            
         },1000);
    })
});

router.get('/pendingApplicationReminderMailToCollege',function(req,res){
    models.Application.getPendingApplications().then(function(applications){
        applications.forEach(application=>{
            if(application.educationalDetails == true){
                models.User_Transcript.findAll({
                    where :{
                        user_id : application.user_id,source : 'guattestation' 
                    }
                }).then(function(user_Transcripts){
                    var collegeData = [];
                    var userTranscripts = [];
                    user_Transcripts.forEach(transcript=>{
                        if(transcript.app_id != null){
                            var app_idArr = transcript.app_id.split(',');
                            app_idArr.forEach(app_id=>{
                                if(application.app_id == app_id){
                                    userTranscripts.push(transcript);
                                }
                            })
                        }else{
                            userTranscripts.push(transcript);
                        }
                        
                    })
                    userTranscripts.forEach(transcript=>{
                        var singleCollege = {
                            user_id : '',
                            collegeName : '',
                            studentName : '',
                            college_id : '',
                            collegeEmail : '',
                            user_transcript : [],
                            user_markList : []
                        }
                        models.College.find({
                            where:{
                                id : transcript.collegeId
                            }
                        }).then(function(college){
                            if(college.id != 829){
                                if(application.notes == null){
                                    if(collegeData.length < 1){
                                        singleCollege.user_id = application.user_id;
                                        singleCollege.collegeName = college.name;
                                        singleCollege.collegeEmail = college.emailId;
                                        singleCollege.studentName = application.studentName;
                                        singleCollege.college_id = college.id;
                                        singleCollege.alternateEmail = college.alternateEmailId; 
                                        singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/documents/'+ application.user_id + "/" + urlencode(transcript.file_name)});
                                        collegeData.push(singleCollege);
                                    }else{
                                        var transcriptFlag = false;
                                        for(var i = 0; i<collegeData.length; i++){
                                            if(collegeData[i].college_id == transcript.collegeId){
                                                collegeData[i].user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/documents/'+application.user_id + "/" + urlencode(transcript.file_name)});
                                                transcriptFlag = true;
                                                break;
                                            }
                                        }
                                        if(transcriptFlag == false){
                                            singleCollege.user_id = application.user_id;
                                            singleCollege.collegeName = college.name;
                                            singleCollege.studentName = application.studentName;
                                            singleCollege.college_id = college.id;
                                            singleCollege.collegeEmail = college.emailId;
                                            singleCollege.alternateEmail = college.alternateEmailId;
                                            singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/documents/'+application.user_id + "/" + urlencode(transcript.file_name)});
                                            collegeData.push(singleCollege);
                                        }
                                    }
                                }else{
                                    var note = college.name + ' Confirmation Ok.'
                                    if(!application.notes.includes(note)){
                                        if(collegeData.length < 1){
                                            singleCollege.user_id = application.user_id;
                                            singleCollege.collegeName = college.name;
                                            singleCollege.collegeEmail = college.emailId;
                                            singleCollege.studentName = application.studentName;
                                            singleCollege.college_id = college.id;
                                            singleCollege.alternateEmail = college.alternateEmailId; 
                                            singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/documents/'+ application.user_id + "/" + urlencode(transcript.file_name)});
                                            collegeData.push(singleCollege);
                                        }else{
                                            var transcriptFlag = false;
                                            for(var i = 0; i<collegeData.length; i++){
                                                if(collegeData[i].college_id == transcript.collegeId){
                                                    collegeData[i].user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/documents/'+application.user_id + "/" + urlencode(transcript.file_name)});
                                                    transcriptFlag = true;
                                                    break;
                                                }
                                            }
                                            if(transcriptFlag == false){
                                                singleCollege.user_id = application.user_id;
                                                singleCollege.collegeName = college.name;
                                                singleCollege.studentName = application.studentName;
                                                singleCollege.college_id = college.id;
                                                singleCollege.collegeEmail = college.emailId;
                                                singleCollege.alternateEmail = college.alternateEmailId;
                                                singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/documents/'+application.user_id + "/" + urlencode(transcript.file_name)});
                                                collegeData.push(singleCollege);
                                            }
                                        }
                                    }
                                }
                            }
                        })
                    });
                    models.userMarkList.find({
                        where : {
                            user_id : application.user_id,source : 'guattestation'
                        }
                    }).then(function(userMarkListsData){  
                        models.UserMarklist_Upload.getMarksheetDataSendToInstitute(userMarkListsData.user_id).then(function(user_MarkLists){      
                            var userMarkLists = [];
                            user_MarkLists.forEach(transcript=>{
                                if(transcript.app_id != null){
                                    var app_idArr = transcript.app_id.split(',');
                                    app_idArr.forEach(app_id=>{
                                        if(application.app_id == app_id){
                                            userMarkLists.push(transcript);
                                        }
                                    })
                                }else{
                                    userMarkLists.push(transcript);
                                }
                            })      
                            userMarkLists.forEach(markList=>{
                                var singleCollege = {
                                    user_id : '',
                                    collegeName : '',
                                    studentName : '',
                                    college_id : '',
                                    collegeEmail : '',
                                    user_transcript : [],
                                    user_markList : []
                                }
                                models.College.find({
                                    where:{
                                        id : markList.collegeId
                                    }
                                }).then(function(college){
                                    if(college.id != 829){
                                        if(application.notes == null){
                                            if(collegeData.length < 1){
                                                singleCollege.user_id = application.user_id;
                                                singleCollege.collegeName = college.name;
                                                singleCollege.collegeEmail = college.emailId;
                                                singleCollege.studentName = application.studentName;
                                                singleCollege.college_id = college.id;
                                                singleCollege.alternateEmail = college.alternateEmailId; 
                                                if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }
                                            }else{
                                                var flag = false;
                                                for(var i = 0; i<collegeData.length; i++){
                                                    if(collegeData[i].college_id == markList.collegeId){
                                                        if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            flag = true;
                                                            break;
                                                        }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            flag = true;
                                                            break;
                                                        }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            flag = true;
                                                            break;
                                                        }
                                                    }
                                                }
                                                if(flag == false){
                                                    singleCollege.user_id = application.user_id;
                                                    singleCollege.collegeName = college.name;
                                                    singleCollege.studentName = application.studentName;
                                                    singleCollege.college_id = college.id;
                                                    singleCollege.collegeEmail = college.emailId;
                                                    singleCollege.alternateEmail = college.alternateEmailId;
                                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }
                                                }
                                            }
                                        }else{
                                            var note = college.name + ' Confirmation Ok.'
                                            if(!application.notes.includes(note)){
                                                if(collegeData.length < 1){
                                                    singleCollege.user_id = application.user_id;
                                                    singleCollege.collegeName = college.name;
                                                    singleCollege.collegeEmail = college.emailId;
                                                    singleCollege.studentName = application.studentName;
                                                    singleCollege.college_id = college.id;
                                                    singleCollege.alternateEmail = college.alternateEmailId; 
                                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }
                                                }else{
                                                    var flag = false;
                                                    for(var i = 0; i<collegeData.length; i++){
                                                        if(collegeData[i].college_id == markList.collegeId){
                                                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                                collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                                flag = true;
                                                                break;
                                                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                                collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                                flag = true;
                                                                break;
                                                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                                collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                                 collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                                flag = true;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if(flag == false){
                                                        singleCollege.user_id = application.user_id;
                                                        singleCollege.collegeName = college.name;
                                                        singleCollege.studentName = application.studentName;
                                                        singleCollege.college_id = college.id;
                                                        singleCollege.collegeEmail = college.emailId;
                                                        singleCollege.alternateEmail = college.alternateEmailId;
                                                        if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            collegeData.push(singleCollege);
                                                        }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                            singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            collegeData.push(singleCollege);
                                                        }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            collegeData.push(singleCollege);
                                                            singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            collegeData.push(singleCollege);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                });
                            })
                            setTimeout(function(){
                                if(collegeData.length > 0){
                                    request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailShweta', {
                                        json: {
                                            collegeData : collegeData,
                                            source : 'gu'
                                        }
                                    }, function (error, response, body) {
                                        if(body.notSent.length > 0){
                                            body.noteSent.forEach(data=>{
                                                models.User_Transcript.updateSingleCollegeEmailStatus(application.user_id,data.college_id,null,'not sent');
                                            })
                                        }
                                        body.data.forEach(msgId=>{
                                            models.User_Transcript.updateSingleCollegeEmailStatus(application.user_id,msgId.college_id,msgId.msg_id,'sent');
                                        })      
                                    })
                                }
                            },1000);
                        });
                    })
                })
            }

            if(application.instructionalField == true){
                var collegeData = [];
                models.InstructionalDetails.find({
			        where :{
				        userId : application.user_id
			        }
		        }).then(function(instructional){
			        models.userMarkList.find({
				        where : {
					        user_id : application.user_id,source : 'guattestation'
				        }
			        }).then(function(userMarkListsData){
                        models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(user_MarkLists){      
                            var userMarkLists = [];
                            user_MarkLists.forEach(transcript=>{
                                if(transcript.app_id != null){
                                    var app_idArr = transcript.app_id.split(',');
                                    app_idArr.forEach(app_id=>{
                                        if(application.app_id == app_id){
                                            userMarkLists.push(transcript);
                                        }
                                    })
                                }else{
                                    userMarkLists.push(transcript);
                                }
                            })            
				            userMarkLists.forEach(markList=>{
					            var singleCollege = {
						            user_id : '',
						            collegeName : '',
						            studentName : '',
						            college_id : '',
						            collegeEmail : '',
						            courseName : '',
						            user_markList : [],
						            alternateEmail : ''
					            }
					            models.College.find({
						            where:{
							            id : markList.collegeId
						            }
					            }).then(function(college){
                                    if(college.id != 829){
                                        if(application.notes == null){
                                            if(collegeData.length < 1){
                                                singleCollege.user_id = application.user_id;
                                                singleCollege.collegeName = college.name;
                                                singleCollege.collegeEmail = college.emailId;
                                                singleCollege.studentName = instructional.studentName;
                                                singleCollege.college_id = college.id;
                                                singleCollege.courseName = instructional.courseName;
                                                singleCollege.alternateEmail = college.alternateEmailId; 
                                                if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }
                                            }else{
                                                var flag = false;
                                                for(var i = 0; i<collegeData.length; i++){
                                                    if(collegeData[i].college_id == markList.collegeId){
                                                        if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            flag = true;
                                                            break;
                                                        }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            flag = true;
                                                            break; 
                                                        }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            flag = true;
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            flag = true;
                                                            break;
                                                        }
                                                    }
                                                }
                                                if(flag == false){
                                                    singleCollege.user_id = application.user_id;
                                                    singleCollege.collegeName = college.name;
                                                    singleCollege.studentName = instructional.studentName;
                                                    singleCollege.courseName = instructional.courseName;
                                                    singleCollege.college_id = college.id;
                                                    singleCollege.collegeEmail = college.emailId;
                                                    singleCollege.alternateEmail = college.alternateEmailId;
                                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }
                                                }
                                            }
                                        }else{
                                            var note = college.name + " Confirmation Ok.";
                                            if(!application.notes.includes(note)){
                                                if(collegeData.length < 1){
                                                    singleCollege.user_id = application.user_id;
                                                    singleCollege.collegeName = college.name;
                                                    singleCollege.collegeEmail = college.emailId;
                                                    singleCollege.studentName = instructional.studentName;
                                                    singleCollege.college_id = college.id;
                                                    singleCollege.courseName = instructional.courseName;
                                                    singleCollege.alternateEmail = college.alternateEmailId; 
                                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }
                                                }else{
                                                    var flag = false;
                                                    for(var i = 0; i<collegeData.length; i++){
                                                        if(collegeData[i].college_id == markList.collegeId){
                                                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                                collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                                flag = true;
                                                                break;
                                                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                                collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                                flag = true;
                                                                break; 
                                                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                                collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                                flag = true;
                                                                collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                                flag = true;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if(flag == false){
                                                        singleCollege.user_id = application.user_id;
                                                        singleCollege.collegeName = college.name;
                                                        singleCollege.studentName = instructional.studentName;
                                                        singleCollege.courseName = instructional.courseName;
                                                        singleCollege.college_id = college.id;
                                                        singleCollege.collegeEmail = college.emailId;
                                                        singleCollege.alternateEmail = college.alternateEmailId;
                                                        if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            collegeData.push(singleCollege);
                                                        }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                            singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            collegeData.push(singleCollege);
                                                        }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            collegeData.push(singleCollege);
                                                            singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            collegeData.push(singleCollege);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
					            });
				            })
				            setTimeout(()=>{
					            if(collegeData.length > 0){
                                    request.post(constant.BASE_URL_SENDGRID + 'instructionalFieldVerificationEmail', {
                                        json: {
                                            collegeData : collegeData,
                                            source : 'gu'
                                        }
                                    }, function (error, response, body) {
                                        if(body.notSent.length > 0){
                                            body.noteSent.forEach(data=>{
                                                models.InstructionalDetails.updateSingleEmailStatus(application.user_id,null,'not sent');
                                            })
                                        }
                                        body.data.forEach(msgId=>{
                                            models.InstructionalDetails.updateSingleEmailStatus(application.user_id,msgId.msg_id,'sent');
                                        })      
                                    })
                                }
                            },1000);
                        });
                    })
		        })
            }

            if(application.curriculum == true){
                var collegeData = [];
                models.User_Curriculum.findAll({
                    where :{
                        user_id : user_id
                    }
                }).then(function(user_Curriculums){
                    var userCurriculums = [];
                    user_Curriculums.forEach(transcript=>{
                        if(transcript.app_id != null){
                            var app_idArr = transcript.app_id.split(',');
                            app_idArr.forEach(app_id=>{
                                if(application.app_id == app_id){
                                    userCurriculums.push(transcript);
                                }
                            })
                        }else{
                            userCurriculums.push(transcript);
                        }
                        
                    })
                    userCurriculums.forEach(curriculum=>{
                        var singleCollege = {
                            user_id : '',
                            collegeName : '',
                            studentName : '',
                            college_id : '',
                            collegeEmail : '',
                            alternateEmail : '',
                            user_curriculum : [],
                            user_markList : []
                        }
                        models.College.find({
                            where:{
                                id : curriculum.collegeId
                            }
                        }).then(function(college){
                            if(college.id != 829){
                                if(application.notes == null){
                                    if(collegeData.length < 1){
                                        singleCollege.user_id = application.user_id;
                                        singleCollege.collegeName = college.name;
                                        singleCollege.collegeEmail = college.emailId;
                                        singleCollege.studentName = application.studentName;
                                        singleCollege.college_id = college.id;
                                        singleCollege.alternateEmail = college.alternateEmailId; 
                                        singleCollege.user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+ application.user_id + "/" + urlencode(curriculum.file_name)});
                                        collegeData.push(singleCollege);
                                    }else{
                                        var transcriptFlag = false;
                                        for(var i = 0; i<collegeData.length; i++){
                                            if(collegeData[i].college_id == curriculum.collegeId){
                                                collegeData[i].user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+application.user_id + "/" + urlencode(curriculum.file_name)});
                                                transcriptFlag = true;
                                                break;
                                            }
                                        }
                                        if(transcriptFlag == false){
                                            singleCollege.user_id = application.user_id;
                                            singleCollege.collegeName = college.name;
                                            singleCollege.studentName = application.studentName;
                                            singleCollege.college_id = college.id;
                                            singleCollege.collegeEmail = college.emailId;
                                            singleCollege.alternateEmail = college.alternateEmailId;
                                            singleCollege.user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+application.user_id + "/" + urlencode(curriculum.file_name)});
                                            collegeData.push(singleCollege);
                                        }
                                    }
                                }else{
                                    var note = college.name + "Confirmation Ok.";
                                    if(!application.notes.includes(note)){
                                        if(collegeData.length < 1){
                                            singleCollege.user_id = application.user_id;
                                            singleCollege.collegeName = college.name;
                                            singleCollege.collegeEmail = college.emailId;
                                            singleCollege.studentName = application.studentName;
                                            singleCollege.college_id = college.id;
                                            singleCollege.alternateEmail = college.alternateEmailId; 
                                            singleCollege.user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+ application.user_id + "/" + urlencode(curriculum.file_name)});
                                            collegeData.push(singleCollege);
                                        }else{
                                            var transcriptFlag = false;
                                            for(var i = 0; i<collegeData.length; i++){
                                                if(collegeData[i].college_id == curriculum.collegeId){
                                                    collegeData[i].user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+application.user_id + "/" + urlencode(curriculum.file_name)});
                                                    transcriptFlag = true;
                                                    break;
                                                }
                                            }
                                            if(transcriptFlag == false){
                                                singleCollege.user_id = application.user_id;
                                                singleCollege.collegeName = college.name;
                                                singleCollege.studentName = application.studentName;
                                                singleCollege.college_id = college.id;
                                                singleCollege.collegeEmail = college.emailId;
                                                singleCollege.alternateEmail = college.alternateEmailId;
                                                singleCollege.user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+application.user_id + "/" + urlencode(curriculum.file_name)});
                                                collegeData.push(singleCollege);
                                            }
                                        }
                                    }
                                }
                            }
                        })
                    });
                    models.userMarkList.find({
                        where : {
                            user_id : application.user_id,source : 'guattestation'
                        }
                    }).then(function(userMarkListsData){  
                        models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(user_MarkLists){      
                            var userMarkLists = [];
                            user_MarkLists.forEach(transcript=>{
                                if(transctipt.app_id != null){
                                    var app_idArr = transcript.app_id.split(',');
                                    app_idArr.forEach(app_id=>{
                                        if(application.app_id == app_id){
                                            userMarkLists.push(transcript);
                                        }
                                    })
                                }else{
                                    userMarkLists.push(transcript); 
                                }
                                
                            })  
                        userMarkLists.forEach(markList=>{
                            var singleCollege = {
                                user_id : '',
                                collegeName : '',
                                studentName : '',
                                college_id : '',
                                collegeEmail : '',
                                user_curriculum : [],
                                user_markList : []
                            }
                            models.College.find({
                                where:{
                                    id : markList.collegeId
                                }
                            }).then(function(college){
                                if(college.id != 829){
                                    if(application.notes == null){
                                        if(collegeData.length < 1){
                                            singleCollege.user_id = application.user_id;
                                            singleCollege.collegeName = college.name;
                                            singleCollege.collegeEmail = college.emailId;
                                            singleCollege.studentName = application.studentName;
                                            singleCollege.college_id = college.id;
                                            singleCollege.alternateEmail = college.alternateEmailId; 
                                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                collegeData.push(singleCollege);
                                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                collegeData.push(singleCollege);
                                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                collegeData.push(singleCollege);
                                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                collegeData.push(singleCollege);
                                            }
                                        }else{
                                            var flag = false;
                                            for(var i = 0; i<collegeData.length; i++){
                                                if(collegeData[i].college_id == markList.collegeId){
                                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        flag = true;
                                                        break;
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        flag = true;
                                                        break;
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        flag = true;
                                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        flag = true;
                                                        break;
                                                    }
                                                }
                                            }
                                            if(flag == false){
                                                singleCollege.user_id = application.user_id;
                                                singleCollege.collegeName = college.name;
                                                singleCollege.studentName = application.studentName;
                                                singleCollege.college_id = college.id;
                                                singleCollege.collegeEmail = college.emailId;
                                                singleCollege.alternateEmail = college.alternateEmailId;
                                                if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                                    collegeData.push(singleCollege);
                                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                                    collegeData.push(singleCollege);
                                                }
                
                                            }
                                        }
                                    }else{
                                        var note = college.name + " Confirmation Ok.";
                                        if(!application.notes.includes(note)){
                                            if(collegeData.length < 1){
                                                singleCollege.user_id = application.user_id;
                                                singleCollege.collegeName = college.name;
                                                singleCollege.collegeEmail = college.emailId;
                                                singleCollege.studentName = application.studentName;
                                                singleCollege.college_id = college.id;
                                                singleCollege.alternateEmail = college.alternateEmailId; 
                                                if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }
                                            }else{
                                                var flag = false;
                                                for(var i = 0; i<collegeData.length; i++){
                                                    if(collegeData[i].college_id == markList.collegeId){
                                                        if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            flag = true;
                                                            break;
                                                        }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            flag = true;
                                                            break;
                                                        }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            flag = true;
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            flag = true;
                                                            break;
                                                        }
                                                    }
                                                }
                                                if(flag == false){
                                                    singleCollege.user_id = application.user_id;
                                                    singleCollege.collegeName = college.name;
                                                    singleCollege.studentName = application.studentName;
                                                    singleCollege.college_id = college.id;
                                                    singleCollege.collegeEmail = college.emailId;
                                                    singleCollege.alternateEmail = college.alternateEmailId;
                                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                                        collegeData.push(singleCollege);
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/documents/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                                        collegeData.push(singleCollege);
                                                    }
                    
                                                }
                                            }
                                        }
                                    }
                                    
                                }
                            });
                        })
                        setTimeout(function(){
                            if(collegeData.length > 0){
                                request.post(constant.BASE_URL_SENDGRID + 'curriculumVerificationEmail', {
                                    json: {
                                        collegeData : collegeData,
                                        source : 'gu'
                                    }
                                }, function (error, response, body) {
                                    if(body.notSent.length > 0){
                                        body.noteSent.forEach(data=>{
                                            models.User_Curriculum.updateSingleCollegeEmailStatus(application.user_id,data.college_id,null,'not sent');
                                        })
                                    }
                                    body.data.forEach(msgId=>{
                                        models.User_Curriculum.updateSingleCollegeEmailStatus(application.user_id,msgId.college_id,msgId.msg_id,'sent');
                                    })      
                                })
                            }
                        },1000);
                    });
                    })
                })
            }
        })
    })
});

router.get('/ReminderforOnholdApplicationToStudent',function(req,res){
    models.Application.getOnHoldApplications().then(function(applications){
        applications.forEach(application=>{
            request.post(constant.BASE_URL_SENDGRID + 'ReminderforOnholdApplicationToStudent', {
                json: {
                    email : application.email,
                    name : application.student_name,
                    app_id : application.application_id,
                    mobile_country_code : application.mobile_country_code,
                    mobile : application.mobile,
                    source : 'gu'
                }
            });
        })
    })
})

router.get('/improvementFeedback',function(req,res){
    var date = moment(new Date()).format('YYYY-MM-DD')
    models.Feedback.getimporvementFeedback(date).then(feedbackData=>{
        feedbackData.forEach(feedback=>{
            request.post(constant.BASE_URL_SENDGRID + 'improvementFeedback', {
                json: {
                    email : feedback.email,
                    name : feedback.name + ' ' + feedback.surname,
                    source : 'gu'
                }
            });
        })
    })
})
module.exports = router;