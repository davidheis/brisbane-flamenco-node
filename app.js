require('dotenv').config({ path: __dirname + '/.env' })
const path = require('path');
const port = 3003;
const express = require('express');
const bodyParser = require('body-parser');
const contactsController = require('./controllers/contact')
const fs = require('fs');
// const helmet = require('helmet')
let rawCapodata = fs.readFileSync('database/shop.json');
let allCapos = JSON.parse(rawCapodata);
var firebase = require("firebase/app");
var admin = require('firebase-admin');

// Add the Firebase products that you want to use
require("firebase/auth");
const firebaseConfig = {
    apiKey: 'AIzaSyCqiPzIGpB4e6Tvb41X4GF2_xGt9RPEseU',
    authDomain: "brisbaneflamenco-5aee0.firebaseapp.com",
    databaseURL: "https://brisbaneflamenco-5aee0.firebaseio.com",
    projectId: "brisbaneflamenco-5aee0",
    storageBucket: "brisbaneflamenco-5aee0.appspot.com",
    messagingSenderId: "426908606778",
    appId: "1:426908606778:web:b0540955512553c2467003",
    measurementId: "G-0T0V0RB3F8"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
//   firebase.analytics();

var admin = require("firebase-admin");

var serviceAccount = require(path.join(__dirname, 'firebase-admin-key.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://brisbaneflamenco-5aee0.firebaseio.com"
});

let db = admin.firestore();
const app = express();
// app.use(helmet())
app.use(bodyParser.json({
    type: ['json', 'application/csp-report', 'application/json']
}))
// app.use((req, res, next) => {
//     res.locals.isLoggedin = false;
//     next();
// })

const isAuthenticated = require('./middleware/isAuthenticated').isAuthenticated

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.post('/contact', contactsController.sendContactPageEmail);
app.get('/contact', (req, res) => {
    res.render('contact', { captchaboolean: true });
});
app.get('/capos', (req, res) => {
    res.render('capos', { caposArray: Object.values(allCapos) });
});
app.get('/returns', (req, res) => {
    res.render('returns');
});
app.get('/about', (req, res) => {
    res.render('about');
});
app.get('/flamenco-blog/blog-index', (req, res) => {
    res.render('flamenco-blog/blog-index');
});
app.get('/flamenco-blog/flamenco-palos', (req, res) => {
    res.render('flamenco-blog/flamenco-palos');
});
app.get('/flamenco-blog/what-does-flamenco-mean', (req, res) => {
    res.render('flamenco-blog/what-does-flamenco-mean');
});
app.get('/flamenco-blog/spanish-guitar', (req, res) => {
    res.render('flamenco-blog/spanish-guitar');
});
app.get('/flamenco-blog/paco-de-lucia-timeline', (req, res) => {
    // title = "The Spanish Flamenco Guitar"
    res.render('flamenco-blog/paco-de-lucia-timeline');
});
app.get('/flamenco-blog/best-nylon-strings-for-flamenco-guitar', (req, res) => {
    // title = "The Spanish Flamenco Guitar"
    res.render('flamenco-blog/best-nylon-strings-for-flamenco-guitar');
});
app.get('/what-is-flamenco', (req, res) => {
    res.render('what-is-flamenco');
});
app.get('/spanish-guitar', (req, res) => {
    var title = "The Spanish Flamenco Guitar"
    res.render('spanish-guitar', { title: title });
});
app.get('/flamenco-blog/list-all-flamenco-blog-posts', (req, res) => {

    db.collection('flamenco-blog').get()
        .then((snapshot) => {
            let blogArr = [];

            snapshot.forEach((doc) => {
                // let id = doc.id;
                // let h1Title = doc.data().h1Title;
                blogArr.push({ 'id': doc.id , 'h1Title': doc.data().h1Title})
                // console.log(doc.id, '=>', doc.data());
            });
            return blogArr
        })
        .then((blogArr) => res.render('flamenco-blog/list-all-flamenco-blog-posts', { blogArr: blogArr }))
        .catch((err) => {
            console.log('Error getting documents', err);
        });


});
app.get('/flamenco-blog/show/:id', (req, res) => {
    db.collection('flamenco-blog').doc(req.params.id).get()
    .then( doc => {
        res.render('flamenco-blog/show-flamenco-blog-item', { blog: doc.data() });
    })
    .catch(err => {
        console.log('Error getting document', err);
      });
    
});
app.get('/create-new-user', (req, res) => {
    res.render('create-new-user');
});
app.post('/create-new-user', (req, res) => {
    // console.log(req.body)
    // const auth = firebase.auth();
    const signupEmail = req.body.signupEmail;
    const signupPassword = req.body.signupPassword;
    firebase.auth()
        .createUserWithEmailAndPassword(signupEmail, signupPassword)
        .then(() => {
            res.redirect('/')
        })
        .catch(e => console.log(e.message));

    // firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
    //     // Handle Errors here.
    //     var errorCode = error.code;
    //     var errorMessage = error.message;
    //     res.send('Sorry please read this error',{ errorCode, errorMessage });
    //   });
});
app.get('/getLogin', (req, res) => {
    res.render('login', { showLogOutBtn: false });
});
// app.use(isAuthenticated.isAuthenticated);
// dont need auth middleware because page will only render if logged in
app.post('/admin/loginto-flamenco-admin', (req, res) => {

    const loginEmail = req.body.loginEmail;
    const loginPassword = req.body.loginPassword;
    firebase.auth().signInWithEmailAndPassword(loginEmail, loginPassword)
        .then(function () {
            return res.render('admin/flamenco-admin', { showLogOutBtn: true });
        })
        .catch(e => res.send(e.message));

});
app.get('/admin/flamenco-admin', isAuthenticated, (req, res) => {

    res.render('admin/flamenco-admin', { showLogOutBtn: true });
})
app.get('/admin/list-all-flamenco-blog-posts', isAuthenticated, (req, res) => {

    db.collection('flamenco-blog').get()
        .then((snapshot) => {
            let blogArr = [];

            snapshot.forEach((doc) => {
                let id = doc.id;
                // let h1Title = doc.data().h1Title;
                blogArr.push({ 'id': id })
                // console.log(doc.id, '=>', doc.data());
            });
            return blogArr
        })
        .then((blogArr) => res.render('admin/list-all-flamenco-blog-posts', { blogArr: blogArr }))
        .catch((err) => {
            console.log('Error getting documents', err);
        });


});
app.get('/admin/create-flamenco-blog-post', isAuthenticated, (req, res) => {
    res.render('admin/create-flamenco-blog-post');
});
app.post('/admin/create-flamenco-blog-post', isAuthenticated, (req, res) => {
    let docRef = db.collection('flamenco-blog').doc(req.body.seoFriendlyTitle);
    docRef.set({
        h1Title: req.body.h1Title,
        seoFriendlyTitle: req.body.seoFriendlyTitle,
        headerImg: req.body.headerImg,
        heading1: req.body.heading1,
        paragraph1: req.body.paragraph1,
        heading2: req.body.heading2,
        paragraph2: req.body.paragraph2,
        heading3: req.body.heading3,
        paragraph3: req.body.paragraph3,
        heading4: req.body.heading4,
        paragraph4: req.body.paragraph4,
        heading5: req.body.heading5,
        paragraph5: req.body.paragraph5
    });
    res.redirect('/admin/list-all-flamenco-blog-posts');
});
app.post('/admin/update-flamenco-blog-post/:id', isAuthenticated, (req, res) => {
    db.collection('flamenco-blog').doc(req.params.id).delete();
    let docRef = db.collection('flamenco-blog').doc(req.body.seoFriendlyTitle);
    docRef.set({
        h1Title: req.body.h1Title,
        seoFriendlyTitle: req.body.seoFriendlyTitle,
        headerImg: req.body.headerImg,
        heading1: req.body.heading1,
        paragraph1: req.body.paragraph1,
        heading2: req.body.heading2,
        paragraph2: req.body.paragraph2,
        heading3: req.body.heading3,
        paragraph3: req.body.paragraph3,
        heading4: req.body.heading4,
        paragraph4: req.body.paragraph4,
        heading5: req.body.heading5,
        paragraph5: req.body.paragraph5
    })
    .then(()=> res.redirect('/admin/list-all-flamenco-blog-posts'))
    
});
app.get('/admin/edit-flamenco-blog-post/:id', isAuthenticated, (req, res) => {
    let post;
    let id;
    db.collection('flamenco-blog').get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                if (doc.id === req.params.id) {
                    post = doc.data();
                    id = doc.id;
                    res.render('admin/edit-flamenco-blog-post', { id: id, post: post })
                }
            });
        })
        .catch((err) => {
            console.log('Error getting documents', err);
            res.send(err)
        });
});
app.post('/admin/edit-flamenco-blog-post/:id', isAuthenticated, (req, res) => {
    let post;
    db.collection('flamenco-blog').get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                if (doc.id === req.params.id) {
                    post = doc.data();
                    res.render('admin/edit-flamenco-blog-post', { post: post })
                }
            });
        })
        .catch((err) => {
            console.log('Error getting documents', err);
            res.send(err)
        });
});
app.post('/logout', (req, res) => {
    firebase.auth().signOut()
        .then(function () {
            console.log('logged out successful')
            return res.redirect('/')
        })
        .catch(function (error) {
            // An error happened.
            console.log(error)
            res.send(error)
        });

});
// app.get('/flamenco-admin', (req, res) => {
//     res.render('flamenco-admin',{ showLogOutBtn:true });
// });
app.post('/csp', (req, res) => {
    // use date as file name to know when error occured 
    const date = new Date().toISOString();
    if (req.body) {
        const cspObj = JSON.stringify(req.body)
        fs.appendFile(path.join(__dirname, 'csp', date), cspObj, (err) => {
            if (err) throw err;
        });

    } else {
        fs.appendFile(path.join(__dirname, 'csp', date), 'CSP Violation: No data received!', (err) => {
            if (err) throw err;
        });
    }
    res.status(204).end();
})
// for certificate transparancy header reporting uri . logs any errors
app.post('/expect_ct_errors', (req, res) => {
    // use date as file name to know when error occured 
    const date = new Date().toISOString();
    if (req.body) {
        const cspObj = JSON.stringify(req.body)
        fs.appendFile(path.join(__dirname, 'expect_ct_header_errors', date), cspObj, (err) => {
            if (err) throw err;
        });

    } else {
        fs.appendFile(path.join(__dirname, 'expect_ct_header_errors', date), 'CSP Violation: No data received!', (err) => {
            if (err) throw err;
        });
    }
    res.status(204).end()
})
app.get('/site-map', (req, res) => {
    res.render('site-map');
});
app.get('/*', (req, res) => {

    res.render('index');
});
// Object.values() this gets the value of objects and puts them in an array 
// Object.keys() gets keys and puts the in an array
// Object.entries(obj) makes array of key value pairs
app.listen(port);
