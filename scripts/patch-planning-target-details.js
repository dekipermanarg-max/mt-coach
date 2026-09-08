const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

const stateNeedle = '  const [modal, setModal] = useState<"draft" | "finalize" | null>(null);';
const stateAdd = `
  const [targetDetail, setTargetDetail] = useState<"auvi" | "ld" | null>(null);
  const [weeklyTargetRows, setWeeklyTargetRows] = useState<PlanningRow[]>([]);`;
if (!s.includes('const [targetDetail, setTargetDetail]')) {
  if (!s.includes(stateNeedle)) throw new Error("Planning modal state marker not found");
  s = s.replace(stateNeedle, stateNeedle + stateAdd);
}

const effectNeedle = '  const selectedDateLabel = formatDate(date);';
const effectAdd = `  useEffect(() => {
    let cancelled = false;
    async function loadTargetDetailRows() {
      if (!branchId || !date) { setWeeklyTargetRows([]); return; }
      const base = new Date(date + "T00:00:00");
      const day = base.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const start = new Date(base);
      start.setDate(base.getDate() + diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const { data } = await supabase.from("weekly_planning")
        .select("id,planning_date,jenis_sesi,auvi_tv,ld,status,mt_id,rombel_id,mapel_id")
        .eq("branch_id", branchId)
        .gte("planning_date", start.toISOString().slice(0, 10))
        .lte("planning_date", end.toISOString().slice(0, 10));
      if (!cancelled) setWeeklyTargetRows((data || []) as PlanningRow[]);
    }
    loadTargetDetailRows();
    return () => { cancelled = true; };
  }, [branchId, date, sessions]);

  const isClass12Rombel = (id: string | null) => {
    const label = nameOf(rombelRows, id);
    return /(^|\s)(kelas\s*)?(12|xii)(\s|$)/i.test(label);
  };
  const targetAuviDetailRows = weeklyTargetRows.filter(x => x.auvi_tv);
  const targetLdDetailRows = weeklyTargetRows.filter(x => x.ld && x.rombel_id && !isClass12Rombel(x.rombel_id));
  const targetLdRombels = Array.from(new Map(targetLdDetailRows.map(x => [x.rombel_id!, x])).values());

`;
if (!s.includes('loadTargetDetailRows')) {
  if (!s.includes(effectNeedle)) throw new Error("Planning detail effect marker not found");
  s = s.replace(effectNeedle, effectAdd + effectNeedle);
}

const auviCard = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Mingguan</div><div className="kpi-mini-icon">🎥</div></div><div className="kpi-value">{Math.min(100, Math.round((weeklyAuviSessions / 10) * 100))}%</div><div className="kpi-note">{weeklyAuviSessions}/10 sesi tercapai · target 10 sesi per minggu</div></div>';
const auviButton = '<button type="button" className="card planning-kpi monitoring-target-click monitoring-auvi-kpi" onClick={() => setTargetDetail("auvi")} aria-label="Lihat detail assignment AuVi TV"><div className="planning-kpi-top"><div className="kpi-label">AuVi TV Mingguan</div><div className="kpi-mini-icon">🎥</div><span className="target-card-hint">Lihat detail ↗</span></div><div className="kpi-value">{Math.min(100, Math.round((weeklyAuviSessions / 10) * 100))}%</div><div className="kpi-note">{weeklyAuviSessions}/10 sesi tercapai · target 10 sesi per minggu</div></button>';
if (s.includes(auviCard)) s = s.replace(auviCard, auviButton);

const ldCard = '<div className="card planning-kpi"><div className="planning-kpi-top"><div className="kpi-label">LD Mingguan</div><div className="kpi-mini-icon">👥</div></div><div className="kpi-value">{weeklyLdRombels}/{weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0}</div><div className="kpi-note">Target 50% rombel per minggu</div></div>';
const ldButton = '<button type="button" className="card planning-kpi monitoring-target-click monitoring-ld-kpi" onClick={() => setTargetDetail("ld")} aria-label="Lihat detail assignment LD"><div className="planning-kpi-top"><div className="kpi-label">LD Mingguan</div><div className="kpi-mini-icon">👥</div><span className="target-card-hint">Lihat detail ↗</span></div><div className="kpi-value">{weeklyLdRombels}/{weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0}</div><div className="kpi-note">Target 50% rombel per minggu</div></button>';
if (s.includes(ldCard)) s = s.replace(ldCard, ldButton);

const formMarker = '      <form className="card input-card" onSubmit={addOrUpdateSession}>';
const modalJsx = `      {targetDetail && <div className="target-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setTargetDetail(null); }}><section className="target-modal" role="dialog" aria-modal="true" aria-labelledby="planning-target-title"><div className="target-modal-head"><div><div className="eyebrow">WEEKLY PLANNING · ASSIGNMENT</div><h2 id="planning-target-title">{targetDetail === "auvi" ? "🎥 AuVi TV Assignment" : "👥 LD Assignment"}</h2><p>{selectedDateLabel} · {branch}</p></div><button type="button" className="target-close" onClick={() => setTargetDetail(null)} aria-label="Tutup">×</button></div><div className="target-modal-summary"><span className={targetDetail === "auvi" ? "target-summary-pill auvi" : "target-summary-pill ld"}>{targetDetail === "auvi" ? <>{weeklyAuviSessions}/10 sesi</> : <>{weeklyLdRombels}/{weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0} rombel</>}</span><span className="target-summary-note">{targetDetail === "auvi" ? "Target 10 sesi per minggu" : "Target 50% rombel per minggu · Kelas 12 tidak berlaku"}</span></div><div className="target-section-title">{targetDetail === "auvi" ? "Sesi AuVi yang sudah di-assign" : "Rombel LD yang sudah di-assign"}</div><div className="target-assignment-list">{targetDetail === "auvi" ? (targetAuviDetailRows.length ? targetAuviDetailRows.map(row => <div className="target-assignment-row" key={row.id}><div><strong>{nameOf(rombelRows, row.rombel_id)}</strong><span>{nameOf(mtRows, row.mt_id)} · {nameOf(mapelRows, row.mapel_id)} · {row.jenis_sesi}</span></div><b>{formatDate(row.planning_date)}</b></div>) : <div className="target-empty">Belum ada sesi AuVi TV yang di-assign minggu ini.</div>) : (targetLdRombels.length ? targetLdRombels.map(row => <div className="target-assignment-row" key={row.rombel_id}><div><strong>{nameOf(rombelRows, row.rombel_id)}</strong><span>{nameOf(mtRows, row.mt_id)} · {nameOf(mapelRows, row.mapel_id)}</span></div><b>LD ✓</b></div>) : <div className="target-empty">Belum ada rombel yang di-assign LD minggu ini.</div>)}</div><div className="target-gap-box"><strong>{targetDetail === "auvi" ? Math.max(0, 10 - weeklyAuviSessions) : Math.max(0, Math.ceil((weeklyRombelPopulation || 0) * 0.5) - weeklyLdRombels)}</strong><span>{targetDetail === "auvi" ? "sesi lagi untuk mencapai target" : "rombel lagi untuk mencapai target"}</span></div></section></div>`;
if (!s.includes('target-modal-backdrop')) {
  if (!s.includes(formMarker)) throw new Error("Planning form marker not found");
  s = s.replace(formMarker, modalJsx + "\n" + formMarker);
}

const styleNeedle = '<style>{`';
const styleAdd = '.monitoring-target-click{position:relative;text-align:left;cursor:pointer;border:0;width:100%;transition:transform .16s ease,box-shadow .16s ease}.monitoring-target-click:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(15,23,42,.08)}.target-card-hint{margin-left:auto;font-size:11px;color:#64748b;font-weight:600}.target-modal-backdrop{position:fixed;inset:0;z-index:1200;background:rgba(15,23,42,.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px}.target-modal{width:min(720px,100%);max-height:88vh;overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:22px;padding:22px;box-shadow:0 24px 70px rgba(15,23,42,.22)}.target-modal-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.target-modal-head h2{margin:4px 0;font-size:21px}.target-modal-head p{margin:0;color:#64748b;font-size:12px}.target-close{width:36px;height:36px;border:0;border-radius:10px;background:#f1f5f9;color:#475569;font-size:24px;cursor:pointer}.target-modal-summary{display:flex;align-items:center;gap:10px;margin:18px 0}.target-summary-pill{padding:8px 12px;border-radius:999px;font-weight:800;font-size:13px}.target-summary-pill.auvi{background:#f3e8ff;color:#7e22ce}.target-summary-pill.ld{background:#dcfce7;color:#15803d}.target-summary-note{font-size:12px;color:#64748b}.target-section-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#475569;margin:12px 0 8px}.target-assignment-list{display:grid;gap:8px}.target-assignment-row{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc}.target-assignment-row strong,.target-assignment-row span{display:block}.target-assignment-row span{font-size:11px;color:#64748b;margin-top:3px}.target-assignment-row b{font-size:11px;color:#64748b;white-space:nowrap}.target-empty{padding:18px;text-align:center;color:#64748b;background:#f8fafc;border-radius:12px}.target-gap-box{display:flex;align-items:baseline;gap:8px;margin-top:14px;padding:13px 14px;border-radius:12px;background:#f8fafc;border:1px dashed #cbd5e1}.target-gap-box strong{font-size:20px}.target-gap-box span{font-size:12px;color:#64748b}@media(max-width:700px){.target-modal{padding:16px}.target-assignment-row{align-items:flex-start;flex-direction:column}.target-card-hint{display:none}}';
if (!s.includes('target-modal-backdrop')) {
  if (!s.includes(styleNeedle)) throw new Error("Planning style marker not found");
  s = s.replace(styleNeedle, styleNeedle + styleAdd);
}

fs.writeFileSync(file, s);
console.log('Added clickable Weekly Planning AuVi/LD assignment detail cards.');
