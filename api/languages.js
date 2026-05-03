/**
 * /api/languages.js
 * Vercel Serverless Function (FIXED)
 */

const { getLanguageStats } = require("../lib/github");
const { generateImage } = require("../lib/chart");
const cache = require("../lib/cache");

module.exports = async function handler(req, res) {
  try {
    // ── Only GET ─────────────────────────────
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "Method Not Allowed" }));
    }

    // ── SAFE query parsing (IMPORTANT FIX) ───
    const query = req.query || {};

    const username = query.username;
    const theme = query.theme || "dark";
    const layout = query.layout || "default";
    const exclude = query.exclude || "";
    const refresh = query.refresh || "0";

    // ── Validation ───────────────────────────
    if (!username || typeof username !== "string") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({
        error: "Missing required query param: username"
      }));
    }

    if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({
        error: "Invalid GitHub username format."
      }));
    }

    const excludeList = exclude
      ? exclude.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const cacheKey = `langs:${username}:${excludeList.sort().join(",")}`;

    // ── Cache ────────────────────────────────
    let langs = refresh === "1" ? null : cache.get(cacheKey);

    if (!langs) {
      const token = process.env.GITHUB_TOKEN;

      langs = await getLanguageStats(username, {
        token,
        exclude: excludeList
      });

      if (!langs || langs.length === 0) {
        langs = [{ name: "No Languages Found", bytes: 1, percentage: 100 }];
      }

      cache.set(cacheKey, langs);
    }

    // ── Generate image ───────────────────────
    const imageBuffer = generateImage(langs, {
      theme: ["dark", "light"].includes(theme) ? theme : "dark",
      layout: ["default", "compact"].includes(layout) ? layout : "default",
      username,
    });

    // ── SUCCESS RESPONSE (FIXED FOR VERCEL) ─
    res.statusCode = 200;
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Cache-Control",
      "s-maxage=21600, stale-while-revalidate=3600"
    );
    res.setHeader("X-Languages-Count", langs.length.toString());

    return res.end(imageBuffer);

  } catch (err) {
    console.error("[languages] Error:", err);

    // ── ERROR IMAGE FALLBACK ────────────────
    try {
      const errImage = generateImage(
        [{ name: "Error fetching data", bytes: 1, percentage: 100 }],
        { theme: "dark" }
      );

      res.statusCode = 500;
      res.setHeader("Content-Type", "image/png");
      return res.end(errImage);

    } catch (e) {
      // final fallback (never crash)
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: err.message }));
    }
  }
};