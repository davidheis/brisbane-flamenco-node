var firebase = require("firebase/app");
const express = require('express');
const app = express();
// var admin = require('firebase-admin');
require("firebase/auth");
exports.isAuthenticated = function (req, res, next) {
    firebase.auth().onAuthStateChanged(firebaseUser => {
        if (firebaseUser) {
            console.log('inside middleware logged in')
            app.locals.isLoggedin = true;
            next()
    } else {
        console.log('inside middleware not logged in')
        res.render('login', {showLogOutBtn:false});
    }
    });
  }