/**
 * STEAV PARIS — HAUTE COUTURE IMAGE OPTIMIZER
 * Serves optimized images across Unsplash, Supabase Storage, and local static assets.
 */

export const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80";

export const imageOptimizer = {
  /**
   * Transforms image URLs to request optimized dimensions and WebP encoding.
   */
  getOptimizedUrl: (url?: string, width = 600, quality = 80): string => {
    if (!url || typeof url !== "string") {
      return DEFAULT_FALLBACK_IMAGE;
    }

    const trimmed = url.trim();
    if (!trimmed) return DEFAULT_FALLBACK_IMAGE;

    // Handle Unsplash Images: apply width, format=webp, and quality
    if (trimmed.includes("images.unsplash.com")) {
      try {
        const u = new URL(trimmed);
        u.searchParams.set("w", String(width));
        u.searchParams.set("auto", "format");
        u.searchParams.set("fit", "crop");
        u.searchParams.set("q", String(quality));
        return u.toString();
      } catch {
        return trimmed;
      }
    }

    // Handle Supabase Storage:
    // DO NOT rewrite to /render/image/public/ because Supabase Image Transformation
    // is a paid Pro feature and returns 403 Forbidden on standard/free projects.
    // If a render URL is encountered, safely revert it to the direct public object endpoint.
    if (trimmed.includes(".supabase.co/storage/v1/render/image/public/")) {
      return trimmed.replace(
        "/storage/v1/render/image/public/",
        "/storage/v1/object/public/"
      ).split("?")[0];
    }

    // Direct Supabase Public Object URLs are served directly via Cloudflare CDN (200 OK)
    if (trimmed.includes(".supabase.co/storage/v1/object/public/")) {
      return trimmed;
    }

    // Handle local relative uploads (e.g. "uploads/abc.jpg" -> "/uploads/abc.jpg")
    if (trimmed.startsWith("uploads/")) {
      return `/${trimmed}`;
    }

    // Return original if no transform parameters match
    return trimmed;
  },

  /**
   * Generates a standard HTML srcset attribute for responsive screens.
   */
  getSrcSet: (url?: string): string => {
    if (!url) return "";
    return `
      ${imageOptimizer.getOptimizedUrl(url, 360)} 360w,
      ${imageOptimizer.getOptimizedUrl(url, 600)} 600w,
      ${imageOptimizer.getOptimizedUrl(url, 900)} 900w
    `.trim();
  },
};
