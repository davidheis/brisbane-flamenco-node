var firebase = require("firebase/app");
require("firebase/auth");
exports.isAdmin = function (req, res, next) {
    var user = firebase.auth().currentUser;
    if(user){
        if (user.uid === 'YnakLXc4V7ZVuRIAoG79Hj1Q33t1' || user.uid === 'FKDn7vzAwShERQ0haNRwnDIs7ju1') {
            req.user = user;
            next();
          } else {
            res.render('getLogin', {showLogOutBtn:false});
          }
    } else {
         res.render('getLogin', {showLogOutBtn:false});
    }
  }