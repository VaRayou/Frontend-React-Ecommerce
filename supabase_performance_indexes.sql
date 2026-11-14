-- ==============================================================================
-- ATELIER E-COMMERCE: PRODUCTION DATABASE PERFORMANCE INDEXES
-- Run these statements in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- to achieve sub-10ms queries, prevent full table scans, and reduce database CPU load.
-- ==============================================================================

-- 1. Products: Accelerate Category, Status & Sorting lookups
CREATE INDEX IF NOT EXISTS idx_products_cat_status 
ON products(category_id, status);

CREATE INDEX IF NOT EXISTS idx_products_featured_created 
ON products(is_featured DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_price 
ON products(price ASC);

-- 2. Orders: Accelerate Customer Order History & Admin Lookup
CREATE INDEX IF NOT EXISTS idx_orders_user_created 
ON orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_order_number 
ON orders(order_number);

-- 3. Order Items: Speed up joins when fetching items for an order
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON order_items(product_id);

-- 4. Reviews: Instant loading on Product Details page
CREATE INDEX IF NOT EXISTS idx_reviews_product_created 
ON reviews(product_id, created_at DESC);

-- 5. Payments / Bakong KHQR Ledger: Fast ledger and reconciliation queries
CREATE INDEX IF NOT EXISTS idx_payments_order_id 
ON payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_status_created 
ON payments(payment_status, created_at DESC);

-- 6. Promo Coupons: Fast uppercase code lookups during Checkout
CREATE INDEX IF NOT EXISTS idx_coupons_code 
ON coupons(UPPER(code));

-- Re-analyze tables to refresh query planner statistics
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE reviews;
ANALYZE payments;
ANALYZE coupons;
