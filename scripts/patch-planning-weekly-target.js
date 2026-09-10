const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

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

const appCountsBlock = `const BRANCH_ROMBEL_COUNTS: Record<string, number> = ${JSON.stringify(BRANCH_ROMBEL_COUNTS, null, 2)};\n`;
if (!s.includes("const BRANCH_ROMBEL_COUNTS")) {
  const appNeedle = "const BRANCHES = [";
  if (!s.includes(appNeedle)) throw new Error("BRANCHES marker not found");
  s = s.replace(appNeedle, appCountsBlock + appNeedle);
}

const stateNeedle = '  const [ld, setLd] = useState(false);';
const stateAdd = `\n  const [weeklyAuviSessions, setWeeklyAuviSessions] = useState(0);\n  const [weeklyLdRombels, setWeeklyLdRombels] = useState(0);\n  const [weeklyRombelPopulation, setWeeklyRombelPopulation] = useState(0);`;
if (!s.includes("weeklyAuviSessions")) {
  if (!s.includes(stateNeedle)) throw new Error("weekly KPI state marker not found");
  s = s.replace(stateNeedle, stateNeedle + stateAdd);
}

const marker = '  const selectedDateLabel = date ? formatDate(date) : "";';
if (!s.includes("loadWeeklyTargets")) {
  const effectAdd = `  useEffect(() => {\n    let cancelled = false;\n    async function loadWeeklyTargets() {\n      if (!branchId || !branch || !date) {\n        setWeeklyAuviSessions(0); setWeeklyLdRombels(0);\n        setWeeklyRombelPopulation(branch ? (BRANCH_ROMBEL_COUNTS[branch] || 0) : 0);\n        return;\n      }\n      const base = new Date(date + "T00:00:00");\n      const day = base.getDay();\n      const diff = day === 0 ? -6 : 1 - day;\n      const start = new Date(base); start.setDate(base.getDate() + diff);\n      const end = new Date(start); end.setDate(start.getDate() + 6);\n      const startDate = start.toISOString().slice(0, 10);\n      const endDate = end.toISOString().slice(0, 10);\n      const weekRes = await supabase.from("weekly_planning").select("rombel_id,auvi_tv,ld,status").eq("branch_id", branchId).gte("planning_date", startDate).lte("planning_date", endDate);\n      if (cancelled) return;\n      const planningRows = weekRes.data || [];\n      const population = BRANCH_ROMBEL_COUNTS[branch] || new Set(planningRows.map(x => x.rombel_id).filter(Boolean)).size;\n      const auviSessions = planningRows.filter(x => x.auvi_tv).length;\n      const ldRombels = new Set(planningRows.filter(x => x.ld && x.rombel_id).map(x => x.rombel_id)).size;\n      setWeeklyAuviSessions(auviSessions);\n      setWeeklyLdRombels(ldRombels);\n      setWeeklyRombelPopulation(population);\n    }\n    loadWeeklyTargets();\n    return () => { cancelled = true; };\n  }, [branchId, branch, date, sessions]);\n\n`;
  if (!s.includes(marker)) throw new Error("weekly KPI marker not found");
  s = s.replace(marker, effectAdd + marker);
}

const auviCard = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Mingguan</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{weeklyAuviSessions}/10</div><div className="kpi-note">Target 10 sesi per minggu</div></div>';
const auviCardRegex = /<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">(?:AuVi TV Coverage|AuVi TV Mingguan)<\/div>[\s\S]*?<\/div><div className="kpi-value">[\s\S]*?<\/div><div className="kpi-note">[\s\S]*?<\/div><\/div>/;
if (auviCardRegex.test(s)) s = s.replace(auviCardRegex, auviCard);

const ldCard = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">LD Mingguan</div><div className="kpi-mini-icon">👥</div></div><div className="kpi-value">{weeklyLdRombels}/{weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0}</div><div className="kpi-note">≥ 50% unique rombel per minggu</div></div>';
const ldCardRegex = /<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">(?:LD|LD Mingguan)<\/div>[\s\S]*?<\/div><div className="kpi-value">[\s\S]*?<\/div><div className="kpi-note">[\s\S]*?<\/div><\/div>/;
if (ldCardRegex.test(s)) {
  const matches = s.match(new RegExp(ldCardRegex.source, "g")) || [];
  const match = matches.find(x => x.includes(">LD</div>") || x.includes(">LD Mingguan</div>"));
  if (match) s = s.replace(match, ldCard);
}

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning targets: LD >= 50% unique rombels; AuVi TV 10 sessions/week.");
