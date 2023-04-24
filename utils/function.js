
var crypto = require('crypto');
var randomstring = require('randomstring');
var constants = require('../config/constant');
var moment = require('moment');
var Moment = require('moment-timezone');
var Sequelize = require("sequelize");
const Op = Sequelize.Op;
var models  = require('../models');
const { duration } = require('moment');
algorithm = 'aes-256-ctr',
password = 'je93KhWE08lH9S7SN83sneI87';
var converter = require('number-to-words');
const { LOADIPHLPAPI } = require('dns');
module.exports = {

	createoutward : async(outward,type,app_id ,user_id)=>{
		return await models.User_Course_Enrollment_Detail_Attestation.create({user_id :  user_id , type  : type , outward : outward , application_id : app_id});
	},
	generateHashPassword: function(password) {
		var hashPassword = crypto
	      .createHash("md5")
	      .update(password)
	      .digest('hex');

	    return hashPassword;
	},

	generateRandomString: function(length, charset) {
		return randomstring.generate({
			length: length,
			charset: charset
		});
	},



	sendEmail: function(emailOptions, callback) {
		var template = process.cwd() + '/views/' + emailOptions.template + '.jade';

		require('fs').readFile(template, 'utf8', function (err, file){

			if(err) return callback (err);

			var fn = require('jade').compile(file);

			var html = fn(emailOptions.data);


			var mailOptions = {
				from: constants.SEND_EMAIL_FROM,
				fromname: constants.SEND_EMAIL_FROM_NAME,
				to: emailOptions.to,
				toname: (emailOptions.toName != null) ? emailOptions.toName : '',
				subject: emailOptions.subject,
				html: html
			};

			var sendgrid  = require('sendgrid')(constants.SENDGRID_API_KEY);

			sendgrid.send(mailOptions, function(err, json) {

				if (err) {

					callback(err);
				}else {

					callback();
				}
			});
		});
	},


	getuserdetail: async (user_id) => {
		return await models.User.findOne({ where: { id: user_id} });
	},

	sendSMS: function(smsOptions, callback) {
		var client = require('twilio')(constants.TWILIO_SSID, constants.TWILIO_AUTH_TOKEN);
		if(typeof smsOptions.contact_number == 'number') smsOptions.contact_number = smsOptions.contact_number.toString();
		var contact_number = "+"+smsOptions.contact_number.replace(/[^\d]/g, '');


		client.messages.create({
			to: contact_number,
			from: constants.TWILIO_FROM_NUMBER,
			body: smsOptions.message
		}, function(err, message) {
			if (err) {

				callback(err);
			}else {

				callback();
			}
		});
	},
	get_current_datetime: function(format) {
		if(format) {
			return Moment(new Date()).tz(constants.SYSTEM_TIMEZONE).format(format);
		}else {
			return Moment(new Date()).tz(constants.SYSTEM_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
		}
	},

	socketnotification: function(action,notification_data,userId,type) {
			models.Notifications.create({
				action: action,
				message: notification_data,
				read:'false',
				flag:type,
				user_id:userId,
				created_at: moment(),
				delete_notification: 'false'
			}).then(function(activity) {
				if(activity) {
					return activity.created_at;
				}
			});
	},

	activitylog: function(user_id,activity,data,application_id) {

		models  = require('../models');
		models.Activitytracker.create({
			user_id: user_id,
			activity: activity,
			data: data,
			application_id: application_id,
			created_at: moment(),
			source  : 'guattestation'
		}).then(function(activitytracker) {
			if(activitytracker) {
				
			}
		});
	},

	getAttestedFor: async (user_id) => {
		return await models.Applied_For_Details.findOne({ where: { user_id: user_id , app_id : {
			[Op.eq] : null
		},source : 'guattestation'} });
	},
	getApplied: async (user_id,app_id) => {
		return await models.Applied_For_Details.findOne({ where: { user_id: user_id , app_id : app_id,source : 'guattestation'}});
	},

	getparticularApp : async(user_id) => {
		return await models.Application.findOne({ where: { user_id: user_id , source_from  : 'guattestation'}});
	},
	getCountofMarksheet: async (user_id) => {
		return await models.UserMarklist_Upload.findAll({ where: { user_id: user_id ,app_id : {
			[Op.eq] : null
		} ,source : 'guattestation'} });
	},
	getPurpose: async (user_id) => {
		return await models.Institution_details.findAll({ where: { user_id: user_id ,app_id : {
			[Op.eq] : null
		} ,source : 'guattestation' } });
	},

	getPurposewithcopies: async (user_id) => {
		return await models.Institution_details.findAll({ where: { user_id: user_id , deliveryType : 'physcial', app_id : {
			[Op.eq] : null
		} ,source : 'guattestation'} });
	},
	getCountofTranscript: async (user_id) => {
		return await models.User_Transcript.findAll({ where: { user_id: user_id ,app_id : {
			[Op.eq] : null
		} ,type : {
			[Op.like] : '%transcript%'
		} ,source : 'guattestation'} });
	},

	getCountofDegree: async (user_id) => {
		return await models.User_Transcript.findAll({ where: { user_id: user_id ,app_id : {
			[Op.eq] : null
		} ,type : {
			[Op.like] : '%degree%'
		},source : 'guattestation' } });
	},
	getCountofmarklist: async (user_id) => {
		return await models.userMarkList.findAll({ where: { user_id: user_id ,app_id : {
			[Op.eq] : null
		},source : 'guattestation'} });
	},

	getedudetailpdc: async(user_id,source)=>{
		// return await models..findAll({ where: { id: user_id,  } });
		return await models.edu_details.findAll({ where: { user_id: user_id, app_id : {
			[Op.ne] : null
		},source:source } });
	},
	getdocdetailpdc: async(user_id,application_id,source)=>{
		return await models.Applicant_Marksheet.findAll({ where: { user_id: user_id, app_id : application_id,[Op.or]:[{
			source:'guattestation',
		 },
		 {
			source:'gumoi',
		 }] } });
	},
	getdocdetailtrantranscript: async(user_id,application_id)=>{
		return await models.User_Transcript.findAll({ where: { user_id: user_id, app_id : application_id ,source : 'guattestation'} });
	},
	getdocdetailmig: async(user_id,source)=>{
		return await models.Applicant_Marksheet.findAll({ where: { user_id: user_id,source:source } });
	},
	getapplication: async(userId,status,tracker, source)=>{


		return await models.Application.findAll({ where: { user_id: userId,source_from:source,status:status,tracker:tracker } });
	},
	userMarkList: async(userId)=>{


		return await models.userMarkList.findAll({ where: { user_id: userId ,source : 'guattestation'} });
	},


	getapplicationmig: async(userId, source)=>{

		return await models.Application.findAll({ where: { user_id: userId,source_from:source } });
	},
	getEmailedDocs_insert: async()=>{
		return await models.Emailed_Docs.findAll({ where: { app_id : {
			[Op.eq] : null
		} } });
	},
	getEmailedDocs: async(app_id)=>{
		return await models.Emailed_Docs.findAll({ where: { app_id : app_id }});
	},
	getverification: async(user_id)=>{
		return await models.DocumentDetails.findAll({ where: { user_id: user_id, app_id : {
			[Op.ne] : null
		}} });
	},
	usermarlistdata: async(user_id,app_id)=>{
		return await models.userMarkList.findAll({ where: { user_id: user_id, app_id :app_id ,source : 'guattestation'} });
	},
	userTranscriptdata :async (user_id)=>{
		return await models.User_Transcript.findAll({ where: { user_id: user_id,source : 'guattestation'  } });

	},
	usermarlistupload: async(user_id,app_id)=>{
		return await models.UserMarklist_Upload.findAll({ where: { user_id: user_id, app_id :app_id ,source : 'guattestation' } });
	},
	getorderDetails: async(user_id,app_id,source)=>{
		return await models.Orders.findAll({ where: { user_id: user_id, application_id :app_id , [Op.or]:[{
			source:'guattestation',
		 },
		 {
			source:'gumoi',
		 }] } });
	},
	getedumigration: async(user_id)=>{
		return await models.Applicant_Educational_Details.findAll({ where: { user_id: user_id } ,raw:true});
	},
	createenrollment: async(enrollment_number,userId) =>{
		var applied_for_degree='';
		var applying_for;
		var stream;
		enrollment_number.forEach(async function(enroll) {
			applied_for_degree = enroll.course + applied_for_degree;
		})
		if(applied_for_degree.includes('Master') && applied_for_degree.includes('Bachelor') && applied_for_degree.includes('Phd')){
			applying_for = 'Phd'
		}
		else if((applied_for_degree.includes('Master') ) && (applied_for_degree.includes('Bachelor'))){
			applying_for = 'Masters,Bachelors'
		}
		else if(applied_for_degree.includes('Master')){
			applying_for = 'Masters'
		}
		else if(applied_for_degree.includes('Bachelor') ){
			applying_for = 'Bachelors'
		}
		else if(applied_for_degree.includes('Phd') ){
			applying_for = 'Phd,Masters,Bachelors'
		}
		value = await models.Applied_For_Details.create({ applying_for :  applying_for , user_id : userId,source : 'guattestation' });
		enrollment_number.forEach(async function(enroll) {
				course_id  = await models.Program_List.findOne({where : {course_name  : enroll.course }})
				usermarklist_insert = await models.userMarkList.create({type : course_id.degree_type ,faculty : enroll.course, user_id : userId , college_stream_type :  0 ,collegeId  : 1,enrollment_number  : enroll.enrollmentNo ? enroll.enrollmentNo : null ,source : 'guattestation' });
			})

		
	},
	college_form: async(id)=>{
		return await models.College.findOne({ where: { id  : id  } });
	},
	usermarklist_form: async(userId,app_id)=>{

		return await models.userMarkList.findAll({ where: { user_id: userId , app_id :  app_id ,source : 'guattestation' } });
	},
	application_for: async(userId,app_id)=>{
		return await models.Applied_For_Details.findAll({ where: { user_id: userId , app_id :  app_id ,source : 'guattestation'} });
	},

	usermarlistupload: async(user_id,app_id)=>{
		return await models.UserMarklist_Upload.findAll({ where: { user_id: user_id, app_id :app_id ,source : 'guattestation' } });
	},
	

	createFetchdata: async (enrollment_number,searchdata,userId ,source) =>{
		console.log('searchdata.pattern');
		var applied_for_degree='';
		var insertData ;
		var applying_for;
		var stream;
		let patteren;
		let course_id;
		var usermarklist_insert;
		enrollment_number.forEach(async function(enroll) {
			applied_for_degree = enroll.course + applied_for_degree;
		})
		console.log('applied_for_degree' + JSON.stringify(applied_for_degree));
		if(applied_for_degree.includes('Master') && applied_for_degree.includes('Bachelor') && applied_for_degree.includes('Phd')){
			applying_for = 'Phd'
		}
		else if((applied_for_degree.includes('Master') ) && (applied_for_degree.includes('Bachelor'))){
			applying_for = 'Masters,Bachelors'
		}
		else if(applied_for_degree.includes('Master')){
			applying_for = 'Masters'
		}
		else if(applied_for_degree.includes('Bachelor') ){
			applying_for = 'Bachelors'
		}
		else if(applied_for_degree.includes('Phd') ){
			applying_for = 'Phd,Masters,Bachelors'
		}
		value = await models.Applied_For_Details.create({ applying_for :  applying_for , user_id : userId ,source : 'guattestation'});
           
		
		enrollment_number.forEach(async function(enroll) {
				course_id  = await models.Program_List.findOne({where : {course_name  : enroll.course }})
				// collegeId = await models.College.findOne({where :{name  :enroll.collegeId }})

				if(source == 'pdc' ||  source == 'guconvocation'){
					if(searchdata.exam_patteren == 'Semester'){
						patteren  = 'Semester'
				}else{
						patteren = 'Annual'
				}
				}
				if(source == 'gumigration'){
					if(searchdata.pattern == 'semester'){
						patteren  = 'Semester'
				}else{
						patteren = 'Annual'
				}

				}
				
				course = enroll.course;
				coursesplit = course.split();
				usermarklist_insert = await models.userMarkList.create({ type : course_id.degree_type ,faculty : enroll.course, user_id : userId , college_stream_type : 0 ,collegeId : 1 ,patteren : patteren , course_faculty : course_id.faculty ,enrollment_number : enroll.enroll ,source : 'guattestation' });
				
		})
			setTimeout(()=>{
				if(source == 'pdc' || source == 'guconvocation'){
					models.Application.getMarksheets_convo_pdc(userId).then(function(marksheets){
						marksheets.forEach(function (getdata){
							if(searchdata.exam_patteren == 'Semester'){
								let duration = course_id.duration;
								marksheetname =  getdata.degree_type + '_' + getdata.plfaculty +  '_' + 'Semester ' + duration * 2 ;
								insertData =  models.UserMarklist_Upload.create({name : marksheetname , file_name : getdata.file_name , education_type  : getdata.degree_type , lock_transcript : 0 ,upload_step : 'default' , user_id : userId , user_marklist_id  : getdata.id ,source : 'guattestation' });
							}else{
											let duration = course_id.duration;
											var year = converter.toWordsOrdinal(duration);
											var inWords = year.charAt(0).toUpperCase() + year.slice(1);
											marksheetname =  getdata.degree_type + '_' + getdata.plfaculty +  '_' + inWords +  ' Year';
											insertData =  models.UserMarklist_Upload.create({name : marksheetname , file_name : getdata.file_name , education_type  : getdata.degree_type , lock_transcript : 0 ,upload_step : 'default' , user_id : userId , user_marklist_id  : getdata.id ,source : 'guattestation' });
								}
						})
					})
				}
				if(source == 'gumigration'){
					models.Application.getMarksheets_migartion(userId).then(function(marksheets){
						console.log('marksheets' + JSON.stringify(marksheets));
						marksheets.forEach(function (getdata){
							if(searchdata.pattern == 'semester'){
								let duration = course_id.duration;
								marksheetname =  getdata.degree_type + '_' + getdata.plfaculty +  '_' + 'Semester ' + duration * 2 ;
								insertData =  models.UserMarklist_Upload.create({name : marksheetname , file_name : getdata.file_name , education_type  : getdata.degree_type , lock_transcript : 0 ,upload_step : 'default' , user_id : userId , user_marklist_id  : getdata.id,source : 'guattestation'  });
							}else{
											let duration = course_id.duration;
											var year = converter.toWordsOrdinal(duration);
											var inWords = year.charAt(0).toUpperCase() + year.slice(1);
											marksheetname =  getdata.degree_type + '_' + getdata.plfaculty +  '_' + inWords +  ' Year';
											insertData =  models.UserMarklist_Upload.create({name : marksheetname , file_name : getdata.file_name , education_type  : getdata.degree_type , lock_transcript : 0 ,upload_step : 'default' , user_id : userId , user_marklist_id  : getdata.id,source : 'guattestation'  });
								}
						})
					})

					models.Application.getExtraDocuments(userId).then(function(extra){
						console.log('marksheets' + JSON.stringify(extra));
						insertData =  models.User_Transcript.create({name : 'Aadhar Card' , file_name : getdata.file_name , education_type  : getdata.degree_type , lock_transcript : 0 ,upload_step : 'default' , user_id : userId , user_marklist_id  : getdata.id,source : 'guattestation'  });
					})
				}
				return insertData;
			},2000 )
		
	},
	createusermarklist_upload :  async(data,userId) =>{
		userMarkListData =  await models.userMarkList.findAll({where  :{user_id :  userId , app_id :  null,source : 'guattestation' }});
		useermarklistupload =  await models.UserMarklist_Upload.findAll({where  :{user_id :  userId , app_id :  null,source : 'guattestation' }});

		console.log('userMarkListDatauserMarkListData' + JSON.stringifyuserMarkListData);
		console.log('useermarklistupload' + useermarklistupload);
	},
	getEnrollmentData: async(userId,source)=>{
		let value;
		if(source == 'attestation'){
			 value = await models.Applied_For_Details.findAll({where : {user_id :  userId,source : 'guattestation'}});
		}else{
			value = await models.User.findAll({where : {id :  userId}})
		}
		return value;
	},
	Fetchdata:async (userId,source,enrollment_number)=>{
		let value;
		if(source == 'attestation'){
			 value =  models.Applied_For_Details.findAll({where : {user_id :  userId , app_id : null,source : 'guattestation'}});
		}
		if(source == 'pdc' || source == 'guconvocation'){
			 value =  models.edu_details.findOne({where : {user_id :  userId , enrollment_number   : enrollment_number}});
		}
		if(source == 'gumigration'){
			 value =  models.Applicant_Educational_Details.findOne({where : {user_id :  userId ,prn_no   : enrollment_number}})
		}
		return value;
	},

	programList(course_name){
		return  models.Program_List.findOne({where : {course_name  : course_name }})
	},
	getInstitution : async(user_id)=>{
		return  models.Institution_details.findAll({where : {user_id  : user_id , app_id : {
			[Op.eq] : null
		},source : 'guattestation' }})
	},
	// fetch data from all portals.
	checkEdu_Details: async (enroll_no , source  ,id ,applying_for) => {
		console.log("applying_forapplying_for" + applying_for);
		var AllData=[];
		let documents_data;
		let edu_details;
		var applied_for_degree;
		var insertedu_Details;
		if(source == 'pdc'){
			enroll_no.forEach(async function(edu) {
			
				if(edu.source == 'convo/pdc'){
					edu_details  = await models.edu_details.findOne({ where: { enrollment_number: edu.enroll} });
					if(edu_details){
						var count;
						console.log("edu.coursename" + edu.coursename);
						if(edu.coursename.includes('Master')){
						   var mastenroll = edu.enroll;
						   
						}
						else if(edu.coursename.includes('Bachelor')){
							var bachenroll = edu.enroll;
						}
						else if(edu.coursename.includes('Phd')){
							var phdenroll = edu.enroll;
						}
						console.log("countcount" + count);
						if(count == 0){

						}else{
							// insertedu_Details = await models.Applied_For_Details.create({applying_for : applying_for , user_id : id});
							// if(insertedu_Details){
							// 	count ++;
							// }
						}
											
					}

					
				}
				
			})
			
		
			AllData.push({
				details : edu_details,
				documents : documents_data
			})

			return AllData;
		}
		if(source == 'migration'){
			return await models.edu_details.findOne({ where: { enrollment_number: enroll_no} });
		}
		if(source == 'verification'){
			return await models.edu_details.findOne({ where: { enrollment_number: enroll_no} });
		}
		if(source == 'attestation'){
			// let attestation = 
		}
    },

	getAadhar : async(source,name,user_id)=>{
		return await models.Applicant_Marksheet.findOne({where : {[Op.or]:[{
			source:'guattestation',
		 },
		 {
			source:'gumoi',
		 }] , name : name  , user_id :  user_id}})
		},
	getAadhar_fromall : async(name,user_id)=>{
		return await models.Applicant_Marksheet.findOne({where : {name : name  , user_id :  user_id , lock_transcript : 0}})
	},
	insertAadhar : async(data,user_id)=>{
		return await models.Applicant_Marksheet.create({user_id :  user_id , name  : data.name , file_name :  data.file_name , type :  data.type ,[Op.or]:[{
										source_from:'guattestation',
									 },
									 {
										source_from:'gumoi',
									 }]});
	},
	createoutward : async(outward,type,app_id ,user_id)=>{
		return await models.User_Course_Enrollment_Detail_Attestation.create({user_id :  user_id , type  : type , outward : outward , application_id : app_id});
	},
	getBonafied_degree : async(source,name,user_id)=>{
		return await models.Applicant_Marksheet.findAll({where : {[Op.or]:[{
			source:'guattestation',
		 },
		 {
			source:'gumoi',
		 }] , name : name  , user_id :  user_id}})
	},
	  
	  
	uced :async(user_id)=>{
		return await models.User_Course_Enrollment_Detail_Attestation.findAll({where  :{user_id :user_id }});

	  },
	bonafied_aadhar :async(source,user_id,app_id)=>{
		return await models.Applicant_Marksheet.findAll({where :{source : source,user_id :  user_id, app_id : app_id}});

	  },
	  getAttestationFor :async(user_id)=>{
		return await models.Applied_For_Details.findOne({where :{user_id :  user_id, app_id : {
			[Op.eq] : null
		},source : 'guattestation'}});

	  },
	  paymentError :async(orderId , userId , source)=>{
		return await models.paymenterror_details.findAll({where :{[Op.or]:[{
			source:'guattestation',
		 },
		 {
			source:'gumoi',
		 }],user_id :  userId, order_id : orderId}});

	  },
	  bonafied_aadhar_studentmanagement :async(user_id,source)=>{
		return await models.Applicant_Marksheet.findOne({where :{user_id :  user_id,source : source}});
	  },
	  ucedcreated:async(app_id,user_id,randomEnroNo,source)=>{
		console.log('randomEnroNorandomEnroNo0 '+  randomEnroNo);
		console.log('app_id '+  app_id);
		console.log('user_id '+  user_id);
		return await models.User_Course_Enrollment_Detail_Attestation.create({
			application_id:app_id,
			user_id:user_id,
			enrollment_no:randomEnroNo,
			source : source
		});

	  },
	  createinward:async(app_id,user_id,randomEnroNo)=>{
		todaysdate =  moment(new Date()).format('DDMM')
		return await models.Application.update({inward : randomEnroNo + todaysdate + ' of 2023' }, {where  : {id :  app_id}});
	  },

	  ucedcreatedbarcode:async(app_id,user_id)=>{
		var barcode= 100000 + parseInt(app_id);
		return await models.User_Course_Enrollment_Detail_Attestation.create({
			application_id:app_id,
			user_id:user_id,
			barcode:barcode,
			enrollment_no : null
		});
	  },
	  application: async(userId, source)=>{
		return await models.Application.findAll({ where: { user_id: userId,[Op.or]:[{
			source_from:'guattestation',
		 },
		 {
			source_from:'gumoi',
		 }]} });
	},
	getOutward: async(application_id,degree_type)=>{
		return await models.User_Course_Enrollment_Detail_Attestation.findOne({ where: { application_id: application_id ,
			 type : 'instructional',
			 [Op.or]:[{
			degree_type : degree_type,
		 },
		 {
			degree_type : null,
		 },
		 {
			degree_type : '',
		 }
		]
		} ,raw:true});
	},
	getnotes: async(application_id)=>{
		return await models.Application.findOne({ where: { id: application_id} ,raw:true});
	},
	updateenrollandcourse:async(userId,course,enroll_no,oldvalue)=>{
		oldvalue.push({
			course : course,
			enrollmentNo :enroll_no
		})
		return await models.User.update({enrollmentNo :  oldvalue }, {where  : {id :  userId}});
	  },

	  getDeliveryType: async (user_id) => {
		return await models.Institution_details.findAll({ where: { user_id: user_id , app_id : {
			[Op.eq] : null
		},source : 'guattestation'} });
	},
	bonafied_studentmanagement :async(user_id,type,source)=>{
		return await models.Applicant_Marksheet.findAll({where :{user_id :  user_id,type:type,source : source}});
	  },
	  getCountofMark: async (user_id,application_id) => {
		return await models.UserMarklist_Upload.findAll({ where: { user_id: user_id ,app_id : application_id ,source : 'guattestation' } });
	},
	getCountoftranscript: async (user_id,application_id) => {
		return await models.User_Transcript.findAll({ where: { user_id: user_id ,app_id:application_id,type : {
			[Op.like] : '%transcript%'
		},source : 'guattestation' 
	 } });
	},
	getCountofdegree: async (user_id,application_id) => {
		return await models.User_Transcript.findAll({ where: { user_id: user_id ,app_id : application_id,type : {
			[Op.like] : '%degree%'
		},source : 'guattestation' 
	 } });
	},
	getCountofthesis: async (user_id,application_id) => {
		return await models.User_Transcript.findAll({ where: { user_id: user_id ,app_id :application_id,type : {
			[Op.like] : '%thesis%'
		},source : 'guattestation' 
	 } });
	},
	getCountMark: async (user_id) => {
		return await models.UserMarklist_Upload.findAll({ where: { user_id: user_id ,app_id : {
			[Op.eq] : null
		} ,source : 'guattestation' } });
	},
	getCounttranscript: async (user_id) => {
		return await models.User_Transcript.findAll({ where: { user_id: user_id ,app_id : {
			[Op.eq] : null
		},type : {
			[Op.like] : '%transcript%'
		},source : 'guattestation' 
	 } });
	},
	getCountdegree: async (user_id) => {
		return await models.User_Transcript.findAll({ where: { user_id: user_id ,app_id : {
			[Op.eq] : null
		},type : {
			[Op.like] : '%degree%'
		},source : 'guattestation' 
	 } });
	},
	getCountthesis: async (user_id) => {
		return await models.User_Transcript.findAll({ where: { user_id: user_id ,app_id : {
			[Op.eq] : null
		},type : {
			[Op.like] : '%thesis%'
		},source : 'guattestation' 
	 } });
	},
	
	application_for_preview: async(userId)=>{
		return await models.Applied_For_Details.findAll({ where: { user_id: userId ,app_id : {
			[Op.eq] : null
		}, source : 'guattestation'} });
	},
	application_for_print: async(application_id)=>{
        return await models.Applied_For_Details.findOne({ where: { app_id : application_id ,source : 'guattestation'} });
    },
	User_Course_Enroll_Marksheet: async(user_id,application_id,type)=>{
        return await models.User_Course_Enrollment_Detail_Attestation.findOne({ where: {user_id: user_id, application_id : application_id, type : type} });
    },
	User_Course_Enroll_Instructional: async(user_id,application_id,type)=>{
        return await models.User_Course_Enrollment_Detail_Attestation.findAll({ where: {user_id: user_id, application_id : application_id, type : type} });
    },
	bonafied_aadhar_studentmanagement :async(user_id,type,source)=>{
		return await models.Applicant_Marksheet.findOne({where :{user_id :  user_id,type:type,[Op.or]:[{
			source:'guattestation',
		 },
		 {
			source:'gumoi',
		 }]}});
	  },
	
	  instructional_details: async (user_id,app_id) => {
		return await models.InstructionalDetails.findAll({ where: { userId: user_id ,app_id :app_id
	 } });
	},

	User_Marklist_preview: async(userId,type)=>{
		return await models.userMarkList.findOne({ where: { user_id: userId , type : type,app_id : {
			[Op.eq] : null
		} ,source : 'guattestation' } });
	},
	
	User_instruction_preview: async(userId,type)=>{	
		return await models.InstructionalDetails.findAll({ where: { userId: userId ,app_id : {
			[Op.eq] : null
		},education :{[Op.like]: "%"+type+"%"}, } });
	},
	User_institutions_preview: async(userId)=>{
		return await models.Institution_details.findAll({ where: { user_id: userId , app_id : {
			[Op.eq] : null
		},source : 'guattestation' } });
	},
	User_Marklist_Uploadpreview: async(userId,type)=>{
		return await models.UserMarklist_Upload.findAll({ where: { user_id: userId , education_type : type,app_id : {
			[Op.eq] : null
		} ,source : 'guattestation' } });
	},
	User_Transcripts_Upload_preview: async(userId,name,type)=>{
		return await models.User_Transcript.findAll({ where: { user_id: userId , name :{[Op.like]: "%"+name+"%"},type :{[Op.like]: "%"+type+"%"},app_id : {
			[Op.eq] : null
		},source : 'guattestation'  } });
	},

	User_Transcripts_Upload_Extra_preview: async(userId,type)=>{
		return await models.User_Transcript.findAll({ where: { user_id: userId , type :{[Op.like]: "%"+type+"%"},app_id : {
			[Op.eq] : null
		},source : 'guattestation'  } });
	},
	getCourse:async(course)=>{
		return await models.Program_List.findAll({
			where:{
			// 	course_name : course,
			// 	course_name : {
			// 	[Op.like]: '%Integrated%'
			// }
			[Op.and]:[{
				course_name : course
			},
			{
				course_name :{
					[Op.like]: '%Integrated%'
				}
			}
		]
		}
		})
	},
	setAppId_email_docs:async(app_id)=>{
		return await models.Emailed_Docs.update({ app_id : app_id}, {where  : { app_id : {
			[Op.eq] : null
		}}});
	},
	setAppId : async(app_id,user_id,table)=>{
		if(table == 'AppliedForDetails'){
			return await models.Applied_For_Details.update({ app_id : app_id}, {where  : {user_id : user_id , app_id : {
				[Op.eq] : null
			},source : 'guattestation'}});
		}
		if(table == 'UserMarklist'){
			return await models.userMarkList.update({ app_id : app_id}, {where  : {user_id : user_id , app_id : {
				[Op.eq] : null
			},source : 'guattestation' }});
		}
		if(table == 'Instructional'){
			return await models.InstructionalDetails.update({ app_id : app_id}, {where  : {userId : user_id , app_id : {
				[Op.eq] : null
			}}});
		}
		if(table == 'Marksheets'){
			return await models.UserMarklist_Upload.update({ app_id : app_id}, {where  : {user_id : user_id , app_id : {
				[Op.eq] : null
			},source : 'guattestation' }});
		}
		if(table == 'Degree'){
			return await models.User_Transcript.update({ app_id : app_id}, {where  : {user_id : user_id , app_id : {
				[Op.eq] : null
			},type : {
				[Op.like] : '%degree%'
			},source : 'guattestation' }});
		}
		if(table == 'Transcript'){
			return await models.User_Transcript.update({ app_id : app_id}, {where  : {user_id : user_id , app_id : {
				[Op.eq] : null
			},type : {
				[Op.like] : '%transcript%'
			},source : 'guattestation' }});
		}
		if(table == 'purpose'){
			return await models.Institution_details.update({ app_id : app_id}, {where  : {user_id : user_id , app_id : {
				[Op.eq] : null
			},source : 'guattestation'}});
		}
	  },
	  Transcriptupload: async(userId,app_id)=>{
		return await models.User_Transcript.findOne({ where: { user_id: userId ,app_id:app_id,lock_transcript:'1',upload_step:'requested' ,source : 'guattestation' } });
	},
	usersMarklistupload: async(userId,app_id)=>{
		return await models.UserMarklist_Upload.findOne({ where: { user_id: userId ,app_id:app_id,lock_transcript:'1',upload_step:'requested' ,source : 'guattestation' } });
	},
	applicantmarksheets: async(userId)=>{
		return await models.Applicant_Marksheet.findOne({ where: { user_id: userId ,lock_transcript:'1',[Op.or]:[{
			source:'guattestation',
		 },
		 {
			source:'gumoi',
		 }]} });
	},
	insertPreviousDocument : async (data,id,type)=>{
		if(type == 'marksheets'){
		return models.UserMarklist_Upload.create({name : data.name , file_name : data.file_name , education_type  : data.education_type , lock_transcript : 0 ,[Op.or]:[{upload_step:'upload_step',},{upload_step:'changed',}], user_id : data.user_id , user_marklist_id  : id,verify_doc:data.verify_doc ? data.verify_doc :  0 ,previous_data: 1 ,source : 'guattestation'});
		}if(type == 'transcript' || type == 'degree' || type == 'thesis'){
			return models.User_Transcript.create({name : data.name , file_name : data.file_name , type  : data.type , lock_transcript : 0 ,[Op.or]:[{upload_step:'upload_step',},{upload_step:'changed',}] , user_id : data.user_id ,collegeId:data.collegeId,verify_doc:data.verify_doc ? data.verify_doc :  0,provisional:data.provisional,previous_data: 1 ,source : 'guattestation' });
		}
		
	},
	insert_EmailDocs : async (data,app_id)=>{
		
		return models.Emailed_Docs.create({ filename : data.filename , doc_type  : data.doc_type , category:data.category,marklist_id:data.marklist_id,transcript_id:data.transcript_id,previous_AppId  : app_id});
	},
	FetchPreviousData: async(userId)=>{
		return await models.userMarkList.findAll({ where: { user_id: userId ,app_id : {
			[Op.ne] : null
		} ,source : 'guattestation'} });
	},
	FetchPreviousData_notpaid: async(userId,type)=>{
		return await models.userMarkList.findAll({ where: { user_id: userId ,app_id : {
			[Op.eq] : null
		} ,type : type,source : 'guattestation'} });
	},
	FetchPreviousData_notpaid_findOne: async(userId)=>{
		return await models.userMarkList.findOne({ where: { user_id: userId ,app_id : {
			[Op.eq] : null
		},source : 'guattestation' } });
	},
	FetchPreviousData_notpaidApplied: async(userId)=>{
		return await models.Applied_For_Details.findOne({ where: { user_id: userId ,app_id : {
			[Op.eq] : null
		},source : 'guattestation' } });
	},
	FetchPreviousData_paidApplied: async(userId)=>{
		return await models.Applied_For_Details.findOne({ where: { user_id: userId ,app_id : {
			[Op.ne] : null
		},source : 'guattestation' } });
	},
	getUserMarklistId : async (type,user_id)=>{
		return models.userMarkList.findOne({where  :{user_id : user_id,type : type,app_id :{
			[Op.eq] : null
		},source : 'guattestation'}})
	},
	FetchPreviousData_applied_notPaid: async(userId)=>{
		console.log();
		return await models.Applied_For_Details.findOne({ where: { user_id: userId ,app_id : {
			[Op.eq] : null
		},source : 'guattestation' } });
	},

	FetchPreviousData_applied: async(app_id)=>{
		return await models.Applied_For_Details.findOne({ where: { app_id	: app_id  ,source : 'guattestation'} });
	},
	updataed_previousDatausermarklist : async(user_id)=>{
		return await models.userMarkList.update({  }, {where  : {user_id : user_id , app_id : {
			[Op.eq] : null
		}}});

	  },
	FetchPreviousDocuments: async(app_id,type,degree)=>{
		if(type == 'marksheets'){
		return await models.UserMarklist_Upload.findAll({ where: { app_id	: app_id ,education_type : degree ,source : 'guattestation'} });
		}
		if(type == 'transcript' || type == 'degree' || type == 'thesis' ){
			return await models.User_Transcript.findAll({ where: { app_id	: app_id  ,type : {
				[Op.like] : '%'+type+'%'
			},source : 'guattestation' } });
		}
	},
	FetchPreviousDocuments_notpaid: async(userId,type,degree)=>{
		if(type == 'marksheets'){
		return await models.UserMarklist_Upload.findAll({ where: { user_id: userId , app_id : {
			[Op.eq] : null
		} ,education_type  : degree,source : 'guattestation'} });
		}
		if(type == 'transcript' || type == 'degree' || type == 'thesis' ){
			return await models.User_Transcript.findAll({ where: { user_id	: userId  ,type : {
				[Op.like] : '%'+type+'%'
			},app_id : {
				[Op.eq] : null
			} ,source : 'guattestation' } });
		}
	},
	updataed_previous_appid:async(user_id,app_id_pre,type)=>{ 
		if(type == 'DifferentType'){
			models.Emailed_Docs.destroy({where :{previous_AppId : app_id_pre}})
			return await models.Applied_For_Details.update({ previous_data:{'app_id':app_id_pre,'Type':type}}, {where  : {user_id : user_id , app_id : {
				[Op.eq] : null
			},source : 'guattestation'}});
		}else{
			return await models.Applied_For_Details.update({ previous_data:{'app_id':app_id_pre,'Type':type}}, {where  : {user_id : user_id , app_id : {
				[Op.eq] : null
			},source : 'guattestation'}});
		}
		

	  },
	  updataed_previousApplied : async(user_id,app_id_pre,type)=>{
		return await models.Applied_For_Details.update({ previous_data:{'app_id':app_id_pre,'Type':'DifferentType','previousdata' : type}}, {where  : {user_id : user_id , app_id : {
			[Op.eq] : null
		},source : 'guattestation'}});

	  },
	  removemarksheets:async(id)=>{ 
		return await models.UserMarklist_Upload.update({user_marklist_id :  null }, {where  : { user_marklist_id : id,source : 'guattestation'}});
	  },
	  
	  previous_appid:async(user_id,)=>{
		return await models.Applied_For_Details.findOne({ where: { user_id: user_id ,previous_data : {
			[Op.eq] : null
		},
		
		app_id : {
			[Op.eq] : null
		} ,source : 'guattestation' } });

	  },
	  previous_Data:async(user_id)=>{
		return await models.Applied_For_Details.findOne({ where: { user_id: user_id ,previous_data : {
			[Op.ne] : null
		},
		app_id : {
			[Op.eq] : null
		},source : 'guattestation'  } });

	  },
	  previous_empty:async(user_id)=>{
		return await models.Applied_For_Details.update({ previous_data: null }, {where  : {user_id : user_id , app_id : {
			[Op.eq] : null
		},source : 'guattestation'}});

	  },
	  getPreviousApplied : async(userId)=>{
		return await models.Applied_For_Details.findOne({ where: { user_id: userId ,app_id : {
			[Op.ne] : null
		} } })
},
Checkdata_previous: async(userId,fetchapp_id)=>{
	return await models.userMarkList.findAll({ where: { user_id: userId ,app_id : fetchapp_id } });
},
}