// ============================================================
//  MarketX Backend — Express REST API with JWT Auth
//  Run: node server.js  (default port: 3001)
// ============================================================

const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Secret key for JWT (use env var in production) ────────────────────────
const JWT_SECRET  = process.env.JWT_SECRET || 'marketx_super_secret_key_2024';
const JWT_EXPIRES = '8h';

// ─── Admin credentials (hashed at boot for demo) ───────────────────────────
const ADMIN_EMAIL = 'admin@marketx.com';
const ADMIN_PASSWORD_PLAIN = 'admin123';
const ADMIN_PASSWORD_HASH  = bcrypt.hashSync(ADMIN_PASSWORD_PLAIN, 10);

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static frontend files from the project root
app.use(express.static(path.join(__dirname)));

// ─── Helpers: flat-file JSON "database" ────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');

function readJSON(filename) {
    const filepath = path.join(DATA_DIR, filename);
    try {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch {
        return [];
    }
}

function writeJSON(filename, data) {
    const filepath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
}

// ─── JWT Middleware ─────────────────────────────────────────────────────────
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

// ════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, admin: { email } }
 */
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (email !== ADMIN_EMAIL) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isValid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
        { email: ADMIN_EMAIL, role: 'admin' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );

    res.json({
        message: 'Login successful.',
        token,
        admin: { email: ADMIN_EMAIL, role: 'admin' }
    });
});

/**
 * GET /api/auth/verify
 * Verifies the current JWT — used by admin panel on load
 */
app.get('/api/auth/verify', verifyToken, (req, res) => {
    res.json({ valid: true, admin: req.admin });
});

// ════════════════════════════════════════════════════════════
//  PRODUCT ROUTES
// ════════════════════════════════════════════════════════════

/**
 * GET /api/products
 * Public — returns all products
 * Optional query: ?category=Phones
 */
app.get('/api/products', (req, res) => {
    let products = readJSON('products.json');
    const { category } = req.query;
    if (category && category !== 'All') {
        products = products.filter(p => p.category === category);
    }
    res.json(products);
});

/**
 * GET /api/products/:id
 * Public — returns a single product
 */
app.get('/api/products/:id', (req, res) => {
    const products = readJSON('products.json');
    const product  = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
});

/**
 * POST /api/products
 * Admin only — add a new product
 * Body: { name, price, category, description, image, stock }
 */
app.post('/api/products', verifyToken, (req, res) => {
    const { name, price, category, description, image, stock } = req.body;

    if (!name || !price || !category) {
        return res.status(400).json({ error: 'name, price, and category are required.' });
    }

    const products = readJSON('products.json');
    const newProduct = {
        id: `prod-${uuidv4().slice(0, 8)}`,
        name,
        price: parseFloat(price),
        category,
        description: description || '',
        image: image || 'https://placehold.co/600x400?text=Product',
        stock: parseInt(stock) || 0,
        createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    writeJSON('products.json', products);

    res.status(201).json({ message: 'Product created.', product: newProduct });
});

/**
 * PUT /api/products/:id
 * Admin only — update an existing product
 */
app.put('/api/products/:id', verifyToken, (req, res) => {
    const products = readJSON('products.json');
    const index    = products.findIndex(p => p.id === req.params.id);

    if (index === -1) return res.status(404).json({ error: 'Product not found.' });

    const { name, price, category, description, image, stock } = req.body;

    products[index] = {
        ...products[index],
        ...(name        !== undefined && { name }),
        ...(price       !== undefined && { price: parseFloat(price) }),
        ...(category    !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(image       !== undefined && { image }),
        ...(stock       !== undefined && { stock: parseInt(stock) }),
        updatedAt: new Date().toISOString()
    };

    writeJSON('products.json', products);
    res.json({ message: 'Product updated.', product: products[index] });
});

/**
 * DELETE /api/products/:id
 * Admin only — remove a product
 */
app.delete('/api/products/:id', verifyToken, (req, res) => {
    let products = readJSON('products.json');
    const index  = products.findIndex(p => p.id === req.params.id);

    if (index === -1) return res.status(404).json({ error: 'Product not found.' });

    const deleted = products.splice(index, 1)[0];
    writeJSON('products.json', products);

    res.json({ message: 'Product deleted.', product: deleted });
});

// ════════════════════════════════════════════════════════════
//  ORDER ROUTES
// ════════════════════════════════════════════════════════════

/**
 * GET /api/orders
 * Admin only — returns all orders
 */
app.get('/api/orders', verifyToken, (req, res) => {
    const orders = readJSON('orders.json');
    res.json(orders);
});

/**
 * GET /api/orders/:id
 * Admin only — returns a single order
 */
app.get('/api/orders/:id', verifyToken, (req, res) => {
    const orders = readJSON('orders.json');
    const order  = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
});

/**
 * POST /api/orders
 * Public — place an order (called from the cart checkout)
 * Body: { customerName, customerEmail, items: [{productId, name, price, quantity}] }
 */
app.post('/api/orders', (req, res) => {
    const { customerName, customerEmail, items, address } = req.body;

    if (!customerName || !customerEmail || !items || items.length === 0) {
        return res.status(400).json({ error: 'customerName, customerEmail, and items are required.' });
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax      = parseFloat((subtotal * 0.05).toFixed(2));
    const total    = parseFloat((subtotal + tax).toFixed(2));

    const orders  = readJSON('orders.json');
    const newOrder = {
        id: `ord-${uuidv4().slice(0, 8)}`,
        customerName,
        customerEmail,
        address: address || '',
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax,
        total,
        status: 'Processing',
        createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    writeJSON('orders.json', orders);

    // Update or create customer record
    const customers   = readJSON('customers.json');
    const custIndex   = customers.findIndex(c => c.email === customerEmail);
    if (custIndex !== -1) {
        customers[custIndex].totalOrders += 1;
        customers[custIndex].totalSpent  = parseFloat((customers[custIndex].totalSpent + total).toFixed(2));
    } else {
        customers.push({
            id: `cust-${uuidv4().slice(0, 8)}`,
            name: customerName,
            email: customerEmail,
            phone: '',
            address: address || '',
            totalOrders: 1,
            totalSpent: total,
            createdAt: new Date().toISOString()
        });
    }
    writeJSON('customers.json', customers);

    res.status(201).json({ message: 'Order placed successfully.', order: newOrder });
});

/**
 * PUT /api/orders/:id/status
 * Admin only — update order status
 * Body: { status: "Processing" | "Shipped" | "Delivered" | "Cancelled" }
 */
app.put('/api/orders/:id/status', verifyToken, (req, res) => {
    const orders = readJSON('orders.json');
    const index  = orders.findIndex(o => o.id === req.params.id);

    if (index === -1) return res.status(404).json({ error: 'Order not found.' });

    const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const { status } = req.body;

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    orders[index].status    = status;
    orders[index].updatedAt = new Date().toISOString();

    writeJSON('orders.json', orders);
    res.json({ message: 'Order status updated.', order: orders[index] });
});

// ════════════════════════════════════════════════════════════
//  CUSTOMER ROUTES
// ════════════════════════════════════════════════════════════

/**
 * GET /api/customers
 * Admin only — returns all customers
 */
app.get('/api/customers', verifyToken, (req, res) => {
    const customers = readJSON('customers.json');
    res.json(customers);
});

/**
 * GET /api/customers/:id
 * Admin only — returns a single customer
 */
app.get('/api/customers/:id', verifyToken, (req, res) => {
    const customers = readJSON('customers.json');
    const customer  = customers.find(c => c.id === req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });
    res.json(customer);
});

// ════════════════════════════════════════════════════════════
//  DASHBOARD STATS ROUTE
// ════════════════════════════════════════════════════════════

/**
 * GET /api/stats
 * Admin only — aggregated dashboard stats
 */
app.get('/api/stats', verifyToken, (req, res) => {
    const products  = readJSON('products.json');
    const orders    = readJSON('orders.json');
    const customers = readJSON('customers.json');

    const totalRevenue   = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders  = orders.filter(o => o.status === 'Processing').length;
    const shippedOrders  = orders.filter(o => o.status === 'Shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;

    res.json({
        totalProducts:   products.length,
        totalOrders:     orders.length,
        totalCustomers:  customers.length,
        totalRevenue:    parseFloat(totalRevenue.toFixed(2)),
        pendingOrders,
        shippedOrders,
        deliveredOrders
    });
});

// ─── 404 catch-all ──────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 MarketX API running at http://localhost:${PORT}`);
    console.log(`   Admin credentials: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD_PLAIN}`);
    console.log(`   API endpoints:`);
    console.log(`     POST   /api/auth/login`);
    console.log(`     GET    /api/products`);
    console.log(`     POST   /api/products       (admin)`);
    console.log(`     PUT    /api/products/:id   (admin)`);
    console.log(`     DELETE /api/products/:id   (admin)`);
    console.log(`     GET    /api/orders          (admin)`);
    console.log(`     POST   /api/orders`);
    console.log(`     PUT    /api/orders/:id/status (admin)`);
    console.log(`     GET    /api/customers       (admin)`);
    console.log(`     GET    /api/stats           (admin)\n`);
});
