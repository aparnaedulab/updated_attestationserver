"use strict";

module.exports = function(sequelize, DataTypes) {
	var Transaction = sequelize.define("Transaction", {
		order_id: DataTypes.STRING(45),
		tracking_id: DataTypes.STRING(45),
		bank_ref_no: DataTypes.STRING(45),
		order_status: DataTypes.STRING(45),
		failure_message: DataTypes.STRING(45),
		payment_mode: DataTypes.STRING(45),
		card_name: DataTypes.STRING(45),
		status_code: DataTypes.STRING(45),
		status_message: DataTypes.STRING(45),
		currency: DataTypes.STRING(45),
		amount: DataTypes.STRING(45),
		billing_name: DataTypes.STRING(90),
		billing_address: DataTypes.STRING(90),
		billing_city: DataTypes.STRING(90),
		billing_state: DataTypes.STRING(45),
		billing_zip: DataTypes.STRING(9),
		billing_country: DataTypes.STRING(45),
		billing_tel: DataTypes.STRING(45),
		billing_email: DataTypes.STRING(90),
		delivery_name: DataTypes.STRING(45),
		delivery_address: DataTypes.STRING(45),
		delivery_city: DataTypes.STRING(45),
		delivery_state: DataTypes.STRING(45),
		delivery_zip: DataTypes.STRING(45),
		delivery_country: DataTypes.STRING(45),
		delivery_tel: DataTypes.STRING(45),
		merchant_param1: DataTypes.STRING(90),
		merchant_param2: DataTypes.STRING(90),
		merchant_param3: DataTypes.STRING(90),
		merchant_param4: DataTypes.STRING(90),
		merchant_param5: DataTypes.STRING(90),
		a: DataTypes.TEXT,
		b: DataTypes.TEXT,
		college_share: DataTypes.TEXT,
		split_status: DataTypes.ENUM('1','-1'),
		vault: DataTypes.STRING(45),
		offer_type: DataTypes.STRING(45),
		offer_code: DataTypes.STRING(45),
		discount_value: DataTypes.STRING(45),
		mer_amount: DataTypes.STRING(45),
		eci_value: DataTypes.STRING(45),
		retry: DataTypes.STRING(45),
		response_code: DataTypes.STRING(45),
		edulab_refund: DataTypes.TEXT,
        university_refund: DataTypes.TEXT,
        college_refund: DataTypes.TEXT,
        cc_refund: DataTypes.TEXT,
        refund_status: DataTypes.ENUM('0','1','-1'),
		cc_refund_refer : DataTypes.TEXT,
		cc_share: DataTypes.TEXT,
		change_split_payout_status: DataTypes.ENUM('1','-1'),
		cc_call: DataTypes.TEXT,
	});

	Transaction.getPaymentDetails =  function(tab_type){
		var getPaymentDetailsQuery = "";
		var order_no;
		if(tab_type == '1stPayment'){

			getPaymentDetailsQuery += "SELECT t.order_id, t.tracking_id,u.name,u.email,t.amount, o.application_id from Transaction as t ";
			getPaymentDetailsQuery += " Join Orders as o on o.id = t.order_id";
			getPaymentDetailsQuery += " Join User as u on u.id = o.user_id";
			//getPaymentDetailsQuery += " Join Application as app on app.id = o.application_id";
			getPaymentDetailsQuery += " WHERE t.split_status = '-1' and cc_call IS NULL  ORDER BY t.created_at ASC" //and o.order_id = "+order_no+"";
			return sequelize.query(getPaymentDetailsQuery, { type: sequelize.QueryTypes.SELECT});

		}else if(tab_type == '2ndSplit' || tab_type == '3rdSplit'){
			if(tab_type == '2ndSplit'){
				order_no = '2';
			}else if(tab_type == '3rdSplit'){
				order_no = '3';
			}
			getPaymentDetailsQuery += "SELECT t.order_id,t.tracking_id,t.refund_status,t.a,t.b,t.college_share,u.name,u.email,t.amount, o.application_id from Transaction as t ";
			getPaymentDetailsQuery += " Join Orders as o on o.id = t.order_id";
			getPaymentDetailsQuery += " Join User as u on u.id = o.user_id";
			//getPaymentDetailsQuery += " Join Invoice as i on i.order_id = t.order_id";
			//getPaymentDetailsQuery += " Join Application as uca on uca.id = o.application_id";
			getPaymentDetailsQuery += " WHERE t.split_status = '1' and o.order_id = "+order_no+" ORDER BY t.updated_at ASC";
			return sequelize.query(getPaymentDetailsQuery, { type: sequelize.QueryTypes.SELECT});
		}else if(tab_type == '1stRefund' || tab_type == '2ndRefund' || tab_type == '3rdRefund'){
			if(tab_type == '1stRefund'){
				order_no = '1';
			}else if(tab_type == '2ndRefund'){
				order_no = '2';
			}else if(tab_type == '3rdRefund'){
				order_no = '3';
			}
			getPaymentDetailsQuery += "SELECT t.order_id,t.tracking_id,t.refund_status,t.a,t.b,t.college_share,u.name,u.email,t.amount, o.application_id, t.change_split_payout_status from Transaction as t ";
			getPaymentDetailsQuery += " Join Orders as o on o.id = t.order_id";
			getPaymentDetailsQuery += " Join User as u on u.id = o.user_id";
			//getPaymentDetailsQuery += " Join Invoice as i on i.order_id = t.order_id";
			//getPaymentDetailsQuery += " Join Application as uca on uca.id = o.application_id";
			getPaymentDetailsQuery += " WHERE t.split_status = '1' and o.order_id = "+order_no+" ORDER BY t.updated_at desc";
			return sequelize.query(getPaymentDetailsQuery, { type: sequelize.QueryTypes.SELECT});
		}else if(tab_type == 'refundDetails'){
			getPaymentDetailsQuery += "SELECT t.order_id,o.order_id as order_no,t.tracking_id,t.refund_status,t.edulab_refund,t.university_refund,t.college_refund,t.cc_refund,u.name,u.email,t.amount, o.application_id from Transaction as t ";
			getPaymentDetailsQuery += " Join Orders as o on o.id = t.order_id";
			getPaymentDetailsQuery += " Join User as u on u.id = o.user_id";
			getPaymentDetailsQuery += " WHERE t.refund_status = '1' ";
			return sequelize.query(getPaymentDetailsQuery, { type: sequelize.QueryTypes.SELECT});
		}else if(tab_type == 'multiplePayment'){

			getPaymentDetailsQuery += "SELECT t.order_id, t.tracking_id,u.name,u.email,t.amount, o.application_id from Transaction as t ";
			getPaymentDetailsQuery += " Join Orders as o on o.id = t.order_id";
			getPaymentDetailsQuery += " Join User as u on u.id = o.user_id";
			//getPaymentDetailsQuery += " Join Application as app on app.id = o.application_id";
			getPaymentDetailsQuery += " WHERE t.split_status = '-1' and cc_call = 'Added'  ORDER BY o.id ASC" //and o.order_id = "+order_no+"";
			return sequelize.query(getPaymentDetailsQuery, { type: sequelize.QueryTypes.SELECT});

		}
	}

	Transaction.getUnSplit = function(){
		var query ;
		query = "select billing_name,billing_email,tracking_id,amount,cc_share,b,a,created_at from `Transaction` where split_status = '-1'";
		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	}
	return Transaction;
};

// {
	// 	classMethods: {
	// 		insertTransaction: function(o){
    // 			var transactionQuery="INSERT INTO transaction (order_id,tracking_id,bank_ref_no,order_status,failure_message,payment_mode,card_name,status_code,status_message,currency,amount,billing_name,billing_address,billing_city,billing_state,billing_zip,billing_country,billing_tel,billing_email,delivery_name,delivery_address,delivery_city,delivery_state,delivery_zip,delivery_country,delivery_tel,merchant_param1,merchant_param2,merchant_param3,merchant_param4,merchant_param5,vault,offer_type,offer_code,discount_value,mer_amount,eci_value,retry,response_code) VALUES ('"+o.order_id+"','"+o.tracking_id+"','"+o.bank_ref_no+"','"+o.order_status+"','"+o.failure_message+"','"+o.payment_mode+"','"+o.card_name+"','"+o.status_code+"','"+o.status_message+"','"+o.currency+"','"+o.amount+"','"+o.billing_name+"','"+o.billing_address+"','"+o.billing_city+"','"+o.billing_state+"','"+o.billing_zip+"','"+o.billing_country+"','"+o.billing_tel+"','"+o.billing_email+"','"+o.delivery_name+"','"+o.delivery_address+"','"+o.delivery_city+"','"+o.delivery_state+"','"+o.delivery_zip+"','"+o.delivery_country+"','"+o.delivery_tel+"','"+o.merchant_param1+"','"+o.merchant_param2+"','"+o.merchant_param3+"','"+o.merchant_param4+"','"+o.merchant_param5+"','"+o.vault+"','"+o.offer_type+"','"+o.offer_code+"','"+o.discount_value+"','"+o.mer_amount+"','"+o.eci_value+"','"+o.retry+"','"+o.response_code+"');";

	// 	        return sequelize.query(transactionQuery);
	// 	    },
	// 	    updateStudentPayment: function(stuObj) {
	// 	    	var stuTransactionQuery="UPDATE user_course_application SET payment_mode="+'"'+stuObj.payment_mode+'"'+", payment_status="+'"'+stuObj.payment_status+'"'+", payment_details="+'"'+stuObj.payment_details+'"'+", payment_date="+'"'+stuObj.payment_date+'"'+", order_id="+'"'+stuObj.order_id+'"'+", amount="+'"'+stuObj.amount+'"'+" WHERE id="+stuObj.application_id;

	// 	        return sequelize.query(stuTransactionQuery);
	// 	    },
	// 	    updateInstitutePayment: function(stuObj) {
	// 	    	var instituteTransactionQuery="UPDATE institute_subscription SET payment_mode="+'"'+stuObj.payment_mode+'"'+", payment_status="+'"'+stuObj.payment_status+'"'+", payment_details="+'"'+stuObj.payment_details+'"'+", payment_date="+'"'+stuObj.payment_date+'"'+", order_id="+'"'+stuObj.order_id+'"'+", amount="+'"'+stuObj.amount+'"'+" WHERE college_id="+stuObj.college_id+" AND status='active'";

	// 	        return sequelize.query(instituteTransactionQuery);
	// 	    }
	// 	}
	// }