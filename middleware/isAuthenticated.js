var firebase = require("firebase/app");
// const express = require('express');
// const app = express();
// var admin = require('firebase-admin');
require("firebase/auth");
exports.isAuthenticated = function (req, res, next) {
    var user = firebase.auth().currentUser;
    if (user !== null) {
        // console.log('inside middleware logged in');
        req.user = user;
        next();
      } else {
        // console.log('inside middleware not logged in')
        res.render('login', {showLogOutBtn:false});
      }



//    return firebase.auth().onAuthStateChanged(firebaseUser => {
//         if (firebaseUser) {
//             console.log('inside middleware logged in');
//             console.log(firebaseUser.uid);
//             res.locals.firebaseUserUid = firebaseUser.uid;
//             next();
//     } else {
//         console.log('inside middleware not logged in')
//         // req.locals.isLoggedin = false;
//         res.render('login', {showLogOutBtn:false});
//     }
//     });

  }