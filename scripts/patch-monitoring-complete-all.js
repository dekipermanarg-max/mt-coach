const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Keep the "Semua Lengkap" action visible even when a monitoring card is collapsed.
// It sits outside the clickable header so we never nest a <button> inside another <button>.
if (s.includes("monitoring-card-quick-actions")) {
  console.log("Monitoring Semua Lengkap action already present.");
  process.exit(0);
}

const marker = "</button>\n            {open && <div className=\"monitoring-card-body\">";
const replacement = `</button>\n            {!complete && <div className="monitoring-card-quick-actions" style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px 10px", borderTop: "1px solid #eef2f7", background: "#fff" }}><button type="button" onClick={() => completeAllCheckboxes(row)} disabled={saving === row.id} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>{saving === row.id ? "⏳ Menyimpan..." : "✓ Semua Lengkap"}</button></div>}\n            {open && <div className="monitoring-card-body">`;

if (!s.includes(marker)) throw new Error("Monitoring card header marker not found");
s = s.replace(marker, replacement);
fs.writeFileSync(file, s, "utf8");
console.log("✓ Monitoring: Semua Lengkap is now visible on every incomplete card.");
