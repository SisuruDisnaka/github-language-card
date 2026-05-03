const https = require("https");

/**
 * Makes a GET request to a URL and returns parsed JSON.
 * Handles GitHub API rate limit headers gracefully.
 */
function fetchJSON(url, token) {
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "github-lang-card/1.0",
      Accept: "application/vnd.github.v3+json",
    };
    if (token) headers["Authorization"] = `token ${token}`;

    https
      .get(url, { headers }, (res) => {
        // Rate limit check
        const remaining = parseInt(res.headers["x-ratelimit-remaining"] || "60");
        if (res.statusCode === 403 && remaining === 0) {
          const reset = res.headers["x-ratelimit-reset"];
          return reject(
            new Error(`GitHub rate limit exceeded. Resets at ${new Date(reset * 1000).toISOString()}`)
          );
        }
        if (res.statusCode === 404) return reject(new Error("GitHub user not found."));
        if (res.statusCode !== 200)
          return reject(new Error(`GitHub API error: HTTP ${res.statusCode}`));

        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error("Failed to parse GitHub response."));
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Fetch ALL repos for a user (handles pagination).
 */
async function fetchAllRepos(username, token) {
  let repos = [];
  let page = 1;

  while (true) {
    const url = `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&type=owner`;
    const data = await fetchJSON(url, token);
    if (!Array.isArray(data) || data.length === 0) break;
    repos = repos.concat(data);
    if (data.length < 100) break; // Last page
    page++;
  }

  return repos;
}

/**
 * Fetch language bytes for a single repo.
 */
async function fetchRepoLanguages(languagesUrl, token) {
  try {
    return await fetchJSON(languagesUrl, token);
  } catch {
    return {}; // Silently skip failed repos
  }
}

/**
 * Main export: aggregates all language bytes across all repos.
 * Returns sorted array: [{ name, bytes, percentage }]
 */
async function getLanguageStats(username, { token, exclude = [] } = {}) {
  if (!username || typeof username !== "string") {
    throw new Error("Invalid GitHub username.");
  }

  const repos = await fetchAllRepos(username, token);
  if (repos.length === 0) return [];

  // Fetch languages concurrently (batched to avoid hammering the API)
  const BATCH = 10;
  const totals = {};

  for (let i = 0; i < repos.length; i += BATCH) {
    const batch = repos.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((r) => fetchRepoLanguages(r.languages_url, token))
    );
    results.forEach((langMap) => {
      for (const [lang, bytes] of Object.entries(langMap)) {
        if (exclude.map((e) => e.toLowerCase()).includes(lang.toLowerCase())) continue;
        totals[lang] = (totals[lang] || 0) + bytes;
      }
    });
  }

  const totalBytes = Object.values(totals).reduce((a, b) => a + b, 0);
  if (totalBytes === 0) return [];

  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: parseFloat(((bytes / totalBytes) * 100).toFixed(2)),
    }));
}

module.exports = { getLanguageStats };
