"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Item = { id: string; name: string };
type SessionRow = {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  branch_id: string;
  mt_id: string;
  product_id: string;
  program_id: string | null;
  rombel_id: string;
  attendance: boolean;
  teacher_notes: boolean;
  is_complete: boolean;
};

type FormState = {
  session_date: string;
  start_time: string;
  end_time: string;
  branch_id: string;
  mt_id: string;
  product_id: string;
  program_id: string;
  rombel_id: string;
};

const TODAY = new Date().toISOString().slice(0, 10);

// Mathchamps master IDs are intentionally kept explicit here.
// This keeps the session form independent from the authenticated-only
// master_product/master_program SELECT policies.
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

const emptyForm: FormState = {
  session_date: TODAY,
  start_time: "16:00",
  end_time: "17:30",
  branch_id: "",
  mt_id: "",
  product_id: MATHCHAMPS_ID,
  program_id: "",
  rombel_id: "",
};

export default function SessionsPage() {
  const [branches, setBranches] = useState<Item[]>([]);
  const [mts, setMts] = useState<Item[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [admin, setAdmin] = useState({ attendance: false, teacher_notes: false });
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);

    // Only fetch data that the page actually needs.
    // Product/program/rombel options are fixed Mathchamps masters above.
    const [b, m, s] = await Promise.all([
      supabase.from("branches").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mt").select("id,name").eq("active", true).order("name"),
      supabase
        .from("mathchamps_session_status")
        .select("*")
        .order("session_date", { ascending: false })
        .order("start_time", { ascending: false }),
    ]);

    const err = b.error || m.error || s.error;

    if (err) {
      setMessage(`Gagal memuat data: ${err.message}`);
    } else {
      setBranches((b.data || []) as Item[]);
      setMts((m.data || []) as Item[]);
      setSessions((s.data || []) as SessionRow[]);
      setMessage("");
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return sessions.filter((s) => {
      const branch = branches.find((x) => x.id === s.branch_id)?.name || "";
      const mt = mts.find((x) => x.id === s.mt_id)?.name || "";
      const product = MATHCHAMPS_PROGRAMS.find((x) => x.id === s.program_id)?.name || "";

      const matchesSearch = !q || [branch, mt, product]
        .some((x) => x.toLowerCase().includes(q));

      const matchesDateFrom = !filterDateFrom || s.session_date >= filterDateFrom;
      const matchesDateTo = !filterDateTo || s.session_date <= filterDateTo;

      return (
        matchesDateFrom &&
        matchesDateTo &&
        matchesSearch &&
        (filterProduct === "all" || s.program_id === filterProduct)
      );
    });
  }, [sessions, branches, mts, search, filterDateFrom, filterDateTo, filterProduct]);

  const stats = useMemo(() => ({
    total: filtered.length,
    complete: filtered.filter((s) => s.is_complete).length,
    attendance: filtered.filter((s) => s.attendance).length,
    notes: filtered.filter((s) => s.teacher_notes).length,
  }), [filtered]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function label(id: string, list: Item[]) {
    return list.find((x) => x.id === id)?.name || "—";
  }

  function productLabel(id: string | null) {
    return MATHCHAMPS_PROGRAMS.find((x) => x.id === id)?.name || "—";
  }

  function openAddForm() {
    setForm({
      ...emptyForm,
      product_id: MATHCHAMPS_ID,
      program_id: "",
      rombel_id: "",
      branch_id: branches[0]?.id || "",
      mt_id: mts[0]?.id || "",
    });
    setAdmin({ attendance: false, teacher_notes: false });
    setMessage("");
    setShowForm(true);
  }

  function clearFilters() {
    setFilterProduct("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearch("");
  }

  async function saveSession(e: FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (!form.branch_id || !form.mt_id || !form.program_id || !form.rombel_id) {
      setMessage("Lengkapi Tanggal, Jam, Cabang, MT, Produk, dan Rombel.");
      return;
    }

    if (!MATHCHAMPS_PROGRAMS.some((p) => p.id === form.program_id)) {
      setMessage("Produk Mathchamps hanya SG Math atau Sempoa.");
      return;
    }

    if (!MATHCHAMPS_ROMBELS.some((r) => r.id === form.rombel_id)) {
      setMessage("Rombel Mathchamps hanya Grup 1 sampai Grup 5.");
      return;
    }

    if (form.end_time <= form.start_time) {
      setMessage("Jam selesai harus lebih besar dari jam mulai.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { data: created, error } = await supabase
      .from("sessions")
      .insert({
        session_date: form.session_date,
        start_time: form.start_time,
        end_time: form.end_time,
        branch_id: form.branch_id,
        mt_id: form.mt_id,
        product_id: MATHCHAMPS_ID,
        program_id: form.program_id,
        rombel_id: form.rombel_id,
      })
      .select("id")
      .single();

    if (error || !created) {
      setMessage(`Gagal menyimpan sesi: ${error?.message || "Tidak ada ID sesi."}`);
      setSaving(false);
      return;
    }

    const { error: adminError } = await supabase
      .from("session_admin")
      .insert({
        session_id: created.id,
        attendance: admin.attendance,
        teacher_notes: admin.teacher_notes,
      });

    if (adminError) {
      await supabase.from("sessions").delete().eq("id", created.id);
      setMessage(`Gagal menyimpan administrasi: ${adminError.message}`);
      setSaving(false);
      return;
    }

    setShowForm(false);
    setForm(emptyForm);
    setAdmin({ attendance: false, teacher_notes: false });
    setMessage("Sesi Mathchamps berhasil ditambahkan.");
    await load();
    setSaving(false);
  }

  async function toggleAdmin(
    sessionId: string,
    field: "attendance" | "teacher_notes",
    value: boolean
  ) {
    const current = sessions.find((s) => s.id === sessionId);
    if (!current) return;

    const next = {
      attendance: field === "attendance" ? value : current.attendance,
      teacher_notes: field === "teacher_notes" ? value : current.teacher_notes,
    };

    setSessions((rows) => rows.map((s) => (
      s.id === sessionId
        ? { ...s, ...next, is_complete: next.attendance && next.teacher_notes }
        : s
    )));

    const { error } = await supabase
      .from("session_admin")
      .upsert({ session_id: sessionId, ...next }, { onConflict: "session_id" });

    if (error) {
      setMessage(`Gagal memperbarui administrasi: ${error.message}`);
      await load();
    }
  }

  const periodLabel = filterDateFrom || filterDateTo
    ? `${filterDateFrom ? new Date(filterDateFrom + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Awal"} – ${filterDateTo ? new Date(filterDateTo + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Sekarang"}`
    : "Semua periode";

  return (
    <div className="page-wrap">
      <section className="planning-hero">
        <div className="planning-hero-row">
          <div>
            <div className="eyebrow">MATHCHAMPS · SESSION ADMINISTRATION</div>
            <h1>Mathchamps Sessions</h1>
            <p>Catat sesi SG Math dan Sempoa, lalu pantau kelengkapan Attendance dan Teacher Notes.</p>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={openAddForm}
          >
            ＋ Tambah Sesi
          </button>
        </div>
      </section>

      <div className="product-filter-row">
        <div className="product-strip">
          <button
            type="button"
            className={filterProduct === "all" ? "product-pill active" : "product-pill"}
            onClick={() => setFilterProduct("all")}
          >
            Semua Produk
          </button>
          {MATHCHAMPS_PROGRAMS.map((p) => (
            <button
              type="button"
              key={p.id}
              className={filterProduct === p.id ? "product-pill active" : "product-pill"}
              onClick={() => setFilterProduct(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="period-filter">
          <span className="period-label">Periode</span>
          <input
            type="date"
            aria-label="Tanggal mulai"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
          <span className="period-separator">s.d.</span>
          <input
            type="date"
            aria-label="Tanggal selesai"
            value={filterDateTo}
            min={filterDateFrom || undefined}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
          {(filterProduct !== "all" || filterDateFrom || filterDateTo || search) && (
            <button type="button" className="clear-filter-btn" onClick={clearFilters}>
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="active-filter-caption">
        Menampilkan <b>{filterProduct === "all" ? "semua produk" : productLabel(filterProduct)}</b> · {periodLabel}
      </div>

      <div className="session-kpis">
        <div className="card"><span>Total Sesi</span><strong>{stats.total}</strong><small>{periodLabel}</small></div>
        <div className="card"><span>Lengkap</span><strong>{stats.complete}</strong><small>{stats.total ? Math.round(stats.complete / stats.total * 100) : 0}% compliance</small></div>
        <div className="card"><span>Attendance</span><strong>{stats.attendance}/{stats.total}</strong><small>administrasi terisi</small></div>
        <div className="card"><span>Teacher Notes</span><strong>{stats.notes}/{stats.total}</strong><small>administrasi terisi</small></div>
      </div>

      <section className="card session-panel">
        <div className="session-toolbar">
          <div>
            <h2>Daftar Sesi Mathchamps</h2>
            <p>Sesi <b>Lengkap</b> jika <b>Attendance + Teacher Notes</b> keduanya terisi.</p>
          </div>
          <div className="session-filters">
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari cabang, MT, produk..."
            />
          </div>
        </div>

        {message && <div className="notice">{message}</div>}

        <div className="table-wrap session-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th><th>Jam</th><th>Cabang</th><th>MT</th>
                <th>Produk</th><th>Rombel</th><th>Attendance</th>
                <th>Teacher Notes</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.session_date + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td>{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</td>
                  <td>{label(s.branch_id, branches)}</td>
                  <td>{label(s.mt_id, mts)}</td>
                  <td><span className="program-badge">{productLabel(s.program_id)}</span></td>
                  <td>{label(s.rombel_id, MATHCHAMPS_ROMBELS)}</td>
                  <td><input type="checkbox" checked={s.attendance} onChange={(e) => toggleAdmin(s.id, "attendance", e.target.checked)} /></td>
                  <td><input type="checkbox" checked={s.teacher_notes} onChange={(e) => toggleAdmin(s.id, "teacher_notes", e.target.checked)} /></td>
                  <td><span className={s.is_complete ? "status-complete" : "status-incomplete"}>{s.is_complete ? "● Lengkap" : "● Belum lengkap"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="empty-state">Belum ada sesi yang sesuai filter.</div>}
          {loading && <div className="empty-state">Memuat sesi…</div>}
        </div>
      </section>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) setShowForm(false);
          }}
        >
          <form className="session-modal" onSubmit={saveSession}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">NEW MATHCHAMPS SESSION</div>
                <h2>Tambah Sesi</h2>
                <p>Masukkan detail sesi dan administrasinya.</p>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>

            <div className="form-grid">
              <label>Tanggal
                <input type="date" value={form.session_date} onChange={(e) => setField("session_date", e.target.value)} required />
              </label>
              <label>Mulai
                <input type="time" value={form.start_time} onChange={(e) => setField("start_time", e.target.value)} required />
              </label>
              <label>Selesai
                <input type="time" value={form.end_time} onChange={(e) => setField("end_time", e.target.value)} required />
              </label>
              <label>Cabang
                <select value={form.branch_id} onChange={(e) => setField("branch_id", e.target.value)} required>
                  <option value="">Pilih cabang</option>
                  {branches.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              <label>Nama MT
                <select value={form.mt_id} onChange={(e) => setField("mt_id", e.target.value)} required>
                  <option value="">Pilih MT</option>
                  {mts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              <label>Produk
                <select value={form.program_id} onChange={(e) => setField("program_id", e.target.value)} required>
                  <option value="">Pilih produk</option>
                  {MATHCHAMPS_PROGRAMS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              <label>Rombel
                <select value={form.rombel_id} onChange={(e) => setField("rombel_id", e.target.value)} required>
                  <option value="">Pilih rombel</option>
                  {MATHCHAMPS_ROMBELS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
            </div>

            <div className="admin-box">
              <div><b>Administrasi Mathchamps</b><span>Keduanya harus terisi agar sesi berstatus Lengkap.</span></div>
              <label className="check-row"><input type="checkbox" checked={admin.attendance} onChange={(e) => setAdmin((a) => ({ ...a, attendance: e.target.checked }))} /><span>Attendance</span></label>
              <label className="check-row"><input type="checkbox" checked={admin.teacher_notes} onChange={(e) => setAdmin((a) => ({ ...a, teacher_notes: e.target.checked }))} /><span>Teacher Notes</span></label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setShowForm(false)} disabled={saving}>Batal</button>
              <button type="submit" className="primary-btn" disabled={saving}>{saving ? "Menyimpan…" : "Simpan Sesi"}</button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .product-filter-row{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:18px 0 6px;flex-wrap:wrap}.product-strip{display:flex;gap:8px;flex-wrap:wrap}.product-pill{border:1px solid #e2e8f0;background:#fff;border-radius:999px;padding:9px 14px;color:#64748b;font-weight:700;font-size:12px;cursor:pointer}.product-pill.active{background:#eff6ff;border-color:#bfdbfe;color:#2563eb}
        .period-filter{display:flex;align-items:center;gap:7px;padding:5px 7px 5px 10px;border:1px solid #e2e8f0;background:#fff;border-radius:12px}.period-label{font-size:11px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.period-filter input{height:32px;border:1px solid #d8e0ea;border-radius:8px;padding:0 8px;background:#f8fafc;color:#334155;font-size:11px}.period-separator{font-size:11px;color:#94a3b8}.clear-filter-btn{height:32px;border:0;border-radius:8px;background:#f1f5f9;color:#475569;padding:0 9px;font-size:11px;font-weight:800;cursor:pointer}.active-filter-caption{font-size:11px;color:#64748b;margin:0 0 12px}.active-filter-caption b{color:#334155}
        .session-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}.session-kpis .card{padding:17px 19px;display:flex;flex-direction:column;gap:4px}.session-kpis span{font-size:11px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.session-kpis strong{font-size:27px;letter-spacing:-.04em;color:#172033}.session-kpis small{font-size:11px;color:#2563eb;font-weight:700}
        .session-panel{padding:18px}.session-toolbar{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:16px}.session-toolbar h2{margin:0;color:#172033;font-size:19px}.session-toolbar p{margin:5px 0 0;color:#64748b;font-size:12px}.session-filters{display:flex;gap:8px}.session-filters input{height:40px;border:1px solid #d8e0ea;border-radius:10px;padding:0 11px;background:#f8fafc;font-size:12px}.session-filters .search{width:220px}.session-table-wrap{overflow:auto}.session-table-wrap table{min-width:980px}.session-table-wrap input[type=checkbox]{width:17px;height:17px;accent-color:#2563eb;cursor:pointer}.program-badge{display:inline-flex;padding:5px 8px;border-radius:7px;background:#f1f5f9;color:#334155;font-size:10px;font-weight:800}.status-complete,.status-incomplete{font-size:11px;font-weight:800;white-space:nowrap}.status-complete{color:#16a34a}.status-incomplete{color:#d97706}.notice{margin-bottom:12px;padding:11px 13px;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-size:12px}.empty-state{text-align:center;padding:34px;color:#94a3b8;font-size:12px}
        .modal-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(15,23,42,.52);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:18px}.session-modal{width:min(760px,100%);max-height:calc(100vh - 36px);overflow:auto;background:#fff;border-radius:20px;box-shadow:0 30px 90px rgba(15,23,42,.28);padding:24px}.modal-head{display:flex;justify-content:space-between;gap:18px;padding-bottom:18px;border-bottom:1px solid #eef2f7;margin-bottom:18px}.modal-head h2{margin:2px 0 5px;font-size:22px;color:#172033}.modal-head p{margin:0;color:#64748b;font-size:12px}.close-btn{width:34px;height:34px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;font-size:20px;color:#475569;cursor:pointer}
        .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.form-grid label{display:flex;flex-direction:column;gap:7px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.05em}.form-grid input,.form-grid select{height:43px;box-sizing:border-box;border:1px solid #d8e0ea;border-radius:10px;background:#f8fafc;padding:0 12px;font-size:13px;color:#172033;outline:none}.form-grid select{cursor:pointer}.admin-box{margin-top:18px;border:1px solid #dbeafe;background:#f8fbff;border-radius:14px;padding:15px}.admin-box>div{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}.admin-box b{font-size:13px;color:#172033}.admin-box span{font-size:11px;color:#64748b}.check-row{display:inline-flex;align-items:center;gap:9px;margin-right:18px;font-size:12px;font-weight:700;color:#334155;cursor:pointer}.check-row input{width:17px;height:17px;accent-color:#2563eb}.modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:20px;padding-top:17px;border-top:1px solid #eef2f7}.secondary-btn{height:40px;padding:0 14px;border:1px solid #d8e0ea;border-radius:10px;background:#fff;color:#475569;font-weight:700;cursor:pointer}.primary-btn{height:40px;padding:0 15px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:800;cursor:pointer}.primary-btn:disabled,.secondary-btn:disabled{opacity:.55;cursor:not-allowed}
        @media(max-width:900px){.session-kpis{grid-template-columns:repeat(2,1fr)}.session-toolbar{align-items:stretch;flex-direction:column}.session-filters{width:100%}.session-filters .search{flex:1;width:auto}.product-filter-row{align-items:stretch}.period-filter{width:100%;box-sizing:border-box;justify-content:flex-start;flex-wrap:wrap}}@media(max-width:620px){.session-kpis{grid-template-columns:1fr 1fr}.session-filters{flex-direction:column}.form-grid{grid-template-columns:1fr}.session-modal{padding:18px;border-radius:16px}.admin-box .check-row{display:flex;margin:9px 0}.period-filter input{flex:1;min-width:120px}}
      `}</style>
    </div>
  );
}
