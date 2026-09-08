const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

const oldArticle = 'className={`monitoring-session-card ${complete ? "is-complete" : "is-incomplete"}`}';
const newArticle = 'className={`monitoring-session-card ${complete ? "is-complete" : "is-incomplete"}`} style={{ borderLeft: `4px solid ${row.jenis_sesi === "Klinik PR" ? "#7c3aed" : row.jenis_sesi === "Trial Class" ? "#ea580c" : "#2563eb"}`, background: `linear-gradient(90deg, ${row.jenis_sesi === "Klinik PR" ? "#f5f3ff" : row.jenis_sesi === "Trial Class" ? "#fff7ed" : "#eff6ff"} 0%, #ffffff 24%)` }}';
if (!s.includes(oldArticle)) throw new Error("monitoring session article marker not found");
s = s.replace(oldArticle, newArticle);

const oldSubmeta = '<div className="monitoring-submeta">{nameOf(rombels, row.rombel_id)} · {nameOf(mapels, row.mapel_id)} · {row.jenis_sesi}</div>';
const newSubmeta = '<div className="monitoring-submeta">{nameOf(rombels, row.rombel_id)} · {nameOf(mapels, row.mapel_id)} · <span className="monitoring-session-type-badge" style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", marginLeft: 2, borderRadius: 999, fontSize: 11, fontWeight: 700, lineHeight: 1.35, border: `1px solid ${row.jenis_sesi === "Klinik PR" ? "#ddd6fe" : row.jenis_sesi === "Trial Class" ? "#fed7aa" : "#bfdbfe"}`, color: row.jenis_sesi === "Klinik PR" ? "#6d28d9" : row.jenis_sesi === "Trial Class" ? "#c2410c" : "#1d4ed8", background: row.jenis_sesi === "Klinik PR" ? "#ede9fe" : row.jenis_sesi === "Trial Class" ? "#ffedd5" : "#dbeafe" }}>{row.jenis_sesi}</span></div>';
if (!s.includes(oldSubmeta)) throw new Error("monitoring session type label marker not found");
s = s.replace(oldSubmeta, newSubmeta);

fs.writeFileSync(file, s);
console.log("Applied Monitoring session-type colors: KBM blue, Klinik PR purple, Trial Class orange");
