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

router.post('/signpdf', middlewares.getUserInfo,function(req,res){
  var io=req.io;
    var signstatus;
    var appl_id=req.body.appl_id;
    models.Application.find({
      where:{
        id:appl_id,
            [Op.or]:[{
				source_from:'guattestation',
			 },
			 {
				source_from:'gumoi',
			 }]
      }
    }).then(data =>{
      var user_id=data.user_id;
      var userName;
      var certi_name;
      var surname;
      var propdf;
      var name_pdf;
      var ran_string;
      var doc_name;
      var doc;
      var count = 0;
      filenameArray = [];
      models.User.find({
        where:{
          id:user_id
        }
      }).then(option =>{
        var appliedcourseArray = option.applying_for.split(/[,][ ]/);
       
        promise1 = new Promise((resolve, reject) => {
          appliedcourseArray.forEach((data)=>{
            certi_name = data;
            userName=option.name;
            surname=option.surname;
            if(certi_name=="Degree"){
              doc="DEGREE_Document";
              filenameArray.push(doc)
            }else if(certi_name=="Masters"){
              doc="MASTER_Document";
              filenameArray.push(doc)
            } else if(certi_name=="Ph.D"){
              doc="PhD_Document";
              filenameArray.push(doc)
            }
     /////finding user uploaded file
            models.User_Transcript.find({
              where:{
                user_id:user_id,
                name:doc,source : 'guattestation' 
              }
            }).then(f_name=>{
              if(f_name != null){
                var filename=f_name.file_name;
                var o;
                function getExtension(filename) {
                  return filename.split('.').pop();
                }
                var extension=getExtension(filename);
                if(extension == 'pdf'){
                  (async function con(){
                    const userID = await user_id;
                    const file_name = await filename;
                    o= await fn.pdfpop(file_name,userID);
                  
                    
                })().then(p => {
                  if(o === true){
                    (async function signedpdf(){
                      const userID = await user_id;
                      const file_name = await filename;
                      const file_loc= constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+"con2img_"+path.parse(filename).name+"_1.png";
                      var x = await fn.signedpdf(filename,user_id,appl_id,file_loc,signstatus,doc_name);
                    
                      if(x === true){
                        (async function protect(){
                          name_pdf=path.parse(filename).name;
                          ran_string = randomstring.generate(6);
                          const file_loc=constant.FILE_LOCATION+"public/signedpdf/"+appl_id+"_"+doc_name+"_"+name_pdf+".pdf";
                          // var j = await fn.passpro(filename,file_loc,appl_id,ran_string,doc_name);
                          // propdf=j;
                          })();
                          if(propdf === undefined){
                            propdf = true;
                            setTimeout(function(){
                                if(propdf === true){
                                  models.Application.update({tracker: 'signed'},{
                                      where: {
                                          id: appl_id,
                                              [Op.or]:[{
				source_from:'guattestation',
			 },
			 {
				source_from:'gumoi',
			 }]
                                      }
                                  }).then(function (result) {
                                    if(result){ 
                                      models.Emailed_Docs.create({
                                        filename : appl_id+"_"+doc_name+"_"+name_pdf+".pdf",
                                        password : ran_string,
                                        transcript_id : f_name.id,
                                        app_id : appl_id
                                      }).then((result)=>{
                                      })
        
                                      /////////******* here have code count ++ */
                                      count++;
                                    if(count == appliedcourseArray.length){
                                      resolve(count);
                                    }
                                    }
                                  })
                                  //////////////////////////////
                                }else if(propdf === false){
                                  logger.error('there is error while generating protected pdf file');
                                  res.json({
                                    status : 500,
                                    message : 'there is error while generating protected pdf file',
                                  })
                                }
                            
                            },3000)
                          }
                        
                      }else if(x === false){
                        res.json({
                          status : 400,
                          message : 'There is problem in generating signed pdf.',
                        })
                      }
                  })();
                }
                }).catch((err) => {
                logger.error("Error in signed pdf"+err);
                })
            
                }else if(extension != 'pdf'){
                  (async function signedpdf(){
                    const userID = await user_id;
                    const file_name = await filename;
                    const file_loc= constant.FILE_LOCATION+"public/upload/documents/"+user_id+"/"+filename;
                    var x = await fn.signedpdf(filename,user_id,appl_id,file_loc,signstatus,doc_name);
                    var propdf;
                    var name_pdf;
                    var ran_string;
                    if(x === true){
                      (async function protect(){
                        name_pdf=path.parse(filename).name;
                        ran_string = randomstring.generate(6);
                        const file_loc=constant.FILE_LOCATION+"public/signedpdf/"+appl_id+"_"+doc_name+"_"+name_pdf+".pdf";
                        //var j = await fn.passpro(filename,file_loc,appl_id,ran_string,doc_name);
                        //propdf=j;
                      })();
                      if(propdf === undefined){
                        propdf=true;
                        setTimeout(function(){
                          if(propdf === true){
                            models.Application.update({
                              tracker: 'signed'
                            }, {
                                where: {
                                    id: appl_id,
                                        [Op.or]:[{
				source_from:'guattestation',
			 },
			 {
				source_from:'gumoi',
			 }]
                                }
                            }).then(function (result) {
                              if(result){

                                models.Emailed_Docs.create({
                                  filename : appl_id+"_"+doc_name+"_"+name_pdf+".pdf",
                                  doc_type : certi_name,
                                  password : ran_string,
                                  transcript_id : f_name.id,
                                  app_id : appl_id
                                }).then((result)=>{
                                })

                                /////////******* here have code count ++ */
                                count++;
                                if(count == appliedcourseArray.length){
                                  resolve(count);
                                }
                              }
                            })
                              //////////////////////////////
                                                    
                          }else  if(propdf === false){
                            logger.error('there is error while generating protected pdf file');
                            res.json({
                              status : 500,
                              message : 'there is error while generating protected pdf file',
                            })
                          }
                        
                        },3000)
                      }
                    
                    }else if(x === false){
                      res.json({
                        status : 400,
                        message : 'There is problem in generating signed pdf.',
                      })
                    }
                })();
                  
                }
              }else if(f_name == null){
                logger.error('No such file is present in database for signing the Document.Check the uploaded transcripts first!!!')
                res.json({
                    status : 400,
                    message : 'No such file is present in database for signing the Document.Check the uploaded transcripts first!!!',
                  })
              }else{
                  logger.error('No such file is present in database for signing the Document.Check the uploaded transcripts first!!!')
                  res.json({
                      status : 400,
                      message : 'No such file is present in database for signing the Document.Check the uploaded transcripts first!!!',
                    })
              }
            })
          })
        })
        Promise.all([promise1]).then(result => {
          
          if(appliedcourseArray.length > 0  && count === appliedcourseArray.length){
            promise1 = new Promise((resolve, reject) => {
              setTimeout(() => {
                var email_arr=[];
                models.Institution_details.findAll({
                  where:{
                    app_id  : appl_id,source : 'guattestation'
                  }
                }).then((email_data)=>{
                      email_data.forEach(there=>{
                        email_arr.push(there.email);  
                      })
                      resolve(email_arr);
                })
              }, 2000)
          })
          
          Promise.all([promise1]).then(result => {
            var email_file=appl_id+"_"+name_pdf+".pdf";
            setTimeout(() => {
            request.post(constant.BASE_URL_SENDGRID + 'pdf_send_email', {
              json: {
                userName : userName,
                surname : surname,
                certi_name : option.applying_for,
                ran_string :ran_string,
                email_file : email_file,
                mobile_country_code : option.mobile_country_code,
                mobile : option.mobile,
                email_add : result[0],
                app_id: appl_id,
                source : 'gu'
              }
            }, function (error, response, body) {
            if (error || body.status == 400) {
              return  res.json({
                status : 400,
                message : 'Error in sending Signed Document to email',
              })
            }else if(body.status == 200){
                  ////TODO: HERE UPDATING THE STATUS OF APPLICATION FROM VERIFIED TO DONE 
                  
                    models.Application.update({
                        tracker: 'done'
                    }, {
                        where: {
                            id: appl_id,
                                [Op.or]:[{
				source_from:'guattestation',
			 },
			 {
				source_from:'gumoi',
			 }]
                        }
                    }).then(function (result) {
                      if(result){ 

                          var desc = userName+"'s ( "+option.email+" ) application signed by "+req.User.email+".";
                          var activity = "Application Signed";
                          var applicationId = appl_id;
                          functions.activitylog(user_id, activity, desc, applicationId);

                          var Remark = "Your application  no."+appl_id+" has been signed and sent to the institution you mentioned."
                          
                          promise1 = new Promise((resolve, reject) => {
                              setTimeout(() => {
                                  //var created_at = functions.socketnotification('Signed and Emailed',Remark,user_id,'student');
                                  resolve(created_at);
                              }, 1000)
                              
                          })
                          
                          Promise.all([promise1]).then(result => {
                            var created_at=result;
                            setTimeout(() => {
                              if(created_at === undefined) { 
                              }else{
                                      //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : created_at});
                                      //SignClient
                                      //req.io.sockets.emit('SignClient');
                              }
                            },1000);
                          })

                          res.json({
                            status : 200,
                            message : 'Protected signed pdf emailed to institute successfully!',
                          })
                      }
                    }).catch(function(error){
                          logger.error("There is problem arises while updating status from verified to done"+error);
                        res.json({
                          status : 400,
                          message : 'There is problem arises while updating status from verified to done',
                        })
                    });
                }
              });
            },2000);
          })
        }
         
        })
    })
  })
})

module.exports = router;