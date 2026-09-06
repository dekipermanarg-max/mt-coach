"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../components/AuthProvider";

type MasterRow = { id: string; name: string };
type AuditRow = {
  id: string;
  table_name: string;
  record_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_at: string;
  actor_name: string | null;
  actor_username: string | null;
  actor_role: string | null;
};

const TABLE_LABELS: Record<string, string> = {
  weekly_planning: "Weekly Planning",
  master_mt: "Master MT",
  master_rombel: "Master Rombel",
  master_mapel: "Master Mapel",
  branches: "Cabang",
  sessions: "Mathchamps",
};
const ACTION_LABELS: Record<string, string> = { INSERT: "Tambah", UPDATE: "Ubah", DELETE: "Hapus" };
const PAGE_SIZE = 30;

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
function valueLabel(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return String(value);
}
function changedFields(row: AuditRow) {
  if (row.action !== "UPDATE" || !row.old_data || !row.new_data) return [] as { key: string; before: unknown; after: unknown }[];
  const keys = Array.from(new Set([...Object.keys(row.old_data), ...Object.keys(row.new_data)]));
  return keys.filter((key) => key !== "updated_at" && JSON.stringify(row.old_data?.[key]) !== JSON.stringify(row.new_data?.[key])).map((key) => ({ key, before: row.old_data?.[key], after: row.new_data?.[key] }));
}
function recordSummary(row: AuditRow, branches: MasterRow[], mts: MasterRow[], rombels: MasterRow[], mapels: MasterRow[]) {
  const data = row.new_data || row.old_data || {};
  if (row.table_name === "weekly_planning") {
    const branch = branches.find((x) => x.id === data.branch_id)?.name || "Cabang";
    const mt = mts.find((x) => x.id === data.mt_id)?.name || "MT";
    const rombel = rombels.find((x) => x.id === data.rombel_id)?.name || "Rombel";
    const mapel = mapels.find((x) => x.id === data.mapel_id)?.name || "Mapel";
    return `${branch} · ${mt} · ${rombel} · ${mapel}`;
  }
  if (row.table_name === "sessions") {
    const branch = branches.find((x) => x.id === data.branch_id)?.name || "Cabang";
    const mt = mts.find((x) => x.id === data.mt_id)?.name || "MT";
    const rombel = rombels.find((x) => x.id === data.rombel_id)?.name || "Rombel";
    return `${branch} · ${mt} · ${rombel}`;
  }
  return String(data.name || data.username || row.record_id || "Data");
}

export default function ActivityLogPage() {
  const { profile, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [branches, setBranches] = useState<MasterRow[]>([]);
  const [mts, setMts] = useState<MasterRow[]>([]);
  const [rombels, setRombels] = useState<MasterRow[]>([]);
  const [mapels, setMapels] = useState<MasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState("all");
  const [table, setTable] = useState("all");
  const [actor, setActor] = useState("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true); setMessage("");
    const [audit, b, mt, r, m] = await Promise.all([
      supabase.from("audit_log").select("id,table_name,record_id,action,old_data,new_data,changed_at,actor_name,actor_username,actor_role").order("changed_at", { ascending: false }).limit(500),
      supabase.from("branches").select("id,name").order("name"),
      supabase.from("master_mt").select("id,name").order("name"),
      supabase.from("master_rombel").select("id,name").order("name"),
      supabase.from("master_mapel").select("id,name").order("name"),
    ]);
    if (audit.error) setMessage(`Gagal memuat Activity Log: ${audit.error.message}`);
    setRows((audit.data || []) as AuditRow[]); setBranches((b.data || []) as MasterRow[]); setMts((mt.data || []) as MasterRow[]); setRombels((r.data || []) as MasterRow[]); setMapels((m.data || []) as MasterRow[]); setVisibleCount(PAGE_SIZE); setLoading(false);
  }

  useEffect(() => { if (!authLoading && profile?.role === "SUPERADMIN" || !authLoading && profile?.role === "MTC") void load(); }, [authLoading, profile?.role]);

  const actorLabel = (row: AuditRow) => row.actor_name || row.actor_username || "Sistem";
  const actors = useMemo(() => Array.from(new Set(rows.map((r) => actorLabel(r)))).sort((a, b) => a.localeCompare(b)), [rows]);
  const filtered = useMemo(() => rows.filter((row) => {
    if (action !== "all" && row.action !== action) return false;
    if (table !== "all" && row.table_name !== table) return false;
    if (actor !== "all" && actorLabel(row) !== actor) return false;
    const haystack = `${actorLabel(row)} ${row.actor_role || ""} ${TABLE_LABELS[row.table_name] || row.table_name} ${recordSummary(row, branches, mts, rombels, mapels)} ${JSON.stringify(row.new_data || row.old_data || {})}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  }), [rows, action, table, actor, search, branches, mts, rombels, mapels]);
  const visibleRows = filtered.slice(0, visibleCount);

  if (authLoading) return null;
  if (!profile || !["SUPERADMIN", "MTC"].includes(profile.role)) return <div className="page-wrap"><section className="card" style={{ padding: 28 }}><strong>Akses terbatas.</strong><p style={{ color: "#64748b" }}>Activity Log hanya dapat dilihat oleh Superadmin dan MTC sesuai kewenangannya.</p></section></div>;

  return <div className="page-wrap">
    <style>{`.activity-hero{padding:26px 28px;border:1px solid #dbe7f5;border-radius:20px;background:linear-gradient(135deg,#f8fbff,#fff);box-shadow:0 8px 28px rgba(15,23,42,.04)}.activity-hero .eyebrow{font-size:10px;font-weight:800;letter-spacing:.12em;color:#2563eb}.activity-hero h1{margin:7px 0 5px;font-size:27px;letter-spacing:-.03em;color:#172033}.activity-hero p{margin:0;color:#64748b;font-size:13px}.activity-toolbar{display:grid;grid-template-columns:1.4fr .7fr .9fr .9fr;gap:10px;margin:16px 0}.activity-toolbar input,.activity-toolbar select{height:42px;width:100%;border:1px solid #d8e0ea;border-radius:10px;background:#fff;padding:0 12px;color:#172033;font:600 12px Inter,Arial,sans-serif;outline:none}.activity-toolbar input:focus,.activity-toolbar select:focus{border-color:#60a5fa;box-shadow:0 0 0 3px rgba(37,99,235,.08)}.activity-card{overflow:hidden}.activity-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #eef2f7}.activity-head h2{margin:0;font-size:16px}.activity-head span{font-size:11px;color:#64748b}.activity-list{display:flex;flex-direction:column}.activity-item{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:12px;padding:14px 20px;border-bottom:1px solid #f1f5f9}.activity-item:last-child{border-bottom:0}.activity-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#eff6ff;color:#2563eb;font-size:14px}.activity-main{min-width:0}.activity-title{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-size:12px;color:#172033}.activity-title strong{font-weight:800}.activity-title .action{font-size:9px;font-weight:800;letter-spacing:.04em;border-radius:999px;padding:4px 7px;background:#eff6ff;color:#2563eb}.activity-title .action.delete{background:#fef2f2;color:#dc2626}.activity-title .action.update{background:#fff7ed;color:#c2410c}.activity-meta{margin-top:4px;font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.activity-time{font-size:10px;color:#94a3b8;white-space:nowrap}.activity-detail{grid-column:2/-1;margin-top:2px;padding:10px 12px;border-radius:10px;background:#f8fafc;border:1px solid #eef2f7;font-size:10px;color:#475569}.activity-detail-row{display:grid;grid-template-columns:145px 1fr;gap:8px;padding:4px 0}.activity-detail-row strong{color:#172033}.activity-toggle{border:0;background:none;color:#2563eb;font-size:10px;font-weight:800;cursor:pointer;padding:0}.activity-more{padding:16px 20px;text-align:center;border-top:1px solid #eef2f7}.activity-more button{border:1px solid #d8e0ea;border-radius:9px;background:#fff;padding:9px 16px;color:#2563eb;font-size:11px;font-weight:800;cursor:pointer}.activity-more button:hover{background:#f8fafc}.activity-empty{padding:42px 20px;text-align:center;color:#64748b}.activity-empty strong{display:block;color:#172033;margin-bottom:4px}@media(max-width:800px){.activity-toolbar{grid-template-columns:1fr 1fr}.activity-item{grid-template-columns:34px minmax(0,1fr)}.activity-time{grid-column:2}.activity-detail{grid-column:2}.activity-toolbar input{grid-column:1/-1}}@media(max-width:520px){.activity-toolbar{grid-template-columns:1fr}.activity-item{padding:14px}.activity-detail-row{grid-template-columns:1fr;gap:2px}}`}</style>
    <section className="activity-hero"><div className="eyebrow">AUDIT TRAIL · OPERATIONS</div><h1>Activity Log</h1><p>Semua perubahan tetap direkam. Tampilan dibuat ringkas agar aktivitas berulang tidak memenuhi layar.</p></section>
    <div className="activity-toolbar">
      <input placeholder="🔎 Cari aktivitas, MT, rombel, cabang…" value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} />
      <select value={action} onChange={(e) => { setAction(e.target.value); setVisibleCount(PAGE_SIZE); }}><option value="all">Semua Aktivitas</option><option value="INSERT">Tambah</option><option value="UPDATE">Ubah</option><option value="DELETE">Hapus</option></select>
      <select value={table} onChange={(e) => { setTable(e.target.value); setVisibleCount(PAGE_SIZE); }}><option value="all">Semua Modul</option>{Object.entries(TABLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select value={actor} onChange={(e) => { setActor(e.target.value); setVisibleCount(PAGE_SIZE); }}><option value="all">Semua Pengguna</option>{actors.map((name) => <option key={name} value={name}>{name}</option>)}</select>
    </div>
    {message && <div className="message error">{message}</div>}
    <section className="card activity-card">
      <div className="activity-head"><h2>Riwayat Aktivitas</h2><span>{filtered.length} aktivitas · menampilkan {Math.min(visibleCount, filtered.length)} terbaru</span></div>
      <div className="activity-list">
        {loading ? <div className="activity-empty"><strong>Memuat aktivitas…</strong><span>Mohon tunggu sebentar.</span></div> : visibleRows.length === 0 ? <div className="activity-empty"><strong>Tidak ada aktivitas</strong><span>Coba ubah filter atau kata pencarian.</span></div> : visibleRows.map((row) => {
          const changes = changedFields(row); const isOpen = expanded === row.id;
          return <div className="activity-item" key={row.id}>
            <div className="activity-icon">{row.action === "INSERT" ? "＋" : row.action === "DELETE" ? "×" : "✎"}</div>
            <div className="activity-main">
              <div className="activity-title"><strong>{actorLabel(row)}</strong><span className={`action ${row.action.toLowerCase()}`}>{ACTION_LABELS[row.action]}</span><span>{TABLE_LABELS[row.table_name] || row.table_name}</span></div>
              <div className="activity-meta">{recordSummary(row, branches, mts, rombels, mapels)}{row.actor_role ? ` · ${row.actor_role}` : ""}</div>
              {isOpen && <div className="activity-detail">{row.action === "UPDATE" && changes.length ? changes.map((change) => <div className="activity-detail-row" key={change.key}><strong>{change.key}</strong><span>{valueLabel(change.before)} → <b>{valueLabel(change.after)}</b></span></div>) : <div className="activity-detail-row"><strong>{row.action === "DELETE" ? "Data sebelum dihapus" : "Data"}</strong><span>{recordSummary(row, branches, mts, rombels, mapels)}</span></div>}</div>}
            </div>
            <div className="activity-time"><div>{dateTimeLabel(row.changed_at)}</div><button className="activity-toggle" onClick={() => setExpanded(isOpen ? null : row.id)}>{isOpen ? "Tutup" : "Detail"}</button></div>
          </div>;
        })}
      </div>
      {visibleCount < filtered.length && <div className="activity-more"><button onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>Tampilkan 30 aktivitas lagi</button></div>}
    </section>
  </div>;
}
