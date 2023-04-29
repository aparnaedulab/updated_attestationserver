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

router.post('/documentSending',middlewares.getUserInfo, function(req,res){
	console.log('/documentSending');
	var app_id = req.body.appl_id;
	var user_id;
	var emailedDoc = [];
	var email_arr = [];
	var sentDocuments = [];
	var studentData = {};
	var purposes = [];
	var attachments = [];
	var hrdFlag = false;
	models.Application.find({
	  	where :{
			id : app_id
	  	}
	}).then(function(application){
	  	user_id = application.user_id;
	  	console.log("user_id == " + user_id);
	  	models.User.getApplicationDetailsForSign(app_id).then(function(student){
  			models.Institution_details.findAll({
		  		where : {	
					app_id : app_id,
					user_id : user_id
				}
			}).then(function(institutes){
		  		console.log("institutes == " + JSON.stringify(institutes));
		  		institutes.forEach(institute=>{
					if(institute.type == 'HRD'){
						hrdFlag = true;
						var referenceNo;
						if(institute.type == 'HRD')
							referenceNo = institute.hrdno;
							purposes.push({
								purpose : institute.type,
								emails : (institute.otherEmail) ? institute.email.concat(',',institute.otherEmail) : institute.email
							})
							if(institute.OtherEmail){
								var emailArr = institute.OtherEmail.split(', ');
								emailArr.forEach(email=>{
									  email_arr.push({
										email : email,
										reference_no : referenceNo
									  })
								})
							  } 
							email_arr.push({
								email : institute.email,
								reference_no : referenceNo
							  }); 
					}
					else if(institute.type != "Educational credential evaluators WES"){
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
					}
		  		})
				if(hrdFlag == true){
					console.log("IN hrd purposes");
					  if(student[0].instructionalField == true){
						console.log("Instructional Letter");
						models.Emailed_Docs.findAll({
							  where :{
								app_id : app_id,
								category : "HrdLetter"
							  }
						}).then(function(documents){							
							  documents.forEach(document =>{
								  var attachment = {};
								// emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
								 sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
							  
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
					// 	models.Emailed_Docs.findAll({
					// 		where :{
					// 		  app_id : app_id,
					// 		  category : "HrdLetter"
					// 		}
					//   }).then(function(documents){
					// 		documents.forEach(document =>{
					// 		  emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
					// 		  sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
					// 		})
					//   })
					  }
					  if(student[0].curriculum == true){
						console.log("Curriculum");
						// models.Emailed_Docs.findAll({
						// 	  where :{
						// 		app_id : app_id,
						// 		category : "Curriculum"
						// 	  }
						// }).then(function(documents){
						// 	  documents.forEach(document =>{
						// 		emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
						// 		sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
						// 	  })
						// })
					// 	models.Emailed_Docs.findAll({
					// 		where :{
					// 		  app_id : app_id,
					// 		  category : "HrdLetter"
					// 		}
					//   }).then(function(documents){
					// 		documents.forEach(document =>{
					// 		  emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
					// 		  sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
					// 		})
					//   })
					
					models.Emailed_Docs.findAll({
						where :{
						  app_id : app_id,
						  category : "HrdLetter"
						}
				  }).then(function(documents){
					  
						documents.forEach(document =>{
							var attachment = {};
						  // emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
						   sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
						
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

						models.Emailed_Docs.findAll({
							where :{
							  app_id : app_id,
							  category : "HrdLetter"
							}
					  }).then(function(documents){
						  
							documents.forEach(document =>{
								var attachment = {};
							  // emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
							   sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
							
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
						// models.Emailed_Docs.find({
						// 	  where : {
						// 		app_id : app_id,
						// 		doc_type : 'merged'
						// 	  }
						// }).then((mergedData)=>{
						// 	  if(mergedData){
						// 		emailedDoc.push({"id":mergedData.id,"filename":mergedData.filename,"doc_type":mergedData.doc_type,"category":mergedData.category})
						// 		  sentDocuments.push({"fileName":mergedData.filename,"documentType":mergedData.doc_type,"category":mergedData.category})
						// 	  }else{
								// models.Emailed_Docs.findAll({
								// 	where :{
								// 		  app_id : app_id,
								// 		  category : "Transcript"
								// 	}
								//   }).then(function(documents){
								// 	  documents.forEach(document =>{
								// 		emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
								// 		sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
								// 	  })
								// })
								// models.Emailed_Docs.findAll({
								// 	  where :{
								// 		app_id : app_id,
								// 		category : "HrdLetter"
								// 	  }
								// }).then(function(documents){
								// 	  documents.forEach(document =>{
								// 		emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
								// 		sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
								// 	  })
								// })

							//   }
						// })
					  }
						if(student[0].gradToPer == true){
						// models.Emailed_Docs.findAll({
						// 	where :{
						// 		  app_id : app_id,
						// 		  category : "GradeToPerLetter"
						// 	}
						//   }).then(function(documents){
						// 	  documents.forEach(document =>{
						// 		emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
						// 		sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
						// 	  })
						// })
					// 	models.Emailed_Docs.findAll({
					// 		where :{
					// 		  app_id : app_id,
					// 		  category : "HrdLetter"
					// 		}
					//   }).then(function(documents){
					// 		documents.forEach(document =>{
					// 		  emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
					// 		  sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
					// 		})
					//   })
					
					models.Emailed_Docs.findAll({
						where :{
						  app_id : app_id,
						  category : "HrdLetter"
						}
				  }).then(function(documents){
					  
						documents.forEach(document =>{
							var attachment = {};
						  // emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
						   sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
						
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

					if(student[0].CompetencyLetter == true){
						console.log("CompetencyLetter");
						// models.Emailed_Docs.find({
						// 	where : {
						// 		app_id : app_id,
						// 		doc_type : 'merged'
						// 	}
						// }).then((mergedData)=>{
						// 	if(mergedData){
						// 		emailedDoc.push({"id":mergedData.id,"filename":mergedData.filename,"doc_type":mergedData.doc_type,"category":mergedData.category})
						// 		sentDocuments.push({"fileName":mergedData.filename,"documentType":mergedData.doc_type,"category":mergedData.category})
						// 	}else{
						// 		models.Emailed_Docs.findAll({
						// 			where :{
						// 				app_id : app_id,
						// 				category : "CompetencyLetter"
						// 			}
						// 		}).then(function(documents){
						// 			documents.forEach(document =>{
						// 				emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
						// 				sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
						// 			})
						// 		})
						// 		models.Emailed_Docs.findAll({
						// 			where :{
						// 				app_id : app_id,
						// 				category : "Marklist"
						// 			}
						// 		}).then(function(documents){
						// 			documents.forEach(document =>{
						// 				emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
						// 				sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
						// 			})
						// 		})
						// 	}
						// })
					// 	models.Emailed_Docs.findAll({
					// 		where :{
					// 		  app_id : app_id,
					// 		  category : "HrdLetter"
					// 		}
					//   }).then(function(documents){
					// 		documents.forEach(document =>{
					// 		  emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
					// 		  sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
					// 		})
					//   })
					
					models.Emailed_Docs.findAll({
						where :{
						  app_id : app_id,
						  category : "HrdLetter"
						}
				  }).then(function(documents){
					  
						documents.forEach(document =>{
							var attachment = {};
						  // emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
						   sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
						
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
					if(student[0].affiliation == true){
						console.log("affiliation Letter");
						// models.Emailed_Docs.findAll({
						// 	  where :{
						// 		app_id : app_id,
						// 		category : "AffiliationLetter"
						// 	  }
						// }).then(function(documents){
							
						// 	  documents.forEach(document =>{
						// 		  var attachment = {};
						// 		// emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
						// 		 sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
							  
						// 		  var file_location = constant.FILE_LOCATION+"public/signedpdf/"+user_id+'/'+document.filename;
						// 		  //fs.writeFileSync(file_location, xls, 'binary');
						// 		  //var file_name = student[0].name+student[0].surname+'_'+app_id+".xlsx";
						// 		  var base64String = fs.readFileSync(file_location).toString("base64");
								  
						// 		 attachment = {                             
						// 			  content: base64String,
						// 			  filename: document.filename,
						// 			  type: 'application/pdf',
						// 			  disposition: 'attachment',
						// 			  contentId: 'mytext'
						// 		  }
									  
								  
						// 		  attachments.push(attachment);
						// 	  })
						// })
					// 	models.Emailed_Docs.findAll({
					// 		where :{
					// 		  app_id : app_id,
					// 		  category : "HrdLetter"
					// 		}
					//   }).then(function(documents){
					// 		documents.forEach(document =>{
					// 		  emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
					// 		  sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
					// 		})
					//   })
					
					models.Emailed_Docs.findAll({
						where :{
						  app_id : app_id,
						  category : "HrdLetter"
						}
				  }).then(function(documents){
					  
						documents.forEach(document =>{
							var attachment = {};
						  // emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
						   sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
						
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
					  if(student[0].LetterforNameChange == true){
						console.log("LetterforNameChange");
						// models.Emailed_Docs.findAll({
						// 	  where :{
						// 		app_id : app_id,
						// 		category : "NameChangeLetter"
						// 	  }
						// }).then(function(documents){
							
						// 	  documents.forEach(document =>{
						// 		  var attachment = {};
						// 		// emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
						// 		 sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
							  
						// 		  var file_location = constant.FILE_LOCATION+"public/signedpdf/"+user_id+'/'+document.filename;
						// 		  //fs.writeFileSync(file_location, xls, 'binary');
						// 		  //var file_name = student[0].name+student[0].surname+'_'+app_id+".xlsx";
						// 		  var base64String = fs.readFileSync(file_location).toString("base64");
								  
						// 		 attachment = {                             
						// 			  content: base64String,
						// 			  filename: document.filename,
						// 			  type: 'application/pdf',
						// 			  disposition: 'attachment',
						// 			  contentId: 'mytext'
						// 		  }
									  
								  
						// 		  attachments.push(attachment);
						// 	  })
						// })
					// 	models.Emailed_Docs.findAll({
					// 		where :{
					// 		  app_id : app_id,
					// 		  category : "HrdLetter"
					// 		}
					//   }).then(function(documents){
					// 		documents.forEach(document =>{
					// 		  emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
					// 		  sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
					// 		})
					//   })
					
					models.Emailed_Docs.findAll({
						where :{
						  app_id : app_id,
						  category : "HrdLetter"
						}
				  }).then(function(documents){
					  
						documents.forEach(document =>{
							var attachment = {};
						  // emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
						   sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
						
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
	
					setTimeout(()=>{
						console.log("Send Email");
						console.log("emailedDoc====>"+JSON.stringify(emailedDoc));
						console.log("attachments.length====>"+JSON.stringify(attachments.length));
						if(emailedDoc.length > 0 || attachments.length > 0){
						  	request.post(constant.BASE_URL_SENDGRID + 'pdf_send_email1_hrd', {
								json: {
						  			userName : student[0].name + ' '+ student[0].surname,
						  			surname : student[0].surname,
						  			userEmail : student[0].email,
						  			certi_name : student[0].applying_for,
						  			mobile_country_code : student[0].mobile_country_code,
						  			mobile : student[0].mobile,
						  			email_add : email_arr,
						  			app_id: app_id,
						  			emailedDoc : emailedDoc,
						  			attachments : (attachments.length) > 0 ? attachments : null
								}
						  	}, function (error, response, body) {
								if (error || body.status == 400) {
						  			return  res.json({
										status : 400,
										message : 'Error in sending Signed Document to email',
						  			})
								}else if(body.status == 200){
						  			//TODO: HERE UPDATING THE STATUS OF APPLICATION FROM SIGNED TO DONE 
						  			application.update({
										tracker: 'done'
						  			}).then(function (result) {
						  				if(result){ 
											var userName = student[0].name + ' ' + student[0].surname;
											var desc = userName+"'s ( "+student[0].email+" ) application sent by "+req.User.email+".";
											var activity = "Application Sent";
											var applicationId = app_id;
											//functions.activitylog(user_id, activity, desc, applicationId);
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
										  				studentData : studentData
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
						  	});
						}else{
							return  res.json({
								status : 400,
								message : 'There is no signed documents so that can not process application further',
							})
						}
					  },5000)
				}else if(hrdFlag == false){
					console.log("In Other purposes");
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
								 sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
							  
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
					  if(student[0].curriculum == true){
						console.log("Curriculum");
						models.Emailed_Docs.findAll({
							  where :{
								app_id : app_id,
								category : "Curriculum"
							  }
						}).then(function(documents){
							  documents.forEach(document =>{
								emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
								sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
							  })
						})
					  }
					  if(student[0].educationalDetails == true){
						console.log("Educational Details");
						models.Emailed_Docs.find({
							  where : {
								app_id : app_id,
								doc_type : 'merged'
							  }
						}).then((mergedData)=>{
							  if(mergedData){
								emailedDoc.push({"id":mergedData.id,"filename":mergedData.filename,"doc_type":mergedData.doc_type,"category":mergedData.category})
								  sentDocuments.push({"fileName":mergedData.filename,"documentType":mergedData.doc_type,"category":mergedData.category})
							  }else{
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
							  }
						})
					  }
					if(student[0].gradToPer == true){
						models.Emailed_Docs.findAll({
							where :{
								  app_id : app_id,
								  category : "GradeToPerLetter"
							}
						  }).then(function(documents){
							  documents.forEach(document =>{
								emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
								sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
							  })
						})
					}
					if(student[0].CompetencyLetter == true){
						console.log("CompetencyLetter");
						models.Emailed_Docs.find({
							where : {
								app_id : app_id,
								doc_type : 'merged'
							}
						}).then((mergedData)=>{
							if(mergedData){
								emailedDoc.push({"id":mergedData.id,"filename":mergedData.filename,"doc_type":mergedData.doc_type,"category":mergedData.category})
								sentDocuments.push({"fileName":mergedData.filename,"documentType":mergedData.doc_type,"category":mergedData.category})
							}else{
								models.Emailed_Docs.findAll({
									where :{
										app_id : app_id,
										category : "CompetencyLetter"
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
							}
						})
					}
					if(student[0].affiliation == true){
						console.log("affiliation Letter");
						models.Emailed_Docs.findAll({
							  where :{
								app_id : app_id,
								category : "AffiliationLetter"
							  }
						}).then(function(documents){
							
							  documents.forEach(document =>{
								  var attachment = {};
								// emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
								 sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
							  
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
					  if(student[0].LetterforNameChange == true){
						console.log("LetterforNameChange");
						models.Emailed_Docs.findAll({
							  where :{
								app_id : app_id,
								category : "NameChangeLetter"
							  }
						}).then(function(documents){
							
							  documents.forEach(document =>{
								  var attachment = {};
								// emailedDoc.push({"id":document.id,"filename":document.filename,"doc_type":document.doc_type,"category":document.category})
								 sentDocuments.push({"fileName":document.filename,"documentType":document.doc_type,"category":document.category})
							  
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
	
					setTimeout(()=>{
						console.log("Send Email");
						console.log("emailedDoc====>"+JSON.stringify(emailedDoc));
						if(emailedDoc.length > 0 || attachments.length > 0){
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
						  			attachments : (attachments.length) > 0 ? attachments : null
								}
						  	}, function (error, response, body) {
								if (error || body.status == 400) {
						  			return  res.json({
										status : 400,
										message : 'Error in sending Signed Document to email',
						  			})
								}else if(body.status == 200){
						  			//TODO: HERE UPDATING THE STATUS OF APPLICATION FROM SIGNED TO DONE 
						  			application.update({
										tracker: 'done'
						  			}).then(function (result) {
						  				if(result){ 
											var userName = student[0].name + ' ' + student[0].surname;
											var desc = userName+"'s ( "+student[0].email+" ) application sent by "+req.User.email+".";
											var activity = "Application Sent";
											var applicationId = app_id;
											//functions.activitylog(user_id, activity, desc, applicationId);
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
										  				studentData : studentData
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
						  	});
						}else{
							return  res.json({
								status : 400,
								message : 'There is no signed documents so that can not process application further',
							})
						}
					  },5000)
				}
		 
			})
	  	})
	})
});


router.post('/documentSigning_old',middlewares.getUserInfo,function(req,res){
	console.log('/documentSigning_old');
	var app_id =  req.body.appl_id;
	var siginingType = req.body.type;
	var signingDegree =  req.body.degree;
	var signstatus;
	var count = 1;
	var wesform_length =0
	var transcript_length = 0 ;
	var marksheet_length = 0;
	var curriculum_length = 0;
	var gradTOPer_letter_length = 0;
	//var competencyLetter_length = 0;
	var instruction_letter_length = 0;
	var affiliation_letter_length = 0;
	var competencyletter_length = 0;
	var namechangeletter_length = 0;
	var transcripts = [];
	var user_marklists = [];
	var user_marksheets = [];
	var user_curriculums = [];
	var gradTOPer_letter = [];
	var competencyletter= []
	var studentData = {};

	const runService = (WorkerData) => {
		return new Promise((resolve, reject) => {
		
			// import workerExample.js script..
		
			const worker = new Worker('./workerExample.js', { WorkerData });
			worker.on('message', resolve);
			worker.on('error', reject);
			worker.on('exit', (code) => {
				if (code !== 0)
					reject(new Error(`stopped with  ${code} exit code`));
			})
		})
	}
	models.Application.findOne({
		where :{
			id : app_id
		}
	}).then(function(application){
		models.Institution_details.findAll({
			where : {
				user_id : application.user_id,
				app_id : app_id
			}
		}).then(function (institution_data){
		if(application){
			var user_id = application.user_id;
			models.User.getApplicationDetailsForSign(app_id).then(function(user){
			  	if(user[0]){
				  	if(!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/")){
					  	fs.mkdirSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/", { recursive: true });//fs.writeFileSync
				  	}
					const tasks =[application.id]
					const queue = async.queue((task, executed) => {
						if(user[0].educationalDetails == true){
							models.User_Transcript.findAll({
								where:{
									user_id : application.user_id,
									type:{
										[Op.like] :'%transcripts'
									},
									app_id :{
										[Op.ne] : null
									}
								}
							}).then(function(user_transcripts){
								user_transcripts.forEach(user_transcript=>{
									var app_idArr = user_transcript.app_id.split(',');
									app_idArr.forEach(transcript_appId=>{
										if(transcript_appId == app_id){
											transcripts.push(user_transcript);
										}
									})
								})
			
								transcript_length = transcripts.length;
								transcripts.forEach(transcript=>{
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
											models.Emailed_Docs.create({
												filename : emailedDocs.file_name,
												doc_type : emailedDocs.doc_type,
												category : emailedDocs.category,
												transcript_id: transcript.id,
												app_id:app_id
											});
										}else{
											var fileName = path.parse(transcript.file_name).name;
											var filePath = constant.FILE_LOCATION+"public/upload/transcript/"+application.user_id+"/"+transcript.file_name;
											var category = "Transcript";
											var outputDirectory;
											if(fs.existsSync(filePath)){
												var extension=transcript.file_name.split('.').pop();
												var numOfpages;
												console.log("test==")
												if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
													if(extension == 'pdf'){
														
														const signingProcess = async ()=>{
														let promise = new Promise(function(resolve, reject){
															console.log("in promise");
															var folderName = fileName.split(" ").join("_");
															console.log("folderName == " + folderName);
															var transcript_outputDirectory = constant.FILE_LOCATION+"public/upload/transcript/"+application.user_id+"/"+folderName+"/";
															fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,transcript_outputDirectory);
															let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/transcript/"+application.user_id+"/"+transcript.file_name);
																pdf(dataBuffer).then(function(data) {
																console.log("no=====>"+data.numpages);  // number of pages
																numOfpages = data.numpages;
															});
											
															var fileString = "";						
															setTimeout(()=>{
																var signed_outputDirectory = constant.FILE_LOCATION+"public/upload/transcript/"+application.user_id+"/signed_"+folderName+"/";
																if(!fs.existsSync(signed_outputDirectory)){
																	fs.mkdirSync(signed_outputDirectory, { recursive: true });//fs.writeFileSync
																}
																
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
																	
																	console.log("fileName == " + fileName);
																	filePath =  constant.FILE_LOCATION+"public/upload/transcript/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
																	console.log(filePath);
																	var file_name =  fileName+"-"+j+".jpg"
																	console.log("file_name == " + file_name);
																	fn.signingDocuments(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, signed_outputDirectory,function(err){
																		if(err){
																			return res.json({
																			status : 400,
																			message : err
																			})
																		}else{
				
																			fileString = fileString +' "'+ signed_outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
																			console.log("fileString state== " + fileString);

																		}
																	});
																}
																},1000)
																setTimeout(()=>{
																	console.log('fileString == ' + fileString);
																	resolve(fileString);
																},3000)

														})
														
														
															Promise.all([promise]).then((result)=>{
																console.log("fileString result == " + result);
																outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, result, function(err){
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
																					category : category,
																					transcript_id: transcript.id,
																					app_id:app_id,
																				}).then((result)=>{
																				// logger.debug(" result : "+JSON.stringify(result))
																			})
																			}
																		})
																	}
																});
															})
														}
														signingProcess();
													}else{
														
														outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
														fn.signingDocuments(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
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
																			category : category,
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
																category : category,
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
							})
							// models.UserMarklist_Upload.findAll({
							// 	where:{
							// 		user_id : application.user_id,
							// 		app_id :{
							// 			[Op.ne] : null
							// 		}
							// 	}
							// }).then(function(userMarklists){
							// 	console.log("userMarklists == " + JSON.stringify(userMarklists));
							// 	userMarklists.forEach(userMarklist=>{
							// 		var app_idArr = userMarklist.app_id.split(',');
							// 		app_idArr.forEach(marklist_appId=>{
							// 			if(marklist_appId == app_id){
							// 				user_marklists.push(userMarklist);
							// 			}
							// 		})
							// 	})
							// 	if(user_marklists.length > 0){
							// 		marksheet_length = user_marklists.length;
							// 		user_marklists.forEach(marklist=>{
							// 			console.log("marklist == " + JSON.stringify(marklist));
							// 			var doc_name = marklist.name.split(' ').join('_');
							// 			var fileName = doc_name + "_" + path.parse(marklist.file_name).name + "-.pdf";
							// 			models.Emailed_Docs.find({
							// 				where :{
							// 					transcript_id : marklist.id,
							// 					fileName : fileName,
							// 					app_id :{
							// 						[Op.ne] : app_id
							// 					}
							// 				}
							// 			}).then(function(emailedDocs){
							// 				if(emailedDocs){
							// 					models.Emailed_Docs.create({
							// 						filename : emaildDocs.file_name,
							// 						doc_type : emaildDocs.doc_type,
							// 						category : emaildDocs.category,
							// 						marklist_id: marklist.id,
							// 						app_id:app_id
							// 					});
							// 				}else{
							// 					var fileName = path.parse(marklist.file_name).name;
							// 					var filePath = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+marklist.file_name;
							// 					var category = "Marklist";
							// 					var outputDirectory;
							// 					if(fs.existsSync(filePath)){
							// 						var extension=marklist.file_name.split('.').pop();
							// 						var numOfpages;
							// 						console.log("test==")
							// 						if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(marklist.file_name).name+".pdf")){
							// 							if(extension == 'pdf'){
							// 								var folderName = fileName.split(" ").join("_");
							// 								console.log("folderName == " + folderName);
							// 								outputDirectory = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+folderName+"/";
							// 								fn.pdfToImageConversion(marklist.file_name,application.user_id,filePath,outputDirectory);
							// 								let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+marklist.file_name);
							// 									pdf(dataBuffer).then(function(data) {
							// 									console.log("no=====>"+data.numpages);  // number of pages
							// 									numOfpages = data.numpages;
							// 								});
							// 								var fileString = "";
							// 								outputDirectory = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/signed_"+folderName+"/";
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
																
							// 										console.log("fileName == " + fileName);
							// 										filePath =  constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+ folderName +"/"+path.parse(marklist.file_name).name+"-"+j+".jpg"; 
							// 										console.log(filePath);
							// 										var file_name =  fileName+"-"+j+".jpg"
							// 										console.log("file_name == " + file_name);
							// 										fn.signingDocuments(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
							// 											if(err){
							// 												return res.json({
							// 												status : 400,
							// 												message : err
							// 												})
							// 											}else{
				
							// 												fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
							// 												console.log("fileString == " + fileString);
							// 											}
							// 										});
							// 									}
							// 								},4000) 
															
															
							// 								setTimeout(()=>{
							// 									console.log("fileString 2 == " + fileString);
							// 									outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
							// 									fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(marklist.file_name).name, outputDirectory, fileString, function(err){
							// 										if(err){
							// 											return res.json({
							// 												status : 400,
							// 												message : "Files cannot merge"
							// 											})
							// 										}else{
							// 											var file_name = doc_name + "_" + path.parse(marklist.file_name).name + ".pdf"
							// 											models.Emailed_Docs.find({
							// 												where : {
							// 													filename : file_name,
							// 													marklist_id: marklist.id,
							// 													app_id:app_id,
							// 												}
							// 											}).then(function(emailedDoc){
							// 												if(emailedDoc){
				
							// 												}else{
							// 													models.Emailed_Docs.create({
							// 														filename : file_name,
							// 														doc_type : doc_name,
							// 														category : category,
							// 														marklist_id: marklist.id,
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
							// 								fn.signingDocuments(path.parse(marklist.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
							// 									if(err){
							// 										return res.json({
							// 											status : 400,
							// 											message : err
							// 										})
							// 									}else{
							// 										var file_name = doc_name + "_" + path.parse(marklist.file_name).name + ".pdf"
							// 										models.Emailed_Docs.find({
							// 											where : {
							// 												filename : file_name,
							// 												marklist_id: marklist.id,
							// 												app_id:app_id,
							// 											}
							// 										}).then(function(emailedDoc){
							// 											if(emailedDoc){
				
							// 											}else{
							// 												models.Emailed_Docs.create({
							// 													filename : file_name,
							// 													doc_type : doc_name,
							// 													category : category,
							// 													marklist_id: marklist.id,
							// 													app_id:app_id
							// 												}).then((result)=>{
							// 												// logger.debug(" result : "+JSON.stringify(result))
							// 											})
							// 											}
							// 										})
							// 									}
							// 								});
							// 							}
							// 						}else{
							// 							var file_name = doc_name + "_" + path.parse(marklist.file_name).name + ".pdf"
							// 							models.Emailed_Docs.find({
							// 								where : {
							// 									filename : file_name,
							// 									marklist_id: marklist.id,
							// 									app_id:app_id,
							// 								}
							// 							}).then(function(emailedDoc){
							// 								if(emailedDoc){
				
							// 								}else{
							// 									models.Emailed_Docs.create({
							// 										filename : file_name,
							// 										doc_type : doc_name,
							// 										category : category,
							// 										marklist_id: marklist.id,
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
							// 							message : marklist.name + 'not found'
							// 						})
							// 					}
							// 				}
							// 			})
							// 		})
							// 	}
							// })
						}
						// if(user[0].instructionalField == true){
						// 	console.log("instructional letter");
						// 	var collegeData = [];
						// 	var reference_no;
						// 	var prefix = '';
						// 	var subject = '';
						// 	var subject1 = '';
						// 	var application_id = app_id
					
						// 	models.Application.findOne({
						// 		where :{
						// 			id : application_id
						// 		}
						// 	}).then(function(application){
						// 		console.log('----1----')
						// 		models.User.find({
						// 			where :{
						// 				id : application.user_id
						// 			}
						// 		}).then(function(user){
						// 			console.log('----2----')
						// 			if(user.gender == 'Female'){
						// 					console.log('----3----')
						// 				prefix = 'Ms. ';
						// 				subject = 'She';
						// 				subject1 = 'her';
						// 			}else if(user.gender == 'Male'){
						// 				console.log('----4----')
						// 				prefix = 'Mr. ';
						// 				subject = 'He';
						// 				subject1 = 'his';
						// 			}
									
						// 			models.Applied_For_Details.find({
						// 				where :{
						// 					user_id : application.user_id,
						// 					app_id : application_id
						// 				}
						// 			}).then(function(appliedDetails){
						// 				console.log('----5----')
						// 				if(appliedDetails.applying_for == 'Masters,Bachelors'){
						// 					console.log('----6----')
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Masters",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(master_Details){
						// 						console.log('----7----')
						// 						var masterDetails = [];
						// 						if(master_Details){
						// 							console.log('----8----')
						// 							master_Details.forEach(master =>{
						// 								if(master.app_id != null){
						// 									var app_idArr = master.app_id.split(",");
						// 									app_idArr.forEach(app_id =>{
						// 										if(app_id == application_id){
						// 											masterDetails.push(master);
						// 										}
						// 									})
						// 								}
						// 							})
						// 							console.log('----9----')
						// 							if(masterDetails){
						// 								var facultyData = [];
						// 								console.log('----10----')
						// 								masterDetails.forEach(master =>{
						// 									var flag = false;
						// 									var college = {};
						// 									if(master.patteren == 'Annual'){
						// 										college.name = master.name;
						// 										college.collegeId = master.collegeId;
						// 									}else if(master.patteren == 'Semester'){
						// 										switch(master.name){
						// 											case 'Semester 2' : 
						// 												college.name = 'First Year',
						// 												college.collegeId = master.collegeId
						// 												break;
						// 											case 'Semester 4' :
						// 												college.name = 'Second Year',
						// 												college.collegeId = master.collegeId
						// 												break;
						// 											case 'Semester 6' :
						// 												college.name = 'Third Year',
						// 												college.collegeId = master.collegeId
						// 												break;
						// 											case 'Semester 8' :
						// 												college.name = 'Fourth Year',
						// 												college.collegeId = master.collegeId
						// 												break;
						// 											case 'Semester 10' :
						// 												college.name = 'Fifth Year',
						// 												college.collegeId = master.collegeId
						// 											break;
						// 											default :
						// 												college.name = '',
						// 												college.collegeId = master.collegeId
						// 										}
						// 									}
						// 									if(facultyData.length > 0){
						// 										facultyData.forEach(data=>{
						// 											if(data.faculty == master.faculty){
						// 												flag = true;
						// 												var count = 0;
						// 												data.colleges.forEach(clg=>{
						// 													if(clg.collegeId == master.collegeId){
						// 														count ++;
						// 													}
						// 												})
						// 												if(count <= data.colleges.length){
						// 													data.colleges.push(college);     
						// 												}
						// 											}
						// 										})
						// 										if(flag == false){
						// 										facultyData.push({
						// 												type:master.type,
						// 												faculty : master.faculty,
						// 												colleges : colleges.push(college)
						// 											})
						// 										}
						// 									}else{
						// 										var colleges = [];
						// 										colleges.push(college);
						// 										facultyData.push({
						// 											type:master.type,
						// 											faculty : master.faculty,
						// 											colleges : colleges
						// 										})
						// 									}
						// 								})
						// 								console.log('----11----')
						// 								facultyData.forEach(faculty=>{
						// 									models.InstructionalDetails.findAll({
						// 										where :{
						// 											userId : application.user_id,
						// 											education : faculty.type + '_' + faculty.faculty
						// 										}
						// 									}).then(function(instructionalDetails){
						// 										console.log('----12----')
						// 										var instructional_Details = [];
						// 										instructionalDetails.forEach(instruction =>{
						// 											if(instruction.app_id != null){
						// 												var app_idArr = instruction.app_id.split(",");
						// 												app_idArr.forEach(app_id =>{
						// 													if(app_id == application_id){
						// 														instructional_Details.push(instruction);
						// 													}
						// 												})
						// 											}
						// 										})
						// 										setTimeout(()=>{
						// 											if(appliedDetails.current_year == true){
						// 												console.log("----13 test ----");
						// 												instruction_letter_length = instruction_letter_length  + 1;
						// 												models.College.find ({
						// 													where :{
						// 														id : faculty.colleges[0].collegeId
						// 													}
						// 												}).then(function(college){
						// 													var studentName = prefix + instructional_Details[0].studentName;
						// 													var collegeName ;
						// 													if(college.type == 'college'){
						// 														collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
						// 													}else if(college.type == 'department'){
						// 														collegeName = instructional_Details[0].collegeName + ", ";
						// 													}
						// 													var courseName = instructional_Details[0].courseName;
						// 													var specialization = instructional_Details[0].specialization;
						// 													var passingMonthYear = instructional_Details[0].yearofpassing;
						// 													var duration = converter.toWords(instructional_Details[0].duration);
						// 													var passingClass = instructional_Details[0].division;
						// 													var instruction_medium;
						// 													if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 														instruction_medium = "English";
						// 													}else{
						// 														instruction_medium = instructional_Details[0].instruction_medium;
						// 													}
						// 													var education = instructional_Details[0].education;
						// 													setTimeout(()=>{
						// 														if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 															console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
						// 															models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																if(MaxReferenceNo[0].maxNumber == null){
						// 																	reference_no = 1001;
						// 																}else{
						// 																	reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																}
						// 																models.InstructionalDetails.update({
						// 																	reference_no : reference_no
						// 																},{
						// 																	where :{
						// 																		id : instructional_Details[0].id
						// 																	}
						// 																}).then(function(updatedDetails){
						// 																	//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																	var ref_no = reference_no;
						// 																	self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																	passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																		if(err) {
						// 																			res.json({ 
						// 																				status: 400
						// 																			})
						// 																		}else{
						// 																			models.Emailed_Docs.find({
						// 																				where :{
						// 																					app_id:app_id,
						// 																					filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				}
						// 																			}).then(function(emailDoc){
						// 																				if(!emailDoc){
						// 																					models.Emailed_Docs.create({
						// 																						filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																						doc_type : "InstructionalLetter",
						// 																						category : "InstructionalLetter",
						// 																						user_id: user_id,
						// 																						transcript_id: null,
						// 																						marklist_id : null,
						// 																						app_id:app_id,
						// 																						curriculum_id : null
						// 																					}).then((result)=>{
						// 																						// logger.debug(" result : "+JSON.stringify(result))
						// 																					})
						// 																				}
						// 																			})
						// 																		}
						// 																	})
						// 																})
						// 															})
						// 														}else{
						// 															var ref_no = instructionalDetails[0].reference_no;
						// 															self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 															passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																if(err) {
						// 																	res.json({ 
						// 																		status: 400
						// 																	})
						// 																}else{
						// 																	models.Emailed_Docs.find({
						// 																		where :{
						// 																			app_id:app_id,
						// 																			filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																		}
						// 																	}).then(function(emailDoc){
						// 																		if(!emailDoc){
						// 																			models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				doc_type : "InstructionalLetter",
						// 																				category : "InstructionalLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																			}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																			})
						// 																		}
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													})
						// 												})
						// 											}else{
						// 												if(instructional_Details.length > 1){
						// 													instruction_letter_length = instruction_letter_length  + 1;
						// 													console.log("----13----");
						// 													var studentName = prefix + instructional_Details[0].studentName;
						// 													var courseName = instructional_Details[0].courseName;
						// 													var specialization = instructional_Details[0].specialization;
						// 													var passingMonthYear = instructional_Details[0].yearofpassing;
						// 													var duration = converter.toWords(instructional_Details[0].duration);
						// 													var passingClass = instructional_Details[0].division;
						// 													var instruction_medium;
						// 													if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 														instruction_medium = "English";
						// 													}else{
						// 														instruction_medium = instructionalDetails[0].instruction_medium;
						// 													}
						// 													var education = instructional_Details[0].education;
						// 													var instructionId = '';
						// 													instructional_Details.forEach(instruction =>{
						// 														console.log(instruction.academicYear);
						// 														faculty.colleges.forEach(singleDetail=>{
						// 															console.log(singleDetail.name);
						// 															models.College.find({
						// 																where : {
						// 																	id : singleDetail.collegeId
						// 																}
						// 															}).then(function(college){
						// 																if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
						// 																	console.log("same");
						// 																	if(college.type == 'college'){
						// 																		console.log("college");
						// 																		collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
						// 																	}else if(college.type == 'department'){
						// 																		console.log("department");
						// 																		collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
						// 																	}
						// 																}
						// 																console.log("collegeData inside college == " + JSON.stringify(collegeData))
						// 															})
						// 														})
						// 														instructionId += instruction.id +','
						// 														console.log("collegeData inside == " + JSON.stringify(collegeData))
						// 													})
						// 													setTimeout(()=>{
						// 														console.log("collegeData == " + JSON.stringify(collegeData))
						// 														console.log("----13----");
						// 														var instructionIds = instructionId.split(',');
						// 														console.log("instructionIds == " ,instructionIds)
						// 														instructionIds.pop();
						// 														console.log("instructionIds == " ,instructionIds)
						// 														instructionId = instructionIds.join(',');
						// 														console.log("instructionId == " + instructionId);
						// 														setTimeout(function(){
						// 															console.log("----14----");
						// 															if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 																console.log("----15----");
						// 																models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																	if(MaxReferenceNo[0].maxNumber == null){
						// 																		reference_no = 1001;
						// 																	}else{
						// 																		reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																	}
										
						// 																	models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
						// 																		console.log("----16----");
						// 																		var ref_no = reference_no;
						// 																		self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 																		passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																			if(err) {
						// 																				console.log("----17----");
						// 																				res.json({ 
						// 																					status: 400
						// 																				})
						// 																			}else{
						// 																				console.log("----18----");
						// 																				models.Emailed_Docs.find({
						// 																					where :{
						// 																						app_id:app_id,
						// 																						filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																					}
						// 																				}).then(function(emailDoc){
						// 																					if(!emailDoc){
						// 																						models.Emailed_Docs.create({
						// 																						filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																						doc_type : "InstructionalLetter",
						// 																						category : "InstructionalLetter",
						// 																						user_id: user_id,
						// 																						transcript_id: null,
						// 																						marklist_id : null,
						// 																						app_id:app_id,
						// 																						curriculum_id : null
						// 																						}).then((result)=>{
						// 																						// logger.debug(" result : "+JSON.stringify(result))
						// 																						})
						// 																					}
						// 																				})
						// 																			}
						// 																		})
						// 																	})
						// 																});
						// 															}else{
						// 																console.log("----19----");
						// 																var ref_no = instructionalDetails[0].reference_no;
						// 																self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																	if(err) {
						// 																		console.log("----20----");
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		console.log("----21----");
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				doc_type : "InstructionalLetter",
						// 																				category : "InstructionalLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														},3000); 
						// 													},4000);   
						// 												}else if(instructional_Details.length == 1){
						// 													instruction_letter_length = instruction_letter_length  + 1;
						// 													if(faculty.colleges.length == 1){
						// 														models.College.find ({
						// 															where :{
						// 																id : faculty.colleges[0].collegeId
						// 															}
						// 														}).then(function(college){
						// 															var studentName = prefix + instructional_Details[0].studentName;
						// 															var collegeName ;
						// 															if(college.type == 'college'){
						// 																collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
						// 															}else if(college.type == 'department'){
						// 																collegeName = instructional_Details[0].collegeName + ", ";
						// 															}
						// 															var courseName = instructional_Details[0].courseName;
						// 															var specialization = instructional_Details[0].specialization;
						// 															var passingMonthYear = instructional_Details[0].yearofpassing;
						// 															var duration = converter.toWords(instructional_Details[0].duration);
						// 															var passingClass = instructional_Details[0].division;
						// 															var instruction_medium;
										
						// 															if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 																instruction_medium = "English";
						// 															}else{
						// 																instruction_medium = instructional_Details[0].instruction_medium;
						// 															}
						// 															var education = instructional_Details[0].education;
						// 															setTimeout(()=>{
						// 																if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 																	console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
						// 																	models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																		if(MaxReferenceNo[0].maxNumber == null){
						// 																			reference_no = 1001;
						// 																		}else{
						// 																			reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																		}
						// 																		models.InstructionalDetails.update(
						// 																			{
						// 																				reference_no : reference_no
						// 																			},{
						// 																			where :{
						// 																				id : instructional_Details[0].id
						// 																			}
						// 																		}).then(function(updatedDetails){
						// 																			//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																			var ref_no = reference_no;
						// 																			self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																			passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																				if(err) {
						// 																					res.json({ 
						// 																						status: 400
						// 																					})
						// 																				}else{
						// 																					models.Emailed_Docs.find({
						// 																						where :{
						// 																							app_id:app_id,
						// 																							filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																						}
						// 																					}).then(function(emailDoc){
						// 																						if(!emailDoc){
						// 																							models.Emailed_Docs.create({
						// 																							filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																							doc_type : "InstructionalLetter",
						// 																							category : "InstructionalLetter",
						// 																							user_id: user_id,
						// 																							transcript_id: null,
						// 																							marklist_id : null,
						// 																							app_id:app_id,
						// 																							curriculum_id : null
						// 																							}).then((result)=>{
						// 																							// logger.debug(" result : "+JSON.stringify(result))
						// 																							})
						// 																						}
						// 																					})
						// 																				}
						// 																			})
						// 																		})
						// 																	})
						// 																}else{
						// 																	var ref_no = instructionalDetails[0].reference_no;
						// 																	self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																	passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																		if(err) {
						// 																			res.json({ 
						// 																				status: 400
						// 																			})
						// 																		}else{
						// 																			models.Emailed_Docs.find({
						// 																				where :{
						// 																					app_id:app_id,
						// 																					filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				}
						// 																			}).then(function(emailDoc){
						// 																				if(!emailDoc){
						// 																					models.Emailed_Docs.create({
						// 																					filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																					doc_type : "InstructionalLetter",
						// 																					category : "InstructionalLetter",
						// 																					user_id: user_id,
						// 																					transcript_id: null,
						// 																					marklist_id : null,
						// 																					app_id:app_id,
						// 																					curriculum_id : null
						// 																					}).then((result)=>{
						// 																					// logger.debug(" result : "+JSON.stringify(result))
						// 																					})
						// 																				}
						// 																			})
						// 																		}
						// 																	})
						// 																}
						// 															})
						// 														})
						// 													}
						// 												}
						// 											}
																	
						// 										},1500)
						// 									})
						// 								})
						// 							}
						// 							setTimeout(()=>{
						// 								models.userMarkList.findAll({
						// 									where :{
						// 										type : "Bachelors",
						// 										user_id : application.user_id
						// 									}
						// 								}).then(function(bachelor_Details){
						// 									console.log('----33----')
						// 									var facultyData = [];
						// 									var bachelorDetails = [];
						// 									bachelor_Details.forEach(bachelor =>{
						// 										if(bachelor.app_id != null){
						// 											var app_idArr = bachelor.app_id.split(",");
						// 											app_idArr.forEach(app_id =>{
						// 												if(app_id == application_id){
						// 													bachelorDetails.push(bachelor);
						// 												}
						// 											})
						// 										}
						// 									})
						// 									if(bachelorDetails){
						// 										console.log('----34----')
						// 										bachelorDetails.forEach(bachelor =>{
						// 											var flag = false;
						// 											var college = [];
						// 											if(facultyData.length > 0){
						// 												facultyData.forEach(data=>{
						// 													if(data.faculty == bachelor.faculty){
						// 														flag = true;
						// 														var count = 0;
						// 														data.colleges.forEach(clg=>{
						// 															if(clg.collegeId == bachelor.collegeId){
						// 																count ++;
						// 															}
						// 														})
						// 														if(count <= data.colleges.length){
						// 															if(bachelor.patteren == 'Annual'){
						// 																data.colleges.push({
						// 																	name : bachelor.name,
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 															}else if(bachelor.patteren == 'Semester'){
						// 																switch(bachelor.name){
						// 																	case 'Semester 2' : 
						// 																		data.colleges.push({
						// 																			name : 'First Year',
						// 																			collegeId : bachelor.collegeId
						// 																		})
						// 																		break;
						// 																	case 'Semester 4' :
						// 																		data.colleges.push({
						// 																			name : 'Second Year',
						// 																			collegeId : bachelor.collegeId
						// 																		})
						// 																		break;
						// 																	case 'Semester 6' :
						// 																		data.colleges.push({
						// 																			name : 'Third Year',
						// 																			collegeId : bachelor.collegeId
						// 																		})
						// 																		break;
						// 																	case 'Semester 8' :
						// 																		data.colleges.push({
						// 																			name : 'Fourth Year',
						// 																			collegeId : bachelor.collegeId
						// 																		})
						// 																		break;
						// 																	case 'Semester 10' :
						// 																		data.colleges.push({
						// 																			name : 'Fifth Year',
						// 																			collegeId : bachelor.collegeId
						// 																		})
						// 																		break;
						// 																	default :
						// 																		data.colleges.push({
						// 																			name : '',
						// 																			collegeId : bachelor.collegeId
						// 																		})
										
						// 																}
						// 															}
						// 														}
						// 													}
						// 												})
						// 												if(flag == false){
						// 													var colleges = [];
						// 													if(bachelor.patteren == 'Annual'){
						// 														colleges.push({
						// 															name : bachelor.name,
						// 															collegeId : bachelor.collegeId
						// 														})
						// 													}else if(bachelor.patteren == 'Semester'){
						// 														switch(bachelor.name){
						// 															case 'Semester 2' : 
						// 																colleges.push({
						// 																	name : 'First Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 4' :
						// 																colleges.push({
						// 																	name : 'Second Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 6' :
						// 																colleges.push({
						// 																	name : 'Third Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 8' :
						// 																colleges.push({
						// 																	name : 'Fourth Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 10' :
						// 																colleges.push({
						// 																	name : 'Fifth Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															default :
						// 																colleges.push({
						// 																	name : '',
						// 																	collegeId : bachelor.collegeId
						// 																})
										
						// 														}
						// 													}
																			
						// 													facultyData.push({
						// 														type:bachelor.type,
						// 														faculty : bachelor.faculty,
						// 														colleges : colleges
						// 													})
						// 												}
						// 											}else{
						// 												var colleges = [];
						// 													if(bachelor.patteren == 'Annual'){
						// 														colleges.push({
						// 															name : bachelor.name,
						// 															collegeId : bachelor.collegeId
						// 														})
						// 													}else if(bachelor.patteren == 'Semester'){
						// 														switch(bachelor.name){
						// 															case 'Semester 2' : 
						// 																colleges.push({
						// 																	name : 'First Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 4' :
						// 																colleges.push({
						// 																	name : 'Second Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 6' :
						// 																colleges.push({
						// 																	name : 'Third Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 8' :
						// 																colleges.push({
						// 																	name : 'Fourth Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 10' :
						// 																colleges.push({
						// 																	name : 'Fifth Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															default :
						// 																colleges.push({
						// 																	name : '',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 														}
						// 													}
						// 												facultyData.push({
						// 													type:bachelor.type,
						// 													faculty : bachelor.faculty,
						// 													colleges : colleges
						// 												})
						// 											}
						// 										})
						// 										console.log('----35----')
						// 										facultyData.forEach(faculty=>{
						// 											models.InstructionalDetails.findAll({
						// 												where :{
						// 													userId : application.user_id,
						// 													education : faculty.type + '_' + faculty.faculty
						// 												}
						// 											}).then(function(instructionalDetails){
						// 												var instructional_Details = [];
						// 												instructionalDetails.forEach(instruction =>{
						// 													if(instruction.app_id != null){
						// 														var app_idArr = instruction.app_id.split(",");
						// 														app_idArr.forEach(app_id =>{
						// 															if(app_id == application_id){
						// 																instructional_Details.push(instruction);
						// 															}
						// 														})
						// 													}
						// 												})
																		
						// 												if(instructional_Details.length > 1){
						// 													instruction_letter_length = instruction_letter_length  + 1;
						// 													console.log("----13----");
						// 													var studentName = prefix + instructional_Details[0].studentName;
						// 													var courseName = instructional_Details[0].courseName;
						// 													var specialization = instructional_Details[0].specialization;
						// 													var passingMonthYear = instructional_Details[0].yearofpassing;
						// 													var duration = converter.toWords(instructional_Details[0].duration);
						// 													var passingClass = instructional_Details[0].division;
						// 													var instruction_medium;
						// 													if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 														instruction_medium = "English";
						// 													}else{
						// 														instruction_medium = instructionalDetails[0].instruction_medium;
						// 													}
						// 													var education = instructional_Details[0].education;
																			
						// 													var instructionId = '';
																			
																				
						// 														instructional_Details.forEach(instruction =>{
						// 															console.log(instruction.academicYear);
						// 															faculty.colleges.forEach(singleDetail=>{
						// 																console.log(singleDetail.name);
						// 																models.College.find({
						// 																	where : {
						// 																		id : singleDetail.collegeId
						// 																	}
						// 																}).then(function(college){
						// 																	if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
						// 																		console.log("same");
						// 																		if(college.type == 'college'){
						// 																			console.log("college");
						// 																			collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
						// 																		}else if(college.type == 'department'){
						// 																			console.log("department");
						// 																			collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
						// 																		}
						// 																	}
						// 																	console.log("collegeData inside college == " + JSON.stringify(collegeData))
						// 																})
						// 															})
						// 															instructionId += instruction.id +','
						// 															console.log("collegeData inside == " + JSON.stringify(collegeData))
						// 														})
										
						// 													setTimeout(()=>{
						// 														console.log("collegeData == " + JSON.stringify(collegeData))
						// 														console.log("----13----");
						// 														var instructionIds = instructionId.split(',');
						// 														console.log("instructionIds == " ,instructionIds)
						// 														instructionIds.pop();
						// 														console.log("instructionIds == " ,instructionIds)
						// 														instructionId = instructionIds.join(',');
						// 														console.log("instructionId == " + instructionId);
						// 														setTimeout(function(){
						// 															console.log("----14----");
						// 															if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 																console.log("----15----");
						// 																models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																	if(MaxReferenceNo[0].maxNumber == null){
						// 																		reference_no = 1001;
						// 																	}else{
						// 																		reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																	}
										
						// 																	models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
						// 																		console.log("----16----");
						// 																		var ref_no = reference_no;
						// 																		self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 																		passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																			if(err) {
						// 																				console.log("----17----");
						// 																				res.json({ 
						// 																					status: 400
						// 																				})
						// 																			}else{
						// 																				console.log("----18----");
						// 																				models.Emailed_Docs.find({
						// 																					where :{
						// 																						app_id:app_id,
						// 																						filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																					}
						// 																				}).then(function(emailDoc){
						// 																					if(!emailDoc){
						// 																						models.Emailed_Docs.create({
						// 																						filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																						doc_type : "InstructionalLetter",
						// 																						category : "InstructionalLetter",
						// 																						user_id: user_id,
						// 																						transcript_id: null,
						// 																						marklist_id : null,
						// 																						app_id:app_id,
						// 																						curriculum_id : null
						// 																						}).then((result)=>{
						// 																						// logger.debug(" result : "+JSON.stringify(result))
						// 																						})
						// 																					}
						// 																				})
						// 																			}
						// 																		})
						// 																	})
						// 																});
						// 															}else{
						// 																console.log("----19----");
						// 																var ref_no = instructionalDetails[0].reference_no;
						// 																self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																	if(err) {
						// 																		console.log("----20----");
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		console.log("----21----");
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				doc_type : "InstructionalLetter",
						// 																				category : "InstructionalLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														},3000); 
						// 													},4000);   
						// 												}else if(instructional_Details.length == 1){
						// 													instruction_letter_length = instruction_letter_length  + 1;
						// 													if(faculty.colleges.length == 1){
						// 														models.College.find ({
						// 															where :{
						// 																id : faculty.colleges[0].collegeId
						// 															}
						// 														}).then(function(college){
						// 															var studentName = prefix + instructional_Details[0].studentName;
						// 															var collegeName ;
						// 															if(college.type == 'college'){
						// 																collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
						// 															}else if(college.type == 'department'){
						// 																collegeName = instructional_Details[0].collegeName + ", ";
						// 															}
						// 															var courseName = instructional_Details[0].courseName;
						// 															var specialization = instructional_Details[0].specialization;
						// 															var passingMonthYear = instructional_Details[0].yearofpassing;
						// 															var duration = converter.toWords(instructional_Details[0].duration);
						// 															var passingClass = instructional_Details[0].division;
						// 															var instruction_medium;
										
						// 															if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 																instruction_medium = "English";
						// 															}else{
						// 																instruction_medium = instructional_Details[0].instruction_medium;
						// 															}
						// 															var education = instructional_Details[0].education;
						// 															setTimeout(()=>{
						// 																if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 																	console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
						// 																	models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																		if(MaxReferenceNo[0].maxNumber == null){
						// 																			reference_no = 1001;
						// 																		}else{
						// 																			reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																		}
						// 																		models.InstructionalDetails.update(
						// 																			{
						// 																				reference_no : reference_no
						// 																			},{
						// 																			where :{
						// 																				id : instructional_Details[0].id
						// 																			}
						// 																		}).then(function(updatedDetails){
						// 																			//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																			var ref_no = reference_no;
						// 																			self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																			passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																				if(err) {
						// 																					res.json({ 
						// 																						status: 400
						// 																					})
						// 																				}else{
						// 																					models.Emailed_Docs.find({
						// 																						where :{
						// 																							app_id:app_id,
						// 																							filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																						}
						// 																					}).then(function(emailDoc){
						// 																						if(!emailDoc){
						// 																							models.Emailed_Docs.create({
						// 																							filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																							doc_type : "InstructionalLetter",
						// 																							category : "InstructionalLetter",
						// 																							user_id: user_id,
						// 																							transcript_id: null,
						// 																							marklist_id : null,
						// 																							app_id:app_id,
						// 																							curriculum_id : null
						// 																							}).then((result)=>{
						// 																							// logger.debug(" result : "+JSON.stringify(result))
						// 																							})
						// 																						}
						// 																					})
						// 																				}
						// 																			})
						// 																		})
						// 																	})
						// 																}else{
						// 																	var ref_no = instructionalDetails[0].reference_no;
						// 																	self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																	passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																		if(err) {
						// 																			res.json({ 
						// 																				status: 400
						// 																			})
						// 																		}else{
						// 																			models.Emailed_Docs.find({
						// 																				where :{
						// 																					app_id:app_id,
						// 																					filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				}
						// 																			}).then(function(emailDoc){
						// 																				if(!emailDoc){
						// 																					models.Emailed_Docs.create({
						// 																					filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																					doc_type : "InstructionalLetter",
						// 																					category : "InstructionalLetter",
						// 																					user_id: user_id,
						// 																					transcript_id: null,
						// 																					marklist_id : null,
						// 																					app_id:app_id,
						// 																					curriculum_id : null
						// 																					}).then((result)=>{
						// 																					// logger.debug(" result : "+JSON.stringify(result))
						// 																					})
						// 																				}
						// 																			})
						// 																		}
						// 																	})
						// 																}
						// 															})
						// 														})
						// 													}
						// 												}
						// 											})
						// 										})
						// 									}
						// 								})
						// 							},3000)
						// 						}
						// 					})
						// 				}else if(appliedDetails.applying_for == 'Bachelors'){
						// 					console.log("----6----");
						// 					var bachelorDetails = [];
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Bachelors",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(bachelor_Details){
						// 						console.log("----7----");
						// 						bachelor_Details.forEach(bachelor =>{
						// 							if(bachelor.app_id != null){
						// 								var app_idArr = bachelor.app_id.split(",");
						// 								app_idArr.forEach(app_id =>{
						// 									if(app_id == application_id){
						// 										bachelorDetails.push(bachelor);
						// 									}
						// 								})
						// 							}
						// 						})
						// 						console.log("----8----");
						// 						if(bachelorDetails){
						// 							console.log("----9----");
						// 							var facultyData = [];
					
						// 							bachelorDetails.forEach(bachelor =>{
						// 								var flag = false;
						// 								var college = {};
						// 								if(bachelor.patteren == 'Annual'){
						// 									college.name = bachelor.name,
						// 									college.collegeId = bachelor.collegeId
															
						// 								}else if(bachelor.patteren == 'Semester'){
						// 									switch(bachelor.name){
						// 										case 'Semester 2' : 
						// 											college.name = 'First Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 4' :
						// 											college.name = 'Second Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 6' :
						// 											college.name = 'Third Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 8' :
						// 											college.name = 'Fourth Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 10' :
						// 											college.name = 'Fifth Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										// default :
						// 										//     college.push({
						// 										//         name : '',
						// 										//         collegeId : bachelor.collegeId
						// 										//     })
						// 										default :
						// 												college.name = '',
						// 												college.collegeId = bachelor.collegeId
						// 									}
						// 								}
															
						// 								if(facultyData.length > 0){
						// 									facultyData.forEach(data=>{
						// 										if(data.faculty == bachelor.faculty){
						// 											flag = true;
						// 											var count = 0;
						// 											data.colleges.forEach(clg=>{
						// 												if(clg.collegeId == bachelor.collegeId){
						// 													count ++;
						// 												}
						// 											})
						// 											if(count < data.colleges.length){
						// 												data.colleges.push(college);
						// 											}
						// 										}
						// 									})
						// 									if(flag == false){
						// 										var colleges = [];
						// 									colleges.push(college);
																
						// 										facultyData.push({
						// 											type:bachelor.type,
						// 											faculty : bachelor.faculty,
						// 											colleges : colleges
						// 										})
						// 									}
						// 								}else{
						// 									var colleges = [];
						// 									colleges.push(college);
						// 								facultyData.push({
						// 										type:bachelor.type,
						// 										faculty : bachelor.faculty,
						// 										colleges : colleges
						// 									})
						// 								}
						// 							})
						// 							console.log("----10----");
						// 							console.log("facultyData == "+ JSON.stringify(facultyData));
						// 							facultyData.forEach(faculty=>{
						// 								models.InstructionalDetails.findAll({
						// 									where :{
						// 										userId : application.user_id,
						// 										education : faculty.type + '_' + faculty.faculty
						// 									}
						// 								}).then(function(instructionalDetails){
						// 									console.log("----11----");
						// 									// console.log("instructionalDetails == " + JSON.stringify(instructionalDetails))
						// 									var instructional_Details = [];
						// 									instructionalDetails.forEach(instruction =>{
						// 										if(instruction.app_id != null){
						// 											var app_idArr = instruction.app_id.split(",");
						// 											app_idArr.forEach(app_id =>{
						// 												if(app_id == application_id){
						// 													instructional_Details.push(instruction);
						// 												}
						// 											})
						// 										}
						// 									})
						// 									console.log("----12----");
						// 									console.log("instructional_Details == " + JSON.stringify(instructional_Details))
						// 									console.log("current_year == " + appliedDetails.current_year);
						// 									if(appliedDetails.current_year == true){
						// 										console.log("----13 test ----");
						// 										instruction_letter_length = instruction_letter_length  + 1;
						// 										// if(faculty.colleges.length == 1){
						// 											models.College.find ({
						// 												where :{
						// 													id : faculty.colleges[0].collegeId
						// 												}
						// 											}).then(function(college){
						// 												var studentName = prefix + instructional_Details[0].studentName;
						// 												var collegeName ;
						// 												if(college.type == 'college'){
						// 													collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
						// 												}else if(college.type == 'department'){
						// 													collegeName = instructional_Details[0].collegeName + ", ";
						// 												}
						// 												var courseName = instructional_Details[0].courseName;
						// 												var specialization = instructional_Details[0].specialization;
						// 												var passingMonthYear = instructional_Details[0].yearofpassing;
						// 												var duration = converter.toWords(instructional_Details[0].duration);
						// 												var passingClass = instructional_Details[0].division;
						// 												var instruction_medium;
				
						// 												if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 													instruction_medium = "English";
						// 												}else{
						// 													instruction_medium = instructional_Details[0].instruction_medium;
						// 												}
						// 												var education = instructional_Details[0].education;
						// 												setTimeout(()=>{
						// 													if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 														console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
						// 														models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 															if(MaxReferenceNo[0].maxNumber == null){
						// 																reference_no = 1001;
						// 															}else{
						// 																reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 															}
						// 															models.InstructionalDetails.update(
						// 																{
						// 																	reference_no : reference_no
						// 																},{
						// 																where :{
						// 																	id : instructional_Details[0].id
						// 																}
						// 															}).then(function(updatedDetails){
						// 																//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																var ref_no = reference_no;
						// 																self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																	if(err) {
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				doc_type : "InstructionalLetter",
						// 																				category : "InstructionalLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															})
						// 														})
						// 													}else{
						// 														var ref_no = instructionalDetails[0].reference_no;
						// 														self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 														passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 															if(err) {
						// 																res.json({ 
						// 																	status: 400
						// 																})
						// 															}else{
						// 																models.Emailed_Docs.find({
						// 																	where :{
						// 																		app_id:app_id,
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																	}
						// 																}).then(function(emailDoc){
						// 																	if(!emailDoc){
						// 																		models.Emailed_Docs.create({
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																		doc_type : "InstructionalLetter",
						// 																		category : "InstructionalLetter",
						// 																		user_id: user_id,
						// 																		transcript_id: null,
						// 																		marklist_id : null,
						// 																		app_id:app_id,
						// 																		curriculum_id : null
						// 																		}).then((result)=>{
						// 																		// logger.debug(" result : "+JSON.stringify(result))
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														})
						// 													}
						// 												})
						// 											})
						// 										// } 
																
						// 									}else{
						// 										if(instructional_Details.length > 1){
						// 											console.log("----13----");
						// 											instruction_letter_length = instruction_letter_length  + 1;
						// 											var studentName = prefix + instructional_Details[0].studentName;
						// 											var courseName = instructional_Details[0].courseName;
						// 											var specialization = instructional_Details[0].specialization;
						// 											var passingMonthYear = instructional_Details[0].yearofpassing;
						// 											var duration = converter.toWords(instructional_Details[0].duration);
						// 											var passingClass = instructional_Details[0].division;
						// 											var instruction_medium;
						// 											if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 												instruction_medium = "English";
						// 											}else{
						// 												instruction_medium = instructionalDetails[0].instruction_medium;
						// 											}
						// 											var education = instructional_Details[0].education;
																	
						// 											var instructionId = '';
																	
																		
						// 											instructional_Details.forEach(instruction =>{
						// 												console.log(instruction.academicYear);
						// 												faculty.colleges.forEach(singleDetail=>{
						// 													console.log(singleDetail.name);
						// 													models.College.find({
						// 														where : {
						// 															id : singleDetail.collegeId
						// 														}
						// 													}).then(function(college){
						// 														if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
						// 															console.log("same");
						// 															if(college.type == 'college'){
						// 																console.log("college");
						// 																collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
						// 															}else if(college.type == 'department'){
						// 																console.log("department");
						// 																collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
						// 															}
						// 														}
						// 														console.log("collegeData inside college == " + JSON.stringify(collegeData))
						// 													})
						// 												})
						// 												instructionId += instruction.id +','
						// 												console.log("collegeData inside == " + JSON.stringify(collegeData))
						// 											})
					
						// 											setTimeout(()=>{
						// 												console.log("collegeData == " + JSON.stringify(collegeData))
						// 												console.log("----13----");
						// 												var instructionIds = instructionId.split(',');
						// 												console.log("instructionIds == " ,instructionIds)
						// 												instructionIds.pop();
						// 												console.log("instructionIds == " ,instructionIds)
						// 												instructionId = instructionIds.join(',');
						// 												console.log("instructionId == " + instructionId);
						// 												setTimeout(function(){
						// 													console.log("----14----");
						// 													if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 														console.log("----15----");
						// 														models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 															if(MaxReferenceNo[0].maxNumber == null){
						// 																reference_no = 1001;
						// 															}else{
						// 																reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 															}
					
						// 															models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
						// 																console.log("----16----");
						// 																var ref_no = reference_no;
						// 																self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																	if(err) {
						// 																		console.log("----17----");
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		console.log("----18----");
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				doc_type : "InstructionalLetter",
						// 																				category : "InstructionalLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															})
						// 														});
						// 													}else{
						// 														console.log("----19----");
						// 														var ref_no = instructionalDetails[0].reference_no;
						// 														self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 														passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 															if(err) {
						// 																console.log("----20----");
						// 																res.json({ 
						// 																	status: 400
						// 																})
						// 															}else{
						// 																console.log("----21----");
						// 																models.Emailed_Docs.find({
						// 																	where :{
						// 																		app_id:app_id,
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																	}
						// 																}).then(function(emailDoc){
						// 																	if(!emailDoc){
						// 																		models.Emailed_Docs.create({
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																		doc_type : "InstructionalLetter",
						// 																		category : "InstructionalLetter",
						// 																		user_id: user_id,
						// 																		transcript_id: null,
						// 																		marklist_id : null,
						// 																		app_id:app_id,
						// 																		curriculum_id : null
						// 																		}).then((result)=>{
						// 																		// logger.debug(" result : "+JSON.stringify(result))
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														})
						// 													}
						// 												},3000); 
						// 											},4000);   
						// 										}else if(instructional_Details.length == 1){
						// 											instruction_letter_length = instruction_letter_length  + 1;
						// 											if(faculty.colleges.length == 1){
						// 												models.College.find ({
						// 													where :{
						// 														id : faculty.colleges[0].collegeId
						// 													}
						// 												}).then(function(college){
						// 													var studentName = prefix + instructional_Details[0].studentName;
						// 													var collegeName ;
						// 													if(college.type == 'college'){
						// 														collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
						// 													}else if(college.type == 'department'){
						// 														collegeName = instructional_Details[0].collegeName + ", ";
						// 													}
						// 													var courseName = instructional_Details[0].courseName;
						// 													var specialization = instructional_Details[0].specialization;
						// 													var passingMonthYear = instructional_Details[0].yearofpassing;
						// 													var duration = converter.toWords(instructional_Details[0].duration);
						// 													var passingClass = instructional_Details[0].division;
						// 													var instruction_medium;
					
						// 													if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 														instruction_medium = "English";
						// 													}else{
						// 														instruction_medium = instructional_Details[0].instruction_medium;
						// 													}
						// 													var education = instructional_Details[0].education;
						// 													setTimeout(()=>{
						// 														if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 															console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
						// 															models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																if(MaxReferenceNo[0].maxNumber == null){
						// 																	reference_no = 1001;
						// 																}else{
						// 																	reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																}
						// 																models.InstructionalDetails.update(
						// 																	{
						// 																		reference_no : reference_no
						// 																	},{
						// 																	where :{
						// 																		id : instructional_Details[0].id
						// 																	}
						// 																}).then(function(updatedDetails){
						// 																	//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																	var ref_no = reference_no;
						// 																	self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																	passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																		if(err) {
						// 																			res.json({ 
						// 																				status: 400
						// 																			})
						// 																		}else{
						// 																			models.Emailed_Docs.find({
						// 																				where :{
						// 																					app_id:app_id,
						// 																					filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				}
						// 																			}).then(function(emailDoc){
						// 																				if(!emailDoc){
						// 																					models.Emailed_Docs.create({
						// 																					filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																					doc_type : "InstructionalLetter",
						// 																					category : "InstructionalLetter",
						// 																					user_id: user_id,
						// 																					transcript_id: null,
						// 																					marklist_id : null,
						// 																					app_id:app_id,
						// 																					curriculum_id : null
						// 																					}).then((result)=>{
						// 																					// logger.debug(" result : "+JSON.stringify(result))
						// 																					})
						// 																				}
						// 																			})
						// 																		}
						// 																	})
						// 																})
						// 															})
						// 														}else{
						// 															var ref_no = instructionalDetails[0].reference_no;
						// 															self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 															passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																if(err) {
						// 																	res.json({ 
						// 																		status: 400
						// 																	})
						// 																}else{
						// 																	models.Emailed_Docs.find({
						// 																		where :{
						// 																			app_id:app_id,
						// 																			filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																		}
						// 																	}).then(function(emailDoc){
						// 																		if(!emailDoc){
						// 																			models.Emailed_Docs.create({
						// 																			filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																			doc_type : "InstructionalLetter",
						// 																			category : "InstructionalLetter",
						// 																			user_id: user_id,
						// 																			transcript_id: null,
						// 																			marklist_id : null,
						// 																			app_id:app_id,
						// 																			curriculum_id : null
						// 																			}).then((result)=>{
						// 																			// logger.debug(" result : "+JSON.stringify(result))
						// 																			})
						// 																		}
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													})
						// 												})
						// 											}
						// 										}
						// 									}
						// 								})
						// 							})
						// 						}
						// 					})
						// 				}else if(appliedDetails.applying_for == 'Masters'){
						// 					console.log("----6----");
						// 					var bachelorDetails = [];
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Masters",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(bachelor_Details){
						// 						console.log("----7----");
						// 						bachelor_Details.forEach(bachelor =>{
						// 							if(bachelor.app_id != null){
						// 								var app_idArr = bachelor.app_id.split(",");
						// 								app_idArr.forEach(app_id =>{
						// 									if(app_id == application_id){
						// 										bachelorDetails.push(bachelor);
						// 									}
						// 								})
						// 							}
						// 						})
						// 						console.log("----8----");
						// 						if(bachelorDetails){
						// 							console.log("----9----");
						// 							var facultyData = [];
					
						// 							bachelorDetails.forEach(bachelor =>{
						// 								var flag = false;
						// 								var college = {};
						// 								if(bachelor.patteren == 'Annual'){
						// 									college.name = bachelor.name,
						// 									college.collegeId = bachelor.collegeId
															
						// 								}else if(bachelor.patteren == 'Semester'){
						// 									switch(bachelor.name){
						// 										case 'Semester 2' : 
						// 											college.name = 'First Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 4' :
						// 											college.name = 'Second Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 6' :
						// 											college.name = 'Third Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 8' :
						// 											college.name = 'Fourth Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 10' :
						// 											college.name = 'Fifth Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										// default :
						// 										//     college.push({
						// 										//         name : '',
						// 										//         collegeId : bachelor.collegeId
						// 										//     })
						// 										default :
						// 												college.name = '',
						// 												college.collegeId = bachelor.collegeId
						// 									}
						// 								}
															
						// 								if(facultyData.length > 0){
						// 									facultyData.forEach(data=>{
						// 										if(data.faculty == bachelor.faculty){
						// 											flag = true;
						// 											var count = 0;
						// 											data.colleges.forEach(clg=>{
						// 												if(clg.collegeId == bachelor.collegeId){
						// 													count ++;
						// 												}
						// 											})
						// 											if(count < data.colleges.length){
						// 												data.colleges.push(college);
						// 											}
						// 										}
						// 									})
						// 									if(flag == false){
						// 										var colleges = [];
						// 									colleges.push(college);
																
						// 										facultyData.push({
						// 											type:bachelor.type,
						// 											faculty : bachelor.faculty,
						// 											colleges : colleges
						// 										})
						// 									}
						// 								}else{
						// 									var colleges = [];
						// 									colleges.push(college);
						// 								facultyData.push({
						// 										type:bachelor.type,
						// 										faculty : bachelor.faculty,
						// 										colleges : colleges
						// 									})
						// 								}
						// 							})
						// 							console.log("----10----");
						// 							console.log("facultyData == "+ JSON.stringify(facultyData));
						// 							facultyData.forEach(faculty=>{
						// 								models.InstructionalDetails.findAll({
						// 									where :{
						// 										userId : application.user_id,
						// 										education : faculty.type + '_' + faculty.faculty
						// 									}
						// 								}).then(function(instructionalDetails){
						// 									console.log("----11----");
						// 									// console.log("instructionalDetails == " + JSON.stringify(instructionalDetails))
						// 									var instructional_Details = [];
						// 									instructionalDetails.forEach(instruction =>{
						// 										if(instruction.app_id != null){
						// 											var app_idArr = instruction.app_id.split(",");
						// 											app_idArr.forEach(app_id =>{
						// 												if(app_id == application_id){
						// 													instructional_Details.push(instruction);
						// 												}
						// 											})
						// 										}
						// 									})
						// 									console.log("----12----");
						// 									console.log("instructional_Details == " + JSON.stringify(instructional_Details))
						// 									console.log("current_year == " + appliedDetails.current_year);
						// 									if(appliedDetails.current_year == true){
						// 										console.log("----13 test ----");
						// 										instruction_letter_length = instruction_letter_length  + 1;
						// 										// if(faculty.colleges.length == 1){
						// 											models.College.find ({
						// 												where :{
						// 													id : faculty.colleges[0].collegeId
						// 												}
						// 											}).then(function(college){
						// 												var studentName = prefix + instructional_Details[0].studentName;
						// 												var collegeName ;
						// 												if(college.type == 'college'){
						// 													collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
						// 												}else if(college.type == 'department'){
						// 													collegeName = instructional_Details[0].collegeName + ", ";
						// 												}
						// 												var courseName = instructional_Details[0].courseName;
						// 												var specialization = instructional_Details[0].specialization;
						// 												var passingMonthYear = instructional_Details[0].yearofpassing;
						// 												var duration = converter.toWords(instructional_Details[0].duration);
						// 												var passingClass = instructional_Details[0].division;
						// 												var instruction_medium;
				
						// 												if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 													instruction_medium = "English";
						// 												}else{
						// 													instruction_medium = instructional_Details[0].instruction_medium;
						// 												}
						// 												var education = instructional_Details[0].education;
						// 												setTimeout(()=>{
						// 													if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 														console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
						// 														models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 															if(MaxReferenceNo[0].maxNumber == null){
						// 																reference_no = 1001;
						// 															}else{
						// 																reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 															}
						// 															models.InstructionalDetails.update(
						// 																{
						// 																	reference_no : reference_no
						// 																},{
						// 																where :{
						// 																	id : instructional_Details[0].id
						// 																}
						// 															}).then(function(updatedDetails){
						// 																//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																var ref_no = reference_no;
						// 																self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																	if(err) {
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				doc_type : "InstructionalLetter",
						// 																				category : "InstructionalLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															})
						// 														})
						// 													}else{
						// 														var ref_no = instructionalDetails[0].reference_no;
						// 														self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 														passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 															if(err) {
						// 																res.json({ 
						// 																	status: 400
						// 																})
						// 															}else{
						// 																models.Emailed_Docs.find({
						// 																	where :{
						// 																		app_id:app_id,
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																	}
						// 																}).then(function(emailDoc){
						// 																	if(!emailDoc){
						// 																		models.Emailed_Docs.create({
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																		doc_type : "InstructionalLetter",
						// 																		category : "InstructionalLetter",
						// 																		user_id: user_id,
						// 																		transcript_id: null,
						// 																		marklist_id : null,
						// 																		app_id:app_id,
						// 																		curriculum_id : null
						// 																		}).then((result)=>{
						// 																		// logger.debug(" result : "+JSON.stringify(result))
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														})
						// 													}
						// 												})
						// 											})
						// 										// } 
																
						// 									}else{
						// 										if(instructional_Details.length > 1){
						// 											console.log("----13----");
						// 											instruction_letter_length = instruction_letter_length  + 1;
						// 											var studentName = prefix + instructional_Details[0].studentName;
						// 											var courseName = instructional_Details[0].courseName;
						// 											var specialization = instructional_Details[0].specialization;
						// 											var passingMonthYear = instructional_Details[0].yearofpassing;
						// 											var duration = converter.toWords(instructional_Details[0].duration);
						// 											var passingClass = instructional_Details[0].division;
						// 											var instruction_medium;
						// 											if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 												instruction_medium = "English";
						// 											}else{
						// 												instruction_medium = instructionalDetails[0].instruction_medium;
						// 											}
						// 											var education = instructional_Details[0].education;
																	
						// 											var instructionId = '';
																	
																		
						// 											instructional_Details.forEach(instruction =>{
						// 												console.log(instruction.academicYear);
						// 												faculty.colleges.forEach(singleDetail=>{
						// 													console.log(singleDetail.name);
						// 													models.College.find({
						// 														where : {
						// 															id : singleDetail.collegeId
						// 														}
						// 													}).then(function(college){
						// 														if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
						// 															console.log("same");
						// 															if(college.type == 'college'){
						// 																console.log("college");
						// 																collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
						// 															}else if(college.type == 'department'){
						// 																console.log("department");
						// 																collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
						// 															}
						// 														}
						// 														console.log("collegeData inside college == " + JSON.stringify(collegeData))
						// 													})
						// 												})
						// 												instructionId += instruction.id +','
						// 												console.log("collegeData inside == " + JSON.stringify(collegeData))
						// 											})
					
						// 											setTimeout(()=>{
						// 												console.log("collegeData == " + JSON.stringify(collegeData))
						// 												console.log("----13----");
						// 												var instructionIds = instructionId.split(',');
						// 												console.log("instructionIds == " ,instructionIds)
						// 												instructionIds.pop();
						// 												console.log("instructionIds == " ,instructionIds)
						// 												instructionId = instructionIds.join(',');
						// 												console.log("instructionId == " + instructionId);
						// 												setTimeout(function(){
						// 													console.log("----14----");
						// 													if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 														console.log("----15----");
						// 														models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 															if(MaxReferenceNo[0].maxNumber == null){
						// 																reference_no = 1001;
						// 															}else{
						// 																reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 															}
					
						// 															models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
						// 																console.log("----16----");
						// 																var ref_no = reference_no;
						// 																self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																	if(err) {
						// 																		console.log("----17----");
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		console.log("----18----");
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				doc_type : "InstructionalLetter",
						// 																				category : "InstructionalLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															})
						// 														});
						// 													}else{
						// 														console.log("----19----");
						// 														var ref_no = instructionalDetails[0].reference_no;
						// 														self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 														passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 															if(err) {
						// 																console.log("----20----");
						// 																res.json({ 
						// 																	status: 400
						// 																})
						// 															}else{
						// 																console.log("----21----");
						// 																models.Emailed_Docs.find({
						// 																	where :{
						// 																		app_id:app_id,
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																	}
						// 																}).then(function(emailDoc){
						// 																	if(!emailDoc){
						// 																		models.Emailed_Docs.create({
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																		doc_type : "InstructionalLetter",
						// 																		category : "InstructionalLetter",
						// 																		user_id: user_id,
						// 																		transcript_id: null,
						// 																		marklist_id : null,
						// 																		app_id:app_id,
						// 																		curriculum_id : null
						// 																		}).then((result)=>{
						// 																		// logger.debug(" result : "+JSON.stringify(result))
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														})
						// 													}
						// 												},3000); 
						// 											},4000);   
						// 										}else if(instructional_Details.length == 1){
						// 											instruction_letter_length = instruction_letter_length  + 1;
						// 											if(faculty.colleges.length == 1){
						// 												models.College.find ({
						// 													where :{
						// 														id : faculty.colleges[0].collegeId
						// 													}
						// 												}).then(function(college){
						// 													var studentName = prefix + instructional_Details[0].studentName;
						// 													var collegeName ;
						// 													if(college.type == 'college'){
						// 														collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
						// 													}else if(college.type == 'department'){
						// 														collegeName = instructional_Details[0].collegeName + ", ";
						// 													}
						// 													var courseName = instructional_Details[0].courseName;
						// 													var specialization = instructional_Details[0].specialization;
						// 													var passingMonthYear = instructional_Details[0].yearofpassing;
						// 													var duration = converter.toWords(instructional_Details[0].duration);
						// 													var passingClass = instructional_Details[0].division;
						// 													var instruction_medium;
					
						// 													if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 														instruction_medium = "English";
						// 													}else{
						// 														instruction_medium = instructional_Details[0].instruction_medium;
						// 													}
						// 													var education = instructional_Details[0].education;
						// 													setTimeout(()=>{
						// 														if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 															console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
						// 															models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																if(MaxReferenceNo[0].maxNumber == null){
						// 																	reference_no = 1001;
						// 																}else{
						// 																	reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																}
						// 																models.InstructionalDetails.update(
						// 																	{
						// 																		reference_no : reference_no
						// 																	},{
						// 																	where :{
						// 																		id : instructional_Details[0].id
						// 																	}
						// 																}).then(function(updatedDetails){
						// 																	//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																	var ref_no = reference_no;
						// 																	self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																	passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																		if(err) {
						// 																			res.json({ 
						// 																				status: 400
						// 																			})
						// 																		}else{
						// 																			models.Emailed_Docs.find({
						// 																				where :{
						// 																					app_id:app_id,
						// 																					filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				}
						// 																			}).then(function(emailDoc){
						// 																				if(!emailDoc){
						// 																					models.Emailed_Docs.create({
						// 																					filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																					doc_type : "InstructionalLetter",
						// 																					category : "InstructionalLetter",
						// 																					user_id: user_id,
						// 																					transcript_id: null,
						// 																					marklist_id : null,
						// 																					app_id:app_id,
						// 																					curriculum_id : null
						// 																					}).then((result)=>{
						// 																					// logger.debug(" result : "+JSON.stringify(result))
						// 																					})
						// 																				}
						// 																			})
						// 																		}
						// 																	})
						// 																})
						// 															})
						// 														}else{
						// 															var ref_no = instructionalDetails[0].reference_no;
						// 															self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 															passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																if(err) {
						// 																	res.json({ 
						// 																		status: 400
						// 																	})
						// 																}else{
						// 																	models.Emailed_Docs.find({
						// 																		where :{
						// 																			app_id:app_id,
						// 																			filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																		}
						// 																	}).then(function(emailDoc){
						// 																		if(!emailDoc){
						// 																			models.Emailed_Docs.create({
						// 																			filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																			doc_type : "InstructionalLetter",
						// 																			category : "InstructionalLetter",
						// 																			user_id: user_id,
						// 																			transcript_id: null,
						// 																			marklist_id : null,
						// 																			app_id:app_id,
						// 																			curriculum_id : null
						// 																			}).then((result)=>{
						// 																			// logger.debug(" result : "+JSON.stringify(result))
						// 																			})
						// 																		}
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													})
						// 												})
						// 											}
						// 										}
						// 									}
						// 								})
						// 							})
						// 						}
						// 					})
						// 				}else if(appliedDetails.applying_for == 'Phd,Masters,Bachelors'){
						// 					console.log("----6----");
						// 					var bachelorDetails = [];
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Phd",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(bachelor_Details){
						// 						console.log("----7----");
						// 						bachelor_Details.forEach(bachelor =>{
						// 							if(bachelor.app_id != null){
						// 								var app_idArr = bachelor.app_id.split(",");
						// 								app_idArr.forEach(app_id =>{
						// 									if(app_id == application_id){
						// 										bachelorDetails.push(bachelor);
						// 									}
						// 								})
						// 							}
						// 						})
						// 						console.log("----8----");
						// 						if(bachelorDetails){
						// 							console.log("----9----");
						// 							var facultyData = [];
					
						// 							bachelorDetails.forEach(bachelor =>{
						// 								var flag = false;
						// 								var college = {};
						// 								if(bachelor.patteren == 'Annual'){
						// 									college.name = bachelor.name,
						// 									college.collegeId = bachelor.collegeId
															
						// 								}else if(bachelor.patteren == 'Semester'){
						// 									switch(bachelor.name){
						// 										case 'Semester 2' : 
						// 											college.name = 'First Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 4' :
						// 											college.name = 'Second Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 6' :
						// 											college.name = 'Third Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 8' :
						// 											college.name = 'Fourth Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										case 'Semester 10' :
						// 											college.name = 'Fifth Year',
						// 											college.collegeId = bachelor.collegeId
						// 											break;
						// 										// default :
						// 										//     college.push({
						// 										//         name : '',
						// 										//         collegeId : bachelor.collegeId
						// 										//     })
						// 										default :
						// 												college.name = '',
						// 												college.collegeId = bachelor.collegeId
						// 									}
						// 								}
															
						// 								if(facultyData.length > 0){
						// 									facultyData.forEach(data=>{
						// 										if(data.faculty == bachelor.faculty){
						// 											flag = true;
						// 											var count = 0;
						// 											data.colleges.forEach(clg=>{
						// 												if(clg.collegeId == bachelor.collegeId){
						// 													count ++;
						// 												}
						// 											})
						// 											if(count < data.colleges.length){
						// 												data.colleges.push(college);
						// 											}
						// 										}
						// 									})
						// 									if(flag == false){
						// 										var colleges = [];
						// 									colleges.push(college);
																
						// 										facultyData.push({
						// 											type:bachelor.type,
						// 											faculty : bachelor.faculty,
						// 											colleges : colleges
						// 										})
						// 									}
						// 								}else{
						// 									var colleges = [];
						// 									colleges.push(college);
						// 								facultyData.push({
						// 										type:bachelor.type,
						// 										faculty : bachelor.faculty,
						// 										colleges : colleges
						// 									})
						// 								}
						// 							})
						// 							console.log("----10----");
						// 							console.log("facultyData == "+ JSON.stringify(facultyData));
						// 							facultyData.forEach(faculty=>{
						// 								models.InstructionalDetails.findAll({
						// 									where :{
						// 										userId : application.user_id,
						// 										education : faculty.type + '_' + faculty.faculty
						// 									}
						// 								}).then(function(instructionalDetails){
						// 									console.log("----11----");
						// 									// console.log("instructionalDetails == " + JSON.stringify(instructionalDetails))
						// 									var instructional_Details = [];
						// 									instructionalDetails.forEach(instruction =>{
						// 										if(instruction.app_id != null){
						// 											var app_idArr = instruction.app_id.split(",");
						// 											app_idArr.forEach(app_id =>{
						// 												if(app_id == application_id){
						// 													instructional_Details.push(instruction);
						// 												}
						// 											})
						// 										}
						// 									})
						// 									console.log("----12----");
						// 									console.log("instructional_Details == " + JSON.stringify(instructional_Details))
						// 									console.log("current_year == " + appliedDetails.current_year);
						// 									if(appliedDetails.current_year == true){
						// 										console.log("----13 test ----");
						// 										instruction_letter_length = instruction_letter_length  + 1;
						// 										// if(faculty.colleges.length == 1){
						// 											models.College.find ({
						// 												where :{
						// 													id : faculty.colleges[0].collegeId
						// 												}
						// 											}).then(function(college){
						// 												var studentName = prefix + instructional_Details[0].studentName;
						// 												var collegeName ;
						// 												if(college.type == 'college'){
						// 													collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
						// 												}else if(college.type == 'department'){
						// 													collegeName = instructional_Details[0].collegeName + ", ";
						// 												}
						// 												var courseName = instructional_Details[0].courseName;
						// 												var specialization = instructional_Details[0].specialization;
						// 												var passingMonthYear = instructional_Details[0].yearofpassing;
						// 												var duration = converter.toWords(instructional_Details[0].duration);
						// 												var passingClass = instructional_Details[0].division;
						// 												var instruction_medium;
				
						// 												if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 													instruction_medium = "English";
						// 												}else{
						// 													instruction_medium = instructional_Details[0].instruction_medium;
						// 												}
						// 												var education = instructional_Details[0].education;
						// 												setTimeout(()=>{
						// 													if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 														console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
						// 														models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 															if(MaxReferenceNo[0].maxNumber == null){
						// 																reference_no = 1001;
						// 															}else{
						// 																reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 															}
						// 															models.InstructionalDetails.update(
						// 																{
						// 																	reference_no : reference_no
						// 																},{
						// 																where :{
						// 																	id : instructional_Details[0].id
						// 																}
						// 															}).then(function(updatedDetails){
						// 																//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																var ref_no = reference_no;
						// 																self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																	if(err) {
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				doc_type : "InstructionalLetter",
						// 																				category : "InstructionalLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															})
						// 														})
						// 													}else{
						// 														var ref_no = instructionalDetails[0].reference_no;
						// 														self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 														passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 															if(err) {
						// 																res.json({ 
						// 																	status: 400
						// 																})
						// 															}else{
						// 																models.Emailed_Docs.find({
						// 																	where :{
						// 																		app_id:app_id,
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																	}
						// 																}).then(function(emailDoc){
						// 																	if(!emailDoc){
						// 																		models.Emailed_Docs.create({
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																		doc_type : "InstructionalLetter",
						// 																		category : "InstructionalLetter",
						// 																		user_id: user_id,
						// 																		transcript_id: null,
						// 																		marklist_id : null,
						// 																		app_id:app_id,
						// 																		curriculum_id : null
						// 																		}).then((result)=>{
						// 																		// logger.debug(" result : "+JSON.stringify(result))
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														})
						// 													}
						// 												})
						// 											})
						// 										// } 
																
						// 									}else{
						// 										if(instructional_Details.length > 1){
						// 											console.log("----13----");
						// 											instruction_letter_length = instruction_letter_length  + 1;
						// 											var studentName = prefix + instructional_Details[0].studentName;
						// 											var courseName = instructional_Details[0].courseName;
						// 											var specialization = instructional_Details[0].specialization;
						// 											var passingMonthYear = instructional_Details[0].yearofpassing;
						// 											var duration = converter.toWords(instructional_Details[0].duration);
						// 											var passingClass = instructional_Details[0].division;
						// 											var instruction_medium;
						// 											if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 												instruction_medium = "English";
						// 											}else{
						// 												instruction_medium = instructionalDetails[0].instruction_medium;
						// 											}
						// 											var education = instructional_Details[0].education;
																	
						// 											var instructionId = '';
																	
																		
						// 											instructional_Details.forEach(instruction =>{
						// 												console.log(instruction.academicYear);
						// 												faculty.colleges.forEach(singleDetail=>{
						// 													console.log(singleDetail.name);
						// 													models.College.find({
						// 														where : {
						// 															id : singleDetail.collegeId
						// 														}
						// 													}).then(function(college){
						// 														if(instruction.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
						// 															console.log("same");
						// 															if(college.type == 'college'){
						// 																console.log("college");
						// 																collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
						// 															}else if(college.type == 'department'){
						// 																console.log("department");
						// 																collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
						// 															}
						// 														}
						// 														console.log("collegeData inside college == " + JSON.stringify(collegeData))
						// 													})
						// 												})
						// 												instructionId += instruction.id +','
						// 												console.log("collegeData inside == " + JSON.stringify(collegeData))
						// 											})
					
						// 											setTimeout(()=>{
						// 												console.log("collegeData == " + JSON.stringify(collegeData))
						// 												console.log("----13----");
						// 												var instructionIds = instructionId.split(',');
						// 												console.log("instructionIds == " ,instructionIds)
						// 												instructionIds.pop();
						// 												console.log("instructionIds == " ,instructionIds)
						// 												instructionId = instructionIds.join(',');
						// 												console.log("instructionId == " + instructionId);
						// 												setTimeout(function(){
						// 													console.log("----14----");
						// 													if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 														console.log("----15----");
						// 														models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 															if(MaxReferenceNo[0].maxNumber == null){
						// 																reference_no = 1001;
						// 															}else{
						// 																reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 															}
					
						// 															models.InstructionalDetails.updateReferenceNumber_new(instructionId,reference_no).then(function(updatedDetails){
						// 																console.log("----16----");
						// 																var ref_no = reference_no;
						// 																self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																	if(err) {
						// 																		console.log("----17----");
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		console.log("----18----");
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				doc_type : "InstructionalLetter",
						// 																				category : "InstructionalLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															})
						// 														});
						// 													}else{
						// 														console.log("----19----");
						// 														var ref_no = instructionalDetails[0].reference_no;
						// 														self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 														passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 															if(err) {
						// 																console.log("----20----");
						// 																res.json({ 
						// 																	status: 400
						// 																})
						// 															}else{
						// 																console.log("----21----");
						// 																models.Emailed_Docs.find({
						// 																	where :{
						// 																		app_id:app_id,
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																	}
						// 																}).then(function(emailDoc){
						// 																	if(!emailDoc){
						// 																		models.Emailed_Docs.create({
						// 																		filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																		doc_type : "InstructionalLetter",
						// 																		category : "InstructionalLetter",
						// 																		user_id: user_id,
						// 																		transcript_id: null,
						// 																		marklist_id : null,
						// 																		app_id:app_id,
						// 																		curriculum_id : null
						// 																		}).then((result)=>{
						// 																		// logger.debug(" result : "+JSON.stringify(result))
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														})
						// 													}
						// 												},3000); 
						// 											},4000);   
						// 										}else if(instructional_Details.length == 1){
						// 											instruction_letter_length = instruction_letter_length  + 1;
						// 											if(faculty.colleges.length == 1){
						// 												models.College.find ({
						// 													where :{
						// 														id : faculty.colleges[0].collegeId
						// 													}
						// 												}).then(function(college){
						// 													var studentName = prefix + instructional_Details[0].studentName;
						// 													var collegeName ;
						// 													if(college.type == 'college'){
						// 														collegeName = instructional_Details[0].collegeName + " which is affiliated to ";
						// 													}else if(college.type == 'department'){
						// 														collegeName = instructional_Details[0].collegeName + ", ";
						// 													}
						// 													var courseName = instructional_Details[0].courseName;
						// 													var specialization = instructional_Details[0].specialization;
						// 													var passingMonthYear = instructional_Details[0].yearofpassing;
						// 													var duration = converter.toWords(instructional_Details[0].duration);
						// 													var passingClass = instructional_Details[0].division;
						// 													var instruction_medium;
					
						// 													if(instructional_Details[0].instruction_medium == null || instructional_Details[0].instruction_medium == undefined || instructional_Details[0].instruction_medium == ''){
						// 														instruction_medium = "English";
						// 													}else{
						// 														instruction_medium = instructional_Details[0].instruction_medium;
						// 													}
						// 													var education = instructional_Details[0].education;
						// 													setTimeout(()=>{
						// 														if(instructional_Details[0].reference_no == null || instructional_Details[0].reference_no == '' || instructional_Details[0].reference_no == undefined){
						// 															console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
						// 															models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																if(MaxReferenceNo[0].maxNumber == null){
						// 																	reference_no = 1001;
						// 																}else{
						// 																	reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																}
						// 																models.InstructionalDetails.update(
						// 																	{
						// 																		reference_no : reference_no
						// 																	},{
						// 																	where :{
						// 																		id : instructional_Details[0].id
						// 																	}
						// 																}).then(function(updatedDetails){
						// 																	//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																	var ref_no = reference_no;
						// 																	self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																	passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																		if(err) {
						// 																			res.json({ 
						// 																				status: 400
						// 																			})
						// 																		}else{
						// 																			models.Emailed_Docs.find({
						// 																				where :{
						// 																					app_id:app_id,
						// 																					filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																				}
						// 																			}).then(function(emailDoc){
						// 																				if(!emailDoc){
						// 																					models.Emailed_Docs.create({
						// 																					filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																					doc_type : "InstructionalLetter",
						// 																					category : "InstructionalLetter",
						// 																					user_id: user_id,
						// 																					transcript_id: null,
						// 																					marklist_id : null,
						// 																					app_id:app_id,
						// 																					curriculum_id : null
						// 																					}).then((result)=>{
						// 																					// logger.debug(" result : "+JSON.stringify(result))
						// 																					})
						// 																				}
						// 																			})
						// 																		}
						// 																	})
						// 																})
						// 															})
						// 														}else{
						// 															var ref_no = instructionalDetails[0].reference_no;
						// 															self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 															passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
						// 																if(err) {
						// 																	res.json({ 
						// 																		status: 400
						// 																	})
						// 																}else{
						// 																	models.Emailed_Docs.find({
						// 																		where :{
						// 																			app_id:app_id,
						// 																			filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																		}
						// 																	}).then(function(emailDoc){
						// 																		if(!emailDoc){
						// 																			models.Emailed_Docs.create({
						// 																			filename : app_id+"_"+instructional_Details[0].education+"_InstructionalLetter.pdf",
						// 																			doc_type : "InstructionalLetter",
						// 																			category : "InstructionalLetter",
						// 																			user_id: user_id,
						// 																			transcript_id: null,
						// 																			marklist_id : null,
						// 																			app_id:app_id,
						// 																			curriculum_id : null
						// 																			}).then((result)=>{
						// 																			// logger.debug(" result : "+JSON.stringify(result))
						// 																			})
						// 																		}
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													})
						// 												})
						// 											}
						// 										}
						// 									}
						// 								})
						// 							})
						// 						}
						// 					})
						// 				}
						// 			})
						// 		})
						// 	})
						// }
						// if(user[0].LetterforNameChange == true){
						// 	console.log("LetterforNameChange");
						// 	var collegeData = [];
						// 	var facultydata = [];
						// 	var reference_no;
						// 	var prefix = '';
						// 	var subject = '';
						// 	var subject1 = '';
						// 	var application_id = app_id
						// 	var test;
						// 	var clgdata;
						// 	var demoo =[];
						// 	var marklistData = [];
						// 	var typeofstudent='';
						// 	var facultyofstudent='';
							
						// 	models.Application.findOne({
						// 		where :{
						// 			id : application_id
						// 		}
						// 	}).then(function(application){
						// 		console.log('----1----')
						// 		models.User.find({
						// 			where :{
						// 				id : application.user_id
						// 			}
						// 		}).then(function(user){
									
						// 			console.log('----2----')
						// 			// if(user.gender == 'Female'){
						// 			//     console.log('----3----')
						// 			//     prefix = 'Ms. ';
						// 			//     subject = 'She';
						// 			//     subject1 = 'her';
						// 			//     gender = 'Female'
						// 			// }else if(user.gender == 'Male'){
						// 			//     console.log('----4----')
						// 			//     prefix = 'Mr. ';
						// 			//     subject = 'He';
						// 			//     subject1 = 'his';
						// 			//     gender = 'Male'
						// 			// }
									
						// 			models.Applied_For_Details.find({
						// 				where :{
						// 					user_id : application.user_id,
						// 					app_id : application_id
						// 				}
						// 			}).then(function(appliedDetails){
						// 				if(appliedDetails.applying_for == 'Bachelors'){
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Bachelors",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(bachelor_Details){
						// 						console.log("----7----");   
						// 						if(bachelor_Details[0].college_stream_type == true){
						// 							var differentStream = [];
						// 							var differentClg = [];
													
						
						// 							bachelor_Details.forEach(bachelor=>{
						// 								if(differentStream.length > 0){
						// 									var flag = false;
						// 									var differentStreamFlag =false;
						// 									differentStream.forEach(stream=>{
						// 										if(stream.faculty == bachelor.faculty){
						// 											flag = true;
						// 										}
						// 									});
						
													
						
													  
						// 									if(flag == false){
						// 										differentStream.push({
						// 											faculty : bachelor.faculty,
						// 											type : bachelor.type,
						// 											patteren : bachelor.patteren,
						// 											collegeId : bachelor.collegeId
						
						// 										})
						// 									}
						// 								}else{
						// 									differentStream.push({
						// 										faculty : bachelor.faculty,
						// 										type : bachelor.type,
						// 										patteren : bachelor.patteren,
						// 										collegeId : bachelor.collegeId
						
						// 									})
						// 								}
													  
													   
													   
						// 							});
						// 							if(differentStream.length > 0){
						// 								console.log('differentStream'+ JSON.stringify(differentStream));
						// 								differentStream.forEach(stream=>{
						// 									models.facultymaster.find({
						// 											where:{
						// 												degree 	: stream.type,
						// 												faculty : stream.faculty
						// 											}
						// 										}).then(function(facultyMaster){
						
						// 											facultydata = facultyMaster
						// 											var index;
						// 											if(stream.patteren == 'Annual'){
						// 												if(appliedDetails.current_year == true){
																			
						// 													index = converter.toOrdinalWords(facultyMaster.year) - 1;
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : index + ' Year'
						// 														}
						// 													}).then(function(marklistData){
						// 														if(marklistData){
						// 															models.College.find({
						// 																where : {
						// 																	id : marklistData.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : marklistData.type + ' of ' + marklistData.faculty
						// 																})
						// 															})
						// 														}
																			
						// 													})
						// 												}else{
						// 													var index;
						// 													index = converter.toWordsOrdinal(facultyMaster.year);
																			
						// 													models.userMarkList.findAll({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : index + ' Year'
						// 														}
						// 													}).then(function(marklistData){
						
						
						// 															if(marklistData){
						// 																models.College.find({
						// 																	where : {
						// 																		id : marklistData[0].collegeId
						// 																	}
						// 																}).then(function (collegedata){
						// 																	console.log('collegedata',collegedata);
						// 																	collegeData.push({
						// 																		collegeName : collegedata.name,
						// 																		courseName : marklistData[0].type + ' of ' + marklistData[0].faculty,
						// 																		// type :  marklistData[0].type,
						// 																		// faculty :  marklistData[0].faculty,
						// 																	})
						// 																})
																						
																						
						
						// 															}
																				
						
																					
						// 												})
																	
						// 												}
						
						// 											}else if(stream.patteren == 'Semester'){
						// 												var secondLast = "Semester " + facultyMaster.year * 2 - 1;
						// 												var thirdLast = "Semester " + facultyMaster.year * 2 - 2;
						// 												if(appliedDetails.current_year == true){
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : secondLast
						// 														}
						// 													}).then(function(secondLastData){
						// 														if(secondLastData){
						// 															models.College.find({
						// 																where : {
						// 																	id : secondLast.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : secondLastData.type + ' of ' + secondLastData.faculty
						// 																})
						// 															})
						// 														}else{
						// 															models.userMarkList.find({
						// 																where :{
						// 																	user_id : application.user_id,
						// 																	type : stream.type,
						// 																	faculty : stream.faculty,
						// 																	name : thirdLast
						// 																}
						// 															}).then(function(thirdLastData){
						// 																if(thirdLastData){
						// 																	models.College.find({
						// 																		where : {
						// 																			id : thirdLastData.collegeId
						// 																		}
						// 																	}).then(function(college){
						// 																		collegeData.push({
						// 																			collegeName : college.name,
						// 																			courseName : thirdLastData.type + ' of ' + thirdLastData.faculty
						// 																		})
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													})
																			
						// 												}else{
						// 													index = facultyMaster.year * 2;
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : 'Semester' + index
						// 														}
						// 													}).then(function(marklistData){
						// 														if(marklistData){
						// 															models.College.find({
						// 																where : {
						// 																	id : marklistData.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : marklistData.type + ' of ' + marklistData.faculty
						// 																})
						// 															})
						// 														}
						// 													})
						// 												}
						// 											}
																	
						// 										})
						// 							 })
														
						// 							}
												  
						
						// 						}else if(bachelor_Details[0].college_stream_type == false){
						// 							models.College.find({
						// 								where:{
						// 									id : bachelor_Details[0].collegeId
						// 								}
						// 							}).then(function(collegeDetails){
						// 							//	console.log(' bachelor_Details[0].type', bachelor_Details[0].type);
						
						// 								collegeData.push({
						// 									collegeName : collegeDetails.name,
						// 									courseName : bachelor_Details[0].type + ' of ' + bachelor_Details[0].faculty,
						// 								  //  type : bachelor_Details[0].type ,
						// 									//faculty : bachelor_Details[0].faculty
						// 								})
						// 							})
						// 						}
						
						// 						setTimeout(()=>{
						// 								namechangeletter_length =  collegeData.length
						// 								models.Letterfor_NameChange.find({
						// 									where:{
						// 										user_id : application.user_id
						// 									}
						// 								}).then(function(nameChange){
															
						// 								   // marklistData=nameChange
						// 									var firstnameaspermarksheet = nameChange.firstnameaspermarksheet;
						// 									var fathersnameaspermarksheet = nameChange.fathersnameaspermarksheet;
						// 									var mothersnameaspermarksheet = nameChange.mothersnameaspermarksheet;
						// 									var lastnameaspermarksheet = nameChange.lastnameaspermarksheet;
						// 									var firstnameasperpassport = nameChange.firstnameasperpassport;
						// 									var fathersnameasperpassport = nameChange.fathersnameasperpassport;
						// 									var lastnameasperpassport = nameChange.lastnameasperpassport;
						// 									var ref_no;
															
						
						// 										// var nex = 'A'.charCodeAt(0);
						
						// 											collegeData.forEach(function (de){
						// 												// var curr = String.fromCharCode(nex++)
						// 											if(nameChange.reference_no){
						// 												ref_no = nameChange.reference_no ;
						// 											}else{
						// 												models.Letterfor_NameChange.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																			
						// 													if(MaxReferenceNo[0].maxNumber == null){
						// 														ref_no = 1001 
						// 													}else{
						// 														ref_no = MaxReferenceNo[0].maxNumber + 1 
						// 													}
						// 													models.Letterfor_NameChange.update(
						// 														{
						// 															reference_no : ref_no
						// 														},{
						// 														where :{
						// 															id : nameChange.id
						// 														}
						// 													});
						// 												})
						// 											}
						// 										})
						
																
															
						// 									// })
															
						// 									setTimeout(()=>{
																
						// 										collegeData.forEach(function (eachdata){
						
						// 											self_pdf.NamechangeLetter_one(application.user_id,application_id,firstnameaspermarksheet,fathersnameaspermarksheet,
						// 											mothersnameaspermarksheet,lastnameaspermarksheet,firstnameasperpassport,fathersnameasperpassport,lastnameasperpassport,
						// 											'NameChangeLetter', eachdata.collegeName, eachdata.courseName,ref_no,user.gender,function(err){
						// 												if(err) {
						// 												   res.json({ 
						// 													   status: 400
						// 												   })
						// 												}else{
						// 													var courseName = eachdata.courseName.split(' ').join('_');
						// 												   models.Emailed_Docs.find({
						// 													   where :{
						// 														   app_id:nameChange.app_id,
						// 														   filename : nameChange.app_id + "_" + courseName +"_NameChangeLetter.pdf",
						// 													   }
						// 												   }).then(function(emailDoc){
						// 													   if(!emailDoc){
						// 														   models.Emailed_Docs.create({
						// 														//    filename : nameChange.app_id + "_" +courseName+"_NameChangeLetter.pdf",
						// 														   filename : nameChange.app_id + '_NameChangeLetter'+courseName+'.pdf',
						
						// 														   doc_type : "NameChangeLetter",
						// 														   category : "NameChangeLetter",
						// 														   user_id: nameChange.user_id,
						// 														   transcript_id: null,
						// 														   marklist_id : null,
						// 														   app_id:nameChange.app_id,
						// 														   curriculum_id : null,
						// 														   namechange_id : nameChange.id
						// 														   }).then((result)=>{
						// 															   console.log('result',result);
						// 														   })
						// 													   }
						// 												   })
																	   
						// 											   }
						// 										   })
						// 									   })
						
						// 							   },5000)
						// 								})
														
						// 					},3000)
						// 					})
						// 				}if(appliedDetails.applying_for == 'Masters,Bachelors'){
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Masters",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(bachelor_Details){
						// 						console.log("----7----");   
						// 						if(bachelor_Details[0].college_stream_type == true){
						// 							var differentStream = [];
						// 							var differentClg = [];
													
						
						// 							bachelor_Details.forEach(bachelor=>{
						// 								if(differentStream.length > 0){
						// 									var flag = false;
						// 									var differentStreamFlag =false;
						// 									differentStream.forEach(stream=>{
						// 										if(stream.faculty == bachelor.faculty){
						// 											flag = true;
						// 										}
						// 									});
						
						// 									// var differentStreamFlag = false;
														   
						// 									// differentClg.forEach(stream=>{
						// 									//     if(stream.collegeId == bachelor.collegeId){
						// 									//         differentStreamFlag = true;
						// 									//     }else{
						// 									//         differentStreamFlag = false;
						// 									//     }
						// 									// });
						// 									// if(differentStreamFlag == false){
						// 									//     differentClg.push({
						// 									//         faculty : bachelor.faculty,
						// 									//         type : bachelor.type,
						// 									//         patteren : bachelor.patteren,
						// 									//         collegeId : bachelor.collegeId
						
						// 									//     })
						// 									// }
						
														  
													  
						// 									if(flag == false){
						// 										differentStream.push({
						// 											faculty : bachelor.faculty,
						// 											type : bachelor.type,
						// 											patteren : bachelor.patteren,
						// 											collegeId : bachelor.collegeId
						
						// 										})
						// 									}
						// 								}else{
						// 									differentStream.push({
						// 										faculty : bachelor.faculty,
						// 										type : bachelor.type,
						// 										patteren : bachelor.patteren,
						// 										collegeId : bachelor.collegeId
						
						// 									})
						// 								}
													  
													   
													   
						// 							});
						// 							if(differentStream.length > 0){
						// 								console.log('differentStream'+ JSON.stringify(differentStream));
						// 								differentStream.forEach(stream=>{
						// 									models.facultymaster.find({
						// 											where:{
						// 												degree 	: stream.type,
						// 												faculty : stream.faculty
						// 											}
						// 										}).then(function(facultyMaster){
						
						// 											facultydata = facultyMaster
						// 											var index;
						// 											if(stream.patteren == 'Annual'){
						// 												if(appliedDetails.current_year == true){
																			
						// 													index = converter.toOrdinalWords(facultyMaster.year) - 1;
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : index + ' Year'
						// 														}
						// 													}).then(function(marklistData){
						// 														if(marklistData){
						// 															models.College.find({
						// 																where : {
						// 																	id : marklistData.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : marklistData.type + ' of ' + marklistData.faculty
						// 																})
						// 															})
						// 														}
																			
						// 													})
						// 												}else{
						// 													var index;
						// 													index = converter.toWordsOrdinal(facultyMaster.year);
																			
						// 													models.userMarkList.findAll({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : index + ' Year'
						// 														}
						// 													}).then(function(marklistData){
						
						
						// 															if(marklistData){
						// 																models.College.find({
						// 																	where : {
						// 																		id : marklistData[0].collegeId
						// 																	}
						// 																}).then(function (collegedata){
						// 																	collegeData.push({
						// 																		collegeName : collegedata.name,
						// 																		courseName : marklistData[0].type + ' of ' + marklistData[0].faculty,
						// 																		// type :  marklistData[0].type,
						// 																		// faculty :  marklistData[0].faculty,
						// 																	})
						// 																})
																						
																						
						
						// 															}
																				
						
																					
						// 												})
																	
						// 												}
						
						// 											}else if(stream.patteren == 'Semester'){
						// 												var secondLast = "Semester " + facultyMaster.year * 2 - 1;
						// 												var thirdLast = "Semester " + facultyMaster.year * 2 - 2;
						// 												if(appliedDetails.current_year == true){
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : secondLast
						// 														}
						// 													}).then(function(secondLastData){
						// 														if(secondLastData){
						// 															models.College.find({
						// 																where : {
						// 																	id : secondLast.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : secondLastData.type + ' of ' + secondLastData.faculty
						// 																})
						// 															})
						// 														}else{
						// 															models.userMarkList.find({
						// 																where :{
						// 																	user_id : application.user_id,
						// 																	type : stream.type,
						// 																	faculty : stream.faculty,
						// 																	name : thirdLast
						// 																}
						// 															}).then(function(thirdLastData){
						// 																if(thirdLastData){
						// 																	models.College.find({
						// 																		where : {
						// 																			id : thirdLastData.collegeId
						// 																		}
						// 																	}).then(function(college){
						// 																		collegeData.push({
						// 																			collegeName : college.name,
						// 																			courseName : thirdLastData.type + ' of ' + thirdLastData.faculty
						// 																		})
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													})
																			
						// 												}else{
						// 													index = facultyMaster.year * 2;
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : 'Semester' + index
						// 														}
						// 													}).then(function(marklistData){
						// 														if(marklistData){
						// 															models.College.find({
						// 																where : {
						// 																	id : marklistData.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : marklistData.type + ' of ' + marklistData.faculty
						// 																})
						// 															})
						// 														}
						// 													})
						// 												}
						// 											}
																	
						// 										})
						// 							 })
														
						// 							}
												  
						
						// 						}else if(bachelor_Details[0].college_stream_type == false){
						// 							models.College.find({
						// 								where:{
						// 									id : bachelor_Details[0].collegeId
						// 								}
						// 							}).then(function(collegeDetails){
						// 							//	console.log(' bachelor_Details[0].type', bachelor_Details[0].type);
						
						// 								collegeData.push({
						// 									collegeName : collegeDetails.name,
						// 									courseName : bachelor_Details[0].type + ' of ' + bachelor_Details[0].faculty,
						// 								  //  type : bachelor_Details[0].type ,
						// 									//faculty : bachelor_Details[0].faculty
						// 								})
						// 							})
						// 						}
						
						// 						setTimeout(()=>{
						// 							namechangeletter_length =  collegeData.length
						
						// 								models.Letterfor_NameChange.find({
						// 									where:{
						// 										user_id : application.user_id
						// 									}
						// 								}).then(function(nameChange){
															
						// 								   // marklistData=nameChange
						// 									var firstnameaspermarksheet = nameChange.firstnameaspermarksheet;
						// 									var fathersnameaspermarksheet = nameChange.fathersnameaspermarksheet;
						// 									var mothersnameaspermarksheet = nameChange.mothersnameaspermarksheet;
						// 									var lastnameaspermarksheet = nameChange.lastnameaspermarksheet;
						// 									var firstnameasperpassport = nameChange.firstnameasperpassport;
						// 									var fathersnameasperpassport = nameChange.fathersnameasperpassport;
						// 									var lastnameasperpassport = nameChange.lastnameasperpassport;
						// 									var ref_no;
												
						// 										// var nex = 'A'.charCodeAt(0);
						
						// 											collegeData.forEach(function (de){
						// 												// var curr = String.fromCharCode(nex++)
						// 											if(nameChange.reference_no){
						// 												// ref_no = nameChange.reference_no + curr;
						// 												ref_no = nameChange.reference_no 
						// 											}else{
						// 												models.Letterfor_NameChange.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																			
						// 													if(MaxReferenceNo[0].maxNumber == null){
						// 														// ref_no = 1001 +curr;
						// 														ref_no = 1001 
						// 													}else{
						// 														// ref_no = MaxReferenceNo[0].maxNumber + 1 + curr;
						// 														ref_no = MaxReferenceNo[0].maxNumber + 1 
						// 													}
						// 													models.Letterfor_NameChange.update(
						// 														{
						// 															reference_no : ref_no
						// 														},{
						// 														where :{
						// 															id : nameChange.id
						// 														}
						// 													});
						// 												})
						// 											}
						// 										})
						
																
															
						// 									// })
															
						// 									setTimeout(()=>{
																
						// 										collegeData.forEach(function (eachdata){
						
						// 											self_pdf.NamechangeLetter_one(application.user_id,application_id,firstnameaspermarksheet,fathersnameaspermarksheet,
						// 											mothersnameaspermarksheet,lastnameaspermarksheet,firstnameasperpassport,fathersnameasperpassport,lastnameasperpassport,
						// 											'NameChangeLetter', eachdata.collegeName, eachdata.courseName,ref_no,user.gender,function(err){
						// 												if(err) {
						// 												   res.json({ 
						// 													   status: 400
						// 												   })
						// 												}else{
						// 													var courseName = eachdata.courseName.split(' ').join('_');
						// 												   models.Emailed_Docs.find({
						// 													   where :{
						// 														   app_id:nameChange.app_id,
						// 														   filename : nameChange.app_id + "_" + courseName +"_NameChangeLetter.pdf",
						// 													   }
						// 												   }).then(function(emailDoc){
						// 													   if(!emailDoc){
						// 														   models.Emailed_Docs.create({
						// 														//    filename : nameChange.app_id + "_" +courseName+"_NameChangeLetter.pdf",
						// 														   filename : nameChange.app_id + '_NameChangeLetter'+courseName+'.pdf',
						
						// 														   doc_type : "NameChangeLetter",
						// 														   category : "NameChangeLetter",
						// 														   user_id: nameChange.user_id,
						// 														   transcript_id: null,
						// 														   marklist_id : null,
						// 														   app_id:nameChange.app_id,
						// 														   curriculum_id : null,
						// 														   namechange_id : nameChange.id
						// 														   }).then((result)=>{
						// 															   console.log('result',result);
						// 														   })
						// 													   }
						// 												   })
																	   
						// 											   }
						// 										   })
						// 									   })
						
						// 							   },5000)
						// 								})
														
						// 					},3000)
						// 					})
						// 				}if(appliedDetails.applying_for == 'Phd,Masters,Bachelors'){
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Phd",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(bachelor_Details){
						// 						console.log("----7----");   
						// 						if(bachelor_Details[0].college_stream_type == true){
						// 							var differentStream = [];
						// 							var differentClg = [];
													
						
						// 							bachelor_Details.forEach(bachelor=>{
						// 								if(differentStream.length > 0){
						// 									var flag = false;
						// 									var differentStreamFlag =false;
						// 									differentStream.forEach(stream=>{
						// 										if(stream.faculty == bachelor.faculty){
						// 											flag = true;
						// 										}
						// 									});
						
										
														  
													  
						// 									if(flag == false){
						// 										differentStream.push({
						// 											faculty : bachelor.faculty,
						// 											type : bachelor.type,
						// 											patteren : bachelor.patteren,
						// 											collegeId : bachelor.collegeId
						
						// 										})
						// 									}
						// 								}else{
						// 									differentStream.push({
						// 										faculty : bachelor.faculty,
						// 										type : bachelor.type,
						// 										patteren : bachelor.patteren,
						// 										collegeId : bachelor.collegeId
						
						// 									})
						// 								}
													  
													   
													   
						// 							});
						// 							if(differentStream.length > 0){
						// 								differentStream.forEach(stream=>{
						// 									models.facultymaster.find({
						// 											where:{
						// 												degree 	: stream.type,
						// 												faculty : stream.faculty
						// 											}
						// 										}).then(function(facultyMaster){
						
						// 											facultydata = facultyMaster
						// 											var index;
						// 											if(stream.patteren == 'Annual'){
						// 												if(appliedDetails.current_year == true){
																			
						// 													index = converter.toOrdinalWords(facultyMaster.year) - 1;
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : index + ' Year'
						// 														}
						// 													}).then(function(marklistData){
						// 														if(marklistData){
						// 															models.College.find({
						// 																where : {
						// 																	id : marklistData.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : marklistData.type + ' of ' + marklistData.faculty
						// 																})
						// 															})
						// 														}
																			
						// 													})
						// 												}else{
						// 													var index;
						// 													index = converter.toWordsOrdinal(facultyMaster.year);
																			
						// 													models.userMarkList.findAll({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : index + ' Year'
						// 														}
						// 													}).then(function(marklistData){
						
						
						// 															if(marklistData){
						// 																models.College.find({
						// 																	where : {
						// 																		id : marklistData[0].collegeId
						// 																	}
						// 																}).then(function (collegedata){
						// 																	collegeData.push({
						// 																		collegeName : collegedata.name,
						// 																		courseName : marklistData[0].type + ' of ' + marklistData[0].faculty,
						// 																		// type :  marklistData[0].type,
						// 																		// faculty :  marklistData[0].faculty,
						// 																	})
						// 																})
																						
																						
						
						// 															}
																				
						
																					
						// 												})
																	
						// 												}
						
						// 											}else if(stream.patteren == 'Semester'){
						// 												var secondLast = "Semester " + facultyMaster.year * 2 - 1;
						// 												var thirdLast = "Semester " + facultyMaster.year * 2 - 2;
						// 												if(appliedDetails.current_year == true){
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : secondLast
						// 														}
						// 													}).then(function(secondLastData){
						// 														if(secondLastData){
						// 															models.College.find({
						// 																where : {
						// 																	id : secondLast.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : secondLastData.type + ' of ' + secondLastData.faculty
						// 																})
						// 															})
						// 														}else{
						// 															models.userMarkList.find({
						// 																where :{
						// 																	user_id : application.user_id,
						// 																	type : stream.type,
						// 																	faculty : stream.faculty,
						// 																	name : thirdLast
						// 																}
						// 															}).then(function(thirdLastData){
						// 																if(thirdLastData){
						// 																	models.College.find({
						// 																		where : {
						// 																			id : thirdLastData.collegeId
						// 																		}
						// 																	}).then(function(college){
						// 																		collegeData.push({
						// 																			collegeName : college.name,
						// 																			courseName : thirdLastData.type + ' of ' + thirdLastData.faculty
						// 																		})
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													})
																			
						// 												}else{
						// 													index = facultyMaster.year * 2;
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : 'Semester' + index
						// 														}
						// 													}).then(function(marklistData){
						// 														if(marklistData){
						// 															models.College.find({
						// 																where : {
						// 																	id : marklistData.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : marklistData.type + ' of ' + marklistData.faculty
						// 																})
						// 															})
						// 														}
						// 													})
						// 												}
						// 											}
																	
						// 										})
						// 							 })
														
						// 							}
												  
						
						// 						}else if(bachelor_Details[0].college_stream_type == false){
						// 							models.College.find({
						// 								where:{
						// 									id : bachelor_Details[0].collegeId
						// 								}
						// 							}).then(function(collegeDetails){
						// 							//	console.log(' bachelor_Details[0].type', bachelor_Details[0].type);
						
						// 								collegeData.push({
						// 									collegeName : collegeDetails.name,
						// 									courseName : bachelor_Details[0].type + ' of ' + bachelor_Details[0].faculty,
						// 								  //  type : bachelor_Details[0].type ,
						// 									//faculty : bachelor_Details[0].faculty
						// 								})
						// 							})
						// 						}
						
						// 						setTimeout(()=>{
						// 							namechangeletter_length =  collegeData.length
						
						// 								models.Letterfor_NameChange.find({
						// 									where:{
						// 										user_id : application.user_id
						// 									}
						// 								}).then(function(nameChange){
															
						// 								   // marklistData=nameChange
						// 									var firstnameaspermarksheet = nameChange.firstnameaspermarksheet;
						// 									var fathersnameaspermarksheet = nameChange.fathersnameaspermarksheet;
						// 									var mothersnameaspermarksheet = nameChange.mothersnameaspermarksheet;
						// 									var lastnameaspermarksheet = nameChange.lastnameaspermarksheet;
						// 									var firstnameasperpassport = nameChange.firstnameasperpassport;
						// 									var fathersnameasperpassport = nameChange.fathersnameasperpassport;
						// 									var lastnameasperpassport = nameChange.lastnameasperpassport;
						// 									var ref_no;
														
						// 										// var nex = 'A'.charCodeAt(0);
						
						// 											collegeData.forEach(function (de){
						// 												// var curr = String.fromCharCode(nex++)
						// 											if(nameChange.reference_no){
						// 												// ref_no = nameChange.reference_no + curr;
						// 												ref_no = nameChange.reference_no
						// 											}else{
						// 												models.Letterfor_NameChange.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																			
						// 													if(MaxReferenceNo[0].maxNumber == null){
						// 														// ref_no = 1001 +curr;
						// 														ref_no = 1001 
						// 													}else{
						// 														// ref_no = MaxReferenceNo[0].maxNumber + 1 + curr;
						// 														ref_no = MaxReferenceNo[0].maxNumber + 1 ;
						// 													}
						// 													models.Letterfor_NameChange.update(
						// 														{
						// 															reference_no : ref_no
						// 														},{
						// 														where :{
						// 															id : nameChange.id
						// 														}
						// 													});
						// 												})
						// 											}
						// 										})
						
																
															
						// 									// })
															
						// 									setTimeout(()=>{
																
						// 										collegeData.forEach(function (eachdata){
						
						// 											self_pdf.NamechangeLetter_one(application.user_id,application_id,firstnameaspermarksheet,fathersnameaspermarksheet,
						// 											mothersnameaspermarksheet,lastnameaspermarksheet,firstnameasperpassport,fathersnameasperpassport,lastnameasperpassport,
						// 											'NameChangeLetter', eachdata.collegeName, eachdata.courseName,ref_no,user.gender,function(err){
						// 												if(err) {
						// 												   res.json({ 
						// 													   status: 400
						// 												   })
						// 												}else{
						// 													var courseName = eachdata.courseName.split(' ').join('_');
						// 												   models.Emailed_Docs.find({
						// 													   where :{
						// 														   app_id:nameChange.app_id,
						// 														   filename : nameChange.app_id + "_" + courseName +"_NameChangeLetter.pdf",
						// 													   }
						// 												   }).then(function(emailDoc){
						// 													   if(!emailDoc){
						// 														   models.Emailed_Docs.create({
						// 														//    filename : nameChange.app_id + "_" +courseName+"_NameChangeLetter.pdf",
						// 														   filename : nameChange.app_id + '_NameChangeLetter'+courseName+'.pdf',
						
						// 														   doc_type : "NameChangeLetter",
						// 														   category : "NameChangeLetter",
						// 														   user_id: nameChange.user_id,
						// 														   transcript_id: null,
						// 														   marklist_id : null,
						// 														   app_id:nameChange.app_id,
						// 														   curriculum_id : null,
						// 														   namechange_id : nameChange.id
						// 														   }).then((result)=>{
						// 															   console.log('result',result);
						// 														   })
						// 													   }
						// 												   })
																	   
						// 											   }
						// 										   })
						// 									   })
						
						// 							   },5000)
						// 								})
														
						// 					},3000)
						// 					})
						// 				}if(appliedDetails.applying_for == 'Masters'){
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Masters",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(bachelor_Details){
						// 						console.log("----7----");   
						// 						if(bachelor_Details[0].college_stream_type == true){
						// 							var differentStream = [];
						// 							var differentClg = [];
													
						
						// 							bachelor_Details.forEach(bachelor=>{
						// 								if(differentStream.length > 0){
						// 									var flag = false;
						// 									var differentStreamFlag =false;
						// 									differentStream.forEach(stream=>{
						// 										if(stream.faculty == bachelor.faculty){
						// 											flag = true;
						// 										}
						// 									});
						
													
						
													  
						// 									if(flag == false){
						// 										differentStream.push({
						// 											faculty : bachelor.faculty,
						// 											type : bachelor.type,
						// 											patteren : bachelor.patteren,
						// 											collegeId : bachelor.collegeId
						
						// 										})
						// 									}
						// 								}else{
						// 									differentStream.push({
						// 										faculty : bachelor.faculty,
						// 										type : bachelor.type,
						// 										patteren : bachelor.patteren,
						// 										collegeId : bachelor.collegeId
						
						// 									})
						// 								}
													  
													   
													   
						// 							});
						// 							if(differentStream.length > 0){
						// 								console.log('differentStream'+ JSON.stringify(differentStream));
						// 								differentStream.forEach(stream=>{
						// 									models.facultymaster.find({
						// 											where:{
						// 												degree 	: stream.type,
						// 												faculty : stream.faculty
						// 											}
						// 										}).then(function(facultyMaster){
						
						// 											facultydata = facultyMaster
						// 											var index;
						// 											if(stream.patteren == 'Annual'){
						// 												if(appliedDetails.current_year == true){
																			
						// 													index = converter.toOrdinalWords(facultyMaster.year) - 1;
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : index + ' Year'
						// 														}
						// 													}).then(function(marklistData){
						// 														if(marklistData){
						// 															models.College.find({
						// 																where : {
						// 																	id : marklistData.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : marklistData.type + ' of ' + marklistData.faculty
						// 																})
						// 															})
						// 														}
																			
						// 													})
						// 												}else{
						// 													var index;
						// 													index = converter.toWordsOrdinal(facultyMaster.year);
																			
						// 													models.userMarkList.findAll({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : index + ' Year'
						// 														}
						// 													}).then(function(marklistData){
						
						
						// 															if(marklistData){
						// 																models.College.find({
						// 																	where : {
						// 																		id : marklistData[0].collegeId
						// 																	}
						// 																}).then(function (collegedata){
						// 																	console.log('collegedata',collegedata);
						// 																	collegeData.push({
						// 																		collegeName : collegedata.name,
						// 																		courseName : marklistData[0].type + ' of ' + marklistData[0].faculty,
						// 																		// type :  marklistData[0].type,
						// 																		// faculty :  marklistData[0].faculty,
						// 																	})
						// 																})
																						
																						
						
						// 															}
																				
						
																					
						// 												})
																	
						// 												}
						
						// 											}else if(stream.patteren == 'Semester'){
						// 												var secondLast = "Semester " + facultyMaster.year * 2 - 1;
						// 												var thirdLast = "Semester " + facultyMaster.year * 2 - 2;
						// 												if(appliedDetails.current_year == true){
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : secondLast
						// 														}
						// 													}).then(function(secondLastData){
						// 														if(secondLastData){
						// 															models.College.find({
						// 																where : {
						// 																	id : secondLast.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : secondLastData.type + ' of ' + secondLastData.faculty
						// 																})
						// 															})
						// 														}else{
						// 															models.userMarkList.find({
						// 																where :{
						// 																	user_id : application.user_id,
						// 																	type : stream.type,
						// 																	faculty : stream.faculty,
						// 																	name : thirdLast
						// 																}
						// 															}).then(function(thirdLastData){
						// 																if(thirdLastData){
						// 																	models.College.find({
						// 																		where : {
						// 																			id : thirdLastData.collegeId
						// 																		}
						// 																	}).then(function(college){
						// 																		collegeData.push({
						// 																			collegeName : college.name,
						// 																			courseName : thirdLastData.type + ' of ' + thirdLastData.faculty
						// 																		})
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													})
																			
						// 												}else{
						// 													index = facultyMaster.year * 2;
						// 													models.userMarkList.find({
						// 														where :{
						// 															user_id : application.user_id,
						// 															type : stream.type,
						// 															faculty : stream.faculty,
						// 															name : 'Semester' + index
						// 														}
						// 													}).then(function(marklistData){
						// 														if(marklistData){
						// 															models.College.find({
						// 																where : {
						// 																	id : marklistData.collegeId
						// 																}
						// 															}).then(function(college){
						// 																collegeData.push({
						// 																	collegeName : college.name,
						// 																	courseName : marklistData.type + ' of ' + marklistData.faculty
						// 																})
						// 															})
						// 														}
						// 													})
						// 												}
						// 											}
																	
						// 										})
						// 							 })
														
						// 							}
												  
						
						// 						}else if(bachelor_Details[0].college_stream_type == false){
						// 							models.College.find({
						// 								where:{
						// 									id : bachelor_Details[0].collegeId
						// 								}
						// 							}).then(function(collegeDetails){
						// 							//	console.log(' bachelor_Details[0].type', bachelor_Details[0].type);
						
						// 								collegeData.push({
						// 									collegeName : collegeDetails.name,
						// 									courseName : bachelor_Details[0].type + ' of ' + bachelor_Details[0].faculty,
						// 								  //  type : bachelor_Details[0].type ,
						// 									//faculty : bachelor_Details[0].faculty
						// 								})
						// 							})
						// 						}
						
						// 						setTimeout(()=>{
						// 								namechangeletter_length =  collegeData.length
						// 								models.Letterfor_NameChange.find({
						// 									where:{
						// 										user_id : application.user_id
						// 									}
						// 								}).then(function(nameChange){
															
						// 								   // marklistData=nameChange
						// 									var firstnameaspermarksheet = nameChange.firstnameaspermarksheet;
						// 									var fathersnameaspermarksheet = nameChange.fathersnameaspermarksheet;
						// 									var mothersnameaspermarksheet = nameChange.mothersnameaspermarksheet;
						// 									var lastnameaspermarksheet = nameChange.lastnameaspermarksheet;
						// 									var firstnameasperpassport = nameChange.firstnameasperpassport;
						// 									var fathersnameasperpassport = nameChange.fathersnameasperpassport;
						// 									var lastnameasperpassport = nameChange.lastnameasperpassport;
						// 									var ref_no;
															
						
						// 										// var nex = 'A'.charCodeAt(0);
						
						// 											collegeData.forEach(function (de){
						// 												var curr = String.fromCharCode(nex++)
						// 											if(nameChange.reference_no){
						// 												// ref_no = nameChange.reference_no + curr;
						// 												ref_no = nameChange.reference_no
						// 											}else{
						// 												models.Letterfor_NameChange.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																			
						// 													if(MaxReferenceNo[0].maxNumber == null){
						// 														// ref_no = 1001 +curr;
						// 														ref_no = 1001
						// 													}else{
						// 														// ref_no = MaxReferenceNo[0].maxNumber + 1 + curr;
						// 														ref_no = MaxReferenceNo[0].maxNumber + 1 
						// 													}
						// 													models.Letterfor_NameChange.update(
						// 														{
						// 															reference_no : ref_no
						// 														},{
						// 														where :{
						// 															id : nameChange.id
						// 														}
						// 													});
						// 												})
						// 											}
						// 										})
						
																
															
						// 									// })
															
						// 									setTimeout(()=>{
																
						// 										collegeData.forEach(function (eachdata){
						
						// 											self_pdf.NamechangeLetter_one(application.user_id,application_id,firstnameaspermarksheet,fathersnameaspermarksheet,
						// 											mothersnameaspermarksheet,lastnameaspermarksheet,firstnameasperpassport,fathersnameasperpassport,lastnameasperpassport,
						// 											'NameChangeLetter', eachdata.collegeName, eachdata.courseName,ref_no,user.gender,function(err){
						// 												if(err) {
						// 												   res.json({ 
						// 													   status: 400
						// 												   })
						// 												}else{
						// 													var courseName = eachdata.courseName.split(' ').join('_');
						// 												   models.Emailed_Docs.find({
						// 													   where :{
						// 														   app_id:nameChange.app_id,
						// 														   filename : nameChange.app_id + "_" + courseName +"_NameChangeLetter.pdf",
						// 													   }
						// 												   }).then(function(emailDoc){
						// 													   if(!emailDoc){
						// 														   models.Emailed_Docs.create({
						// 														//    filename : nameChange.app_id + "_" +courseName+"_NameChangeLetter.pdf",
						// 														   filename : nameChange.app_id + '_NameChangeLetter'+courseName+'.pdf',
						
						// 														   doc_type : "NameChangeLetter",
						// 														   category : "NameChangeLetter",
						// 														   user_id: nameChange.user_id,
						// 														   transcript_id: null,
						// 														   marklist_id : null,
						// 														   app_id:nameChange.app_id,
						// 														   curriculum_id : null,
						// 														   namechange_id : nameChange.id
						// 														   }).then((result)=>{
						// 															   console.log('result',result);
						// 														   })
						// 													   }
						// 												   })
																	   
						// 											   }
						// 										   })
						// 									   })
						
						// 							   },5000)
						// 								})
														
						// 					},3000)
						// 					})
						// 				}
						// 			})
						// 		})
						// 	})
						// }
						// if(user[0].affiliation == true){
						// 	console.log("affiliation letter");
						// 	var collegeData = [];
						// 	var reference_no;
						// 	var prefix = '';
						// 	var subject = '';
						// 	var subject1 = '';
						// 	var application_id = app_id

						// 	models.Application.findOne({
						// 		where :{
						// 			id : application_id
						// 		}
						// 	}).then(function(application){
						// 		console.log('----1----')
						// 		models.User.find({
						// 			where :{
						// 				id : application.user_id
						// 			}
						// 		}).then(function(user){
						// 			console.log('----2----')
						// 			if(user.gender == 'Female'){
						// 				console.log('----3----')
						// 				prefix = 'Ms. ';
						// 				subject = 'She';
						// 				subject1 = 'her';
						// 			}else if(user.gender == 'Male'){
						// 				console.log('----4----')
						// 				prefix = 'Mr. ';
						// 				subject = 'He';
						// 				subject1 = 'his';
						// 			}
									
						// 			models.Applied_For_Details.find({
						// 				where :{
						// 					user_id : application.user_id,
						// 					app_id : application_id
						// 				}
						// 			}).then(function(appliedDetails){
						// 				console.log('----5----')
						// 				if(appliedDetails.applying_for == 'Masters,Bachelors'){
						// 					console.log('----6----')
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Masters",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(master_Details){
						// 						console.log('----7----')
						// 						var masterDetails = [];
						// 						if(master_Details){
						// 							console.log('----8----')
						// 							master_Details.forEach(master =>{
						// 								if(master.app_id != null){
						// 									var app_idArr = master.app_id.split(",");
						// 									app_idArr.forEach(app_id =>{
						// 										if(app_id == application_id){
						// 											masterDetails.push(master);
						// 										}
						// 									})
						// 								}
						// 							})
						// 							console.log('----9----')
						// 							if(masterDetails){
						// 								var facultyData = [];
						// 								console.log('----10----')
						// 								masterDetails.forEach(master =>{
						// 									var flag = false;
						// 									var college = [];
						// 									if(facultyData.length > 0){
						// 										facultyData.forEach(data=>{
						// 											if(data.faculty == master.faculty){
						// 												flag = true;
						// 												var count = 0;
						// 												data.colleges.forEach(clg=>{
						// 													if(clg.collegeId == master.collegeId){
						// 														count ++;
						// 													}
						// 												})
						// 												if(count <= data.colleges.length){
						// 													if(master.patteren == 'Annual'){
						// 														data.colleges.push({
						// 															name : master.name,
						// 															collegeId : master.collegeId
						// 														})
						// 													}else if(master.patteren == 'Semester'){
						// 														switch(master.name){
						// 															case 'Semester 2' : 
						// 																data.colleges.push({
						// 																	name : 'First Year',
						// 																	collegeId : master.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 4' :
						// 																data.colleges.push({
						// 																	name : 'Second Year',
						// 																	collegeId : master.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 6' :
						// 																data.colleges.push({
						// 																	name : 'Third Year',
						// 																	collegeId : master.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 8' :
						// 																data.colleges.push({
						// 																	name : 'Fourth Year',
						// 																	collegeId : master.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 10' :
						// 																data.colleges.push({
						// 																	name : 'Fifth Year',
						// 																	collegeId : master.collegeId
						// 																})
						// 																break;
						// 															default :
						// 																data.colleges.push({
						// 																	name : '',
						// 																	collegeId : master.collegeId
						// 																})
						// 														}
						// 													}
						// 												}
						// 											}
						// 										})
						// 										if(flag == false){
						// 											var colleges = [];
						// 											if(master.patteren == 'Annual'){
						// 												colleges.push({
						// 													name : master.name,
						// 													collegeId : master.collegeId
						// 												})
						// 											}else if(master.patteren == 'Semester'){
						// 												switch(master.name){
						// 													case 'Semester 2' : 
						// 														colleges.push({
						// 															name : 'First Year',
						// 															collegeId : master.collegeId
						// 														})
						// 														break;
						// 													case 'Semester 4' :
						// 														colleges.push({
						// 															name : 'Second Year',
						// 															collegeId : master.collegeId
						// 														})
						// 														break;
						// 													case 'Semester 6' :
						// 														colleges.push({
						// 															name : 'Third Year',
						// 															collegeId : master.collegeId
						// 														})
						// 														break;
						// 													case 'Semester 8' :
						// 													colleges.push({
						// 															name : 'Fourth Year',
						// 															collegeId : master.collegeId
						// 														})
						// 														break;
						// 													case 'Semester 10' :
						// 														colleges.push({
						// 															name : 'Fifth Year',
						// 															collegeId : master.collegeId
						// 														})
						// 														break;
						// 													default :
						// 														colleges.push({
						// 															name : '',
						// 															collegeId : master.collegeId
						// 														})

						// 												}
						// 											}
																	
						// 											facultyData.push({
						// 												type:master.type,
						// 												faculty : master.faculty,
						// 												colleges : colleges
						// 											})
						// 										}
						// 									}else{
						// 									var colleges = [];
						// 											if(master.patteren == 'Annual'){
						// 												colleges.push({
						// 													name : master.name,
						// 													collegeId : master.collegeId
						// 												})
						// 											}else if(master.patteren == 'Semester'){
						// 												switch(master.name){
						// 													case 'Semester 2' : 
						// 														colleges.push({
						// 															name : 'First Year',
						// 															collegeId : master.collegeId
						// 														})
						// 														break;
						// 													case 'Semester 4' :
						// 														colleges.push({
						// 															name : 'Second Year',
						// 															collegeId : master.collegeId
						// 														})
						// 														break;
						// 													case 'Semester 6' :
						// 														colleges.push({
						// 															name : 'Third Year',
						// 															collegeId : master.collegeId
						// 														})
						// 														break;
						// 													case 'Semester 8' :
						// 													colleges.push({
						// 															name : 'Fourth Year',
						// 															collegeId : master.collegeId
						// 														})
						// 														break;
						// 													case 'Semester 10' :
						// 														colleges.push({
						// 															name : 'Fifth Year',
						// 															collegeId : master.collegeId
						// 														})
						// 														break;
						// 													default :
						// 														colleges.push({
						// 															name : '',
						// 															collegeId : master.collegeId
						// 														})

						// 												}
						// 											}
						// 										facultyData.push({
						// 											type:master.type,
						// 											faculty : master.faculty,
						// 											colleges : colleges
						// 										})
						// 									}
						// 								})
						// 								console.log('----11----')
						// 								facultyData.forEach(faculty=>{
						// 									models.Affiliation_Letter.findAll({
						// 										where :{
						// 											user_id : application.user_id,
						// 											education : faculty.type + '_' + faculty.faculty
						// 										}
						// 									}).then(function(affiliationDetails){
																
						// 										console.log('----12----')
						// 										var affiliation_Details = [];
						// 										affiliationDetails.forEach(affiliation =>{
						// 											if(affiliation.app_id != null){
						// 												var app_idArr = affiliation.app_id.split(",");
						// 												app_idArr.forEach(app_id =>{
						// 													if(app_id == application_id){
						// 														affiliation_Details.push(affiliation);
																				
						// 													}
						// 												})
						// 											}
						// 										})
						// 										setTimeout(()=>{
																	
						// 											if(affiliation_Details.length > 1){
						// 												affiliation_letter_length = affiliation_letter_length  + 1;
						// 												console.log("----13----");
						// 												var studentName = prefix + affiliation_Details[0].studentName;
						// 												var courseName = affiliation_Details[0].courseName;
						// 												var specialization = affiliation_Details[0].specialization;
						// 												var passingMonthYear = affiliation_Details[0].yearofpassing;
						// 												var duration = converter.toWords(affiliation_Details[0].duration);
						// 												var passingClass = affiliation_Details[0].division;
						// 												var instruction_medium;
						// 												if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
						// 													instruction_medium = "English";
						// 												}else{
						// 													instruction_medium = affiliation_Details[0].instruction_medium;
						// 												}
						// 												var education = affiliation_Details[0].education;
																		
						// 												var affiliationId = '';
																		
																			
						// 												affiliation_Details.forEach(affiliation =>{
						// 														console.log(affiliation.academicYear);
						// 														faculty.colleges.forEach(singleDetail=>{
						// 															console.log(singleDetail.name);
						// 															models.College.find({
						// 																where : {
						// 																	id : singleDetail.collegeId
						// 																}
						// 															}).then(function(college){
						// 																if(affiliation.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
						// 																	console.log("same");
						// 																	if(college.type == 'college'){
						// 																		console.log("college");
						// 																		collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + " which is affiliated to Mumbai University.")
						// 																	}else if(college.type == 'department'){
						// 																		console.log("department");
						// 																		collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + ", Mumbai University.")
						// 																	}
						// 																}
						// 																console.log("collegeData inside college == " + JSON.stringify(collegeData))
						// 															})
						// 														})
						// 														affiliationId += affiliation.id +','
						// 														console.log("collegeData inside == " + JSON.stringify(collegeData))
						// 													})
								
						// 												setTimeout(()=>{
						// 													console.log("collegeData == " + JSON.stringify(collegeData))
						// 													console.log("----13----");
						// 													var affiliationIds = affiliationId.split(',');
						// 													console.log("affiliationIds == " ,affiliationIds)
						// 													affiliationIds.pop();
						// 													console.log("affiliationIds == " ,affiliationIds)
						// 													affiliationId = affiliationIds.join(',');
						// 													console.log("affiliationId == " + affiliationId);
						// 													setTimeout(function(){
						// 														console.log("----14----");
						// 														if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
						// 															console.log("----15----");
						// 															models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																if(MaxReferenceNo[0].maxNumber == null){
						// 																	reference_no = 1001;
						// 																}else{
						// 																	reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																}
								
						// 																models.Affiliation_Letter.updateReferenceNumber_new(affiliationId,reference_no).then(function(updatedDetails){
						// 																	console.log("----16----");
						// 																	var ref_no = reference_no;
						// 																	self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 																	passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																		if(err) {
						// 																			console.log("----17----");
						// 																			res.json({ 
						// 																				status: 400
						// 																			})
						// 																		}else{
						// 																			console.log("----18----");
						// 																			models.Emailed_Docs.find({
						// 																				where :{
						// 																					app_id:app_id,
						// 																					filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																				}
						// 																			}).then(function(emailDoc){
						// 																				if(!emailDoc){
						// 																					models.Emailed_Docs.create({
						// 																					filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																					doc_type : "AffiliationLetter",
						// 																					category : "AffiliationLetter",
						// 																					user_id: user_id,
						// 																					transcript_id: null,
						// 																					marklist_id : null,
						// 																					app_id:app_id,
						// 																					curriculum_id : null
						// 																					}).then((result)=>{
						// 																					// logger.debug(" result : "+JSON.stringify(result))
						// 																					})
						// 																				}
						// 																			})
						// 																		}
						// 																	})
						// 																})
						// 															});
						// 														}else{
						// 															console.log("----19----");
						// 															var ref_no = affiliation_Details[0].reference_no;
						// 															self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 															passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																if(err) {
						// 																	console.log("----20----");
						// 																res.json({ 
						// 																		status: 400
						// 																	})
						// 																}else{
						// 																	console.log("----21----");
						// 																	models.Emailed_Docs.find({
						// 																		where :{
						// 																			app_id:app_id,
						// 																			filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																		}
						// 																	}).then(function(emailDoc){
						// 																		if(!emailDoc){
						// 																			models.Emailed_Docs.create({
						// 																			filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																			doc_type : "AffiliationLetter",
						// 																			category : "AffiliationLetter",
						// 																			user_id: user_id,
						// 																			transcript_id: null,
						// 																			marklist_id : null,
						// 																			app_id:app_id,
						// 																			curriculum_id : null
						// 																			}).then((result)=>{
						// 																			// logger.debug(" result : "+JSON.stringify(result))
						// 																			})
						// 																		}
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													},3000); 
						// 												},4000);   
						// 											}else if(affiliation_Details.length == 1){
						// 												affiliation_letter_length = affiliation_letter_length  + 1;
						// 												if(faculty.colleges.length == 1){
						// 													models.College.find ({
						// 														where :{
						// 															id : faculty.colleges[0].collegeId
						// 														}
						// 													}).then(function(college){
						// 														var studentName = prefix + affiliation_Details[0].studentName;
						// 														var collegeName ;
						// 														if(college.type == 'college'){
						// 															collegeName = affiliation_Details[0].collegeName + " which is affiliated to ";
						// 														}else if(college.type == 'department'){
						// 															collegeName = affiliation_Details[0].collegeName + ", ";
						// 														}
						// 														var courseName = affiliation_Details[0].courseName;
						// 														var specialization = affiliation_Details[0].specialization;
						// 														var passingMonthYear = affiliation_Details[0].yearofpassing;
						// 														var duration = converter.toWords(affiliation_Details[0].duration);
						// 														var passingClass = affiliation_Details[0].division;
						// 														var instruction_medium;
								
						// 														if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
						// 															instruction_medium = "English";
						// 														}else{
						// 															instruction_medium = affiliation_Details[0].instruction_medium;
						// 														}
						// 														var education = affiliation_Details[0].education;
						// 														setTimeout(()=>{
						// 															if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
						// 															console.log("affiliation_Details[0].reference_no == " + affiliation_Details[0].reference_no)
						// 																models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																	if(MaxReferenceNo[0].maxNumber == null){
						// 																		reference_no = 1001;
						// 																	}else{
						// 																		reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																	}
						// 																	models.Affiliation_Letter.update(
						// 																		{
						// 																			reference_no : reference_no
						// 																		},{
						// 																		where :{
						// 																			id : affiliation_Details[0].id
						// 																		}
						// 																	}).then(function(updatedDetails){
						// 																		//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																		var ref_no = reference_no;
						// 																		self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																		passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																			if(err) {
						// 																				res.json({ 
						// 																					status: 400
						// 																				})
						// 																			}else{
						// 																				models.Emailed_Docs.find({
						// 																					where :{
						// 																						app_id:app_id,
						// 																						filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																					}
						// 																				}).then(function(emailDoc){
						// 																					if(!emailDoc){
						// 																						models.Emailed_Docs.create({
						// 																						filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																						doc_type : "AffiliationLetter",
						// 																						category : "AffiliationLetter",
						// 																						user_id: user_id,
						// 																						transcript_id: null,
						// 																						marklist_id : null,
						// 																						app_id:app_id,
						// 																						curriculum_id : null
						// 																						}).then((result)=>{
						// 																						// logger.debug(" result : "+JSON.stringify(result))
						// 																						})
						// 																					}
						// 																				})
						// 																			}
						// 																		})
						// 																	})
						// 																})
						// 															}else{
						// 																var ref_no = affiliation_Details[0].reference_no;
						// 																self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																	if(err) {
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																				doc_type : "AffiliationLetter",
						// 																				category : "AffiliationLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														})
						// 													})
						// 												}
						// 											}
						// 										},1500)
						// 									})
						// 								})
						// 							}
						// 							setTimeout(()=>{
						// 								models.userMarkList.findAll({
						// 									where :{
						// 										type : "Bachelors",
						// 										user_id : application.user_id
						// 									}
						// 								}).then(function(bachelor_Details){
						// 									console.log('----33----')
						// 									var facultyData = [];
						// 									var bachelorDetails = [];
						// 									bachelor_Details.forEach(bachelor =>{
						// 										if(bachelor.app_id != null){
						// 											var app_idArr = bachelor.app_id.split(",");
						// 											app_idArr.forEach(app_id =>{
						// 												if(app_id == application_id){
						// 													bachelorDetails.push(bachelor);
						// 												}
						// 											})
						// 										}
						// 									})
						// 									if(bachelorDetails){
						// 										console.log('----34----')
						// 										bachelorDetails.forEach(bachelor =>{
						// 											var flag = false;
						// 											var college = [];
						// 											if(facultyData.length > 0){
						// 												facultyData.forEach(data=>{
						// 													if(data.faculty == bachelor.faculty){
						// 														flag = true;
						// 														var count = 0;
						// 														data.colleges.forEach(clg=>{
						// 															if(clg.collegeId == bachelor.collegeId){
						// 																count ++;
						// 															}
						// 														})
						// 														if(count <= data.colleges.length){
						// 															if(bachelor.patteren == 'Annual'){
						// 																data.colleges.push({
						// 																	name : bachelor.name,
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 															}else if(bachelor.patteren == 'Semester'){
						// 																switch(bachelor.name){
						// 																	case 'Semester 2' : 
						// 																		data.colleges.push({
						// 																			name : 'First Year',
						// 																			collegeId : bachelor.collegeId
						// 																		})
						// 																		break;
						// 																	case 'Semester 4' :
						// 																		data.colleges.push({
						// 																			name : 'Second Year',
						// 																			collegeId : bachelor.collegeId
						// 																		})
						// 																		break;
						// 																	case 'Semester 6' :
						// 																		data.colleges.push({
						// 																			name : 'Third Year',
						// 																			collegeId : bachelor.collegeId
						// 																		})
						// 																		break;
						// 																	case 'Semester 8' :
						// 																		data.colleges.push({
						// 																			name : 'Fourth Year',
						// 																			collegeId : bachelor.collegeId
						// 																		})
						// 																		break;
						// 																	case 'Semester 10' :
						// 																		data.colleges.push({
						// 																			name : 'Fifth Year',
						// 																			collegeId : bachelor.collegeId
						// 																		})
						// 																		break;
						// 																	default :
						// 																		data.colleges.push({
						// 																			name : '',
						// 																			collegeId : bachelor.collegeId
						// 																		})

						// 																}
						// 															}
						// 														}
						// 													}
						// 												})
						// 												if(flag == false){
						// 													var colleges = [];
						// 													if(bachelor.patteren == 'Annual'){
						// 														colleges.push({
						// 															name : bachelor.name,
						// 															collegeId : bachelor.collegeId
						// 														})
						// 													}else if(bachelor.patteren == 'Semester'){
						// 														switch(bachelor.name){
						// 															case 'Semester 2' : 
						// 																colleges.push({
						// 																	name : 'First Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 4' :
						// 																colleges.push({
						// 																	name : 'Second Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 6' :
						// 																colleges.push({
						// 																	name : 'Third Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 8' :
						// 															colleges.push({
						// 																	name : 'Fourth Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 10' :
						// 																colleges.push({
						// 																	name : 'Fifth Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															default :
						// 																colleges.push({
						// 																	name : '',
						// 																	collegeId : bachelor.collegeId
						// 																})

						// 														}
						// 													}
																			
						// 													facultyData.push({
						// 														type:bachelor.type,
						// 														faculty : bachelor.faculty,
						// 														colleges : colleges
						// 													})
						// 												}
						// 											}else{
						// 											var colleges = [];
						// 													if(bachelor.patteren == 'Annual'){
						// 														colleges.push({
						// 															name : bachelor.name,
						// 															collegeId : bachelor.collegeId
						// 														})
						// 													}else if(bachelor.patteren == 'Semester'){
						// 														switch(bachelor.name){
						// 															case 'Semester 2' : 
						// 																colleges.push({
						// 																	name : 'First Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 4' :
						// 																colleges.push({
						// 																	name : 'Second Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 6' :
						// 																colleges.push({
						// 																	name : 'Third Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 8' :
						// 															colleges.push({
						// 																	name : 'Fourth Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															case 'Semester 10' :
						// 																colleges.push({
						// 																	name : 'Fifth Year',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 																break;
						// 															default :
						// 																colleges.push({
						// 																	name : '',
						// 																	collegeId : bachelor.collegeId
						// 																})
						// 														}
						// 													}
						// 												facultyData.push({
						// 													type:bachelor.type,
						// 													faculty : bachelor.faculty,
						// 													colleges : colleges
						// 												})
						// 											}
						// 										})
						// 										console.log('----35----')
						// 										facultyData.forEach(faculty=>{
						// 											models.Affiliation_Letter.findAll({
						// 												where :{
						// 													user_id : application.user_id,
						// 													education : faculty.type + '_' + faculty.faculty
						// 												}
						// 											}).then(function(affiliationDetails){
						// 												var affiliation_Details = [];
						// 												affiliationDetails.forEach(affiliation =>{
						// 													if(affiliation.app_id != null){
						// 														var app_idArr = affiliation.app_id.split(",");
						// 														app_idArr.forEach(app_id =>{
						// 															if(app_id == application_id){
						// 																affiliation_Details.push(affiliation);
						// 															}
						// 														})
						// 													}
						// 												})
																		
						// 												if(affiliation_Details.length > 1){
						// 													affiliation_letter_length = affiliation_letter_length  + 1;
						// 													console.log("----13----");
						// 													var studentName = prefix + affiliation_Details[0].studentName;
						// 													var courseName = affiliation_Details[0].courseName;
						// 													var specialization = affiliation_Details[0].specialization;
						// 													var passingMonthYear = affiliation_Details[0].yearofpassing;
						// 													var duration = converter.toWords(affiliation_Details[0].duration);
						// 													var passingClass = affiliation_Details[0].division;
						// 													var instruction_medium;
						// 													if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
						// 														instruction_medium = "English";
						// 													}else{
						// 														instruction_medium = affiliation_Details[0].instruction_medium;
						// 													}
						// 													var education = affiliation_Details[0].education;
																			
						// 													var affiliationId = '';
																			
																				
						// 													affiliation_Details.forEach(affiliation =>{
						// 															console.log(affiliation.academicYear);
						// 															faculty.colleges.forEach(singleDetail=>{
						// 																console.log(singleDetail.name);
						// 																models.College.find({
						// 																	where : {
						// 																		id : singleDetail.collegeId
						// 																	}
						// 																}).then(function(college){
						// 																	if(affiliation.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
						// 																		console.log("same");
						// 																		if(college.type == 'college'){
						// 																			console.log("college");
						// 																			collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + " which is affiliated to Mumbai University.")
						// 																		}else if(college.type == 'department'){
						// 																			console.log("department");
						// 																			collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + ", Mumbai University.")
						// 																		}
						// 																	}
						// 																	console.log("collegeData inside college == " + JSON.stringify(collegeData))
						// 																})
						// 															})
						// 															affiliationId += instruction.id +','
						// 															console.log("collegeData inside == " + JSON.stringify(collegeData))
						// 														})
									
						// 													setTimeout(()=>{
						// 														console.log("collegeData == " + JSON.stringify(collegeData))
						// 														console.log("----13----");
						// 														var affiliationIds = affiliationId.split(',');
						// 														console.log("affiliationIds == " ,affiliationIds)
						// 														affiliationIds.pop();
						// 														console.log("affiliationIds == " ,affiliationIds)
						// 														affiliationId = affiliationIds.join(',');
						// 														console.log("affiliationId == " + affiliationId);
						// 														setTimeout(function(){
						// 															console.log("----14----");
						// 															if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
						// 																console.log("----15----");
						// 																models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																	if(MaxReferenceNo[0].maxNumber == null){
						// 																		reference_no = 1001;
						// 																	}else{
						// 																		reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																	}
									
						// 																	models.Affiliation_Details.updateReferenceNumber_new(affiliationId,reference_no).then(function(updatedDetails){
						// 																		console.log("----16----");
						// 																		var ref_no = reference_no;
						// 																		self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 																		passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																			if(err) {
						// 																				console.log("----17----");
						// 																				res.json({ 
						// 																					status: 400
						// 																				})
						// 																			}else{
						// 																				console.log("----18----");
						// 																				models.Emailed_Docs.find({
						// 																					where :{
						// 																						app_id:app_id,
						// 																						filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																					}
						// 																				}).then(function(emailDoc){
						// 																					if(!emailDoc){
						// 																						models.Emailed_Docs.create({
						// 																						filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																						doc_type : "AffiliationLetter",
						// 																						category : "AffiliationLetter",
						// 																						user_id: user_id,
						// 																						transcript_id: null,
						// 																						marklist_id : null,
						// 																						app_id:app_id,
						// 																						curriculum_id : null
						// 																						}).then((result)=>{
						// 																						// logger.debug(" result : "+JSON.stringify(result))
						// 																						})
						// 																					}
						// 																				})
						// 																			}
						// 																		})
						// 																	})
						// 																});
						// 															}else{
						// 																console.log("----19----");
						// 																var ref_no = affiliation_Details[0].reference_no;
						// 																self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																	if(err) {
						// 																		console.log("----20----");
						// 																	res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		console.log("----21----");
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																				doc_type : "AffiliationLetter",
						// 																				category : "AffiliationLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														},3000); 
						// 													},4000);   
						// 												}else if(affiliation_Details.length == 1){
						// 													affiliation_letter_length = affiliation_letter_length  + 1;
						// 													if(faculty.colleges.length == 1){
						// 														models.College.find ({
						// 															where :{
						// 																id : faculty.colleges[0].collegeId
						// 															}
						// 														}).then(function(college){
						// 															var studentName = prefix + affiliation_Details[0].studentName;
						// 															var collegeName ;
						// 															if(college.type == 'college'){
						// 																collegeName = affiliation_Details[0].collegeName + " which is affiliated to ";
						// 															}else if(college.type == 'department'){
						// 																collegeName = affiliation_Details[0].collegeName + ", ";
						// 															}
						// 															var courseName = affiliation_Details[0].courseName;
						// 															var specialization = affiliation_Details[0].specialization;
						// 															var passingMonthYear = affiliation_Details[0].yearofpassing;
						// 															var duration = converter.toWords(affiliation_Details[0].duration);
						// 															var passingClass = affiliation_Details[0].division;
						// 															var instruction_medium;
									
						// 															if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
						// 																instruction_medium = "English";
						// 															}else{
						// 																instruction_medium = affiliation_Details[0].instruction_medium;
						// 															}
						// 															var education = affiliation_Details[0].education;
						// 															setTimeout(()=>{
						// 																if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
						// 																console.log("affiliation_Details[0].reference_no == " + affiliation_Details[0].reference_no)
						// 																	models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 																		if(MaxReferenceNo[0].maxNumber == null){
						// 																			reference_no = 1001;
						// 																		}else{
						// 																			reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 																		}
						// 																		models.Affiliation_Letter.update(
						// 																			{
						// 																				reference_no : reference_no
						// 																			},{
						// 																			where :{
						// 																				id : affiliation_Details[0].id
						// 																			}
						// 																		}).then(function(updatedDetails){
						// 																			//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																			var ref_no = reference_no;
						// 																			self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																			passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																				if(err) {
						// 																					res.json({ 
						// 																						status: 400
						// 																					})
						// 																				}else{
						// 																					models.Emailed_Docs.find({
						// 																						where :{
						// 																							app_id:app_id,
						// 																							filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																						}
						// 																					}).then(function(emailDoc){
						// 																						if(!emailDoc){
						// 																							models.Emailed_Docs.create({
						// 																							filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																							doc_type : "AffiliationLetter",
						// 																							category : "AffiliationLetter",
						// 																							user_id: user_id,
						// 																							transcript_id: null,
						// 																							marklist_id : null,
						// 																							app_id:app_id,
						// 																							curriculum_id : null
						// 																							}).then((result)=>{
						// 																							// logger.debug(" result : "+JSON.stringify(result))
						// 																							})
						// 																						}
						// 																					})
						// 																				}
						// 																			})
						// 																		})
						// 																	})
						// 																}else{
						// 																	var ref_no = affiliation_Details[0].reference_no;
						// 																	self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																	passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																		if(err) {
						// 																			res.json({ 
						// 																				status: 400
						// 																			})
						// 																		}else{
						// 																			models.Emailed_Docs.find({
						// 																				where :{
						// 																					app_id:app_id,
						// 																					filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																				}
						// 																			}).then(function(emailDoc){
						// 																				if(!emailDoc){
						// 																					models.Emailed_Docs.create({
						// 																					filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																					doc_type : "AffiliationLetter",
						// 																					category : "AffiliationLetter",
						// 																					user_id: user_id,
						// 																					transcript_id: null,
						// 																					marklist_id : null,
						// 																					app_id:app_id,
						// 																					curriculum_id : null
						// 																					}).then((result)=>{
						// 																					// logger.debug(" result : "+JSON.stringify(result))
						// 																					})
						// 																				}
						// 																			})
						// 																		}
						// 																	})
						// 																}
						// 															})
						// 														})
						// 													}
						// 												}
						// 											})
						// 										})
						// 									}
						// 								})
						// 							},3000)
						// 						}
						// 					})
						// 				}else if(appliedDetails.applying_for == 'Bachelors'){
						// 					console.log("----6----");
						// 					var bachelorDetails = [];
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Bachelors",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(bachelor_Details){
						// 						console.log("----7----");
						// 						bachelor_Details.forEach(bachelor =>{
						// 							if(bachelor.app_id != null){
						// 								var app_idArr = bachelor.app_id.split(",");
						// 								app_idArr.forEach(app_id =>{
						// 									if(app_id == application_id){
						// 										bachelorDetails.push(bachelor);
						// 									}
						// 								})
						// 							}
						// 						})
						// 						console.log("----8----");
						// 						if(bachelorDetails){
						// 							console.log("----9----");
						// 							var facultyData = [];
						// 							bachelorDetails.forEach(bachelor =>{
						// 								var flag = false;
						// 								var college = [];
						// 								if(facultyData.length > 0){
						// 									facultyData.forEach(data=>{
						// 										if(data.faculty == bachelor.faculty){
						// 											flag = true;
						// 											var count = 0;
						// 											data.colleges.forEach(clg=>{
						// 												if(clg.collegeId == bachelor.collegeId){
						// 													count ++;
						// 												}
						// 											})
						// 											if(count <= data.colleges.length){
						// 												if(bachelor.patteren == 'Annual'){
						// 													data.colleges.push({
						// 														name : bachelor.name,
						// 														collegeId : bachelor.collegeId
						// 													})
						// 												}else if(bachelor.patteren == 'Semester'){
						// 													switch(bachelor.name){
						// 														case 'Semester 2' : 
						// 															data.colleges.push({
						// 																name : 'First Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 4' :
						// 															data.colleges.push({
						// 																name : 'Second Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 6' :
						// 															data.colleges.push({
						// 																name : 'Third Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 8' :
						// 															data.colleges.push({
						// 																name : 'Fourth Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 10' :
						// 															data.colleges.push({
						// 																name : 'Fifth Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														default :
						// 															data.colleges.push({
						// 																name : '',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 													}
						// 												}
						// 											}
						// 										}
						// 									})
						// 									if(flag == false){
						// 										var colleges = [];
						// 										if(bachelor.patteren == 'Annual'){
						// 											colleges.push({
						// 												name : bachelor.name,
						// 												collegeId : bachelor.collegeId
						// 											})
						// 										}else if(bachelor.patteren == 'Semester'){
						// 											switch(bachelor.name){
						// 												case 'Semester 2' : 
						// 													colleges.push({
						// 														name : 'First Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 4' :
						// 													colleges.push({
						// 														name : 'Second Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 6' :
						// 													colleges.push({
						// 														name : 'Third Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 8' :
						// 												colleges.push({
						// 														name : 'Fourth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 10' :
						// 													colleges.push({
						// 														name : 'Fifth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												default :
						// 													colleges.push({
						// 														name : '',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 											}
						// 										}
																
						// 										facultyData.push({
						// 											type:bachelor.type,
						// 											faculty : bachelor.faculty,
						// 											colleges : colleges
						// 										})
						// 									}
						// 								}else{
						// 								var colleges = [];
						// 										if(bachelor.patteren == 'Annual'){
						// 											colleges.push({
						// 												name : bachelor.name,
						// 												collegeId : bachelor.collegeId
						// 											})
						// 										}else if(bachelor.patteren == 'Semester'){
						// 											switch(bachelor.name){
						// 												case 'Semester 2' : 
						// 													colleges.push({
						// 														name : 'First Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 4' :
						// 													colleges.push({
						// 														name : 'Second Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 6' :
						// 													colleges.push({
						// 														name : 'Third Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 8' :
						// 												colleges.push({
						// 														name : 'Fourth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 10' :
						// 													colleges.push({
						// 														name : 'Fifth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												default :
						// 													colleges.push({
						// 														name : '',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 											}
						// 										}
						// 									facultyData.push({
						// 										type:bachelor.type,
						// 										faculty : bachelor.faculty,
						// 										colleges : colleges
						// 									})
						// 								}
						// 							})
						// 							console.log("----10----");
						// 							console.log("facultyData == "+ JSON.stringify(facultyData));
						// 							facultyData.forEach(faculty=>{
						// 								models.Affiliation_Letter.findAll({
						// 									where :{
						// 										user_id : application.user_id,
						// 										education : faculty.type + '_' + faculty.faculty
						// 									}
						// 								}).then(function(affiliationDetails){
						// 									console.log("----11----");
						// 									// console.log("affiliationDetails == " + JSON.stringify(affiliationDetails))
						// 									var affiliation_Details = [];
						// 									affiliationDetails.forEach(affiliation =>{
						// 										if(affiliation.app_id != null){
						// 											var app_idArr = affiliation.app_id.split(",");
						// 											app_idArr.forEach(app_id =>{
						// 												if(app_id == application_id){
						// 													affiliation_Details.push(affiliation);
						// 												}
						// 											})
						// 										}
						// 									})
						// 									console.log("----12----");
						// 									console.log("affiliation_Details == " + JSON.stringify(affiliation_Details))
															
						// 									if(affiliation_Details.length > 1){
						// 										console.log("----13----");
						// 										affiliation_letter_length =affiliation_letter_length  + 1;
						// 										var studentName = prefix + affiliation_Details[0].studentName;
						// 										var courseName = affiliation_Details[0].courseName;
						// 										var specialization = affiliation_Details[0].specialization;
						// 										var passingMonthYear = affiliation_Details[0].yearofpassing;
						// 										var duration = converter.toWords(affiliation_Details[0].duration);
						// 										var passingClass = affiliation_Details[0].division;
						// 										var instruction_medium;
						// 										if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
						// 											instruction_medium = "English";
						// 										}else{
						// 											instruction_medium = affiliation_Details[0].instruction_medium;
						// 										}
						// 										var education = affiliation_Details[0].education;
																
						// 										var affiliationId = '';
																
																	
						// 										affiliation_Details.forEach(affiliation =>{
						// 												console.log(affiliation.academicYear);
						// 												faculty.colleges.forEach(singleDetail=>{
						// 													console.log(singleDetail.name);
						// 													models.College.find({
						// 														where : {
						// 															id : singleDetail.collegeId
						// 														}
						// 													}).then(function(college){
						// 														if(affiliation.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
						// 															console.log("same");
						// 															if(college.type == 'college'){
						// 																console.log("college");
						// 																collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + " which is affiliated to Mumbai University.")
						// 															}else if(college.type == 'department'){
						// 																console.log("department");
						// 																collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + ", Mumbai University.")
						// 															}
						// 														}
						// 														console.log("collegeData inside college == " + JSON.stringify(collegeData))
						// 													})
						// 												})
						// 												affiliationId += affiliation.id +','
						// 												console.log("collegeData inside == " + JSON.stringify(collegeData))
						// 											})
						
						// 										setTimeout(()=>{
						// 											console.log("collegeData == " + JSON.stringify(collegeData))
						// 											console.log("----13----");
						// 											var affiliationIds = affiliationId.split(',');
						// 											console.log("affiliationIds == " ,affiliationIds)
						// 											affiliationIds.pop();
						// 											console.log("affiliationIds == " ,affiliationIds)
						// 											affiliationId = affiliationIds.join(',');
						// 											console.log("affiliationId == " + affiliationId);
						// 											setTimeout(function(){
						// 												console.log("----14----");
						// 												if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
						// 													console.log("----15----");
						// 													models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 														if(MaxReferenceNo[0].maxNumber == null){
						// 															reference_no = 1001;
						// 														}else{
						// 															reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 														}
						
						// 														models.Affiliation_Letter.updateReferenceNumber_new(affiliationId,reference_no).then(function(updatedDetails){
						// 															console.log("----16----");
						// 															var ref_no = reference_no;
						// 															self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 															passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																if(err) {
						// 																	console.log("----17----");
						// 																	res.json({ 
						// 																		status: 400
						// 																	})
						// 																}else{
						// 																	console.log("----18----");
						// 																	models.Emailed_Docs.find({
						// 																		where :{
						// 																			app_id:app_id,
						// 																			filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																		}
						// 																	}).then(function(emailDoc){
						// 																		if(!emailDoc){
						// 																			models.Emailed_Docs.create({
						// 																			filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																			doc_type : "AffiliationLetter",
						// 																			category : "AffiliationLetter",
						// 																			user_id: user_id,
						// 																			transcript_id: null,
						// 																			marklist_id : null,
						// 																			app_id:app_id,
						// 																			curriculum_id : null
						// 																			}).then((result)=>{
						// 																			// logger.debug(" result : "+JSON.stringify(result))
						// 																			})
						// 																		}
						// 																	})
						// 																}
						// 															})
						// 														})
						// 													});
						// 												}else{
						// 													console.log("----19----");
						// 													var ref_no = affiliation_Details[0].reference_no;
						// 													self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 													passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 														if(err) {
						// 															console.log("----20----");
						// 														res.json({ 
						// 																status: 400
						// 															})
						// 														}else{
						// 															console.log("----21----");
						// 															models.Emailed_Docs.find({
						// 																where :{
						// 																	app_id:app_id,
						// 																	filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																}
						// 															}).then(function(emailDoc){
						// 																if(!emailDoc){
						// 																	models.Emailed_Docs.create({
						// 																	filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																	doc_type : "AffiliationLetter",
						// 																	category : "AffiliationLetter",
						// 																	user_id: user_id,
						// 																	transcript_id: null,
						// 																	marklist_id : null,
						// 																	app_id:app_id,
						// 																	curriculum_id : null
						// 																	}).then((result)=>{
						// 																	// logger.debug(" result : "+JSON.stringify(result))
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													})
						// 												}
						// 											},3000); 
						// 										},4000);   
						// 									}else if(affiliation_Details.length == 1){
						// 										affiliation_letter_length = affiliation_letter_length  + 1;
						// 										if(faculty.colleges.length == 1){
						// 											models.College.find ({
						// 												where :{
						// 													id : faculty.colleges[0].collegeId
						// 												}
						// 											}).then(function(college){
						// 												var studentName = prefix +affiliation_Details[0].studentName;
						// 												var collegeName ;
						// 												if(college.type == 'college'){
						// 													collegeName =affiliation_Details[0].collegeName + " which is affiliated to ";
						// 												}else if(college.type == 'department'){
						// 													collegeName = affiliation_Details[0].collegeName + ", ";
						// 												}
						// 												var courseName = affiliation_Details[0].courseName;
						// 												var specialization = affiliation_Details[0].specialization;
						// 												var passingMonthYear = affiliation_Details[0].yearofpassing;
						// 												var duration = converter.toWords(affiliation_Details[0].duration);
						// 												var passingClass = affiliation_Details[0].division;
						// 												var instruction_medium;
						
						// 												if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
						// 													instruction_medium = "English";
						// 												}else{
						// 													instruction_medium = affiliation_Details[0].instruction_medium;
						// 												}
						// 												var education = affiliation_Details[0].education;
						// 												setTimeout(()=>{
						// 													if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
						// 													console.log("affiliation_Details[0].reference_no == " + affiliation_Details[0].reference_no)
						// 														models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 															if(MaxReferenceNo[0].maxNumber == null){
						// 																reference_no = 1001;
						// 															}else{
						// 																reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 															}
						// 															models.Affiliation_Letter.update(
						// 																{
						// 																	reference_no : reference_no
						// 																},{
						// 																where :{
						// 																	id : affiliation_Details[0].id
						// 																}
						// 															}).then(function(updatedDetails){
						// 																//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																var ref_no = reference_no;
						// 																self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																	if(err) {
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																				doc_type : "AffiliationLetter",
						// 																				category : "AffiliationLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															})
						// 														})
						// 													}else{
						// 														var ref_no = affiliation_Details[0].reference_no;
						// 														self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 														passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 															if(err) {
						// 																res.json({ 
						// 																	status: 400
						// 																})
						// 															}else{
						// 																models.Emailed_Docs.find({
						// 																	where :{
						// 																		app_id:app_id,
						// 																		filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																	}
						// 																}).then(function(emailDoc){
						// 																	if(!emailDoc){
						// 																		models.Emailed_Docs.create({
						// 																		filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																		doc_type : "AffiliationLetter",
						// 																		category : "AffiliationLetter",
						// 																		user_id: user_id,
						// 																		transcript_id: null,
						// 																		marklist_id : null,
						// 																		app_id:app_id,
						// 																		curriculum_id : null
						// 																		}).then((result)=>{
						// 																		// logger.debug(" result : "+JSON.stringify(result))
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														})
						// 													}
						// 												})
						// 											})
						// 										}
						// 									}
						// 								})
						// 							})
						// 						}
						// 					})
						// 				}else if(appliedDetails.applying_for == 'Masters'){
						// 					console.log("----6----");
						// 					var bachelorDetails = [];
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Masters",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(bachelor_Details){
						// 						console.log("----7----");
						// 						bachelor_Details.forEach(bachelor =>{
						// 							if(bachelor.app_id != null){
						// 								var app_idArr = bachelor.app_id.split(",");
						// 								app_idArr.forEach(app_id =>{
						// 									if(app_id == application_id){
						// 										bachelorDetails.push(bachelor);
						// 									}
						// 								})
						// 							}
						// 						})
						// 						console.log("----8----");
						// 						if(bachelorDetails){
						// 							console.log("----9----");
						// 							var facultyData = [];
						// 							bachelorDetails.forEach(bachelor =>{
						// 								var flag = false;
						// 								var college = [];
						// 								if(facultyData.length > 0){
						// 									facultyData.forEach(data=>{
						// 										if(data.faculty == bachelor.faculty){
						// 											flag = true;
						// 											var count = 0;
						// 											data.colleges.forEach(clg=>{
						// 												if(clg.collegeId == bachelor.collegeId){
						// 													count ++;
						// 												}
						// 											})
						// 											if(count <= data.colleges.length){
						// 												if(bachelor.patteren == 'Annual'){
						// 													data.colleges.push({
						// 														name : bachelor.name,
						// 														collegeId : bachelor.collegeId
						// 													})
						// 												}else if(bachelor.patteren == 'Semester'){
						// 													switch(bachelor.name){
						// 														case 'Semester 2' : 
						// 															data.colleges.push({
						// 																name : 'First Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 4' :
						// 															data.colleges.push({
						// 																name : 'Second Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 6' :
						// 															data.colleges.push({
						// 																name : 'Third Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 8' :
						// 															data.colleges.push({
						// 																name : 'Fourth Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 10' :
						// 															data.colleges.push({
						// 																name : 'Fifth Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														default :
						// 															data.colleges.push({
						// 																name : '',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 													}
						// 												}
						// 											}
						// 										}
						// 									})
						// 									if(flag == false){
						// 										var colleges = [];
						// 										if(bachelor.patteren == 'Annual'){
						// 											colleges.push({
						// 												name : bachelor.name,
						// 												collegeId : bachelor.collegeId
						// 											})
						// 										}else if(bachelor.patteren == 'Semester'){
						// 											switch(bachelor.name){
						// 												case 'Semester 2' : 
						// 													colleges.push({
						// 														name : 'First Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 4' :
						// 													colleges.push({
						// 														name : 'Second Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 6' :
						// 													colleges.push({
						// 														name : 'Third Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 8' :
						// 												colleges.push({
						// 														name : 'Fourth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 10' :
						// 													colleges.push({
						// 														name : 'Fifth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												default :
						// 													colleges.push({
						// 														name : '',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 											}
						// 										}
																
						// 										facultyData.push({
						// 											type:bachelor.type,
						// 											faculty : bachelor.faculty,
						// 											colleges : colleges
						// 										})
						// 									}
						// 								}else{
						// 								var colleges = [];
						// 										if(bachelor.patteren == 'Annual'){
						// 											colleges.push({
						// 												name : bachelor.name,
						// 												collegeId : bachelor.collegeId
						// 											})
						// 										}else if(bachelor.patteren == 'Semester'){
						// 											switch(bachelor.name){
						// 												case 'Semester 2' : 
						// 													colleges.push({
						// 														name : 'First Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 4' :
						// 													colleges.push({
						// 														name : 'Second Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 6' :
						// 													colleges.push({
						// 														name : 'Third Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 8' :
						// 												colleges.push({
						// 														name : 'Fourth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 10' :
						// 													colleges.push({
						// 														name : 'Fifth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												default :
						// 													colleges.push({
						// 														name : '',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 											}
						// 										}
						// 									facultyData.push({
						// 										type:bachelor.type,
						// 										faculty : bachelor.faculty,
						// 										colleges : colleges
						// 									})
						// 								}
						// 							})
						// 							console.log("----10----");
						// 							console.log("facultyData == "+ JSON.stringify(facultyData));
						// 							facultyData.forEach(faculty=>{
						// 								models.Affiliation_Letter.findAll({
						// 									where :{
						// 										user_id : application.user_id,
						// 										education : faculty.type + '_' + faculty.faculty
						// 									}
						// 								}).then(function(affiliationDetails){
						// 									console.log("----11----");
						// 									// console.log("affiliationDetails == " + JSON.stringify(affiliationDetails))
						// 									var affiliation_Details = [];
						// 									affiliationDetails.forEach(affiliation =>{
						// 										if(affiliation.app_id != null){
						// 											var app_idArr = affiliation.app_id.split(",");
						// 											app_idArr.forEach(app_id =>{
						// 												if(app_id == application_id){
						// 													affiliation_Details.push(affiliation);
						// 												}
						// 											})
						// 										}
						// 									})
						// 									console.log("----12----");
						// 									console.log("affiliation_Details == " + JSON.stringify(affiliation_Details))
															
						// 									if(affiliation_Details.length > 1){
						// 										console.log("----13----");
						// 										affiliation_letter_length =affiliation_letter_length  + 1;
						// 										var studentName = prefix + affiliation_Details[0].studentName;
						// 										var courseName = affiliation_Details[0].courseName;
						// 										var specialization = affiliation_Details[0].specialization;
						// 										var passingMonthYear = affiliation_Details[0].yearofpassing;
						// 										var duration = converter.toWords(affiliation_Details[0].duration);
						// 										var passingClass = affiliation_Details[0].division;
						// 										var instruction_medium;
						// 										if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
						// 											instruction_medium = "English";
						// 										}else{
						// 											instruction_medium = affiliation_Details[0].instruction_medium;
						// 										}
						// 										var education = affiliation_Details[0].education;
																
						// 										var affiliationId = '';
																
																	
						// 										affiliation_Details.forEach(affiliation =>{
						// 												console.log(affiliation.academicYear);
						// 												faculty.colleges.forEach(singleDetail=>{
						// 													console.log(singleDetail.name);
						// 													models.College.find({
						// 														where : {
						// 															id : singleDetail.collegeId
						// 														}
						// 													}).then(function(college){
						// 														if(affiliation.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
						// 															console.log("same");
						// 															if(college.type == 'college'){
						// 																console.log("college");
						// 																collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + " which is affiliated to Mumbai University.")
						// 															}else if(college.type == 'department'){
						// 																console.log("department");
						// 																collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + ", Mumbai University.")
						// 															}
						// 														}
						// 														console.log("collegeData inside college == " + JSON.stringify(collegeData))
						// 													})
						// 												})
						// 												affiliationId += affiliation.id +','
						// 												console.log("collegeData inside == " + JSON.stringify(collegeData))
						// 											})
						
						// 										setTimeout(()=>{
						// 											console.log("collegeData == " + JSON.stringify(collegeData))
						// 											console.log("----13----");
						// 											var affiliationIds = affiliationId.split(',');
						// 											console.log("affiliationIds == " ,affiliationIds)
						// 											affiliationIds.pop();
						// 											console.log("affiliationIds == " ,affiliationIds)
						// 											affiliationId = affiliationIds.join(',');
						// 											console.log("affiliationId == " + affiliationId);
						// 											setTimeout(function(){
						// 												console.log("----14----");
						// 												if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
						// 													console.log("----15----");
						// 													models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 														if(MaxReferenceNo[0].maxNumber == null){
						// 															reference_no = 1001;
						// 														}else{
						// 															reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 														}
						
						// 														models.Affiliation_Letter.updateReferenceNumber_new(affiliationId,reference_no).then(function(updatedDetails){
						// 															console.log("----16----");
						// 															var ref_no = reference_no;
						// 															self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 															passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																if(err) {
						// 																	console.log("----17----");
						// 																	res.json({ 
						// 																		status: 400
						// 																	})
						// 																}else{
						// 																	console.log("----18----");
						// 																	models.Emailed_Docs.find({
						// 																		where :{
						// 																			app_id:app_id,
						// 																			filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																		}
						// 																	}).then(function(emailDoc){
						// 																		if(!emailDoc){
						// 																			models.Emailed_Docs.create({
						// 																			filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																			doc_type : "AffiliationLetter",
						// 																			category : "AffiliationLetter",
						// 																			user_id: user_id,
						// 																			transcript_id: null,
						// 																			marklist_id : null,
						// 																			app_id:app_id,
						// 																			curriculum_id : null
						// 																			}).then((result)=>{
						// 																			// logger.debug(" result : "+JSON.stringify(result))
						// 																			})
						// 																		}
						// 																	})
						// 																}
						// 															})
						// 														})
						// 													});
						// 												}else{
						// 													console.log("----19----");
						// 													var ref_no = affiliation_Details[0].reference_no;
						// 													self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 													passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 														if(err) {
						// 															console.log("----20----");
						// 														res.json({ 
						// 																status: 400
						// 															})
						// 														}else{
						// 															console.log("----21----");
						// 															models.Emailed_Docs.find({
						// 																where :{
						// 																	app_id:app_id,
						// 																	filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																}
						// 															}).then(function(emailDoc){
						// 																if(!emailDoc){
						// 																	models.Emailed_Docs.create({
						// 																	filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																	doc_type : "AffiliationLetter",
						// 																	category : "AffiliationLetter",
						// 																	user_id: user_id,
						// 																	transcript_id: null,
						// 																	marklist_id : null,
						// 																	app_id:app_id,
						// 																	curriculum_id : null
						// 																	}).then((result)=>{
						// 																	// logger.debug(" result : "+JSON.stringify(result))
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													})
						// 												}
						// 											},3000); 
						// 										},4000);   
						// 									}else if(affiliation_Details.length == 1){
						// 										affiliation_letter_length = affiliation_letter_length  + 1;
						// 										if(faculty.colleges.length == 1){
						// 											models.College.find ({
						// 												where :{
						// 													id : faculty.colleges[0].collegeId
						// 												}
						// 											}).then(function(college){
						// 												var studentName = prefix +affiliation_Details[0].studentName;
						// 												var collegeName ;
						// 												if(college.type == 'college'){
						// 													collegeName =affiliation_Details[0].collegeName + " which is affiliated to ";
						// 												}else if(college.type == 'department'){
						// 													collegeName = affiliation_Details[0].collegeName + ", ";
						// 												}
						// 												var courseName = affiliation_Details[0].courseName;
						// 												var specialization = affiliation_Details[0].specialization;
						// 												var passingMonthYear = affiliation_Details[0].yearofpassing;
						// 												var duration = converter.toWords(affiliation_Details[0].duration);
						// 												var passingClass = affiliation_Details[0].division;
						// 												var instruction_medium;
						
						// 												if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
						// 													instruction_medium = "English";
						// 												}else{
						// 													instruction_medium = affiliation_Details[0].instruction_medium;
						// 												}
						// 												var education = affiliation_Details[0].education;
						// 												setTimeout(()=>{
						// 													if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
						// 													console.log("affiliation_Details[0].reference_no == " + affiliation_Details[0].reference_no)
						// 														models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 															if(MaxReferenceNo[0].maxNumber == null){
						// 																reference_no = 1001;
						// 															}else{
						// 																reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 															}
						// 															models.Affiliation_Letter.update(
						// 																{
						// 																	reference_no : reference_no
						// 																},{
						// 																where :{
						// 																	id : affiliation_Details[0].id
						// 																}
						// 															}).then(function(updatedDetails){
						// 																//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																var ref_no = reference_no;
						// 																self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																	if(err) {
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																				doc_type : "AffiliationLetter",
						// 																				category : "AffiliationLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															})
						// 														})
						// 													}else{
						// 														var ref_no = affiliation_Details[0].reference_no;
						// 														self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 														passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 															if(err) {
						// 																res.json({ 
						// 																	status: 400
						// 																})
						// 															}else{
						// 																models.Emailed_Docs.find({
						// 																	where :{
						// 																		app_id:app_id,
						// 																		filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																	}
						// 																}).then(function(emailDoc){
						// 																	if(!emailDoc){
						// 																		models.Emailed_Docs.create({
						// 																		filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																		doc_type : "AffiliationLetter",
						// 																		category : "AffiliationLetter",
						// 																		user_id: user_id,
						// 																		transcript_id: null,
						// 																		marklist_id : null,
						// 																		app_id:app_id,
						// 																		curriculum_id : null
						// 																		}).then((result)=>{
						// 																		// logger.debug(" result : "+JSON.stringify(result))
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														})
						// 													}
						// 												})
						// 											})
						// 										}
						// 									}
						// 								})
						// 							})
						// 						}
						// 					})
						// 				}else if(appliedDetails.applying_for == 'Phd,Masters,Bachelors'){
						// 					console.log("----6----");
						// 					var bachelorDetails = [];
						// 					models.userMarkList.findAll({
						// 						where :{
						// 							type : "Phd",
						// 							user_id : application.user_id
						// 						}
						// 					}).then(function(bachelor_Details){
						// 						console.log("----7----");
						// 						bachelor_Details.forEach(bachelor =>{
						// 							if(bachelor.app_id != null){
						// 								var app_idArr = bachelor.app_id.split(",");
						// 								app_idArr.forEach(app_id =>{
						// 									if(app_id == application_id){
						// 										bachelorDetails.push(bachelor);
						// 									}
						// 								})
						// 							}
						// 						})
						// 						console.log("----8----");
						// 						if(bachelorDetails){
						// 							console.log("----9----");
						// 							var facultyData = [];
						// 							bachelorDetails.forEach(bachelor =>{
						// 								var flag = false;
						// 								var college = [];
						// 								if(facultyData.length > 0){
						// 									facultyData.forEach(data=>{
						// 										if(data.faculty == bachelor.faculty){
						// 											flag = true;
						// 											var count = 0;
						// 											data.colleges.forEach(clg=>{
						// 												if(clg.collegeId == bachelor.collegeId){
						// 													count ++;
						// 												}
						// 											})
						// 											if(count <= data.colleges.length){
						// 												if(bachelor.patteren == 'Annual'){
						// 													data.colleges.push({
						// 														name : bachelor.name,
						// 														collegeId : bachelor.collegeId
						// 													})
						// 												}else if(bachelor.patteren == 'Semester'){
						// 													switch(bachelor.name){
						// 														case 'Semester 2' : 
						// 															data.colleges.push({
						// 																name : 'First Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 4' :
						// 															data.colleges.push({
						// 																name : 'Second Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 6' :
						// 															data.colleges.push({
						// 																name : 'Third Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 8' :
						// 															data.colleges.push({
						// 																name : 'Fourth Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														case 'Semester 10' :
						// 															data.colleges.push({
						// 																name : 'Fifth Year',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 															break;
						// 														default :
						// 															data.colleges.push({
						// 																name : '',
						// 																collegeId : bachelor.collegeId
						// 															})
						// 													}
						// 												}
						// 											}
						// 										}
						// 									})
						// 									if(flag == false){
						// 										var colleges = [];
						// 										if(bachelor.patteren == 'Annual'){
						// 											colleges.push({
						// 												name : bachelor.name,
						// 												collegeId : bachelor.collegeId
						// 											})
						// 										}else if(bachelor.patteren == 'Semester'){
						// 											switch(bachelor.name){
						// 												case 'Semester 2' : 
						// 													colleges.push({
						// 														name : 'First Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 4' :
						// 													colleges.push({
						// 														name : 'Second Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 6' :
						// 													colleges.push({
						// 														name : 'Third Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 8' :
						// 												colleges.push({
						// 														name : 'Fourth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 10' :
						// 													colleges.push({
						// 														name : 'Fifth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												default :
						// 													colleges.push({
						// 														name : '',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 											}
						// 										}
																
						// 										facultyData.push({
						// 											type:bachelor.type,
						// 											faculty : bachelor.faculty,
						// 											colleges : colleges
						// 										})
						// 									}
						// 								}else{
						// 								var colleges = [];
						// 										if(bachelor.patteren == 'Annual'){
						// 											colleges.push({
						// 												name : bachelor.name,
						// 												collegeId : bachelor.collegeId
						// 											})
						// 										}else if(bachelor.patteren == 'Semester'){
						// 											switch(bachelor.name){
						// 												case 'Semester 2' : 
						// 													colleges.push({
						// 														name : 'First Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 4' :
						// 													colleges.push({
						// 														name : 'Second Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 6' :
						// 													colleges.push({
						// 														name : 'Third Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 8' :
						// 												colleges.push({
						// 														name : 'Fourth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												case 'Semester 10' :
						// 													colleges.push({
						// 														name : 'Fifth Year',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 													break;
						// 												default :
						// 													colleges.push({
						// 														name : '',
						// 														collegeId : bachelor.collegeId
						// 													})
						// 											}
						// 										}
						// 									facultyData.push({
						// 										type:bachelor.type,
						// 										faculty : bachelor.faculty,
						// 										colleges : colleges
						// 									})
						// 								}
						// 							})
						// 							console.log("----10----");
						// 							console.log("facultyData == "+ JSON.stringify(facultyData));
						// 							facultyData.forEach(faculty=>{
						// 								models.Affiliation_Letter.findAll({
						// 									where :{
						// 										user_id : application.user_id,
						// 										education : faculty.type + '_' + faculty.faculty
						// 									}
						// 								}).then(function(affiliationDetails){
						// 									console.log("----11----");
						// 									// console.log("affiliationDetails == " + JSON.stringify(affiliationDetails))
						// 									var affiliation_Details = [];
						// 									affiliationDetails.forEach(affiliation =>{
						// 										if(affiliation.app_id != null){
						// 											var app_idArr = affiliation.app_id.split(",");
						// 											app_idArr.forEach(app_id =>{
						// 												if(app_id == application_id){
						// 													affiliation_Details.push(affiliation);
						// 												}
						// 											})
						// 										}
						// 									})
						// 									console.log("----12----");
						// 									console.log("affiliation_Details == " + JSON.stringify(affiliation_Details))
															
						// 									if(affiliation_Details.length > 1){
						// 										console.log("----13----");
						// 										affiliation_letter_length =affiliation_letter_length  + 1;
						// 										var studentName = prefix + affiliation_Details[0].studentName;
						// 										var courseName = affiliation_Details[0].courseName;
						// 										var specialization = affiliation_Details[0].specialization;
						// 										var passingMonthYear = affiliation_Details[0].yearofpassing;
						// 										var duration = converter.toWords(affiliation_Details[0].duration);
						// 										var passingClass = affiliation_Details[0].division;
						// 										var instruction_medium;
						// 										if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
						// 											instruction_medium = "English";
						// 										}else{
						// 											instruction_medium = affiliation_Details[0].instruction_medium;
						// 										}
						// 										var education = affiliation_Details[0].education;
																
						// 										var affiliationId = '';
																
																	
						// 										affiliation_Details.forEach(affiliation =>{
						// 												console.log(affiliation.academicYear);
						// 												faculty.colleges.forEach(singleDetail=>{
						// 													console.log(singleDetail.name);
						// 													models.College.find({
						// 														where : {
						// 															id : singleDetail.collegeId
						// 														}
						// 													}).then(function(college){
						// 														if(affiliation.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
						// 															console.log("same");
						// 															if(college.type == 'college'){
						// 																console.log("college");
						// 																collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + " which is affiliated to Mumbai University.")
						// 															}else if(college.type == 'department'){
						// 																console.log("department");
						// 																collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + ", Mumbai University.")
						// 															}
						// 														}
						// 														console.log("collegeData inside college == " + JSON.stringify(collegeData))
						// 													})
						// 												})
						// 												affiliationId += affiliation.id +','
						// 												console.log("collegeData inside == " + JSON.stringify(collegeData))
						// 											})
						
						// 										setTimeout(()=>{
						// 											console.log("collegeData == " + JSON.stringify(collegeData))
						// 											console.log("----13----");
						// 											var affiliationIds = affiliationId.split(',');
						// 											console.log("affiliationIds == " ,affiliationIds)
						// 											affiliationIds.pop();
						// 											console.log("affiliationIds == " ,affiliationIds)
						// 											affiliationId = affiliationIds.join(',');
						// 											console.log("affiliationId == " + affiliationId);
						// 											setTimeout(function(){
						// 												console.log("----14----");
						// 												if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
						// 													console.log("----15----");
						// 													models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 														if(MaxReferenceNo[0].maxNumber == null){
						// 															reference_no = 1001;
						// 														}else{
						// 															reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 														}
						
						// 														models.Affiliation_Letter.updateReferenceNumber_new(affiliationId,reference_no).then(function(updatedDetails){
						// 															console.log("----16----");
						// 															var ref_no = reference_no;
						// 															self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 															passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																if(err) {
						// 																	console.log("----17----");
						// 																	res.json({ 
						// 																		status: 400
						// 																	})
						// 																}else{
						// 																	console.log("----18----");
						// 																	models.Emailed_Docs.find({
						// 																		where :{
						// 																			app_id:app_id,
						// 																			filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																		}
						// 																	}).then(function(emailDoc){
						// 																		if(!emailDoc){
						// 																			models.Emailed_Docs.create({
						// 																			filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																			doc_type : "AffiliationLetter",
						// 																			category : "AffiliationLetter",
						// 																			user_id: user_id,
						// 																			transcript_id: null,
						// 																			marklist_id : null,
						// 																			app_id:app_id,
						// 																			curriculum_id : null
						// 																			}).then((result)=>{
						// 																			// logger.debug(" result : "+JSON.stringify(result))
						// 																			})
						// 																		}
						// 																	})
						// 																}
						// 															})
						// 														})
						// 													});
						// 												}else{
						// 													console.log("----19----");
						// 													var ref_no = affiliation_Details[0].reference_no;
						// 													self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
						// 													passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 														if(err) {
						// 															console.log("----20----");
						// 														res.json({ 
						// 																status: 400
						// 															})
						// 														}else{
						// 															console.log("----21----");
						// 															models.Emailed_Docs.find({
						// 																where :{
						// 																	app_id:app_id,
						// 																	filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																}
						// 															}).then(function(emailDoc){
						// 																if(!emailDoc){
						// 																	models.Emailed_Docs.create({
						// 																	filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																	doc_type : "AffiliationLetter",
						// 																	category : "AffiliationLetter",
						// 																	user_id: user_id,
						// 																	transcript_id: null,
						// 																	marklist_id : null,
						// 																	app_id:app_id,
						// 																	curriculum_id : null
						// 																	}).then((result)=>{
						// 																	// logger.debug(" result : "+JSON.stringify(result))
						// 																	})
						// 																}
						// 															})
						// 														}
						// 													})
						// 												}
						// 											},3000); 
						// 										},4000);   
						// 									}else if(affiliation_Details.length == 1){
						// 										affiliation_letter_length = affiliation_letter_length  + 1;
						// 										if(faculty.colleges.length == 1){
						// 											models.College.find ({
						// 												where :{
						// 													id : faculty.colleges[0].collegeId
						// 												}
						// 											}).then(function(college){
						// 												var studentName = prefix +affiliation_Details[0].studentName;
						// 												var collegeName ;
						// 												if(college.type == 'college'){
						// 													collegeName =affiliation_Details[0].collegeName + " which is affiliated to ";
						// 												}else if(college.type == 'department'){
						// 													collegeName = affiliation_Details[0].collegeName + ", ";
						// 												}
						// 												var courseName = affiliation_Details[0].courseName;
						// 												var specialization = affiliation_Details[0].specialization;
						// 												var passingMonthYear = affiliation_Details[0].yearofpassing;
						// 												var duration = converter.toWords(affiliation_Details[0].duration);
						// 												var passingClass = affiliation_Details[0].division;
						// 												var instruction_medium;
						
						// 												if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
						// 													instruction_medium = "English";
						// 												}else{
						// 													instruction_medium = affiliation_Details[0].instruction_medium;
						// 												}
						// 												var education = affiliation_Details[0].education;
						// 												setTimeout(()=>{
						// 													if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
						// 													console.log("affiliation_Details[0].reference_no == " + affiliation_Details[0].reference_no)
						// 														models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
						// 															if(MaxReferenceNo[0].maxNumber == null){
						// 																reference_no = 1001;
						// 															}else{
						// 																reference_no = MaxReferenceNo[0].maxNumber + 1;
						// 															}
						// 															models.Affiliation_Letter.update(
						// 																{
						// 																	reference_no : reference_no
						// 																},{
						// 																where :{
						// 																	id : affiliation_Details[0].id
						// 																}
						// 															}).then(function(updatedDetails){
						// 																//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
						// 																var ref_no = reference_no;
						// 																self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 																passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 																	if(err) {
						// 																		res.json({ 
						// 																			status: 400
						// 																		})
						// 																	}else{
						// 																		models.Emailed_Docs.find({
						// 																			where :{
						// 																				app_id:app_id,
						// 																				filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																			}
						// 																		}).then(function(emailDoc){
						// 																			if(!emailDoc){
						// 																				models.Emailed_Docs.create({
						// 																				filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																				doc_type : "AffiliationLetter",
						// 																				category : "AffiliationLetter",
						// 																				user_id: user_id,
						// 																				transcript_id: null,
						// 																				marklist_id : null,
						// 																				app_id:app_id,
						// 																				curriculum_id : null
						// 																				}).then((result)=>{
						// 																				// logger.debug(" result : "+JSON.stringify(result))
						// 																				})
						// 																			}
						// 																		})
						// 																	}
						// 																})
						// 															})
						// 														})
						// 													}else{
						// 														var ref_no = affiliation_Details[0].reference_no;
						// 														self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
						// 														passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
						// 															if(err) {
						// 																res.json({ 
						// 																	status: 400
						// 																})
						// 															}else{
						// 																models.Emailed_Docs.find({
						// 																	where :{
						// 																		app_id:app_id,
						// 																		filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																	}
						// 																}).then(function(emailDoc){
						// 																	if(!emailDoc){
						// 																		models.Emailed_Docs.create({
						// 																		filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
						// 																		doc_type : "AffiliationLetter",
						// 																		category : "AffiliationLetter",
						// 																		user_id: user_id,
						// 																		transcript_id: null,
						// 																		marklist_id : null,
						// 																		app_id:app_id,
						// 																		curriculum_id : null
						// 																		}).then((result)=>{
						// 																		// logger.debug(" result : "+JSON.stringify(result))
						// 																		})
						// 																	}
						// 																})
						// 															}
						// 														})
						// 													}
						// 												})
						// 											})
						// 										}
						// 									}
						// 								})
						// 							})
						// 						}
						// 					})
						// 				}
						// 			})
						// 		})
						// 	})
						// }
						// if(user[0].curriculum == true){
						// 	models.User_Curriculum.findAll({
						// 		where :{
						// 			user_id : user_id
						// 		}
						// 	}).then(function(usercurriculums){
						// 		if(usercurriculums.length > 0){
						// 			var app_idArr = [];
						// 			usercurriculums.forEach(usercurriculum=>{
						// 				if(usercurriculum.app_id != null){
						// 					var app_idArr = usercurriculum.app_id.split(',');
						// 					app_idArr.forEach(transcript_appId=>{
						// 						if(transcript_appId == app_id){
						// 							user_curriculums.push(usercurriculum);
						// 						}
						// 					})
						// 				}
						// 			})
						// 			if(user_curriculums.length > 0){
						// 				curriculum_length = user_curriculums.length;
						// 				console.log("curriculum_length == " +curriculum_length)
						// 				user_curriculums.forEach(curriculum=>{
						// 					var numOfpages = 0;
						// 					models.Emailed_Docs.findAll({
						// 						where : {
						// 							curriculum_id : curriculum.id,
						// 						}
						// 					}).then(function(signedDocs){
						// 					var existsFlag = false;
						// 					if(signedDocs.length > 0){
						// 						var file_name;
						// 						var doc_type;
						// 						var category;
						// 						signedDocs.forEach(signedDoc=>{
						// 						file_name = signedDoc.filename;
						// 						doc_type = signedDoc.doc_type;
						// 						category = signedDoc.category;
						// 						var signedFilePath = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+signedDoc.filename;
						// 						if(fs.existsSync(signedFilePath)){
						// 							if(signedDoc.app_id == app_id){
						// 								existsFlag = true;
						// 							}else{
						// 								var app_idFlag = false;
						// 								console.log("Different App ID 2" + signedDoc.app_id + " " + app_id);
						// 								app_idArr.forEach(transcriptAppId =>{
						// 									if(transcriptAppId == signedDoc.app_id){
						// 									console.log("Same id");
						// 									app_idFlag = true;
						// 									}
						// 								});
						// 								console.log("app_idFlag == " + app_idFlag);
						// 								if(app_idFlag == true){
						// 									existsFlag =  true;
						// 								}
						// 							// models.Emailed_Docs.create({
						// 							//   filename : signedDoc.filename,
						// 							//   doc_type : signedDoc.doc_type,
						// 							//   category : signedDoc.category,
						// 							//   user_id: user_id,
						// 							//   transcript_id: null,
						// 							//   marklist_id : null,
						// 							//   app_id:app_id,
						// 							//   curriculum_id : curriculum.id
						// 							// }).then((result)=>{
						// 							//   // logger.debug(" result : "+JSON.stringify(result))
						// 							// })
						// 							}
						// 						}else{
						// 							var fileName = curriculum.file_name;
						// 							var filePath = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName;
						// 							if(fs.existsSync(filePath)){
						// 							var extension=fileName.split('.').pop();
						// 							if(extension == 'pdf'){
						// 								let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName);
						// 								pdf(dataBuffer).then(function(data) {
						// 								console.log("no=====>"+data.numpages);  // number of pages
						// 								numOfpages = data.numpages;
						// 								});
						// 								fn.pdftomultipleimg_new(fileName,user_id,numOfpages)
						// 								if(!fs.existsSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/")){
						// 									fs.mkdirSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/", { recursive: true });//fs.writeFileSync
						// 								}
						// 								var outputdirectory = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/";
						// 								var filesString = ''
						// 								setTimeout(()=>{
						// 									console.log("<===settimeout of 60===>");
						// 									for(var i = 1 ; i <= numOfpages; i++){
						// 										var j = "";
						// 										if(numOfpages >= 100){
						// 											if(parseInt((i/100)) > 0){
						// 												j = i
						// 											}else if(parseInt((i/10)) > 0){
						// 												j = "0" + i;
						// 											}else{
						// 												j = "00" + i;
						// 											}
						// 										}else  if(numOfpages >= 10){
						// 											if(parseInt((i/10)) > 0){
						// 												j = i;
						// 											}else{
						// 												j = "0" + i;
						// 											}
						// 										}else  if(numOfpages >= 1){
						// 											j =  i;
						// 										}
																
						// 										file_loc=  constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(fileName).name+"/"+path.parse(fileName).name+"-"+j+".jpg"; 
						// 										file_loc2=  constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/"+path.parse(fileName).name+"_"+i+".pdf";  
						// 										filesString = filesString+' "'+file_loc2+'" ';
						// 										if (fs.existsSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(fileName).name+"/"+path.parse(fileName).name+"-"+j+".jpg")){
						// 											console.log("file exist return i ===>"+i);
						// 											fn.curriculumsignedpdf_new(path.parse(fileName).name, user_id, app_id, file_loc, signstatus, curriculum.name, i,outputdirectory,function(err){
						// 											if(err){
						// 												return res.json({
						// 												status : 400,
						// 												mesaasge : err
						// 												})
						// 											}else{

						// 											}
						// 											});
						// 										}
						// 									}
						// 								},60000)
						// 								count++;
						// 								setTimeout(()=>{
						// 									fn.curriculum_merge(app_id, user_id, curriculum.id,curriculum.name,path.parse(fileName).name, filesString,count);
						// 								}, 3*60000);
														
						// 							}else{
						// 								setTimeout(()=>{
						// 								file_loc= constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName;
						// 								if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_"+curriculum.name+"_"+path.parse(fileName).name+".pdf")){
						// 								var category = "Curriculum";
						// 								fn.signedpdf_new(path.parse(fileName).name, user_id, app_id, file_loc, signstatus, null, null ,curriculum.name,category,count, curriculum.id,null,null,null,function(err){
						// 									if(err){
															
						// 									return res.json({
						// 										status : 400,
						// 										message : err
						// 									})
						// 									}else{

						// 									count++;
						// 									}
						// 								});
						// 								}
						// 							},2500)
						// 							}
						// 							}else{
						// 							var message = curriculum.name + " file not found"
						// 							res.json({
						// 								status : 400,
						// 								message : message
						// 							})
						// 							}
						// 						}
						// 						})
						// 						if(existsFlag == false){
						// 						models.Emailed_Docs.create({
						// 							filename : file_name,
						// 							doc_type : doc_type,
						// 							category : category,
						// 							user_id: user_id,
						// 							transcript_id: null,
						// 							marklist_id : null,
						// 							app_id:app_id,
						// 							curriculum_id : curriculum.id
						// 						}).then((result)=>{
						// 							// logger.debug(" result : "+JSON.stringify(result))
						// 						})
						// 						}
						// 					}else{
						// 						var fileName = curriculum.file_name;
						// 						var filePath = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName;
						// 						if(fs.existsSync(filePath)){
						// 						var extension=fileName.split('.').pop();
						// 						if(extension == 'pdf'){
						// 							let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName);
						// 							pdf(dataBuffer).then(function(data) {
						// 							console.log("no=====>"+data.numpages);  // number of pages
						// 							numOfpages = data.numpages;
						// 							});
						// 							fn.pdftomultipleimg_new(fileName,user_id,numOfpages)
						// 							if(!fs.existsSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/")){
						// 								fs.mkdirSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/", { recursive: true });//fs.writeFileSync
						// 							}
						// 							var outputdirectory = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/";
						// 							var filesString = ''
						// 							setTimeout(()=>{
						// 								console.log("<===settimeout of 60===>");
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
						// 									file_loc=  constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(fileName).name+"/"+path.parse(fileName).name+"-"+j+".jpg"; 
						// 									file_loc2=  constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/"+path.parse(fileName).name+"_"+i+".pdf";  
						// 									filesString = filesString+' "'+file_loc2+'" ';
						// 									if (fs.existsSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(fileName).name+"/"+path.parse(fileName).name+"-"+j+".jpg")){
						// 										console.log("file exist return i ===>"+i);
						// 										fn.curriculumsignedpdf_new(path.parse(fileName).name, user_id, app_id, file_loc, signstatus, curriculum.name, i,outputdirectory,function(err){
						// 										if(err){
						// 											return res.json({
						// 											status : 400,
						// 											mesaasge : err
						// 											})
						// 										}else{

						// 										}
						// 										});
						// 									}
						// 								}
						// 							},60000)
						// 							count++;
						// 							setTimeout(()=>{
						// 								fn.curriculum_merge(app_id, user_id, curriculum.id,curriculum.name,path.parse(fileName).name, filesString,count);
						// 							}, 3*60000);
												
						// 						}else{
						// 							setTimeout(()=>{
						// 							file_loc= constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName;
						// 							if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_"+curriculum.name+"_"+path.parse(fileName).name+".pdf")){
						// 							var category = "Curriculum";
						// 							fn.signedpdf_new(path.parse(fileName).name, user_id, app_id, file_loc, signstatus, null, null ,curriculum.name,category,count, curriculum.id,null,null,function(err){
						// 								if(err){
														
						// 								return res.json({
						// 									status : 400,
						// 									message : err
						// 								})
						// 								}else{

						// 								count++;
						// 								}
						// 							});
						// 							}
						// 						},2500)
						// 						}
						// 						}else{
						// 						var message = curriculum.name + " file not found"
						// 						return res.json({
						// 							status : 400,
						// 							message : message
						// 						})
						// 						}
												
						// 					}
						// 					})
						// 				})
						// 			}else{
						// 			// return res.json({
						// 			//   status : 400,
						// 			//   message : "Transcript not uploaded"
						// 			// })
						// 			}
						// 		}else{
						// 			return res.json({
						// 			status : 400,
						// 			message : "Curriculum not uploaded"
						// 			})
						// 		}
						// 	});
						// }
						// if(user[0].gradToPer == true){
						// 	models.GradeToPercentageLetter.findAll({
						// 		where:{
						// 			user_id : application.user_id,
						// 			app_id :{
						// 				[Op.ne] : null
						// 			}
						// 		}
						// 	}).then(function(letters){
						// 		console.log("letters == " + JSON.stringify(letters));
						// 		letters.forEach(letter=>{
						// 			var app_idArr = letter.app_id.split(',');
						// 			app_idArr.forEach(letter_appId=>{
						// 				if(letter_appId == app_id){
						// 					gradTOPer_letter.push(letter);
						// 				}
						// 			})
						// 		})
								
						// 		if(gradTOPer_letter.length > 0){
						// 			gradTOPer_letter_length = gradTOPer_letter.length;
						// 			gradTOPer_letter.forEach(letter=>{
						// 				console.log("letter == " + JSON.stringify(letter));
						// 				var doc_name = letter.name.split(' ').join('_');
						// 				var fileName = doc_name + "_" + path.parse(letter.file_name).name + "-.pdf";
						// 				models.Emailed_Docs.find({
						// 					where :{
						// 						gradToPer_id : letter.id,
						// 						fileName : fileName,
						// 						app_id :{
						// 							[Op.ne] : app_id
						// 						}
						// 					}
						// 				}).then(function(emailedDocs){
						// 					if(emailedDocs){
						// 						models.Emailed_Docs.create({
						// 							filename : emaildDocs.file_name,
						// 							doc_type : emaildDocs.doc_type,
						// 							category : emaildDocs.category,
						// 							gradToPer_id: letter.id,
						// 							app_id:app_id
						// 						});
						// 					}else{
						// 						var fileName = path.parse(letter.file_name).name;
						// 						var filePath = constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+application.user_id+"/"+letter.file_name;
						// 						var category = "GradeToPerLetter";
						// 						var outputDirectory;
						// 						if(fs.existsSync(filePath)){
						// 							var extension=letter.file_name.split('.').pop();
						// 							var numOfpages;
						// 							console.log("test==")
						// 							if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(letter.file_name).name+".pdf")){
						// 								if(extension == 'pdf'){
						// 									var folderName = fileName.split(" ").join("_");
						// 									console.log("folderName == " + folderName);
						// 									outputDirectory = constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+application.user_id+"/"+folderName+"/";
						// 									fn.pdfToImageConversion(path.parse(letter.file_name).name,application.user_id,filePath,outputDirectory);
						// 									let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+application.user_id+"/"+letter.file_name);
						// 										pdf(dataBuffer).then(function(data) {
						// 										console.log("no=====>"+data.numpages);  // number of pages
						// 										numOfpages = data.numpages;
						// 									});
						// 									var fileString = "";
						// 									outputDirectory = constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+application.user_id+"/signed_"+folderName+"/";
						// 									if(!fs.existsSync(outputDirectory)){
						// 										fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
						// 									}
						// 									setTimeout(()=>{
						// 									for(var i = 1 ; i <= numOfpages; i++){
						// 										var j = "";
						// 										if(numOfpages >= 100){
						// 											if(parseInt((i/100)) > 0){
						// 												j = i
						// 											}else if(parseInt((i/10)) > 0){
						// 												j = "0" + i;
						// 											}else{
						// 												j = "00" + i;
						// 											}
						// 										}else  if(numOfpages >= 10){
						// 											if(parseInt((i/10)) > 0){
						// 												j = i;
						// 											}else{
						// 												j = "0" + i;
						// 											}
						// 										}else  if(numOfpages >= 1){
						// 											j =  i;
						// 										}
																
						// 											console.log("fileName == " + fileName);
						// 											filePath =  constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+application.user_id+"/"+ folderName +"/"+path.parse(letter.file_name).name+"-"+j+".jpg"; 
						// 											console.log(filePath);
						// 											var file_name =  fileName+"-"+j+".jpg"
						// 											console.log("file_name == " + file_name);
						// 											fn.signingDocuments(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
						// 												if(err){
						// 													return res.json({
						// 													status : 400,
						// 													message : err
						// 													})
						// 												}else{
				
						// 													fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
						// 													console.log("fileString == " + fileString);
						// 												}
						// 											});
						// 										}
						// 									},4000) 
															
															
						// 									setTimeout(()=>{
						// 										console.log("fileString 2 == " + fileString);
						// 										outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
						// 										fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(letter.file_name).name, outputDirectory, fileString, function(err){
						// 											if(err){
						// 												return res.json({
						// 													status : 400,
						// 													message : "Files cannot merge"
						// 												})
						// 											}else{
						// 												var file_name = doc_name + "_" + path.parse(letter.file_name).name + ".pdf"
						// 												models.Emailed_Docs.find({
						// 													where : {
						// 														filename : file_name,
						// 														gradToPer_id: letter.id,
						// 														app_id:app_id,
						// 													}
						// 												}).then(function(emailedDoc){
						// 													if(emailedDoc){
				
						// 													}else{
						// 														models.Emailed_Docs.create({
						// 															filename : file_name,
						// 															doc_type : doc_name,
						// 															category : category,
						// 															gradToPer_id: letter.id,
						// 															app_id:app_id,
						// 														}).then((result)=>{
						// 														// logger.debug(" result : "+JSON.stringify(result))
						// 													})
						// 													}
						// 												})
						// 											}
						// 										});
						// 									}, 6000);
						// 								}else{
															
						// 									outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
						// 									fn.signingDocuments(path.parse(letter.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
						// 										if(err){
						// 											return res.json({
						// 												status : 400,
						// 												message : err
						// 											})
						// 										}else{
						// 											var file_name = doc_name + "_" + path.parse(letter.file_name).name + ".pdf"
						// 											models.Emailed_Docs.find({
						// 												where : {
						// 													filename : file_name,
						// 													gradToPer_id: letter.id,
						// 													app_id:app_id,
						// 												}
						// 											}).then(function(emailedDoc){
						// 												if(emailedDoc){
				
						// 												}else{
						// 													models.Emailed_Docs.create({
						// 														filename : file_name,
						// 														doc_type : doc_name,
						// 														category : category,
						// 														gradToPer_id: letter.id,
						// 														app_id:app_id
						// 													}).then((result)=>{
						// 													// logger.debug(" result : "+JSON.stringify(result))
						// 												})
						// 												}
						// 											})
						// 										}
						// 									});
						// 								}
						// 							}else{
						// 								var file_name = doc_name + "_" + path.parse(letter.file_name).name + ".pdf"
						// 								models.Emailed_Docs.find({
						// 									where : {
						// 										filename : file_name,
						// 										gradToPer_id: letter.id,
						// 										app_id:app_id,
						// 									}
						// 								}).then(function(emailedDoc){
						// 									if(emailedDoc){
				
						// 									}else{
						// 										models.Emailed_Docs.create({
						// 											filename : file_name,
						// 											doc_type : doc_name,
						// 											category : category,
						// 											gradToPer_id: transcript.id,
						// 											app_id:app_id
						// 										}).then((result)=>{
						// 										// logger.debug(" result : "+JSON.stringify(result))
						// 									})
						// 									}
						// 								})
						// 							}
						// 						}else{
						// 							return res.json({
						// 								status : 400,
						// 								message : transcript.name + 'not found'
						// 							})
						// 						}
						// 					}
						// 				})
						// 			})
						// 		}
						// 	})
						// }
						// if(user[0].CompetencyLetter == true){
						// 	console.log("user_id == " + user_id);
						// 	models.competency_letter.findAll({
						// 		where:{
						// 			user_id : application.user_id,
						// 			app_id :{
						// 				[Op.ne] : null
						// 			}
						// 		}
						// 	}).then(function(userCompetency){
						// 		console.log("userCompetency == " + JSON.stringify(userCompetency));
						// 		userCompetency.forEach(user_transcript=>{
						// 			var app_idArr = user_transcript.app_id.split(',');
						// 			app_idArr.forEach(transcript_appId=>{
						// 				if(transcript_appId == app_id){
						// 					competencyletter.push(user_transcript);
						// 				}
						// 			})
						// 		})

						// 		if(competencyletter.length > 0){
						// 			competencyletter_length = competencyletter.length;  
						// 			competencyletter.forEach(transcript=>{
						// 				console.log("transcript == " + JSON.stringify(transcript));
						// 				var doc_name = transcript.name.split(' ').join('_');
						// 				var fileName = doc_name + "_" + path.parse(transcript.file_name).name + "-.pdf";
						// 				models.Emailed_Docs.find({
						// 					where :{
						// 						competency_id : transcript.id,
						// 						fileName : fileName,
						// 						app_id :{
						// 							[Op.ne] : app_id
						// 						}
						// 					}
						// 				}).then(function(emailedDocs){
						// 					if(emailedDocs){
						// 						models.Emailed_Docs.create({
						// 							filename : emaildDocs.file_name,
						// 							doc_type : emaildDocs.doc_type,
						// 							category : emaildDocs.category,
						// 							competency_id: transcript.id,
						// 							app_id:app_id
						// 						});
						// 					}else{
						// 						var fileName = path.parse(transcript.file_name).name;
						// 						var filePath = constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+application.user_id+"/"+transcript.file_name;
						// 						var category = "CompetencyLetter";
						// 						var outputDirectory;
						// 						if(fs.existsSync(filePath)){
						// 							var extension=transcript.file_name.split('.').pop();
						// 							var numOfpages;
						// 							console.log("test==")
						// 							if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
						// 								if(extension == 'pdf'){
						// 									var folderName = fileName.split(" ").join("_");
						// 									console.log("folderName == " + folderName);
						// 									outputDirectory = constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+application.user_id+"/"+folderName+"/";
						// 									fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,outputDirectory);
						// 									let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+application.user_id+"/"+transcript.file_name);
						// 										pdf(dataBuffer).then(function(data) {
						// 										console.log("no=====>"+data.numpages);  // number of pages
						// 										numOfpages = data.numpages;
						// 									});
						// 									var fileString = "";
						// 									outputDirectory = constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+application.user_id+"/signed_"+folderName+"/";
						// 									if(!fs.existsSync(outputDirectory)){
						// 										fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
						// 									}
						// 									setTimeout(()=>{
						// 									for(var i = 1 ; i <= numOfpages; i++){
						// 										var j = "";
						// 										if(numOfpages >= 100){
						// 											if(parseInt((i/100)) > 0){
						// 												j = i
						// 											}else if(parseInt((i/10)) > 0){
						// 												j = "0" + i;
						// 											}else{
						// 												j = "00" + i;
						// 											}
						// 										}else  if(numOfpages >= 10){
						// 											if(parseInt((i/10)) > 0){
						// 												j = i;
						// 											}else{
						// 												j = "0" + i;
						// 											}
						// 										}else  if(numOfpages >= 1){
						// 											j =  i;
						// 										}
																
						// 											console.log("fileName == " + fileName);
						// 											filePath =  constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
						// 											console.log(filePath);
						// 											var file_name =  fileName+"-"+j+".jpg"
						// 											console.log("file_name == " + file_name);
						// 											fn.signingDocuments(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
						// 												if(err){
						// 													return res.json({
						// 													status : 400,
						// 													message : err
						// 													})
						// 												}else{
				
						// 													fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
						// 													console.log("fileString == " + fileString);
						// 												}
						// 											});
						// 										}
						// 									},4000) 
															
															
						// 									setTimeout(()=>{
						// 										console.log("fileString 2 == " + fileString);
						// 										outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
						// 										fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, fileString, function(err){
						// 											if(err){
						// 												return res.json({
						// 													status : 400,
						// 													message : "Files cannot merge"
						// 												})
						// 											}else{
						// 												var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
						// 												models.Emailed_Docs.find({
						// 													where : {
						// 														filename : file_name,
						// 														competency_id: transcript.id,
						// 														app_id:app_id,
						// 													}
						// 												}).then(function(emailedDoc){
						// 													if(emailedDoc){
				
						// 													}else{
						// 														models.Emailed_Docs.create({
						// 															filename : file_name,
						// 															doc_type : doc_name,
						// 															category : category,
						// 															competency_id: transcript.id,
						// 															app_id:app_id,
						// 														}).then((result)=>{
						// 														// logger.debug(" result : "+JSON.stringify(result))
						// 													})
						// 													}
						// 												})
						// 											}
						// 										});
						// 									}, 6000);
						// 								}else{
															
						// 									outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
						// 									fn.signingDocuments(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
						// 										if(err){
						// 											return res.json({
						// 												status : 400,
						// 												message : err
						// 											})
						// 										}else{
						// 											var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
						// 											models.Emailed_Docs.find({
						// 												where : {
						// 													filename : file_name,
						// 													competency_id: transcript.id,
						// 													app_id:app_id,
						// 												}
						// 											}).then(function(emailedDoc){
						// 												if(emailedDoc){
				
						// 												}else{
						// 													models.Emailed_Docs.create({
						// 														filename : file_name,
						// 														doc_type : doc_name,
						// 														category : category,
						// 														competency_id: transcript.id,
						// 														app_id:app_id
						// 													}).then((result)=>{
						// 													// logger.debug(" result : "+JSON.stringify(result))
						// 												})
						// 												}
						// 											})
						// 										}
						// 									});
						// 								}
						// 							}else{
						// 								var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
						// 								models.Emailed_Docs.find({
						// 									where : {
						// 										filename : file_name,
						// 										competency_id: transcript.id,
						// 										app_id:app_id,
						// 									}
						// 								}).then(function(emailedDoc){
						// 									if(emailedDoc){
				
						// 									}else{
						// 										models.Emailed_Docs.create({
						// 											filename : file_name,
						// 											doc_type : doc_name,
						// 											category : category,
						// 											competency_id: transcript.id,
						// 											app_id:app_id
						// 										}).then((result)=>{
						// 										// logger.debug(" result : "+JSON.stringify(result))
						// 									})
						// 									}
						// 								})
						// 							}
						// 						}else{
						// 							return res.json({
						// 								status : 400,
						// 								message : transcript.name + 'not found'
						// 							})
						// 						}
						// 					}
						// 				})
						// 			})
						// 		}
						// 	})
						// 	if(user[0].educationalDetails != true){
						// 		models.UserMarklist_Upload.findAll({
						// 			where:{
						// 				user_id : application.user_id,
						// 				app_id :{
						// 					[Op.ne] : null
						// 				}
						// 			}
						// 		}).then(function(userMarklists){
						// 			console.log("userMarklists == " + JSON.stringify(userMarklists));
						// 			userMarklists.forEach(userMarklist=>{
						// 				var app_idArr = userMarklist.app_id.split(',');
						// 				app_idArr.forEach(marklist_appId=>{
						// 					if(marklist_appId == app_id){
						// 						user_marklists.push(userMarklist);
						// 					}
						// 				})
						// 			})
						// 			if(user_marklists.length > 0){
						// 				marksheet_length = user_marklists.length;
						// 				user_marklists.forEach(marklist=>{
						// 					console.log("marklist == " + JSON.stringify(marklist));
						// 					var doc_name = marklist.name.split(' ').join('_');
						// 					var fileName = doc_name + "_" + path.parse(marklist.file_name).name + "-.pdf";
						// 					models.Emailed_Docs.find({
						// 						where :{
						// 							transcript_id : marklist.id,
						// 							fileName : fileName,
						// 							app_id :{
						// 								[Op.ne] : app_id
						// 							}
						// 						}
						// 					}).then(function(emailedDocs){
						// 						if(emailedDocs){
						// 							models.Emailed_Docs.create({
						// 								filename : emaildDocs.file_name,
						// 								doc_type : emaildDocs.doc_type,
						// 								category : emaildDocs.category,
						// 								marklist_id: marklist.id,
						// 								app_id:app_id
						// 							});
						// 						}else{
						// 							var fileName = path.parse(marklist.file_name).name;
						// 							var filePath = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+marklist.file_name;
						// 							var category = "Marklist";
						// 							var outputDirectory;
						// 							if(fs.existsSync(filePath)){
						// 								var extension=marklist.file_name.split('.').pop();
						// 								var numOfpages;
						// 								console.log("test==")
						// 								if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
						// 									if(extension == 'pdf'){
						// 										var folderName = fileName.split(" ").join("_");
						// 										console.log("folderName == " + folderName);
						// 										outputDirectory = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+folderName+"/";
						// 										fn.pdfToImageConversion(path.parse(marklist.file_name).name,application.user_id,filePath,outputDirectory);
						// 										let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+marklist.file_name);
						// 											pdf(dataBuffer).then(function(data) {
						// 											console.log("no=====>"+data.numpages);  // number of pages
						// 											numOfpages = data.numpages;
						// 										});
						// 										var fileString = "";
						// 										outputDirectory = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/signed_"+folderName+"/";
						// 										if(!fs.existsSync(outputDirectory)){
						// 											fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
						// 										}
						// 										setTimeout(()=>{
						// 										for(var i = 1 ; i <= numOfpages; i++){
						// 											var j = "";
						// 											if(numOfpages >= 100){
						// 												if(parseInt((i/100)) > 0){
						// 													j = i
						// 												}else if(parseInt((i/10)) > 0){
						// 													j = "0" + i;
						// 												}else{
						// 													j = "00" + i;
						// 												}
						// 											}else  if(numOfpages >= 10){
						// 												if(parseInt((i/10)) > 0){
						// 													j = i;
						// 												}else{
						// 													j = "0" + i;
						// 												}
						// 											}else  if(numOfpages >= 1){
						// 												j =  i;
						// 											}
																	
						// 												console.log("fileName == " + fileName);
						// 												filePath =  constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+ folderName +"/"+path.parse(marklist.file_name).name+"-"+j+".jpg"; 
						// 												console.log(filePath);
						// 												var file_name =  fileName+"-"+j+".jpg"
						// 												console.log("file_name == " + file_name);
						// 												fn.signingDocuments(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
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
						// 										},2000) 
																
																
						// 										setTimeout(()=>{
						// 											console.log("fileString 2 == " + fileString);
						// 											outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
						// 											fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, fileString, function(err){
						// 												if(err){
						// 													return res.json({
						// 														status : 400,
						// 														message : "Files cannot merge"
						// 													})
						// 												}else{
						// 													var file_name = doc_name + "_" + path.parse(marklist.file_name).name + ".pdf"
						// 													models.Emailed_Docs.find({
						// 														where : {
						// 															filename : file_name,
						// 															marklist_id: marklist.id,
						// 															app_id:app_id,
						// 														}
						// 													}).then(function(emailedDoc){
						// 														if(emailedDoc){
					
						// 														}else{
						// 															models.Emailed_Docs.create({
						// 																filename : file_name,
						// 																doc_type : doc_name,
						// 																category : category,
						// 																marklist_id: marklist.id,
						// 																app_id:app_id,
						// 															}).then((result)=>{
						// 															// logger.debug(" result : "+JSON.stringify(result))
						// 														})
						// 														}
						// 													})
						// 												}
						// 											});
						// 										}, 4000);
						// 									}else{
																
						// 										outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
						// 										fn.signingDocuments(path.parse(marklist.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
						// 											if(err){
						// 												return res.json({
						// 													status : 400,
						// 													message : err
						// 												})
						// 											}else{
						// 												var file_name = doc_name + "_" + path.parse(marklist.file_name).name + ".pdf"
						// 												models.Emailed_Docs.find({
						// 													where : {
						// 														filename : file_name,
						// 														marklist_id: marklist.id,
						// 														app_id:app_id,
						// 													}
						// 												}).then(function(emailedDoc){
						// 													if(emailedDoc){
					
						// 													}else{
						// 														models.Emailed_Docs.create({
						// 															filename : file_name,
						// 															doc_type : doc_name,
						// 															category : category,
						// 															marklist_id: marklist.id,
						// 															app_id:app_id
						// 														}).then((result)=>{
						// 														// logger.debug(" result : "+JSON.stringify(result))
						// 													})
						// 													}
						// 												})
						// 											}
						// 										});
						// 									}
						// 								}else{
						// 									var file_name = doc_name + "_" + path.parse(marklist.file_name).name + ".pdf"
						// 									models.Emailed_Docs.find({
						// 										where : {
						// 											filename : file_name,
						// 											marklist_id: marklist.id,
						// 											app_id:app_id,
						// 										}
						// 									}).then(function(emailedDoc){
						// 										if(emailedDoc){
					
						// 										}else{
						// 											models.Emailed_Docs.create({
						// 												filename : file_name,
						// 												doc_type : doc_name,
						// 												category : category,
						// 												marklist_id: marklist.id,
						// 												app_id:app_id
						// 											}).then((result)=>{
						// 											// logger.debug(" result : "+JSON.stringify(result))
						// 										})
						// 										}
						// 									})
						// 								}
						// 							}else{
						// 								return res.json({
						// 									status : 400,
						// 									message : marklist.name + 'not found'
						// 								})
						// 							}
						// 						}
						// 					})
						// 				})
						// 			}
						// 		})
						// 	}
						// }
						
						// if(institution_data[0].type == 'Educational credential evaluators WES' && user[0].applying_for == 'Phd,Masters,Bachelors'){
						// 	self_pdf.generateWesForm(user_id,application.id,function(err){
						// 		if(err) {
						// 			console.log("ERROR");
						// 			res.json({
						// 				status: 400
						// 			})
						// 		}else{
						// 			console.log("SUCESSSS=========");
						// 			models.Emailed_Docs.find({
						// 				where :{
						// 					app_id:app_id,
						// 					filename : 'wesletter'
						// 				}
						// 			}).then(function(emailDoc){
						// 				if(!emailDoc){
						// 					wesform_length = 1;
						// 					models.Emailed_Docs.create({
						// 						filename : "wesletter.pdf",
						// 						doc_type : "wesletter",
						// 						category : "wesletter",
						// 						user_id: user_id,
						// 						transcript_id: null,
						// 						marklist_id : null,
						// 						app_id:app_id,
						// 						curriculum_id : null
						// 						}).then((result)=>{
						// 							console.log("SUCCESS");
						// 						})
						// 				}
						// 			})
						// 		}
						// })
						// }
						const tasksRemaining = queue.length();
						executed(null, {task, tasksRemaining});
				
			   }, 1); // concurrency value = 1
			   tasks.forEach((task)=>{
				queue.push(task, (error, {task, tasksRemaining})=>{
					// setTimeout(()=>{
					// 	var total = 0;
					// 	var message = '';
					// 	if(siginingType == 'single'){
					// 		message = "update application status to signed and please check merged file generated after 15 min";
					// 	}else{
					// 		message = "update application status to signed";
					// 	}
					// 	if(institution_data[0].type == 'Educational credential evaluators WES' && user[0].applying_for == 'Phd,Masters,Bachelors'){
					// 		if(user[0].educationalDetails == true){
					// 			total += marksheet_length + transcript_length + wesform_length;
					// 		}
							
					// 		if(user[0].instructionalField == true){
					// 			total += instruction_letter_length  + wesform_length;
					// 		}

					// 		if(user[0].affiliation == true){
					// 			total += affiliation_letter_length  + wesform_length;
					// 		}

					// 		if(user[0].curriculum == true){
					// 			total += curriculum_length  + wesform_length;
					// 		}
							
					// 		if(user[0].gradToPer == true){
					// 			total += gradTOPer_letter_length  + wesform_length;
					// 		}

					// 		if(user[0].CompetencyLetter == true){
					// 			total += competencyletter_length  + wesform_length;
					// 		}
							
					// 		if(user[0].LetterforNameChange == true){
					// 			total += namechangeletter_length  + wesform_length;
					// 		}
					// 	}else{
					// 		if(user[0].educationalDetails == true){
					// 			total += marksheet_length + transcript_length;
					// 		}
							
					// 		if(user[0].instructionalField == true){
					// 			total += instruction_letter_length;
					// 		}

					// 		if(user[0].affiliation == true){
					// 			total += affiliation_letter_length;
					// 		}

					// 		if(user[0].curriculum == true){
					// 			total += curriculum_length;
					// 		}
							
					// 		if(user[0].gradToPer == true){
					// 			total += gradTOPer_letter_length;
					// 		}

					// 		if(user[0].CompetencyLetter == true){
					// 			total += competencyletter_length;
					// 		}
							
					// 		if(user[0].LetterforNameChange == true){
					// 			total += namechangeletter_length;
					// 		}

					// 	}
						

						
					// 	setTimeout(()=>{
					// 	models.Emailed_Docs.findAll({
					// 		where:{
					// 			app_id : app_id 
					// 		}
					// 	}).then(function(emailDoc){
					// 		console.log("signed doc length == >>" + emailDoc.length);
					// 		console.log("total == " + total);
					// 		if(emailDoc.length == total){
					// 			console.log("Same Docs length");
					// 			var instCount = 0
					// 			var emailFlag = false;
					// 			models.Institution_details.findAll({
					// 				where:{
					// 					user_id : user_id,
					// 					app_id : app_id
					// 				}
					// 			}).then(function(institutes){
								
					// 				institutes.forEach(institute=>{
					// 					if(institute.type == 'Educational credential evaluators WES'){
					// 						if(institute.wesno == null || institute.wesno.length <=3 || !(institute.wesno.includes('MU-'))){
					// 							return res.json({
					// 							status : 400,
					// 							message : "Wes number not available"
					// 							})
					// 						}else{
					// 							emailDoc.forEach(file=>{
					// 								var fullfile = '';
					// 								fullfile = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+file.filename;
													
					// 								models.Wes_Records.find({
					// 									where:{
					// 									userId : user_id,
					// 									appl_id : app_id,
					// 									filename : file.filename
					// 									}
					// 								}).then(function(wesRecord){
					// 									if(wesRecord){
					// 										console.log("Available");
					// 									}else{
					// 										console.log("Not Available");
					// 										var email = (institute.emailAsWes) ? institute.emailAsWes : user[0].email;
					// 										var firstName = (institute.nameaswes) ? institute.nameaswes : user[0].name;
					// 										var lastName = (institute.nameaswes) ? institute.nameaswes : user[0].surname;
					// 										fn.fileTransferWes1(user_id,app_id,firstName,lastName,email,fullfile,function(err){
					// 											if(err){
					// 												return res.json({
					// 												status : 400,
					// 												message : err + app_id
					// 												})
					// 											}
					// 										});
					// 									}
					// 								})
					// 							})
					// 							console.log("Done");
					// 							setTimeout(()=>{
					// 								models.Wes_Records.findAll({
					// 									where :{
					// 									userId : user_id,
					// 									appl_id : app_id
					// 									}
					// 								}).then(function(wesRecords){
					// 									console.log("wesRecords.length == " + wesRecords.length);
					// 									console.log("emailDoc.length == " + emailDoc.length);
					// 									if(wesRecords.length == emailDoc.length){
					// 										console.log("correct");
					// 										instCount ++;
					// 										var wesData = [];
					// 										var attachments = {};
					// 										wesRecords.forEach(wesRecord=>{
					// 											wesData.push({
					// 												FileName : wesRecord.fileName,
					// 												UploadStatus : wesRecord.status,
					// 												reference_no : wesRecord.reference_no,
					// 												application_no : wesRecord.appl_id
					// 											})
					// 										})
					// 										var xls = json2xls(wesData);
					// 										var file_location = constant.FILE_LOCATION+"public/Excel/"+user[0].name+user[0].surname+'_'+institute.wesno+".xlsx";
					// 										fs.writeFileSync(file_location, xls, 'binary');
					// 										var file_name = user[0].name+user[0].surname+'_'+institute.wesno+".xlsx";
					// 										base64.encode(constant.FILE_LOCATION+"public/Excel/"+user[0].name+user[0].surname+'_'+institute.wesno+".xlsx", function(err, base64String) {
					// 											attachments = {                             
					// 												content: base64String,
					// 												filename: file_name,
					// 												type: 'application/xlsx',
					// 												disposition: 'attachment',
					// 												contentId: 'mytext'
					// 											}
					// 											studentData.username = user[0].name + ' ' + user[0].surname;
					// 											studentData.userEmail = user[0].email;
					// 											studentData.attachments = attachments;
					// 										})
					// 										emailFlag = true;
					// 									}
					// 								})
					// 							},8000)
					// 						}
					// 					}else if(institute.type == 'HRD'){

					// 							console.log("inside hrd purpose")
					// 							 var gender ;
					// 							 var fileName;
					// 							 var text;
												
					// 							models.userMarkList.findAll({
					// 								where : {
					// 									user_id :user_id,
					// 									app_id : app_id
					// 								}
					// 							}).then(function (usermarklist){
													
											
					// 							 models.Hrd_details.findAll({
					// 								where  :{
					// 									user_id :user_id,
					// 									app_id : app_id

					// 								}
					// 							}).then(function (hrd_Details){
												
					// 									instCount ++;
					// 									models.Hrd_details.getMaxRefetenceNumber().then(function(MaxReferenceNo){
					// 										if(MaxReferenceNo[0].maxNumber == null){
					// 											reference_no = 1001;
					// 										}else{
					// 											reference_no = MaxReferenceNo[0].maxNumber + 1;
					// 										}
													
															
					// 										models.Hrd_details.update(
					// 											{
					// 												reference_no : reference_no
					// 											},{
					// 											where :{
					// 												user_id : user_id
					// 											}
					// 										}).then(function(updatedDetails){
					// 											models.User.find({
					// 												where : {
					// 													id :  user_id
					// 												}
					// 											}).then(function (user){
																	
					// 												if(user.gender == 'Female'){
					// 													gender = 'her'
					// 												}else if(user.gender == 'Male'){
					// 													gender = 'him'
					// 												}
															
					// 											var ref_no = updatedDetails[0].reference_no;
					// 											setTimeout(function(){
					// 												for(var i = 0; i < hrd_Details.length ; i++){
																	
					// 													fileName = 'HrdLetter' + hrd_Details[i].degree + '.pdf'
					// 													var data = hrd_Details[i]
					// 													var  verification_type = hrd_Details[i].verification_type;
					// 													if(usermarklist[0].patteren == 'Semester'){
					// 														text = ' bearing Seat no '+hrd_Details[i].seat_no_sem5+' for '+hrd_Details[i].secondlastsem +' and Seat no '+ hrd_Details[i].seat_no_sem6+ ' for ' + hrd_Details[i].lastsem
					// 												   }else{
					// 														text = ' bearing Seat no '+hrd_Details[i].seat_no
					// 												   }
																		   
					// 												   var degree = hrd_Details[i].degree
					// 											self_pdf.hrdLetter(user_id,reference_no,data,gender,fileName,verification_type,text,function(err){
					// 												if(err) {
					// 													res.json({ 
					// 														status: 400
					// 													})
					// 												}else{
																		
					// 													models.Emailed_Docs.create({
					// 														filename : fileName,
					// 														doc_type : 'HrdLetter',
					// 														category :'HrdLetter',
					// 														user_id: user_id,
					// 														app_id:app_id,
					// 													}).then((result)=>{
					// 														logger.debug(" result : "+JSON.stringify(result))
					// 														// res.json({
					// 														// 	status : 200
					// 														// })
					// 													})
																	
					// 												}
					// 											})
					// 										}
					// 										},3000)

					// 										})
					// 									})
					// 									})
													

												
												
					// 							})
					// 						})
					// 					}else{
					// 						instCount++;
					// 					}
					// 				})

					// 				setTimeout(function(){
					// 					console.log("institutes.length == " + institutes.length);
					// 					console.log("count == " + instCount);
					// 					if(instCount == institutes.length){
					// 						console.log("inside ");
					// 						application.update({
					// 							tracker : 'signed'
					// 						}).then(function(updatedApplication){
					// 							if(updatedApplication){
					// 								console.log("Process Done");
					// 								request.post(constant.BASE_URL_SENDGRID + 'applicationStatus', {
					// 									json: {
					// 										email : user[0].email,
					// 										name : user[0].name + ' ' + user[0].surname,
					// 										app_id : app_id,
					// 										statusType : 'signed',
					// 										mobile : user[0].mobile,
					// 										mobile_country_code : user[0].mobile_country_code
					// 									}
					// 								}, function (error, response, body) {
					// 									if(emailFlag == true){
					// 										console.log("studentData == " + JSON.stringify(studentData));
					// 										request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent', {
					// 											json: {
					// 												studentData : studentData
					// 											}
					// 											});
					// 									}
					// 									res.json({
					// 										status : 200,
					// 										message : message
					// 									})
					// 								})
					// 							}else{
					// 								res.json({
					// 									status : 400,
					// 									message : 'Application not update'
					// 								})
					// 							}
					// 						})
					// 					}
					// 				},9000);
					// 			})
					// 		}else{
					// 			res.json({
					// 			status : 400,
					// 			message : 'Some documents not signed so can not proceed the application'
					// 			})
					// 		}
					// 	},20000)
					// 	})
					// },20000);
		
					// if(siginingType == 'single'){
					// 	var mergefilesString = '';
					// 	var setdefaultMergetime = 30000;
					// 	setTimeout(()=>{
						
					// 		logger.debug("merge fn execution start time at"+moment().format('YYYY-MM-DD HH:mm:ss'));
					// 		logger.debug("final setdefaultMergetime "+setdefaultMergetime);
					// 		models.Emailed_Docs.findAll({
					// 			where:{
					// 				category : 'Transcript',
					// 				app_id : app_id
					// 			}
					// 		}).then((result)=>{
					// 			result.forEach((docs)=>{
					// 				var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
					// 				mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
					// 			})
					// 			models.Emailed_Docs.findAll({
					// 				where:{
					// 					category :  'Marklist',
					// 					app_id : app_id
					// 				}
					// 			}).then((result)=>{
					// 				result.forEach((docs)=>{
					// 					var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
					// 					mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
					// 				})
					// 				models.Emailed_Docs.findAll({
					// 					where:{
					// 						category : 'Curriculum',
					// 						app_id : app_id
					// 					}
					// 				}).then((result)=>{
					// 					result.forEach((docs)=>{
					// 						var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
					// 						mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
					// 					})
					// 					models.Emailed_Docs.findAll({
					// 						where:{
					// 							category : 'InstructionalLetter',
					// 							app_id : app_id
					// 						}
					// 					}).then((result)=>{
					// 						result.forEach((docs)=>{
					// 							var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
					// 							mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
					// 						})
					// 						models.Emailed_Docs.findAll({
					// 							where:{
					// 								category : 'AffiliationLetter',
					// 								app_id : app_id
					// 							}
					// 						}).then((result)=>{
					// 							result.forEach((docs)=>{
					// 								var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
					// 								mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
					// 							})
										
					// 							models.Emailed_Docs.findAll({
					// 								where:{
					// 									category : 'GradeToPerLetter',
					// 									app_id : app_id
					// 								}
					// 							}).then((result)=>{
					// 								result.forEach((docs)=>{
					// 									var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
					// 									mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
					// 								})
					// 								models.Emailed_Docs.findAll({
					// 									where:{
					// 										category : 'CompetencyLetter',
					// 										app_id : app_id
					// 									}
					// 								}).then((result)=>{
					// 									result.forEach((docs)=>{
					// 										var signedfile_loc =  constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+docs.filename;  
					// 										mergefilesString = mergefilesString+' "'+signedfile_loc+'" ';
					// 									})
					// 									setTimeout(() => {
					// 										fn.merge(app_id,user_id,mergefilesString); 
					// 									}, 1000);
					// 								})
					// 							})
					// 						})
					// 					})
					// 				})
					// 			})
					// 		})
					// 	},setdefaultMergetime);
					// }

					res.json({
						status : 200
					})
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
				message : "Application not found"
			})
		}
	})
	})
})

router.post('/documentSigning',middlewares.getUserInfo,function(req,res){
	console.log('/documentSigning_new');
	var app_id =  req.body.appl_id;
	var siginingType = req.body.type;
	var signingDegree =  req.body.degree;
	var signstatus;
	var count = 1;
	var wesform_length =0
	var transcript_length = 0 ;
	var marksheet_length = 0;
	var curriculum_length = 0;
	var gradTOPer_letter_length = 0;
	//var competencyLetter_length = 0;
	var instruction_letter_length = 0;
	var affiliation_letter_length = 0;
	var competencyletter_length = 0;
	var namechangeletter_length = 0;
	var transcripts = [];
	var user_marklists = [];
	var user_marksheets = [];
	var user_curriculums = [];
	var gradTOPer_letter = [];
	var competencyletter= []
	var studentData = {};

	const runService = (WorkerData) => {
		return new Promise((resolve, reject) => {
		
			// import workerExample.js script..
		
			const worker = new Worker('./workerExample.js', { WorkerData });
			worker.on('message', resolve);
			worker.on('error', reject);
			worker.on('exit', (code) => {
				if (code !== 0)
					reject(new Error(`stopped with  ${code} exit code`));
			})
		})
	}
	models.Application.findOne({
		where :{
			id : app_id
		}
	}).then(function(application){
		models.Institution_details.findAll({
			where : {
				user_id : application.user_id,
				app_id : app_id
			}
		}).then(function (institution_data){
		if(application){
			var user_id = application.user_id;
			models.User.getApplicationDetailsForSign(app_id).then(function(user){
			  	if(user[0]){
				  	if(!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/")){
					  	fs.mkdirSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/", { recursive: true });//fs.writeFileSync
				  	}
					  const tasks =[application.id]
					  const queue = async.queue((task, executed) => {
						console.log("Currently Busy Processing Task " + task);
						
							console.log("IN ELSE ======>");
							if(user[0].educationalDetails == true){
								console.log("user_id == " + user_id);
								models.User_Transcript.findAll({
									where:{
										user_id : application.user_id,
										type:{
											[Op.like] :'%transcripts'
										},
										app_id :{
											[Op.ne] : null
										}
									}
								}).then(function(user_transcripts){
									console.log("user_transcripts == " + JSON.stringify(user_transcripts));
									user_transcripts.forEach(user_transcript=>{
										var app_idArr = user_transcript.app_id.split(',');
										app_idArr.forEach(transcript_appId=>{
											if(transcript_appId == app_id){
												transcripts.push(user_transcript);
											}
										})
									})
				
									transcript_length = transcripts.length;
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
												models.Emailed_Docs.create({
													filename : emailedDocs.file_name,
													doc_type : emailedDocs.doc_type,
													category : emailedDocs.category,
													transcript_id: transcript.id,
													app_id:app_id
												});
											}else{
												var fileName = path.parse(transcript.file_name).name;
												var filePath = constant.FILE_LOCATION+"public/upload/transcript/"+application.user_id+"/"+transcript.file_name;
												var category = "Transcript";
												var outputDirectory;
												if(fs.existsSync(filePath)){
													var extension=transcript.file_name.split('.').pop();
													var numOfpages;
													console.log("test==")
													if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
														if(extension == 'pdf'){
															const signingProcess = async ()=>{
														let promise = new Promise(function(resolve, reject){
															console.log("in promise");
															var folderName = fileName.split(" ").join("_");
															console.log("folderName == " + folderName);
															var transcript_outputDirectory = constant.FILE_LOCATION+"public/upload/transcript/"+application.user_id+"/"+folderName+"/";
															fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,transcript_outputDirectory);
															let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/transcript/"+application.user_id+"/"+transcript.file_name);
																pdf(dataBuffer).then(function(data) {
																console.log("no=====>"+data.numpages);  // number of pages
																numOfpages = data.numpages;
															});
											
															var fileString = "";						
															setTimeout(()=>{
																var signed_outputDirectory = constant.FILE_LOCATION+"public/upload/transcript/"+application.user_id+"/signed_"+folderName+"/";
																if(!fs.existsSync(signed_outputDirectory)){
																	fs.mkdirSync(signed_outputDirectory, { recursive: true });//fs.writeFileSync
																}
																
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
																	
																	console.log("fileName == " + fileName);
																	filePath =  constant.FILE_LOCATION+"public/upload/transcript/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
																	console.log(filePath);
																	var file_name =  fileName+"-"+j+".jpg"
																	console.log("file_name == " + file_name);
																	fn.signingDocuments(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, signed_outputDirectory,function(err){
																		if(err){
																			return res.json({
																			status : 400,
																			message : err
																			})
																		}else{
				
																			fileString = fileString +' "'+ signed_outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
																			console.log("fileString state== " + fileString);

																		}
																	});
																}
																},1000)
																setTimeout(()=>{
																	console.log('fileString == ' + fileString);
																	resolve(fileString);
																},7000)

														})
														
														
															Promise.all([promise]).then((result)=>{
																console.log("fileString result == " + result);
																outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(transcript.file_name).name, outputDirectory, result, function(err){
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
																					category : category,
																					transcript_id: transcript.id,
																					app_id:app_id,
																				}).then((result)=>{
																				// logger.debug(" result : "+JSON.stringify(result))
																			})
																			}
																		})
																	}
																});
															})
														}
														signingProcess();
														}else{
															
															outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
															fn.signingDocuments(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
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
																				category : category,
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
																	category : category,
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
								})
								models.UserMarklist_Upload.findAll({
									where:{
										user_id : application.user_id,
										app_id :{
											[Op.ne] : null
										}
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
													models.Emailed_Docs.create({
														filename : emaildDocs.file_name,
														doc_type : emaildDocs.doc_type,
														category : emaildDocs.category,
														marklist_id: marklist.id,
														app_id:app_id
													});
												}else{
													var fileName = path.parse(marklist.file_name).name;
													var filePath = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+marklist.file_name;
													var category = "Marklist";
													var outputDirectory;
													if(fs.existsSync(filePath)){
														var extension=marklist.file_name.split('.').pop();
														var numOfpages;
														console.log("test==")
														if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(marklist.file_name).name+".pdf")){
															if(extension == 'pdf'){
																var folderName = fileName.split(" ").join("_");
																console.log("folderName == " + folderName);
																outputDirectory = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+folderName+"/";
																fn.pdfToImageConversion(marklist.file_name,application.user_id,filePath,outputDirectory);
																let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+marklist.file_name);
																	pdf(dataBuffer).then(function(data) {
																	console.log("no=====>"+data.numpages);  // number of pages
																	numOfpages = data.numpages;
																});
																var fileString = "";
																outputDirectory = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/signed_"+folderName+"/";
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
																	
																		console.log("fileName == " + fileName);
																		filePath =  constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+ folderName +"/"+path.parse(marklist.file_name).name+"-"+j+".jpg"; 
																		console.log(filePath);
																		var file_name =  fileName+"-"+j+".jpg"
																		console.log("file_name == " + file_name);
																		fn.signingDocuments(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
																			if(err){
																				return res.json({
																				status : 400,
																				message : err
																				})
																			}else{
					
																				fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
																				console.log("fileString == " + fileString);
																			}
																		});
																	}
																},4000) 
																
																
																setTimeout(()=>{
																	console.log("fileString 2 == " + fileString);
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
																}, 6000);
															}else{
																
																outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																fn.signingDocuments(path.parse(marklist.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
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
									}
								})
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
										id : application_id
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
												app_id : application_id
											}
										}).then(function(appliedDetails){
											console.log('----5----')
											if(appliedDetails.applying_for == 'Masters,Bachelors'){
												console.log('----6----')
												models.userMarkList.findAll({
													where :{
														type : "Masters",
														user_id : application.user_id
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
																			colleges : colleges.push(college)
																		})
																	}
																}else{
																	var colleges = [];
																	colleges.push(college);
																	facultyData.push({
																		type:master.type,
																		faculty : master.faculty,
																		colleges : colleges
																	})
																}
															})
															console.log('----11----')
															facultyData.forEach(faculty=>{
																models.InstructionalDetails.findAll({
																	where :{
																		userId : application.user_id,
																		education : faculty.type + '_' + faculty.faculty
																	}
																}).then(function(instructionalDetails){
																	console.log('----12----')
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
																						console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
																						models.InstructionalDetails.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																							if(MaxReferenceNo[0].maxNumber == null){
																								reference_no = 1001;
																							}else{
																								reference_no = MaxReferenceNo[0].maxNumber + 1;
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
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																							})
																						})
																					}else{
																						var ref_no = instructionalDetails[0].reference_no;
																						self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																						passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																		}else{
																			if(instructional_Details.length > 1){
																				instruction_letter_length = instruction_letter_length  + 1;
																				console.log("----13----");
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
																									collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
																								}else if(college.type == 'department'){
																									console.log("department");
																									collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
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
																									reference_no = MaxReferenceNo[0].maxNumber + 1;
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
																								console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
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
																										//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																										var ref_no = reference_no;
																										self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																									})
																								})
																							}else{
																								var ref_no = instructionalDetails[0].reference_no;
																								self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																	user_id : application.user_id
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
																	console.log('----35----')
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
																				console.log("----13----");
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
																										collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
																									}else if(college.type == 'department'){
																										console.log("department");
																										collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
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
																									reference_no = MaxReferenceNo[0].maxNumber + 1;
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
																								console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
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
																										//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																										var ref_no = reference_no;
																										self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																									})
																								})
																							}else{
																								var ref_no = instructionalDetails[0].reference_no;
																								self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
												console.log("----6----");
												var bachelorDetails = [];
												models.userMarkList.findAll({
													where :{
														type : "Bachelors",
														user_id : application.user_id
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
																		colleges : colleges
																	})
																}
															}else{
																var colleges = [];
																colleges.push(college);
															facultyData.push({
																	type:bachelor.type,
																	faculty : bachelor.faculty,
																	colleges : colleges
																})
															}
														})
														console.log("----10----");
														console.log("facultyData == "+ JSON.stringify(facultyData));
														facultyData.forEach(faculty=>{
															models.InstructionalDetails.findAll({
																where :{
																	userId : application.user_id,
																	education : faculty.type + '_' + faculty.faculty
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
																					console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
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
																							//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																							var ref_no = reference_no;
																							self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																						})
																					})
																				}else{
																					var ref_no = instructionalDetails[0].reference_no;
																					self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																	// } 
																	
																}else{
																	if(instructional_Details.length > 1){
																		console.log("----13----");
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
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
																						}else if(college.type == 'department'){
																							console.log("department");
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
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
																							reference_no = MaxReferenceNo[0].maxNumber + 1;
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
																						console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
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
																								//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																								var ref_no = reference_no;
																								self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																							})
																						})
																					}else{
																						var ref_no = instructionalDetails[0].reference_no;
																						self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																						passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																		}
																	}
																}
															})
														})
													}
												})
											}else if(appliedDetails.applying_for == 'Masters'){
												console.log("----6----");
												var bachelorDetails = [];
												models.userMarkList.findAll({
													where :{
														type : "Masters",
														user_id : application.user_id
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
																		colleges : colleges
																	})
																}
															}else{
																var colleges = [];
																colleges.push(college);
															facultyData.push({
																	type:bachelor.type,
																	faculty : bachelor.faculty,
																	colleges : colleges
																})
															}
														})
														console.log("----10----");
														console.log("facultyData == "+ JSON.stringify(facultyData));
														facultyData.forEach(faculty=>{
															models.InstructionalDetails.findAll({
																where :{
																	userId : application.user_id,
																	education : faculty.type + '_' + faculty.faculty
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
																					console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
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
																							//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																							var ref_no = reference_no;
																							self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																						})
																					})
																				}else{
																					var ref_no = instructionalDetails[0].reference_no;
																					self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																	// } 
																	
																}else{
																	if(instructional_Details.length > 1){
																		console.log("----13----");
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
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
																						}else if(college.type == 'department'){
																							console.log("department");
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
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
																							reference_no = MaxReferenceNo[0].maxNumber + 1;
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
																						console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
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
																								//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																								var ref_no = reference_no;
																								self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																							})
																						})
																					}else{
																						var ref_no = instructionalDetails[0].reference_no;
																						self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																						passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
														user_id : application.user_id
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
																		colleges : colleges
																	})
																}
															}else{
																var colleges = [];
																colleges.push(college);
															facultyData.push({
																	type:bachelor.type,
																	faculty : bachelor.faculty,
																	colleges : colleges
																})
															}
														})
														console.log("----10----");
														console.log("facultyData == "+ JSON.stringify(facultyData));
														facultyData.forEach(faculty=>{
															models.InstructionalDetails.findAll({
																where :{
																	userId : application.user_id,
																	education : faculty.type + '_' + faculty.faculty
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
																					console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
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
																							//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																							var ref_no = reference_no;
																							self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																						})
																					})
																				}else{
																					var ref_no = instructionalDetails[0].reference_no;
																					self_pdf.currently_studying_instructionalLetter(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																	// } 
																	
																}else{
																	if(instructional_Details.length > 1){
																		console.log("----13----");
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
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + " which is affiliated to Mumbai University.")
																						}else if(college.type == 'department'){
																							console.log("department");
																							collegeData.push(instruction.academicYear + ' from ' + instruction.collegeName + ", Mumbai University.")
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
																							reference_no = MaxReferenceNo[0].maxNumber + 1;
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
																						console.log("instructional_Details[0].reference_no == " + instructional_Details[0].reference_no)
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
																								//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																								var ref_no = reference_no;
																								self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
																							})
																						})
																					}else{
																						var ref_no = instructionalDetails[0].reference_no;
																						self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																						passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,'instructionalLetter',function(err){
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
							if(user[0].LetterforNameChange == true){
								console.log("LetterforNameChange");
								var collegeData = [];
								var facultydata = [];
								var reference_no;
								var prefix = '';
								var subject = '';
								var subject1 = '';
								var application_id = app_id
								var test;
								var clgdata;
								var demoo =[];
								var marklistData = [];
								var typeofstudent='';
								var facultyofstudent='';
								
								models.Application.findOne({
									where :{
										id : application_id
									}
								}).then(function(application){
									console.log('----1----')
									models.User.find({
										where :{
											id : application.user_id
										}
									}).then(function(user){
										
										console.log('----2----')
										// if(user.gender == 'Female'){
										//     console.log('----3----')
										//     prefix = 'Ms. ';
										//     subject = 'She';
										//     subject1 = 'her';
										//     gender = 'Female'
										// }else if(user.gender == 'Male'){
										//     console.log('----4----')
										//     prefix = 'Mr. ';
										//     subject = 'He';
										//     subject1 = 'his';
										//     gender = 'Male'
										// }
										
										models.Applied_For_Details.find({
											where :{
												user_id : application.user_id,
												app_id : application_id
											}
										}).then(function(appliedDetails){
											if(appliedDetails.applying_for == 'Bachelors'){
												models.userMarkList.findAll({
													where :{
														type : "Bachelors",
														user_id : application.user_id
													}
												}).then(function(bachelor_Details){
													console.log("----7----");   
													if(bachelor_Details[0].college_stream_type == true){
														var differentStream = [];
														var differentClg = [];
														
							
														bachelor_Details.forEach(bachelor=>{
															if(differentStream.length > 0){
																var flag = false;
																var differentStreamFlag =false;
																differentStream.forEach(stream=>{
																	if(stream.faculty == bachelor.faculty){
																		flag = true;
																	}
																});
							
														
							
														  
																if(flag == false){
																	differentStream.push({
																		faculty : bachelor.faculty,
																		type : bachelor.type,
																		patteren : bachelor.patteren,
																		collegeId : bachelor.collegeId
							
																	})
																}
															}else{
																differentStream.push({
																	faculty : bachelor.faculty,
																	type : bachelor.type,
																	patteren : bachelor.patteren,
																	collegeId : bachelor.collegeId
							
																})
															}
														  
														   
														   
														});
														if(differentStream.length > 0){
															console.log('differentStream'+ JSON.stringify(differentStream));
															differentStream.forEach(stream=>{
																models.facultymaster.find({
																		where:{
																			degree 	: stream.type,
																			faculty : stream.faculty
																		}
																	}).then(function(facultyMaster){
							
																		facultydata = facultyMaster
																		var index;
																		if(stream.patteren == 'Annual'){
																			if(appliedDetails.current_year == true){
																				
																				index = converter.toOrdinalWords(facultyMaster.year) - 1;
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : index + ' Year'
																					}
																				}).then(function(marklistData){
																					if(marklistData){
																						models.College.find({
																							where : {
																								id : marklistData.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : marklistData.type + ' of ' + marklistData.faculty
																							})
																						})
																					}
																				
																				})
																			}else{
																				var index;
																				index = converter.toWordsOrdinal(facultyMaster.year);
																				
																				models.userMarkList.findAll({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : index + ' Year'
																					}
																				}).then(function(marklistData){
							
							
																						if(marklistData){
																							models.College.find({
																								where : {
																									id : marklistData[0].collegeId
																								}
																							}).then(function (collegedata){
																								console.log('collegedata',collegedata);
																								collegeData.push({
																									collegeName : collegedata.name,
																									courseName : marklistData[0].type + ' of ' + marklistData[0].faculty,
																									// type :  marklistData[0].type,
																									// faculty :  marklistData[0].faculty,
																								})
																							})
																							
																							
							
																						}
																					
							
																						
																			})
																		
																			}
							
																		}else if(stream.patteren == 'Semester'){
																			var secondLast = "Semester " + facultyMaster.year * 2 - 1;
																			var thirdLast = "Semester " + facultyMaster.year * 2 - 2;
																			if(appliedDetails.current_year == true){
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : secondLast
																					}
																				}).then(function(secondLastData){
																					if(secondLastData){
																						models.College.find({
																							where : {
																								id : secondLast.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : secondLastData.type + ' of ' + secondLastData.faculty
																							})
																						})
																					}else{
																						models.userMarkList.find({
																							where :{
																								user_id : application.user_id,
																								type : stream.type,
																								faculty : stream.faculty,
																								name : thirdLast
																							}
																						}).then(function(thirdLastData){
																							if(thirdLastData){
																								models.College.find({
																									where : {
																										id : thirdLastData.collegeId
																									}
																								}).then(function(college){
																									collegeData.push({
																										collegeName : college.name,
																										courseName : thirdLastData.type + ' of ' + thirdLastData.faculty
																									})
																								})
																							}
																						})
																					}
																				})
																				
																			}else{
																				index = facultyMaster.year * 2;
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : 'Semester' + index
																					}
																				}).then(function(marklistData){
																					if(marklistData){
																						models.College.find({
																							where : {
																								id : marklistData.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : marklistData.type + ' of ' + marklistData.faculty
																							})
																						})
																					}
																				})
																			}
																		}
																		
																	})
														 })
															
														}
													  
							
													}else if(bachelor_Details[0].college_stream_type == false){
														models.College.find({
															where:{
																id : bachelor_Details[0].collegeId
															}
														}).then(function(collegeDetails){
														//	console.log(' bachelor_Details[0].type', bachelor_Details[0].type);
							
															collegeData.push({
																collegeName : collegeDetails.name,
																courseName : bachelor_Details[0].type + ' of ' + bachelor_Details[0].faculty,
															  //  type : bachelor_Details[0].type ,
																//faculty : bachelor_Details[0].faculty
															})
														})
													}
							
													setTimeout(()=>{
															namechangeletter_length =  collegeData.length
															models.Letterfor_NameChange.find({
																where:{
																	user_id : application.user_id
																}
															}).then(function(nameChange){
																
															   // marklistData=nameChange
																var firstnameaspermarksheet = nameChange.firstnameaspermarksheet;
																var fathersnameaspermarksheet = nameChange.fathersnameaspermarksheet;
																var mothersnameaspermarksheet = nameChange.mothersnameaspermarksheet;
																var lastnameaspermarksheet = nameChange.lastnameaspermarksheet;
																var firstnameasperpassport = nameChange.firstnameasperpassport;
																var fathersnameasperpassport = nameChange.fathersnameasperpassport;
																var lastnameasperpassport = nameChange.lastnameasperpassport;
																var ref_no;
																
							
																	// var nex = 'A'.charCodeAt(0);
							
																		collegeData.forEach(function (de){
																			// var curr = String.fromCharCode(nex++)
																		if(nameChange.reference_no){
																			ref_no = nameChange.reference_no ;
																		}else{
																			models.Letterfor_NameChange.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																				
																				if(MaxReferenceNo[0].maxNumber == null){
																					ref_no = 1001 
																				}else{
																					ref_no = MaxReferenceNo[0].maxNumber + 1 
																				}
																				models.Letterfor_NameChange.update(
																					{
																						reference_no : ref_no
																					},{
																					where :{
																						id : nameChange.id
																					}
																				});
																			})
																		}
																	})
							
																	
																
																// })
																
																setTimeout(()=>{
																	
																	collegeData.forEach(function (eachdata){
							
																		self_pdf.NamechangeLetter_one(application.user_id,application_id,firstnameaspermarksheet,fathersnameaspermarksheet,
																		mothersnameaspermarksheet,lastnameaspermarksheet,firstnameasperpassport,fathersnameasperpassport,lastnameasperpassport,
																		'NameChangeLetter', eachdata.collegeName, eachdata.courseName,ref_no,user.gender,function(err){
																			if(err) {
																			   res.json({ 
																				   status: 400
																			   })
																			}else{
																				var courseName = eachdata.courseName.split(' ').join('_');
																			   models.Emailed_Docs.find({
																				   where :{
																					   app_id:nameChange.app_id,
																					   filename : nameChange.app_id + "_" + courseName +"_NameChangeLetter.pdf",
																				   }
																			   }).then(function(emailDoc){
																				   if(!emailDoc){
																					   models.Emailed_Docs.create({
																					//    filename : nameChange.app_id + "_" +courseName+"_NameChangeLetter.pdf",
																					   filename : nameChange.app_id + '_NameChangeLetter'+courseName+'.pdf',
							
																					   doc_type : "NameChangeLetter",
																					   category : "NameChangeLetter",
																					   user_id: nameChange.user_id,
																					   transcript_id: null,
																					   marklist_id : null,
																					   app_id:nameChange.app_id,
																					   curriculum_id : null,
																					   namechange_id : nameChange.id
																					   }).then((result)=>{
																						   console.log('result',result);
																					   })
																				   }
																			   })
																		   
																		   }
																	   })
																   })
							
														   },5000)
															})
															
												},3000)
												})
											}if(appliedDetails.applying_for == 'Masters,Bachelors'){
												models.userMarkList.findAll({
													where :{
														type : "Masters",
														user_id : application.user_id
													}
												}).then(function(bachelor_Details){
													console.log("----7----");   
													if(bachelor_Details[0].college_stream_type == true){
														var differentStream = [];
														var differentClg = [];
														
							
														bachelor_Details.forEach(bachelor=>{
															if(differentStream.length > 0){
																var flag = false;
																var differentStreamFlag =false;
																differentStream.forEach(stream=>{
																	if(stream.faculty == bachelor.faculty){
																		flag = true;
																	}
																});
							
																// var differentStreamFlag = false;
															   
																// differentClg.forEach(stream=>{
																//     if(stream.collegeId == bachelor.collegeId){
																//         differentStreamFlag = true;
																//     }else{
																//         differentStreamFlag = false;
																//     }
																// });
																// if(differentStreamFlag == false){
																//     differentClg.push({
																//         faculty : bachelor.faculty,
																//         type : bachelor.type,
																//         patteren : bachelor.patteren,
																//         collegeId : bachelor.collegeId
							
																//     })
																// }
							
															  
														  
																if(flag == false){
																	differentStream.push({
																		faculty : bachelor.faculty,
																		type : bachelor.type,
																		patteren : bachelor.patteren,
																		collegeId : bachelor.collegeId
							
																	})
																}
															}else{
																differentStream.push({
																	faculty : bachelor.faculty,
																	type : bachelor.type,
																	patteren : bachelor.patteren,
																	collegeId : bachelor.collegeId
							
																})
															}
														  
														   
														   
														});
														if(differentStream.length > 0){
															console.log('differentStream'+ JSON.stringify(differentStream));
															differentStream.forEach(stream=>{
																models.facultymaster.find({
																		where:{
																			degree 	: stream.type,
																			faculty : stream.faculty
																		}
																	}).then(function(facultyMaster){
							
																		facultydata = facultyMaster
																		var index;
																		if(stream.patteren == 'Annual'){
																			if(appliedDetails.current_year == true){
																				
																				index = converter.toOrdinalWords(facultyMaster.year) - 1;
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : index + ' Year'
																					}
																				}).then(function(marklistData){
																					if(marklistData){
																						models.College.find({
																							where : {
																								id : marklistData.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : marklistData.type + ' of ' + marklistData.faculty
																							})
																						})
																					}
																				
																				})
																			}else{
																				var index;
																				index = converter.toWordsOrdinal(facultyMaster.year);
																				
																				models.userMarkList.findAll({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : index + ' Year'
																					}
																				}).then(function(marklistData){
							
							
																						if(marklistData){
																							models.College.find({
																								where : {
																									id : marklistData[0].collegeId
																								}
																							}).then(function (collegedata){
																								collegeData.push({
																									collegeName : collegedata.name,
																									courseName : marklistData[0].type + ' of ' + marklistData[0].faculty,
																									// type :  marklistData[0].type,
																									// faculty :  marklistData[0].faculty,
																								})
																							})
																							
																							
							
																						}
																					
							
																						
																			})
																		
																			}
							
																		}else if(stream.patteren == 'Semester'){
																			var secondLast = "Semester " + facultyMaster.year * 2 - 1;
																			var thirdLast = "Semester " + facultyMaster.year * 2 - 2;
																			if(appliedDetails.current_year == true){
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : secondLast
																					}
																				}).then(function(secondLastData){
																					if(secondLastData){
																						models.College.find({
																							where : {
																								id : secondLast.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : secondLastData.type + ' of ' + secondLastData.faculty
																							})
																						})
																					}else{
																						models.userMarkList.find({
																							where :{
																								user_id : application.user_id,
																								type : stream.type,
																								faculty : stream.faculty,
																								name : thirdLast
																							}
																						}).then(function(thirdLastData){
																							if(thirdLastData){
																								models.College.find({
																									where : {
																										id : thirdLastData.collegeId
																									}
																								}).then(function(college){
																									collegeData.push({
																										collegeName : college.name,
																										courseName : thirdLastData.type + ' of ' + thirdLastData.faculty
																									})
																								})
																							}
																						})
																					}
																				})
																				
																			}else{
																				index = facultyMaster.year * 2;
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : 'Semester' + index
																					}
																				}).then(function(marklistData){
																					if(marklistData){
																						models.College.find({
																							where : {
																								id : marklistData.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : marklistData.type + ' of ' + marklistData.faculty
																							})
																						})
																					}
																				})
																			}
																		}
																		
																	})
														 })
															
														}
													  
							
													}else if(bachelor_Details[0].college_stream_type == false){
														models.College.find({
															where:{
																id : bachelor_Details[0].collegeId
															}
														}).then(function(collegeDetails){
														//	console.log(' bachelor_Details[0].type', bachelor_Details[0].type);
							
															collegeData.push({
																collegeName : collegeDetails.name,
																courseName : bachelor_Details[0].type + ' of ' + bachelor_Details[0].faculty,
															  //  type : bachelor_Details[0].type ,
																//faculty : bachelor_Details[0].faculty
															})
														})
													}
							
													setTimeout(()=>{
														namechangeletter_length =  collegeData.length
							
															models.Letterfor_NameChange.find({
																where:{
																	user_id : application.user_id
																}
															}).then(function(nameChange){
																
															   // marklistData=nameChange
																var firstnameaspermarksheet = nameChange.firstnameaspermarksheet;
																var fathersnameaspermarksheet = nameChange.fathersnameaspermarksheet;
																var mothersnameaspermarksheet = nameChange.mothersnameaspermarksheet;
																var lastnameaspermarksheet = nameChange.lastnameaspermarksheet;
																var firstnameasperpassport = nameChange.firstnameasperpassport;
																var fathersnameasperpassport = nameChange.fathersnameasperpassport;
																var lastnameasperpassport = nameChange.lastnameasperpassport;
																var ref_no;
													
																	// var nex = 'A'.charCodeAt(0);
							
																		collegeData.forEach(function (de){
																			// var curr = String.fromCharCode(nex++)
																		if(nameChange.reference_no){
																			// ref_no = nameChange.reference_no + curr;
																			ref_no = nameChange.reference_no 
																		}else{
																			models.Letterfor_NameChange.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																				
																				if(MaxReferenceNo[0].maxNumber == null){
																					// ref_no = 1001 +curr;
																					ref_no = 1001 
																				}else{
																					// ref_no = MaxReferenceNo[0].maxNumber + 1 + curr;
																					ref_no = MaxReferenceNo[0].maxNumber + 1 
																				}
																				models.Letterfor_NameChange.update(
																					{
																						reference_no : ref_no
																					},{
																					where :{
																						id : nameChange.id
																					}
																				});
																			})
																		}
																	})
							
																	
																
																// })
																
																setTimeout(()=>{
																	
																	collegeData.forEach(function (eachdata){
							
																		self_pdf.NamechangeLetter_one(application.user_id,application_id,firstnameaspermarksheet,fathersnameaspermarksheet,
																		mothersnameaspermarksheet,lastnameaspermarksheet,firstnameasperpassport,fathersnameasperpassport,lastnameasperpassport,
																		'NameChangeLetter', eachdata.collegeName, eachdata.courseName,ref_no,user.gender,function(err){
																			if(err) {
																			   res.json({ 
																				   status: 400
																			   })
																			}else{
																				var courseName = eachdata.courseName.split(' ').join('_');
																			   models.Emailed_Docs.find({
																				   where :{
																					   app_id:nameChange.app_id,
																					   filename : nameChange.app_id + "_" + courseName +"_NameChangeLetter.pdf",
																				   }
																			   }).then(function(emailDoc){
																				   if(!emailDoc){
																					   models.Emailed_Docs.create({
																					//    filename : nameChange.app_id + "_" +courseName+"_NameChangeLetter.pdf",
																					   filename : nameChange.app_id + '_NameChangeLetter'+courseName+'.pdf',
							
																					   doc_type : "NameChangeLetter",
																					   category : "NameChangeLetter",
																					   user_id: nameChange.user_id,
																					   transcript_id: null,
																					   marklist_id : null,
																					   app_id:nameChange.app_id,
																					   curriculum_id : null,
																					   namechange_id : nameChange.id
																					   }).then((result)=>{
																						   console.log('result',result);
																					   })
																				   }
																			   })
																		   
																		   }
																	   })
																   })
							
														   },5000)
															})
															
												},3000)
												})
											}if(appliedDetails.applying_for == 'Phd,Masters,Bachelors'){
												models.userMarkList.findAll({
													where :{
														type : "Phd",
														user_id : application.user_id
													}
												}).then(function(bachelor_Details){
													console.log("----7----");   
													if(bachelor_Details[0].college_stream_type == true){
														var differentStream = [];
														var differentClg = [];
														
							
														bachelor_Details.forEach(bachelor=>{
															if(differentStream.length > 0){
																var flag = false;
																var differentStreamFlag =false;
																differentStream.forEach(stream=>{
																	if(stream.faculty == bachelor.faculty){
																		flag = true;
																	}
																});
							
											
															  
														  
																if(flag == false){
																	differentStream.push({
																		faculty : bachelor.faculty,
																		type : bachelor.type,
																		patteren : bachelor.patteren,
																		collegeId : bachelor.collegeId
							
																	})
																}
															}else{
																differentStream.push({
																	faculty : bachelor.faculty,
																	type : bachelor.type,
																	patteren : bachelor.patteren,
																	collegeId : bachelor.collegeId
							
																})
															}
														  
														   
														   
														});
														if(differentStream.length > 0){
															differentStream.forEach(stream=>{
																models.facultymaster.find({
																		where:{
																			degree 	: stream.type,
																			faculty : stream.faculty
																		}
																	}).then(function(facultyMaster){
							
																		facultydata = facultyMaster
																		var index;
																		if(stream.patteren == 'Annual'){
																			if(appliedDetails.current_year == true){
																				
																				index = converter.toOrdinalWords(facultyMaster.year) - 1;
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : index + ' Year'
																					}
																				}).then(function(marklistData){
																					if(marklistData){
																						models.College.find({
																							where : {
																								id : marklistData.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : marklistData.type + ' of ' + marklistData.faculty
																							})
																						})
																					}
																				
																				})
																			}else{
																				var index;
																				index = converter.toWordsOrdinal(facultyMaster.year);
																				
																				models.userMarkList.findAll({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : index + ' Year'
																					}
																				}).then(function(marklistData){
							
							
																						if(marklistData){
																							models.College.find({
																								where : {
																									id : marklistData[0].collegeId
																								}
																							}).then(function (collegedata){
																								collegeData.push({
																									collegeName : collegedata.name,
																									courseName : marklistData[0].type + ' of ' + marklistData[0].faculty,
																									// type :  marklistData[0].type,
																									// faculty :  marklistData[0].faculty,
																								})
																							})
																							
																							
							
																						}
																					
							
																						
																			})
																		
																			}
							
																		}else if(stream.patteren == 'Semester'){
																			var secondLast = "Semester " + facultyMaster.year * 2 - 1;
																			var thirdLast = "Semester " + facultyMaster.year * 2 - 2;
																			if(appliedDetails.current_year == true){
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : secondLast
																					}
																				}).then(function(secondLastData){
																					if(secondLastData){
																						models.College.find({
																							where : {
																								id : secondLast.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : secondLastData.type + ' of ' + secondLastData.faculty
																							})
																						})
																					}else{
																						models.userMarkList.find({
																							where :{
																								user_id : application.user_id,
																								type : stream.type,
																								faculty : stream.faculty,
																								name : thirdLast
																							}
																						}).then(function(thirdLastData){
																							if(thirdLastData){
																								models.College.find({
																									where : {
																										id : thirdLastData.collegeId
																									}
																								}).then(function(college){
																									collegeData.push({
																										collegeName : college.name,
																										courseName : thirdLastData.type + ' of ' + thirdLastData.faculty
																									})
																								})
																							}
																						})
																					}
																				})
																				
																			}else{
																				index = facultyMaster.year * 2;
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : 'Semester' + index
																					}
																				}).then(function(marklistData){
																					if(marklistData){
																						models.College.find({
																							where : {
																								id : marklistData.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : marklistData.type + ' of ' + marklistData.faculty
																							})
																						})
																					}
																				})
																			}
																		}
																		
																	})
														 })
															
														}
													  
							
													}else if(bachelor_Details[0].college_stream_type == false){
														models.College.find({
															where:{
																id : bachelor_Details[0].collegeId
															}
														}).then(function(collegeDetails){
														//	console.log(' bachelor_Details[0].type', bachelor_Details[0].type);
							
															collegeData.push({
																collegeName : collegeDetails.name,
																courseName : bachelor_Details[0].type + ' of ' + bachelor_Details[0].faculty,
															  //  type : bachelor_Details[0].type ,
																//faculty : bachelor_Details[0].faculty
															})
														})
													}
							
													setTimeout(()=>{
														namechangeletter_length =  collegeData.length
							
															models.Letterfor_NameChange.find({
																where:{
																	user_id : application.user_id
																}
															}).then(function(nameChange){
																
															   // marklistData=nameChange
																var firstnameaspermarksheet = nameChange.firstnameaspermarksheet;
																var fathersnameaspermarksheet = nameChange.fathersnameaspermarksheet;
																var mothersnameaspermarksheet = nameChange.mothersnameaspermarksheet;
																var lastnameaspermarksheet = nameChange.lastnameaspermarksheet;
																var firstnameasperpassport = nameChange.firstnameasperpassport;
																var fathersnameasperpassport = nameChange.fathersnameasperpassport;
																var lastnameasperpassport = nameChange.lastnameasperpassport;
																var ref_no;
															
																	// var nex = 'A'.charCodeAt(0);
							
																		collegeData.forEach(function (de){
																			// var curr = String.fromCharCode(nex++)
																		if(nameChange.reference_no){
																			// ref_no = nameChange.reference_no + curr;
																			ref_no = nameChange.reference_no
																		}else{
																			models.Letterfor_NameChange.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																				
																				if(MaxReferenceNo[0].maxNumber == null){
																					// ref_no = 1001 +curr;
																					ref_no = 1001 
																				}else{
																					// ref_no = MaxReferenceNo[0].maxNumber + 1 + curr;
																					ref_no = MaxReferenceNo[0].maxNumber + 1 ;
																				}
																				models.Letterfor_NameChange.update(
																					{
																						reference_no : ref_no
																					},{
																					where :{
																						id : nameChange.id
																					}
																				});
																			})
																		}
																	})
							
																	
																
																// })
																
																setTimeout(()=>{
																	
																	collegeData.forEach(function (eachdata){
							
																		self_pdf.NamechangeLetter_one(application.user_id,application_id,firstnameaspermarksheet,fathersnameaspermarksheet,
																		mothersnameaspermarksheet,lastnameaspermarksheet,firstnameasperpassport,fathersnameasperpassport,lastnameasperpassport,
																		'NameChangeLetter', eachdata.collegeName, eachdata.courseName,ref_no,user.gender,function(err){
																			if(err) {
																			   res.json({ 
																				   status: 400
																			   })
																			}else{
																				var courseName = eachdata.courseName.split(' ').join('_');
																			   models.Emailed_Docs.find({
																				   where :{
																					   app_id:nameChange.app_id,
																					   filename : nameChange.app_id + "_" + courseName +"_NameChangeLetter.pdf",
																				   }
																			   }).then(function(emailDoc){
																				   if(!emailDoc){
																					   models.Emailed_Docs.create({
																					//    filename : nameChange.app_id + "_" +courseName+"_NameChangeLetter.pdf",
																					   filename : nameChange.app_id + '_NameChangeLetter'+courseName+'.pdf',
							
																					   doc_type : "NameChangeLetter",
																					   category : "NameChangeLetter",
																					   user_id: nameChange.user_id,
																					   transcript_id: null,
																					   marklist_id : null,
																					   app_id:nameChange.app_id,
																					   curriculum_id : null,
																					   namechange_id : nameChange.id
																					   }).then((result)=>{
																						   console.log('result',result);
																					   })
																				   }
																			   })
																		   
																		   }
																	   })
																   })
							
														   },5000)
															})
															
												},3000)
												})
											}if(appliedDetails.applying_for == 'Masters'){
												models.userMarkList.findAll({
													where :{
														type : "Masters",
														user_id : application.user_id
													}
												}).then(function(bachelor_Details){
													console.log("----7----");   
													if(bachelor_Details[0].college_stream_type == true){
														var differentStream = [];
														var differentClg = [];
														
							
														bachelor_Details.forEach(bachelor=>{
															if(differentStream.length > 0){
																var flag = false;
																var differentStreamFlag =false;
																differentStream.forEach(stream=>{
																	if(stream.faculty == bachelor.faculty){
																		flag = true;
																	}
																});
							
														
							
														  
																if(flag == false){
																	differentStream.push({
																		faculty : bachelor.faculty,
																		type : bachelor.type,
																		patteren : bachelor.patteren,
																		collegeId : bachelor.collegeId
							
																	})
																}
															}else{
																differentStream.push({
																	faculty : bachelor.faculty,
																	type : bachelor.type,
																	patteren : bachelor.patteren,
																	collegeId : bachelor.collegeId
							
																})
															}
														  
														   
														   
														});
														if(differentStream.length > 0){
															console.log('differentStream'+ JSON.stringify(differentStream));
															differentStream.forEach(stream=>{
																models.facultymaster.find({
																		where:{
																			degree 	: stream.type,
																			faculty : stream.faculty
																		}
																	}).then(function(facultyMaster){
							
																		facultydata = facultyMaster
																		var index;
																		if(stream.patteren == 'Annual'){
																			if(appliedDetails.current_year == true){
																				
																				index = converter.toOrdinalWords(facultyMaster.year) - 1;
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : index + ' Year'
																					}
																				}).then(function(marklistData){
																					if(marklistData){
																						models.College.find({
																							where : {
																								id : marklistData.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : marklistData.type + ' of ' + marklistData.faculty
																							})
																						})
																					}
																				
																				})
																			}else{
																				var index;
																				index = converter.toWordsOrdinal(facultyMaster.year);
																				
																				models.userMarkList.findAll({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : index + ' Year'
																					}
																				}).then(function(marklistData){
							
							
																						if(marklistData){
																							models.College.find({
																								where : {
																									id : marklistData[0].collegeId
																								}
																							}).then(function (collegedata){
																								console.log('collegedata',collegedata);
																								collegeData.push({
																									collegeName : collegedata.name,
																									courseName : marklistData[0].type + ' of ' + marklistData[0].faculty,
																									// type :  marklistData[0].type,
																									// faculty :  marklistData[0].faculty,
																								})
																							})
																							
																							
							
																						}
																					
							
																						
																			})
																		
																			}
							
																		}else if(stream.patteren == 'Semester'){
																			var secondLast = "Semester " + facultyMaster.year * 2 - 1;
																			var thirdLast = "Semester " + facultyMaster.year * 2 - 2;
																			if(appliedDetails.current_year == true){
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : secondLast
																					}
																				}).then(function(secondLastData){
																					if(secondLastData){
																						models.College.find({
																							where : {
																								id : secondLast.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : secondLastData.type + ' of ' + secondLastData.faculty
																							})
																						})
																					}else{
																						models.userMarkList.find({
																							where :{
																								user_id : application.user_id,
																								type : stream.type,
																								faculty : stream.faculty,
																								name : thirdLast
																							}
																						}).then(function(thirdLastData){
																							if(thirdLastData){
																								models.College.find({
																									where : {
																										id : thirdLastData.collegeId
																									}
																								}).then(function(college){
																									collegeData.push({
																										collegeName : college.name,
																										courseName : thirdLastData.type + ' of ' + thirdLastData.faculty
																									})
																								})
																							}
																						})
																					}
																				})
																				
																			}else{
																				index = facultyMaster.year * 2;
																				models.userMarkList.find({
																					where :{
																						user_id : application.user_id,
																						type : stream.type,
																						faculty : stream.faculty,
																						name : 'Semester' + index
																					}
																				}).then(function(marklistData){
																					if(marklistData){
																						models.College.find({
																							where : {
																								id : marklistData.collegeId
																							}
																						}).then(function(college){
																							collegeData.push({
																								collegeName : college.name,
																								courseName : marklistData.type + ' of ' + marklistData.faculty
																							})
																						})
																					}
																				})
																			}
																		}
																		
																	})
														 })
															
														}
													  
							
													}else if(bachelor_Details[0].college_stream_type == false){
														models.College.find({
															where:{
																id : bachelor_Details[0].collegeId
															}
														}).then(function(collegeDetails){
														//	console.log(' bachelor_Details[0].type', bachelor_Details[0].type);
							
															collegeData.push({
																collegeName : collegeDetails.name,
																courseName : bachelor_Details[0].type + ' of ' + bachelor_Details[0].faculty,
															  //  type : bachelor_Details[0].type ,
																//faculty : bachelor_Details[0].faculty
															})
														})
													}
							
													setTimeout(()=>{
															namechangeletter_length =  collegeData.length
															models.Letterfor_NameChange.find({
																where:{
																	user_id : application.user_id
																}
															}).then(function(nameChange){
																
															   // marklistData=nameChange
																var firstnameaspermarksheet = nameChange.firstnameaspermarksheet;
																var fathersnameaspermarksheet = nameChange.fathersnameaspermarksheet;
																var mothersnameaspermarksheet = nameChange.mothersnameaspermarksheet;
																var lastnameaspermarksheet = nameChange.lastnameaspermarksheet;
																var firstnameasperpassport = nameChange.firstnameasperpassport;
																var fathersnameasperpassport = nameChange.fathersnameasperpassport;
																var lastnameasperpassport = nameChange.lastnameasperpassport;
																var ref_no;
																
							
																	// var nex = 'A'.charCodeAt(0);
							
																		collegeData.forEach(function (de){
																			var curr = String.fromCharCode(nex++)
																		if(nameChange.reference_no){
																			// ref_no = nameChange.reference_no + curr;
																			ref_no = nameChange.reference_no
																		}else{
																			models.Letterfor_NameChange.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																				
																				if(MaxReferenceNo[0].maxNumber == null){
																					// ref_no = 1001 +curr;
																					ref_no = 1001
																				}else{
																					// ref_no = MaxReferenceNo[0].maxNumber + 1 + curr;
																					ref_no = MaxReferenceNo[0].maxNumber + 1 
																				}
																				models.Letterfor_NameChange.update(
																					{
																						reference_no : ref_no
																					},{
																					where :{
																						id : nameChange.id
																					}
																				});
																			})
																		}
																	})
							
																	
																
																// })
																
																setTimeout(()=>{
																	
																	collegeData.forEach(function (eachdata){
							
																		self_pdf.NamechangeLetter_one(application.user_id,application_id,firstnameaspermarksheet,fathersnameaspermarksheet,
																		mothersnameaspermarksheet,lastnameaspermarksheet,firstnameasperpassport,fathersnameasperpassport,lastnameasperpassport,
																		'NameChangeLetter', eachdata.collegeName, eachdata.courseName,ref_no,user.gender,function(err){
																			if(err) {
																			   res.json({ 
																				   status: 400
																			   })
																			}else{
																				var courseName = eachdata.courseName.split(' ').join('_');
																			   models.Emailed_Docs.find({
																				   where :{
																					   app_id:nameChange.app_id,
																					   filename : nameChange.app_id + "_" + courseName +"_NameChangeLetter.pdf",
																				   }
																			   }).then(function(emailDoc){
																				   if(!emailDoc){
																					   models.Emailed_Docs.create({
																					//    filename : nameChange.app_id + "_" +courseName+"_NameChangeLetter.pdf",
																					   filename : nameChange.app_id + '_NameChangeLetter'+courseName+'.pdf',
							
																					   doc_type : "NameChangeLetter",
																					   category : "NameChangeLetter",
																					   user_id: nameChange.user_id,
																					   transcript_id: null,
																					   marklist_id : null,
																					   app_id:nameChange.app_id,
																					   curriculum_id : null,
																					   namechange_id : nameChange.id
																					   }).then((result)=>{
																						   console.log('result',result);
																					   })
																				   }
																			   })
																		   
																		   }
																	   })
																   })
							
														   },5000)
															})
															
												},3000)
												})
											}
										})
									})
								})
							}
							if(user[0].affiliation == true){
								console.log("affiliation letter");
								var collegeData = [];
								var reference_no;
								var prefix = '';
								var subject = '';
								var subject1 = '';
								var application_id = app_id
	
								models.Application.findOne({
									where :{
										id : application_id
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
												app_id : application_id
											}
										}).then(function(appliedDetails){
											console.log('----5----')
											if(appliedDetails.applying_for == 'Masters,Bachelors'){
												console.log('----6----')
												models.userMarkList.findAll({
													where :{
														type : "Masters",
														user_id : application.user_id
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
																			if(count <= data.colleges.length){
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
																							data.colleges.push({
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
															console.log('----11----')
															facultyData.forEach(faculty=>{
																models.Affiliation_Letter.findAll({
																	where :{
																		user_id : application.user_id,
																		education : faculty.type + '_' + faculty.faculty
																	}
																}).then(function(affiliationDetails){
																	
																	console.log('----12----')
																	var affiliation_Details = [];
																	affiliationDetails.forEach(affiliation =>{
																		if(affiliation.app_id != null){
																			var app_idArr = affiliation.app_id.split(",");
																			app_idArr.forEach(app_id =>{
																				if(app_id == application_id){
																					affiliation_Details.push(affiliation);
																					
																				}
																			})
																		}
																	})
																	setTimeout(()=>{
																		
																		if(affiliation_Details.length > 1){
																			affiliation_letter_length = affiliation_letter_length  + 1;
																			console.log("----13----");
																			var studentName = prefix + affiliation_Details[0].studentName;
																			var courseName = affiliation_Details[0].courseName;
																			var specialization = affiliation_Details[0].specialization;
																			var passingMonthYear = affiliation_Details[0].yearofpassing;
																			var duration = converter.toWords(affiliation_Details[0].duration);
																			var passingClass = affiliation_Details[0].division;
																			var instruction_medium;
																			if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
																				instruction_medium = "English";
																			}else{
																				instruction_medium = affiliation_Details[0].instruction_medium;
																			}
																			var education = affiliation_Details[0].education;
																			
																			var affiliationId = '';
																			
																				
																			affiliation_Details.forEach(affiliation =>{
																					console.log(affiliation.academicYear);
																					faculty.colleges.forEach(singleDetail=>{
																						console.log(singleDetail.name);
																						models.College.find({
																							where : {
																								id : singleDetail.collegeId
																							}
																						}).then(function(college){
																							if(affiliation.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
																								console.log("same");
																								if(college.type == 'college'){
																									console.log("college");
																									collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + " which is affiliated to Mumbai University.")
																								}else if(college.type == 'department'){
																									console.log("department");
																									collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + ", Mumbai University.")
																								}
																							}
																							console.log("collegeData inside college == " + JSON.stringify(collegeData))
																						})
																					})
																					affiliationId += affiliation.id +','
																					console.log("collegeData inside == " + JSON.stringify(collegeData))
																				})
									
																			setTimeout(()=>{
																				console.log("collegeData == " + JSON.stringify(collegeData))
																				console.log("----13----");
																				var affiliationIds = affiliationId.split(',');
																				console.log("affiliationIds == " ,affiliationIds)
																				affiliationIds.pop();
																				console.log("affiliationIds == " ,affiliationIds)
																				affiliationId = affiliationIds.join(',');
																				console.log("affiliationId == " + affiliationId);
																				setTimeout(function(){
																					console.log("----14----");
																					if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
																						console.log("----15----");
																						models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																							if(MaxReferenceNo[0].maxNumber == null){
																								reference_no = 1001;
																							}else{
																								reference_no = MaxReferenceNo[0].maxNumber + 1;
																							}
									
																							models.Affiliation_Letter.updateReferenceNumber_new(affiliationId,reference_no).then(function(updatedDetails){
																								console.log("----16----");
																								var ref_no = reference_no;
																								self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
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
																												filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																											}
																										}).then(function(emailDoc){
																											if(!emailDoc){
																												models.Emailed_Docs.create({
																												filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																												doc_type : "AffiliationLetter",
																												category : "AffiliationLetter",
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
																							})
																						});
																					}else{
																						console.log("----19----");
																						var ref_no = affiliation_Details[0].reference_no;
																						self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																						passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
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
																										filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																									}
																								}).then(function(emailDoc){
																									if(!emailDoc){
																										models.Emailed_Docs.create({
																										filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																										doc_type : "AffiliationLetter",
																										category : "AffiliationLetter",
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
																				},3000); 
																			},4000);   
																		}else if(affiliation_Details.length == 1){
																			affiliation_letter_length = affiliation_letter_length  + 1;
																			if(faculty.colleges.length == 1){
																				models.College.find ({
																					where :{
																						id : faculty.colleges[0].collegeId
																					}
																				}).then(function(college){
																					var studentName = prefix + affiliation_Details[0].studentName;
																					var collegeName ;
																					if(college.type == 'college'){
																						collegeName = affiliation_Details[0].collegeName + " which is affiliated to ";
																					}else if(college.type == 'department'){
																						collegeName = affiliation_Details[0].collegeName + ", ";
																					}
																					var courseName = affiliation_Details[0].courseName;
																					var specialization = affiliation_Details[0].specialization;
																					var passingMonthYear = affiliation_Details[0].yearofpassing;
																					var duration = converter.toWords(affiliation_Details[0].duration);
																					var passingClass = affiliation_Details[0].division;
																					var instruction_medium;
									
																					if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
																						instruction_medium = "English";
																					}else{
																						instruction_medium = affiliation_Details[0].instruction_medium;
																					}
																					var education = affiliation_Details[0].education;
																					setTimeout(()=>{
																						if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
																						console.log("affiliation_Details[0].reference_no == " + affiliation_Details[0].reference_no)
																							models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																								if(MaxReferenceNo[0].maxNumber == null){
																									reference_no = 1001;
																								}else{
																									reference_no = MaxReferenceNo[0].maxNumber + 1;
																								}
																								models.Affiliation_Letter.update(
																									{
																										reference_no : reference_no
																									},{
																									where :{
																										id : affiliation_Details[0].id
																									}
																								}).then(function(updatedDetails){
																									//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																									var ref_no = reference_no;
																									self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																									passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
																										if(err) {
																											res.json({ 
																												status: 400
																											})
																										}else{
																											models.Emailed_Docs.find({
																												where :{
																													app_id:app_id,
																													filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																												}
																											}).then(function(emailDoc){
																												if(!emailDoc){
																													models.Emailed_Docs.create({
																													filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																													doc_type : "AffiliationLetter",
																													category : "AffiliationLetter",
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
																								})
																							})
																						}else{
																							var ref_no = affiliation_Details[0].reference_no;
																							self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
																								if(err) {
																									res.json({ 
																										status: 400
																									})
																								}else{
																									models.Emailed_Docs.find({
																										where :{
																											app_id:app_id,
																											filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																										}
																									}).then(function(emailDoc){
																										if(!emailDoc){
																											models.Emailed_Docs.create({
																											filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																											doc_type : "AffiliationLetter",
																											category : "AffiliationLetter",
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
																	console.log('----35----')
																	facultyData.forEach(faculty=>{
																		models.Affiliation_Letter.findAll({
																			where :{
																				user_id : application.user_id,
																				education : faculty.type + '_' + faculty.faculty
																			}
																		}).then(function(affiliationDetails){
																			var affiliation_Details = [];
																			affiliationDetails.forEach(affiliation =>{
																				if(affiliation.app_id != null){
																					var app_idArr = affiliation.app_id.split(",");
																					app_idArr.forEach(app_id =>{
																						if(app_id == application_id){
																							affiliation_Details.push(affiliation);
																						}
																					})
																				}
																			})
																			
																			if(affiliation_Details.length > 1){
																				affiliation_letter_length = affiliation_letter_length  + 1;
																				console.log("----13----");
																				var studentName = prefix + affiliation_Details[0].studentName;
																				var courseName = affiliation_Details[0].courseName;
																				var specialization = affiliation_Details[0].specialization;
																				var passingMonthYear = affiliation_Details[0].yearofpassing;
																				var duration = converter.toWords(affiliation_Details[0].duration);
																				var passingClass = affiliation_Details[0].division;
																				var instruction_medium;
																				if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
																					instruction_medium = "English";
																				}else{
																					instruction_medium = affiliation_Details[0].instruction_medium;
																				}
																				var education = affiliation_Details[0].education;
																				
																				var affiliationId = '';
																				
																					
																				affiliation_Details.forEach(affiliation =>{
																						console.log(affiliation.academicYear);
																						faculty.colleges.forEach(singleDetail=>{
																							console.log(singleDetail.name);
																							models.College.find({
																								where : {
																									id : singleDetail.collegeId
																								}
																							}).then(function(college){
																								if(affiliation.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
																									console.log("same");
																									if(college.type == 'college'){
																										console.log("college");
																										collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + " which is affiliated to Mumbai University.")
																									}else if(college.type == 'department'){
																										console.log("department");
																										collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + ", Mumbai University.")
																									}
																								}
																								console.log("collegeData inside college == " + JSON.stringify(collegeData))
																							})
																						})
																						affiliationId += instruction.id +','
																						console.log("collegeData inside == " + JSON.stringify(collegeData))
																					})
										
																				setTimeout(()=>{
																					console.log("collegeData == " + JSON.stringify(collegeData))
																					console.log("----13----");
																					var affiliationIds = affiliationId.split(',');
																					console.log("affiliationIds == " ,affiliationIds)
																					affiliationIds.pop();
																					console.log("affiliationIds == " ,affiliationIds)
																					affiliationId = affiliationIds.join(',');
																					console.log("affiliationId == " + affiliationId);
																					setTimeout(function(){
																						console.log("----14----");
																						if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
																							console.log("----15----");
																							models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																								if(MaxReferenceNo[0].maxNumber == null){
																									reference_no = 1001;
																								}else{
																									reference_no = MaxReferenceNo[0].maxNumber + 1;
																								}
										
																								models.Affiliation_Details.updateReferenceNumber_new(affiliationId,reference_no).then(function(updatedDetails){
																									console.log("----16----");
																									var ref_no = reference_no;
																									self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																									passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
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
																													filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																												}
																											}).then(function(emailDoc){
																												if(!emailDoc){
																													models.Emailed_Docs.create({
																													filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																													doc_type : "AffiliationLetter",
																													category : "AffiliationLetter",
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
																								})
																							});
																						}else{
																							console.log("----19----");
																							var ref_no = affiliation_Details[0].reference_no;
																							self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
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
																											filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																										}
																									}).then(function(emailDoc){
																										if(!emailDoc){
																											models.Emailed_Docs.create({
																											filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																											doc_type : "AffiliationLetter",
																											category : "AffiliationLetter",
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
																					},3000); 
																				},4000);   
																			}else if(affiliation_Details.length == 1){
																				affiliation_letter_length = affiliation_letter_length  + 1;
																				if(faculty.colleges.length == 1){
																					models.College.find ({
																						where :{
																							id : faculty.colleges[0].collegeId
																						}
																					}).then(function(college){
																						var studentName = prefix + affiliation_Details[0].studentName;
																						var collegeName ;
																						if(college.type == 'college'){
																							collegeName = affiliation_Details[0].collegeName + " which is affiliated to ";
																						}else if(college.type == 'department'){
																							collegeName = affiliation_Details[0].collegeName + ", ";
																						}
																						var courseName = affiliation_Details[0].courseName;
																						var specialization = affiliation_Details[0].specialization;
																						var passingMonthYear = affiliation_Details[0].yearofpassing;
																						var duration = converter.toWords(affiliation_Details[0].duration);
																						var passingClass = affiliation_Details[0].division;
																						var instruction_medium;
										
																						if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
																							instruction_medium = "English";
																						}else{
																							instruction_medium = affiliation_Details[0].instruction_medium;
																						}
																						var education = affiliation_Details[0].education;
																						setTimeout(()=>{
																							if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
																							console.log("affiliation_Details[0].reference_no == " + affiliation_Details[0].reference_no)
																								models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																									if(MaxReferenceNo[0].maxNumber == null){
																										reference_no = 1001;
																									}else{
																										reference_no = MaxReferenceNo[0].maxNumber + 1;
																									}
																									models.Affiliation_Letter.update(
																										{
																											reference_no : reference_no
																										},{
																										where :{
																											id : affiliation_Details[0].id
																										}
																									}).then(function(updatedDetails){
																										//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																										var ref_no = reference_no;
																										self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																										passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
																											if(err) {
																												res.json({ 
																													status: 400
																												})
																											}else{
																												models.Emailed_Docs.find({
																													where :{
																														app_id:app_id,
																														filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																													}
																												}).then(function(emailDoc){
																													if(!emailDoc){
																														models.Emailed_Docs.create({
																														filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																														doc_type : "AffiliationLetter",
																														category : "AffiliationLetter",
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
																									})
																								})
																							}else{
																								var ref_no = affiliation_Details[0].reference_no;
																								self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																								passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
																									if(err) {
																										res.json({ 
																											status: 400
																										})
																									}else{
																										models.Emailed_Docs.find({
																											where :{
																												app_id:app_id,
																												filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																											}
																										}).then(function(emailDoc){
																											if(!emailDoc){
																												models.Emailed_Docs.create({
																												filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																												doc_type : "AffiliationLetter",
																												category : "AffiliationLetter",
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
												console.log("----6----");
												var bachelorDetails = [];
												models.userMarkList.findAll({
													where :{
														type : "Bachelors",
														user_id : application.user_id
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
														console.log("----10----");
														console.log("facultyData == "+ JSON.stringify(facultyData));
														facultyData.forEach(faculty=>{
															models.Affiliation_Letter.findAll({
																where :{
																	user_id : application.user_id,
																	education : faculty.type + '_' + faculty.faculty
																}
															}).then(function(affiliationDetails){
																console.log("----11----");
																// console.log("affiliationDetails == " + JSON.stringify(affiliationDetails))
																var affiliation_Details = [];
																affiliationDetails.forEach(affiliation =>{
																	if(affiliation.app_id != null){
																		var app_idArr = affiliation.app_id.split(",");
																		app_idArr.forEach(app_id =>{
																			if(app_id == application_id){
																				affiliation_Details.push(affiliation);
																			}
																		})
																	}
																})
																console.log("----12----");
																console.log("affiliation_Details == " + JSON.stringify(affiliation_Details))
																
																if(affiliation_Details.length > 1){
																	console.log("----13----");
																	affiliation_letter_length =affiliation_letter_length  + 1;
																	var studentName = prefix + affiliation_Details[0].studentName;
																	var courseName = affiliation_Details[0].courseName;
																	var specialization = affiliation_Details[0].specialization;
																	var passingMonthYear = affiliation_Details[0].yearofpassing;
																	var duration = converter.toWords(affiliation_Details[0].duration);
																	var passingClass = affiliation_Details[0].division;
																	var instruction_medium;
																	if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
																		instruction_medium = "English";
																	}else{
																		instruction_medium = affiliation_Details[0].instruction_medium;
																	}
																	var education = affiliation_Details[0].education;
																	
																	var affiliationId = '';
																	
																		
																	affiliation_Details.forEach(affiliation =>{
																			console.log(affiliation.academicYear);
																			faculty.colleges.forEach(singleDetail=>{
																				console.log(singleDetail.name);
																				models.College.find({
																					where : {
																						id : singleDetail.collegeId
																					}
																				}).then(function(college){
																					if(affiliation.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
																						console.log("same");
																						if(college.type == 'college'){
																							console.log("college");
																							collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + " which is affiliated to Mumbai University.")
																						}else if(college.type == 'department'){
																							console.log("department");
																							collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + ", Mumbai University.")
																						}
																					}
																					console.log("collegeData inside college == " + JSON.stringify(collegeData))
																				})
																			})
																			affiliationId += affiliation.id +','
																			console.log("collegeData inside == " + JSON.stringify(collegeData))
																		})
							
																	setTimeout(()=>{
																		console.log("collegeData == " + JSON.stringify(collegeData))
																		console.log("----13----");
																		var affiliationIds = affiliationId.split(',');
																		console.log("affiliationIds == " ,affiliationIds)
																		affiliationIds.pop();
																		console.log("affiliationIds == " ,affiliationIds)
																		affiliationId = affiliationIds.join(',');
																		console.log("affiliationId == " + affiliationId);
																		setTimeout(function(){
																			console.log("----14----");
																			if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
																				console.log("----15----");
																				models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																					if(MaxReferenceNo[0].maxNumber == null){
																						reference_no = 1001;
																					}else{
																						reference_no = MaxReferenceNo[0].maxNumber + 1;
																					}
							
																					models.Affiliation_Letter.updateReferenceNumber_new(affiliationId,reference_no).then(function(updatedDetails){
																						console.log("----16----");
																						var ref_no = reference_no;
																						self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																						passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
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
																										filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																									}
																								}).then(function(emailDoc){
																									if(!emailDoc){
																										models.Emailed_Docs.create({
																										filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																										doc_type : "AffiliationLetter",
																										category : "AffiliationLetter",
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
																					})
																				});
																			}else{
																				console.log("----19----");
																				var ref_no = affiliation_Details[0].reference_no;
																				self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																				passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
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
																								filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																							}
																						}).then(function(emailDoc){
																							if(!emailDoc){
																								models.Emailed_Docs.create({
																								filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																								doc_type : "AffiliationLetter",
																								category : "AffiliationLetter",
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
																		},3000); 
																	},4000);   
																}else if(affiliation_Details.length == 1){
																	affiliation_letter_length = affiliation_letter_length  + 1;
																	if(faculty.colleges.length == 1){
																		models.College.find ({
																			where :{
																				id : faculty.colleges[0].collegeId
																			}
																		}).then(function(college){
																			var studentName = prefix +affiliation_Details[0].studentName;
																			var collegeName ;
																			if(college.type == 'college'){
																				collegeName =affiliation_Details[0].collegeName + " which is affiliated to ";
																			}else if(college.type == 'department'){
																				collegeName = affiliation_Details[0].collegeName + ", ";
																			}
																			var courseName = affiliation_Details[0].courseName;
																			var specialization = affiliation_Details[0].specialization;
																			var passingMonthYear = affiliation_Details[0].yearofpassing;
																			var duration = converter.toWords(affiliation_Details[0].duration);
																			var passingClass = affiliation_Details[0].division;
																			var instruction_medium;
							
																			if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
																				instruction_medium = "English";
																			}else{
																				instruction_medium = affiliation_Details[0].instruction_medium;
																			}
																			var education = affiliation_Details[0].education;
																			setTimeout(()=>{
																				if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
																				console.log("affiliation_Details[0].reference_no == " + affiliation_Details[0].reference_no)
																					models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																						if(MaxReferenceNo[0].maxNumber == null){
																							reference_no = 1001;
																						}else{
																							reference_no = MaxReferenceNo[0].maxNumber + 1;
																						}
																						models.Affiliation_Letter.update(
																							{
																								reference_no : reference_no
																							},{
																							where :{
																								id : affiliation_Details[0].id
																							}
																						}).then(function(updatedDetails){
																							//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																							var ref_no = reference_no;
																							self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
																								if(err) {
																									res.json({ 
																										status: 400
																									})
																								}else{
																									models.Emailed_Docs.find({
																										where :{
																											app_id:app_id,
																											filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																										}
																									}).then(function(emailDoc){
																										if(!emailDoc){
																											models.Emailed_Docs.create({
																											filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																											doc_type : "AffiliationLetter",
																											category : "AffiliationLetter",
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
																						})
																					})
																				}else{
																					var ref_no = affiliation_Details[0].reference_no;
																					self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
																						if(err) {
																							res.json({ 
																								status: 400
																							})
																						}else{
																							models.Emailed_Docs.find({
																								where :{
																									app_id:app_id,
																									filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																								}
																							}).then(function(emailDoc){
																								if(!emailDoc){
																									models.Emailed_Docs.create({
																									filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																									doc_type : "AffiliationLetter",
																									category : "AffiliationLetter",
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
																	}
																}
															})
														})
													}
												})
											}else if(appliedDetails.applying_for == 'Masters'){
												console.log("----6----");
												var bachelorDetails = [];
												models.userMarkList.findAll({
													where :{
														type : "Masters",
														user_id : application.user_id
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
														console.log("----10----");
														console.log("facultyData == "+ JSON.stringify(facultyData));
														facultyData.forEach(faculty=>{
															models.Affiliation_Letter.findAll({
																where :{
																	user_id : application.user_id,
																	education : faculty.type + '_' + faculty.faculty
																}
															}).then(function(affiliationDetails){
																console.log("----11----");
																// console.log("affiliationDetails == " + JSON.stringify(affiliationDetails))
																var affiliation_Details = [];
																affiliationDetails.forEach(affiliation =>{
																	if(affiliation.app_id != null){
																		var app_idArr = affiliation.app_id.split(",");
																		app_idArr.forEach(app_id =>{
																			if(app_id == application_id){
																				affiliation_Details.push(affiliation);
																			}
																		})
																	}
																})
																console.log("----12----");
																console.log("affiliation_Details == " + JSON.stringify(affiliation_Details))
																
																if(affiliation_Details.length > 1){
																	console.log("----13----");
																	affiliation_letter_length =affiliation_letter_length  + 1;
																	var studentName = prefix + affiliation_Details[0].studentName;
																	var courseName = affiliation_Details[0].courseName;
																	var specialization = affiliation_Details[0].specialization;
																	var passingMonthYear = affiliation_Details[0].yearofpassing;
																	var duration = converter.toWords(affiliation_Details[0].duration);
																	var passingClass = affiliation_Details[0].division;
																	var instruction_medium;
																	if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
																		instruction_medium = "English";
																	}else{
																		instruction_medium = affiliation_Details[0].instruction_medium;
																	}
																	var education = affiliation_Details[0].education;
																	
																	var affiliationId = '';
																	
																		
																	affiliation_Details.forEach(affiliation =>{
																			console.log(affiliation.academicYear);
																			faculty.colleges.forEach(singleDetail=>{
																				console.log(singleDetail.name);
																				models.College.find({
																					where : {
																						id : singleDetail.collegeId
																					}
																				}).then(function(college){
																					if(affiliation.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
																						console.log("same");
																						if(college.type == 'college'){
																							console.log("college");
																							collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + " which is affiliated to Mumbai University.")
																						}else if(college.type == 'department'){
																							console.log("department");
																							collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + ", Mumbai University.")
																						}
																					}
																					console.log("collegeData inside college == " + JSON.stringify(collegeData))
																				})
																			})
																			affiliationId += affiliation.id +','
																			console.log("collegeData inside == " + JSON.stringify(collegeData))
																		})
							
																	setTimeout(()=>{
																		console.log("collegeData == " + JSON.stringify(collegeData))
																		console.log("----13----");
																		var affiliationIds = affiliationId.split(',');
																		console.log("affiliationIds == " ,affiliationIds)
																		affiliationIds.pop();
																		console.log("affiliationIds == " ,affiliationIds)
																		affiliationId = affiliationIds.join(',');
																		console.log("affiliationId == " + affiliationId);
																		setTimeout(function(){
																			console.log("----14----");
																			if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
																				console.log("----15----");
																				models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																					if(MaxReferenceNo[0].maxNumber == null){
																						reference_no = 1001;
																					}else{
																						reference_no = MaxReferenceNo[0].maxNumber + 1;
																					}
							
																					models.Affiliation_Letter.updateReferenceNumber_new(affiliationId,reference_no).then(function(updatedDetails){
																						console.log("----16----");
																						var ref_no = reference_no;
																						self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																						passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
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
																										filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																									}
																								}).then(function(emailDoc){
																									if(!emailDoc){
																										models.Emailed_Docs.create({
																										filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																										doc_type : "AffiliationLetter",
																										category : "AffiliationLetter",
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
																					})
																				});
																			}else{
																				console.log("----19----");
																				var ref_no = affiliation_Details[0].reference_no;
																				self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																				passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
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
																								filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																							}
																						}).then(function(emailDoc){
																							if(!emailDoc){
																								models.Emailed_Docs.create({
																								filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																								doc_type : "AffiliationLetter",
																								category : "AffiliationLetter",
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
																		},3000); 
																	},4000);   
																}else if(affiliation_Details.length == 1){
																	affiliation_letter_length = affiliation_letter_length  + 1;
																	if(faculty.colleges.length == 1){
																		models.College.find ({
																			where :{
																				id : faculty.colleges[0].collegeId
																			}
																		}).then(function(college){
																			var studentName = prefix +affiliation_Details[0].studentName;
																			var collegeName ;
																			if(college.type == 'college'){
																				collegeName =affiliation_Details[0].collegeName + " which is affiliated to ";
																			}else if(college.type == 'department'){
																				collegeName = affiliation_Details[0].collegeName + ", ";
																			}
																			var courseName = affiliation_Details[0].courseName;
																			var specialization = affiliation_Details[0].specialization;
																			var passingMonthYear = affiliation_Details[0].yearofpassing;
																			var duration = converter.toWords(affiliation_Details[0].duration);
																			var passingClass = affiliation_Details[0].division;
																			var instruction_medium;
							
																			if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
																				instruction_medium = "English";
																			}else{
																				instruction_medium = affiliation_Details[0].instruction_medium;
																			}
																			var education = affiliation_Details[0].education;
																			setTimeout(()=>{
																				if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
																				console.log("affiliation_Details[0].reference_no == " + affiliation_Details[0].reference_no)
																					models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																						if(MaxReferenceNo[0].maxNumber == null){
																							reference_no = 1001;
																						}else{
																							reference_no = MaxReferenceNo[0].maxNumber + 1;
																						}
																						models.Affiliation_Letter.update(
																							{
																								reference_no : reference_no
																							},{
																							where :{
																								id : affiliation_Details[0].id
																							}
																						}).then(function(updatedDetails){
																							//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																							var ref_no = reference_no;
																							self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
																								if(err) {
																									res.json({ 
																										status: 400
																									})
																								}else{
																									models.Emailed_Docs.find({
																										where :{
																											app_id:app_id,
																											filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																										}
																									}).then(function(emailDoc){
																										if(!emailDoc){
																											models.Emailed_Docs.create({
																											filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																											doc_type : "AffiliationLetter",
																											category : "AffiliationLetter",
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
																						})
																					})
																				}else{
																					var ref_no = affiliation_Details[0].reference_no;
																					self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
																						if(err) {
																							res.json({ 
																								status: 400
																							})
																						}else{
																							models.Emailed_Docs.find({
																								where :{
																									app_id:app_id,
																									filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																								}
																							}).then(function(emailDoc){
																								if(!emailDoc){
																									models.Emailed_Docs.create({
																									filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																									doc_type : "AffiliationLetter",
																									category : "AffiliationLetter",
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
														user_id : application.user_id
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
														console.log("----10----");
														console.log("facultyData == "+ JSON.stringify(facultyData));
														facultyData.forEach(faculty=>{
															models.Affiliation_Letter.findAll({
																where :{
																	user_id : application.user_id,
																	education : faculty.type + '_' + faculty.faculty
																}
															}).then(function(affiliationDetails){
																console.log("----11----");
																// console.log("affiliationDetails == " + JSON.stringify(affiliationDetails))
																var affiliation_Details = [];
																affiliationDetails.forEach(affiliation =>{
																	if(affiliation.app_id != null){
																		var app_idArr = affiliation.app_id.split(",");
																		app_idArr.forEach(app_id =>{
																			if(app_id == application_id){
																				affiliation_Details.push(affiliation);
																			}
																		})
																	}
																})
																console.log("----12----");
																console.log("affiliation_Details == " + JSON.stringify(affiliation_Details))
																
																if(affiliation_Details.length > 1){
																	console.log("----13----");
																	affiliation_letter_length =affiliation_letter_length  + 1;
																	var studentName = prefix + affiliation_Details[0].studentName;
																	var courseName = affiliation_Details[0].courseName;
																	var specialization = affiliation_Details[0].specialization;
																	var passingMonthYear = affiliation_Details[0].yearofpassing;
																	var duration = converter.toWords(affiliation_Details[0].duration);
																	var passingClass = affiliation_Details[0].division;
																	var instruction_medium;
																	if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
																		instruction_medium = "English";
																	}else{
																		instruction_medium = affiliation_Details[0].instruction_medium;
																	}
																	var education = affiliation_Details[0].education;
																	
																	var affiliationId = '';
																	
																		
																	affiliation_Details.forEach(affiliation =>{
																			console.log(affiliation.academicYear);
																			faculty.colleges.forEach(singleDetail=>{
																				console.log(singleDetail.name);
																				models.College.find({
																					where : {
																						id : singleDetail.collegeId
																					}
																				}).then(function(college){
																					if(affiliation.academicYear.toLowerCase() == singleDetail.name.toLowerCase()){
																						console.log("same");
																						if(college.type == 'college'){
																							console.log("college");
																							collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + " which is affiliated to Mumbai University.")
																						}else if(college.type == 'department'){
																							console.log("department");
																							collegeData.push(affiliation.academicYear + ' from ' + affiliation.collegeName + ", Mumbai University.")
																						}
																					}
																					console.log("collegeData inside college == " + JSON.stringify(collegeData))
																				})
																			})
																			affiliationId += affiliation.id +','
																			console.log("collegeData inside == " + JSON.stringify(collegeData))
																		})
							
																	setTimeout(()=>{
																		console.log("collegeData == " + JSON.stringify(collegeData))
																		console.log("----13----");
																		var affiliationIds = affiliationId.split(',');
																		console.log("affiliationIds == " ,affiliationIds)
																		affiliationIds.pop();
																		console.log("affiliationIds == " ,affiliationIds)
																		affiliationId = affiliationIds.join(',');
																		console.log("affiliationId == " + affiliationId);
																		setTimeout(function(){
																			console.log("----14----");
																			if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
																				console.log("----15----");
																				models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																					if(MaxReferenceNo[0].maxNumber == null){
																						reference_no = 1001;
																					}else{
																						reference_no = MaxReferenceNo[0].maxNumber + 1;
																					}
							
																					models.Affiliation_Letter.updateReferenceNumber_new(affiliationId,reference_no).then(function(updatedDetails){
																						console.log("----16----");
																						var ref_no = reference_no;
																						self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																						passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
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
																										filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																									}
																								}).then(function(emailDoc){
																									if(!emailDoc){
																										models.Emailed_Docs.create({
																										filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																										doc_type : "AffiliationLetter",
																										category : "AffiliationLetter",
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
																					})
																				});
																			}else{
																				console.log("----19----");
																				var ref_no = affiliation_Details[0].reference_no;
																				self_pdf.instrucationalLetterForDiffClg_two(application.user_id,application_id,studentName,collegeData,courseName,specialization,
																				passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
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
																								filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																							}
																						}).then(function(emailDoc){
																							if(!emailDoc){
																								models.Emailed_Docs.create({
																								filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																								doc_type : "AffiliationLetter",
																								category : "AffiliationLetter",
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
																		},3000); 
																	},4000);   
																}else if(affiliation_Details.length == 1){
																	affiliation_letter_length = affiliation_letter_length  + 1;
																	if(faculty.colleges.length == 1){
																		models.College.find ({
																			where :{
																				id : faculty.colleges[0].collegeId
																			}
																		}).then(function(college){
																			var studentName = prefix +affiliation_Details[0].studentName;
																			var collegeName ;
																			if(college.type == 'college'){
																				collegeName =affiliation_Details[0].collegeName + " which is affiliated to ";
																			}else if(college.type == 'department'){
																				collegeName = affiliation_Details[0].collegeName + ", ";
																			}
																			var courseName = affiliation_Details[0].courseName;
																			var specialization = affiliation_Details[0].specialization;
																			var passingMonthYear = affiliation_Details[0].yearofpassing;
																			var duration = converter.toWords(affiliation_Details[0].duration);
																			var passingClass = affiliation_Details[0].division;
																			var instruction_medium;
							
																			if(affiliation_Details[0].instruction_medium == null || affiliation_Details[0].instruction_medium == undefined || affiliation_Details[0].instruction_medium == ''){
																				instruction_medium = "English";
																			}else{
																				instruction_medium = affiliation_Details[0].instruction_medium;
																			}
																			var education = affiliation_Details[0].education;
																			setTimeout(()=>{
																				if(affiliation_Details[0].reference_no == null || affiliation_Details[0].reference_no == '' || affiliation_Details[0].reference_no == undefined){
																				console.log("affiliation_Details[0].reference_no == " + affiliation_Details[0].reference_no)
																					models.Affiliation_Letter.getMaxRefetenceNumber().then(function(MaxReferenceNo){
																						if(MaxReferenceNo[0].maxNumber == null){
																							reference_no = 1001;
																						}else{
																							reference_no = MaxReferenceNo[0].maxNumber + 1;
																						}
																						models.Affiliation_Letter.update(
																							{
																								reference_no : reference_no
																							},{
																							where :{
																								id : affiliation_Details[0].id
																							}
																						}).then(function(updatedDetails){
																							//console.log("updateDetails.reference_no == " + updateDetails.reference_no);
																							var ref_no = reference_no;
																							self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																							passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
																								if(err) {
																									res.json({ 
																										status: 400
																									})
																								}else{
																									models.Emailed_Docs.find({
																										where :{
																											app_id:app_id,
																											filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																										}
																									}).then(function(emailDoc){
																										if(!emailDoc){
																											models.Emailed_Docs.create({
																											filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																											doc_type : "AffiliationLetter",
																											category : "AffiliationLetter",
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
																						})
																					})
																				}else{
																					var ref_no = affiliation_Details[0].reference_no;
																					self_pdf.instrucationalLetter_one(application.user_id,application_id,studentName,collegeName,courseName,specialization,
																					passingMonthYear,duration,passingClass,instruction_medium,application.created_at,subject,subject1,ref_no,education,"affiliationLetter",function(err){
																						if(err) {
																							res.json({ 
																								status: 400
																							})
																						}else{
																							models.Emailed_Docs.find({
																								where :{
																									app_id:app_id,
																									filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																								}
																							}).then(function(emailDoc){
																								if(!emailDoc){
																									models.Emailed_Docs.create({
																									filename : app_id+"_"+affiliation_Details[0].education+"_AffiliationLetter.pdf",
																									doc_type : "AffiliationLetter",
																									category : "AffiliationLetter",
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
							if(user[0].curriculum == true){
								models.User_Curriculum.findAll({
									where :{
										user_id : user_id
									}
								}).then(function(usercurriculums){
									if(usercurriculums.length > 0){
										var app_idArr = [];
										usercurriculums.forEach(usercurriculum=>{
											if(usercurriculum.app_id != null){
												var app_idArr = usercurriculum.app_id.split(',');
												app_idArr.forEach(transcript_appId=>{
													if(transcript_appId == app_id){
														user_curriculums.push(usercurriculum);
													}
												})
											}
										})
										if(user_curriculums.length > 0){
											curriculum_length = user_curriculums.length;
											console.log("curriculum_length == " +curriculum_length)
											user_curriculums.forEach(curriculum=>{
												var numOfpages = 0;
												models.Emailed_Docs.findAll({
													where : {
														curriculum_id : curriculum.id,
													}
												}).then(function(signedDocs){
												var existsFlag = false;
												if(signedDocs.length > 0){
													var file_name;
													var doc_type;
													var category;
													signedDocs.forEach(signedDoc=>{
													file_name = signedDoc.filename;
													doc_type = signedDoc.doc_type;
													category = signedDoc.category;
													var signedFilePath = constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+signedDoc.filename;
													if(fs.existsSync(signedFilePath)){
														if(signedDoc.app_id == app_id){
															existsFlag = true;
														}else{
															var app_idFlag = false;
															console.log("Different App ID 2" + signedDoc.app_id + " " + app_id);
															app_idArr.forEach(transcriptAppId =>{
																if(transcriptAppId == signedDoc.app_id){
																console.log("Same id");
																app_idFlag = true;
																}
															});
															console.log("app_idFlag == " + app_idFlag);
															if(app_idFlag == true){
																existsFlag =  true;
															}
														// models.Emailed_Docs.create({
														//   filename : signedDoc.filename,
														//   doc_type : signedDoc.doc_type,
														//   category : signedDoc.category,
														//   user_id: user_id,
														//   transcript_id: null,
														//   marklist_id : null,
														//   app_id:app_id,
														//   curriculum_id : curriculum.id
														// }).then((result)=>{
														//   // logger.debug(" result : "+JSON.stringify(result))
														// })
														}
													}else{
														var fileName = curriculum.file_name;
														var filePath = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName;
														if(fs.existsSync(filePath)){
														var extension=fileName.split('.').pop();
														if(extension == 'pdf'){
															let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName);
															pdf(dataBuffer).then(function(data) {
															console.log("no=====>"+data.numpages);  // number of pages
															numOfpages = data.numpages;
															});
															fn.pdftomultipleimg_new(fileName,user_id,numOfpages)
															if(!fs.existsSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/")){
																fs.mkdirSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/", { recursive: true });//fs.writeFileSync
															}
															var outputdirectory = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/";
															var filesString = ''
															setTimeout(()=>{
																console.log("<===settimeout of 60===>");
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
																	
																	file_loc=  constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(fileName).name+"/"+path.parse(fileName).name+"-"+j+".jpg"; 
																	file_loc2=  constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/"+path.parse(fileName).name+"_"+i+".pdf";  
																	filesString = filesString+' "'+file_loc2+'" ';
																	if (fs.existsSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(fileName).name+"/"+path.parse(fileName).name+"-"+j+".jpg")){
																		console.log("file exist return i ===>"+i);
																		fn.curriculumsignedpdf_new(path.parse(fileName).name, user_id, app_id, file_loc, signstatus, curriculum.name, i,outputdirectory,function(err){
																		if(err){
																			return res.json({
																			status : 400,
																			mesaasge : err
																			})
																		}else{
	
																		}
																		});
																	}
																}
															},60000)
															count++;
															setTimeout(()=>{
																fn.curriculum_merge(app_id, user_id, curriculum.id,curriculum.name,path.parse(fileName).name, filesString,count);
															}, 3*60000);
															
														}else{
															setTimeout(()=>{
															file_loc= constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName;
															if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_"+curriculum.name+"_"+path.parse(fileName).name+".pdf")){
															var category = "Curriculum";
															fn.signedpdf_new(path.parse(fileName).name, user_id, app_id, file_loc, signstatus, null, null ,curriculum.name,category,count, curriculum.id,null,null,null,function(err){
																if(err){
																
																return res.json({
																	status : 400,
																	message : err
																})
																}else{
	
																count++;
																}
															});
															}
														},2500)
														}
														}else{
														var message = curriculum.name + " file not found"
														res.json({
															status : 400,
															message : message
														})
														}
													}
													})
													if(existsFlag == false){
													models.Emailed_Docs.create({
														filename : file_name,
														doc_type : doc_type,
														category : category,
														user_id: user_id,
														transcript_id: null,
														marklist_id : null,
														app_id:app_id,
														curriculum_id : curriculum.id
													}).then((result)=>{
														// logger.debug(" result : "+JSON.stringify(result))
													})
													}
												}else{
													var fileName = curriculum.file_name;
													var filePath = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName;
													if(fs.existsSync(filePath)){
													var extension=fileName.split('.').pop();
													if(extension == 'pdf'){
														let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName);
														pdf(dataBuffer).then(function(data) {
														console.log("no=====>"+data.numpages);  // number of pages
														numOfpages = data.numpages;
														});
														fn.pdftomultipleimg_new(fileName,user_id,numOfpages)
														if(!fs.existsSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/")){
															fs.mkdirSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/", { recursive: true });//fs.writeFileSync
														}
														var outputdirectory = constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/";
														var filesString = ''
														setTimeout(()=>{
															console.log("<===settimeout of 60===>");
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
																file_loc=  constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(fileName).name+"/"+path.parse(fileName).name+"-"+j+".jpg"; 
																file_loc2=  constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/signed_"+path.parse(fileName).name+"/"+path.parse(fileName).name+"_"+i+".pdf";  
																filesString = filesString+' "'+file_loc2+'" ';
																if (fs.existsSync(constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+path.parse(fileName).name+"/"+path.parse(fileName).name+"-"+j+".jpg")){
																	console.log("file exist return i ===>"+i);
																	fn.curriculumsignedpdf_new(path.parse(fileName).name, user_id, app_id, file_loc, signstatus, curriculum.name, i,outputdirectory,function(err){
																	if(err){
																		return res.json({
																		status : 400,
																		mesaasge : err
																		})
																	}else{
	
																	}
																	});
																}
															}
														},60000)
														count++;
														setTimeout(()=>{
															fn.curriculum_merge(app_id, user_id, curriculum.id,curriculum.name,path.parse(fileName).name, filesString,count);
														}, 3*60000);
													
													}else{
														setTimeout(()=>{
														file_loc= constant.FILE_LOCATION+"public/upload/curriculum/"+user_id+"/"+fileName;
														if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+user_id+"/"+app_id+"_"+curriculum.name+"_"+path.parse(fileName).name+".pdf")){
														var category = "Curriculum";
														fn.signedpdf_new(path.parse(fileName).name, user_id, app_id, file_loc, signstatus, null, null ,curriculum.name,category,count, curriculum.id,null,null,function(err){
															if(err){
															
															return res.json({
																status : 400,
																message : err
															})
															}else{
	
															count++;
															}
														});
														}
													},2500)
													}
													}else{
													var message = curriculum.name + " file not found"
													return res.json({
														status : 400,
														message : message
													})
													}
													
												}
												})
											})
										}else{
										// return res.json({
										//   status : 400,
										//   message : "Transcript not uploaded"
										// })
										}
									}else{
										return res.json({
										status : 400,
										message : "Curriculum not uploaded"
										})
									}
								});
							}
							if(user[0].gradToPer == true){
								models.GradeToPercentageLetter.findAll({
									where:{
										user_id : application.user_id,
										app_id :{
											[Op.ne] : null
										}
									}
								}).then(function(letters){
									console.log("letters == " + JSON.stringify(letters));
									letters.forEach(letter=>{
										var app_idArr = letter.app_id.split(',');
										app_idArr.forEach(letter_appId=>{
											if(letter_appId == app_id){
												gradTOPer_letter.push(letter);
											}
										})
									})
									
									if(gradTOPer_letter.length > 0){
										gradTOPer_letter_length = gradTOPer_letter.length;
										gradTOPer_letter.forEach(letter=>{
											console.log("letter == " + JSON.stringify(letter));
											var doc_name = letter.name.split(' ').join('_');
											var fileName = doc_name + "_" + path.parse(letter.file_name).name + "-.pdf";
											models.Emailed_Docs.find({
												where :{
													gradToPer_id : letter.id,
													fileName : fileName,
													app_id :{
														[Op.ne] : app_id
													}
												}
											}).then(function(emailedDocs){
												if(emailedDocs){
													models.Emailed_Docs.create({
														filename : emaildDocs.file_name,
														doc_type : emaildDocs.doc_type,
														category : emaildDocs.category,
														gradToPer_id: letter.id,
														app_id:app_id
													});
												}else{
													var fileName = path.parse(letter.file_name).name;
													var filePath = constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+application.user_id+"/"+letter.file_name;
													var category = "GradeToPerLetter";
													var outputDirectory;
													if(fs.existsSync(filePath)){
														var extension=letter.file_name.split('.').pop();
														var numOfpages;
														console.log("test==")
														if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(letter.file_name).name+".pdf")){
															if(extension == 'pdf'){
																var folderName = fileName.split(" ").join("_");
																console.log("folderName == " + folderName);
																outputDirectory = constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+application.user_id+"/"+folderName+"/";
																fn.pdfToImageConversion(path.parse(letter.file_name).name,application.user_id,filePath,outputDirectory);
																let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+application.user_id+"/"+letter.file_name);
																	pdf(dataBuffer).then(function(data) {
																	console.log("no=====>"+data.numpages);  // number of pages
																	numOfpages = data.numpages;
																});
																var fileString = "";
																outputDirectory = constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+application.user_id+"/signed_"+folderName+"/";
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
																	
																		console.log("fileName == " + fileName);
																		filePath =  constant.FILE_LOCATION+"public/upload/gradeToPercentLetter/"+application.user_id+"/"+ folderName +"/"+path.parse(letter.file_name).name+"-"+j+".jpg"; 
																		console.log(filePath);
																		var file_name =  fileName+"-"+j+".jpg"
																		console.log("file_name == " + file_name);
																		fn.signingDocuments(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
																			if(err){
																				return res.json({
																				status : 400,
																				message : err
																				})
																			}else{
					
																				fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
																				console.log("fileString == " + fileString);
																			}
																		});
																	}
																},4000) 
																
																
																setTimeout(()=>{
																	console.log("fileString 2 == " + fileString);
																	outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																	fn.mergeDocuments(app_id, application.user_id,doc_name, path.parse(letter.file_name).name, outputDirectory, fileString, function(err){
																		if(err){
																			return res.json({
																				status : 400,
																				message : "Files cannot merge"
																			})
																		}else{
																			var file_name = doc_name + "_" + path.parse(letter.file_name).name + ".pdf"
																			models.Emailed_Docs.find({
																				where : {
																					filename : file_name,
																					gradToPer_id: letter.id,
																					app_id:app_id,
																				}
																			}).then(function(emailedDoc){
																				if(emailedDoc){
					
																				}else{
																					models.Emailed_Docs.create({
																						filename : file_name,
																						doc_type : doc_name,
																						category : category,
																						gradToPer_id: letter.id,
																						app_id:app_id,
																					}).then((result)=>{
																					// logger.debug(" result : "+JSON.stringify(result))
																				})
																				}
																			})
																		}
																	});
																}, 6000);
															}else{
																
																outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																fn.signingDocuments(path.parse(letter.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
																	if(err){
																		return res.json({
																			status : 400,
																			message : err
																		})
																	}else{
																		var file_name = doc_name + "_" + path.parse(letter.file_name).name + ".pdf"
																		models.Emailed_Docs.find({
																			where : {
																				filename : file_name,
																				gradToPer_id: letter.id,
																				app_id:app_id,
																			}
																		}).then(function(emailedDoc){
																			if(emailedDoc){
					
																			}else{
																				models.Emailed_Docs.create({
																					filename : file_name,
																					doc_type : doc_name,
																					category : category,
																					gradToPer_id: letter.id,
																					app_id:app_id
																				}).then((result)=>{
																				// logger.debug(" result : "+JSON.stringify(result))
																			})
																			}
																		})
																	}
																});
															}
														}else{
															var file_name = doc_name + "_" + path.parse(letter.file_name).name + ".pdf"
															models.Emailed_Docs.find({
																where : {
																	filename : file_name,
																	gradToPer_id: letter.id,
																	app_id:app_id,
																}
															}).then(function(emailedDoc){
																if(emailedDoc){
					
																}else{
																	models.Emailed_Docs.create({
																		filename : file_name,
																		doc_type : doc_name,
																		category : category,
																		gradToPer_id: transcript.id,
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
									}
								})
							}
							if(user[0].CompetencyLetter == true){
								console.log("user_id == " + user_id);
								models.competency_letter.findAll({
									where:{
										user_id : application.user_id,
										app_id :{
											[Op.ne] : null
										}
									}
								}).then(function(userCompetency){
									console.log("userCompetency == " + JSON.stringify(userCompetency));
									userCompetency.forEach(user_transcript=>{
										var app_idArr = user_transcript.app_id.split(',');
										app_idArr.forEach(transcript_appId=>{
											if(transcript_appId == app_id){
												competencyletter.push(user_transcript);
											}
										})
									})
	
									if(competencyletter.length > 0){
										competencyletter_length = competencyletter.length;  
										competencyletter.forEach(transcript=>{
											console.log("transcript == " + JSON.stringify(transcript));
											var doc_name = transcript.name.split(' ').join('_');
											var fileName = doc_name + "_" + path.parse(transcript.file_name).name + "-.pdf";
											models.Emailed_Docs.find({
												where :{
													competency_id : transcript.id,
													fileName : fileName,
													app_id :{
														[Op.ne] : app_id
													}
												}
											}).then(function(emailedDocs){
												if(emailedDocs){
													models.Emailed_Docs.create({
														filename : emaildDocs.file_name,
														doc_type : emaildDocs.doc_type,
														category : emaildDocs.category,
														competency_id: transcript.id,
														app_id:app_id
													});
												}else{
													var fileName = path.parse(transcript.file_name).name;
													var filePath = constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+application.user_id+"/"+transcript.file_name;
													var category = "CompetencyLetter";
													var outputDirectory;
													if(fs.existsSync(filePath)){
														var extension=transcript.file_name.split('.').pop();
														var numOfpages;
														console.log("test==")
														if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
															if(extension == 'pdf'){
																var folderName = fileName.split(" ").join("_");
																console.log("folderName == " + folderName);
																outputDirectory = constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+application.user_id+"/"+folderName+"/";
																fn.pdfToImageConversion(path.parse(transcript.file_name).name,application.user_id,filePath,outputDirectory);
																let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+application.user_id+"/"+transcript.file_name);
																	pdf(dataBuffer).then(function(data) {
																	console.log("no=====>"+data.numpages);  // number of pages
																	numOfpages = data.numpages;
																});
																var fileString = "";
																outputDirectory = constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+application.user_id+"/signed_"+folderName+"/";
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
																	
																		console.log("fileName == " + fileName);
																		filePath =  constant.FILE_LOCATION+"public/upload/CompetencyLetter/"+application.user_id+"/"+ folderName +"/"+path.parse(transcript.file_name).name+"-"+j+".jpg"; 
																		console.log(filePath);
																		var file_name =  fileName+"-"+j+".jpg"
																		console.log("file_name == " + file_name);
																		fn.signingDocuments(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
																			if(err){
																				return res.json({
																				status : 400,
																				message : err
																				})
																			}else{
					
																				fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
																				console.log("fileString == " + fileString);
																			}
																		});
																	}
																},4000) 
																
																
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
																					competency_id: transcript.id,
																					app_id:app_id,
																				}
																			}).then(function(emailedDoc){
																				if(emailedDoc){
					
																				}else{
																					models.Emailed_Docs.create({
																						filename : file_name,
																						doc_type : doc_name,
																						category : category,
																						competency_id: transcript.id,
																						app_id:app_id,
																					}).then((result)=>{
																					// logger.debug(" result : "+JSON.stringify(result))
																				})
																				}
																			})
																		}
																	});
																}, 6000);
															}else{
																
																outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																fn.signingDocuments(path.parse(transcript.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
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
																				competency_id: transcript.id,
																				app_id:app_id,
																			}
																		}).then(function(emailedDoc){
																			if(emailedDoc){
					
																			}else{
																				models.Emailed_Docs.create({
																					filename : file_name,
																					doc_type : doc_name,
																					category : category,
																					competency_id: transcript.id,
																					app_id:app_id
																				}).then((result)=>{
																				// logger.debug(" result : "+JSON.stringify(result))
																			})
																			}
																		})
																	}
																});
															}
														}else{
															var file_name = doc_name + "_" + path.parse(transcript.file_name).name + ".pdf"
															models.Emailed_Docs.find({
																where : {
																	filename : file_name,
																	competency_id: transcript.id,
																	app_id:app_id,
																}
															}).then(function(emailedDoc){
																if(emailedDoc){
					
																}else{
																	models.Emailed_Docs.create({
																		filename : file_name,
																		doc_type : doc_name,
																		category : category,
																		competency_id: transcript.id,
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
									}
								})
								if(user[0].educationalDetails != true){
									models.UserMarklist_Upload.findAll({
										where:{
											user_id : application.user_id,
											app_id :{
												[Op.ne] : null
											}
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
														models.Emailed_Docs.create({
															filename : emaildDocs.file_name,
															doc_type : emaildDocs.doc_type,
															category : emaildDocs.category,
															marklist_id: marklist.id,
															app_id:app_id
														});
													}else{
														var fileName = path.parse(marklist.file_name).name;
														var filePath = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+marklist.file_name;
														var category = "Marklist";
														var outputDirectory;
														if(fs.existsSync(filePath)){
															var extension=marklist.file_name.split('.').pop();
															var numOfpages;
															console.log("test==")
															if (!fs.existsSync(constant.FILE_LOCATION+"public/signedpdf/"+application.user_id+"/"+doc_name+"_"+path.parse(transcript.file_name).name+".pdf")){
																if(extension == 'pdf'){
																	var folderName = fileName.split(" ").join("_");
																	console.log("folderName == " + folderName);
																	outputDirectory = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+folderName+"/";
																	fn.pdfToImageConversion(path.parse(marklist.file_name).name,application.user_id,filePath,outputDirectory);
																	let dataBuffer = fs.readFileSync( constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+marklist.file_name);
																		pdf(dataBuffer).then(function(data) {
																		console.log("no=====>"+data.numpages);  // number of pages
																		numOfpages = data.numpages;
																	});
																	var fileString = "";
																	outputDirectory = constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/signed_"+folderName+"/";
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
																		
																			console.log("fileName == " + fileName);
																			filePath =  constant.FILE_LOCATION+"public/upload/marklist/"+application.user_id+"/"+ folderName +"/"+path.parse(marklist.file_name).name+"-"+j+".jpg"; 
																			console.log(filePath);
																			var file_name =  fileName+"-"+j+".jpg"
																			console.log("file_name == " + file_name);
																			fn.signingDocuments(path.parse(file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory,function(err){
																				if(err){
																					return res.json({
																					status : 400,
																					message : err
																					})
																				}else{
						
																					fileString = fileString +' "'+ outputDirectory + doc_name + "_" + fileName +'-'+j+'.pdf" '; 
																					console.log("fileString == " + fileString);
																				}
																			});
																		}
																	},2000) 
																	
																	
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
																	}, 4000);
																}else{
																	
																	outputDirectory = constant.FILE_LOCATION + "public/signedpdf/" + application.user_id + "/" ;
																	fn.signingDocuments(path.parse(marklist.file_name).name, application.user_id, app_id, filePath, doc_name, category, outputDirectory, function(err){
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
										}
									})
								}
							}
						
						if(institution_data[0].type == 'Educational credential evaluators WES' && user[0].applying_for == 'Phd,Masters,Bachelors'){
							self_pdf.generateWesForm(user_id,application.id,function(err){
								if(err) {
									console.log("ERROR");
									res.json({
										status: 400
									})
								}else{
									console.log("SUCESSSS=========");
									models.Emailed_Docs.find({
										where :{
											app_id:app_id,
											filename : 'wesletter'
										}
									}).then(function(emailDoc){
										if(!emailDoc){
											wesform_length = 1;
											models.Emailed_Docs.create({
												filename : "wesletter.pdf",
												doc_type : "wesletter",
												category : "wesletter",
												user_id: user_id,
												transcript_id: null,
												marklist_id : null,
												app_id:app_id,
												curriculum_id : null
												}).then((result)=>{
													console.log("SUCCESS");
												})
										}
									})
								}
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
						if(institution_data[0].type == 'Educational credential evaluators WES' && user[0].applying_for == 'Phd,Masters,Bachelors'){
							if(user[0].educationalDetails == true){
								total += marksheet_length + transcript_length + wesform_length;
							}
							
							if(user[0].instructionalField == true){
								total += instruction_letter_length  + wesform_length;
							}

							if(user[0].affiliation == true){
								total += affiliation_letter_length  + wesform_length;
							}

							if(user[0].curriculum == true){
								total += curriculum_length  + wesform_length;
							}
							
							if(user[0].gradToPer == true){
								total += gradTOPer_letter_length  + wesform_length;
							}

							if(user[0].CompetencyLetter == true){
								total += competencyletter_length  + wesform_length;
							}
							
							if(user[0].LetterforNameChange == true){
								total += namechangeletter_length  + wesform_length;
							}
						}else{
							if(user[0].educationalDetails == true){
								total += marksheet_length + transcript_length;
							}
							
							if(user[0].instructionalField == true){
								total += instruction_letter_length;
							}

							if(user[0].affiliation == true){
								total += affiliation_letter_length;
							}

							if(user[0].curriculum == true){
								total += curriculum_length;
							}
							
							if(user[0].gradToPer == true){
								total += gradTOPer_letter_length;
							}

							if(user[0].CompetencyLetter == true){
								total += competencyletter_length;
							}
							
							if(user[0].LetterforNameChange == true){
								total += namechangeletter_length;
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
										app_id : app_id
									}
								}).then(function(institutes){
								
									institutes.forEach(institute=>{
										if(institute.type == 'Educational credential evaluators WES'){
											if(institute.wesno == null || institute.wesno.length <=3 || !(institute.wesno.includes('MU-'))){
												return res.json({
												status : 400,
												message : "Wes number not available"
												})
											}else{
												emailDoc.forEach(file=>{
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
															var email = (institute.emailAsWes) ? institute.emailAsWes : user[0].email;
															var firstName = (institute.nameaswes) ? institute.nameaswes : user[0].name;
															var lastName = (institute.nameaswes) ? institute.nameaswes : user[0].surname;
															fn.fileTransferWes1(user_id,app_id,firstName,lastName,email,fullfile,function(err){
																if(err){
																	return res.json({
																	status : 400,
																	message : err + app_id
																	})
																}
															});
														}
													})
												})
												console.log("Done");
												setTimeout(()=>{
													models.Wes_Records.findAll({
														where :{
														userId : user_id,
														appl_id : app_id
														}
													}).then(function(wesRecords){
														console.log("wesRecords.length == " + wesRecords.length);
														console.log("emailDoc.length == " + emailDoc.length);
														if(wesRecords.length == emailDoc.length){
															console.log("correct");
															instCount ++;
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
															var file_location = constant.FILE_LOCATION+"public/Excel/"+user[0].name+user[0].surname+'_'+institute.wesno+".xlsx";
															fs.writeFileSync(file_location, xls, 'binary');
															var file_name = user[0].name+user[0].surname+'_'+institute.wesno+".xlsx";
															base64.encode(constant.FILE_LOCATION+"public/Excel/"+user[0].name+user[0].surname+'_'+institute.wesno+".xlsx", function(err, base64String) {
																attachments = {                             
																	content: base64String,
																	filename: file_name,
																	type: 'application/xlsx',
																	disposition: 'attachment',
																	contentId: 'mytext'
																}
																studentData.username = user[0].name + ' ' + user[0].surname;
																studentData.userEmail = user[0].email;
																studentData.attachments = attachments;
															})
															emailFlag = true;
														}
													})
												},8000)
											}
										}else if(institute.type == 'HRD'){

												console.log("inside hrd purpose")
												 var gender ;
												 var fileName;
												 var text;
												
												models.userMarkList.findAll({
													where : {
														user_id :user_id,
														app_id : app_id
													}
												}).then(function (usermarklist){
													
											
												 models.Hrd_details.findAll({
													where  :{
														user_id :user_id,
														app_id : app_id

													}
												}).then(function (hrd_Details){
												
														instCount ++;
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
																	user_id : user_id
																}
															}).then(function(updatedDetails){
																models.User.find({
																	where : {
																		id :  user_id
																	}
																}).then(function (user){
																	
																	if(user.gender == 'Female'){
																		gender = 'her'
																	}else if(user.gender == 'Male'){
																		gender = 'him'
																	}
															
																var ref_no = updatedDetails[0].reference_no;
																setTimeout(function(){
																	for(var i = 0; i < hrd_Details.length ; i++){
																	
																		fileName = 'HrdLetter' + hrd_Details[i].degree + '.pdf'
																		var data = hrd_Details[i]
																		var  verification_type = hrd_Details[i].verification_type;
																		if(usermarklist[0].patteren == 'Semester'){
																			text = ' bearing Seat no '+hrd_Details[i].seat_no_sem5+' for '+hrd_Details[i].secondlastsem +' and Seat no '+ hrd_Details[i].seat_no_sem6+ ' for ' + hrd_Details[i].lastsem
																	   }else{
																			text = ' bearing Seat no '+hrd_Details[i].seat_no
																	   }
																		   
																	   var degree = hrd_Details[i].degree
																self_pdf.hrdLetter(user_id,reference_no,data,gender,fileName,verification_type,text,function(err){
																	if(err) {
																		res.json({ 
																			status: 400
																		})
																	}else{
																		
																		models.Emailed_Docs.create({
																			filename : fileName,
																			doc_type : 'HrdLetter',
																			category :'HrdLetter',
																			user_id: user_id,
																			app_id:app_id,
																		}).then((result)=>{
																			logger.debug(" result : "+JSON.stringify(result))
																			// res.json({
																			// 	status : 200
																			// })
																		})
																	
																	}
																})
															}
															},3000)

															})
														})
														})
													

												
												
												})
											})
										}else{
											instCount++;
										}
									})

									setTimeout(function(){
										console.log("institutes.length == " + institutes.length);
										console.log("count == " + instCount);
										if(instCount == institutes.length){
											console.log("inside ");
											application.update({
												tracker : 'signed'
											}).then(function(updatedApplication){
												if(updatedApplication){
													console.log("Process Done");
													request.post(constant.BASE_URL_SENDGRID + 'applicationStatus', {
														json: {
															email : user[0].email,
															name : user[0].name + ' ' + user[0].surname,
															app_id : app_id,
															statusType : 'signed',
															mobile : user[0].mobile,
															mobile_country_code : user[0].mobile_country_code
														}
													}, function (error, response, body) {
														if(emailFlag == true){
															console.log("studentData == " + JSON.stringify(studentData));
															request.post(constant.BASE_URL_SENDGRID + 'statusEmailSendtoStudent', {
																json: {
																	studentData : studentData
																}
																});
														}
														res.json({
															status : 200,
															message : message
														})
													})
												}else{
													res.json({
														status : 400,
														message : 'Application not update'
													})
												}
											})
										}
									},9000);
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
		
					if(siginingType == 'single'){
						var mergefilesString = '';
						var setdefaultMergetime = 30000;
						setTimeout(()=>{
						
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
						},setdefaultMergetime);
					}
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
				message : "Application not found"
			})
		}
	})
	})
})

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

router.get('/checkWESINfo', function (req, res) {
  var app_id = 6567;
  var user_id =20216;
  fn.checkWESInfo(user_id,app_id);
});

router.post('/documentSending_test',middlewares.getUserInfo, function(req,res){
	console.log('/documentSending_test');
	var app_id = req.body.appl_id;
	var user_id;
	var emailedDoc = [];
	var email_arr = [];
	var sentDocuments = [];
	var studentData = {};
	var purposes = [];
	var attachments = [];
	var hrdFlag = false;
	models.Application.find({
	  	where :{
			id : app_id
	  	}
	}).then(function(application){
	  	user_id = application.user_id;
	  	console.log("user_id == " + user_id);
	  	models.User.getApplicationDetailsForSign(app_id).then(function(student){
  			models.Institution_details.findAll({
		  		where : {	
					app_id : app_id,
					user_id : user_id
				}
			}).then(function(institutes){
		  		console.log("institutes == " + JSON.stringify(institutes));
		  		institutes.forEach(institute=>{
					if(institute.type != "Educational credential evaluators WES"){
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
					}
		  		})
		  		setTimeout(()=>{
		  			models.Emailed_Docs.find({
		  				where :{
		  					app_id : app_id,
		  					doc_type : 'merged'
		  				}
		  			}).then(function(mergedData){
		  				var file_location = constant.FILE_LOCATION+"public/signedpdf/"+user_id+'/'+mergedData.filename;
		  				var base64String = fs.readFileSync(file_location).toString("base64");
		  				attachment = {                             
						  	content: base64String,
						  	filename: mergedData.filename,
						  	type: 'application/pdf',
						  	disposition: 'attachment',
						  	contentId: 'mytext'
					  	}
						attachments.push(attachment);
						setTimeout(()=>{
							console.log("Send Email");
							//console.log("emailedDoc====>"+JSON.stringify(emailedDoc));
							if(attachments.length > 0){
						  		request.post(constant.BASE_URL_SENDGRID + 'pdf_send_email1', {
									json: {
						  				userName : student[0].name,
						  				surname : student[0].surname,
						  				userEmail : student[0].email,
						  				certi_name : student[0].applying_for,
						  				mobile_country_code : student[0].mobile_country_code,
							  			mobile : student[0].mobile,
							  			email_add : email_arr,
							  			emailedDoc : emailedDoc,
							  			app_id: app_id,
							  			attachments : (attachments.length) > 0 ? attachments : null
									}
						  		}, function (error, response, body) {
									if (error || body.status == 400) {
						  				return  res.json({
											status : 400,
											message : 'Error in sending Signed Document to email',
						  				})
									}else if(body.status == 200){
						  				//TODO: HERE UPDATING THE STATUS OF APPLICATION FROM SIGNED TO DONE 
						  				application.update({
											tracker: 'done'
						  				}).then(function (result) {
						  					if(result){ 
												res.json({
													status : 200,
													message : "Email Sent"
												})
											}else{
												res.json({
												status : 400,
												message : 'Email not sent!',
												})
							  				}
						  				})
									}
						  		});
							}else{
								return  res.json({
									status : 400,
									message : 'There is no signed documents so that can not process application further',
								})
							}
					  	},5000)
					})
		  		},6000)
		  	})
				
		})
	})
})


module.exports = router;