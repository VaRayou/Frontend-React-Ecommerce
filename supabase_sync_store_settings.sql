-- ==============================================================================
-- STEAV LUXURY E-COMMERCE — GLOBAL STORE SETTINGS SETUP
-- Target: Supabase Cloud PostgreSQL
-- NOTE: Never store API keys, bot tokens, or private secrets in store_settings!
--       All backend secrets are strictly managed in Vercel environment variables.
-- ==============================================================================

-- 1. Ensure store_settings table exists
CREATE TABLE IF NOT EXISTS public.store_settings (
    id text PRIMARY KEY,
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public & Customer devices can read public store settings (shipping, boutique info)
DROP POLICY IF EXISTS "Public can view store_settings" ON public.store_settings;
CREATE POLICY "Public can view store_settings"
ON public.store_settings FOR SELECT
USING (true);

-- 4. Policy: Only authenticated administrators can modify or upsert store settings
DROP POLICY IF EXISTS "Admins can modify store_settings" ON public.store_settings;
CREATE POLICY "Admins can modify store_settings"
ON public.store_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Set default store and shipping configuration in Supabase (NO SECRETS)
INSERT INTO public.store_settings (id, settings, updated_at)
VALUES (
    'default',
    jsonb_build_object(
        'storeName', 'STEAV Paris — Flagship Studio',
        'storeEmail', 'contact@youngsteav.site',
        'storePhone', '+855 96 835 0317',
        'storeAddress', 'Phnom Penh • Paris • Global Flagship',
        'storeTaxId', 'VAT REG: KH-8840291-A',
        'currency', 'USD ($)',
        'receiptFooterMessage', '*** THANK YOU FOR PATRONIZING STEAV ***',
        'orderNotification', true,
        'stockAlertNotification', true,
        'standardShippingFee', 0,
        'freeShippingThreshold', 200,
        'shippingCarrierName', 'DHL Express Courier',
        'enableFreeShipping', true
    ),
    now()
)
ON CONFLICT (id) DO UPDATE
SET settings = store_settings.settings || jsonb_build_object(
    'standardShippingFee', 0,
    'freeShippingThreshold', 200,
    'shippingCarrierName', 'DHL Express Courier',
    'enableFreeShipping', true
),
updated_at = now();
