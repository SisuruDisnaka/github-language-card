# 📊 GitHub Language Card

> A self-hosted Vercel service that generates a dynamic PNG image showing your most-used programming languages across all GitHub repositories.

![Languages](https://your-app.vercel.app/api/languages?username=YOUR_USERNAME)

---

## ✨ Features

- 🎨 **Beautiful dark/light theme** with language-specific colors
- 📊 **Horizontal bar chart** with stacked color strip
- ⚡ **6-hour in-memory + file cache** for fast responses
- 🔄 **Auto-refresh** via GitHub Actions every 6 hours
- 🧩 **Query param customization** — theme, layout, exclude
- 🚀 **Vercel serverless** — deploy in minutes
- 🛡️ **Error-resilient** — returns fallback image on failures

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/github-lang-card.git
cd github-lang-card
npm install
```

### 2. Run locally

```bash
node server.js
# Open: http://localhost:3000/api/languages?username=torvalds
```

### 3. Run tests

```bash
npm test
# Generates sample PNGs in ./test-output/
```

---

## 🌐 Deploy to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Option B: GitHub Integration

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Vercel auto-detects `vercel.json` and deploys

### Set Environment Variables (Optional but Recommended)

In Vercel dashboard → Settings → Environment Variables:

| Variable       | Value                        | Purpose                        |
|---------------|------------------------------|--------------------------------|
| `GITHUB_TOKEN` | `ghp_xxxxxxxxxxxx`          | Avoid API rate limits (60→5000 req/hr) |

---

## 🔄 Auto-Update with GitHub Actions

The workflow at `.github/workflows/update.yml` pings your Vercel endpoint every 6 hours.

Set these **Repository Secrets** in GitHub → Settings → Secrets:

| Secret         | Value                                          |
|---------------|------------------------------------------------|
| `VERCEL_URL`  | `https://your-app.vercel.app`                  |
| `GH_USERNAME` | Your GitHub username                           |

---

## 📖 API Reference

### `GET /api/languages`

| Param      | Type     | Default   | Description                                    |
|-----------|----------|-----------|------------------------------------------------|
| `username` | `string` | required  | GitHub username                                |
| `theme`    | `string` | `dark`    | `dark` or `light`                              |
| `layout`   | `string` | `default` | `default` or `compact` (smaller card)         |
| `exclude`  | `string` | —         | Comma-separated languages to exclude           |
| `refresh`  | `string` | `0`       | Set `1` to bypass cache                        |

### Examples

```
# Default dark theme
/api/languages?username=torvalds

# Light theme, compact layout
/api/languages?username=torvalds&theme=light&layout=compact

# Exclude markup languages
/api/languages?username=torvalds&exclude=HTML,CSS,Makefile

# Force refresh cache
/api/languages?username=torvalds&refresh=1
```

---

## 🖼️ Embed in GitHub README

```markdown
## 🛠️ Languages I Use

![Most Used Languages](https://your-app.vercel.app/api/languages?username=YOUR_USERNAME)
```

Or with a link:

```markdown
[![Most Used Languages](https://your-app.vercel.app/api/languages?username=YOUR_USERNAME)](https://github.com/YOUR_USERNAME)
```

Light/dark theme switching via GitHub's `#gh-dark-mode-only` trick:

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
    srcset="https://your-app.vercel.app/api/languages?username=YOUR_USERNAME&theme=dark">
  <img src="https://your-app.vercel.app/api/languages?username=YOUR_USERNAME&theme=light"
    alt="Most Used Languages">
</picture>
```

---

## 📁 Project Structure

```
github-lang-card/
├── api/
│   └── languages.js          # Vercel serverless handler
├── lib/
│   ├── github.js             # GitHub REST API + pagination
│   ├── chart.js              # Canvas PNG image generation
│   └── cache.js              # In-memory + file cache (6h TTL)
├── test/
│   └── smoke.js              # Local tests (no network needed)
├── .github/
│   └── workflows/
│       └── update.yml        # Auto-refresh every 6 hours
├── server.js                 # Local dev server
├── vercel.json               # Vercel deployment config
├── package.json
└── README.md
```

---

## 🔧 Configuration Notes

- **Rate Limits**: Without `GITHUB_TOKEN`, GitHub allows 60 requests/hour. A token bumps this to 5,000. Generate one at [github.com/settings/tokens](https://github.com/settings/tokens) (no scopes needed for public repos).
- **Private Repos**: Add `repo` scope to your token.
- **Canvas on Vercel**: The `canvas` package requires native binaries. Vercel's Node.js runtime includes them.

---

## 📄 License

MIT
