"use strict";

module.exports=function(sequelize, DataTypes){
    var Cart = sequelize.define("Cart",{
        university_name: DataTypes.STRING(100),
        email: DataTypes.STRING(100),
        fees : DataTypes.INTEGER(100),
        institute_id : DataTypes.TEXT
    });
    

    Cart.associate = (models) => {
        Cart.belongsTo(models.User, {foreignKey: 'user_id'});
    };

    Cart.deleteUserData = function(user_id){
        var query = "DELETE FROM Cart WHERE user_id = " + user_id;
        return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
    }

    return Cart;
}