-- ==============================================================================
-- STEAV LUXURY E-COMMERCE — ORDERS & PAYMENTS RLS HARDENING
-- Target: Supabase Cloud PostgreSQL
-- ==============================================================================

-- 1. PURGE ALL OLD / INSECURE POLICIES ON ORDERS, PAYMENTS, ORDER_ITEMS
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

-- 3. DROP INSECURE ENUMERATION RPCs
DROP FUNCTION IF EXISTS public.get_order_by_ref(text);
DROP FUNCTION IF EXISTS public.get_payment_by_ref(text);

-- 4. ORDERS: STRICT ROW LEVEL SECURITY POLICIES
-- Customer order placement (Allow checkout insert)
CREATE POLICY "orders_insert_checkout"
ON public.orders FOR INSERT
WITH CHECK (true);

-- Customer order privacy (Only order owner or admin can view)
CREATE POLICY "orders_select_owner_or_admin"
ON public.orders FOR SELECT
USING (
  public.is_admin() OR
  (auth.jwt() ->> 'email' IS NOT NULL AND customer_email::text = (auth.jwt() ->> 'email')::text) OR
  (customer_id IS NOT NULL AND customer_id::text = (auth.uid())::text)
);

-- Only verified administrators can update orders
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

-- 5. ORDER ITEMS: STRICT ROW LEVEL SECURITY POLICIES
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

-- 6. PAYMENTS: STRICT ROW LEVEL SECURITY POLICIES
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

-- Payment status updates are strictly restricted to admin or server service role
-- (Anonymous clients and regular customers CANNOT settle or modify payments directly)
CREATE POLICY "payments_update_admin_only"
ON public.payments FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can purge/delete payment records
CREATE POLICY "payments_delete_admin_only"
ON public.payments FOR DELETE
TO authenticated
USING (public.is_admin());
