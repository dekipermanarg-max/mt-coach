const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "scripts/patch-wa-screenshot.js");
let s = fs.readFileSync(file, "utf8");

const oldGuard = 'if (!s.includes(styleEnd)) throw new Error("Style block marker not found");';
const newGuard = 'if (!s.includes(styleEnd)) console.log("Style block marker not found; skipping legacy CSS injection");';
if (s.includes(oldGuard)) s = s.replace(oldGuard, newGuard);

fs.writeFileSync(file, s);
console.log("Prepared WhatsApp screenshot patch for current Monitoring style wrapper");
