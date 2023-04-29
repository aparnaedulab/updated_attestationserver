"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    name: DataTypes.STRING(100),
    surname: DataTypes.STRING(100),
    email: DataTypes.STRING(100),
    password: DataTypes.STRING,
    mobile: DataTypes.STRING(17),
    gender: DataTypes.ENUM('Male', 'Female', 'Others' ,'Transgender'),
    otp: DataTypes.STRING(6),
    is_otp_verified: DataTypes.BOOLEAN(),
    email_verification_token: DataTypes.STRING(20),
    is_email_verified: DataTypes.BOOLEAN(),
    user_type: DataTypes.ENUM('admin', 'sub-admin', 'student'),
    applying_for: DataTypes.TEXT,
    city  :  DataTypes.STRING(100),
    dob: DataTypes.DATEONLY, 
    mobile_country_code: DataTypes.STRING(5),
    postal_code: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    trudesk_key : DataTypes.TEXT,
    what_mobile_country_code : DataTypes.STRING(5),
    what_mobile : DataTypes.STRING(17), 
    current_location:DataTypes.STRING(17),
    board_id : DataTypes.INTEGER(11),
    login_count : DataTypes.INTEGER(10),
    user_status: DataTypes.ENUM('active', 'inactive', 'deleted'),
    profile_completeness: DataTypes.STRING(3),
    instructionalField : DataTypes.BOOLEAN(),
    curriculum : DataTypes.BOOLEAN(),
    educationalDetails : DataTypes.BOOLEAN(),
    gradToPer : DataTypes.BOOLEAN(),
});

User.associate = (models) => {
  User.belongsTo(models.Country, {foreignKey: 'country_id'});
  User.hasOne(models.Role, { foreignKey: 'userid' });
  User.hasOne(models.Application, { foreignKey: 'user_id' });
  //User.hasMany(models.percentageToGradeLetter, { foreignKey: 'user_id' });
};


User.getStudentStatusCount=function(user_status){
  var query='';
  query += 'SELECT COUNT( user_status ) AS count FROM  `User` WHERE user_type =  \'student\'';
  query += 'AND user_status=\''+user_status+'\'';
  // 
  return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
};

// User.getAllUsersInfo = function(year,fromDate,toDate,country_id){
//   var query='';
//   var where_fromDate= '';
//   var where_toDate = '';
//   var country ='';
//   if(country_id != undefined && country_id != null && country_id != '' && country_id != 'undefined'){
//       country = ' user.country_id ='+country_id+' AND ';
//   } 
//   if(fromDate != ''){
//       where_fromDate='AND user.created_at >= "'+fromDate+'" ';
//   }
//   if(toDate != ''){
//       where_toDate='AND user.created_at <= "'+toDate+'" '
//   }
//   var where_academic_year='';
//   if(year == 2019){

//       where_academic_year = ' user.user_type="student" ';
//   }else if(year == 2020){

//       where_academic_year = ' user.user_type="student" ';
//   }
  
//   query+='SELECT DISTINCT user.email,user.surname,user.id,user.name,user.user_type, user.city, user.country_id, user.is_email_verified,user.created_at,user.user_status,con1.name AS country, '
//   query+='user.applying_for, user.current_location, user.created_at,user.profile_completeness FROM User user '
//   query+='LEFT JOIN Country AS con1 ON con1.id = user.country_id '
//   //query+='LEFT JOIN Country AS con1 ON con1.id = user.country_birth '
//   query+=' WHERE '
//   query+= country;
//   query+= where_academic_year;
//   query+= where_fromDate;
//   query+= where_toDate;
//   query+='ORDER BY user.created_at DESC'
//   return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
// };

User.getAllUsersInfo = function(filters,limit,offset) {
  // var filters ='';
  var where_student_name = '',
    // where_student_surname = '',
    where_application_id = '',
    where_application_email = '',
    where_application_date = '';
  var limitOffset = '';
  if (filters.length > 0) {
    filters.forEach(function(filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
        } else if (filter.name == "surname") {
          where_student_surname = " AND user.surname LIKE '%" + filter.value + "%' ";
        } else if (filter.name == "application_id") {
          where_application_id = " AND a.id = " + filter.value + " ";
        } else if (filter.name == "email") {
          where_application_email = " AND user.email like '%" + filter.value  + "%' ";
        } else if(filter.name == 'application_year'){
          where_application_date = filter.value;
        }
    });
  }
  if (limit != null && offset != null) {
    limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
  }
  var query = "SELECT DISTINCT user.email,CONCAT (user.name,' ',user.surname) as name,user.id,user.user_type, user.city, user.country_id, user.is_email_verified,user.created_at,user.user_status,con1.name AS country,"
  query+='app.applying_for, user.current_location, user.created_at,user.profile_completeness FROM User user '
  query+='LEFT JOIN Country AS con1 ON con1.id = user.country_id '
  //query+='LEFT JOIN Country AS con2 ON con2.id = user.country_birth '
  query += " LEFT JOIN Applied_For_Details as app ON app.user_id = user.id ";
  query += " WHERE user.user_type = 'student'";
  query += where_application_id;
  query += where_application_email;
  query += where_student_name;
  query += where_application_date;
  query += " ORDER BY user.created_at desc ";
  query += limitOffset;
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

User.getCountryWiseApplication = function(year,country_name,apply_name){
  var query='';
  var where_fromDate= '';
  var where_toDate = '';
  var country ='';
  var applying_for="";
  if(country_name != undefined && country_name != null && country_name != '' && country_name != 'undefined'){
      country = " AND ide.country_name = '" + country_name + "' " ;
  }

  if(apply_name != undefined && apply_name != null && apply_name != '' && apply_name != 'undefined'){
    applying_for = " AND usr.applying_for LIKE '%" + apply_name + "%' ";
  }
  var where_academic_year='';
  if(year == 2019){

      where_academic_year = ' AND usr.user_type="student" ';
  }else if(year == 2020){

      where_academic_year = ' AND usr.user_type="student" ';
  }
  
  query+=' SELECT c.name as country_name, usr.name, usr.email, usr.applying_for, ide.university_name FROM Institution_details as ide '
  query+='LEFT JOIN Country as c on c.name = ide.country_name '
  query+='LEFT JOIN User as usr on usr.id = ide.user_id '
  query+=' WHERE 1 = 1'
  query+= country;
  query+= applying_for;
  query+= where_academic_year;
  query+=' ORDER BY usr.created_at DESC '
  return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
};

User.getRegisteredCount = function(date,type){
  var query = "SELECT count(id) as registerCount FROM User ";
  query += " WHERE created_at like '%" + date + "%' AND current_location = '" + type +"'"; 
  return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
}

User.getAppliedForDetails =function(date,type){
  var query = "SELECT app.instructionalField, app.curriculum, app.educationalDetails, app.gradToPer, app.affiliation FROM User AS u ";
  query += " JOIN Application AS a ON a.user_id = u.id ";
  query += " JOIN Applied_For_Details AS app ON a.id = app.app_id";
  query += " WHERE a.created_at like '%" + date + "%' AND u.current_location = '"+ type + "'";
  return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
}

User.getApplicationDetailsForSign =function(app_id){
  var query = "SELECT * FROM User AS u "; 
  query += " JOIN Applied_For_Details AS app ON u.id = app.user_id";
  query += " WHERE app.app_id = '"+ app_id + "'";
  return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
}

User.getUserDetailsByemail =function(email){
  var query = "SELECT u.id, u.name, u.surname, u.email, u.mobile, app.instructionalField, app.curriculum, app.educationalDetails,";
  query += " app.gradToPer,app.affiliation,app.CompetencyLetter,app.LetterforNameChange FROM User AS u "; 
  query += " JOIN Applied_For_Details AS app ON u.id = app.user_id";
  query += " WHERE u.email = '"+ email + "' AND app.app_id IS NULL";
  return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
}

User.getUserDetailsById =function(user_id,app_id){
  var query = "SELECT u.id, u.name, u.surname, u.email, u.mobile, app.instructionalField, u.gender, app.curriculum, app.educationalDetails,"
  query += " app.gradToPer,app.affiliation FROM User AS u "; 
  query += " JOIN Applied_For_Details AS app ON u.id = app.user_id";
  query += " WHERE u.id = "+ user_id + " AND app.app_id = " + app_id;
  return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
}


User.getexcel =function(id){
  var query = "SELECT * FROM User ";
  query += " WHERE id In (29294,29295,29296,29297,29298,29299,29300,29301,29302,29303,29304,29305,29306,29307,29308,29309,29310,29311,29312,29313,29314,29315,29316,29317,29318,29319,29320,29321,29322,29323,29324,29325,29326,29327,29328,29329,29330,29331,29332,29333,29334,29335,29336,29337,29338,29339,29340,29341,29342,29343,29344,29345,29346,29347,29348,29349,29350,29351,29352,29353,29354,29355,29356,29357,29358,29359,29360,29361,29362,29363,29364,29365,29366,29367,29368,29369,29370,29371,29372,29373,29374,29375,29376,29377,29378,29379,29380,29381,29382,29383,29384,29385,29386,29387,29388,29389,29390,29391,29392,29393,29394,29395,29396,29397,29398,29399,29400,29401,29402,29403,29404,29405,29406,29407,29408,29409,29410,29411,29412,29413,29414,29415,29416,29417,29418,29419,29420,29421,29422,29423,29424,29425,29426,29427,29428,29429,29430,29431,29432,29433,29434,29435,29436,29437,29438,29439,29440,29441,29442,29443,29444,29445,29446,29447,29448,29449,29450,29451,29452,29453,29454,29455,29456,29457,29458,29459,29460,29461,29462,29463,29464,29465,29466,29467,29468,29469,29470,29471,29472,29473,29474,29475,29476,29477,29478,29479,29480,29481,29482,29483,29484,29485,29486,29487,29488,29489,29490,29491,29492,29493,29494,29495,29496,29497,29498,29499,29500,29501,29502,29503,29504,29505,29506,29507,29508,29509,29510,29511,29512,29513,29514,29515,29516,29517,29518,29519,29520,29521,29522,29523,29524,29525,29526,29527,29528,29529,29530,29531,29532,29533,29534,29535,29536,29537,29538,29539,29540,29541,29542,29543,29544,29545,29546,29547,29548,29549,29550,29551,29552,29553,29554,29555,29556,29557,29558,29559,29560,29561,29562,29563,29564,29565,29566,29567,29568,29569,29570,29571,29572,29573,29574,29575,29576,29577,29578,29579,29580,29581,29582,29583,29584,29585,29586,29587,29588,29589,29590,29591,29592,29593,29594,29595,29596,29597,29598,29599,29600,29601,29602,29603,29604,29605,29606,29607,29608,29609,29610,29611,29612,29613,29614,29615,29616,29617,29618,29619,29620,29621,29622,29623,29624,29625,29626,29627,29628,29629,29630,29631,29632,29633,29634,29635,29636,29637,29638,29639,29640,29641,29642,29643,29644,29645,29646,29647,29648,29649,29650,29651,29652,29653,29654,29655,29656,29657,29658,29659,29660,29661,29662,29663,29664,29665,29666,29667,29668,29669,29670,29671,29672,29673,29674,29675,29676,29677,29678,29679,29680,29681,29682,29683,29684,29685,29686,29687,29688,29689,29690,29691,29692,29693,29694,29695,29696,29697,29698,29699,29700,29701,29702,29703,29704,29705,29706,29707,29708,29709,29710,29711,29712,29713,29714,29715,29716,29717,29718,29719,29720,29721,29722,29723,29724,29725,29726,29727,29728,29729,29730,29731,29732,29733,29734,29735,29736,29737,29738,29739,29740,29741,29742,29743,29744,29745,29746,29747,29748,29749,29750,29751,29752,29753,29754,29755,29756,29757,29758,29759,29760,29761,29762,29763,29764,29765,29766,29767,29768,29769,29770,29771,29772,29773,29774,29775,29776,29777,29778,29779,29780,29781,29782,29783,29784,29785,29786,29787,29788,29789,29790,29791,29792,29793,29794,29795,29796,29797,29798,29799,29800,29801,29802,29803,29804,29805,29806,29807,29808,29809,29810,29811,29812,29813,29814,29815,29816,29817,29818,29819,29820,29821,29822,29823,29824,29825,29826,29827,29828,29829,29830,29831,29832,29833,29834,29835,29836,29837,29838,29839,29840,29841,29842,29843,29844,29845,29846,29847,29848,29849,29850,29851,29852,29853,29854,29855,29856,29857,29858,29859,29860,29861,29862,29863,29864,29865,29866,29867,29868,29869,29870,29871,29872,29873,29874,29875,29876,29877,29878,29879,29880,29881,29882,29883,29884,29885,29886,29887,29888,29889,29890,29891,29892,29893,29894,29895,29896,29897,29898,29899,29900,29901,29902,29903,29904,29905,29906,29907,29908,29909,29910,29911,29912,29913,29914,29915,29916,29917,29918,29919,29920,29921,29922,29923,29924,29925,29926,29927,29928,29929,29930,29931,29932,29933,29934,29935,29936,29937,29938,29939,29940,29941,29942,29943,29944,29945,29946,29947,29948,29949,29950,29951,29952,29953,29954,29955,29956,29957,29958,29959,29960,29961,29962,29963,29964,29965,29966,29967,29968,29969,29970,29971,29972,29973,29974,29975,29976,29977,29978,29979,29980,29981,29982,29983,29984,29985,29986,29987,29988,29989,29990,29991,29992,29993,29994,29995,29996,29997,29998,29999,30000,30001,30002,30003,30004,30005,30006,30007,30008,30009,30010,30011,30012,30013,30014,30015,30016,30017,30018,30019,30020,30021,30022,30023,30024,30025,30026,30027,30028,30029,30030,30031,30032,30033,30034,30035,30036,30037,30038,30039,30040,30041,30042,30043,30044,30045,30046,30047,30048,30049,30050,30051,30052,30053,30054,30055,30056,30057,30058,30059,30060,30061,30062,30063,30064,30065,30066,30067,30068,30069,30070,30071,30072,30073,30074,30075,30076,30077,30078,30079,30080,30081,30082,30083,30084,30085,30086,30087,30088,30089,30090,30091,30092,30093,30094,30095,30096,30097,30098,30099,30100,30101,30102,30103,30104,30105,30106,30107,30108,30109,30110,30111,30112,30113,30114,30115,30116,30117,30118,30119,30120,30121,30122,30123,30124,30125,30126,30127,30128,30129,30130,30131,30132,30133,30134,30135,30136,30137,30138,30139,30140,30141,30142,30143,30144,30145,30146,30147,30148,30149,30150,30151,30152,30153,30154,30155,30156,30157,30158,30159,30160,30161,30162,30163,30164,30165,30166,30167,30168,30169,30170,30171,30172,30173,30174,30175,30176,30177,30178,30179,30180,30181,30182,30183,30184,30185,30186,30187,30188,30189,30190,30191,30192,30193,30194,30195,30196,30197,30198,30199,30200,30201,30202,30203,30204,30205,30206,30207,30208,30209,30210,30211,30212,30213,30214,30215,30216,30217,30218,30219,30220,30221,30222,30223,30224,30225,30226,30227,30228,30229,30230,30231,30232,30233,30234,30235,30236,30237,30238,30239,30240,30241,30242,30243,30244,30245,30246,30247,30248,30249,30250,30251,30252,30253,30254,30255,30256,30257,30258,30259,30260,30261,30262,30263,30264,30265,30266,30267,30268,30269,30270,30271,30272,30273,30274,30275,30276,30277,30278,30279,30280,30281,30282,30283,30284,30285,30286,30287,30288,30289,30290,30291,30292,30293,30294,30295,30296,30297,30298,30299,30300,30301,30302,30303,30304,30305,30306,30307,30308,30309,30310,30311,30312,30313,30314,30315,30316,30317,30318,30319,30320,30321,30322,30323,30324,30325,30326,30327,30328,30329,30330,30331,30332,30333,30334,30335,30336,30337,30338,30339,30340,30341,30342,30343,30344,30345,30346,30347,30348,30349,30350,30351,30352,30353,30354,30355,30356,30357,30358,30359,30360,30361,30362,30363,30364,30365,30366,30367,30368,30369,30370)";
  return sequelize.query(query,{type:sequelize.QueryTypes.SELECT});
}

User.hasOne(sequelize.models.Application, { foreignKey: 'user_id' });

  return User;
};