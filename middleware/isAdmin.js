var firebase = require("firebase/app");
var admin = require("firebase-admin");
let db = admin.firestore();

exports.isAdmin = function (req, res, next) {
  var user = firebase.auth().currentUser;
  if (user) {
    if (user.uid === 'YnakLXc4V7ZVuRIAoG79Hj1Q33t1' || user.uid === 'FKDn7vzAwShERQ0haNRwnDIs7ju1') {

      const userDoc = db.collection('users').doc(user.uid);
      userDoc.get()
        .then(doc => {
          const user = doc.data();
          req.user = user;
          next();
        })  
    } else {
      res.render('getLogin', { showLogOutBtn: false, currentUser : '' });
      // next();
    }
  } else {

    // next();
    res.render('getLogin', { showLogOutBtn: false, currentUser : '' });
  }
}