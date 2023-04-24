"use strict";

module.exports = function(sequelize, DataTypes) {
    var Country = sequelize.define("Country", {
        code: DataTypes.STRING(2),
        name: DataTypes.STRING(100),
        phonecode: DataTypes.STRING(10),
        image: DataTypes.STRING(100),
        embassy_email: DataTypes.TEXT
    }, {
        timestamps: false
    }); 
        //Country.timestamps= false;
        
            Country.getCountryList= function() {
                var query = '';
                query += " SELECT id, name, phonecode FROM Country ";
                query += " WHERE id ";
                query += " IN ( ";
                query += " SELECT DISTINCT c.Country_id ";
                query += " FROM College AS c ";
                query += " LEFT JOIN College_Course AS cc ON cc.college_id = c.id ";
                query += " LEFT JOIN Degree AS d ON d.name = cc.degree ";
                query += " WHERE c.STATUS =  'approved' ";
                query += " AND cc.STATUS =  'active' ";
                query += " AND c.institute_status =  'ACTIVE' ";
                query += " AND d.status =  'ACTIVE' ";
                query += " ) ORDER BY name ASC ";

                return sequelize.query(query, {
                    type: sequelize.QueryTypes.SELECT
                });
            };
            Country.CountryList= function(){
                var query = '';
                query += " SELECT * FROM Country ";

                return sequelize.query(query, { 
                    type: sequelize.QueryTypes.SELECT
                });
            };
        
    
    return Country;
};