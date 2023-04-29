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


algorithm = 'aes-256-ctr',
password = 'je93KhWE08lH9S7SN83sneI87';

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

		
		filename = application_id+"_Attestation_Payment_Challan";
		var dir = constants.FILE_LOCATION+'public/upload/transcript/'+user_id;
		var file_Dir = constants.FILE_LOCATION+'public/upload/transcript/'+user_id;

		
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
		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');

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
					['',{image: constants.FILE_LOCATION+'public/upload/profile_pic/mu_logo.png',fit: [60, 60],alignment: 'center'},''],
					//['',{text:'INTERNATIONAL CENTRE',fontSize: 9,bold:true,alignment: 'center'},''],
					['',{text:'UNIVERSITY OF MUMBAI',fontSize: 9,bold:true,alignment: 'center'},''],
					['',{text:'Online Payment Receipt - Attestation',fontSize: 8,bold:true,alignment: 'center'},''],
					
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
					[{image: constants.FILE_LOCATION+'public/upload/profile_pic/mu_logo.png',fit: [30, 30]},{text:'',fontSize: 7,bold:true},{text:'University Copy',fontSize: 7,bold:true,margin: [210,0,0,0]}],
					['',{text:'UNIVERSITY OF MUMBAI',fontSize: 7,bold:true, margin: [0,-20,0,0]} ,''],
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
					['',{image: constants.FILE_LOCATION+'public/upload/profile_pic/mu_logo.png',fit: [60, 60],alignment: 'center'},''],
					//['',{text:'INTERNATIONAL CENTRE',fontSize: 9,bold:true,alignment: 'center'},''],
					['',{text:'UNIVERSITY OF MUMBAI',fontSize: 9,bold:true,alignment: 'center'},''],
					['',{text:'Online Payment Receipt - Attestation',fontSize: 8,bold:true,alignment: 'center'},''],
					
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
					[{image: constants.FILE_LOCATION+'public/upload/profile_pic/mu_logo.png',fit: [30, 30]},{text:'',fontSize: 7,bold:true},{text:'Student Copy',fontSize: 7,bold:true,margin: [210,0,0,0]}],
					['',{text:'UNIVERSITY OF MUMBAI',fontSize: 7,bold:true, margin: [0,-20,0,0]} ,''],
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

	instrucationalLetter : function(user_id,application_id,studentName,collegeName,courseName,specialization,passingMonthYear,duration,passingClass,instruction_medium,application_date,subject,subject1,ref_no,callback){
		filename = application_id+"_InstructionalLetter";
		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
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

		// var fonts = {
		// 	Roboto: {
		// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
		// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
		// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
		// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
		// 	  }
		// };

		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');
		//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

		var docDefinition = {
			content:[
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
				{
					style:{
					  fontSize: 10,
					  bold: false,
					  // hLineColor : 'gray',
					  // vLineColor :'gray',
					  color : 'blue'
					} ,
					table: {
					  widths: [180,160,180],//[30,70,230,150],
					  headerRows: 1,
					  body: [
						[{text:'Dr. Sunil Patil',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
						[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
						[{text:'Department Of Students’ Development',fontSize: 10}, '',{text:'Vidyapeeth Vidyarthi Bhavan,',alignment:'left'}],
						[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'1st Floor,B Road,Churchgate,',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'MUMBAI - 400020.',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.:(022)22042859',alignment:'left'}],
						[{text:'No. SW/' + application_id + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
						[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
					]
					},
					layout: 'noBorders',
				  },
				{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{	
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [70,400,70],
						headerRows: 1,
						body: [
						 ['',[
								{
									table: {
										widths: [350],
										body: [
											[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
										]
									},
									layout: 'noBorders',
								}
							],''],
						]
					},
					layout: 'noBorders',  
				},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:['      This is to certify that '+studentName+ ' a student of '+collegeName+'University of Mumbai. ' + subject + ' has been awarded the '+courseName + ' ' + duration + '-year degree (Major in '+ specialization +') in the '+passingClass+' for the examination held in ' + passingMonthYear + '. The medium of instruction of the said course was in ',{text :  instruction_medium , bold:true}, '.'], fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:'      This letter is issued to '+studentName+ ' on ' + subject1 + ' request dated '+ moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [110,270,150],
						headerRows: 1,
						body: [
						 ['','',{text:'Director, DSD',alignment:'center'}],
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
					  	widths: [130,220,220],
					  	headerRows: 1,
					  	body: [
							['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/STAMP01.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/stamp_design2.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
							['','','']
					  	]
					},
					layout: 'noBorders',
				},
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
		 	}
		};
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+'.pdf'));
		pdfDoc.end();
		docDefinition=null;
		callback();
	},

	instrucationalLetterForDiffClg : function(user_id,application_id,studentName,collegeData,courseName,specialization,passingMonthYear,duration,passingClass,instruction_medium,application_date,subject,subject1,ref_no,callback){
		filename = application_id+"_InstructionalLetter";
		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
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

		// var fonts = {
		// 	Roboto: {
		// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
		// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
		// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
		// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
		// 	  }
		// };
		
		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');
		//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

		var docDefinition = {
			content:[
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
				{
					style:{
					  fontSize: 10,
					  bold: false,
					  // hLineColor : 'gray',
					  // vLineColor :'gray',
					  color : 'blue'
					} ,
					table: {
					  widths: [180,160,180],//[30,70,230,150],
					  headerRows: 1,
					  body: [
						[{text:'Dr. Sunil Patil',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
						[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
						[{text:'Department Of Students’ Development',fontSize: 10}, '',{text:'Vidyapeeth Vidyarthi Bhavan,',alignment:'left'}],
						[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'1st Floor,B Road,Churchgate,',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'MUMBAI - 400020.',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.:(022)22042859',alignment:'left'}],
						[{text:'No. SW/' + application_id + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
						[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
					]
					},
					layout: 'noBorders',
				  },
				{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{	
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [70,400,70],
						headerRows: 1,
						body: [
						 ['',[
								{
									table: {
										widths: [350],
										body: [
											[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
										]
									},
									layout: 'noBorders',
								}
							],''],
						]
					},
					layout: 'noBorders',  
				},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text :[' This is to certify that '+studentName+ ' a student of University of Mumbai. The education details are as follow ' ],fontSize :10 },
				{text:' ',fontSize: 8,bold:true},
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
		 	}
		};

		for(var college in collegeData){
			docDefinition.content.push([
				{text:[' ' + collegeData[college] + ' '],fontSize: 10},
			])
		}

		docDefinition.content.push([
			{text:' ',fontSize: 8,bold:true},
			{text:[ subject + ' has been awarded the '+courseName + ' ' + duration + '-year degree (Major in '+ specialization +') in the '+passingClass+' for the examination held in ' + passingMonthYear + '. The medium of instruction of the said course was in ',{text :  instruction_medium , bold:true}, '.'], fontSize: 10},
			{text:' ',fontSize: 8,bold:true},
			{text:' ',fontSize: 8,bold:true},
			{text:'      This letter is issued to '+studentName+ ' on ' + subject1 + ' request dated '+ moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10},
			{text:' ',fontSize: 8,bold:true},
			{text:' ',fontSize: 8,bold:true},
			{
				style:{
					fontSize: 10,
					bold: false,
				} ,
				table: {
					widths: [110,270,150],
					headerRows: 1,
					body: [
						['','',{text:'Director, DSD',alignment:'center'}],
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
					widths: [130,220,220],
					headerRows: 1,
					body: [
						['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/STAMP01.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/stamp_design2.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
						['','','']
					]
				},
				layout: 'noBorders',
			},
		])
		
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);

		
		pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+'.pdf'));
		pdfDoc.end();

		
		docDefinition=null;
		callback();
	},

	instrucationalLetter_one : function(user_id,application_id,studentName,collegeName,courseName,specialization,passingMonthYear,duration,passingClass,instruction_medium,application_date,subject,subject1,ref_no,education,letterType,callback){
		console.log('instrucationalLetter_one' + letterType);
		var filename;
		if(letterType == "instructionalLetter"){
			filename = application_id + "_" + education + "_InstructionalLetter";
		}else if(letterType == "affiliationLetter"){
			filename = application_id + "_" + education + "_AffiliationLetter";
		}
		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
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

		// var fonts = {
		// 	Roboto: {
		// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
		// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
		// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
		// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
		// 	  }
		// };

		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');
		//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

		var docDefinition = {
			content:[
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
				{
					style:{
					  fontSize: 10,
					  bold: false,
					  // hLineColor : 'gray',
					  // vLineColor :'gray',
					  color : 'blue'
					} ,
					table: {
					  widths: [180,160,180],//[30,70,230,150],
					  headerRows: 1,
					  body: [
						[{text:'Dr. Sunil Patil',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
						[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
						[{text:'Department Of Students’ Development',fontSize: 10}, '',{text:'Vidyapeeth Vidyarthi Bhavan,',alignment:'left'}],
						[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'1st Floor,B Road,Churchgate,',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'MUMBAI - 400020.',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.:(022)22042859',alignment:'left'}],
						[{text:'No. SW/' + ref_no + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
						[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
					]
					},
					layout: 'noBorders',
				  },
				{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{	
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [70,400,70],
						headerRows: 1,
						body: [
						 ['',[
								{
									table: {
										widths: [350],
										body: [
											[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
										]
									},
									layout: 'noBorders',
								}
							],''],
						]
					},
					layout: 'noBorders',  
				},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:['      This is to certify that '+studentName+ ' a student of '+collegeName+'University of Mumbai. ' + subject + ' has been awarded the '+courseName + ' ' + duration + '-year degree (Major in '+ specialization +') in the '+passingClass+' for the examination held in ' + passingMonthYear + '. The medium of instruction of the said course was in ',{text :  instruction_medium , bold:true}, '.'], fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:'      This letter is issued to '+studentName+ ' on ' + subject1 + ' request dated '+ moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [110,270,150],
						headerRows: 1,
						body: [
						 ['','',{text:'Director, DSD',alignment:'center'}],
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
					  	widths: [130,220,220],
					  	headerRows: 1,
					  	body: [
							['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/STAMP01.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/stamp_design2.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
							['','','']
					  	]
					},
					layout: 'noBorders',
				},
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
		 	}
		};
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+'.pdf'));
		pdfDoc.end();
		docDefinition=null;
		callback();
	},

	instrucationalLetterForDiffClg_two : function(user_id,application_id,studentName,collegeData,courseName,specialization,passingMonthYear,duration,passingClass,instruction_medium,application_date,subject,subject1,ref_no,education,letterType,callback){
		console.log('instrucationalLetterForDiffClg_two');
		var filename;
		if(letterType == "instructionalLetter"){
			filename = application_id + "_" + education + "_InstructionalLetter";
		}else if(letterType == "affiliationLetter"){
			filename = application_id + "_" + education + "_AffiliationLetter";
		}
		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
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

		// var fonts = {
		// 	Roboto: {
		// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
		// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
		// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
		// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
		// 	  }
		// };
		
		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');
		//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

		var docDefinition = {
			content:[
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
				{
					style:{
					  fontSize: 10,
					  bold: false,
					  // hLineColor : 'gray',
					  // vLineColor :'gray',
					  color : 'blue'
					} ,
					table: {
					  widths: [180,160,180],//[30,70,230,150],
					  headerRows: 1,
					  body: [
						[{text:'Dr. Sunil Patil',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
						[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
						[{text:'Department Of Students’ Development',fontSize: 10}, '',{text:'Vidyapeeth Vidyarthi Bhavan,',alignment:'left'}],
						[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'1st Floor,B Road,Churchgate,',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'MUMBAI - 400020.',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.:(022)22042859',alignment:'left'}],
						[{text:'No. SW/' + ref_no + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
						[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
					]
					},
					layout: 'noBorders',
				  },
				{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{	
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [70,400,70],
						headerRows: 1,
						body: [
						 ['',[
								{
									table: {
										widths: [350],
										body: [
											[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
										]
									},
									layout: 'noBorders',
								}
							],''],
						]
					},
					layout: 'noBorders',  
				},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text :[' This is to certify that '+studentName+ ' a student of University of Mumbai. The education details are as follow ' ],fontSize :10 },
				{text:' ',fontSize: 8,bold:true},
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
		 	}
		};

		for(var college in collegeData){
			docDefinition.content.push([
				{text:[' ' + collegeData[college] + ' '],fontSize: 10},
			])
		}

		docDefinition.content.push([
			{text:' ',fontSize: 8,bold:true},
			{text:[ subject + ' has been awarded the '+courseName + ' ' + duration + '-year degree (Major in '+ specialization +') in the '+passingClass+' for the examination held in ' + passingMonthYear + '. The medium of instruction of the said course was in ',{text :  instruction_medium , bold:true}, '.'], fontSize: 10},
			{text:' ',fontSize: 8,bold:true},
			{text:' ',fontSize: 8,bold:true},
			{text:'      This letter is issued to '+studentName+ ' on ' + subject1 + ' request dated '+ moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10},
			{text:' ',fontSize: 8,bold:true},
			{text:' ',fontSize: 8,bold:true},
			{
				style:{
					fontSize: 10,
					bold: false,
				} ,
				table: {
					widths: [110,270,150],
					headerRows: 1,
					body: [
						['','',{text:'Director, DSD',alignment:'center'}],
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
					widths: [130,220,220],
					headerRows: 1,
					body: [
						['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/STAMP01.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/stamp_design2.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
						['','','']
					]
				},
				layout: 'noBorders',
			},
		])
		
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);

		
		pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+'.pdf'));
		pdfDoc.end();

		
		docDefinition=null;
		callback();
	},
	currently_studying_instructionalLetter : function(user_id,application_id,studentName,collegeName,courseName,specialization,passingMonthYear,duration,passingClass,instruction_medium,application_date,subject,subject1,ref_no,education,letterType,callback){
		console.log('instrucationalLetter_one');
		if(letterType = "instructionalLetter"){
			filename = application_id + "_" + education + "_InstructionalLetter";
		}else if(letterType = "affiliationLetter"){
			filename = application_id + "_" + education + "_AffiliationLetter";
		}

		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
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

		// var fonts = {
		// 	Roboto: {
		// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
		// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
		// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
		// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
		// 	  }
		// };

		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');
		//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

		var docDefinition = {
			content:[
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
				{
					style:{
					  fontSize: 10,
					  bold: false,
					  // hLineColor : 'gray',
					  // vLineColor :'gray',
					  color : 'blue'
					} ,
					table: {
					  widths: [180,160,180],//[30,70,230,150],
					  headerRows: 1,
					  body: [
						[{text:'Dr. Sunil Patil',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
						[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
						[{text:'Department Of Students’ Development',fontSize: 10}, '',{text:'Vidyapeeth Vidyarthi Bhavan,',alignment:'left'}],
						[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'1st Floor,B Road,Churchgate,',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'MUMBAI - 400020.',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.:(022)22042859',alignment:'left'}],
						[{text:'No. SW/' + ref_no + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
						[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
					]
					},
					layout: 'noBorders',
				  },
				{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{	
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [70,400,70],
						headerRows: 1,
						body: [
						 ['',[
								{
									table: {
										widths: [350],
										body: [
											[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
										]
									},
									layout: 'noBorders',
								}
							],''],
						]
					},
					layout: 'noBorders',  
				},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:['      This is to certify that '+studentName+ ' a student of '+collegeName+'University of Mumbai. ' + subject + ' is currently studying in '+courseName + '(Major in '+ specialization +'). The medium of instruction of the said course is in ',{text :  instruction_medium , bold:true}, '.'], fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:'      This letter is issued to '+studentName+ ' on ' + subject1 + ' request dated '+ moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [110,270,150],
						headerRows: 1,
						body: [
						 ['','',{text:'Director, DSD',alignment:'center'}],
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
					  	widths: [130,220,220],
					  	headerRows: 1,
					  	body: [
							['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/STAMP01.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/stamp_design2.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
							['','','']
					  	]
					},
					layout: 'noBorders',
				},
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
		 	}
		};
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+'.pdf'));
		pdfDoc.end();
		docDefinition=null;
		callback();
	},
    NamechangeLetter_one : function(user_id,application_id,firstnameaspermarksheet,fathersnameaspermarksheet,mothersnameaspermarksheet,lastnameaspermarksheet,firstnameasperpassport,fathersnameasperpassport,lastnameasperpassport,letterType,collegeName,courseName,ref_no,gender,callback){
		console.log('NamechangeLetter_one');
		var greting;
		var Uppercase_gender;
		if(gender ==  'Female'){
			greeting = 'Miss.',
			gender = 'her'
			Uppercase_gender = 'HER'

		}else if(gender == 'Male'){
				greeting = 'Mr.',
				gender = 'his'
				Uppercase_gender = 'HIS'
		}

		var nameAsPerMarksheet = greeting + ' ' + lastnameaspermarksheet + ' ' + firstnameaspermarksheet + ' ' + fathersnameaspermarksheet + ' ' + mothersnameaspermarksheet;
		var nameAsPerpassport = greeting + '' +lastnameasperpassport + ' '+ firstnameasperpassport + ' '+ fathersnameasperpassport;

		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
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

		// var fonts = {
		// 	Roboto: {
		// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
		// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
		// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
		// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
		// 	  }
		// };

		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');
		//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

		var docDefinition = {
			content:[
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
				{
					style:{
					  fontSize: 10,
					  bold: false,
					  // hLineColor : 'gray',
					  // vLineColor :'gray',
					  color : 'blue'
					} ,
					table: {
					  widths: [180,160,180],//[30,70,230,150],
					  headerRows: 1,
					  body: [
						[{text:'Dr. Sunil Patil',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
						[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
						[{text:'Department Of Students’ Development',fontSize: 10}, '',{text:'Vidyapeeth Vidyarthi Bhavan,',alignment:'left'}],
						[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'1st Floor,B Road,Churchgate,',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'MUMBAI - 400020.',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.:(022)22042859',alignment:'left'}],
						[{text:'No. SW/' + ref_no + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
						[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
					]
					},
					layout: 'noBorders',
				  },
				{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{	
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [70,400,70],
						headerRows: 1,
						body: [
						 ['',[
								{
									table: {
										widths: [350],
										body: [
											[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
										]
									},
									layout: 'noBorders',
								}
							],''],
						]
					},
					layout: 'noBorders',  
				},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:[ ' This is to certify that ' , {text :  nameAsPerMarksheet, bold : true} , ' was a student of ' ,{text : collegeName, bold : true} , ' affiliated to University of Mumbai.'] ,fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:[ 'The name mentioned on ',{text : ' '+gender},{text : ' ' + courseName, bold : true}, {text :' marksheet is  '}, {text: nameAsPerMarksheet, bold : true},{text: ' and name mentioned on '},{text : gender}, {text :' passport is '},{text: nameAsPerpassport, bold : true},{text : '.'+ Uppercase_gender},{text :' surname is '}, {text : lastnameaspermarksheet, bold : true}, {text : ', first name is '}, {text :firstnameaspermarksheet, bold : true } , {text : ', ' + gender}, {text :' father’s name is '},{text :fathersnameaspermarksheet, bold : true}, {text : ' and' , gender} ,{text : ' mother’s name is '},{text :mothersnameaspermarksheet, bold : true} , '.'],fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:'In the state of Maharashtra the mother’s name is also included in the name of person.', fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:['Therefore on the degree certificate',{text : ' ' +gender}, {text :' name is mentioned as '}, {text :nameAsPerMarksheet, bold : true},{text:' where in the passport '},{text : gender},{text : ' name is '},{text:nameAsPerpassport, bold : true}, {text:' without the name of '},{text : gender +' mother.'}],fontSize: 10},

				{
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [110,270,150],
						headerRows: 1,
						body: [
						 ['','',{text:'Director, DSD',alignment:'center'}],
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
					  	widths: [130,220,220],
					  	headerRows: 1,
					  	body: [
							['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/STAMP01.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/stamp_design2.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
							['','','']
					  	]
					},
					layout: 'noBorders',
				},
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
		 	}
		};
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		var faculty = courseName.split(' ').join('_');
		pdfDoc.pipe(fs.createWriteStream(dir+'/'+application_id + '_NameChangeLetter'+ faculty +'.pdf'));
		pdfDoc.end();
		docDefinition=null;
		callback();
	},
    currently_studying_namechangeLetter : function(user_id,application_id,studentName,collegeName,courseName,specialization,passingMonthYear,passingClass,instruction_medium,application_date,subject,subject1,ref_no,education,letterType,callback){
		console.log('currently_studying_namechangeLetter');
		if(letterType = "instructionalLetter"){
			filename = application_id + "_" + education + "_InstructionalLetter";
		}else if(letterType = "affiliationLetter"){
			filename = application_id + "_" + education + "_AffiliationLetter";
		}

		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
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

		// var fonts = {
		// 	Roboto: {
		// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
		// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
		// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
		// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
		// 	  }
		// };

		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');
		//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

		var docDefinition = {
			content:[
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
				{
					style:{
					  fontSize: 10,
					  bold: false,
					  // hLineColor : 'gray',
					  // vLineColor :'gray',
					  color : 'blue'
					} ,
					table: {
					  widths: [180,160,180],//[30,70,230,150],
					  headerRows: 1,
					  body: [
						[{text:'Dr. Sunil Patil',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
						[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
						[{text:'Department Of Students’ Development',fontSize: 10}, '',{text:'Vidyapeeth Vidyarthi Bhavan,',alignment:'left'}],
						[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'1st Floor,B Road,Churchgate,',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'MUMBAI - 400020.',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.:(022)22042859',alignment:'left'}],
						[{text:'No. SW/' + application_id + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
						[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
					]
					},
					layout: 'noBorders',
				  },
				{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{	
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [70,400,70],
						headerRows: 1,
						body: [
						 ['',[
								{
									table: {
										widths: [350],
										body: [
											[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
										]
									},
									layout: 'noBorders',
								}
							],''],
						]
					},
					layout: 'noBorders',  
				},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:['      This is to certify that '+studentName+ ' a student of '+collegeName+'University of Mumbai. ' + subject + ' is currently studying in '+courseName + '(Major in '+ specialization +'). The medium of instruction of the said course is in ',{text :  instruction_medium , bold:true}, '.'], fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:'      This letter is issued to '+studentName+ ' on ' + subject1 + ' request dated '+ moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [110,270,150],
						headerRows: 1,
						body: [
						 ['','',{text:'Director, DSD',alignment:'center'}],
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
					  	widths: [130,220,220],
					  	headerRows: 1,
					  	body: [
							['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/STAMP01.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/stamp_design2.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
							['','','']
					  	]
					},
					layout: 'noBorders',
				},
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
		 	}
		};
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+'.pdf'));
		pdfDoc.end();
		docDefinition=null;
		callback();
	},
    NameChangeLetterForDiffClg_two : function(user_id,application_id,studentName,collegeData,courseName,specialization,passingMonthYear,passingClass,instruction_medium,application_date,subject,subject1,ref_no,education,letterType,callback){
		console.log('NameChangeLetterForDiffClg_two');
		if(letterType = "instructionalLetter"){
			filename = application_id + "_" + education + "_InstructionalLetter";
		}else if(letterType = "affiliationLetter"){
			filename = application_id + "_" + education + "_AffiliationLetter";
		}
		var currentYear = moment(new Date()).year();
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
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

		// var fonts = {
		// 	Roboto: {
		// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
		// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
		// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
		// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
		// 	  }
		// };
		
		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');
		//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

		var docDefinition = {
			content:[
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
				{
					style:{
					  fontSize: 10,
					  bold: false,
					  // hLineColor : 'gray',
					  // vLineColor :'gray',
					  color : 'blue'
					} ,
					table: {
					  widths: [180,160,180],//[30,70,230,150],
					  headerRows: 1,
					  body: [
						[{text:'Dr. Sunil Patil',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
						[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
						[{text:'Department Of Students’ Development',fontSize: 10}, '',{text:'Vidyapeeth Vidyarthi Bhavan,',alignment:'left'}],
						[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'1st Floor,B Road,Churchgate,',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'MUMBAI - 400020.',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.:(022)22042859',alignment:'left'}],
						[{text:'No. SW/' + application_id + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
						[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
					]
					},
					layout: 'noBorders',
				  },
				{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{	
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [70,400,70],
						headerRows: 1,
						body: [
						 ['',[
								{
									table: {
										widths: [350],
										body: [
											[{text:'TO WHOMSOVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
										]
									},
									layout: 'noBorders',
								}
							],''],
						]
					},
					layout: 'noBorders',  
				},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text :[' This is to certify that '+studentName+ ' a student of University of Mumbai. The education details are as follow ' ],fontSize :10 },
				{text:' ',fontSize: 8,bold:true},
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
		 	}
		};

		for(var college in collegeData){
			docDefinition.content.push([
				{text:[' ' + collegeData[college] + ' '],fontSize: 10},
			])
		}

		docDefinition.content.push([
			{text:' ',fontSize: 8,bold:true},
			{text:[ subject + ' has been awarded the '+courseName + ' ' + duration + '-year degree (Major in '+ specialization +') in the '+passingClass+' for the examination held in ' + passingMonthYear + '. The medium of instruction of the said course was in ',{text :  instruction_medium , bold:true}, '.'], fontSize: 10},
			{text:' ',fontSize: 8,bold:true},
			{text:' ',fontSize: 8,bold:true},
			{text:'      This letter is issued to '+studentName+ ' on ' + subject1 + ' request dated '+ moment(new Date(application_date)).format('DD/MM/YYYY') + ' submitted to this office.', fontSize: 10},
			{text:' ',fontSize: 8,bold:true},
			{text:' ',fontSize: 8,bold:true},
			{
				style:{
					fontSize: 10,
					bold: false,
				} ,
				table: {
					widths: [110,270,150],
					headerRows: 1,
					body: [
						['','',{text:'Director, DSD',alignment:'center'}],
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
					widths: [130,220,220],
					headerRows: 1,
					body: [
						['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/STAMP01.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/stamp_design2.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
						['','','']
					]
				},
				layout: 'noBorders',
			},
		])
		
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);

		
		pdfDoc.pipe(fs.createWriteStream(dir+'/'+filename+'.pdf'));
		pdfDoc.end();

		
		docDefinition=null;
		callback();
	},
	hrdLetter : function(user_id,ref_no,data,gender,fileName,verification_type,text,callback){
		console.log("hrdLetter-------------->")
		// var fileName="HrdLetter.pdf";
		var currentYear = moment(new Date()).year();
		var fullName =  data.fullName;
		var course_name = data.course_name;
		var specialization = data.specialization;
		var seat_no = data.seat_no;
		var prn_no = data.prn_no;
		var transcript_no = data.transcript_no;
		var transcript_date = data.transcript_date
		var exam_date = data.exam_date;
		var ref_no = data.reference_no;
		var gender = gender;
		var fileName =  fileName;
		var verifeddate = moment();
		var date = verifeddate.format('DD-MM-YYYY').toString();
		var transcriptDate = moment(new Date(transcript_date)).format("DD/MM/YYYY")
		var exam_date_format =moment(new Date(exam_date)).format("DD-MM-YYYY")
		var examDate = new Date(exam_date).toUTCString()
		var exam_date_inwords =  examDate.substring(7,16)
		if(data.cgpa != null){
			var cgpa_cgpi = data.cgpa
			var marks = 'CGPA'
		}else{
			var cgpa_cgpi = data.cgpi
			var marks = 'CGPI'
		}

		if(gender == 'her'){
			greet = 'Miss.'
		}else if(gender == 'him'){
			greet = 'Mr.'
		}
		//var dir = 'F:\\attestation\\development\\attestationserver\\public\\upload\\transcript\\'+user_id;
		var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		currentDateTime = moment(new Date()).format("DD/MM/YYYY");
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

		// var fonts = {
		// 	Roboto: {
		// 		normal: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Regular.ttf',
		// 		bold: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Medium.ttf',
		// 		italics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-Italic.ttf',
		// 		bolditalics: 'F:\\attestation\\development\\attestationserver\\public\\fonts\\Roboto-MediumItalic.ttf'
		// 	  }
		// };

		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');
		//var PdfPrinter = require('F:\\attestation\\development\\attestationserver\\node_modules\\pdfmake\\src\\printer');

		var docDefinition = {
			content:[
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
        		// {text:' ',fontSize: 8,bold:true},
				// {text:' ',fontSize: 8,bold:true},
				{
					style:{
					  fontSize: 10,
					  bold: false,
					  // hLineColor : 'gray',
					  // vLineColor :'gray',
					  color : 'blue'
					} ,
					table: {
					  widths: [180,160,180],//[30,70,230,150],
					  headerRows: 1,
					  body: [
						[{text:'Dr. Sunil Patil',fontSize: 12,bold:true},{rowSpan: 8,image: constants.FILE_LOCATION + 'public/upload/profile_pic/MU Bleu Logo - Letter.png',fit: [100, 100],alignment:'center'},{text:'Department of Students’ Development',bold:true,alignment:'left'}],
						[{text:'Director,',fontSize: 12,bold:true}, '',{text:'and Universities Information Bureau',bold:true,alignment:'left'}],
						[{text:'Department Of Students’ Development',fontSize: 10}, '',{text:'Vidyapeeth Vidyarthi Bhavan,',alignment:'left'}],
						[{text:'and Foreign Students’ Advisor',fontSize: 10}, '',{text:'1st Floor,B Road,Churchgate,',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'MUMBAI - 400020.',alignment:'left'}],
						[{text:'',fontSize: 8}, '',{text:'Tel. and Fax No.:(022)22042859',alignment:'left'}],
						// ['', '',{text:'Date : '+currentDateTime,alignment:'left'}],
						[{text:'No. SW/' + ref_no + ' of ' + currentYear ,fontSize: 10,bold:true}, '',{text:'Date : '+currentDateTime,alignment:'left'}],  
						[{text:'',fontSize: 9}, '',{text:'',alignment:'left'}]     
					]
					},
					layout: 'noBorders',
				  },
				{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
        		{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{	
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [70,400,70],
						headerRows: 1,
						body: [
						 ['',[
								{
									table: {
										widths: [350],
										body: [
											[{text:'TO WHOM SO EVER IT MAY CONCERN',fontSize: 12,alignment:'center',bold:true}]
										]
									},
									layout: 'noBorders',
								}
							],''],
						]
					},
					layout: 'noBorders',  
				},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{text:['      This is to certify that '+ greet + ' '+ fullName+' passed '+ course_name + ' (' +specialization+ ')'+ text+' with Pern. Reg. No :' + prn_no , '.'], fontSize: 10},
				{text:['      For the Final Examination held in '+exam_date_inwords+' with '+marks+': '+cgpa_cgpi+'. The Transcript Certificate is issued to '+gender+' vide Letter No : '+transcript_no+'.Dated: '+transcriptDate+ '.'], fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:'       The '+verification_type+' have been verified, found correct and genuine. It is authenticated on '+currentDateTime+' by the undersigned', fontSize: 10},
				{text:' ',fontSize: 8,bold:true},
				{text:' ',fontSize: 8,bold:true},
				{
					style:{
						fontSize: 10,
						bold: false,
					} ,
					table: {
						widths: [110,270,150],
						headerRows: 1,
						body: [
						 ['','',{text:'Director, DSD',alignment:'center'}],
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
					  	widths: [130,220,220],
					  	headerRows: 1,
					  	body: [
							['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/STAMP01.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/stamp_design2.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
							['','','']
					  	]
					},
					layout: 'noBorders',
				},
			],
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
		 	}
		};
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(dir+'/'+fileName));
		pdfDoc.end();
		docDefinition=null;
		callback();
	},
	generateWesForm : function(user_id,app_id,callback){
		console.log("generateWesForm-------------->")
		var dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		var fileName = 'wesletter.pdf'
		var file_Dir = constants.FILE_LOCATION+'public/signedpdf/'+user_id;
		var signDate;
		if (!fs.existsSync(dir)){
			fs.mkdirSync(dir);
		}
		models.Institution_details.findAll({
			where : {
					user_id : user_id,
					app_id :  app_id

			}
		}).then(function(instution_data) {
			models.Wes_Form.findAll({
				user_id : user_id,
				app_id :  app_id
			}).then(function (wes_data){
				models.User.findAll({
					where : {
						id : user_id
					}
				}).then(function (user_data){

				models.Country.findAll({
					where :{ 
						id : user_data[0].country_id
					}
				}).then(function (country){
					signDate = wes_data[0].created_at;
					var signatureDated = moment(new Date(signDate)).format("DD/MM/YYYY")
		
		var fonts = {
			Roboto: {
				normal: constants.FILE_LOCATION+'public/fonts/Roboto-Regular.ttf',
				bold: constants.FILE_LOCATION+'public/fonts/Roboto-Medium.ttf',
				italics: constants.FILE_LOCATION+'public/fonts/Roboto-Italic.ttf',
				bolditalics: constants.FILE_LOCATION+'public/fonts/Roboto-MediumItalic.ttf'
			  }
		};
		var PdfPrinter = require(constants.FILE_LOCATION+'node_modules/pdfmake/src/printer');
		var docDefinition = {
			content: [
				{
					style: 'tableExample',
					layout: 'noBorders',
					table: {
						widths: [310,300],
						body: [
							[{image : constants.FILE_LOCATION + 'public/upload/profile_pic/weslogo.png',fit: [150, 100]},{text : 'Confirmation of Doctoral degree Conferral' , bold : true}],
						]
					},
				},
			  {
			  text: [
				{ text: 'Note to applicant: ', fontSize: 15,bold: true },
				'  It is the responsibility of individual applicants to have their academic records forwarded to WES. Please complete parts 1 and 2 of this form and submit it to the registrar/controller of examinations/or other authorized official at the academic instittuion where you obtained you obtained your degree. Please note that some institutions may charge a fee for this service.  ',
			  ]
				},
				 {
							  text: 'Part 1',
							  style: [{bold: true}],
							  width: 200 // Nothing changes..
				  }, 
 
			  {
				  style: 'tableExample',
				  table: {
					  widths: [290,200],
					  body: [
						  ['', 'Wes Reference :' + instution_data[0].wesno],
						  ['last Name family Name:' + instution_data[0].lastnameaswes, 'First/Given Name:' + instution_data[0].nameaswes],
						  ['Previous/Maiden Name:(if applicable)', 'Date of Birth:' + wes_data[0].dob],
						  ['Current Address:' +wes_data[0].currentaddress, 'City:' + wes_data[0].city],
						  ['State/Provison:' + wes_data[0].state, 'Country:' +country[0].name],
						  ['Postal Code:' + wes_data[0].postal_code, 'Email:' + user_data[0].email]
					  ]
				  }
			  },

				   {
							  text: 'Part 2',
							  style: [{bold: true}],
							  width: 200 // Nothing changes..
				  },
			  {
				  style: 'tableExample',
				  table: {
					  widths: [290,200],
					  body: [
						  ['Institution Name: ' + wes_data[0].institute_name, 'Dates Attended : From : '+ wes_data[0].datefrom+' to :'+ wes_data[0].dateto],
						  ['Degree Name: Doctor of Philosophy', 'Year of Award:' + wes_data[0].yearaward],
						  ['Major:' + wes_data[0].major, 'Student id or Roll Number at sending institution:' + wes_data[0].sturolno],
					  ]
				  }
			  },
			   {
							  text: '\n'
			   }, 
			  'I hereby authorized the release of my academic records and information to World Eductaion Services.',
				{
							  text: '\n'
				}, 
			   'Applicants Signature dated on : ' +  signatureDated,
			   {
		   
				image: constants.FILE_LOCATION + 'public/upload/StudentSignature/'+user_id+'/'+wes_data[0].file_name,alignment:'left',width: 150,
			  
				},		  
			   {
							  text: '\n'
			   },
				  
				 'Note to authorized official : The above-named person seeks to have his degree evaluated and requests that a confirmation of his/her degree conferral be forwarded to World Eductaion Service.Please complete this form,and return it directly to World Education Services at one of the adresses below.',
				 {
					text: '\n'
		},
				 {
							  text: 'CONFIRMATION:',
							  style: [{bold: true,fontSize: 13,decoration : 'underline'}],
			   },
				 {
			text: [
			  'I hearby confirm that the student named above attended ',
			  { text:wes_data[0].institute_name, fontSize: 12,decoration : 'underline' },
			]
			  },  
				 {
							  text: '\n'
				  },
						 {
			text: [
			  'from  ',
			  { text: wes_data[0].datefrom, fontSize: 12,decoration : 'underline' },
			  '   to   ',
			  { text : wes_data[0].dateto, fontSize: 12,decoration : 'underline' },
			  '  and was awarded  ',
			  { text: 'Doctor of Philosophy in  '+  wes_data[0].major + ' on  ' +wes_data[0].yearaward, fontSize: 12,decoration : 'underline' },
			  
			]
			  },
			  {
				text: '\n'
				},
					  {
				  style: 'tableExample',
				  table: {
					  widths: [290,200],
					  heights:[15,15,15,15,15,15],
					  body: [
						  ['Name of the official completing form: Dr. Sunil Patil  ', 'Title: Director'],
						  [ {text:'Address: Vidyapeeth Vidhyarthi Bhavan,B road,Churchgate,Mumbai', colSpan:2}, {text:''} ],
						  ['City: Mumbai ', 'Country: India '],
						  ['Postal Code: 400020 ', 'Telephone:'],
						  ['Fax: ', 'Email: attestation@mu.ac.in'],
						  [ {text:'URL:', colSpan:2}, {text:''} ]
					  ]
				  }
			  },
			  {
				style:{
					fontSize: 10,
					bold: false,
				} ,
				table: {
					widths: [110,270,150],
					headerRows: 1,
					body: [
					 ['','',{text:'Director, DSD',alignment:'center'}],
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
					  widths: [130,220,220],
					  headerRows: 1,
					  body: [
						['',{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/STAMP01.png',fit: [85, 85],alignment:'center'},{rowSpan: 2,image: constants.FILE_LOCATION + 'public/upload/profile_pic/stamp_design2.png',fit: [130, 80],alignment:'center'}],//DIRECT SNIPPING TOOL
						['','','']
					  ]
				},
				layout: 'noBorders',
			},
		  ],
		  
		 
			defaultStyle: {
				alignment: 'justify',
				fontSize: 10
		 	}
		};
	
		var printer = new PdfPrinter(fonts);
		var pdfDoc = printer.createPdfKitDocument(docDefinition);
		pdfDoc.pipe(fs.createWriteStream(dir+'/'+fileName));
		pdfDoc.end();
		docDefinition=null;
		callback();
	});
})
})
});
	},

    
};