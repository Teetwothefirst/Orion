const db = require('../db');

/**
 * EscrowService
 * Handles automatic release of funds from escrow to vendor wallets
 * after the 48-hour buyer protection period has elapsed.
 */
class EscrowService {
    static startStatusChecker() {
        console.log('Escrow Service: Background checker started (Interval: 1 hour)');
        // Run once on startup
        this.processEscrowReleases();
        
        // Then run every hour
        setInterval(async () => {
            await this.processEscrowReleases();
        }, 3600000); // 3,600,000 ms = 1 hour
    }

    static async processEscrowReleases() {
        console.log('Escrow Service: Checking for eligible releases...');
        try {
            // Find orders delivered more than 48 hours ago that are still held
            // SQLite uses datetime('now', '-48 hours'), Postgres uses NOW() - INTERVAL '48 hours'
            const isPostgres = !!process.env.DATABASE_URL;
            const timeCondition = isPostgres 
                ? "delivered_at < NOW() - INTERVAL '48 hours'" 
                : "delivered_at < datetime('now', '-48 hours')";

            const sql = `SELECT * FROM orders WHERE status = 'delivered' AND escrow_status = 'held' AND ${timeCondition}`;
            
            // Note: We use db.query which returns a promise in our db.js wrapper if it exists, 
            // but our db.js for SQLite uses callbacks for .all unless wrapped.
            // Let's use a promise-based approach compatible with our db.js
            
            const eligibleOrders = await new Promise((resolve, reject) => {
                db.all(sql, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });

            if (eligibleOrders.length === 0) {
                console.log('Escrow Service: No orders eligible for release at this time.');
                return;
            }

            console.log(`Escrow Service: Found ${eligibleOrders.length} orders eligible for release.`);

            for (const order of eligibleOrders) {
                await this.releaseFunds(order);
            }
        } catch (error) {
            console.error('Escrow Service Error:', error);
        }
    }

    static async releaseFunds(order) {
        console.log(`Escrow Service: Releasing funds for Order #${order.id} (Amount: ₦${order.total_amount})`);
        try {
            // Use a transaction-like sequence (SQLite serialize or just sequential calls)
            // 1. Update order escrow status to 'released'
            await new Promise((resolve, reject) => {
                db.run(`UPDATE orders SET escrow_status = 'released' WHERE id = ?`, [order.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 2. Add funds to vendor's wallet balance
            await new Promise((resolve, reject) => {
                db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [order.total_amount, order.vendor_id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log(`Escrow Service: Funds released successfully for Order #${order.id} to Vendor #${order.vendor_id}`);
        } catch (err) {
            console.error(`Escrow Service: Failed to release funds for Order #${order.id}:`, err.message);
        }
    }
}

module.exports = EscrowService;
