# E-Shopper — React E-Commerce Application

An enhanced, modern, and responsive React E-Commerce web application converted from the classic **E-Shopper** HTML/CSS/Bootstrap template. The project is structured with two complete experiences:
1. **Customer / User Website**: Product browsing, instant category filtering, price sliders, dynamic product details with image zoom/thumbnails, shared persistent shopping cart, responsive checkout flow, customer account profile, and order history.
2. **Admin Panel**: Professional vertical sidebar dashboard, statistics cards, products catalog management (Create, Read, Update, Delete with modal dialogs), categories management, users management, orders management with instant status transitions, and store settings.

Prepared for seamless future integration with **Django REST Framework (DRF)**.

---

## 1. Technologies Used

- **React 19** (Functional Components & React Hooks)
- **Vite 6** (Fast frontend development environment and bundler)
- **React Router DOM v7** (Client-side routing, protected role-based routes)
- **React Context API** (Global state management for Authentication and Shopping Cart)
- **Bootstrap 5 & Original E-Shopper CSS** (Authentic branding, responsive grids, buttons, and badges)
- **Font Awesome 4.7** (Icons for cart, wishlist, admin navigation, and actions)
- **Axios** (Centralized HTTP client configured for upcoming Django REST API)
- **LocalStorage API** (Persistent mock database for products, categories, users, orders, and cart)

---

## 2. Project Folder Structure

```text
frontend/
├── public/
│   ├── admin/
│   │   ├── css/               # AdminKit theme stylesheets
│   │   └── img/               # Avatars, dashboard icons, and photos
│   ├── user/
│   │   ├── css/               # E-Shopper main.css, bootstrap, responsive.css
│   │   ├── fonts/             # FontAwesome and Glyphicons font files
│   │   ├── images/            # E-Shopper original images (home, shop, cart, 404)
│   │   └── js/                # Template support scripts
│   └── favicon.svg
│
├── src/
│   ├── components/
│   │   ├── common/            # Reusable UI primitives
│   │   │   ├── Button.jsx           # Button with spinner and variants
│   │   │   ├── Input.jsx            # Form input with show/hide password & validation
│   │   │   ├── Loader.jsx           # Clean spinner & loading indicators
│   │   │   ├── Modal.jsx            # Modal dialog for Add/Edit/Delete
│   │   │   └── ProtectedRoute.jsx   # Role-based route guard
│   │   │
│   │   ├── shop/              # Customer-facing components
│   │   │   ├── ShopNavbar.jsx       # Header with live cart count & user status
│   │   │   ├── ProductCard.jsx      # Reusable card with Add-to-Cart & Details
│   │   │   ├── ProductFilter.jsx    # Category, price range, and brand filters
│   │   │   └── CartSummary.jsx      # Order totals calculation widget
│   │   │
│   │   ├── admin/             # Admin panel components
│   │   │   ├── AdminSidebar.jsx     # Professional vertical sidebar with categories & badges
│   │   │   ├── AdminHeader.jsx      # Top header with hamburger toggle, notifications & profile
│   │   │   ├── StatisticsCard.jsx   # Dashboard KPI metric cards
│   │   │   └── DataTable.jsx        # Table with search, sorting & pagination
│   │   │
│   │   └── user/              # Preserved template components
│   │       ├── Slider.jsx           # Homepage carousel banner
│   │       ├── Footer.jsx           # Complete E-Shopper footer
│   │       └── Sidebar.jsx          # Original sidebar reference
│   │
│   ├── layouts/
│   │   ├── ShopLayout.jsx     # Customer layout with header, outlet, footer & toast
│   │   ├── AdminLayout.jsx    # Professional Admin horizontal top-nav layout
│   │   └── AuthLayout.jsx     # Clean auth layout with back-to-store navigation
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx            # Login with validation & demo autofill buttons
│   │   │   ├── Register.jsx         # Registration form with validation
│   │   │   └── ForgotPassword.jsx   # Password reset simulation
│   │   │
│   │   ├── shop/
│   │   │   ├── Home.jsx             # Features, categories tab, recommended items
│   │   │   ├── Shop.jsx             # Product catalog, search, sort, pagination
│   │   │   ├── ProductDetails.jsx   # Image gallery, quantity selector, related items
│   │   │   ├── Cart.jsx             # Shopping cart table & quantity adjustment
│   │   │   ├── Checkout.jsx         # Customer shipping form & demo payments
│   │   │   ├── OrderSuccess.jsx     # Order confirmation & summary
│   │   │   ├── Profile.jsx          # Customer profile & past orders history
│   │   │   └── Contact.jsx          # Contact Us form & store location
│   │   │
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx        # KPIs, sales chart, recent orders & users
│   │   │   ├── ManageProducts.jsx   # Product CRUD table & modal forms
│   │   │   ├── ManageCategories.jsx # Category CRUD table & modal forms
│   │   │   ├── ManageUsers.jsx      # User management table & modal forms
│   │   │   ├── ManageOrders.jsx     # Order review & live status updater
│   │   │   └── Settings.jsx         # Store information & password change
│   │   │
│   │   └── NotFound.jsx       # Custom E-Shopper 404 page
│   │
│   ├── context/
│   │   ├── AuthContext.jsx    # User login, register, profile update & role
│   │   └── CartContext.jsx    # Cart items, badge count, subtotal, discount, tax
│   │
│   ├── services/
│   │   ├── api.js             # Centralized Axios client with Bearer interceptors
│   │   ├── authService.js     # Mock auth operations with localStorage persistence
│   │   ├── productService.js  # Product CRUD operations
│   │   ├── categoryService.js # Category CRUD operations
│   │   ├── userService.js     # User management operations
│   │   └── orderService.js    # Order creation and status updates
│   │
│   ├── data/
│   │   ├── demoProducts.js    # 12 initial products using original template images
│   │   ├── demoCategories.js  # 10 product categories
│   │   ├── demoUsers.js       # Demo admin and customer accounts
│   │   └── demoOrders.js      # Demo customer order records
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx      # All application routes and role guards
│   │
│   ├── styles/
│   │   ├── global.css         # Toast notifications, badges, loading spinner
│   │   ├── shop.css           # Product cards, thumbnails, filter widgets
│   │   ├── admin.css          # Horizontal top-nav, admin tables, modal overlays
│   │   └── auth.css           # Clean login/register cards and demo fill buttons
│   │
│   ├── App.jsx                # Providers wrapper
│   └── main.jsx               # React DOM entry point
│
├── .env                       # Vite environment variables
├── .env.example               # Example template for environment configuration
├── index.html                 # HTML entry with original CSS & script tags
├── package.json               # Dependencies and build scripts
└── README.md
```

---

## 3. Demo Login Accounts

Quick-fill buttons are provided on the Login page for convenience:

### Admin Account
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Destination:** Redirects automatically to `/admin/dashboard`. Has full permission to manage products, categories, users, orders, settings, and view the customer store via the top navigation.

### Customer Account
- **Email:** `user@example.com`
- **Password:** `user123`
- **Role:** `customer`
- **Destination:** Redirects to customer homepage `/`. Can add products to cart, checkout, view profile, and inspect past order history. Cannot access `/admin/*` routes.

---

## 4. Application Routes

### Customer Store
| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero carousel, featured items, category tabs, recommended items |
| `/shop` | Shop Catalog | Search by keyword, filter by category/brand/price, sort, pagination |
| `/shop/:id` | Product Details | Dynamic product view, image gallery, quantity, stock, related items |
| `/cart` | Shopping Cart | Live item count, quantity increment/decrement, remove, totals |
| `/checkout` | Checkout | Shipping information, demo payment selection, order placement |
| `/order-success` | Order Confirmation | Displays order reference number, items, and delivery summary |
| `/profile` or `/account` | Customer Profile | Edit profile data, inspect personal order history with status |
| `/contact` | Contact Us | Inquiry contact form and store address information |

### Authentication
| Route | Page | Description |
|---|---|---|
| `/login` | Login | Email & password authentication with demo quick-fill buttons |
| `/register` | Register | New account registration with validation and auto-login |
| `/forgot-password` | Forgot Password | Reset link simulation |

### Admin Portal (Requires Admin Role)
| Route | Page | Description |
|---|---|---|
| `/admin/dashboard` | Dashboard | Statistics KPI cards, sales bar chart, recent orders & users |
| `/admin/products` | Manage Products | Search, filter, add product modal, edit, view, delete product |
| `/admin/categories` | Manage Categories | Add, edit, delete product categories with modal forms |
| `/admin/users` | Manage Users | View users, add user, edit role/status, delete user accounts |
| `/admin/orders` | Manage Orders | Filter by status, inspect order details, live status updater |
| `/admin/settings` | Store Settings | Store details, email/phone, currency, admin password change |

### Error Page
| Route | Page | Description |
|---|---|---|
| `*` | 404 Not Found | Authentic E-Shopper 404 page with return home button |

---

## 5. How to Run the Project in VS Code

### Step 1: Open Terminal in Project Folder
Ensure your terminal is in the `frontend` directory:
```bash
cd "d:\Year 4  All Subject\Python II\Py-React\Py-React\frontend"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```
Vite will start the local development server (typically at `http://localhost:5173/`). Open this URL in your web browser.

### Step 4: Build for Production
To generate an optimized production bundle:
```bash
npm run build
```
The output files will be created in the `dist/` folder.

---

## 6. How Mock Data and LocalStorage Work

1. On first launch, the application checks if data exists in `localStorage`.
2. If empty, it seeds initial data from `src/data/demoProducts.js`, `demoCategories.js`, `demoUsers.js`, and `demoOrders.js`.
3. When you add a product, create an order, or edit a user in the Admin panel, changes are saved to `localStorage`.
4. The data remains persistent across page refreshes and navigations.

---

## 7. Connecting to Django REST Framework Later

The application is architected with a dedicated services layer (`src/services/`):

1. **Central Axios Configuration** (`src/services/api.js`):
   ```javascript
   import axios from "axios";

   const api = axios.create({
     baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
     headers: { "Content-Type": "application/json" }
   });

   // Interceptor automatically attaches JWT token:
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem("eshopper_token");
     if (token) config.headers.Authorization = `Bearer ${token}`;
     return config;
   });
   ```

2. **Connecting to Django**:
   - Update `.env`:
     ```env
     VITE_API_BASE_URL=http://127.0.0.1:8000/api
     ```
   - In each service (`productService.js`, `orderService.js`, etc.), simply replace the `localStorage` calls with standard `api.get()`, `api.post()`, `api.put()`, and `api.delete()` calls. The component code will not need to change!
