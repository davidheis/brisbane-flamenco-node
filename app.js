require('dotenv').config({path: __dirname + '/.env'})
const path = require('path');
const port = 3003;
const express = require('express');
const bodyParser = require('body-parser');
// const request = require('request');
const contactsController = require('./controllers/contact')

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', 'views');


app.post('/contact', contactsController.sendContactPageEmail);

app.get('/contact', (req, res) => {
   res.render('contact');
});

app.get('*', (req, res) => {
    res.render('index');
})


app.listen(port);