const fs = require("fs");
const path = require("path");

const pageFile = path.join(process.cwd(), "app/monitoring/page.tsx");
const logoPatchFile = path.join(process.cwd(), "scripts/patch-wa-screenshot-exact-logo-v2.js");
let page = fs.readFileSync(pageFile, "utf8");
const logoPatch = fs.readFileSync(logoPatchFile, "utf8");

const match = logoPatch.match(/const logoData = "(data:image\/webp;base64,[^"]+)";/);
if (!match) throw new Error("Embedded BAC logo asset not found in exact-logo patch");
const logoData = match[1];

const broken = "      logoImg.src = logoData;";
const fixed = `      logoImg.src = "${logoData}";`;
if (!page.includes(broken)) {
  if (page.includes(fixed)) {
    console.log("Exact BAC logo runtime asset already fixed");
    process.exit(0);
  }
  throw new Error("Exact BAC logo runtime source line not found");
}
page = page.replace(broken, fixed);
fs.writeFileSync(pageFile, page);
console.log("Fixed exact supplied BAC logo runtime asset");
