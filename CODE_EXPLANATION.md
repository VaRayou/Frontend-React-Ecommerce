# E-Shopper — Code Explanation and Learning Guide
# ការពន្យល់កូដ និងមគ្គុទ្ទេសក៍សិក្សាសម្រាប់គម្រោង E-Shopper

This guide is designed for students and beginners learning React.js and full-stack web development. It explains every important concept, file, layout, and service in simple English, accompanied by Khmer translations.

សៀវភៅណែនាំនេះត្រូវបានរៀបចំឡើងសម្រាប់និស្សិត និងអ្នកចាប់ផ្តើមរៀន React.js។ វាពន្យល់ពីគោលគំនិតសំខាន់ៗ ឯកសារនីមួយៗ ប្លង់ទំព័រ និងសេវាកម្មជាភាសាអង់គ្លេសងាយយល់ រួមជាមួយនឹងការបកប្រែជាភាសាខ្មែរ។

---

## Table of Contents / មាតិកា

1. **Fundamental React Concepts / គោលគំនិតគ្រឹះរបស់ React**
   - React Components
   - Props
   - State (`useState`)
   - Effects (`useEffect`)
   - React Router DOM
   - Context API
   - Role-Based Protection

2. **Core Architecture & Global Providers / រចនាសម្ព័ន្ធស្នូល និង Providers**
   - `src/main.jsx`
   - `src/App.jsx`
   - `src/routes/AppRoutes.jsx`
   - `src/context/AuthContext.jsx`
   - `src/context/CartContext.jsx`

3. **Services Layer (Preparing for Django REST) / ស្រទាប់ Services**
   - `src/services/api.js`
   - `src/services/authService.js`
   - `src/services/productService.js`
   - `src/services/categoryService.js`
   - `src/services/userService.js`
   - `src/services/orderService.js`

4. **Layout Components / សមាសភាគប្លង់ទំព័រ**
   - `src/layouts/ShopLayout.jsx`
   - `src/layouts/AdminLayout.jsx`
   - `src/layouts/AuthLayout.jsx`

5. **Customer Store Pages / ទំព័រសម្រាប់អតិថិជន**
   - `src/pages/shop/Home.jsx`
   - `src/pages/shop/Shop.jsx`
   - `src/pages/shop/ProductDetails.jsx`
   - `src/pages/shop/Cart.jsx`
   - `src/pages/shop/Checkout.jsx`
   - `src/pages/shop/OrderSuccess.jsx`
   - `src/pages/shop/Profile.jsx`
   - `src/pages/shop/Contact.jsx`

6. **Authentication Pages / ទំព័រផ្ទៀងផ្ទាត់គណនី**
   - `src/pages/auth/Login.jsx`
   - `src/pages/auth/Register.jsx`
   - `src/pages/auth/ForgotPassword.jsx`

7. **Admin Panel Pages / ទំព័រគ្រប់គ្រង Admin**
   - `src/pages/admin/Dashboard.jsx`
   - `src/pages/admin/ManageProducts.jsx`
   - `src/pages/admin/ManageCategories.jsx`
   - `src/pages/admin/ManageUsers.jsx`
   - `src/pages/admin/ManageOrders.jsx`
   - `src/pages/admin/Settings.jsx`

8. **Future Django REST Framework Integration / ការតភ្ជាប់ទៅកាន់ Django នាពេលខាងមុខ**

---

## 1. Fundamental React Concepts / គោលគំនិតគ្រឹះរបស់ React

### 1.1 React Components (សមាសភាគ React)
- **English:** A Component in React is a reusable piece of user interface (UI). Instead of writing one massive HTML page, we break the website into small, independent LEGO bricks like `ProductCard`, `ShopNavbar`, and `Button`. Components are JavaScript functions that return JSX (HTML-like syntax).
- **Khmer:** Component គឺជាបំណែកតូចៗនៃផ្ទៃកម្មវិធី (UI) ដែលអាចយកមកប្រើឡើងវិញបានច្រើនដង ដូចជាដុំឡេហ្គោ (LEGO)។ ជំនួសឱ្យការសរសេរកូដ HTML ទាំងអស់ចូលក្នុងឯកសារតែមួយ យើងបំបែកវាជាបំណែកតូចៗដូចជា `ProductCard` (កាតបង្ហាញទំនិញ), `ShopNavbar` (របារម៉ឺនុយ) ជាដើម។

### 1.2 Props (លក្ខណៈសម្បត្តិ ឬទិន្នន័យបញ្ជូន)
- **English:** Props (short for "properties") are parameters passed from a parent component down to a child component. Just like passing arguments to a function, props let you customize each component. For example, `<ProductCard product={item} />` passes the product data into the card.
- **Khmer:** Props គឺជាទិន្នន័យដែលបញ្ជូនពី Component មេ (Parent) ទៅកាន់ Component កូន (Child) ដើម្បីកំណត់ទិន្នន័យបង្ហាញ ដូចជាការបញ្ជូនប៉ារ៉ាម៉ែត្រក្នុង Function ដែរ។ ឧទាហរណ៍៖ `<ProductCard product={item} />` បញ្ជូនទិន្នន័យទំនិញទៅកាន់កាតបង្ហាញ។

### 1.3 State (ស្ថានភាពទិន្នន័យក្នុង Component)
- **English:** State is data that changes over time inside a component. When the state changes (via `setState`), React automatically re-renders the component to show the latest information. For example, the current quantity in `ProductDetails` or the search keyword in `Shop`.
- **Khmer:** State គឺជាទិន្នន័យដែលអាចប្រែប្រួលនៅក្នុង Component មួយ។ នៅពេលដែល State ផ្លាស់ប្តូរ React នឹងធ្វើការ Render (គូររូបភាពទំព័រឡើងវិញ) ដោយស្វ័យប្រវត្ត ដើម្បីបង្ហាញទិន្នន័យថ្មី ដូចជាចំនួនទំនិញ ឬពាក្យគន្លឹះស្វែងរក។

### 1.4 React Router (ការរៀបចំផ្លូវ និងទំព័រ)
- **English:** React applications are Single Page Applications (SPAs). React Router intercepts URL changes and swaps out components dynamically without refreshing the entire web browser. `<Link to="/shop">` changes the page smoothly and instantly.
- **Khmer:** React Router ជួយឱ្យគេហទំព័រផ្លាស់ប្តូរទំព័រដោយរលូន (Single Page Application) ដោយមិនចាំបាច់ Reload ទំព័រទាំងមូលឡើងវិញនោះទេ។

### 1.5 Context API (ការចែករំលែកទិន្នន័យទូទាំងកម្មវិធី)
- **English:** Sometimes data needs to be accessible everywhere in the website (e.g., who is logged in, and how many items are inside the shopping cart). Instead of passing props through 10 levels of components ("prop drilling"), Context API creates a global broadcast station that any component can tune into.
- **Khmer:** Context API ប្រើសម្រាប់ចែករំលែកទិន្នន័យរួមទូទាំងគេហទំព័រ (Global State) ដូចជា ព័ត៌មានអ្នក Login និងចំនួនទំនិញក្នុងកន្ត្រក ដោយមិនចាំបាច់បញ្ជូន Props កាត់តាម Component ជាច្រើនជាន់នោះទេ។

---

## 2. Core Architecture & Global Providers

### 2.1 `src/main.jsx`
1. **File Name & Location:** `src/main.jsx`
2. **What it is used for:** The official JavaScript entry point of the entire React application.
3. **Why it is needed:** Browsers need to know where to attach the React virtual DOM tree inside the `index.html` file (`<div id="root"></div>`).
4. **Important Functions:** `createRoot(document.getElementById('root')).render(<App />)`.
5. **How the code works:** Finds the HTML element with id `root` and mounts the top-level `<App />` component inside it.
6. **Connections:** Connects `index.html` with `src/App.jsx`.
7. **Used by:** Loaded first on every browser visit.
8. **How to modify:** Only modify if you are adding top-level dev error boundaries or external providers.

*Khmer Summary:* ឯកសារ `main.jsx` គឺជាចំណុចចាប់ផ្តើមដំបូងបង្អស់នៃកម្មវិធី React ដែលភ្ជាប់កូដ React ទៅកាន់ផ្ទាំង HTML ក្នុង `index.html` ត្រង់ `<div id="root"></div>`។

---

### 2.2 `src/App.jsx`
1. **File Name & Location:** `src/App.jsx`
2. **What it is used for:** The root component that wraps the app with routing and global state providers.
3. **Why it is needed:** It makes sure that all pages have access to the browser history (`BrowserRouter`), authentication state (`AuthProvider`), and cart state (`CartProvider`), as well as global CSS stylesheets.
4. **Important Components:** `<BrowserRouter>`, `<AuthProvider>`, `<CartProvider>`, `<AppRoutes />`.
5. **How the code works:** Wraps child components in providers so any page can call `useAuth()` or `useCart()`.
6. **Connections:** Imports `src/context/AuthContext.jsx`, `src/context/CartContext.jsx`, `src/routes/AppRoutes.jsx`, and stylesheets.
7. **How to modify:** If you introduce another global context (e.g., a ThemeContext for Dark Mode), wrap it here.

*Khmer Summary:* `App.jsx` គឺជា Component មេដែលគ្រប់ដណ្តប់ទូទាំងកម្មវិធី ដោយរុំព័ទ្ធនូវ Provider សំខាន់ៗដូចជា BrowserRouter, AuthProvider (សម្រាប់ Login) និង CartProvider (សម្រាប់កន្ត្រកទំនិញ)។

---

### 2.3 `src/routes/AppRoutes.jsx`
1. **File Name & Location:** `src/routes/AppRoutes.jsx`
2. **What it is used for:** Defines the complete URL routing table for both Customer and Admin pages.
3. **Why it is needed:** Controls which page appears when a user navigates to `/`, `/shop`, `/cart`, `/admin/dashboard`, etc.
4. **Important Features:**
   - Routes grouped under `<ShopLayout />` (Customer website with E-Shopper header and footer).
   - Routes grouped under `<AuthLayout />` (Login, Register, Forgot Password).
   - Routes grouped under `<AdminLayout />` wrapped with `<ProtectedRoute allowedRoles={['admin']}>`.
   - Wildcard `path="*"` routing to `NotFound.jsx`.
5. **Connections:** Connects all page components in `src/pages/` with their corresponding layouts.
6. **How to modify:** To add a new page (e.g., `/blog`), import your page component and add `<Route path="blog" element={<Blog />} />` inside the appropriate layout.

*Khmer Summary:* `AppRoutes.jsx` ជាកន្លែងកំណត់ផ្លូវនៃគេហទំព័រ (URL Routes) ដូចជាទំព័រទំនិញ `/shop`, កន្ត្រកទំនិញ `/cart`, និងទំព័រ Admin `/admin/dashboard`។ វាក៏ការពារកុំឱ្យ Customer ធម្មតាចូលទៅកាន់ទំព័រ Admin ផងដែរ។

---

### 2.4 `src/context/AuthContext.jsx`
1. **File Name & Location:** `src/context/AuthContext.jsx`
2. **What it is used for:** Manages user authentication state, role verification, and login/logout operations across the application.
3. **Why it is needed:** Every component needs to know whether the user is logged in, their name, and whether they are an `admin` or a `customer`.
4. **Key Functions & Values:**
   - `user`: Currently active user object (`id`, `name`, `email`, `role`, `avatar`).
   - `role`: `'admin'` or `'customer'`.
   - `isAuthenticated`: Boolean indicating if user is signed in.
   - `isAdmin`: Boolean indicating if `role === 'admin'`.
   - `login(email, password)`: Authenticates user credentials.
   - `register(userData)`: Registers a new user.
   - `logout()`: Clears authentication tokens and user state.
   - `updateProfile(data)`: Updates customer profile details in storage.
5. **How it works:** Initializes state by checking `localStorage.getItem('eshopper_auth_user')`. Provides custom hook `useAuth()` for easy consumption.
6. **How to modify:** When Django is connected, change the login method to save the DRF token/session.

*Khmer Summary:* `AuthContext.jsx` គ្រប់គ្រងស្ថានភាពនៃការ Login, Register, Logout និងការបែងចែកសិទ្ធិ (Role) រវាង Admin និង Customer។

---

### 2.5 `src/context/CartContext.jsx`
1. **File Name & Location:** `src/context/CartContext.jsx`
2. **What it is used for:** Manages the shopping cart items, quantities, coupon discounts, shipping fees, eco tax, and automatic calculations.
3. **Why it is needed:** When a customer clicks "Add to Cart" on the Home page or Product Details, the cart badge in the header must immediately update, and the Cart page must display the item.
4. **Key Functions & Values:**
   - `cart`: Array of items `[{ product, quantity }]`.
   - `cartCount`: Total number of units in cart.
   - `cartSubtotal`: Sum of `product.price * quantity`.
   - `shippingFee`: Demo shipping logic ($10 flat or free for orders over $150).
   - `tax`: Demo eco tax ($2).
   - `cartTotal`: Grand total amount calculated automatically.
   - `addToCart(product, quantity)`: Adds item or increases quantity if already present.
   - `removeFromCart(productId)`: Removes an item from the cart.
   - `updateQuantity(productId, newQty)`: Updates quantity directly.
   - `clearCart()`: Empties the cart.
   - `applyPromoCode(code)`: Applies demo discounts (`DISCOUNT10`, `SAVE20`).
   - `toastMessage`: Banner notification message.
5. **How it works:** Persists the cart array to `localStorage.getItem('eshopper_cart')` using an `useEffect` hook.
6. **How to modify:** You can adjust the free shipping threshold or tax calculations inside this file.

*Khmer Summary:* `CartContext.jsx` គ្រប់គ្រងកន្ត្រកទំនិញ គណនាតម្លៃទំនិញសរុប (Subtotal), តម្លៃដឹកជញ្ជូន (Shipping), ពន្ធ (Tax), ការបញ្ចុះតម្លៃតាម Coupon, និងរក្សាទុកទិន្នន័យក្នុង LocalStorage។

---

## 3. Services Layer (Prepared for Django REST Framework)

### 3.1 `src/services/api.js`
1. **File Name & Location:** `src/services/api.js`
2. **What it is used for:** Centralized Axios configuration for making HTTP requests to the backend.
3. **Why it is needed:** Keeps API URLs and authentication headers in one single place rather than repeating them in every component.
4. **How the code works:**
   ```javascript
   const api = axios.create({
     baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
     headers: { "Content-Type": "application/json" }
   });
   ```
   An interceptor automatically reads `localStorage.getItem("eshopper_token")` and attaches it as `Bearer <token>` to every outgoing request.
5. **How to modify:** When deploying to production with Django, set `VITE_API_BASE_URL` in `.env`.

*Khmer Summary:* `api.js` ជាកន្លែងកំណត់ Axios កណ្តាល ដើម្បីត្រៀមតភ្ជាប់ទៅកាន់ Django REST Framework នៅពេលក្រោយ ដោយមាន Interceptor បញ្ជូន Token ដោយស្វ័យប្រវត្តិ។

---

### 3.2 Product, Category, User, and Order Services
- `src/services/productService.js`: Provides `getProducts(filters)`, `getProductById(id)`, `createProduct(data)`, `updateProduct(id, data)`, `deleteProduct(id)`.
- `src/services/categoryService.js`: Provides `getCategories()`, `createCategory(data)`, `updateCategory(id, data)`, `deleteCategory(id)`.
- `src/services/userService.js`: Provides `getUsers()`, `getUserById(id)`, `createUser(data)`, `updateUser(id, data)`, `deleteUser(id)`.
- `src/services/orderService.js`: Provides `getOrders()`, `getOrderById(id)`, `getOrdersByCustomer(email)`, `createOrder(data)`, `updateOrderStatus(id, newStatus)`.

*How they work today:* They read from and write to browser `localStorage` with a short artificial latency (300ms) so you can see clean loading indicators.
*How they will work with Django:* Simply replace `localStorage` lines with `await api.get('/products/')`, `await api.post('/products/', data)`, etc.

*Khmer Summary:* ឯកសារ Service ទាំងនេះផ្ទុកមុខងារ CRUD (បង្កើត, អាន, កែប្រែ, លុប) សម្រាប់ទំនិញ ប្រភេទ គណនី និងការកុម្ម៉ង់។ បច្ចុប្បន្នវាដំណើរការជាមួយ LocalStorage ហើយនៅពេលភ្ជាប់ជាមួយ Django គ្រាន់តែប្តូរមកហៅ API តាម Axios ជាការស្រេច។

---

## 4. Layout Components

### 4.1 `src/layouts/ShopLayout.jsx`
1. **What it does:** Wraps every customer page with the authentic E-Shopper header (`ShopNavbar`), main content `<Outlet />`, footer (`Footer`), and floating toast notifications.
2. **Why it is needed:** Ensures consistent header navigation and footer branding without duplicating code on every single page.

*Khmer Summary:* `ShopLayout.jsx` ជាគ្រោងទំព័រសម្រាប់អតិថិជន ដែលមានរបារម៉ឺនុយខាងលើ (Header) ផ្ទៃមាតិកាកណ្តាល (`<Outlet />`) និងជើងទំព័រ (Footer)។

### 4.2 `src/layouts/AdminLayout.jsx`, `AdminSidebar.jsx` & `AdminHeader.jsx`
1. **What it does:** Renders the professional Admin portal layout using an industry-standard **left vertical sidebar** with a sticky top header.
2. **Key Features:**
   - **`AdminSidebar.jsx`:** Left dark-slate vertical sidebar (`260px` width) with brand emblem, online user status card, categorized menu items (Overview, Catalog Management, Sales & Customers, Configuration, Store Shortcut), live pending order count badge, collapse/expand toggle, and logout button. Fully responsive with mobile slide-in drawer.
   - **`AdminHeader.jsx`:** Top navbar featuring hamburger toggle button, greeting context, quick "View Store" pill button, notifications bell with badge and dropdown, and admin profile dropdown with session details.
3. **Why it is needed:** Provides an industry-standard, professional dashboard workflow for store managers and admins.

*Khmer Summary:* `AdminLayout.jsx` រួមជាមួយ `AdminSidebar.jsx` និង `AdminHeader.jsx` ផ្តល់នូវរចនាសម្ព័ន្ធផ្ទាំងគ្រប់គ្រងស្តង់ដារដែលមានរបារចំហៀងខាងឆ្វេង (Vertical Sidebar) និងរបារក្បាលខាងលើ (Top Header)។ វាមានការបែងចែកក្រុមម៉ឺនុយយ៉ាងច្បាស់លាស់ ប៊ូតុងពង្រីក/បង្រួម (Collapse/Expand) និងការគាំទ្រលើទូរស័ព្ទដៃ (Mobile Responsive Drawer)។

---

## 5. Customer Store Pages

### 5.1 `src/pages/shop/Home.jsx`
- **Features:** Hero carousel banner (`Slider`), category filter, Featured Products using reusable `ProductCard` components, interactive Category Tabs (Sportswear, Mens, Womens, Kids, Shoes), and Recommended Products.
- **Interactions:** Clicking "Shop Now" takes you to the shop catalog. Clicking "Add to Cart" increments cart count and displays a toast feedback.

*Khmer Summary:* ទំព័រដើម (Homepage) បង្ហាញផ្ទាំង Banner រំកិល, ទំនិញលេចធ្លោ (Featured), ផ្ទាំង Tab តាមប្រភេទ (Category Tabs), និងទំនិញណែនាំ (Recommended)។

### 5.2 `src/pages/shop/Shop.jsx`
- **Features:** Comprehensive product catalog with live search by product name, category filtering, brand selection, dynamic price range slider, sort dropdown (Price Low/High, Name A-Z), and responsive pagination.
- **Empty State:** If a search has no results, a friendly message displays with a "Reset Filters" button.

*Khmer Summary:* ទំព័រហាងទំនិញ (Shop) អនុញ្ញាតឱ្យស្វែងរកទំនិញតាមឈ្មោះ ចម្រាញ់តាមប្រភេទ ម៉ាកយីហោ និងតម្លៃ ក៏ដូចជាការតម្រៀប (Sorting) និងទំព័របន្ទាប់ (Pagination)។

### 5.3 `src/pages/shop/ProductDetails.jsx` (`/shop/:id`)
- **Features:** Displays product information fetched dynamically by URL parameter `id`. Includes main image preview, clickable gallery thumbnails to switch images, price, original price, discount tag, stock status badge, quantity selector (+ / - with stock ceiling validation), "Add to Cart" button, "Buy Now" direct checkout button, description tabs, reviews section with submission form, and related items.

*Khmer Summary:* ទំព័របង្ហាញព័ត៌មានលម្អិតនៃទំនិញ (`/shop/:id`) រួមមាន រូបភាពធំ និងរូបតូចៗសម្រាប់ចុចប្តូរ, តម្លៃ, ការបញ្ចុះតម្លៃ, ចំនួនស្តុកនៅសល់, ប៊ូតុងជ្រើសរើសបរិមាណ, ប៊ូតុងទិញភ្លាមៗ (Buy Now), និងទំនិញស្រដៀងគ្នា។

### 5.4 `src/pages/shop/Cart.jsx` (`/cart`)
- **Features:** Full shopping cart table displaying product image, title, price, quantity controls, line subtotal, and remove button. If empty, displays an inviting empty state. Includes Order Summary calculating subtotal, discount, shipping, tax, and grand total.

*Khmer Summary:* ទំព័រកន្ត្រកទំនិញ (`/cart`) បង្ហាញបញ្ជីទំនិញដែលបានរើស ប៊ូតុងបន្ថែម/បន្ថយចំនួន ប៊ូតុងលុបទំនិញ និងផ្ទាំងសង្ខេបតម្លៃសរុប។

### 5.5 `src/pages/shop/Checkout.jsx` (`/checkout`)
- **Features:** Shipping address form (Full Name, Email, Phone, Address, City, Country, Notes), order items review, demo payment method selection (Cash on Delivery, Direct Bank Transfer, PayPal), form validation, and place order button. Submitting saves the order to localStorage and navigates to `/order-success`.

*Khmer Summary:* ទំព័រទូទាត់ប្រាក់ (`/checkout`) សម្រាប់បំពេញអាសយដ្ឋានដឹកជញ្ជូន ជ្រើសរើសវិធីសាស្ត្រទូទាត់គំរូ និងបញ្ជាក់ការកុម្ម៉ង់។

### 5.6 `src/pages/shop/Profile.jsx` (`/profile` & `/account`)
- **Features:** Displays customer information, editable personal details form with validation and success notifications, and a table showing personal order history with status badges (Pending, Processing, Shipped, Delivered).

*Khmer Summary:* ទំព័រគណនីអតិថិជន (`/profile`) សម្រាប់មើលនិងកែប្រែព័ត៌មានផ្ទាល់ខ្លួន និងពិនិត្យមើលប្រវត្តិនៃការកុម្ម៉ង់ទំនិញពីមុនៗ។

---

## 6. Authentication Pages

### 6.1 `src/pages/auth/Login.jsx` (`/login`)
- **Fields:** Email, Password, Show/Hide Password eye toggle, Remember Me checkbox, Forgot Password link.
- **Validation:** Required fields and email regex validation.
- **Demo Quick-Fill Buttons:**
  - "Fill Admin Account" (`admin@example.com` / `admin123`) -> Redirects to `/admin/dashboard`.
  - "Fill Customer Account" (`user@example.com` / `user123`) -> Redirects to `/`.

*Khmer Summary:* ទំព័រចូលប្រើប្រាស់ (`/login`) មានប្រព័ន្ធត្រួតពិនិត្យទម្រង់ (Validation), ប៊ូតុងបង្ហាញ/លាក់ពាក្យសម្ងាត់, និងប៊ូតុងជំនួយបំពេញគណនី Admin ឬ Customer ដោយស្វ័យប្រវត្តសម្រាប់ការធ្វើតេស្ត។

### 6.2 `src/pages/auth/Register.jsx` (`/register`)
- **Fields:** Full Name, Email, Phone, Password, Confirm Password, Agree to Terms checkbox.
- **Validation:** Validates email format, password matching, minimum 6 characters, and required terms agreement. Auto-logs the user in as a customer upon successful registration.

*Khmer Summary:* ទំព័រចុះឈ្មោះ (`/register`) សម្រាប់បង្កើតគណនីថ្មីដោយមានការផ្ទៀងផ្ទាត់យ៉ាងហ្មត់ចត់លើទម្រង់នីមួយៗ។

---

## 7. Admin Panel Pages

### 7.1 `src/pages/admin/Dashboard.jsx` (`/admin/dashboard`)
- **Statistics Cards:** Total Products, Categories, Users, Orders, and Demo Revenue. Cards are clickable and navigate directly to their respective management tables.
- **Sales Overview:** Clean monthly bar chart widget.
- **Recent Activity:** Quick tables of recent customer orders and top-selling products.

*Khmer Summary:* ទំព័រផ្ទាំងគ្រប់គ្រង Admin (Dashboard) បង្ហាញកាតស្ថិតិសំខាន់ៗ ក្រាហ្វិកចំណូលប្រចាំខែ និងបញ្ជីនៃការកុម្ម៉ង់ចុងក្រោយបង្អស់។

### 7.2 `src/pages/admin/ManageProducts.jsx` (`/admin/products`)
- **Features:** Inventory table with search and pagination.
- **Modals:**
  - **Add Product Modal:** Form for title, category, price, original price, stock, image preset, and description.
  - **Edit Product Modal:** Pre-filled form to update product details.
  - **View Product Modal:** Card view showing full details.
  - **Delete Confirmation Modal:** Asks confirmation before deleting from database.

*Khmer Summary:* ទំព័រគ្រប់គ្រងទំនិញ (Manage Products) អនុញ្ញាតឱ្យ Admin ស្វែងរក មើលព័ត៌មានលម្អិត បន្ថែមទំនិញថ្មី កែប្រែ និងលុបទំនិញតាមរយៈផ្ទាំង Modal។

### 7.3 `src/pages/admin/ManageCategories.jsx` (`/admin/categories`)
- **Features:** Category management table, Add Category modal, Edit Category modal, and Delete confirmation dialog.

*Khmer Summary:* ទំព័រគ្រប់គ្រងប្រភេទទំនិញ (Manage Categories) សម្រាប់បង្កើត កែប្រែ និងលុបប្រភេទមុខទំនិញ។

### 7.4 `src/pages/admin/ManageUsers.jsx` (`/admin/users`)
- **Features:** Displays registered users with avatars, email, phone, role badge (Admin / Customer), and status (Active / Inactive). Supports adding, editing role/status, and deleting accounts.

*Khmer Summary:* ទំព័រគ្រប់គ្រងអ្នកប្រើប្រាស់ (Manage Users) សម្រាប់ពិនិត្យមើលបញ្ជីគណនី កែប្រែសិទ្ធិ (Role) ឬបិទ/បើកដំណើរការគណនី (Status)។

### 7.5 `src/pages/admin/ManageOrders.jsx` (`/admin/orders`)
- **Features:** Order management table with search and filter by order status (Pending, Processing, Shipped, Delivered, Cancelled).
- **Status Updater:** Admin can change the status dropdown directly in the table, updating the status and customer order history instantly!
- **Order Details Modal:** Shows customer shipping details and all items ordered.

*Khmer Summary:* ទំព័រគ្រប់គ្រងការកុម្ម៉ង់ (Manage Orders) សម្រាប់ពិនិត្យមើលការបញ្ជាទិញរបស់អតិថិជន និងអាចផ្លាស់ប្តូរស្ថានភាពកុម្ម៉ង់ (Pending -> Shipped -> Delivered) បានភ្លាមៗ។

### 7.6 `src/pages/admin/Settings.jsx` (`/admin/settings`)
- **Features:** Store name, public contact email, phone, headquarters address, default currency selector, notification toggles, and Admin password change form.

*Khmer Summary:* ទំព័រកំណត់ប្រព័ន្ធ (Settings) សម្រាប់គ្រប់គ្រងព័ត៌មានទូទៅនៃហាង រូបិយប័ណ្ណ និងការផ្លាស់ប្តូរពាក្យសម្ងាត់របស់ Admin។

---

## 8. Step-by-Step: Connecting to Django REST Framework Later
## ជំហាននៃការភ្ជាប់ទៅកាន់ Django REST Framework នាពេលខាងមុខ

When you are ready to build the Django backend:

1. **Step 1: Install Django & DRF in backend project:**
   ```bash
   pip install django djangorestframework django-cors-headers
   ```
2. **Step 2: Enable CORS in Django `settings.py`:**
   ```python
   INSTALLED_APPS += ['rest_framework', 'corsheaders']
   MIDDLEWARE.insert(0, 'corsheaders.middleware.CorsMiddleware')
   CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
   ```
3. **Step 3: Update `.env` in this React project:**
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```
4. **Step 4: Update Services:**
   In `src/services/productService.js`, replace the localStorage reads with:
   ```javascript
   import api from "./api";

   export const productService = {
     getProducts: async (params) => {
       const res = await api.get("/products/", { params });
       return res.data;
     },
     getProductById: async (id) => {
       const res = await api.get(`/products/${id}/`);
       return res.data;
     },
     createProduct: async (data) => {
       const res = await api.post("/products/", data);
       return res.data;
     },
     // ...
   };
   ```
Because all components already call `productService.getProducts()`, the UI components do not need any code changes!

*Khmer Summary:* នៅពេលអ្នកបង្កើត Django Backend រួចរាល់ អ្នកគ្រាន់តែបើក CORS ក្នុង Django និងប្តូរការហៅកូដក្នុង `src/services/` មកប្រើ `api.get()` និង `api.post()`។ ផ្នែក UI ទាំងអស់នឹងដំណើរការដោយស្វ័យប្រវត្តដោយមិនបាច់កែកូដទំព័រឡើយ!

