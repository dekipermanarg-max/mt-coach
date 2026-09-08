const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Official weekly targets:
// - AuVi TV: 10 sessions/week
// - LD: 50% of branch rombel population/week, using the fixed regional master counts below.
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

// Inject the branch population map into the compiled React page.
const appCountsBlock = `const BRANCH_ROMBEL_COUNTS: Record<string, number> = ${JSON.stringify(BRANCH_ROMBEL_COUNTS, null, 2)};\n`;
if (!s.includes("const BRANCH_ROMBEL_COUNTS")) {
  const appNeedle = 'const BRANCHES = [';
  if (!s.includes(appNeedle)) throw new Error("BRANCHES marker not found");
  s = s.replace(appNeedle, appCountsBlock + appNeedle);
}

const stateNeedle = '  const [ld, setLd] = useState(false);';
const stateAdd = `
  const [weeklyAuviSessions, setWeeklyAuviSessions] = useState(0);
  const [weeklyLdRombels, setWeeklyLdRombels] = useState(0);
  const [weeklyRombelPopulation, setWeeklyRombelPopulation] = useState(0);`;
if (!s.includes('weeklyAuviSessions')) {
  if (!s.includes(stateNeedle)) throw new Error('weekly KPI state marker not found');
  s = s.replace(stateNeedle, stateNeedle + stateAdd);
}

const effectNeedle = '  const selectedDateLabel = date ? formatDate(date) : "";';
const effectAdd = `  useEffect(() => {
    let cancelled = false;
    async function loadWeeklyTargets() {
      if (!branchId || !branch || !date) {
        setWeeklyAuviSessions(0);
        setWeeklyLdRombels(0);
        setWeeklyRombelPopulation(branch ? (BRANCH_ROMBEL_COUNTS[branch] || 0) : 0);
        return;
      }
      const base = new Date(date + "T00:00:00");
      const day = base.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const start = new Date(base);
      start.setDate(base.getDate() + diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startDate = start.toISOString().slice(0, 10);
      const endDate = end.toISOString().slice(0, 10);

      const weekRes = await supabase
        .from("weekly_planning")
        .select("rombel_id,auvi_tv,ld,status")
        .eq("branch_id", branchId)
        .gte("planning_date", startDate)
        .lte("planning_date", endDate);
      if (cancelled) return;

      const planningRows = weekRes.data || [];
      const configuredPopulation = BRANCH_ROMBEL_COUNTS[branch] || 0;
      const planningRombels = new Set(planningRows.map(x => x.rombel_id).filter(Boolean));
      const population = configuredPopulation || planningRombels.size;
      // Draft assignments are part of the live Weekly Planning KPI and must update immediately.
      const auviSessions = planningRows.filter(x => x.auvi_tv).length;
      const ldRombels = new Set(
        planningRows.filter(x => x.ld && x.rombel_id).map(x => x.rombel_id)
      ).size;

      setWeeklyAuviSessions(auviSessions);
      setWeeklyLdRombels(ldRombels);
      setWeeklyRombelPopulation(population);
    }
    loadWeeklyTargets();
    return () => { cancelled = true; };
  }, [branchId, branch, date, sessions]);

`;
if (!s.includes('loadWeeklyTargets')) {
  if (!s.includes(effectNeedle)) throw new Error('weekly KPI effect marker not found');
  s = s.replace(effectNeedle, effectAdd + effectNeedle);
} else {
  s = s.replace('}, [branchId, branch, date]);', '}, [branchId, branch, date, sessions]);');
  s = s.replace('planningRows.filter(x => x.auvi_tv && x.status !== "Draft")', 'planningRows.filter(x => x.auvi_tv)');
  s = s.replace('planningRows.filter(x => x.ld && x.rombel_id && x.status !== "Draft")', 'planningRows.filter(x => x.ld && x.rombel_id)');
}

// Weekly Planning uses a Monday-Sunday period. Keep `date` as the anchor
// for backward compatibility, but show the complete weekly range in the UI.
const rangeNeedle = '  const selectedDateLabel = date ? formatDate(date) : "";';
const rangeAdd = `  const weekBase = new Date(date + "T00:00:00");
  const weekDay = weekBase.getDay();
  const weekDiff = weekDay === 0 ? -6 : 1 - weekDay;
  const weekStart = new Date(weekBase);
  weekStart.setDate(weekBase.getDate() + weekDiff);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);
  const weeklyRangeLabel = \`${formatDate(weekStartStr)} – ${formatDate(weekEndStr)}\`;`;

if (!s.includes("const weeklyRangeLabel")) {
  if (!s.includes(rangeNeedle)) throw new Error("weekly date range marker not found");
  s = s.replace(rangeNeedle, rangeAdd + "\n" + rangeNeedle);
}

// Replace the single-date control with a visible Monday-Sunday range.
// The left date is the week selector; any chosen date represents that week.
const dateControlRegex = /<div className="control-box">\s*<span className="control-label">Tanggal Planning<\/span>\s*<div className="date-control">\s*<div className="date-icon">📅<\/div>\s*<input className="date-input" type="date" value=\{date\} onChange=\{\(e\) => setDate\(e\.target\.value\)\} \/>\s*<\/div>\s*<div className="date-caption">\{selectedDateLabel\}<\/div>\s*<\/div>/;
const dateControl = `<div className="control-box">
          <span className="control-label">Periode Planning</span>
          <div className="date-control" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="date-icon">📅</div>
            <input className="date-input" type="date" value={weekStartStr} aria-label="Tanggal mulai minggu" onChange={(e) => setDate(e.target.value)} />
            <span style={{ fontWeight: 800, color: "#64748b" }}>→</span>
            <input className="date-input" type="date" value={weekEndStr} aria-label="Tanggal akhir minggu" readOnly />
          </div>
          <div className="date-caption">{weeklyRangeLabel}</div>
        </div>`;
if (dateControlRegex.test(s)) {
  s = s.replace(dateControlRegex, dateControl);
} else if (!s.includes("Periode Planning")) {
  throw new Error("Weekly date control marker not found");
}

// Replace date references in the visible planning context with the weekly range.
s = s.replace('<p>{branch} · {selectedDateLabel}</p>', '<p>{branch} · {weeklyRangeLabel}</p>');

// Replace the KPI cards by their visible labels, so the patch survives harmless source formatting changes.
const auviCardRegex = /<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">(?:AuVi TV Coverage|AuVi TV Mingguan)<\/div>[\s\S]*?<\/div><div className="kpi-value">[\s\S]*?<\/div><div className="kpi-note">[\s\S]*?<\/div><\/div>/;
const auviCard = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Mingguan</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{Math.min(100, Math.round((weeklyAuviSessions / 10) * 100))}%</div><div className="kpi-note">{weeklyAuviSessions}/10 sesi tercapai · target 10 sesi per minggu</div></div>';
if (s.includes('AuVi TV Coverage')) {
  if (!auviCardRegex.test(s)) throw new Error('AuVi KPI card marker not found');
  s = s.replace(auviCardRegex, auviCard);
}

const ldCardRegex = /<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">(?:LD|LD Mingguan)<\/div>[\s\S]*?<\/div><div className="kpi-value">[\s\S]*?<\/div><div className="kpi-note">[\s\S]*?<\/div><\/div>/;
const ldCard = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">LD Mingguan</div><div className="kpi-mini-icon">👥</div></div><div className="kpi-value">{weeklyLdRombels}/{weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0}</div><div className="kpi-note">Target 50% rombel per minggu</div></div>';
if (s.includes('>LD</div>') || s.includes('>LD Mingguan</div>')) {
  const matches = s.match(new RegExp(ldCardRegex.source, "g")) || [];
  const ldMatch = matches.find(x => x.includes('>LD</div>') || x.includes('>LD Mingguan</div>'));
  if (!ldMatch) throw new Error('LD KPI card marker not found');
  s = s.replace(ldMatch, ldCard);
}

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning live AuVi/LD targets by branch:", file);
