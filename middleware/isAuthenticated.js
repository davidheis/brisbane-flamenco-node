var firebase = require("firebase/app");
// var admin = require('firebase-admin');
require("firebase/auth");
exports.isAuthenticated = function (req, res, next) {
    firebase.auth().onAuthStateChanged(firebaseUser => {
        if (firebaseUser) {
            console.log('inside middleware logged in')
            next()
    } else {
        console.log('inside middleware not logged in')
        res.render('login', {showLogOutBtn:false});
    }
    });
  }