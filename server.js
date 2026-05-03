const http = require("http");
const handler = require("./api/languages");

const PORT = process.env.PORT || 3000;

/**
 * Wraps Node's raw ServerResponse with Vercel/Express-style helpers:
 *   res.status(code)  → sets statusCode, returns res (chainable)
 *   res.json(obj)     → sends JSON with correct Content-Type
 *   res.send(buf)     → sends raw buffer or string
 */
function wrapRes(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (obj) {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
    }
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = function (data) {
    res.end(data);
    return res;
  };
  return res;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Mimic Vercel: parse query string into req.query
  req.query = Object.fromEntries(url.searchParams.entries());

  // Add Express-style helpers to res
  wrapRes(res);

  if (url.pathname === "/api/languages" || url.pathname === "/") {
    handler(req, res);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

server.listen(PORT, () => {
  console.log(`\nDev server running at http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/languages?username=YOUR_USERNAME\n`);
});