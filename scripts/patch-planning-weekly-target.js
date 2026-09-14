const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Correct weekly target rules:
// - AuVi TV: 10 sessions per week.
// - LD: target is 50% of the ABSOLUTE, branch-specific eligible-rombel count.
// - The eligible-rombel count is NOT derived from Weekly Planning rows.
// - These counts remain fixed until explicitly changed in lib/targets.ts.
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

      // IMPORTANT: LD denominator is fixed per branch. Never derive it from planningRows.
      const fixedLdEligibleCounts: Record<string, number> = {
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
      const eligibleCount = fixedLdEligibleCounts[branch] || 0;

      // Ujung Gurun has a fixed 2-rombel LD whitelist.
      const ujungGurunLdEligible = new Set([
        "a60a0675-1d03-4b45-ae51-0f1a9eb35ab0",
        "ca7db70b-f37d-415f-a4f8-01722e5b3958",
      ]);
      const isLDEligibleRombel = (rombelId: string | null) =>
        branch === "Padang - Ujung Gurun"
          ? Boolean(rombelId && ujungGurunLdEligible.has(rombelId))
          : Boolean(rombelId);

      const auviSessions = planningRows.filter(x => x.auvi_tv).length;
      const ldRombels = new Set(
        planningRows
          .filter(x => x.ld && isLDEligibleRombel(x.rombel_id))
          .map(x => x.rombel_id),
      ).size;
      setWeeklyAuviSessions(auviSessions);
      setWeeklyLdRombels(ldRombels);
      setWeeklyRombelPopulation(eligibleCount);
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

const ldCard = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">LD Mingguan</div><div className="kpi-mini-icon">👥</div></div><div className="kpi-value">{weeklyLdRombels}/{weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0}</div><div className="kpi-note">≥ 50% unique rombel eligible LD</div></div>';
const ldCardRegex = /<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">(?:LD|LD Mingguan)<\/div>[\s\S]*?<\/div><div className="kpi-value">[\s\S]*?<\/div><div className="kpi-note">[\s\S]*?<\/div><\/div>/;
if (ldCardRegex.test(s)) {
  const matches = s.match(new RegExp(ldCardRegex.source, "g")) || [];
  const match = matches.find(x => x.includes(">LD</div>") || x.includes(">LD Mingguan</div>"));
  if (match) s = s.replace(match, ldCard);
}

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning targets: AuVi TV 10 sessions/week; LD = 50% of fixed branch eligible-rombel count.");
