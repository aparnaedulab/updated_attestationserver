var path = require('path');
var root_path = path.dirname(require.main.filename);
var models = require(root_path + '/models');
const express = require('express');
var router = express.Router();
const tokens = require('../../auth/token_helpers');
const functions = require('../../utils/function');
var moment = require('moment');
var svgCaptcha = require('svg-captcha');
var request = require('request');
var constant = require(root_path + '/config/constant');
var mobileMsgConfig = require(root_path + '/config/mobileMsgConfig');
const auth_helpers = require('../../auth/auth_helpers');
var Sequelize = require("sequelize");
const Op = Sequelize.Op;
const fs = require('fs');

// router.post('/login', function (req, res) {
// 	if (req.body.email && req.body.password) {
// 		var email = req.body.email.toLowerCase();
// 		var password = req.body.password;
// 		var hashPassword = functions.generateHashPassword(password);
// 		models.User.find({
// 			where: {
// 				password: hashPassword,
// 				email: email
// 			}
// 		}).then(function (userdb) {
// 			if (userdb) {
// 				if (userdb.email == email && userdb.password == hashPassword) {
// 					var user = {};

// 					if (userdb.is_otp_verified == true || userdb.is_email_verified == true) {
// 						models.Applied_For_Details.find({
// 							where :{
// 								user_id : userdb.id
// 							}
// 						}).then(function(appliedDetails){
// 							user.user_id = userdb.id;
// 							user.user_name = userdb.name;
// 							user.user_email = userdb.email;
// 							user.user_mobile = userdb.mobile;
// 							user.user_student_category = userdb.student_category;
// 							user.user_address = (userdb.address1) ? userdb.address1 : null;
// 							user.user_phone_number = userdb.mobile;
// 							user.profileCompleteness = userdb.profile_completeness;
// 							user.theme = userdb.theme;
// 							user.country_birth = userdb.country_birth;
// 							user.applying_for = (appliedDetails) ? appliedDetails.applying_for : null ;
// 							user.user_type = userdb.user_type;
// 							user.login_count = userdb.login_count;
// 							user.source = userdb.source;
// 							user.password = userdb.password
// 							// if (userdb.trudesk_key == null) {
// 							// request.post(
// 							// 	constant.trudesk_BASE_URL+'api/v1/public/account/createAPI',
// 							// 	{json:{"aPass":req.body.password,"aFullname":userdb.name,"aEmail": req.body.email},
// 							// 	headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':constant.trudesk_key}},
// 							// 	function (error, response, body) {
// 							// 		if(error){
// 							// 		} 
// 							// 		if(userdb.trudesk_key == null){
// 							// 			var data;
// 							// 			request.get(
// 							// 			constant.trudesk_BASE_URL+'api/v1/users/'+userdb.email,
// 							// 			{headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':constant.trudesk_key}},
// 							// 			function (error, response, body) {
// 							// 				if(error){
// 							// 				} 
// 							// 				data = JSON.parse(body);
// 							// 				request.post(
// 							// 				constant.trudesk_BASE_URL+'api/v1/users/'+data.user._id+"/generateapikey",
// 							// 				{headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':constant.trudesk_key}},
// 							// 				function (error, response, body) {
// 							// 					var data = JSON.parse(body);
// 							// 					if(data){
// 							// 						userdb.update({
// 							// 							trudesk_key : data.token
// 							// 						});
// 							// 					}
// 							// 				});
// 							// 			})
// 							// 		}
// 							// 	});
// 							// }
// 							// models.Application.findAll({
// 							// 	where :{
// 							// 		user_id : userdb.id 
// 							// 	}
// 							// }).then(function(apps){
// 							// 	if(apps.length > 0){
// 							// 		var app_id = apps[0].id;
// 							// 		if(apps.length > 1){
// 							// 			for(var i = 1; i< apps.length; i++){
// 							// 				app_id += "," + apps[i].id
// 							// 			}
// 							// 		}
// 							// 		// models.userMarkList.setAppIds(userdb.id,app_id);
// 							// 		// models.UserMarklist_Upload.setAppIds(userdb.id,app_id);
// 							// 		// models.User_Transcript.setAppIds(userdb.id,app_id);
// 							// 		// models.User_Curriculum.setAppIds(userdb.id,app_id);
// 							// 		// models.InstructionalDetails.setAppIds(userdb.id,app_id);
// 							// 		//next();
// 							// 	}
// 							// })
// 							return res.json({
// 								status: 200,
// 								data: {
// 									message: 'Successfully logged in!',
// 									token: tokens.createAccessToken(user),
// 								}
// 							});
// 						})
// 					} else {
// 						user.user_id = userdb.id;
// 						user.user_name = userdb.name;
// 						user.user_email = userdb.email;
// 						user.user_student_category = userdb.student_category;
// 						user.user_address = (userdb.address1) ? userdb.address1 : null;
// 						user.user_phone_number = userdb.mobile;
// 						user.profileCompleteness = userdb.profile_completeness;
// 						user.theme = userdb.theme;
// 						user.country_birth = userdb.country_birth;
// 						user.mobile_country_code = userdb.mobile_country_code;
// 						user.applying_for = userdb.applying_for;

// 						return res.json({
// 							status: 402,
// 							data: {
// 								errors: 'verify',
// 								user: user
// 							}
// 						});
// 					}

// 				} else {

// 					return res.json({
// 						status: 401,
// 						data: {
// 							errors: 'Login/password combination is not correct'
// 						}
// 					});
// 				}
// 			} else {
// 					return res.json({
// 						status: 402,
// 						data: {
// 							errors: 'No User Found in Database'
// 						}
// 					});
// 			}
// 		});

// 	} else {
// 		return res.json({
// 			status: 401,
// 			data: {
// 				errors: 'Email and password both are required !'
// 			}
// 		});
// 	}
// });


router.post('/login', function (req, res) {
	console.log('/logim')
	if (req.body.email && req.body.password) {
		var email = req.body.email.toLowerCase();
		var password = req.body.password;
		var hashPassword = functions.generateHashPassword(password);
		models.User.find({
			where: {
				email: email
			}
		}).then(function (userdb) {
			if(userdb){
				if (userdb.is_otp_verified == true || userdb.is_otp_verified == 1 || userdb.is_email_verified ){
					if (userdb) {
						models.User.find({
							where: {
								password: hashPassword,
								email: email
							}
						}).then(function (password) {
							if(password){
								if (userdb.email == email && userdb.password == hashPassword) {
									var user = {};
				
									if (userdb.is_otp_verified == true || userdb.is_email_verified == true) {
										models.Applied_For_Details.find({
											where :{
												user_id : userdb.id,
												source : 'guattestation'
											}
										}).then(function(appliedDetails){
											user.user_id = userdb.id;
											user.user_name = userdb.name;
											user.user_email = userdb.email;
											user.user_mobile = userdb.mobile;
											user.user_student_category = userdb.student_category;
											user.user_address = (userdb.address1) ? userdb.address1 : null;
											user.user_phone_number = userdb.mobile;
											user.profileCompleteness = userdb.profile_completeness;
											user.theme = userdb.theme;
											user.country_birth = userdb.country_birth;
											user.applying_for = (appliedDetails) ? appliedDetails.applying_for : null ;
											user.user_type = userdb.user_type;
											user.login_count = userdb.login_count;
											user.source = userdb.source;
											user.password = userdb.password
											// if (userdb.trudesk_key == null) {
											// request.post(
											// 	constant.trudesk_BASE_URL+'api/v1/public/account/createAPI',
											// 	{json:{"aPass":req.body.password,"aFullname":userdb.name,"aEmail": req.body.email},
											// 	headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':constant.trudesk_key}},
											// 	function (error, response, body) {
											// 		if(error){
											// 		} 
											// 		if(userdb.trudesk_key == null){
											// 			var data;
											// 			request.get(
											// 			constant.trudesk_BASE_URL+'api/v1/users/'+userdb.email,
											// 			{headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':constant.trudesk_key}},
											// 			function (error, response, body) {
											// 				if(error){
											// 				} 
											// 				data = JSON.parse(body);
											// 				request.post(
											// 				constant.trudesk_BASE_URL+'api/v1/users/'+data.user._id+"/generateapikey",
											// 				{headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':constant.trudesk_key}},
											// 				function (error, response, body) {
											// 					var data = JSON.parse(body);
											// 					if(data){
											// 						userdb.update({
											// 							trudesk_key : data.token
											// 						});
											// 					}
											// 				});
											// 			})
											// 		}
											// 	});
											// }
											// models.Application.findAll({
											// 	where :{
											// 		user_id : userdb.id 
											// 	}
											// }).then(function(apps){
											// 	if(apps.length > 0){
											// 		var app_id = apps[0].id;
											// 		if(apps.length > 1){
											// 			for(var i = 1; i< apps.length; i++){
											// 				app_id += "," + apps[i].id
											// 			}
											// 		}
											// 		// models.userMarkList.setAppIds(userdb.id,app_id);
											// 		// models.UserMarklist_Upload.setAppIds(userdb.id,app_id);
											// 		// models.User_Transcript.setAppIds(userdb.id,app_id);
											// 		// models.User_Curriculum.setAppIds(userdb.id,app_id);
											// 		// models.InstructionalDetails.setAppIds(userdb.id,app_id);
											// 		//next();
											// 	}
											// })
											console.log('tokens.user_type' + tokens.user_type)
											return res.json({
												status: 200,
												data: {
													message: 'Successfully logged in!',
													token: tokens.createAccessToken(user),
													type  : userdb.user_type

												}
											});
										})
									} else {
										user.user_id = userdb.id;
										user.user_name = userdb.name;
										user.user_email = userdb.email;
										user.user_student_category = userdb.student_category;
										user.user_address = (userdb.address1) ? userdb.address1 : null;
										user.user_phone_number = userdb.mobile;
										user.profileCompleteness = userdb.profile_completeness;
										user.theme = userdb.theme;
										user.country_birth = userdb.country_birth;
										user.mobile_country_code = userdb.mobile_country_code;
										user.applying_for = userdb.applying_for;
				
										return res.json({
											status: 402,
											data: {
												errors: 'verify',
												user: user
											}
										});
									}
				
								} else {
									return res.json({
										status: 401,
										data: {
											errors: 'Login/password combination is not correct'
										}
									});
								}
							}else{
								return res.json({
									status: 401,
									data: {
										errors: 'Login/password combination is not correct'
									}
								});
							}
						})
					
					} else {
							return res.json({
								status: 402,
								data: {
									errors: 'No User Found in Database'
								}
							});
					}
				}else{
								return res.json({
									status: 401,
									data: {
										errors: 'Kindly verify your Email ID'
									}
								});
				}
			}else{
				return res.json({
					status: 402,
					data: {
						errors: 'No User Found in Database'
					}
				});
			}	
		});
	} else {
		return res.json({
			status: 401,
			data: {
				errors: 'Email and password both are required !'
			}
		});
	}
});

router.post('/getclickDetails',function(req, res){

    var location = req.body.location.city+" "+req.body.location.regionName+" "+req.body.location.country;
    var file = constant.FILE_LOCATION + "public/signedpdf/"+req.body.fileName;
    models.Emailed_Docs.find( {
        where: {
            id : req.body.docID,
            app_id : req.body.app_id
        }
    }).then(function (result) {
        if(result){
			
            models.Iptracker.find({
                where : {
					emaildoc_id : req.body.docID,
					app_id : req.body.app_id,
					email : req.body.email,
                }
            }).then((exists)=>{
				 if(exists){
					
					var ipArray = exists.ip_address.split(/[,]/);
					var finalArray = [];
					ipArray.forEach(element => {
						finalArray.push(element);
					});
					if (finalArray.indexOf(req.body.location.query) === -1) {
						finalArray.push(req.body.location.query);
					}

					var addArray = exists.opened_loc.split(/[/]/);
					
					var finaladdArray = [];
					addArray.forEach(element => {
						finaladdArray.push(element);
					});
					if (finaladdArray.indexOf(location) === -1) {
						finaladdArray.push(location);
					}
					
                    models.Iptracker.update({
                            opened_loc : finaladdArray.join('/'),
                            ip_address : finalArray.join(','),
                        }, {
                            where: {
                                emaildoc_id : req.body.docID,
								app_id : req.body.app_id,
								email : req.body.email,
                            }
                    }).then((data)=>{
						
                        res.json({
                            status : 200,
                            password: result.password
                        })
                    })
                }else{
					
					if(req.body.email != null){
						models.Iptracker.create({
							email : req.body.email,
							opened_loc : location,
							ip_address : req.body.location.query,
							emaildoc_id : req.body.docID,
							app_id : req.body.app_id
						}).then((data)=>{
						
							res.json({
								status : 200,
								password: result.password,
								filePath : file
							})
						})
					}
                }
            })
           
        }else{
			
            res.json({
                status : 400
            })
        }
    })   
})

router.post('/checkEmail', function (req, res) {
	var reqData = req.body.data;
	models.User.findOne({
		where: {
			email: reqData
		}
	}).then(function (user) {
		if (user) {
			res.send({
				status: 400,
				message: 'Email already exists.'

			});
		}else{
			res.send({
				status: 200
			});
		}
	});
});


router.get('/getCourses',function(req, res){
models.Program_List.findAll({
    order:[
       ['course_name','ASC']
    ],
    attributes:[    
        [Sequelize.fn('DISTINCT',Sequelize.col('course_name')),'name'],
       'duration',
	   'id',
	   'course_short_form',
	   'student_status',
	   'degree_type',
	   'new_course_faculty'
    ]
}).then(courses=>{
    res.json({
        status : 200,
        data : courses
    })
})
})
router.get('/getColleges',function(req, res){
	models.College.findAll({
		order:[
		   ['name','ASC']
		],
		attributes:[    
			[Sequelize.fn('DISTINCT',Sequelize.col('name')),'name'],
		]
	}).then(courses=>{
		res.json({
			status : 200,
			data : courses
		})
	})
	})

router.post('/register', function (req, res) {
	var reqData = req.body.data;

	var hashPassword = functions.generateHashPassword(reqData.userPassword);
	models.User.find({
		where: {
			email: reqData.userEmail.toLowerCase()
		}
	}).then(function (user) {
		if (user) {
			res.send({
				status: 400,
				message: 'Email already exists.'

			});
		} else {
			var emailVerificationToken = require('shortid').generate();
			var otp = functions.generateRandomString(6, 'numeric');
			models.User.create({
				name: reqData.userName,
				surname: reqData.Surname,
				email: reqData.userEmail.toLowerCase(),
				password: hashPassword,
				mobile_country_code: reqData.userCountryCode,
				mobile: reqData.userContactNo,
				gender: (reqData.Gender) ? reqData.Gender : null,
				otp: otp, //otp,
				is_otp_verified: 0,
				email_verification_token: emailVerificationToken,
				is_email_verified: 0,
				user_type: "student",
				dob: null,//reqData.userDob,
				applying_for: reqData.user_option,
				created_at: moment(),
				updated_at: moment(),
				what_mobile_country_code: reqData.whatsapp_phoneCode,
				what_mobile: reqData.whatsapp_No,
				current_location: reqData.current_location,
				postal_code: reqData.postal_code ? reqData.postal_code : '',
				fullname : reqData.fullName,
				marksheetName : reqData.fullName,
				aadharNumber : reqData.aadhar,
				enrollmentNo : reqData.enrollmentNo
				// source : 'attestation'
			}).then(function (user) {
				functions.createenrollment(reqData.enrollmentNo,user.id);
				var desc = user.name+" "+user.surname+" has registered with email id "+user.email;
                var activity = "Registration";
                functions.activitylog(user.id, activity, desc, '');
				var userId = user.id;
				var attachment = {};
				var file_location = constant.FILE_LOCATION+"public/images/GU-AttestationManual.pdf";
			  	var base64String = fs.readFileSync(file_location).toString("base64");
				attachment = {                             
					content : base64String,
					filename: "UoM-AttestationManual.pdf",
					type: 'application/pdf',
					disposition : 'attachment',
					contentId : 'mytext'
				}

				request.post(constant.BASE_URL_SENDGRID + 'sendgrid_guAttestation', {
					json: {
						mobile: user.mobile,
						mobile_country_code: user.mobile_country_code,
						userName: user.name,
						email: user.email,
						email_verification_token: user.email_verification_token,
						password: reqData.userPassword,
						otp: user.otp,
						to: user.email,
						toName: user.name,
						attachment : attachment,
						source : 'gu'
					}
				}, function (error, response, body) {
					//
					if (error) {

					}
					// request.post(
					// 	constant.trudesk_BASE_URL+'api/v1/public/account/createAPI',
					// 	{json:{"aPass":reqData.userPassword,"aFullname":user.name,"aEmail": user.email},
					// 	headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':constant.trudesk_key}},
					// 	function (error, response, body) {

					// 		if(error){

					// 		}
					// 		if(body.success == true){
					// 			request.post(
					// 			constant.trudesk_BASE_URL+'api/v1/users/'+body.userData.user._id+"/generateapikey",
					// 			{headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':constant.trudesk_key}},
					// 			function (error, response, body) {

					// 				var data = JSON.parse(body);
					// 				if(data){
					// 					user.update({
					// 						trudesk_key : data.token
					// 					});
					// 				}
					// 			})
					// 		}

					// 	res.send({
					// 		status: 200,
					// 		data: userId
					// 	});
					// });
					res.send({
						status: 200,
						data: userId
					});
				});
			});
		}
	});

});

router.post('/verify-otp-reg', function (req, res) {

	var body_data = req.body.data;
	var errors;
	if (body_data.type == "register") {
		var email = body_data.email;
		models.User.find({
			where: {
				email: email,
			}
		}).then(function (user) {
			if (user.otp == body_data.otp) {
				user.update({
					otp: null,
					is_otp_verified: 1,
					is_email_verified: 1
				}).then(function (updated_user) {
					res.json({
						status: 200,
						message: mobileMsgConfig.MSG_USER_OTP_VERIFIED_SUCCESS,
						data: user
					});
				});
			} else {
				errors = [];
				errors.push({
					type: 'invalid_otp',
					msg: mobileMsgConfig.MSG_INVALID_OTP
				});
				res.json({
					status: 400,
					message: mobileMsgConfig.MSG_INVALID_OTP,
					data: errors
				});
			}
		});
	} else {
		models.User.find({
			where: {
				id: body_data.user_id,
			}
		}).then(function (user) {
			if (user.otp == body_data.otp) {
				user.update({
					otp: null,
					is_otp_verified: 1,
					is_email_verified: 1
				}).then(function (updated_user) {
					res.json({
						status: 200,
						message: mobileMsgConfig.MSG_USER_OTP_VERIFIED_SUCCESS,
						data: user
					});
				});
			} else {
				errors = [];
				errors.push({
					type: 'invalid_otp',
					msg: mobileMsgConfig.MSG_INVALID_OTP
				});
				res.json({
					status: 400,
					message: mobileMsgConfig.MSG_INVALID_OTP,
					data: errors
				});
			}
		});
	}
});

router.post('/resend-otp', function (req, res) {
	console.log("/resendotp")
	var body_data = req.body.data;
	var errors;
	models.User.find({
		where: {
			id: body_data.user_id,
			user_type: 'student'
		}
	}).then(function (user) {
		if (user) {
			var user_exists = user;
			if(body_data.mobile != null && body_data.phone_code != null){
					user_exists.update({
					mobile: req.body.data.mobile,
					mobile_country_code: req.body.data.phone_code,
					otp: functions.generateRandomString(6, 'numeric'),
					updated_at: moment()
					}).then(function (updated_user) {
					var otp = updated_user.otp;
					if (otp) {
						request.post(constant.BASE_URL_SENDGRID + 'resend-otp', {
							json: {
								mobile: updated_user.mobile,
								mobile_country_code: updated_user.mobile_country_code,
								otp: otp,
								source : 'gu'
		
							}
						}, function (error, response, body) {
							if (error) {}
							res.send({
								status: 200,
							});
						});
			
					// var smsOptions = {
					// 	contact_number: updated_user.mobile_country_code + updated_user.mobile,
					// 	message: otp + ' is your one time password for verifying your mobile number for Gujarat University.'
					// };
					// functions.sendSMS(smsOptions, function (err) {
					// 	if (err && err.status == 400) {
					// 		errors = [];
					// 		errors.push({
					// 			type: 'error_in_sending_otp',
					// 			msg: 'Error in sending OTP. Please the mobile number is valid.'
					// 		});
					// 		res.json({
					// 			status: 400,
					// 			message: 'Error in sending OTP. Please the mobile number is valid.',
					// 			data: errors
					// 		});
					// 	} else {
					// 		res.json({
					// 			status: 200,
					// 			message: 'OTP sent successfully'
					// 		});
					// 	}
					// });
					} else {
						errors = [];
						errors.push({
							type: 'invalid_parameters',
							msg: "Error in updating otp, Please try after some time !"
						});
						res.json({
							status: 400,
							message: "Error in updating otp, Please try after some time !",
							data: errors
						});
					}
				});
			}
			if(body_data.mobile === null && body_data.phone_code === null){
				user_exists.update({
					otp: functions.generateRandomString(6, 'numeric'),
					updated_at: moment()
					}).then(function (updated_user) {
					var otp = updated_user.otp;
					if (otp) {
						request.post(constant.BASE_URL_SENDGRID + 'resend-otp', {
							json: {
								mobile: updated_user.mobile,
								mobile_country_code: updated_user.mobile_country_code,
								otp: otp,
								source : 'gu'
							}
						}, function (error, response, body) {
							if (error) {}
							res.send({
								status: 200,
							});
						});
					} else {
						errors = [];
						errors.push({
							type: 'invalid_parameters',
							msg: "Error in updating otp, Please try after some time !"
						});
						res.json({
							status: 400,
							message: "Error in updating otp, Please try after some time !",
							data: errors
						});
					}
				});
			}

		} else {
			errors = [];
			errors.push({
				type: 'invalid_access_token',
				msg: "Please log-in first !"
			});
			res.json({
				status: 401,
				message: "Please log-in first !",
				data: errors
			});
		}
	});
});

router.get('/captcha', function (req, res) {
	var captcha = svgCaptcha.create();
	var data = {
		captchadata: captcha.data,
		captchaText: captcha.text
	}
	res.send({
		status: 200,
		data: data,
		type: 'svg'
	});

});

router.post('/forgot-password', function (req, res) {
	var email = req.body.data;
	var contactPerson = 'admin';
	models.User.find({
		where: {
			email: email
		}
	}).then(function (user) {
		if (user) {
			var attachment = {};
			var attachment = {};
			var file_location = constant.FILE_LOCATION+"public/images/GU-AttestationManual.pdf";
			  var base64String = fs.readFileSync(file_location).toString("base64");
			attachment = {                             
				content: base64String,
				filename: "GU-AttestationManual.pdf",
				type: 'application/pdf',
				disposition: 'attachment',
				contentId: 'mytext'
			}
			request.post(constant.BASE_URL_SENDGRID + 'forgot-password', {
				json: {
					mobile: user.mobile,
					mobile_country_code: user.mobile_country_code,
					userName: user.name,
					surName: user.surname,
					email: user.email,
					to: user.email,
					toName: user.name,
					user_type: user.user_type,
					attachment : attachment,
					source : 'gu'

				}
			}, function (error, response, body) {
				if (error) {}
				res.send({
					status: 200,
				});
			});

		} else {
			res.send({
				status: 400,
				message: 'Email Does not exist',
			});
		}
	});

});

router.post('/resetpassword', function (req, res) {
	var body_data = req.body.data;
	var password = body_data.userPassword;
	var confirm_password = body_data.userConfirmPassword;
	if (password == confirm_password) {
		var hashPassword = functions.generateHashPassword(password);
		models.User.find({
			where: {
				email: body_data.email
			}
		}).then(function (User_data) {
			User_data.update({
				password: hashPassword
			});

			res.json({
				status: 200,
				data: body_data,
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

router.get('/verify-email', function (req, res) {
	console.log("verify-emailverify-email");
	models.User.find({
		where: {
			email_verification_token: req.query.token
		}
	}).then(function (user) {
		if (user) {
			user.update({
				email_verification_token: null,
				is_email_verified: 1,
				is_otp_verified: 1
			}).then(function (updated_user) {
				if(updated_user){
					res.redirect("https://guattestation.studentscenter.in/app/#/auth/login?verify=true");
					this.router.navigate(['auth/login'],{queryParams:{verify : 'true'}});
				}else{

				}
				// var studentData = {
				// 	userName: user.name,
				// 	email: user.email,
				// 	phone: '+' + user.mobile_country_code + ' ' + user.mobile
				// }
				// var stuEmailOptions = {
				// 	to: user.email,
				// 	toName: user.name,
				// 	subject: 'Welcome Email',
				// 	template: 'emailTemplates/welcome',
				// 	data: studentData
				// }
				// // emailSending(stuEmailOptions);
				// var view_data = {
				// 	baseUrl: constant.BASE_URL,
				// 	userName: user.name,
				// 	email: user.email,
				// 	phone: '+' + user.mobile_country_code + ' ' + user.mobile,
				// 	link: 'http://guattestation.studentscenter.in/app/#/auth/login',
				// 	//personalURL:constant.BASE_URL+'?pageRedirect=STU'+user.id+'/profile/personal',
				// 	generalURL: constant.BASE_URL + '?pageRedirect=' + encodeURIComponent('message-board#general-info'),
				// 	message: 'Your email has been verified successfully. You can now use your credentials to login into the system.'
				// }
				// res.render(constant.VIEW_VERIFY_EMAIL, view_data);
			});
		} //else {
		// 	res.render(constant.VIEW_CUSTOM_ERROR, {
		// 		baseUrl: constant.BASE_URL,error_message:'The requested Email Verification link has been expired. Kindly request again using your registered email address.'
		// 	});
		// }
	});
});

// router.delete('/logout', function (req, res) {
// 	res.send("user logged out sucessfully");
// });

router.delete('/logout', function (req, res) {
	return res.json({
		data: {
			message: 'Successfully logged out!'
		}
	});
});

router.get('/downloadStructureFile', function (req, res) {
	console.log('/index/downloadStructureFile');
	 var file_name= req.query.file_name;
	 var app_id = req.query.app_id;
	 models.Application.find({
		where:{
		  id:app_id,
		  [Op.or]:[{
			source_from:'guattestation',
		 },
		 {
			source_from:'gumoi',
		 }]
		}
	  }).then(data =>{
		var user_id=data.user_id;
	
	 	var file = constant.FILE_LOCATION + "public/signedpdf/"+user_id+"/"+file_name;
	 	const downloadData = file;
   		res.download(file);
	  });
})

router.post('/refresh-token', function (req, res) {
	console.log("/refresh-token")
	var token = req.body.token;
	var email = req.body.getOwnerStrategyName;
	// token issued via email strategy
	if (token === 'eb4e15840117437cbfd7343f257c4aae') {
		return res.json({
			token_type: 'Bearer',
			access_token: tokens.createAccessToken(user[0]),
			expires_in: cfg.accessTokenExpiresIn,
			refresh_token: 'eb4e15840117437cbfd7343f257c4aae',
		});
	}

	// token issued by oauth2 strategy
	var parts = token.split('.');
	if (parts.length !== 3) {
		return res.status(401).json({
			error: 'invalid_token',
			error_description: 'Invalid refresh token'
		});
	}
	var payload = JSON.parse(auth_helpers.urlBase64Decode(parts[1]));
	var exp = payload.exp;
	var userId = payload.sub;
	var now = moment().unix();
	if (now < exp) {
		return res.status(401).json({
			error: 'unauthorized',
			error_description: 'Refresh Token expired.'
		})
	} else {
		//
		models.User.find({
			where: {
				id: userId
			}
		}).then(function (u) {
			// if (u.user_type == 'sub-admin') {
			// 	var data = {
			// 		user_id: u.id,
			// 		user_email: u.email,
			// 		user_name: u.name,
			// 		user_mobile: u.mobile,
			// 		user_student_category: u.student_category,
			// 		profileCompleteness: u.profile_completeness,
			// 		country_birth: u.country_birth,
			// 		theme: u.theme,
			// 		user_type: 'sub_admin'
			// 	}
			// } else {
				var data = {
					user_id: u.id,
					user_email: u.email,
					user_name: u.name,
					user_mobile: u.mobile,
					user_student_category: u.student_category,
					profileCompleteness: u.profile_completeness,
					country_birth: u.country_birth,
					theme: u.theme,
					user_type: u.user_type
				}
			//}
			return res.json({
				status: 200,
				data: {
					message: 'Successfully logged in!',
					token: tokens.createAccessToken(data),
				}
			});
		})
	}
});

router.get('/getUserDataByEmail',(req,res)=>{
	models.Application.getUserApplicationData(req.query.email).then(function(details){
		res.json({
			status : 200,
			data : details
		})
	})
})


module.exports = router;