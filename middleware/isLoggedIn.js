var firebase = require("firebase/app");
require("firebase/auth");
exports.isLoggedIn = function (req, res, next) {
    var user = firebase.auth().currentUser;
    if (user !== null) {
        req.user = user;
        next();
      } else {
        next();
      }
  }