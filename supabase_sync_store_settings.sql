-- ==============================================================================
-- ATELIER HAUTE COUTURE — GLOBAL STORE SETTINGS & SHIPPING SYNC SETUP
-- Target: Supabase PostgreSQL (Project: awcgcpoibputqrtuvrms)
--
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/awcgcpoibputqrtuvrms
-- 2. Click "SQL Editor" -> "New query".
-- 3. Paste this script and click "Run".
-- ==============================================================================

-- 1. Ensure store_settings table exists
CREATE TABLE IF NOT EXISTS public.store_settings (
    id text PRIMARY KEY,
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public & Customer devices can read store settings (shipping fee, boutique info)
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

-- 5. Set default shipping configuration to $0 free shipping in Supabase
INSERT INTO public.store_settings (id, settings, updated_at)
VALUES (
    'default',
    jsonb_build_object(
        'storeName', 'ATELIER PARIS — Flagship Studio',
        'storeEmail', 'concierge@atelier.com',
        'storePhone', '+855 96 835 0317',
        'storeAddress', 'Phnom Penh • Paris • Global Flagship',
        'storeTaxId', 'VAT REG: KH-8840291-A',
        'currency', 'USD ($)',
        'receiptFooterMessage', '*** THANK YOU FOR PATRONIZING ATELIER ***',
        'orderNotification', true,
        'stockAlertNotification', true,
        'telegramBotToken', '9048372338:AAHADX6G3fszbnyUTF58AEn0X2BSRbptx8A',
        'telegramChatId', '1389246582',
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
