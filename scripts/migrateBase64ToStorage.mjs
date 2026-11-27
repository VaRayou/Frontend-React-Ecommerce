/**
 * One-time migration script: Moves inline base64 `data:image/...` strings out of
 * PostgreSQL `public.products` into Supabase Storage (`products` bucket) with 1-year caching.
 *
 * Usage (once Supabase project is unlocked):
 *   SUPABASE_URL=https://awcgcpoibputqrtuvrms.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
 *   node scripts/migrateBase64ToStorage.mjs
 */
import crypto from "crypto";

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Error: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

async function uploadDataUrl(dataUrl, productId, idx) {
  const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return dataUrl;
  const mimeType = match[1];
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const buffer = Buffer.from(match[2], "base64");
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 10);
  const objectPath = `uploads/migrated-${productId}-${idx}-${hash}.${ext}`;

  const upRes = await fetch(`${SUPABASE_URL}/storage/v1/object/products/${objectPath}`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000",
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!upRes.ok) {
    const err = await upRes.text().catch(() => "");
    throw new Error(`Storage upload failed (${upRes.status}): ${err}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/products/${objectPath}`;
}

const listRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,image,images`, { headers });
if (!listRes.ok) {
  console.error("Failed to fetch products:", listRes.status, await listRes.text());
  process.exit(1);
}

const products = await listRes.json();
let migratedCount = 0;

for (const p of products) {
  let changed = false;
  let nextImage = p.image;
  if (typeof nextImage === "string" && nextImage.startsWith("data:image/")) {
    nextImage = await uploadDataUrl(nextImage, p.id, "cover");
    changed = true;
  }

  let nextImages = p.images;
  if (Array.isArray(nextImages)) {
    const updatedArr = [];
    for (let i = 0; i < nextImages.length; i++) {
      const item = nextImages[i];
      if (typeof item === "string" && item.startsWith("data:image/")) {
        updatedArr.push(await uploadDataUrl(item, p.id, i));
        changed = true;
      } else {
        updatedArr.push(item);
      }
    }
    nextImages = updatedArr;
  }

  if (changed) {
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(p.id)}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ image: nextImage, images: nextImages }),
    });
    if (!patchRes.ok) {
      console.error(`Failed updating product ${p.id}:`, await patchRes.text());
    } else {
      migratedCount += 1;
      console.log(`Migrated base64 images for product: ${p.name} (${p.id})`);
    }
  }
}

console.log(`Done. Migrated ${migratedCount} product(s) from DB base64 to Supabase Storage.`);
