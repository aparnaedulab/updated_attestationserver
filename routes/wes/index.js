var path = require('path');
var root_path = path.dirname(require.main.filename);
const express = require('express');
var router = express.Router();
var constant = require(root_path + '/config/constant');
const logger = require('../../logger')(__filename);
const middlewares = require('./../../middlewares');
const fs = require('fs');
const mysql = require('mysql2');
const { Op } = require("sequelize");
var moment = require('moment');
var functions = require(root_path+'/utils/function');
var models = require(root_path + '/models');
var Client = require('ssh2').Client;
var config    = require(__dirname + '/../../config/config.json')['local'];
//config.database, config.username, config.password
const connection = mysql.createConnection({
  host: config.host,
  user: config.username,
  database: config.database,
  password: config.password
});
var connSettings = {
  host: constant.HOST,
  port: 22,
  username: constant.QUSERNAME,
  password: constant.QPASSWORD,
};



router.post('/uploadWes', middlewares.getUserInfo, function (req, res) {
    logger.debug("req.body.user_id : "+ req.body.user_id)
    var count = 0;
  req.body.user_id.forEach(users =>{
   // logger.debug("foreach users['user_Id'] : "+ users['user_Id'])
    var query = 'SELECT `user_id`,`wesno`,`app_id` FROM `Institution_details` WHERE `type` = "Educational credential evaluators WES" AND  `wesupload` is null AND `user_id` = "'+users['user_Id']+"\"";
    //logger.info("query : "+ query);
    connection.query(
      query,
     async function(err, results, fields) {
      count++;
        if(results){
         
   //       var conn = await new Client();
  //   conn.on("ready", function() {
  //   conn.sftp(function(err, sftp) {     
  //     if (err) {
  //       logger.error(err);
  //       throw err;
  //     };
  //     //Creates a folder on wes server with wesno name
  //     results.forEach(userFileName =>{
  //     sftp.mkdir(constant.SERVERPATH+"/"+userFileName['wesno']+"/", function(err) {
  //       if (err) {
  //         logger.error("Failed to create directory!", err);
  //         conn.end();
  //       } else {
  //         logger.info(userFileName['wesno']+" new directory created on server");
  //         conn.end();
  //       }
  //     });
  //   })
  //   });
  // })
  // .connect(connSettings);   

  setTimeout(function () {
    results.forEach(async usersWes =>{
      functions.socketnotification('Wes file Uploaded','Wes file uploaded to wes server succesfully',usersWes['user_id'],'student');
      //logger.debug("req.body.date : "+req.body.date);
      //logger.debug("results usersWes['app_id'] "+ usersWes['app_id'])
   await setValue(users['user_Id'],usersWes['wesno'],usersWes['app_id'],req,res)
  
    // setValue(users['user_Id'],usersWes['wesno'],usersWes['app_id'],req,res);
    
});
  
  },500)
  
        } 
         // res.json({
        //   status: 200,
        //   message: results.length + ' file/s queued for uploading to WES server.',
        //   title: 'Success'
        //              });

      });
      
  })
    //logger.info("wesno :"+wesno);
    res.json({
      status: 200,
      message: 'files are queued for uploading to WES server.',
     title: 'Success'
                 });
    
    
})

async function setValue(userid,wesno,app_id,req,res) {
 // logger.debug("set value userid: "+userid);
  //logger.debug("app_id :"+app_id)
  var location = constant.FILE_LOCATION + "public/signedpdf/";
  var fileNames = [];
  //req.body.user_id.forEach(userFound =>{
  var fullPath = location + userid + "/" ;
  if (fs.existsSync(location)) {
    fs.readdirSync(fullPath).forEach(file => {
        if(file.startsWith(app_id+"_Merge.pdf")){
          logger.debug("file pushed : "+file)
        fileNames.push(file);
      }
        });
        const promises = fileNames.map(async(file,index)=> {
             var localfile =fullPath+file;
            var uploadedSize = 0;
                var conn = await new Client();
                conn.on('ready', function() {
                  logger.verbose('Client :: ready');
                  conn.sftp(function(err, sftp) {
                    if (err) {
                      logger.error(err)
                      throw err
                    };
                    var readStream = fs.createReadStream( localfile );
                    var stats = fs.statSync(localfile);
                    var fileSizeInBytes = stats["size"];
                    //Convert the file size to megabytes (optional)
                    var fileSizeInMegabytes = fileSizeInBytes / 1000000.0
                    logger.debug("filesize of "+app_id+" : "+fileSizeInMegabytes);
                  //logger.debug("server file name : "+constant.SERVERPATH+wesno+".pdf");
        var writeStream = sftp.createWriteStream( constant.SERVERPATH+wesno+".pdf" );
        readStream.on('data', function(buffer) {
          var segmentLength = buffer.length;
          uploadedSize += segmentLength;
          //logger.verbose("Progress of "+wesno+":\t" + ((uploadedSize/fileSizeInBytes*100).toFixed(2) + "%"));
          process.stdout.write("Upload completed of : "+ app_id+" : "+wesno+":\t" + ((uploadedSize/fileSizeInBytes*100).toFixed(2) + "%")+'\r');
      });
        writeStream.on('close',function () {
            logger.verbose( file+" transferred succesfully as " + wesno+"-"+(index+1)+".pdf" );
            models.Institution_details.update(
              {wesupload:new Date().toISOString().slice(0,10)},
              {
                where :{
                 [Op.and]:[{
                   user_id:userid
                  },
                  {
                    type:'Educational credential evaluators WES'
                  }]
              }
          }).then((err,updated)=>{
              if(err){
                  console.error(err)
              }
          })
        });

        writeStream.on('end', function () {
            logger.verbose( "sftp connection closed" );
            conn.close();
        });

        // initiate transfer of file
        readStream.pipe( writeStream );
                  });
                }).connect(connSettings);
           });          
          Promise.all(promises)
            .then(results => {
              logger.info('all files queued sucessfully');
              // res.json({
              //   status: 200,
              //   message: fileNames.length + ' file/s queued for uploading to WES server.',
              //   title: 'Success'
              //              });
            })
            .catch(e => {
              console.error(e);
              // handle error
            });
    } else {
            logger.error('no directory found');
            // res.json({
            //     status: 200,
            //     message: 'no directory found',
            //     title: 'Error'
    
            // });
        }
     // });
}


router.get('/getAllWes',(req,res)=>{
  var page = req.query.page;
   var name = req.query.name ? req.query.name : '';
    var id = req.query.id ? req.query.id : '';
    var wesno = req.query.wesno ? req.query.wesno :'';
    var email = req.query.email ? req.query.email : '';
    var year = req.query.acadYear ? req.query.acadYear : '';
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];


    if(id != '' && id != null && id != undefined && id != 'null' && id != 'undefined'){
      var filter ={};
      filter.name = 'application_id';
      filter.value = id;
      filters.push(filter);
  }

    if(name != '' && name != null && name != undefined && name != 'null' && name != 'undefined'){
        var filter ={};
        var filter1 = {};
        var nameSplit = name.split(' ');
        if(nameSplit.length == 1){
             filter.name = 'name';
           filter.value = " AND( u.name like '%" + nameSplit[0] + "%' OR u.surname like '%" + nameSplit[0] + "%') ";
            filters.push(filter);
        }else if(nameSplit.length == 2){
             filter.name = 'name';
           filter.value = " AND u.name like '%" + nameSplit[0] + "%' AND u.surname like '%" + nameSplit[1] + "%' ";
            filters.push(filter);
        }else{
             filter.name = 'name';
             var lastElement = nameSplit.pop();
             filter.value = " AND u.name like '%" + nameSplit.join(' ') + "%' AND u.surname like '%" + lastElement + "%' ";
            filters.push(filter);
        }
        
    }
    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(wesno != '' && wesno != null && wesno != undefined && wesno != 'null' && wesno != 'undefined'){
      var filter ={};
      filter.name = 'wesno';
      filter.value = wesno;
      filters.push(filter);
  }

    if(year != '' && year != null && year != undefined && year != 'null' && year != 'undefined'){	
        var filter ={};	
		var currentyear = year;	
		var startdate = currentyear+"-04-01";	
		var year = parseInt(currentyear) + 1;	
		var enddate = year + "-04-01"  ;	
        filter.name = 'application_year';	
        filter.value = " AND a.created_at BETWEEN '" + startdate + "' AND '" + enddate + "'";	
        filters.push(filter);	
    }
    var data = []; var countObj={};
    // fetch total active & inactive student count from db.
    models.Institution_details.getWesStudents(filters,null,null).then(function(wesstudentsData){
        countObjects.totalLength = wesstudentsData.length;
         models.Institution_details.getWesStudents(filters,limit,offset).then(function(students) {	
            countObjects.filteredLength = students.length;	
            		
            if(students != null) {
                 require('async').eachSeries(students, function(student, callback){
                    
                    var obj = {
                        app_id: (student.app_id) ? student.app_id : '',
                        name: (student.name) ? student.name : '',
                        // surname: (student.surname) ? student.surname : '',
                        email: (student.email) ? student.email : '',
                        type:(student.type)? student.type:'',
                        wesno:(student.wesno)? student.wesno:'',
                        user_id:(student.user_id)? student.user_id:'',
                        wesupload:(student.wesupload)? student.wesupload:'',
                        current_location:(student.current_location)? student.current_location:'',
                      };

                    data.push(obj);
                    callback();
                    
                }, function(){
                    res.json({
                        status: 200,
                        message: 'Student retrive successfully',
                        items: data,
                        total_count: countObjects,
                    });
                });
            } else {
                res.json({
                    status: 400,
                    message: 'Problem in retrieving student list'
                });
            }
                    
        });
    })
})



router.get('/checkStats',(req,res)=>{
  models.Institution_details.find(
      {
          where :{
          [Op.and]:[
            {
              user_id:req.query.userId
            },
           {
            type: 'Educational credential evaluators WES' 
           },
           {
           wesupload:{
              [Op.ne] :null
          }
        }
          ]
    }
  }).then(users=>{
      if(users){
          res.json({
            status:200,
            checkWesStatus :true,
            step:'wes'
          })
      }
      else{
          res.json({
          status:400,
          checkWesStatus:false,
          step:'wes'
          })
      }
     
  }).catch(()=>{
      console.error('Error Occurred!!!');
  })
})

router.get('/getInvalidUser',(req,res)=>{
  models.Institution_details.getInvalidWesStudents().then(users =>{
    if(users){
      res.json({
        status:200,
        data:users
      })
    }
  })
})

router.get('/viewPdf',(req,res)=>{
  var location = constant.PDF_VIEW +"signedpdf/"+req.query.userid + "/";
  var fullPath = location + req.query.filename ;
  res.json({
    url:fullPath
  })
})


router.get('/viewFileStatus',(req,res)=>{
 models.Wes_Records.findAll({
   where:{
     userId:req.query.userid,
     appl_id : req.query.app_id
   },
   attributes:['wesnumber','reference_no','appl_id','userId','fileName','status','updated_at']
 }).then((user)=>{
   if(user){
     res.json({
       status:200,
       data:user
     })
   }
 })
})

module.exports = router;