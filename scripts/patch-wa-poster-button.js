const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/data/page.tsx");
let s = fs.readFileSync(file, "utf8");

if (!s.includes('data-wa-poster-button')) {
  const marker = '              <button className="row-delete" disabled={saving} onClick={() => { void deleteWaTemplate(t); }}>Hapus</button>';
  const replacement = `              {t.title === "Wording Reminder Mingguan!! (Tiap Senin)" && <button data-wa-poster-button className="secondary-btn" style={{ padding: "8px 10px", fontSize: 11 }} onClick={() => { const a = document.createElement("a"); a.href = "/assets/ceklis-mt.svg"; a.download = "CEKLIS-MT.svg"; document.body.appendChild(a); a.click(); a.remove(); }}>📥 Download Poster</button>}\n${marker}`;
  if (!s.includes(marker)) throw new Error("WhatsApp template action marker not found");
  s = s.replace(marker, replacement);
}

fs.writeFileSync(file, s);
console.log("Added CEKLIS MT poster download button to the Monday reminder template");
