require('dotenv').config({ path: __dirname + '/.env' })
const path = require('path');
const port = 3003;
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const webhoseio = require('webhoseio');
const contactsController = require('./controllers/contact')
const webhoseioClient = webhoseio.config({ token: '592afc32-9f3a-4a8b-9ed2-027d06228fae' });
// require('bootstrap')
const fs = require('fs');
// const helmet = require('helmet')
let rawCapodata = fs.readFileSync('database/shop.json');
let allCapos = JSON.parse(rawCapodata);

// // Get a reference to the database service
// const firebase = require('firebase');
// const firebaseConfigFile = require('./firebaseConfig')
// // Initialize Firebase
// firebase.initializeApp(firebaseConfigFile.firebaseConfigObject);
// // end firebase

const app = express();
// app.use(helmet())
app.use(bodyParser.json({
    type: ['json', 'application/csp-report', 'application/json']
}))

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
app.get('/blog/flamenco-palos', (req, res) => {
    res.render('blog/flamenco-palos');
});
app.get('/blog/what-does-flamenco-mean', (req, res) => {
    res.render('blog/what-does-flamenco-mean');
});
app.get('/blog/spanish-guitar', (req, res) => {
    title = "The Spanish Flamenco Guitar"
    res.render('blog/spanish-guitar', { title: title });
});
app.get('/blog/paco-de-lucia', (req, res) => {
    title = "The Spanish Flamenco Guitar"
    res.render('blog/paco-de-lucia');
});
app.get('/what-is-flamenco', (req, res) => {
    res.render('what-is-flamenco');
});
app.get('/spanish-guitar', (req, res) => {
    title = "The Spanish Flamenco Guitar"
    res.render('spanish-guitar', { title: title });
});
// app.get('/flamenco-news', (req, res) => {
//     const query_params = {
//         "q": "thread.url:https* language:english thread.title:flamenco spam_score:<0.4 site_type:news",
//         "ts": "1579180138371",
//         "sort": "published",
//         "size": "50",
//         "format": "json"
//     }
//     webhoseioClient.query('filterWebContent', query_params)
//         .then(newsBody => {
//             res.render('flamenco-news', { newsBody: newsBody.posts })
//         });
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
    res.status(204).end()
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
app.get('/*', (req, res) => {
    res.render('index')
    // const query_params = {
    //     "q": "thread.url:https* language:english thread.title:flamenco spam_score:<0.4 site_type:news",
    //     "ts": "1579180138371",
    //     "sort": "published",
    //     "size": "5",
    //     "format": "json"
    // }
    // webhoseioClient.query('filterWebContent', query_params)
    //     .then(newsBody => {
    //         res.render('index', { newsBody: newsBody.posts })
    //     });
});
// Object.values() this gets the value of objects and puts them in an array 
// Object.keys() gets keys and puts the in an array
// Object.entries(obj) makes array of key value pairs
app.listen(port);





