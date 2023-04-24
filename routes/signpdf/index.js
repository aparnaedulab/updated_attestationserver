var path = require('path');
var root_path = path.dirname(require.main.filename);
var models  = require(root_path+'/models');
const express = require('express');
var router  = express.Router();
var constant = require(root_path+'/config/constant');
const logger = require('../../logger')(__filename);
var fn=require('./signfn');
var randomstring = require("randomstring");
const client = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
var request = require('request');
var functions = require(root_path+'/utils/function');
const middlewares = require('./../../middlewares');
var cloudconvert = new (require('cloudconvert'))(constant.CLOUDCONVERTKEY);
const fs = require('fs');
var schedule = require('node-schedule');
const pdf = require('pdf-parse');
var moment = require('moment')
var self_pdf = require(root_path+'/utils/self_letters');
var converter = require('number-to-words');
var Sequelize = require("sequelize");
const Op = Sequelize.Op;
var json2xls = require('json2xls');
var base64 = require('file-base64');
const async = require('async');
const e = require('express');
const { ref } = require('pdfkit');
const { lodash } = require('consolidate');
const promises = require('promise');
const imagesToPdf = require("images-to-pdf");

router.post('/documentSending',async function(req,res){
	console.log('/documentSending' + req.body.value);
	var adminemail = req.body.email_admin
	var app_id = req.body.appl_id;
	var user_id;
	var emailedDoc = [];
	var email_arr = [];
	var sentDocuments = [];
	var studentData = {};
	var purposes = [];
	var attachments = [];
	var signway = req.body.value;
	var studentData = {};
	var emailFlag = false

	models.Application.find({
	  	where : {
			id : app_id,
			[Op.or]:[{
				source_from:'guattestation',
			 },
			 {
				source_from:'gumoi',
			 }]
	  	}
	}).then(function(application){
	  	user_id = application.user_id;
	  	models.User.getApplicationDetailsForSign(app_id).then(function(student){
  			models.Institution_details.findAll({
		  		where : {
					app_id : app_id,
					user_id : user_id,
					deliveryType : "digital",source : 'guattestation'
				}
			}).then(function(institutes){
		  		console.log("institutes == " + JSON.stringify(institutes));
				  models.Emailed_Docs.findAll({
					where:{
						app_id : app_id 
					}
				}).then(function(emailDoc){
		  		institutes.forEach(institute=>{
					if(institute.type != "Educational credential evaluators WES"){
						hrdFlag = false;
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
			  			if(institute.type == 'HRD')
							referenceNo = institute.hrdno;
			  			email_arr.push({
							email : institute.email,
							reference_no : referenceNo
			  			});  
			  			if(institute.OtherEmail){
							var emailArr = institute.OtherEmail.split(', ');
							emailArr.forEach(email=>{
				  				email_arr.push({
									email : email,
									reference_no : referenceNo
				  				})
							})
			  			} 
			  			if(institute.OtherEmail == null){
							if(institute.type == 'NASBA'){
				  				email_arr.push({
									email : 'nies@nasba.org',
									reference_no : referenceNo
				  				});
							}
							if(institute.type == 'ICES'){
				  				email_arr.push({
									email : 'icesofficialdocs@bcit.ca',
									reference_no : referenceNo
				  				});
							}
							if(institute.type=='IQAS'){
				  				email_arr.push({
									email : 'lbr.iqas@gov.ab.ca',
									reference_no : referenceNo
				  				});
							}
			  			}
			  			purposes.push({
							purpose : institute.type,
							emails : (institute.otherEmail) ? institute.email.concat(',',institute.otherEmail) : institute.email
						})
					}else if(institute.type == 'Educational credential evaluators WES'){
                        if(institute.wesno == null || institute.wesno.length <=3 || !(institute.wesno.includes('GU-'))){
                            return res.json({
                            status : 400,
                            message : "Wes number not available"
                            })
                        }else{
                            emailDoc.forEach(file=>{
								if(file.doc_type == 'merged'){

								}else{
									var fullfile = '';
									fullfile = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+file.filename;
									
									models.Wes_Records.find({
										where:{
										userId : user_id,
										appl_id : app_id,
										filename : file.filename
										}
									}).then(function(wesRecord){
										if(wesRecord){
											console.log("Available");
										}else{
											console.log("Not Available");
											var email = (institute.emailAsWes) ? institute.emailAsWes : student[0].email;
											var firstName = (institute.nameaswes) ? institute.nameaswes : student[0].name;
											var lastName = (institute.nameaswes) ? institute.nameaswes : student[0].surname;
											fn.fileTransferWes1(user_id,app_id,firstName,lastName,email,fullfile,async function(err){
												if(err == 'Student has filled wrong Wes Details'){
													request.post(constant.BASE_URL_SENDGRID + 'MarksheetRequiredMail_updated', {
														json: {	
															email : student[0].email,	
															studentName : student[0].name + " " + student[0].surname,	
															app_id : app_id,
															note : '',	
															type : 'purpose',
															source : 'gu'
														}	
													}, function (error, response, body) {
																res.json({
																	status : 200
																})
													})
												}
												emailFlag = true;
												if(err){
													return res.json({
													status : 400,
													message : err + ' ' + app_id
													})
												}else{
													var ApplicationData = await functions.getnotes(app_id);
													if(ApplicationData.tracker == 'print_signed'){
														if(ApplicationData.print_signedstatus == 'print'){
															emailFlag = true;
															application.update({
																tracker: 'done',
																print_by : adminemail,
																signed_date : moment(new Date()).format('YYYY-MM-DD'),
																print_signedstatus : 'done'
															  }).then(function (result) {
																  if(result){ 
																	var userName = student[0].name + ' ' + student[0].surname;
																	var desc = userName+"'s ( "+student[0].email+" ) application sent by "+adminemail+".";
																	var activity = "Application Sent";
																	functions.activitylog(user_id, activity, desc, app_id);
																  }
															})
														}else if(ApplicationData.print_signedstatus == 'print_signed'){	
															emailFlag = true;
															application.update({
																print_by : adminemail,
																signed_date : moment(new Date()).format('YYYY-MM-DD'),
																print_signedstatus : 'signed'
															  }).then(function (result) {
																  if(result){ 
																	var userName = student[0].name + ' ' + student[0].surname;
																	var desc = userName+"'s ( "+student[0].email+" ) application sent by "+adminemail+".";
																	var activity = "Application Sent";
																	functions.activitylog(user_id, activity, desc, app_id);
																  }
															})
														}
													}else{
													emailFlag = true;
													application.update({
														tracker: 'done',
														print_by : adminemail,
														signed_date : moment(new Date()).format('YYYY-MM-DD'),
														print_signedstatus : 'signed'
													  }).then(function (result) {
														  if(result){ 
															var userName = student[0].name + ' ' + student[0].surname;
															var desc = userName+"'s ( "+student[0].email+" ) application sent by "+adminemail+".";
															var activity = "Application Sent";
															functions.activitylog(user_id, activity, desc, app_id);
														  }
													})
												}
												}
											});
										}
									})
								}
                            })
                            console.log("Done");
                            setTimeout(()=>{
                                models.Wes_Records.findAll({
                                    where :{
                                    userId : user_id,
                                    appl_id : app_id
                                    }
                                }).then(async function(wesRecords){
                                    console.log("wesRecords.length > == " + wesRecords.length);
                                    console.log("emailDoc.length >== " + emailDoc.length);
                                    if(wesRecords.length == emailDoc.length ){
                                        var wesData = [];
                                        var attachments = {};
                                        wesRecords.forEach(wesRecord=>{
                                            wesData.push({
                                                FileName : wesRecord.fileName,
                                                UploadStatus : wesRecord.status,
                                                reference_no : wesRecord.reference_no,
                                                application_no : wesRecord.appl_id
                                            })
                                        })
                                        var xls = json2xls(wesData);
                                        var file_location = constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+institute.wesno+".xlsx";
                                        fs.writeFileSync(file_location, xls, 'binary');
                                        var file_name = student[0].name+student[0].surname+'_'+institute.wesno+".xlsx";
                                        base64.encode(constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+institute.wesno+".xlsx", function(err, base64String) {
                                            attachments = {                             
                                                content: base64String,
                                                filename: file_name,
                                                type: 'application/xlsx',
                                                disposition: 'attachment',
                                                contentId: 'mytext'
                                            }
                                            studentData.username = student[0].name + ' ' + student[0].surname;
                                            studentData.userEmail = student[0].email;
                                            studentData.attachments = attachments;
                                        })
										var ApplicationData = await functions.getnotes(app_id);
										if(ApplicationData.tracker == 'print_signed'){
											if(ApplicationData.print_signedstatus == 'print'){
												emailFlag = true;
												application.update({
													tracker: 'done',
													print_by : adminemail,
													signed_date : moment(new Date()).format('YYYY-MM-DD'),
													print_signedstatus : 'done'
												  }).then(function (result) {
													  if(result){ 
														var userName = student[0].name + ' ' + student[0].surname;
														var desc = userName+"'s ( "+student[0].email+" ) application sent by "+adminemail+".";
														var activity = "Application Sent";
														functions.activitylog(user_id, activity, desc, app_id);
													  }
					
													  request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent', {
														json: {
															studentData : studentData,
															source : 'gu'
														}
													});
												})
											}else{
												emailFlag = true;
												application.update({
													print_by : adminemail,
													signed_date : moment(new Date()).format('YYYY-MM-DD'),
													print_signedstatus : 'signed'
												  }).then(function (result) {
													  if(result){ 
														var userName = student[0].name + ' ' + student[0].surname;
														var desc = userName+"'s ( "+student[0].email+" ) application sent by "+adminemail+".";
														var activity = "Application Sent";
														functions.activitylog(user_id, activity, desc, app_id);
													  }
					
													  request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent', {
														json: {
															studentData : studentData,
															source : 'gu'
														}
													});
												})
											}
										}else{
                                        emailFlag = true;
                                        application.update({
											tracker: 'done',
											print_by : adminemail,
											signed_date : moment(new Date()).format('YYYY-MM-DD'),
											print_signedstatus : 'signed'
										  }).then(function (result) {
											  if(result){ 
												var userName = student[0].name + ' ' + student[0].surname;
												var desc = userName+"'s ( "+student[0].email+" ) application sent by "+adminemail+".";
												var activity = "Application Sent";
												functions.activitylog(user_id, activity, desc, app_id);
											  }
			
											  request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent', {
												json: {
													studentData : studentData,
													source : 'gu'
												}
											});
										})
									}
                                    }else{

                                    }
                                })
                            },8000)
                        }
                    }
		  		})
		
				if(signway == 'single'){
						models.Emailed_Docs.findAll({
							  where :{
								app_id : app_id,
								doc_type : "merged"
							  }
						}).then(async function(documents){
							
						console.log('req.body.valuereq.body.valuereq.body.value' + JSON.stringify(documents));
							  documents.forEach(document =>{
								  var attachment = {};
								emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
								// emailedDoc.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
							  
								  var file_location = constant.FILE_LOCATION+"public/signedpdf/"+user_id+'/'+document.filename;
								  //fs.writeFileSync(file_location, xls, 'binary');
								  //var file_name = student[0].name+student[0].surname+'_'+app_id+".xlsx";
								  var base64String = fs.readFileSync(file_location).toString("base64");
								  
								 attachment = {                             
									  content: base64String,
									  filename: document.filename,
									  type: 'application/pdf',
									  disposition: 'attachment',
									  contentId: 'mytext'
								  }
								  attachments.push(attachment);
							  })
							  console.log("emailedDoc@@@@@@"+JSON.stringify(emailedDoc));
						})
				
					
				}else{
					if(student[0].instructionalField == true){
						console.log("Instructional Letter");
						models.Emailed_Docs.findAll({
							  where :{
								app_id : app_id,
								category : "InstructionalLetter"
							  }
						}).then(function(documents){
							
							  documents.forEach(document =>{
								  var attachment = {};
								// emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
								emailedDoc.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
							  
								  var file_location = constant.FILE_LOCATION+"public/signedpdf/"+user_id+'/'+document.filename;
								  //fs.writeFileSync(file_location, xls, 'binary');
								  //var file_name = student[0].name+student[0].surname+'_'+app_id+".xlsx";
								  var base64String = fs.readFileSync(file_location).toString("base64");
								  
								 attachment = {                             
									  content: base64String,
									  filename: document.filename,
									  type: 'application/pdf',
									  disposition: 'attachment',
									  contentId: 'mytext'
								  }
									  
								  
								  attachments.push(attachment);
							  })
						})
					  }
					  if(student[0].educationalDetails == true){
						console.log("Educational Details");
						// models.Emailed_Docs.find({
						// 	  where : {
						// 		app_id : app_id,
						// 		doc_type : 'merged'
						// 	  }
						// }).then((mergedData)=>{
						// 	  if(mergedData){
						// 		emailedDoc.push({"id":mergedData.id,"filename":mergedData.filename,"doc_type":mergedData.doc_type,"category":mergedData.category})
						// 		sentDocuments.push({"fileName":mergedData.filename,"documentType":mergedData.doc_type,"category":mergedData.category})
						// 	  }else{
								models.Emailed_Docs.findAll({
									where :{
										  app_id : app_id,
										  category : "Transcript"
									}
								  }).then(function(documents){
									  documents.forEach(document =>{
										emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
										sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
									  })
								})
								models.Emailed_Docs.findAll({
									  where :{
										app_id : app_id,
										category : "Marklist"
									  }
								}).then(function(documents){
									  documents.forEach(document =>{
										emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
										sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
									  })
								})
								models.Emailed_Docs.findAll({
									where :{
									  app_id : app_id,
									  category : "Degree"
									}
							  }).then(function(documents){
									documents.forEach(document =>{
									  emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
									  sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
									})
							  })
								models.Emailed_Docs.findAll({
									where :{
									  app_id : app_id,
									  category : "Thesis"
									}
							  }).then(function(documents){
									documents.forEach(document =>{
									  emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
									  sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
									})
							  })

								
						// 	  }
						// })
					  }
				}
					 
					setTimeout(async()=>{
						console.log("Send Email");
						console.log("emailedDoc====>"+JSON.stringify(emailedDoc));
						if(emailFlag == true){
							// console.log("studentData == " + JSON.stringify(studentData));
							// application.update({
							// 	tracker: 'done'
							//   }).then(function (result) {
							// 	  if(result){ 
							// 		var userName = student[0].name + ' ' + student[0].surname;
							// 		var desc = userName+"'s ( "+student[0].email+" ) application sent by "+adminemail+".";
							// 		var activity = "Application Sent";
							// 	  }

							// 	  request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent', {
							// 		json: {
							// 			studentData : studentData,
							// 			source : 'gu'
							// 		}
							// 	});
							// })
							
						}else{
							if(emailedDoc.length > 0 || attachments.length > 0){
								console.log('Insideeeeeeee');
								  request.post(constant.BASE_URL_SENDGRID + 'pdf_send_email1', {
									json: {
										  userName : student[0].name,
										  surname : student[0].surname,
										  userEmail : student[0].email,
										  certi_name : student[0].applying_for,
										  mobile_country_code : student[0].mobile_country_code,
										  mobile : student[0].mobile,
										  email_add : email_arr,
										  app_id: app_id,
										  emailedDoc : emailedDoc,
										  attachments : (attachments.length) > 0 ? attachments : null,
										  source : 'gu',
										  user_id : user_id,
									}
								  }, async function (error, response, body) {
									if (error || body.status == 400) {
										console.log("Insidee Error");
										  return  res.json({
											status : 400,
											message : 'Error in sending Signed Document to email',
										  })
									}else if(body.status == 200){
										console.log("Inside  Success" + application.deliveryType);
										  //TODO: HERE UPDATING THE STATUS OF APPLICATION FROM SIGNED TO DONE
										  var ApplicationData = await functions.getnotes(app_id);
										  if(ApplicationData.tracker == 'print_signed'){
												if(ApplicationData.print_signedstatus == 'print'){
  											application.update({
												tracker: 'done',
												print_by : adminemail,
												signed_date : moment(new Date()).format('YYYY-MM-DD'),
												print_signedstatus : 'done'
											  }).then(function (result) {
												  if(result){ 
													var userName = student[0].name + ' ' + student[0].surname;
													var desc = userName+"'s ( "+student[0].email+" ) application sent by "+adminemail+".";
													var activity = "Application Sent";
													var applicationId = app_id;
													//functions.activitylog(user_id, activity, desc, applicationId);
													functions.activitylog(user_id, activity, desc, app_id);
													var Remark = "Your application  no."+app_id+" has been sent to the "+email_arr+" you mentioned."
													var created_at = functions.socketnotification('Email sent to registered purpose',Remark,user_id,'student');
													setTimeout(() => {
														  if(created_at === undefined) { 
														  }else{
															// req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});
															// req.io.sockets.emit('SignClient');
														  }
													},1000);
													console.log("sentDocuments====>"+JSON.stringify(sentDocuments));
													var xls = json2xls(sentDocuments);
													var attachments = {};
													  var file_location = constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+app_id+".xlsx";
													  fs.writeFileSync(file_location, xls, 'binary');
													  var file_name = student[0].name+student[0].surname+'_'+app_id+".xlsx";
													  base64.encode(constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+app_id+".xlsx", function(err, base64String) {
														 attachments = {                             
															  content: base64String,
															  filename: file_name,
															  type: 'application/xlsx',
															  disposition: 'attachment',
															  contentId: 'mytext'
														  }
														  studentData.userName = userName;
														  studentData.userEmail = student[0].email;
														  studentData.attachments = attachments;
														  studentData.purpose = purposes;
														  studentData.emailSent = moment(result.updated_at).format("YYYY-MM-DD HH:MM:SS");
													  })
													  setTimeout(()=>{
														  // console.log("studentData == " + JSON.stringify(studentData));
															  request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent_other', {
															  json: {
																  studentData : studentData,
																  source : 'gu'
															  }
														  })
														res.json({
															status : 200,
															message : 'signed pdf emailed to institute successfully!',
														})
													},1000);
												  }else{
													res.json({
													status : 400,
													message : 'Email not sent!',
													})
												  }
											  })
												}else{
													application.update({
														print_by : adminemail,
														signed_date : moment(new Date()).format('YYYY-MM-DD'),
														print_signedstatus : 'signed'
													  }).then(function (result) {
														  if(result){ 
															var userName = student[0].name + ' ' + student[0].surname;
															var desc = userName+"'s ( "+student[0].email+" ) application sent by "+adminemail+".";
															var activity = "Application Sent";
															var applicationId = app_id;
															//functions.activitylog(user_id, activity, desc, applicationId);
															functions.activitylog(user_id, activity, desc, app_id);
															var Remark = "Your application  no."+app_id+" has been sent to the "+email_arr+" you mentioned."
															var created_at = functions.socketnotification('Email sent to registered purpose',Remark,user_id,'student');
															setTimeout(() => {
																  if(created_at === undefined) { 
																  }else{
																	// req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});
																	// req.io.sockets.emit('SignClient');
																  }
															},1000);
															console.log("sentDocuments====>"+JSON.stringify(sentDocuments));
															var xls = json2xls(sentDocuments);
															var attachments = {};
															  var file_location = constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+app_id+".xlsx";
															  fs.writeFileSync(file_location, xls, 'binary');
															  var file_name = student[0].name+student[0].surname+'_'+app_id+".xlsx";
															  base64.encode(constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+app_id+".xlsx", function(err, base64String) {
																 attachments = {                             
																	  content: base64String,
																	  filename: file_name,
																	  type: 'application/xlsx',
																	  disposition: 'attachment',
																	  contentId: 'mytext'
																  }
																  studentData.userName = userName;
																  studentData.userEmail = student[0].email;
																  studentData.attachments = attachments;
																  studentData.purpose = purposes;
																  studentData.emailSent = moment(result.updated_at).format("YYYY-MM-DD HH:MM:SS");
															  })
															  setTimeout(()=>{
																  // console.log("studentData == " + JSON.stringify(studentData));
																	  request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent_other', {
																	  json: {
																		  studentData : studentData,
																		  source : 'gu'
																	  }
																  })
																res.json({
																	status : 200,
																	message : 'signed pdf emailed to institute successfully!',
																})
															},1000);
														  }else{
															res.json({
															status : 400,
															message : 'Email not sent!',
															})
														  }
													  })
												}
										  }else{
											  application.update({
												tracker: 'done',
												print_by : adminemail,
												signed_date : moment(new Date()).format('YYYY-MM-DD'),
												print_signedstatus : 'signed'
											  }).then(function (result) {
												  if(result){ 
													var userName = student[0].name + ' ' + student[0].surname;
													var desc = userName+"'s ( "+student[0].email+" ) application sent by "+adminemail+".";
													var activity = "Application Sent";
													var applicationId = app_id;
													//functions.activitylog(user_id, activity, desc, applicationId);
													functions.activitylog(user_id, activity, desc, app_id);
													var Remark = "Your application  no."+app_id+" has been sent to the "+email_arr+" you mentioned."
													var created_at = functions.socketnotification('Email sent to registered purpose',Remark,user_id,'student');
													setTimeout(() => {
														  if(created_at === undefined) { 
														  }else{
															// req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});
															// req.io.sockets.emit('SignClient');
														  }
													},1000);
													console.log("sentDocuments====>"+JSON.stringify(sentDocuments));
													var xls = json2xls(sentDocuments);
													var attachments = {};
													  var file_location = constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+app_id+".xlsx";
													  fs.writeFileSync(file_location, xls, 'binary');
													  var file_name = student[0].name+student[0].surname+'_'+app_id+".xlsx";
													  base64.encode(constant.FILE_LOCATION+"public/Excel/"+student[0].name+student[0].surname+'_'+app_id+".xlsx", function(err, base64String) {
														 attachments = {                             
															  content: base64String,
															  filename: file_name,
															  type: 'application/xlsx',
															  disposition: 'attachment',
															  contentId: 'mytext'
														  }
														  studentData.userName = userName;
														  studentData.userEmail = student[0].email;
														  studentData.attachments = attachments;
														  studentData.purpose = purposes;
														  studentData.emailSent = moment(result.updated_at).format("YYYY-MM-DD HH:MM:SS");
													  })
													  setTimeout(()=>{
														  // console.log("studentData == " + JSON.stringify(studentData));
															  request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent_other', {
															  json: {
																  studentData : studentData,
																  source : 'gu'
															  }
														  })
														res.json({
															status : 200,
															message : 'signed pdf emailed to institute successfully!',
														})
													},1000);
												  }else{
													res.json({
													status : 400,
													message : 'Email not sent!',
													})
												  }
											  })
										}
									}
								  });
							}
							else{
								return  res.json({
									status : 400,
									message : 'There is no signed documents so that can not process application further',
								})
							}
						}
						
					},5000)
				})		
		 
			})
	  	})
	})
});

router.post('/documentSigning',function(req,res){
	console.log('/documentSigning_new');
	var app_id =  req.body.appl_id;
	var email_Admin =  req.body.email_Admin;
	var user_id;
	var siginingType = req.body.type;
	var signingDegree =  req.body.degree;
	var signstatus;
	var count = 1;
	var wesform_length = 0;
	var transcript_length = 0 ;
	var marksheet_length = 0;
	var curriculum_length = 0;
	var gradTOPer_letter_length = 0;
	//var competencyLetter_length = 0;
	var instruction_letter_length = 0;
	var degree_length = 0;
	var provisional_length = 0;
	var thesis_length = 0;
	var affiliation_letter_length = 0;
	var competencyletter_length = 0;
	var namechangeletter_length = 0;
	var transcripts = [];
	var degree = [];
	var provisional = [];
	var thesis = [];
	var user_marklists = [];
	var user_marksheets = [];
	var user_curriculums = [];
	var gradTOPer_letter = [];
	var competencyletter= []
	var studentData = {};
	var tracker;
	var statusTracker;
	
	models.Emailed_Docs.destroy({
		where : {
			app_id : app_id
		}
	})
	models.Application.findOne({
		where :{
			id : app_id,
			[Op.or]:[{
				source_from:'guattestation',
			 },
			 {
				source_from:'gumoi',
			 }]
		}
	}).then(function(application){
		models.Institution_details.findAll({
			where : {
				user_id : application.user_id,
				app_id : app_id,source : 'guattestation'
			}
		}).then(function (institution_data){
		if(application){
			if(institution_data){
				var user_id = application.user_id;
				models.User.getApplicationDetailsForSign(app_id).then(function(user){
					  if(user[0]){
						  if(!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/")){
							  fs.mkdirSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/", { recursive: true });//fs.writeFileSync
						  }
						  const tasks =[application.id]
						  const queue = async.queue((task, executed) => {
							console.log("Currently Busy Processing Task " + task);
							if(user[0].educationalDetails == true){
								console.log("user_id == " + user_id);
								if(user[0].attestedfor.includes('transcript')){
									models.User_Transcript.findAll({
										where:{
											user_id : application.user_id,
											type:{
												[Op.like] :'%transcripts'
											},
											app_id :{
												[Op.ne] : null
											},source : 'guattestation' 
										}
									}).then(function(user_transcripts){
										if(user_transcripts){
											user_transcripts.forEach(user_transcript=>{
												var app_idArr = user_transcript.app_id.split(',');
												app_idArr.forEach(transcript_appId=>{
													if(transcript_appId == app_id){
														transcripts.push(user_transcript);
													}
												})
											})
									
											transcript_length = transcripts.length;;
											transcripts.forEach(transcript=>{
												console.log("transcript == " + JSON.stringify(transcript));
												var doc_name = transcript.name.split(' ').join('_');
												var fileName = doc_name + "_" + path.parse(transcript.file_name).name + "-.pdf";
												models.Emailed_Docs.find({
													where :{
														transcript_id : transcript.id,
														fileName : fileName,
														app_id :{
															[Op.ne] : app_id
														}
													}
												}).then(function(emailedDocs){
													if(emailedDocs){
														// models.Emailed_Docs.create({
														// 	filename : emailedDocs.file_name,
														// 	doc_type : emailedDocs.doc_type,
														// 	category : emailedDocs.category,
														// 	transcript_id: transcript.id,
														// 	app_id:app_id
														// });
													}else{
														var fileName = path.parse(transcript.file_name).name;
														var filePath = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name;
														var category = "Transcript";
														var outputDirectory;
														if(fs.existsSync(filePath)){
															var extension=transcript.file_name.split('.').pop();
															var numOfpages;
															console.log("test==")
															if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
																if(extension == 'pdf' ||  extension == 'PDF'){
																	var folderName = fileName.split(" ").join("_");
																	console.log("folderName == " + folderName);
																	outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+folderName+"/";
																	fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,outputDirectory);
																	let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name);
																		pdf(dataBuffer).then(function(data) {
																		console.log("no=====>"+data.numpages);  // number of pages
																		numOfpages = data.numpages;
																	});
																	var fileString = "";
																	outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/signed_"+folderName+"/";
																	if(!fs.existsSync(outputDirectory)){
																		fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
																	}
																	setTimeout(()=>{
																	for(var i = 1 ; i <= numOfpages; i++){
																		var j = "";
																		if(numOfpages >= 100){
																			if(parseInt((i/100)) > 0){
																				j = i
																			}else if(parseInt((i/10)) > 0){
																				j = "0" + i;
																			}else{
																				j = "00" + i;
																			}
																		}else  if(numOfpages >= 10){
																			if(parseInt((i/10)) > 0){
																				j = i;
																			}else{
																				j = "0" + i;
																			}
																		}else  if(numOfpages >= 1){
																			j =  i;
																		}
																		
																			filePath =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
																			console.log(filePath);
																			var file_name =  fileName+"-"+j+".jpg";
																			fn.signingDocuments(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, 'Transcript', outputDirectory,function(err,fname){
																				if(err){
																					return res.json({
																					status : 400,
																					message : err
																					})
																				}else{
																					// fn.signingDocuments_notforprint(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, 'Transcript', outputDirectory,function(err){
																					// 	if(err){
																					// 		return res.json({
																					// 		status : 400,
																					// 		message : err
																					// 		})
																					// 	}else{
									
																							// fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
																							fileString = fileString +' "'+ outputDirectory +  fname  + '" ';
																							console.log("fileString == " + fileString);
																					// 	}
																					// });
									
																					
																				}
																			});
																		}
																	},10000) 
																	
																	
																	setTimeout(()=>{
																		console.log("fileString 2 == " + fileString);
																		outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																		fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, fileString, function(err){
																			if(err){
																				return res.json({
																					status : 400,
																					message : "Files cannot merge"
																				})
																			}else{
																				var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																				models.Emailed_Docs.find({
																					where : {
																						filename : file_name,
																						transcript_id: transcript.id,
																						app_id:app_id,
																					}
																				}).then(function(emailedDoc){
																					if(emailedDoc){
									
																					}else{
																						models.Emailed_Docs.create({
																							filename : file_name,
																							doc_type : doc_name,
																							category : 'Transcript',
																							transcript_id: transcript.id,
																							app_id:app_id,
																						}).then((result)=>{
																						// logger.debug(" result : "+JSON.stringify(result))
																					})
																					}
																				})
																			}
																		});
																	}, 12000);
																}else{
																	outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																	fn.signingDocuments(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, 'Transcript', outputDirectory, function(err){
																		if(err){
																			return res.json({
																				status : 400,
																				message : err
																			})
																		}else{
																			fn.signingDocuments_notforprint(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, 'Transcript', outputDirectory, function(err){
																				if(err){
																					return res.json({
																					status : 400,
																					message : err
																					})
																				}else{
									
																					var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																			models.Emailed_Docs.find({
																				where : {
																					filename : file_name,
																					transcript_id: transcript.id,
																					app_id:app_id,
																				}
																			}).then(function(emailedDoc){
																				if(emailedDoc){
									
																				}else{
																					models.Emailed_Docs.create({
																						filename : file_name,
																						doc_type : doc_name,
																						category : 'Transcript',
																						transcript_id: transcript.id,
																						app_id:app_id
																					}).then((result)=>{
																					// logger.debug(" result : "+JSON.stringify(result))
																				})
																				}
																			})
																				}
																			});
																			
																		}
																	});
																}
															}else{
																var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																models.Emailed_Docs.find({
																	where : {
																		filename : file_name,
																		transcript_id: transcript.id,
																		app_id:app_id,
																	}
																}).then(function(emailedDoc){
																	if(emailedDoc){
									
																	}else{
																		models.Emailed_Docs.create({
																			filename : file_name,
																			doc_type : doc_name,
																			category : 'Transcript',
																			transcript_id: transcript.id,
																			app_id:app_id
																		}).then((result)=>{
																		// logger.debug(" result : "+JSON.stringify(result))
																	})
																	}
																})
															}
														}else{
															return res.json({
																status : 400,
																message : transcript.name + 'not found'
															})
														}
													}
												})
											})
										}else{
											transcript_length = 0
										}
										
									})
								}
								if(user[0].attestedfor.includes('marksheet')){
								models.UserMarklist_Upload.findAll({
									where:{
										user_id : application.user_id,
										app_id :{
											[Op.ne] : null
										},source : 'guattestation'
									}
								}).then(function(userMarklists){
									console.log("userMarklists == " + JSON.stringify(userMarklists));
									userMarklists.forEach(userMarklist=>{
										var app_idArr = userMarklist.app_id.split(',');
										app_idArr.forEach(marklist_appId=>{
											if(marklist_appId == app_id){
												user_marklists.push(userMarklist);
											}
										})
									})
									if(user_marklists.length > 0){
										marksheet_length = user_marklists.length;
										user_marklists.forEach(marklist=>{
											console.log("marklist == " + JSON.stringify(marklist));
											var doc_name = marklist.name.split(' ').join('_');
											var fileName = doc_name + "_" + path.parse(marklist.file_name).name + "-.pdf";
											models.Emailed_Docs.find({
												where :{
													transcript_id : marklist.id,
													fileName : fileName,
													app_id :{
														[Op.ne] : app_id
													}
												}
											}).then(function(emailedDocs){
												if(emailedDocs){
													// models.Emailed_Docs.create({
													// 	filename : emaildDocs.file_name,
													// 	doc_type : emaildDocs.doc_type,
													// 	category : emaildDocs.category,
													// 	marklist_id: marklist.id,
													// 	app_id:app_id
													// });
												}else{
													console.log("iNSDIDEEE elseeeeee");
													var fileName = path.parse(marklist.file_name).name;
													var filePath = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+marklist.file_name;
													var category = "Marklist";
													var outputDirectory;
													console.log("filePathfilePathfilePath" + filePath);
													if(fs.existsSync(filePath)){
														console.log("inside filePathfilePath");
														var extension=marklist.file_name.split('.').pop();
														console.log("extensionextensionextension" + extension);
														var numOfpages;
														console.log("test==")
														if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(marklist.file_name).name+".pdf")){
															if(extension == 'pdf' ||  extension == 'PDF'){
																console.log("PDF IMAGEEEEEEE");
																var folderName = fileName.split(" ").join("_");
																console.log("folderName == " + folderName);
																outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+folderName+"/";
																fn.pdfToImageConversion(path.parse(marklist.file_name).name,application.user_id,filePath,outputDirectory);
																let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+marklist.file_name);
																	pdf(dataBuffer).then(function(data) {
																	console.log("no=====>"+data.numpages);  // number of pages
																	numOfpages = data.numpages;
																});
																var fileString = "";
																outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/signed_"+folderName+"/";
																if(!fs.existsSync(outputDirectory)){
																	fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
																}
																setTimeout(()=>{
																for(var i = 1 ; i <= numOfpages; i++){
																	var j = "";
																	if(numOfpages >= 100){
																		if(parseInt((i/100)) > 0){
																			j = i
																		}else if(parseInt((i/10)) > 0){
																			j = "0" + i;
																		}else{
																			j = "00" + i;
																		}
																	}else  if(numOfpages >= 10){
																		if(parseInt((i/10)) > 0){
																			j = i;
																		}else{
																			j = "0" + i;
																		}
																	}else  if(numOfpages >= 1){
																		j =  i;
																	}
																	
																		console.log("fileName ==ssss " + fileName);
																		filePath =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+ folderName +"/"+path.parse(marklist.file_name).name+"-"+j+".jpg"; 
																		console.log(filePath);
																		var file_name =  fileName+"-"+j+".jpg"
																		console.log("file_name == 4444" + file_name);
																		fn.signingDocuments_marksheet(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err,fname){
																			if(err){
																				console.log("errrrrrrrrrrrrrrrrrrrrrr");
																				return res.json({
																				status : 400,
																				message : err
																				})
																			}else{
																				console.log("noooooooooooooooo erorrrrrrrrrrrrrrrrrrrrrrrrrr");
																				// fn.signingDocuments_notforprint_marksheet(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
																				// 	if(err){
																				// 		return res.json({
																				// 		status : 400,
																				// 		message : err
																				// 		})
																				// 	}else{
																						// fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
																						fileString = fileString +' "'+ outputDirectory +  fname  + '" ';
																						console.log("fileString == " + fileString);
																					// }
																				// });
																				
																			}
																		});
																	}
																},9000) 
																
																
																setTimeout(()=>{
																	console.log("fileString 2 == @@@@@@@@@@@@@@@@@@@@" + fileString);
																	outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																	fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(marklist.file_name).name, outputDirectory, fileString, function(err){
																		if(err){
																			return res.json({
																				status : 400,
																				message : "Files cannot merge"
																			})
																		}else{
																			var file_name = doc_name + "_" + path.parse(marklist.file_name).name + ".pdf"
																			models.Emailed_Docs.find({
																				where : {
																					filename : file_name,
																					marklist_id: marklist.id,
																					app_id:app_id,
																				}
																			}).then(function(emailedDoc){
																				if(emailedDoc){
							
																				}else{
																					models.Emailed_Docs.create({
																						filename : file_name,
																						doc_type : doc_name,
																						category : category,
																						marklist_id: marklist.id,
																						app_id:app_id,
																					}).then((result)=>{
																					// logger.debug(" result : "+JSON.stringify(result))
																				})
																				}
																			})
																		}
																	});
																}, 12000);
															}else{
																console.log("cxhvbhjcxbvxcnv");
																outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																fn.signingDocuments_marksheet(path.parse(marklist.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
																	if(err){
																		return res.json({
																			status : 400,
																			message : err
																		})
																	}else{
																		fn.signingDocuments_notforprint_marksheet(path.parse(marklist.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
																			if(err){
																				return res.json({
																				status : 400,
																				message : err
																				})
																			}else{
																				var file_name = doc_name + "_" + path.parse(marklist.file_name).name + ".pdf"
																				models.Emailed_Docs.find({
																					where : {
																						filename : file_name,
																						marklist_id: marklist.id,
																						app_id:app_id,
																					}
																				}).then(function(emailedDoc){
																					if(emailedDoc){
							
																					}else{
																						models.Emailed_Docs.create({
																							filename : file_name,
																							doc_type : doc_name,
																							category : category,
																							marklist_id: marklist.id,
																							app_id:app_id
																						}).then((result)=>{
																						// logger.debug(" result : "+JSON.stringify(result))
																					})
																					}
																				})
																			}
																		});
																		
																	}
																});
															}
														}else{
															var file_name = doc_name + "_" + path.parse(marklist.file_name).name + ".pdf"
															models.Emailed_Docs.find({
																where : {
																	filename : file_name,
																	marklist_id: marklist.id,
																	app_id:app_id,
																}
															}).then(function(emailedDoc){
																if(emailedDoc){
							
																}else{
																	models.Emailed_Docs.create({
																		filename : file_name,
																		doc_type : doc_name,
																		category : category,
																		marklist_id: marklist.id,
																		app_id:app_id
																	}).then((result)=>{
																	// logger.debug(" result : "+JSON.stringify(result))
																})
																}
															})
														}
													}else{
														return res.json({
															status : 400,
															message : marklist.name + 'not found'
														})
													}
												}
											})
										})
									}else{
										marksheet_length = 0;
									}
								})
								}
								if(user[0].attestedfor.includes('degree')){
									models.User_Transcript.findAll({
										where:{
											user_id : application.user_id,
											type:{
												[Op.like] :'%degree'
											},
											source : 'guattestation' ,
											app_id :{
												[Op.ne] : null
											},
											[Op.or]:[{
												provisional:null,
											 },
											 {
												provisional:0,
											 },
											 {
												provisional:'',
											 }
											]
										}
									}).then(function(user_degrees){
										if(user_degrees){
											user_degrees.forEach(user_degree=>{
												var app_idArr = user_degree.app_id.split(',');
												app_idArr.forEach(transcript_appId=>{
													if(transcript_appId == app_id){
														degree.push(user_degree);
													}
												})
											})
									
											degree_length = degree.length;
											degree.forEach(transcript=>{
												console.log("transcript == " + JSON.stringify(transcript));
												var doc_name = transcript.name.split(' ').join('_');
												var fileName = doc_name + "_" + path.parse(transcript.file_name).name + "-.pdf";
												models.Emailed_Docs.find({
													where :{
														transcript_id : transcript.id,
														fileName : fileName,
														app_id :{
															[Op.ne] : app_id
														}
													}
												}).then(function(emailedDocs){
													if(emailedDocs){
														// models.Emailed_Docs.create({
														// 	filename : emailedDocs.file_name,
														// 	doc_type : emailedDocs.doc_type,
														// 	category : emailedDocs.category,
														// 	transcript_id: transcript.id,
														// 	app_id:app_id
														// });
													}else{
														var fileName = path.parse(transcript.file_name).name;
														var filePath = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name;
														var category = "Degree";
														var outputDirectory;
														if(fs.existsSync(filePath)){
															var extension=transcript.file_name.split('.').pop();
															var numOfpages;
															console.log("test==")
															if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
																if(extension == 'pdf' ||  extension == 'PDF'){
																	var folderName = fileName.split(" ").join("_");
																	console.log("folderName == " + folderName);
																	outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+folderName+"/";
																	fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,outputDirectory);
																	let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name);
																		pdf(dataBuffer).then(function(data) {
																		console.log("no=====>"+data.numpages);  // number of pages
																		numOfpages = data.numpages;
																	});
																	var fileString = "";
																	outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/signed_"+folderName+"/";
																	if(!fs.existsSync(outputDirectory)){
																		fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
																	}
																	setTimeout(()=>{
																	for(var i = 1 ; i <= numOfpages; i++){
																		var j = "";
																		if(numOfpages >= 100){
																			if(parseInt((i/100)) > 0){
																				j = i
																			}else if(parseInt((i/10)) > 0){
																				j = "0" + i;
																			}else{
																				j = "00" + i;
																			}
																		}else  if(numOfpages >= 10){
																			if(parseInt((i/10)) > 0){
																				j = i;
																			}else{
																				j = "0" + i;
																			}
																		}else  if(numOfpages >= 1){
																			j =  i;
																		}
																		
																			filePath =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
																			console.log(filePath);
																			var file_name =  fileName+"-"+j+".jpg";
																			fn.signingDocuments_marksheet(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, 'Degree', outputDirectory,function(err,fname){
																				if(err){
																					return res.json({
																					status : 400,
																					message : err
																					})
																				}else{
																					// fn.signingDocuments_notforprint_marksheet(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, 'Degree', outputDirectory,function(err){
																					// 	if(err){
																					// 		return res.json({
																					// 		status : 400,
																					// 		message : err
																					// 		})
																					// 	}else{
									
																							// fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
																							fileString = fileString +' "'+ outputDirectory +  fname  + '" ';
																							console.log("fileString == " + fileString);
																					// 	}
																					// });
									
																					
																				}
																			});
																		}
																	},9000) 
																	
																	
																	setTimeout(()=>{
																		console.log("fileString 2 == " + fileString);
																		outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																		fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, fileString, function(err){
																			if(err){
																				return res.json({
																					status : 400,
																					message : "Files cannot merge"
																				})
																			}else{
																				var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																				models.Emailed_Docs.find({
																					where : {
																						filename : file_name,
																						transcript_id: transcript.id,
																						app_id:app_id,
																					}
																				}).then(function(emailedDoc){
																					if(emailedDoc){
									
																					}else{
																						models.Emailed_Docs.create({
																							filename : file_name,
																							doc_type : doc_name,
																							category : 'Degree',
																							transcript_id: transcript.id,
																							app_id:app_id,
																						}).then((result)=>{
																						// logger.debug(" result : "+JSON.stringify(result))
																					})
																					}
																				})
																			}
																		});
																	}, 12000);
																}else{
																	outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																	fn.signingDocuments_marksheet(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, 'Degree', outputDirectory, function(err){
																		if(err){
																			return res.json({
																				status : 400,
																				message : err
																			})
																		}else{
																			fn.signingDocuments_notforprint_marksheet(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, 'Degree', outputDirectory, function(err){
																				if(err){
																					return res.json({
																					status : 400,
																					message : err
																					})
																				}else{
									
																					var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																			models.Emailed_Docs.find({
																				where : {
																					filename : file_name,
																					transcript_id: transcript.id,
																					app_id:app_id,
																				}
																			}).then(function(emailedDoc){
																				if(emailedDoc){
									
																				}else{
																					models.Emailed_Docs.create({
																						filename : file_name,
																						doc_type : doc_name,
																						category : 'Degree',
																						transcript_id: transcript.id,
																						app_id:app_id
																					}).then((result)=>{
																					// logger.debug(" result : "+JSON.stringify(result))
																				})
																				}
																			})
																				}
																			});
																			
																		}
																	});
																}
															}else{
																var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																models.Emailed_Docs.find({
																	where : {
																		filename : file_name,
																		transcript_id: transcript.id,
																		app_id:app_id,
																	}
																}).then(function(emailedDoc){
																	if(emailedDoc){
									
																	}else{
																		models.Emailed_Docs.create({
																			filename : file_name,
																			doc_type : doc_name,
																			category : 'Degree',
																			transcript_id: transcript.id,
																			app_id:app_id
																		}).then((result)=>{
																		// logger.debug(" result : "+JSON.stringify(result))
																	})
																	}
																})
															}
														}else{
															return res.json({
																status : 400,
																message : transcript.name + 'not found'
															})
														}
													}
												})
											})
										}else{
											degree_length = 0
										}
										
									})
									models.User_Transcript.findAll({
										where:{
											user_id : application.user_id,
											type:{
												[Op.like] :'%degree'
											}
											,source : 'guattestation' ,
											app_id :{
												[Op.ne] : null
											},
											[Op.or]:[{
												provisional: 1,
											 },
											 {
												provisional: true,
											 }]
										}
									}).then(function(provisionaldegree){
										console.log('provisionalprovisionalprovisional' + provisional.length);
										if(provisionaldegree){
											provisionaldegree.forEach(user_degree=>{
												provisional.push(user_degree);
													
											})
											console.log('provisionalprovisionalprovisional@@@@@@@@@@@@@@@@@@@@@@@' + provisional);
											provisional_length = provisional.length;
											console.log('provisional_lengthprovisional_length' + provisional_length);
											provisional.forEach(transcript=>{
												var doc_name = transcript.name.split(' ').join('_');
												var fileName = doc_name + "_" + path.parse(transcript.file_name).name + "-.pdf";
												models.Emailed_Docs.find({
													where :{
														transcript_id : transcript.id,
														fileName : fileName,
														app_id :{
															[Op.ne] : app_id
														}
													}
												}).then(function(emailedDocs){
													if(emailedDocs){
														// models.Emailed_Docs.create({
														// 	filename : emailedDocs.file_name,
														// 	doc_type : emailedDocs.doc_type,
														// 	category : emailedDocs.category,
														// 	transcript_id: transcript.id,
														// 	app_id:app_id
														// });
													}else{
														var fileName = path.parse(transcript.file_name).name;
														var filePath = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name;
														var category = "Degree";
														var outputDirectory;
														if(fs.existsSync(filePath)){
															var extension=transcript.file_name.split('.').pop();
															var numOfpages;
															console.log("test==")
															if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
																if(extension == 'pdf' ||  extension == 'PDF'){
																	var folderName = fileName.split(" ").join("_");
																	console.log("folderName == " + folderName);
																	outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+folderName+"/";
																	fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,outputDirectory);
																	let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name);
																		pdf(dataBuffer).then(function(data) {
																		console.log("no=====>"+data.numpages);  // number of pages
																		numOfpages = data.numpages;
																	});
																	var fileString = "";
																	outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/signed_"+folderName+"/";
																	if(!fs.existsSync(outputDirectory)){
																		fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
																	}
																	setTimeout(()=>{
																	for(var i = 1 ; i <= numOfpages; i++){
																		var j = "";
																		if(numOfpages >= 100){
																			if(parseInt((i/100)) > 0){
																				j = i
																			}else if(parseInt((i/10)) > 0){
																				j = "0" + i;
																			}else{
																				j = "00" + i;
																			}
																		}else  if(numOfpages >= 10){
																			if(parseInt((i/10)) > 0){
																				j = i;
																			}else{
																				j = "0" + i;
																			}
																		}else  if(numOfpages >= 1){
																			j =  i;
																		}
																		
																			filePath =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
																			console.log(filePath);
																			var file_name =  fileName+"-"+j+".jpg";
																			fn.signingDocuments_provisional(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, 'Degree', outputDirectory,function(err,fname){
																				if(err){
																					return res.json({
																					status : 400,
																					message : err
																					})
																				}else{
																					// fn.ssigningDocuments_provisional_notforprint(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, 'Degree', outputDirectory,function(err){
																					// 	if(err){
																					// 		return res.json({
																					// 		status : 400,
																					// 		message : err
																					// 		})
																					// 	}else{
									
																							fileString = fileString +' "'+ outputDirectory +  fname  + '" ';
																							console.log("fileString == " + fileString);
																					// 	}
																					// });
									
																					
																				}
																			});
																		}
																	},10000) 
																	
																	
																	setTimeout(()=>{
																		console.log("fileString 2 == " + fileString);
																		outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																		fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, fileString, function(err){
																			if(err){
																				return res.json({
																					status : 400,
																					message : "Files cannot merge"
																				})
																			}else{
																				var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																				models.Emailed_Docs.find({
																					where : {
																						filename : file_name,
																						transcript_id: transcript.id,
																						app_id:app_id,
																					}
																				}).then(function(emailedDoc){
																					if(emailedDoc){
									
																					}else{
																						models.Emailed_Docs.create({
																							filename : file_name,
																							doc_type : doc_name,
																							category : 'Degree',
																							transcript_id: transcript.id,
																							app_id:app_id,
																						}).then((result)=>{
																						// logger.debug(" result : "+JSON.stringify(result))
																					})
																					}
																				})
																			}
																		});
																	}, 12000);
																}else{
																	outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																	fn.signingDocuments_provisional(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, 'Degree', outputDirectory, function(err){
																		if(err){
																			return res.json({
																				status : 400,
																				message : err
																			})
																		}else{
																			fn.ssigningDocuments_provisional_notforprint(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, 'Degree', outputDirectory, function(err){
																				if(err){
																					return res.json({
																					status : 400,
																					message : err
																					})
																				}else{
									
																					var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																			models.Emailed_Docs.find({
																				where : {
																					filename : file_name,
																					transcript_id: transcript.id,
																					app_id:app_id,
																				}
																			}).then(function(emailedDoc){
																				if(emailedDoc){
									
																				}else{
																					models.Emailed_Docs.create({
																						filename : file_name,
																						doc_type : doc_name,
																						category : 'Degree',
																						transcript_id: transcript.id,
																						app_id:app_id
																					}).then((result)=>{
																					// logger.debug(" result : "+JSON.stringify(result))
																				})
																				}
																			})
																				}
																			});
																			
																		}
																	});
																}
															}else{
																var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																models.Emailed_Docs.find({
																	where : {
																		filename : file_name,
																		transcript_id: transcript.id,
																		app_id:app_id,
																	}
																}).then(function(emailedDoc){
																	if(emailedDoc){
									
																	}else{
																		models.Emailed_Docs.create({
																			filename : file_name,
																			doc_type : doc_name,
																			category : 'Degree',
																			transcript_id: transcript.id,
																			app_id:app_id
																		}).then((result)=>{
																		// logger.debug(" result : "+JSON.stringify(result))
																	})
																	}
																})
															}
														}else{
															return res.json({
																status : 400,
																message : transcript.name + 'not found'
															})
														}
													}
												})
											})
										}else{
											provisional_length = 0
										}
										
									})
								}
								if(user[0].attestedfor.includes('thesis')){
									models.User_Transcript.findAll({
										where:{
											user_id : application.user_id,
											type:{
												[Op.like] :'%thesis'
											},
											app_id :{
												[Op.ne] : null
											},source : 'guattestation' 
										}
									}).then(function(user_thesis){
										if(user_thesis){
											console.log("user_transcripts == " + JSON.stringify(user_thesis));
											user_thesis.forEach(user_thesisdata =>{
												var app_idArr = user_thesisdata.app_id.split(',');
												app_idArr.forEach(transcript_appId=>{
													if(transcript_appId == app_id){
														thesis.push(user_thesisdata);
													}
												})
											})
									
											thesis_length = thesis.length;
											thesis.forEach(transcript=>{
												console.log("transcript == " + JSON.stringify(transcript));
												var doc_name = transcript.name.split(' ').join('_');
												var fileName = doc_name + "_" + path.parse(transcript.file_name).name + "-.pdf";
												models.Emailed_Docs.find({
													where :{
														transcript_id : transcript.id,
														fileName : fileName,
														app_id :{
															[Op.ne] : app_id
														}
													}
												}).then(function(emailedDocs){
													if(emailedDocs){
														// models.Emailed_Docs.create({
														// 	filename : emailedDocs.file_name,
														// 	doc_type : emailedDocs.doc_type,
														// 	category : emailedDocs.category,
														// 	transcript_id: transcript.id,
														// 	app_id:app_id
														// });
													}else{
														var fileName = path.parse(transcript.file_name).name;
														var filePath = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name;
														var category = "Thesis";
														var outputDirectory;
														if(fs.existsSync(filePath)){
															var extension=transcript.file_name.split('.').pop();
															var numOfpages;
															console.log("test==")
															if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
																if(extension == 'pdf' ||  extension == 'PDF'){
																	var folderName = fileName.split(" ").join("_");
																	console.log("folderName == " + folderName);
																	outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+folderName+"/";
																	fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,outputDirectory);
																	let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name);
																		pdf(dataBuffer).then(function(data) {
																		console.log("no=====>"+data.numpages);  // number of pages
																		numOfpages = data.numpages;
																	});
																	var fileString = "";
																	outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/signed_"+folderName+"/";
																	if(!fs.existsSync(outputDirectory)){
																		fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
																	}
																	setTimeout(()=>{
																	for(var i = 1 ; i <= numOfpages; i++){
																		var j = "";
																		if(numOfpages >= 100){
																			if(parseInt((i/100)) > 0){
																				j = i
																			}else if(parseInt((i/10)) > 0){
																				j = "0" + i;
																			}else{
																				j = "00" + i;
																			}
																		}else  if(numOfpages >= 10){
																			if(parseInt((i/10)) > 0){
																				j = i;
																			}else{
																				j = "0" + i;
																			}
																		}else  if(numOfpages >= 1){
																			j =  i;
																		}
																		
																			filePath =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
																			console.log(filePath);
																			var file_name =  fileName+"-"+j+".jpg";
																			fn.signingDocuments_marksheet(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, 'Thesis', outputDirectory,function(err,fname){
																				if(err){
																					return res.json({
																					status : 400,
																					message : err
																					})
																				}else{
																					fn.signingDocuments_notforprint_marksheet(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, 'Thesis', outputDirectory,function(err){
																						if(err){
																							return res.json({
																							status : 400,
																							message : err
																							})
																						}else{
									
																							// fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
																							fileString = fileString +' "'+ outputDirectory +  fname  + '" ';
																							console.log("fileString == " + fileString);
																						}
																					});
									
																					
																				}
																			});
																		}
																	},18000) 
																	
																	
																	setTimeout(()=>{
																		console.log("fileString 2 == " + fileString);
																		outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																		fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, fileString, function(err){
																			if(err){
																				return res.json({
																					status : 400,
																					message : "Files cannot merge"
																				})
																			}else{
																				var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																				models.Emailed_Docs.find({
																					where : {
																						filename : file_name,
																						transcript_id: transcript.id,
																						app_id:app_id,
																					}
																				}).then(function(emailedDoc){
																					if(emailedDoc){
									
																					}else{
																						models.Emailed_Docs.create({
																							filename : file_name,
																							doc_type : doc_name,
																							category : 'Thesis',
																							transcript_id: transcript.id,
																							app_id:app_id,
																						}).then((result)=>{
																						// logger.debug(" result : "+JSON.stringify(result))
																					})
																					}
																				})
																			}
																		});
																	}, 18000);
																}else{
																	outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																	fn.signingDocuments_marksheet(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, 'Thesis', outputDirectory, function(err){
																		if(err){
																			return res.json({
																				status : 400,
																				message : err
																			})
																		}else{
																			fn.signingDocuments_notforprint_marksheet(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, 'Thesis', outputDirectory, function(err){
																				if(err){
																					return res.json({
																					status : 400,
																					message : err
																					})
																				}else{
									
																					var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																			models.Emailed_Docs.find({
																				where : {
																					filename : file_name,
																					transcript_id: transcript.id,
																					app_id:app_id,
																				}
																			}).then(function(emailedDoc){
																				if(emailedDoc){
									
																				}else{
																					models.Emailed_Docs.create({
																						filename : file_name,
																						doc_type : doc_name,
																						category : 'Thesis',
																						transcript_id: transcript.id,
																						app_id:app_id
																					}).then((result)=>{
																					// logger.debug(" result : "+JSON.stringify(result))
																				})
																				}
																			})
																				}
																			});
																			
																		}
																	});
																}
															}else{
																var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
																models.Emailed_Docs.find({
																	where : {
																		filename : file_name,
																		transcript_id: transcript.id,
																		app_id:app_id,
																	}
																}).then(function(emailedDoc){
																	if(emailedDoc){
									
																	}else{
																		models.Emailed_Docs.create({
																			filename : file_name,
																			doc_type : doc_name,
																			category : 'Thesis',
																			transcript_id: transcript.id,
																			app_id:app_id
																		}).then((result)=>{
																		// logger.debug(" result : "+JSON.stringify(result))
																	})
																	}
																})
															}
														}else{
															return res.json({
																status : 400,
																message : transcript.name + 'not found'
															})
														}
													}
												})
											})
										}else{
											thesis_length = 0
										}
										
									})
								}
								// models.User_Transcript.findAll({
								// 	where:{
								// 		user_id : application.user_id,
								// 		type:{
								// 			[Op.like] :'%thesis'
								// 		},
								// 		app_id :{
								// 			[Op.ne] : null
								// 		}
								// 	}
								// }).then(function(user_thesis){
								// 	console.log("@@@@@@@@@@@ user_thesis" + JSON.stringify(user_thesis));
								// 	if(user_thesis){
								// 		user_thesis.forEach(user_transcript=>{
								// 			var app_idArr = user_transcript.app_id.split(',');
								// 			app_idArr.forEach(transcript_appId=>{
								// 				if(transcript_appId == app_id){
								// 					transcripts.push(user_transcript);
								// 				}
								// 			})
								// 		})
								
								// 		transcript_length = transcripts.length;
								// 		transcripts.forEach(transcript=>{
								// 			console.log("@@@@@@@@@@@@@@ " + JSON.stringify(transcript));
								// 			var doc_name = transcript.name.split(' ').join('_');
								// 			var fileName = doc_name + "_" + path.parse(transcript.file_name).name + "-.pdf";
								// 			models.Emailed_Docs.find({
								// 				where :{
								// 					transcript_id : transcript.id,
								// 					fileName : fileName,
								// 					app_id :{
								// 						[Op.ne] : app_id
								// 					}
								// 				}
								// 			}).then(function(emailedDocs){
								// 				if(emailedDocs){
								// 					// models.Emailed_Docs.create({
								// 					// 	filename : emailedDocs.file_name,
								// 					// 	doc_type : emailedDocs.doc_type,
								// 					// 	category : emailedDocs.category,
								// 					// 	transcript_id: transcript.id,
								// 					// 	app_id:app_id
								// 					// });
								// 				}else{
								// 					var fileName = path.parse(transcript.file_name).name;
								// 					var filePath = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name;
								// 					var category = "Thesis";
								// 					var outputDirectory;
								// 					if(fs.existsSync(filePath)){
								// 						var extension=transcript.file_name.split('.').pop();
								// 						var numOfpages;
								// 						console.log("test==")
								// 						if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
								// 							if(extension == 'pdf'){
								// 								var folderName = fileName.split(" ").join("_");
								// 								console.log("folderName == " + folderName);
								// 								outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+folderName+"/";
								// 								fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,outputDirectory);
								// 								let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name);
								// 									pdf(dataBuffer).then(function(data) {
								// 									console.log("no=====>"+data.numpages);  // number of pages
								// 									numOfpages = data.numpages;
								// 								});
								// 								var fileString = "";
								// 								outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/signed_"+folderName+"/";
								// 								if(!fs.existsSync(outputDirectory)){
								// 									fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
								// 								}
								// 								setTimeout(()=>{
								// 								for(var i = 1 ; i <= numOfpages; i++){
								// 									var j = "";
								// 									if(numOfpages >= 100){
								// 										if(parseInt((i/100)) > 0){
								// 											j = i
								// 										}else if(parseInt((i/10)) > 0){
								// 											j = "0" + i;
								// 										}else{
								// 											j = "00" + i;
								// 										}
								// 									}else  if(numOfpages >= 10){
								// 										if(parseInt((i/10)) > 0){
								// 											j = i;
								// 										}else{
								// 											j = "0" + i;
								// 										}
								// 									}else  if(numOfpages >= 1){
								// 										j =  i;
								// 									}
																	
								// 										console.log("fileName 1== " + fileName);
								// 										filePath =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
								// 										console.log(filePath);
								// 										var file_name =  fileName+"-"+j+".jpg";
								// 										console.log("file_name ==  111" + file_name);
								// 										fn.signingDocuments_marksheet(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, 'Thesis', outputDirectory,function(err){
								// 											if(err){
								// 												return res.json({
								// 												status : 400,
								// 												message : err
								// 												})
								// 											}else{
								// 												fn.signingDocuments_notforprint_marksheet(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, 'Thesis', outputDirectory,function(err){
								// 													if(err){
								// 														return res.json({
								// 														status : 400,
								// 														message : err
								// 														})
								// 													}else{
								
								// 														fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
								// 														console.log("fileString == " + fileString);
								// 													}
								// 												});
								
																				
								// 											}
								// 										});
								// 									}
								// 								},4000) 
																
																
								// 								setTimeout(()=>{
								// 									console.log("fileString 2 == " + fileString);
								// 									outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
								// 									fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, fileString, function(err){
								// 										if(err){
								// 											return res.json({
								// 												status : 400,
								// 												message : "Files cannot merge"
								// 											})
								// 										}else{
								// 											var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
								// 											models.Emailed_Docs.find({
								// 												where : {
								// 													filename : file_name,
								// 													transcript_id: transcript.id,
								// 													app_id:app_id,
								// 												}
								// 											}).then(function(emailedDoc){
								// 												if(emailedDoc){
								
								// 												}else{
								// 													models.Emailed_Docs.create({
								// 														filename : file_name,
								// 														doc_type : doc_name,
								// 														category : category,
								// 														transcript_id: transcript.id,
								// 														app_id:app_id,
								// 													}).then((result)=>{
								// 													// logger.debug(" result : "+JSON.stringify(result))
								// 												})
								// 												}
								// 											})
								// 										}
								// 									});
								// 								}, 6000);
								// 							}else{
								// 								outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
								// 								console.log("22222222");
								// 								fn.signingDocuments_marksheet(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, 'Thesis', outputDirectory, function(err){
								// 									if(err){
								// 										return res.json({
								// 											status : 400,
								// 											message : err
								// 										})
								// 									}else{
								// 										fn.signingDocuments_notforprint_marksheet(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, 'Thesis', outputDirectory, function(err){
								// 											if(err){
								// 												return res.json({
								// 												status : 400,
								// 												message : err
								// 												})
								// 											}else{
								
								// 												var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
								// 										models.Emailed_Docs.find({
								// 											where : {
								// 												filename : file_name,
								// 												transcript_id: transcript.id,
								// 												app_id:app_id,
								// 											}
								// 										}).then(function(emailedDoc){
								// 											if(emailedDoc){
								
								// 											}else{
								// 												models.Emailed_Docs.create({
								// 													filename : file_name,
								// 													doc_type : doc_name,
								// 													category : category,
								// 													transcript_id: transcript.id,
								// 													app_id:app_id
								// 												}).then((result)=>{
								// 												// logger.debug(" result : "+JSON.stringify(result))
								// 											})
								// 											}
								// 										})
								// 											}
								// 										});
																		
								// 									}
								// 								});
								// 							}
								// 						}else{
								// 							var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
								// 							models.Emailed_Docs.find({
								// 								where : {
								// 									filename : file_name,
								// 									transcript_id: transcript.id,
								// 									app_id:app_id,
								// 								}
								// 							}).then(function(emailedDoc){
								// 								if(emailedDoc){
								
								// 								}else{
								// 									models.Emailed_Docs.create({
								// 										filename : file_name,
								// 										doc_type : doc_name,
								// 										category : category,
								// 										transcript_id: transcript.id,
								// 										app_id:app_id
								// 									}).then((result)=>{
								// 									// logger.debug(" result : "+JSON.stringify(result))
								// 								})
								// 								}
								// 							})
								// 						}
								// 					}else{
								// 						return res.json({
								// 							status : 400,
								// 							message : transcript.name + 'not found'
								// 						})
								// 					}
								// 				}
								// 			})
								// 		})
								// 	}else{
	
								// 	}
									
								// })
							}
							if(user[0].instructionalField == true){
								console.log("instructional letter");
								var collegeData = [];
								var reference_no;
								var prefix = '';
								var subject = '';
								var subject1 = '';
								var application_id = app_id
							
								models.Application.findOne({
									where :{
										id : application_id,
										[Op.or]:[{
											source_from:'guattestation',
										 },
										 {
											source_from:'gumoi',
										 }]
									}
								}).then(function(application){
									console.log('----1----')
									models.User.find({
										where :{
											id : application.user_id
										}
									}).then(function(user){
										console.log('----2----')
										if(user.gender == 'Female'){
												console.log('----3----')
											prefix = 'Ms. ';
											subject = 'She';
											subject1 = 'her';
										}else if(user.gender == 'Male'){
											console.log('----4----')
											prefix = 'Mr. ';
											subject = 'He';
											subject1 = 'his';
										}
										
										models.Applied_For_Details.find({
											where :{
												user_id : application.user_id,
												app_id : application_id,
												source : 'guattestation'
											}
										}).then(function(appliedDetails){
											console.log('----5----')
											if(appliedDetails.applying_for == 'Masters,Bachelors'){
												console.log('----6----')
												models.userMarkList.findAll({
													where :{
														type : "Masters",
														user_id : application.user_id,source : 'guattestation'
													}
												}).then(function(master_Details){
													console.log('----7----')
													var masterDetails = [];
													if(master_Details){
														console.log('----8----')
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
														console.log('----9----')
														if(masterDetails){
															var facultyData = [];
															console.log('----10----')
															masterDetails.forEach(master =>{
																var flag = false;
																var college = {};
																if(master.patteren == 'Annual'){
																	college.name = master.name;
																	college.collegeId = master.collegeId;
																}else if(master.patteren == 'Semester'){
																	switch(master.name){
																		case 'Semester 2' : 
																			college.name = 'First Year',
																			college.collegeId = master.collegeId
																			break;
																		case 'Semester 4' :
																			college.name = 'Second Year',
																			college.collegeId = master.collegeId
																			break;
																		case 'Semester 6' :
																			college.name = 'Third Year',
																			college.collegeId = master.collegeId
																			break;
																		case 'Semester 8' :
																			college.name = 'Fourth Year',
																			college.collegeId = master.collegeId
																			break;
																		case 'Semester 10' :
																			college.name = 'Fifth Year',
																			college.collegeId = master.collegeId
																		break;
																		default :
																			college.name = '',
																			college.collegeId = master.collegeId
																	}
																}
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
																			if(count <= data.colleges.length){
																				data.colleges.push(college);     
																			}
																		}
																	})
																	if(flag == false){
																	facultyData.push({
																			type:master.type,
																			faculty : master.faculty,
																			colleges : colleges.push(college),
																			patteren :master.patteren,
																			type: master.type,
																			course_faculty : master.course_faculty
																		})
																	}
																}else{
																	var colleges = [];
																	colleges.push(college);
																	facultyData.push({
																		type:master.type,
																		faculty : master.faculty,
																		colleges : colleges,
																		patteren : master.patteren,
																		type :master.type,
																		course_faculty : master.course_faculty
																	})
																}
															})
															console.log('----11----' + JSON.stringify(facultyData));
															facultyData.forEach(faculty=>{
																models.InstructionalDetails.findAll({
																	where :{
																		userId : application.user_id,
																		education : faculty.type + '_' + faculty.course_faculty
																	}
																}).then(function(instructionalDetails){
																	console.log('----12----' + JSON.stringify(instructionalDetails))
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
																		if(appliedDetails.current_year == true){
																			console.log("----13 test ----");
																			instruction_letter_length = instruction_letter_length  + 1;
																			models.College.find ({
																				where :{
																					id : faculty.colleges[0].collegeId
																				}
																			}).then(function(college){
																				var studentName =  instructional_Details[0].studentName;
																				var collegeName ;
																				if(college.type == 'college'){
																					collegeName = instructional_Details[0].collegeName ;
																				}else if(college.type == 'department'){
																					collegeName = instructional_Details[0].collegeName + ", ";
																				}
																				var courseName = instructional_Details[0].courseName;
																				var specialization = instructional_Details[0].specialization;
																				var passingMonthYear = instructional_Details[0].yearofpassing;
																				var yearofenrollment = instructional_Details[0].yearofenrollment;
																				var duration = converter.toWords(instructional_Details[0].duration);
																				var passingClass = instructional_Details[0].division;
																				var clg = instructional_Details[0].clg;
																				var shortname = instructional_Details[0].courseshort;
																				var new_course_faculty =  instructional_Details[0].new_course_faculty;
																				var instruction_medium;
																				if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																					instruction_medium = instructional_Details[0].instruction_medium;
																				}else{
																					instruction_medium = instructional_Details[0].instruction_medium;
																				}
																				var education = instructional_Details[0].education;
																				setTimeout(()=>{
																					if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																						console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
																						models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																							if(MaxReferenceNo[0].maxNumber == null){
																								reference_no = 1001;
																							}else{
																								reference_no=100000 + parseInt(app_id)
																								// reference_no = MaxReferenceNo[0].maxNumber + 1;
																							}
																							models.InstructionalDetails.update({
																								reference_no : reference_no
																							},{
																								where :{
																									id : instructional_Details[0].id
																								}
																							}).then(function(updatedDetails){
																								//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																								var ref_no = reference_no;
																								self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																									if(err) {
																										res.json({ 
																											status: 400
																										})
																									}else{
																										self_pdf.currently_studying_instructionalLetter_notforprint(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																											passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																												if(err) {
																													res.json({ 
																														status: 400
																													})
																												}else{
																													models.Emailed_Docs.find({
																														where :{
																															app_id:app_id,
																															filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														}
																													}).then(function(emailDoc){
																														if(!emailDoc){
																															models.Emailed_Docs.create({
																																filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																																doc_type : "InstructionalLetter",
																																category : "InstructionalLetter",
																																user_id: user_id,
																																transcript_id: null,
																																marklist_id : null,
																																app_id:app_id,
																																curriculum_id : null
																															}).then((result)=>{
																																// logger.debug(" result : "+JSON.stringify(result))
																															})
																														}
																													})
																												}
																											})
																									}
																								})
																							})
																						})
																					}else{
																						var ref_no = instructionalDetails[0].reference_no;
																						self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																						passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																							if(err) {
																								res.json({ 
																									status: 400
																								})
																							}else{
																								self_pdf.currently_studying_instructionalLetter_notforprint(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																									passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																										if(err) {
																											res.json({ 
																												status: 400
																											})
																										}else{
																											models.Emailed_Docs.find({
																												where :{
																													app_id:app_id,
																													filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																												}
																											}).then(function(emailDoc){
																												if(!emailDoc){
																													models.Emailed_Docs.create({
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														doc_type : "InstructionalLetter",
																														category : "InstructionalLetter",
																														user_id: user_id,
																														transcript_id: null,
																														marklist_id : null,
																														app_id:app_id,
																														curriculum_id : null
																													}).then((result)=>{
																														// logger.debug(" result : "+JSON.stringify(result))
																													})
																												}
																											})
																										}
																									})
											
																							}
																						})
																					}
																				})
																			})
																		}else{
																			if(instructional_Details.length > 1){
																				instruction_letter_length = instruction_letter_length  + 1;
																				console.log("----13----");
																				var studentName = instructional_Details[0].studentName;
																				var courseName = instructional_Details[0].courseName;
																				var specialization = instructional_Details[0].specialization;
																				var passingMonthYear = instructional_Details[0].yearofpassing;
																				var yearofenrollment = instructional_Details[0].yearofenrollment;
																				var duration = converter.toWords(instructional_Details[0].duration);
																				var duration1 =instructional_Details[0].duration;
																				var passingClass = instructional_Details[0].division;
																				var new_course_faculty =  instructional_Details[0].new_course_faculty;
																				var clg = instructional_Details[0].clg;
																				var shortname = instructional_Details[0].courseshort;
																				var instruction_medium;
																				if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																					instruction_medium = instructionalDetails[0].instruction_medium
																				}else{
																					instruction_medium = instructionalDetails[0].instruction_medium;
																				}
																				var education = instructional_Details[0].education;
																				var instructionId = '';
																				instructional_Details.forEach(instruction =>{
																					console.log(instruction.academicYear);
																					faculty.colleges.forEach(singleDetail=>{
																						console.log(singleDetail.name);
																						models.College.find({
																							where : {
																								id : singleDetail.collegeId
																							}
																						}).then(function(college){
																							if(instruction.academicYear){
																								if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
																									console.log("same");
																									if(college.type == 'college'){
																										console.log("college");
																										collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Gujarat University.")
																									}else if(college.type == 'department'){
																										console.log("department");
																										collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Gujarat University.")
																									}
																								}
																							}else{
							
																							}
																							
																							console.log("collegeData inside college == " + JSON.stringify(collegeData))
																						})
																					})
																					instructionId += instruction.id +','
																					console.log("collegeData inside == " + JSON.stringify(collegeData))
																				})
																				setTimeout(()=>{
																					console.log("collegeData == " + JSON.stringify(collegeData))
																					console.log("----13----");
																					var instructionIds = instructionId.split(',');
																					console.log("instructionIds == " ,instructionIds)
																					instructionIds.pop();
																					console.log("instructionIds == " ,instructionIds)
																					instructionId = instructionIds.join(',');
																					console.log("instructionId == " + instructionId);
																					setTimeout(function(){
																						console.log("----14----");
																						if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																							console.log("----15----");
																							models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																								if(MaxReferenceNo[0].maxNumber == null){
																									reference_no = 1001;
																								}else{
																									reference_no=100000 + parseInt(app_id)  
																									// reference_no = MaxReferenceNo[0].maxNumber + 1;
																								}
											
																								models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
																									console.log("----16----");
																									var ref_no = reference_no;
																									self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																									passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																										if(err) {
																											console.log("----17----");
																											res.json({ 
																												status: 400
																											})
																										}else{
																											self_pdf.instrucationalLetterForDiffClg_two_notforprint(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																												passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																													if(err) {
																														console.log("----17----");
																														res.json({ 
																															status: 400
																														})
																													}else{
																														console.log("----18----");
																														models.Emailed_Docs.find({
																															where :{
																																app_id:app_id,
																																filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																															}
																														}).then(function(emailDoc){
																															if(!emailDoc){
																																models.Emailed_Docs.create({
																																filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																																doc_type : "InstructionalLetter",
																																category : "InstructionalLetter",
																																user_id: user_id,
																																transcript_id: null,
																																marklist_id : null,
																																app_id:app_id,
																																curriculum_id : null
																																}).then((result)=>{
																																// logger.debug(" result : "+JSON.stringify(result))
																																})
																															}
																														})
							
																													}
																												})
																										
																										}
																									})
																								})
																							});
																						}else{
																							console.log("----19----");
																							var ref_no = instructionalDetails[0].reference_no;
																							self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																								if(err) {
																									console.log("----20----");
																									res.json({ 
																										status: 400
																									})
																								}else{
																									self_pdf.instrucationalLetterForDiffClg_two_notforprint(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																											if(err) {
																												console.log("----20----");
																												res.json({ 
																													status: 400
																												})
																											}else{
																												console.log("----21----");
																												models.Emailed_Docs.find({
																													where :{
																														app_id:app_id,
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													}
																												}).then(function(emailDoc){
																													if(!emailDoc){
																														models.Emailed_Docs.create({
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														doc_type : "InstructionalLetter",
																														category : "InstructionalLetter",
																														user_id: user_id,
																														transcript_id: null,
																														marklist_id : null,
																														app_id:app_id,
																														curriculum_id : null
																														}).then((result)=>{
																														// logger.debug(" result : "+JSON.stringify(result))
																														})
																													}
																												})
																											}
																										})
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
																						var studentName =  instructional_Details[0].studentName;
																						var collegeName ;
																						if(college.type == 'college'){
																							collegeName = instructional_Details[0].collegeName ;
																						}else if(college.type == 'department'){
																							collegeName = instructional_Details[0].collegeName + ", ";
																						}
																						var courseName = instructional_Details[0].courseName;
																						var specialization = instructional_Details[0].specialization;
																						var passingMonthYear = instructional_Details[0].yearofpassing;
																						var yearofenrollment = instructional_Details[0].yearofenrollment;
																						var duration = converter.toWords(instructional_Details[0].duration);
																						var duration1 =instructional_Details[0].duration;
																						var passingClass = instructional_Details[0].division;
																						var clg = instructional_Details[0].clg;
																						var shortname = instructional_Details[0].courseshort;
																						var new_course_faculty =  instructional_Details[0].new_course_faculty;
																						var instruction_medium;
																						var clg =instructional_Details[0].clg;
																						var courseshort =instructional_Details[0].courseshort;
																						if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																							instruction_medium = instructionalDetails[0].instruction_medium;
																						}else{
																							instruction_medium = instructional_Details[0].instruction_medium;
																						}
																						var education = instructional_Details[0].education;
																						setTimeout(()=>{
																							if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																								console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
																								models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																									if(MaxReferenceNo[0].maxNumber == null){
																										reference_no = 1001;
																									}else{
																										reference_no=100000 + parseInt(app_id)
																											// reference_no = MaxReferenceNo[0].maxNumber + 1;
																									}
																									models.InstructionalDetails.update(
																										{
																											reference_no : reference_no
																										},{
																										where :{
																											id : instructional_Details[0].id
																										}
																									}).then(function(updatedDetails){
																										//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																										var ref_no = reference_no;
																										self_pdf.instrucationalLetter_one(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																											if(err) {
																												res.json({ 
																													status: 400
																												})
																											}else{
																												self_pdf.instrucationalLetter_one_notforprint(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																													passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																											if(err) {
																												res.json({ 
																													status: 400
																												})
																											}else{
																												models.Emailed_Docs.find({
																													where :{
																														app_id:app_id,
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													}
																												}).then(function(emailDoc){
																													if(!emailDoc){
																														models.Emailed_Docs.create({
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														doc_type : "InstructionalLetter",
																														category : "InstructionalLetter",
																														user_id: user_id,
																														transcript_id: null,
																														marklist_id : null,
																														app_id:app_id,
																														curriculum_id : null
																														}).then((result)=>{
																														// logger.debug(" result : "+JSON.stringify(result))
																														})
																													}
																												})
																											}
																										})
																												
																											}
																										})
																									})
																								})
																							}else{
																								var ref_no = instructionalDetails[0].reference_no;
																								self_pdf.instrucationalLetter_one(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																									if(err) {
																										res.json({ 
																											status: 400
																										})
																									}else{
																										self_pdf.instrucationalLetter_one_notforprint(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																											passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																												if(err) {
																													res.json({ 
																														status: 400
																													})
																												}else{
																													models.Emailed_Docs.find({
																														where :{
																															app_id:app_id,
																															filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														}
																													}).then(function(emailDoc){
																														if(!emailDoc){
																															models.Emailed_Docs.create({
																															filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																															doc_type : "InstructionalLetter",
																															category : "InstructionalLetter",
																															user_id: user_id,
																															transcript_id: null,
																															marklist_id : null,
																															app_id:app_id,
																															curriculum_id : null
																															}).then((result)=>{
																															// logger.debug(" result : "+JSON.stringify(result))
																															})
																														}
																													})
																												}
																											})
																										
																									}
																								})
																							}
																						})
																					})
																				}
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
																	user_id : application.user_id,source : 'guattestation'
																}
															}).then(function(bachelor_Details){
																console.log('----33----')
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
																	console.log('----34----')
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
																					if(count <= data.colleges.length){
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
																									data.colleges.push({
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
																					colleges : colleges,
																					patteren : bachelor.patteren,
																				type : bachelor.type,
																				course_faculty : bachelor.course_faculty
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
																				colleges : colleges,
																				patteren : bachelor.patteren,
																				type : bachelor.type,
																				course_faculty : bachelor.course_faculty
							
																			})
																		}
																	})
																	console.log('----35----')
																	facultyData.forEach(faculty=>{
																		models.InstructionalDetails.findAll({
																			where :{
																				userId : application.user_id,
																				education : faculty.type + '_' + faculty.course_faculty
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
																				console.log("----13----");
																				var studentName =instructional_Details[0].studentName;
																				var courseName = instructional_Details[0].courseName;
																				var specialization = instructional_Details[0].specialization;
																				var passingMonthYear = instructional_Details[0].yearofpassing;
																				var yearofenrollment = instructional_Details[0].yearofenrollment;
																				var duration = converter.toWords(instructional_Details[0].duration);
																				var new_course_faculty =  instructional_Details[0].new_course_faculty;
																				var passingClass = instructional_Details[0].division;
																				var instruction_medium;
																				if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																					instruction_medium = instructionalDetails[0].instruction_medium;
																				}else{
																					instruction_medium = instructionalDetails[0].instruction_medium;
																				}
																				var education = instructional_Details[0].education;
																				
																				var instructionId = '';
																				
																					
																					instructional_Details.forEach(instruction =>{
																						console.log(instruction.academicYear);
																						faculty.colleges.forEach(singleDetail=>{
																							console.log(singleDetail.name);
																							models.College.find({
																								where : {
																									id : singleDetail.collegeId
																								}
																							}).then(function(college){
																								if(instruction.academicYear){
																									if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
																										console.log("same");
																										if(college.type == 'college'){
																											console.log("college");
																											collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Gujarat University.")
																										}else if(college.type == 'department'){
																											console.log("department");
																											collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Gujarat University.")
																										}
																									}
																								}else{
																									
																								}
																								
																								console.log("collegeData inside college == " + JSON.stringify(collegeData))
																							})
																						})
																						instructionId += instruction.id +','
																						console.log("collegeData inside == " + JSON.stringify(collegeData))
																					})
											
																				setTimeout(()=>{
																					console.log("collegeData == " + JSON.stringify(collegeData))
																					console.log("----13----");
																					var instructionIds = instructionId.split(',');
																					console.log("instructionIds == " ,instructionIds)
																					instructionIds.pop();
																					console.log("instructionIds == " ,instructionIds)
																					instructionId = instructionIds.join(',');
																					console.log("instructionId == " + instructionId);
																					setTimeout(function(){
																						console.log("----14----");
																						if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																							console.log("----15----");
																							models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																								if(MaxReferenceNo[0].maxNumber == null){
																									reference_no = 1001;
																								}else{
																									reference_no=100000 + parseInt(app_id)
																									// reference_no = MaxReferenceNo[0].maxNumber + 1;
																								}
											
																								models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
																									console.log("----16----");
																									var ref_no = reference_no;
																									self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																									passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																										if(err) {
																											console.log("----17----");
																											res.json({ 
																												status: 400
																											})
																										}else{
																											self_pdf.instrucationalLetterForDiffClg_two_notforprint(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																												passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																													if(err) {
																														console.log("----17----");
																														res.json({ 
																															status: 400
																														})
																													}else{
																														console.log("----18----");
																														models.Emailed_Docs.find({
																															where :{
																																app_id:app_id,
																																filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																															}
																														}).then(function(emailDoc){
																															if(!emailDoc){
																																models.Emailed_Docs.create({
																																filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																																doc_type : "InstructionalLetter",
																																category : "InstructionalLetter",
																																user_id: user_id,
																																transcript_id: null,
																																marklist_id : null,
																																app_id:app_id,
																																curriculum_id : null
																																}).then((result)=>{
																																// logger.debug(" result : "+JSON.stringify(result))
																																})
																															}
																														})
																													}
																												})
																										
																										}
																									})
																								})
																							});
																						}else{
																							console.log("----19----");
																							var ref_no = instructionalDetails[0].reference_no;
																							self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																								if(err) {
																									console.log("----20----");
																									res.json({ 
																										status: 400
																									})
																								}else{
																									self_pdf.instrucationalLetterForDiffClg_two_notforprint(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																											if(err) {
																												console.log("----20----");
																												res.json({ 
																													status: 400
																												})
																											}else{
																												console.log("----21----");
																												models.Emailed_Docs.find({
																													where :{
																														app_id:app_id,
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													}
																												}).then(function(emailDoc){
																													if(!emailDoc){
																														models.Emailed_Docs.create({
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														doc_type : "InstructionalLetter",
																														category : "InstructionalLetter",
																														user_id: user_id,
																														transcript_id: null,
																														marklist_id : null,
																														app_id:app_id,
																														curriculum_id : null
																														}).then((result)=>{
																														// logger.debug(" result : "+JSON.stringify(result))
																														})
																													}
																												})
																											}
																										})
																								
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
																						var studentName =  instructional_Details[0].studentName;
																						var collegeName ;
																						if(college.type == 'college'){
																							collegeName = instructional_Details[0].collegeName ;
																						}else if(college.type == 'department'){
																							collegeName = instructional_Details[0].collegeName + ", ";
																						}
																						var courseName = instructional_Details[0].courseName;
																						var specialization = instructional_Details[0].specialization;
																						var passingMonthYear = instructional_Details[0].yearofpassing;
																						var yearofenrollment = instructional_Details[0].yearofenrollment;
																						var duration = converter.toWords(instructional_Details[0].duration);
																						var passingClass = instructional_Details[0].division;
																						// var patteren =faculty[0].patteren;
																						var duration1 =instructional_Details[0].duration;
																						var new_course_faculty =  instructional_Details[0].new_course_faculty;
																						var instruction_medium;
																						var clg =instructional_Details[0].clg;
																						var courseshort =instructional_Details[0].courseshort;
																						if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																							instruction_medium = instructionalDetails[0].instruction_medium;
																						}else{
																							instruction_medium = instructional_Details[0].instruction_medium;
																						}
																						var education = instructional_Details[0].education;
																						setTimeout(()=>{
																							if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																								console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
																								models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																									if(MaxReferenceNo[0].maxNumber == null){
																										reference_no = 1001;
																									}else{
																										reference_no=100000 + parseInt(app_id)
																											// reference_no = MaxReferenceNo[0].maxNumber + 1;
																									}
																									models.InstructionalDetails.update(
																										{
																											reference_no : reference_no
																										},{
																										where :{
																											id : instructional_Details[0].id
																										}
																									}).then(function(updatedDetails){
																										//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																										var ref_no = reference_no;
																										self_pdf.instrucationalLetter_one(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																											if(err) {
																												res.json({ 
																													status: 400
																												})
																											}else{
																												self_pdf.instrucationalLetter_one_notforprint(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																													passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																														if(err) {
																															res.json({ 
																																status: 400
																															})
																														}else{
																															models.Emailed_Docs.find({
																																where :{
																																	app_id:app_id,
																																	filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																																}
																															}).then(function(emailDoc){
																																if(!emailDoc){
																																	models.Emailed_Docs.create({
																																	filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																																	doc_type : "InstructionalLetter",
																																	category : "InstructionalLetter",
																																	user_id: user_id,
																																	transcript_id: null,
																																	marklist_id : null,
																																	app_id:app_id,
																																	curriculum_id : null
																																	}).then((result)=>{
																																	// logger.debug(" result : "+JSON.stringify(result))
																																	})
																																}
																															})
																														}
																													})
																											
																											}
																										})
																									})
																								})
																							}else{
																								var ref_no = instructionalDetails[0].reference_no;
																								self_pdf.instrucationalLetter_one(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																									if(err) {
																										res.json({ 
																											status: 400
																										})
																									}else{
																										self_pdf.instrucationalLetter_one_notforprint(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																											passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																												if(err) {
																													res.json({ 
																														status: 400
																													})
																												}else{
																													models.Emailed_Docs.find({
																														where :{
																															app_id:app_id,
																															filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														}
																													}).then(function(emailDoc){
																														if(!emailDoc){
																															models.Emailed_Docs.create({
																															filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																															doc_type : "InstructionalLetter",
																															category : "InstructionalLetter",
																															user_id: user_id,
																															transcript_id: null,
																															marklist_id : null,
																															app_id:app_id,
																															curriculum_id : null
																															}).then((result)=>{
																															// logger.debug(" result : "+JSON.stringify(result))
																															})
																														}
																													})
																												}
																											})
																				
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
											}
											else if(appliedDetails.applying_for == 'Bachelors'){
												console.log("appliedDetails.applying_for == ===="+appliedDetails.applying_for);
												console.log("----6----");
												var bachelorDetails = [];
												models.userMarkList.findAll({
													where :{
														type : "Bachelors",
														user_id : application.user_id,source : 'guattestation'
													}
												}).then(function(bachelor_Details){
													console.log("----7----");
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
													console.log("----8----");
													if(bachelorDetails){
														console.log("----9----");
														var facultyData = [];
							
														bachelorDetails.forEach(bachelor =>{
															var flag = false;
															var college = {};
															if(bachelor.patteren == 'Annual'){
																college.name = bachelor.name,
																college.collegeId = bachelor.collegeId
																
															}else if(bachelor.patteren == 'Semester'){
																switch(bachelor.name){
																	case 'Semester 2' : 
																		college.name = 'First Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 4' :
																		college.name = 'Second Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 6' :
																		college.name = 'Third Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 8' :
																		college.name = 'Fourth Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 10' :
																		college.name = 'Fifth Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	// default :
																	//     college.push({
																	//         name : '',
																	//         collegeId : bachelor.collegeId
																	//     })
																	default :
																			college.name = '',
																			college.collegeId = bachelor.collegeId
																}
															}
																
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
																			data.colleges.push(college);
																		}
																	}
																})
																if(flag == false){
																	var colleges = [];
																colleges.push(college);
																	
																	facultyData.push({
																		type:bachelor.type,
																		faculty : bachelor.faculty,
																		colleges : colleges,
																		patteren : bachelor.patteren,
																		course_faculty : bachelor.course_faculty,
																		
																	})
																}
															}else{
																var colleges = [];
																colleges.push(college);
															facultyData.push({
																	type:bachelor.type,
																	faculty : bachelor.faculty,
																	course_faculty : bachelor.course_faculty,
																	colleges : colleges,
																	patteren :bachelor.patteren
																})
															}
														})
														console.log("----10----");
														console.log("facultyData == "+ JSON.stringify(facultyData));
														facultyData.forEach(faculty=>{
															models.InstructionalDetails.findAll({
																where :{
																	userId : application.user_id,
																	education : faculty.type + '_' + faculty.course_faculty
																}
															}).then(function(instructionalDetails){
																console.log("----11----");
																// console.log("instructionalDetails == " + JSON.stringify(instructionalDetails))
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
																console.log("----12----");
																console.log("instructional_Details == " + JSON.stringify(instructional_Details))
																console.log("current_year == " + appliedDetails.current_year);
																console.log("faculty.colleges.length" + faculty.colleges.length);
																if(appliedDetails.current_year == true){
																	console.log("----13 test ----");
																	instruction_letter_length = instruction_letter_length  + 1;
																	// if(faculty.colleges.length == 1){
																		models.College.find ({
																			where :{
																				id : faculty.colleges[0].collegeId
																			}
																		}).then(function(college){
																			console.log("_________var studentName =  instructional_Details[0].studentName;"+ instructional_Details[0].studentName);
																			var studentName =  instructional_Details[0].studentName;
																			var collegeName ;
																			if(college.type == 'college'){
																				collegeName = instructional_Details[0].collegeName ;
																			}else if(college.type == 'department'){
																				collegeName = instructional_Details[0].collegeName + ", ";
																			}
																			var courseName = instructional_Details[0].courseName;
																			var specialization = instructional_Details[0].specialization;
																			var passingMonthYear = instructional_Details[0].yearofpassing;
																			var yearofenrollment = instructional_Details[0].yearofenrollment;
																			var duration = converter.toWords(instructional_Details[0].duration);
																			var passingClass = instructional_Details[0].division;
																			var patteren =faculty.patteren;
																			var duration1 =instructional_Details[0].duration;
																			var clg =instructional_Details[0].clg;
																			var courseshort =instructional_Details[0].courseshort;
																			var new_course_faculty =  instructional_Details[0].new_course_faculty;
																			var instruction_medium;
							
																			if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																				instruction_medium = instructionalDetails[0].instruction_medium;
																			}else{
																				instruction_medium = instructional_Details[0].instruction_medium;
																			}
																			var education = instructional_Details[0].education;
																			setTimeout(()=>{
																				if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																					console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
																					models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																						if(MaxReferenceNo[0].maxNumber == null){
																							reference_no = 1001;
																						}else{
																							reference_no=100000 + parseInt(app_id)
																							// reference_no = MaxReferenceNo[0].maxNumber + 1;
																						}
																						models.InstructionalDetails.update(
																							{
																								reference_no : reference_no
																							},{
																							where :{
																								id : instructional_Details[0].id
																							}
																						}).then(function(updatedDetails){
																							//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																							var ref_no = reference_no;
																							self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																								if(err) {
																									res.json({ 
																										status: 400
																									})
																								}else{
																									self_pdf.currently_studying_instructionalLetter_notforprint(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																											if(err) {
																												res.json({ 
																													status: 400
																												})
																											}else{
																												models.Emailed_Docs.find({
																													where :{
																														app_id:app_id,
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													}
																												}).then(function(emailDoc){
																													if(!emailDoc){
																														models.Emailed_Docs.create({
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														doc_type : "InstructionalLetter",
																														category : "InstructionalLetter",
																														user_id: user_id,
																														transcript_id: null,
																														marklist_id : null,
																														app_id:app_id,
																														curriculum_id : null
																														}).then((result)=>{
																														// logger.debug(" result : "+JSON.stringify(result))
																														})
																													}
																												})
																											}
																										})
																								
																								}
																							})
																						})
																					})
																				}else{
																					var ref_no = instructionalDetails[0].reference_no;
																					self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																						if(err) {
																							res.json({ 
																								status: 400
																							})
																						}else{
																							self_pdf.currently_studying_instructionalLetter_notforprint(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																									if(err) {
																										res.json({ 
																											status: 400
																										})
																									}else{
																										models.Emailed_Docs.find({
																											where :{
																												app_id:app_id,
																												filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																											}
																										}).then(function(emailDoc){
																											if(!emailDoc){
																												models.Emailed_Docs.create({
																												filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																												doc_type : "InstructionalLetter",
																												category : "InstructionalLetter",
																												user_id: user_id,
																												transcript_id: null,
																												marklist_id : null,
																												app_id:app_id,
																												curriculum_id : null
																												}).then((result)=>{
																												// logger.debug(" result : "+JSON.stringify(result))
																												})
																											}
																										})
																									}
																								})
																							
																						}
																					})
																				}
																			})
																		})
																	// } 
																	
																}else{
																	if(instructional_Details.length > 1){
																		console.log("----13----");
																		instruction_letter_length = instruction_letter_length  + 1;
																		var studentName =  instructional_Details[0].studentName;
																		var courseName = instructional_Details[0].courseName;
																		var specialization = instructional_Details[0].specialization;
																		var passingMonthYear = instructional_Details[0].yearofpassing;
																		var yearofenrollment = instructional_Details[0].yearofenrollment;
																		var duration = converter.toWords(instructional_Details[0].duration);
																		var duration1 =instructional_Details[0].duration;
																		var passingClass = instructional_Details[0].division;
																		var new_course_faculty =  instructional_Details[0].new_course_faculty;
																		var instruction_medium;
																		if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																			instruction_medium = instructionalDetails[0].instruction_medium;
																		}else{
																			instruction_medium = instructionalDetails[0].instruction_medium;
																		}
																		var education = instructional_Details[0].education;
																		
																		var instructionId = '';
																		
																			
																		instructional_Details.forEach(instruction =>{
																			console.log(instruction.academicYear);
																			faculty.colleges.forEach(singleDetail=>{
																				console.log(singleDetail.name);
																				models.College.find({
																					where : {
																						id : singleDetail.collegeId
																					}
																				}).then(function(college){
																					if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
																						console.log("same");
																						if(college.type == 'college'){
																							console.log("college");
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Gujarat University.")
																						}else if(college.type == 'department'){
																							console.log("department");
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Gujarat University.")
																						}
																					}
																					console.log("collegeData inside college == " + JSON.stringify(collegeData))
																				})
																			})
																			instructionId += instruction.id +','
																			console.log("collegeData inside == " + JSON.stringify(collegeData))
																		})
							
																		setTimeout(()=>{
																			console.log("collegeData == " + JSON.stringify(collegeData))
																			console.log("----13----");
																			var instructionIds = instructionId.split(',');
																			console.log("instructionIds == " ,instructionIds)
																			instructionIds.pop();
																			console.log("instructionIds == " ,instructionIds)
																			instructionId = instructionIds.join(',');
																			console.log("instructionId == " + instructionId);
																			setTimeout(function(){
																				console.log("----14----");
																				if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																					console.log("----15----");
																					models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																						if(MaxReferenceNo[0].maxNumber == null){
																							reference_no = 1001;
																						}else{
																							reference_no=100000 + parseInt(app_id)
																								// reference_no = MaxReferenceNo[0].maxNumber + 1;
																						}
							
																						models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
																							console.log("----16----");
																							var ref_no = reference_no;
																							self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																								if(err) {
																									console.log("----17----");
																									res.json({ 
																										status: 400
																									})
																								}else{
																									self_pdf.instrucationalLetterForDiffClg_two_notforprint(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																											if(err) {
																												console.log("----17----");
																												res.json({ 
																													status: 400
																												})
																											}else{
																												console.log("----18----");
																												models.Emailed_Docs.find({
																													where :{
																														app_id:app_id,
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													}
																												}).then(function(emailDoc){
																													if(!emailDoc){
																														models.Emailed_Docs.create({
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														doc_type : "InstructionalLetter",
																														category : "InstructionalLetter",
																														user_id: user_id,
																														transcript_id: null,
																														marklist_id : null,
																														app_id:app_id,
																														curriculum_id : null
																														}).then((result)=>{
																														// logger.debug(" result : "+JSON.stringify(result))
																														})
																													}
																												})
																											}
																										})
																							
																								}
																							})
																						})
																					});
																				}else{
																					console.log("----19----");
																					var ref_no = instructionalDetails[0].reference_no;
																					self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																						if(err) {
																							console.log("----20----");
																							res.json({ 
																								status: 400
																							})
																						}else{
																							self_pdf.instrucationalLetterForDiffClg_two_notforprint(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																									if(err) {
																										console.log("----20----");
																										res.json({ 
																											status: 400
																										})
																									}else{
																										console.log("----21----");
																										models.Emailed_Docs.find({
																											where :{
																												app_id:app_id,
																												filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																											}
																										}).then(function(emailDoc){
																											if(!emailDoc){
																												models.Emailed_Docs.create({
																												filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																												doc_type : "InstructionalLetter",
																												category : "InstructionalLetter",
																												user_id: user_id,
																												transcript_id: null,
																												marklist_id : null,
																												app_id:app_id,
																												curriculum_id : null
																												}).then((result)=>{
																												// logger.debug(" result : "+JSON.stringify(result))
																												})
																											}
																										})
																									}
																								})
																					
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
																				var studentName =  instructional_Details[0].studentName;
																				var collegeName ;
																				if(college.type == 'college'){
																					collegeName = instructional_Details[0].collegeName ;
																				}else if(college.type == 'department'){
																					collegeName = instructional_Details[0].collegeName + ", ";
																				}
																				var courseName = instructional_Details[0].courseName;
																				var specialization = instructional_Details[0].specialization;
																				var passingMonthYear = instructional_Details[0].yearofpassing;
																				var yearofenrollment = instructional_Details[0].yearofenrollment;
																				var duration = converter.toWords(instructional_Details[0].duration);
																				var duration1 = instructional_Details[0].duration;
																				var passingClass = instructional_Details[0].division;
																				var clg = instructional_Details[0].clg;
																				var courseshort = instructional_Details[0].courseshort;
																				var new_course_faculty =  instructional_Details[0].new_course_faculty;
																				var instruction_medium;
																				var clg =instructional_Details[0].clg;
																				var courseshort =instructional_Details[0].courseshort;
																				if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																					instruction_medium = instructionalDetails[0].instruction_medium;
																				}else{
																					instruction_medium = instructional_Details[0].instruction_medium;
																				}
																				var education = instructional_Details[0].education;
																				setTimeout(()=>{
																					if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																						console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
																						models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																							if(MaxReferenceNo[0].maxNumber == null){
																								reference_no = 1001;
																							}else{
																								reference_no=100000 + parseInt(app_id)
																								// reference_no = MaxReferenceNo[0].maxNumber + 1;
																							}
																							models.InstructionalDetails.update(
																								{
																									reference_no : reference_no
																								},{
																								where :{
																									id : instructional_Details[0].id
																								}
																							}).then(function(updatedDetails){
																								//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																								var ref_no = reference_no;
																								self_pdf.instrucationalLetter_one(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																									if(err) {
																										res.json({ 
																											status: 400
																										})
																									}else{
																										self_pdf.instrucationalLetter_one_notforprint(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																											passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																												if(err) {
																													res.json({ 
																														status: 400
																													})
																												}else{
																													models.Emailed_Docs.find({
																														where :{
																															app_id:app_id,
																															filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														}
																													}).then(function(emailDoc){
																														if(!emailDoc){
																															models.Emailed_Docs.create({
																															filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																															doc_type : "InstructionalLetter",
																															category : "InstructionalLetter",
																															user_id: user_id,
																															transcript_id: null,
																															marklist_id : null,
																															app_id:app_id,
																															curriculum_id : null
																															}).then((result)=>{
																															// logger.debug(" result : "+JSON.stringify(result))
																															})
																														}
																													})
																												}
																											})
																								
																									}
																								})
																							})
																						})
																					}else{
																						var ref_no = instructionalDetails[0].reference_no;
																						self_pdf.instrucationalLetter_one(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																						passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																							if(err) {
																								res.json({ 
																									status: 400
																								})
																							}else{
																								self_pdf.instrucationalLetter_one_notforprint(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																									passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																										if(err) {
																											res.json({ 
																												status: 400
																											})
																										}else{
																											models.Emailed_Docs.find({
																												where :{
																													app_id:app_id,
																													filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																												}
																											}).then(function(emailDoc){
																												if(!emailDoc){
																													models.Emailed_Docs.create({
																													filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													doc_type : "InstructionalLetter",
																													category : "InstructionalLetter",
																													user_id: user_id,
																													transcript_id: null,
																													marklist_id : null,
																													app_id:app_id,
																													curriculum_id : null
																													}).then((result)=>{
																													// logger.debug(" result : "+JSON.stringify(result))
																													})
																												}
																											})
																										}
																									})
																		
																							}
																						})
																					}
																				})
																			})
																		}
																	}
																}
															})
														})
													}
												})
											}else if(appliedDetails.applying_for == 'Masters'){
												console.log("APPLICATION   >>>>>>>>>>>>>>>>>>>>"+JSON.stringify(application));
												console.log("----6----");
												var bachelorDetails = [];
												models.userMarkList.findAll({
													where :{
														type : "Masters",
														user_id : application.user_id,source : 'guattestation'
													}
												}).then(function(bachelor_Details){
													console.log("----7----");
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
													console.log("----8----");
													if(bachelorDetails){
														console.log("bachelorDetails  >>>>>>>>>>"+JSON.stringify(bachelorDetails));
														console.log("----9----");
														var facultyData = [];
							
														bachelorDetails.forEach(bachelor =>{
															var flag = false;
															var college = {};
															if(bachelor.patteren == 'Annual'){
																college.name = bachelor.name,
																college.collegeId = bachelor.collegeId
																
															}else if(bachelor.patteren == 'Semester'){
																switch(bachelor.name){
																	case 'Semester 2' : 
																		college.name = 'First Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 4' :
																		college.name = 'Second Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 6' :
																		college.name = 'Third Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 8' :
																		college.name = 'Fourth Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 10' :
																		college.name = 'Fifth Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	// default :
																	//     college.push({
																	//         name : '',
																	//         collegeId : bachelor.collegeId
																	//     })
																	default :
																			college.name = '',
																			college.collegeId = bachelor.collegeId
																}
															}
																
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
																			data.colleges.push(college);
																		}
																	}
																})
																if(flag == false){
																	var colleges = [];
																colleges.push(college);
																	
																	facultyData.push({
																		type:bachelor.type,
																		faculty : bachelor.faculty,
																		colleges : colleges,
																		patteren :bachelor.patteren,
																		course_faculty:bachelor.course_faculty
																	})
																}
															}else{
																var colleges = [];
																colleges.push(college);
															facultyData.push({
																	type:bachelor.type,
																	faculty : bachelor.faculty,
																	colleges : colleges,
																	patteren :bachelor.patteren,
																	course_faculty : bachelor.course_faculty
																})
															}
														})
														console.log("----10----");
														console.log("facultyData == "+ JSON.stringify(facultyData));
														facultyData.forEach(faculty=>{
															models.InstructionalDetails.findAll({
																where :{
																	userId : application.user_id,
																	education : faculty.type + '_' + faculty.course_faculty
																}
															}).then(function(instructionalDetails){
																console.log("----11----");
																console.log("instructionalDetails == " + JSON.stringify(instructionalDetails))
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
																console.log("----12----");
																console.log("instructional_Details == " + JSON.stringify(instructional_Details))
																console.log("current_year == " + appliedDetails.current_year);
																if(appliedDetails.current_year == true){
																	console.log("----13 test ----");
																	instruction_letter_length = instruction_letter_length  + 1;
																	// if(faculty.colleges.length == 1){
																		models.College.find ({
																			where :{
																				id : faculty.colleges[0].collegeId
																			}
																		}).then(function(college){
																			var studentName =  instructional_Details[0].studentName;
																			var collegeName ;
																			if(college.type == 'college'){
																				collegeName = instructional_Details[0].collegeName ;
																			}else if(college.type == 'department'){
																				collegeName = instructional_Details[0].collegeName + ", ";
																			}
																			var courseName = instructional_Details[0].courseName;
																			var specialization = instructional_Details[0].specialization;
																			var passingMonthYear = instructional_Details[0].yearofpassing;
																			var yearofenrollment = instructional_Details[0].yearofenrollment;
																			var duration = converter.toWords(instructional_Details[0].duration);
																			var passingClass = instructional_Details[0].division;
																			var new_course_faculty =  instructional_Details[0].new_course_faculty;
																			var instruction_medium;
							
																			if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																				instruction_medium = instructionalDetails[0].instruction_medium;
																			}else{
																				instruction_medium = instructional_Details[0].instruction_medium;
																			}
																			var education = instructional_Details[0].education;
																			setTimeout(()=>{
																				if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																					console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
																					models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																						if(MaxReferenceNo[0].maxNumber == null){
																							reference_no = 1001;
																						}else{
																							reference_no=100000 + parseInt(app_id)
																								// reference_no = MaxReferenceNo[0].maxNumber + 1;
																						}
																						models.InstructionalDetails.update(
																							{
																								reference_no : reference_no
																							},{
																							where :{
																								id : instructional_Details[0].id
																							}
																						}).then(function(updatedDetails){
																							//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																							var ref_no = reference_no;
																							self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																								if(err) {
																									res.json({ 
																										status: 400
																									})
																								}else{
																									self_pdf.currently_studying_instructionalLetter_notforprint(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																											if(err) {
																												res.json({ 
																													status: 400
																												})
																											}else{
																												models.Emailed_Docs.find({
																													where :{
																														app_id:app_id,
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													}
																												}).then(function(emailDoc){
																													if(!emailDoc){
																														models.Emailed_Docs.create({
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														doc_type : "InstructionalLetter",
																														category : "InstructionalLetter",
																														user_id: user_id,
																														transcript_id: null,
																														marklist_id : null,
																														app_id:app_id,
																														curriculum_id : null
																														}).then((result)=>{
																														// logger.debug(" result : "+JSON.stringify(result))
																														})
																													}
																												})
																											}
																										})
																						
																								}
																							})
																						})
																					})
																				}else{
																					var ref_no = instructionalDetails[0].reference_no;
																					self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																						if(err) {
																							res.json({ 
																								status: 400
																							})
																						}else{
																							self_pdf.currently_studying_instructionalLetter_notforprint(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																									if(err) {
																										res.json({ 
																											status: 400
																										})
																									}else{
																										models.Emailed_Docs.find({
																											where :{
																												app_id:app_id,
																												filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																											}
																										}).then(function(emailDoc){
																											if(!emailDoc){
																												models.Emailed_Docs.create({
																												filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																												doc_type : "InstructionalLetter",
																												category : "InstructionalLetter",
																												user_id: user_id,
																												transcript_id: null,
																												marklist_id : null,
																												app_id:app_id,
																												curriculum_id : null
																												}).then((result)=>{
																												// logger.debug(" result : "+JSON.stringify(result))
																												})
																											}
																										})
																									}
																								})
																					
																						}
																					})
																				}
																			})
																		})
																	// } 
																	
																}else{
																	if(instructional_Details.length > 1){
																		console.log("----13----");
																		instruction_letter_length = instruction_letter_length  + 1;
																		var studentName =instructional_Details[0].studentName;
																		var courseName = instructional_Details[0].courseName;
																		var specialization = instructional_Details[0].specialization;
																		var passingMonthYear = instructional_Details[0].yearofpassing;
																		var yearofenrollment = instructional_Details[0].yearofenrollment;
																		var duration = converter.toWords(instructional_Details[0].duration);
																		var duration1 =instructional_Details[0].duration;
																		var passingClass = instructional_Details[0].division;
																		var instruction_medium;
																		if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																			instruction_medium = instructionalDetails[0].instruction_medium;
																		}else{
																			instruction_medium = instructionalDetails[0].instruction_medium;
																		}
																		var education = instructional_Details[0].education;
																		
																		var instructionId = '';
																		
																			
																		instructional_Details.forEach(instruction =>{
																			console.log(instruction.academicYear);
																			faculty.colleges.forEach(singleDetail=>{
																				console.log(singleDetail.name);
																				models.College.find({
																					where : {
																						id : singleDetail.collegeId
																					}
																				}).then(function(college){
																					if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
																						console.log("same");
																						if(college.type == 'college'){
																							console.log("college");
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Gujarat University.")
																						}else if(college.type == 'department'){
																							console.log("department");
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Gujarat University.")
																						}
																					}
																					console.log("collegeData inside college == " + JSON.stringify(collegeData))
																				})
																			})
																			instructionId += instruction.id +','
																			console.log("collegeData inside == " + JSON.stringify(collegeData))
																		})
							
																		setTimeout(()=>{
																			console.log("collegeData == " + JSON.stringify(collegeData))
																			console.log("----13----");
																			var instructionIds = instructionId.split(',');
																			console.log("instructionIds == " ,instructionIds)
																			instructionIds.pop();
																			console.log("instructionIds == " ,instructionIds)
																			instructionId = instructionIds.join(',');
																			console.log("instructionId == " + instructionId);
																			setTimeout(function(){
																				console.log("----14----");
																				if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																					console.log("----15----");
																					models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																						if(MaxReferenceNo[0].maxNumber == null){
																							reference_no = 1001;
																						}else{
																							reference_no=100000 + parseInt(app_id)
																							// reference_no = MaxReferenceNo[0].maxNumber + 1;
																						}
							
																						models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
																							console.log("----16----");
																							var ref_no = reference_no;
																							self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																								if(err) {
																									console.log("----17----");
																									res.json({ 
																										status: 400
																									})
																								}else{
																									self_pdf.instrucationalLetterForDiffClg_two_notforprint(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																											if(err) {
																												console.log("----17----");
																												res.json({ 
																													status: 400
																												})
																											}else{
																												console.log("----18----");
																												models.Emailed_Docs.find({
																													where :{
																														app_id:app_id,
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													}
																												}).then(function(emailDoc){
																													if(!emailDoc){
																														models.Emailed_Docs.create({
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														doc_type : "InstructionalLetter",
																														category : "InstructionalLetter",
																														user_id: user_id,
																														transcript_id: null,
																														marklist_id : null,
																														app_id:app_id,
																														curriculum_id : null
																														}).then((result)=>{
																														// logger.debug(" result : "+JSON.stringify(result))
																														})
																													}
																												})
																											}
																										})
																							
																								}
																							})
																						})
																					});
																				}else{
																					console.log("----19----");
																					var ref_no = instructionalDetails[0].reference_no;
																					self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																						if(err) {
																							console.log("----20----");
																							res.json({ 
																								status: 400
																							})
																						}else{
																							self_pdf.instrucationalLetterForDiffClg_two_notforprint(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																									if(err) {
																										console.log("----20----");
																										res.json({ 
																											status: 400
																										})
																									}else{
																										console.log("----21----");
																										models.Emailed_Docs.find({
																											where :{
																												app_id:app_id,
																												filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																											}
																										}).then(function(emailDoc){
																											if(!emailDoc){
																												models.Emailed_Docs.create({
																												filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																												doc_type : "InstructionalLetter",
																												category : "InstructionalLetter",
																												user_id: user_id,
																												transcript_id: null,
																												marklist_id : null,
																												app_id:app_id,
																												curriculum_id : null
																												}).then((result)=>{
																												// logger.debug(" result : "+JSON.stringify(result))
																												})
																											}
																										})
																									}
																								})
																						
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
																				var studentName =  instructional_Details[0].studentName;
																				var collegeName ;
																				if(college.type == 'college'){
																					collegeName = instructional_Details[0].collegeName ;
																				}else if(college.type == 'department'){
																					collegeName = instructional_Details[0].collegeName + ", ";
																				}
																				var courseName = instructional_Details[0].courseName;
																				var specialization = instructional_Details[0].specialization;
																				var passingMonthYear = instructional_Details[0].yearofpassing;
																				var yearofenrollment = instructional_Details[0].yearofenrollment;
																				var duration = converter.toWords(instructional_Details[0].duration);
																				var duration1 = instructional_Details[0].duration;
																				var passingClass = instructional_Details[0].division;
																				var instruction_medium;
																				var clg =instructional_Details[0].clg;
																				var courseshort =instructional_Details[0].courseshort;
																				var new_course_faculty =  instructional_Details[0].new_course_faculty;
																				if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																					instruction_medium = instructionalDetails[0].instruction_medium;
																				}else{
																					instruction_medium = instructional_Details[0].instruction_medium;
																				}
																				var education = instructional_Details[0].education;
																				setTimeout(()=>{
																					if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																						console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
																						models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																							if(MaxReferenceNo[0].maxNumber == null){
																								reference_no = 1001;
																							}else{
																								// reference_no = MaxReferenceNo[0].maxNumber + 1;
																								reference_no=100000 + parseInt(app_id)
																							}
																							models.InstructionalDetails.update(
																								{
																									reference_no : reference_no
																								},{
																								where :{
																									id : instructional_Details[0].id
																								}
																							}).then(function(updatedDetails){
																								//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																								var ref_no = reference_no;
																								self_pdf.instrucationalLetter_one(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																									if(err) {
																										res.json({ 
																											status: 400
																										})
																									}else{
																										self_pdf.instrucationalLetter_one_notforprint(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																											passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																												if(err) {
																													res.json({ 
																														status: 400
																													})
																												}else{
																													models.Emailed_Docs.find({
																														where :{
																															app_id:app_id,
																															filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														}
																													}).then(function(emailDoc){
																														if(!emailDoc){
																															models.Emailed_Docs.create({
																															filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																															doc_type : "InstructionalLetter",
																															category : "InstructionalLetter",
																															user_id: user_id,
																															transcript_id: null,
																															marklist_id : null,
																															app_id:app_id,
																															curriculum_id : null
																															}).then((result)=>{
																															// logger.debug(" result : "+JSON.stringify(result))
																															})
																														}
																													})
																												}
																											})
																										
																									}
																								})
																							})
																						})
																					}else{
																						var ref_no = instructionalDetails[0].reference_no;
																						self_pdf.instrucationalLetter_one(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																						passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																							if(err) {
																								res.json({ 
																									status: 400
																								})
																							}else{
																								self_pdf.instrucationalLetter_one_notforprint(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																									passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																										if(err) {
																											res.json({ 
																												status: 400
																											})
																										}else{
																											models.Emailed_Docs.find({
																												where :{
																													app_id:app_id,
																													filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																												}
																											}).then(function(emailDoc){
																												if(!emailDoc){
																													models.Emailed_Docs.create({
																													filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													doc_type : "InstructionalLetter",
																													category : "InstructionalLetter",
																													user_id: user_id,
																													transcript_id: null,
																													marklist_id : null,
																													app_id:app_id,
																													curriculum_id : null
																													}).then((result)=>{
																													// logger.debug(" result : "+JSON.stringify(result))
																													})
																												}
																											})
																										}
																									})
																				
																							}
																						})
																					}
																				})
																			})
																		}
																	}
																}
															})
														})
													}
												})
											}else if(appliedDetails.applying_for == 'Phd,Masters,Bachelors'){
												console.log("----6----");
												var bachelorDetails = [];
												models.userMarkList.findAll({
													where :{
														type : "Phd",
														user_id : application.user_id,source : 'guattestation'
													}
												}).then(function(bachelor_Details){
													console.log("----7----");
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
													console.log("----8----");
													if(bachelorDetails){
														console.log("----9----");
														var facultyData = [];
							
														bachelorDetails.forEach(bachelor =>{
															var flag = false;
															var college = {};
															if(bachelor.patteren == 'Annual'){
																college.name = bachelor.name,
																college.collegeId = bachelor.collegeId
																
															}else if(bachelor.patteren == 'Semester'){
																switch(bachelor.name){
																	case 'Semester 2' : 
																		college.name = 'First Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 4' :
																		college.name = 'Second Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 6' :
																		college.name = 'Third Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 8' :
																		college.name = 'Fourth Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	case 'Semester 10' :
																		college.name = 'Fifth Year',
																		college.collegeId = bachelor.collegeId
																		break;
																	// default :
																	//     college.push({
																	//         name : '',
																	//         collegeId : bachelor.collegeId
																	//     })
																	default :
																			college.name = '',
																			college.collegeId = bachelor.collegeId
																}
															}
																
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
																			data.colleges.push(college);
																		}
																	}
																})
																if(flag == false){
																	var colleges = [];
																colleges.push(college);
																	
																	facultyData.push({
																		type:bachelor.type,
																		faculty : bachelor.faculty,
																		colleges : colleges,
																		patteren : faculty.patteren,
																		course_faculty : bachelor.course_faculty
																	})
																}
															}else{
																var colleges = [];
																colleges.push(college);
															facultyData.push({
																	type:bachelor.type,
																	faculty : bachelor.faculty,
																	colleges : colleges,
																	patteren :bachelor.patteren,
																	course_faculty: bachelor.course_faculty
																})
															}
														})
														console.log("----10----");
														console.log("facultyData == "+ JSON.stringify(facultyData));
														facultyData.forEach(faculty=>{
															models.InstructionalDetails.findAll({
																where :{
																	userId : application.user_id,
																	education : faculty.type + '_' + faculty.course_faculty
																}
															}).then(function(instructionalDetails){
																console.log("----11----");
																// console.log("instructionalDetails == " + JSON.stringify(instructionalDetails))
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
																console.log("----12----");
																console.log("instructional_Details == " + JSON.stringify(instructional_Details))
																console.log("current_year == " + appliedDetails.current_year);
																if(appliedDetails.current_year == true){
																	console.log("----13 test ----");
																	instruction_letter_length = instruction_letter_length  + 1;
																	// if(faculty.colleges.length == 1){
																		models.College.find ({
																			where :{
																				id : faculty.colleges[0].collegeId
																			}
																		}).then(function(college){
																			var studentName =  instructional_Details[0].studentName;
																			var collegeName ;
																			if(college.type == 'college'){
																				collegeName = instructional_Details[0].collegeName ;
																			}else if(college.type == 'department'){
																				collegeName = instructional_Details[0].collegeName + ", ";
																			}
																			var courseName = instructional_Details[0].courseName;
																			var specialization = instructional_Details[0].specialization;
																			var passingMonthYear = instructional_Details[0].yearofpassing;
																			var yearofenrollment = instructional_Details[0].yearofenrollment;
																			var duration = converter.toWords(instructional_Details[0].duration);
																			var passingClass = instructional_Details[0].division;
																			var instruction_medium;
																			var duration1 = instructional_Details[0].patteren;
																			var new_course_faculty =  instructional_Details[0].new_course_faculty;
							
																			if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																				instruction_medium = instructionalDetails[0].instruction_medium;
																			}else{
																				instruction_medium = instructional_Details[0].instruction_medium;
																			}
																			var education = instructional_Details[0].education;
																			setTimeout(()=>{
																				if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																					console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
																					models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																						if(MaxReferenceNo[0].maxNumber == null){
																							reference_no = 1001;
																						}else{
																							reference_no=100000 + parseInt(app_id)
																							// reference_no = MaxReferenceNo[0].maxNumber + 1;
																						}
																						models.InstructionalDetails.update(
																							{
																								reference_no : reference_no
																							},{
																							where :{
																								id : instructional_Details[0].id
																							}
																						}).then(function(updatedDetails){
																							//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																							var ref_no = reference_no;
																							self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																								if(err) {
																									res.json({ 
																										status: 400
																									})
																								}else{
																									self_pdf.currently_studying_instructionalLetter_notforprint(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																											if(err) {
																												res.json({ 
																													status: 400
																												})
																											}else{
																												models.Emailed_Docs.find({
																													where :{
																														app_id:app_id,
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													}
																												}).then(function(emailDoc){
																													if(!emailDoc){
																														models.Emailed_Docs.create({
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														doc_type : "InstructionalLetter",
																														category : "InstructionalLetter",
																														user_id: user_id,
																														transcript_id: null,
																														marklist_id : null,
																														app_id:app_id,
																														curriculum_id : null
																														}).then((result)=>{
																														// logger.debug(" result : "+JSON.stringify(result))
																														})
																													}
																												})
																											}
																										})
																							
																								}
																							})
																						})
																					})
																				}else{
																					var ref_no = instructionalDetails[0].reference_no;
																					self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																						if(err) {
																							res.json({ 
																								status: 400
																							})
																						}else{
																							self_pdf.currently_studying_instructionalLetter_notforprint(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																						if(err) {
																							res.json({ 
																								status: 400
																							})
																						}else{
																							models.Emailed_Docs.find({
																								where :{
																									app_id:app_id,
																									filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																								}
																							}).then(function(emailDoc){
																								if(!emailDoc){
																									models.Emailed_Docs.create({
																									filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																									doc_type : "InstructionalLetter",
																									category : "InstructionalLetter",
																									user_id: user_id,
																									transcript_id: null,
																									marklist_id : null,
																									app_id:app_id,
																									curriculum_id : null
																									}).then((result)=>{
																									// logger.debug(" result : "+JSON.stringify(result))
																									})
																								}
																							})
																						}
																					})
																							
																						}
																					})
																				}
																			})
																		})
																	// } 
																	
																}else{
																	if(instructional_Details.length > 1){
																		console.log("----13----");
																		instruction_letter_length = instruction_letter_length  + 1;
																		var studentName =  instructional_Details[0].studentName;
																		var courseName = instructional_Details[0].courseName;
																		var specialization = instructional_Details[0].specialization;
																		var passingMonthYear = instructional_Details[0].yearofpassing;
																		var yearofenrollment = instructional_Details[0].yearofenrollment;
																		var duration = converter.toWords(instructional_Details[0].duration);
																		var duration1 = instructional_Details[0].patteren;
																		var passingClass = instructional_Details[0].division;
																		var instruction_medium;
																		var new_course_faculty =  instructional_Details[0].new_course_faculty;
																		if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																			instruction_medium = instructionalDetails[0].instruction_medium;
																		}else{
																			instruction_medium = instructionalDetails[0].instruction_medium;
																		}
																		var education = instructional_Details[0].education;
																		
																		var instructionId = '';
																		
																			
																		instructional_Details.forEach(instruction =>{
																			console.log(instruction.academicYear);
																			faculty.colleges.forEach(singleDetail=>{
																				console.log(singleDetail.name);
																				models.College.find({
																					where : {
																						id : singleDetail.collegeId
																					}
																				}).then(function(college){
																					if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
																						console.log("same");
																						if(college.type == 'college'){
																							console.log("college");
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Gujarat University.")
																						}else if(college.type == 'department'){
																							console.log("department");
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Gujarat University.")
																						}
																					}
																					console.log("collegeData inside college == " + JSON.stringify(collegeData))
																				})
																			})
																			instructionId += instruction.id +','
																			console.log("collegeData inside == " + JSON.stringify(collegeData))
																		})
							
																		setTimeout(()=>{
																			console.log("collegeData == " + JSON.stringify(collegeData))
																			console.log("----13----");
																			var instructionIds = instructionId.split(',');
																			console.log("instructionIds == " ,instructionIds)
																			instructionIds.pop();
																			console.log("instructionIds == " ,instructionIds)
																			instructionId = instructionIds.join(',');
																			console.log("instructionId == " + instructionId);
																			setTimeout(function(){
																				console.log("----14----");
																				if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																					console.log("----15----");
																					models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																						if(MaxReferenceNo[0].maxNumber == null){
																							reference_no = 1001;
																						}else{
																							reference_no=100000 + parseInt(app_id)
																							// reference_no = MaxReferenceNo[0].maxNumber + 1;
																						}
							
																						models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
																							console.log("----16----");
																							var ref_no = reference_no;
																							self_pdf.instrucationalLetterForDiffClg_two(application.user_id,faculty.patteren,faculty.type,duration1,application_id,studentName,collegeData,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																								if(err) {
																									console.log("----17----");
																									res.json({ 
																										status: 400
																									})
																								}else{
																									self_pdf.instrucationalLetterForDiffClg_two_notforprint(application.user_id,faculty.patteren,faculty.type,duration1,application_id,studentName,collegeData,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,function(err){
																											if(err) {
																												console.log("----17----");
																												res.json({ 
																													status: 400
																												})
																											}else{
																												console.log("----18----");
																												models.Emailed_Docs.find({
																													where :{
																														app_id:app_id,
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													}
																												}).then(function(emailDoc){
																													if(!emailDoc){
																														models.Emailed_Docs.create({
																														filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														doc_type : "InstructionalLetter",
																														category : "InstructionalLetter",
																														user_id: user_id,
																														transcript_id: null,
																														marklist_id : null,
																														app_id:app_id,
																														curriculum_id : null
																														}).then((result)=>{
																														// logger.debug(" result : "+JSON.stringify(result))
																														})
																													}
																												})
																											}
																										})
																							
																								}
																							})
																						})
																					});
																				}else{
																					console.log("----19----");
																					var ref_no = instructionalDetails[0].reference_no;
																					self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																						if(err) {
																							console.log("----20----");
																							res.json({ 
																								status: 400
																							})
																						}else{
																							self_pdf.instrucationalLetterForDiffClg_two_notforprint(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
																									if(err) {
																										console.log("----20----");
																										res.json({ 
																											status: 400
																										})
																									}else{
																										console.log("----21----");
																										models.Emailed_Docs.find({
																											where :{
																												app_id:app_id,
																												filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																											}
																										}).then(function(emailDoc){
																											if(!emailDoc){
																												models.Emailed_Docs.create({
																												filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																												doc_type : "InstructionalLetter",
																												category : "InstructionalLetter",
																												user_id: user_id,
																												transcript_id: null,
																												marklist_id : null,
																												app_id:app_id,
																												curriculum_id : null
																												}).then((result)=>{
																												// logger.debug(" result : "+JSON.stringify(result))
																												})
																											}
																										})
																									}
																								})
							
																						
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
																				var studentName = instructional_Details[0].studentName;
																				var collegeName ;
																				if(college.type == 'college'){
																					collegeName = instructional_Details[0].collegeName ;
																				}else if(college.type == 'department'){
																					collegeName = instructional_Details[0].collegeName + ", ";
																				}
																				var courseName = instructional_Details[0].courseName;
																				var specialization = instructional_Details[0].specialization;
																				var passingMonthYear = instructional_Details[0].yearofpassing;
																				var yearofenrollment = instructional_Details[0].yearofenrollment;
																				var duration = converter.toWords(instructional_Details[0].duration);
																				var duration1 =instructional_Details[0].duration;
																				var passingClass = instructional_Details[0].division;
																				var instruction_medium;
																				var clg =instructional_Details[0].clg;
																				var new_course_faculty =  instructional_Details[0].new_course_faculty;
																				var courseshort =instructional_Details[0].courseshort;
																				if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
																					instruction_medium = instructionalDetails[0].instruction_medium;
																				}else{
																					instruction_medium = instructional_Details[0].instruction_medium;
																				}
																				var education = instructional_Details[0].education;
																				setTimeout(()=>{
																					if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
																						console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
																						models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																							if(MaxReferenceNo[0].maxNumber == null){
																								reference_no = 1001;
																							}else{
																								reference_no=100000 + parseInt(app_id)
																								// reference_no = MaxReferenceNo[0].maxNumber + 1;
																							}
																							models.InstructionalDetails.update(
																								{
																									reference_no : reference_no
																								},{
																								where :{
																									id : instructional_Details[0].id
																								}
																							}).then(function(updatedDetails){
																								//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																								var ref_no = reference_no;
																								self_pdf.instrucationalLetter_one(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																									if(err) {
																										res.json({ 
																											status: 400
																										})
																									}else{
																										self_pdf.instrucationalLetter_one_notforprint(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																											passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																												if(err) {
																													res.json({ 
																														status: 400
																													})
																												}else{
																													models.Emailed_Docs.find({
																														where :{
																															app_id:app_id,
																															filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																														}
																													}).then(function(emailDoc){
																														if(!emailDoc){
																															models.Emailed_Docs.create({
																															filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																															doc_type : "InstructionalLetter",
																															category : "InstructionalLetter",
																															user_id: user_id,
																															transcript_id: null,
																															marklist_id : null,
																															app_id:app_id,
																															curriculum_id : null
																															}).then((result)=>{
																															// logger.debug(" result : "+JSON.stringify(result))
																															})
																														}
																													})
																												}
																											})
																									
																									}
																								})
																							})
																						})
																					}else{
																						var ref_no = instructionalDetails[0].reference_no;
																						self_pdf.instrucationalLetter_one(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,function(err){
																										if(err) {
																								res.json({ 
																									status: 400
																								})
																							}else{
																								self_pdf.instrucationalLetter_one_notforprint(application.user_id,faculty.patteren,faculty.type,faculty.course_faculty,duration1,application_id,studentName,collegeName,courseName,specialization,
																									passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',yearofenrollment,courseshort,clg,new_course_faculty,
																									function(err){
																										if(err) {
																											res.json({ 
																												status: 400
																											})
																										}else{
																											models.Emailed_Docs.find({
																												where :{
																													app_id:app_id,
																													filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																												}
																											}).then(function(emailDoc){
																												if(!emailDoc){
																													models.Emailed_Docs.create({
																													filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
																													doc_type : "InstructionalLetter",
																													category : "InstructionalLetter",
																													user_id: user_id,
																													transcript_id: null,
																													marklist_id : null,
																													app_id:app_id,
																													curriculum_id : null
																													}).then((result)=>{
																													// logger.debug(" result : "+JSON.stringify(result))
																													})
																												}
																											})
																										}
																									})
																								
																							}
																						})
																					}
																				})
																			})
																		}
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
							}
							const tasksRemaining = queue.length();
							executed(null, {task, tasksRemaining});
					
				   }, 1); // concurrency value = 1
				   tasks.forEach((task)=>{
					queue.push(task, (error, {task, tasksRemaining})=>{
						setTimeout(()=>{
							var total = 0;
							var message = '';
							if(siginingType == 'single'){
								message = "update application status to signed and please check merged file generated after 15 min";
							}else{
								message = "update application status to signed";
							}
							
							if(institution_data[0].type == 'Educational credential evaluators WES'){
								if(user[0].educationalDetails == true){
									console.log('provisional_length' +  provisional_length);
									console.log('degree_length' +  degree_length);
									total += marksheet_length + transcript_length + degree_length + thesis_length + provisional_length
								}
								
								if(user[0].instructionalField == true){
									total += instruction_letter_length ;
								}
							}else{
								if(user[0].educationalDetails == true){
									total += marksheet_length + transcript_length + degree_length + thesis_length + provisional_length
								}
								
								if(user[0].instructionalField == true){
									total += instruction_letter_length;
								}
							}
							
							setTimeout(()=>{
								models.Emailed_Docs.findAll({
									where:{
										app_id : app_id 
									}
								}).then(function(emailDoc){
									console.log("signed doc length == >>" + emailDoc.length);
									console.log("total == " + total);
									if(emailDoc.length == total){
										console.log("Same Docs length");
										var instCount = 0
										var emailFlag = false;
										models.Institution_details.findAll({
											where:{
												user_id : user_id,
												app_id : app_id,source : 'guattestation'
											}
										}).then(function(institutes){
										
											institutes.forEach(institute=>{
												statusTracker  = statusTracker +  institute.deliveryType;
												instCount ++;
											})
												if(instCount == institutes.length ){
													if(statusTracker.includes('digital') && statusTracker.includes('physcial')){
														tracker = 'print_signed'
													}
													else if(application.deliveryType == 'sealed'){
														tracker = 'print'
													}
													else{
														tracker = 'signed'
													}
													setTimeout(function(){
														var mergefilesString = '';
														var setdefaultMergetime = 40000;
														models.Institution_details.findAll({
															where:{
																user_id : user_id,
																app_id : app_id,source : 'guattestation'
															}
														}).then(function(institutes){
															console.log('institutesinstitutesinstitutesinstitutes' + institutes)
															var noofcopies = institutes[0].noofcopies;
															// noofcopies.forEach(function(inst){
																setTimeout(()=>{
																	console.log("Merginggggggggggggggggggggggggggggg");
																	logger.debug("merge fn execution start time at"+moment().format('YYYY-MM-DD HH:mm:ss'));
																	logger.debug("final setdefaultMergetime "+setdefaultMergetime);
																	models.Emailed_Docs.findAll({
																		where:{
																			category : 'Transcript',
																			app_id : app_id
																		}
																	}).then((result)=>{
																		result.forEach((docs)=>{
																			var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
																			mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
																		})
																		models.Emailed_Docs.findAll({
																			where:{
																				category :  'Marklist',
																				app_id : app_id
																			}
																		}).then((result)=>{
																			result.forEach((docs)=>{
																				var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
																				mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
																			})
																			models.Emailed_Docs.findAll({
																				where:{
																					category : 'Degree',
																					app_id : app_id
																				}
																			}).then((result)=>{
																				result.forEach((docs)=>{
																					var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
																					mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
																				})
																				models.Emailed_Docs.findAll({
																					where:{
																						category : 'InstructionalLetter',
																						app_id : app_id
																					}
																				}).then((result)=>{
																					result.forEach((docs)=>{
																						var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
																						mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
																					})
																					models.Emailed_Docs.findAll({
																						where:{
																							category : 'Thesis',
																							app_id : app_id
																						}
																					}).then((result)=>{
																						result.forEach((docs)=>{
																							var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
																							mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
																						})
																				
																						models.Emailed_Docs.findAll({
																							where:{
																								category : 'GradeToPerLetter',
																								app_id : app_id
																							}
																						}).then((result)=>{
																							result.forEach((docs)=>{
																								var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
																								mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
																							})
																							models.Emailed_Docs.findAll({
																								where:{
																									category : 'CompetencyLetter',
																									app_id : app_id
																								}
																							}).then((result)=>{
																								result.forEach((docs)=>{
																									var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
																									mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
																								})
																								setTimeout(() => {
																									fn.merge(app_id,user_id,mergefilesString);
																								}, 1000);
																							})
																						})
																					})
																				})
																			})
																		})
																	})
																},setdefaultMergetime);
															// })
														})
																	},10000)
													application.update({
														tracker : tracker,
														verified_by : email_Admin,
														print_date :  moment(new Date()).format('YYYY-MM-DD'),
														print_signedstatus : 'print_signed'
													}).then(function(updatedApplication){
														if(updatedApplication){
														// if(institution_data[0].type == 'Educational credential evaluators WES'){
														// 		console.log("response sendddd");
														// 		res.json({
														// 			status : 200,
														// 			message : message
														// 		})
														// }else{
															request.post(constant.BASE_URL_SENDGRID + 'applicationStatus', {
																json: {
																	email : user[0].email,
																	name : user[0].name + ' ' + user[0].surname,
																	app_id : app_id,
																	statusType : tracker,
																	mobile : user[0].mobile,
																	mobile_country_code : user[0].mobile_country_code,
																	source : 'gu'
																}
															}, function (error, response, body) {
															console.log("After response" + emailFlag);
																// if(emailFlag == true){
																	// console.log("studentData == " + JSON.stringify(studentData));
																	// request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent', {
																	//     json: {
																	//         studentData : studentData,
																	//         source : 'gu'
																	//     }
																	// });
																// }
																var userName = user[0].name + ' ' + user[0].surname;
																var desc = userName+"'s ( "+user[0].email+" ) application verified by "+ email_Admin +".";
																var activity = "Application Verified";
																functions.activitylog(user_id, activity, desc, app_id);
																console.log("response sendddd");
																res.json({
																	status : 200,
																	message : message
																})
															})
															// res.json({
															// 			status : 200,
															// 			message : message
															// 		})
														// }
	
														
														}else{
															res.json({
																status : 400,
																message : 'Application not update'
															})
														}
													})
												}
											// },18000);
										})
									}else{
										res.json({
										status : 400,
										message : 'Some documents not signed so can not proceed the application'
										})
									}
								},20000)
								})
						},20000);
	
						
						console.log("mergeeeeeeeeeeee");
						
					
						// if(siginingType == 'single'){
							
							
							
						// }
					})
				})
				queue.drain(() => {
					console.log('All Applications are succesfully processed !');
				 })
					}
				})
			}else{
				res.json({
					status : 400,
					message : 'Puporse Details Incomplete, Kindly Contact Student'
					})
			}
		}else{
			res.json({
				status : 400,
				message : "Application not found"
			})
		}
	})
	})
	
})
// router.post('/documentSigning_merge',function(req,res){
// 	console.log('/documentSigning_merge@@@@@@@@@' + req.body.appl_id);
// 	var app_id =  req.body.appl_id;
// 	var siginingType = req.body.type;
// 	var signingDegree =  req.body.degree;
// 	var signstatus;
// 	var count = 1;
// 	var wesform_length = 0;
// 	var transcript_length = 0 ;
// 	var marksheet_length = 0;
// 	var curriculum_length = 0;
// 	var gradTOPer_letter_length = 0;
// 	//var competencyLetter_length = 0;
// 	var instruction_letter_length = 0;
// 	var affiliation_letter_length = 0;
// 	var competencyletter_length = 0;
// 	var namechangeletter_length = 0;
// 	var transcripts = [];
// 	var user_marklists = [];
// 	var user_marksheets = [];
// 	var user_curriculums = [];
// 	var gradTOPer_letter = [];
// 	var competencyletter= []
// 	var studentData = {};
// 	var tracker;
// 	models.Application.findOne({
// 		where :{
// 			id : app_id,
// 			source_from  : 'guattestation'
// 		}
// 	}).then(function(application){
// 		models.Institution_details.findAll({
// 			where : {
// 				user_id : application.user_id,
// 				app_id : app_id
// 			}
// 		}).then(function (institution_data){
// 		if(application){
// 			var user_id = application.user_id;
// 			models.User.getApplicationDetailsForSign(app_id).then(function(user){
// 			  	if(user[0]){
// 				  	if(!fs.existsSync(constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/")){
// 					  	fs.mkdirSync(constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/", { recursive: true });//fs.writeFileSync
// 				  	}
// 					  const tasks =[application.id]
// 					  const queue = async.queue((task, executed) => {
// 						console.log("Currently Busy Processing Task " + task);
// 						if(user[0].educationalDetails == true){
// 							console.log("user_id == " + user_id);
// 							models.User_Transcript.findAll({
// 								where:{
// 									user_id : application.user_id,
// 									type:{
// 										[Op.like] :'%transcripts'
// 									},
// 									app_id :{
// 										[Op.ne] : null
// 									}
// 								}
// 							}).then(function(user_transcripts){
// 								console.log("user_transcripts == " + JSON.stringify(user_transcripts));
// 								user_transcripts.forEach(user_transcript=>{
// 									var app_idArr = user_transcript.app_id.split(',');
// 									app_idArr.forEach(transcript_appId=>{
// 										if(transcript_appId == app_id){
// 											transcripts.push(user_transcript);
// 										}
// 									})
// 								})
			
// 								transcript_length = transcripts.length;
// 								transcripts.forEach(transcript=>{
// 									// console.log("transcript == " + JSON.stringify(transcript));
// 									// var doc_name = transcript.name.split(' ').join('_');
// 									// var fileName = doc_name + "_" + path.parse(transcript.file_name).name + "-.pdf";


// 											var fileName = path.parse(transcript.file_name).name;
// 											var filePath = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name;
// 											var category = "Transcript";
// 											var outputDirectory;
// 											if(fs.existsSync(filePath)){
// 												var extension=transcript.file_name.split('.').pop();
// 												var numOfpages;
// 												console.log("test==")
// 												if (!fs.existsSync(constant.FILE_LOCATION+"upload/documents/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
// 													if(extension == 'pdf'){
// 														var folderName = fileName.split(" ").join("_");
// 														console.log("folderName == " + folderName);
// 														outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+folderName+"/";
// 														fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,outputDirectory);
// 														let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name);
// 															pdf(dataBuffer).then(function(data) {
// 															console.log("no=====>"+data.numpages);  // number of pages
// 															numOfpages = data.numpages;
// 														});
// 														var fileString = "";
// 														outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/signed_"+folderName+"/";
// 														if(!fs.existsSync(outputDirectory)){
// 															fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
// 														}
// 														setTimeout(()=>{
// 														for(var i = 1 ; i <= numOfpages; i++){
// 															var j = "";
// 															if(numOfpages >= 100){
// 																if(parseInt((i/100)) > 0){
// 																	j = i
// 																}else if(parseInt((i/10)) > 0){
// 																	j = "0" + i;
// 																}else{
// 																	j = "00" + i;
// 																}
// 															}else  if(numOfpages >= 10){
// 																if(parseInt((i/10)) > 0){
// 																	j = i;
// 																}else{
// 																	j = "0" + i;
// 																}
// 															}else  if(numOfpages >= 1){
// 																j =  i;
// 															}
															
// 																console.log("fileName 1== " + fileName);
// 																filePath =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
// 																console.log(filePath);
// 																var file_name =  fileName+"-"+j+".jpg";
// 																console.log("file_name ==  111" + file_name);
// 																fn.signingDocuments_merge(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
// 																	if(err){
// 																		return res.json({
// 																		status : 400,
// 																		message : err
// 																		})
// 																	}else{
// 																				fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
// 																				console.log("fileString == " + fileString);
// 																	}
// 																});
// 															}
// 														},4000) 
														
														
// 														setTimeout(()=>{
// 															console.log("fileString 2 == " + fileString);
// 															outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + application.user_id + "/" ;
// 															fn.mergeDocuments_merge(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, fileString, function(err){
// 																if(err){
// 																	return res.json({
// 																		status : 400,
// 																		message : "Files cannot merge"
// 																	})
// 																}else{
																	
// 																}
// 															});
// 														}, 6000);
// 													}else{
// 														outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + application.user_id + "/" ;
// 														console.log("22222222");
// 														fn.signingDocuments_merge(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
// 															if(err){
// 																return res.json({
// 																	status : 400,
// 																	message : err
// 																})
// 															}else{
																
															
																
// 															}
// 														});
// 													}
// 												}else{
													
// 												}
// 											}else{
// 												return res.json({
// 													status : 400,
// 													message : transcript.name + 'not found'
// 												})
// 											}
										
									
// 								})
// 							})

// 							models.User_Transcript.findAll({
// 								where:{
// 									user_id : application.user_id,
// 									type:{
// 										[Op.like] :'%degree'
// 									},
// 									app_id :{
// 										[Op.ne] : null
// 									}
// 								}
// 							}).then(function(user_transcripts){
// 								console.log("user_transcripts == " + JSON.stringify(user_transcripts));
// 								user_transcripts.forEach(user_transcript=>{
// 									var app_idArr = user_transcript.app_id.split(',');
// 									app_idArr.forEach(transcript_appId=>{
// 										if(transcript_appId == app_id){
// 											transcripts.push(user_transcript);
// 										}
// 									})
// 								})
			
// 								transcript_length = transcripts.length;
// 								transcripts.forEach(transcript=>{
// 									// console.log("transcript == " + JSON.stringify(transcript));
// 									// var doc_name = transcript.name.split(' ').join('_');
// 									// var fileName = doc_name + "_" + path.parse(transcript.file_name).name + "-.pdf";


// 											var fileName = path.parse(transcript.file_name).name;
// 											var filePath = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name;
// 											var category = "Degree";
// 											var outputDirectory;
// 											if(fs.existsSync(filePath)){
// 												var extension=transcript.file_name.split('.').pop();
// 												var numOfpages;
// 												console.log("test==")
// 												if (!fs.existsSync(constant.FILE_LOCATION+"upload/documents/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
// 													if(extension == 'pdf'){
// 														var folderName = fileName.split(" ").join("_");
// 														console.log("folderName == " + folderName);
// 														outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+folderName+"/";
// 														fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,outputDirectory);
// 														let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name);
// 															pdf(dataBuffer).then(function(data) {
// 															console.log("no=====>"+data.numpages);  // number of pages
// 															numOfpages = data.numpages;
// 														});
// 														var fileString = "";
// 														outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/signed_"+folderName+"/";
// 														if(!fs.existsSync(outputDirectory)){
// 															fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
// 														}
// 														setTimeout(()=>{
// 														for(var i = 1 ; i <= numOfpages; i++){
// 															var j = "";
// 															if(numOfpages >= 100){
// 																if(parseInt((i/100)) > 0){
// 																	j = i
// 																}else if(parseInt((i/10)) > 0){
// 																	j = "0" + i;
// 																}else{
// 																	j = "00" + i;
// 																}
// 															}else  if(numOfpages >= 10){
// 																if(parseInt((i/10)) > 0){
// 																	j = i;
// 																}else{
// 																	j = "0" + i;
// 																}
// 															}else  if(numOfpages >= 1){
// 																j =  i;
// 															}
															
// 																console.log("fileName 1== " + fileName);
// 																filePath =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
// 																console.log(filePath);
// 																var file_name =  fileName+"-"+j+".jpg";
// 																console.log("file_name ==  111" + file_name);
// 																fn.signingDocuments_merge(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
// 																	if(err){
// 																		return res.json({
// 																		status : 400,
// 																		message : err
// 																		})
// 																	}else{
// 																				fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
// 																				console.log("fileString == " + fileString);
// 																	}
// 																});
// 															}
// 														},4000) 
														
														
// 														setTimeout(()=>{
// 															console.log("fileString 2 == " + fileString);
// 															outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + application.user_id + "/" ;
// 															fn.mergeDocuments_merge(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, fileString, function(err){
																
// 															});
// 														}, 6000);
// 													}else{
// 														outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + application.user_id + "/" ;
// 														console.log("22222222");
// 														fn.signingDocuments_merge(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
															
// 														});
// 													}
// 												}else{
													
// 												}
// 											}else{
// 												return res.json({
// 													status : 400,
// 													message : transcript.name + 'not found'
// 												})
// 											}
										
									
// 								})
// 							})

// 							models.Applicant_Marksheet.findAll({
// 								where:{
// 									user_id : application.user_id,
// 									type:{
// 										[Op.like] :'%Bonafied'
// 									},
// 									app_id :{
// 										[Op.ne] : null
// 									}
// 								}
// 							}).then(function(user_transcripts){
// 								console.log("user_transcripts == " + JSON.stringify(user_transcripts));
// 								user_transcripts.forEach(user_transcript=>{
// 									var app_idArr = user_transcript.app_id.split(',');
// 									app_idArr.forEach(transcript_appId=>{
// 										if(transcript_appId == app_id){
// 											transcripts.push(user_transcript);
// 										}
// 									})
// 								})
			
// 								transcript_length = transcripts.length;
// 								transcripts.forEach(transcript=>{
// 									// console.log("transcript == " + JSON.stringify(transcript));
// 									// var doc_name = transcript.name.split(' ').join('_');
// 									// var fileName = doc_name + "_" + path.parse(transcript.file_name).name + "-.pdf";


// 											var fileName = path.parse(transcript.file_name).name;
// 											var filePath = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name;
// 											var category = "Bonafied";
// 											var outputDirectory;
// 											if(fs.existsSync(filePath)){
// 												var extension=transcript.file_name.split('.').pop();
// 												var numOfpages;
// 												console.log("test==")
// 												if (!fs.existsSync(constant.FILE_LOCATION+"upload/documents/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
// 													if(extension == 'pdf'){
// 														var folderName = fileName.split(" ").join("_");
// 														console.log("folderName == " + folderName);
// 														outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+folderName+"/";
// 														fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,outputDirectory);
// 														let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name);
// 															pdf(dataBuffer).then(function(data) {
// 															console.log("no=====>"+data.numpages);  // number of pages
// 															numOfpages = data.numpages;
// 														});
// 														var fileString = "";
// 														outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/signed_"+folderName+"/";
// 														if(!fs.existsSync(outputDirectory)){
// 															fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
// 														}
// 														setTimeout(()=>{
// 														for(var i = 1 ; i <= numOfpages; i++){
// 															var j = "";
// 															if(numOfpages >= 100){
// 																if(parseInt((i/100)) > 0){
// 																	j = i
// 																}else if(parseInt((i/10)) > 0){
// 																	j = "0" + i;
// 																}else{
// 																	j = "00" + i;
// 																}
// 															}else  if(numOfpages >= 10){
// 																if(parseInt((i/10)) > 0){
// 																	j = i;
// 																}else{
// 																	j = "0" + i;
// 																}
// 															}else  if(numOfpages >= 1){
// 																j =  i;
// 															}
															
// 																console.log("fileName 1== " + fileName);
// 																filePath =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
// 																console.log(filePath);
// 																var file_name =  fileName+"-"+j+".jpg";
// 																console.log("file_name ==  111" + file_name);
// 																fn.signingDocuments_merge(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
// 																	if(err){
// 																		return res.json({
// 																		status : 400,
// 																		message : err
// 																		})
// 																	}else{
// 																				fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
// 																				console.log("fileString == " + fileString);
// 																	}
// 																});
// 															}
// 														},4000) 
														
														
// 														setTimeout(()=>{
// 															console.log("fileString 2 == " + fileString);
// 															outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + application.user_id + "/" ;
// 															fn.mergeDocuments_merge(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, fileString, function(err){
																
// 															});
// 														}, 6000);
// 													}else{
// 														outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + application.user_id + "/" ;
// 														console.log("22222222");
// 														fn.signingDocuments_merge(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
															
// 														});
// 													}
// 												}else{
													
// 												}
// 											}else{
// 												return res.json({
// 													status : 400,
// 													message : transcript.name + 'not found'
// 												})
// 											}
										
									
// 								})
// 							})	

// 							models.Applicant_Marksheet.findAll({
// 								where:{
// 									user_id : application.user_id,
// 									type:{
// 										[Op.like] :'%Aadhar Card'
// 									},
// 									app_id :{
// 										[Op.ne] : null
// 									}
// 								}
// 							}).then(function(user_transcripts){
// 								console.log("user_transcripts == " + JSON.stringify(user_transcripts));
// 								user_transcripts.forEach(user_transcript=>{
// 									var app_idArr = user_transcript.app_id.split(',');
// 									app_idArr.forEach(transcript_appId=>{
// 										if(transcript_appId == app_id){
// 											transcripts.push(user_transcript);
// 										}
// 									})
// 								})
			
// 								transcript_length = transcripts.length;
// 								transcripts.forEach(transcript=>{
// 									// console.log("transcript == " + JSON.stringify(transcript));
// 									// var doc_name = transcript.name.split(' ').join('_');
// 									// var fileName = doc_name + "_" + path.parse(transcript.file_name).name + "-.pdf";


// 											var fileName = path.parse(transcript.file_name).name;
// 											var filePath = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name;
// 											var category = "Aadhar";
// 											var outputDirectory;
// 											if(fs.existsSync(filePath)){
// 												var extension=transcript.file_name.split('.').pop();
// 												var numOfpages;
// 												console.log("test==")
// 												if (!fs.existsSync(constant.FILE_LOCATION+"upload/documents/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
// 													if(extension == 'pdf'){
// 														var folderName = fileName.split(" ").join("_");
// 														console.log("folderName == " + folderName);
// 														outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+folderName+"/";
// 														fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,outputDirectory);
// 														let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+transcript.file_name);
// 															pdf(dataBuffer).then(function(data) {
// 															console.log("no=====>"+data.numpages);  // number of pages
// 															numOfpages = data.numpages;
// 														});
// 														var fileString = "";
// 														outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/signed_"+folderName+"/";
// 														if(!fs.existsSync(outputDirectory)){
// 															fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
// 														}
// 														setTimeout(()=>{
// 														for(var i = 1 ; i <= numOfpages; i++){
// 															var j = "";
// 															if(numOfpages >= 100){
// 																if(parseInt((i/100)) > 0){
// 																	j = i
// 																}else if(parseInt((i/10)) > 0){
// 																	j = "0" + i;
// 																}else{
// 																	j = "00" + i;
// 																}
// 															}else  if(numOfpages >= 10){
// 																if(parseInt((i/10)) > 0){
// 																	j = i;
// 																}else{
// 																	j = "0" + i;
// 																}
// 															}else  if(numOfpages >= 1){
// 																j =  i;
// 															}
															
// 																console.log("fileName 1== " + fileName);
// 																filePath =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
// 																console.log(filePath);
// 																var file_name =  fileName+"-"+j+".jpg";
// 																console.log("file_name ==  111" + file_name);
// 																fn.signingDocuments_merge(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
// 																	if(err){
// 																		return res.json({
// 																		status : 400,
// 																		message : err
// 																		})
// 																	}else{
// 																				fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
// 																				console.log("fileString == " + fileString);
// 																	}
// 																});
// 															}
// 														},4000) 
														
														
// 														setTimeout(()=>{
// 															console.log("fileString 2 == " + fileString);
// 															outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + application.user_id + "/" ;
// 															fn.mergeDocuments_merge(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, fileString, function(err){
																
// 															});
// 														}, 6000);
// 													}else{
// 														outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + application.user_id + "/" ;
// 														console.log("22222222");
// 														fn.signingDocuments_merge(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
															
// 														});
// 													}
// 												}else{
													
// 												}
// 											}else{
// 												return res.json({
// 													status : 400,
// 													message : transcript.name + 'not found'
// 												})
// 											}
										
									
// 								})
// 							})	

// 							models.UserMarklist_Upload.findAll({
// 								where:{
// 									user_id : application.user_id,
// 									app_id :{
// 										[Op.ne] : null
// 									}
// 								}
// 							}).then(function(userMarklists){
// 								console.log("userMarklists == " + JSON.stringify(userMarklists));
// 								userMarklists.forEach(userMarklist=>{
// 									var app_idArr = userMarklist.app_id.split(',');
// 									app_idArr.forEach(marklist_appId=>{
// 										if(marklist_appId == app_id){
// 											user_marklists.push(userMarklist);
// 										}
// 									})
// 								})
// 								if(user_marklists.length > 0){
// 									marksheet_length = user_marklists.length;
// 									user_marklists.forEach(marklist=>{
// 										console.log("marklist == " + JSON.stringify(marklist));
// 										var doc_name = marklist.name.split(' ').join('_');
// 										var fileName = doc_name + "_" + path.parse(marklist.file_name).name + "-.pdf";
// 										models.Emailed_Docs.find({
// 											where :{
// 												transcript_id : marklist.id,
// 												fileName : fileName,
// 												app_id :{
// 													[Op.ne] : app_id
// 												}
// 											}
// 										}).then(function(emailedDocs){
// 											if(emailedDocs){
// 												models.Emailed_Docs.create({
// 													filename : emaildDocs.file_name,
// 													doc_type : emaildDocs.doc_type,
// 													category : emaildDocs.category,
// 													marklist_id: marklist.id,
// 													app_id:app_id
// 												});
// 											}else{
// 												var fileName = path.parse(marklist.file_name).name;
// 												var filePath = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+marklist.file_name;
// 												var category = "Marklist";
// 												var outputDirectory;
// 												if(fs.existsSync(filePath)){
// 													var extension=marklist.file_name.split('.').pop();
// 													var numOfpages;
// 													console.log("test==")
// 													if (!fs.existsSync(constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+doc_name+"_"+path.parse(marklist.file_name).name+".pdf")){
// 														if(extension == 'pdf'){
// 															var folderName = fileName.split(" ").join("_");
// 															console.log("folderName == " + folderName);
// 															outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+folderName+"/";
// 															fn.pdfToImageConversion(marklist.file_name,application.user_id,filePath,outputDirectory);
// 															let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+marklist.file_name);
// 																pdf(dataBuffer).then(function(data) {
// 																console.log("no=====>"+data.numpages);  // number of pages
// 																numOfpages = data.numpages;
// 															});
// 															var fileString = "";
// 															outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/signed_"+folderName+"/";
// 															if(!fs.existsSync(outputDirectory)){
// 																fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
// 															}
// 															setTimeout(()=>{
// 															for(var i = 1 ; i <= numOfpages; i++){
// 																var j = "";
// 																if(numOfpages >= 100){
// 																	if(parseInt((i/100)) > 0){
// 																		j = i
// 																	}else if(parseInt((i/10)) > 0){
// 																		j = "0" + i;
// 																	}else{
// 																		j = "00" + i;
// 																	}
// 																}else  if(numOfpages >= 10){
// 																	if(parseInt((i/10)) > 0){
// 																		j = i;
// 																	}else{
// 																		j = "0" + i;
// 																	}
// 																}else  if(numOfpages >= 1){
// 																	j =  i;
// 																}
																
// 																	console.log("fileName ==ssss " + fileName);
// 																	filePath =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+ folderName +"/"+path.parse(marklist.file_name).name+"-"+j+".jpg"; 
// 																	console.log(filePath);
// 																	var file_name =  fileName+"-"+j+".jpg"
// 																	console.log("file_name == 4444" + file_name);
// 																	fn.signingDocuments_merge(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
// 																		if(err){
// 																			console.log("errrrrrrrrrrrrrrrrrrrrrr");
// 																			return res.json({
// 																			status : 400,
// 																			message : err
// 																			})
// 																		}else{
// 																			console.log("noooooooooooooooo erorrrrrrrrrrrrrrrrrrrrrrrrrr");
																		
// 																					fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
// 																					console.log("fileString == " + fileString);
																				
																		
																			
// 																		}
// 																	});
// 																}
// 															},4000) 
															
															
// 															setTimeout(()=>{
// 																console.log("fileString 2 == " + fileString);
// 																outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + application.user_id + "/" ;
// 																fn.mergeDocuments_merge(app_id, application.user_id,doc_name, path.parse(marklist.file_name).name, outputDirectory, fileString, function(err){
// 																	if(err){
// 																		return res.json({
// 																			status : 400,
// 																			message : "Files cannot merge"
// 																		})
// 																	}else{
// 																		var file_name = doc_name + "_" + path.parse(marklist.file_name).name + ".pdf"
// 																		models.Emailed_Docs.find({
// 																			where : {
// 																				filename : file_name,
// 																				marklist_id: marklist.id,
// 																				app_id:app_id,
// 																			}
// 																		}).then(function(emailedDoc){
// 																			if(emailedDoc){
				
// 																			}else{
// 																				models.Emailed_Docs.create({
// 																					filename : file_name,
// 																					doc_type : doc_name,
// 																					category : category,
// 																					marklist_id: marklist.id,
// 																					app_id:app_id,
// 																				}).then((result)=>{
// 																				// logger.debug(" result : "+JSON.stringify(result))
// 																			})
// 																			}
// 																		})
// 																	}
// 																});
// 															}, 6000);
// 														}else{
// 															console.log("cxhvbhjcxbvxcnv");
// 															outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + application.user_id + "/" ;
// 															fn.signingDocuments_merge(path.parse(marklist.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
// 																if(err){
// 																	return res.json({
// 																		status : 400,
// 																		message : err
// 																	})
// 																}else{
																	
																				
// 																					models.Emailed_Docs.create({
// 																						filename : file_name,
// 																						doc_type : doc_name,
// 																						category : category,
// 																						marklist_id: marklist.id,
// 																						app_id:app_id
// 																					}).then((result)=>{
// 																					// logger.debug(" result : "+JSON.stringify(result))
// 																				})
																		
																		
																
																	
// 																}
// 															});
// 														}
// 													}else{
// 														var file_name = doc_name + "_" + path.parse(marklist.file_name).name + ".pdf"
// 														models.Emailed_Docs.find({
// 															where : {
// 																filename : file_name,
// 																marklist_id: marklist.id,
// 																app_id:app_id,
// 															}
// 														}).then(function(emailedDoc){
// 															if(emailedDoc){
				
// 															}else{
// 																models.Emailed_Docs.create({
// 																	filename : file_name,
// 																	doc_type : doc_name,
// 																	category : category,
// 																	marklist_id: marklist.id,
// 																	app_id:app_id
// 																}).then((result)=>{
// 																// logger.debug(" result : "+JSON.stringify(result))
// 															})
// 															}
// 														})
// 													}
// 												}else{
// 													return res.json({
// 														status : 400,
// 														message : marklist.name + 'not found'
// 													})
// 												}
// 											}
// 										})
// 									})
// 								}
// 							})
// 						}
// 						const tasksRemaining = queue.length();
// 						executed(null, {task, tasksRemaining});
				
// 			   }, 1); // concurrency value = 1
// 			   tasks.forEach((task)=>{
// 				queue.push(task, (error, {task, tasksRemaining})=>{
// 					// if(siginingType == 'single'){
// 						var mergefilesString = '';
// 						var setdefaultMergetime = 30000;
// 						models.Institution_details.findAll({
// 							where:{
// 								user_id : user_id,
// 								app_id : app_id
// 							}
// 						}).then(function(institutes){
// 							console.log('mergeeeeeeeeeeeemergeeeeeeeeeeee' + institutes[0].noofcopies);
// 							var noofcopies = institutes[0].noofcopies;
// 							// noofcopies.forEach(function(inst){
// 								setTimeout(()=>{
						
// 									logger.debug("merge fn execution start time at"+moment().format('YYYY-MM-DD HH:mm:ss'));
// 									logger.debug("final setdefaultMergetime "+setdefaultMergetime);
// 									models.Emailed_Docs.findAll({
// 										where:{
// 											category : 'Transcript',
// 											app_id : app_id
// 										}
// 									}).then((result)=>{
// 										result.forEach((docs)=>{
// 											var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
// 											mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
// 										})
// 										models.Emailed_Docs.findAll({
// 											where:{
// 												category :  'Marklist',
// 												app_id : app_id
// 											}
// 										}).then((result)=>{
// 											result.forEach((docs)=>{
// 												var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
// 												mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
// 											})
// 											models.Emailed_Docs.findAll({
// 												where:{
// 													category : 'Degree',
// 													app_id : app_id
// 												}
// 											}).then((result)=>{
// 												result.forEach((docs)=>{
// 													var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
// 													mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
// 												})
// 												models.Emailed_Docs.findAll({
// 													where:{
// 														category : 'InstructionalLetter',
// 														app_id : app_id
// 													}
// 												}).then((result)=>{
// 													result.forEach((docs)=>{
// 														var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
// 														mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
// 													})
// 													models.Emailed_Docs.findAll({
// 														where:{
// 															category : 'Aadhar',
// 															app_id : app_id
// 														}
// 													}).then((result)=>{
// 														result.forEach((docs)=>{
// 															var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
// 															mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
// 														})
												
// 														models.Emailed_Docs.findAll({
// 															where:{
// 																category : 'Bonafied',
// 																app_id : app_id
// 															}
// 														}).then((result)=>{
// 															result.forEach((docs)=>{
// 																var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
// 																mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
// 															})
// 															models.Emailed_Docs.findAll({
// 																where:{
// 																	category : 'CompetencyLetter',
// 																	app_id : app_id
// 																}
// 															}).then((result)=>{
// 																result.forEach((docs)=>{
// 																	var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
// 																	mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
// 																})
// 																setTimeout(() => {
// 																	fn.merge(app_id,user_id,mergefilesString);
// 																}, 1000);
// 															})
// 														})
// 													})
// 												})
// 											})
// 										})
// 									})
// 								},setdefaultMergetime);
// 							// })
// 						})
						
						
// 					// }
// 				})
// 			})
// 			queue.drain(() => {
// 				console.log('All Applications are succesfully processed !');
// 			 })
// 				}
// 			})
// 		}else{
// 			res.json({
// 				status : 400,
// 				message : "Application not found"
// 			})
// 		}
// 	})
// 	})
// })
router.get('/merge_documents',(req,res)=>{
    console.log("/mergefile",req.query)
    var app_id = req.query.app_id;
    var user_id = req.query.user_id;
	var mergefilesString = '';
	var setdefaultMergetime = 30000;
	//setTimeout(()=>{
	
		logger.debug("merge fn execution start time at"+moment().format('YYYY-MM-DD HH:mm:ss'));
		logger.debug("final setdefaultMergetime "+setdefaultMergetime);
		models.Emailed_Docs.findAll({
			where:{
				category : 'Transcript',
				app_id : app_id
			}
		}).then((result)=>{
			result.forEach((docs)=>{
				var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
				mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
			})
			models.Emailed_Docs.findAll({
				where:{
					category :  'Marklist',
					app_id : app_id
				}
			}).then((result)=>{
				result.forEach((docs)=>{
					var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
					mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
				})
				models.Emailed_Docs.findAll({
					where:{
						category : 'Curriculum',
						app_id : app_id
					}
				}).then((result)=>{
					result.forEach((docs)=>{
						var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
						mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
					})
					models.Emailed_Docs.findAll({
						where:{
							category : 'InstructionalLetter',
							app_id : app_id
						}
					}).then((result)=>{
						result.forEach((docs)=>{
							var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
							mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
						})
						models.Emailed_Docs.findAll({
							where:{
								category : 'AffiliationLetter',
								app_id : app_id
							}
						}).then((result)=>{
							result.forEach((docs)=>{
								var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
								mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
							})
					
							models.Emailed_Docs.findAll({
								where:{
									category : 'GradeToPerLetter',
									app_id : app_id
								}
							}).then((result)=>{
								result.forEach((docs)=>{
									var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
									mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
								})
								models.Emailed_Docs.findAll({
                                    where:{
                                        category : 'CompetencyLetter',
                                        app_id : app_id
                                    }
                                }).then((result)=>{
                                    result.forEach((docs)=>{
                                        var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
                                        mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
                                    })
								setTimeout(() => {
									fn.merge(app_id,user_id,mergefilesString); 
								}, 1000);
							})
						})
					})
					})
				})
			})
		})
		setTimeout(()=>{
			var path = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_Merge.pdf";
			res.json({
				status : 200,
				data : path
			});
		},2000)
//	},setdefaultMergetime);
})

router.post('/documentSigning_merge',function(req,res){
	console.log('/documentSigning_merge');
	var app_id =  req.body.appl_id;
	var siginingType = req.body.type;
	var signingDegree =  req.body.degree;
	var transcripts = [];
	var user_marklists = [];
	var mergefilesString = ''
	models.Application.findOne({
		where :{
			id : app_id,
			[Op.or]:[{
				source_from:'guattestation',
			 },
			 {
				source_from:'gumoi',
			 }]
		}
	}).then(function(application){
		if(application){
			var user_id = application.user_id;
				// noofcopies.forEach(function(inst){
					setTimeout(()=>{
			
						// logger.debug("merge fn execution start time at"+moment().format('YYYY-MM-DD HH:mm:ss'));
						// logger.debug("final setdefaultMergetime "+setdefaultMergetime);
						models.User_Transcript.findAll({
							where:{
								user_id : application.user_id,
									type:{
										[Op.like] :'%transcripts'
									},
								app_id : app_id,source : 'guattestation' 
							}
						}).then((result)=>{
							result.forEach((docs)=>{
								var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+docs.file_name;  
								mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
							})
							models.User_Transcript.findAll({
								where:{
									user_id : application.user_id,
									type:{
										[Op.like] :'%degree'
									},
								app_id : app_id,source : 'guattestation' 
								}
							}).then((result)=>{
								result.forEach((docs)=>{
									var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+docs.file_name;  
									mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
								})
								models.User_Transcript.findAll({
									where:{
										user_id : application.user_id,
									type:{
										[Op.like] :'%thesis'
									},
								app_id : app_id,source : 'guattestation' 
									}
								}).then((result)=>{
									result.forEach((docs)=>{
										var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+docs.file_name;  
										mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
									})
									models.Applicant_Marksheet.findAll({
										where:{
											name  : 'Aadhar Card',
											app_id : app_id
										}
									}).then((result)=>{
										result.forEach((docs)=>{
											var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+docs.file_name;  
											mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
										})
										models.Applicant_Marksheet.findAll({
											where:{
												name : 'Bonafied',
												app_id : app_id
											}
										}).then((result)=>{
											result.forEach((docs)=>{
												var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+application.user_id+"/"+docs.file_name;  
												mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
											})
									
										
													setTimeout(() => {
														fn.merge(app_id,user_id,mergefilesString);
													}, 1000);
											
										})
									})
								})
							})
						})
					});
				// })
		
		}else{
			res.json({
				status : 400,
				message : "Application not found"
			})
		}
	})
})
router.get('/mergeAfterpayment',(req,res)=>{
    console.log("/mergeAfterpayment")
    var app_id = req.query.app_id;
    var user_id = req.query.user_id;
	var mergefilesString = '';
	var setdefaultMergetime = 30000;

})


router.get('/checkWESINfo', function (req, res) {
  var app_id = 6567;
  var user_id =20216;
  fn.checkWESInfo(user_id,app_id);
});
router.get('/mergeAllUserDocuments', async function (req, res) {
	var user_id = req.query.user_id;
	var app_id = req.query.app_id;
	var mergeAllUserDocuments = "";
	let data = constant.FILE_LOCATION+"public/upload/documents/"+ user_id + "/" + app_id +"_UploadedDocument_Merge.pdf";;
	appliedDetails = await functions.getApplied(user_id,app_id);
	let MergePromise = new promises((resolve,reject)=>{
		if(appliedDetails.educationalDetails == true){
			var mergefilesString=''
			let mergeDocumentsPromise = new promises((resolve,reject)=>{
				models.User_Transcript.findAll({
					where:{
						user_id : user_id,
							type:{
								[Op.like] :'%degree'
							},
						app_id : app_id,source : 'guattestation' 
					}
				}).then((result)=>{
					if(appliedDetails.attestedfor.includes('degree')){
						result.forEach((docs)=>{
							var name = docs.file_name;
							var split1 = name.split('.');
							var exte = split1.pop();
							var file = split1[0];
							if (exte ==  'pdf' || exte ==  'PDF') {
								var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
								mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
							
							}else{
								var signedfile_doc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
								var outputfile = constant.FILE_LOCATION + "public/upload/documents/" + user_id + "/" + file + ".pdf";
								// var imgTopdf = [signedfile_doc]
								// fn.imagetopdf(signedfile_doc, outputfile);
								imagesToPdf([signedfile_doc], outputfile);
								// var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
								mergefilesString = mergefilesString+' "'+outputfile+'" ';
							}
						})
					}else{

					}
	
				models.User_Transcript.findAll({
					where:{
						user_id : user_id,
							type:{
								[Op.like] :'%transcripts'
							},
						app_id : app_id,source : 'guattestation' 
					}
				}).then((result)=>{
					if(appliedDetails.attestedfor.includes('transcript')){
						result.forEach((docs)=>{
							var name = docs.file_name;
							var split1 = name.split('.');
							var exte = split1.pop();
							var file = split1[0];
							if (exte ==  'pdf' || exte ==  'PDF') {
								var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
								mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
								
							}else{
								var signedfile_doc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
								var outputfile = constant.FILE_LOCATION + "public/upload/documents/" + user_id + "/" + file + ".pdf";
								// var imgTopdf = [signedfile_doc]
								imagesToPdf([signedfile_doc], outputfile);
								// var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
								mergefilesString = mergefilesString+' "'+outputfile+'" ';
							}
						})
					}else{

					}
	
					models.User_Transcript.findAll({
						where:{
							user_id : user_id,
								type:{
									[Op.like] :'%thesis'
								},
							app_id : app_id,source : 'guattestation' 
						}
					}).then((result)=>{
						if(appliedDetails.attestedfor.includes('thesis')){
							result.forEach((docs)=>{
								var name = docs.file_name;
								var split1 = name.split('.');
								var exte = split1.pop();
								var file = split1[0];
								if (exte ==  'pdf' || exte ==  'PDF') {
									var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
									mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
								}else{
									var signedfile_doc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
									var outputfile = constant.FILE_LOCATION + "public/upload/documents/" + user_id + "/" + file + ".pdf";
									// var imgTopdf = [signedfile_doc]
									imagesToPdf([signedfile_doc], outputfile);
									// var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
									mergefilesString = mergefilesString+' "'+outputfile+'" ';
								}
							})
						}else{
	
						}
	
						models.UserMarklist_Upload.findAll({
							where:{
								user_id : user_id,
								app_id : app_id
							}
						}).then((result)=>{
							if(appliedDetails.attestedfor.includes('marksheet') ||appliedDetails.attestedfor.includes('newmark') ){
								result.forEach((docs)=>{
										var name = docs.file_name;
										var split1 = name.split('.');
										var exte = split1.pop();
										var file = split1[0];
										if (exte ==  'pdf' || exte ==  'PDF') {
											var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
											mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
										}else{
											var signedfile_doc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
											var outputfile = constant.FILE_LOCATION + "public/upload/documents/" + user_id + "/" + file + ".pdf";
											// var imgTopdf = [signedfile_doc]
											imagesToPdf([signedfile_doc], outputfile);
											// var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
											mergefilesString = mergefilesString+' "'+outputfile+'" ';
										}
									})
								
							}else{
							}
	
					fn.merge_alldocs(app_id,user_id,mergefilesString);
				})
				})
			})
				})
	
			resolve('true');
			});
	
			mergeDocumentsPromise.then((value)=>{
					console.log("doneeee");
					res.json({
						status : 200,
						data : data
					})
				
			})
		}else if(appliedDetails.instructionalField == true){
			let mergeDocumentsPromise = new promises((resolve,reject)=>{
				var mergefilesString=''
				models.UserMarklist_Upload.findAll({
					where:{
						user_id : user_id,
						app_id : app_id
					}
				}).then((result)=>{
						result.forEach((docs)=>{
							var name = docs.file_name;
							var split1 = name.split('.');
							console.log("split1" + split1);
							var exte = split1.pop();
							var file = split1[0];
							if (exte ==  'pdf' || exte ==  'PDF') {
								var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
								mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
							}else{
								var signedfile_doc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
								var outputfile = constant.FILE_LOCATION + "public/upload/documents/" + user_id + "/" + file + ".pdf";
								// var imgTopdf = [signedfile_doc]
								imagesToPdf([signedfile_doc], outputfile);
								// var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
								mergefilesString = mergefilesString+' "'+outputfile+'" ';
							}
						})
						models.Applicant_Marksheet.findAll({
							where:{
								user_id : user_id,
								name :'Bonafied'
							}
						}).then((result)=>{
							if(appliedDetails.attestedfor.includes('marksheet')  ){
								result.forEach((docs)=>{
										var name = docs.file_name;
										var split1 = name.split('.');
										console.log("split1" + split1);
										var exte = split1.pop();
										var file = split1[0];
										if (exte ==  'pdf' || exte ==  'PDF') {
											var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
											mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
										}else{
											var signedfile_doc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
											var outputfile = constant.FILE_LOCATION + "public/upload/documents/" + user_id + "/" + file + ".pdf";
											// var imgTopdf = [signedfile_doc]
											imagesToPdf([signedfile_doc], outputfile);
											// var signedfile_loc =  constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+docs.file_name;
											mergefilesString = mergefilesString+' "'+outputfile+'" ';
										}
									})
								
							}else{
							}
		
						  fn.merge_alldocs(app_id,user_id,mergefilesString);
						})
					})
				
				resolve('true');
			})
			mergeDocumentsPromise.then((value)=>{
				console.log("doneeee" + data);
				   res.json({
					status : 200,
					data : data
				   })
			})
		}
	})
	
	
	
})
module.exports = router;