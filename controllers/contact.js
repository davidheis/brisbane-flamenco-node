const request = require('request');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env['SENDGRID_API_KEY']);

exports.sendContactPageEmail = (req, res, next) => {
    // send captcha to get true or false for verification
    request.post(`https://www.google.com/recaptcha/api/siteverify?secret=6LdkbssUAAAAAJRmRLYCgLpS5TfbD552Tq4yFJg8&response=${req.body['g-recaptcha-response']}`,
        (err, response, body) => {
            if (err) {
                return console.log('error', err);
            }
            // returns a string, so make it an object
            const captchaboolean = JSON.parse(body).success;

            if (captchaboolean === false) {
                //    if captcha is false, return to contact page with captchaboolean = false to display flash message 'click the captcha'
                res.render('contact', { captchaboolean: captchaboolean });
            }
            if (captchaboolean === true) {
                // send using sendgrid 
                const msg = {
                    to: 'dheis24@gmail.com',
                    from: req.body.email,
                    subject: `${req.body.subject} - from flamenco site`,
                    text: req.body.message,
                    html: req.body.message,
                };
                sgMail.send(msg)
                    .then(() => { res.redirect('/') })
                    .catch(err => console.log(err))
            }
        });
}