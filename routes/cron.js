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
     //request.url = '/v3/messages?limit=1000&query= subject like "%Sending attested Document From Mumbai University for application%"';
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
                //         if(splitAppId[0] == "Sending attested Document From Mumbai University for"){
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
                    studentData : studentData
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
                    studentData : studentData
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
                        user_id : application.user_id
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
                                        singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+ application.user_id + "/" + urlencode(transcript.file_name)});
                                        collegeData.push(singleCollege);
                                    }else{
                                        var transcriptFlag = false;
                                        for(var i = 0; i<collegeData.length; i++){
                                            if(collegeData[i].college_id == transcript.collegeId){
                                                collegeData[i].user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+application.user_id + "/" + urlencode(transcript.file_name)});
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
                                            singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+application.user_id + "/" + urlencode(transcript.file_name)});
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
                                            singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+ application.user_id + "/" + urlencode(transcript.file_name)});
                                            collegeData.push(singleCollege);
                                        }else{
                                            var transcriptFlag = false;
                                            for(var i = 0; i<collegeData.length; i++){
                                                if(collegeData[i].college_id == transcript.collegeId){
                                                    collegeData[i].user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+application.user_id + "/" + urlencode(transcript.file_name)});
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
                                                singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+application.user_id + "/" + urlencode(transcript.file_name)});
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
                            user_id : application.user_id
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
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }
                                            }else{
                                                var flag = false;
                                                for(var i = 0; i<collegeData.length; i++){
                                                    if(collegeData[i].college_id == markList.collegeId){
                                                        if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            flag = true;
                                                            break;
                                                        }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            flag = true;
                                                            break;
                                                        }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }
                                                }else{
                                                    var flag = false;
                                                    for(var i = 0; i<collegeData.length; i++){
                                                        if(collegeData[i].college_id == markList.collegeId){
                                                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                                collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                                flag = true;
                                                                break;
                                                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                                collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                                flag = true;
                                                                break;
                                                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                                collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                                 collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            collegeData.push(singleCollege);
                                                        }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                            singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            collegeData.push(singleCollege);
                                                        }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            collegeData.push(singleCollege);
                                                            singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                            collegeData : collegeData
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
					        user_id : application.user_id
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
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }
                                            }else{
                                                var flag = false;
                                                for(var i = 0; i<collegeData.length; i++){
                                                    if(collegeData[i].college_id == markList.collegeId){
                                                        if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            flag = true;
                                                            break;
                                                        }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            flag = true;
                                                            break; 
                                                        }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            flag = true;
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        collegeData.push(singleCollege);
                                                    }
                                                }else{
                                                    var flag = false;
                                                    for(var i = 0; i<collegeData.length; i++){
                                                        if(collegeData[i].college_id == markList.collegeId){
                                                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                                collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                                flag = true;
                                                                break;
                                                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                                collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                                flag = true;
                                                                break; 
                                                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                                collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                                flag = true;
                                                                collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            collegeData.push(singleCollege);
                                                        }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                            singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            collegeData.push(singleCollege);
                                                        }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            collegeData.push(singleCollege);
                                                            singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                            collegeData : collegeData
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
                            user_id : application.user_id
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
                                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                collegeData.push(singleCollege);
                                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                collegeData.push(singleCollege);
                                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                collegeData.push(singleCollege);
                                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                collegeData.push(singleCollege);
                                            }
                                        }else{
                                            var flag = false;
                                            for(var i = 0; i<collegeData.length; i++){
                                                if(collegeData[i].college_id == markList.collegeId){
                                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        flag = true;
                                                        break;
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                        flag = true;
                                                        break;
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        flag = true;
                                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                                    collegeData.push(singleCollege);
                                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name )});
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
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                    collegeData.push(singleCollege);
                                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                    collegeData.push(singleCollege);
                                                }
                                            }else{
                                                var flag = false;
                                                for(var i = 0; i<collegeData.length; i++){
                                                    if(collegeData[i].college_id == markList.collegeId){
                                                        if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            flag = true;
                                                            break;
                                                        }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                                            flag = true;
                                                            break;
                                                        }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                            collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                            flag = true;
                                                            collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                                        collegeData.push(singleCollege);
                                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                                        singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.file_name)});
                                                        collegeData.push(singleCollege);
                                                        singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/marklist/'+ application.user_id + "/" + urlencode(markList.usermarklist_file_name )});
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
                                        collegeData : collegeData
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
                    mobile : application.mobile
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
                    source : 'attestation'
                }
            });
        })
    })
})
module.exports = router;