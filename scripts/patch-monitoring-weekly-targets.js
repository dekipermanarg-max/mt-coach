const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Correct weekly target rules:
// - AuVi TV: 10 sessions per week.
// - LD: minimum 50% of unique rombels that are actually running/planned in the week.
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

  // AuVi achievement = number of AuVi TV sessions in the week.
  const targetAuviSessions = targetWeekRows.filter(r => r.auvi_tv || r.auvi_tv_status === "Connect ke TV").length;
  // LD achievement = unique rombels with at least one LD session in the week.
  const targetRunningRombels = new Set(targetWeekRows.map(r => r.rombel_id).filter(Boolean)).size;
  const targetLdRombels = new Set(targetWeekRows.filter(r => r.ld && r.rombel_id).map(r => r.rombel_id)).size;

  const targetAuviGoal = 10;
  const targetLdGoal = Math.ceil(targetRunningRombels * 0.5);
  const auviProgress = Math.min(100, Math.round((targetAuviSessions / targetAuviGoal) * 100));
  const ldProgress = targetLdGoal ? Math.min(100, Math.round((targetLdRombels / targetLdGoal) * 100)) : 0;
`;

if (s.includes("const targetWeekRows")) {
  const start = s.indexOf('  const targetWeekRows =');
  const endMarker = '  const ldProgress = Math.min(100, Math.round((targetLdSessions / targetLdGoal) * 100));';
  const end = s.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error("Existing Monitoring target block not found");
  const endPos = end + endMarker.length;
  s = s.slice(0, start) + stateBlock.trimEnd() + s.slice(endPos);
} else {
  if (!s.includes(stateNeedle)) throw new Error("Monitoring summary marker not found");
  s = s.replace(stateNeedle, stateNeedle + "\n" + stateBlock);
}

const targetSection = `<section className="grid monitoring-target-row"><div className="card planning-kpi monitoring-target-kpi monitoring-auvi-kpi"><div className="kpi-label">Target AuVi TV</div><div className="kpi-value">{targetAuviSessions}/{targetAuviGoal}</div><div className="kpi-note monitoring-target-note">10 sesi per minggu · {auviProgress}%</div></div><div className="card planning-kpi monitoring-target-kpi monitoring-ld-kpi"><div className="kpi-label">Target LD</div><div className="kpi-value">{targetLdRombels}/{targetLdGoal}</div><div className="kpi-note monitoring-target-note">≥ 50% unique rombel berjalan · {ldProgress}%</div></div></section>`;

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
const styleAdd = '.monitoring-target-row{grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:18px}.monitoring-target-kpi{border-top:3px solid #7c3aed;min-height:96px;padding-bottom:34px!important}.monitoring-auvi-kpi{border-top-color:#7c3aed!important}.monitoring-ld-kpi{border-top-color:#059669!important}.monitoring-target-note{white-space:normal;overflow-wrap:anywhere;line-height:1.3;max-width:68%;padding-right:4px}@media(max-width:700px){.monitoring-target-row{grid-template-columns:1fr}.monitoring-target-note{max-width:72%}}';
const styleMarker = '.monitoring-target-note{';
if (!s.includes(styleMarker)) {
  if (!s.includes(styleNeedle)) throw new Error("Monitoring style marker not found");
  s = s.replace(styleNeedle, styleNeedle + styleAdd);
}

fs.writeFileSync(file, s);
console.log("Applied Monitoring targets: AuVi TV 10 sessions/week; LD >= 50% unique running rombels; wrapped target notes");
