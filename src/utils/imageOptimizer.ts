/**
 * ATELIER PARIS — HAUTE COUTURE IMAGE OPTIMIZER
 * Dynamically downscales and requests modern WebP variants from CDNs (Unsplash, Supabase, Cloudinary)
 * to ensure 0ms latency and minimal Supabase egress bandwidth.
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

    // Handle Supabase Storage Transform URLs (if Image Transformation is enabled)
    if (trimmed.includes(".supabase.co/storage/v1/object/public/")) {
      // Supabase Pro transformation endpoint
      const transformed = trimmed.replace(
        "/storage/v1/object/public/",
        `/storage/v1/render/image/public/`
      );
      try {
        const u = new URL(transformed);
        u.searchParams.set("width", String(width));
        u.searchParams.set("quality", String(quality));
        return u.toString();
      } catch {
        return trimmed;
      }
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
