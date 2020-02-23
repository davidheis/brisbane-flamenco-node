var firebase = require("firebase/app");

const express = require('express');
const app = express();
exports.isLoggedIn = function (req, res, next) {
    var user = firebase.auth().currentUser;
    if (user !== null) {
        // req.user = user;
        req.user = user
        next();
      } else {
        req.user = '';
        next();
      }
  }