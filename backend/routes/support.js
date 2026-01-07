const express = require('express');
const router = express.Router();
const { sendBugReportEmail } = require('../utils/mailer');

// @route   POST /support/report-bug
// @desc    Report a bug or crash
// @access  Public (so users can report issues even if they can't login)
router.post('/report-bug', async (req, res) => {
    try {
        const { user, description, deviceInfo, isCrash, stackTrace } = req.body;

        if (!isCrash && !description) {
            return res.status(400).json({ message: 'Description is required for bug reports.' });
        }

        // Check if SMTP is configured
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('SMTP is not configured on the server.');
            return res.status(503).json({
                message: 'Support system is temporarily unavailable (SMTP not configured).',
                error: 'Server environment variables missing.'
            });
        }

        const result = await sendBugReportEmail({
            user,
            description,
            deviceInfo,
            isCrash,
            stackTrace
        });

        if (result.success) {
            res.status(200).json({ message: 'Report submitted successfully. Thank you!' });
        } else {
            console.error('Bug report email failed:', result.error);
            res.status(500).json({
                message: 'Failed to send report. Our engineers have been notified.',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in /support/report-bug:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
