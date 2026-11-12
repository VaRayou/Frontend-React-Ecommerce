-- ==============================================================================
-- ATELIER HAUTE COUTURE — OFFICIAL REAL ADMIN PROVISIONING SCRIPT
-- Target: Supabase Cloud PostgreSQL (Project: awcgcpoibputqrtuvrms)
-- 
-- Roles Provisioned:
-- 1. controller@atelier.com -> Super Administrator (Full Studio Clearance)
-- 2. catalog@atelier.com    -> Catalog Manager (Products & Inventory Merchandising)
-- 3. admin@atelier.com      -> Store Controller (Orders, Payments & Operations)
--
-- Initial Password: adminpass123
-- (Can be changed anytime inside the Studio via Supabase Auth settings)
-- ==============================================================================

-- 1. Enable pgcrypto for industry-standard bcrypt password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Provision / Update the 3 Official Real Administrator Accounts
DO $$
DECLARE
  v_user_id uuid;
  v_encrypted_pwd text;
BEGIN
  -- Generate secure bcrypt hash for 'adminpass123'
  -- Checks if crypt is in public or extensions schema
  BEGIN
    v_encrypted_pwd := crypt('adminpass123', gen_salt('bf', 10));
  EXCEPTION WHEN undefined_function THEN
    v_encrypted_pwd := extensions.crypt('adminpass123', extensions.gen_salt('bf', 10));
  END;

  -- ---------------------------------------------------------------------------
  -- USER 1: SUPER ADMINISTRATOR (Alexander Vance)
  -- ---------------------------------------------------------------------------
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'controller@atelier.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      'controller@atelier.com',
      v_encrypted_pwd,
      now(),
      '{"provider": "email", "providers": ["email"], "role": "super_admin"}'::jsonb,
      '{"full_name": "Alexander Vance", "role": "Super Administrator"}'::jsonb,
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET 
      encrypted_password = v_encrypted_pwd,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"], "role": "super_admin"}'::jsonb,
      raw_user_meta_data = raw_user_meta_data || '{"full_name": "Alexander Vance", "role": "Super Administrator"}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Link email identity for controller@atelier.com
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'controller@atelier.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.identities
    SET 
      identity_data = jsonb_build_object('sub', v_user_id::text, 'email', 'controller@atelier.com'),
      updated_at = now()
    WHERE user_id = v_user_id AND provider = 'email';
  END IF;

  -- Sync public profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, 'controller@atelier.com', 'Alexander Vance', 'super_admin')
  ON CONFLICT (id) DO UPDATE
    SET role = 'super_admin', full_name = 'Alexander Vance';


  -- ---------------------------------------------------------------------------
  -- USER 2: CATALOG MANAGER (Elena Moreau)
  -- ---------------------------------------------------------------------------
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'catalog@atelier.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      'catalog@atelier.com',
      v_encrypted_pwd,
      now(),
      '{"provider": "email", "providers": ["email"], "role": "catalog_manager"}'::jsonb,
      '{"full_name": "Elena Moreau", "role": "Catalog Manager"}'::jsonb,
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET 
      encrypted_password = v_encrypted_pwd,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"], "role": "catalog_manager"}'::jsonb,
      raw_user_meta_data = raw_user_meta_data || '{"full_name": "Elena Moreau", "role": "Catalog Manager"}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Link email identity for catalog@atelier.com
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'catalog@atelier.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.identities
    SET 
      identity_data = jsonb_build_object('sub', v_user_id::text, 'email', 'catalog@atelier.com'),
      updated_at = now()
    WHERE user_id = v_user_id AND provider = 'email';
  END IF;

  -- Sync public profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, 'catalog@atelier.com', 'Elena Moreau', 'catalog_manager')
  ON CONFLICT (id) DO UPDATE
    SET role = 'catalog_manager', full_name = 'Elena Moreau';


  -- ---------------------------------------------------------------------------
  -- USER 3: STORE CONTROLLER (Marcus Thorne)
  -- ---------------------------------------------------------------------------
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@atelier.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      'admin@atelier.com',
      v_encrypted_pwd,
      now(),
      '{"provider": "email", "providers": ["email"], "role": "store_controller"}'::jsonb,
      '{"full_name": "Marcus Thorne", "role": "Store Controller"}'::jsonb,
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET 
      encrypted_password = v_encrypted_pwd,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"], "role": "store_controller"}'::jsonb,
      raw_user_meta_data = raw_user_meta_data || '{"full_name": "Marcus Thorne", "role": "Store Controller"}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Link email identity for admin@atelier.com
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'admin@atelier.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.identities
    SET 
      identity_data = jsonb_build_object('sub', v_user_id::text, 'email', 'admin@atelier.com'),
      updated_at = now()
    WHERE user_id = v_user_id AND provider = 'email';
  END IF;

  -- Sync public profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, 'admin@atelier.com', 'Marcus Thorne', 'store_controller')
  ON CONFLICT (id) DO UPDATE
    SET role = 'store_controller', full_name = 'Marcus Thorne';

END $$;

-- 3. Verification Query: Confirm all 3 real accounts exist and are confirmed
SELECT 
  id, 
  email, 
  raw_app_meta_data ->> 'role' AS app_role,
  raw_user_meta_data ->> 'role' AS user_role,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email IN ('controller@atelier.com', 'catalog@atelier.com', 'admin@atelier.com');

