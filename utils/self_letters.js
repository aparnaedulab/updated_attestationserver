var models  = require('../models');
var crypto = require('crypto');
var randomstring = require('randomstring');
var encryptor = require('simple-encryptor')('je93KhWE08lH9S7SN83sneI87');
var Sequelize = require('sequelize');
var moment = require('moment');
var Moment = require('moment-timezone');
var uid = require('uid2');
var fs = require('fs');
var path = require('path');
var root_path = path.dirname(require.main.filename);
// var constant = require(root_path+'/config/constant');
require('moment-range');
// var sendGridMail = require('@sendGrid/mail');
var constants = require('../config/constant');
var request = require('request').defaults({encoding: null});
var cloudconvert = new (require('cloudconvert'))('37ghbio4CcT3N7mdKAPQNIniRg78R8EkJEMn31UQ_t3u24Uty9ab0MMByNO4euNuPXhVoa3ItJY-Vz_A1kDuyw');
var converter = require('number-to-words');
const { reduce } = require('async');
algorithm = 'aes-256-ctr',
password = 'je93KhWE08lH9S7SN83sneI87';
var QRCode = require('qrcode');
var functions = require('./function');
const { exec } = require('child_process');
const logger = require('../logger')(__filename);
const PDFDocument = require('pdfkit');
var convert  = require('roman-numbers');
module.exports = {
	online_payment_challan : function(user_id, application_id,payment_amount, transaction_id, date_time, status_payment, fee_amount, gst_amount, pay_amount, order_id, email_id, callback){
		
		var application_no = application_id;
		var payment_amount = payment_amount;
		var transaction_fee;
		var total_amount;
		var filename;

		var transaction_id = transaction_id;
		//var date_time = date_time;
		var ts = new Date(date_time);
  	    var date_time = ts.toString();
		var status_payment = status_payment;
		// var payment_amount = 'INR '+ fee_amount;
		// var transaction_fee = 'INR '+ gst_amount;
		var total_amount = 'INR '+ payment_amount;
		// var payment_amount = 'INR '+ payment_amount;
		// var transaction_fee = 'INR 0';
		// var total_amount = payment_amount;
		var duration = converter.toWords(payment_amount);

		
		filename = application_id+"_Attestation_Payment_Challan";
		var dir = constants.FILE_LOCATION+'public/upload/documents/'+user_id;
		var file_Dir = constants.FILE_LOCATION+'public/upload/documents/'+user_id;

		
		if (!fs.existsSync(dir)){
			fs.mkdirSync(dir);
		 }
		
		var fonts = {
			Roboto: {
				normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
				bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
				italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
				bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
			  }
		};
		var PdfPrinter = require(constants.NODE_MODULES_PATH+'pdfmake/src/printer');

		var docDefinition = {
			content: [
			{
				style:{
				  fontSize: 10,
				  bold: false,
				  
				} ,
				table: {
				  widths: [150,200,150],
				  headerRows: 1,
				  body: [
					['',{image: constants.FILE_LOCATION+'public/upload/profile_pic/gu logo.png',fit: [60, 60],alignment: 'center'},''],
					//['',{text:'INTERNATIONAL CENTRE',fontSize: 9,bold:true,alignment: 'center'},''],
					['',{text:'Gujarat University',fontSize: 9,bold:true,alignment: 'center'},''],
					['',{text:'Online Payment Receipt - International Evaluation',fontSize: 8,bold:true,alignment: 'center'},''],
					
				  ]
				},
				layout: 'noBorders',
			  },
		  
			  {
				style:{
				  fontSize: 10,
				  bold: false,
				  
				} ,
				table: {
				  widths: [30, 200, 300],
				  headerRows: 1,
				  body: [
					[{image: constants.FILE_LOCATION+'public/upload/profile_pic/gu logo.png',fit: [30, 30]},{text:'',fontSize: 7,bold:true},{text:'University Copy',fontSize: 7,bold:true,margin: [210,0,0,0]}],
					['',{text:'Gujarat University',fontSize: 7,bold:true, margin: [0,-20,0,0]} ,''],
					['',{text:'',fontSize: 7,bold:true, margin: [0,-16,0,0]},''],
					
				  ]
				},
				layout: 'noBorders'
				
			  },
			  
			  {
				style:{
				  fontSize: 10,
				  bold: false,
				  /*hLineColor : 'gray',
				  vLineColor :'gray',
				  color : 'black'*/
				} ,
				table: {
				  widths: [200, 300],
				  headerRows: 1,
				  body: [
					[{text:'Student\'s registered email ID',fontSize: 10,bold:true},' '+email_id ],
					[{text:'Application No.',fontSize: 10,bold:true},' '+application_no ],
					//[{text:'Country Name',fontSize: 10,bold:true}, ' ' ],
					[{text:'Transaction Id',fontSize: 10,bold:true}, ' '+transaction_id ],
					[{text:'Payment order ID',fontSize: 10,bold:true}, ' '+order_id ], 
					[{text:'Payment Date & Time',fontSize: 10,bold:true}, ' '+date_time ],
					// [{text:'Amount',fontSize: 10,bold:true}, ' '+payment_amount ],
					// [{text:'Transaction Fee',fontSize: 10,bold:true}, ' '+transaction_fee ],
					[{text:'Total Payment Amount',fontSize: 10,bold:true}, ' '+total_amount ],
					[{text:'Payment Amount in word',fontSize: 10,bold:true}, ' '+duration +' rupees only' ],
					[{text:'Status of payment',fontSize: 10,bold:true}, ' ' +status_payment]
				  ]
				},
				//layout: 'noBorders'
				
			  },
		  
			  {text: '',fontSize: 10,bold:true},
			  {text: '',fontSize: 10,bold:true},
			  {text: '',fontSize: 10,bold:true},
			  {text:' ',fontSize: 10,bold:true},
			  {text:'____________________________________________________Cut Here____________________________________________________ ',fontSize: 10,bold:false},
			  {text: '',fontSize: 10,bold:true},
			  {text: '',fontSize: 10,bold:true},
			  {
				style:{
				  fontSize: 10,
				  bold: false,
				  // hLineColor : 'gray',
				  // vLineColor :'gray',
				  // color : 'black'
				} ,
				table: {
				  widths: [150,200,150],
				  headerRows: 1,
				  body: [
					['','',''],
					['','',''],
					['',{image: constants.FILE_LOCATION+'public/upload/profile_pic/gu logo.png',fit: [60, 60],alignment: 'center'},''],
					//['',{text:'INTERNATIONAL CENTRE',fontSize: 9,bold:true,alignment: 'center'},''],
					['',{text:'Gujarat University',fontSize: 9,bold:true,alignment: 'center'},''],
					['',{text:'Online Payment Receipt - International Evaluation',fontSize: 8,bold:true,alignment: 'center'},''],
					
				  ]
				},
				layout: 'noBorders',
			  },
		  
			  {
				style:{
				  fontSize: 10,
				  bold: false,
				  
				} ,
				table: {
				  widths: [30, 200, 300],
				  headerRows: 1,
				  body: [
					[{image: constants.FILE_LOCATION+'public/upload/profile_pic/gu logo.png',fit: [30, 30]},{text:'',fontSize: 7,bold:true},{text:'Student Copy',fontSize: 7,bold:true,margin: [210,0,0,0]}],
					['',{text:'Gujarat University',fontSize: 7,bold:true, margin: [0,-20,0,0]} ,''],
					['',{text:'',fontSize: 7,bold:true, margin: [0,-16,0,0]},''],
					
				  ]
				},
				layout: 'noBorders'
				
			  },
			  
			  {
				style:{
				  fontSize: 10,
				  bold: false,
				  
				} ,
				table: {
				  widths: [200, 300],
				  headerRows: 1,
				  body: [
					[{text:'Student\'s registered email ID',fontSize: 10,bold:true},' '+email_id ],
					[{text:'Application No.',fontSize: 10,bold:true},' '+application_no ],
					//[{text:'Country Name',fontSize: 10,bold:true}, ' ' ],
					[{text:'Transaction Id',fontSize: 10,bold:true}, ' '+transaction_id ],
					[{text:'Payment order ID',fontSize: 10,bold:true}, ' '+order_id ], 
					[{text:'Payment Date & Time',fontSize: 10,bold:true}, ' '+date_time ],
					// [{text:'Amount',fontSize: 10,bold:true}, ' '+payment_amount ],
					// [{text:'Transaction Fee',fontSize: 10,bold:true}, ' '+transaction_fee ],
					[{text:'Total Payment Amount',fontSize: 10,bold:true}, ' '+total_amount ],
					[{text:'Payment Amount in word',fontSize: 10,bold:true}, ' '+duration +' rupees only' ],
					[{text:'Status of payment',fontSize: 10,bold:true}, ' ' +status_payment]
				  ]
				},
			  }
				
			],
			 defaultStyle: {
			   alignment: 'justify',
			   fontSize: 10
			}
		  };


	//		var fonts = doc.fonts;
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(file_Dir+'/'+filename+'.pdf'));
		pdfDoc.end();
		docDefinition=null;
		callback();
	},
	// instrucationalLetter : function(user_id,application_id,studentName,collegeName,courseName,specialization,passingMonthYear,duration,passingClass,instruction_medium,application_date,subject,subject1,ref_no,callback){
	// 	filename = application_id+"_InstructionalLetter";
	// 	var currentYear = moment(new Date()).year();
	// 	//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
	// 	var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
	// 	var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
	// 	currentDateTime = moment(new Date()).format("DD/MM/YYYY");
	// 	duration
	// 	if (!fs.existsSync(dir)){
	// 		fs.mkdirSync(dir);
	// 	}

	// 	var fonts = {
	// 		Roboto: {
	// 			normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
	// 			bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
	// 			italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
	// 			bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
	// 		  }
	// 	};

	// 	// var fonts = {
	// 	// 	Roboto: {
	// 	// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
	// 	// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
	// 	// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
	// 	// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
	// 	// 	  }
	// 	// };

	// 	var PdfPrinter = require(constants.Certificate_Url+'node_modules/pdfmake/src/printer');
	// 	//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

	// 	var docDefinition = {
	// 		content:[
	// 			// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
	// 			// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
	// 			// {text:' ',fontSize: 8,bold:true},
	// 			{
	// 				style:{
	// 				  fontSize: 10,
	// 				  bold: false,
	// 				  // hLineColor : 'gray',
	// 				  // vLineColor :'gray',
	// 				  color : 'blue'
	// 				} ,
	// 				table: {
	// 				  widths: [180,160,180],//[30,70,230,150],
	// 				  headerRows: 1,
	// 				  body: [
	// 					[{text:'------',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
	// 					[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
	// 					[{text:'Department Of Students’ Development',fontSize: 10}, '',{text:'-------,',alignment:'left'}],
	// 					[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'---------,',alignment:'left'}],
	// 					[{text:'',fontSize: 8}, '',{text:'Gujarat - --.',alignment:'left'}],
	// 					[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No. -----',alignment:'left'}],
	// 					[{text:'No. SW/' + application_id + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
	// 					[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]
	// 				]
	// 				},
	// 				layout: 'noBorders',
	// 			  },
	// 			{text:' ',fontSize: 8,bold:true},
    //     		{text:' ',fontSize: 8,bold:true},
    //     		{text:' ',fontSize: 8,bold:true},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{	
	// 				style:{
	// 					fontSize: 10,
	// 					bold: false,
	// 				} ,
	// 				table: {
	// 					widths: [70,400,70],
	// 					headerRows: 1,
	// 					body: [
	// 					 ['',[
	// 							{
	// 								table: {
	// 									widths: [350],
	// 									body: [
	// 										[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
	// 									]
	// 								},
	// 								layout: 'noBorders',
	// 							}
	// 						],''],
	// 					]
	// 				},
	// 				layout: 'noBorders',  
	// 			},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{text:['      This is to certify that '+studentName+ ' was a student of '+collegeName+' for ' + duration.toWords + courseName + subject + ' has been awarded the '+courseName + ' from ' + passingMonthYear+ duration + '-year degree (Major in '+ specialization +') in the '+passingClass+' for the examination held in ' + passingMonthYear + '. The medium of instruction of the said course was in ',{text :  instruction_medium , bold:true}, '.'], fontSize: 10},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{text:'      This letter is issued to '+studentName+ ' on ' + subject1 + ' request dated '+ moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{
	// 				style:{
	// 					fontSize: 10,
	// 					bold: false,
	// 				} ,
	// 				table: {
	// 					widths: [110,270,150],
	// 					headerRows: 1,
	// 					body: [
	// 					 ['','',{text:'Director, DSD',alignment:'center'}],
	// 					]
	// 				},
	// 				layout: 'noBorders',
	// 			},
	// 			{
	// 				style:{
	// 				  	fontSize: 10,
	// 				  	bold: false,
	// 				} ,
	// 				table: {
	// 				  	widths: [130,220,220],
	// 				  	headerRows: 1,
	// 				  	body: [
	// 						['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/gu_Stamp.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/RegistrarSignature.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
	// 						['','','']
	// 				  	]
	// 				},
	// 				layout: 'noBorders',
	// 			},
	// 		],
	// 		defaultStyle: {
	// 			alignment: 'justify',
	// 			fontSize: 10
	// 	 	}
	// 	};
	// 	var printer = new PdfPrinter(fonts);
	// 	var pdfDoc = printer.createPdfKitDocument(docDefinition);
	// 	pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+'.pdf'));
	// 	pdfDoc.end();
	// 	docDefinition=null;
	// 	callback();
	// },
	// instrucationalLetterForDiffClg : function(user_id,application_id,studentName,collegeData,courseName,specialization,passingMonthYear,duration,passingClass,instruction_medium,application_date,subject,subject1,ref_no,callback){
	// 	filename = application_id+"_InstructionalLetter";
	// 	var currentYear = moment(new Date()).year();
	// 	//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
	// 	var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
	// 	var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
	// 	currentDateTime = moment(new Date()).format("DD/MM/YYYY");
	// 	if (!fs.existsSync(dir)){
	// 		fs.mkdirSync(dir);
	// 	}
	// 	var fonts = {
	// 		Roboto: {
	// 			normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
	// 			bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
	// 			italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
	// 			bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
	// 		  }
	// 	};

	// 	// var fonts = {
	// 	// 	Roboto: {
	// 	// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
	// 	// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
	// 	// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
	// 	// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
	// 	// 	  }
	// 	// };
		
	// 	var PdfPrinter = require(constants.Certificate_Url+'node_modules/pdfmake/src/printer');
	// 	//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

	// 	var docDefinition = {
	// 		content:[
	// 			// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
	// 			// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
	// 			// {text:' ',fontSize: 8,bold:true},
	// 			{
	// 				style:{
	// 				  fontSize: 10,
	// 				  bold: false,
	// 				  // hLineColor : 'gray',
	// 				  // vLineColor :'gray',
	// 				  color : 'blue'
	// 				} ,
	// 				table: {
	// 				  widths: [180,160,180],//[30,70,230,150],
	// 				  headerRows: 1,
	// 				  body: [
	// 					[{text:'-----',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
	// 					[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
	// 					[{text:'------------',fontSize: 10}, '',{text:'-----------,',alignment:'left'}],
	// 					[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'--------,',alignment:'left'}],
	// 					[{text:'',fontSize: 8}, '',{text:'Gujarat - ---.',alignment:'left'}],
	// 					[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.: ---',alignment:'left'}],
	// 					[{text:'No. SW/' + application_id + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
	// 					[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
	// 				]
	// 				},
	// 				layout: 'noBorders',
	// 			  },
	// 			{text:' ',fontSize: 8,bold:true},
    //     		{text:' ',fontSize: 8,bold:true},
    //     		{text:' ',fontSize: 8,bold:true},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{	
	// 				style:{
	// 					fontSize: 10,
	// 					bold: false,
	// 				} ,
	// 				table: {
	// 					widths: [70,400,70],
	// 					headerRows: 1,
	// 					body: [
	// 					 ['',[
	// 							{
	// 								table: {
	// 									widths: [350],
	// 									body: [
	// 										[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
	// 									]
	// 								},
	// 								layout: 'noBorders',
	// 							}
	// 						],''],
	// 					]
	// 				},
	// 				layout: 'noBorders',  
	// 			},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{text :[' This is to certify that '+studentName+ ' a student of Gujarat University. The education details are as follow ' ],fontSize :10 },
	// 			{text:' ',fontSize: 8,bold:true},
	// 		],
	// 		defaultStyle: {
	// 			alignment: 'justify',
	// 			fontSize: 10
	// 	 	}
	// 	};

	// 	for(var college in collegeData){
	// 		docDefinition.content.push([
	// 			{text:[' ' + collegeData[college] + ' '],fontSize: 10},
	// 		])
	// 	}

	// 	docDefinition.content.push([
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:[ subject + ' has been awarded the '+courseName + ' ' + duration + '-year degree (Major in '+ specialization +') in the '+passingClass+' for the examination held in ' + passingMonthYear + '. The medium of instruction of the said course was in ',{text :  instruction_medium , bold:true}, '.'], fontSize: 10},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:'      This letter is issued to '+studentName+ ' on ' + subject1 + ' request dated '+ moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{
	// 			style:{
	// 				fontSize: 10,
	// 				bold: false,
	// 			} ,
	// 			table: {
	// 				widths: [110,270,150],
	// 				headerRows: 1,
	// 				body: [
	// 					['','',{text:'Director, DSD',alignment:'center'}],
	// 				]
	// 			},
	// 			layout: 'noBorders',
	// 		},
	// 		{
	// 			style:{
	// 				fontSize: 10,
	// 				bold: false,
	// 			} ,
	// 			table: {
	// 				widths: [130,220,220],
	// 				headerRows: 1,
	// 				body: [
	// 					['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/gu_Stamp.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/RegistrarSignature.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
	// 					['','','']
	// 				]
	// 			},
	// 			layout: 'noBorders',
	// 		},
	// 	])
		
	// 	var printer = new PdfPrinter(fonts);
	// 	var pdfDoc = printer.createPdfKitDocument(docDefinition);

		
	// 	pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+'.pdf'));
	// 	pdfDoc.end();

		
	// 	docDefinition=null;
	// 	callback();
	// },
	// instrucationalLetter_one : async function(user_id,application_id,studentName,collegeName,courseName,specialization,passingMonthYear,duration,passingClass,instruction_medium,application_date,subject,subject1,ref_no,education,letterType,yearofenrollment,callback){
	// 	console.log('instrucationalLetter_one @@@@@');
	// 	var studentname = studentName.toUpperCase();
		
	
	// 	var Outwardno = await functions.getOutward(application_id,'guattestation');
	// 	var filename;
	// 	filename = application_id + "_" + education + "_InstructionalLetter";
	// 	var currentYear = moment(new Date()).year();
	// 	//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
	// 	var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
	// 	var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
	// 	currentDateTime = moment(new Date()).format("DD/MM/YYYY");
	// 	if (!fs.existsSync(dir)){
	// 		fs.mkdirSync(dir);
	// 	}
	// 	para1= [];
	// 	para2= [];
	// 	para3= [];
	// 	para4= [];
	// 	var patteren = 'Annual' ;
	// 	if(patteren == 'Annual'){
			
	// 		para1.push([{text : [
	// 			{text :'\t\t\t This is to certify that (according to marks) ' },
	// 			{text : studentname , bold  : true },
	// 			{text : ' was a student of '+ collegeName +',Ahmedabad for ' + duration + ' years.'  + ' from ' + yearofenrollment + ' to ' + passingMonthYear + ' during of his/her graduation in the ' +  courseName +  ' Faculty with First Class .'}
	// 		],preserveLeadingSpaces : true
	// 	}])
	
	
	// 		para2.push([{text : [
	// 			{text:'\t\t\t It is further certified that he/she has passed the ' + courseName + 'Sem VI Examination in ' + passingMonthYear},	
	// 		],preserveLeadingSpaces : true}])
			
		
	// 		para3.push([{text : [
	// 			{text:'\t\t\t As per the college record the medium of instruction of the above course was'}, 
	// 			{text : instruction_medium , bold  : true },
				
	// 		],preserveLeadingSpaces : true}])

	// 		para4.push([{text : [
	// 			{text:'\t\t\t Also certified that  '+ collegeName +',Ahmedabad is affiliated to Gujarat Univeristy'}, 
				
	// 		],preserveLeadingSpaces : true}])
			
	// 	}else{
	// 		para1.push([{text : [
	// 			{text :'\t\t\t This is to certify that (according to marks)'},
	// 			{text : studentname , bold  : true },
	// 			{text : ' was a student of '+ collegeName +',Ahmedabad for ' + duration + ' years.' + '(Semester I to VI)' + ' from ' + yearofenrollment + ' to ' + passingMonthYear + ' during of his/her graduation in the ' +  courseName +  ' Faculty .'}
	// 		]}])
	
	// 		para2.push([{text : [
	// 			{text:'\t\t\t It is further certified that he/she has passed the ' + courseName + 'Sem VI Examination in ' + passingMonthYear + 'As per the college record the medium of instruction of the above course was '},	
	// 			{text : instruction_medium , bold  : true },
	// 		]}])
	
	// 		para3.push([{text : [
	// 			{text:'\t\t\t Also certified that  '+ collegeName +',Ahmedabad is affiliated to Gujarat Univeristy'}, 
				
	// 		]}])
			
	// 	}
	// 	var fonts = {
	// 		Roboto: {
	// 			normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
	// 			bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
	// 			italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
	// 			bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
	// 		  }
	// 	};

	// 	// var fonts = {
	// 	// 	Roboto: {
	// 	// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
	// 	// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
	// 	// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
	// 	// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
	// 	// 	  }
	// 	// };

	// 	var PdfPrinter = require(constants.Certificate_Url+'node_modules/pdfmake/src/printer');
	// 	//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

	// 	var docDefinition = {
	// 		pageSize: 'A4',
	// 		background: [
	// 			{
	// 				image: constants.FILE_LOCATION+'public/upload/profile_pic/LetterBack_page.jpg',
	// 				width: 600
	// 			}
	// 		],
	// 		content:[
	// 			// {
	// 			// 	style:{
	// 			// 	  fontSize: 10,
	// 			// 	  bold: false,
	// 			// 	//   color : 'blue'
	// 			// 	} ,
	// 			// 	table: {
	// 			// 	  widths: [520],//[30,70,230,150],
	// 			// 	  headerRows: 1,
	// 			// 	  body: [
	// 			// 		[{image: constants.FILE_LOCATION + 'public/upload/profile_pic/GU Letter Head.jpg',width : 520 , height : 200}],
	// 			// 	]
	// 			// 	},
	// 			// 	layout: 'noBorders',
	// 			//   },
	// 			  {
	// 				style:{
	// 				  fontSize: 10,
	// 				  bold: false,
	// 				//   color : 'blue'
	// 				} ,
	// 				table: {
	// 				  widths: [260,260],//[30,70,230,150],
	// 				  headerRows: 1,
	// 				  body: [
	// 					[{text:'Outward Number : ' +  Outwardno.outward ,fontSize: 10,bold:true , alignment : 'left',margin : [20,150,0,0]},{text: 'Date : 19/01/202' ,fontSize: 10,bold:true , alignment : 'center',margin : [0,150,10,0]}],
	// 				]
	// 				},
	// 				layout: 'noBorders',
	// 			  },
	// 			{text:' ',fontSize: 8,bold:true},
    //     		{text:' ',fontSize: 8,bold:true},
    //     		{text:' ',fontSize: 8,bold:true},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{	
	// 				style:{
	// 					fontSize: 10,
	// 					bold: false,
	// 				} ,
	// 				table: {
	// 					widths: [70,400,70],
	// 					headerRows: 1,
	// 					body: [
	// 					 ['',[
	// 							{
	// 								table: {
	// 									widths: [350],
	// 									body: [
	// 										[{text:'TO WHOM SO EVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
	// 									]
	// 								},
	// 								layout: 'noBorders',
	// 							}
	// 						],''],
	// 					]
	// 				},
	// 				layout: 'noBorders',  
	// 			},
	// 			{
	// 				style:{
	// 					fontSize: 12,
	// 					bold: false,
	// 				} ,
	// 				table: {
	// 					widths: [520],
	// 					headerRows: 1,
	// 					body: para1
	// 				},
	// 				layout: 'noBorders',
	// 			},
	// 			{
	// 				style:{
	// 					fontSize: 12,
	// 					bold: false,
	// 				} ,
	// 				table: {
	// 					widths: [520],
	// 					headerRows: 1,
	// 					body: para2
	// 				},
	// 				layout: 'noBorders',
	// 			},
	// 			{
	// 				style:{
	// 					fontSize: 12,
	// 					bold: false,
	// 				} ,
	// 				table: {
	// 					widths: [520],
	// 					headerRows: 1,
	// 					body: para3
	// 				},
	// 				layout: 'noBorders',
	// 			},
	// 			{
	// 				style:{
	// 					fontSize: 12,
	// 					bold: false,
	// 				} ,
	// 				table: {
	// 					widths: [520],
	// 					headerRows: 1,
	// 					body: para4
	// 				},
	// 				layout: 'noBorders',
	// 			},
	// 			{
	// 				style:{
	// 					fontSize: 10,
	// 					bold: false,
	// 				} ,
	// 				table: {
	// 					widths: [520],
	// 					heights : [50],
	// 					headerRows: 1,
	// 					body: [
	// 						[{text :'No. SW/' + ref_no + ' of ' + currentYear,fontSize: 10,bold:true , alignment : 'left',margin : [20,30,0,0]}],
	// 					]
	// 				},
	// 				layout: 'noBorders',
	// 			},
	// 			{
	// 				style:{
	// 				  	fontSize: 10,
	// 				  	bold: false,
	// 				} ,
	// 				table: {
	// 				  	widths: [130,220,220],
	// 				  	headerRows: 1,
	// 				  	body: [
	// 						[{rowSpan: 2,image: constants.FILE_LOCATION + 'public/signedpdf/' + user_id + '/' + application_id + '_attestation_qrcode.png',alignment:'left',margin :[0,50,0,0],width : 80 ,height :  80},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/GUStamp.png',alignment:'center',margin :[0,0,0,0] , width : 130 ,height :  200  },{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/RegistrarSignature.png',width : 150 ,height :  200 ,alignment:'center',margin :[0,0,0,0]}],//DIRECT SNIPPING TOOL
	// 						{text:'To check the authenticity of the certificate,Kindly scan the QR Code',fontSize: 8,bold:true},
	// 				  	]
	// 				},
	// 				layout: 'noBorders',
	// 			},
	// 		],
	// 		defaultStyle: {
	// 			alignment: 'justify',
	// 			fontSize: 10
	// 	 	}
	// 	};
	// 	var printer = new PdfPrinter(fonts);
	// 	var pdfDoc = printer.createPdfKitDocument(docDefinition);
	// 	pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+'.pdf'));
	// 	pdfDoc.end();
	// 	docDefinition=null;
	// 	callback();
	// },
	instrucationalLetter_one: async function (user_id,patteren,type,course_faculty, duration1,application_id, studentName, collegeName, courseName, specialization, passingMonthYear, duration, passingClass, instruction_medium, application_date, subject, subject1, ref_no, education, letterType, yearofenrollment,shortname,wasis,new_course_faculty, callback) {
		var lastsem = duration1 * 2;
		var coursename1 = await functions.getCourse(courseName)
		var toroman = convert.arabToRoman(lastsem);
		var studentname = studentName.toUpperCase();
		var Outwardno = await functions.getOutward(application_id , type);
		var filename;
		var yearofenrollment= moment(new Date(yearofenrollment)).format("MMMM - YYYY ");
		var passingMonthYear= moment(new Date(passingMonthYear)).format("MMMM - YYYY ");
		var passingMonthYear1 = moment (new Date(passingMonthYear)).format("MMMM - YYYY");
		console.log("passingMonthYear1passingMonthYear1" + passingMonthYear1);
		filename = application_id + "_" + education + "_InstructionalLetter";
		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION + 'public/signedpdf/' + user_id;
		var file_Dir = constants.FILE_LOCATION + 'public/signedpdf/' + user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
		var inWords_duration = duration.charAt(0).toUpperCase() + duration.slice(1);
		var specialization1 = (specialization) ?specialization+' subject with ': '';
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		para1 = [];
		para2 = [];
		para3 = [];
		para4 = [];
		dur1='First Year';
		
		 if(duration1 == 2 ){
			dur ='Second'
		}else if(duration1== 3){
			dur='Third'
		}else if(duration1 == 4){
			dur ='Fourth'
		}else if(duration1 ==  5){
			dur = 'Fifth'
		}
		// var patteren = 'Annual';
		if(course_faculty !='Physiotherapy' && course_faculty !='Dental' && course_faculty !='Medical' &&  course_faculty != 'Peramedical'){
			if(coursename1 != null && coursename1 != 'null' && coursename1 != '' && coursename1 != 'undefined' && coursename1 != undefined){
				if(courseName == coursename1[0].course_name){
					var course= coursename1[0].course_name+' ('+inWords_duration+' years Integrated programme)';
					if (patteren == 'Annual') {
					console.log("patteren ======"+patteren);
					
					if(type=='Bachelors'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' Years '+ course	+' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}else if(type == 'Masters'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' Years '+ course	+' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}
					para2.push([{
						text: [
							{ text: '\t\t\t\t It is further certified that he/she has passed the '+inWords_duration+' Year '+ course + ' Examination in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para3.push([{
						text: [
							{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
							{ text: instruction_medium +'.', bold: true },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para4.push([{
						text: [
							{ text: '\t\t\t Also certified that  ' + collegeName + ' '+ wasis +'  affiliated to Gujarat University.' },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
				} else {
					console.log("--------------"+patteren);
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' has completed '+inWords_duration+'year integrated '+courseName+' (Semester-I to Semester-'+toroman+') '+'programme from '+collegeName+' from '+yearofenrollment+' to '+passingMonthYear+'.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
		
					
					para2.push([{
						text: [
							{ text: '\t\t\t\t It is further certified that he/she has passed the '+type+' of '+inWords_duration+' Years integrated ' + courseName+ ' Semester-' +toroman+' with '+specialization1+passingClass+' Examination.'},
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para3.push([{
						text: [
							{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
							{ text: instruction_medium +'.', bold: true },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para4.push([{
						text: [
							{ text: '\t\t\t Also certified that  ' + collegeName + ' ' + wasis +   ' affiliated to Gujarat Univerisity.' },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
				}
				}else{
					console.log("elseeeeeeeeeeeeeeeeeeeeeeeeeeee");
					if (patteren == 'Annual') {
						console.log("patteren ======"+patteren);
						
						if(type=='Bachelors'){
							para1.push([{
								text: [
									{ text: '\t\t\t This is to certify that ' },
									{ text: studentname, bold: true },
									{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
								], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
							}])
						}else if(type == 'Masters'){
							para1.push([{
								text: [
									{ text: '\t\t\t This is to certify that ' },
									{ text: studentname, bold: true },
									{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
								], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
							}])
						}
						para2.push([{
							text: [
								{ text: '\t\t\t\t It is further certified that he/she has passed the '+ shortname + ' Examination held in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
						para3.push([{
							text: [
								{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
								{ text: instruction_medium +'.', bold: true },
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
						para4.push([{
							text: [
								{ text: '\t\t\t Also certified that  ' + collegeName + ' '+ wasis  +'  affiliated to Gujarat University.' },
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
					} else {
						console.log("--------------"+patteren);
						if(type=='Bachelors'){
							para1.push([{
								text: [
									{ text: '\t\t\t This is to certify that ' },
									{ text: studentname, bold: true },
									{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + '  years (Semester-I to Semester-'+toroman +  ')' +' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
								], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
							}])
						}else if(type == 'Masters'){
							para1.push([{
								text: [
									{ text: '\t\t\t This is to certify that ' },
									{ text: studentname, bold: true },
									{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + '  years (Semester-I to Semester-'+toroman +  ')' +' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
								], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
							}])
						}
				
						
						para2.push([{
							text: [
								{ text: '\t\t\t\t It is further certified that he/she has passed the ' + courseName+ ' Examination (Semester-' +toroman+') held in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
						para3.push([{
							text: [
								{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
								{ text: instruction_medium +'.', bold: true },
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
						para4.push([{
							text: [
								{ text: '\t\t\t Also certified that  ' + collegeName + ' ' + wasis +   ' affiliated to Gujarat Univerisity.' },
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
					}
				}
			}else{
				if (patteren == 'Annual') {
					console.log("patteren ======"+patteren);
					
					if(type=='Bachelors'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}else if(type == 'Masters'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}
					para2.push([{
						text: [
							{ text: '\t\t\t\t It is further certified that he/she has passed the '+dur+' '+ shortname + ' Examination held in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para3.push([{
						text: [
							{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
							{ text: instruction_medium +'.', bold: true },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para4.push([{
						text: [
							{ text: '\t\t\t Also certified that  ' + collegeName + ' '+ wasis  +'  affiliated to Gujarat University.' },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
				} else {
					console.log("--------------"+patteren);
					if(type=='Bachelors'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + '  years (Semester-I to Semester-'+toroman +  ')' +' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}else if(type == 'Masters'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + '  years (Semester-I to Semester-'+toroman +  ')' +' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}
			
					
					para2.push([{
						text: [
							{ text: '\t\t\t\t It is further certified that he/she has passed the ' + courseName+ ' Examination (Semester-' +toroman+') held in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para3.push([{
						text: [
							{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
							{ text: instruction_medium +'.', bold: true },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para4.push([{
						text: [
							{ text: '\t\t\t Also certified that  ' + collegeName + ' ' + wasis +   ' affiliated to Gujarat Univerisity.' },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
				}	
			}
			

		}else{
			if(course_faculty =='Physiotherapy'){
				if(type=='Bachelors'){
					para1.push([{
						text: [
							{ text: '\t\t\t This is to certify that ' },
							{ text: studentname, bold: true },
							{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+' and six months of his/her internship completed during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
					}])
				}else if(type=='Masters'){
					para1.push([{
						text: [
							{ text: '\t\t\t This is to certify that ' },
							{ text: studentname, bold: true },
							{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+' and six months of his/her internship completed during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
					}])
				}
			}else{
	if(type=='Bachelors'){
		para1.push([{
			text: [
				{ text: '\t\t\t This is to certify that ' },
				{ text: studentname, bold: true },
				{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+' and twelve months of his/her internship completed during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
			], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
		}])
	}else if(type=='Masters'){
		para1.push([{
			text: [
				{ text: '\t\t\t This is to certify that ' },
				{ text: studentname, bold: true },
				{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+' and twelve months of his/her internship completed during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
			], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
		}])
	}
}
			
		para2.push([{
			text: [
				{ text: '\t\t\t\t It is further certified that he/she has passed the '+ courseName + ' Examination held in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
			], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
		}])
		para3.push([{
			text: [
				{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
				{ text: instruction_medium +'.', bold: true },
			], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
		}])
		para4.push([{
			text: [
				{ text: '\t\t\t Also certified that  ' + collegeName + ' '+ wasis  +'  affiliated to Gujarat University.' },
			], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
		}])
		}
		var fonts = {
			Roboto: {
				normal: constants.FILE_LOCATION + 'public/fonts/Roboto-Regular.ttf',
				bold: constants.FILE_LOCATION + 'public/fonts/Roboto-Medium.ttf',
				italics: constants.FILE_LOCATION + 'public/fonts/Roboto-Italic.ttf',
				bolditalics: constants.FILE_LOCATION + 'public/fonts/Roboto-MediumItalic.ttf'
			},
			TimesNewRoman: {
				normal: constants.FILE_LOCATION + 'public/fonts/times new roman.ttf',
				bold: constants.FILE_LOCATION + 'public/fonts/times new roman bold.ttf',
				italics: constants.FILE_LOCATION + 'public/fonts/times new roman italic.ttf',
				bolditalics: constants.FILE_LOCATION + 'public/fonts/times new roman bold italic.ttf'
			},
		};
		// var fonts = {
		//  Roboto: {
		//      normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
		//      bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
		//      italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
		//      bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
		//    }
		// };
		var PdfPrinter = require(constants.Certificate_Url+'node_modules/pdfmake/src/printer');
		// var PdfPrinter = require('D:/AttesationGU/guAttestationServer/node_modules/pdfmake/src/printer');
		var docDefinition = {
			pageSize: 'A4',
			background: [
				{
					image: constants.FILE_LOCATION + 'public/upload/profile_pic/LetterBack_page.jpg',
					width: 600
				}
			],
			content: [
	
				// {
				//  style:{
				//    fontSize: 10,
				//    bold: false,
				//  //   color : 'blue'
				//  } ,
				//  table: {
				//    widths: [520],//[30,70,230,150],
				//    headerRows: 1,
				//    body: [
				//      [{image: constants.FILE_LOCATION + 'public/upload/profile_pic/GU Letter Head.jpg',width : 520 , height : 200}],
				//  ]
				//  },
				//  layout: 'noBorders',
				//   },
	
				{
	
					table: {
						widths: [540],
						headerRows: 1,
						body: [
	
							[
								{
									style: {
										fontSize: 10,
										bold: false,
										//   color : 'blue'
									},
									table: {
										widths: [260, 260],//[30,70,230,150],
										headerRows: 1,
										body: [
											[
												{ text:'No.Exam./4A/' + Outwardno.outward +'/'+currentYear, fontSize: 10, bold: true, alignment: 'left', margin: [20, 140, 0, 0] },
												{ text: 'Date :' + currentDateTime, fontSize: 10, bold: true, alignment: 'right', margin: [0, 140, 10, 0] }
											],
										]
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 10,
										bold: false,
									},
									table: {
										widths: [60, 400, 60],
										headerRows: 1,
										body: [
											['',{ text: 'TO WHOM SO EVER IT MAY CONCERN', fontSize: 12, decoration: 'underline', alignment: 'center', bold: true, margin:[0,20,0,0] }, ''],
										]
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 12,
										bold: false,
									},
									table: {
										widths: [510],
										headerRows: 1,
										body: para1
									},
									layout: 'noBorders',
								},
								
							],
							[
								{
									style: {
										fontSize: 12,
										bold: false,
									},
									table: {
										widths: [510],
										headerRows: 1,
										body: para2
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 12,
										bold: false,
									},
									table: {
										widths: [510],
										headerRows: 1,
										body: para3
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 12,
										bold: false,
									},
									table: {
										widths: [510],
										headerRows: 1,
										body: para4
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 10,
										bold: false,
									},
									table: {
										widths: [520],
										// heights: [50],
										headerRows: 1,
										body: [
											[{ text:'MOI Number :-'+ currentYear + ref_no , fontSize: 10, bold: true, alignment: 'left', margin: [20, 30, 0, 0] }],
										]
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 10,
										bold: false,
									},
									table: {
										widths: [110, 260, 260],
										heights:[50],
										headerRows: 1,
										body: [
											[{image: constants.FILE_LOCATION + 'public/signedpdf/' + user_id + '/' + application_id + '_attestation_qrcode.png', alignment: 'left', margin: [10, 50, 0, 0], width: 80, height: 80 },
											// { image: constants.FILE_LOCATION + '', alignment: 'center', margin: [10, 0, 0, 0], width: 130, height: 200 },
											{ image: constants.FILE_LOCATION + 'public/upload/profile_pic/RegistrarSignature.png', width: 150, height: 200, margin: [260, 0, 0, 0] }],//DIRECT SNIPPING TOOL
											[{ text: 'To check the authenticity of the certificate,Kindly scan the QR Code', fontSize: 12, bold: false,colSpan:3, font: 'TimesNewRoman',alignment: 'left' },'','']
										]
									},
									layout: 'noBorders',
								},
							],
							// [
							// 	{
							// 		style: {
							// 		},
							// 		table: {
							// 			widths: [520],
							// 			// headerRows: 1,
							// 			body: [
							// 				[{ text: 'To check the authenticity of the certificate,Kindly scan the QR Code. ', fontSize: 10, bold: false, alignment: 'left', margin: [0, 0, 0, 0] }],
							// 			]
							// 		},
							// 		// layout: 'noBorders',
							// 	},
							// ]
						]
					},
					layout: 'noBorders'
				}
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
			}
		};
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(dir + '/' + filename + '.pdf'));
		pdfDoc.end();
		docDefinition = null;
		callback();
	},
	instrucationalLetter_one_notforprint: async function (user_id,patteren,type,course_faculty, duration1,application_id, studentName, collegeName, courseName, specialization, passingMonthYear, duration, passingClass, instruction_medium, application_date, subject, subject1, ref_no, education, letterType, yearofenrollment,shortname,wasis,new_course_faculty, callback) {
		var lastsem = duration1 * 2;
		var coursename1 = await functions.getCourse(courseName)
		var toroman = convert.arabToRoman(lastsem);
		var studentname = studentName.toUpperCase();
		var Outwardno = await functions.getOutward(application_id , type);
		var filename;
		var yearofenrollment= moment(new Date(yearofenrollment)).format("MMMM - YYYY ");
		var passingMonthYear= moment(new Date(passingMonthYear)).format("MMMM - YYYY ");
		var passingMonthYear1 = moment (new Date(passingMonthYear)).format("MMMM - YYYY");
		console.log("passingMonthYear1passingMonthYear1" + passingMonthYear1);
		filename = application_id + "_" + education + "_InstructionalLetter";
		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION + 'public/signedpdf/' + user_id;
		var file_Dir = constants.FILE_LOCATION + 'public/signedpdf/' + user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
		var inWords_duration = duration.charAt(0).toUpperCase() + duration.slice(1);
		var specialization1 = (specialization) ?specialization+' subject with ': '';
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		para1 = [];
		para2 = [];
		para3 = [];
		para4 = [];
		dur1='First Year';
		
		 if(duration1 == 2 ){
			dur ='Second'
		}else if(duration1== 3){
			dur='Third'
		}else if(duration1 == 4){
			dur ='Fourth'
		}else if(duration1 ==  5){
			dur = 'Fifth'
		}
		// var patteren = 'Annual';
		if(course_faculty !='Physiotherapy' && course_faculty !='Dental' && course_faculty !='Medical' &&  course_faculty != 'Peramedical'){
			if(coursename1 != null && coursename1 != 'null' && coursename1 != '' && coursename1 != 'undefined' && coursename1 != undefined){
				if(courseName == coursename1[0].course_name){
					var course= coursename1[0].course_name+' ('+inWords_duration+' years Integrated programme)';
					if (patteren == 'Annual') {
					console.log("patteren ======"+patteren);
					
					if(type=='Bachelors'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' Years '+ course	+' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}else if(type == 'Masters'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' Years '+ course	+' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}
					para2.push([{
						text: [
							{ text: '\t\t\t\t It is further certified that he/she has passed the '+inWords_duration+' Year '+ course + ' Examination in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para3.push([{
						text: [
							{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
							{ text: instruction_medium +'.', bold: true },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para4.push([{
						text: [
							{ text: '\t\t\t Also certified that  ' + collegeName + ' '+ wasis  +'  affiliated to Gujarat University.' },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
				} else {
					console.log("--------------"+patteren);
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' has completed '+inWords_duration+'year integrated '+courseName+' (Semester-I to Semester-'+toroman+') '+'programme from '+collegeName+' from '+yearofenrollment+' to '+passingMonthYear+'.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
		
					
					para2.push([{
						text: [
							{ text: '\t\t\t\t It is further certified that he/she has passed the '+type+' of '+inWords_duration+' Years integrated ' + courseName+ ' Semester-' +toroman+' with '+specialization1+passingClass+' Examination.'},
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para3.push([{
						text: [
							{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
							{ text: instruction_medium +'.', bold: true },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para4.push([{
						text: [
							{ text: '\t\t\t Also certified that  ' + collegeName + ' ' +  wasis+   ' affiliated to Gujarat Univerisity.' },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
				}
				}else{
					console.log("elseeeeeeeeeeeeeeeeeeeeeeeeeeee");
					if (patteren == 'Annual') {
						console.log("patteren ======"+patteren);
						
						if(type=='Bachelors'){
							para1.push([{
								text: [
									{ text: '\t\t\t This is to certify that ' },
									{ text: studentname, bold: true },
									{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
								], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
							}])
						}else if(type == 'Masters'){
							para1.push([{
								text: [
									{ text: '\t\t\t This is to certify that ' },
									{ text: studentname, bold: true },
									{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
								], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
							}])
						}
						para2.push([{
							text: [
								{ text: '\t\t\t\t It is further certified that he/she has passed the '+ shortname + ' Examination held in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
						para3.push([{
							text: [
								{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
								{ text: instruction_medium +'.', bold: true },
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
						para4.push([{
							text: [
								{ text: '\t\t\t Also certified that  ' + collegeName + ' '+  wasis +'  affiliated to Gujarat University.' },
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
					} else {
						console.log("--------------"+patteren);
						if(type=='Bachelors'){
							para1.push([{
								text: [
									{ text: '\t\t\t This is to certify that ' },
									{ text: studentname, bold: true },
									{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + '  years (Semester-I to Semester-'+toroman +  ')' +' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
								], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
							}])
						}else if(type == 'Masters'){
							para1.push([{
								text: [
									{ text: '\t\t\t This is to certify that ' },
									{ text: studentname, bold: true },
									{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + '  years (Semester-I to Semester-'+toroman +  ')' +' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
								], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
							}])
						}
				
						
						para2.push([{
							text: [
								{ text: '\t\t\t\t It is further certified that he/she has passed the ' + courseName+ ' Examination (Semester-' +toroman+') held in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
						para3.push([{
							text: [
								{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
								{ text: instruction_medium +'.', bold: true },
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
						para4.push([{
							text: [
								{ text: '\t\t\t Also certified that  ' + collegeName + ' ' +  wasis+   ' affiliated to Gujarat Univerisity.' },
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
						}])
					}
				}
			}else{
				if (patteren == 'Annual') {
					console.log("patteren ======"+patteren);
					
					if(type=='Bachelors'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}else if(type == 'Masters'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}
					para2.push([{
						text: [
							{ text: '\t\t\t\t It is further certified that he/she has passed the '+dur+' '+ shortname + ' Examination held in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para3.push([{
						text: [
							{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
							{ text: instruction_medium +'.', bold: true },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para4.push([{
						text: [
							{ text: '\t\t\t Also certified that  ' + collegeName + ' '+  wasis +'  affiliated to Gujarat University.' },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
				} else {
					console.log("--------------"+patteren);
					if(type=='Bachelors'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + '  years (Semester-I to Semester-'+toroman +  ')' +' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}else if(type == 'Masters'){
						para1.push([{
							text: [
								{ text: '\t\t\t This is to certify that ' },
								{ text: studentname, bold: true },
								{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + '  years (Semester-I to Semester-'+toroman +  ')' +' from ' + yearofenrollment+ ' to ' + passingMonthYear+ ' during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
							], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
						}])
					}
			
					
					para2.push([{
						text: [
							{ text: '\t\t\t\t It is further certified that he/she has passed the ' + courseName+ ' Examination (Semester-' +toroman+') held in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para3.push([{
						text: [
							{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
							{ text: instruction_medium +'.', bold: true },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
					para4.push([{
						text: [
							{ text: '\t\t\t Also certified that  ' + collegeName + ' ' +  wasis+   ' affiliated to Gujarat Univerisity.' },
						], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
					}])
				}	
			}
			
	
		}else{
	if(type=='Bachelors'){
		para1.push([{
			text: [
				{ text: '\t\t\t This is to certify that ' },
				{ text: studentname, bold: true },
				{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+' and twelve months of his/her internship completed during of his/her graduation studies in the ' + course_faculty +' Faculty.' }
			], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
		}])
	}else if(type=='Masters'){
		para1.push([{
			text: [
				{ text: '\t\t\t This is to certify that ' },
				{ text: studentname, bold: true },
				{ text: ' was a student of ' + collegeName + ' for ' + inWords_duration + ' years '+ 	'from ' + yearofenrollment+ ' to ' + passingMonthYear+' and twelve months of his/her internship completed during of his/her Post-graduation studies in the ' + course_faculty +' Faculty.' }
			], preserveLeadingSpaces: true, margin: [0, 10, 0, 0], lineHeight: 1.5,
		}])
	}
			
		para2.push([{
			text: [
				{ text: '\t\t\t\t It is further certified that he/she has passed the '+ courseName + ' Examination held in ' + passingMonthYear1+' with '+specialization1+passingClass+'.'},
			], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
		}])
		para3.push([{
			text: [
				{ text: '\t\t\t As per college record the medium of instruction of the above course was ' },
				{ text: instruction_medium +'.', bold: true },
			], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
		}])
		para4.push([{
			text: [
				{ text: '\t\t\t Also certified that  ' + collegeName + ' '+  wasis +'  affiliated to Gujarat University.' },
			], preserveLeadingSpaces: true, margin: [0, 10, 0, 0],lineHeight: 1.5,
		}])
		}
		var fonts = {
			Roboto: {
				normal: constants.FILE_LOCATION + 'public/fonts/Roboto-Regular.ttf',
				bold: constants.FILE_LOCATION + 'public/fonts/Roboto-Medium.ttf',
				italics: constants.FILE_LOCATION + 'public/fonts/Roboto-Italic.ttf',
				bolditalics: constants.FILE_LOCATION + 'public/fonts/Roboto-MediumItalic.ttf'
			},
			TimesNewRoman: {
				normal: constants.FILE_LOCATION + 'public/fonts/times new roman.ttf',
				bold: constants.FILE_LOCATION + 'public/fonts/times new roman bold.ttf',
				italics: constants.FILE_LOCATION + 'public/fonts/times new roman italic.ttf',
				bolditalics: constants.FILE_LOCATION + 'public/fonts/times new roman bold italic.ttf'
			},
		};
		// var fonts = {
		//  Roboto: {
		//      normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
		//      bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
		//      italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
		//      bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
		//    }
		// };
		var PdfPrinter = require(constants.Certificate_Url+'node_modules/pdfmake/src/printer');
		// var PdfPrinter = require('D:/AttesationGU/guAttestationServer/node_modules/pdfmake/src/printer');
		var docDefinition = {
			pageSize: 'A4',
				background: [
					{
						image: constants.FILE_LOCATION + 'public/upload/profile_pic/LetterBack_page_notforprint.png',
						width: 600
					}
				],
			content: [
	
				// {
				//  style:{
				//    fontSize: 10,
				//    bold: false,
				//  //   color : 'blue'
				//  } ,
				//  table: {
				//    widths: [520],//[30,70,230,150],
				//    headerRows: 1,
				//    body: [
				//      [{image: constants.FILE_LOCATION + 'public/upload/profile_pic/GU Letter Head.jpg',width : 520 , height : 200}],
				//  ]
				//  },
				//  layout: 'noBorders',
				//   },
	
				{
	
					table: {
						widths: [540],
						headerRows: 1,
						body: [
	
							[
								{
									style: {
										fontSize: 10,
										bold: false,
										//   color : 'blue'
									},
									table: {
										widths: [260, 260],//[30,70,230,150],
										headerRows: 1,
										body: [
											[
												{ text:'No.Exam./4A/' + Outwardno.outward +'/'+currentYear, fontSize: 10, bold: true, alignment: 'left', margin: [20, 140, 0, 0] },
												{ text: 'Date :' + currentDateTime, fontSize: 10, bold: true, alignment: 'right', margin: [0, 140, 10, 0] }
											],
										]
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 10,
										bold: false,
									},
									table: {
										widths: [60, 400, 60],
										headerRows: 1,
										body: [
											['',{ text: 'TO WHOM SO EVER IT MAY CONCERN', fontSize: 12, decoration: 'underline', alignment: 'center', bold: true, margin:[0,20,0,0] }, ''],
										]
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 12,
										bold: false,
									},
									table: {
										widths: [510],
										headerRows: 1,
										body: para1
									},
									layout: 'noBorders',
								},
								
							],
							[
								{
									style: {
										fontSize: 12,
										bold: false,
									},
									table: {
										widths: [510],
										headerRows: 1,
										body: para2
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 12,
										bold: false,
									},
									table: {
										widths: [510],
										headerRows: 1,
										body: para3
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 12,
										bold: false,
									},
									table: {
										widths: [510],
										headerRows: 1,
										body: para4
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 10,
										bold: false,
									},
									table: {
										widths: [520],
										// heights: [50],
										headerRows: 1,
										body: [
											[{ text:'MOI Number :-'+ currentYear + ref_no , fontSize: 10, bold: true, alignment: 'left', margin: [20, 30, 0, 0] }],
										]
									},
									layout: 'noBorders',
								},
							],
							[
								{
									style: {
										fontSize: 10,
										bold: false,
									},
									table: {
										widths: [110, 260, 260],
										heights:[50],
										headerRows: 1,
										body: [
											[{image: constants.FILE_LOCATION + 'public/signedpdf/' + user_id + '/' + application_id + '_attestation_qrcode.png', alignment: 'left', margin: [10, 50, 0, 0], width: 80, height: 80 },
											// { image: constants.FILE_LOCATION + '', alignment: 'center', margin: [10, 0, 0, 0], width: 130, height: 200 },
											{ image: constants.FILE_LOCATION + 'public/upload/profile_pic/RegistrarSignature.png', width: 150, height: 200, margin: [260, 0, 0, 0] }],//DIRECT SNIPPING TOOL
											[{ text: 'To check the authenticity of the certificate,Kindly scan the QR Code', fontSize: 12, bold: false,colSpan:3, font: 'TimesNewRoman',alignment: 'left' },'','']
										]
									},
									layout: 'noBorders',
								},
							],
							// [
							// 	{
							// 		style: {
							// 		},
							// 		table: {
							// 			widths: [520],
							// 			// headerRows: 1,
							// 			body: [
							// 				[{ text: 'To check the authenticity of the certificate,Kindly scan the QR Code. ', fontSize: 10, bold: false, alignment: 'left', margin: [0, 0, 0, 0] }],
							// 			]
							// 		},
							// 		// layout: 'noBorders',
							// 	},
							// ]
						]
					},
					layout: 'noBorders'
				}
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
			}
		};
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(dir + '/' + filename + '_notforprint'+  '.pdf'));
		pdfDoc.end();
		docDefinition = null;
		callback();
	},
	// instrucationalLetterForDiffClg_two : function(user_id,application_id,studentName,collegeData,courseName,specialization,passingMonthYear,duration,passingClass,instruction_medium,application_date,subject,subject1,ref_no,education,letterType,yearofenrollment,callback){
	// 	console.log('instrucationalLetterForDiffClg_two');
	// 	var filename;
	// 	if(letterType == "instructionalLetter"){
	// 		filename = application_id + "_" + education + "_InstructionalLetter";
	// 	}else if(letterType == "affiliationLetter"){
	// 		filename = application_id + "_" + education + "_AffiliationLetter";
	// 	}
	// 	var currentYear = moment(new Date()).year();
	// 	//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
	// 	var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
	// 	var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
	// 	currentDateTime = moment(new Date()).format("DD/MM/YYYY");
	// 	if (!fs.existsSync(dir)){
	// 		fs.mkdirSync(dir);
	// 	}
	// 	var fonts = {
	// 		Roboto: {
	// 			normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
	// 			bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
	// 			italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
	// 			bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
	// 		  }
	// 	};

	// 	// var fonts = {
	// 	// 	Roboto: {
	// 	// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
	// 	// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
	// 	// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
	// 	// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
	// 	// 	  }
	// 	// };
		
	// 	var PdfPrinter = require(constants.Certificate_Url+'node_modules/pdfmake/src/printer');
	// 	//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

	// 	var docDefinition = {
	// 		content:[
	// 			// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
	// 			// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
	// 			// {text:' ',fontSize: 8,bold:true},
	// 			{
	// 				style:{
	// 				  fontSize: 10,
	// 				  bold: false,
	// 				  // hLineColor : 'gray',
	// 				  // vLineColor :'gray',
	// 				  color : 'blue'
	// 				} ,
	// 				table: {
	// 				  widths: [180,160,180],//[30,70,230,150],
	// 				  headerRows: 1,
	// 				  body: [
	// 					[{text:'-------',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
	// 					[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
	// 					[{text:'-----------',fontSize: 10}, '',{text:'------,',alignment:'left'}],
	// 					[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'--------,',alignment:'left'}],
	// 					[{text:'',fontSize: 8}, '',{text:'Gujarat - -.',alignment:'left'}],
	// 					[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.: ---',alignment:'left'}],
	// 					[{text:'No. SW/' + ref_no + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
	// 					[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
	// 				]
	// 				},
	// 				layout: 'noBorders',
	// 			  },
	// 			{text:' ',fontSize: 8,bold:true},
    //     		{text:' ',fontSize: 8,bold:true},
    //     		{text:' ',fontSize: 8,bold:true},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{	
	// 				style:{
	// 					fontSize: 10,
	// 					bold: false,
	// 				} ,
	// 				table: {
	// 					widths: [70,400,70],
	// 					headerRows: 1,
	// 					body: [
	// 					 ['',[
	// 							{
	// 								table: {
	// 									widths: [350],
	// 									body: [
	// 										[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
	// 									]
	// 								},
	// 								layout: 'noBorders',
	// 							}
	// 						],''],
	// 					]
	// 				},
	// 				layout: 'noBorders',  
	// 			},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{text :[' This is to certify that '+studentName+ ' a student of Gujarat University. The education details are as follow ' ],fontSize :10 },
	// 			{text:' ',fontSize: 8,bold:true},
	// 		],
	// 		defaultStyle: {
	// 			alignment: 'justify',
	// 			fontSize: 10
	// 	 	}
	// 	};

	// 	for(var college in collegeData){
	// 		docDefinition.content.push([
	// 			{text:[' ' + collegeData[college] + ' '],fontSize: 10},
	// 		])
	// 	}

	// 	docDefinition.content.push([
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:[ subject + ' has been awarded the '+ courseName + ' ' + duration + '-year degree (Major in '+ specialization +') in the '+passingClass+' for the examination held in ' + passingMonthYear + '. The medium of instruction of the said course was in ',{text :  instruction_medium , bold:true}, '.'], fontSize: 10},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:'      This letter is issued to '+ studentName+ ' on ' + subject1 + ' request dated '+ moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{
	// 			style:{
	// 				fontSize: 10,
	// 				bold: false,
	// 			} ,
	// 			table: {
	// 				widths: [110,270,150],
	// 				headerRows: 1,
	// 				body: [
	// 					['','',{text:'',alignment:'center'}],
	// 				]
	// 			},
	// 			layout: 'noBorders',
	// 		},
	// 		{
	// 			style:{
	// 				fontSize: 10,
	// 				bold: false,
	// 			} ,
	// 			table: {
	// 				widths: [130,220,220],
	// 				headerRows: 1,
	// 				body: [
	// 					['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/gu_Stamp.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/RegistrarSignature.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
	// 					['','','']
	// 				]
	// 			},
	// 			layout: 'noBorders',
	// 		},
	// 	])
		
	// 	var printer = new PdfPrinter(fonts);
	// 	var pdfDoc = printer.createPdfKitDocument(docDefinition);

		
	// 	pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+'.pdf'));
	// 	pdfDoc.end();

		
	// 	docDefinition=null;
	// 	callback();
	// },
	// instrucationalLetterForDiffClg_two_notforprint : function(user_id,application_id,studentName,collegeData,courseName,specialization,passingMonthYear,duration,passingClass,instruction_medium,application_date,subject,subject1,ref_no,education,letterType,yearofenrollment,callback){
	// 	console.log('instrucationalLetterForDiffClg_two');
	// 	var filename;
	// 	if(letterType == "instructionalLetter"){
	// 		filename = application_id + "_" + education + "_InstructionalLetter";
	// 	}else if(letterType == "affiliationLetter"){
	// 		filename = application_id + "_" + education + "_AffiliationLetter";
	// 	}
	// 	var currentYear = moment(new Date()).year();
	// 	//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
	// 	var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
	// 	var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
	// 	currentDateTime = moment(new Date()).format("DD/MM/YYYY");
	// 	if (!fs.existsSync(dir)){
	// 		fs.mkdirSync(dir);
	// 	}
	// 	var fonts = {
	// 		Roboto: {
	// 			normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
	// 			bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
	// 			italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
	// 			bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
	// 		  }
	// 	};

	// 	// var fonts = {
	// 	// 	Roboto: {
	// 	// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
	// 	// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
	// 	// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
	// 	// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
	// 	// 	  }
	// 	// };
		
	// 	var PdfPrinter = require(constants.Certificate_Url+'node_modules/pdfmake/src/printer');
	// 	//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

	// 	var docDefinition = {
	// 		pageSize: 'A4',
	// 		background: [
	// 			{
	// 				image: constants.FILE_LOCATION+'public/profile_pic/notforprint.jpg',
	// 				width: 600
	// 			}
	// 		],
	// 		content:[
	// 			// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
	// 			// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
    //     		// {text:' ',fontSize: 8,bold:true},
	// 			// {text:' ',fontSize: 8,bold:true},
	// 			{
	// 				style:{
	// 				  fontSize: 10,
	// 				  bold: false,
	// 				  // hLineColor : 'gray',
	// 				  // vLineColor :'gray',
	// 				  color : 'blue'
	// 				} ,
	// 				table: {
	// 				  widths: [180,160,180],//[30,70,230,150],
	// 				  headerRows: 1,
	// 				  body: [
	// 					[{text:'-------',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
	// 					[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
	// 					[{text:'-----------',fontSize: 10}, '',{text:'------,',alignment:'left'}],
	// 					[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'--------,',alignment:'left'}],
	// 					[{text:'',fontSize: 8}, '',{text:'Gujarat - -.',alignment:'left'}],
	// 					[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.: ---',alignment:'left'}],
	// 					[{text:'No. SW/' + ref_no + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
	// 					[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
	// 				]
	// 				},
	// 				layout: 'noBorders',
	// 			  },
	// 			{text:' ',fontSize: 8,bold:true},
    //     		{text:' ',fontSize: 8,bold:true},
    //     		{text:' ',fontSize: 8,bold:true},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{	
	// 				style:{
	// 					fontSize: 10,
	// 					bold: false,
	// 				} ,
	// 				table: {
	// 					widths: [70,400,70],
	// 					headerRows: 1,
	// 					body: [
	// 					 ['',[
	// 							{
	// 								table: {
	// 									widths: [350],
	// 									body: [
	// 										[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
	// 									]
	// 								},
	// 								layout: 'noBorders',
	// 							}
	// 						],''],
	// 					]
	// 				},
	// 				layout: 'noBorders',  
	// 			},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{text:' ',fontSize: 8,bold:true},
	// 			{text :[' This is to certify that '+studentName+ ' a student of Gujarat University. The education details are as follow ' ],fontSize :10 },
	// 			{text:' ',fontSize: 8,bold:true},
	// 		],
	// 		defaultStyle: {
	// 			alignment: 'justify',
	// 			fontSize: 10
	// 	 	}
	// 	};

	// 	for(var college in collegeData){
	// 		docDefinition.content.push([
	// 			{text:[' ' + collegeData[college] + ' '],fontSize: 10},
	// 		])
	// 	}

	// 	docDefinition.content.push([
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:[ subject + ' has been awarded the '+ courseName + ' ' + duration + '-year degree (Major in '+ specialization +') in the '+passingClass+' for the examination held in ' + passingMonthYear + '. The medium of instruction of the said course was in ',{text :  instruction_medium , bold:true}, '.'], fontSize: 10},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:'      This letter is issued to '+studentName+ ' on ' + subject1 + ' request dated '+ moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{text:' ',fontSize: 8,bold:true},
	// 		{
	// 			style:{
	// 				fontSize: 10,
	// 				bold: false,
	// 			} ,
	// 			table: {
	// 				widths: [110,270,150],
	// 				headerRows: 1,
	// 				body: [
	// 					['','',{text:'Director, DSD',alignment:'center'}],
	// 				]
	// 			},
	// 			layout: 'noBorders',
	// 		},
	// 		{
	// 			style:{
	// 				fontSize: 10,
	// 				bold: false,
	// 			} ,
	// 			table: {
	// 				widths: [130,220,220],
	// 				headerRows: 1,
	// 				body: [
	// 					['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/gu_Stamp.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/RegistrarSignature.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
	// 					['','','']
	// 				]
	// 			},
	// 			layout: 'noBorders',
	// 		},
	// 	])
		
	// 	var printer = new PdfPrinter(fonts);
	// 	var pdfDoc = printer.createPdfKitDocument(docDefinition);

		
	// 	pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+ '_notforprint' +'.pdf'));
	// 	pdfDoc.end();

		
	// 	docDefinition=null;
	// 	callback();
	// },
	currently_studying_instructionalLetter: async function (user_id, application_id, studentName, collegeName, courseName, specialization, passingMonthYear, duration, passingClass, instruction_medium, application_date, subject, subject1, ref_no, education, letterType, yearofenrollment, callback) {
		console.log('currently_studying_instructionalLetter');
		if (letterType = "instructionalLetter") {
			filename = application_id + "_" + education + "_InstructionalLetter";
		} else if (letterType = "affiliationLetter") {
			filename = application_id + "_" + education + "_AffiliationLetter";
		}
		var Outwardno = await functions.getOutward(application_id);
		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION + 'public/signedpdf/' + user_id;
		var file_Dir = constants.FILE_LOCATION + 'public/signedpdf/' + user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}

		var fonts = {
			Roboto: {
				normal: constants.FILE_LOCATION + 'public/fonts/Roboto-Regular.ttf',
				bold: constants.FILE_LOCATION + 'public/fonts/Roboto-Medium.ttf',
				italics: constants.FILE_LOCATION + 'public/fonts/Roboto-Italic.ttf',
				bolditalics: constants.FILE_LOCATION + 'public/fonts/Roboto-MediumItalic.ttf'
			},
			TimesNewRoman: {
				normal: constants.FILE_LOCATION + 'public/fonts/times new roman.ttf',
				bold: constants.FILE_LOCATION + 'public/fonts/times new roman bold.ttf',
				italics: constants.FILE_LOCATION + 'public/fonts/times new roman italic.ttf',
				bolditalics: constants.FILE_LOCATION + 'public/fonts/times new roman bold italic.ttf'
			},
		};
		var PdfPrinter = require(constants.Certificate_Url + 'node_modules/pdfmake/src/printer');
		// var PdfPrinter = require('D:/AttesationGU/guAttestationServer/node_modules/pdfmake/src/printer');

		var docDefinition = {
			pageSize: 'A4',
			background: [
				{
					image: constants.FILE_LOCATION + 'public/upload/profile_pic/LetterBack_page.jpg',
					width: 600
				}
			],
			content: [
				{
					style: {
						fontSize: 10,
						bold: false,
						//   color : 'blue'
					},
					table: {
						widths: [260, 260],//[30,70,230,150],
						headerRows: 1,
						body: [
							[
								{ text:'No.Exam./4A/' + Outwardno.outward +'/'+currentYear, fontSize: 10, bold: true, alignment: 'left', margin: [20, 130, 0, 0] },
								{ text: 'Date :' + currentDateTime, fontSize: 10, bold: true, alignment: 'right', margin: [0, 130, 10, 0] }
							],
						]
					},
					layout: 'noBorders',
				},
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{
					style: {
						fontSize: 10,
						bold: false,
					},
					table: {
						widths: [70, 400, 70],
						headerRows: 1,
						body: [
							['', [
								{
									table: {
										widths: [350],
										body: [
											[{ text: 'TO WHOMSOVER IT MAY CONCERN', fontSize: 12, alignment: 'center', bold: true,decoration: 'underline' }]
										]
									},
									layout: 'noBorders',
								}
							], ''],
						]
					},
					layout: 'noBorders',
				},
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ['      This is to certify that ' , { text: studentName, bold: true } , ' a student of ' + collegeName + ' Gujarat University. ' + subject + ' is currently studying in ' + courseName + '(Major in ' + specialization + '). The medium of instruction of the said course is in ', { text: instruction_medium, bold: true }, '.'], fontSize: 10 ,lineHeight: 1.5,},
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{ text: '      This letter is issued to ' + studentName + ' on ' + subject1 + ' request dated ' + moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10 ,lineHeight: 1.5,},
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{
					style: {
						fontSize: 10,
						bold: false,
					},
					table: {
						widths: [110, 270, 150],
						headerRows: 1,
						body: [
							['', '', { text: '', alignment: 'center' }],
						]
					},
					layout: 'noBorders',
				},
				{
					style: {
						fontSize: 10,
						bold: false,
					},
					table: {
						widths: [520],
						// heights: [50],
						headerRows: 1,
						body: [
							[{ text:'MOI Number :-'+ currentYear + ref_no , fontSize: 10, bold: true, alignment: 'left', margin: [20, 30, 0, 0] }],
						]
					},
					layout: 'noBorders',
				},
				{
									style: {
										fontSize: 10,
										bold: false,
									},
									table: {
										widths: [110, 200, 200],
										heights:[50],
										headerRows: 1,
										body: [
											[{image: constants.FILE_LOCATION + 'public/signedpdf/' + user_id + '/' + application_id + '_attestation_qrcode.png', alignment: 'left', margin: [10, 50, 0, 0], width: 80, height: 80 },
											// { image: constants.FILE_LOCATION + '', alignment: 'center', margin: [10, 0, 0, 0], width: 130, height: 200 },
											{ image: constants.FILE_LOCATION + 'public/upload/profile_pic/RegistrarSignature.png', width: 150, height: 200, margin: [260, 0, 0, 0] }],//DIRECT SNIPPING TOOL
											[{ text: 'To check the authenticity of the certificate,Kindly scan the QR Code', fontSize: 12, bold: false,colSpan:3, font: 'TimesNewRoman',alignment: 'left' },'','']
										]
									},
									layout: 'noBorders',
								},
				// {
				// 	style: {
				// 		fontSize: 10,
				// 		bold: false,
				// 	},
				// 	table: {
				// 		widths: [130, 220, 220],
				// 		headerRows: 1,
				// 		body: [
				// 			['', { rowSpan: 2, image: constants.FILE_LOCATION + 'public/upload/profile_pic/gu_Stamp.png', fit: [85, 85], alignment: 'center' },
				// 			 { rowSpan: 2, image: constants.FILE_LOCATION + 'public/upload/profile_pic/Registrar sign.png', fit: [130, 80], alignment: 'center' }],//DIRECT SNIPPING TOOL
				// 			['', '', '']
				// 		]
				// 	},
				// 	layout: 'noBorders',
				// },
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
			}
		};
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(dir + '/' + filename + '.pdf'));
		pdfDoc.end();
		docDefinition = null;
		callback();
	},
	currently_studying_instructionalLetter_notforprint: async function (user_id, application_id, studentName, collegeName, courseName, specialization, passingMonthYear, duration, passingClass, instruction_medium, application_date, subject, subject1, ref_no, education, letterType, yearofenrollment, callback) {
		console.log('instrucationalLetter_one');
		if (letterType = "instructionalLetter") {
			filename = application_id + "_" + education + "_InstructionalLetter";
		} else if (letterType = "affiliationLetter") {
			filename = application_id + "_" + education + "_AffiliationLetter";
		}
		var Outwardno = await functions.getOutward(application_id);
		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION + 'public/signedpdf/' + user_id;
		var file_Dir = constants.FILE_LOCATION + 'public/signedpdf/' + user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}

		var fonts = {
			Roboto: {
				normal: constants.FILE_LOCATION + 'public/fonts/Roboto-Regular.ttf',
				bold: constants.FILE_LOCATION + 'public/fonts/Roboto-Medium.ttf',
				italics: constants.FILE_LOCATION + 'public/fonts/Roboto-Italic.ttf',
				bolditalics: constants.FILE_LOCATION + 'public/fonts/Roboto-MediumItalic.ttf'
			},
			TimesNewRoman: {
				normal: constants.FILE_LOCATION + 'public/fonts/times new roman.ttf',
				bold: constants.FILE_LOCATION + 'public/fonts/times new roman bold.ttf',
				italics: constants.FILE_LOCATION + 'public/fonts/times new roman italic.ttf',
				bolditalics: constants.FILE_LOCATION + 'public/fonts/times new roman bold italic.ttf'
			},
		};
		var PdfPrinter = require(constants.Certificate_Url + 'node_modules/pdfmake/src/printer');
		// var PdfPrinter = require('D:/AttesationGU/guAttestationServer/node_modules/pdfmake/src/printer');

		var docDefinition = {
			pageSize: 'A4',
			background: [
				{
					image: constants.FILE_LOCATION + 'public/upload/profile_pic/LetterBack_page.jpg',
					width: 600
				}
			],
			content: [
		
				{
					style: {
						fontSize: 10,
						bold: false,
						//   color : 'blue'
					},
					table: {
						widths: [260, 260],//[30,70,230,150],
						headerRows: 1,
						body: [
							[
								{ text:'No.Exam./4A/' + Outwardno.outward +'/'+currentYear, fontSize: 10, bold: true, alignment: 'left', margin: [20, 130, 0, 0] },
								{ text: 'Date :' + currentDateTime, fontSize: 10, bold: true, alignment: 'right', margin: [0, 130, 10, 0] }
							],
						]
					},
					layout: 'noBorders',
				},
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{
					style: {
						fontSize: 10,
						bold: false,
					},
					table: {
						widths: [70, 400, 70],
						headerRows: 1,
						body: [
							['', [
								{
									table: {
										widths: [350],
										body: [
											[{ text: 'TO WHOMSOVER IT MAY CONCERN', fontSize: 12, alignment: 'center', bold: true,decoration: 'underline' }]
										]
									},
									layout: 'noBorders',
								}
							], ''],
						]
					},
					layout: 'noBorders',
				},
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ['      This is to certify that ' , { text: studentName, bold: true } , ' a student of ' + collegeName + ' Gujarat University. ' + subject + ' is currently studying in ' + courseName + '(Major in ' + specialization + '). The medium of instruction of the said course is in ', { text: instruction_medium, bold: true }, '.'], fontSize: 10,lineHeight: 1.5, },
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{ text: '      This letter is issued to ' + studentName + ' on ' + subject1 + ' request dated ' + moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10 ,lineHeight: 1.5,},
				{ text: ' ', fontSize: 8, bold: true },
				{ text: ' ', fontSize: 8, bold: true },
				{
					style: {
						fontSize: 10,
						bold: false,
					},
					table: {
						widths: [110, 270, 150],
						headerRows: 1,
						body: [
							['', '', { text: '', alignment: 'center' }],
						]
					},
					layout: 'noBorders',
				},
				{
					style: {
						fontSize: 10,
						bold: false,
					},
					table: {
						widths: [520],
						// heights: [50],
						headerRows: 1,
						body: [
							[{ text:'MOI Number :-'+ currentYear + ref_no , fontSize: 10, bold: true, alignment: 'left', margin: [20, 30, 0, 0] }],
						]
					},
					layout: 'noBorders',
				},
				{
					style: {
						fontSize: 10,
						bold: false,
					},
					table: {
						widths: [110, 200, 200],
						heights:[50],
						headerRows: 1,
						body: [
							[{image: constants.FILE_LOCATION + 'public/signedpdf/' + user_id + '/' + application_id + '_attestation_qrcode.png', alignment: 'left', margin: [10, 50, 0, 0], width: 80, height: 80 },
							// { image: constants.FILE_LOCATION + '', alignment: 'center', margin: [10, 0, 0, 0], width: 130, height: 200 },
							{ image: constants.FILE_LOCATION + 'public/upload/profile_pic/RegistrarSignature.png', width: 150, height: 200, margin: [260, 0, 0, 0] }],//DIRECT SNIPPING TOOL
							[{ text: 'To check the authenticity of the certificate,Kindly scan the QR Code', fontSize: 12, bold: false,colSpan:3, font: 'TimesNewRoman',alignment: 'left' },'','']
						]
					},
					layout: 'noBorders',
				},
				// {
				// 	style: {
				// 		fontSize: 10,
				// 		bold: false,
				// 	},
				// 	table: {
				// 		widths: [130, 220, 220],
				// 		headerRows: 1,
				// 		body: [
				// 			['', { rowSpan: 2, image: constants.FILE_LOCATION + 'public/upload/profile_pic/gu_Stamp.png', fit: [85, 85], alignment: 'center' }, { rowSpan: 2, image: constants.FILE_LOCATION + 'public/upload/profile_pic/Registrar sign.png', fit: [130, 80], alignment: 'center' }],//DIRECT SNIPPING TOOL
				// 			['', '', '']
				// 		]
				// 	},
				// 	layout: 'noBorders',
				// },
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
			}
		};
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(dir + '/' + filename + '_notforprint' + '.pdf'));
		pdfDoc.end();
		docDefinition = null;
		callback();
	},
// 	generateWesForm : function(user_id,app_id,callback){
// 		console.log("generateWesForm-------------->")
// 		var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
// 		var fileName = 'wesletter.pdf'
// 		var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
// 		var signDate;
// 		if (!fs.existsSync(dir)){
// 			fs.mkdirSync(dir);
// 		}
// 		models.Institution_details.findAll({
// 			where : {
// 					user_id : user_id,
// 					app_id :  app_id

// 			}
// 		}).then(function(instution_data) {
// 			models.Wes_Form.findAll({
// 				user_id : user_id,
// 				app_id :  app_id
// 			}).then(function (wes_data){
// 				models.User.findAll({
// 					where : {
// 						id : user_id
// 					}
// 				}).then(function (user_data){

// 				models.Country.findAll({
// 					where :{ 
// 						id : user_data[0].country_id
// 					}
// 				}).then(function (country){
// 					signDate = wes_data[0].created_at;
// 					var signatureDated = moment(new Date(signDate)).format("DD/MM/YYYY")
		
// 		var fonts = {
// 			Roboto: {
// 				normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
// 				bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
// 				italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
// 				bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
// 			  }
// 		};
// 		var PdfPrinter = require(constants.Certificate_Url+'node_modules/pdfmake/src/printer');
// 		var docDefinition = {
// 			content: [
// 				{
// 					style: 'tableExample',
// 					layout: 'noBorders',
// 					table: {
// 						widths: [310,300],
// 						body: [
// 							[{image : constants.FILE_LOCATION + 'public/upload/profile_pic/weslogo.png',fit: [150, 100]},{text : 'Confirmation of Doctoral degree Conferral' , bold : true}],
// 						]
// 					},
// 				},
// 			  {
// 			  text: [
// 				{ text: 'Note to applicant: ', fontSize: 15,bold: true },
// 				'  It is the responsibility of individual applicants to have their academic records forwarded to WES. Please complete parts 1 and 2 of this form and submit it to the registrar/controller of examinations/or other authorized official at the academic instittuion where you obtained you obtained your degree. Please note that some institutions may charge a fee for this service.  ',
// 			  ]
// 				},
// 				 {
// 							  text: 'Part 1',
// 							  style: [{bold: true}],
// 							  width: 200 // Nothing changes..
// 				  }, 
 
// 			  {
// 				  style: 'tableExample',
// 				  table: {
// 					  widths: [290,200],
// 					  body: [
// 						  ['', 'Wes Reference :' + instution_data[0].wesno],
// 						  ['last Name family Name:' + instution_data[0].lastnameaswes, 'First/Given Name:' + instution_data[0].nameaswes],
// 						  ['Previous/Maiden Name:(if applicable)', 'Date of Birth:' + wes_data[0].dob],
// 						  ['Current Address:' +wes_data[0].currentaddress, 'City:' + wes_data[0].city],
// 						  ['State/Provison:' + wes_data[0].state, 'Country:' +country[0].name],
// 						  ['Postal Code:' + wes_data[0].postal_code, 'Email:' + user_data[0].email]
// 					  ]
// 				  }
// 			  },

// 				   {
// 							  text: 'Part 2',
// 							  style: [{bold: true}],
// 							  width: 200 // Nothing changes..
// 				  },
// 			  {
// 				  style: 'tableExample',
// 				  table: {
// 					  widths: [290,200],
// 					  body: [
// 						  ['Institution Name: ' + wes_data[0].institute_name, 'Dates Attended : From : '+ wes_data[0].datefrom+' to :'+ wes_data[0].dateto],
// 						  ['Degree Name: Doctor of Philosophy', 'Year of Award:' + wes_data[0].yearaward],
// 						  ['Major:' + wes_data[0].major, 'Student id or Roll Number at sending institution:' + wes_data[0].sturolno],
// 					  ]
// 				  }
// 			  },
// 			   {
// 							  text: '\n'
// 			   }, 
// 			  'I hereby authorized the release of my academic records and information to World Eductaion Services.',
// 				{
// 							  text: '\n'
// 				}, 
// 			   'Applicants Signature dated on : ' +  signatureDated,
// 			   {
		   
// 				image: constants.FILE_LOCATION + 'public/upload/StudentSignature/'+user_id+'/'+wes_data[0].file_name,alignment:'left',width: 150,
			  
// 				},		  
// 			   {
// 							  text: '\n'
// 			   },
				  
// 				 'Note to authorized official : The above-named person seeks to have his degree evaluated and requests that a confirmation of his/her degree conferral be forwarded to World Eductaion Service.Please complete this form,and return it directly to World Education Services at one of the adresses below.',
// 				 {
// 					text: '\n'
// 		},
// 				 {
// 							  text: 'CONFIRMATION:',
// 							  style: [{bold: true,fontSize: 13,decoration : 'underline'}],
// 			   },
// 				 {
// 			text: [
// 			  'I hearby confirm that the student named above attended ',
// 			  { text:wes_data[0].institute_name, fontSize: 12,decoration : 'underline' },
// 			]
// 			  },  
// 				 {
// 							  text: '\n'
// 				  },
// 						 {
// 			text: [
// 			  'from  ',
// 			  { text: wes_data[0].datefrom, fontSize: 12,decoration : 'underline' },
// 			  '   to   ',
// 			  { text : wes_data[0].dateto, fontSize: 12,decoration : 'underline' },
// 			  '  and was awarded  ',
// 			  { text: 'Doctor of Philosophy in  '+  wes_data[0].major + ' on  ' +wes_data[0].yearaward, fontSize: 12,decoration : 'underline' },
			  
// 			]
// 			  },
// 			  {
// 				text: '\n'
// 				},
// 					  {
// 				  style: 'tableExample',
// 				  table: {
// 					  widths: [290,200],
// 					  heights:[15,15,15,15,15,15],
// 					  body: [
// 						  ['Name of the official completing form: Dr. Sunil Patil  ', 'Title: Director'],
// 						  [ {text:'Address: Vidyapeeth Vidhyarthi Bhavan,B road,Churchgate,Mumbai', colSpan:2}, {text:''} ],
// 						  ['City: Mumbai ', 'Country: India '],
// 						  ['Postal Code: 400020 ', 'Telephone:'],
// 						  ['Fax: ', 'Email: attestation@mu.ac.in'],
// 						  [ {text:'URL:', colSpan:2}, {text:''} ]
// 					  ]
// 				  }
// 			  },
// 			  {
// 				style:{
// 					fontSize: 10,
// 					bold: false,
// 				} ,
// 				table: {
// 					widths: [110,270,150],
// 					headerRows: 1,
// 					body: [
// 					 ['','',{text:'Director, DSD',alignment:'center'}],
// 					]
// 				},
// 				layout: 'noBorders',
// 			},
// 			{
// 				style:{
// 					  fontSize: 10,
// 					  bold: false,
// 				} ,
// 				table: {
// 					  widths: [130,220,220],
// 					  headerRows: 1,
// 					  body: [
// 						['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/gu_Stamp.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/RegistrarSignature.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
// 						['','','']
// 					  ]
// 				},
// 				layout: 'noBorders',
// 			},
// 		  ],
		  
		 
// 			defaultStyle: {
// 				alignment: 'justify',
// 				fontSize: 10
// 		 	}
// 		};
	
// 		var printer = new PdfPrinter(fonts);
// 		var pdfDoc = printer.createPdfKitDocument(docDefinition);
// 		pdfDoc.pipe(fs.createWriteStream(dir+'/'+fileName));
// 		pdfDoc.end();
// 		docDefinition=null;
// 		callback();
// 	});
// })
// })
// });
// 	},
attestation_certificate_address : function(purpose,user_id, application_id, section,userfull_name,Outward,callback){	
	var filename = application_id+"_attestation_certificate_address";
	var dir = constants.FILE_LOCATION+'public/upload/documents/'+user_id;
	var file_Dir = constants.FILE_LOCATION+'public/upload/documents/'+user_id;
	var dir = constants.FILE_LOCATION+'public/upload/institute_address/'+user_id;
	var file_Dir = constants.FILE_LOCATION+'public/upload/institute_address/'+user_id;
	var A1 = (section=='A1') ? 'black' : 'white';
	var B1 = (section=='B1') ? 'black' : 'white';

	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}
	
	var fonts = {
		Roboto: {
			normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
			bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
			italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
			bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
		},
		TimesNewRoman: {
			normal: constants.FILE_LOCATION+'public/fonts/times new roman.ttf',
			bold: constants.FILE_LOCATION+'public/fonts/times new roman bold.ttf',
			italics: constants.FILE_LOCATION+'public/fonts/times new roman italic.ttf',
			bolditalics: constants.FILE_LOCATION+'public/fonts/times new roman bold italic.ttf'
		},
	};
	var PdfPrinter = require(constants.NODE_MODULES_PATH+'pdfmake/src/printer');
	setTimeout(() => {
		var docDefinition = {
			pageSize: 'A4',
			//pageOrientation: 'landscape',
			content: [
				
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10,
				color:"black"
			}
		};
			purpose.forEach(function(addressdata) {
				docDefinition.content.push(
					[
	
		{
			table: {
				widths: [500],
				headerRows: 1,
				body:[
					['\n\n\n\n\n\n'],
					[
						{
							style:{
								fontSize: 10,
							},
							table: {
								widths: [100,200,100],
							
								body: [
									['',{text:''+'TO :',fontSize: 20 , bold:true, alignment:'left',color : A1, colSpan:2, font : 'TimesNewRoman'},''],
									['',{text:''+addressdata.university_name ? addressdata.university_name : addressdata.type, fontSize: 28, bold:true, alignment:'left',color : A1, colSpan:2 , font : 'TimesNewRoman'},''],
									['',{text:''+addressdata.inst_address,fontSize: 20 , bold:true, alignment:'left',color : A1, colSpan:2 , font : 'TimesNewRoman'},''],
									// ['',{text:''+mobile_no,fontSize: 20 , bold:true, alignment:'left',color : A1, colSpan:2, font : 'TimesNewRoman'},''],
									['',{text:'',fontSize: 15, alignment:'left',color : A1, colSpan:2},''],
								
									['\n','',''],	
									['\n','',''],
									['\n','',''],
									['\n','',''],
									['\n','',''],
									
									['',{text:''+'Applicants Details :',fontSize: 20 , bold:true, alignment:'left',color : A1, colSpan:2, font : 'TimesNewRoman'},''],
									// ['',{text:'Applicants Details', fontSize: 28, bold:true, alignment:'left',color : A1, colSpan:2 , font : 'TimesNewRoman'},''],
									['',{text:'('+Outward+')', fontSize: 20, bold:true, alignment:'left',color : A1, colSpan:2 , font : 'TimesNewRoman'},''],

									['',{text:userfull_name,fontSize: 20 , bold:true, alignment:'left',color : A1, colSpan:2 , font : 'TimesNewRoman'},''],
									['',{text:'Reference Number : -'+addressdata.referenceNo,fontSize: 20 , bold:true, alignment:'left',color : A1, colSpan:2 , font : 'TimesNewRoman'},''],
									// ['',{text:''+mobile_no,fontSize: 20 , bold:true, alignment:'left',color : A1, colSpan:2, font : 'TimesNewRoman'},''],
									['',{text:'',fontSize: 15, alignment:'left',color : A1, colSpan:2,pageBreak:'after'},''],
								]
							},
							layout: 'noBorders',
						}
					],
					// ['\n\n\n\n\n\n\n'],
					// [{
					// 	style:{
					// 		fontSize: 10,
					// 	},
					// 	table: {
					// 		widths: [100,200,100],
							
					// 		body: [
					// 			['',{text:''+'TO :',fontSize: 20 , bold:true, alignment:'left',color : B1, colSpan:2},''],
					// 			['',{text:''+purpose.university_name, fontSize: 28, bold:true, alignment:'left',color : B1, colSpan:2},''],
					// 			['',{text:''+purpose.inst_address,fontSize: 20 , bold:true, alignment:'left',color : B1, colSpan:2},''],
					// 			// ['',{text:''+mobile_no,fontSize: 20 , bold:true, alignment:'left',color : B1, colSpan:2},''],
					// 			['',{text:'',fontSize: 15, alignment:'left',color : B1, colSpan:2},''],
					// 			['\n','',''],	
					// 			['\n','',''],
					// 			['\n','',''],
					// 			['\n','',''],
					// 			['\n','',''],
					// 			['\n','',''],
					// 			// ['',{text:''+'Form :',fontSize: 20 , bold:true, alignment:'left',color : A1, colSpan:2, font : 'TimesNewRoman'},''],
					// 			// ['',{text:'Shubham rane shiv kupa chawl room no 1 ', fontSize: 28, bold:true, alignment:'left',color : A1, colSpan:2 , font : 'TimesNewRoman'},''],
					// 			// ['',{text:'91 9867168171',fontSize: 20 , bold:true, alignment:'left',color : A1, colSpan:2 , font : 'TimesNewRoman'},''],
					// 			// // ['',{text:''+mobile_no,fontSize: 20 , bold:true, alignment:'left',color : A1, colSpan:2, font : 'TimesNewRoman'},''],
					// 			// ['',{text:'',fontSize: 15, alignment:'left',color : A1, colSpan:2},''],
					// 		]
					// 	},
					// 	layout: 'noBorders',
					// }],
				]
			},
			layout: 'noBorders',
		},
					]
				)
			})
			
		
		
		
			
		
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(file_Dir+'/'+filename+'.pdf'));
		pdfDoc.end();
		docDefinition=null;
		callback();
	}
	, 2000);
	
},
	generateApplication_Form : function(userdetails,documents,payment,application_id,collegeId,file,docfile,applyDetails,applyDetail,showdetails,showdetail,paydate,doctrance,applicationFor,marksheet,purpose,callback){

		var datetime = moment (new Date()).format("DD-MM-YYYY hh:mm") ;
		  var PaymentTime = moment(new Date(payment[0].created_at)).format("DD-MM-YYYY hh:mm")  
		  var paymentdate = moment(new Date(paydate)).format("DD-MM-YYYY hh:mm")      
			filename = application_id+"_Application_Form";
			var dir = constants.FILE_LOCATION+'public/upload/documents/'+userdetails.id;
			var file_Dir = constants.FILE_LOCATION+'public/upload/documents/'+userdetails.id;
	
			
			if (!fs.existsSync(dir)){
				fs.mkdirSync(dir);
			 }
			
			var fonts = {
				Roboto: {
					normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
					bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
					italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
					bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
				  }
			};
			var PdfPrinter = require(constants.NODE_MODULES_PATH+'pdfmake/src/printer');
			var docDefinition = {
				content: [
			
			
											  [
												{text:'Application No:'+application_id, alignment:'right', fontSize:10,bold: true},
												{
												  style: 'tableExample',
												  table: {
													  widths: [40, 402, 300, 200],
													  body: [
			
														  [
															{image: constants.FILE_LOCATION+'public/upload/profile_pic/gu logo.png',fit: [40, 40], border:[0,0,0,0]}, {text: '\nGUJARAT UNIVERISTY \nApplication Form',bold:true,border:[0,0,0,0],} 
														
														],
														[{border: [false, false, false, false],text:''},{text:applicationFor,border: [false, false, false, false]},{text:'',border: [false, false, false, false]}]
	
	
														  
													  ]
												  }
											  },
										   ],
			
			
											 {
												table : {
													headerRows : 1,
													widths: [520],
													body : [
															[{text:'', alignment:'right', fontSize:0,}],
															['']
															]
												},
												layout : 'headerLineOnly'
			
											},
										  {text: 'Personal Details\n',color:"red",style: 'subheader', fontSize:12,margin: [0, 5, 0, 6]},
			
											 {
												table : {
													headerRows : 1,
													widths: [520],
													body : [
															[{text:'', alignment:'right',}],
															['']
															]
												},
												layout : 'headerLineOnly'
			
			
											},
											
											
											
											
			{
					alignment: 'justify',
					columns: [
					  {
						text: 'Name',bold:true,
					  },
					{
						text:': ' + userdetails.fullname
					}
			
					],
			
			
				  },
											 {
					alignment: 'justify',
					columns: [
					  {
						text: 'Email ID',bold:true,
					  },
					{
						text:': '+ userdetails.email
					}
			
					],
			
			
				  },
									   {
					alignment: 'justify',
					columns: [
					  {
						text: 'Mobile No',bold:true
					  },
					{
						text:': '+userdetails.mobile
					}
			
					],
			
			
				  },
				 
				  {
					
			
			
				  },
				 
				
			
										   {
												table : {
													headerRows : 1,
													widths: [520],
													body : [
															[{text:'', alignment:'left', },
															],
															['']
															]
												},
												layout : 'headerLineOnly'
			
			
											},
											
			
												
			
										  {text: 'Payment Details', style: 'subheader', color:"red", fontSize:12,margin: [0, 5, 0, 6]},
			
				 {
												table : {
													headerRows : 1,
													widths: [520],
													body : [
															[{text:'', alignment:'left', bold:true},
															],
															['']
															]
												},
												layout : 'headerLineOnly'
			
			
											},
			
															   {
					alignment: 'justify',
					columns: [
					  {
						text: 'Payment Status',bold:true
					  },
					{
						text:': Success'
					}
			
					],
			
			
				  },
											   {
					alignment: 'justify',
					columns: [
					  {
						text: 'Payment Time',bold:true
					  },
					{
						text:': ' +PaymentTime
					},
			
			
					],
			
			
				  },
								   {
					alignment: 'justify',
					columns: [
					  {
						text: 'Amount',bold:true
					  },
					{
						text:': ' +payment[0].amount
					}
			
					],
			
			
				  },
					  {
						  table : {
							  headerRows : 1,
							  widths: [520],
							  body : [
									  [{text:'', alignment:'left',},
									  ],
									  ['']
									  ]
						  },
						  layout : 'headerLineOnly'
			
			
					  },
					  
					  {text:'Uploaded Documents List',color:"red", bold:true,margin: [0, 5, 0, 6]},
					  {
						table : {
							headerRows : 1,
							widths: [520],
							body : [
									[{text:'', alignment:'left', },
									],
									['']
									]
						},
						layout : 'headerLineOnly'
					},
					  [{ text: 'Sr.No.                       Document Name'}],
					  file,
					  docfile,
					  doctrance,
					  {
						table : {
							headerRows : 1,
							widths: [520],
							body : [
									[{text:'', alignment:'left', },
									],
									['']
									]
						},
						layout : 'headerLineOnly'
					},
					 
				 
					],
			
			
					  styles: {
				  header: {
					fontSize: 18,
					bold: true
				  },
				  bigger: {
					fontSize: 15,
					italics: true
				  }
				},
				defaultStyle: {
				  columnGap: 20
				}
			
			
			
			
			
			  };
				if(showdetails == 'educational' ){
					abcd=[
						{
							alignment: 'justify',
							columns: [
							  {
								text:'Attestation For',bold:true
							  },
							  applyDetails
							
					
							],
					
					
						  },
						
						'']
						docDefinition.content.splice(7,0,abcd);
				}
				if(showdetail == 'instructional' ){
					abcd=[
						{
							alignment: 'justify',
							columns: [
							  {
								text:'Medium',bold:true
							  },
								 applyDetail
							
					
							],
					
					
						  },
						
						'']
						docDefinition.content.splice(7,0,abcd);
				}
				if(showdetail == 'instructional' ){
					abcd=[
					{
						table : {
							headerRows : 1,
							widths: [520],
							body : [
									[{text:'', alignment:'right', fontSize:0,}],
									['']
									]
						},
						layout : 'headerLineOnly'
	
					},
				  {text: 'Instructional Details\n',color:"red",style: 'subheader', fontSize:12,margin: [0, 5, 0, 6]},
	
					 {
						table : {
							headerRows : 1,
							widths: [520],
							body : [
									[{text:'', alignment:'right',}],
									['']
									]
						},
						layout : 'headerLineOnly'
	
	
					},
					{
						table: {
							widths: [250,250],
							// headerRows: 1,
							body: marksheet
								
						},
	
						layout: {
							defaultBorder: false,
						}
					},
					  
				'']
				docDefinition.content.splice(9,0,abcd);
	
				}
				if(purpose != null ){
					abcd=[
					
				  {text: 'Institution Details\n',color:"red",style: 'subheader', fontSize:12,margin: [0, 5, 0, 6]},
	
					 {
						table : {
							headerRows : 1,
							widths: [520],
							body : [
									[{text:'', alignment:'right',}],
									['']
									]
						},
						layout : 'headerLineOnly'
	
	
					},
					{
						table: {
							widths: [250,250],
							// headerRows: 1,
							body: purpose
								
						},
	
						layout: {
							defaultBorder: false,
						}
					},
					{
						table : {
							headerRows : 1,
							widths: [520],
							body : [
									[{text:'', alignment:'right',}],
									['']
									]
						},
						layout : 'headerLineOnly'
	
	
					},
					{
						alignment: 'justify',
						columns: [
						  {
							text: 'Lock Date :'+paymentdate			
						},
						{
							text:'Print Date :' + datetime
						}
				
						],
				
				
					  },
					  
				'']
				docDefinition.content.splice(24,0,abcd);
	
				}
	console.log("docDefinitiondocDefinition",docDefinition.content[21]);
		//		var fonts = doc.fonts;
			var printer = new PdfPrinter(fonts);
			var pdfDoc = printer.createPdfKitDocument(docDefinition);
			pdfDoc.pipe(fs.createWriteStream(file_Dir+'/'+filename+'.pdf'));
			pdfDoc.end();
			docDefinition=null;
			callback();
		},
	generateQRCode : async function(userId,app_id,callback){
		var qrcode_name = app_id + '_'+ "attestation_qrcode.png";
		var qrcode;
		var file_Dir = constants.FILE_LOCATION + 'public/signedpdf/'+ userId;
		if (!fs.existsSync(file_Dir)){
			fs.mkdirSync(file_Dir);
		}
	  
		if(!fs.existsSync(file_Dir+"/"+qrcode_name)){
			let ucedcreate = await functions.ucedcreatedbarcode(app_id,userId);

			QRCode.toFile(file_Dir+"/"+ qrcode_name , 'https://guattestation.studentscenter.in/api/signedpdf/' +  userId + '/' + app_id + '_Merge.pdf' , {
				color: {
					dark: '#000000',  // Blue dots
					light: '#FFFF' // Transparent background
				}
			}, function (err) {
				if (err) throw err
	  
				qrcode = file_Dir+"/"+qrcode_name;
				console.log("qrcode == 1"+qrcode);
			})                                                              
		}
		callback();
	},
	gucover : function(inword_no, outputDirectory, hours, source_from, Applicant_data, callback){
		var gujartph = constants.FILE_LOCATION+ 'public/profile_pic/gu logo.png';
		var filename = hours+"_"+source_from+"_cover";
		var file_Dir = outputDirectory;

		
		var fonts = {
			Roboto: {
				normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
				bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
				italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
				bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
			  }
		};

		var PdfPrinter = require(constants.NODE_MODULES_PATH+'pdfmake/src/printer');
		var dd = {
			content: [
				{
					style:{
					  fontSize: 10,
					  bold: false,
					  
					} ,
					table: {
					  widths: [150,280,150],
					  headerRows: 1,
					  body: [
						['',{text:'INWORD No. :',fontSize: 11,bold:true,alignment: 'right'},{text:''+inword_no,fontSize: 11,bold:true,}],

					
						
					  ]
					},
					layout: 'noBorders',
				  },

				{
					style:{
					  fontSize: 10,
					  bold: false,
					  
					} ,
					table: {
					  widths: [150,200,150],
					  headerRows: 1,
					  body: [
						['',{text:''},''],
						['',{text:''},''],
						['',{image:gujartph,fit: [60, 60],alignment: 'center'},''],
						['',{text:'GUJARAT UNIVERSITY',fontSize: 15,bold:true,alignment: 'center'},''],
						['',{text:''+source_from,fontSize: 11,bold:true,alignment: 'center'},''],
					
						
					  ]
					},
					layout: 'noBorders',
				  },
				
				{
					style: 'tableExample',
					table: {
						widths: [250, 250, ],
						body: 
							Applicant_data
						
					}
				},
			 
				 
					
				],
				styles: {
					header: {
						fontSize: 18,
						bold: true,
						margin: [0, 0, 0, 10]
					},
					subheader: {
						fontSize: 16,
						bold: true,
						margin: [0, 10, 0, 5]
					},
					tableExample: {
						margin: [0, 5, 0, 15]
					},
					tableHeader: {
						bold: true,
						fontSize: 13,
						color: 'black'
					}
				},
				 defaultStyle: {
				   alignment: 'justify',
				   fontSize: 10
				}

		}

		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(dd);
		pdfDoc.pipe(fs.createWriteStream(file_Dir+'/'+filename+'.pdf'));
		pdfDoc.end();
		dd=null;
		callback();
	},
	allstudentdata : function( outputDirectory, hours, source_from, allstudentdata,callback){
		var gujartph = constants.FILE_LOCATION+ 'public/profile_pic/gu logo.png';
		var filename = hours+"_"+source_from+"_cover";
		var file_Dir = outputDirectory;
		
		var fonts = {
			Roboto: {
				normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
				bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
				italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
				bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
			  }
		};

		var PdfPrinter = require(constants.NODE_MODULES_PATH+'pdfmake/src/printer');
		var dd = {
			content: [
			

				{
					style:{
					  fontSize: 10,
					  bold: false,
					  
					} ,
					table: {
					  widths: [150,200,150],
					  headerRows: 1,
					  body: [
						['',{text:''},''],
						['',{text:''},''],
						['',{image:gujartph,fit: [60, 60],alignment: 'center'},''],
						['',{text:'GUJARAT UNIVERSITY',fontSize: 15,bold:true,alignment: 'center'},''],
						['',{text:'Student data From All portal',fontSize: 11,bold:true,alignment: 'center'},''],
					
						
					  ]
					},
					layout: 'noBorders',
				  },
			  

		
				
				{
					style: 'tableExample',
					table: {
						widths: [150, 150,150,150 ],
						body: 
						allstudentdata
						
					}
				},
			 
				 
					
				],
				styles: {
					header: {
						fontSize: 18,
						bold: true,
						margin: [0, 0, 0, 10]
					},
					subheader: {
						fontSize: 16,
						bold: true,
						margin: [0, 10, 0, 5]
					},
					tableExample: {
						margin: [0, 5, 0, 15]
					},
					tableHeader: {
						bold: true,
						fontSize: 13,
						color: 'black'
					}
				},
				 defaultStyle: {
				   alignment: 'justify',
				   fontSize: 10
				}

		}

		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(dd);
		pdfDoc.pipe(fs.createWriteStream(file_Dir+'/'+filename+'.pdf'));
		pdfDoc.end();
		dd=null;
		callback();
	},

	pdfToImageConversion : function(fileName,user_id,filePath,outputdirectory) {
		var pdfstatus;
		if(!fs.existsSync(outputdirectory)){
			fs.mkdirSync(outputdirectory, { recursive: true });//fs.writeFileSync
		}
		var output_file = outputdirectory  + fileName;
		var command = "pdftoppm -jpeg " + filePath +  " " + output_file;
		const pdfToImg = exec(command, function (error, stdout, stderr) {
			if (error) {
				logger.error(error.stack);
				logger.error('Error code: '+error.code);
				logger.error('Signal received: '+error.signal);
			}else{
				console.log("done");
			}
			logger.debug('Child Process STDOUT: '+stdout);
			logger.error('Child Process STDERR: '+stderr);
		});
		pdfToImg.on('exit', function (code) {
			logger.debug('Child process exited with exit code '+code);
		});
	},
	
	
	addAadharAndApp_id : function(fileName, user_id, app_id,filePath,outputdirectory,aadharNo,callback){
		console.log("addAadharAndApp_id");
		var file = outputdirectory + '/' + fileName + '.pdf';
		console.log("file in addAadharAndApp_id== " + file);
		const pdf = new PDFDocument();
		pdf.pipe(fs.createWriteStream(file));
		pdf.font(constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf')
		.fontSize(10)
		.text('Application Number : MDT/SY' + app_id, {
			width: pdf.page.width-150,
			align: 'right'
		});
		pdf.moveDown();
		pdf.font(constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf')
		.fontSize(10)
		.text('Aadhar Number : ' + aadharNo, {
			width: pdf.page.width-150,
			align: 'right'
		});
		pdf.image(filePath, 0, 160, {width: pdf.page.width, height: pdf.page.height - 200})
		pdf.moveDown();
		pdf.end();
	
		callback();
	},
	
	merge_uploaded  : function(inputString,outputfile,callback){
		console.log("inputString == " + inputString); 
	   console.log("outputfile" + outputfile);
		var command = "pdfunite "+inputString+ " " +outputfile;
		console.log("command" + command);
		const pdfunite = exec(command, function (error, stdout, stderr) {
			if (error) {
			  logger.error(error.stack);
			  logger.error('Error code: '+error.code);
			  logger.error('Signal received: '+error.signal);
			}else{
				console.log("merge complete");
			   callback();
			}
			logger.debug('Child Process STDOUT: '+stdout);
			logger.error('Child Process STDERR: '+stderr);
		  });
	  
		  pdfunite.on('exit', function (code) {
			logger.debug('Child process exited with exit code '+code);
		  });
	  },
};