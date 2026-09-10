const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Weekly Planning target rules:
// - AuVi TV: minimum 50% of unique rombels actually running/planned in the week.
// - LD: 10 sessions per week.
// The AuVi denominator must come from the finalized sessions in the selected week,
// not from a hardcoded branch population.

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
  const targetRunningRombels = new Set(targetWeekRows.map(r => r.rombel_id).filter(Boolean)).size;
  const targetAuviRombels = new Set(targetWeekRows.filter(r => r.auvi_tv && r.rombel_id).map(r => r.rombel_id)).size;
  const targetLdSessions = targetWeekRows.filter(r => r.ld).length;
  const targetAuviGoal = Math.ceil(targetRunningRombels * 0.5);
  const targetLdGoal = 10;
  const auviProgress = targetAuviGoal ? Math.min(100, Math.round((targetAuviRombels / targetAuviGoal) * 100)) : 0;
  const ldProgress = Math.min(100, Math.round((targetLdSessions / targetLdGoal) * 100));
`;
if (!s.includes("const targetWeekRows")) {
  if (!s.includes(stateNeedle)) throw new Error("Monitoring summary marker not found");
  s = s.replace(stateNeedle, stateNeedle + "\n" + stateBlock);
}

// Support both the newer and restored Monitoring list markup.
if (!s.includes("monitoring-target-kpi")) {
  const listNeedles = [
    '<section className="card monitoring-list-card">',
    '<section className="card monitoring-card-list">',
  ];
  const listNeedle = listNeedles.find(needle => s.includes(needle));
  const targetSection = `<section className="grid monitoring-target-row"><div className="card planning-kpi monitoring-target-kpi monitoring-auvi-kpi"><div className="kpi-label">Target AuVi TV</div><div className="kpi-value">{targetAuviRombels}/{targetAuviGoal}</div><div className="kpi-note">≥ 50% unique rombel berjalan · {auviProgress}%</div></div><div className="card planning-kpi monitoring-target-kpi monitoring-ld-kpi"><div className="kpi-label">Target LD</div><div className="kpi-value">{targetLdSessions}/{targetLdGoal}</div><div className="kpi-note">10 sesi per minggu · {ldProgress}%</div></div></section>`;
  if (!listNeedle) throw new Error("Monitoring list marker not found");
  s = s.replace(listNeedle, targetSection + listNeedle);
}

const styleNeedle = '<style>{`';
const styleAdd = '.monitoring-target-row{grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:18px}.monitoring-target-kpi{border-top:3px solid #7c3aed}.monitoring-auvi-kpi{border-top-color:#7c3aed!important}.monitoring-ld-kpi{border-top-color:#059669!important}@media(max-width:700px){.monitoring-target-row{grid-template-columns:1fr}}';
if (!s.includes("monitoring-target-row")) {
  if (!s.includes(styleNeedle)) throw new Error("Monitoring style marker not found");
  s = s.replace(styleNeedle, styleNeedle + styleAdd);
}

fs.writeFileSync(file, s);
console.log("Applied Monitoring targets: AuVi >= 50% of running unique rombels/week; LD 10 sessions/week");
