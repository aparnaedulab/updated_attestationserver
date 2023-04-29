var crypto = require('crypto');
var randomstring = require('randomstring');
var constants = require('../config/constant');
var moment = require('moment');
var Moment = require('moment-timezone');
var models  = require('../models');
algorithm = 'aes-256-ctr',
password = 'je93KhWE08lH9S7SN83sneI87';

module.exports = {
	
	generateHashPassword: function(password) {
		var hashPassword = crypto
	      .createHash("md5")
	      .update(password)
	      .digest('hex');

	    return hashPassword;
	},

	generateRandomString: function(length, charset) {
		return randomstring.generate({
			length: length,
			charset: charset
		});
	},

	

	sendEmail: function(emailOptions, callback) {
		var template = process.cwd() + '/views/' + emailOptions.template + '.jade';

		require('fs').readFile(template, 'utf8', function (err, file){

			if(err) return callback (err);

			var fn = require('jade').compile(file);

			var html = fn(emailOptions.data);


			var mailOptions = {
				from: constants.SEND_EMAIL_FROM,
				fromname: constants.SEND_EMAIL_FROM_NAME,
				to: emailOptions.to,
				toname: (emailOptions.toName != null) ? emailOptions.toName : '',
				subject: emailOptions.subject,
				html: html
			};

			var sendgrid  = require('sendgrid')(constants.SENDGRID_API_KEY);
			
			sendgrid.send(mailOptions, function(err, json) {

				if (err) {

					callback(err);
				}else {

					callback();
				}
			});
		});
	},



	sendSMS: function(smsOptions, callback) {
		var client = require('twilio')(constants.TWILIO_SSID, constants.TWILIO_AUTH_TOKEN);
		if(typeof smsOptions.contact_number == 'number') smsOptions.contact_number = smsOptions.contact_number.toString(); 
		var contact_number = "+"+smsOptions.contact_number.replace(/[^\d]/g, '');


		client.messages.create({
			to: contact_number,
			from: constants.TWILIO_FROM_NUMBER,
			body: smsOptions.message
		}, function(err, message) {
			if (err) {
			
				callback(err);
			}else {

				callback();
			}
		});
	},
	get_current_datetime: function(format) {
		if(format) {
			return Moment(new Date()).tz(constants.SYSTEM_TIMEZONE).format(format);
		}else {
			return Moment(new Date()).tz(constants.SYSTEM_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
		}
	},

	socketnotification: function(action,notification_data,userId,type) {
			models.Notifications.create({
				action: action,
				message: notification_data,
				read:'false',
				flag:type,
				user_id:userId,
				created_at: moment(),
				delete_notification: 'false'
			}).then(function(activity) {
				if(activity) {
					return activity.created_at;
				}
			});
	},

	activitylog: function(user_id,activity,data,application_id) {
 
		models  = require('../models');
		models.Activitytracker.create({
			user_id: user_id,
			activity: activity,
			data: data,
			application_id: application_id,
			created_at: moment()
		}).then(function(activitytracker) {
			if(activitytracker) {
 
			}
		});
	},
}