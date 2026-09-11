const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Remove the initials/status circle from the MT header.
s = s.replace(
  '<div className="monitoring-mt"><span className="monitoring-status-dot">{complete ? "✓" : "!"}</span>{nameOf(mts, row.mt_id)}</div>',
  '<div className="monitoring-mt">{nameOf(mts, row.mt_id)}</div>'
);

// Keep Jenis Sesi as its own clearly visible field instead of mixing it into the metadata line.
const oldSubmeta = '<div className="monitoring-submeta">{nameOf(rombels, row.rombel_id)} · {nameOf(mapels, row.mapel_id)} · <span className="monitoring-session-type-badge" style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", marginLeft: 2, borderRadius: 999, fontSize: 11, fontWeight: 700, lineHeight: 1.35, border: `1px solid ${row.jenis_sesi === "Klinik PR" ? "#bfdbfe" : row.jenis_sesi === "Trial Class" ? "#fde68a" : "#fecaca"}`, color: row.jenis_sesi === "Klinik PR" ? "#1d4ed8" : row.jenis_sesi === "Trial Class" ? "#b45309" : "#b91c1c", background: row.jenis_sesi === "Klinik PR" ? "#dbeafe" : row.jenis_sesi === "Trial Class" ? "#fef3c7" : "#fee2e2" }}>{row.jenis_sesi}</span></div>';
const newSubmeta = '<div className="monitoring-submeta">{nameOf(rombels, row.rombel_id)} · {nameOf(mapels, row.mapel_id)}</div><div className="monitoring-session-type-label"><span>Jenis Sesi</span><strong>{row.jenis_sesi}</strong></div>';
if (s.includes(oldSubmeta)) {
  s = s.replace(oldSubmeta, newSubmeta);
} else {
  const generic = /<div className="monitoring-submeta">\{nameOf\(rombels, row\.rombel_id\).*?<\/div>/;
  if (generic.test(s)) s = s.replace(generic, newSubmeta);
}

// If the previous patch has not yet added a badge, create a clean type badge style.
const styleNeedle = '<style>{`';
const styleAdd = '.monitoring-session-type-label{display:inline-flex;align-items:center;gap:7px;margin-top:6px;font-size:11px}.monitoring-session-type-label span{color:#64748b}.monitoring-session-type-label strong{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;background:#eef6f3;color:#047857;font-weight:800}.monitoring-session-type-label strong{border:1px solid #ccefe2}';
if (!s.includes('.monitoring-session-type-label{')) s = s.replace(styleNeedle, styleNeedle + styleAdd);

fs.writeFileSync(file, s);
console.log("Removed Monitoring MT initials and added Jenis Sesi label.");
