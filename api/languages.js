/**
 * /api/languages.js
 * Vercel Serverless Function
 *
 * Query params:
 *   username  - GitHub username (required)
 *   theme     - "dark" | "light"  (default: dark)
 *   layout    - "default" | "compact"
 *   exclude   - comma-separated list of languages to exclude (e.g. HTML,CSS)
 *   refresh   - "1" to bypass cache (useful for the GH Actions job)
 */

const { getLanguageStats } = require("../lib/github");
const { generateImage } = require("../lib/chart");
const cache = require("../lib/cache");

module.exports = async function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const {
    username,
    theme = "dark",
    layout = "default",
    exclude = "",
    refresh = "0",
  } = req.query;

  // ── Input validation ────────────────────────────────────────────────────────
  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Missing required query param: username" });
  }
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
    return res.status(400).json({ error: "Invalid GitHub username format." });
  }

  const excludeList = exclude
    ? exclude.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const cacheKey = `langs:${username}:${excludeList.sort().join(",")}`;

  try {
    // ── Cache lookup ──────────────────────────────────────────────────────────
    let langs = refresh === "1" ? null : cache.get(cacheKey);

    if (!langs) {
      // Fetch fresh data from GitHub
      const token = process.env.GITHUB_TOKEN; // Optional but recommended to avoid rate limits
      langs = await getLanguageStats(username, { token, exclude: excludeList });

      if (langs.length === 0) {
        // Return a friendly "no data" image instead of erroring
        langs = [{ name: "No Languages Found", bytes: 1, percentage: 100 }];
      }

      cache.set(cacheKey, langs);
    }

    // ── Generate image ────────────────────────────────────────────────────────
    const imageBuffer = generateImage(langs, {
      theme: ["dark", "light"].includes(theme) ? theme : "dark",
      layout: ["default", "compact"].includes(layout) ? layout : "default",
      username,
    });

    // ── Send response ──────────────────────────────────────────────────────────
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=3600");
    res.setHeader("X-Languages-Count", langs.length.toString());
    res.status(200).send(imageBuffer);
  } catch (err) {
    console.error(`[languages] Error for user "${username}":`, err.message);

    // Return a plain error image rather than JSON so it works in <img> tags
    try {
      const errImage = generateImage(
        [{ name: "Error fetching data", bytes: 1, percentage: 100 }],
        { theme: "dark", username }
      );
      res.setHeader("Content-Type", "image/png");
      res.status(500).send(errImage);
    } catch {
      res.status(500).json({ error: err.message });
    }
  }
};
