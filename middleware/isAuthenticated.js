var firebase = require("firebase/app");
require("firebase/auth");
exports.isAuthenticated = function (req, res, next) {
    var user = firebase.auth().currentUser;
    if (user !== null) {
        req.user = user;
        next();
      } else {
        res.render('getLogin', {showLogOutBtn:false, user : ''});
      }
  }