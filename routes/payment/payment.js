var path = require('path');
var root_path = path.dirname(require.main.filename);
var self_PDF = require(root_path+'/utils/self_letters');
var models  = require(root_path+'/models');
const express = require('express');
var request = require('request');
var router  = express.Router();
const middlewares = require('../../middlewares');
var functions = require(root_path+'/utils/function');
var constant = require(root_path+'/config/constant');
var ccav = require('./ccavutil.js');
var qs = require('querystring');
var async = require('async');
var urlencode = require('urlencode');
var base64 = require('file-base64');
var json2xls = require('json2xls');
const moment = require('moment');
const fs = require('fs');
var cron = require('node-cron');
var json2csv = require('json2csv').parse;
var sequelize = require("sequelize");
const Op = sequelize.Op;
const multer = require('multer');
var imageTmpPath = constant.FILE_LOCATION+constant.TMP_FILE_UPLOAD_PATH;
var upload = multer({
	dest: imageTmpPath
});
var XLSX = require('xlsx');
var json2xls = require('json2xls');


var paymentGatewayMode='live';//'live'; // live OR test
var workingKey='';
var accessCode='';
var secureUrl='';


//Nodedev payment gateway - for testing
if (paymentGatewayMode=='live')
{
//Live payment gateway
    workingKey = '8DFEB87B936835C33E70B70EF4B39144';
    accessCode = 'AVMM20JH05BY13MMYB'; //
    secureUrl = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction';


    //16-03-2019
   //  workingKey = 'D8C2131C2C5546D9E33506F880CABCF0';
   // // workingKey = 'FBB306BAC746D017DFBC62E41E9DA026';
   //   accessCode = 'AVSL89GL31AY84LSYA';
   // //accessCode ='AVVL89HA66AD41LVDA';
   //  secureUrl = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction';

    //16-12-2019
    // workingKey = 'F7C37757294160D92AF36200EFC95174';
    // accessCode = 'AVQM65DF81BU72MQUB';
    // secureUrl = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
}
else
{
   //
    //for local
    workingKey = '8DFEB87B936835C33E70B70EF4B39144';
    accessCode = 'AVMM20JH05BY13MMYB'; //
    secureUrl = 'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
}

router.post('/paymentrequest',middlewares.getUserInfo,function(req,res){
    var currentdate = new Date();
    var year = currentdate.getFullYear();
    year = year.toString().substr(-2);
    var total_amount = req.body.total_amount;
    var service = req.body.service;
    var source;
    var Appliedfor;
    var transaction_id = req.User.id+"Y"+year+"M"+(currentdate.getMonth()+1)+"D"+currentdate.getDate()+"T"+currentdate.getHours()+currentdate.getMinutes()+currentdate.getSeconds();
    var  merchant_id = '897916';
    if(req.User.id == ''){
        total_amount = '1.00';
        workingKey = '8DFEB87B936835C33E70B70EF4B39144';
        accessCode = 'AVMM20JH05BY13MMYB'; //
        secureUrl = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
    }

    models.Applied_For_Details.getAttestationFor(req.User.id).then(function(attested){
        Appliedfor= attested[0];

    if(Appliedfor.instructionalField == true || Appliedfor.instructionalField == 1){
        source = 'gumoi'
    }else{
        source = 'guattestation'
    }
    
    models.Orders.findOne({
        where:{
            order_id : '1',
            user_id : req.User.id,
            amount :  total_amount,
            status : '0',
            source : source
        }
    }).then(function(order_exists){
        if(order_exists){
            var paymentData = {
                merchant_id : merchant_id,
                order_id: order_exists.id,
                currency: 'INR',
                amount: total_amount,
                redirect_url: "https://guattestation.studentscenter.in/api/payment/success-redirect-url",
                cancel_url: "https://guattestation.studentscenter.in/api/payment/cancel-redirect-url",
                language: 'EN',
                billing_name: req.User.name,
                billing_address: req.User.address1,
                billing_city: req.User.city,
                billing_state: req.User.state,
                billing_zip: req.User.postal_code,
                billing_country: 'India',
                billing_tel: req.User.mobile,
                billing_email: req.User.email,
                // merchant_param1 : req.User.name,
                merchant_param1 : service,
                merchant_param2 : req.User.email,
                merchant_param3 : source,//req.User.mobile,
                merchant_param4 : req.User.address1,
                merchant_param5 : transaction_id
            };
            var bodyJson=JSON.parse(JSON.stringify(paymentData));
            var data='';
            var i=0;
            for(var attr in bodyJson){
                if (i){data=data+'&';}i=1;
                data=data+attr+'='+encodeURIComponent(bodyJson[attr]);
            }

            var encRequest = ccav.encrypt(data,workingKey);
            var viewdata={
                secureUrl : secureUrl,
                encRequest : encRequest,
                accessCode : accessCode
            }

            res.json({
                status : 200,
                data : viewdata
            })
        }else{
            models.Orders.getThreeDigit().then(function(getid){
                var last_id = getid[0].MAXID;
                incremented_Id = parseInt(last_id)+01;
                models.Orders.create({
                    // id : incremented_Id,
                    order_id : '1',
                    user_id : req.User.id,
                    application_id : '0',
                    timestamp : functions.get_current_datetime(),
                    amount :  total_amount,
                    source : source
                }).then(function(order_created){
                    if(order_created){
                        var paymentData = {
                            merchant_id : merchant_id,
                            order_id: order_created.id,
                            currency: 'INR',
                            amount: total_amount,
                            redirect_url: "https://guattestation.studentscenter.in/api/payment/success-redirect-url",
                            cancel_url: "https://guattestation.studentscenter.in/api/payment/cancel-redirect-url",
                            language: 'EN',
                            billing_name: req.User.name,
                            billing_address: req.User.address1,
                            billing_city: req.User.city,
                            billing_state: req.User.state,
                            billing_zip: req.User.postal_code,
                            billing_country: 'India',
                            billing_tel: req.User.mobile,
                            billing_email: req.User.email,
                            // merchant_param1 : req.User.name,
                            merchant_param1 : service,
                            merchant_param2 : req.User.email,
                            merchant_param3 : source,
                            merchant_param4 : req.User.address1,
                            merchant_param5 : transaction_id
                        };
                        var bodyJson=JSON.parse(JSON.stringify(paymentData));
                        var data='';
                        var i=0;
                        for(var attr in bodyJson){
                            if (i){data=data+'&';}i=1;
                            data=data+attr+'='+encodeURIComponent(bodyJson[attr]);
                        }
                        var encRequest = ccav.encrypt(data,workingKey);
                        var viewdata={
                            secureUrl : secureUrl,
                            encRequest : encRequest,
                            accessCode : accessCode
                        }

                        res.json({
                            status : 200,
                            data : viewdata
                        })
                    }
                });
            })
        }
    });
})
});

router.post('/success-redirect-url',function(req,res){
    console.log("Success URL");
    institutionData = [];
    var ccavEncResponse='',
    ccavResponse='',
    ccavPOST = '';
    var total_amount;
    var outercounter = 0;
    var randomEnroNo;
    var bodyJson=JSON.parse(JSON.stringify(req.body));
    var data='';
    var i=0;
    var deliverType;
    for(var attr in bodyJson){
        if (i){data=data+'&';}i=1;
        data=data+attr+'='+encodeURIComponent(bodyJson[attr]);
    }



    ccavEncResponse += data;
    ccavPOST =  qs.parse(ccavEncResponse);
    var encryption = ccavPOST.encResp;
    ccavResponse = ccav.decrypt(encryption,workingKey);

    var pData = [];
    var obj = qs.parse(ccavResponse);
    var source = obj.merchant_param3
    
    if(obj.order_status == "Success"){
        models.User.getUserDetailsByemail( obj.merchant_param2 ).then(user =>{
                total_amount = obj.mer_amount;
                models.Application.findAll({
                    where :{
                        user_id : user[0].id,
                        source_from : source
                    }
                }).then(async function(applications){
                    var type;
                    institutionData = await functions.getInstitution(user[0].id);
                    institutionData.forEach(function (inst){
                        type = inst.deliveryType + type;
                    })
                    if(type.includes('digital') && type.includes('physcial')){
                        deliverType = 'digital,sealed'
                    }
                    if(type.includes('digital')){
                        deliverType = 'digital'
                    }
                    if(type.includes('physcial')){
                        deliverType = 'sealed'
                    }
                    var appStatus ;
                    var appTracker;
					var appliedfor = await functions.FetchPreviousData_applied_notPaid(user[0].id);
                    if(appliedfor.previous_data != null){
                            if(appliedfor.previous_data.Type == 'SameType'){
                                var appliationTracker =  await functions.getnotes(appliedfor.previous_data.app_id);
                                   if(appliationTracker.tracker == 'done'){
                                    if(deliverType == 'digital,sealed'){
                                        appStatus = 'accept'
                                        appTracker = 'print_signed'
                                    }
                                    if(deliverType == 'digital'){
                                        appStatus = 'accept'
                                        appTracker = 'signed'
                                    }
                                    if(deliverType == 'sealed'){
                                        appStatus = 'accept'
                                        appTracker = 'print'
                                    }
                              
                                   }else{
                                    appStatus = 'new'
                                     appTracker = 'apply'
                                   }
                            }else{
                                appStatus = 'new'
                                appTracker = 'apply'

                            }
                            
                    }else{
                        appStatus = 'new'
                        appTracker = 'apply'
                    }
                    models.Application.create({
                        tracker :appTracker,
                        status : appStatus,
                        total_amount : total_amount,
                        user_id : user[0].id,
                        source_from : source,
                        deliveryType : deliverType,
                        servicetype : obj.merchant_param1
                    }).then(function(created){
                        if(created){
                            models.Orders.findOne({
                                where:
                                {
                                    id : obj.order_id,
                                    source : source
                                }
                            }).then(function(order){
                                order.update({
                                    order_id : '1',
                                    user_id : user[0].id,
                                    application_id : created.id,
                                    timestamp : functions.get_current_datetime(),
                                    amount : total_amount,
                                    status : '1'
                                }).then(function(order_updated){

                                    models.Transaction.findOne({
                                        where  :{
                                            tracking_id  : obj.tracking_id
                                        }
                                    }).then(function (checktranasction){
                                    setTimeout(()=>{
                                        if(checktranasction){
                                            res.redirect("https://guattestation.studentscenter.in/app/#/pages/PaymentSuccess?order_id="+obj.order_id);
                                        }else{
                                            models.Transaction.create({
                                                order_id : order_updated.id,
                                                tracking_id : obj.tracking_id,
                                                bank_ref_no : obj.bank_ref_no,
                                                order_status : obj.order_status,
                                                payment_mode : 'online',
                                                currency : 'INR',
                                                amount : total_amount,
                                                billing_name : user[0].name,
                                            // billing_address : user.address1,
                                                //billing_city : user.city,
                                                //billing_state : user.state,
                                                //billing_zip : user.postal_code,
                                                //billing_country : user.country_birth,
                                                billing_tel : user[0].mobile,
                                                billing_email : user[0].email,
                                                merchant_param1 : obj.merchant_param1,
                                                merchant_param2 : obj.merchant_param2,
                                                merchant_param3 : obj.merchant_param3,
                                                merchant_param4 : obj.merchant_param4,
                                                merchant_param5 : obj.merchant_param5,
                                                split_status : '-1',
                                                source : source
                                            }).then(async function(transaction_created){
                                                if(transaction_created){
                                                    // models.User_Course_Enrollment_Detail_Attestation.getListLastData().then(async function(last){
                                                    // var last_id = last[0].enrollment_no;
                                                    // randomEnroNo = parseInt(last_id)+01;
                                                    randomEnroNo = '';
                                                    let ucedcreate=await functions.ucedcreated(created.id,user[0].id,randomEnroNo,source);
                                                    let inwardno=await functions.createinward(created.id,user[0].id,'A/');
                                                    if(ucedcreate && inwardno){
                                                    
                                                          var userName = user[0].name + ' ' + user[0].surname;
                                                          updateAppId(user[0].id, user[0].educationalDetails,user[0].instructionalField,created.id);
                                                         var desc = user.name+"( "+user.email+" ) made payment ";
                                                         var activity = "Payment";
                                                         var applicationId = created.id;
                                                         functions.activitylog(user.id, activity, desc, applicationId);

                                                setTimeout(()=>{
                                                    sendEmailStudent(user[0].id,user[0].email,userName,created.id);
                                                    if(user[0].educationalDetails == true)
                                                        // sendEmailInstitute(user[0].id,userName,created.id);
                                                    if(user[0].instructionalField == true)
                                                    sendEmailInstituteInstructional(user[0].id,userName,created.id);
                                                },2000)
                                                res.redirect("https://guattestation.studentscenter.in/app/#/pages/PaymentSuccess?order_id="+obj.order_id);

                                               }
                            
                                        //   });
                                                }
                                            });
                                        }
                                    },8000)
                                    })

                                });
                            });
                        }
                    })
                })
       
        });
    }else{
        models.Orders.findOne({
            where:
            {
                id : obj.order_id,
                source : source
            }
        }).then(function(ord){
            if(obj.order_status == 'Failure'){
                ord.update({
                    status : '-1'
                }).then(function(updated){
                    res.redirect("https://guattestation.studentscenter.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Timeout'){
                ord.update({
                    status : '2'
                }).then(function(updated){
                    res.redirect("https://guattestation.studentscenter.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Aborted'){
                ord.update({
                    status : '3'
                }).then(function(updated){
                    res.redirect("https://guattestation.studentscenter.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Invalid'){
                ord.update({
                    status : '4'
                }).then(function(updated){
                    res.redirect("https://guattestation.studentscenter.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else{
                ord.update({
                    status : '5'
                }).then(function(updated){
                    res.redirect("https://guattestation.studentscenter.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }
        });
    }

    function sendEmailInstituteInstructional(user_id,user_name,app_id){
        var collegeData = [];
        var userMarkLists = [];
        models.InstructionalDetails.findAll({
            where :{
                userId : user_id
            }
        }).then(function(instructional){
            models.userMarkList.findAll({
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
                    models.College.findOne({
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
                                    //console.log("----1111----");
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                    collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                    flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                    break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/documents/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                    console.log("collegeData == " + JSON.stringify(collegeData));
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
    function sendEmailStudent(user_id,user_email,user_name,app_id){
        var collegeData = [];
        models.Applied_For_Details.findAll({
            where :{
                user_id : user_id,
                app_id : app_id,
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
                                    console.log("id : "+ userTranscript.collegeId)
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
                    request.post(constant.BASE_URL_SENDGRID + 'applicationGeneratedNotification_gu', {
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
	async function updateAppId(user_id,educationalDetails,instructionalField,app_id){
        var appliedforddetails = await functions.setAppId(app_id,user_id,'AppliedForDetails');
        if(appliedforddetails){
            var getApplied = await functions.getApplied(user_id,app_id);
            var usermarklist = await functions.setAppId(app_id,user_id ,'UserMarklist');
            if(getApplied.instructionalField == 1){
                    var instructional = await functions.setAppId(app_id,user_id ,'Instructional');
                    var marksheets = await functions.setAppId(app_id,user_id ,'Marksheets');
            }else{
                if(getApplied.attestedfor.includes('marksheet') || getApplied.attestedfor.includes('newmark')){
                    var marksheets = await functions.setAppId(app_id,user_id ,'Marksheets');
               }
               if(getApplied.attestedfor.includes('degree')){
                    var degree = await functions.setAppId(app_id,user_id ,'Degree');
               }
               if(getApplied.attestedfor.includes('transcript')){
                    var transcript = await functions.setAppId(app_id,user_id ,'Transcript');
               }
            }

            var purpose = await functions.setAppId(app_id,user_id ,'purpose');
        }
        var getEmail_doc =  await functions.getEmailedDocs_insert();
           if(getEmail_doc != ''){
            var emailed_docs = await functions.setAppId_email_docs(app_id)
           }
    }
});

router.post('/setApp_id',async function(req,res){
    console.log('setApp_id ')
    var app_id = req.body.app_id
    var user_id = req.body.user_id
    var appliedforddetails = await functions.setAppId(app_id,user_id,'AppliedForDetails');
        if(appliedforddetails){
            var getApplied = await functions.getApplied(user_id,app_id);
            var usermarklist = await functions.setAppId(app_id,user_id ,'UserMarklist');
            if(getApplied.instructionalField == 1){
                    var instructional = await functions.setAppId(app_id,user_id ,'Instructional');
                    var marksheets = await functions.setAppId(app_id,user_id ,'Marksheets');
            }else{
                if(getApplied.attestedfor.includes('marksheet') || getApplied.attestedfor.includes('newmark')){
                    var marksheets = await functions.setAppId(app_id,user_id ,'Marksheets');
               }
               if(getApplied.attestedfor.includes('degree')){
                    var degree = await functions.setAppId(app_id,user_id ,'Degree');
               }
               if(getApplied.attestedfor.includes('transcript')){
                    var transcript = await functions.setAppId(app_id,user_id ,'Transcript');
               }
            }

            var purpose = await functions.setAppId(app_id,user_id ,'purpose');
        }
})

router.post('/previous_data',async function(req,res){
    console.log('/api/payment/previous_data/api/payment/previous_data')
    var user_id ='4036'
    var appliedfor = await functions.FetchPreviousData_applied_notPaid(user_id);
    console.log('appliedforappliedfor' + JSON.stringify(appliedfor.previous_data))
    console.log('appliedforappliedfor' + JSON.stringify(appliedfor.previous_data.Type))
})

router.post('/getQuickInvoice',function(req,res){
    console.log('getQuickInvoice',req.body.data)
    var data=req.body.data

    var customerValues= {
        "customer_name": data.customer_name,
        "customer_email_id" :data.customer_email_id,
        "customer_email_subject" : 'Payment Link',
        "valid_for" : '10',
        "valid_type" :'days',
        "currency" : 'INR',
        "amount" :data.amount,
        "invoice_description" :'Kindly check the payment link as under.',
        "sub_acc_id" : 'EDU',
        "customer_mobile_no" : data.customer_mobile_no,
        "bill_delivery_type" : 'email',
        "merchant_reference_no" : data.merchant_reference_no
    }
    console.log('data.bill_delivery_type',customerValues)

    var encydate = ccav.encrypt(JSON.stringify(customerValues),workingKey);
    console.log('encydate',encydate)

    setTimeout(function(){

    request.post(
    "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+encydate+"&access_code="+accessCode+"&command=generateQuickInvoice&request_type=JSON&response_type=JSON&version=1.2",

    function (error, response, body) {
        var payout_summary = qs.parse(response.body)
        var dec_status = ccav.decrypt(payout_summary.enc_response,workingKey)
        var json = JSON.parse(dec_status)
        // var data =json.Payout_Summary_Result.payout_summary_list.payout_summary_details;

        console.log('datadatadata',json)
        // data.forEach(function(application) {
        //     var pay_id = {
        //         "pay_id": application.pay_Id,
        //     }
        // this.pay_id = ccav.encrypt(JSON.stringify(pay_id),workingKey);

            if(json.invoice_status == 0){
                res.json({
                    status : 200,
                    data : data
                })
            }else{
                res.json({
                    status : 400
                })

            }

    }
    );
},6000)

})


router.get('/getinvoicedetails',function(req,res){
    console.log('/getinvoicedetails',req.query.details);
    models.Application.find({
        where  :{
            id : req.query.details,
            source_from  : 'guattestation'
        }
    }).then(function (userdetails){
        console.log('userdetails',userdetails);
        models.User.find({
            where :{
                id : userdetails.user_id
            }
        }).then(function (studentdetails){
            console.log('studentdetails',studentdetails);
            if(studentdetails){
                res.json({
                    status : 200,
                    data : studentdetails
                })
            }else{
                res.json({
                    status : 400,
                })
            }

        })
    })
})

router.post('/cancel-redirect-url',function(req,res){
    var ccavEncResponse='',
    ccavResponse='',
    ccavPOST = '';

    var bodyJson=JSON.parse(JSON.stringify(req.body));
    var data='';
    var i=0;
    for(var attr in bodyJson){
        if (i){data=data+'&';}i=1;
        data=data+attr+'='+encodeURIComponent(bodyJson[attr]);
    }



    ccavEncResponse += data;
    ccavPOST =  qs.parse(ccavEncResponse);
    var encryption = ccavPOST.encResp;
    ccavResponse = ccav.decrypt(encryption,workingKey);

    var pData = [];
    var obj = qs.parse(ccavResponse);
    console.log("obj.order_id----->"+obj.order_id);
    console.log("obj.order_status----->"+obj.order_status);
    models.Orders.find({
        where:{
            id : obj.order_id,
            [Op.or]:[{
										source:'guattestation',
									 },
									 {
										source:'gumoi',
									 }]
        }
    }).then(function(ord){
        models.User.find({
            where:{
                id : ord.user_id
            }
        }).then(function(user){
            if(obj.order_status == 'Aborted' && user.current_location == 'OUTSIDE'){
                ord.update({
                    status : '3'
                }).then(function(updated){
                })
            }

        })
    })
   res.redirect("https://guattestation.studentscenter.in/app/#/pages/FirstCancel");
});


router.post('/PaymentDetails',middlewares.getUserInfo,function(req,res){
  //
  console.log('PaymentDetails');
   var view_data = {};
   models.Feedback.find({
       where:{
           user_id : req.User.id,
           [Op.or]:[{
										source:'guattestation',
									 },
									 {
										source:'gumoi',
									 }]
       }
   }).then(function(feedback){
       if(feedback){
           view_data.feedback = true;
       }else{
           view_data.feedback = false;
       }
       models.Orders.findOne({
           where:
           {
               id : req.body.order_id,
               [Op.or]:[{
										source:'guattestation',
									 },
									 {
										source:'gumoi',
									 }]
           }
       }).then(function(order){
           if(order){
               models.Transaction.findOne({
                   where:
                   {
                       order_id : order.id
                   }
               }).then(function(transaction){
                   if(transaction){

                           view_data.transaction_id = transaction.merchant_param5;
                           view_data.payment_amount = transaction.amount;
                           view_data.payment_status = transaction.order_status;
                           view_data.payment_date_time = transaction.created_at;
                           view_data.application_id = order.application_id;
                           view_data.user_id = req.User.id;
                           res.json({
                               status:200,
                               data : view_data
                           })

                   }
               })
           }
       })
   })
});

router.post('/OnlinePaymentChallan', middlewares.getUserInfo, function(req, res) {
    console.log("OnlinePaymentChallanOnlinePaymentChallan");
    //
     var user_id = req.body.user_id;
     var payment_amount = req.body.payment_amount;
     var transaction_id = req.body.transaction_id;
     var date_time = req.body.date_time;
     var status_payment = req.body.status_payment;
     var application_id = req.body.application_id;
     var fee_amount;
     var gst_amount;
     var total_amount;
     // if(payment_amount == 536){
     //     fee_amount = 500;
     //     gst_amount = 36;
     //     total_amount = 536;
     // }else if(payment_amount == 8308){
     //     fee_amount = 7200;
     //     gst_amount = 518;
     //     total_amount = 8308;
     // }
     models.Orders.findOne({
         where :{
             application_id : req.body.application_id,
             order_id : 1,
             status : '1',
             [Op.or]:[{
										source:'guattestation',
									 },
									 {
										source:'gumoi',
									 }]
         }
     }).then(function(orders){
         if(orders){
             models.Transaction.findOne({
                 where:
                 {
                     merchant_param5 : transaction_id
                 }
             }).then(function(trans){
                 self_PDF.online_payment_challan(user_id, application_id, payment_amount, transaction_id, date_time, status_payment, fee_amount, gst_amount, total_amount, orders.id, req.User.email,function(err){
                     if(err) {
              //
                         res.send({ status: 400,data :err})
                     }else{
                         setTimeout(function(){
                             //TODO add to constants
                             res.send({ status: 200,data: constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+application_id+"_Attestation_Payment_Challan.pdf"});
                         },3000);
                     }
                 });
             })
         }
     })
 });

router.get('/downloadOld',middlewares.getUserInfo, function (req, res) {
     var file_name= req.query.file_name;
     var userId = req.User.id;

     var stringReplaced = String.raw``+file_name.split('\\').join('/')


     var n = stringReplaced.includes("/");
     if(n == true){
         file_name = stringReplaced.split("/").pop();
     }
     //TODO
     const downloadData = constant.FILE_LOCATION +'public/upload/documents/'+userId+'/'+ file_name;
     res.download(downloadData);
});

router.get('/download', function (req, res) {
    var file_name = req.query.file_name;
    var userId = req.user.id;
    const downloadData = constant.FILE_LOCATION + "public/upload/documents/" + userId + "/" + file_name;
    console.log("downloadData"+downloadData)
    res.download(downloadData);
});

router.get('/download_applicationForm', function (req, res) {
    // https://guattestation.studentscenter.in/api/images/GU-AttestationManual.pdf
    // constant.FILE_LOCATION + "public/images/GU-AttestationManual.pdf"
    // var file_name = constant.FILE_LOCATION + "public/images/GU-AttestationManual.pdf"
    var file_name = req.query.file_name
    const downloadData = file_name;
    console.log("downloadData"+downloadData)
    res.download(downloadData);
});
router.get('/download_', function (req, res) {
    // https://guattestation.studentscenter.in/api/images/GU-AttestationManual.pdf'guattestation
    // constant.FILE_LOCATION + "public/images/GU-AttestationManual.pdf"
    var file_name = constant.FILE_LOCATION + "public/images/GU-AttestationManual.pdf"
    // var file_name = req.query.file_name
    const downloadData = file_name;
    console.log("downloadData"+downloadData)
    res.download(downloadData);
});

router.get('/getAllPayments',middlewares.getUserInfo, function (req, res) {
   var userId = req.User.id;
   var data = [];
   models.Orders.findAll({
       where:
       {
           user_id : userId,
           status : '1',
           [Op.or]:[{
										source:'guattestation',
									 },
									 {
										source:'gumoi',
									 }]
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

router.get('/getApplWisePayments',middlewares.getUserInfo, function (req, res) {
    var userId = req.User.id;
    var appl_id  = req.query.appl_id;
    console.log("appl_id===>"+appl_id);
    var data = [];
    if(req.query.appl_id!="840"){
        models.Orders.findAll({
            where:
            {
                user_id : userId,
                status : '1',
                application_id : appl_id,
                [Op.or]:[{
										source:'guattestation',
									 },
									 {
										source:'gumoi',
									 }]
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
                            order_id : trans.order_id,
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
    }else if(req.query.appl_id == "840"){
        models.Transaction.find({
            where:
            {
                tracking_id : "109865187451"
            }
        }).then(function(trans){
            data.push({
                order_id : trans.order_id,
                transaction_id : trans.merchant_param5,
                amount : trans.amount,
                currency : trans.currency,
                payment_date : trans.created_at,
                application_id : order.application_id
            });
            res.json({
                status: 200,
                message: 'Payment Details Retrive Successfully',
                data: data
                });
        });
    }
 });


router.get('/getPaymentDetails',function(req,res){
    var data = [];
    var counter = 0;
    if(req.query.tab_type == '1stPayment'){
        models.Transaction.getPaymentDetails(req.query.tab_type).then(function(applications) {
            if(applications != null) {
                applications.forEach(function(application) {
                    counter ++;
                    var statusTrackerData = {
                        "reference_no": application.tracking_id,
                        //"order_no": application.order_id
                    }

                    if(counter < 11){
                        var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);
                        var request_url = "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2"
                        console.log("request_url====>"+request_url);
                        request.post(request_url
                            ,
                            function (error, response, body) {
                                //console.log("response.body====>"+response.body);
                                var statustracker_obj = qs.parse(response.body);
                                console.log("statustracker_obj====>"+statustracker_obj.status);
                                if(statustracker_obj.status == '0'){

                                    var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                                    //console.log("statustracker_obj====>"+statustracker_obj);

                                    var status_pay = JSON.parse(dec_status);
                                    //console.log('status_pay========'+JSON.stringify(status_pay))

                                    var order_fee_perc_value = status_pay.order_fee_perc_value;
                                    // console.log('order_fee_perc_value========'+order_fee_perc_value)

                                    var order_tax = status_pay.order_tax;
                                    // console.log('order_tax========'+order_tax)

                                    var order_fee_flat = status_pay.order_fee_flat;
                                    // console.log('order_fee_flat========'+order_fee_flat)

                                    var ccavenue_share = order_fee_perc_value + order_tax + order_fee_flat;
                                    console.log('ccavenue_share========'+ccavenue_share)
                                    data.push({
                                        order_id : application.order_id,
                                        tracking_id : application.tracking_id,
                                        name : application.name,
                                        email : application.email,
                                        amount : application.amount,
                                        ccavenue_share : parseFloat(ccavenue_share).toFixed(2),
                                        available_amount : parseFloat(application.amount - ccavenue_share).toFixed(2),
                                        admission_cancel : application.admission_cancel
                                    });
                                }
                            }
                        )

                    }

                });



                setTimeout(function(){
                    console.log("data.length=====>"+data.length);
                    var sort_data = data.sort(function(a, b){return (b.order_id) - (a.order_id)});
                    res.json({
                        status: 200,
                        message: '2ndSplit payment tab data loaded',
                        data: data
                    });
                }, 15000);
            }
            // if(applications != null) {
            //  applications.forEach(function(application) {
            //      data.push({
            //          order_id : application.order_id,
            //          tracking_id : application.tracking_id,
            //          name : application.name,
            //          email : application.email,
            //          // uni_share : parseFloat(application.b),
            //          // edu_share : parseFloat(application.a),
            //          // cc_share : (parseFloat(application.amount) - (parseFloat(application.b) + parseFloat(application.a))).toFixed(2)
            //      });
            //  });
            //  setTimeout(function(){
            //      res.json({
            //          status: 200,
            //          message: '1st payment tab data loaded',
            //          data: data
            //      });
            //  }, 1000);
            // }
        });
    }else if(req.query.tab_type == '1stRefund'){
        models.Transaction.getPaymentDetails(req.query.tab_type).then(function(applications) {
            if(applications != null) {
                applications.forEach(function(application) {
                    var change_split_status;
                    if(application.change_split_payout_status == '1'){
                        change_split_status = 'Changed Y to N';
                    }else{
                        change_split_status = '-'
                    }
                    data.push({
                        order_id : application.order_id,
                        tracking_id : application.tracking_id,
                        name : application.name,
                        exists : application.refund_status,
                        email : application.email,
                        uni_share : parseFloat(application.b),
                        edu_share : parseFloat(application.a),
                        cc_share : (parseFloat(application.amount) - (parseFloat(application.b) + parseFloat(application.a))).toFixed(2),
                        change_split_payout_status : change_split_status
                    });
                });
                setTimeout(function(){
                    res.json({
                        status: 200,
                        message: '1st Refund payment tab data loaded',
                        data: data
                    });
                }, 3000);
            }
        });
    }else if(req.query.tab_type == 'multiplePayment'){
        models.Transaction.getPaymentDetails(req.query.tab_type).then(function(applications) {
            if(applications != null) {
                applications.forEach(function(application) {
                    counter ++;
                    var statusTrackerData = {
                        "reference_no": application.tracking_id,
                        //"order_no": application.order_id
                    }

                    var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);
                    request.post(
                        "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2",
                        function (error, response, body) {
                            //console.log("response.body====>"+response.body);
                            var statustracker_obj = qs.parse(response.body);
                            //console.log("statustracker_obj====>"+statustracker_obj);
                            if(statustracker_obj.status == '0'){

                                var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                                //console.log("statustracker_obj====>"+statustracker_obj);

                                var status_pay = JSON.parse(dec_status);
                                //console.log('status_pay========'+JSON.stringify(status_pay))

                                var order_fee_perc_value = status_pay.order_fee_perc_value;
                                // console.log('order_fee_perc_value========'+order_fee_perc_value)

                                var order_tax = status_pay.order_tax;
                                // console.log('order_tax========'+order_tax)

                                var order_fee_flat = status_pay.order_fee_flat;
                                // console.log('order_fee_flat========'+order_fee_flat)

                                var ccavenue_share = order_fee_perc_value + order_tax + order_fee_flat;
                                // console.log('ccavenue_share========'+ccavenue_share)
                                data.push({
                                    order_id : application.order_id,
                                    tracking_id : application.tracking_id,
                                    name : application.name,
                                    email : application.email,
                                    amount : application.amount,
                                    ccavenue_share : parseFloat(ccavenue_share).toFixed(2),
                                    available_amount : parseFloat(application.amount - ccavenue_share).toFixed(2),
                                    admission_cancel : application.admission_cancel
                                });
                            }
                        }
                    )

                });



                setTimeout(function(){
                    //console.log("data.length=====>"+data.length);
                    var sort_data = data.sort(function(a, b){return (b.order_id) - (a.order_id)});
                    res.json({
                        status: 200,
                        message: '2ndSplit payment tab data loaded',
                        data: data
                    });
                }, 10000);
            }
        });
    }
    //else if(req.query.tab_type == '2ndSplit'){
    //     models.Transaction.getPaymentDetails(req.query.tab_type).then(function(applications) {
    //         console.log('applications=='+applications.length)
    //         if(applications != null) {
    //             applications.forEach(function(application) {
    //                 counter ++;
    //                 var statusTrackerData = {
    //                     "reference_no": application.tracking_id,
    //                     //"order_no": application.order_id
    //                 }

    //                 var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);
    //                 request.post(
    //                     "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2",
    //                     function (error, response, body) {
    //                         var statustracker_obj = qs.parse(response.body);
    //                         var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);

    //                         var status_pay = JSON.parse(dec_status);
    //                         // console.log('status_pay========'+JSON.stringify(status_pay))
    //                         var order_fee_perc_value = status_pay.order_fee_perc_value;
    //                         // console.log('order_fee_perc_value========'+order_fee_perc_value)

    //                         var order_tax = status_pay.order_tax;
    //                         // console.log('order_tax========'+order_tax)

    //var order_fee_flat = status_pay.order_fee_flat;
    // console.log('order_fee_flat========'+order_fee_flat)

    //                         var ccavenue_share = order_fee_perc_value + order_tax + order_fee_flat;
    //                         // console.log('ccavenue_share========'+ccavenue_share)
    //                             data.push({
    //                                 order_id : application.order_id,
    //                                 tracking_id : application.tracking_id,
    //                                 name : application.name,
    //                                 email : application.email,
    //                                 amount : application.amount,
    //                                 ccavenue_share : parseFloat(ccavenue_share).toFixed(2),
    //                                 available_amount : parseFloat(application.amount - ccavenue_share).toFixed(2),
    //                                 admission_cancel : application.admission_cancel
    //                             });

    //                     }
    //                 )

    //             });



    //             setTimeout(function(){
    //                 res.json({
    //                     status: 200,
    //                     message: '2ndSplit payment tab data loaded',
    //                     data: data
    //                 });
    //             }, 10000);
    //         }

    //     })
    // }else{
    // }
});

router.post('/autoSplit',function(req,res){
console.log("reached autoSplit ");

models.Transaction.getUnSplit().then(function(applications) {

    applications.forEach(function(application) {


    console.log("application > "+JSON.stringify(application))
    console.log("application.tracking_id > "+application.tracking_id);

    //console.log();
    // var statusTrackerData = {
    //     "reference_no": application.tracking_id,
    //     //"order_no": application.order_id
    // }

    var statusTrackerData = {
        "reference_no": application.tracking_id,
        //"order_no": application.order_id
    }
    console.log(statusTrackerData);
    var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);
    var request_url = "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2"

    request.post(request_url,
        function (error, response, body) {
           // setTimeout(function(){

            //console.log("response.body====>"+response.body);
            var statustracker_obj = qs.parse(response.body);
            //console.log("statustracker_obj====>"+statustracker_obj.status);
            if(statustracker_obj.status == '0'){

                var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                //console.log("statustracker_obj====>"+statustracker_obj);

                var status_pay = JSON.parse(dec_status);
                console.log('status_pay========'+JSON.stringify(status_pay))

                var order_capt_amt = status_pay.order_capt_amt;
                 console.log('order_capt_amt========'+order_capt_amt);

                var order_fee_perc_value = status_pay.order_fee_perc_value;
                 console.log('order_fee_perc_value========'+order_fee_perc_value)

                var order_tax = status_pay.order_tax;
                 console.log('order_tax========'+order_tax)

                var order_fee_flat = status_pay.order_fee_flat;
                console.log('order_fee_flat========'+order_fee_flat)

                var ccavenue_share = order_fee_perc_value + order_tax + order_fee_flat;
                console.log('ccavenue_share========'+ccavenue_share)
            }
        //}, 2000);

         var reference_no = application.tracking_id;
         var ccavenue_share = ccavenue_share;
         var uni_share = 303;
         var edu_share = order_capt_amt - ccavenue_share - uni_share ;



    	var data = [];
    	console.log('reference_no======'+reference_no)
    	console.log('ccavenue_share====='+ccavenue_share)
    	console.log('edu_share====='+edu_share)
    	console.log('uni_share====='+uni_share)


        if(edu_share != 0){
            data.push({
                'splitAmount':edu_share,
                'subAccId':'EDU'
            });
        }

        if(uni_share != 0){
            data.push({
                'splitAmount':uni_share,
                'subAccId':'UOM'
            });
        }
        var splitPaymentData = {
            'reference_no': reference_no,
            'split_tdr_charge_type':'M',
            'merComm': ccavenue_share,
            'split_data_list': data

        }

        //var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),splitworkingKey);

        var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),workingKey);

        request.post(
            // "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+splitaccessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
            "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
            function (error, response, body) {
                var split_obj = qs.parse(response.body);
                console.log('split_obj.error_code========'+JSON.stringify(split_obj))
                console.log('split_obj.status========'+split_obj.status)
                if(split_obj.status == '1'){
                    models.Transaction.find({
                        where:
                        {
                            tracking_id : reference_no
                        }
                    }).then(function(splitTrans){
                        if(splitTrans){

                            splitTrans.update({
                                split_status : '-1'
                            }).then(function(splitTrans_updated){
                                res.json({
                                    status : 400
                                });
                            })
                        }else{

                        }
                    });
                }else{
                    //var dec_split = ccav.decrypt(split_obj.enc_response,splitworkingKey);
                    var dec_split = ccav.decrypt(split_obj.enc_response,workingKey);

                    var pay = JSON.parse(dec_split);
                    console.log('pay========'+JSON.stringify(pay))
                    var val = pay.Create_Split_Payout_Result;
                    console.log('val========'+JSON.stringify(val))
                    var split_status = val.status;
                    console.log('split_status========'+split_status)
                    models.Transaction.find({
                        where:
                        {
                            tracking_id : reference_no
                        }
                    }).then(function(split_trans){
                        if(split_trans){
                            if(split_status == '1'){
                                var split_error = val.error_desc + " Error Code : "+ val.error_code;
                                split_trans.update({
                                    split_status : '-1'
                                }).then(function(split_trans_updated){
                                    res.json({
                                        status : 400,
                                        data : split_error
                                    });
                                })
                            }else if(split_status == '0'){

                                split_trans.update({
                                    a : edu_share,
                                    b : uni_share,
                                    cc_share : ccavenue_share,
                                    split_status : '1'
                                }).then(function(split_trans_updated){
                                    models.Orders.find({
                                        where :{
                                            id : split_trans.order_id,
                                            [Op.or]:[{
                                                source:'guattestation',
									 },
									 {
										source:'gumoi',
									 }]
                                        }
                                    }).then(function(order){
                                        var data = split_trans.order_id+' Payment Split done for '+split_trans.merchant_param2 + ' by '+req.User.name;
                                        functions.activitylog(req.User.id, ' Split Payment', data, order.application_id);
                                        res.json({
                                            status : 200
                                        });
                                    });
                                })
                            }
                        }else{

                        }
                    });
                }
        });
        }
    )

});

});


// var reference_no = req.body.reference_no;
// 	var ccavenue_share = req.body.ccavenue_share;
// 	var edu_share = req.body.edu_share;
// 	var uni_share = req.body.uni_share;
// 	var data = [];
// 	console.log('reference_no======'+reference_no)
// 	console.log('ccavenue_share====='+ccavenue_share)
// 	console.log('edu_share====='+edu_share)
// 	console.log('uni_share====='+uni_share)
// 	if(edu_share != 0){
// 		data.push({
// 			'splitAmount':edu_share,
// 			'subAccId':'EDU'
// 		});
// 	}

// 	if(uni_share != 0){
// 		data.push({
// 			'splitAmount':uni_share,
// 			'subAccId':'UOM'
// 		});
// 	}
// 	var splitPaymentData = {
// 		'reference_no': reference_no,
// 		'split_tdr_charge_type':'M',
// 		'merComm': ccavenue_share,
// 		'split_data_list': data

// 	}

// 	//var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),splitworkingKey);

// 	var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),workingKey);

// 	request.post(
// 		// "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+splitaccessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
// 		"https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
// 		function (error, response, body) {
// 			var split_obj = qs.parse(response.body);
// 			console.log('split_obj.error_code========'+JSON.stringify(split_obj))
// 			console.log('split_obj.status========'+split_obj.status)
// 			if(split_obj.status == '1'){
// 				models.Transaction.find({
// 					where:
// 					{
// 						tracking_id : reference_no
// 					}
// 				}).then(function(splitTrans){
// 					if(splitTrans){

// 						splitTrans.update({
// 							split_status : '-1'
// 						}).then(function(splitTrans_updated){
// 							res.json({
// 								status : 400
// 							});
// 						})
// 					}else{

// 					}
// 				});
// 			}else{
// 				//var dec_split = ccav.decrypt(split_obj.enc_response,splitworkingKey);
// 				var dec_split = ccav.decrypt(split_obj.enc_response,workingKey);

// 				var pay = JSON.parse(dec_split);
// 				console.log('pay========'+JSON.stringify(pay))
// 				var val = pay.Create_Split_Payout_Result;
// 				console.log('val========'+JSON.stringify(val))
// 				var split_status = val.status;
// 				console.log('split_status========'+split_status)
// 				models.Transaction.find({
// 					where:
// 					{var reference_no = req.body.reference_no;
// 	var ccavenue_share = req.body.ccavenue_share;
// 	var edu_share = req.body.edu_share;
// 	var uni_share = req.body.uni_share;
// 	var data = [];
// 	console.log('reference_no======'+reference_no)
// 	console.log('ccavenue_share====='+ccavenue_share)
// 	console.log('edu_share====='+edu_share)
// 	console.log('uni_share====='+uni_share)
// 	if(edu_share != 0){
// 		data.push({
// 			'splitAmount':edu_share,
// 			'subAccId':'EDU'
// 		});
// 	}

// 	if(uni_share != 0){
// 		data.push({
// 			'splitAmount':uni_share,
// 			'subAccId':'UOM'
// 		});
// 	}
// 	var splitPaymentData = {
// 		'reference_no': reference_no,
// 		'split_tdr_charge_type':'M',
// 		'merComm': ccavenue_share,
// 		'split_data_list': data

// 	}

// 	//var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),splitworkingKey);

// 	var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),workingKey);

// 	request.post(
// 		// "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+splitaccessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
// 		"https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
// 		function (error, response, body) {
// 			var split_obj = qs.parse(response.body);
// 			console.log('split_obj.error_code========'+JSON.stringify(split_obj))
// 			console.log('split_obj.status========'+split_obj.status)
// 			if(split_obj.status == '1'){
// 				models.Transaction.find({
// 					where:
// 					{
// 						tracking_id : reference_no
// 					}
// 				}).then(function(splitTrans){
// 					if(splitTrans){

// 						splitTrans.update({
// 							split_status : '-1'
// 						}).then(function(splitTrans_updated){
// 							res.json({
// 								status : 400
// 							});
// 						})
// 					}else{

// 					}
// 				});
// 			}else{
// 				//var dec_split = ccav.decrypt(split_obj.enc_response,splitworkingKey);
// 				var dec_split = ccav.decrypt(split_obj.enc_response,workingKey);

// 				var pay = JSON.parse(dec_split);
// 				console.log('pay========'+JSON.stringify(pay))
// 				var val = pay.Create_Split_Payout_Result;
// 				console.log('val========'+JSON.stringify(val))
// 				var split_status = val.status;
// 				console.log('split_status========'+split_status)
// 				models.Transaction.find({
// 					where:
// 					{
// 						tracking_id : reference_no
// 					}
// 				}).then(function(split_trans){
// 					if(split_trans){
// 						if(split_status == '1'){
//                             var split_error = val.error_desc + " Error Code : "+ val.error_code;
// 							split_trans.update({
// 								split_status : '-1'
// 							}).then(function(split_trans_updated){
// 								res.json({
//                                     status : 400,
//                                     data : split_error
// 								});
// 							})
// 						}else if(split_status == '0'){

// 							split_trans.update({
// 								a : edu_share,
// 								b : uni_share,
// 								cc_share : ccavenue_share,
// 								split_status : '1'
// 							}).then(function(split_trans_updated){
// 								models.Orders.find({
// 									where :{
// 										id : split_trans.order_id
// 									}
// 								}).then(function(order){
// 									var data = split_trans.order_id+' Payment Split done for '+split_trans.merchant_param2 + ' by '+req.User.name;
// 									functions.activitylog(req.User.id, ' Split Payment', data, order.application_id);
// 									res.json({
// 										status : 200
// 									});
// 								});
// 							})
// 						}
// 					}else{

// 					}
// 				});
// 			}
// 	});
// 						tracking_id : reference_no
// 					}
// 				}).then(function(split_trans){
// 					if(split_trans){
// 						if(split_status == '1'){
//                             var split_error = val.error_desc + " Error Code : "+ val.error_code;
// 							split_trans.update({
// 								split_status : '-1'
// 							}).then(function(split_trans_updated){
// 								res.json({
//                                     status : 400,
//                                     data : split_error
// 								});
// 							})
// 						}else if(split_status == '0'){

// 							split_trans.update({
// 								a : edu_share,
// 								b : uni_share,
// 								cc_share : ccavenue_share,
// 								split_status : '1'
// 							}).then(function(split_trans_updated){
// 								models.Orders.find({
// 									where :{
// 										id : split_trans.order_id
// 									}
// 								}).then(function(order){
// 									var data = split_trans.order_id+' Payment Split done for '+split_trans.merchant_param2 + ' by '+req.User.name;
// 									functions.activitylog(req.User.id, ' Split Payment', data, order.application_id);
// 									res.json({
// 										status : 200
// 									});
// 								});
// 							})
// 						}
// 					}else{

// 					}
// 				});
// 			}
// 	});
res.send("ok");
})


router.post('/proceedSplit',middlewares.getUserInfo,function(req,res){
	var reference_no = req.body.reference_no;
	var ccavenue_share = req.body.ccavenue_share;
	var edu_share = req.body.edu_share;
	var uni_share = req.body.uni_share;
	var data = [];
	console.log('reference_no======'+reference_no)
	console.log('ccavenue_share====='+ccavenue_share)
	console.log('edu_share====='+edu_share)
	console.log('uni_share====='+uni_share)
	if(edu_share != 0){
		data.push({
			'splitAmount':edu_share,
			'subAccId':'EDU'
		});
	}

	if(uni_share != 0){
		data.push({
			'splitAmount':uni_share,
			'subAccId':'UOM'
		});
	}
	var splitPaymentData = {
		'reference_no': reference_no,
		'split_tdr_charge_type':'M',
		'merComm': ccavenue_share,
		'split_data_list': data

	}

	//var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),splitworkingKey);

	var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),workingKey);

	request.post(
		// "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+splitaccessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
		"https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
		function (error, response, body) {
			var split_obj = qs.parse(response.body);
			console.log('split_obj.error_code========'+JSON.stringify(split_obj))
			console.log('split_obj.status========'+split_obj.status)
			if(split_obj.status == '1'){
				models.Transaction.find({
					where:
					{
						tracking_id : reference_no
					}
				}).then(function(splitTrans){
					if(splitTrans){

						splitTrans.update({
							split_status : '-1'
						}).then(function(splitTrans_updated){
							res.json({
								status : 400
							});
						})
					}else{

					}
				});
			}else{
				//var dec_split = ccav.decrypt(split_obj.enc_response,splitworkingKey);
				var dec_split = ccav.decrypt(split_obj.enc_response,workingKey);

				var pay = JSON.parse(dec_split);
				console.log('pay========'+JSON.stringify(pay))
				var val = pay.Create_Split_Payout_Result;
				console.log('val========'+JSON.stringify(val))
				var split_status = val.status;
				console.log('split_status========'+split_status)
				models.Transaction.find({
					where:
					{
						tracking_id : reference_no
					}
				}).then(function(split_trans){
					if(split_trans){
						if(split_status == '1'){
                            var split_error = val.error_desc + " Error Code : "+ val.error_code;
							split_trans.update({
								split_status : '-1'
							}).then(function(split_trans_updated){
								res.json({
                                    status : 400,
                                    data : split_error
								});
							})
						}else if(split_status == '0'){

							split_trans.update({
								a : edu_share,
								b : uni_share,
								cc_share : ccavenue_share,
								split_status : '1'
							}).then(function(split_trans_updated){
								models.Orders.find({
									where :{
										id : split_trans.order_id,
                                        [Op.or]:[{
                                            source:'guattestation',
									 },
									 {
										source:'gumoi',
									 }]
									}
								}).then(function(order){
									var data = split_trans.order_id+' Payment Split done for '+split_trans.merchant_param2 + ' by '+req.User.name;
									functions.activitylog(req.User.id, ' Split Payment', data, order.application_id);
									res.json({
										status : 200
									});
								});
							})
						}
					}else{

					}
				});
			}
	});
});

router.post('/proceedRefund',function(req,res){
    var data = [];
    if(req.body.edu_refund != 0){
        data.push({
            'refundAmount': req.body.edu_refund,// 8308,
            'subAccId':'EDU',
            'refundRefNo': req.body.order_id //  349329284//
        });
    }
    if(req.body.uni_refund != 0){
        data.push({
            'refundAmount':req.body.uni_refund,
            'subAccId':'UOM',
            'refundRefNo': req.body.order_id
        });
    }
    if(req.body.cc_refund != 0){
        data.push({
            'refundAmount':req.body.cc_refund,
            'refundRefNo': req.body.order_id +'cc'
        });
    }

    setTimeout(function(){

        var splitRefund = {
            'reference_no': req.body.reference_no, //109832664053,//
            'split_data_list': data
        }

        var split_encRequest = ccav.encrypt(JSON.stringify(splitRefund),workingKey);
        request.post(
            "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=splitRefund&request_type=JSON&response_type=JSON&version=1.2",
                // { json: {enc_request:encRequest,accessCode:splitaccessCode,command:'createSplitPayout',request_type:'JSON',response_type:'JSON',version:'1.2'}},
            function (error, response, body) {
                var split_obj = qs.parse(response.body);
                console.log("split_obj.status-------->"+split_obj.status);
                console.log('split_obj.error_code========'+JSON.stringify(split_obj))
                if(split_obj.status == '1'){

                    models.Transaction.find({
                        where:
                        {
                            tracking_id : req.body.reference_no //109832664053, //
                        }
                    }).then(function(splitTrans){
                        if(splitTrans){

                            splitTrans.update({
                                refund_status : '-1'
                            }).then(function(splitTrans_updated){
                                res.json({
                                    status : 400
                                });
                            })
                        }else{

                        }
                    });
                }else{
                    var dec_split = ccav.decrypt(split_obj.enc_response,workingKey);
                    var pay = JSON.parse(dec_split);

                    var val = pay.split_refund_result;

                    var refund_status = val.refund_status;
                    console.log("refund_status---------->"+refund_status);
                    models.Transaction.find({
                        where:
                        {
                            tracking_id : req.body.reference_no //109832664053, //
                        }
                    }).then(function(split_trans){
                        if(split_trans){
                            if(refund_status == '1'){
                                split_trans.update({
                                    refund_status : '-1'
                                }).then(function(split_trans_updated){
                                    res.json({
                                        status : 400
                                    });
                                })
                            }else if(refund_status == '0'){

                                split_trans.update({
                                    refund_status : '1',
                                    cc_refund_refer : req.body.order_id +'cc', //'349329284cc',//
                                    edulab_refund : req.body.edu_refund, //8308,//
                                    university_refund : req.body.uni_refund,
                                    cc_refund : req.body.cc_refund,
                                }).then(function(split_trans_updated){
                                    res.json({
                                        status : 200
                                    });
                                })

                            }
                        }else{

                        }
                    });
                }


            }
        );
    }, 500);
});


router.get('/splitExcel', function(req, res) {
    var counter = 0;
	var data = [];
	//var year = (req.query.year) ? req.query.year : '';
	var tab = 'accept';
    models.Transaction.getPaymentDetails('1stPayment').then(function(applications) {
        if(applications != null) {
           applications.forEach(function(application) {
               counter ++;
               var statusTrackerData = {
                   "reference_no": application.tracking_id,
                   //"order_no": application.order_id
               }

               var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);
               request.post(
                   "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2",
                   function (error, response, body) {
                       //console.log("response.body====>"+response.body);
                       var statustracker_obj = qs.parse(response.body);
                       //console.log("statustracker_obj====>"+statustracker_obj);

                       var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                       //console.log("statustracker_obj====>"+statustracker_obj);

                       var status_pay = JSON.parse(dec_status);
                       //console.log('status_pay========'+JSON.stringify(status_pay))

                       var order_fee_perc_value = status_pay.order_fee_perc_value;
                       // console.log('order_fee_perc_value========'+order_fee_perc_value)

                       var order_tax = status_pay.order_tax;
                       // console.log('order_tax========'+order_tax)

                       var order_fee_flat = status_pay.order_fee_flat;
                       // console.log('order_fee_flat========'+order_fee_flat)

                       var ccavenue_share = order_fee_perc_value + order_tax + order_fee_flat;
                       // console.log('ccavenue_share========'+ccavenue_share)
                           data.push({
                               order_id : application.order_id,
                               tracking_id : application.tracking_id,
                               name : application.name,
                               email : application.email,
                               amount : application.amount,
                               ccavenue_share : parseFloat(ccavenue_share).toFixed(2),
                               available_amount : parseFloat(application.amount - ccavenue_share).toFixed(2),
                               //admission_cancel : application.admission_cancel
                           });

                   }
               )

           });



            setTimeout(function(){
                var sort_data = data.sort(function(a, b){return (b.order_id) - (a.order_id)});
                var xls = json2xls(data);
                var file_location = constant.FILE_LOCATION+"public/upload/payment_details_in_excel/Split_Tab_Details.xlsx";
                fs.writeFileSync(file_location, xls, 'binary');
                var filepath= constant.FILE_LOCATION+'public/upload/payment_details_in_excel/Split_Tab_Details.xlsx';
                res.json({
                    status: 200,
                    data: filepath
                });
            }, 20000);
       }
   });

});

router.get('/downloadExcel', middlewares.getUserInfo,function (req, res) {
    var location= req.query.pdf;
    const downloadData = location;
    res.download(downloadData);
});

router.get('/orderlookup',function(req,res){
    var outercounter = 0;
    var ccavEncResponse='',
        ccavResponse='',
        ccavPOST = '';
    var count = 0;
    var data =[];
    var sendgrid  = require('sendgrid')(constant.SENDGRID_API_KEY);
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(constant.SENDGRID_API_KEY);
    var yesterdayNew;
    var todayNew;
    var yesterday;

    var current_date = moment().format('LT');
    var split_value = current_date.split(":");
    
    /* FOR DATABASE QUERY */
    var yesterday1     = moment().subtract(1, 'days').startOf('day');
    yesterdayNew  =  yesterday1.format('YYYY-MM-DD HH:mm:ss');
    var today1  = moment().endOf('day');
    todayNew = today1.format('YYYY-MM-DD HH:mm:ss');

    /* FOR CC REQUEST */
    var date = new Date();
    var today =  (date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear()).toString();
    yesterday =  '07-02-2023';//yesterday1.format('DD-MM-YYYY').toString();

    // models.Orders.getOrderID(yesterdayNew,todayNew).then(function(orders){
    //     console.log("orders.length---->"+orders.length);
    //     if(orders){
    //         orders.forEach(function(order){
                var statusTrackerData = {
                    //'reference_no': '108699413641',
                    //'reference_no' : '',
                    'from_date' : ''+yesterday,// '16-06-2019' ,
                    //'to_date' : ''+today,
                    'order_currency' :'INR',
                    'order_email' : '',
                    'order_fraud_status' : '',
                    'order_min_amount' : '',
                    'order_max_amount' : '',
                    'order_name' : '',
                    'order_no' : '6432', //+order.id,
                    'order_payment_type' : '',
                    'order_status' : 'Shipped',
                    'order_type' : '',
                    'order_bill_tel' : '',
                    'page_number' : '1'
                }
                var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);

                request.post(
                    "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderLookup&request_type=JSON&response_type=JSON&version=1.1",
                        function (error, response, body) {
                            count++;
                            var statustracker_obj = qs.parse(response.body);
                            if(statustracker_obj.status == '0'){
                                var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                                console.log("dec_status---->"+JSON.stringify(dec_status));

                                var status_pay = JSON.parse(dec_status);

                                if(status_pay.error_code != 51419 && status_pay.total_records > 0 ){
                                    //DATA FOUND
                                    console.log("1")
                                    models.User.getUserDetailsByemail(status_pay.order_Status_List[0].merchant_param2 ).then(users =>{
                                        console.log('users.idusers.id' + JSON.stringify(users));
	                                    models.User.findOne({
	                                        where : {
	                                            id : users.id
	                                        }
	                                    }).then(function(user){
                                            console.log("2")
	                                        models.Transaction.findOne({
	                                            where : {
	                                                order_id : status_pay.order_Status_List[0].order_no //order.id
	                                            }
	                                        }).then(function(transaction){
	                                            if(transaction){
                                                    console.log("3")
	                                                //transaction already exist but not updated in order table
	                                                models.Orders.findOne({
	                                                    where:{
	                                                        id : status_pay.order_Status_List[0].order_no,
	                                                        source:'guattestation',
	                                                    }
	                                                }).then(function(order_update){
	                                                    if(order_update.status != '1'){
	                                                        //not updated
	                                                        console.log("not updated")
	                                                        //mailOrder(order.id, user.name, user.email,'order updated',order_update.amount,transaction.tracking_id)
	                                                        order_update.update({
	                                                            status : '1',
	                                                            timestamp : functions.get_current_datetime(),
	                                                        })
	                                                    }else{
	                                                        //already updated
	                                                        console.log("not updated")
	                                                    }
	                                                })
	                                            }else{
	                                                //transaction not exist
                                                    console.log("4")
                                                    var source = status_pay.order_Status_List[0].merchant_param3;
	                                                models.Transaction.create({
	                                                    order_id : status_pay.order_Status_List[0].order_no,//order.id,
	                                                    tracking_id : status_pay.order_Status_List[0].reference_no,
	                                                    bank_ref_no : status_pay.order_Status_List[0].order_bank_ref_no,
	                                                    order_status : status_pay.order_Status_List[0].order_status ? 'Success' : status_pay.order_Status_List[0].order_status,
	                                                    payment_mode : 'online',
	                                                    currency : 'INR',
	                                                    amount : status_pay.order_Status_List[0].order_amt,
	                                                    billing_name : user.name,
	                                                    billing_address : user.address1,
	                                                    billing_city : user.city,
	                                                    billing_state : user.state,
	                                                    billing_zip : user.postal_code,
	                                                    //billing_country : user.country_birth,
	                                                    billing_tel : user.mobile,
	                                                    billing_email : user.email,
	                                                    merchant_param1 : status_pay.order_Status_List[0].merchant_param1,
	                                                    merchant_param2 : status_pay.order_Status_List[0].merchant_param2,
	                                                    merchant_param3 : status_pay.order_Status_List[0].merchant_param3,
	                                                    merchant_param4 : status_pay.order_Status_List[0].merchant_param4,
	                                                    merchant_param5 : status_pay.order_Status_List[0].merchant_param5,
	                                                    split_status : '-1',
	                                                    source : source
	                                                }).then(async function(transaction_created){
                                                        console.log("5")
	                                                    if(transaction_created){
                                                            console.log("7")
                                                            var type;
                                                            var institutionData;
                                                            var deliverType;
                                                            institutionData = await functions.getInstitution(user.id);
                                                            institutionData.forEach(function (inst){
                                                                type = inst.deliveryType + type;
                                                            })
                                                            if(type.includes('digital') && type.includes('physcial')){
                                                                deliverType = 'digital,sealed'
                                                            }
                                                            if(type.includes('digital')){
                                                                deliverType = 'digital'
                                                            }
                                                            if(type.includes('physcial')){
                                                                deliverType = 'sealed'
                                                            }
                                                            total_amount = status_pay.order_Status_List[0].order_amt;
                                                            models.Application.create({
                                                                tracker : 'apply',
                                                                status : 'new',
                                                                total_amount : total_amount,
                                                                user_id : user.id,
                                                                source_from  : 'guattestation',
                                                                deliverType  : deliverType
                                                            }).then(function(created){
                                                                if(created){
                                                                    console.log("8")
                                                                    models.Orders.findOne({
                                                                        where:
                                                                        {
                                                                            id : status_pay.order_Status_List[0].order_no,
                                                                            source:'guattestation',
                                                                        }
                                                                    }).then(function(order){
                                                                        console.log("9")
                                                                        order.update({
                                                                            application_id : created.id,
                                                                            status : '1',
                                                                            timestamp : functions.get_current_datetime(),
                                                                        }).then(function(order_updated){
                                                                            console.log("10")
                                                                            models.User_Course_Enrollment_Detail_Attestation.getListLastData().then(async function(last){
                                                                                var last_id = last[0].enrollment_no;
                                                                                var randomEnroNo;
                                                                                randomEnroNo = parseInt(last_id)+01;
                                                                                let ucedcreate=await functions.ucedcreated(created.id,user.id,randomEnroNo,source);
                                                                                let inwardno=await functions.createinward(created.id,user.id,'A/');
                                                                                console.log("11")
                                                                                if(ucedcreate && inwardno){
                                                                                    console.log("12")
                                                                                    var userName = user.name + ' ' + user.surname;
                                                                                    updateAppId(user.id, user.educationalDetails,user.instructionalField,created.id);
                                                                                    var desc = user.name+"( "+user.email+" ) made payment for Institute ( "+inst_detail.university_name+" ).";
                                                                                    var activity = "Payment";
                                                                                    var applicationId = created.id;
                                                                                    functions.activitylog(user.id, activity, desc, applicationId);
                                                                                }
                                                    
                                                                            });
                                                                        });
                                                                    });
                                                                }
                                                            })
	                                                    }else{
                                                            console.log("6")
	                                                    }
	                                                })
	                                            }
	                                        })
	                                    })
	                                })
                                }else{
                                    //NO SHIPPED DATA FOUND
                                }
                            }
                        }
                );

    //         });
    //     }else{
    //         //no order found
    //     }
    // })

    //For Mail which order_id updated in transaction table.
    async function updateAppId(user_id,educationalDetails,instructionalField,app_id){
        console.log("13")
        var appliedforddetails = await functions.setAppId(app_id,user_id,'AppliedForDetails');
        if(appliedforddetails){
            console.log("14")
            var getApplied = await functions.getApplied(user_id,app_id);
            var usermarklist = await functions.setAppId(app_id,user_id ,'UserMarklist');
            if(getApplied.instructionalField == 1){
                console.log("15")
                    var instructional = await functions.setAppId(app_id,user_id ,'Instructional');
                    var marksheets = await functions.setAppId(app_id,user_id ,'Marksheets');
            }else{
                console.log("16")
                if(getApplied.attestedfor.includes('marksheet') || getApplied.attestedfor.includes('newmark')){
                    var marksheets = await functions.setAppId(app_id,user_id ,'Marksheets');
               }
               if(getApplied.attestedfor.includes('degree')){
                    var degree = await functions.setAppId(app_id,user_id ,'Degree');
               }
               if(getApplied.attestedfor.includes('transcript')){
                    var transcript = await functions.setAppId(app_id,user_id ,'Transcript');
               }
            }

            var purpose = await functions.setAppId(app_id,user_id ,'purpose');
        }
    }

});

router.get('/remainingpayment',function(req,res){
    var paymentData = {
        merchant_id : merchant_id,
        order_id: 275,
        currency: 'INR',
        amount: 536.00,
        redirect_url: "http://etranscript.in:5000/api/payment/success-link-redirect-url",
        cancel_url: "http://etranscript.in:5000/api/payment/cancel-redirect-url",
        language: 'EN',
        billing_name: 'Kinjal',//req.User.name,
        billing_address: null,//req.User.address1,
        billing_city: null,//req.User.city,
        billing_state: null,//req.User.state,
        billing_zip: null,//req.User.postal_code,
        billing_country: null,//coun.name,
        billing_tel: '9930890649',
        billing_email: 'kinshah26@gmail.com',
        merchant_param1 : 'Kinjal',
        merchant_param2 : 'kinshah26@gmail.com',
        merchant_param3 : constant.BASE_URL,//'9930890649',
        merchant_param4 : '',
        merchant_param5 : '6728Y20M4D23T172918'
    };
    var bodyJson=JSON.parse(JSON.stringify(paymentData));
    var data='';
    var i=0;
    for(var attr in bodyJson){
        if (i){data=data+'&';}i=1;
        data=data+attr+'='+encodeURIComponent(bodyJson[attr]);
    }
   ////

    var encRequest = ccav.encrypt(data,workingKey);
        //Live payment url
    var viewdata={
        secureUrl : secureUrl,
        encRequest : encRequest,
        accessCode : accessCode
    }
    var formbody = '<form id="nonseamless" method="post" name="redirect" action="https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"/> <input type="hidden" id="encRequest" name="encRequest" value="' + encRequest + '"><input type="hidden" name="access_code" id="access_code" value="' + accessCode + '"><script language="javascript">document.redirect.submit();</script></form>';
    console.log('formbody==========>'+formbody);
    res.send(formbody);
})


router.post('/success-link-redirect-url',function(req,res){
    console.log("Success URL");

    var ccavEncResponse='',
    ccavResponse='',
    ccavPOST = '';
    var total_amount;
    var outercounter = 0;

    var bodyJson=JSON.parse(JSON.stringify(req.body));
    var data='';
    var i=0;
    for(var attr in bodyJson){
        if (i){data=data+'&';}i=1;
        data=data+attr+'='+encodeURIComponent(bodyJson[attr]);
    }



    ccavEncResponse += data;
    ccavPOST =  qs.parse(ccavEncResponse);
    var encryption = ccavPOST.encResp;
    ccavResponse = ccav.decrypt(encryption,workingKey);

    var pData = [];
    var obj = qs.parse(ccavResponse);
    // console.log("obj.mer_amount----->"+obj.mer_amount);
    // console.log("obj.order_id----->"+obj.order_id);

    if(obj.order_status == "Success"){
        models.User.find({
            where : {
                email : obj.merchant_param2
            }
        }).then(function(user){
            total_amount = obj.mer_amount;
            models.Orders.find({
                where:
                {
                    id : obj.order_id,
                    [Op.or]:[{
                        source:'guattestation',
									 },
									 {
										source:'gumoi',
									 }]
                }
            }).then(function(order){
                order.update({
                    order_id : '1',
                    user_id : user.id,
                    //application_id : 0,
                    timestamp : functions.get_current_datetime(),
                    amount : total_amount,
                    status : '1'
                }).then(function(order_updated){
                    models.Transaction.create({
                        order_id : order_updated.id,
                        tracking_id : obj.tracking_id,
                        bank_ref_no : obj.bank_ref_no,
                        order_status : obj.order_status,
                        payment_mode : 'online',
                        currency : 'INR',
                        amount : total_amount,
                        billing_name : user.name,
                        billing_tel : user.mobile,
                        billing_email : user.email,
                        merchant_param1 : obj.merchant_param1,
                        merchant_param2 : obj.merchant_param2,
                        merchant_param3 : obj.merchant_param3,
                        merchant_param4 : obj.merchant_param4,
                        merchant_param5 : obj.merchant_param5,
                        split_status : '-1'
                    }).then(function(transaction_created){
                        if(transaction_created){
                            var desc = user.name+"( "+user.email+" ) made payment through link. ";
                            var activity = "Payment Link";
                            var applicationId = order_updated.application_id;
                            functions.activitylog(user.id, activity, desc, applicationId);
                            res.redirect("https://guattestation.studentscenter.in/app/#/pages/PaymentSuccess?order_id="+obj.order_id);
                        }
                    });
                });
            });
        })
    }else{
        models.Orders.find({
            where:
            {
                id : obj.order_id,
                [Op.or]:[{
                    source:'guattestation',
									 },
									 {
										source:'gumoi',
									 }]
            }
        }).then(function(ord){
            if(obj.order_status == 'Failure'){
                ord.update({
                    status : '-1'
                }).then(function(updated){
                    res.redirect("https://guattestation.studentscenter.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Timeout'){
                ord.update({
                    status : '2'
                }).then(function(updated){
                    res.redirect("https://guattestation.studentscenter.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Aborted'){
                ord.update({
                    status : '3'
                }).then(function(updated){
                    res.redirect("https://guattestation.studentscenter.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Invalid'){
                ord.update({
                    status : '4'
                }).then(function(updated){
                    res.redirect("https://guattestation.studentscenter.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else{
                ord.update({
                    status : '5'
                }).then(function(updated){
                    //res.redirect("http://guattestation.studentscenter.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }
        });
    }
});

router.get('/changeSplitStatus',function(req,res){
    var changeSplitStatus = {
        'reference_no':109858203787,
        'order_no': 427913434
    }
    var split_encRequest = ccav.encrypt(JSON.stringify(changeSplitStatus),workingKey);
    console.log('split_encRequest==========='+split_encRequest)
    request.post(
        "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=changeSplitPayoutStatus&request_type=JSON&response_type=JSON&version=1.2",
            // { json: {enc_request:encRequest,accessCode:splitaccessCode,command:'createSplitPayout',request_type:'JSON',response_type:'JSON',version:'1.2'}},
        function (error, response, body) {
            var split_obj = qs.parse(response.body);
            console.log('split_obj============'+JSON.stringify(split_obj))
        }
    );
});

router.post('/changeSplitPayoutStatus',function(req,res){
    console.log("req.body.reference_no--->"+req.body.reference_no);
    console.log("req.body.order_id--->"+req.body.order_id);
    models.Transaction.find({
        where:{
            tracking_id : req.body.reference_no
        }
    }).then(function(transaction){
        if(transaction){
            var changeSplitStatus = {
                'reference_no': req.body.reference_no,
                'order_no': transaction.order_id
            }
            var split_encRequest = ccav.encrypt(JSON.stringify(changeSplitStatus),workingKey);
            console.log('split_encRequest==========='+split_encRequest)
            request.post(
                "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=changeSplitPayoutStatus&request_type=JSON&response_type=JSON&version=1.2",
                    // { json: {enc_request:encRequest,accessCode:splitaccessCode,command:'createSplitPayout',request_type:'JSON',response_type:'JSON',version:'1.2'}},
                function (error, response, body) {
                    var split_obj = qs.parse(response.body);
                    console.log('split_obj============'+JSON.stringify(split_obj))
                    if(split_obj.status == '1'){
                        res.json({
                            status : 400,
                            message : 'Error occured'
                        });
                    }else{
                        var dec_split = ccav.decrypt(split_obj.enc_response,workingKey);
                        var pay = JSON.parse(dec_split);

                        var val = pay.split_refund_result;

                        // var refund_status = val.refund_status;
                        // console.log("refund_status---------->"+refund_status);
                        models.Transaction.find({
                            where:
                            {
                                tracking_id : req.body.reference_no //109832664053, //
                            }
                        }).then(function(change_trans){
                            if(change_trans){
                                if(split_obj.status == '1'){
                                    change_trans.update({
                                        change_split_payout_status : '-1'
                                    }).then(function(change_trans_updated){
                                        res.json({
                                            status : 400
                                        });
                                    })
                                }else if(split_obj.status == '0'){
                                    change_trans.update({
                                        change_split_payout_status : '1',
                                        split_status : '1'
                                    }).then(function(change_trans_updated){
                                        res.json({
                                            status : 200
                                        });
                                    })
                                }
                            }else{
                                res.json({
                                    status : 400,
                                    message : 'data not found.'
                                });
                            }
                        });
                    }
                }
            );
        }else{
            res.json({
                status : 400,
                message : 'Data not found.'
            })
        }
    })
});

router.get('/invoicelookup',function(req,res){
    var ccavEncResponse='',
        ccavResponse='',
        ccavPOST = '';
    var count = 0;
    var data =[];
    var today1  = moment().subtract(0, 'days').startOf('day');
    var today =  today1.format('DD-MM-YYYY').toString();

    var sendgrid  = require('sendgrid')(constant.SENDGRID_API_KEY);
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(constant.SENDGRID_API_KEY);

    var statusTrackerData = {
        //'reference_no': '108699413641',
        //'reference_no' : '',
        'from_date' : '01-01-2022',
        'to_date' : ''+today,
        'order_currency' :'INR',
        'order_email' : '',
        'order_fraud_status' : '',
        'order_min_amount' : '',
        'order_max_amount' : '',
        'order_name' : '',
        'order_no' : '',
        'order_payment_type' : '',
        'order_status' : 'Shipped',
        'order_type' : 'OT-INV',
        'order_bill_tel' : '',
        'page_number' : '1'
    }
    var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);

    request.post(
        "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderLookup&request_type=JSON&response_type=JSON&version=1.1",
            function (error, response, body) {
                count++;
                var statustracker_obj = qs.parse(response.body);

                var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                //console.log("dec_status---->"+JSON.stringify(dec_status));

                var status_pay = JSON.parse(dec_status);
                console.log("status_pay.order_Status_List.length-------->"+status_pay.order_Status_List.length);
                status_pay.order_Status_List.forEach(function(invoice_data){
                    count++;
                    console.log("invoice_data.order_no-------->"+invoice_data.order_no);
                    if(invoice_data.order_split_payout == 'Y'){
                        console.log("INVOICE--->"+count)
                        //mailOrderInvoice(invoice_data.order_no, invoice_data.order_bill_name, invoice_data.order_bill_email,'Invoice Updated to N',invoice_data.order_amt,invoice_data.reference_no)
                        var changeSplitStatus = {
                            'reference_no': ''+invoice_data.reference_no,
                            'order_no': ''+invoice_data.order_no
                        }
                        var split_encRequest = ccav.encrypt(JSON.stringify(changeSplitStatus),workingKey);
                        //console.log('split_encRequest==========='+split_encRequest)
                        request.post(
                            "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=changeSplitPayoutStatus&request_type=JSON&response_type=JSON&version=1.2",
                                // { json: {enc_request:encRequest,accessCode:splitaccessCode,command:'createSplitPayout',request_type:'JSON',response_type:'JSON',version:'1.2'}},
                            function (error, response, body) {
                                var split_obj = qs.parse(response.body);
                                console.log('split_obj============'+JSON.stringify(split_obj))
                                mailOrderInvoice(invoice_data.order_no, invoice_data.order_bill_name, invoice_data.order_bill_email,'Invoice Updated to N',invoice_data.order_amt,invoice_data.reference_no)
                            }
                        );
                    }

                    if(count == status_pay.order_Status_List.length){
                        setTimeout(function(){
                            if(data.length > 0){
                                var xls = json2xls(data);
                                var file_location = constant.FILE_LOCATION + "public/upload/payment_details_in_excel/ApiCallInvoiceDetails.xlsx";
                                fs.writeFileSync(file_location, xls, 'binary');
                                var file_name = "ApiCallInvoiceDetails.xlsx";
                                setTimeout(function(){
                                    base64.encode(constant.FILE_LOCATION+"public/upload/payment_details_in_excel/ApiCallInvoiceDetails.xlsx", function(err, base64String) {
                                        const msgShweta = {
                                            to: 'shweta@edulab.in',
                                            from: 'info@etranscript.in',
                                            subject: 'Invoice Updated record',
                                            text:  '<br>Kindly check attached excel sheet for Api Call Invoice Details \n\n',
                                            html:
                                            '<br>Kindly check attached excel sheet for Api Call Invoice Details \n\n',
                                            attachments: [
                                                {
                                                    content: base64String,
                                                    filename: file_name,
                                                    type: 'application/xlsx',
                                                    disposition: 'attachment',
                                                    contentId: 'mytext'
                                                },
                                            ],

                                        };
                                        sgMail.send(msgShweta);
                                    });

                                },5000);
                            }else{
                                const msgShweta = {
                                    to: 'shweta@edulab.in',
                                    from: 'info@etranscript.in',
                                    subject: 'Invoice Updated record',
                                    text:  '<br>NO Records found for Api Call Invoice Details \n\n',
                                    html:
                                    '<br>NO Records found for Api Call Invoice Details \n\n',
                                };
                                sgMail.send(msgShweta);
                            }
                        },20000)
                    }
                })
            }
    );

    //For Mail which Invoice updated to Y to N.
    function mailOrderInvoice(order_id, stu_name, stu_email, action, amount, tracking_id){
        data.push({
            stu_name : stu_name,
            stu_email : stu_email,
            order_id : order_id,
            cc_reference_no : tracking_id,
            amount : amount,
            action : action
        })
    }

});

router.get('/invoicelookupCron',function(req,res){
    console.log("COming here");
    var sendgrid  = require('sendgrid')(constant.SENDGRID_API_KEY);
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(constant.SENDGRID_API_KEY);

    var file_name = "ApiCallInvoiceDetails.xlsx";
    base64.encode(constant.FILE_LOCATION+"public/upload/payment_details_in_excel/ApiCallInvoiceDetails.xlsx", function(err, base64String) {
        const msgPooja = {
            to: 'pooja@edulab.in',
            from: 'info@etranscript.in',
            subject: 'mu.eTrans manual invoices',
            text:  '<br>Invoices were generated from the CCAvenue dashboard. Here is the excel for those transactions of mu.eTrans that have been auto-settled into EDU. \n\n',
            html:
            '<br>Invoices were generated from the CCAvenue dashboard. Here is the excel for those transactions of mu.eTrans that have been auto-settled into EDU. \n\n',
            attachments: [
                {
                    content: base64String,
                    filename: file_name,
                    type: 'application/xlsx',
                    disposition: 'attachment',
                    contentId: 'mytext'
                },
            ],

        };
        sgMail.send(msgPooja);
    });
});


router.get('/invoicelookupExcel',function(req,res){
    var ccavEncResponse='',
        ccavResponse='',
        ccavPOST = '';
    var count = 0;
    var data =[];
    var sendgrid  = require('sendgrid')(constant.SENDGRID_API_KEY);
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(constant.SENDGRID_API_KEY);

    var statusTrackerData = {
        //'reference_no': '108699413641',
        //'reference_no' : '',
        'from_date' : '01-03-2020',
        'to_date' : '22-06-2020',
        'order_currency' :'INR',
        'order_email' : '',
        'order_fraud_status' : '',
        'order_min_amount' : '',
        'order_max_amount' : '',
        'order_name' : '',
        'order_no' : '',
        'order_payment_type' : '',
        'order_status' : 'Shipped',
        'order_type' : 'OT-INV',
        'order_bill_tel' : '',
        'page_number' : '1'
    }
    var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);

    request.post(
        "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderLookup&request_type=JSON&response_type=JSON&version=1.1",
            function (error, response, body) {
                count++;
                var statustracker_obj = qs.parse(response.body);

                var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                //console.log("dec_status---->"+JSON.stringify(dec_status));

                var status_pay = JSON.parse(dec_status);
                console.log("status_pay.order_Status_List.length-------->"+status_pay.order_Status_List.length);
                status_pay.order_Status_List.forEach(function(invoice_data){
                    count++;
                    console.log("invoice_data.order_no-------->"+invoice_data.order_no);
                    if(invoice_data.order_split_payout == 'Y'){
                        console.log("INVOICE--->"+count)
                        var changeSplitStatus = {
                            'reference_no': ''+invoice_data.reference_no,
                            'order_no': ''+invoice_data.order_no
                        }
                        mailOrderInvoice(invoice_data.order_no, invoice_data.reference_no, invoice_data.order_bill_email, invoice_data.order_amt)
                    }

                    if(count == status_pay.order_Status_List.length){
                        setTimeout(function(){
                            if(data.length > 0){
                                var xls = json2xls(data);
                                var file_location = constant.FILE_LOCATION + "public/upload/payment_details_in_excel/InvoiceDetails.xlsx";
                                fs.writeFileSync(file_location, xls, 'binary');
                                var file_name = "InvoiceDetails.xlsx";
                                setTimeout(function(){
                                    base64.encode(constant.FILE_LOCATION+"public/upload/payment_details_in_excel/InvoiceDetails.xlsx", function(err, base64String) {
                                        const msgShweta = {
                                            to: 'shweta@edulab.in',
                                            from: 'info@etranscript.in',
                                            subject: 'Invoice Updated record',
                                            text:  '<br>Kindly check attached excel sheet for Api Call Invoice Details \n\n',
                                            html:
                                            '<br>Kindly check attached excel sheet for Api Call Invoice Details \n\n',
                                            attachments: [
                                                {
                                                    content: base64String,
                                                    filename: file_name,
                                                    type: 'application/xlsx',
                                                    disposition: 'attachment',
                                                    contentId: 'mytext'
                                                },
                                            ],

                                        };
                                        sgMail.send(msgShweta);
                                    });

                                },5000);
                            }else{
                                const msgShweta = {
                                    to: 'shweta@edulab.in',
                                    from: 'info@etranscript.in',
                                    subject: 'Invoice Updated record',
                                    text:  '<br>NO Records found for Api Call Invoice Details \n\n',
                                    html:
                                    '<br>NO Records found for Api Call Invoice Details \n\n',
                                };
                                sgMail.send(msgShweta);
                            }
                        },5000)
                    }
                })
            }
    );

    //For Mail which Invoice updated to Y to N.
    function mailOrderInvoice(order_id, tracking_id, stu_email, amount ){
        data.push({
            stu_email : stu_email,
            order_id : order_id,
            cc_reference_no : tracking_id,
            amount : amount,
        })
    }

});

router.get('/multipleOrderlookup',function(req,res){
    var ccavEncResponse='',
        ccavResponse='',
        ccavPOST = '';
    var count = 0;
    var data =[];
    // var today1  = moment().subtract(0, 'days').startOf('day');
    // var today =  today1.format('DD-MM-YYYY').toString();
    var yesterday1     = moment().subtract(1, 'days').startOf('day');
    var yesterday =  yesterday1.format('DD-MM-YYYY').toString();
    var sendgrid  = require('sendgrid')(constant.SENDGRID_API_KEY);
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(constant.SENDGRID_API_KEY);


    var statusTrackerData = {
        'from_date' : ''+yesterday,
        //'to_date' : ''+today,
        'order_currency' :'INR',
        'order_email' : '',
        'order_fraud_status' : '',
        'order_min_amount' : '',
        'order_max_amount' : '',
        'order_name' : '',
        'order_no' : '',
        'order_payment_type' : '',
        'order_status' : 'Shipped',
        'order_type' : 'OT-ORD',
        'order_bill_tel' : '',
        'page_number' : '1'
    }
    var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);

    request.post(
        "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderLookup&request_type=JSON&response_type=JSON&version=1.1",
            function (error, response, body) {
                count++;
                var statustracker_obj = qs.parse(response.body);

                var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                //console.log("dec_status---->"+JSON.stringify(dec_status));

                var status_pay = JSON.parse(dec_status);
                console.log("status_pay.order_Status_List.length-------->"+status_pay.order_Status_List.length);
                status_pay.order_Status_List.forEach(function(invoice_data){
                    count++;
                    console.log("invoice_data.order_no-------->"+invoice_data.order_no+' reference_no ==>'+invoice_data.reference_no);
                    //console.log("count-------->"+count);
                    console.log("invoice_data.order_split_payout-------->"+invoice_data.order_split_payout);
                    //
                    if((invoice_data.order_no < 100000 || invoice_data.order_no > 349329270) && invoice_data.order_split_payout == 'Y'){
                        console.log("TO check transaction");
                        models.Transaction.find({
                            where : {
                                tracking_id : invoice_data.reference_no, //order.id
                            }
                        }).then(function(transaction){
                            if(transaction){
                                //transaction already exist but not updated in order table
                                //console.log("Transaction exist-------->Transaction exist");
                                mailOrderInvoice(invoice_data.order_no, invoice_data.order_bill_name, invoice_data.order_bill_email,'Transaction exist',invoice_data.order_amt,invoice_data.reference_no)
                            }else{
                                //transaction not exist
                                //console.log("Transaction not exist-------->Transaction not exist");

                                    var statusTrackerData = {
                                        'reference_no': ''+invoice_data.reference_no,
                                        //'reference_no' : '',
                                        'from_date' : ''+yesterday,// '16-06-2019' ,
                                        //'to_date' : ''+today,
                                        'order_currency' :'INR',
                                        'order_email' : '',
                                        'order_fraud_status' : '',
                                        'order_min_amount' : '',
                                        'order_max_amount' : '',
                                        'order_name' : '',
                                        'order_no' : '',
                                        'order_payment_type' : '',
                                        'order_status' : 'Shipped',
                                        'order_type' : '',
                                        'order_bill_tel' : '',
                                        'page_number' : '1'
                                    }
                                    var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);

                                    request.post(
                                        "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderLookup&request_type=JSON&response_type=JSON&version=1.1",
                                            function (error, response, body) {
                                                //count++;
                                                var statustracker_obj = qs.parse(response.body);

                                                var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                                                console.log("dec_status---->"+JSON.stringify(dec_status));

                                                var status_pay = JSON.parse(dec_status);

                                                if(status_pay.error_code != 51419 && status_pay.total_records > 0 ){
                                                    //DATA FOUND
                                                    models.Orders.find({
                                                        where :{
                                                            id : status_pay.order_Status_List[0].order_no,
                                                            [Op.or]:[{
                                                                source:'guattestation',
									 },
									 {
										source:'gumoi',
									 }]
                                                        }
                                                    }).then(function(orders){
                                                        if(orders){
                                                            models.User.find({
                                                                where : {
                                                                    id : orders.user_id
                                                                }
                                                            }).then(function(user){
                                                                //transaction not exist
                                                                models.Transaction.create({
                                                                    order_id : status_pay.order_Status_List[0].order_no,
                                                                    tracking_id : status_pay.order_Status_List[0].reference_no,
                                                                    bank_ref_no : status_pay.order_Status_List[0].order_bank_ref_no,
                                                                    order_status : status_pay.order_Status_List[0].order_status ? 'Success' : status_pay.order_Status_List[0].order_status,
                                                                    payment_mode : 'online',
                                                                    currency : 'INR',
                                                                    amount : status_pay.order_Status_List[0].order_amt,
                                                                    billing_name : user.name,
                                                                    billing_address : user.address1,
                                                                    billing_city : user.city,
                                                                    billing_state : user.state,
                                                                    billing_zip : user.postal_code,
                                                                    billing_country : user.country_birth,
                                                                    billing_tel : user.mobile,
                                                                    billing_email : user.email,
                                                                    merchant_param1 : status_pay.order_Status_List[0].merchant_param1,
                                                                    merchant_param2 : status_pay.order_Status_List[0].merchant_param2,
                                                                    merchant_param3 : status_pay.order_Status_List[0].merchant_param3,
                                                                    merchant_param4 : status_pay.order_Status_List[0].merchant_param4,
                                                                    merchant_param5 : status_pay.order_Status_List[0].merchant_param5,
                                                                    split_status : '-1',
                                                                    cc_call : 'Added'
                                                                }).then(function(transaction_created){
                                                                    if(transaction_created){
                                                                        console.log("Transaction created");
                                                                        mailOrderInvoice(invoice_data.order_no, invoice_data.order_bill_name, invoice_data.order_bill_email,'Transaction not exist',invoice_data.order_amt,invoice_data.reference_no)
                                                                    }else{

                                                                    }
                                                                })
                                                            })
                                                        }
                                                    })
                                                }else{
                                                    //NO SHIPPED DATA FOUND
                                                }
                                            }
                                    );
                            }
                        })
                    }

                    if(count == status_pay.order_Status_List.length ){
                        setTimeout(function(){
                            console.log("data.length------------>"+data.length);
                            if(data.length > 0){
                                console.log("data.length---111111--------->"+data.length);
                                var xls = json2xls(data);
                                var file_location = constant.FILE_LOCATION + "public/upload/payment_details_in_excel/ApiCallMultipleTransactionDetails.xlsx";
                                fs.writeFileSync(file_location, xls, 'binary');
                                var file_name = "ApiCallMultipleTransactionDetails.xlsx";
                                setTimeout(function(){
                                    base64.encode(constant.FILE_LOCATION+"public/upload/payment_details_in_excel/ApiCallMultipleTransactionDetails.xlsx", function(err, base64String) {
                                        const msgShweta = {
                                            to: 'shweta@edulab.in',
                                            from: 'info@etranscript.in',
                                            subject: 'Multiple Transaction Details',
                                            text:  '<br>Kindly check attached excel sheet for Multiple Transaction Details \n\n',
                                            html:
                                            '<br>Kindly check attached excel sheet for Api Call Multiple Transaction Details \n\n',
                                            attachments: [
                                                {
                                                    content: base64String,
                                                    filename: file_name,
                                                    type: 'application/xlsx',
                                                    disposition: 'attachment',
                                                    contentId: 'mytext'
                                                },
                                            ],

                                        };
                                        sgMail.send(msgShweta);
                                    });

                                },5000);
                            }else{
                                console.log("data.length----2222222--------->"+data.length);
                                const msgShweta = {
                                    to: 'shweta@edulab.in',
                                    from: 'info@etranscript.in',
                                    subject: 'Multiple Transaction Details',
                                    text:  '<br>NO Records found for Api Call Multliple transaction Details \n\n',
                                    html:
                                    '<br>NO Records found for Api Call Multliple transaction Details \n\n',
                                };
                                sgMail.send(msgShweta);
                            }
                        },20000)
                    }
                })
            }
    );

    //For Mail which Invoice updated to Y to N.
    function mailOrderInvoice(order_id, stu_name, stu_email, action, amount, tracking_id){
        data.push({
            stu_name : stu_name,
            stu_email : stu_email,
            order_id : order_id,
            cc_reference_no : tracking_id,
            amount : amount,
            action : action
        })
    }

});


//  EXCEL CODE
//router.get('/multipleOrderlookup',function(req,res){
//     var ccavEncResponse='',
//         ccavResponse='',
//         ccavPOST = '';
//     var count = 0;
//     var data =[];
//     var today1  = moment().subtract(0, 'days').startOf('day');
//     var today =  today1.format('DD-MM-YYYY').toString();

//     var sendgrid  = require('sendgrid')(constant.SENDGRID_API_KEY);
//     const sgMail = require('@sendgrid/mail');
//     sgMail.setApiKey(constant.SENDGRID_API_KEY);
//     var page_array = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];

//     page_array.forEach(function(page){
//         console.log("page----------->"+page);
//         var statusTrackerData = {
//             'from_date' : '01-03-2020',
//             //'to_date' : ''+today,
//             'order_currency' :'INR',
//             'order_email' : '',
//             'order_fraud_status' : '',
//             'order_min_amount' : '',
//             'order_max_amount' : '',
//             'order_name' : '',
//             'order_no' : '',
//             'order_payment_type' : '',
//             'order_status' : 'Shipped',
//             'order_type' : 'OT-ORD',
//             'order_bill_tel' : '',
//             'page_number' : ''+page
//         }
//         var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);

//         request.post(
//             "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderLookup&request_type=JSON&response_type=JSON&version=1.1",
//                 function (error, response, body) {
//                     count++;
//                     var statustracker_obj = qs.parse(response.body);

//                     var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
//                     //console.log("dec_status---->"+JSON.stringify(dec_status));

//                     var status_pay = JSON.parse(dec_status);
//                     console.log("status_pay.order_Status_List.length-------->"+status_pay.order_Status_List.length);
//                     status_pay.order_Status_List.forEach(function(invoice_data){
//                         console.log("invoice_data.order_no-------->"+invoice_data.order_no);
//                         //console.log("count-------->"+count);
//                         //console.log("invoice_data.order_split_payout-------->"+invoice_data.order_split_payout);
//                         //
//                         if((invoice_data.order_no < 100000 || invoice_data.order_no > 349329270) && invoice_data.order_split_payout == 'Y'){
//                             console.log("TO check transaction");
//                             models.Transaction.find({
//                                 where : {
//                                     tracking_id : invoice_data.reference_no, //order.id
//                                 }
//                             }).then(function(transaction){
//                                 if(transaction){
//                                     //transaction already exist but not updated in order table
//                                     console.log("Transaction exist-------->Transaction exist");
//                                     mailOrderInvoice(invoice_data.order_no, invoice_data.order_bill_name, invoice_data.order_bill_email,'Transaction exist',invoice_data.order_amt,invoice_data.reference_no)
//                                 }else{
//                                     //transaction not exist
//                                     console.log("Transaction not exist-------->Transaction not exist");
//                                     mailOrderInvoice(invoice_data.order_no, invoice_data.order_bill_name, invoice_data.order_bill_email,'Transaction not exist',invoice_data.order_amt,invoice_data.reference_no)
//                                 }
//                             })
//                         }

//                         if(count == page ){
//                             setTimeout(function(){
//                                 console.log("data.length------------>"+data.length);
//                                 if(data.length > 0){
//                                     console.log("data.length---111111--------->"+data.length);
//                                     var xls = json2xls(data);
//                                     var file_location = constant.FILE_LOCATION + "public/upload/payment_details_in_excel/ApiCallMultipleTransactionDetails.xlsx";
//                                     fs.writeFileSync(file_location, xls, 'binary');
//                                     var file_name = "ApiCallMultipleTransactionDetails.xlsx";
//                                     // setTimeout(function(){
//                                     //     base64.encode(constant.FILE_LOCATION+"public/upload/payment_details_in_excel/ApiCallMultipleTransactionDetails.xlsx", function(err, base64String) {
//                                     //         const msgShweta = {
//                                     //             to: 'shweta@edulab.in',
//                                     //             from: 'info@etranscript.in',
//                                     //             subject: 'Multiple Transaction Details',
//                                     //             text:  '<br>Kindly check attached excel sheet for Multiple Transaction Details \n\n',
//                                     //             html:
//                                     //             '<br>Kindly check attached excel sheet for Api Call Multiple Transaction Details \n\n',
//                                     //             attachments: [
//                                     //                 {
//                                     //                     content: base64String,
//                                     //                     filename: file_name,
//                                     //                     type: 'application/xlsx',
//                                     //                     disposition: 'attachment',
//                                     //                     contentId: 'mytext'
//                                     //                 },
//                                     //             ],

//                                     //         };
//                                     //         //sgMail.send(msgShweta);
//                                     //     });

//                                     // },5000);
//                                 }else{
//                                     console.log("data.length----2222222--------->"+data.length);
//                                     const msgShweta = {
//                                         to: 'shweta@edulab.in',
//                                         from: 'info@etranscript.in',
//                                         subject: 'Multiple Transaction Details',
//                                         text:  '<br>NO Records found for Api Call Multliple transaction Details \n\n',
//                                         html:
//                                         '<br>NO Records found for Api Call Multliple transaction Details \n\n',
//                                     };
//                                     //sgMail.send(msgShweta);
//                                 }
//                             },120000)
//                         }
//                     })
//                 }
//         );

//     });

//     //For Mail which Invoice updated to Y to N.
//     function mailOrderInvoice(order_id, stu_name, stu_email, action, amount, tracking_id){
//         data.push({
//             stu_name : stu_name,
//             stu_email : stu_email,
//             order_id : order_id,
//             cc_reference_no : tracking_id,
//             amount : amount,
//             action : action
//         })
//     }

// });


//Add manually transaction entries
// router.get('/invoicelookupCron',function(req,res){

//     var statusTrackerData = {
//         'reference_no': '109904731622',
//         //'reference_no' : '',
//         'from_date' : '01-03-2020',//''+yesterday,// '16-06-2019' ,
//         //'to_date' : ''+today,
//         'order_currency' :'INR',
//         'order_email' : '',
//         'order_fraud_status' : '',
//         'order_min_amount' : '',
//         'order_max_amount' : '',
//         'order_name' : '',
//         'order_no' : '',
//         'order_payment_type' : '',
//         'order_status' : 'Shipped',
//         'order_type' : '',
//         'order_bill_tel' : '',
//         'page_number' : '1'
//     }
//     var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);

//     request.post(
//         "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderLookup&request_type=JSON&response_type=JSON&version=1.1",
//             function (error, response, body) {
//                 //count++;
//                 var statustracker_obj = qs.parse(response.body);

//                 var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
//                 console.log("dec_status---->"+JSON.stringify(dec_status));

//                 var status_pay = JSON.parse(dec_status);

//                 if(status_pay.error_code != 51419 && status_pay.total_records > 0 ){
//                     //DATA FOUND
//                     models.User.find({
//                         where : {
//                             id : 9805
//                         }
//                     }).then(function(user){
//                         //transaction not exist
//                         models.Transaction.create({
//                             order_id : 1468,
//                             tracking_id : status_pay.order_Status_List[0].reference_no,
//                             bank_ref_no : status_pay.order_Status_List[0].order_bank_ref_no,
//                             order_status : status_pay.order_Status_List[0].order_status ? 'Success' : status_pay.order_Status_List[0].order_status,
//                             payment_mode : 'online',
//                             currency : 'INR',
//                             amount : status_pay.order_Status_List[0].order_amt,
//                             billing_name : user.name,
//                             billing_address : user.address1,
//                             billing_city : user.city,
//                             billing_state : user.state,
//                             billing_zip : user.postal_code,
//                             billing_country : user.country_birth,
//                             billing_tel : user.mobile,
//                             billing_email : user.email,
//                             merchant_param1 : status_pay.order_Status_List[0].merchant_param1,
//                             merchant_param2 : status_pay.order_Status_List[0].merchant_param2,
//                             merchant_param3 : status_pay.order_Status_List[0].merchant_param3,
//                             merchant_param4 : status_pay.order_Status_List[0].merchant_param4,
//                             merchant_param5 : status_pay.order_Status_List[0].merchant_param5,
//                             split_status : '-1'
//                         }).then(function(transaction_created){
//                             if(transaction_created){
//                                 console.log("Transaction created");
//                                 res.json({
//                                     status:200,
//                                     message: 'DONE'
//                                 })
//                             }else{

//                             }
//                         })
//                     })
//                 }else{
//                     //NO SHIPPED DATA FOUND
//                 }
//             }
//     );
// })


router.get('/invoice_generation',function(req,res){
    var count = 0;
    var data =[];
    var sendgrid  = require('sendgrid')(constant.SENDGRID_API_KEY);
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(constant.SENDGRID_API_KEY);

    /* FOR DATABASE QUERY */
    var yesterday1     = moment().subtract(1, 'days').startOf('day');
    var yesterdayNew  = yesterday1.format('YYYY-MM-DD HH:mm:ss');
    var today1  = moment().subtract(1, 'days').endOf('day');
    var todayNew = today1.format('YYYY-MM-DD HH:mm:ss');
    console.log("yesterdayNew------->"+yesterdayNew);
    console.log("todayNew------->"+todayNew);

    var yesterday_file_name = moment(yesterday1).format("YYYYMMDD");
    //console.log(yesterday_file_name);

    models.Orders.invoice_generation(yesterdayNew,todayNew).then(function(orders){
        // console.log("orders.length---->"+orders.length);
        if(orders){
            orders.forEach(function(order){
                var order_created_date = order.created_at ? moment(new Date(order.created_at)).format('DD/MM/YYYY') : '';
                var order_created_split_date = order_created_date.split("/");
                models.User.find({
                    where:{
                        id : order.user_id
                    }
                }).then(function(User){
                    var userEducational;
                    if(User){
                        if(User.educationalDetails == true && User.instructionalField == true && User.curriculum == true){
                            userEducational = 3;
                        }else if(User.educationalDetails == true && User.instructionalField == true){
                            userEducational =  2;
                        }else if(User.educationalDetails == true && User.curriculum == true){
                            userEducational = 2;
                        }else if(User.instructionalField == true && User.curriculum == true){
                            userEducational = 2;
                        }else if(User.educationalDetails == true){
                            userEducational = 1;
                        }else if(User.curriculum == true){
                            userEducational = 1;
                        }else if(User.instructionalField == true){
                            userEducational =  1;
                        }
                    }

                    count++;
                    //console.log("count---->"+count);
                    //console.log("orders.length---->"+orders.length);
                    data.push({
                        order_id : order.order_id,
                        reference_no : order.tracking_id,
                        name : order.name,
                        email : order.email,
                        mobile_country_code : order.mobile_country_code,
                        mobile: order.mobile,
                        address1 : order.address,
                        address2 : order.address,
                        area : '',
                        city : order.city,
                        state : '',
                        country : '',
                        postal_code : order.postal_code,
                        //student_category : '',
                        //date: order.created_at ? moment(new Date(order.created_at)).format('DD/MM/YYYY') : '',
                        dd : order_created_split_date[0],
                        mm : order_created_split_date[1],
                        yyyy : order_created_split_date[2],
                        Service_amt : '197',
                        CGST : '18',
                        SGST : '18',
                        no_of_services : userEducational
                    });

                    if(count == orders.length){
                        //console.log("count == orders.length"+JSON.stringify(data));
                        //setTimeout(function(){
                            console.log("After settimeout");
                            var csv = json2csv(data);
                            var file_location = constant.FILE_LOCATION+"public/upload/payment_details_in_excel/mu.eTransInvoice"+yesterday_file_name+".csv";
                            fs.writeFileSync(file_location, csv);
                            var filepath= constant.FILE_LOCATION+'public/upload/payment_details_in_excel/mu.eTransInvoice'+yesterday_file_name+'.csv';
                            var file_name = "mu.eTransInvoice"+yesterday_file_name+".csv";
                            base64.encode(constant.FILE_LOCATION+"public/upload/payment_details_in_excel/mu.eTransInvoice"+yesterday_file_name+".csv", function(err, base64String) {
                                const msgShweta = {
                                    to: 'shweta@edulab.in',
                                    from: 'info@etranscript.in',
                                    subject: 'mu.eTranscipt gst invoice list',
                                    text:  '<br>Here are the student details of those who made payment in the past 24 hours, in csv format for preparation of GST Invoice. \n\n',
                                    html: '<br>Here are the student details of those who made payment in the past 24 hours, in csv format for preparation of GST Invoice. \n\n',
                                    attachments: [
                                        {
                                            content: base64String,
                                            filename: file_name,
                                            type: 'application/xlsx',
                                            disposition: 'attachment',
                                            contentId: 'mytext'
                                        },
                                    ],

                                };
                                const msgPrakashSagar = {
                                    to: 'info@officeapplicationstrainer.com',
                                    from: 'info@etranscript.in',
                                    subject: 'mu.eTranscipt gst invoice list',
                                    text:  '<br>Here are the student details of those who made payment in the past 24 hours, in csv format for preparation of GST Invoice. \n\n',
                                    html: '<br>Here are the student details of those who made payment in the past 24 hours, in csv format for preparation of GST Invoice. \n\n',
                                    attachments: [
                                        {
                                            content: base64String,
                                            filename: file_name,
                                            type: 'application/xlsx',
                                            disposition: 'attachment',
                                            contentId: 'mytext'
                                        },
                                    ],

                                };
                                const msgAccounts = {
                                    to: 'accounts@edulab.in',
                                    from: 'info@etranscript.in',
                                    subject: 'mu.eTranscipt gst invoice list',
                                    text:  '<br>Here are the student details of those who made payment in the past 24 hours, in csv format for preparation of GST Invoice. \n\n',
                                    html:'<br>Here are the student details of those who made payment in the past 24 hours, in csv format for preparation of GST Invoice. \n\n',
                                    attachments: [
                                        {
                                            content: base64String,
                                            filename: file_name,
                                            type: 'application/xlsx',
                                            disposition: 'attachment',
                                            contentId: 'mytext'
                                        },
                                    ],

                                };
                                sgMail.send(msgShweta);
                                //sgMail.send(msgPrakashSagar);
                                //sgMail.send(msgAccounts);
                            })

                            res.json({
                                status:200,
                                data : filepath
                            })
                        //},10000);
                    }
                });
            });
        }else{
            //no order found
        }
    })
});


router.get('/payment_details_one_month',function(req,res){
    var count = 0;
    var data =[];
    var sendgrid  = require('sendgrid')(constant.SENDGRID_API_KEY);
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(constant.SENDGRID_API_KEY);

    /* FOR DATABASE QUERY */
    var yesterday1     = moment().subtract(1, 'months').startOf('month');
    var monthstart  = yesterday1.format('YYYY-MM-DD HH:mm:ss');
    var today1  = moment().subtract(1, 'months').endOf('month');
    var monthend = today1.format('YYYY-MM-DD HH:mm:ss');
    // console.log("monthstart------->"+monthstart);
    // console.log("monthend------->"+monthend);

    models.Orders.one_month_payment_detail(monthstart,monthend).then(function(orders){
        // console.log("orders.length---->"+orders.length);
        if(orders){
            orders.forEach(function(order){
                count++;
                data.push({
                    order_id : order.order_id,
                    tracking_id : order.tracking_id,
                    amount : order.amount,
                    name : order.name,
                    email : order.email,
                    mobile_country_code : order.mobile_country_code,
                    mobile: order.mobile,
                    address : order.address,
                    city : order.city,
                    postal_code : order.postal_code,
                    date: order.created_at ? moment(new Date(order.created_at)).format('DD/MM/YYYY') : '',
                });

                if(count == orders.length){
                    //console.log("count == orders.length"+JSON.stringify(data));
                    var xls = json2xls(data);
                    var file_location = constant.FILE_LOCATION+"public/upload/payment_details_in_excel/Payment_Details.xlsx";
                    fs.writeFileSync(file_location, xls, 'binary');
                    var filepath= constant.FILE_LOCATION+'public/upload/payment_details_in_excel/Payment_Details.xlsx';
                    var file_name = "Payment_Details.xlsx";
                    base64.encode(constant.FILE_LOCATION+"public/upload/payment_details_in_excel/Payment_Details.xlsx", function(err, base64String) {
                        const msgShweta = {
                            to: 'shweta@edulab.in',
                            from: 'info@etranscript.in',
                            subject: 'mu.eTranscipt gst Payment list',
                            text:  '<br>Here are the student details of those who made payment in the past 1 month. \n\n',
                            html:
                            '<br>Here are the student details of those who made payment in the past 1 month. \n\n',
                            attachments: [
                                {
                                    content: base64String,
                                    filename: file_name,
                                    type: 'application/xlsx',
                                    disposition: 'attachment',
                                    contentId: 'mytext'
                                },
                            ],

                        };
                        const msgAccounts = {
                            to: 'accounts@edulab.in',
                            from: 'info@etranscript.in',
                            subject: 'mu.eTranscipt gst Payment list',
                            text:  '<br>Here are the student details of those who made payment in the past 1 month. \n\n',
                            html:
                            '<br>Here are the student details of those who made payment in the past 1 month. \n\n',
                            attachments: [
                                {
                                    content: base64String,
                                    filename: file_name,
                                    type: 'application/xlsx',
                                    disposition: 'attachment',
                                    contentId: 'mytext'
                                },
                            ],

                        };
                        sgMail.send(msgShweta);
                        sgMail.send(msgAccounts);
                    })

                    res.json({
                        status:200,
                        data : filepath
                    })
                }
            });
        }else{
            //no order found
        }
    })
});


router.post('/split_excel_sheets',upload.single('file'), function(req, res) {
	var errors = [];
	var result;
	var image;
	var excel_sheet_path={};
	console.log("------------10------------");
	if(req.file){
		console.log("------------12------------");
		image = req.file.originalname;
		//console.log('image=============>'+image);
		var imgArr= req.file.originalname.split('.');
		//console.log('imgArr=============>'+imgArr);
		var fileExtension = imgArr[imgArr.length - 1].trim();
		//console.log('fileExtension=============>@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@'+fileExtension);
		var current_day = moment(new Date()).tz(constant.SYSTEM_TIMEZONE).format('YYYY-MM-DD');
		//console.log("current_day------------------------------------>"+current_day);
		var img_path=constant.FILE_LOCATION + 'public/upload/split_excel_sheets/'+current_day;
		if(fileExtension != 'xlsx'){
			res.json({
				status: 400,
				message: 'Please upload xlsx formatted excel file !',
				data: ''
			});
		}else{
			if (!fs.existsSync(img_path)){
				fs.mkdirSync(img_path);
			}
			console.log("----------19-------------");
			fs.readFile(req.file.path, function (err, data) {
				console.log("----------20-------------");
				var newPath = img_path+'/'+image;
				console.log("----------21-------------");
				fs.writeFile(newPath, data, function (err) {
				console.log("----------22-------------");
				//delete the temporary file
				fs.unlink(req.file.path,function (err2, data2) {if(err2){}else{}});
					if(err) {
						// console.log(err);
						result = 'error_occured';
					}else {
						console.log("------------23------------");

						var sheet_name = img_path + "/"+image;
						//console.log("sheet_na--->"+sheet_name);
						var workbook = XLSX.readFile(sheet_name);
						var sheet_name_list = workbook.SheetNames;
						var arrayOfObject =[];
						sheet_name_list.forEach(function(y) {
							var worksheet = workbook.Sheets[y];
							var headers = {};
							for(z in worksheet) {
								if(z[0] === '!') continue;
								//parse out the column, row, and value
								var tt = 0;
								for (var i = 0; i < z.length; i++) {
									if (!isNaN(z[i])) {
										tt = i;
										break;
									}
								};
								var col = z.substring(0,tt);
								var row = parseInt(z.substring(tt));
								var value = worksheet[z].v;

								//store header names
								if(row == 1 && value) {
									headers[col] = value;
									continue;
								}

								if(!arrayOfObject[row]) arrayOfObject[row]={};
								arrayOfObject[row][headers[col]] = value;
							}
							//drop those first two rows which are empty
							arrayOfObject.shift();
							arrayOfObject.shift();
							//console.log(arrayOfObject);
						});
						//console.log(XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]))

						models.Split_Sheets_Data.destroy({ truncate: { cascade: true } });
						setTimeout(function(){
						// 	//console.log("result===>"+JSON.stringify(result))
							console.log("arrayOfObject---------------------> " + arrayOfObject.length);
							async.eachSeries(arrayOfObject, function(arrayOfObjectss,callback) {
								models.Split_Sheets_Data.create({
									reference_no : arrayOfObjectss.reference_no,
									edu_share : arrayOfObjectss.edu_share,
									uni_share : arrayOfObjectss.uni_share,
									ccavenue_share : arrayOfObjectss.ccavenue_share,
									stu_name : arrayOfObjectss.stu_name,
									stu_email : arrayOfObjectss.stu_email,
								});
								callback();
							}, function(err){
							   	if(!err) {
									setTimeout(function(){
										models.Split_Sheets_Data.findAll().then(function(split_datas){
											split_datas.forEach(function(split_data){
												console.log("split_data.reference_no=====>"+split_data.reference_no)
                                                models.Transaction.find({
                                                    where : {
                                                        tracking_id : split_data.reference_no,
                                                        split_status : '-1'
                                                    }
                                                }).then(function(trans){
                                                    if(trans){
                                                        var data = [];
                                                        if(split_data.edu_share != 0){
                                                            data.push({
                                                                'splitAmount':split_data.edu_share,
                                                                'subAccId':'EDU'
                                                            });
                                                        }

                                                        if(split_data.uni_share != 0){
                                                            data.push({
                                                                'splitAmount':split_data.uni_share,
                                                                'subAccId':'UOM'
                                                            });
                                                        }

                                                        var splitPaymentData = {
                                                            'reference_no': split_data.reference_no,
                                                            'split_tdr_charge_type':'M',
                                                            'merComm': split_data.ccavenue_share,
                                                            'split_data_list': data
                                                        }

                                                        var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),workingKey);
                                                        request.post(
                                                            "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
                                                            function (error, response, body) {
                                                                var split_obj = qs.parse(response.body);
                                                                console.log('split_obj.error_code========'+JSON.stringify(split_obj))
                                                                console.log('split_obj.status========'+split_obj.status)
                                                                if(split_obj.status == '1'){
                                                                    models.Transaction.find({
                                                                        where:
                                                                        {
                                                                            tracking_id : split_data.reference_no
                                                                        }
                                                                    }).then(function(splitTrans){
                                                                    	models.Split_Sheets_Data.find({
                                                                    		where : {
                                                                    			reference_no : split_data.reference_no
                                                                    		}
                                                                    	}).then(function(splitSheetTrans){
                                                                    		if(splitTrans){
																				splitTrans.update({
		                                                                            split_status : '-1'
		                                                                        }).then(function(splitTrans_updated){
		                                                                       		splitSheetTrans.update({
			                                                                            updated_status : 'Error'
			                                                                        }).then(function(splitSheetTransupdate){

			                                                                        })
		                                                                        })
                                                                    		}else{
																				splitSheetTrans.update({
		                                                                            updated_status : 'Error'
		                                                                        }).then(function(splitSheetTransupdate){

		                                                                        })
                                                                    		}

                                                                    	})
                                                                    });
                                                                }else{
                                                                    //var dec_split = ccav.decrypt(split_obj.enc_response,splitworkingKey);
                                                                    var dec_split = ccav.decrypt(split_obj.enc_response,workingKey);

                                                                    var pay = JSON.parse(dec_split);
                                                                    console.log('pay========'+JSON.stringify(pay))
                                                                    var val = pay.Create_Split_Payout_Result;
                                                                    console.log('val========'+JSON.stringify(val))
                                                                    var split_status = val.status;
                                                                    console.log('split_status========'+split_status)
                                                                    models.Transaction.find({
                                                                        where:
                                                                        {
                                                                            tracking_id : split_data.reference_no
                                                                        }
                                                                    }).then(function(split_trans){
                                                                        if(split_trans){
                                                                            if(split_status == '1'){
                                                                                var split_error = val.error_desc + " Error Code : "+ val.error_code;
                                                                                split_trans.update({
                                                                                    split_status : '-1'
                                                                                }).then(function(split_trans_updated){
                                                                                	models.Split_Sheets_Data.find({
			                                                                    		where : {
			                                                                    			reference_no : split_data.reference_no
			                                                                    		}
			                                                                    	}).then(function(splitSheetTrans){
																						splitSheetTrans.update({
				                                                                            updated_status : 'Error'
				                                                                        }).then(function(splitSheetTransupdate){

				                                                                        })
			                                                                    	})
                                                                                })
                                                                            }else if(split_status == '0'){

                                                                                split_trans.update({
                                                                                    a : split_data.edu_share,
                                                                                    b : split_data.uni_share,
                                                                                    cc_share : split_data.ccavenue_share,
                                                                                    split_status : '1'
                                                                                }).then(function(split_trans_updated){
                                                                                    models.Split_Sheets_Data.find({
			                                                                    		where : {
			                                                                    			reference_no : split_data.reference_no
			                                                                    		}
			                                                                    	}).then(function(splitSheetTrans){
																						splitSheetTrans.update({
				                                                                            updated_status : 'Done'
				                                                                        }).then(function(splitSheetTransupdate){

				                                                                        })
			                                                                    	})
                                                                                })
                                                                            }
                                                                        }else{

                                                                        }
                                                                    });
                                                                }
                                                        });

                                                    }else{
                                                        models.Split_Sheets_Data.find({
                                                            where : {
                                                                reference_no : split_data.reference_no
                                                            }
                                                        }).then(function(splitSheetTrans){
                                                            splitSheetTrans.update({
                                                                updated_status : 'Error'
                                                            }).then(function(splitSheetTransupdate){

                                                            })
                                                        })
                                                    }
                                                })
											})
											setTimeout(function(){
												models.Split_Sheets_Data.findAll().then((data)=>{
													if(data != null || data != undefined){
														var TotalAppdata = [];
														require('async').each(data, function(data, callback) {
															TotalAppdata.push({
																"reference_no" : data.reference_no,
																"edu_share" : data.edu_share,
																"uni_share" : data.uni_share,
																"ccavenue_share" : data.ccavenue_share,
																"stu_name" : data.stu_name,
																"stu_email" : data.stu_email,
																"updated_status" : data.updated_status,
															});
															callback();
														}, function(error, results) {

															setTimeout(function(){
																var xls = json2xls(TotalAppdata);
																var file_location = img_path+'/Updated_Split_Sheet.xlsx';
																fs.writeFileSync(file_location, xls, 'binary');
																var filepath= img_path+'/Updated_Split_Sheet.xlsx';

																res.json({
																	status: 200,
																	data: filepath
																});

															},5000);
														});
													}else{
														res.json({
															status: 400,
														})
													}
												})
											},8000)
										})
									},6000)
					   			}else{
							   		res.json({
										status: 400,
										message: 'Error on server please try again !',
										data: ''
									});
					   			}
							});
						}, 6000);
					}
				});
			});
		}
	}else{
		res.json({
			status: 400,
			message: 'Upload excel file',
			data: ''
		});
	}
});

//Split Call for Attestatiom
//router.get('/splitPaymentCron',function(req,res){
cron.schedule('0 0 * * *', () => {
    //var transaction_id = 112765953319 ;
    models.Transaction.findAll({
        where:{
            split_status : '-1',
            source : 'guattestation'
            //tracking_id : transaction_id
        }
    }).then(function(trans){
        if(trans.length > 0){
            trans.forEach(function(tran){
                var reference_no ;
                var order_id ;
                //var transaction_id ;
                reference_no = tran.tracking_id;
                order_id = tran.order_id;
                //transaction_id = tran.merchant_param5;

                var statusTrackerData = {
                    "reference_no": reference_no,
                    //"order_no": order_id
                }
                var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);
                models.Orders.findOne({
                    where :{
                        id : order_id,
                        source : 'guattestation',
                    }
                }).then(function(ord){

                    if(ord){
                        console.log("order_id=====>"+order_id);
                        var order_type;
                        order_type = ord.order_id;

                        request.post(
                            "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2",
                                // { json: {enc_request:encRequest,accessCode:splitaccessCode,command:'createSplitPayout',request_type:'JSON',response_type:'JSON',version:'1.2'}},
                                function (error, response, body) {
                                    var statustracker_obj = qs.parse(response.body);
                    
                                    var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                    
                                    var status_pay = JSON.parse(dec_status);
                    
                                    var order_fee_perc_value = status_pay.order_fee_perc_value;
                                    console.log("order_fee_perc_value--->"+order_fee_perc_value)

                                    var order_tax = status_pay.order_tax;
                                    console.log("order_tax--->"+order_tax)
                    
                                    var order_fee_flat = status_pay.order_fee_flat;
                                    console.log("order_fee_flat--->"+order_fee_flat)

                                    var ccavenue_share = order_fee_perc_value + order_tax + order_fee_flat;
                                    console.log("ccavenue_share--->"+ccavenue_share)
                                    
                                    //if(order_type == '1'){
        
                                        var university_split_share = 0;//236; 
                                        console.log("university_split_share--->"+university_split_share)
                                    
                                        var edulab_split_share = ord.amount - ccavenue_share; //- university_split_share;
                                        console.log("edulab_split_share--->"+edulab_split_share)
                        
                                        var splitPaymentData = {
                                            'reference_no': reference_no, 
                                            'split_tdr_charge_type':'M',
                                            'merComm': ccavenue_share,
                                            'split_data_list': [
                                                {'splitAmount': edulab_split_share ,'subAccId':'EDU'}, //edulab
                                                //{'splitAmount': university_split_share ,'subAccId':'GUJ261'} //GU university
                                            ]
                                        }
                                        setTimeout(function(){ 
                                            var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),workingKey);
                        
                                        request.post(
                                            "https://login.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
                                                // { json: {enc_request:encRequest,accessCode:accessCode,command:'createSplitPayout',request_type:'JSON',response_type:'JSON',version:'1.2'}},
                                            function (error, response, body) {
                                                // 
                                                // 
                                                var split_obj = qs.parse(response.body);
                                                //console.log('split_obj============'+JSON.stringify(split_obj))
                                                // 

                                                var dec_status1 = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                    
                                                var status_pay1 = JSON.parse(dec_status1);
                                                //console.log("status_pay1===>"+JSON.stringify(status_pay1));

                                                if(split_obj.status == '1'){
                                                    console.log("************1******************")
                                                    models.Transaction.findOne({
                                                        where:
                                                        {
                                                            tracking_id : reference_no
                                                        }
                                                    }).then(function(splitTrans){
                                                        if(splitTrans){
        
                                                            splitTrans.update({
                                                                split_status : '-1'
                                                            }).then(function(splitTrans_updated){
                                
                                                            })
                                                        }else{
        
                                                        }
                                                    });
                                                }else{
                                                    console.log("************0******************")
                                                    var dec_split = ccav.decrypt(split_obj.enc_response,workingKey);
        
                                                    var pay = JSON.parse(dec_split);
                                                    console.log("status_pay1===>"+JSON.stringify(pay));
        
                                                    var val = pay.Create_Split_Payout_Result;
        
                                                    var split_status = val.status;
        
                                                    models.Transaction.findOne({
                                                        where:
                                                        {
                                                            tracking_id : reference_no
                                                        }
                                                    }).then(function(split_trans){
                                                        if(split_trans){
                                                            console.log("split_trans=====>"+split_trans)
                                                            if(split_status == '1'){
                                                                if(val.error_desc == 'Split Payout is not applicable.' && val.error_code == '52012'){
                                                                    split_trans.update({
                                                                        split_status : '1'
                                                                    }).then(function(split_trans_updated){
                                    
                                                                    })
                                                                }else{
                                                                    split_trans.update({
                                                                        split_status : '-1'
                                                                    }).then(function(split_trans_updated){
                                    
                                                                    })
                                                                }
                                                            }else if(split_status == '0'){
                                                                console.log("<=======000split_status000=====>")
                                                                if(order_type == '1'){

                                                                    console.log("<=======**************=====>")
                                                                    split_trans.update({
                                                                        a : edulab_split_share,
                                                                        b : university_split_share,
                                                                        cc_share : ccavenue_share,
                                                                        split_status : '1'
                                                                    }).then(function(split_trans_updated){
                                                                        console.log("Split Updated");

                                                                        var desc = 'Order id ('+split_trans.order_id+') Payment Split done for user_id ('+ord.user_id + ')';
                                                                        var activity = "Split Payment";
                                                                        var applicationId = ord.application_id;

                                                                        functions.activitylog(ord.user_id, activity, desc, applicationId,'guattestation');
                                                                    })
                                                                } 
                                                            }
                                                        }else{
        
                                                        }
                                                    });
                                                }
                                            });
                                        }, 500);
                                    //}
                    
                                }
                        );

                    }
                })
            });
        }
    });
})
    
//Split Call for MOI
cron.schedule('30 0 * * *', () => {
    models.Transaction.findAll({
        where:{
            split_status : '-1',
            source : 'gumoi',
            //tracking_id : transaction_id
        }
    }).then(function(trans){
        if(trans.length > 0){
            trans.forEach(function(tran){
                var reference_no ;
                var order_id ;
                //var transaction_id ;
                reference_no = tran.tracking_id;
                order_id = tran.order_id;
                //transaction_id = tran.merchant_param5;

                var statusTrackerData = {
                    "reference_no": reference_no,
                    //"order_no": order_id
                }
                var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);
                models.Orders.findOne({
                    where :{
                        id : order_id,
                        source : 'gumoi',
                    }
                }).then(function(ord){

                    if(ord){
                        console.log("order_id=====>"+order_id);
                        var order_type;
                        order_type = ord.order_id;

                        request.post(
                            "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2",
                                // { json: {enc_request:encRequest,accessCode:splitaccessCode,command:'createSplitPayout',request_type:'JSON',response_type:'JSON',version:'1.2'}},
                                function (error, response, body) {
                                    var statustracker_obj = qs.parse(response.body);
                    
                                    var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                    
                                    var status_pay = JSON.parse(dec_status);
                    
                                    var order_fee_perc_value = status_pay.order_fee_perc_value;
                                    console.log("order_fee_perc_value--->"+order_fee_perc_value)

                                    var order_tax = status_pay.order_tax;
                                    console.log("order_tax--->"+order_tax)
                    
                                    var order_fee_flat = status_pay.order_fee_flat;
                                    console.log("order_fee_flat--->"+order_fee_flat)

                                    var ccavenue_share = order_fee_perc_value + order_tax + order_fee_flat;
                                    console.log("ccavenue_share--->"+ccavenue_share)
                                    
                                    //if(order_type == '1'){
        
                                        // var university_split_share = 0;//236; 
                                        // console.log("university_split_share--->"+university_split_share)

                                        var university_split_share;// = 1000;
                                        console.log("ord.amount--->"+ord.amount)
                                        if(ord.amount == '436.00'){
                                            university_split_share = 200;
                                        }else if(ord.amount == '872.00'){
                                            university_split_share = 400;
                                        }

                                        console.log("university_split_share--->"+university_split_share)
                                    
                                        var edulab_split_share = ord.amount - ccavenue_share - university_split_share;
                                        console.log("edulab_split_share--->"+edulab_split_share)
                        
                                        var splitPaymentData = {
                                            'reference_no': reference_no, 
                                            'split_tdr_charge_type':'M',
                                            'merComm': ccavenue_share,
                                            'split_data_list': [
                                                {'splitAmount': edulab_split_share ,'subAccId':'EDU'}, //edulab
                                                {'splitAmount': university_split_share ,'subAccId':'GUJ261'} //GU university
                                            ]
                                        }
                                        setTimeout(function(){ 
                                            var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),workingKey);
                        
                                        request.post(
                                            "https://login.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
                                                // { json: {enc_request:encRequest,accessCode:accessCode,command:'createSplitPayout',request_type:'JSON',response_type:'JSON',version:'1.2'}},
                                            function (error, response, body) {
                                                // 
                                                // 
                                                var split_obj = qs.parse(response.body);
                                                //console.log('split_obj============'+JSON.stringify(split_obj))
                                                // 

                                                var dec_status1 = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                    
                                                var status_pay1 = JSON.parse(dec_status1);
                                                //console.log("status_pay1===>"+JSON.stringify(status_pay1));

                                                if(split_obj.status == '1'){
                                                    console.log("************1******************")
                                                    models.Transaction.findOne({
                                                        where:
                                                        {
                                                            tracking_id : reference_no
                                                        }
                                                    }).then(function(splitTrans){
                                                        if(splitTrans){
        
                                                            splitTrans.update({
                                                                split_status : '-1'
                                                            }).then(function(splitTrans_updated){
                                
                                                            })
                                                        }else{
        
                                                        }
                                                    });
                                                }else{
                                                    console.log("************0******************")
                                                    var dec_split = ccav.decrypt(split_obj.enc_response,workingKey);
        
                                                    var pay = JSON.parse(dec_split);
                                                    console.log("status_pay1===>"+JSON.stringify(pay));
        
                                                    var val = pay.Create_Split_Payout_Result;
        
                                                    var split_status = val.status;
        
                                                    models.Transaction.findOne({
                                                        where:
                                                        {
                                                            tracking_id : reference_no
                                                        }
                                                    }).then(function(split_trans){
                                                        if(split_trans){
                                                            console.log("split_trans=====>"+split_trans)
                                                            if(split_status == '1'){
                                                                if(val.error_desc == 'Split Payout is not applicable.' && val.error_code == '52012'){
                                                                    split_trans.update({
                                                                        split_status : '1'
                                                                    }).then(function(split_trans_updated){
                                    
                                                                    })
                                                                }else{
                                                                    split_trans.update({
                                                                        split_status : '-1'
                                                                    }).then(function(split_trans_updated){
                                    
                                                                    })
                                                                }
                                                            }else if(split_status == '0'){
                                                                console.log("<=======000split_status000=====>")
                                                                if(order_type == '1'){

                                                                    console.log("<=======**************=====>")
                                                                    split_trans.update({
                                                                        a : edulab_split_share,
                                                                        b : university_split_share,
                                                                        cc_share : ccavenue_share,
                                                                        split_status : '1'
                                                                    }).then(function(split_trans_updated){
                                                                        console.log("Split Updated");

                                                                        var desc = 'Order id ('+split_trans.order_id+') Payment Split done for user_id ('+ord.user_id + ')';
                                                                        var activity = "Split Payment";
                                                                        var applicationId = ord.application_id;

                                                                        functions.activitylog(ord.user_id, activity, desc, applicationId,'gumoi');
                                                                    })
                                                                } 
                                                            }
                                                        }else{
        
                                                        }
                                                    });
                                                }
                                            });
                                        }, 500);
                                    //}
                    
                                }
                        );

                    }
                })
            });
        }
    });
})

router.get('/splitInvoicePaymentCron',function(req,res){
    var trans = [112764890400, 112764983180, 112765239637, 112766356266]
   
   trans.forEach(function(tran){
       var reference_no ;
       var order_id ;
       var transaction_id ;
       reference_no = tran;
       transaction_id = tran;



       var statusTrackerData = {
           "reference_no": reference_no,
       }
       var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);
       
       request.post(
           "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderStatusTracker&request_type=JSON&response_type=JSON&version=1.2",
               // { json: {enc_request:encRequest,accessCode:splitaccessCode,command:'createSplitPayout',request_type:'JSON',response_type:'JSON',version:'1.2'}},
               function (error, response, body) {
                   var statustracker_obj = qs.parse(response.body);
   
                   var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                   //console.log("dec_status---->"+JSON.stringify(dec_status));
   
                   var status_pay = JSON.parse(dec_status);
   
                   var order_fee_perc_value = status_pay.order_fee_perc_value;
   
                   var order_tax = status_pay.order_tax;
   
                   var order_fee_flat = status_pay.order_fee_flat;

                   var ccavenue_share = order_fee_perc_value + order_tax + order_fee_flat; 
                   console.log("ccavenue_share--------/>"+ccavenue_share)

                   //console.log("status_pay.order_amt--------/>"+status_pay.order_amt)

                   var edulab_split_share = status_pay.order_amt - ccavenue_share;
                   console.log("edulab_split_share---->"+edulab_split_share);

       
                   var splitPaymentData = {
                       'reference_no': reference_no, 
                       'split_tdr_charge_type':'M',
                       'merComm': ccavenue_share,
                       'split_data_list': [
                           {'splitAmount': edulab_split_share ,'subAccId':'EDU'}, //edulab
                       ]
                   }

                   setTimeout(function(){ 
                       var split_encRequest = ccav.encrypt(JSON.stringify(splitPaymentData),workingKey);
               
                       var split_request = "https://login.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2";
   
                       request.post(
                           "https://login.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+split_encRequest+"&access_code="+accessCode+"&command=createSplitPayout&request_type=JSON&response_type=JSON&version=1.2",
                           function (error, response, body) {
                               var split_obj = qs.parse(response.body);
                               //console.log('split_obj============'+JSON.stringify(split_obj))
                               if(split_obj.status == '1'){
                                   console.log("split_obj.status=====>Error")
                               }else{
                                   var dec_split = ccav.decrypt(split_obj.enc_response,workingKey);
                                   console.log("dec_status---->"+reference_no+'--->'+JSON.stringify(dec_status));

                                   var pay = JSON.parse(dec_split);

                                   var val = pay.Create_Split_Payout_Result;
                                   //console.log("val------>"+val);
                                   console.log("JSON.stringify(val)------>"+JSON.stringify(val));

                                   var split_status = val.status;

                                   if(split_status == '1'){
                                       console.log("split_obj.status=====>Error")           
                                   }else if(split_status == '0'){
                                       console.log("split_obj.status=====>Success")
                                   }
                               }
                           });
                   }, 500);
                   
               }
       );
   });   
})

router.get('/mergeDocuments', function (req, res) {
    console.log('mergeDocuments');
    var user_id = req.body.user_id;
    var app_id = req.body.app_id;
    var mergeAllUserDocuments = "";
    models.User.findOne({
        where : {
            id : user_id
        }
    }).then(function(user){
        models.UserMarklist_Upload.findAll({
            where:{
                user_id : user_id,
                app_id : app_id,
                source : 'guattestation'
            }
        }).then(function (printData) {
            models.User_Transcript.findAll({
                where : {
                user_id : user_id,
                app_id : app_id,source : 'guattestation' 
                }
            }).then(function (print_transcript){
                let mergeDocumentsPromise = new Promise((resolve,reject)=>{
    
                    printData.forEach(student => {
                        console.log('inside datatatatatat');
                        // models.UserMarklist_Upload.getDocumentStatus(user_id, app_id).then(function(documentStatus){
                        //     console.log("documentStatus"+ JSON.stringify(documentStatus));
                        //     var status = '';
                        //     if(documentStatus.length > 0){
                               
                        //     }
                            var filePath = constant.FILE_LOCATION + "public/upload/documents/" + student.user_id + "/" + student.file_name;
                            console.log('filePathfilePathfilePathfilePath' +filePath);
                            if(fs.existsSync(filePath)){
                                var outputDirectory='';
                                var extension = student.file_name.split('.').pop();
                                var fileName = path.parse(student.file_name).name;
                                var folderName = fileName;
                                var numOfpages;
                                console.log("extension@@@@@" + extension);
                                console.log("fileName" + fileName);
                                if(extension == 'pdf'){
                                    console.log("if pdfffffffffffffffffffffff");
                                    let updateDocumentPromise = new Promise((resolve,reject)=>{
                                            
                                            console.log(folderName);
                                            outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+student.user_id+"/"+folderName+"/";
                                            console.log("outputDirectory 2 == " + outputDirectory);
                                            if(!fs.existsSync(outputDirectory)){
                                                fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
                                            }
                                            self_PDF.pdfToImageConversion(fileName,user_id,filePath,outputDirectory);
                                            let dataBuffer = fs.readFileSync(filePath);
                                                console.log("databuffer");
                                                pdf(dataBuffer).then(function(data) {
                                                console.log("no=====>"+data.numpages);  // number of pages
                                                numOfpages = data.numpages;
                                            });
    
                                            var fileString = "";
                                            setTimeout(()=>{
                                            outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+student.user_id+"/signed_"+folderName+"/";
                                            console.log("outputDirectory 2 == " + outputDirectory)
                                            if(!fs.existsSync(outputDirectory)){
                                                fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
                                            }
    
                                           // setTimeout(()=>{
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
                                                    console.log("j == " + j);
                                                    filePath =  constant.FILE_LOCATION+"public/upload/documents/"+student.user_id+"/"+ folderName +"/"+fileName+"-"+j+".jpg"; 
                                                    console.log("filePath == " + filePath);
                                                    file_name = fileName+"-"+j;
                                                    self_PDF.addAadharAndApp_id(file_name, user_id, app_id, filePath, outputDirectory,user.aadharNumber,function(err){
                                                        if(err){
                                                            return res.json({
                                                            status : 400,
                                                            message : err
                                                            })
                                                        }else{
                                                            fileString = fileString +' "'+ outputDirectory + fileName+"-"+j+'.pdf" '; 
                                                            console.log("fileString == " + fileString);
    
                                                        }
                                                    });
                                                }
                                            },3000);
    
                                                console.log(fileString)
                                            setTimeout(()=>{resolve(fileString)},5000);
                                        });
    
                                    updateDocumentPromise.then((values)=>{
                                        console.log("values == @@@@@" + JSON.stringify(values))
                                        outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + student.user_id + "/updatedDocuments/" ;
                                        if(!fs.existsSync(outputDirectory)){
                                            fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
                                        }
                                        var outputFile = outputDirectory + fileName + '.pdf';
                                        self_PDF.merge_uploaded(values, outputFile,  function(err){
                                            if(err){
                                                return res.json({
                                                    status : 400,
                                                    message : "Files cannot merge"
                                                })
                                            }else{
                                                 mergeAllUserDocuments = mergeAllUserDocuments +' "'+ outputFile + '" '; 
                                                // fs_extra.removeSync(FILE_LOCATION+"public/upload/documents/"+student.user_id+"/"+ folderName,{recursive : true,force:true});
                                                // fs_extra.removeSync(FILE_LOCATION+"public/upload/documents/"+student.user_id+"/signed_"+ folderName,{recursive : true,force:true});
                                            }
                                        });
                                    })
                                }else{
                                    console.log("No PDF");
                                    outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + student.user_id + "/updatedDocuments/" ;
                                    console.log("22222222");
                                    if(!fs.existsSync(outputDirectory)){
                                        fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
                                    }
                                    self_PDF.addAadharAndApp_id(fileName, user_id, app_id, filePath, outputDirectory,user.aadharNumber, function(err){
                                        if(err){
                                            return res.json({
                                                status : 400,
                                                message : err
                                            })
                                        }else{
                                             mergeAllUserDocuments = mergeAllUserDocuments +' "'+ outputDirectory + fileName + '.pdf" ';  
                                        }
                                    });
                                }
                            }
                        // })
                    });

                    print_transcript.forEach(student => {
                        // models.UserMarklist_Upload.getDocumentStatus(user_id, app_id).then(function(documentStatus){
                        //     console.log("documentStatus"+ JSON.stringify(documentStatus));
                        //     var status = '';
                        //     if(documentStatus.length > 0){
                               
                        //     }
                            var filePath = constant.FILE_LOCATION + "public/upload/documents/" + student.user_id + "/" + student.file_name;
                            console.log('filePathfilePathfilePathfilePath' +filePath);
                            if(fs.existsSync(filePath)){
                                var outputDirectory='';
                                var extension = student.file_name.split('.').pop();
                                var fileName = path.parse(student.file_name).name;
                                var folderName = fileName;
                                var numOfpages;
                                console.log("extension@@@@@" + extension);
                                console.log("fileName" + fileName);
                                if(extension == 'pdf'){
                                    console.log("if pdfffffffffffffffffffffff");
                                    let updateDocumentPromise = new Promise((resolve,reject)=>{
                                            
                                            console.log(folderName);
                                            outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+student.user_id+"/"+folderName+"/";
                                            console.log("outputDirectory 2 == " + outputDirectory);
                                            if(!fs.existsSync(outputDirectory)){
                                                fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
                                            }
                                            self_PDF.pdfToImageConversion(fileName,user_id,filePath,outputDirectory);
                                            let dataBuffer = fs.readFileSync(filePath);
                                                console.log("databuffer");
                                                pdf(dataBuffer).then(function(data) {
                                                console.log("no=====>"+data.numpages);  // number of pages
                                                numOfpages = data.numpages;
                                            });
    
                                            var fileString = "";
                                            setTimeout(()=>{
                                            outputDirectory = constant.FILE_LOCATION+"public/upload/documents/"+student.user_id+"/signed_"+folderName+"/";
                                            console.log("outputDirectory 2 == " + outputDirectory)
                                            if(!fs.existsSync(outputDirectory)){
                                                fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
                                            }
    
                                           // setTimeout(()=>{
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
                                                    console.log("j == " + j);
                                                    filePath =  constant.FILE_LOCATION+"public/upload/documents/"+student.user_id+"/"+ folderName +"/"+fileName+"-"+j+".jpg"; 
                                                    console.log("filePath == " + filePath);
                                                    file_name = fileName+"-"+j;
                                                    self_PDF.addAadharAndApp_id(file_name, user_id, app_id, filePath, outputDirectory,user.aadharNumber,function(err){
                                                        if(err){
                                                            return res.json({
                                                            status : 400,
                                                            message : err
                                                            })
                                                        }else{
                                                            fileString = fileString +' "'+ outputDirectory + fileName+"-"+j+'.pdf" '; 
                                                            console.log("fileString == " + fileString);
    
                                                        }
                                                    });
                                                }
                                            },3000);
    
                                                console.log(fileString)
                                            setTimeout(()=>{resolve(fileString)},5000);
                                        });
    
                                    updateDocumentPromise.then((values)=>{
                                        console.log("values == @@@@@" + JSON.stringify(values))
                                        outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + student.user_id + "/updatedDocuments/" ;
                                        if(!fs.existsSync(outputDirectory)){
                                            fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
                                        }
                                        var outputFile = outputDirectory + fileName + '.pdf';
                                        self_PDF.merge_uploaded(values, outputFile,  function(err){
                                            if(err){
                                                return res.json({
                                                    status : 400,
                                                    message : "Files cannot merge"
                                                })
                                            }else{
                                                 mergeAllUserDocuments = mergeAllUserDocuments +' "'+ outputFile + '" '; 
                                                // fs_extra.removeSync(FILE_LOCATION+"public/upload/documents/"+student.user_id+"/"+ folderName,{recursive : true,force:true});
                                                // fs_extra.removeSync(FILE_LOCATION+"public/upload/documents/"+student.user_id+"/signed_"+ folderName,{recursive : true,force:true});
                                            }
                                        });
                                    })
                                }else{
                                    console.log("No PDF");
                                    outputDirectory = constant.FILE_LOCATION + "public/upload/documents/" + student.user_id + "/updatedDocuments/" ;
                                    console.log("22222222");
                                    if(!fs.existsSync(outputDirectory)){
                                        fs.mkdirSync(outputDirectory, { recursive: true });//fs.writeFileSync
                                    }
                                    self_PDF.addAadharAndApp_id(fileName, user_id, app_id, filePath, outputDirectory,user.aadharNumber, function(err){
                                        if(err){
                                            return res.json({
                                                status : 400,
                                                message : err
                                            })
                                        }else{
                                             mergeAllUserDocuments = mergeAllUserDocuments +' "'+ outputDirectory + fileName + '.pdf" ';  
                                        }
                                    });
                                }
                            }
                        // })
                    });
    
                     setTimeout(()=>{resolve(mergeAllUserDocuments)},8000);
                });
        
            

            mergeDocumentsPromise.then((value)=>{
                var outputMergefile = constant.FILE_LOCATION+"public/upload/documents/"+user_id + "/" +app_id +"_UploadedMerge.pdf";
                self_PDF.merge_uploaded(mergeAllUserDocuments,outputMergefile,function(err){
                    if(err){
                        return res.json({
                            status : 400
                        })
                    }else{
                        // var todaysdate =  Moment(new Date()).format('DDMM');
                        // var year = Moment(new Date()).format('YYYY');
                        // var inwardNumber = 'V/' + todaysdate + ' of ' + year;
                        // models.Application.update({inward : inwardNumber }, {where  : {id :  app_id}});
                        res.json({
                            status : 200,
                            data : outputMergefile
                        })
                    }
                })
            })
        })
        })
    })
})

router.get('/orderlookup_single',function(req,res){
    console.log('orderlookup_single' + req.query.order_id)
    var order_id = req.query.order_id;
    var outercounter = 0;
    var ccavEncResponse='',
        ccavResponse='',    
        ccavPOST = '';
    var count = 0;
    var data =[];
    // var sendgrid  = require('sendgrid')(constant.SENDGRID_API_KEY);
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(constant.SENDGRID_API_KEY);

    /* FOR DATABASE QUERY */
    // var yesterday1     = moment().subtract(1, 'days').startOf('day');
    // var yesterdayNew  = '2023-01-08 00:00:00'; //yesterday1.format('YYYY-MM-DD HH:mm:ss');
    // var today1  = moment().endOf('day');
    // var todayNew = today1.format('YYYY-MM-DD HH:mm:ss');

    // /* FOR CC REQUEST */
    // var date = new Date();
    // var today =  (date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear()).toString() ;
    // // date.setDate(date.getDate()-1);
    // var yesterday = '19-01-2023';// yesterday1.format('DD-MM-YYYY').toString();

    models.Orders.findOne({
        where :{
            id : order_id
        }
    }).then(function(order){
        if(order){
            //orders.forEach(function(order){
                var statusTrackerData = {
                    'reference_no': '',
                    //'reference_no' : '',
                   'from_date' : moment(new Date(order.created_at)).format('DD-MM-YYYY'),//'25-01-2023' ,
                    // 'from_date' : order.created_ ,
                    // 'to_date' : ''+today,
                    'order_currency' :'INR',
                    'order_email' : '',
                    'order_fraud_status' : '',
                    'order_min_amount' : '',
                    'order_max_amount' : '',
                    'order_name' : '',
                    'order_no' : order.id,
                    'order_payment_type' : '',
                    'order_status' : 'Shipped',
                    'order_type' : '',
                    'order_bill_tel' : '',
                    'page_number' : '1'
                }
                var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);

                request.post(
                    "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderLookup&request_type=JSON&response_type=JSON&version=1.1",
                        function (error, response, body) {
                            count++;
                            var statustracker_obj = qs.parse(response.body);

                            var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
                            console.log("dec_status---->"+JSON.stringify(dec_status));

                            var status_pay = JSON.parse(dec_status);

                            if(status_pay.error_code != 51419 && status_pay.total_records > 0){
                                //DATA FOUND
                                models.User.findOne({
                                    where : {
                                        id : order.user_id
                                    }
                                }).then(function(user){
                                    console.log("status_pay.order_Status_List[0].order_nostatus_pay.order_Status_List[0].order_no" + status_pay.order_Status_List[0].order_no);
                                    models.Transaction.findOne({
                                        where : {
                                            order_id : status_pay.order_Status_List[0].order_no //order.id
                                        }
                                    }).then(async function(transaction){
                                        console.log("transactiontransaction" + JSON.stringify(transaction));
                                        if(transaction){
                                            //transaction already exist but not updated in order table
                                            console.log("Transaction exist")
                                            var app_id  = await functions.getApplicationFromOrders(order.user_id);
                                            models.Orders.findOne({
                                                where:{
                                                    id : order.id
                                                }
                                            }).then(function(order_update){
                                                if(order_update.status != '1'){
                                                    //not updated
                                                    console.log("not updated")
                                                    order_update.update({
                                                        status : '1',
                                                        timestamp : Moment(new Date()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
                                                        application_id :  app_id
                                                    })

                                                    // setApplicationID(user.id,order_update.application_id);
                                                    // applicationCreationMail(user.id,order_update.application_id);
                                                    // createEnrollmentNumber(user.id,order_update.application_id, order_update.updated_at);
                                                    models.Activitytracker.create({
                                                        activity : "Payment",
                                                        data : status_pay.order_Status_List[0].merchant_param2+" has been made payment for application "+order_update.application_id + ' for Attestation',
                                                        application_id : order_update.application_id,
                                                        source :'guattestation'
                                                    });
                                                }else{
                                                    //already updated
                                                    console.log("not updated")
                                                }
                                            })
                                        }else{
                                            //transaction not exist
                                            console.log("Transaction entry not exist")
                                            models.Transaction.create({
                                                order_id : order.id,
                                                tracking_id : status_pay.order_Status_List[0].reference_no,
                                                bank_ref_no : status_pay.order_Status_List[0].order_bank_ref_no,
                                                order_status : status_pay.order_Status_List[0].order_status ? 'Success' : status_pay.order_Status_List[0].order_status,
                                                payment_mode : 'online',
                                                currency : 'INR',
                                                amount : status_pay.order_Status_List[0].order_amt,
                                                billing_name : user.name,
                                                billing_address : user.address ? user.address.replace(/[&\/\\#+()$~%'":*?<>{}]/g," ") : "",
                                                billing_city : user.city ? user.city.replace(/[&\/\\#+()$~%'":*?<>{}]/g," ") : "",
                                                billing_state : user.state,
                                                billing_zip : user.postal_code,
                                                billing_country : user.country_birth,
                                                billing_tel : user.mobile,
                                                billing_email : user.email,
                                                merchant_param1 : status_pay.order_Status_List[0].merchant_param1,
                                                merchant_param2 : status_pay.order_Status_List[0].merchant_param2,
                                                merchant_param3 : status_pay.order_Status_List[0].merchant_param3,
                                                merchant_param4 : status_pay.order_Status_List[0].merchant_param4,
                                                merchant_param5 : status_pay.order_Status_List[0].merchant_param5,
                                                split_status : '-1'
                                            }).then(function(transaction_created){
                                                if(transaction_created){
                                                   console.log('transaction_created');
                                                }else{

                                                }
                                            }) 
                                        }
                                    })
                                })
                            }else{
                                console.log("NO data");
                                //NO SHIPPED DATA FOUND
                            }

                            
                        }
                );

            //}); 
        }else{
            //no order found
        }
    })
});


router.get('/setAppId',async function(req,res){
    var app_id= 3333 ;
    var user_id = 4958;
    var appliedforddetails = await functions.setAppId(app_id,user_id,'AppliedForDetails');
    if(appliedforddetails){
        console.log("14")
        var getApplied = await functions.getApplied(user_id,app_id);
        var usermarklist = await functions.setAppId(app_id,user_id ,'UserMarklist');
        if(getApplied.instructionalField == 1){
            console.log("15")
                var instructional = await functions.setAppId(app_id,user_id ,'Instructional');
                var marksheets = await functions.setAppId(app_id,user_id ,'Marksheets');
        }else{
            console.log("16")
            if(getApplied.attestedfor.includes('marksheet') || getApplied.attestedfor.includes('newmark')){
                var marksheets = await functions.setAppId(app_id,user_id ,'Marksheets');
           }
           if(getApplied.attestedfor.includes('degree')){
                var degree = await functions.setAppId(app_id,user_id ,'Degree');
           }
           if(getApplied.attestedfor.includes('transcript')){
                var transcript = await functions.setAppId(app_id,user_id ,'Transcript');
           }
        }

        var purpose = await functions.setAppId(app_id,user_id ,'purpose');
    }
});

router.get('/deleteEmailedDocs',async function(req,res){
    var app_id=  '2454';
    models.Emailed_Docs.findOne({
        where :{
            app_id  : app_id
        }
    }).then(function (user){
        console.log("user",user)
        user.destroy().then(function (ussr){
            res.json({
                status : 200
            })
        })
    })
   
});
module.exports = router;