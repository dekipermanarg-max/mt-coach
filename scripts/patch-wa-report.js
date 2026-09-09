const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Keep the WhatsApp report wording defined in app/monitoring/page.tsx.
// This patch must not overwrite the report block during GitHub Pages builds.
s = s.replace("📲 Generate Report WA Hari Ini", "📲 Generate Pesan WA Hari Ini");

if (!s.includes("Bantu kerjakan drill ... soal benar dan share bukti pengerjaannya di grup ini.")) {
  throw new Error("Expected WhatsApp reminder wording not found in Monitoring page");
}

fs.writeFileSync(file, s);
console.log("Preserved WhatsApp report wording; only normalized the button label:", file);
