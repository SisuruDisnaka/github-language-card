const { generateImage } = require("../lib/chart");
const fs = require("fs");
const path = require("path");

const SAMPLE_DATA = [
  { name: "JavaScript", bytes: 450000, percentage: 35.5 },
  { name: "TypeScript", bytes: 320000, percentage: 25.2 },
  { name: "Python", bytes: 180000, percentage: 14.2 },
  { name: "Go", bytes: 120000, percentage: 9.5 },
  { name: "Rust", bytes: 80000, percentage: 6.3 },
  { name: "Shell", bytes: 45000, percentage: 3.6 },
  { name: "Dockerfile", bytes: 30000, percentage: 2.4 },
  { name: "Ruby", bytes: 20000, percentage: 1.6 },
  { name: "C++", bytes: 12000, percentage: 0.9 },
  { name: "Lua", bytes: 8000, percentage: 0.8 },
];

const outDir = path.join(__dirname, "../test-output");
fs.mkdirSync(outDir, { recursive: true });

console.log("Running smoke tests...\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

// Dark theme
test("Generates dark theme PNG", () => {
  const buf = generateImage(SAMPLE_DATA, { theme: "dark", username: "octocat" });
  if (!buf || buf.length < 1000) throw new Error("Buffer too small");
  fs.writeFileSync(path.join(outDir, "dark.png"), buf);
});

// Light theme
test("Generates light theme PNG", () => {
  const buf = generateImage(SAMPLE_DATA, { theme: "light", username: "octocat" });
  if (!buf || buf.length < 1000) throw new Error("Buffer too small");
  fs.writeFileSync(path.join(outDir, "light.png"), buf);
});

// Compact layout
test("Generates compact layout PNG", () => {
  const buf = generateImage(SAMPLE_DATA, { theme: "dark", layout: "compact" });
  if (!buf || buf.length < 1000) throw new Error("Buffer too small");
  fs.writeFileSync(path.join(outDir, "compact.png"), buf);
});

// Single language
test("Handles single language gracefully", () => {
  const single = [{ name: "Python", bytes: 100, percentage: 100 }];
  const buf = generateImage(single, { theme: "dark" });
  if (!buf || buf.length < 100) throw new Error("Buffer too small");
});

// Empty error case
test("Handles empty language list", () => {
  const buf = generateImage(
    [{ name: "No Languages Found", bytes: 1, percentage: 100 }],
    { theme: "dark" }
  );
  if (!buf) throw new Error("Should return buffer");
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("Some tests failed!");
  process.exit(1);
} else {
  console.log(`\nAll tests passed! Check ./test-output/ for generated images.`);
}
