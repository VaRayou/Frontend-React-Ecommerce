/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_BAKONG_API_TOKEN?: string;
  readonly VITE_BAKONG_API_URL?: string;
  readonly VITE_BAKONG_ACCOUNT_ID?: string;
  readonly VITE_BAKONG_MERCHANT_NAME?: string;
  readonly VITE_BAKONG_PHONE?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
