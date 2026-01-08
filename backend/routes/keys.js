const express = require('express');
const router = express.Router();
const db = require('../db');

// Register/Update Identity Key
router.post('/identity', (req, res) => {
    const { userId, publicKey, registrationId } = req.body;
    if (!userId || !publicKey || !registrationId) {
        return res.status(400).send('Missing required fields');
    }

    db.run(
        `INSERT INTO signal_identities (user_id, public_key, registration_id) 
         VALUES (?, ?, ?) 
         ON CONFLICT(user_id) DO UPDATE SET public_key=excluded.public_key, registration_id=excluded.registration_id`,
        [userId, publicKey, registrationId],
        function (err) {
            if (err) {
                // Handle SQLite which doesn't support ON CONFLICT(user_id) DO UPDATE in older versions 
                // but we can try a separate update if insert fails
                db.run(`UPDATE signal_identities SET public_key=?, registration_id=? WHERE user_id=?`,
                    [publicKey, registrationId, userId],
                    (updateErr) => {
                        if (updateErr) return res.status(500).send(updateErr.message);
                        res.send({ success: true });
                    }
                );
            } else {
                res.send({ success: true });
            }
        }
    );
});

// Upload PreKeys (Signed and One-Time)
router.post('/prekeys', (req, res) => {
    const { userId, signedPreKey, oneTimePreKeys } = req.body;
    // signedPreKey: { keyId, publicKey, signature }
    // oneTimePreKeys: [{ keyId, publicKey }]

    if (!userId || !signedPreKey) {
        return res.status(400).send('Missing required fields');
    }

    // Clear old prekeys first (optional, but keep it clean)
    db.run(`DELETE FROM signal_prekeys WHERE user_id = ?`, [userId], (err) => {
        if (err) return res.status(500).send(err.message);

        // Insert Signed PreKey
        db.run(
            `INSERT INTO signal_prekeys (user_id, key_id, public_key, signature, type) VALUES (?, ?, ?, ?, 'signed')`,
            [userId, signedPreKey.keyId, signedPreKey.publicKey, signedPreKey.signature],
            (err) => {
                if (err) return res.status(500).send(err.message);

                // Insert One-Time PreKeys
                if (oneTimePreKeys && oneTimePreKeys.length > 0) {
                    const placeholders = oneTimePreKeys.map(() => '(?, ?, ?, ?, ?)').join(',');
                    const params = [];
                    oneTimePreKeys.forEach(pk => {
                        params.push(userId, pk.keyId, pk.publicKey, null, 'one-time');
                    });

                    db.run(
                        `INSERT INTO signal_prekeys (user_id, key_id, public_key, signature, type) VALUES ${placeholders}`,
                        params,
                        (err) => {
                            if (err) return res.status(500).send(err.message);
                            res.send({ success: true, count: oneTimePreKeys.length });
                        }
                    );
                } else {
                    res.send({ success: true, count: 0 });
                }
            }
        );
    });
});

// Get Bundle for a user
router.get('/bundle/:userId', (req, res) => {
    const targetUserId = req.params.userId;

    // Get Identity Key
    db.get(`SELECT public_key, registration_id FROM signal_identities WHERE user_id = ?`, [targetUserId], (err, identity) => {
        if (err || !identity) return res.status(404).send('Identity not found');

        // Get Signed PreKey
        db.get(`SELECT key_id, public_key, signature FROM signal_prekeys WHERE user_id = ? AND type = 'signed'`, [targetUserId], (err, signed) => {
            if (err || !signed) return res.status(404).send('Signed PreKey not found');

            // Get ONE One-Time PreKey and consume it (delete it)
            // Note: In a production app, we'd use a transaction and maybe a "fetch and delete" atomicity
            db.get(`SELECT id, key_id, public_key FROM signal_prekeys WHERE user_id = ? AND type = 'one-time' LIMIT 1`, [targetUserId], (err, oneTime) => {
                if (err) return res.status(500).send(err.message);

                if (oneTime) {
                    db.run(`DELETE FROM signal_prekeys WHERE id = ?`, [oneTime.id]);
                }

                res.send({
                    identityKey: identity.public_key,
                    registrationId: identity.registration_id,
                    signedPreKey: {
                        keyId: signed.key_id,
                        publicKey: signed.public_key,
                        signature: signed.signature
                    },
                    oneTimePreKey: oneTime ? {
                        keyId: oneTime.key_id,
                        publicKey: oneTime.public_key
                    } : null
                });
            });
        });
    });
});

module.exports = router;
