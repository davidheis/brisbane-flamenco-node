require('dotenv').config({ path: __dirname + '/.env' })
const path = require('path');
const port = 3003;
const express = require('express');
const bodyParser = require('body-parser');
// const request = require('request');
const contactsController = require('./controllers/contact')



const fs = require('fs');

let rawCapodata = fs.readFileSync('database/shop.json');
let allCapos = JSON.parse(rawCapodata);


// // Get a reference to the database service
// const firebase = require('firebase');
// const firebaseConfigFile = require('./firebaseConfig')
// // Initialize Firebase
// firebase.initializeApp(firebaseConfigFile.firebaseConfigObject);
// // end firebase

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', 'views');


app.post('/contact', contactsController.sendContactPageEmail);

app.get('/contact', (req, res) => {
    res.render('contact');
});

// app.get('/addCapo', (req, res) => {
//     res.render('addCapo');
// });

// app.post('/addCapo', (req, res) => {

//     fs.
//     console.log(req.body)

//     res.redirect('index');

// });

app.get('*', (req, res) => {
// Object.values() this gets the value of objects and puts them in an array 
// Object.keys() gets keys and puts the in an array
// Object.entries(obj) makes array of key value pairs
    res.render('index', { caposArray: Object.values(allCapos) })
});
app.listen(port);





