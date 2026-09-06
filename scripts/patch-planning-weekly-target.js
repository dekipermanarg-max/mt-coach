const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

const stateNeedle = '  const [ld, setLd] = useState(false);';
const stateAdd = `\n  const [weeklyRombelTarget, setWeeklyRombelTarget] = useState(0);\n  const [weeklyAuviRombels, setWeeklyAuviRombels] = useState(0);`;
if (!s.includes('weeklyRombelTarget')) {
  if (!s.includes(stateNeedle)) throw new Error('weekly target state marker not found');
  s = s.replace(stateNeedle, stateNeedle + stateAdd);
}

const effectNeedle = '  const selectedDateLabel = date ? formatDate(date) : "";';
const effectAdd = `  useEffect(() => {\n    let cancelled = false;\n    async function loadWeeklyAuviTarget() {\n      if (!branchId) { setWeeklyRombelTarget(0); setWeeklyAuviRombels(0); return; }\n      const base = date ? new Date(\`\${date}T00:00:00\`) : new Date();\n      const day = base.getDay();\n      const diff = day === 0 ? -6 : 1 - day;\n      const start = new Date(base); start.setDate(base.getDate() + diff);\n      const end = new Date(start); end.setDate(start.getDate() + 6);\n      const startDate = start.toISOString().slice(0, 10);\n      const endDate = end.toISOString().slice(0, 10);\n\n      const [masterRes, weekRes, fallbackRes] = await Promise.all([\n        supabase.from("master_rombel").select("id").eq("branch_id", branchId).eq("active", true),\n        supabase.from("weekly_planning").select("rombel_id,auvi_tv").eq("branch_id", branchId).gte("planning_date", startDate).lte("planning_date", endDate),\n        supabase.from("weekly_planning").select("rombel_id").eq("branch_id", branchId).not("rombel_id", "is", null),\n      ]);\n      if (cancelled) return;\n\n      const masterIds = new Set((masterRes.data || []).map(x => x.id).filter(Boolean));\n      const fallbackIds = new Set((fallbackRes.data || []).map(x => x.rombel_id).filter(Boolean));\n      const population = masterIds.size ? masterIds : fallbackIds;\n      const auviIds = new Set((weekRes.data || []).filter(x => x.auvi_tv && x.rombel_id).map(x => x.rombel_id));\n      setWeeklyRombelTarget(Math.ceil(population.size * 0.5));\n      setWeeklyAuviRombels(auviIds.size);\n    }\n    loadWeeklyAuviTarget();\n    return () => { cancelled = true; };\n  }, [branchId, date]);\n\n`;
if (!s.includes('loadWeeklyAuviTarget')) {
  if (!s.includes(effectNeedle)) throw new Error('weekly target effect marker not found');
  s = s.replace(effectNeedle, effectAdd + effectNeedle);
}

const kpiNeedle = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Coverage</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{auviCoverage}%</div><div className="kpi-note">{auviRombels}/{totalRombels} rombel · target ≥ 50%</div></div>';
const kpiReplace = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Mingguan</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{weeklyRombelTarget ? Math.round((weeklyAuviRombels / weeklyRombelTarget) * 100) : 0}%</div><div className="kpi-note">{weeklyAuviRombels}/{weeklyRombelTarget} rombel tercapai · target ≥ 50% per minggu</div></div>';
if (!s.includes('AuVi TV Mingguan')) {
  if (!s.includes(kpiNeedle)) throw new Error('weekly AuVi KPI marker not found');
  s = s.replace(kpiNeedle, kpiReplace);
}

fs.writeFileSync(file, s);
console.log("Patched weekly AuVi target KPI:", file);
