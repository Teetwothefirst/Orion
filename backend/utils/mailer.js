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
        return false;
    }
};

const sendBugReportEmail = async (data) => {
    const { user, description, deviceInfo, isCrash, stackTrace } = data;
    const type = isCrash ? 'CRASH REPORT' : 'BUG REPORT';

    // Fallback to SMTP_USER if SUPPORT_EMAIL is not set
    const recipient = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;

    const mailOptions = {
        from: `"Orion ${type}" <${process.env.SMTP_USER}>`,
        to: recipient,
        subject: `[${type}] ${description ? description.substring(0, 50) : 'No Description'}`,
        html: `
            <h3>${type}</h3>
            <p><strong>User:</strong> ${user || 'Anonymous'}</p>
            <p><strong>Description:</strong> ${description || 'No description provided'}</p>
            <p><strong>Device Info:</strong></p>
            <pre>${JSON.stringify(deviceInfo, null, 2)}</pre>
            ${isCrash ? `
                <p><strong>Stack Trace:</strong></p>
                <pre style="background: #f4f4f4; padding: 10px; border: 1px solid #ddd;">${stackTrace || 'No stack trace provided'}</pre>
            ` : ''}
            <p><em>Sent via Orion Support System</em></p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`${type} sent to ${recipient}`);
        return { success: true };
    } catch (error) {
        console.error(`Error sending ${type.toLowerCase()}:`, error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendResetEmail, sendPasswordChangedEmail, sendBugReportEmail };
