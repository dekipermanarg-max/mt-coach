const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Keep Monitoring targets identical to Weekly Planning:
// - AuVi TV: 10 sessions per week.
// - LD: 50% of total rombel population of the selected branch per week.
const branchCounts = {
  "Padang - Ujung Gurun": 2,
  "Padang - Tarandam": 6,
  "Padang - Sutomo": 11,
  "Padang - S. Parman": 6,
  "Padang - Gajah Mada": 10,
  "Solok - Pandan": 6,
  "Payakumbuh - Simpang Benteng": 9,
  "Painan - Pagaruyung": 6,
  "Bukittinggi - Manggis Ganting": 5,
  "Bukittinggi - Jambu Air": 6,
};

const countsBlock = `const MONITORING_BRANCH_ROMBEL_COUNTS: Record<string, number> = ${JSON.stringify(branchCounts, null, 2)};\n`;
if (!s.includes("const MONITORING_BRANCH_ROMBEL_COUNTS")) {
  const branchNeedle = 'const AUVISTATUSES = [';
  if (!s.includes(branchNeedle)) throw new Error("Monitoring constants marker not found");
  s = s.replace(branchNeedle, countsBlock + branchNeedle);
}

const stateNeedle = '  const incompleteCount = incompleteRows.length;';
const stateBlock = `  const targetWeekBase = new Date((startDate || new Date().toISOString().slice(0, 10)) + "T00:00:00");
  const targetWeekDay = targetWeekBase.getDay();
  const targetWeekDiff = targetWeekDay === 0 ? -6 : 1 - targetWeekDay;
  const targetWeekStart = new Date(targetWeekBase);
  targetWeekStart.setDate(targetWeekBase.getDate() + targetWeekDiff);
  const targetWeekEnd = new Date(targetWeekStart);
  targetWeekEnd.setDate(targetWeekStart.getDate() + 6);
  const targetWeekStartStr = targetWeekStart.toISOString().slice(0, 10);
  const targetWeekEndStr = targetWeekEnd.toISOString().slice(0, 10);
  const targetWeekRows = filtered.filter(r => r.planning_date >= targetWeekStartStr && r.planning_date <= targetWeekEndStr);
  const targetAuviSessions = targetWeekRows.filter(r => r.auvi_tv).length;
  const targetLdRombels = new Set(targetWeekRows.filter(r => r.ld && r.rombel_id).map(r => r.branch_id + ":" + r.rombel_id)).size;
  const targetBranches = branchId === "all" ? Array.from(new Set(targetWeekRows.map(r => r.branch_id))) : [branchId];
  const targetRombelPopulation = targetBranches.reduce((sum, id) => {
    const branchName = nameOf(branches, id);
    return sum + (MONITORING_BRANCH_ROMBEL_COUNTS[branchName] || 0);
  }, 0);
  const targetAuviGoal = 10;
  const targetLdGoal = Math.ceil(targetRombelPopulation * 0.5);
  const auviProgress = Math.min(100, Math.round((targetAuviSessions / targetAuviGoal) * 100));
  const ldProgress = targetLdGoal ? Math.min(100, Math.round((targetLdRombels / targetLdGoal) * 100)) : 0;
`;
if (!s.includes("const targetWeekRows")) {
  if (!s.includes(stateNeedle)) throw new Error("Monitoring summary marker not found");
  s = s.replace(stateNeedle, stateNeedle + "\n" + stateBlock);
}

const oldKpis = '<div className="grid planning-kpis"><div className="card planning-kpi"><div className="kpi-label">Finalized Session</div><div className="kpi-value">{filtered.length}</div><div className="kpi-note">Sesi siap dimonitor</div></div><div className="card planning-kpi"><div className="kpi-label">Admin Completion</div><div className="kpi-value">{avgAdmin}%</div><div className="kpi-note">Mengikuti aturan jenis sesi</div></div><div className="card planning-kpi"><div className="kpi-label">Lengkap</div><div className="kpi-value">{completeCount}</div><div className="kpi-note">Sesuai administrasi wajib</div></div></div>';
const newKpis = `<div className="grid planning-kpis monitoring-kpis-extended"><div className="card planning-kpi"><div className="kpi-label">Finalized Session</div><div className="kpi-value">{filtered.length}</div><div className="kpi-note">Sesi siap dimonitor</div></div><div className="card planning-kpi"><div className="kpi-label">Admin Completion</div><div className="kpi-value">{avgAdmin}%</div><div className="kpi-note">Mengikuti aturan jenis sesi</div></div><div className="card planning-kpi"><div className="kpi-label">Lengkap</div><div className="kpi-value">{completeCount}</div><div className="kpi-note">Sesuai administrasi wajib</div></div><div className="card planning-kpi monitoring-target-kpi monitoring-auvi-kpi"><div className="kpi-label">Target AuVi TV</div><div className="kpi-value">{targetAuviSessions}/{targetAuviGoal}</div><div className="kpi-note">10 sesi per minggu · {auviProgress}%</div></div><div className="card planning-kpi monitoring-target-kpi monitoring-ld-kpi"><div className="kpi-label">Target LD</div><div className="kpi-value">{targetLdRombels}/{targetLdGoal}</div><div className="kpi-note">50% rombel per minggu · {ldProgress}%</div></div></div>`;
if (s.includes(oldKpis)) {
  s = s.replace(oldKpis, newKpis);
} else if (!s.includes("monitoring-target-kpi")) {
  throw new Error("Monitoring KPI cards marker not found");
}

const styleNeedle = '<style>{`';
const styleAdd = '.monitoring-kpis-extended{grid-template-columns:repeat(5,minmax(0,1fr))}.monitoring-target-kpi{border-top:3px solid #7c3aed}.monitoring-auvi-kpi{border-top-color:#7c3aed!important}.monitoring-ld-kpi{border-top-color:#059669!important}@media(max-width:1100px){.monitoring-kpis-extended{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){.monitoring-kpis-extended{grid-template-columns:1fr}}';
if (!s.includes("monitoring-auvi-kpi")) {
  if (!s.includes(styleNeedle)) throw new Error("Monitoring style marker not found");
  s = s.replace(styleNeedle, styleNeedle + styleAdd);
}

fs.writeFileSync(file, s);
console.log("Applied Monitoring targets matching Weekly Planning: AuVi 10 sessions/week; LD 50% branch rombel/week");
