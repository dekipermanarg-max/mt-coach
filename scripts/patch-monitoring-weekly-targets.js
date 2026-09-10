const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Correct weekly target rules:
// - LD: minimum 50% of unique rombels.
// - AuVi TV: 10 sessions per week.
const BRANCH_ROMBEL_COUNTS = {
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

const countsBlock = `const MONITORING_BRANCH_ROMBEL_COUNTS: Record<string, number> = ${JSON.stringify(BRANCH_ROMBEL_COUNTS, null, 2)};\n`;
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

  // LD achievement = unique rombels that have at least one LD session in the week.
  const targetLdRombels = new Set(targetWeekRows.filter(r => r.ld && r.rombel_id).map(r => r.rombel_id)).size;
  // AuVi achievement = number of AuVi TV sessions in the week.
  const targetAuviSessions = targetWeekRows.filter(r => r.auvi_tv).length;

  const targetBranches = branchId === "all" ? Object.keys(MONITORING_BRANCH_ROMBEL_COUNTS) : [nameOf(branches, branchId)];
  const targetRombelPopulation = targetBranches.reduce((sum, branchName) => sum + (MONITORING_BRANCH_ROMBEL_COUNTS[branchName] || 0), 0);
  const targetLdGoal = Math.ceil(targetRombelPopulation * 0.5);
  const targetAuviGoal = 10;
  const ldProgress = targetLdGoal ? Math.min(100, Math.round((targetLdRombels / targetLdGoal) * 100)) : 0;
  const auviProgress = Math.min(100, Math.round((targetAuviSessions / targetAuviGoal) * 100));
`;

if (s.includes("const targetWeekRows")) {
  const blockRegex = /  const targetWeekRows = filtered\.filter\(r => r\.planning_date >= targetWeekStartStr && r\.planning_date <= targetWeekEndStr\);[\s\S]*?  const ldProgress = Math\.min\(100, Math\.round\(\(targetLdSessions \/ targetLdGoal\) \* 100\)\);\n/;
  if (!blockRegex.test(s)) throw new Error("Existing Monitoring target block not found");
  s = s.replace(blockRegex, stateBlock);
} else {
  if (!s.includes(stateNeedle)) throw new Error("Monitoring summary marker not found");
  s = s.replace(stateNeedle, stateNeedle + "\n" + stateBlock);
}

const targetSection = `<section className="grid monitoring-target-row"><div className="card planning-kpi monitoring-target-kpi monitoring-ld-kpi"><div className="kpi-label">Target LD</div><div className="kpi-value">{targetLdRombels}/{targetLdGoal}</div><div className="kpi-note">≥ 50% unique rombel · {ldProgress}%</div></div><div className="card planning-kpi monitoring-target-kpi monitoring-auvi-kpi"><div className="kpi-label">Target AuVi TV</div><div className="kpi-value">{targetAuviSessions}/{targetAuviGoal}</div><div className="kpi-note">10 sesi per minggu · {auviProgress}%</div></div></section>`;

const sectionRegex = /<section className="grid monitoring-target-row">[\s\S]*?<\/section>/;
if (sectionRegex.test(s)) {
  s = s.replace(sectionRegex, targetSection);
} else {
  const listNeedles = [
    '<section className="card monitoring-list-card">',
    '<section className="card monitoring-card-list">',
  ];
  const listNeedle = listNeedles.find(needle => s.includes(needle));
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
console.log("Applied Monitoring targets: LD >= 50% unique rombels; AuVi TV 10 sessions/week");
