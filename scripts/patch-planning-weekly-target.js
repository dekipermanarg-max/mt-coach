const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Correct weekly target rules:
// - AuVi TV: minimum 50% of unique rombels that are actually running/planned in the week.
// - LD: 10 sessions per week.
const stateNeedle = '  const [ld, setLd] = useState(false);';
const stateAdd = `\n  const [weeklyAuviRombels, setWeeklyAuviRombels] = useState(0);\n  const [weeklyLdSessions, setWeeklyLdSessions] = useState(0);\n  const [weeklyRombelPopulation, setWeeklyRombelPopulation] = useState(0);`;
if (!s.includes("weeklyAuviRombels")) {
  if (!s.includes(stateNeedle)) throw new Error("weekly KPI state marker not found");
  s = s.replace(stateNeedle, stateNeedle + stateAdd);
}

const marker = '  const selectedDateLabel = date ? formatDate(date) : "";';
if (!s.includes("loadWeeklyTargets")) {
  const effectAdd = `  useEffect(() => {\n    let cancelled = false;\n    async function loadWeeklyTargets() {\n      if (!branchId || !branch || !date) {\n        setWeeklyAuviRombels(0); setWeeklyLdSessions(0); setWeeklyRombelPopulation(0);\n        return;\n      }\n      const base = new Date(date + "T00:00:00");\n      const day = base.getDay();\n      const diff = day === 0 ? -6 : 1 - day;\n      const start = new Date(base); start.setDate(base.getDate() + diff);\n      const end = new Date(start); end.setDate(start.getDate() + 6);\n      const startDate = start.toISOString().slice(0, 10);\n      const endDate = end.toISOString().slice(0, 10);\n      const weekRes = await supabase.from("weekly_planning").select("rombel_id,auvi_tv,ld,status").eq("branch_id", branchId).gte("planning_date", startDate).lte("planning_date", endDate);\n      if (cancelled) return;\n      const planningRows = weekRes.data || [];\n      const runningRombels = new Set(planningRows.map(x => x.rombel_id).filter(Boolean)).size;\n      const auviRombels = new Set(planningRows.filter(x => x.auvi_tv && x.rombel_id).map(x => x.rombel_id)).size;\n      const ldSessions = planningRows.filter(x => x.ld).length;\n      setWeeklyAuviRombels(auviRombels);\n      setWeeklyLdSessions(ldSessions);\n      setWeeklyRombelPopulation(runningRombels);\n    }\n    loadWeeklyTargets();\n    return () => { cancelled = true; };\n  }, [branchId, branch, date, sessions]);\n\n`;
  if (!s.includes(marker)) throw new Error("weekly KPI marker not found");
  s = s.replace(marker, effectAdd + marker);
}

const auviCard = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Mingguan</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{weeklyAuviRombels}/{weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0}</div><div className="kpi-note">≥ 50% unique rombel per minggu</div></div>';
const auviCardRegex = /<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">(?:AuVi TV Coverage|AuVi TV Mingguan)<\/div>[\s\S]*?<\/div><div className="kpi-value">[\s\S]*?<\/div><div className="kpi-note">[\s\S]*?<\/div><\/div>/;
if (auviCardRegex.test(s)) s = s.replace(auviCardRegex, auviCard);

const ldCard = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">LD Mingguan</div><div className="kpi-mini-icon">👥</div></div><div className="kpi-value">{weeklyLdSessions}/10</div><div className="kpi-note">Target 10 sesi per minggu</div></div>';
const ldCardRegex = /<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">(?:LD|LD Mingguan)<\/div>[\s\S]*?<\/div><div className="kpi-value">[\s\S]*?<\/div><div className="kpi-note">[\s\S]*?<\/div><\/div>/;
if (ldCardRegex.test(s)) {
  const matches = s.match(new RegExp(ldCardRegex.source, "g")) || [];
  const match = matches.find(x => x.includes(">LD</div>") || x.includes(">LD Mingguan</div>"));
  if (match) s = s.replace(match, ldCard);
}

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning targets: AuVi TV >= 50% unique running rombels; LD 10 sessions/week.");
