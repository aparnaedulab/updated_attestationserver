var path = require('path');
var root_path = path.dirname(require.main.filename);
var models  = require(root_path+'/models');
const express = require('express');
var router  = express.Router();
const middlewares = require('../middlewares');
const logger = require('../logger')("Main route"+__filename);
var request = require('request');
var constant = require(root_path+'/config/constant');
var h2p = require('html2plaintext')
var sequelize = require("sequelize");
const Op = sequelize.Op;
var urlencode = require('urlencode');
var functions = require('../utils/function');

router.get('/api/abcdef', function (req, res) {
	logger.debug("reached test url abcdef");
    res.send("ok");
});

router.get('/api/cart',middlewares.getUserInfo,middlewares.getUserEducationalInfo,  function (req, res) {

	var view_data = {
		course:[]
	}
	var total_amount
	var wesFlag = false;
                    models.Institution_details.findAll({
                        where :{
                            app_id : {
                                [Op.eq] : null
                            },
                            user_id : req.User.id,source : 'guattestation'
                        }
                    }).then(function(instituteData){
                        if(instituteData){
                            instituteData.forEach(function (institute){
                                var referenceNo;
                                var email;
                                if(institute.OtherEmail)
                                    email = institute.email + ', ' + institute.OtherEmail;
                                else
                                    email = institute.email;
                                if(institute.type == 'Educational credential evaluators WES'){
                                    referenceNo = institute.wesno;
                                    wesFlag = true;
                                }
                                if(institute.type == 'study')
                                    referenceNo = institute.studyrefno ? institute.studyrefno :'Not added';
                                if(institute.type == 'employment')
                                    referenceNo = institute.emprefno ? institute.emprefno :'Not added';
                                if(institute.type == 'IQAS')
                                    referenceNo = institute.iqasno ? institute.iqasno :'Not added';
                                if(institute.type == 'CES')
                                    referenceNo = institute.cesno ? institute.cesno :'Not added';
                                if(institute.type == 'ICAS')
                                    referenceNo = institute.icasno ? institute.icasno :'Not added';
                                if(institute.type == 'visa')
                                    referenceNo = institute.visarefno ? institute.visarefno :'Not added';
                                if(institute.type == 'MYIEE')
                                    referenceNo = institute.myieeno ? institute.myieeno :'Not added';
                                if(institute.type == 'ICES')
                                    referenceNo = institute.icesno ? institute.icesno :'Not added';
                                if(institute.type == 'NASBA')
                                    referenceNo = institute.nasbano ? institute.nasbano :'Not added';
                                if(institute.type == 'Educational Perspective')
                                    referenceNo = institute.eduperno ? institute.eduperno :'Not added';
                                if(institute.type == 'NCEES')
                                    referenceNo = institute.nceesno ? institute.nceesno :'Not added';
                                if(institute.type == 'NARIC')
                                    referenceNo = institute.naricno ? institute.naricno :'Not added';
                                if(institute.type == 'Educational credential evaluators WES')
                                    referenceNo = institute.wesno ? institute.wesno :'Not added';
                                if(institute.type == 'others')
                                    referenceNo = institute.otheraccno ? institute.otheraccno :'Not added';
                                if(institute.type == 'National Committee on Accreditation')
                                    referenceNo = institute.ncano ? institute.ncano :'Not added';
                                view_data.course.push({
                                    id : institute.id,
                                    user_id : institute.user_id,
                                    university_name : institute.university_name ? institute.university_name : "NA",
                                    email  : email ? email : "N/A" ,
                                    institute_id : institute.id,
                                    type : institute.type,
                                    referenceNo : referenceNo
                                });
                            })
                        }
                    })
                setTimeout(()=>{
                    return res.json({
                        message: 'Successfully retrieved data !',
                        status: 200,
                        data: view_data,
                        total_amount : '',
                        wesFlag : wesFlag
                    });
                },1000)
      

});

router.post('/api/removeCartvalue',middlewares.getUserInfo , function(req, res) {
	models.Institution_details.destroy({
        where: {
           id: req.body.institute_id,source : 'guattestation'
        }
     }).then(function(rowDeleted){
        if(rowDeleted === 1){
			models.Cart.destroy({
				where:
				{
					institute_id : req.body.institute_id
				}
			}).then(function(cartdeleted){
				if(cartdeleted === 1){
					res.json({
						status : 200
					});
				}else{
					res.json({
						status : 400
					});
				}
			})

        }else{
            res.json({
                status : 400
            });
        }
     }
     );
});

router.post('/api/emailUpdate',middlewares.getUserInfo,function(req,res){
	//

	models.Institution_details.find({
		where:{
			user_id: req.user_id,
			email : req.body.email,source : 'guattestation'
		}
	}).then(function(institite_data){
		institite_data.update({
			email: req.body.updated_email
		}).then(function(institite_updated){
			if(institite_updated){
				models.Cart.find({
					where:
					{
						user_id: req.user_id,
						email : req.body.email
					}
				}).then(function(cart_data){
					cart_data.update({
						email: req.body.updated_email
					}).then(function(cart_updated){
						if(cart_updated){
							return res.json({
								status:200
							});
						}else{
						//
						}
					});
				});
			}else{
			//
			}
		});
	});
});


router.get('/api/getUserData',middlewares.getUserInfo, function (req, res) {
    //
    models.User.find({
        where:{
            id : req.User.id
        }
    }).then(function(user){
        res.json({
            status: 200,
            data : user
        });
    });
});

router.get('/api/getCollegeList',middlewares.getUserInfo, function (req, res) {

	models.College.findAll({

    }).then(function(collegeList){
        res.json({
            status: 200,
            data : collegeList
        });
    });
})

router.post('/api/addNewCollegebyStudent',function(req,res){
	request.post(constant.MU_BASE_URL+'api/support/addNewCollegebyStudentATT',
	{
		json : req.body
	},function (error, response, body) {
		if(!error && response.statusCode==200){
			//var array = JSON.parse(body);
			// var parseArray = JSON.parse(array);
			// var parseArray2 = JSON.parse(parseArray);
			res.json({
				status : 200,
			//	data : array
			})
		}else if(response != undefined && response.statusCode==400){
			res.json({
				status : 400
			})
		}else{
			res.json({
				status : 400
			})
		}
	});
})

router.get('/api/getFacultyList', function (req, res) {
	models.facultymaster.findAll({
		where :{
			degree : req.query.degree
		}
    }).then(function(faculties){
        res.json({
            status: 200,
            data : faculties
        });
    });
})

router.get('/api/testApp',function(req,res){
	models.User.getUserDetailsByemail("priyankabandagale1990@gmail.com").then(user =>{

		models.Cart.findAll({
			where:
			{
				user_id : user[0].id
			}
		}).then(function(cart){
			//total_amount = 1000 * cart.length;
			total_amount = 0.00;
			models.Application.create({
				tracker : 'apply',
				status : 'new',
				total_amount : total_amount,
				user_id : user[0].id,
                    [Op.or]:[{
				source_from:'guattestation',
			 },
			 {
				source_from:'gumoi',
			 }]
			}).then(function(created){
				if(created){
					var userName = user[0].name + ' ' + user[0].surname;
					updateAppId(user[0].id, user[0].educationalDetails,user[0].instructionalField,user[0].curriculum,user[0].gradToPer,created.id);

					var outercounter = 0
					cart.forEach(function(single_cart){
						outercounter ++ ;


						models.Institution_details.find({
							where:
							{
								id : single_cart.institute_id,source : 'guattestation'
							}
						}).then(function(inst_detail){
							var desc = user[0].name+"( "+user[0].email+" ) made payment for Institute ( "+inst_detail.university_name+" ).";
							var activity = "Payment";
							var applicationId = created.id;
							//functions.activitylog(user[0].id, activity, desc, applicationId);
							inst_detail.update({
								app_id : created.id
							}).then(function(inst_updated){
								//
								models.Cart.destroy({
									where:{
										institute_id : inst_updated.id,
									}
								}).then(function(cart_deleted){
									//

								});
							});
						});
					});
					setTimeout(()=>{
						if(user[0].educationalDetails == true)
							sendEmailInstitute(user[0].id,userName,created.id);
						if(user[0].instructionalField == true)
							sendEmailInstituteInstructional(user[0].id,userName,created.id);
						if(user[0].curriculum == true)
							sendEmailInstituteCurriculum(user[0].id,userName,created.id);
						if(user[0].gradToPer == true)
							sendEmailInstitiuteGradeTOPercentLetter(user[0].id,userName,created.id)
						sendEmailStudent(user[0].id,user[0].email,userName);
					},2000)
					if(outercounter == cart.length){

						res.send("ok");
					}else{
						res.send("Error");
					}
				}
			})
		});
	});

	function sendEmailInstitute(user_id,user_name,app_id){
        var userTranscripts = [];
        var userMarkLists = [];
        models.User_Transcript.findAll({
            where :{
                user_id : user_id,source : 'guattestation' 
            }
        }).then(function(user_transcripts){
            user_transcripts.forEach(transcript=>{
                var app_idArr = transcript.app_id.split(',');
                app_idArr.forEach(appl_id=>{
                    if(appl_id == app_id){
                        userTranscripts.push(transcript);
                    }
                })
            })
            var collegeData = [];
            userTranscripts.forEach(transcript=>{
                var singleCollege = {
                    user_id : '',
                    collegeName : '',
                    studentName : '',
                    college_id : '',
                    collegeEmail : '',
                    user_transcript : [],
                    user_markList : [],
                    app_id : app_id
                }
                models.College.find({
                    where:{
                        id : transcript.collegeId
                    }
                }).then(function(college){
                    if(collegeData.length < 1){
                        singleCollege.user_id = user_id;
                        singleCollege.collegeName = college.name;
                        singleCollege.collegeEmail = college.emailId;
                        singleCollege.studentName = user_name;
                        singleCollege.college_id = college.id;
                        singleCollege.alternateEmail = college.alternateEmailId;
                        singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/documents/'+ user_id + "/" + urlencode(transcript.file_name)});
                        collegeData.push(singleCollege);
                    }else{
                        var transcriptFlag = false;
                        for(var i = 0; i<collegeData.length; i++){
                            if(collegeData[i].college_id == transcript.collegeId){
                                collegeData[i].user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/documents/'+user_id + "/" + urlencode(transcript.file_name)});
                                transcriptFlag = true;
                                break;
                            }
                        }
                        if(transcriptFlag == false){
                            singleCollege.user_id = user_id;
                            singleCollege.collegeName = college.name;
                            singleCollege.studentName = user_name;
                            singleCollege.college_id = college.id;
                            singleCollege.collegeEmail = college.emailId;
                            singleCollege.alternateEmail = college.alternateEmailId;
                            singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/documents/'+user_id + "/" + urlencode(transcript.file_name)});
                            collegeData.push(singleCollege);
                        }
                    }
                })
            });
            models.userMarkList.find({
                where : {
                    user_id : user_id,source : 'guattestation'
                }
            }).then(function(userMarkListsData){
               models.UserMarklist_Upload.getMarksheetDataSendToInstitute(userMarkListsData.user_id).then(function(userMark_Lists){
                userMark_Lists.forEach(transcript=>{
                    var app_idArr = transcript.app_id.split(',');
                    app_idArr.forEach(appl_id=>{
                        if(appl_id == app_id){
                            userMarkLists.push(transcript);
                        }
                    })
                })
                userMarkLists.forEach(markList=>{
                    var singleCollege = {
                        user_id : '',
                        collegeName : '',
                        studentName : '',
                        college_id : '',
                        collegeEmail : '',
                        user_transcript : [],
                        user_markList : [],
                        app_id : app_id
                    }
                    models.College.find({
                        where:{
                            id : markList.collegeId
                        }
                    }).then(function(college){
                        if(collegeData.length < 1){
                            singleCollege.user_id = user_id;
                            singleCollege.collegeName = college.name;
                            singleCollege.collegeEmail = college.emailId;
                            singleCollege.studentName = user_name;
                            singleCollege.college_id = college.id;
                            singleCollege.alternateEmail = college.alternateEmailId;
                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;
                                        break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});

                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break;
                                    }
                                }
                            }
                            if(flag == false){
                                singleCollege.user_id = user_id;
                                singleCollege.collegeName = college.name;
                                singleCollege.studentName = user_name;
                                singleCollege.college_id = college.id;
                                singleCollege.collegeEmail = college.emailId;
                                singleCollege.alternateEmail = college.alternateEmailId;
                                if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);

                                }
                            }
                        }
                    });
                })
                setTimeout(function(){
                    request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailShweta', {
                        json: {
                            collegeData : collegeData,
							source : 'gu'
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
                    })
                },1000);
            });
            })
        })
    }

    function sendEmailInstituteInstructional(user_id,user_name,app_id){
        var collegeData = [];
        var userMarkLists = [];
        models.InstructionalDetails.find({
            where :{
                userId : user_id
            }
        }).then(function(instructional){
            models.userMarkList.find({
                where : {
                    user_id : user_id,source : 'guattestation'
                }
            }).then(function(userMarkListsData){
              models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMark_Lists){
                userMark_Lists.forEach(transcript=>{
                    var app_idArr = transcript.app_id.split(',');
                    app_idArr.forEach(appl_id=>{
                        if(appl_id == app_id){
                            userMarkLists.push(transcript);
                        }
                    })
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
                        alternateEmail : '',
                        app_id : app_id
                    }
                    models.College.find({
                        where:{
                            id : markList.collegeId
                        }
                    }).then(function(college){
                        if(collegeData.length < 1){
                            singleCollege.user_id = user_id;
                            singleCollege.collegeName = college.name;
                            singleCollege.collegeEmail = college.emailId;
                            singleCollege.studentName = instructional.studentName;
                            singleCollege.college_id = college.id;
                            singleCollege.courseName = instructional.courseName;
                            singleCollege.alternateEmail = college.alternateEmailId;
                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                            collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);

                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                     if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                    collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                    flag = true;
                                    break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break;

                                    }
                                }
                            }
                            if(flag == false){
                                singleCollege.user_id = user_id;
                                singleCollege.collegeName = college.name;
                                singleCollege.studentName = instructional.studentName;
                                singleCollege.courseName = instructional.courseName;
                                singleCollege.college_id = college.id;
                                singleCollege.collegeEmail = college.emailId;
                                singleCollege.alternateEmail = college.alternateEmailId;
                                if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);

                                }
                            }
                        }
                    });
                })
                setTimeout(()=>{
                    request.post(constant.BASE_URL_SENDGRID + 'instructionalFieldVerificationEmail', {
                        json: {
                            collegeData : collegeData,
							source : 'gu'
                        }
                    }, function (error, response, body) {
                        if(body.notSent.length > 0){
                            body.noteSent.forEach(data=>{
                                models.InstructionalDetails.updateSingleEmailStatus(user_id,null,'not sent');
                            })
                        }
                        body.data.forEach(msgId=>{
                            models.InstructionalDetails.updateSingleEmailStatus(user_id,msgId.msg_id,'sent');
                        })
                    })
                },1000);

            });

            })
        })
    }

    function sendEmailInstituteCurriculum(user_id,user_name,app_id){
        var collegeData = [];
        var userCurriculums = [];
        var userMarkLists = [];
        models.User_Curriculum.findAll({
            where :{
                user_id : user_id
            }
        }).then(function(user_Curriculums){
            user_Curriculums.forEach(transcript=>{
                var app_idArr = transcript.app_id.split(',');
                app_idArr.forEach(appl_id=>{
                    if(appl_id == app_id){
                        userCurriculums.push(transcript);
                    }
                })
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
                    user_markList : [],
                    app_id : app_id
                }
                models.College.find({
                    where:{
                        id : curriculum.collegeId
                    }
                }).then(function(college){
                    if(collegeData.length < 1){
                        singleCollege.user_id = user_id;
                        singleCollege.collegeName = college.name;
                        singleCollege.collegeEmail = college.emailId;
                        singleCollege.studentName = user_name;
                        singleCollege.college_id = college.id;
                        singleCollege.alternateEmail = college.alternateEmailId;
                        singleCollege.user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+ user_id + "/" + urlencode(curriculum.file_name)});
                        collegeData.push(singleCollege);
                    }else{
                        var transcriptFlag = false;
                        for(var i = 0; i<collegeData.length; i++){
                            if(collegeData[i].college_id == curriculum.collegeId){
                                collegeData[i].user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+user_id + "/" + urlencode(curriculum.file_name)});
                                transcriptFlag = true;
                                break;
                            }
                        }
                        if(transcriptFlag == false){
                            singleCollege.user_id = user_id;
                            singleCollege.collegeName = college.name;
                            singleCollege.studentName = user_name;
                            singleCollege.college_id = college.id;
                            singleCollege.collegeEmail = college.emailId;
                            singleCollege.alternateEmail = college.alternateEmailId;
                            singleCollege.user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+user_id + "/" + urlencode(curriculum.file_name)});
                            collegeData.push(singleCollege);
                        }
                    }
                })
            });
            models.userMarkList.find({
                where : {
                    user_id : user_id,source : 'guattestation'
                }
            }).then(function(userMarkListsData){
                models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMark_Lists){
                    userMark_Lists.forEach(transcript=>{
                        var app_idArr = transcript.app_id.split(',');
                        app_idArr.forEach(appl_id=>{
                            if(appl_id == app_id){
                                userMarkLists.push(transcript);
                            }
                        })
                    })
                userMarkLists.forEach(markList=>{
                    var singleCollege = {
                        user_id : '',
                        collegeName : '',
                        studentName : '',
                        college_id : '',
                        collegeEmail : '',
                        user_curriculum : [],
                        user_markList : [],
                        app_id : app_id
                    }
                    models.College.find({
                        where:{
                            id : markList.collegeId
                        }
                    }).then(function(college){
                        if(collegeData.length < 1){
                            singleCollege.user_id = user_id;
                            singleCollege.collegeName = college.name;
                            singleCollege.collegeEmail = college.emailId;
                            singleCollege.studentName = user_name;
                            singleCollege.college_id = college.id;
                            singleCollege.alternateEmail = college.alternateEmailId;
                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;
                                        break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break;
                                    }
                                }
                            }
                            if(flag == false){
                                singleCollege.user_id = user_id;
                                singleCollege.collegeName = college.name;
                                singleCollege.studentName = user_name;
                                singleCollege.college_id = college.id;
                                singleCollege.collegeEmail = college.emailId;
                                singleCollege.alternateEmail = college.alternateEmailId;
                                if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                    collegeData.push(singleCollege);
                                }

                            }
                        }
                    });
                })
                setTimeout(function(){
                   request.post(constant.BASE_URL_SENDGRID + 'curriculumVerificationEmail', {
                        json: {
                            collegeData : collegeData,
							source : 'gu'
                        }
                    }, function (error, response, body) {
                        if(body.notSent.length > 0){
                            body.noteSent.forEach(data=>{
                                models.User_Curriculum.updateSingleCollegeEmailStatus(user_id,data.college_id,null,'not sent');
                            })
                        }
                        body.data.forEach(msgId=>{
                            models.User_Curriculum.updateSingleCollegeEmailStatus(user_id,msgId.college_id,msgId.msg_id,'sent');
                        })
                    })
                },1000);
            });
            })
        })
    }

    function sendEmailInstitiuteGradeTOPercentLetter(user_id,user_name,app_id){
        var letters = [];
        var userMarkLists = [];
        models.GradeToPercentageLetter.findAll({
            where :{
                user_id : user_id
            }
        }).then(function(grade_letters){
            grade_letters.forEach(transcript=>{
                var app_idArr = transcript.app_id.split(',');
                app_idArr.forEach(appl_id=>{
                    if(appl_id == app_id){
                        letters.push(transcript);
                    }
                })
            })
            var collegeData = [];
            letters.forEach(letter=>{
                var singleCollege = {
                    user_id : '',
                    collegeName : '',
                    studentName : '',
                    college_id : '',
                    collegeEmail : '',
                    letter : [],
                    user_markList : [],
                    app_id : app_id
                }
                models.College.find({
                    where:{
                        id : letter.collegeId
                    }
                }).then(function(college){
                    if(collegeData.length < 1){
                        singleCollege.user_id = user_id;
                        singleCollege.collegeName = college.name;
                        singleCollege.collegeEmail = college.emailId;
                        singleCollege.studentName = user_name;
                        singleCollege.college_id = college.id;
                        singleCollege.alternateEmail = college.alternateEmailId;
                        singleCollege.letter.push({'fileName':letter.file_name,'letter':'upload/gradeToPercentLetter/'+ user_id + "/" + urlencode(letter.file_name)});
                        collegeData.push(singleCollege);
                    }else{
                        var transcriptFlag = false;
                        for(var i = 0; i<collegeData.length; i++){
                            if(collegeData[i].college_id == letters.collegeId){
                               collegeData[i].letter.push({'fileName':letter.file_name,'letter':'upload/gradeToPercentLetter/'+user_id + "/" + urlencode(letter.file_name)});
                                transcriptFlag = true;
                                break;
                            }
                        }
                        if(transcriptFlag == false){
                            singleCollege.user_id = user_id;
                            singleCollege.collegeName = college.name;
                            singleCollege.studentName = user_name;
                            singleCollege.college_id = college.id;
                            singleCollege.collegeEmail = college.emailId;
                            singleCollege.alternateEmail = college.alternateEmailId;
                            singleCollege.letter.push({'fileName':letter.file_name,'letter':'upload/gradeToPercentLetter/'+user_id + "/" + urlencode(letter.file_name)});
                            collegeData.push(singleCollege);
                        }
                    }
                })
            });
            models.userMarkList.find({
                where : {
                    user_id : user_id,source : 'guattestation'
                }
            }).then(function(userMarkListsData){
               models.UserMarklist_Upload.getMarksheetDataSendToInstitute(userMarkListsData.user_id).then(function(userMark_Lists){
                userMark_Lists.forEach(transcript=>{
                    var app_idArr = transcript.app_id.split(',');
                    app_idArr.forEach(appl_id=>{
                        if(appl_id == app_id){
                            userMarkLists.push(transcript);
                        }
                    })
                })
                userMarkLists.forEach(markList=>{
                    var singleCollege = {
                        user_id : '',
                        collegeName : '',
                        studentName : '',
                        college_id : '',
                        collegeEmail : '',
                        letter : [],
                        user_markList : [],
                        app_id : app_id
                    }
                    models.College.find({
                        where:{
                            id : markList.collegeId
                        }
                    }).then(function(college){
                        if(collegeData.length < 1){
                            singleCollege.user_id = user_id;
                            singleCollege.collegeName = college.name;
                            singleCollege.collegeEmail = college.emailId;
                            singleCollege.studentName = user_name;
                            singleCollege.college_id = college.id;
                            singleCollege.alternateEmail = college.alternateEmailId;
                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;
                                        break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});


                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break;
                                    }
                                }
                            }
                            if(flag == false){
                                singleCollege.user_id = user_id;
                                singleCollege.collegeName = college.name;
                                singleCollege.studentName = user_name;
                                singleCollege.college_id = college.id;
                                singleCollege.collegeEmail = college.emailId;
                                singleCollege.alternateEmail = college.alternateEmailId;
                                if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);

                                }
                            }
                        }
                    });
                })
                setTimeout(function(){
                    request.post(constant.BASE_URL_SENDGRID + 'gradeLetterVerificationEmail', {
                        json: {
                            collegeData : collegeData,
							source : 'gu'
                        }
                    }, function (error, response, body) {
                        if(body.notSent.length > 0){
                            body.noteSent.forEach(data=>{
                                models.GradeToPercentageLetter.updateSingleCollegeEmailStatus(user_id,data.college_id,null,'not sent');
                            })
                        }
                        body.data.forEach(msgId=>{
                            models.GradeToPercentageLetter.updateSingleCollegeEmailStatus(user_id,msgId.college_id,msgId.msg_id,'sent');
                        })
                    })
                },1000);
            });
            })
        })
    }

    function sendEmailStudent(user_id,user_email,user_name){
        var collegeData = [];
        models.Applied_For_Details.find({
            where :{
                user_id : user_id,
                source : 'guattestation'
            }
        }).then(function(student){
            models.userMarkList.getdistinctClg(user_id).then(function(userMarklists){
                userMarklists.forEach(userMarklist =>{
                    var clgFlag = false;
                    if(collegeData.length == 0){
                        models.College.find({
                            where:{
                                id : userMarklist.collegeId
                            }
                        }).then(function(college){
                            collegeData.push({
                                id : college.id,
                                name : college.name,
                                email : college.emailId,
                                alternateEmail : college.alternateEmailId
                            })
                        })
                    }else{
                        collegeData.forEach(clg=>{
                            if(clg.id == userMarklist.collegeId){
                                clgFlag = true;
                            }
                        });
                        if(clgFlag == false){
                            models.College.find({
                                where:{
                                    id : userMarklist.collegeId
                                }
                            }).then(function(college){
                                collegeData.push({
                                    id : college.id,
                                    name : college.name,
                                    email : college.emailId,
                                    alternateEmail : college.alternateEmailId
                                })
                            })
                        }
                    }
                })

                if(student.educationalDetails == true){
                    models.User_Transcript.getDistinctCollege(user_id).then(function(userTranscripts){
                        userTranscripts.forEach(userTranscript=>{
                            clgFlag = false;
                            if(userTranscript.collegeId != 0){
                                collegeData.forEach(clg=>{
                                    if(userTranscript.collegeId == clg.id ){
                                        clgFlag = true;
                                    }
                                })
                                if(clgFlag == false){
                                    models.College.find({
                                        where:{
                                            id : userTranscript.collegeId
                                        }
                                    }).then(function(college){
                                        collegeData.push({
                                            id : college.id,
                                            name : college.name,
                                            email : college.emailId,
                                            alternateEmail : college.alternateEmailId
                                        })
                                    })
                                }
                            }
                        })
                    })
                }

                if(student.curriculum == true){
                    models.User_Curriculum.getDistinctCollege(user_id).then(function(userCurriculums){
                        userCurriculums.forEach(userCurriculum=>{
                            clgFlag = false;
                            collegeData.forEach(clg=>{
                                if(userCurriculum.collegeId == clg.id){
                                    clgFlag = true;
                                }
                            })
                            if(clgFlag == false){
                                models.College.find({
                                    where:{
                                        id : userCurriculum.collegeId
                                    }
                                }).then(function(college){
                                    collegeData.push({
                                        id : college.id,
                                        name : college.name,
                                        email : college.emailId,
                                        alternateEmail : college.alternateEmailId
                                    })
                                })
                            }
                        })
                    })
                }

                if(student.gradToPer == true){
                    models.GradeToPercentageLetter.getDistinctCollege(user_id).then(function(userCurriculums){
                        userCurriculums.forEach(userCurriculum=>{
                            clgFlag = false;
                            collegeData.forEach(clg=>{
                                if(userCurriculum.collegeId == clg.id){
                                    clgFlag = true;
                                }
                            })
                            if(clgFlag == false){
                                models.College.find({
                                    where:{
                                        id : userCurriculum.collegeId
                                    }
                                }).then(function(college){
                                    collegeData.push({
                                        id : college.id,
                                        name : college.name,
                                        email : college.emailId,
                                        alternateEmail : college.alternateEmailId
                                    })
                                })
                            }
                        })
                    })
                }
                setTimeout(()=>{
                    request.post(constant.BASE_URL_SENDGRID + 'applicationGeneratedNotification', {
                        json: {
                            collegeData : collegeData,
                            userEmail : user_email,
                            userName : user_name,
							source : 'gu'
                        }
                    }, function (error, response, body) {})
                },1000)
            })
        })
    }

	function updateAppId(user_id, educationalDetails,instructionalField,curriculum,gradToPer,app_id){
		models.Applied_For_Details.find({
			where :{
				user_id : user_id,
				app_id : {
					[Op.eq] : null
				},
                source : 'guattestation'
			}
		}).then(function(appliedForDetails){
			appliedForDetails.update({
				app_id : app_id
			}).then(function(updated){
				models.userMarkList.find({
					where : {
						user_id : user_id,source : 'guattestation'
					}
				}).then(function(userMarkLists){
					if(userMarkLists.previous_data == true){
						if(educationalDetails == true){
							models.User_Transcript.findAll({
								where : {
									user_id : user_id,source : 'guattestation' 
								}
							}).then(function(UserTranscriptsData){
							if(UserTranscriptsData.length > 0){
									UserTranscriptsData.forEach((transcript)=>{
										var appID ;
										if(transcript.app_id == null || transcript.app_id == ''){
											appID = app_id
											models.User_Transcript.update(
												{   app_id  : appID},
												{   where   :  { id : transcript.id ,source : 'guattestation' }
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
												})
										}else {
											appID = transcript.app_id+","+app_id
											models.User_Transcript.update(
												{   app_id  : appID},
												{   where   :  { id : transcript.id ,source : 'guattestation' }
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
												})
										}

									})
								}

							})
						}

						if(curriculum == true){
							models.User_Curriculum.findAll({
								where : {
									user_id : user_id
								}
							}).then(function(User_CurriculumsData){
							if(User_CurriculumsData.length > 0){
									User_CurriculumsData.forEach((curriculum)=>{
										var appID ;
										if(curriculum.app_id == null || curriculum.app_id == ''){
											appID = app_id;
											models.User_Curriculum.update(
												{   app_id  : appID},
												{   where   :  { id : curriculum.id}
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
												})
										}else {
											appID = curriculum.app_id+","+app_id;
											models.User_Curriculum.update(
												{   app_id  : appID},
												{   where   :  { id : curriculum.id}
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
												})
										}

									})
								}
							})
						}

						if(instructionalField == true){
							models.InstructionalDetails.findAll({
								where : {
									userId : user_id
								}
							}).then(function(InstructionalDetailsData){
							if(InstructionalDetailsData.length > 0){
									InstructionalDetailsData.forEach((data)=>{
										var appID ;
										if(data.app_id == null || data.app_id == ''){
											appID = app_id
											models.InstructionalDetails.update(
												{   app_id  : appID},
												{   where   :  { id : data.id}
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
												})
										}else {
											appID = data.app_id+","+app_id
											models.InstructionalDetails.update(
												{   app_id  : appID},
												{   where   :  { id : data.id}
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
												})
										}

									})
								}
							})
						}

						if(gradToPer == true){
							models.GradeToPercentageLetter.findAll({
								where : {
									user_id : user_id
								}
							}).then(function(GradeToPercentageLetter){
								if(GradeToPercentageLetter.length > 0){
									GradeToPercentageLetter.forEach((data)=>{
										var appID ;
										if(data.app_id == null || data.app_id == ''){
											appID = app_id
											models.GradeToPercentageLetter.update(
												{   app_id  : appID},
												{   where   :  { id : data.id}
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
												})
										}else {
											appID = data.app_id+","+app_id
											models.GradeToPercentageLetter.update(
												{   app_id  : appID},
												{   where   :  { id : data.id}
											}).then((err,updated)=>{
												if(err){
													console.error(err);
												}
											})
										}

									})
								}
							})
						}

						models.userMarkList.findAll({
							where : {
								user_id : user_id,source : 'guattestation'
							}
						}).then(function(userMarkListsData){
						if(userMarkListsData.length > 0){
								userMarkListsData.forEach((marklist)=>{
									var appID ;
									if(marklist.app_id == null || marklist.app_id == ''){
										appID = app_id
										models.userMarkList.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id ,source : 'guattestation'}
											}).then((err,updated)=>{
												if(err){
													console.error(err);
												}
											})
									}else {
										appID = marklist.app_id+","+app_id
										models.userMarkList.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id ,source : 'guattestation'}
											}).then((err,updated)=>{
												if(err){
													console.error(err);
												}
											})
									}

								})
							}
						})
						models.UserMarklist_Upload.findAll({
							where : {
								user_id : user_id,source : 'guattestation'
							}
						}).then(function(userMarkListUploadsData){
						if(userMarkListUploadsData.length > 0){
								userMarkListUploadsData.forEach((marklist)=>{
									var appID ;
									if(marklist.app_id == null || marklist.app_id == ''){
										appID = app_id
										models.UserMarklist_Upload.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id,source : 'guattestation'}
											}).then((err,updated)=>{
												if(err){
													console.error(err);
												}
											})
									}else {
										appID = marklist.app_id+","+app_id
										models.UserMarklist_Upload.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id,source : 'guattestation'}
											}).then((err,updated)=>{
												if(err){
													console.error(err);
												}
											})
									}

								})
							}
						})
					}else{
						if(educationalDetails == true){
							models.User_Transcript.findAll({
								where : {
									user_id : user_id,
									app_id : {
										[Op.eq] : null
									},source : 'guattestation' 
								}
							}).then(function(UserTranscriptsData){
							if(UserTranscriptsData.length > 0){
									UserTranscriptsData.forEach((transcript)=>{
										models.User_Transcript.update(
										{   app_id  : app_id},
										{   where   :  { id : transcript.id,source : 'guattestation' }
										}).then((err,updated)=>{
											if(err){
												console.error(err);
											}
										})
									})
								}
							})
						}

						if(curriculum == true){
							models.User_Curriculum.findAll({
								where : {
									user_id : user_id,
									app_id : {
										[Op.eq] : null
									}
								}
							}).then(function(User_CurriculumsData){
							if(User_CurriculumsData.length > 0){
									User_CurriculumsData.forEach((curriculum)=>{
									models.User_Curriculum.update(
										{   app_id  : app_id},
										{   where   :  { id : curriculum.id}
										}).then((err,updated)=>{
											if(err){
												console.error(err);
											}
										})
									})
								}
							})
						}

						if(instructionalField == true){
							models.InstructionalDetails.findAll({
								where : {
									userId : user_id,
									app_id : {
										[Op.eq] : null
									}
								}
							}).then(function(InstructionalDetailsData){
								if(InstructionalDetailsData.length > 0){
									InstructionalDetailsData.forEach((data)=>{
										models.InstructionalDetails.update(
										{   app_id  : app_id},
										{   where   :  { id : data.id}
										}).then((err,updated)=>{
											if(err){
												console.error(err);
											}
										})
									})
								}
							})
						}

						if(gradToPer == true){
							models.GradeToPercentageLetter.findAll({
								where : {
									user_id : user_id,
									app_id : {
										[Op.eq] : null
									}
								}
							}).then(function(GradeToPercentageLetter){
								if(GradeToPercentageLetter.length > 0){
									GradeToPercentageLetter.forEach((data)=>{
										models.GradeToPercentageLetter.update(
										{   app_id  : app_id},
										{   where   :  { id : data.id}
										}).then((err,updated)=>{
											if(err){
												console.error(err);
											}
										})
									})
								}
							})
						}

						models.userMarkList.findAll({
							where : {
								user_id : user_id,
								app_id : {
									[Op.eq] : null
								},source : 'guattestation'
							}
						}).then(function(userMarkListsData){
						if(userMarkListsData.length > 0){
								userMarkListsData.forEach((marklist)=>{
									models.userMarkList.update(
									{   app_id  : app_id},
									{   where   :  { id : marklist.id,source : 'guattestation'}
									}).then((err,updated)=>{
										if(err){
											console.error(err);
										}
									})
								})
							}
						})
						models.UserMarklist_Upload.findAll({
							where : {
								user_id : user_id,
								app_id : {
									[Op.eq] : null
								},source : 'guattestation'
							}
						}).then(function(userMarkListUploadsData){
						if(userMarkListUploadsData.length > 0){
								userMarkListUploadsData.forEach((marklist)=>{
									models.UserMarklist_Upload.update(
									{   app_id  : app_id},
									{   where   :  { id : marklist.id,source : 'guattestation'}
									}).then((err,updated)=>{
										if(err){
											console.error(err);
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

})

router.post('/api/replyFromCollege',function(req,res){
	var app_id = req.body.app_id;
	var notes = req.body.notes;
	var college_id = req.body.college_id;
	var result = req.body.result;

	if(result == "accept"){
		models.College.find({
			where :{
				id : college_id
			}
		}).then(function(college){
			var note = college.name + " confirmation OK";
			models.Application.find({
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
				models.User.find({
					where : {
						id : application.user_id
					}
				}).then(function(user){
					if(application.notes){
						if(!application.notes.includes(note)){
							application.update({
								notes : (application.notes) ? (application.notes +" " + note) : note
							}).then(function(updatedApplication){
								var content = college.name + " verified documents of Application " + app_id +  " of " + user.name + " " + user.surname + ". we hereby confirm that details given by you are correct as per our records.";
								request.post(constant.BASE_URL_SENDGRID + 'CollegeReply', {
									json: {
										content : content,
										app_id : app_id,
										college_name : college.name,
										user_name : user.name + ' ' + user.surname,
										source : 'gu'
									}
								}, function (error, response, body) {
									var college = []
									models.userMarkList.findAll({
										where : {
											user_id : application.user_id,source : 'guattestation'
										}
									}).then(function(docs){
										docs.forEach(doc=>{
											if(college.length > 0){
												var flag = false;
												college.forEach(col=>{
													if(col == doc.collegeId){
														flag = true;
													}
												})
												if(flag == false){
													college.push(doc.collegeId)
												}
											}else{
												college.push(doc.collegeId)
											}
										})
										models.Application.find({
											where :{
												id : app_id,
												user_id : application.user_id ,
                                                    [Op.or]:[{
				source_from:'guattestation',
			 },
			 {
				source_from:'gumoi',
			 }]
											}
										}).then(function(app){
											let count = (app.notes.match(/confirmation OK/g) || []).length;
											if(count == college.length){
												app.update({
													collegeConfirmation : true
												}).then(function(updatedApp){
													res.json({
														status : 200
													})
												})
											}
										})
									})
								})
							})
						}
					}else{
						application.update({
							notes : (application.notes) ? (application.notes +" " + note) : note
						}).then(function(updatedApplication){
							var content = college.name + " verified documents of Application " + app_id +  " of " + user.name + " " + user.surname + ". we hereby confirm that details given by you are correct as per our records.";
							request.post(constant.BASE_URL_SENDGRID + 'CollegeReply', {
								json: {
									content : content,
									app_id : app_id,
									college_name : college.name,
									user_name : user.name + ' ' + user.surname,
									source : 'gu'
								}
							}, function (error, response, body) {
								var college = []
								models.userMarkList.findAll({
									where : {
										user_id : application.user_id,source : 'guattestation'
									}
								}).then(function(docs){
									docs.forEach(doc=>{
										if(college.length > 0){
											var flag = false;
											college.forEach(col=>{
												if(col == doc.collegeId){
													flag = true;
												}
											})
											if(flag == false){
												college.push(doc.collegeId)
											}
										}else{
											college.push(doc.collegeId)
										}
									})
									models.Application.find({
										where :{
											id : app_id,
											user_id : application.user_id ,
                                                [Op.or]:[{
				source_from:'guattestation',
			 },
			 {
				source_from:'gumoi',
			 }]
										}
									}).then(function(app){
										let count = (app.notes.match(/confirmation OK/g) || []).length;
										if(count == college.length){
											app.update({
												collegeConfirmation : true
											}).then(function(updatedApp){
												res.json({
													status : 200
												})
											})
										}
									})
								})
							})
						})
					}
				})
			})
		})
	}else if(result == "reject"){
		models.College.find({
			where :{
				id : college_id
			}
		}).then(function(college){
			var note = college.name + " says " + notes;
			models.Application.find({
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
				models.User.find({
					where : {
						id : application.user_id
					}
				}).then(function(user){
					if(application.notes){
						if(!application.notes.includes(note)){
							application.update({
								notes : (application.notes) ? (application.notes +" " + notes) : note,
								status : 'reject'
							}).then(function(updatedApplication){
								notes = h2p(notes);
								var content = college.name + " rejected documents of Application " + app_id +   " of " + user.name + " " + user.surname + ". The Student/Documents are not as per our records. \n" + notes;
								request.post(constant.BASE_URL_SENDGRID + 'CollegeReply', {
									json: {
										content : content,
										app_id : app_id,
										college_name : college.name,
										user_name : user.name + ' ' + user.surname,
										source : 'gu'
									}
								}, function (error, response, body) {
								res.json({
										status : 200
									})
								})
							})
						}
					}else{
						application.update({
							notes : (application.notes) ? (application.notes +" " + notes) : note,
							status : 'reject'
						}).then(function(updatedApplication){
							notes = h2p(notes);
							var content = college.name + " rejected documents of Application " + app_id +  " of " + user.name + " " + user.surname + ". The Student/Documents are not as per our records. \n" + notes;
							request.post(constant.BASE_URL_SENDGRID + 'CollegeReply', {
								json: {
									content : content,
									app_id : app_id,
									college_name : college.name,
									user_name : user.name + ' ' + user.surname,
									source : 'gu'
								}
							}, function (error, response, body) {
							res.json({
									status : 200
								})
							})
						})
					}
				})
			})
		})
	}else if(result == "partial"){
		models.College.find({
			where :{
				id : college_id
			}
		}).then(function(college){
			var note = college.name + " says " + notes;
			models.Application.find({
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
				models.User.find({
					where : {
						id : application.user_id
					}
				}).then(function(user){
					if(application.notes){
						if(!application.notes.includes(note)){
							application.update({
								notes : (application.notes) ? (application.notes +" " + notes) : note
							}).then(function(updatedApplication){
								notes = h2p(notes);
								var content = college.name + " says attached documents are authentic for application " + app_id +  " of " + user.name + " " + user.surname + ". However additional documents required. \n" + notes;
								request.post(constant.BASE_URL_SENDGRID + 'CollegeReply', {
									json: {
										content : content,
										app_id : app_id,
										college_name : college.name,
										user_name : user.name + ' ' + user.surname,
										source : 'gu'
									}
								}, function (error, response, body) {
									res.json({
										status : 200
									})
								})
							})
						}
					}else{
						application.update({
							notes : (application.notes) ? (application.notes +" " + notes) : note
						}).then(function(updatedApplication){
							notes = h2p(notes);
							var content = college.name + " says attached documents are authentic for application " + app_id + " of " + user.name + " " + user.surname + ". However additional documents required. \n" + notes;
							request.post(constant.BASE_URL_SENDGRID + 'CollegeReply', {
								json: {
									content : content,
									app_id : app_id,
									college_name : college.name,
									user_name : user.name + ' ' + user.surname,
									source : 'gu'
								}
							}, function (error, response, body) {
								res.json({
									status : 200
								})
							})
						})
					}
				})
			})
		})
	}
})


router.get('/api/onHoldReminderManually',function(req,res){
	console.log("/api/onHoldReminderManually");
	models.Application.getOnHoldApplications_date().then(function(applications){
		applications.forEach(application=>{
            request.post(constant.BASE_URL_SENDGRID + 'ReminderforOnholdApplicationToStudent', {
                json: {
                    email : application.email,
                    name : application.student_name,
                    app_id : application.application_id,
                    mobile_country_code : application.mobile_country_code,
                    mobile : application.mobile,
					type : "Manually",
					source : 'gu'
                }
            }, function (error, response, body) {
				if(body.status == 200){
					models.Application.find({
						where :{
							id : application.application_id,
                                [Op.or]:[{
				source_from:'guattestation',
			 },
			 {
				source_from:'gumoi',
			 }]
						}
					}).then(function(app){
						app.update({
							tracker : 'verified',
						})
					})
				}
			})
        })
		setTimeout(() => {
			res.send("OK")
		}, 2000);
	})
})

module.exports = router;