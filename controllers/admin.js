var express = require('express');
var router = express.Router();


// app.use(isAuthenticated.isAuthenticated);
// dont need auth middleware because page will only render if logged in
router.post('/admin/loginto-flamenco-admin', (req, res) => {

    const loginEmail = req.body.loginEmail;
    const loginPassword = req.body.loginPassword;
    firebase.auth().signInWithEmailAndPassword(loginEmail, loginPassword)
        .then(function () {
            return res.render('admin/flamenco-admin', { showLogOutBtn: true });
        })
        .catch(e => res.send(e.message));

});
router.get('/admin/flamenco-admin', isAuthenticated, (req, res) => {

    res.render('admin/flamenco-admin', { showLogOutBtn: true });
})
router.get('/admin/list-all-flamenco-blog-posts', isAuthenticated, (req, res) => {
    // get logged in user from middleware
   const currentLoggedUserUid = req.user.uid;
    db.collection('flamenco-blog').orderBy('dateCreated', 'desc').get()
        .then((snapshot) => {
            let blogArr = [];

            snapshot.forEach((doc) => {
                let id = doc.id;
                let authorUid = doc.data().authorUid;
                let isApproved = doc.data().isApproved;
                let h1Title = doc.data().h1Title;
                let authorDisplayName = doc.data().authorDisplayName;
                let dateCreatedHumanReadable = doc.data().dateCreatedHumanReadable;
                blogArr.push({ 'currentLoggedUserUid':currentLoggedUserUid, 'id': id, 'authorUid': authorUid, 'isApproved': isApproved, 'h1Title': h1Title, 'authorDisplayName': authorDisplayName, 'dateCreatedHumanReadable': dateCreatedHumanReadable })
                // console.log(doc.id, '=>', doc.data());
            });
            return blogArr
        })
        .then((blogArr) => res.render('admin/list-all-flamenco-blog-posts', { blogArr: blogArr }))
        .catch((err) => {
            console.log('Error getting documents', err);
        });


});
router.get('/admin/create-flamenco-blog-post', isAuthenticated, (req, res) => {
    res.render('admin/create-flamenco-blog-post');
});
router.post('/admin/create-flamenco-blog-post', isAuthenticated, (req, res) => {
    var user = firebase.auth().currentUser;
    let docRef = db.collection('flamenco-blog').doc(req.body.seoFriendlyTitle);
    docRef.set({
        authorDisplayName: user.displayName,
        authorUid: user.uid,
        isApproved: false,
        h1Title: req.body.h1Title,
        seoFriendlyTitle: req.body.seoFriendlyTitle,
        headerImg: req.file.originalname,
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
router.post('/admin/update-flamenco-blog-post/:id', isAuthenticated, (req, res) => {
    // db.collection('flamenco-blog').doc(req.params.id).delete();

    let docRef = db.collection('flamenco-blog').doc(req.body.seoFriendlyTitle);
    // console.log(req.body.dateCreated.toLocaleDateString())
    docRef.set({
        authorDisplayName: req.body.authorDisplayName,
        authorUid: req.body.authorUid,
        isApproved: false,
        h1Title: req.body.h1Title,
        seoFriendlyTitle: req.body.seoFriendlyTitle,
        headerImg: req.body.headerImg,
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
router.post('/admin/delete-flamenco-blog-post/:id', isAuthenticated, (req, res) => {
    db.collection('flamenco-blog').doc(req.params.id).delete()
        .then(() => res.redirect('/admin/list-all-flamenco-blog-posts'));

});
router.post('/admin/approve-flamenco-blog-post/:id', isAuthenticated, (req, res) => {
    db.collection('flamenco-blog').doc(req.params.id).update({ isApproved : req.body.isApproved })
        .then(() => res.redirect('/admin/list-all-flamenco-blog-posts'));

});
router.get('/admin/edit-flamenco-blog-post/:id', isAuthenticated, (req, res) => {


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
router.post('/admin/edit-flamenco-blog-post/:id', isAuthenticated, (req, res) => {
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
router.get('/admin/userProfile', isAuthenticated, (req, res) => {
    var user = firebase.auth().currentUser;
    res.render('admin/userProfile', { user: user })
});
router.post('/admin/userProfile', isAuthenticated, (req, res) => {
    var user = firebase.auth().currentUser;
    console.log(req.body)
    user.updateProfile({
        displayName: req.body.displayName,
        photoURL: req.body.photoURL
    }).then(function () {
        res.redirect('/admin/userProfile')
    }).catch(function (error) {
        res.send(error);
    });

});