const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Correct weekly target rules:
// - AuVi TV: 10 sessions per week.
// - LD: minimum 50% of unique rombels that are actually running/planned in the week.
const stateNeedle = '  const [ld, setLd] = useState(false);';
const oldState = /\n  const \[weeklyAuviRombels, setWeeklyAuviRombels\] = useState\(0\);\n  const \[weeklyLdSessions, setWeeklyLdSessions\] = useState\(0\);\n  const \[weeklyRombelPopulation, setWeeklyRombelPopulation\] = useState\(0\);/;
if (!s.includes("weeklyAuviSessions")) {
  if (oldState.test(s)) {
    s = s.replace(oldState, `\n  const [weeklyAuviSessions, setWeeklyAuviSessions] = useState(0);\n  const [weeklyLdRombels, setWeeklyLdRombels] = useState(0);\n  const [weeklyRombelPopulation, setWeeklyRombelPopulation] = useState(0);`);
  } else {
    if (!s.includes(stateNeedle)) throw new Error("weekly KPI state marker not found");
    s = s.replace(stateNeedle, stateNeedle + `\n  const [weeklyAuviSessions, setWeeklyAuviSessions] = useState(0);\n  const [weeklyLdRombels, setWeeklyLdRombels] = useState(0);\n  const [weeklyRombelPopulation, setWeeklyRombelPopulation] = useState(0);`);
  }
}

const marker = '  const selectedDateLabel = date ? formatDate(date) : "";';
const effectAdd = `  useEffect(() => {
    let cancelled = false;
    async function loadWeeklyTargets() {
      if (!branchId || !branch || !date) {
        setWeeklyAuviSessions(0); setWeeklyLdRombels(0); setWeeklyRombelPopulation(0);
        return;
      }
      const base = new Date(date + "T00:00:00");
      const day = base.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const start = new Date(base); start.setDate(base.getDate() + diff);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      const startDate = start.toISOString().slice(0, 10);
      const endDate = end.toISOString().slice(0, 10);
      const weekRes = await supabase.from("weekly_planning").select("rombel_id,auvi_tv,ld,status").eq("branch_id", branchId).gte("planning_date", startDate).lte("planning_date", endDate);
      if (cancelled) return;
      const planningRows = weekRes.data || [];
      const runningRombels = new Set(planningRows.map(x => x.rombel_id).filter(Boolean)).size;
      const auviSessions = planningRows.filter(x => x.auvi_tv).length;
      const ldRombels = new Set(planningRows.filter(x => x.ld && x.rombel_id).map(x => x.rombel_id)).size;
      setWeeklyAuviSessions(auviSessions);
      setWeeklyLdRombels(ldRombels);
      setWeeklyRombelPopulation(runningRombels);
    }
    loadWeeklyTargets();
    return () => { cancelled = true; };
  }, [branchId, branch, date, sessions]);

`;
if (!s.includes("loadWeeklyTargets")) {
  if (!s.includes(marker)) throw new Error("weekly KPI marker not found");
  s = s.replace(marker, effectAdd + marker);
}

const auviCard = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Mingguan</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{weeklyAuviSessions}/10</div><div className="kpi-note">Target 10 sesi per minggu</div></div>';
const auviCardRegex = /<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">(?:AuVi TV Coverage|AuVi TV Mingguan)<\/div>[\s\S]*?<\/div><div className="kpi-value">[\s\S]*?<\/div><div className="kpi-note">[\s\S]*?<\/div><\/div>/;
if (auviCardRegex.test(s)) s = s.replace(auviCardRegex, auviCard);

const ldCard = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">LD Mingguan</div><div className="kpi-mini-icon">👥</div></div><div className="kpi-value">{weeklyLdRombels}/{weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0}</div><div className="kpi-note">≥ 50% unique rombel berjalan</div></div>';
const ldCardRegex = /<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">(?:LD|LD Mingguan)<\/div>[\s\S]*?<\/div><div className="kpi-value">[\s\S]*?<\/div><div className="kpi-note">[\s\S]*?<\/div><\/div>/;
if (ldCardRegex.test(s)) {
  const matches = s.match(new RegExp(ldCardRegex.source, "g")) || [];
  const match = matches.find(x => x.includes(">LD</div>") || x.includes(">LD Mingguan</div>"));
  if (match) s = s.replace(match, ldCard);
}

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning targets: AuVi TV 10 sessions/week; LD >= 50% unique running rombels.");
