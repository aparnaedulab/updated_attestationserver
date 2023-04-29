const express = require('express');
var request = require('request');
//register
var path1 = require('path');
const middlewares = require('../middlewares.js');
var crypto = require('crypto');
var root_path = path1.dirname(require.main.filename);
var sendmail = require(root_path+'/config/sendmail');
var constant = require(root_path+'/config/constant');
var functions = require(root_path+'/utils/function');
var mobileMsgConfig = require(root_path+'/config/mobileMsgConfig');
var models  = require(root_path+'/models');
var moment = require('moment');
var svgCaptcha = require('svg-captcha');
var h2p = require('html2plaintext')
const logger = require('../logger')(__filename);
// var socket = require('socket.io-client')
// var truio = socket.connect('http://mu.admissiondesk.org:4');
var fs = require('fs');
const multer = require('multer');
var path = require('path');
var pdfreader = require('pdfreader');
var router  = express.Router();

router.get('/getUserTickets',middlewares.getUserInfo, function(req, res) {
    var l = req.query.limit ? req.query.limit : 25
    var limit = parseInt(l)
    if(req.User.user_type == "student"){
       request.get(
       constant.trudesk_BASE_URL+'api/v1/tickets',
       {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
       function (error, response, body) {
           if(!error){
               var data = JSON.parse(body);
               var tickets = [];
               var message = "";
               if(data != null && data != '' && data != undefined){
                   data.forEach(function(ticket){
                       var status;
                       //if(ticket.status != 3){
                           if(ticket.status == 0){
                               status = "New";
                           }else if(ticket.status == 1){
                               status = "Open";
                           }else if(ticket.status == 2){
                               status = "Pending";
                           }else if(ticket.status == 3){
                               status = "Closed";
                           }
                           tickets.push({
                               uid : ticket.uid,
                               status : status,
                               subject : ticket.subject,
                               user : ticket.owner.username,
                               requester:ticket.owner.fullname,
                               issue : ticket.issue,
                               date : moment(new Date(ticket.date)).format("DD-MM-YYYY hh:mm"),
                               updated_date : ticket.updated ? moment(new Date(ticket.updated)).format("DD-MM-YYYY hh:mm") : '' ,
                           })
                       //} 
                   })
               }else{
                   tickets = null;
                   message ="No Data available";
               }
               res.send({ 
                   status: 200,
                   data : tickets,
                   message : message
               });
           }
       });
   }else  if(req.User.user_type == "admin" || req.User.user_type == "sub-admin"){
       request.get(
           constant.trudesk_BASE_URL+'api/v1/tickets',
       {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
         // {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':dc4f559535ed58b60c17a20e62fd2c6c531fe7fb}},
           function (error, response, body) {

               // 
               var data = JSON.parse(body);
               var tickets = [];
               var status;
               if(data != null && data != '' && data != undefined){
                   data.forEach(function(ticket){
                       if(ticket.status != 3){
                           if(ticket.status == 0){
                               status = "New";
                           }else if(ticket.status == 1){
                               status = "Open";
                           }else if(status = 2){
                               status = "Pending";
                           }
                           tickets.push({
                               uid : ticket.uid,
                               status : status,
                               subject : ticket.subject,
                               user : ticket.group.name,
                               requester:ticket.owner.fullname,
                               issue : ticket.issue,
                               date : moment(new Date(ticket.date)).format("DD-MM-YYYY hh:mm"),
                               updated_date : ticket.updated ? moment(new Date(ticket.updated)).format("DD-MM-YYYY hh:mm") : '' ,
                           })
                       }
                   });

                   message = "Data Fetched Successfully";
               }else{
                   tickets = null;
                   message ="No Data available";
               }
               res.send({ 
                   status: 200,
                   data : tickets,
                   message : message
               });
           })
   }
});

router.get('/getSingleTicket/:uid',middlewares.getUserInfo, function(req, res) {

   var ticket = {
       comments : []
   };
   
   request.get(
   constant.trudesk_BASE_URL+'api/v1/tickets/'+req.params.uid,
   {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
   function (error, response, body) {
       var data = JSON.parse(body);
       if(data.ticket != null){
           var comments = [];
           data.ticket.comments.forEach(function(comment){
               if(comment != ""){
                   var commentStr = comment.comment.replace(/<[^>]*>/g, '');
                   //var commentStr =  comment.comment;
                   commentStr =commentStr.replace(/&nbsp;/g, ' ');//&#39;
                   commentStr =commentStr.replace(/&#39;/g, "'");//&amp; 
                   commentStr =commentStr.replace(/&amp;/g, "&");
                   var commentData = {};
                    if(comment.owner.role.normalized == 'user'){
                        commentData.owner = comment.owner.fullname + "<" + comment.owner.email + ">";
                    }else if(comment.owner.role.normalized == 'admin'){
                        commentData.owner = "Admin";
                    }
                   commentData.comment = commentStr;
                   commentData.date = moment(new Date(comment.date)).format("DD-MM-YYYY hh:mm");
                  
                   comments.push(commentData);
               }
           });
           var issueStr =  data.ticket.issue;
           // var issueStr = data.ticket.issue.replace(/<[^>]*>/g, '');
           // issueStr = issueStr.replace(/&nbsp;/g, '');
           ticket = {
               uid : data.ticket.uid,
               status : data.ticket.status,
               ticket_id : data.ticket._id,
               subject : data.ticket.subject,
               issue : issueStr,
               owner : data.ticket.owner.fullname + "<" + data.ticket.owner.email + ">",
               owner_id : data.ticket.owner._id,
               date : moment(),
               comments: comments
           };
       }else{
           ticket = null;
       }
       res.send({ 
           status: 200,
           data : ticket
       }); 
   });
});


router.post('/addcomment',middlewares.getUserInfo, function(req, res) {
    var owner_email = req.body.owner_email;
    var e = owner_email.split('<');
    var em = e[1].split('>');

    var email_arr_ad=[];
    var email_arr=[];
    email_arr=req.body.ticket_data;
    email_arr.forEach(function(item){
        var sp_email= String(item.owner).match(/<[^>]+>/gm);
        var dp_email= String(sp_email).replace(/</gm,'');
        var t_email= String(dp_email).replace(/>/gm,'');
        if (email_arr_ad.indexOf(t_email) == -1) {
            email_arr_ad.push(t_email);
        }
      });
   var io = req.io;
   var user_type = req.body.role;
   var email = req.body.email;
   var ownerId = "";
   request.get(
   constant.trudesk_BASE_URL+'api/v1/users/'+req.User.email,
   {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':constant.trudesk_key}},
   function (error, response, body) {
       data = JSON.parse(body);
       request.post(
       constant.trudesk_BASE_URL+'api/v1/tickets/addcomment',
       {json:{"comment":req.body.comment,"ownerId":data.user._id,"_id":req.body.ticket_id},
       headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
       function (error, response, body) {
       if(body.success == true)
           {
            if(user_type == 'admin' || user_type == 'sub-admin' ){
                        models.User.find({
                            where:{
                                email : em[0]
                            }
                        }).then(function(user_id){
    
                            Remark = "Admin has Replied On Ticket.";
                            userid = user_id.id
                            created_at = functions.socketnotification('ticket',Remark,userid,'student');
                            fromNow = moment(created_at).fromNow();
                            //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : fromNow})
                            //req.io.sockets.emit('new_msg')
    
                        })
                // email_arr_ad.forEach(function(item){
                //     if(item != req.User.email){
                //         var userid;
                //         models.User.find({
                //             where:{
                //                 email : item
                //             }
                //         }).then(function(user_id){
    
                //             Remark = "Admin has Replied On Ticket.";
                //             userid = user_id.id
                //             created_at = functions.socketnotification('ticket',Remark,userid,'student');
                //             fromNow = moment(created_at).fromNow();
                //             req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : fromNow})
                //             //req.io.sockets.emit('new_msg')
    
                //         })    
                //     }
                // })
                    
                       
            }else if(user_type == 'student'){

                Remark = req.User.email+" has Replied On Ticket.";
                

                models.User.findAll({
                    where :{
                        user_type : 'admin'
                    }
                }).then((admins)=>{
                	admins.forEach(admin=>{
                    	created_at = functions.socketnotification('ticket',Remark,admin.id,'admin');
                       	fromNow = moment(created_at).fromNow();
                    	//req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : fromNow})
                   		// io.emit('new_msg',{notification_data: Remark,created_at : fromNow})
                   	});
                })
                models.User.findAll({
                    where :{
                        user_type : 'sub-admin'
                    }
                }).then((subadmins)=>{ 
                	subadmins.forEach(subadmin=>{  
                    	created_at = functions.socketnotification('ticket',Remark,subadmin.id,'sub-admin');
                    	fromNow = moment(created_at).fromNow();
                    	//req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : fromNow})
                    });
                    //io.emit('new_msg',{notification_data: Remark,created_at : fromNow})
                })
                
            }
               
               res.json({
                   status : 200,
               })
           }else{
               res.json({
                   status : 400,
               })
           }
       });
   });
});

router.get('/getGroups',middlewares.getUserInfo, function(req, res) {

   var groups = [];
   var owner = '';
   request.get(
   constant.trudesk_BASE_URL+'api/v1/groups',
   {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
   function (error, response, body) {
       var data = JSON.parse(body);
       data.groups.forEach(function(group){
           groups.push({
               name : group.name,
               id : group._id
           });
           if(req.User.user_type == "admin" || req.User.user_type == "sub-admin"){
               group.members.forEach(function(member){
                   if(member.email == req.User.email){
                       owner = member._id;
                   }
               })
           }else if(req.User.user_type == "student"){
               if(group.name == req.User.email)
                   owner = group.members[0];
           }   
       })
       res.send({ 
           status: 200,
           data : groups,
           owner : owner
       }); 
   });
});

router.post('/createTicket',middlewares.getUserInfo, function(req, res) {
   var io = req.io;
   var email = req.body.email;
   var user = {
       user_id : "",
       group_id : "",
       type : "",
       priority : ""
   };
   request.get(
   constant.trudesk_BASE_URL+'api/v1/tickets/types',
   {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
   function (error, response, body) {
       var data = JSON.parse(body);
       user.type = data[0]._id;
   });
   request.get(
   constant.trudesk_BASE_URL+'api/v1/tickets/priorities',
   {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
   function (error, response, body) {
       var data = JSON.parse(body);
       user.priority = data['priorities'][0]._id;
   });
   
   
   setTimeout(function(){
    var owner;  //= _id;//'5d133cd9a6f95d07c828942e';//5d133cd9a6f95d07c828942e; //5d133cd9a6f95d07c828942e

       if(req.User.user_type =='admin' || req.User.user_type =='sub-admin'){
           var _id;
           var email;
           var trudesk_key;
            models.User.find({
                         where :{
                             user_type : 'admin'
                              }
                         }).then((admin)=>{
                                email= admin.email;
                                trudesk_key= admin.trudesk_key;
                                request.get(
                                    constant.trudesk_BASE_URL+'api/v1/users/'+email,
                                    {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':trudesk_key}},//'bde45ebd554000cadc561969ec531d38ee1e0dff'}},
                                    function (error, response, body) {
                                        var data = JSON.parse(body);
                                      
                                    _id =data['user']['_id']
                                    });
                                owner= _id;
                        })
            } else{
                 owner= req.body.owner;
             }
       request.post(
       constant.trudesk_BASE_URL+'api/v1/tickets/create',
       {json:{"subject":req.body.subject,"owner":owner,"group":req.body.group,"type":user.type,"issue":req.body.issue,"priority":user.priority},
       headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
       function (error, response, body) {
            var data = JSON.stringify(body);
           if(body.success == true){
            var Remark;
            var created_at;
            var fromNow
               models.User.find({
                   where:{
                       email : req.User.email
                   }
               }).then(function(user_id){
                   if(req.User.user_type == 'admin' || req.User.user_type == 'sub-admin' ){
                            var userid;
                            models.User.find({
                                where:{
                                    email : req.body.email
                                }
                            }).then(function(user_id){

                                Remark = "Admin HAS Created Ticket ";
                                userid = user_id.id
                                created_at = functions.socketnotification('ticket',Remark,userid,'student');
                                fromNow = moment(created_at).fromNow();
                               // io.emit('new_msg',{notification_data: Remark,created_at : fromNow})
                                //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : fromNow})

                            })
                   }else if(req.User.user_type == 'student'){

                    Remark = req.User.email+" HAS Created Ticket";
                    fromNow = moment(created_at).fromNow();

                       models.User.findAll({
                           where :{
                            user_type : 'admin'
                           }
                       }).then((admins)=>{
                       	admins.forEach(admin=>{
	                        created_at = functions.socketnotification('ticket',Remark,admin.id,'admin');
	                        req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : fromNow})
	                    });
                       })
                       models.User.findAll({
                           where :{
                             user_type : 'sub-admin'
                           }
                       }).then((subadmins)=>{   
                       	subadmins.forEach(subadmin=>{
	                        created_at = functions.socketnotification('ticket',Remark,subadmin.id,'sub-admin');
	                        //req.io.sockets.emit('new_msg',{notification_data: Remark,created_at : fromNow})
                       	})
                       });
                   }
               })
              
               res.json({
                   status : 200
               })
           }else{
               res.json({
                   status : 400
               })
           }
       });
   },1000);
});

router.get('/getChatUsersList',middlewares.getUserInfo, function(req, res) {

   var users = {
       admin : [],
       student : [],
       participants : []
   };
   request.get(
   constant.trudesk_BASE_URL+'api/v1/users',
   {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
   function (error, response, body) {
       var data = JSON.parse(body);
       data.users.forEach(function(user){
       var localUser = {};
           if(user.role == "admin"){
               localUser.fullname = user.fullname;
               localUser.email = user.email;
               localUser.id = user._id;
               localUser.lastOnline = user.lastOnline;
               users.admin.push(localUser);
               users.participants.push(user._id);
           }else if(user.role =="user"){
               localUser.fullname = user.fullname;
               localUser.email = user.email;
               localUser.id = user._id;
               //localUser.lastOnline = user.lastOnline;
               users.student.push(localUser);
               users.participants.push(user._id);
           }
       });
       res.json({
           status : 200,
           users : users
       })
   })   
});

router.get('/getChats',middlewares.getUserInfo, function(req, res) {

   var participants = [];
   var chats = {
       cId : "",
       messages : []
   };
   participants = req.query.participants.split(',');
   request.get(
       constant.trudesk_BASE_URL+'api/v1/messages/conversations',
       {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
       function (error, response, body) {
           var data = JSON.parse(body);
           var conversation_id = "";
           var flag = 0;
           data.conversations.forEach(function(conversation){
               conversation.participants.forEach(function(participant){
                   participants.forEach(function(participant1){
                       if(participant.id == participant1){
                           flag+=1;
                       }
                   });
               });
               if(flag == 2){
                   conversation_id = conversation._id;
               }
           });
           if(conversation_id == ""){   

               request.post(
               constant.trudesk_BASE_URL+'api/v1/messages/conversation/start',
               {json:{'owner':req.query.requester,'participants':participants},
               headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':constant.trudesk_key}},
               function (error, response, body) {
                   if(body.success == true){
                       chats.cId = body.conversation._id;
                       res.json({
                           status : 200,
                           participants : participants,
                           chats : chats
                       })
                   }else{
                       res.json({
                           status : 400,
                           participants : participants,
                           chats : null
                       })
                   }
               });
           }else{

               request.get(
               constant.trudesk_BASE_URL+'api/v1/messages/conversation/'+conversation_id,
               {headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':constant.trudesk_key}},
               function (error, response, body) {
                   data = JSON.parse(body);
                   var message1 = {}
                   chats.cId = conversation_id;
                   data.messages.forEach(function(message){

                       if( message.owner.email == req.User.email){
                           message1 = {
                               text : message.body,
                               sender : "You",
                               reply : "true",
                               date : message.createdAt
                           }
                       }else{
                           message1 = {
                               text : message.body,
                               sender : message.owner.fullname,
                               reply : "false",
                               date : message.createdAt
                           }
                       }
                       chats.messages.push(message1);
                   })
                   res.json({
                       status : 200,
                       participants : participants,
                       chats : chats
                   })
               })
           }
       });
});

router.post('/sendMessage',middlewares.getUserInfo, function(req, res) {



   request.post(
   constant.trudesk_BASE_URL+'api/v1/messages/send',
   {json:{'cId':req.body.cId,'owner':req.body.owner,'body':req.body.body},
   headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
   function (error, response, body) {

      if(body.success == true)
       {
           // socket.emit('chatMessage',{
           //     conversation: this.chats.chat_id,
           //     to: this.users.parter,
           //     from: this.users.owner,
           //     type: 's',
           //     messageId: messageId,
           //     message: event.message
           // });
           res.json({
               status : 200,
           })
       }else{
           res.json({
               status : 400,
           })
       }
   });
});

router.put('/updateStatus',middlewares.getUserInfo, function(req, res) {

   // 
   // 
   request.put(
   constant.trudesk_BASE_URL+'api/v1/tickets/'+req.body.ticket_id,
   {json:{'status':req.body.status},
   headers:{'Content-Type':'application/json; charset=utf-8','accesstoken':req.User.trudesk_key}},
   function (error, response, body) {
       if(body.success == true){
           res.json({
               status : 200
           })
       }else{
           res.json({
               status : 400
           })
       }
   });
});

router.post('/attachment',middlewares.getUserInfo,function(req,res){
    
   var ticketid = req.query.ticketid;
  var ownerid = req.query.ownerid;
  var ext;
  var uploadValue;
  var image;
  var dir = constant.FILE_LOCATION+"public/upload/ticket/"+ticketid;
  if (!fs.existsSync(dir))//!fs.existsSync
  {
        fs.mkdirSync(dir, { recursive: true });//fs.writeFileSync
  }

  var storage = multer.diskStorage({
      destination: function(req, file, callback) {
      callback(null, constant.FILE_LOCATION+'public/upload/ticket/'+ticketid);
      },
      filename: function(req, file, callback) {
          callback(null, file.originalname);
          image = file.originalname;
      }
  });

  var upload = multer({
      storage: storage,
      fileFilter: function(req, file, callback) {
        ext = path.extname(file.originalname)
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.pdf' && ext !== '.PNG' && ext !== '.JPG' && ext !== '.JPEG' && ext !== '.PDF') {
          return callback(res.end('Please upload your document in .pdf, .jpeg, .jpg or .png formats only'), null)
        }
        callback(null, true)
      }
  }).single('file');
  upload(req, res, function(err,data) {

       imageLocationToCallClient = image;
       if (ext == '.pdf') {
          fs.readFile(constant.FILE_LOCATION+'public/upload/ticket/'+ticketid+'/'+image, (err, pdfBuffer) => {
              
              new pdfreader.PdfReader().parseBuffer(pdfBuffer, function(err, item){

                  if (err){

                      uploadValue = false;
                      ValueUpdateData(uploadValue);
                  }else if (!item){

                      uploadValue = true;
                      ValueUpdateData(uploadValue);
                  }else if (item.text){

                  }
              });
          });
       }else{
           uploadValue = true;
           ValueUpdateData(uploadValue);
       }

      function ValueUpdateData(uploadValue){
          if(uploadValue == true){
              
              models.TicketAttachment.create({
                  file_name :image,
                  ticket_id: ticketid,
                  owner_id : ownerid,
                  user_id: req.User.id
              }).then(function(ticket){
                  
                  return res.json({
                      status : 200,
                      message : `Upload Completed.`
                  });
              })
              

          }else if(uploadValue == false){
              fs.unlink(constant.FILE_LOCATION+'public/upload/ticket/'+ticketid+'/'+image, function (err) {
                  if (err){

                      return res.json({
                          status : 400,
                          message : `Error occured in uploading document.`
                      });
                  }else{
                      return res.json({
                          status : 401,
                          message : 'You have uploaded the Password Protected Document. Please Upload correct document.'
                      });
                  }
              });
          }

      }
  });
});

// router.get('/download',middlewares.getUserInfo, function (req, res) {
//     var file_name= req.query.file_name;
//     var userId = req.User.id;

//     var stringReplaced = String.raw``+file_name.split('\\').join('/')


//     var n = stringReplaced.includes("/");
//     if(n == true){
//         file_name = stringReplaced.split("/").pop();
//     }
//     //TODO
//     const downloadData = constant.FILE_LOCATION +'public/upload/ticketAttachment/'+userId+'/'+ file_name;
//     res.download(downloadData);
// });

router.get('/download',middlewares.getUserInfo,function(req,res){
    var file_name = req.query.file_name;
    var user_id = req.User.id;
    var filePath= req.query.file_path;
  res.download(filePath);
})

router.get('/getAttachment',function(req,res){
  var ticket_id = req.query.ticket_id;
  var data = [];
  models.TicketAttachment.findAll({
      where : {
          ticket_id : ticket_id
      }
  }).then(function(attachment){
      if(attachment.ticket_id == undefined || attachment.ticket_id == null || attachment == null || attachment == undefined){
          attachment.forEach(function(image){
              data.push({
                  file_name : image.file_name,
                  file_path : constant.FILE_LOCATION+'public/upload/ticket/'+ticket_id+'/'+image.file_name
              })
          })
          res.json({
              status : 200,
              data : data
          })
      }else{
          res.json({
              status : 400
          });
      } 
  });
});




module.exports = router;