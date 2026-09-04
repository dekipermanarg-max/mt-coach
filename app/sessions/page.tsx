"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Item = { id: string; name: string };
type SessionRow = { id: string; session_date: string; start_time: string; end_time: string; branch_id: string; mt_id: string; product_id: string; program_id: string | null; rombel_id: string; attendance: boolean; teacher_notes: boolean; is_complete: boolean };
type FormState = { session_date: string; start_time: string; end_time: string; branch_id: string; mt_id: string; product_id: string; program_id: string; rombel_id: string };

const TODAY = new Date().toISOString().slice(0, 10);
const MATHCHAMPS_ID = "7f4e5e22-372c-4848-ba8c-4f7f62d3205d";
const MATHCHAMPS_PROGRAMS: Item[] = [
  { id: "83419aa0-79ac-4c44-8641-54d879404d5f", name: "SG Math" },
  { id: "249f8075-d513-4ad6-b395-5210160ce22d", name: "Sempoa" },
];
const MATHCHAMPS_ROMBELS: Item[] = [
  { id: "6b40d401-68cc-479d-9c96-ac41b53ac8c4", name: "Grup 1" },
  { id: "ad0016ea-1c17-4050-9e94-77fce75a173c", name: "Grup 2" },
  { id: "f90d34dd-2152-4fcd-9d15-3889f484482b", name: "Grup 3" },
  { id: "88672cd5-3e37-47e6-ad1d-cb63edf0dc3d", name: "Grup 4" },
  { id: "55990460-a789-4844-bb77-3e42058e4f1f", name: "Grup 5" },
];
const emptyForm: FormState = { session_date: TODAY, start_time: "16:00", end_time: "17:30", branch_id: "", mt_id: "", product_id: MATHCHAMPS_ID, program_id: "", rombel_id: "" };

export default function SessionsPage() {
  const [branches, setBranches] = useState<Item[]>([]), [mts, setMts] = useState<Item[]>([]), [sessions, setSessions] = useState<SessionRow[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm), [admin, setAdmin] = useState({ attendance: false, teacher_notes: false });
  const [filterProduct, setFilterProduct] = useState("all"), [filterBranch, setFilterBranch] = useState("all"), [filterDateFrom, setFilterDateFrom] = useState(""), [filterDateTo, setFilterDateTo] = useState(""), [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false), [editingId, setEditingId] = useState<string | null>(null), [saving, setSaving] = useState(false), [loading, setLoading] = useState(true), [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const [b, m, s] = await Promise.all([
      supabase.from("branches").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mt").select("id,name").eq("active", true).order("name"),
      supabase.from("mathchamps_session_status").select("*").order("session_date", { ascending: false }).order("start_time", { ascending: false }),
    ]);
    const err = b.error || m.error || s.error;
    if (err) setMessage(`Gagal memuat data: ${err.message}`); else { setBranches((b.data || []) as Item[]); setMts((m.data || []) as Item[]); setSessions((s.data || []) as SessionRow[]); setMessage(""); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sessions.filter((s) => {
      const branch = branches.find(x => x.id === s.branch_id)?.name || "";
      const mt = mts.find(x => x.id === s.mt_id)?.name || "";
      const product = MATHCHAMPS_PROGRAMS.find(x => x.id === s.program_id)?.name || "";
      const rombel = MATHCHAMPS_ROMBELS.find(x => x.id === s.rombel_id)?.name || "";
      return (!q || [branch, mt, product, rombel].some(x => x.toLowerCase().includes(q))) && (!filterDateFrom || s.session_date >= filterDateFrom) && (!filterDateTo || s.session_date <= filterDateTo) && (filterBranch === "all" || s.branch_id === filterBranch) && (filterProduct === "all" || s.program_id === filterProduct);
    });
  }, [sessions, branches, mts, search, filterDateFrom, filterDateTo, filterProduct, filterBranch]);

  const stats = useMemo(() => ({ total: filtered.length, complete: filtered.filter(s => s.is_complete).length, attendance: filtered.filter(s => s.attendance).length, notes: filtered.filter(s => s.teacher_notes).length }), [filtered]);

  const mtAttention = useMemo(() => {
    const map = new Map<string, { name: string; total: number; incomplete: number; attendance: number; notes: number }>();
    filtered.forEach(s => { const name = mts.find(x => x.id === s.mt_id)?.name || "—"; const r = map.get(s.mt_id) || { name, total: 0, incomplete: 0, attendance: 0, notes: 0 }; r.total++; if (!s.is_complete) r.incomplete++; if (s.attendance) r.attendance++; if (s.teacher_notes) r.notes++; map.set(s.mt_id, r); });
    return [...map.values()].filter(x => x.incomplete > 0).sort((a,b) => b.incomplete-a.incomplete || a.name.localeCompare(b.name));
  }, [filtered, mts]);

  const topConsistency = useMemo(() => {
    const map = new Map<string, { name: string; total: number; complete: number }>();
    filtered.forEach(s => {
      const name = mts.find(x => x.id === s.mt_id)?.name || "—";
      const r = map.get(s.mt_id) || { name, total: 0, complete: 0 };
      r.total++; if (s.is_complete) r.complete++; map.set(s.mt_id, r);
    });
    return [...map.values()].filter(x => x.total > 0).sort((a,b) => b.complete-a.complete || (b.complete/b.total)-(a.complete/a.total) || b.total-a.total || a.name.localeCompare(b.name)).slice(0,5);
  }, [filtered, mts]);

  const branchAttention = useMemo(() => {
    const map = new Map<string, { name: string; total: number; incomplete: number }>();
    filtered.forEach(s => { const name = branches.find(x => x.id === s.branch_id)?.name || "—"; const r = map.get(s.branch_id) || { name, total: 0, incomplete: 0 }; r.total++; if (!s.is_complete) r.incomplete++; map.set(s.branch_id, r); });
    return [...map.values()].filter(x => x.incomplete > 0).sort((a,b) => b.incomplete-a.incomplete || a.name.localeCompare(b.name));
  }, [filtered, branches]);

  const rombelAttention = useMemo(() => {
    const map = new Map<string, { rombel: string; branch: string; product: string; total: number; incomplete: number }>();
    filtered.filter(s => !s.is_complete).forEach(s => {
      const rombel = MATHCHAMPS_ROMBELS.find(x => x.id === s.rombel_id)?.name || "—";
      const branch = branches.find(x => x.id === s.branch_id)?.name || "—";
      const product = MATHCHAMPS_PROGRAMS.find(x => x.id === s.program_id)?.name || "—";
      const key = `${s.rombel_id}|${s.branch_id}|${s.program_id}`;
      const r = map.get(key) || { rombel, branch, product, total: 0, incomplete: 0 };
      r.total++; r.incomplete++; map.set(key, r);
    });
    return [...map.values()].sort((a,b) => b.incomplete-a.incomplete || a.rombel.localeCompare(b.rombel) || a.branch.localeCompare(b.branch));
  }, [filtered, branches]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) { setForm(current => ({ ...current, [key]: value })); }
  function label(id: string, list: Item[]) { return list.find(x => x.id === id)?.name || "—"; }
  function productLabel(id: string | null) { return MATHCHAMPS_PROGRAMS.find(x => x.id === id)?.name || "—"; }
  function openAddForm() { setEditingId(null); setForm({ ...emptyForm, branch_id: branches[0]?.id || "", mt_id: mts[0]?.id || "" }); setAdmin({ attendance: false, teacher_notes: false }); setMessage(""); setShowForm(true); }
  function openEditForm(s: SessionRow) { setEditingId(s.id); setForm({ session_date:s.session_date,start_time:s.start_time.slice(0,5),end_time:s.end_time.slice(0,5),branch_id:s.branch_id,mt_id:s.mt_id,product_id:MATHCHAMPS_ID,program_id:s.program_id || "",rombel_id:s.rombel_id }); setAdmin({ attendance:s.attendance,teacher_notes:s.teacher_notes }); setMessage(""); setShowForm(true); }
  function closeForm() { if (!saving) setShowForm(false); }
  function clearFilters() { setFilterProduct("all"); setFilterBranch("all"); setFilterDateFrom(""); setFilterDateTo(""); setSearch(""); }

  async function saveSession(e: FormEvent) {
    e.preventDefault(); if (saving) return;
    if (!form.branch_id || !form.mt_id || !form.program_id || !form.rombel_id) { setMessage("Lengkapi Tanggal, Jam, Cabang, MT, Produk, dan Rombel."); return; }
    if (!MATHCHAMPS_PROGRAMS.some(p => p.id === form.program_id)) { setMessage("Produk Mathchamps hanya SG Math atau Sempoa."); return; }
    if (!MATHCHAMPS_ROMBELS.some(r => r.id === form.rombel_id)) { setMessage("Rombel Mathchamps hanya Grup 1 sampai Grup 5."); return; }
    if (form.end_time <= form.start_time) { setMessage("Jam selesai harus lebih besar dari jam mulai."); return; }
    setSaving(true); setMessage("");
    if (editingId) {
      const { error } = await supabase.from("sessions").update({ session_date:form.session_date,start_time:form.start_time,end_time:form.end_time,branch_id:form.branch_id,mt_id:form.mt_id,product_id:MATHCHAMPS_ID,program_id:form.program_id,rombel_id:form.rombel_id }).eq("id", editingId);
      if (error) { setMessage(`Gagal mengubah sesi: ${error.message}`); setSaving(false); return; }
      const { error: adminError } = await supabase.from("session_admin").upsert({ session_id:editingId,attendance:admin.attendance,teacher_notes:admin.teacher_notes }, { onConflict:"session_id" });
      if (adminError) { setMessage(`Sesi sudah diubah, tetapi administrasi gagal diperbarui: ${adminError.message}`); setSaving(false); await load(); return; }
      setShowForm(false); setMessage("Sesi Mathchamps berhasil diubah.");
    } else {
      const { data: created, error } = await supabase.from("sessions").insert({ session_date:form.session_date,start_time:form.start_time,end_time:form.end_time,branch_id:form.branch_id,mt_id:form.mt_id,product_id:MATHCHAMPS_ID,program_id:form.program_id,rombel_id:form.rombel_id }).select("id").single();
      if (error || !created) { setMessage(`Gagal menyimpan sesi: ${error?.message || "Tidak ada ID sesi."}`); setSaving(false); return; }
      const { error: adminError } = await supabase.from("session_admin").insert({ session_id:created.id,attendance:admin.attendance,teacher_notes:admin.teacher_notes });
      if (adminError) { await supabase.from("sessions").delete().eq("id", created.id); setMessage(`Gagal menyimpan administrasi: ${adminError.message}`); setSaving(false); return; }
      setShowForm(false); setMessage("Sesi Mathchamps berhasil ditambahkan.");
    }
    setEditingId(null); setForm(emptyForm); setAdmin({ attendance:false,teacher_notes:false }); await load(); setSaving(false);
  }

  async function deleteSession(s: SessionRow) {
    const ok = window.confirm(`Hapus sesi ini?\n\n${label(s.branch_id,branches)} · ${label(s.mt_id,mts)}\n${productLabel(s.program_id)} · ${label(s.rombel_id,MATHCHAMPS_ROMBELS)}\n${s.session_date} · ${s.start_time.slice(0,5)}–${s.end_time.slice(0,5)}\n\nData administrasi sesi ini juga akan dihapus.`);
    if (!ok) return;
    setMessage("");
    const { error: adminError } = await supabase.from("session_admin").delete().eq("session_id", s.id);
    if (adminError) { setMessage(`Gagal menghapus administrasi sesi: ${adminError.message}`); return; }
    const { error } = await supabase.from("sessions").delete().eq("id", s.id);
    if (error) { setMessage(`Gagal menghapus sesi: ${error.message}`); await load(); return; }
    setMessage("Sesi Mathchamps berhasil dihapus."); await load();
  }

  async function toggleAdmin(sessionId: string, field: "attendance" | "teacher_notes", value: boolean) {
    const current = sessions.find(s => s.id === sessionId); if (!current) return;
    const next = { attendance:field === "attendance" ? value : current.attendance, teacher_notes:field === "teacher_notes" ? value : current.teacher_notes };
    setSessions(rows => rows.map(s => s.id === sessionId ? { ...s, ...next, is_complete:next.attendance && next.teacher_notes } : s));
    const { error } = await supabase.from("session_admin").upsert({ session_id:sessionId,...next }, { onConflict:"session_id" });
    if (error) { setMessage(`Gagal memperbarui administrasi: ${error.message}`); await load(); }
  }

  const periodLabel = filterDateFrom || filterDateTo ? `${filterDateFrom ? new Date(filterDateFrom+"T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "Awal"} – ${filterDateTo ? new Date(filterDateTo+"T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "Sekarang"}` : "Semua periode";
  const branchLabel = filterBranch === "all" ? "semua cabang" : label(filterBranch, branches);

  return <div className="page-wrap">
    <section className="planning-hero"><div className="planning-hero-row"><div><div className="eyebrow">MATHCHAMPS</div><h1>Mathchamps Sessions</h1><p>Catat sesi SG Math dan Sempoa, lalu pantau kelengkapan Attendance dan Teacher Notes.</p></div><button type="button" className="primary-btn" onClick={openAddForm}>＋ Tambah Sesi</button></div></section>
    <div className="product-filter-row"><div className="product-strip"><button type="button" className={filterProduct === "all" ? "product-pill active" : "product-pill"} onClick={() => setFilterProduct("all")}>Semua Produk</button>{MATHCHAMPS_PROGRAMS.map(p => <button type="button" key={p.id} className={filterProduct === p.id ? "product-pill active" : "product-pill"} onClick={() => setFilterProduct(p.id)}>{p.name}</button>)}</div><div className="period-filter"><span className="period-label">Periode</span><input type="date" aria-label="Tanggal mulai" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} /><span className="period-separator">s.d.</span><input type="date" aria-label="Tanggal selesai" value={filterDateTo} min={filterDateFrom || undefined} onChange={e => setFilterDateTo(e.target.value)} />{(filterProduct !== "all" || filterBranch !== "all" || filterDateFrom || filterDateTo || search) && <button type="button" className="clear-filter-btn" onClick={clearFilters}>Reset</button>}</div></div>
    <div className="secondary-filter-row"><label className="branch-filter"><span>Cabang</span><select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}><option value="all">Semua Cabang</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label></div>
    <div className="active-filter-caption">Menampilkan <b>{filterProduct === "all" ? "semua produk" : productLabel(filterProduct)}</b> · <b>{branchLabel}</b> · {periodLabel}</div>
    <div className="session-kpis"><div className="card"><span>Total Sesi</span><strong>{stats.total}</strong><small>{periodLabel}</small></div><div className="card"><span>Lengkap</span><strong>{stats.complete}</strong><small>{stats.total ? Math.round(stats.complete / stats.total * 100) : 0}% compliance</small></div><div className="card"><span>Attendance</span><strong>{stats.attendance}/{stats.total}</strong><small>administrasi terisi</small></div><div className="card"><span>Teacher Notes</span><strong>{stats.notes}/{stats.total}</strong><small>administrasi terisi</small></div></div>

    <section className="card session-panel"><div className="session-toolbar"><div><h2>Daftar Sesi Mathchamps</h2><p>Sesi <b>Lengkap</b> jika <b>Attendance + Teacher Notes</b> keduanya terisi.</p></div><div className="session-filters"><input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari cabang, MT, produk..." /></div></div>{message && <div className="notice">{message}</div>}<div className="table-wrap session-table-wrap"><table><thead><tr><th>Tanggal</th><th>Jam</th><th>Cabang</th><th>MT</th><th>Produk</th><th>Rombel</th><th>Attendance</th><th>Teacher Notes</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filtered.map(s => <tr key={s.id}><td>{new Date(s.session_date+"T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})}</td><td>{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</td><td>{label(s.branch_id,branches)}</td><td>{label(s.mt_id,mts)}</td><td><span className="program-badge">{productLabel(s.program_id)}</span></td><td>{label(s.rombel_id,MATHCHAMPS_ROMBELS)}</td><td><input type="checkbox" checked={s.attendance} onChange={e => toggleAdmin(s.id,"attendance",e.target.checked)} /></td><td><input type="checkbox" checked={s.teacher_notes} onChange={e => toggleAdmin(s.id,"teacher_notes",e.target.checked)} /></td><td><span className={s.is_complete ? "status-complete" : "status-incomplete"}>{s.is_complete ? "● Lengkap" : "● Belum lengkap"}</span></td><td><div className="row-actions"><button type="button" className="edit-btn" onClick={() => openEditForm(s)}>Edit</button><button type="button" className="delete-btn" onClick={() => deleteSession(s)}>Hapus</button></div></td></tr>)}</tbody></table>{!loading && filtered.length === 0 && <div className="empty-state">Belum ada sesi yang sesuai filter.</div>}{loading && <div className="empty-state">Memuat sesi…</div>}</div></section>

    <section className="attention-section"><div className="section-head"><div><h2>⚠️ MT Need Attention</h2><p className="section-note">MT yang memiliki minimal satu sesi belum lengkap pada filter saat ini.</p></div><span className="attention-count">{mtAttention.length} MT</span></div>{mtAttention.length ? <div className="attention-grid">{mtAttention.map(r => <div className="attention-card" key={r.name}><div className="attention-card-top"><strong>{r.name}</strong><span className="warning-badge">{r.incomplete} belum lengkap</span></div><div className="attention-meta">{r.total} sesi · Attendance {r.attendance}/{r.total} · Notes {r.notes}/{r.total}</div><div className="attention-bar"><span style={{width:`${Math.round(r.incomplete/r.total*100)}%`}} /></div></div>)}</div> : <div className="all-good">✅ Semua MT pada filter ini sudah lengkap.</div>}</section>

    <section className="recognition-section"><div className="section-head"><div><h2>🌟 Apresiasi Konsistensi</h2><p className="section-note">5 MT dengan kelengkapan administrasi terbaik pada filter saat ini.</p></div><span className="recognition-count">Top 5</span></div>{topConsistency.length ? <div className="recognition-grid">{topConsistency.map((r,i) => { const pct=Math.round(r.complete/r.total*100); return <div className="recognition-card" key={r.name}><div className="rank">{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}</div><div className="recognition-info"><strong>{r.name}</strong><span>{r.complete}/{r.total} sesi lengkap</span></div><div className="recognition-pct">{pct}%</div></div>; })}</div> : <div className="all-good">Belum ada data sesi pada filter ini.</div>}</section>

    <div className="attention-two-col"><section className="attention-section compact"><div className="section-head"><div><h2>🏢 Cabang Need Attention</h2><p className="section-note">Cabang dengan sesi belum lengkap.</p></div></div>{branchAttention.length ? <div className="mini-list">{branchAttention.map(r => <div className="mini-row" key={r.name}><div><strong>{r.name}</strong><small>{r.total} sesi</small></div><span>{r.incomplete} belum lengkap</span></div>)}</div> : <div className="all-good">✅ Semua cabang aman.</div>}</section><section className="attention-section compact"><div className="section-head"><div><h2>👥 Rombel Need Attention</h2><p className="section-note">Rombel dengan sesi belum lengkap.</p></div></div>{rombelAttention.length ? <div className="rombel-list">{rombelAttention.map(r => <div className="rombel-row" key={`${r.rombel}|${r.branch}|${r.product}`}><div><strong>{r.rombel}</strong><span>{r.branch}</span><small>{r.product}</small></div><b>{r.incomplete} belum lengkap</b></div>)}</div> : <div className="all-good">✅ Semua rombel aman.</div>}</section></div>

    {showForm && <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget) closeForm();}}><form className="session-modal" onSubmit={saveSession}><div className="modal-head"><div><div className="eyebrow">{editingId?"EDIT MATHCHAMPS SESSION":"NEW MATHCHAMPS SESSION"}</div><h2>{editingId?"Edit Sesi":"Tambah Sesi"}</h2><p>Masukkan detail sesi dan administrasinya.</p></div><button type="button" className="close-btn" onClick={closeForm}>×</button></div><div className="form-grid"><label>Tanggal<input type="date" value={form.session_date} onChange={e => setField("session_date",e.target.value)} required /></label><label>Mulai<input type="time" value={form.start_time} onChange={e => setField("start_time",e.target.value)} required /></label><label>Selesai<input type="time" value={form.end_time} onChange={e => setField("end_time",e.target.value)} required /></label><label>Cabang<select value={form.branch_id} onChange={e => setField("branch_id",e.target.value)} required><option value="">Pilih cabang</option>{branches.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Nama MT<select value={form.mt_id} onChange={e => setField("mt_id",e.target.value)} required><option value="">Pilih MT</option>{mts.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Produk<select value={form.program_id} onChange={e => setField("program_id",e.target.value)} required><option value="">Pilih produk</option>{MATHCHAMPS_PROGRAMS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Rombel<select value={form.rombel_id} onChange={e => setField("rombel_id",e.target.value)} required><option value="">Pilih rombel</option>{MATHCHAMPS_ROMBELS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div><div className="admin-box"><div><b>Administrasi Mathchamps</b><span>Keduanya harus terisi agar sesi berstatus Lengkap.</span></div><label className="check-row"><input type="checkbox" checked={admin.attendance} onChange={e => setAdmin(a => ({...a,attendance:e.target.checked}))} /><span>Attendance</span></label><label className="check-row"><input type="checkbox" checked={admin.teacher_notes} onChange={e => setAdmin(a => ({...a,teacher_notes:e.target.checked}))} /><span>Teacher Notes</span></label></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={closeForm} disabled={saving}>Batal</button><button type="submit" className="primary-btn" disabled={saving}>{saving?"Menyimpan…":editingId?"Simpan Perubahan":"Simpan Sesi"}</button></div></form></div>}

    <style jsx>{`
      .product-filter-row{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:18px 0 6px;flex-wrap:wrap}.product-strip{display:flex;gap:8px;flex-wrap:wrap}.product-pill{border:1px solid #e2e8f0;background:#fff;border-radius:999px;padding:9px 14px;color:#64748b;font-weight:700;font-size:12px;cursor:pointer}.product-pill.active{background:#eff6ff;border-color:#bfdbfe;color:#2563eb}.period-filter{display:flex;align-items:center;gap:7px;padding:5px 7px 5px 10px;border:1px solid #e2e8f0;background:#fff;border-radius:12px}.period-label{font-size:11px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.period-filter input{height:32px;border:1px solid #d8e0ea;border-radius:8px;padding:0 8px;background:#f8fafc;color:#334155;font-size:11px}.period-separator{font-size:11px;color:#94a3b8}.clear-filter-btn{height:32px;border:0;border-radius:8px;background:#f1f5f9;color:#475569;padding:0 9px;font-size:11px;font-weight:800;cursor:pointer}.active-filter-caption{font-size:11px;color:#64748b;margin:0 0 12px}.active-filter-caption b{color:#334155}.secondary-filter-row{display:flex;justify-content:flex-end;margin:8px 0 10px}.branch-filter{display:flex;align-items:center;gap:8px}.branch-filter span{font-size:11px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.branch-filter select{height:34px;min-width:220px;border:1px solid #d8e0ea;border-radius:9px;background:#fff;padding:0 10px;color:#334155;font-size:12px;font-weight:700;cursor:pointer;outline:none}.session-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}.session-kpis .card{padding:17px 19px;display:flex;flex-direction:column;gap:4px}.session-kpis span{font-size:11px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.session-kpis strong{font-size:27px;letter-spacing:-.04em;color:#172033}.session-kpis small{font-size:11px;color:#2563eb;font-weight:700}.session-panel{padding:18px}.session-toolbar{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:16px}.session-toolbar h2{margin:0;color:#172033;font-size:19px}.session-toolbar p{margin:5px 0 0;color:#64748b;font-size:12px}.session-filters .search{height:40px;width:220px;border:1px solid #d8e0ea;border-radius:10px;padding:0 11px;background:#f8fafc;font-size:12px}.session-table-wrap{overflow:auto}.session-table-wrap table{min-width:1160px}.session-table-wrap input[type=checkbox]{width:17px;height:17px;accent-color:#2563eb;cursor:pointer}.program-badge{display:inline-flex;padding:5px 8px;border-radius:7px;background:#f1f5f9;color:#334155;font-size:10px;font-weight:800}.status-complete,.status-incomplete{font-size:11px;font-weight:800;white-space:nowrap}.status-complete{color:#16a34a}.status-incomplete{color:#d97706}.notice{margin-bottom:12px;padding:11px 13px;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-size:12px}.empty-state{text-align:center;padding:34px;color:#94a3b8;font-size:12px}.row-actions{display:flex;gap:6px}.edit-btn,.delete-btn{height:31px;padding:0 9px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer}.edit-btn{border:1px solid #bfdbfe;background:#eff6ff;color:#2563eb}.delete-btn{border:1px solid #fecaca;background:#fff5f5;color:#dc2626}.attention-section,.recognition-section{margin-top:18px;background:#fff;border:1px solid #e7ebf1;border-radius:14px;padding:18px}.section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.section-head h2{margin:0;font-size:18px;color:#172033}.section-note{margin:5px 0 0;color:#64748b;font-size:12px}.attention-count,.recognition-count{font-size:11px;font-weight:800;color:#b45309;background:#fff7ed;border:1px solid #fed7aa;padding:6px 9px;border-radius:999px}.recognition-count{color:#2563eb;background:#eff6ff;border-color:#bfdbfe}.attention-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.attention-card{border:1px solid #edf0f4;border-radius:12px;padding:13px;background:#fff}.attention-card-top{display:flex;justify-content:space-between;align-items:center;gap:10px}.attention-card-top strong{font-size:13px;color:#172033}.warning-badge{font-size:10px;font-weight:800;color:#b45309;background:#fff7ed;border-radius:999px;padding:5px 7px;white-space:nowrap}.attention-meta{margin-top:7px;font-size:11px;color:#64748b}.attention-bar{height:5px;background:#f1f5f9;border-radius:999px;margin-top:10px;overflow:hidden}.attention-bar span{display:block;height:100%;background:#f59e0b;border-radius:999px}.all-good{padding:15px;border-radius:10px;background:#f0fdf4;color:#15803d;font-size:12px;font-weight:700}.recognition-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.recognition-card{border:1px solid #edf0f4;border-radius:12px;padding:13px;display:flex;align-items:center;gap:10px;background:#fff;min-width:0}.rank{font-size:20px;width:28px;text-align:center;flex:none}.recognition-info{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.recognition-info strong{font-size:12px;color:#172033;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.recognition-info span{font-size:10px;color:#64748b}.recognition-pct{font-size:14px;font-weight:900;color:#16a34a}.attention-two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px}.attention-two-col .attention-section{margin-top:18px}.mini-list,.rombel-list{display:flex;flex-direction:column}.mini-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #eef2f6}.mini-row:last-child{border-bottom:0}.mini-row>div{display:flex;flex-direction:column;gap:3px}.mini-row strong{font-size:12px;color:#172033}.mini-row small{font-size:10px;color:#94a3b8}.mini-row>span,.rombel-row>b{font-size:10px;font-weight:800;color:#b45309;background:#fff7ed;padding:5px 7px;border-radius:999px;white-space:nowrap}.rombel-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #eef2f6}.rombel-row:last-child{border-bottom:0}.rombel-row>div{display:flex;flex-direction:column;gap:3px;min-width:0}.rombel-row strong{font-size:12px;color:#172033}.rombel-row span{font-size:10px;color:#475569}.rombel-row small{font-size:10px;color:#2563eb;font-weight:700}.modal-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(15,23,42,.52);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:18px}.session-modal{width:min(760px,100%);max-height:calc(100vh - 36px);overflow:auto;background:#fff;border-radius:20px;box-shadow:0 30px 90px rgba(15,23,42,.28);padding:24px}.modal-head{display:flex;justify-content:space-between;gap:18px;padding-bottom:18px;border-bottom:1px solid #eef2f7;margin-bottom:18px}.modal-head h2{margin:2px 0 5px;font-size:22px;color:#172033}.modal-head p{margin:0;color:#64748b;font-size:12px}.close-btn{width:34px;height:34px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;font-size:20px;color:#475569;cursor:pointer}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.form-grid label{display:flex;flex-direction:column;gap:7px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.05em}.form-grid input,.form-grid select{height:43px;box-sizing:border-box;border:1px solid #d8e0ea;border-radius:10px;background:#f8fafc;padding:0 12px;font-size:13px;color:#172033;outline:none}.form-grid select{cursor:pointer}.admin-box{margin-top:18px;border:1px solid #dbeafe;background:#f8fbff;border-radius:14px;padding:15px}.admin-box>div{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}.admin-box b{font-size:13px;color:#172033}.admin-box span{font-size:11px;color:#64748b}.check-row{display:inline-flex;align-items:center;gap:9px;margin-right:18px;font-size:12px;font-weight:700;color:#334155;cursor:pointer}.check-row input{width:17px;height:17px;accent-color:#2563eb}.modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:20px;padding-top:17px;border-top:1px solid #eef2f7}.secondary-btn{height:40px;padding:0 14px;border:1px solid #d8e0ea;border-radius:10px;background:#fff;color:#475569;font-weight:700;cursor:pointer}.primary-btn{height:40px;padding:0 15px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:800;cursor:pointer}.primary-btn:disabled,.secondary-btn:disabled{opacity:.55;cursor:not-allowed}
      @media(max-width:1000px){.recognition-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.session-kpis{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:900px){.session-toolbar{align-items:stretch;flex-direction:column}.session-filters .search{width:100%;box-sizing:border-box}.product-filter-row{align-items:stretch}.period-filter{width:100%;box-sizing:border-box;justify-content:flex-start;flex-wrap:wrap}.secondary-filter-row{justify-content:flex-start}.branch-filter{width:100%}.branch-filter select{flex:1;min-width:0}.attention-grid,.attention-two-col{grid-template-columns:1fr}}
      @media(max-width:620px){.session-kpis{grid-template-columns:1fr 1fr}.recognition-grid{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}.session-modal{padding:18px;border-radius:16px}.admin-box .check-row{display:flex;margin:9px 0}.period-filter input{flex:1;min-width:120px}.branch-filter{align-items:stretch;flex-direction:column;gap:6px}.branch-filter select{width:100%}.recognition-card{padding:12px}}
    `}</style>
  </div>;
}
