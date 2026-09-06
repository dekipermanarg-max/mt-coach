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

const stateNeedle = '  const [ld, setLd] = useState(false);';
const stateAdd = `\n  const [weeklyAuviSessions, setWeeklyAuviSessions] = useState(0);\n  const [weeklyLdRombels, setWeeklyLdRombels] = useState(0);\n  const [weeklyRombelPopulation, setWeeklyRombelPopulation] = useState(0);`;
if (!s.includes('weeklyAuviSessions')) {
  if (!s.includes(stateNeedle)) throw new Error('weekly KPI state marker not found');
  s = s.replace(stateNeedle, stateNeedle + stateAdd);
}

const effectNeedle = '  const selectedDateLabel = date ? formatDate(date) : "";';
const effectAdd = `  useEffect(() => {\n    let cancelled = false;\n    async function loadWeeklyTargets() {\n      if (!branchId) {\n        setWeeklyAuviSessions(0);\n        setWeeklyLdRombels(0);\n        setWeeklyRombelPopulation(0);\n        return;\n      }\n      const base = date ? new Date(\`${date}T00:00:00\`) : new Date();\n      const day = base.getDay();\n      const diff = day === 0 ? -6 : 1 - day;\n      const start = new Date(base);\n      start.setDate(base.getDate() + diff);\n      const end = new Date(start);\n      end.setDate(start.getDate() + 6);\n      const startDate = start.toISOString().slice(0, 10);\n      const endDate = end.toISOString().slice(0, 10);\n\n      const weekRes = await supabase.from("weekly_planning").select("rombel_id,auvi_tv,ld,status").eq("branch_id", branchId).gte("planning_date", startDate).lte("planning_date", endDate);\n      if (cancelled) return;\n\n      const planningRows = weekRes.data || [];\n      const configuredPopulation = BRANCH_ROMBEL_COUNTS[branch] || 0;\n      const planningRombels = new Set(planningRows.map(x => x.rombel_id).filter(Boolean));\n      const population = configuredPopulation || planningRombels.size;\n      const auviSessions = planningRows.filter(x => x.auvi_tv && x.status !== "Draft").length;\n      const ldRombels = new Set(planningRows.filter(x => x.ld && x.rombel_id && x.status !== "Draft").map(x => x.rombel_id)).size;\n\n      setWeeklyAuviSessions(auviSessions);\n      setWeeklyLdRombels(ldRombels);\n      setWeeklyRombelPopulation(population);\n    }\n    loadWeeklyTargets();\n    return () => { cancelled = true; };\n  }, [branchId, branch, date]);\n\n`;
if (!s.includes('loadWeeklyTargets')) {
  if (!s.includes(effectNeedle)) throw new Error('weekly KPI effect marker not found');
  s = s.replace(effectNeedle, effectAdd + effectNeedle);
}

const oldKpi = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Coverage</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{auviCoverage}%</div><div className="kpi-note">{auviRombels}/{totalRombels} rombel · target ≥ 50%</div></div>';
const newKpi = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Mingguan</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{Math.min(100, Math.round((weeklyAuviSessions / 10) * 100))}%</div><div className="kpi-note">{weeklyAuviSessions}/10 sesi tercapai · target 10 sesi per minggu</div></div>';
if (!s.includes('AuVi TV Mingguan')) {
  if (!s.includes(oldKpi)) throw new Error('AuVi KPI marker not found');
  s = s.replace(oldKpi, newKpi);
}

const oldLdKpi = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">LD</div><div className="kpi-mini-icon">👥</div></div><div className="kpi-value">{ldCount}<span style={{ fontSize: 14, color: "#94a3b8", marginLeft: 5 }}>/ 10</span></div><div className="kpi-note">Target 10 sesi per minggu</div></div>';
const newLdKpi = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">LD Mingguan</div><div className="kpi-mini-icon">👥</div></div><div className="kpi-value">{weeklyLdRombels}/{weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0}</div><div className="kpi-note">Target 50% rombel per minggu</div></div>';
if (!s.includes('LD Mingguan')) {
  if (!s.includes(oldLdKpi)) throw new Error('LD KPI marker not found');
  s = s.replace(oldLdKpi, newLdKpi);
}

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning official AuVi/LD targets by branch:", file);
