"use strict";

const { LOG } = require("pdfreader");
const moment = require('moment');


module.exports = function (sequelize, DataTypes) {
  var paymenterror_details = sequelize.define("paymenterror_details", {

    email: DataTypes.TEXT,
    file_name: DataTypes.TEXT,
    transaction_id: DataTypes.STRING(100),
    date: DataTypes.STRING(100),
    bank_refno: DataTypes.STRING(100),
    order_id: DataTypes.STRING(100),
    user_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    amount: DataTypes.STRING(100),
    note: DataTypes.STRING(100),
    source: DataTypes.STRING(50),
    selectissuetype: DataTypes.STRING(255),
    tracker: DataTypes.ENUM('resolved', 'issued', 'inprocess'),
  },
    {
      sequelize,
      tableName: 'paymenterror_details',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [
            { name: "id" },
          ]
        },
      ]
    });


  paymenterror_details.getpending = function (filters, limit, offset, value) {
    // var filters =moment(filters).format("YYYY-MM-DD")
    // console.log("filters", filters);
    var where_student_name = '',
      where_application_email = '',
      where_application_date = '',
      where_application_data = '';
    var limitOffset = '';
    if (filters.length > 0) {
      filters.forEach(function (filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
        } else if (filter.name == "date") {
          where_application_date = " AND payerr.date like '%" + filter.value + "%' ";
        } else if (filter.name == "email") {
          where_application_email = " AND payerr.email like '%" + filter.value + "%' ";
        } else if (filter.name == 'data') {
          where_application_data = "AND payerr.data like '%" + filter.value + "%' ";
        }
      });
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
    console.log("xzsdd");
    var query = "select u.email,CONCAT(u.name,' ',u.surname) as name ,payerr.id,payerr.email,payerr.transaction_id,payerr.order_id,payerr.bank_refno,payerr.date,";
    query += "payerr.selectissuetype,payerr.note,payerr.source,payerr.tracker,payerr.amount,payerr.user_id,payerr.updated_at ";
    query += "from paymenterror_details as payerr JOIN user as u on u.id = payerr.user_id and";
    query += " payerr.source like '%guattestation%' or payerr.source like '%gumoi%' WHERE payerr.tracker = '" + value + " '";
    query += where_application_data;
    query += where_application_email;
    query += where_application_date;
    query += limitOffset;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
  };
  paymenterror_details.getallpending = function(trackvalue){
var trackvalue
		var query ;
		query = "select payerr.id,payerr.email,payerr.transaction_id,payerr.order_id,payerr.bank_refno,payerr.date,payerr.selectissuetype,payerr.note,payerr.source,payerr.tracker,payerr.amount,payerr.user_id,o.application_id,a.notes, payerr.updated_at from paymenterror_details as payerr JOIN orders as o on o.id = payerr.order_id JOIN application as a on o.application_id =a.id and payerr.source like '%guattestation%' or payerr.source like '%gumoi%' WHERE payerr.tracker = '" + trackvalue + "' ";
		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	}

  // paymenterror_details.belongsTo(sequelize.models.User, {foreignKey: 'user_id'});
  // paymenterror_details.hasOne(sequelize.models.Emailed_Docs, { foreignKey: 'transcript_id' });
  // paymenterror_details.belongsTo(sequelize.models.Application, {foreignKey: 'app_id'});

  return paymenterror_details;
};
