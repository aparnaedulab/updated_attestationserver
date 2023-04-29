"use strict";
var path = require('path');
var root_path = path.dirname(require.main.filename);
const express = require('express');
var cors = require('cors')
const bodyParser = require('body-parser');
const auth = require('./auth/auth.js')();
const checkjwt = require('express-jwt');
const app = express();
var routes = require('./routes/index');
var dashboard = require('./routes/dashboard');
var authRoutes = require('./routes/auth');
var adminDashboard = require('./routes/admin');
var cfg = require('./auth/config.js');
var models = require("./models");
var cons = require('consolidate');
var constant = require(root_path+'/config/constant');
var attestation = require('./routes/attestation');
var payment = require('./routes/payment/payment');
var signpdf=require('./routes/signpdf/index');
var wes=require('./routes/wes/index');
const logger = require('./logger')(__filename);
var support = require('./routes/support');
var cron = require('./routes/cron');

app.use(cors());

// view engine setup
app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');



models.sequelize.sync().then(function (test) {

});


app.use((err, req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-HTTP-Method-Override,X-Requested-With,Content-Type,Accept,content-type,application/json,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS');
  res.header("Access-Control-Allow-Credentials", true);
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({
      error: 'You are unauthorised'
    });
  }
});





app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/signedpdf',express.static(__dirname + "/public/signedpdf/"));
app.use('/api/images',express.static(__dirname + "/public/images/"));
app.use('/api/register',express.static(__dirname + "/public/register/"));
app.use('/api/upload',express.static(__dirname + "/public/upload/"));

//var io = require('socket.io').listen(2);
//app.io = io;
app.use(function(req, res, next) {
  //req.io = io;
  next();
});
// io.on("connection", socket => {


//   socket.on("disconnect", function () {

//   });

//       socket.on("verifyClicked", message => {
//         setTimeout(()=>{
//           io.emit("verifyClient", message);
//             },1000);
//   });

//   socket.on("SignClicked", message => {
//     // models.Application.find({
//     //   where:{
//     //       id: message.id
//     //   }
//     // }).then(data =>{
//     //   setTimeout(()=>{
//     //   io.emit("SignClient", data);
//     // },500)
//     // })  
  
   
// });
//   socket.on("tracker", track => {
//     var root_path = path.dirname(require.main.filename);
//     var models  = require(root_path+'/models');
//     models.Application.find({
//       where:{
//           user_id: track
//       }
//     }).then(track_status =>{
//       socket.emit("tracker",track_status);
//     })  
//   });
//   //////for withdropdown
//   socket.on("trackdropdown", trackit => {
//     var root_path = path.dirname(require.main.filename);
//     var models  = require(root_path+'/models');
//     models.Application.find({
//       where:{
//           id: trackit,
//       }
//     }).then(track_status =>{
//       socket.emit("trackdropdown",track_status);
//     })
//   });
  
// });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(auth.initialize());
var unprotected = [
  '/api/auth/login',
  '/api/auth/getclickDetails',
  '/api/auth/reset-pass',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/resetpassword',
  '/api/auth/resend-otp',
  '/api/auth/logout',
  '/api/auth/captcha',
  '/api/admin/sp',
  '/api/auth/verify-otp-reg',
  '/api/admin/adminDashboard/get_otp',
  '/api/admin/adminDashboard/deleteNotification',
  '/api/admin/getclickDetails',
  '/favicon.ico',
  '/\/public*/',
  '/\/upload*/',
  '/socket.io/',
  '/api/attestation/uploadMarkList',
  '/api/payment/success-redirect-url',
  '/api/payment/proceedRefund',
  '/api/payment/cancel-redirect-url',
  '/api/attestation/upload_document',
  '/api/support/attachment',
  '/api/abcdef',
  '/api/replyFromCollege',
  '/api/auth/checkEmail',
  '/api/auth/downloadStructureFile',
  '/api/cron/collegeEmailStatusUpdate',
  '/api/cron/WESApplicationUploadStatus',
  '/api/attestation/upload_curriculum',
  '/api/payment/orderlookup',
  '/api/auth/verify-email',
  '/api/auth/refresh-token',
  '/api/admin/generateInstrucionalLetter1',
  '/api/payment/remainingpayment',
  '/api/payment/success-link-redirect-url',
  '/api/cron/purposeEmailUpdate',
  '/api/cron/statusEmailSendtoStudent',
  '/api/cron/statusEmailSendtoStudent_other',
  '/api/cron/pendingApplicationReminderMailToCollege',
  '/api/attestation/sendEmail',
  '/api/payment/changeSplitStatus',
  '/api/payment/invoicelookup',
  '/api/payment/invoicelookupCron',
  '/api/payment/multipleOrderlookup',
  '/api/payment/invoice_generation',
  '/api/payment/payment_details_one_month',
  '/api/payment/getQuickInvoice',
  '/api/payment/autoSplit',
  '/api/testApp',
  '/api/signpdf/checkWESINfo',
  '/api/attestation/upload_gradeToPercentLetter',
  '/api/attestation/getNameChangeData',
  '/api/attestation/getname',
  '/api/onHoldReminderManually',
  '/api/payment/split_excel_sheets',
  '/api/attestation/upload_CompetencyLetter',
  '/api/attestation/Upload_PaymentIssueUrl',
  '/api/attestation/post_applicationdata',
  '/api/attestation/Pre_applicationdata',
  '/api/attestation/getPaymentIssueDetails',
  '/api/attestation/post_applicationdata_byApp_id',
  '/api/attestation/geterror_msg',
  '/api/auth/getUserDataByEmail',
  '/api/admin/generateHrdLetter',
  '/api/cron/improvementFeedback'
];
app.use(checkjwt({
  secret: cfg.jwtSecret
}).unless({
  path: unprotected
}));

app.use('/', routes);
app.use('/api/auth',authRoutes);
app.use('/api/dashboard',dashboard);
app.use('/api/admin', adminDashboard);
app.use('/api/attestation',attestation);
app.use('/api/payment', payment);
app.use('/api/signpdf',signpdf);
app.use('/api/wes',wes);

app.use('/api/support',support);
app.use('/api/cron',cron);

var server = app.listen(constant.PORT, function () {
  logger.debug('Debugging info');
  logger.verbose('Verbose info');
  logger.info('Hello world');
  logger.warn('Warning message');
  logger.error('Error info');

});
//let io = require("socket.io")(server);


module.exports = app;