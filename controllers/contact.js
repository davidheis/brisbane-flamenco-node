
const cors = require('cors')({
    origin: true,
 });
 var aws = require('aws-sdk');
 
 // Provide the full path to your config.json file.
 // aws.config.loadFromPath(path.dirname('./config.json'));
 aws.config.loadFromPath('./aws-config.json');
 
 // Replace sender@example.com with your "From" address.
 // This address must be verified with Amazon SES.
 const sender = "David <dheis24@gmail.com>";
 
 // Replace recipient@example.com with a "To" address. If your account
 // is still in the sandbox, this address must be verified.
 const recipient = "davidheis@hotmail.com";
 
 // Specify a configuration set. If you do not want to use a configuration
 // set, comment the following variable, and the
 // ConfigurationSetName : configuration_set argument below.
 // const configuration_set = "ConfigSet";
 
 // The character encoding for the email.
 const charset = "UTF-8";
 
 // Create a new SES object.
 var ses = new aws.SES();


exports.sendContactPageEmail = (req, res, next) => {
        // The subject line for the email.
        const subject = "Contact page brisbaneflamenco ";

        const body_text = `
      Email: ${req.body.email}
      Name: ${req.body.name}
      Subject: ${req.body.subject}
      Message: ${req.body.message}
      -- email from brisbaneflamenco.com.au contact page.`;
    
        const body_html = `<html>
    <head></head>
    <body>
    
      <p>
      Email: ${req.body.email}<br>
      Name: ${req.body.name}<br>
      Subject: ${req.body.subject}<br>
      Message: ${req.body.message}<br>
      -- email from brisbaneflamenco.com.au contact page </p>
    </body>
    </html>`;
    
        var params = {
            Source: sender,
            Destination: {
                ToAddresses: [recipient]
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: charset
                },
                Body: {
                    Text: {
                        Data: body_text,
                        Charset: charset
                    },
                    Html: {
                        Data: body_html,
                        Charset: charset
                    }
                }
            }
            // ConfigurationSetName: configuration_set
        };
        // cors allows origin access, prevents no access errors
        return cors(req, res, () => {
            //Try to send the email.
           return ses.sendEmail(params, (err, data) => {
                // If something goes wrong, print an error message.
                if (err) {
                    console.log(err.message);
                    res.status(400).send(err.message);
                } else {
                    // console.log("Email sent! Message ID: ", data.MessageId);
                   //  res.status(200).render('index').end();
                   res.status(200).redirect('/'); 
                }
            });
        });
    
}