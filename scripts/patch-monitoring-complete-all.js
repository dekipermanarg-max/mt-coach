const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// The canonical Monitoring UI now places all session actions in one row:
// [✓ Semua Lengkap] [✏️ Edit Sesi] [🗑️ Hapus]
// Do not add a separate quick-action row above Edit Sesi.
const quickAction = /\s*\{!complete && <div className="monitoring-card-quick-actions"[\s\S]*?<\/div>\}\s*(?=\{open && <div className="monitoring-card-body">)/;
if (quickAction.test(s)) {
  s = s.replace(quickAction, "\n            ");
  fs.writeFileSync(file, s, "utf8");
  console.log("✓ Removed legacy separate Semua Lengkap row.");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✓ Monitoring Semua Lengkap remains in the session action row.");
}