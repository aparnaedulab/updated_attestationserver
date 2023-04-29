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
    workingKey = '1FD95763C4E31757EC1A56F06661B520';
    accessCode = 'AVDB91HC07BB02BDBB'; //
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
    workingKey = '19220C811E78848B76420041521DC0E1';
    accessCode = 'AVXY02GC57AA32YXAA'; //
    secureUrl = 'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
}

router.post('/paymentrequest',middlewares.getUserInfo,function(req,res){
    var currentdate = new Date(); 
    var year = currentdate.getFullYear();
    year = year.toString().substr(-2);
    var total_amount = req.body.total_amount;
    var incremented_Id;
    var transaction_id = req.User.id+"Y"+year+"M"+(currentdate.getMonth()+1)+"D"+currentdate.getDate()+"T"+currentdate.getHours()+currentdate.getMinutes()+currentdate.getSeconds();
    var merchant_id;

    if(req.User.id == '6551' || req.User.id == '6679' || req.User.id == '6910' || req.User.id == '33841' || req.User.id == '59759' || req.User.id == '65218'){
        total_amount = '1.00';
        workingKey = '1FD95763C4E31757EC1A56F06661B520';
        accessCode = 'AVDB91HC07BB02BDBB'; //
        secureUrl = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
    }

    if(req.User.id == '53774' || req.User.id =='54944' || req.User.id =='54946' || req.User.id =='54947' || req.User.id =='54948' || req.User.id =='54949' || req.User.id =='54950' || req.User.id =='54951' || req.User.id =='54952' || req.User.id =='54953' || req.User.id =='54954' || req.User.id =='54955' || req.User.id =='54956' || req.User.id =='54957' || req.User.id =='54958' || req.User.id =='54959' || req.User.id =='54961' || req.User.id =='54962' || req.User.id =='54963' || req.User.id =='54964' || req.User.id =='54966'){
        console.log("1")
        currency = 'INR';
        merchant_id = '783346';
        //total_amount = '10';
        workingKey = '1485DDD8F5987066FBFF4C93AF600CB1';
        accessCode = 'AVVL65JA71AU49LVUA'; //
        secureUrl = 'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
        if(req.User.id =='54944'){
            total_amount = '100';
        }else if(req.User.id =='54946'){
            total_amount = '200';
        }else if(req.User.id =='54947'){
            total_amount = '300';
        }else if(req.User.id =='54948'){
            total_amount = '400';
        }else if(req.User.id =='54949'){
            total_amount = '500';
        }else if(req.User.id =='54950'){
            total_amount = '600';
        }else if(req.User.id =='54951'){
            total_amount = '700';
        }else if(req.User.id =='54952'){
            total_amount = '800';
        }else if(req.User.id =='54953'){
            total_amount = '900';
        }else if(req.User.id =='54954'){
            total_amount = '1000';
        }else if(req.User.id =='54955'){
            total_amount = '1100';
        }else if(req.User.id =='54956'){
            total_amount = '1200';
        }else if(req.User.id =='54957'){
            total_amount = '1300';
        }else if(req.User.id =='54958'){
            total_amount = '1400';
        }else if(req.User.id =='54959'){
            total_amount = '1500';
        }else if(req.User.id =='54961'){
            total_amount = '1600';
        }else if(req.User.id =='54962'){
            total_amount = '1700';
        }else if(req.User.id =='54963'){
            total_amount = '1800';
        }else if(req.User.id =='54964'){
            total_amount = '1900';
        }else if(req.User.id =='54966'){
            total_amount = '2000';
        }
    }else{
        console.log("2")
        currency = 'INR';
        merchant_id = '252217';
    }
 
    models.Orders.find({
        where:{
            order_id : '1',
            user_id : req.User.id,
            amount :  total_amount,
            status : '0'
        }
    }).then(function(order_exists){
        if(order_exists){
            var paymentData = {
                merchant_id : merchant_id,
                order_id: order_exists.id,
                currency: 'INR',
                amount: total_amount,
                redirect_url: "https://mu.etranscript.in/api/payment/success-redirect-url",
                cancel_url: "https://mu.etranscript.in/api/payment/cancel-redirect-url", 
                language: 'EN',
                billing_name: req.User.name,
                billing_address: req.User.address1,
                billing_city: req.User.city,
                billing_state: req.User.state,
                billing_zip: req.User.postal_code,
                billing_country: 'India',
                billing_tel: req.User.mobile,
                billing_email: req.User.email,
                merchant_param1 : req.User.name,
                merchant_param2 : req.User.email,
                merchant_param3 : constant.BASE_URL,//req.User.mobile,
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
                    id : incremented_Id,
                    order_id : '1',
                    user_id : req.User.id,
                    application_id : '0',
                    timestamp : functions.get_current_datetime(),
                    amount :  total_amount,
                    status : '0'
                }).then(function(order_created){
                    if(order_created){
                        var paymentData = {
                            merchant_id : merchant_id,
                            order_id: order_created.id,
                            currency: 'INR',
                            amount: total_amount,
                            redirect_url: "https://mu.etranscript.in/api/payment/success-redirect-url",
                            cancel_url: "https://mu.etranscript.in/api/payment/cancel-redirect-url", 
                            language: 'EN',
                            billing_name: req.User.name,
                            billing_address: req.User.address1,
                            billing_city: req.User.city,
                            billing_state: req.User.state,
                            billing_zip: req.User.postal_code,
                            billing_country: 'India',
                            billing_tel: req.User.mobile,
                            billing_email: req.User.email,
                            merchant_param1 : req.User.name,
                            merchant_param2 : req.User.email,
                            merchant_param3 : constant.BASE_URL,//req.User.mobile,
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
});
 
router.post('/success-redirect-url',function(req,res){
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
        // models.User.find({
        //     where : {
        //         email : obj.merchant_param2 
        //     }
        // }).then(function(user){
        models.User.getUserDetailsByemail(obj.merchant_param2 ).then(user =>{
            models.Cart.findAll({
                where:
                {
                    user_id : user[0].id
                }
            }).then(function(cart){
                //total_amount = 1000 * cart.length;
                total_amount = obj.mer_amount;
                models.Application.findAll({
                    where :{
                        user_id : user[0].id 
                    }
                }).then(function(applications){
                    var appStatus ;
                    if(applications.length > 0){
                        appStatus = 'repeat'
                    }else{
                        appStatus = 'new'
                    }
                
                    models.Application.create({
                        tracker : 'apply',
                        status : appStatus,
                        total_amount : total_amount,
                        user_id : user[0].id
                    }).then(function(created){
                        if(created){
                            models.Orders.find({
                                where:
                                {
                                    id : obj.order_id
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

                                    models.Transaction.find({
                                        where  :{
                                            tracking_id  : obj.tracking_id 
                                        }
                                    }).then(function (checktranasction){
                                    setTimeout(()=>{
                                        if(checktranasction){
                                            res.redirect("http://mu.etranscript.in/app/#/pages/PaymentSuccess?order_id="+obj.order_id);

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
                                                split_status : '-1'
                                            }).then(function(transaction_created){
                                                if(transaction_created){
                                                    var userName = user[0].name + ' ' + user[0].surname;
                                                    updateAppId(user[0].id, user[0].educationalDetails,user[0].instructionalField,user[0].curriculum,user[0].gradToPer,created.id,user[0].affiliation,user[0].CompetencyLetter,user[0].LetterforNameChange);
                                                    cart.forEach(function(single_cart){
                                                        outercounter ++ ;
                                                        models.Institution_details.find({
                                                            where:
                                                            {
                                                                id : single_cart.institute_id
                                                            }
                                                        }).then(function(inst_detail){
                                                        var desc = user.name+"( "+user.email+" ) made payment for Institute ( "+inst_detail.university_name+" ).";
                                                        var activity = "Payment";
                                                        var applicationId = created.id;
                                                        functions.activitylog(user.id, activity, desc, applicationId);
                                                            inst_detail.update({
                                                                app_id : created.id
                                                            }).then(function(inst_updated){
                                                                models.Hrd_details.findAll({
                                                                    where :{
                                                                        user_id : user[0].id
                                                                    }
                                                                }).then(function (hrdApp_id){
                                                                    if(hrdApp_id.length > 0){
                                                                        models.Hrd_details.update({
                                                                            app_id : created.id
                                
                                                                        }, {
                                                                            where: {
                                                                                user_id : user[0].id
                                                                            }
                                                                        }).then(function (data) {
                                                                        
                                                                        })
                                                                        
                                                                    }
                                                                 
                                                                                
                                                                    // else{
                                                                        models.Cart.destroy({
                                                                            where:{
                                                                                institute_id : inst_updated.id,   
                                                                            }
                                                                        }).then(function(cart_deleted){

                                                                        });
                                                                    // }
                                                            })
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
                                                        if(user[0].affiliation == true)
                                                            sendEmailInstitiuteAffiliationLetter(user[0].id,userName,created.id)
                                                        if(user[0].CompetencyLetter == true)
                                                        sendEmailInstituteCompetency(user[0].id,userName,created.id)

                                                 
                                                            sendEmailStudent(user[0].id,user[0].email,userName,created.id);
                                                        
                                                    },2000)
        
                                                    if(outercounter == cart.length){
                                                    //
                                                        res.redirect("http://mu.etranscript.in/app/#/pages/PaymentSuccess?order_id="+obj.order_id);
                                                        // res.json({
                            
                                                        // })
                                                    }
                                                }
                                            });
                                        }
                                    },5000)
                                    })
                                  
                                });
                            });
                        }
                    })  
                })
            });
        });
    }else{
        models.Orders.find({
            where:
            {
                id : obj.order_id
            }
        }).then(function(ord){
            if(obj.order_status == 'Failure'){
                ord.update({
                    status : '-1'
                }).then(function(updated){
                    res.redirect("http://mu.etranscript.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Timeout'){
                ord.update({
                    status : '2'
                }).then(function(updated){
                    res.redirect("http://mu.etranscript.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Aborted'){
                ord.update({
                    status : '3'
                }).then(function(updated){
                    res.redirect("http://mu.etranscript.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Invalid'){
                ord.update({
                    status : '4'
                }).then(function(updated){
                    res.redirect("http://mu.etranscript.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else{
                ord.update({
                    status : '5'
                }).then(function(updated){
                    res.redirect("http://mu.etranscript.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }
        });
    }

    function sendEmailInstitute(user_id,user_name,app_id){
        var userTranscripts = [];
        var userMarkLists = [];
        models.User_Transcript.findAll({
            where :{
                user_id : user_id
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
                        singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+ user_id + "/" + urlencode(transcript.file_name)});
                        collegeData.push(singleCollege);
                    }else{
                        var transcriptFlag = false;
                        for(var i = 0; i<collegeData.length; i++){
                            if(collegeData[i].college_id == transcript.collegeId){
                                //console.log("----1111----");
                                collegeData[i].user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+user_id + "/" + urlencode(transcript.file_name)});
                                transcriptFlag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                            singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+user_id + "/" + urlencode(transcript.file_name)});
                            collegeData.push(singleCollege);
                        }
                    }
                })
            });
            models.userMarkList.find({
                where : {
                    user_id : user_id
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
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    //console.log("----1111----");
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        //flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));

                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);

                                }
                            }
                        }
                    });
                })
                setTimeout(function(){
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
                    })
                },1000);
            });
            })
        })
    }
    function sendEmailInstituteCompetency(user_id,user_name,app_id){
        var userTranscripts = [];
        var userMarkLists = [];
        models.CompetencyLetter.findAll({
            where :{
                user_id : user_id
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
                        singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/CompetencyLetter/'+ user_id + "/" + urlencode(transcript.file_name)});
                        collegeData.push(singleCollege);
                    }else{
                        var transcriptFlag = false;
                        for(var i = 0; i<collegeData.length; i++){
                            if(collegeData[i].college_id == transcript.collegeId){
                                //console.log("----1111----");
                                collegeData[i].user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/CompetencyLetter/'+user_id + "/" + urlencode(transcript.file_name)});
                                transcriptFlag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                            singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/CompetencyLetter/'+user_id + "/" + urlencode(transcript.file_name)});
                            collegeData.push(singleCollege);
                        }
                    }
                })
            });
            models.userMarkList.find({
                where : {
                    user_id : user_id
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
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    //console.log("----1111----");
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        //flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));

                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);

                                }
                            }
                        }
                    });
                })
                setTimeout(function(){
                    request.post(constant.BASE_URL_SENDGRID + 'CompetencyLetterVerification', {
                        json: {
                            collegeData : collegeData
                        }
                    },
                     function (error, response, body) {
                        if(body.notSent.length > 0){
                            body.noteSent.forEach(data=>{
                                models.CompetencyLetter.updateSingleCollegeEmailStatus(user_id,data.college_id,null,'not sent');
                            })
                        }
                        body.data.forEach(msgId=>{
                            models.CompetencyLetter.updateSingleCollegeEmailStatus(user_id,msgId.college_id,msgId.msg_id,'sent');
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
                    user_id : user_id
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
                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                            collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);

                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    //console.log("----1111----");
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                    collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                    break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break; 
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                            collegeData : collegeData
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

    function sendEmailInstitiuteAffiliationLetter(user_id,user_name,app_id){
        var collegeData = [];
        var userMarkLists = [];
        models.InstructionalDetails.find({
            where :{
                userId : user_id
            }
        }).then(function(instructional){
            models.userMarkList.find({
                where : {
                    user_id : user_id
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
                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                            collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);

                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    //console.log("----1111----");
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                    collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                    break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break; 
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                    
                                }
                            }
                        }
                    });
                })
                setTimeout(()=>{
                    console.log("collegeData == " + JSON.stringify(collegeData));
                    request.post(constant.BASE_URL_SENDGRID + 'affiliationVerificationEmail', {
                        json: {
                            collegeData : collegeData
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
                                //console.log("----1111----");
                                collegeData[i].user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+user_id + "/" + urlencode(curriculum.file_name)});
                                transcriptFlag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                    user_id : user_id
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
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    //console.log("----1111----");
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                    collegeData.push(singleCollege);
                                }

                            }
                        }
                    });
                })
                setTimeout(function(){
                    console.log("collegeData == " + JSON.stringify(collegeData));
                    request.post(constant.BASE_URL_SENDGRID + 'curriculumVerificationEmail', {
                        json: {
                            collegeData : collegeData
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
                                //console.log("----1111----");
                                collegeData[i].letter.push({'fileName':letter.file_name,'letter':'upload/gradeToPercentLetter/'+user_id + "/" + urlencode(letter.file_name)});
                                transcriptFlag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                    user_id : user_id
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
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    //console.log("----1111----");
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        //flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));

                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);

                                }
                            }
                        }
                    });
                })
                setTimeout(function(){
                    request.post(constant.BASE_URL_SENDGRID + 'gradeLetterVerificationEmail', {
                        json: {
                            collegeData : collegeData
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

    function sendEmailStudent(user_id,user_email,user_name,app_id){
        var collegeData = [];
        models.Applied_For_Details.find({
            where :{
                user_id : user_id,
                app_id : app_id
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
                    request.post(constant.BASE_URL_SENDGRID + 'applicationGeneratedNotification', {
                        json: {
                            collegeData : collegeData,
                            userEmail : user_email,
                            userName : user_name
                        }
                    }, function (error, response, body) {})
                },1000)
            })
        })
    }

	function updateAppId(user_id, educationalDetails,instructionalField,curriculum,gradToPer,app_id,affiliation,CompetencyLetter,LetterforNameChange){
		models.Applied_For_Details.find({
			where :{
				user_id : user_id,
				app_id : {
					[Op.eq] : null
				}
			}
		}).then(function(appliedForDetails){
			appliedForDetails.update({
				app_id : app_id
			}).then(function(updated){
				models.userMarkList.find({
					where : {
						user_id : user_id
					}
				}).then(function(userMarkLists){
					if(userMarkLists.previous_data == true){
						if(educationalDetails == true){
							models.User_Transcript.findAll({
								where : {
									user_id : user_id
								}
							}).then(function(UserTranscriptsData){  
							//   console.log("UserTranscriptsData===>"+JSON.stringify(UserTranscriptsData));
								if(UserTranscriptsData.length > 0){
									UserTranscriptsData.forEach((transcript)=>{
										var appID ;
										if(transcript.app_id == null || transcript.app_id == ''){
											appID = app_id
											models.User_Transcript.update(
												{   app_id  : appID},
												{   where   :  { id : transcript.id}
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
												})
										}else {
											appID = transcript.app_id+","+app_id
											models.User_Transcript.update(
												{   app_id  : appID},
												{   where   :  { id : transcript.id}
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
							//   console.log("User_CurriculumsData===>"+JSON.stringify(User_CurriculumsData));
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
							//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
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

                        if(affiliation == true){
							models.Affililation_Letter.findAll({
								where : {
									user_id : user_id
								}
							}).then(function(AffiliationData){  
							//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
								if(AffiliationData.length > 0){
									AffiliationData.forEach((data)=>{
										var appID ;
										if(data.app_id == null || data.app_id == ''){
											appID = app_id
											models.Affililation_Letter.update(
												{   app_id  : appID},
												{   where   :  { id : data.id}
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
												})
										}else {
											appID = data.app_id+","+app_id
											models.Affililation_Letter.update(
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
								//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
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
								user_id : user_id
							}
						}).then(function(userMarkListsData){  
						//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
							if(userMarkListsData.length > 0){
								userMarkListsData.forEach((marklist)=>{
									var appID ;
									if(marklist.app_id == null || marklist.app_id == ''){
										appID = app_id
										models.userMarkList.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id}
											}).then((err,updated)=>{
												if(err){
													console.error(err);
												}
											})
									}else {
										appID = marklist.app_id+","+app_id
										models.userMarkList.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id}
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
								user_id : user_id
							}
						}).then(function(userMarkListUploadsData){  
						//     console.log("userMarkListUploadsData===>"+JSON.stringify(userMarkListUploadsData));
							if(userMarkListUploadsData.length > 0){
								userMarkListUploadsData.forEach((marklist)=>{
									var appID ;
									if(marklist.app_id == null || marklist.app_id == ''){
										appID = app_id
										models.UserMarklist_Upload.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id}
											}).then((err,updated)=>{
												if(err){
													console.error(err);
												}
											})
									}else {
										appID = marklist.app_id+","+app_id
										models.UserMarklist_Upload.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id}
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
									}
								}
							}).then(function(UserTranscriptsData){  
							//    console.log("UserTranscriptsData===>"+JSON.stringify(UserTranscriptsData));
								if(UserTranscriptsData.length > 0){
									UserTranscriptsData.forEach((transcript)=>{
										models.User_Transcript.update(
										{   app_id  : app_id},
										{   where   :  { id : transcript.id}
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
							//   console.log("User_CurriculumsData===>"+JSON.stringify(User_CurriculumsData));
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

                        if(affiliation == true){
							models.Affililation_Letter.findAll({
								where : {
									userId : user_id,
									app_id : {
										[Op.eq] : null
									}
								}
							}).then(function(affiliationData){  
								if(affiliationData.length > 0){
									affiliationData.forEach((data)=>{
										models.Affililation_Letter.update(
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
								//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
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
                        if(CompetencyLetter == true){
							models.competency_letter.findAll({
								where : {
									user_id : user_id,
									app_id : {
										[Op.eq] : null
									}
								}
							}).then(function(CompetencyLetter){  
								//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
								if(CompetencyLetter.length > 0){
									CompetencyLetter.forEach((data)=>{
										models.CompetencyLetter.update(
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

                        if(LetterforNameChange == true){
							models.Letterfor_NameChange.findAll({
								where : {
									user_id : user_id,
									app_id : {
										[Op.eq] : null
									}
								}
							}).then(function(LetterforNameChange){  
								//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
								if(LetterforNameChange.length > 0){
									LetterforNameChange.forEach((data)=>{
										models.Letterfor_NameChange.update(
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
								//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
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
								}
							}
						}).then(function(userMarkListsData){  
						//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
							if(userMarkListsData.length > 0){
								userMarkListsData.forEach((marklist)=>{
									models.userMarkList.update(
									{   app_id  : app_id},
									{   where   :  { id : marklist.id}
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
								}
							}
						}).then(function(userMarkListUploadsData){  
						//     console.log("userMarkListUploadsData===>"+JSON.stringify(userMarkListUploadsData));
							if(userMarkListUploadsData.length > 0){
								userMarkListUploadsData.forEach((marklist)=>{
									models.UserMarklist_Upload.update(
									{   app_id  : app_id},
									{   where   :  { id : marklist.id}
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
});

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
            id : req.query.details
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
            id : obj.order_id
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
   res.redirect("http://mu.etranscript.in/app/#/pages/FirstCancel");
});


router.post('/PaymentDetails',middlewares.getUserInfo,function(req,res){
  //
   var view_data = {};
   models.Feedback.find({
       where:{
           user_id : req.User.id
       }
   }).then(function(feedback){
       if(feedback){
           view_data.feedback = true;
       }else{
           view_data.feedback = false;
       }
       models.Orders.find({
           where:
           {
               id : req.body.order_id
           }
       }).then(function(order){
           if(order){
              //
               models.Transaction.find({
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
     models.Orders.find({
         where :{
             application_id : req.body.application_id,
             order_id : 1,
             status : '1'
         }
     }).then(function(orders){
         if(orders){
             models.Transaction.find({
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
                             res.send({ status: 200,data: constant.FILE_LOCATION+"public/upload/transcript/"+user_id+"/"+application_id+"_Attestation_Payment_Challan.pdf"});
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
     const downloadData = constant.FILE_LOCATION +'public/upload/transcript/'+userId+'/'+ file_name;
     res.download(downloadData);
});

router.get('/download', function (req, res) {
    var file_name = req.query.file_name;
    var userId = req.user.id;
    const downloadData = constant.FILE_LOCATION + "public/upload/transcript/" + userId + "/" + file_name;
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
           status : '1'
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
                                            id : split_trans.order_id
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
										id : split_trans.order_id
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
    if(split_value[0] == 3){
        console.log('coming in 3')
        /* FOR DATABASE QUERY */
        var yesterday1     = moment().subtract(1, 'days').startOf('day');
        yesterdayNew  =  yesterday1.format('YYYY-MM-DD') + ' 13:00:00';
        var today1  = moment().endOf('day');
        todayNew = today1.format('YYYY-MM-DD') + ' 13:00:00';

        /* FOR CC REQUEST */
        var date = new Date();
        var today =  (date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear()).toString();
        yesterday =  yesterday1.format('DD-MM-YYYY').toString();
    }else{
        /* FOR DATABASE QUERY */
        var yesterday1     = moment().subtract(1, 'days').startOf('day');
        yesterdayNew  =  yesterday1.format('YYYY-MM-DD HH:mm:ss');
        var today1  = moment().endOf('day');
        todayNew = today1.format('YYYY-MM-DD HH:mm:ss');

        /* FOR CC REQUEST */
        var date = new Date();
        var today =  (date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear()).toString();
        yesterday =  yesterday1.format('DD-MM-YYYY').toString();
    }
    models.Orders.getOrderID(yesterdayNew,todayNew).then(function(orders){
        console.log("orders.length---->"+orders.length);
        if(orders){
            orders.forEach(function(order){
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
                    'order_no' : ''+order.id,
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
                                // console.log("dec_status---->"+JSON.stringify(dec_status));

                                var status_pay = JSON.parse(dec_status);

                                if(status_pay.error_code != 51419 && status_pay.total_records > 0 ){
                                    //DATA FOUND
                                    
                                    models.User.getUserDetailsByemail(obj.merchant_param2 ).then(users =>{
                                    models.User.find({
                                        where : {
                                            id : order.user_id
                                        }
                                    }).then(function(user){
                                        models.Transaction.find({
                                            where : {
                                                order_id : status_pay.order_Status_List[0].order_no //order.id
                                            }
                                        }).then(function(transaction){
                                            if(transaction){
                                                //transaction already exist but not updated in order table
                                                models.Orders.find({
                                                    where:{
                                                        id : order.id
                                                    }
                                                }).then(function(order_update){
                                                    if(order_update.status != '1'){
                                                        //not updated
                                                        console.log("not updated")
                                                        mailOrder(order.id, user.name, user.email,'order updated',order_update.amount,transaction.tracking_id)
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
                                                models.Transaction.create({
                                                    order_id : order.id,
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
                                                    split_status : '-1'
                                                }).then(function(transaction_created){
                                                    if(transaction_created){
                                                        mailOrder(order.id, user.name, user.email,'transaction created',transaction_created.amount,transaction_created.tracking_id)
                                                        models.Orders.find({
                                                            where:{
                                                                id : transaction_created.order_id
                                                            }
                                                        }).then(function(order_update){
                                                            if(order_update){
                                                                order_update.update({
                                                                    status : '1',
                                                                        timestamp : functions.get_current_datetime(),
                                                                })
                                                            }
                                                        })
                                                        models.Cart.findAll({
                                                            where:
                                                            {
                                                                user_id : user.id
                                                            }
                                                        }).then(function(cart){
                                                            //total_amount = 1000 * cart.length;
                                                            total_amount = order.amount;
                                                            models.Application.create({
                                                                tracker : 'apply',
                                                                status : 'new',
                                                                total_amount : total_amount,
                                                                user_id : user.id
                                                            }).then(function(created){
                                                                if(created){
                                                                    models.Orders.find({
                                                                        where:
                                                                        {
                                                                            id : order.id
                                                                        }
                                                                    }).then(function(order){
                                                                        order.update({
                                                                            application_id : created.id,
                                                                        }).then(function(order_updated){
                                                                            cart.forEach(function(single_cart){
                                                                                outercounter ++ ;
                                                                                var userName = user.name + ' ' + user.surname;
                                                                                updateAppId(users[0].id, users[0].educationalDetails,users[0].instructionalField,users[0].curriculum,users[0].gradToPer,created.id,users[0].affiliation,users[0].CompetencyLetter,users[0].LetterforNameChange);
                                                                                if(users[0].educationalDetails == true)
                                                                                    sendEmailInstitute(users[0].id,userName,created.id);
                                                                                if(users[0].instructionalField == true)
                                                                                    sendEmailInstituteInstructional(users[0].id,userName,created.id);
                                                                                if(users[0].curriculum == true)
                                                                                    sendEmailInstituteCurriculum(users[0].id,userName,created.id);
                                                                                if(users[0].gradToPer == true)
                                                                                    sendEmailInstitiuteGradeTOPercentLetter(users[0].id,userName,created.id); 
                                                                                if(user[0].affiliation == true)
                                                                                    sendEmailInstitiuteAffiliationLetter(user[0].id,userName,created.id)
                                                                                if(users[0].CompetencyLetter == true)
                                                                                     sendEmailInstituteCompetency(users[0].id,userName,created.id)

                                                                            sendEmailStudent(users[0].id,users[0].email,userName,created.id);


                                                                                models.Institution_details.find({
                                                                                    where:
                                                                                    {
                                                                                        id : single_cart.institute_id
                                                                                    }
                                                                                }).then(function(inst_detail){
                                                                                    var desc = user.name+"( "+user.email+" ) made payment for Institute ( "+inst_detail.university_name+" ).";
                                                                                    var activity = "Cron Payment";
                                                                                    var applicationId = created.id;
                                                                                    functions.activitylog(user.id, activity, desc, applicationId);
                                                                                    inst_detail.update({
                                                                                        app_id : created.id
                                                                                    }).then(function(inst_updated){
                                                                                        models.Hrd_details.findAll({
                                                                                            where : {
                                                                                                user_id : user.id
                                                                                            }
                                                                                        }).then(function (hrd_App_id){
                                                                                        
                                                                                                if(hrd_App_id.length > 0){
                                                                                                    models.Hrd_details.update({
                                                                                                        app_id : created.id
                                                            
                                                                                                    }, {
                                                                                                        where: {
                                                                                                            user_id : user[0].id
                                                                                                        }
                                                                                                    }).then(function (data) {
                                                                                                    
                                                                                                    })
                                                                                                    
                                                                                                }
                                                                                            
                                                                                            // else{
                                                                                                models.Cart.destroy({
                                                                                                    where:{
                                                                                                        institute_id : inst_updated.id,   
                                                                                                    }
                                                                                                }).then(function(cart_deleted){
                                                                                                    //
                                                                                                });
                                                                                            // }
                                                                                        })
                                                                                     
                                                                                    });
                                                                                });
                                                                            });
                                                                        });
                                                                    });
                                                                }
                                                            })  
                                                        });

                                                        
                                                    }else{

                                                    }
                                                }) 
                                            }
                                        })
                                    })
                                })
                                }else{
                                    //NO SHIPPED DATA FOUND
                                }

                                if(count == orders.length){
                                    setTimeout(function(){
                                        if(data.length > 0){
                                            var xls = json2xls(data);
                                            var file_location = constant.FILE_LOCATION + "public/upload/payment_details_in_excel/ApiCallTransactionDetails.xlsx";
                                            fs.writeFileSync(file_location, xls, 'binary');
                                            var file_name = "ApiCallTransactionDetails.xlsx";
                                            setTimeout(function(){
                                                
                            
                                                base64.encode(constant.FILE_LOCATION+"public/upload/payment_details_in_excel/ApiCallTransactionDetails.xlsx", function(err, base64String) {
                                                    const msg = {
                                                        to: 'pooja@edulab.in',
                                                        from: 'info@etranscript.in',
                                                        subject: 'Fail - Attestation record',
                                                        text:  '<br>Kindly check attached excel sheet for Api Call Transaction Details \n\n',
                                                        html: 
                                                        '<br>Kindly check attached excel sheet for Api Call Transaction Details \n\n',
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
                                                    const msgShweta = {
                                                        to: 'shweta@edulab.in',
                                                        from: 'info@etranscript.in',
                                                        subject: 'Fail - Attestation record',
                                                        text:  '<br>Kindly check attached excel sheet for Api Call Transaction Details \n\n',
                                                        html: 
                                                        '<br>Kindly check attached excel sheet for Api Call Transaction Details \n\n',
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
                                                    //sgMail.send(msg);
                                                    // sgMail.send(msgShweta);
                                                });
                                                                                
                                            },5000);
                                        }else{
                                            const msgShweta = {
                                                to: 'shweta@edulab.in',
                                                from: 'info@etranscript.in',
                                                subject: 'Fail - Attestation NO record',
                                                text:  '<br>NO Records found for Api Call Transaction Details \n\n',
                                                html: 
                                                '<br>NO Records found for Api Call Transaction Details \n\n',
                                            };
                                            // sgMail.send(msgShweta);
                                        }
                                    },5000)
                                }
                            }
                        }
                );

            }); 
        }else{
            //no order found
        }
    })

    //For Mail which order_id updated in transaction table.
    function mailOrder(order_id, stu_name, stu_email, action, amount, tracking_id){
        data.push({
            stu_name : stu_name,
            stu_email : stu_email,
            order_id : order_id,
            cc_reference_no : tracking_id,
            amount : amount,
            action : action
        })
    }

    function sendEmailInstitute(user_id,user_name,app_id){
        models.User_Transcript.findAll({
            where :{
                user_id : user_id
            }
        }).then(function(userTranscripts){
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
                        singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+ user_id + "/" + urlencode(transcript.file_name)});
                        collegeData.push(singleCollege);
                    }else{
                        var transcriptFlag = false;
                        for(var i = 0; i<collegeData.length; i++){
                            if(collegeData[i].college_id == transcript.collegeId){
                                //console.log("----1111----");
                                collegeData[i].user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+user_id + "/" + urlencode(transcript.file_name)});
                                transcriptFlag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                            singleCollege.user_transcript.push({'fileName':transcript.file_name,'transcript':'upload/transcript/'+user_id + "/" + urlencode(transcript.file_name)});
                            collegeData.push(singleCollege);
                        }
                    }
                })
            });
            models.userMarkList.find({
                where : {
                    user_id : user_id
                }
            }).then(function(userMarkListsData){  
               models.UserMarklist_Upload.getMarksheetDataSendToInstitute(userMarkListsData.user_id).then(function(userMarkLists){      
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
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    //console.log("----1111----");
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        //flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));

                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);

                                }
                            }
                        }
                    });
                })
                setTimeout(function(){
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
                    })
                },1000);
            });
            })
        })
    }

    function sendEmailInstituteInstructional(user_id,user_name, app_id){
        var collegeData = [];
        models.InstructionalDetails.find({
			where :{
				userId : user_id
			}
		}).then(function(instructional){
			models.userMarkList.find({
				where : {
					user_id : user_id
				}
			}).then(function(userMarkListsData){
              models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){      
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
							singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                            collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);

                            }
						}else{
							var flag = false;
							for(var i = 0; i<collegeData.length; i++){
								if(collegeData[i].college_id == markList.collegeId){
                                    //console.log("----1111----");
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
									collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
									flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                    break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;
                                        break; 
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
									    flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
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
							collegeData : collegeData
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
        models.User_Curriculum.findAll({
            where :{
                user_id : user_id
            }
        }).then(function(userCurriculums){
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
                                //console.log("----1111----");
                                collegeData[i].user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+user_id + "/" + urlencode(curriculum.file_name)});
                                transcriptFlag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                    user_id : user_id
                }
            }).then(function(userMarkListsData){  
                models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){      
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
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    //console.log("----1111----");
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name ,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name )});
                                    collegeData.push(singleCollege);
                                }

                            }
                        }
                    });
                })
                setTimeout(function(){
					console.log("collegeData == " + JSON.stringify(collegeData));
                    request.post(constant.BASE_URL_SENDGRID + 'curriculumVerificationEmail', {
                        json: {
                            collegeData : collegeData
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
                                //console.log("----1111----");
                                collegeData[i].letter.push({'fileName':letter.file_name,'letter':'upload/gradeToPercentLetter/'+user_id + "/" + urlencode(letter.file_name)});
                                transcriptFlag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                    user_id : user_id
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
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                collegeData.push(singleCollege);
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                collegeData.push(singleCollege);
                            }
                        }else{
                            var flag = false;
                            for(var i = 0; i<collegeData.length; i++){
                                if(collegeData[i].college_id == markList.collegeId){
                                    //console.log("----1111----");
                                    if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
                                        break;
                                    }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                        collegeData[i].user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                        //flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
    
                                        collegeData[i].user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                        flag = true;//console.log("CollegeData 1 == " + JSON.stringify(collegeData));
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
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
                                }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                    singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                    collegeData.push(singleCollege);
                                    singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                                    collegeData.push(singleCollege);
    
                                }
                            }
                        }
                    });
                })
                setTimeout(function(){
                    request.post(constant.BASE_URL_SENDGRID + 'gradeLetterVerificationEmail', {
                        json: {
                            collegeData : collegeData
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
    
    function sendEmailStudent(user_id,user_email,user_name,app_id){
        var collegeData = [];
        models.Applied_For_Details.find({
            where :{
                user_id : user_id,
                app_id : app_id
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
                    request.post(constant.BASE_URL_SENDGRID + 'applicationGeneratedNotification', {
                        json: {
                            collegeData : collegeData,
                            userEmail : user_email,
                            userName : user_name
                        }
                    }, function (error, response, body) {})
                },1000)
            })
        })
    }

    function updateAppId(user_id, educationalDetails,instructionalField,curriculum,gradToPer,app_id,affiliation,CompetencyLetter,LetterforNameChange){
		models.Applied_For_Details.find({
			where :{
				user_id : user_id,
				app_id : {
					[Op.eq] : null
				}
			}
		}).then(function(appliedForDetails){
			appliedForDetails.update({
				app_id : app_id
			}).then(function(updated){
				models.userMarkList.find({
					where : {
						user_id : user_id
					}
				}).then(function(userMarkLists){
					if(userMarkLists.previous_data == true){
						if(educationalDetails == true){
							models.User_Transcript.findAll({
								where : {
									user_id : user_id
								}
							}).then(function(UserTranscriptsData){  
							//   console.log("UserTranscriptsData===>"+JSON.stringify(UserTranscriptsData));
								if(UserTranscriptsData.length > 0){
									UserTranscriptsData.forEach((transcript)=>{
										var appID ;
										if(transcript.app_id == null || transcript.app_id == ''){
											appID = app_id
											models.User_Transcript.update(
												{   app_id  : appID},
												{   where   :  { id : transcript.id}
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
												})
										}else {
											appID = transcript.app_id+","+app_id
											models.User_Transcript.update(
												{   app_id  : appID},
												{   where   :  { id : transcript.id}
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
							//   console.log("User_CurriculumsData===>"+JSON.stringify(User_CurriculumsData));
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
							//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
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

                        if(affiliation == true){
							models.Affililation_Letter.findAll({
								where : {
									user_id : user_id
								}
							}).then(function(AffiliationData){  
							//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
								if(AffiliationData.length > 0){
									AffiliationData.forEach((data)=>{
										var appID ;
										if(data.app_id == null || data.app_id == ''){
											appID = app_id
											models.Affililation_Letter.update(
												{   app_id  : appID},
												{   where   :  { id : data.id}
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
												})
										}else {
											appID = data.app_id+","+app_id
											models.Affililation_Letter.update(
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
								//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
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
								user_id : user_id
							}
						}).then(function(userMarkListsData){  
						//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
							if(userMarkListsData.length > 0){
								userMarkListsData.forEach((marklist)=>{
									var appID ;
									if(marklist.app_id == null || marklist.app_id == ''){
										appID = app_id
										models.userMarkList.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id}
											}).then((err,updated)=>{
												if(err){
													console.error(err);
												}
											})
									}else {
										appID = marklist.app_id+","+app_id
										models.userMarkList.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id}
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
								user_id : user_id
							}
						}).then(function(userMarkListUploadsData){  
						//     console.log("userMarkListUploadsData===>"+JSON.stringify(userMarkListUploadsData));
							if(userMarkListUploadsData.length > 0){
								userMarkListUploadsData.forEach((marklist)=>{
									var appID ;
									if(marklist.app_id == null || marklist.app_id == ''){
										appID = app_id
										models.UserMarklist_Upload.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id}
											}).then((err,updated)=>{
												if(err){
													console.error(err);
												}
											})
									}else {
										appID = marklist.app_id+","+app_id
										models.UserMarklist_Upload.update(
											{   app_id  : appID},
											{   where   :  { id : marklist.id}
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
									}
								}
							}).then(function(UserTranscriptsData){  
							//   console.log("UserTranscriptsData===>"+JSON.stringify(UserTranscriptsData));
								if(UserTranscriptsData.length > 0){
									UserTranscriptsData.forEach((transcript)=>{
										models.User_Transcript.update(
										{   app_id  : app_id},
										{   where   :  { id : transcript.id}
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
							//   console.log("User_CurriculumsData===>"+JSON.stringify(User_CurriculumsData));
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

                        if(affiliation == true){
							models.Affililation_Letter.findAll({
								where : {
									userId : user_id,
									app_id : {
										[Op.eq] : null
									}
								}
							}).then(function(affiliationData){  
								if(affiliationData.length > 0){
									affiliationData.forEach((data)=>{
										models.Affililation_Letter.update(
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
								//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
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
                        if(CompetencyLetter == true){
							models.competency_letter.findAll({
								where : {
									user_id : user_id,
									app_id : {
										[Op.eq] : null
									}
								}
							}).then(function(CompetencyLetter){  
								//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
								if(CompetencyLetter.length > 0){
									CompetencyLetter.forEach((data)=>{
										models.CompetencyLetter.update(
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

                        if(LetterforNameChange == true){
							models.Letterfor_NameChange.findAll({
								where : {
									user_id : user_id,
									app_id : {
										[Op.eq] : null
									}
								}
							}).then(function(LetterforNameChange){  
								//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
								if(LetterforNameChange.length > 0){
									LetterforNameChange.forEach((data)=>{
										models.LetterforNameChange.update(
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
								//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
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
								}
							}
						}).then(function(userMarkListsData){  
						//  console.log("userMarkListsData===>"+JSON.stringify(userMarkListsData));
							if(userMarkListsData.length > 0){
								userMarkListsData.forEach((marklist)=>{
									models.userMarkList.update(
									{   app_id  : app_id},
									{   where   :  { id : marklist.id}
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
								}
							}
						}).then(function(userMarkListUploadsData){  
						//     console.log("userMarkListUploadsData===>"+JSON.stringify(userMarkListUploadsData));
							if(userMarkListUploadsData.length > 0){
								userMarkListUploadsData.forEach((marklist)=>{
									models.UserMarklist_Upload.update(
									{   app_id  : app_id},
									{   where   :  { id : marklist.id}
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

});

// router.get('/orderlookup',function(req,res){
//     var ccavEncResponse='',
//         ccavResponse='',    
//         ccavPOST = '';
//     var count = 0;
//     var data =[];
//     var sendgrid  = require('sendgrid')(constant.SENDGRID_API_KEY);
//     const sgMail = require('@sendgrid/mail');
//     sgMail.setApiKey(constant.SENDGRID_API_KEY);

//     /* FOR DATABASE QUERY */
//     var yesterday1     = moment().subtract(1, 'days').startOf('day');
//     var yesterdayNew  = yesterday1.format('YYYY-MM-DD HH:mm:ss');
//     var today1  = moment().endOf('day');
//     var todayNew = today1.format('YYYY-MM-DD HH:mm:ss');

//     /* FOR CC REQUEST */
//     var date = new Date();
//     var today =  (date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear()).toString() ;
//     // date.setDate(date.getDate()-1);
//     var yesterday =  yesterday1.format('DD-MM-YYYY').toString();

//     models.Orders.getOrderID(yesterdayNew,todayNew).then(function(orders){
//         console.log("orders.length---->"+orders.length);
//         if(orders){
//             orders.forEach(function(order){
//                 var statusTrackerData = {
//                     //'reference_no': '108699413641',
//                     //'reference_no' : '',
//                     'from_date' : ''+yesterday,// '16-06-2019' ,
//                     //'to_date' : ''+today,
//                     'order_currency' :'INR',
//                     'order_email' : '',
//                     'order_fraud_status' : '',
//                     'order_min_amount' : '',
//                     'order_max_amount' : '',
//                     'order_name' : '',
//                     'order_no' : ''+order.id,
//                     'order_payment_type' : '',
//                     'order_status' : 'Shipped',
//                     'order_type' : '',
//                     'order_bill_tel' : '',
//                     'page_number' : '1'
//                 }
//                 var status_encRequest = ccav.encrypt(JSON.stringify(statusTrackerData),workingKey);

//                 request.post(
//                     "https://api.ccavenue.com/apis/servlet/DoWebTrans?enc_request="+status_encRequest+"&access_code="+accessCode+"&command=orderLookup&request_type=JSON&response_type=JSON&version=1.1",
//                         function (error, response, body) {
//                             count++;
//                             var statustracker_obj = qs.parse(response.body);

//                             var dec_status = ccav.decrypt(statustracker_obj.enc_response,workingKey);
//                             console.log("dec_status---->"+JSON.stringify(dec_status));

//                             var status_pay = JSON.parse(dec_status);

//                             if(status_pay.error_code != 51419 && status_pay.total_records > 0 ){
//                                 //DATA FOUND
//                                 models.User.find({
//                                     where : {
//                                         id : order.user_id
//                                     }
//                                 }).then(function(user){
//                                     models.Transaction.find({
//                                         where : {
//                                             order_id : status_pay.order_Status_List[0].order_no //order.id
//                                         }
//                                     }).then(function(transaction){
//                                         if(transaction){
//                                             //transaction already exist but not updated in order table
//                                             models.Orders.find({
//                                                 where:{
//                                                     id : order.id
//                                                 }
//                                             }).then(function(order_update){
//                                                 if(order_update.status != '1'){
//                                                     //not updated
//                                                     console.log("not updated")
//                                                     mailOrder(order.id, user.name, user.email,'order updated',order_update.amount,transaction.tracking_id)
//                                                     order_update.update({
//                                                         status : '1',
//                                                         timestamp : functions.get_current_datetime(),
//                                                     })
//                                                 }else{
//                                                     //already updated
//                                                     console.log("not updated")
//                                                 }
//                                             })
//                                         }else{
//                                             //transaction not exist
//                                             models.Transaction.create({
//                                                 order_id : order.id,
//                                                 tracking_id : status_pay.order_Status_List[0].reference_no,
//                                                 bank_ref_no : status_pay.order_Status_List[0].order_bank_ref_no,
//                                                 order_status : status_pay.order_Status_List[0].order_status ? 'Success' : status_pay.order_Status_List[0].order_status,
//                                                 payment_mode : 'online',
//                                                 currency : 'INR',
//                                                 amount : status_pay.order_Status_List[0].order_amt,
//                                                 billing_name : user.name,
//                                                 billing_address : user.address1,
//                                                 billing_city : user.city,
//                                                 billing_state : user.state,
//                                                 billing_zip : user.postal_code,
//                                                 billing_country : user.country_birth,
//                                                 billing_tel : user.mobile,
//                                                 billing_email : user.email,
//                                                 merchant_param1 : status_pay.order_Status_List[0].merchant_param1,
//                                                 merchant_param2 : status_pay.order_Status_List[0].merchant_param2,
//                                                 merchant_param3 : status_pay.order_Status_List[0].merchant_param3,
//                                                 merchant_param4 : status_pay.order_Status_List[0].merchant_param4,
//                                                 merchant_param5 : status_pay.order_Status_List[0].merchant_param5,
//                                                 split_status : '-1'
//                                             }).then(function(transaction_created){
//                                                 if(transaction_created){
//                                                     mailOrder(order.id, user.name, user.email,'transaction created',transaction_created.amount,transaction_created.tracking_id)
//                                                     models.Orders.find({
//                                                         where:{
//                                                             id : transaction_created.order_id
//                                                         }
//                                                     }).then(function(order_update){
//                                                         if(order_update){
//                                                             order_update.update({
//                                                                 status : '1',
//                                                                     timestamp : functions.get_current_datetime(),
//                                                             })
//                                                         }
//                                                     })
//                                                 }else{

//                                                 }
//                                             }) 
//                                         }
//                                     })
//                                 })
//                             }else{
//                                 //NO SHIPPED DATA FOUND
//                             }

//                             if(count == orders.length){
//                                 setTimeout(function(){
//                                     if(data.length > 0){
//                                         var xls = json2xls(data);
//                                         var file_location = constant.FILE_LOCATION + "public/upload/payment_details_in_excel/ApiCallTransactionDetails.xlsx";
//                                         fs.writeFileSync(file_location, xls, 'binary');
//                                         var file_name = "ApiCallTransactionDetails.xlsx";
//                                         setTimeout(function(){
                                            
                        
//                                             base64.encode(constant.FILE_LOCATION+"public/upload/payment_details_in_excel/ApiCallTransactionDetails.xlsx", function(err, base64String) {
//                                                 const msg = {
//                                                     to: 'pooja@edulab.in',
//                                                     from: 'info@etranscript.in',
//                                                     subject: 'Fail - Attestation record',
//                                                     text:  '<br>Kindly check attached excel sheet for Api Call Transaction Details \n\n',
//                                                     html: 
//                                                     '<br>Kindly check attached excel sheet for Api Call Transaction Details \n\n',
//                                                     attachments: [
//                                                         {
//                                                             content: base64String,
//                                                             filename: file_name,
//                                                             type: 'application/xlsx',
//                                                             disposition: 'attachment',
//                                                             contentId: 'mytext'
//                                                         },
//                                                     ],
                                                    
//                                                 };
//                                                 const msgShweta = {
//                                                     to: 'shweta@edulab.in',
//                                                     from: 'info@etranscript.in',
//                                                     subject: 'Fail - Attestation record',
//                                                     text:  '<br>Kindly check attached excel sheet for Api Call Transaction Details \n\n',
//                                                     html: 
//                                                     '<br>Kindly check attached excel sheet for Api Call Transaction Details \n\n',
//                                                     attachments: [
//                                                         {
//                                                             content: base64String,
//                                                             filename: file_name,
//                                                             type: 'application/xlsx',
//                                                             disposition: 'attachment',
//                                                             contentId: 'mytext'
//                                                         },
//                                                     ],
                                                    
//                                                 };
//                                                 sgMail.send(msg);
//                                                 sgMail.send(msgShweta);
//                                             });
                                                                            
//                                         },5000);
//                                     }else{
//                                     	const msgShweta = {
// 			                                to: 'shweta@edulab.in',
// 			                                from: 'info@etranscript.in',
// 			                                subject: 'Fail - Attestation NO record',
// 			                                text:  '<br>NO Records found for Api Call Transaction Details \n\n',
// 			                                html: 
// 			                                '<br>NO Records found for Api Call Transaction Details \n\n',
// 			                            };
// 			                            sgMail.send(msgShweta);
//                                     }
//                                 },5000)
//                             }
//                         }
//                 );

//             }); 
//         }else{
//             //no order found
//         }
//     })

//     //For Mail which order_id updated in transaction table.
//     function mailOrder(order_id, stu_name, stu_email, action, amount, tracking_id){
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
                    id : obj.order_id
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
                            res.redirect("http://mu.etranscript.in/app/#/pages/PaymentSuccess?order_id="+obj.order_id);
                        }
                    });
                });
            });
        })
    }else{
        models.Orders.find({
            where:
            {
                id : obj.order_id
            }
        }).then(function(ord){
            if(obj.order_status == 'Failure'){
                ord.update({
                    status : '-1'
                }).then(function(updated){
                    res.redirect("http://mu.etranscript.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Timeout'){
                ord.update({
                    status : '2'
                }).then(function(updated){
                    res.redirect("http://mu.etranscript.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Aborted'){
                ord.update({
                    status : '3'
                }).then(function(updated){
                    res.redirect("http://mu.etranscript.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else if(obj.order_status == 'Invalid'){
                ord.update({
                    status : '4'
                }).then(function(updated){
                    res.redirect("http://mu.etranscript.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
                })
            }else{
                ord.update({
                    status : '5'
                }).then(function(updated){
                    //res.redirect("http://mu.etranscript.in/app/#/pages/FirstFailure?order_status="+obj.order_status);
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
                                                            id : status_pay.order_Status_List[0].order_no
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
module.exports = router;