var passport = require('passport');
var passportJWT = require('passport-jwt');
//var path = require('path');
//var root_path = path.dirname(require.main.filename);
//var models  = require(root_path+'/models');
var cfg = require('./config.js');
var ExtractJwt = passportJWT.ExtractJwt;
var Strategy = passportJWT.Strategy;
var params = {
  secretOrKey: cfg.jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

module.exports = function () {
  var strategy = new Strategy(params, function (payload, done) {
    // var user = users[payload.sub -1 ] || null;
    // //TODO check from db

    // if (user) {
    //   return done(null, {
    //     id: user.id
    //   });
    // } else {
    //   return done(new Error('User not found'), null);
    // }
  });
  passport.use(strategy);
  return {
    initialize: function () {
      return passport.initialize();
    },
    authenticate: function () {
      return passport.authenticate('jwt', cfg.jwtSession);
    }
  };
};
