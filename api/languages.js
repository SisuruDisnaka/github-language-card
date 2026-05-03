const { getLanguageStats } = require("../lib/github");
const { generateImage } = require("../lib/chart");
const cache = require("../lib/cache");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "Method Not Allowed" }));
    }

    const { searchParams } = new URL(req.url);

    const username = searchParams.get("username");
    const theme = searchParams.get("theme") || "dark";
    const layout = searchParams.get("layout") || "default";
    const exclude = searchParams.get("exclude") || "";
    const refresh = searchParams.get("refresh") || "0";

    if (!username) {
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

    const imageBuffer = generateImage(langs, {
      theme: ["dark", "light"].includes(theme) ? theme : "dark",
      layout: ["default", "compact"].includes(layout) ? layout : "default",
      username,
    });

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

    try {
      const errImage = generateImage(
        [{ name: "Error fetching data", bytes: 1, percentage: 100 }],
        { theme: "dark" }
      );

      res.statusCode = 500;
      res.setHeader("Content-Type", "image/png");
      return res.end(errImage);

    } catch (e) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "Unexpected failure" }));
    }
  }
};