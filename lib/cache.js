const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join("/tmp", "lang-cache");
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// In-memory store: key → { data, expiresAt }
const memCache = new Map();

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cacheKeyToPath(key) {
  // Sanitize key for use as a filename
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(CACHE_DIR, `${safe}.json`);
}

/**
 * Get cached value. Returns null if missing or expired.
 */
function get(key) {
  // 1. Memory
  const mem = memCache.get(key);
  if (mem && Date.now() < mem.expiresAt) return mem.data;
  if (mem) memCache.delete(key);

  // 2. Filesystem
  try {
    ensureDir();
    const p = cacheKeyToPath(key);
    if (!fs.existsSync(p)) return null;
    const { data, expiresAt } = JSON.parse(fs.readFileSync(p, "utf8"));
    if (Date.now() < expiresAt) {
      // Warm memory cache
      memCache.set(key, { data, expiresAt });
      return data;
    }
    fs.unlinkSync(p); // Expired
  } catch {
    // Ignore read errors
  }
  return null;
}

/**
 * Store value in both layers.
 */
function set(key, data, ttlMs = DEFAULT_TTL_MS) {
  const expiresAt = Date.now() + ttlMs;
  memCache.set(key, { data, expiresAt });

  try {
    ensureDir();
    fs.writeFileSync(
      cacheKeyToPath(key),
      JSON.stringify({ data, expiresAt }),
      "utf8"
    );
  } catch {
    // Non-fatal
  }
}

/**
 * Manually invalidate a cache entry.
 */
function invalidate(key) {
  memCache.delete(key);
  try {
    const p = cacheKeyToPath(key);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {}
}

module.exports = { get, set, invalidate };
