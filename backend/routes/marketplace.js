const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');
const aiService = require('../services/AIService');
const paymentService = require('../services/PaymentService');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// GET /marketplace/categories - Fetch all agricultural categories
router.get('/categories', async (req, res) => {
    try {
        db.all('SELECT * FROM categories ORDER BY name ASC', [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /marketplace/products - Fetch products with filters
router.get('/products', async (req, res) => {
    const { category_id, search, vendor_id } = req.query;
    let query = 'SELECT p.*, c.name as category_name, u.username as vendor_name FROM products p JOIN categories c ON p.category_id = c.id JOIN users u ON p.vendor_id = u.id WHERE p.is_available = 1';
    let params = [];

    if (category_id) {
        query += ' AND p.category_id = ?';
        params.push(category_id);
    }
    if (vendor_id) {
        query += ' AND p.vendor_id = ?';
        params.push(vendor_id);
    }
    if (search) {
        query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /marketplace/products/:id - Single product details
router.get('/products/:id', (req, res) => {
    const query = 'SELECT p.*, c.name as category_name, u.username as vendor_name FROM products p JOIN categories c ON p.category_id = c.id JOIN users u ON p.vendor_id = u.id WHERE p.id = ?';
    db.get(query, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json(row);
    });
});

// POST /marketplace/products - Add a new product (Vendor only)
router.post('/products', authenticateToken, (req, res) => {
    const { name, description, price, unit, category_id, location, image_url, stock_quantity } = req.body;
    const vendor_id = req.user.id;

    // Check if user is a vendor
    db.get('SELECT role FROM users WHERE id = ?', [vendor_id], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (user.role !== 'vendor' && user.role !== 'admin') {
            return res.status(403).json({ error: 'Only vendors can list products' });
        }

        const query = `INSERT INTO products (vendor_id, category_id, name, description, price, unit, location, image_url, stock_quantity) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [vendor_id, category_id, name, description, price, unit, location, image_url, stock_quantity || 1];

        db.run(query, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, message: 'Product listed successfully' });
        });
    });
});

// POST /marketplace/orders - Create a new order (Buyer/Escrow)
router.post('/orders', authenticateToken, (req, res) => {
    const { product_id, quantity, total_amount, payment_ref } = req.body;
    const buyer_id = req.user.id;

    db.get('SELECT vendor_id, price FROM products WHERE id = ?', [product_id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const vendor_id = product.vendor_id;

        db.run('INSERT INTO orders (buyer_id, vendor_id, total_amount, payment_ref) VALUES (?, ?, ?, ?)', 
            [buyer_id, vendor_id, total_amount, payment_ref], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const order_id = this.lastID;
            db.run('INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
                [order_id, product_id, quantity, product.price], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id: order_id, message: 'Order created successfully' });
            });
        });
    });
});

// POST /marketplace/vendor-signup - Upgrade user to vendor role
router.post('/vendor-signup', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    db.run('UPDATE users SET role = ? WHERE id = ?', ['vendor', userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Welcome to the vendor community! You can now list products.' });
    });
});

// POST /marketplace/ai-search - Semantic search using AI
router.post('/ai-search', authenticateToken, async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    try {
        const products = await aiService.searchProductsAI(query, req.user.id);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /marketplace/voice-search - Voice search using Whisper
router.post('/voice-search', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

    try {
        const transcription = await aiService.transcribeAudio(req.file.path);
        
        // Optionally trigger product search immediately or just return transcription
        // For Orion, we return the transcription so the user can "see" what it heard
        // The mobile app will then set the input and the user can press send
        // Or we can just return both
        const products = await aiService.searchProductsAI(transcription, req.user.id);
        
        res.json({ transcription, products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        // Cleanup uploaded file
        const fs = require('fs');
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
});

// --- TRANSACTIONS & ORDERS (Phase 4) ---

// Initialize Checkout
router.post('/checkout', authenticateToken, async (req, res) => {
    const { productId, quantity } = req.body;
    const buyerId = req.user.id;

    try {
        // Fetch product details
        const product = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
                if (err) reject(err); else resolve(row);
            });
        });

        if (!product) return res.status(404).json({ error: 'Product not found' });

        const totalAmount = product.price * (quantity || 1);

        // Fetch buyer email
        const buyer = await new Promise((resolve, reject) => {
            db.get('SELECT email FROM users WHERE id = ?', [buyerId], (err, row) => {
                if (err) reject(err); else resolve(row);
            });
        });

        // Initialize Paystack
        const paystackData = await paymentService.initializeTransaction(
            buyer.email,
            totalAmount,
            { 
                product_id: productId, 
                buyer_id: buyerId,
                vendor_id: product.vendor_id,
                quantity: quantity || 1
            }
        );

        // Create Pending Order
        db.run(
            `INSERT INTO orders (buyer_id, vendor_id, total_amount, status, payment_ref) VALUES (?, ?, ?, 'pending', ?)`,
            [buyerId, product.vendor_id, totalAmount, paystackData.reference],
            function(err) {
                if (err) {
                    console.error('Order creation error:', err);
                    return res.status(500).json({ error: 'Failed to create order' });
                }
                
                const orderId = this.lastID;
                // Add order items
                db.run(
                    `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)`,
                    [orderId, productId, quantity || 1, product.price]
                );

                res.status(200).json({ 
                    checkout_url: paystackData.authorization_url, 
                    reference: paystackData.reference,
                    order_id: orderId 
                });
            }
        );

    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Checkout failed' });
    }
});

// Paystack Webhook (Simulated/Real)
router.post('/webhook/paystack', async (req, res) => {
    const { event, data } = req.body;

    if (event === 'charge.success') {
        const reference = data.reference;
        db.run(
            `UPDATE orders SET status = 'paid' WHERE payment_ref = ? AND status = 'pending'`,
            [reference],
            function(err) {
                if (err) console.error('Webhook processing error:', err);
                else {
                    console.log(`Order ${reference} marked as paid`);
                }
            }
        );
    }
    res.status(200).send('OK');
});

// Get User Orders
router.get('/orders', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const role = req.query.role || 'buyer'; // 'buyer' or 'vendor'
    
    const sql = role === 'vendor' 
        ? `SELECT o.*, u.username as buyer_name FROM orders o JOIN users u ON o.buyer_id = u.id WHERE o.vendor_id = ? ORDER BY created_at DESC`
        : `SELECT o.*, u.username as vendor_name FROM orders o JOIN users u ON o.vendor_id = u.id WHERE o.buyer_id = ? ORDER BY created_at DESC`;

    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch orders' });
        res.json(rows);
    });
});

// Update Order Status (Ship/Deliver)
router.post('/orders/:id/status', authenticateToken, (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;
    const userId = req.user.id;
    
    // Set delivered_at if status is changed to delivered
    const isDelivered = status === 'delivered';
    const deliveredAtSnippet = isDelivered ? ', delivered_at = CURRENT_TIMESTAMP' : '';

    db.run(
        `UPDATE orders SET status = ? ${deliveredAtSnippet} WHERE id = ? AND (buyer_id = ? OR vendor_id = ?)`,
        [status, orderId, userId, userId],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to update order status' });
            res.json({ message: `Order status updated to ${status}` });
        }
    );
});

// Get User Wallet Balance
router.get('/wallet', authenticateToken, (req, res) => {
    db.get(`SELECT balance, role FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch wallet' });
        res.json(user);
    });
});

module.exports = router;
