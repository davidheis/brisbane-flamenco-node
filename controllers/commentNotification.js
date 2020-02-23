const request = require('request');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env['SENDGRID_API_KEY']);

exports.commentNotification = (req, res, next) => {

    const msg = {
        to: 'info@brisbaneflamenco.com.au',
        from: 'info@brisbaneflamenco.com.au',
        subject: `Comment Notification - from flamenco site`,
        text: `${req.params.blogId} ${req.body.blogComment}`,
        html: `${req.params.blogId} <p>${req.body.blogComment}</p>`,
    };
    sgMail.send(msg)
        .then(() => {
            next();
        })
        .catch(error => res.render('admin/error', { error: error }))
}
