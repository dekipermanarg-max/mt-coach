"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Branch = { id: string; name: string };
type MT = { id: string; name: string; branch_id: string };
type SessionRow = { id: string; session_date: string; start_time: string; end_time: string; branch_id: string; mt_id: string; product_id: string; program_id: string | null; rombel_id: string; attendance: boolean; teacher_notes: boolean; is_complete: boolean };
type FormState = { session_date: string; start_time: string; end_time: string; branch_id: string; mt_id: string; program_id: string; rombel_id: string };

const TODAY = new Date().toISOString().slice(0, 10);
const MATHCHAMPS_ID = "7f4e5e22-372c-4848-ba8c-4f7f62d3205d";
const PROGRAMS = [
  { id: "83419aa0-79ac-4c44-8641-54d879404d5f", name: "SG Math" },
  { id: "249f8075-d513-4ad6-b395-5210160ce22d", name: "Sempoa" },
];
const ROMBELS = [
  { id: "6b40d401-68cc-479d-9c96-ac41b53ac8c4", name: "Grup 1" },
  { id: "ad0016ea-1c17-4050-9e94-77fce75a173c", name: "Grup 2" },
  { id: "f90d34dd-2152-4fcd-9d15-3889f484482b", name: "Grup 3" },
  { id: "88672cd5-3e37-47e6-ad1d-cb63edf0dc3d", name: "Grup 4" },
  { id: "55990460-a789-4844-bb77-3e42058e4f1f", name: "Grup 5" },
];
const EMPTY: FormState = { session_date: TODAY, start_time: "16:00", end_time: "17:30", branch_id: "", mt_id: "", program_id: "", rombel_id: "" };

export default function SessionsPageV2() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [mts, setMts] = useState<MT[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [admin, setAdmin] = useState({ attendance: false, teacher_notes: false });
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const [b, m, s] = await Promise.all([
      supabase.from("branches").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mt").select("id,name,branch_id").eq("active", true).order("name"),
      supabase.from("mathchamps_session_status").select("*").order("session_date", { ascending: false }).order("start_time", { ascending: false }),
    ]);
    const err = b.error || m.error || s.error;
    if (err) setMessage(`Gagal memuat data: ${err.message}`);
    else {
      setBranches((b.data || []) as Branch[]);
      setMts((m.data || []) as MT[]);
      setSessions((s.data || []) as SessionRow[]);
      setMessage("");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Matchchamps: MT tidak bergantung pada cabang sesi.
  // Cabang = lokasi sesi, sedangkan MT = seluruh MT aktif dari semua cabang.
  const formMts = useMemo(() => mts, [mts]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function changeBranch(branchId: string) {
    // Perubahan cabang tidak boleh memfilter atau mengganti MT.
    setForm(current => ({ ...current, branch_id: branchId }));
  }

  function openAddForm() {
    const branchId = branches[0]?.id || "";
    const defaultMtId = mts[0]?.id || "";
    setEditingId(null);
    setForm({ ...EMPTY, branch_id: branchId, mt_id: defaultMtId });
    setAdmin({ attendance: false, teacher_notes: false });
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(s: SessionRow) {
    setEditingId(s.id);
    setForm({ session_date: s.session_date, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5), branch_id: s.branch_id, mt_id: s.mt_id, program_id: s.program_id || "", rombel_id: s.rombel_id });
    setAdmin({ attendance: s.attendance, teacher_notes: s.teacher_notes });
    setMessage("");
    setShowForm(true);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sessions.filter(s => {
      const branch = branches.find(x => x.id === s.branch_id)?.name || "";
      const mt = mts.find(x => x.id === s.mt_id)?.name || "";
      const product = PROGRAMS.find(x => x.id === s.program_id)?.name || "";
      const rombel = ROMBELS.find(x => x.id === s.rombel_id)?.name || "";
      return (!q || [branch, mt, product, rombel].some(x => x.toLowerCase().includes(q))) && (filterBranch === "all" || s.branch_id === filterBranch) && (filterProduct === "all" || s.program_id === filterProduct);
    });
  }, [sessions, branches, mts, search, filterBranch, filterProduct]);

  const stats = useMemo(() => ({ total: filtered.length, complete: filtered.filter(s => s.is_complete).length, attendance: filtered.filter(s => s.attendance).length, notes: filtered.filter(s => s.teacher_notes).length }), [filtered]);

  const mtAttention = useMemo(() => {
    const map = new Map<string, { name: string; total: number; incomplete: number; attendance: number; notes: number }>();
    filtered.forEach(s => {
      const name = mts.find(x => x.id === s.mt_id)?.name || "—";
      const r = map.get(s.mt_id) || { name, total: 0, incomplete: 0, attendance: 0, notes: 0 };
      r.total++; if (!s.is_complete) r.incomplete++; if (s.attendance) r.attendance++; if (s.teacher_notes) r.notes++; map.set(s.mt_id, r);
    });
    return [...map.values()].filter(x => x.incomplete > 0).sort((a, b) => b.incomplete - a.incomplete || a.name.localeCompare(b.name));
  }, [filtered, mts]);

  async function saveSession(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!form.branch_id || !form.mt_id || !form.program_id || !form.rombel_id) { setMessage("Lengkapi Tanggal, Jam, Cabang, MT, Produk, dan Rombel."); return; }
    if (!mts.some(mt => mt.id === form.mt_id)) { setMessage("MT yang dipilih harus merupakan MT aktif."); return; }
    if (form.end_time <= form.start_time) { setMessage("Jam selesai harus lebih besar dari jam mulai."); return; }
    setSaving(true); setMessage("");
    const payload = { session_date: form.session_date, start_time: form.start_time, end_time: form.end_time, branch_id: form.branch_id, mt_id: form.mt_id, product_id: MATHCHAMPS_ID, program_id: form.program_id, rombel_id: form.rombel_id };
    if (editingId) {
      const { error } = await supabase.from("sessions").update(payload).eq("id", editingId);
      if (error) { setMessage(`Gagal mengubah sesi: ${error.message}`); setSaving(false); return; }
      const { error: adminError } = await supabase.from("session_admin").upsert({ session_id: editingId, attendance: admin.attendance, teacher_notes: admin.teacher_notes }, { onConflict: "session_id" });
      if (adminError) { setMessage(`Sesi sudah diubah, tetapi administrasi gagal diperbarui: ${adminError.message}`); setSaving(false); await load(); return; }
      setMessage("Sesi Mathchamps berhasil diubah.");
    } else {
      const { data: created, error } = await supabase.from("sessions").insert(payload).select("id").single();
      if (error || !created) { setMessage(`Gagal menyimpan sesi: ${error?.message || "Tidak ada ID sesi."}`); setSaving(false); return; }
      const { error: adminError } = await supabase.from("session_admin").insert({ session_id: created.id, attendance: admin.attendance, teacher_notes: admin.teacher_notes });
      if (adminError) { await supabase.from("sessions").delete().eq("id", created.id); setMessage(`Gagal menyimpan administrasi: ${adminError.message}`); setSaving(false); return; }
      setMessage("Sesi Mathchamps berhasil ditambahkan.");
    }
    setShowForm(false); setEditingId(null); setForm(EMPTY); setAdmin({ attendance: false, teacher_notes: false }); await load(); setSaving(false);
  }

  async function toggleAdmin(sessionId: string, field: "attendance" | "teacher_notes", value: boolean) {
    const current = sessions.find(s => s.id === sessionId); if (!current) return;
    const next = { attendance: field === "attendance" ? value : current.attendance, teacher_notes: field === "teacher_notes" ? value : current.teacher_notes };
    setSessions(rows => rows.map(s => s.id === sessionId ? { ...s, ...next, is_complete: next.attendance && next.teacher_notes } : s));
    const { error } = await supabase.from("session_admin").upsert({ session_id: sessionId, ...next }, { onConflict: "session_id" });
    if (error) { setMessage(`Gagal memperbarui administrasi: ${error.message}`); await load(); }
  }

  async function deleteSession(s: SessionRow) {
    if (!window.confirm(`Hapus sesi ${branches.find(x => x.id === s.branch_id)?.name || ""} · ${mts.find(x => x.id === s.mt_id)?.name || ""}?`)) return;
    const { error: adminError } = await supabase.from("session_admin").delete().eq("session_id", s.id);
    if (adminError) { setMessage(`Gagal menghapus administrasi sesi: ${adminError.message}`); return; }
    const { error } = await supabase.from("sessions").delete().eq("id", s.id);
    if (error) { setMessage(`Gagal menghapus sesi: ${error.message}`); return; }
    setMessage("Sesi Mathchamps berhasil dihapus."); await load();
  }

  return <div className="page-wrap">
    <section className="planning-hero"><div className="planning-hero-row"><div><div className="eyebrow">MATHCHAMPS</div><h1>Mathchamps Sessions</h1><p>Catat sesi SG Math dan Sempoa, lalu pantau kelengkapan Attendance dan Teacher Notes.</p></div><button type="button" className="primary-btn" onClick={openAddForm}>＋ Tambah Sesi</button></div></section>
    <div className="product-filter-row"><div className="product-strip"><button className={filterProduct === "all" ? "product-pill active" : "product-pill"} onClick={() => setFilterProduct("all")}>Semua Produk</button>{PROGRAMS.map(p => <button key={p.id} className={filterProduct === p.id ? "product-pill active" : "product-pill"} onClick={() => setFilterProduct(p.id)}>{p.name}</button>)}</div></div>
    <div className="secondary-filter-row"><label className="branch-filter"><span>Cabang</span><select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}><option value="all">Semua Cabang</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label></div>
    <div className="active-filter-caption">Menampilkan <b>{filterProduct === "all" ? "semua produk" : PROGRAMS.find(p => p.id === filterProduct)?.name}</b> · <b>{filterBranch === "all" ? "semua cabang" : branches.find(b => b.id === filterBranch)?.name}</b></div>
    <div className="session-kpis"><div className="card"><span>Total Sesi</span><strong>{stats.total}</strong></div><div className="card"><span>Lengkap</span><strong>{stats.complete}</strong><small>{stats.total ? Math.round(stats.complete / stats.total * 100) : 0}% compliance</small></div><div className="card"><span>Attendance</span><strong>{stats.attendance}/{stats.total}</strong></div><div className="card"><span>Teacher Notes</span><strong>{stats.notes}/{stats.total}</strong></div></div>
    <section className="card session-panel"><div className="session-toolbar"><div><h2>Daftar Sesi Mathchamps</h2><p>Sesi <b>Lengkap</b> jika <b>Attendance + Teacher Notes</b> keduanya terisi.</p></div><input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari cabang, MT, produk..." /></div>{message && <div className="notice">{message}</div>}<div className="table-wrap session-table-wrap"><table><thead><tr><th>Tanggal</th><th>Jam</th><th>Cabang</th><th>MT</th><th>Produk</th><th>Rombel</th><th>Attendance</th><th>Teacher Notes</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filtered.map(s => <tr key={s.id}><td>{new Date(s.session_date + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td><td>{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</td><td>{branches.find(x => x.id === s.branch_id)?.name || "—"}</td><td>{mts.find(x => x.id === s.mt_id)?.name || "—"}</td><td>{PROGRAMS.find(x => x.id === s.program_id)?.name || "—"}</td><td>{ROMBELS.find(x => x.id === s.rombel_id)?.name || "—"}</td><td><input type="checkbox" checked={s.attendance} onChange={e => toggleAdmin(s.id, "attendance", e.target.checked)} /></td><td><input type="checkbox" checked={s.teacher_notes} onChange={e => toggleAdmin(s.id, "teacher_notes", e.target.checked)} /></td><td>{s.is_complete ? "● Lengkap" : "● Belum lengkap"}</td><td><button type="button" onClick={() => openEditForm(s)}>Edit</button> <button type="button" onClick={() => deleteSession(s)}>Hapus</button></td></tr>)}</tbody></table>{!loading && !filtered.length && <div className="empty-state">Belum ada sesi yang sesuai filter.</div>}</div></section>
    <section className="attention-section"><div className="section-head"><div><h2>⚠️ MT Need Attention</h2><p className="section-note">MT yang memiliki minimal satu sesi belum lengkap.</p></div><span className="attention-count">{mtAttention.length} MT</span></div>{mtAttention.length ? <div className="attention-grid">{mtAttention.map(r => <div className="attention-card" key={r.name}><strong>{r.name}</strong><div className="attention-meta">{r.incomplete} belum lengkap · Attendance {r.attendance}/{r.total} · Notes {r.notes}/{r.total}</div></div>)}</div> : <div className="all-good">✅ Semua MT pada filter ini sudah lengkap.</div>}</section>
    {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}><form className="session-modal" onSubmit={saveSession}><div className="modal-head"><div><div className="eyebrow">{editingId ? "EDIT MATHCHAMPS SESSION" : "NEW MATHCHAMPS SESSION"}</div><h2>{editingId ? "Edit Sesi" : "Tambah Sesi"}</h2><p>MT tersedia dari semua cabang aktif.</p></div><button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button></div><div className="form-grid"><label>Tanggal<input type="date" value={form.session_date} onChange={e => setField("session_date", e.target.value)} required /></label><label>Mulai<input type="time" value={form.start_time} onChange={e => setField("start_time", e.target.value)} required /></label><label>Selesai<input type="time" value={form.end_time} onChange={e => setField("end_time", e.target.value)} required /></label><label>Cabang<select value={form.branch_id} onChange={e => changeBranch(e.target.value)} required><option value="">Pilih cabang</option>{branches.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Nama MT<select value={form.mt_id} onChange={e => setField("mt_id", e.target.value)} required disabled={!formMts.length}><option value="">{formMts.length ? "Pilih MT" : "Belum ada MT aktif"}</option>{formMts.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Produk<select value={form.program_id} onChange={e => setField("program_id", e.target.value)} required><option value="">Pilih produk</option>{PROGRAMS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Rombel<select value={form.rombel_id} onChange={e => setField("rombel_id", e.target.value)} required><option value="">Pilih rombel</option>{ROMBELS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div><div className="admin-box"><b>Administrasi Mathchamps</b><span>Keduanya harus terisi agar sesi berstatus Lengkap.</span><label className="check-row"><input type="checkbox" checked={admin.attendance} onChange={e => setAdmin(a => ({ ...a, attendance: e.target.checked }))} /> Attendance</label><label className="check-row"><input type="checkbox" checked={admin.teacher_notes} onChange={e => setAdmin(a => ({ ...a, teacher_notes: e.target.checked }))} /> Teacher Notes</label></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)} disabled={saving}>Batal</button><button type="submit" className="primary-btn" disabled={saving}>{saving ? "Menyimpan…" : editingId ? "Simpan Perubahan" : "Simpan Sesi"}</button></div></form></div>}
    <style jsx>{`.product-filter-row{display:flex;gap:12px;margin:18px 0}.product-strip{display:flex;gap:8px;flex-wrap:wrap}.product-pill{border:1px solid #e2e8f0;background:#fff;border-radius:999px;padding:9px 14px;color:#64748b;font-weight:700;font-size:12px;cursor:pointer}.product-pill.active{background:#eff6ff;border-color:#bfdbfe;color:#2563eb}.secondary-filter-row{display:flex;justify-content:flex-end;margin:8px 0 10px}.branch-filter{display:flex;align-items:center;gap:8px}.branch-filter span{font-size:11px;color:#64748b;font-weight:800;text-transform:uppercase}.branch-filter select{height:34px;min-width:220px;border:1px solid #d8e0ea;border-radius:9px;background:#fff;padding:0 10px;color:#334155;font-size:12px}.active-filter-caption{font-size:11px;color:#64748b;margin-bottom:12px}.session-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}.session-kpis .card{padding:17px 19px;display:flex;flex-direction:column;gap:4px}.session-kpis span{font-size:11px;color:#64748b;font-weight:800;text-transform:uppercase}.session-kpis strong{font-size:27px;color:#172033}.session-kpis small{font-size:11px;color:#2563eb;font-weight:700}.session-panel{padding:18px}.session-toolbar{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:16px}.session-toolbar h2{margin:0;color:#172033;font-size:19px}.session-toolbar p{margin:5px 0 0;color:#64748b;font-size:12px}.search{height:40px;width:240px;border:1px solid #d8e0ea;border-radius:10px;padding:0 11px;background:#f8fafc;font-size:12px}.session-table-wrap{overflow:auto}.session-table-wrap table{min-width:1160px;width:100%}.session-table-wrap input[type=checkbox]{width:17px;height:17px;accent-color:#2563eb;cursor:pointer}.notice{margin-bottom:12px;padding:11px 13px;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-size:12px}.empty-state{text-align:center;padding:34px;color:#94a3b8;font-size:12px}.attention-section{margin-top:18px;background:#fff;border:1px solid #e7ebf1;border-radius:14px;padding:18px}.section-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px}.section-head h2{margin:0;font-size:18px}.section-note,.attention-meta{color:#64748b;font-size:12px}.attention-count{font-size:11px;font-weight:800;color:#b45309;background:#fff7ed;padding:6px 9px;border-radius:999px}.attention-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.attention-card{border:1px solid #edf0f4;border-radius:12px;padding:13px}.all-good{padding:15px;border-radius:10px;background:#f0fdf4;color:#15803d;font-size:12px;font-weight:700}.modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.42);display:flex;align-items:center;justify-content:center;padding:18px;z-index:50}.session-modal{width:min(720px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 25px 70px rgba(15,23,42,.25);padding:20px}.modal-head{display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid #edf0f4;padding-bottom:15px;margin-bottom:16px}.modal-head h2{margin:4px 0 0;font-size:22px;color:#172033}.modal-head p{margin:5px 0 0;font-size:11px;color:#64748b}.close-btn{width:30px;height:30px;border:1px solid #dbe3ec;border-radius:8px;background:#fff;color:#64748b;font-size:18px;cursor:pointer}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.form-grid label{display:flex;flex-direction:column;gap:6px;font-size:10px;text-transform:uppercase;font-weight:800;color:#64748b}.form-grid input,.form-grid select{height:42px;border:1px solid #d8e0ea;border-radius:10px;background:#f8fafc;padding:0 11px;color:#172033;font-size:12px}.admin-box{margin-top:15px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:12px;padding:12px;display:flex;align-items:center;gap:13px;flex-wrap:wrap}.admin-box>b{font-size:12px;color:#1e3a8a}.admin-box>span{font-size:10px;color:#64748b;width:100%}.check-row{display:flex;align-items:center;gap:6px;font-size:11px;color:#334155}.modal-actions{display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #edf0f4;margin-top:16px;padding-top:12px}.primary-btn,.secondary-btn{height:38px;border-radius:9px;padding:0 13px;font-size:12px;font-weight:800;cursor:pointer}.primary-btn{border:0;background:#2563eb;color:#fff}.secondary-btn{border:1px solid #d8e0ea;background:#fff;color:#475569}@media(max-width:760px){.session-kpis{grid-template-columns:repeat(2,1fr)}.form-grid{grid-template-columns:1fr}.session-toolbar{align-items:stretch;flex-direction:column}.search{width:100%}}`}</style>
  </div>;
}
