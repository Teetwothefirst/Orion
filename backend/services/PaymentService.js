const axios = require('axios');
require('dotenv').config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder';
const PAYSTACK_URL = 'https://api.paystack.co';

class PaymentService {
    /**
     * Initialize a payment transaction with Paystack
     */
    async initializeTransaction(email, amount, metadata = {}) {
        try {
            const response = await axios.post(
                `${PAYSTACK_URL}/transaction/initialize`,
                {
                    email,
                    amount: Math.round(amount * 100), // Paystack expects amount in kobo
                    metadata,
                    callback_url: metadata.callback_url || ''
                },
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data.data;
        } catch (error) {
            console.error('Paystack Initialize Error:', error.response?.data || error.message);
            throw new Error('Failed to initialize payment with Paystack');
        }
    }

    /**
     * Verify a transaction using the reference
     */
    async verifyTransaction(reference) {
        try {
            const response = await axios.get(
                `${PAYSTACK_URL}/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                    }
                }
            );
            return response.data.data;
        } catch (error) {
            console.error('Paystack Verify Error:', error.response?.data || error.message);
            throw new Error('Failed to verify payment with Paystack');
        }
    }

    /**
     * Handle Escrow logic (placeholder for 48h automatic release)
     */
    async scheduleEscrowRelease(orderId) {
        console.log(`Scheduling escrow release for Order ${orderId} in 48 hours...`);
        // Implementation would use a task queue like Bull or a simple setTimeout (not recommended for production)
        // For this phase, we'll implement the release-escrow endpoint for manual trigger.
    }
}

module.exports = new PaymentService();
