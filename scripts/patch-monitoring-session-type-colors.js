const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Support both the legacy monitoring-session-card markup and the current monitoring-session markup.
const oldArticle = 'className={`monitoring-session-card ${complete ? "is-complete" : "is-incomplete"}`}';
const newArticle = 'className={`monitoring-session-card ${complete ? "is-complete" : "is-incomplete"}`} style={{ borderLeft: `4px solid ${row.jenis_sesi === "Klinik PR" ? "#2563eb" : row.jenis_sesi === "Trial Class" ? "#f59e0b" : "#ef4444"}`, background: `linear-gradient(90deg, ${row.jenis_sesi === "Klinik PR" ? "#eff6ff" : row.jenis_sesi === "Trial Class" ? "#fffbeb" : "#fef2f2"} 0%, #ffffff 24%)` }}';
if (s.includes(oldArticle)) {
  s = s.replace(oldArticle, newArticle);
} else {
  const currentArticle = 'className={`monitoring-session ${done === total ? "complete" : "incomplete"}`}';
  const currentArticlePatched = 'className={`monitoring-session ${done === total ? "complete" : "incomplete"}`} style={{ borderLeft: `4px solid ${row.jenis_sesi === "Klinik PR" ? "#2563eb" : row.jenis_sesi === "Trial Class" ? "#f59e0b" : "#ef4444"}`, background: `linear-gradient(90deg, ${row.jenis_sesi === "Klinik PR" ? "#eff6ff" : row.jenis_sesi === "Trial Class" ? "#fffbeb" : "#fef2f2"} 0%, #ffffff 24%)` }}';
  if (s.includes(currentArticle)) s = s.replace(currentArticle, currentArticlePatched);
}

const oldSubmeta = '<div className="monitoring-submeta">{nameOf(rombels, row.rombel_id)} · {nameOf(mapels, row.mapel_id)} · {row.jenis_sesi}</div>';
const oldSubmetaPatched = '<div className="monitoring-submeta">{nameOf(rombels, row.rombel_id)} · {nameOf(mapels, row.mapel_id)} · <span className="monitoring-session-type-badge" style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", marginLeft: 2, borderRadius: 999, fontSize: 11, fontWeight: 700, lineHeight: 1.35, border: `1px solid ${row.jenis_sesi === "Klinik PR" ? "#bfdbfe" : row.jenis_sesi === "Trial Class" ? "#fde68a" : "#fecaca"}`, color: row.jenis_sesi === "Klinik PR" ? "#1d4ed8" : row.jenis_sesi === "Trial Class" ? "#b45309" : "#b91c1c", background: row.jenis_sesi === "Klinik PR" ? "#dbeafe" : row.jenis_sesi === "Trial Class" ? "#fef3c7" : "#fee2e2" }}>{row.jenis_sesi}</span></div>';
if (s.includes(oldSubmeta)) {
  s = s.replace(oldSubmeta, oldSubmetaPatched);
} else {
  const currentSubmeta = s.match(/<div className="monitoring-submeta">\{nameOf\(rombels, row\.rombel_id\).*?<\/div>/)?.[0];
  if (currentSubmeta) s = s.replace(currentSubmeta, oldSubmetaPatched);
}

fs.writeFileSync(file, s);
console.log("Applied Monitoring session-type colors where supported; skipped legacy-only markers when absent.");