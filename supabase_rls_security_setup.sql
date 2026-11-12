-- ==============================================================================
-- ATELIER HAUTE COUTURE — ENTERPRISE ROW LEVEL SECURITY (RLS) POLICIES (COMPLETE)
-- Target: Supabase PostgreSQL (Project: awcgcpoibputqrtuvrms)
-- 
-- Execution Instructions:
-- 1. Open Supabase Dashboard -> https://supabase.com/dashboard/project/awcgcpoibputqrtuvrms
-- 2. Navigate to "SQL Editor" on the left menu.
-- 3. Click "New Query", paste the entire contents of this file, and click "Run".
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
      'controller@atelier.com',
      'rayou@atelier.com',
      'admin@atelier.com',
      'catalog@atelier.com',
      'manager@atelier.com'
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

CREATE POLICY "Customers can place orders"
ON public.orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own orders or admins view all"
ON public.orders FOR SELECT
USING (
  public.is_admin() OR
  (auth.jwt() ->> 'email' IS NOT NULL AND customer_email::text = (auth.jwt() ->> 'email')::text) OR
  (customer_id IS NOT NULL AND customer_id::text = (auth.uid())::text)
);

CREATE POLICY "Only admins can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete orders"
ON public.orders FOR DELETE
TO authenticated
USING (public.is_admin());


-- ==============================================================================
-- 4. ORDER ITEMS TABLE (Line Items Security)
-- ==============================================================================
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Only admins can modify order items" ON public.order_items;

CREATE POLICY "Anyone can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their order items"
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

CREATE POLICY "Only admins can modify order items"
ON public.order_items FOR ALL
TO authenticated
USING (public.is_admin());


-- ==============================================================================
-- 5. COUPONS TABLE (Promo Code Protection)
-- ==============================================================================
ALTER TABLE IF EXISTS public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

CREATE POLICY "Public can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL
TO authenticated
USING (public.is_admin());


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
DROP POLICY IF EXISTS "Only admins can modify payments" ON public.payments;

CREATE POLICY "Allow inserting payment records"
ON public.payments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins and order owners can view payments"
ON public.payments FOR SELECT
USING (
  public.is_admin() OR
  (auth.jwt() ->> 'email' IS NOT NULL AND customer_email::text = (auth.jwt() ->> 'email')::text)
);

DROP POLICY IF EXISTS "Allow customers to settle pending payments" ON public.payments;
DROP POLICY IF EXISTS "Only admins can modify payments" ON public.payments;
DROP POLICY IF EXISTS "Only admins can delete payments" ON public.payments;

-- Customers can update status from PENDING to PAID upon Bakong confirmation
CREATE POLICY "Allow customers to settle pending payments"
ON public.payments FOR UPDATE
USING (
  public.is_admin() OR
  status = 'PENDING'
)
WITH CHECK (
  public.is_admin() OR
  status = 'PAID'
);

-- Only admins can purge/delete payment records
CREATE POLICY "Only admins can delete payments"
ON public.payments FOR DELETE
TO authenticated
USING (public.is_admin());


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


-- ==============================================================================
-- 9. REVIEWS TABLE (Product Reviews & Ratings)
-- ==============================================================================
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can submit reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins or authors can modify reviews" ON public.reviews;

CREATE POLICY "Public can view reviews"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Customers can submit reviews"
ON public.reviews FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins or authors can modify reviews"
ON public.reviews FOR ALL
TO authenticated
USING (
  public.is_admin() OR
  (user_id IS NOT NULL AND user_id::text = (auth.uid())::text)
);


-- ==============================================================================
-- 10. STORAGE BUCKET SECURITY (Product Images & Uploads)
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


-- ==============================================================================
-- 11. OFFICIAL REAL ADMIN USER PROVISIONING (FIXED)
-- Roles: Super Administrator, Catalog Manager, Store Controller
-- Initial Default Password: adminpass123
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE IF EXISTS public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('customer', 'admin', 'super_admin', 'catalog_manager', 'store_controller', 'Super Administrator', 'Catalog Manager', 'Store Controller'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
DECLARE
  v_user_id uuid;
  v_encrypted_pwd text;
BEGIN
  BEGIN
    v_encrypted_pwd := crypt('adminpass123', gen_salt('bf', 10));
  EXCEPTION WHEN undefined_function THEN
    v_encrypted_pwd := extensions.crypt('adminpass123', extensions.gen_salt('bf', 10));
  END;

  -- 1. SUPER ADMINISTRATOR: controller@atelier.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'controller@atelier.com';
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'controller@atelier.com', v_encrypted_pwd, now(),
      '{"provider": "email", "providers": ["email"], "role": "super_admin"}'::jsonb,
      '{"full_name": "Alexander Vance", "role": "admin", "title": "Super Administrator"}'::jsonb,
      now(), now()
    );
  ELSE
    UPDATE auth.users
    SET 
      encrypted_password = v_encrypted_pwd,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"], "role": "super_admin"}'::jsonb,
      raw_user_meta_data = raw_user_meta_data || '{"full_name": "Alexander Vance", "role": "admin", "title": "Super Administrator"}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_user_id::text, v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', 'controller@atelier.com'), 'email', v_user_id::text, now(), now(), now());
  ELSE
    UPDATE auth.identities
    SET identity_data = jsonb_build_object('sub', v_user_id::text, 'email', 'controller@atelier.com'), updated_at = now()
    WHERE user_id = v_user_id AND provider = 'email';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, 'controller@atelier.com', 'Alexander Vance', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Alexander Vance';

  -- 2. CATALOG MANAGER: catalog@atelier.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'catalog@atelier.com';
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'catalog@atelier.com', v_encrypted_pwd, now(),
      '{"provider": "email", "providers": ["email"], "role": "catalog_manager"}'::jsonb,
      '{"full_name": "Elena Moreau", "role": "admin", "title": "Catalog Manager"}'::jsonb,
      now(), now()
    );
  ELSE
    UPDATE auth.users
    SET 
      encrypted_password = v_encrypted_pwd,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"], "role": "catalog_manager"}'::jsonb,
      raw_user_meta_data = raw_user_meta_data || '{"full_name": "Elena Moreau", "role": "admin", "title": "Catalog Manager"}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_user_id::text, v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', 'catalog@atelier.com'), 'email', v_user_id::text, now(), now(), now());
  ELSE
    UPDATE auth.identities
    SET identity_data = jsonb_build_object('sub', v_user_id::text, 'email', 'catalog@atelier.com'), updated_at = now()
    WHERE user_id = v_user_id AND provider = 'email';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, 'catalog@atelier.com', 'Elena Moreau', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Elena Moreau';

  -- 3. STORE CONTROLLER: admin@atelier.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@atelier.com';
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
      'admin@atelier.com', v_encrypted_pwd, now(),
      '{"provider": "email", "providers": ["email"], "role": "store_controller"}'::jsonb,
      '{"full_name": "Marcus Thorne", "role": "admin", "title": "Store Controller"}'::jsonb,
      now(), now()
    );
  ELSE
    UPDATE auth.users
    SET 
      encrypted_password = v_encrypted_pwd,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"], "role": "store_controller"}'::jsonb,
      raw_user_meta_data = raw_user_meta_data || '{"full_name": "Marcus Thorne", "role": "admin", "title": "Store Controller"}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_user_id::text, v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', 'admin@atelier.com'), 'email', v_user_id::text, now(), now(), now());
  ELSE
    UPDATE auth.identities
    SET identity_data = jsonb_build_object('sub', v_user_id::text, 'email', 'admin@atelier.com'), updated_at = now()
    WHERE user_id = v_user_id AND provider = 'email';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, 'admin@atelier.com', 'Marcus Thorne', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Marcus Thorne';

END $$;
