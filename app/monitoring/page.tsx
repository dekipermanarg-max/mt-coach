"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type MasterRow = { id: string; name: string };
type MonitoringRow = {
  id: string;
  planning_date: string;
  branch_id: string;
  mt_id: string | null;
  rombel_id: string | null;
  mapel_id: string | null;
  jenis_sesi: string;
  auvi_tv: boolean;
  ld: boolean;
  topik_sub_topik: string | null;
  attendance: boolean;
  starchamps: boolean;
  activity_score: boolean;
  report_sessions: boolean;
  foto_kbm: boolean;
  report_wa: boolean;
  auvi_tv_status: string;
  ld_status: string;
};

const AUVISTATUSES = ["Bukan sesi AuVi TV", "Tidak connect ke TV", "Connect ke TV"];
const LDSTATUSES = ["Bukan sesi LD", "Sudah report di CMS", "Belum report ke CMS"];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export default function Monitoring() {
  const [rows, setRows] = useState<MonitoringRow[]>([]);
  const [branches, setBranches] = useState<MasterRow[]>([]);
  const [mts, setMts] = useState<MasterRow[]>([]);
  const [rombels, setRombels] = useState<MasterRow[]>([]);
  const [mapels, setMapels] = useState<MasterRow[]>([]);
  const [branchId, setBranchId] = useState("all");
  const [selectedMT, setSelectedMT] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const [b, mt, r, m] = await Promise.all([
      supabase.from("branches").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mt").select("id,name").eq("active", true).order("name"),
      supabase.from("master_rombel").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mapel").select("id,name").eq("active", true).order("name"),
    ]);
    setBranches(b.data || []); setMts(mt.data || []); setRombels(r.data || []); setMapels(m.data || []);
    const query = supabase.from("weekly_planning").select("id,planning_date,branch_id,mt_id,rombel_id,mapel_id,jenis_sesi,auvi_tv,ld,topik_sub_topik,attendance,starchamps,activity_score,report_sessions,foto_kbm,report_wa,auvi_tv_status,ld_status").eq("status", "Finalized").order("planning_date", { ascending: false });
    const { data, error } = await query;
    if (error) setMessage(`Gagal memuat Monitoring: ${error.message}`); else setRows((data || []) as MonitoringRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const nameOf = (list: MasterRow[], id: string | null) => list.find(x => x.id === id)?.name || "—";
  const filtered = useMemo(() => rows.filter(r => (branchId === "all" || r.branch_id === branchId) && (selectedMT === "all" || r.mt_id === selectedMT)).filter(r => {
    const text = `${nameOf(mts, r.mt_id)} ${nameOf(rombels, r.rombel_id)} ${nameOf(mapels, r.mapel_id)} ${r.jenis_sesi}`.toLowerCase();
    return text.includes(search.toLowerCase());
  }), [rows, branches, mts, rombels, mapels, branchId, selectedMT, search]);

  const adminDone = (r: MonitoringRow) => [r.attendance, r.starchamps, r.activity_score, r.report_sessions, r.foto_kbm, r.report_wa].filter(Boolean).length;
  const adminPercent = (r: MonitoringRow) => Math.round((adminDone(r) / 6) * 100);
  const avgAdmin = filtered.length ? Math.round(filtered.reduce((a, r) => a + adminPercent(r), 0) / filtered.length) : 0;

  async function saveRow(row: MonitoringRow, patch: Partial<MonitoringRow>) {
    setSaving(row.id); setMessage("");
    const { error } = await supabase.from("weekly_planning").update(patch).eq("id", row.id).eq("status", "Finalized");
    if (error) setMessage(`Gagal menyimpan: ${error.message}`); else setRows(prev => prev.map(x => x.id === row.id ? { ...x, ...patch } : x));
    setSaving(null);
  }

  return <div className="page-wrap">
    <section className="planning-hero"><div className="planning-hero-row"><div><div className="eyebrow">MT COACH · OPERATIONS</div><h1>Monitoring</h1><p>Sesi yang sudah Finalize dari Weekly Planning muncul di sini untuk dilengkapi administrasinya.</p></div><span className="badge planning-status">🔒 {filtered.length} sesi Finalized</span></div></section>

    <section className="planning-control-card">
      <div className="control-box"><span className="control-label">Cabang</span><select className="branch-select" value={branchId} onChange={e => setBranchId(e.target.value)}><option value="all">Semua Cabang</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
      <div className="control-box"><span className="control-label">MT</span><select className="branch-select" value={selectedMT} onChange={e => setSelectedMT(e.target.value)}><option value="all">Semua MT</option>{mts.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <div className="control-box"><span className="control-label">Cari</span><input className="date-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="MT / rombel / mapel..." /></div>
    </section>

    <div className="grid planning-kpis"><div className="card planning-kpi"><div className="kpi-label">Finalized Session</div><div className="kpi-value">{filtered.length}</div><div className="kpi-note">Sesi siap dimonitor</div></div><div className="card planning-kpi"><div className="kpi-label">Admin Completion</div><div className="kpi-value">{avgAdmin}%</div><div className="kpi-note">Rata-rata 6 item administrasi</div></div><div className="card planning-kpi"><div className="kpi-label">AuVi TV</div><div className="kpi-value">{filtered.filter(r => r.auvi_tv_status === "Connect ke TV").length}</div><div className="kpi-note">Connect ke TV</div></div><div className="card planning-kpi"><div className="kpi-label">LD</div><div className="kpi-value">{filtered.filter(r => r.ld_status === "Sudah report di CMS").length}</div><div className="kpi-note">Sudah report di CMS</div></div></div>

    {message && <div className="card" style={{ marginBottom: 16, padding: 14 }}>{message}</div>}

    <section className="card planning-table-card"><div className="planning-table-head"><div><h2>📊 Kelengkapan Administrasi</h2><p>MT Coach melengkapi administrasi untuk setiap sesi yang sudah Finalized.</p></div><span className="section-chip">{filtered.length} sesi</span></div><div className="planning-table-wrap"><table><thead><tr><th>Tanggal</th><th>Cabang</th><th>MT</th><th>Rombel</th><th>Mapel</th><th>Jenis</th><th>Topik/Sub Topik</th><th>Attendance</th><th>Starchamps</th><th>Activity Score</th><th>Report Sessions</th><th>Foto KBM</th><th>Report WA</th><th>AuVi TV</th><th>LD</th></tr></thead><tbody>{loading ? <tr><td colSpan={15}><div className="empty-state"><strong>Memuat data…</strong></div></td></tr> : filtered.length === 0 ? <tr><td colSpan={15}><div className="empty-state"><div className="empty-icon">📋</div><strong>Belum ada sesi Finalized</strong><p>Finalize planning terlebih dahulu agar sesi muncul di Monitoring.</p></div></td></tr> : filtered.map(row => <tr key={row.id}><td>{formatDate(row.planning_date)}</td><td>{nameOf(branches, row.branch_id)}</td><td><strong>{nameOf(mts, row.mt_id)}</strong></td><td>{nameOf(rombels, row.rombel_id)}</td><td>{nameOf(mapels, row.mapel_id)}</td><td>{row.jenis_sesi}</td><td><input className="date-input" style={{ minWidth: 150 }} value={row.topik_sub_topik || ""} onChange={e => setRows(prev => prev.map(x => x.id === row.id ? { ...x, topik_sub_topik: e.target.value } : x))} onBlur={e => saveRow(row, { topik_sub_topik: e.target.value })} placeholder="Isi topik..." /></td>{([["attendance","Attendance"],["starchamps","Starchamps"],["activity_score","Activity Score"],["report_sessions","Report Sessions"],["foto_kbm","Foto KBM"],["report_wa","Report WA"]] as const).map(([key,label]) => <td key={key} style={{ textAlign: "center" }}><input type="checkbox" checked={row[key]} disabled={saving === row.id} onChange={e => saveRow(row, { [key]: e.target.checked })} aria-label={`${label} ${nameOf(mts,row.mt_id)}`} /></td>)}<td><select className="select" value={row.auvi_tv_status} disabled={saving === row.id} onChange={e => saveRow(row, { auvi_tv_status: e.target.value })}>{AUVISTATUSES.map(x => <option key={x}>{x}</option>)}</select></td><td><select className="select" value={row.ld_status} disabled={saving === row.id} onChange={e => saveRow(row, { ld_status: e.target.value })}>{LDSTATUSES.map(x => <option key={x}>{x}</option>)}</select></td></tr>)}</tbody></table></div></section>

    <div className="finalize-bar"><div><strong>Monitoring tersimpan otomatis</strong><small>{saving ? "Menyimpan perubahan…" : "Setiap checkbox dan dropdown langsung tersimpan ke shared database."}</small></div><div style={{ display: "flex", gap: 10 }}><Link className="secondary-btn" href="/planning">📅 Kembali ke Planning</Link></div></div>
  </div>;
}
