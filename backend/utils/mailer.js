const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    // Force less strict checks for development environments
    tls: {
        rejectUnauthorized: false
    }
});

const sendResetEmail = async (to, token) => {
    const mailOptions = {
        from: `"Orion Chat" <${process.env.SMTP_USER}>`,
        to: to,
        subject: 'Password Reset Request',
        html: `
            <h3>Password Reset Request</h3>
            <p>You requested a password reset. Please use the following token:</p>
            <h2 style="color: #4A90E2;">${token}</h2>
            <p>This token is valid for 1 hour.</p>
            <p>If you did not request this, please ignore this email.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reset email sent to ' + to);
        return true;
    } catch (error) {
        console.error('Error sending reset email:', error);
        return false;
    }
};

const sendPasswordChangedEmail = async (to) => {
    const mailOptions = {
        from: `"Orion Chat" <${process.env.SMTP_USER}>`,
        to: to,
        subject: 'Password Changed Successfully',
        html: `
            <h3>Password Changed</h3>
            <p>Your password has been successfully changed.</p>
            <p>If you did not perform this action, please contact support immediately.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Success email sent to ' + to);
        return true;
    } catch (error) {
        console.error('Error sending success email:', error);
        // We generally don't block the UI if this notification fails, but good to log
        return false;
    }
};

module.exports = { sendResetEmail, sendPasswordChangedEmail };
