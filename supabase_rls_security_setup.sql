-- ==============================================================================
-- STEAV LUXURY E-COMMERCE — ENTERPRISE ROW LEVEL SECURITY (RLS) POLICIES
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. Helper Function: Verify Admin Privilege
-- Checks JWT claims, protected app_metadata, and verified administrator emails
-- NOTE: Never check user_metadata here as user_metadata can be client-manipulated during signUp!
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    -- Authoritative backend role claim (set exclusively by Supabase backend or Service Role)
    coalesce(auth.jwt() ->> 'role', '') IN ('admin', 'super_admin', 'service_role') OR
    -- Protected app_metadata (CANNOT be edited or forged by the client!)
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN (
      'admin',
      'super_admin',
      'Super Administrator',
      'Store Controller',
      'store_controller',
      'Catalog Manager',
      'catalog_manager'
    ) OR
    -- Authoritative administrator email whitelist
    coalesce(auth.jwt() ->> 'email', '') IN (
      'admin@youngsteav.site',
      'controller@youngsteav.site',
      'rayou@youngsteav.site',
      'controller@atelier.com',
      'rayou@atelier.com',
      'admin@atelier.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. PRODUCTS TABLE (Catalog & Inventory Security)
-- ==============================================================================
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view catalog products" ON public.products;
DROP POLICY IF EXISTS "Only admins can modify products" ON public.products;
DROP POLICY IF EXISTS "Only admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;

CREATE POLICY "Public can view catalog products"
ON public.products FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can modify products"
ON public.products FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete products"
ON public.products FOR DELETE
TO authenticated
USING (public.is_admin());


-- ==============================================================================
-- 3. ORDERS TABLE (Customer Privacy & Financial Security)
-- ==============================================================================
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can place orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders or admins view all" ON public.orders;
DROP POLICY IF EXISTS "Only admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_checkout" ON public.orders;
DROP POLICY IF EXISTS "orders_select_owner_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin_only" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin_only" ON public.orders;

CREATE POLICY "orders_insert_checkout"
ON public.orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "orders_select_owner_or_admin"
ON public.orders FOR SELECT
USING (
  public.is_admin() OR
  (auth.jwt() ->> 'email' IS NOT NULL AND customer_email::text = (auth.jwt() ->> 'email')::text) OR
  (customer_id IS NOT NULL AND customer_id::text = (auth.uid())::text)
);

CREATE POLICY "orders_update_admin_only"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "orders_delete_admin_only"
ON public.orders FOR DELETE
TO authenticated
USING (public.is_admin());

-- Drop insecure enumeration RPC
DROP FUNCTION IF EXISTS public.get_order_by_ref(text);


-- ==============================================================================
-- 4. ORDER ITEMS TABLE (Line Items Security)
-- ==============================================================================
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Only admins can modify order items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_checkout" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_owner_or_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_modify_admin_only" ON public.order_items;

CREATE POLICY "order_items_insert_checkout"
ON public.order_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "order_items_select_owner_or_admin"
ON public.order_items FOR SELECT
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id::text = order_items.order_id::text
    AND (
      public.is_admin() OR
      (auth.jwt() ->> 'email' IS NOT NULL AND o.customer_email::text = (auth.jwt() ->> 'email')::text) OR
      (o.customer_id IS NOT NULL AND o.customer_id::text = (auth.uid())::text)
    )
  )
);

CREATE POLICY "order_items_modify_admin_only"
ON public.order_items FOR ALL
TO authenticated
USING (public.is_admin());


-- ==============================================================================
-- 5. COUPONS TABLE (Promo Code Protection — Restricted to Admin & Service Role)
-- NOTE: Anonymous users cannot query this table. Coupon validation is done server-side.
-- ==============================================================================
ALTER TABLE IF EXISTS public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin_only" ON public.coupons;

CREATE POLICY "coupons_admin_only"
ON public.coupons FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ==============================================================================
-- 6. CATEGORIES TABLE (Taxonomy Protection)
-- ==============================================================================
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Public can view categories"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (public.is_admin());


-- ==============================================================================
-- 7. PAYMENTS TABLE (KHQR Transactions & Hashes)
-- ==============================================================================
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow inserting payment records" ON public.payments;
DROP POLICY IF EXISTS "Admins and order owners can view payments" ON public.payments;
DROP POLICY IF EXISTS "Allow customers to settle pending payments" ON public.payments;
DROP POLICY IF EXISTS "Only admins can modify payments" ON public.payments;
DROP POLICY IF EXISTS "Only admins can delete payments" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_checkout" ON public.payments;
DROP POLICY IF EXISTS "payments_select_owner_or_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_update_admin_only" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_admin_only" ON public.payments;

CREATE POLICY "payments_insert_checkout"
ON public.payments FOR INSERT
WITH CHECK (true);

CREATE POLICY "payments_select_owner_or_admin"
ON public.payments FOR SELECT
USING (
  public.is_admin() OR
  (auth.jwt() ->> 'email' IS NOT NULL AND customer_email::text = (auth.jwt() ->> 'email')::text)
);

-- Payments can ONLY be updated by administrators or server service role
CREATE POLICY "payments_update_admin_only"
ON public.payments FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "payments_delete_admin_only"
ON public.payments FOR DELETE
TO authenticated
USING (public.is_admin());

-- Drop insecure enumeration RPC
DROP FUNCTION IF EXISTS public.get_payment_by_ref(text);


-- ==============================================================================
-- 8. PROFILES TABLE (Customer & Administrator Accounts)
-- ==============================================================================
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins update all" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles FOR SELECT
USING (
  public.is_admin() OR
  id::text = (auth.uid())::text OR
  email::text = (auth.jwt() ->> 'email')::text
);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (
  public.is_admin() OR
  id::text = (auth.uid())::text
);

CREATE POLICY "Users can update own profile or admins update all"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  public.is_admin() OR
  id::text = (auth.uid())::text
)
WITH CHECK (
  public.is_admin() OR
  id::text = (auth.uid())::text
);

CREATE POLICY "Only admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin());

-- Prevent non-admins from escalating their role in public.profiles
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can modify user roles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_forbid_role_change ON public.profiles;
CREATE TRIGGER tr_forbid_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_profile_role_update();


-- ==============================================================================
-- 9. REVIEWS TABLE (Moderated Reviews)
-- ==============================================================================
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can submit reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins or authors can modify reviews" ON public.reviews;

-- Only approved reviews are public
CREATE POLICY "Public can view approved reviews"
ON public.reviews FOR SELECT
USING (status = 'Approved' OR public.is_admin());

-- Submitting a review requires authentication, user id match, and defaults to Pending
CREATE POLICY "Authenticated users can submit reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id::text = (auth.uid())::text AND
  status = 'Pending'
);

CREATE POLICY "Admins or authors can modify reviews"
ON public.reviews FOR ALL
TO authenticated
USING (
  public.is_admin() OR
  (user_id IS NOT NULL AND user_id::text = (auth.uid())::text)
);


-- ==============================================================================
-- 10. STORAGE BUCKET SECURITY
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public image access" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload image access" ON storage.objects;

CREATE POLICY "Public image access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Admin upload image access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products' AND public.is_admin());
