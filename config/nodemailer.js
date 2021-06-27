const nodemailer = require("nodemailer");
const config = require('config')

const user = config.get('user');
const pass = config.get('pass');

const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: user,
        pass: pass,
    },
});

module.exports.sendConfirmationEmail = (name, email, confirmationCode) => {
    console.log("Check");
    transport.sendMail({
        from: user,
        to: email,
        subject: "Please confirm your account",
        html: `<h1>Email Confirmation</h1>
        <h2>Hello ${name}</h2>
        <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
        <a href=http://127.0.0.1:5000/api/auth/confirm/${confirmationCode}> Click here</a>
        </div>`,
    }).catch(err => console.log(err));
};

module.exports.sendResetPasswordEmail = (name, email, confirmationCode) => {
    console.log("Check");
    transport.sendMail({
        from: user,
        to: email,
        subject: "Please reset your password",
        html: `<h1>Reset Password</h1>
        <h2>Hello ${name}</h2>
        <p>Please confirm your email by clicking on the following link and reset your password</p>
        <a href=http://127.0.0.1:5000/api/auth/reset/${confirmationCode}> Click here</a>
        </div>`,
    }).catch(err => console.log(err));
};

