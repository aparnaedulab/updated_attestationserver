"use strict";

module.exports = function(sequelize, DataTypes) {
	var Orders = sequelize.define("Orders", {
		order_id: DataTypes.STRING(50),
		user_id: DataTypes.INTEGER(10),
		course_id: DataTypes.INTEGER(10),
		application_id: DataTypes.INTEGER(10),
		timestamp: DataTypes.DATE,
		timestamp_payment: DataTypes.DATE,
		amount: DataTypes.DECIMAL(10,2),
		status: {
		  type: DataTypes.ENUM('-1', '0','1','2','3','4','5'),
	      allowNull: false,
	      defaultValue: '-1'
	    },
		recurring: DataTypes.ENUM('YES', 'NO'),
		timeduration: DataTypes.STRING(35),
		challan_no : DataTypes.TEXT,
		split: DataTypes.BOOLEAN(),
		source: DataTypes.STRING(100)
	});

	Orders.getOrderID = function(yesterday,today){
		var query='';
			query += " SELECT * FROM Orders ";
			query += " Where (`status` != '1') and created_at BETWEEN  '"+yesterday+"' AND '"+today+"' ";
			query += " and source = 'guattestation' or source = 'gumoi' ";
		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
		//`status` = '-1' or `status` = '0'
	};

	Orders.getThreeDigit = function(yesterday,today){
		var query='';
			query += " SELECT max( id ) as MAXID FROM `Orders` where id < '346849194' ";
			query += " and source = 'guattestation' or source = 'gumoi'";
		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	};

	Orders.invoice_generation = function(yesterday,today){
		var query='';
			query += " SELECT tran.order_id, tran.tracking_id, usr.mobile_country_code, usr.mobile, usr.name, usr.email, usr.address, usr.city,usr.postal_code, tran.created_at, usr.id as user_id from `Transaction` as tran ";
			query += " LEFT JOIN Orders as ord on ord.id = tran.order_id "
			query += " LEFT JOIN User as usr on usr.id = ord.user_id "
			query += " Where tran.created_at BETWEEN  '"+yesterday+"' AND '"+today+"' ";
			query += " and ord.source = 'guattestation'or source = 'gumoi' ";
		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
		//`status` = '-1' or `status` = '0'
	};

	Orders.one_month_payment_detail = function(monthstart,monthend){
		var query='';
			query += " SELECT tran.order_id, tran.tracking_id, usr.mobile_country_code, usr.mobile, usr.name, usr.email, usr.address, usr.city,usr.postal_code, tran.created_at, tran.amount from `Transaction` as tran ";
			query += " LEFT JOIN Orders as ord on ord.id = tran.order_id "
			query += " LEFT JOIN User as usr on usr.id = ord.user_id "
			query += " Where tran.created_at BETWEEN  '"+monthstart+"' AND '"+monthend+"' ";
			query += " and ord.source = 'guattestation'  or source = 'gumoi' ";
		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
		//`status` = '-1' or `status` = '0'
	};

	// ,{
	// 	classMethods:{
	// 		checkdata:function(user_id,course_id){
	//         var query='';
	//             query += "SELECT o.order_id, o.user_id, o.course_id FROM Orders o ";
	//             query += "where o.order_id = '1'" ;//LIKE '%"+name+"%' "
	//             query += "AND o.user_id='"+user_id+"' ";
	//             query += " AND o.course_id='"+course_id+"'";
	
	//         return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	//       },
	//       	checkdatasecond:function(user_id,course_id){
	//         var query='';
	//             query += "SELECT o.order_id, o.user_id, o.course_id FROM Orders o ";
	//             query += "where o.order_id = '2'" ;//LIKE '%"+name+"%' "
	//             query += "AND o.user_id='"+user_id+"' ";
	//             query += " AND o.course_id='"+course_id+"'";
	//          //
	//         return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	//       },
	//       	checkdatathird:function(user_id,course_id){
	//         var query='';
	//             query += "SELECT o.order_id, o.user_id, o.course_id FROM Orders o ";
	//             query += "where o.order_id = '3'" ;//LIKE '%"+name+"%' "
	//             query += "AND o.user_id='"+user_id+"' ";
	//             query += " AND o.course_id='"+course_id+"'";
	//         return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	//       },
	//       	getSecondPaymentdetails:function(){

	//         	var query='';
	//         	query += " SELECT DISTINCT ca.user_id,uced.enrollment_no,ord.order_id,t.payment_mode as t_paymentMode,t.amount as total_amount,t.currency as currency, t.created_at as dateOfPaymebnt,t.merchant_param5 as orderId,ord.status as ord_status,ord.id as ord_id,ord.course_id as ord_course,ca.challan_location,ord.id,ord.order_id,ord.status,ord.course_id as ord_course_id,p.id as ref_no,ca.id,ca.check_eligibility,ca.check_foreign,ca.SignImageName, ca.status, ca.payment_mode, ca.payment_status, ca.payment_details, ca.payment_date, ca.acceptance_date, ca.college_name,car.action, ";
    //             query += " ca.admin_review, ca.intake, ca.intake_id, ca.created_at,  ca.course_id, IF(@@global.time_zone='UTC', CONVERT_TZ(ca.updated_at,'+00:00','+05:30'), ca.updated_at) AS updated_at, usr.name AS student_name, ";
    //             query += " usr.email AS email, cour.name AS course, cour.specialization AS specialization, inta.date AS intake_date, inta.month AS intake_month, ";
    //             query += " inta.year AS intake_year, inta.to_date AS intake_to_date, inta.to_month AS intake_to_month, inta.to_year AS intake_to_year,";
    //             query += " hsc.college_marks as percentage,hsc.college_university as college_university,hsc.Subject_first_hsc,hsc.mark_first_hsc,hsc.OutOf_first_hsc,hsc.grade_first_hsc,hsc.Subject_Second_hsc,hsc.mark_Second_hsc,hsc.OutOf_Second_hsc,hsc.grade_Second_hsc,hsc.Subject_Third_hsc,hsc.mark_Third_hsc,hsc.OutOf_Third_hsc,hsc.grade_Third_hsc,hsc.Subject_fourth_hsc,hsc.mark_fourth_hsc,hsc.OutOf_fourth_hsc,hsc.grade_fourth_hsc,hsc.Subject_fifth_hsc,hsc.mark_fifth_hsc,hsc.OutOf_fifth_hsc,hsc.grade_fifth_hsc,hsc.Subject_Six_hsc,hsc.mark_Six_hsc,hsc.OutOf_Six_hsc,hsc.grade_Six_hsc,hsc.qualification as qualification";
    //             query += " FROM User_Course_Application AS ca ";
    //             //query += " where ca.check_eligibility='true'";
    //             query += " INNER JOIN User AS usr ON usr.id = ca.user_id ";
    //             query += " INNER JOIN User_Course_Enrollment_Detail as uced on uced.application_id = ca.id";
    //            // query += " LEFT OUTER JOIN User_Admission_Eligiblity AS uae ON uae.user_id = ca.user_id ";
    //             query += " INNER JOIN College_Course AS cour ON cour.id = ca.course_id ";
    //             query += " left JOIN Provisional_Eligibility_Letter_data AS p ON p.application_id=ca.id ";
    //             query += " LEFT JOIN College_Accept_Reject AS car ON car.college_name = ca.college_name AND car.application_id = ca.id";
    //             query += " LEFT JOIN Intake AS inta ON inta.id = ca.intake_id";
    //             query += " LEFT JOIN Orders AS ord ON ord.application_id = ca.id and ord.order_id=2";
    //             query += " LEFT JOIN `Transaction` as t on t.order_id = ord.id";
    //             query += " LEFT JOIN User_HSC_Marks as hsc on hsc.user_id = usr.id"
    //             query += " WHERE 1=1 AND ca.intake_id != 0 AND ord.status='1' AND ca.STATUS = 'accept'";
	//             //query += "SELECT usr.NAME AS student_name, usr.email AS email, usr.mobile_country_code, usr.mobile, uca.college_name, t.amount AS total_amount, uca.id AS application_id,uca.course_id, uca.user_id,cour.specialization AS specialization FROM User_Course_Application AS uca INNER JOIN User AS usr ON usr.id = uca.user_id INNER JOIN College_Course AS cour ON cour.id = uca.course_id INNER JOIN Orders AS ord ON ord.application_id = uca.id AND ord.order_id = 3 INNER JOIN `Transaction` AS t ON t.order_id = ord.id WHERE 1 = 1 AND uca.STATUS = 'accept' AND ord.STATUS = '1' AND uca.STATUS = 'accept' ORDER BY uca.updated_at DESC";
	//            //
	//         return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	//       },

	// 	}
	// }
	// );
	
	return Orders;
};
