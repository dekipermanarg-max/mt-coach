const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Weekly targets used by Monitoring:
// - AuVi TV: minimum 50% of rombel population in the selected monitoring period/week.
// - LD: 10 sessions per week.
const stateNeedle = '  const incompleteCount = incompleteRows.length;';
const stateBlock = `  const auviRombels = new Set(filtered.filter(r => r.auvi_tv && r.rombel_id).map(r => r.rombel_id)).size;
  const totalRombels = new Set(filtered.map(r => r.rombel_id).filter(Boolean)).size;
  const auviTarget = Math.ceil(totalRombels * 0.5);
  const ldSessions = filtered.filter(r => r.ld).length;
  const ldTarget = 10;
  const auviProgress = auviTarget ? Math.min(100, Math.round((auviRombels / auviTarget) * 100)) : 0;
  const ldProgress = Math.min(100, Math.round((ldSessions / ldTarget) * 100));
`;
if (!s.includes("const auviRombels = new Set")) {
  if (!s.includes(stateNeedle)) throw new Error("Monitoring summary marker not found");
  s = s.replace(stateNeedle, stateNeedle + "\n" + stateBlock);
}

const oldKpis = '<div className="grid planning-kpis"><div className="card planning-kpi"><div className="kpi-label">Finalized Session</div><div className="kpi-value">{filtered.length}</div><div className="kpi-note">Sesi siap dimonitor</div></div><div className="card planning-kpi"><div className="kpi-label">Admin Completion</div><div className="kpi-value">{avgAdmin}%</div><div className="kpi-note">Mengikuti aturan jenis sesi</div></div><div className="card planning-kpi"><div className="kpi-label">Lengkap</div><div className="kpi-value">{completeCount}</div><div className="kpi-note">Sesuai administrasi wajib</div></div></div>';
const newKpis = `<div className="grid planning-kpis monitoring-kpis-extended"><div className="card planning-kpi"><div className="kpi-label">Finalized Session</div><div className="kpi-value">{filtered.length}</div><div className="kpi-note">Sesi siap dimonitor</div></div><div className="card planning-kpi"><div className="kpi-label">Admin Completion</div><div className="kpi-value">{avgAdmin}%</div><div className="kpi-note">Mengikuti aturan jenis sesi</div></div><div className="card planning-kpi"><div className="kpi-label">Lengkap</div><div className="kpi-value">{completeCount}</div><div className="kpi-note">Sesuai administrasi wajib</div></div><div className="card planning-kpi monitoring-target-kpi"><div className="kpi-label">Target AuVi TV</div><div className="kpi-value">{auviRombels}/{auviTarget}</div><div className="kpi-note">Minimal 50% rombel per minggu · {auviProgress}%</div></div><div className="card planning-kpi monitoring-target-kpi"><div className="kpi-label">Target LD</div><div className="kpi-value">{ldSessions}/{ldTarget}</div><div className="kpi-note">10 sesi per minggu · {ldProgress}%</div></div></div>`;
if (s.includes(oldKpis)) {
  s = s.replace(oldKpis, newKpis);
} else if (!s.includes("monitoring-target-kpi")) {
  throw new Error("Monitoring KPI cards marker not found");
}

const styleNeedle = '<style>{`';
const styleAdd = '.monitoring-kpis-extended{grid-template-columns:repeat(5,minmax(0,1fr))}.monitoring-target-kpi{border-top:3px solid #7c3aed}.monitoring-target-kpi:nth-child(5){border-top-color:#059669}@media(max-width:1100px){.monitoring-kpis-extended{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){.monitoring-kpis-extended{grid-template-columns:1fr}}';
if (!s.includes("monitoring-kpis-extended")) {
  if (!s.includes(styleNeedle)) throw new Error("Monitoring style marker not found");
  s = s.replace(styleNeedle, styleNeedle + styleAdd);
}

fs.writeFileSync(file, s);
console.log("Applied Monitoring weekly targets: AuVi 50% rombel and LD 10 sessions");
