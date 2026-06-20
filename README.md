# MarketX — Premium Electronics E-Commerce Store

![MarketX](https://img.shields.io/badge/MarketX-E--Commerce-6366f1?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens)
![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript)

A full-stack e-commerce web application for premium electronics — featuring a polished storefront, a RESTful backend API, and a JWT-secured admin panel.

---

## 📁 Project Structure

```
web-intern-project/
├── index.html            # Home / Product listing page
├── product.html          # Product detail page
├── cart.html             # Shopping cart & checkout
├── style.css             # Shared design system
├── script.js             # Frontend JavaScript (API-driven)
│
├── server.js             # Express REST API server
├── package.json          # Node.js dependencies
│
├── data/
│   ├── products.json     # Products data store
│   ├── orders.json       # Orders data store
│   └── customers.json    # Customers data store
│
└── admin/
    ├── index.html        # Admin login page
    ├── dashboard.html    # Admin dashboard
    ├── admin.css         # Admin panel styles
    └── admin.js          # Admin panel JavaScript
```

---

## 🕰️ Before the Update — Original State

The original project was a **purely frontend, static website** with no backend or server involved.

### What it had:
| Feature | Details |
|---------|---------|
| **3 HTML pages** | `index.html`, `product.html`, `cart.html` |
| **1 CSS file** | Basic dark theme with CSS Grid layout using Segoe UI font |
| **1 JS file** | All logic in a single `script.js` |
| **Hardcoded products** | 4 products defined as a plain JS array inside `script.js` |
| **No backend** | Zero server-side code — everything ran in the browser only |
| **localStorage cart** | Cart items saved to browser's localStorage |
| **Static product images** | Mixed placeholder and Unsplash URLs |
| **No filtering** | No way to filter or search products by category |
| **No checkout** | Checkout button just ran `alert('Proceeding to Checkout...')` |
| **No admin panel** | No way to manage products, view orders, or see customer data |




## 🚀 After the Update — What Was Added

### 1. 🎨 UI Refresh (without restructuring)

The layout structure and dark theme were kept intact. The following visual improvements were made:

- **Google Inter font** — replaced the generic system font stack
- **Gradient logo** — cyan-to-indigo gradient text on the "MarketX" wordmark
- **Hero banner** — full-width promotional card above the product grid
- **Category filter pills** — clickable filter buttons on mobile/tablet
- **Sidebar category filters** — desktop sidebar links now filter products via the API
- **Product cards upgraded:**
  - Floating category badge chip in the top-left corner
  - Quick **`+` Add to Cart** button that fades in on card hover
  - Image zoom effect on hover
  - Stock level indicator (In Stock / Low Stock / Out of Stock)
  - Card glow border effect on hover using indigo shadow
- **Animated cart badge** — pill badge with a pop animation when items are added
- **Toast notifications** — slide-in/slide-out feedback toasts replacing the old button-text hack
- **Cart empty state** — proper empty cart UI with a "Shop Now" CTA
- **Checkout modal** — name, email, address form that places a real API order

---

### 2. ⚙️ RESTful Backend API (`server.js`)

A full **Node.js + Express** server was added with the following REST endpoints:

#### 🔓 Public Endpoints (no auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Admin login — returns a signed JWT token |
| `GET`  | `/api/products` | Get all products (supports `?category=Phones` filter) |
| `GET`  | `/api/products/:id` | Get a single product by ID |
| `POST` | `/api/orders` | Place a new order (from cart checkout) |

#### 🔒 Protected Endpoints (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/auth/verify` | Verify a JWT token's validity |
| `POST` | `/api/products` | Add a new product |
| `PUT`  | `/api/products/:id` | Update an existing product |
| `DELETE` | `/api/products/:id` | Delete a product |
| `GET`  | `/api/orders` | Get all orders |
| `PUT`  | `/api/orders/:id/status` | Update an order's status |
| `GET`  | `/api/customers` | Get all customers |
| `GET`  | `/api/stats` | Get dashboard statistics (counts + revenue) |

#### Data Storage
Instead of a database, the API uses **flat JSON files** as a persistent store in the `/data/` folder — making the project fully runnable without any DB setup.

---

### 3. 🔐 JWT Authentication

- Admin logs in via `POST /api/auth/login` with email + password
- Server verifies credentials using **bcryptjs** (password hashing)
- On success, a **JSON Web Token (JWT)** is returned (8-hour expiry)
- Token is stored in the browser's `localStorage`
- Every protected API call sends: `Authorization: Bearer <token>`
- A `verifyToken` middleware on the server validates and decodes the token before allowing access
- If the token is expired or missing, the server returns `401 Unauthorized`
- Admin dashboard checks the token on every load and redirects to login if invalid

---

### 4. 🛡️ Admin Panel (`admin/`)

A fully separate, JWT-protected admin interface with 4 sections:

#### 🔑 Login Page (`admin/index.html`)
- Glassmorphism card design matching the dark store theme
- Auto-filled demo credentials for convenience
- Error banner on failed login attempts
- Auto-redirects to dashboard if already logged in

#### 📊 Dashboard
- **4 stat cards:** Total Products, Total Orders, Total Revenue, Total Customers
- **Recent Orders table** showing the latest 5 orders with status badges

#### 📦 Products Manager
- Full table with product image, name, category badge, price, and stock level
- **Add Product** — modal form with all fields (name, price, stock, category, image URL, description)
- **Edit Product** — same modal pre-filled with existing data
- **Delete Product** — confirmation dialog before deletion
- All operations update the `data/products.json` file in real time

#### 🛒 Orders Manager
- Lists all orders (newest first) with order ID, customer info, item count, total, and status
- **Update Status** — modal to change status between: `Processing`, `Shipped`, `Delivered`, `Cancelled`
- Color-coded status badges for quick visual scanning

#### 👥 Customers Manager
- Lists all customers with name, email, phone, number of orders, total amount spent, and join date
- Customers are automatically created/updated when an order is placed via the storefront

---

## 🛍️ What the Site Can Do Now

### For Shoppers (Storefront)
- ✅ Browse 6 (or more) products loaded live from the API
- ✅ Filter products by category (Phones, Laptops, Accessories)
- ✅ Search products by name or category in real time
- ✅ View full product detail page with description and stock info
- ✅ Quick-add products to cart directly from the product listing
- ✅ View and manage the shopping cart (update quantities, remove items)
- ✅ Place a real order via the checkout modal — stored in the backend

### For Admins (Admin Panel)
- ✅ Securely log in with JWT-authenticated credentials
- ✅ View store statistics at a glance on the dashboard
- ✅ Add new products with all details (name, price, image, description, stock)
- ✅ Edit any existing product's information
- ✅ Delete products that are discontinued
- ✅ View all customer orders and their current status
- ✅ Update order statuses as they progress through fulfillment
- ✅ View the full customer list and their spending history

---

## 🏁 Getting Started


### Admin Credentials
```
Email:    admin@marketx.com
Password: admin123
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, Vanilla CSS, Vanilla JavaScript (ES6+) |
| **Fonts** | Google Fonts — Inter |
| **Backend** | Node.js, Express.js |
| **Authentication** | JSON Web Tokens (JWT) via `jsonwebtoken` |
| **Password Hashing** | `bcryptjs` |
| **Data Storage** | Flat JSON files (no database required) |
| **CORS** | `cors` middleware for cross-origin requests |
| **ID Generation** | `uuid` for unique product/order/customer IDs |

---

## 📦 Dependencies

```json
{
  "express":      "^4.18.2",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs":     "^2.4.3",
  "cors":         "^2.8.5",
  "uuid":         "^9.0.0"
}
```

---

## 🔒 Security Notes

> This project is built for **learning and demonstration purposes**.
> For a production deployment, you should:
> - Store `JWT_SECRET` in an environment variable (`.env` file), never in source code
> - Use a real database (MongoDB, PostgreSQL) instead of JSON files
> - Store admin credentials in the database with proper bcrypt hashing
> - Add rate limiting to the login endpoint to prevent brute-force attacks
> - Use HTTPS in production

---

*Built as part of the DecodeLab Internship Web Project — 2026*
