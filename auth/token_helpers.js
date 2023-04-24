const moment = require('moment');
const jwt = require('jwt-simple');
const cfg = require('./config.js');
const functions = require('../utils/function');
module.exports.permanentRefreshToken = 'eb4e15840117437cbfd7343f257c4aae';

module.exports.createAccessToken = function(user) {
  var pass = user.password
  var hashPassword = functions.generateHashPassword(pass);

  var payload = {
        sub: user.user_id,
        exp: moment().add(cfg.accessTokenExpiresIn, 'seconds').unix(),
        iat: moment().unix(),
        id: user.user_id,
        email: user.user_email,
        name: user.user_name,
        mobile: user.user_mobile,
        category : user.user_student_category,
        profileCompleteness : user.profileCompleteness,
        role: user.user_type,
        country_birth : user.country_birth,
        theme : user.theme,
        user_type: user.user_type,
        login_count: user.login_count,
        applying_for : user.applying_for,
        source : user.source,
        password : hashPassword
      };
      var token = jwt.encode(payload, cfg.jwtSecret);
      return token;
}


module.exports.createRefreshToken = function(user) {
  var refreshPayload = {
    sub: user.id,
    exp: moment().add(cfg.refreshTokenExpiresIn, 'seconds').unix(),
    iat: moment().unix(),
    id: user.id,
    email: user.email,
    role: 'REFRESH_TOKEN',
    source : user.source
  };
  var refreshToken = jwt.encode(refreshPayload, cfg.jwtSecret);
  return refreshToken;
}

module.exports
