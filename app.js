require('dotenv').config({ path: __dirname + '/.env' })
const path = require('path');
const port = 3003;
const express = require('express');
const bodyParser = require('body-parser');
const contactsController = require('./controllers/contact')
const commentNotification = require('./controllers/commentNotification').commentNotification
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
const isAdmin = require('./middleware/isAdmin').isAdmin;
const isLoggedIn = require('./middleware/isLoggedIn').isLoggedIn;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(isLoggedIn);

app.set('view engine', 'ejs');
app.set('views', 'views');

app.post('/contact', contactsController.sendContactPageEmail);
app.get('/contact', (req, res) => {
    res.render('contact', { captchaboolean: true, currentUser: req.user });
});
app.get('/capos', (req, res) => {
    res.render('capos', { caposArray: Object.values(allCapos), currentUser: req.user });
});
app.get('/returns', (req, res) => {
    res.render('returns', { currentUser: req.user });
});
app.get('/about', (req, res) => {
    res.render('about', { currentUser: req.user });
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
                    'data': doc.data()
                })
                // console.log(doc.id, '=>', doc.data());
            })
            return blogArr;
        })
        .then((blogArr) => res.render('flamenco-blog/list-all-flamenco-blog-posts', { blogArr: blogArr, currentUser: req.user }))
        .catch((err) => {
            console.log('Error getting documents', err);
            res.render('admin/error', { error: error, currentUser: req.user })
        });
});
app.get('/flamenco-blog/show/:id', (req, res) => {
    const currentUser = req.user || '';
    const flamencoBlogRef = db.collection('flamenco-blog').doc(req.params.id);
    flamencoBlogRef.get()
        .then(doc => {
            // blog must be approved, this protects article access from directly typing the url
            if (doc.data().isApproved === 'true') {
                // now get comments
                flamencoBlogRef.collection('comments').orderBy('dateCreated', 'desc').get()
                    .then((snapshot) => {
                        let commentsArr = [];
                        snapshot.forEach((doc) => {
                            const comment = {
                                dateCreated: doc.data().dateCreated,
                                authorUid: doc.data().authorUid,
                                authorDisplayName: doc.data().authorDisplayName,
                                message: doc.data().message
                            }
                            commentsArr.push(comment)
                        })
                        return commentsArr;
                    }).then(commentsArr => {
                        res.render('flamenco-blog/show-flamenco-blog-item', {
                            blogId: doc.id,
                            blog: doc.data(),
                            currentUser: currentUser,
                            commentsArr: commentsArr
                        });
                    })
            } else {
                res.redirect('/flamenco-blog/list-all-flamenco-blog-posts');
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
            res.render('admin/error', { error: error, currentUser: req.user })
        });
});

app.get('/admin/flamenco-admin', isAdmin, (req, res) => {
    if (req.user !== '') {
        res.render('admin/flamenco-admin', {
            showLogOutBtn: true,
            currentUser: req.user
        });
    } else {
        res.redirect('/getLogin');
    }

})
app.get('/admin/list-all-flamenco-blog-posts', isAdmin, (req, res) => {
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
        .then((blogArr) => res.render('admin/list-all-flamenco-blog-posts', { blogArr: blogArr, currentUser: req.user }))
        .catch((err) => {
            console.log('Error getting documents', err);
            res.render('admin/error', { error: error, currentUser: req.user })
        });
});
app.get('/admin/create-flamenco-blog-post', isAdmin, (req, res) => {
    res.render('admin/create-flamenco-blog-post', { currentUser: req.user });
});
app.post('/admin/create-flamenco-blog-post', isAdmin, (req, res) => {
    var user = req.user;
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
app.post('/admin/update-flamenco-blog-post/:id', isAdmin, (req, res) => {
    // db.collection('flamenco-blog').doc(req.params.id).delete();
    let docRef = db.collection('flamenco-blog').doc(req.params.id);
    // console.log(req.body.dateCreated.toLocaleDateString())
    docRef.update({
        // authorDisplayName: req.body.authorDisplayName,
        // authorUid: req.body.authorUid,
        isApproved: false,
        h1Title: req.body.h1Title,
        // seoFriendlyTitle: req.body.seoFriendlyTitle,
        // headerImgUrl: req.body.headerImgUrl,
        // headerImgWidth: req.body.headerImgWidth,
        // headerImgHeight: req.body.headerImgHeight,
        keywords: req.body.keywords,
        description: req.body.description,
        // dateCreated: req.body.dateCreated,
        // dateCreatedHumanReadable: new Date(req.body.dateCreated).toDateString(),
        dateUpdatedHumanReadable: new Date().toDateString(),
        dateUpdated: new Date().toISOString(),
        html: req.body.html
    })
        .then(() => res.redirect('/admin/list-all-flamenco-blog-posts'))
});
app.get('/admin/upload-imgs-flamenco-blog-post/:id', isAdmin, (req, res) => {
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
                    headerImgHeight: headerImgHeight,
                    currentUser: req.user
                });
            } else {
                console.log('No such document!');
                res.render('admin/error', { error: { message: 'No such document' }, currentUser: req.user })
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
            res.render('admin/error', { error: error, currentUser: req.user })
        });
});
app.post('/admin/upload-imgs-flamenco-blog-post/:id', isAdmin, upload.single('headerImg'), (req, res) => {
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
                headerImgUrl: `https://brisbaneflamenco.com.au/flamenco_blog/${fileOriginalname}`,
                isApproved: 'false',
                headerImgWidth: req.body.headerImgWidth,
                headerImgHeight: req.body.headerImgHeight
            })
                .then(() => res.redirect('/admin/list-all-flamenco-blog-posts'))
        })
        .catch(err => {
            console.log('Error getting document', err);
            res.render('admin/error', { error: error, currentUser: req.user })
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
app.post('/admin/delete-flamenco-blog-post/:id', isAdmin, (req, res) => {

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
            // docRef.collection('comments')
            // comments collection wont be deleted, can see them in firebase and delete manually
            docRef.delete()
                .then(() => res.redirect('/admin/list-all-flamenco-blog-posts'));
        })


});
app.post('/admin/approve-flamenco-blog-post/:id', isAdmin, (req, res) => {
    db.collection('flamenco-blog').doc(req.params.id).update({ isApproved: req.body.isApproved })
        .then(() => res.redirect('/admin/list-all-flamenco-blog-posts'));

});
app.get('/admin/edit-flamenco-blog-post/:id', isAdmin, (req, res) => {
    db.collection('flamenco-blog').get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                if (doc.id === req.params.id) {
                    let post = doc.data();
                    let id = doc.id;
                    res.render('admin/edit-flamenco-blog-post', { id: id, post: post, currentUser: req.user })
                }
            });
        })
        .catch((err) => {
            console.log('Error getting documents', err);
            res.render('admin/error', { error: error, currentUser: req.user })
        });
});
app.post('/blog/comment/:blogId', isAuthenticated, commentNotification, (req, res) => {
    var user = req.user;
    // var userId = req.params.userId;
    var blogId = req.params.blogId;
    // const userDoc = db.collection('users').doc(user.uid);
    const blogDoc = db.collection('flamenco-blog').doc(blogId);
    blogDoc.collection('comments').add({
        message: req.body.blogComment,
        authorUid: user.uid,
        authorDisplayName: user.displayName,
        dateCreated: new Date().toISOString(),
        dateCreatedHumanReadable: new Date().toGMTString()
    })
        .then(() => {
            res.redirect('/flamenco-blog/show/' + blogId)
        })
        .catch(function (error) {
            res.render('admin/error', { error: error, currentUser: req.user });
        });
    // userDoc.get()
    // .then(doc => {
    //     const user = doc.data();
    //     res.render('admin/userProfile', { currentUser: user })
    // })

});
app.get('/admin/userProfile', isAuthenticated, (req, res) => {
    var user = req.user;

    const userDoc = db.collection('users').doc(user.uid);
    userDoc.get()
        .then(doc => {
            const user = doc.data();
            res.render('admin/userProfile', { currentUser: user })
        })

});
app.post('/admin/userProfile', isAuthenticated, (req, res) => {
    var user = req.user;
    const userDoc = db.collection('users').doc(user.uid);
    user.updateProfile({
        displayName: req.body.displayName
    }).then(function () {
        // update the db user
        userDoc
            .update({
                displayName: req.body.displayName
            })
        res.redirect('/admin/userProfile')
    }).catch(function (error) {
        res.render('admin/error', { error: error, currentUser: req.user });
    });
});
app.post('/admin/upload-profile-img/:id', isAuthenticated, upload.single('profileImg'), (req, res) => {
    // need to get image name to pass to google bucket to delete before uploading new image
    let docRef = db.collection('users').doc(req.params.id);
    // multer gets new file
    var file = req.file;
    var fileOriginalname = Math.round(Math.random() * 10000) + file.originalname;
    // for naming new file so theres no duplicates
    // let randomNumber = Math.round(Math.random()*1000);
    // make flamenco_blog directory if first time
    if (!fs.existsSync('./uploads/users/')) {
        fs.mkdirSync('./uploads/users/');
    }
    docRef.get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
            } else {
                return doc.data().profileImg;
            }
        })
        .then(profileImg => {
            // this image was uploaded from the previous image upload, get image path for deletion
            const filesOldpath = path.join(__dirname, 'uploads', 'users', `${profileImg}`);
            // check old image exists otherwise errors out 
            if (fs.existsSync(filesOldpath)) {
                // delete old image
                fs.unlink(filesOldpath, (err) => {
                    if (err) throw err;
                });
            }
            // rename+sync so uploading renamed file name  with flamenco_blog folder added
            fs.renameSync(path.join(__dirname, 'uploads', file.filename), path.join(__dirname, 'uploads', 'users', `${fileOriginalname}`), (err) => {
                if (err) throw err;
            })
            // upload to firestore
            docRef.update({
                profileImg: fileOriginalname,
                profileImgUrl: `https://brisbaneflamenco.com.au/users/${fileOriginalname}`
            })
                .then(() => res.redirect('/admin/userProfile'))
        })
        .catch(err => {
            console.log('Error getting document', err);
            res.render('admin/error', { error: error, currentUser: req.user })
        });
});

app.get('/getLogin', (req, res) => {
    res.render('getLogin', { showLogOutBtn: false, currentUser: req.user });
});
app.get('/forgot-password', (req, res) => {
    res.render('admin/forgot-password', { currentUser: req.user });
});
app.post('/forgot-password', (req, res) => {
    var auth = firebase.auth();
    var emailAddress = req.body.loginEmail;
    
    auth.sendPasswordResetEmail(emailAddress).then(function() {
      res.redirect('/getLogin');
    }).catch(function(error) {
        res.render('admin/error', { error: error, currentUser: req.user })
    });
    

});
// dont need auth middleware because page will only render if logged in
app.post('/admin/loginto-flamenco-admin', (req, res) => {
    const loginEmail = req.body.loginEmail;
    const loginPassword = req.body.loginPassword;
    const userCollection = db.collection('users');
    const firebaseAuth = firebase.auth();
    firebaseAuth.signInWithEmailAndPassword(loginEmail, loginPassword)
        .then(function () {
            const firebaseCurrentUser = firebaseAuth.currentUser;
            const firebaseCurrentUserUid = firebaseCurrentUser.uid;
            const firebaseCurrentUserDoc = userCollection.doc(firebaseCurrentUserUid);
            // 1st check if email is verified on auth side of firebase to continue

            if (firebaseCurrentUser.emailVerified) {
                firebaseCurrentUserDoc.get()
                    .then((user) => {
                        const userDoc = user.data();
                        // then 2nd check if emailVerified is written in db to avoid writing everytime to db
                        if (userDoc.emailVerified) {
                            // console.log(req.user)
                            return res.render('admin/flamenco-admin', {
                                showLogOutBtn: true,
                                currentUser: userDoc
                            })
                        } else {
                            // else means its the first time logging in so write to db that email is verified
                            firebaseCurrentUserDoc.update({ emailVerified: true })
                                .then(() => res.render('admin/flamenco-admin', {
                                    showLogOutBtn: true,
                                    currentUser: userDoc
                                }))
                        }
                    }).catch(e => res.render('admin/error', { error: error, currentUser: req.user }))
            } else {
                firebaseAuth.signOut()
                    .then(function () {
                        res.render('admin/confirm-signup', { currentUser: req.user });
                        // return res.redirect('/getLogin')
                    })
                    .catch(function (error) {
                        // An error happened.
                        console.log(error)
                        res.render('admin/error', { error: error, currentUser: req.user })
                    });
            }
        })
        .catch(error => {
            // loggin in with wrong email
            console.log(error.message)
            res.render('admin/error', { error: error, currentUser: req.user })
        });
});
app.get('/create-new-user', (req, res) => {
    res.render('admin/create-new-user', { currentUser: req.user });
});
app.post('/create-new-user', (req, res) => {
    // console.log(req.body)
    // const auth = firebase.auth();
    var auth = firebase.auth()
    const signupEmail = req.body.signupEmail;
    const signupPassword = req.body.signupPassword;
    const displayName = req.body.displayName;
    auth
        .createUserWithEmailAndPassword(signupEmail, signupPassword)
        .then(() => {
            var user = auth.currentUser;
            user.updateProfile({
                displayName: displayName
            })
            // create user in db
            db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                emailVerified: false,
                displayName: displayName,
                isAdmin: false,
                dateCreated: new Date().toISOString(),
                dateCreatedHumanReadable: new Date().toDateString()
            })
            // verify email 
            user.sendEmailVerification().then(function () {
                // sign out and wait for user to verify email
                firebase.auth().signOut()
                    .then(function () {
                        res.render('admin/confirm-signup', { currentUser: req.user })
                        // return res.redirect('/getLogin')
                    })
                    .catch(function (error) {
                        // An error happened.
                        console.log(error)
                        res.render('admin/error', { error: error, currentUser: req.user })
                    });
            }).catch(function (error) {
                res.render('admin/error', { error: error, currentUser: req.user })
            });
        })
        .catch(error => res.render('admin/error', { error: error, currentUser: req.user }));
});
app.post('/logout', isAuthenticated, (req, res) => {
    firebase.auth().signOut()
        .then(function () {
            return res.redirect('/getLogin')
        })
        .catch(function (error) {
            // An error happened.
            console.log(error)
            res.render('admin/error', { error: error, currentUser: req.user })
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
            res.render('admin/error', { error: error })
        });
});
app.get('/*', (req, res) => {
    db.collection('flamenco-blog').where('isApproved', '==', 'true').orderBy('dateCreated', 'desc').get()
        .then((snapshot) => {
            let blogArr = [];
            snapshot.forEach((doc) => {
                // let id = doc.id;
                // let h1Title = doc.data().h1Title; 
                blogArr.push({
                    'id': doc.id,
                    'data': doc.data()
                })
                // console.log(doc.id, '=>', doc.data());
            })
            return blogArr;
        })
        .then((blogArr) => res.render('index', { blogArr: blogArr, currentUser: req.user }))
        .catch((err) => {
            console.log('Error getting documents', err);
            res.render('admin/error', { error: error })
        });
});
// Object.values() this gets the value of objects and puts them in an array 
// Object.keys() gets keys and puts the in an array
// Object.entries(obj) makes array of key value pairs
app.listen(port);
