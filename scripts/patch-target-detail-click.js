const fs = require("fs");
const path = require("path");

function patchMonitoring() {
  const file = path.join(process.cwd(), "app/monitoring/page.tsx");
  let s = fs.readFileSync(file, "utf8");
  const marker = '  const ldProgress = targetLdGoal ? Math.min(100, Math.round((targetLdRombels / targetLdGoal) * 100)) : 0;';
  const fn = `
  async function showTargetDetail(kind: "auvi" | "ld") {
    const rows = kind === "auvi"
      ? targetWeekRows.filter(r => r.auvi_tv)
      : targetWeekRows.filter(r => r.ld && r.rombel_id);
    const unique = kind === "ld"
      ? Array.from(new Map(rows.filter(r => !/(^|\\s)(kelas\\s*)?(12|xii)(\\s|$)/i.test(nameOf(rombels, r.rombel_id))).map(r => [r.rombel_id!, r])).values())
      : rows;
    const title = kind === "auvi" ? "🎥 DETAIL TARGET AuVi TV" : "👥 DETAIL TARGET LD";
    const goal = kind === "auvi" ? targetAuviGoal : targetLdGoal;
    const count = kind === "auvi" ? targetAuviSessions : targetLdRombels;
    const lines = unique.length
      ? unique.map((r, i) => (i + 1) + ". " + nameOf(rombels, r.rombel_id) + " — " + nameOf(mts, r.mt_id) + " — " + nameOf(mapels, r.mapel_id) + " — " + formatDate(r.planning_date))
      : ["Belum ada assignment."];
    window.alert([title, targetWeekStartStr + " – " + targetWeekEndStr, count + "/" + goal + " tercapai", "", ...lines, "", "Sisa target: " + Math.max(0, goal - count)].join("\\n"));
  }
`;
  if (!s.includes("async function showTargetDetail(kind")) {
    if (!s.includes(marker)) throw new Error("Monitoring target click marker not found");
    s = s.replace(marker, marker + fn);
  }
  s = s.replace(/<button type="button" className="card planning-kpi monitoring-target-kpi monitoring-auvi-kpi monitoring-target-click"[\\s\\S]*?<\\/button>/, '<button type="button" className="card planning-kpi monitoring-target-kpi monitoring-auvi-kpi monitoring-target-click" onClick={() => showTargetDetail("auvi")} aria-label="Lihat detail assignment AuVi TV"><div className="kpi-label">Target AuVi TV</div><div className="kpi-value">{targetAuviSessions}/{targetAuviGoal}</div><div className="kpi-note">10 sesi per minggu · {auviProgress}%</div><span className="target-card-hint">Lihat detail ↗</span></button>');
  s = s.replace(/<button type="button" className="card planning-kpi monitoring-target-kpi monitoring-ld-kpi monitoring-target-click"[\\s\\S]*?<\\/button>/, '<button type="button" className="card planning-kpi monitoring-target-kpi monitoring-ld-kpi monitoring-target-click" onClick={() => showTargetDetail("ld")} aria-label="Lihat detail assignment LD"><div className="kpi-label">Target LD</div><div className="kpi-value">{targetLdRombels}/{targetLdGoal}</div><div className="kpi-note">50% rombel per minggu · {ldProgress}%</div><span className="target-card-hint">Lihat detail ↗</span></button>');
  fs.writeFileSync(file, s);
  console.log("Patched Monitoring target cards with robust click details.");
}

function patchPlanning() {
  const file = path.join(process.cwd(), "app/planning/page.tsx");
  let s = fs.readFileSync(file, "utf8");
  const marker = '  const selectedDateLabel = formatDate(date);';
  const fn = `
  async function showTargetDetail(kind: "auvi" | "ld") {
    if (!branchId || !date) return;
    const base = new Date(date + "T00:00:00");
    const day = base.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(base);
    start.setDate(base.getDate() + diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const { data } = await supabase.from("weekly_planning").select("id,planning_date,auvi_tv,ld,mt_id,rombel_id,mapel_id").eq("branch_id", branchId).gte("planning_date", startStr).lte("planning_date", endStr);
    const rows = (data || []) as PlanningRow[];
    const assigned = kind === "auvi"
      ? rows.filter(r => r.auvi_tv)
      : rows.filter(r => r.ld && r.rombel_id && !/(^|\\s)(kelas\\s*)?(12|xii)(\\s|$)/i.test(nameOf(rombelRows, r.rombel_id)));
    const unique = kind === "ld" ? Array.from(new Map(assigned.map(r => [r.rombel_id!, r])).values()) : assigned;
    const goal = kind === "auvi" ? 10 : (weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0);
    const title = kind === "auvi" ? "🎥 DETAIL TARGET AuVi TV" : "👥 DETAIL TARGET LD";
    const lines = unique.length
      ? unique.map((r, i) => (i + 1) + ". " + nameOf(rombelRows, r.rombel_id) + " — " + nameOf(mtRows, r.mt_id) + " — " + nameOf(mapelRows, r.mapel_id) + " — " + formatDate(r.planning_date))
      : ["Belum ada assignment."];
    window.alert([title, startStr + " – " + endStr, unique.length + "/" + goal + " tercapai", "", ...lines, "", "Sisa target: " + Math.max(0, goal - unique.length)].join("\\n"));
  }
`;
  if (!s.includes("async function showTargetDetail(kind")) {
    if (!s.includes(marker)) throw new Error("Planning target click marker not found");
    s = s.replace(marker, fn + marker);
  }
  s = s.replace(/<button type="button" className="card planning-kpi monitoring-target-click monitoring-auvi-kpi"[\\s\\S]*?<\\/button>/, '<button type="button" className="card planning-kpi monitoring-target-click monitoring-auvi-kpi" onClick={() => showTargetDetail("auvi")} aria-label="Lihat detail assignment AuVi TV"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Mingguan</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{Math.min(100, Math.round((weeklyAuviSessions / 10) * 100))}%</div><div className="kpi-note">{weeklyAuviSessions}/10 sesi tercapai · target 10 sesi per minggu</div><span className="target-card-hint">Lihat detail ↗</span></button>');
  s = s.replace(/<button type="button" className="card planning-kpi monitoring-target-kpi monitoring-ld-kpi monitoring-target-click"[\\s\\S]*?<\\/button>/, '<button type="button" className="card planning-kpi monitoring-target-kpi monitoring-ld-kpi monitoring-target-click" onClick={() => showTargetDetail("ld")} aria-label="Lihat detail assignment LD"><div className="planning-kpi-top"><div className="kpi-label">LD Mingguan</div><div className="kpi-mini-icon">👥</div></div><div className="kpi-value">{weeklyLdRombels}/{weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0}</div><div className="kpi-note">Target 50% rombel per minggu</div><span className="target-card-hint">Lihat detail ↗</span></button>');
  if (!s.includes(".target-card-hint")) {
    const root = '<style>{`';
    if (s.includes(root)) s = s.replace(root, root + '.monitoring-target-click{position:relative;text-align:left;cursor:pointer;border:0;width:100%;transition:transform .16s ease,box-shadow .16s ease}.monitoring-target-click:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(15,23,42,.08)}.target-card-hint{display:block;margin-top:7px;font-size:11px;color:#64748b;font-weight:700}');
  }
  fs.writeFileSync(file, s);
  console.log("Patched Weekly Planning target cards with robust click details.");
}

patchMonitoring();
patchPlanning();
