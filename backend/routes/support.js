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

        const success = await sendBugReportEmail({
            user,
            description,
            deviceInfo,
            isCrash,
            stackTrace
        });

        if (success) {
            res.status(200).json({ message: 'Report submitted successfully. Thank you!' });
        } else {
            res.status(500).json({ message: 'Failed to send report. Please try again later.' });
        }
    } catch (error) {
        console.error('Error in /support/report-bug:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
