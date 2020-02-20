require('dotenv').config({ path: __dirname + '/.env' })
const path = require('path');
const port = 3003;
const express = require('express');
const bodyParser = require('body-parser');
const contactsController = require('./controllers/contact')
const fs = require('fs');
let rawCapodata = fs.readFileSync('database/shop.json');
let allCapos = JSON.parse(rawCapodata);
var firebase = require("firebase/app");
var multer = require('multer')
var upload = multer({ dest: 'uploads/' })
// Initialize Firebase
const firebaseConfig = require(path.join(__dirname, 'firebaseConfig')).firebaseConfig
firebase.initializeApp(firebaseConfig);
var admin = require("firebase-admin");
var serviceAccount = require(path.join(__dirname, 'firebase-admin-key.json'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://brisbaneflamenco-5aee0.firebaseio.com",
    // storageBucket: "brisbaneflamenco-5aee0.appspot.com"
});
let db = admin.firestore();
// Imports the Google Cloud client library
// const { Storage } = require('@google-cloud/storage');
const app = express();
// app.use(helmet())
app.use(bodyParser.json({
    type: ['json', 'application/csp-report', 'application/json']
}))
const isAuthenticated = require('./middleware/isAuthenticated').isAuthenticated
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

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
app.get('/flamenco-blog/list-all-flamenco-blog-posts', (req, res) => {
    db.collection('flamenco-blog').where('isApproved', '==', 'true').orderBy('dateCreated', 'desc').get()
        .then((snapshot) => {
            let blogArr = [];
            snapshot.forEach((doc) => {
                // let id = doc.id;
                // let h1Title = doc.data().h1Title;
                blogArr.push({
                    'id': doc.id,
                    'h1Title': doc.data().h1Title,
                    'headerImgName': doc.data().headerImgName,
                    'dateCreatedHumanReadable': doc.data().dateCreatedHumanReadable
                })
                // console.log(doc.id, '=>', doc.data());
            })
            return blogArr;
        })
        .then((blogArr) => res.render('flamenco-blog/list-all-flamenco-blog-posts', { blogArr: blogArr }))
        .catch((err) => {
            console.log('Error getting documents', err);
        });
});
app.get('/flamenco-blog/show/:id', (req, res) => {
    // get environment url so when uploading images it works in prduction and local environment
    // need this protocol logic too because protocol doesnt get the 's' for secure https
    let protocol = 'https'
    let host = req.get('host');

    if (host === 'localhost:3003') {
        protocol = 'http';
    }
    db.collection('flamenco-blog').doc(req.params.id).get()
        .then(doc => {
            // blog must be approved, this protects article access from directly typing the url
            if (doc.data().isApproved === 'true') {
                res.render('flamenco-blog/show-flamenco-blog-item', {
                    blog: doc.data(),
                    protocol: protocol,
                    host: host
                });
            } else {
                res.redirect('/flamenco-blog/list-all-flamenco-blog-posts');
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
});
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
    // get logged in user from middleware
    const currentLoggedUserUid = req.user.uid;
    db.collection('flamenco-blog').orderBy('dateCreated', 'desc').get()
        .then((snapshot) => {
            let blogArr = [];
            snapshot.forEach((doc) => {
                let id = doc.id;
                let headerImgName = doc.data().headerImgName;
                let authorUid = doc.data().authorUid;
                let isApproved = doc.data().isApproved;
                let h1Title = doc.data().h1Title;
                let authorDisplayName = doc.data().authorDisplayName;
                let dateCreatedHumanReadable = doc.data().dateCreatedHumanReadable;
                blogArr.push({
                    'currentLoggedUserUid': currentLoggedUserUid,
                    'id': id,
                    'authorUid': authorUid,
                    'isApproved': isApproved,
                    'headerImgName': headerImgName,
                    'h1Title': h1Title,
                    'authorDisplayName': authorDisplayName,
                    'dateCreatedHumanReadable': dateCreatedHumanReadable
                })
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
    var user = firebase.auth().currentUser;
    let docRef = db.collection('flamenco-blog').doc(req.body.seoFriendlyTitle);
    docRef.set({
        authorDisplayName: user.displayName,
        authorUid: user.uid,
        isApproved: false,
        h1Title: req.body.h1Title,
        seoFriendlyTitle: req.body.seoFriendlyTitle,
        keywords: req.body.keywords,
        description: req.body.description,
        dateCreated: new Date().toISOString(),
        dateCreatedHumanReadable: new Date().toDateString(),
        html: req.body.html
    })
        .then(() => {
            res.redirect('/admin/list-all-flamenco-blog-posts');
        })
});
app.post('/admin/update-flamenco-blog-post/:id', isAuthenticated, (req, res) => {
    db.collection('flamenco-blog').doc(req.params.id).delete();
    let docRef = db.collection('flamenco-blog').doc(req.body.seoFriendlyTitle);
    // console.log(req.body.dateCreated.toLocaleDateString())
    docRef.set({
        authorDisplayName: req.body.authorDisplayName,
        authorUid: req.body.authorUid,
        isApproved: false,
        h1Title: req.body.h1Title,
        seoFriendlyTitle: req.body.seoFriendlyTitle,
        headerImgUrl: req.body.headerImgUrl,
        headerImgWidth: req.body.headerImgWidth,
        headerImgHeight: req.body.headerImgHeight,
        keywords: req.body.keywords,
        description: req.body.description,
        dateCreated: req.body.dateCreated,
        dateCreatedHumanReadable: new Date(req.body.dateCreated).toDateString(),
        dateUpdatedHumanReadable: new Date().toDateString(),
        dateUpdated: new Date().toISOString(),
        html: req.body.html
    })
        .then(() => res.redirect('/admin/list-all-flamenco-blog-posts'))
});
app.get('/admin/upload-imgs-flamenco-blog-post/:id', isAuthenticated, (req, res) => {
    // get call db current image name so i can pass it to post route and delete it before uploading new image
    let docRef = db.collection('flamenco-blog').doc(req.params.id);
    docRef.get()
        .then(doc => {
            if (doc.exists) {
                let headerImgName = doc.data().headerImgName;
                let headerImgWidth = doc.data().headerImgWidth;
                let headerImgHeight = doc.data().headerImgHeight;
                res.render('admin/upload-imgs', {
                    blogId: req.params.id,
                    headerImgName: headerImgName,
                    headerImgWidth: headerImgWidth,
                    headerImgHeight: headerImgHeight
                });
            } else {
                console.log('No such document!');
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
});
app.post('/admin/upload-imgs-flamenco-blog-post/:id', isAuthenticated, upload.single('headerImg'), (req, res) => {
    // need to get image name to pass to google bucket to delete before uploading new image
    let docRef = db.collection('flamenco-blog').doc(req.params.id);
    // multer gets new file
    var file = req.file;
    var fileOriginalname = Math.round(Math.random() * 10000) + file.originalname;
    // for naming new file so theres no duplicates
    // let randomNumber = Math.round(Math.random()*1000);
    // make flamenco_blog directory if first time
    if (!fs.existsSync('./uploads/flamenco_blog/')) {
        fs.mkdirSync('./uploads/flamenco_blog/');
    }
    docRef.get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
            } else {
                return doc.data().headerImgName;
            }
        })
        .then(headerImgName => {
            // this image was uploaded from the previous image upload, get image path for deletion
            const filesOldpath = path.join(__dirname, 'uploads', 'flamenco_blog', `${headerImgName}`);
            // check old image exists otherwise errors out 
            if (fs.existsSync(filesOldpath)) {
                // delete old image
                fs.unlink(filesOldpath, (err) => {
                    if (err) throw err;
                });
            }
            // rename+sync so uploading renamed file name  with flamenco_blog folder added
            fs.renameSync(path.join(__dirname, 'uploads', file.filename), path.join(__dirname, 'uploads', 'flamenco_blog', `${fileOriginalname}`), (err) => {
                if (err) throw err;
            })
            // upload to firestore
            docRef.update({
                headerImgName: fileOriginalname,
                headerImgUrl: `/flamenco_blog/${fileOriginalname}`,
                isApproved: 'false',
                headerImgWidth: req.body.headerImgWidth,
                headerImgHeight: req.body.headerImgHeight
            })
                .then(() => res.redirect('/admin/list-all-flamenco-blog-posts'))
        })
        .catch(err => {
            console.log('Error getting document', err);
        });
    // WHAT I NEEDED TO UPLOAD TO GOOGLE BUCKET

    // google bucket with bucket name and path to credentials
    //  const storage = new Storage('brisbaneflamenco-5aee0', path.join(__dirname, 'firebase-admin-key.json'));
    //  const bucketName = 'brisbaneflamenco-5aee0.appspot.com';
    // const imageExtension = path.extname(file.originalname);

    // const filesNewpath = path.join(__dirname, 'uploads', `${file.originalname}`);
    // async function deleteFile() {
    //     // Deletes the file from the bucket
    //     await storage
    //         .bucket(bucketName)
    //         .file(headerImgName)
    //         .delete();

    //     console.log(`gs://${bucketName}/${headerImgName} deleted.`);
    // }

    // deleteFile().catch(console.error);
    // storage.bucket(bucketName)
    //     .upload(filesNewpath, {
    //         gzip: true,
    //         cacheControl: 'no-cache'
    //     })
    //     .then(() => {
    // delete file from local system
    // fs.unlink(filesNewpath, (err) => {
    //     if (err) throw err;
    // });
    // upload to firestore

    // })
    // .catch(console.error);
});
app.post('/admin/delete-flamenco-blog-post/:id', isAuthenticated, (req, res) => {

    let docRef = db.collection('flamenco-blog').doc(req.params.id)
    // get header image name associated with document to delete too
    docRef.get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
            } else {
                return doc.data().headerImgName;
            }
        })
        .then(headerImgName => {
            const filesOldpath = path.join(__dirname, 'uploads', 'flamenco_blog', `${headerImgName}`);
            // check old image exists otherwise errors out 
            if (fs.existsSync(filesOldpath)) {
                // delete old image
                fs.unlink(filesOldpath, (err) => {
                    if (err) throw err;
                });
            }

            docRef.delete()
                .then(() => res.redirect('/admin/list-all-flamenco-blog-posts'));
        })


});
app.post('/admin/approve-flamenco-blog-post/:id', isAuthenticated, (req, res) => {
    db.collection('flamenco-blog').doc(req.params.id).update({ isApproved: req.body.isApproved })
        .then(() => res.redirect('/admin/list-all-flamenco-blog-posts'));

});
app.get('/admin/edit-flamenco-blog-post/:id', isAuthenticated, (req, res) => {
    db.collection('flamenco-blog').get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                if (doc.id === req.params.id) {
                    let post = doc.data();
                    let id = doc.id;
                    res.render('admin/edit-flamenco-blog-post', { id: id, post: post })
                }
            });
        })
        .catch((err) => {
            console.log('Error getting documents', err);
            res.send(err)
        });
});
app.get('/admin/userProfile', isAuthenticated, (req, res) => {
    var user = firebase.auth().currentUser;
    res.render('admin/userProfile', { user: user })
});
app.post('/admin/userProfile', isAuthenticated, (req, res) => {
    var user = firebase.auth().currentUser;
    user.updateProfile({
        displayName: req.body.displayName,
        photoURL: req.body.photoURL
    }).then(function () {
        res.redirect('/admin/userProfile')
    }).catch(function (error) {
        res.send(error);
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
});
app.get('/getLogin', (req, res) => {
    res.render('login', { showLogOutBtn: false });
});
app.post('/logout', isAuthenticated, (req, res) => {
    firebase.auth().signOut()
        .then(function () { 
            return res.redirect('/getLogin')
        })
        .catch(function (error) {
            // An error happened.
            console.log(error)
            res.send(error)
        });
});
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
app.get('/site-map.txt', (req, res) => {
    let sitemap = 'https://brisbaneflamenco.com.au/\nhttps://brisbaneflamenco.com.au/capos/\nhttps://brisbaneflamenco.com.au/contact/\nhttps://brisbaneflamenco.com.au/about/\nhttps://brisbaneflamenco.com.au/flamenco-blog/blog-index/\n';
    db.collection('flamenco-blog').where('isApproved', '==', 'true').orderBy('dateCreated', 'desc').get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                sitemap += `https://brisbaneflamenco.com.au/flamenco-blog/show/${doc.id}/\n`;
            })
            return sitemap;
        })
        .then((sitemap) => {
            res.type('.txt')
            res.send(sitemap)
        })
        .catch((err) => {
            console.log('Error getting documents', err);
        });
});
app.get('/*', (req, res) => {
    res.render('index');
});
// Object.values() this gets the value of objects and puts them in an array 
// Object.keys() gets keys and puts the in an array
// Object.entries(obj) makes array of key value pairs
app.listen(port);
