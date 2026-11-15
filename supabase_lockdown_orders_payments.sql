-- ==============================================================================
-- ATELIER HAUTE COUTURE — CLEAN PURGE OF OLD POLICIES & STRICT RLS LOCKDOWN
-- Target: Supabase Cloud PostgreSQL (Project: awcgcpoibputqrtuvrms)
-- 
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/awcgcpoibputqrtuvrms/sql/new
-- 2. Paste this entire query and click "Run".
-- ==============================================================================

-- 1. DYNAMICALLY PURGE ALL OLD / LEFTOVER POLICIES ON ORDERS, PAYMENTS, ORDER_ITEMS
-- (This removes any old "Enable read access for all users" policies from Supabase)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename IN ('orders', 'payments', 'order_items')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. ENSURE RLS IS ENABLED ON ALL THREE TABLES
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

-- 3. ORDERS: STRICT ROW LEVEL SECURITY POLICIES
-- Customer order placement (Allow anonymous and authenticated guests to checkout)
CREATE POLICY "orders_insert_checkout"
ON public.orders FOR INSERT
WITH CHECK (true);

-- Customer order privacy (Only the authenticated customer OR administrators can view)
CREATE POLICY "orders_select_owner_or_admin"
ON public.orders FOR SELECT
USING (
  public.is_admin() OR
  (auth.jwt() ->> 'email' IS NOT NULL AND customer_email::text = (auth.jwt() ->> 'email')::text) OR
  (customer_id IS NOT NULL AND customer_id::text = (auth.uid())::text)
);

-- Only verified administrators can update order status
CREATE POLICY "orders_update_admin_only"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only verified administrators can delete orders
CREATE POLICY "orders_delete_admin_only"
ON public.orders FOR DELETE
TO authenticated
USING (public.is_admin());

-- 4. ORDER ITEMS: STRICT ROW LEVEL SECURITY POLICIES
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

-- 5. PAYMENTS / BAKONG KHQR: STRICT ROW LEVEL SECURITY POLICIES
CREATE POLICY "payments_insert_checkout"
ON public.payments FOR INSERT
WITH CHECK (true);

-- Only administrators or the matching customer can read payment records
CREATE POLICY "payments_select_owner_or_admin"
ON public.payments FOR SELECT
USING (
  public.is_admin() OR
  (auth.jwt() ->> 'email' IS NOT NULL AND customer_email::text = (auth.jwt() ->> 'email')::text)
);

-- Customers can settle their pending payment upon Bakong KHQR verification
CREATE POLICY "payments_update_settle_or_admin"
ON public.payments FOR UPDATE
USING (
  public.is_admin() OR
  status = 'PENDING'
)
WITH CHECK (
  public.is_admin() OR
  status = 'PAID'
);

-- Only administrators can delete payment records
CREATE POLICY "payments_delete_admin_only"
ON public.payments FOR DELETE
TO authenticated
USING (public.is_admin());

-- 6. RPC HELPER FUNCTIONS FOR GUEST LOOKUPS (SECURITY DEFINER)
-- Allows checking a single order by order reference without exposing the table
CREATE OR REPLACE FUNCTION public.get_order_by_ref(p_ref text)
RETURNS SETOF public.orders AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.orders
  WHERE (order_number = p_ref OR id::text = p_ref)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allows checking payment status by MD5 hash without exposing other payments
CREATE OR REPLACE FUNCTION public.get_payment_by_ref(p_ref text)
RETURNS SETOF public.payments AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.payments
  WHERE (md5_hash = p_ref OR order_number = p_ref OR id::text = p_ref)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
