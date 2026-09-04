"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Item = { id: string; name: string };
type ProgramItem = Item & { product_id: string };
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
const MATHCHAMPS_PRODUCTS = ["SG Math", "Sempoa"];
const MATHCHAMPS_ROMBELS = ["Grup 1", "Grup 2", "Grup 3", "Grup 4", "Grup 5"];

const emptyForm: FormState = {
  session_date: TODAY,
  start_time: "16:00",
  end_time: "17:30",
  branch_id: "",
  mt_id: "",
  product_id: "",
  program_id: "",
  rombel_id: "",
};

export default function SessionsPage() {
  const [branches, setBranches] = useState<Item[]>([]);
  const [mts, setMts] = useState<Item[]>([]);
  const [rombels, setRombels] = useState<Item[]>([]);
  const [products, setProducts] = useState<Item[]>([]);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [admin, setAdmin] = useState({ attendance: false, teacher_notes: false });
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);

    const [b, m, r, p, pr, s] = await Promise.all([
      supabase.from("branches").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mt").select("id,name").eq("active", true).order("name"),
      supabase.from("master_rombel").select("id,name").eq("active", true).order("name"),
      supabase.from("master_product").select("id,name").eq("active", true).order("name"),
      supabase.from("master_program").select("id,name,product_id").eq("active", true).order("name"),
      supabase
        .from("mathchamps_session_status")
        .select("*")
        .order("session_date", { ascending: false })
        .order("start_time", { ascending: false }),
    ]);

    const err = b.error || m.error || r.error || p.error || pr.error || s.error;

    if (err) {
      setMessage(`Gagal memuat data: ${err.message}`);
    } else {
      setBranches((b.data || []) as Item[]);
      setMts((m.data || []) as Item[]);
      setRombels((r.data || []) as Item[]);
      setProducts((p.data || []) as Item[]);
      setPrograms((pr.data || []) as ProgramItem[]);
      setSessions((s.data || []) as SessionRow[]);
      setMessage("");
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const mathchampsId = products.find((p) => p.name === "Mathchamps")?.id || "";

  const mathchampsPrograms = useMemo(
    () => programs.filter(
      (p) => p.product_id === mathchampsId && MATHCHAMPS_PRODUCTS.includes(p.name)
    ),
    [programs, mathchampsId]
  );

  const mathchampsRombels = useMemo(
    () => MATHCHAMPS_ROMBELS
      .map((name) => rombels.find((r) => r.name === name))
      .filter((item): item is Item => Boolean(item)),
    [rombels]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return sessions.filter((s) => {
      const branch = branches.find((x) => x.id === s.branch_id)?.name || "";
      const mt = mts.find((x) => x.id === s.mt_id)?.name || "";
      const product = programs.find((x) => x.id === s.program_id)?.name || "";

      const matchesSearch = !q || [branch, mt, product]
        .some((x) => x.toLowerCase().includes(q));

      return (
        (!filterDate || s.session_date === filterDate) &&
        matchesSearch &&
        (filterProduct === "all" || s.program_id === filterProduct)
      );
    });
  }, [sessions, branches, mts, programs, search, filterDate, filterProduct]);

  const stats = useMemo(() => ({
    total: sessions.length,
    complete: sessions.filter((s) => s.is_complete).length,
    attendance: sessions.filter((s) => s.attendance).length,
    notes: sessions.filter((s) => s.teacher_notes).length,
  }), [sessions]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function label(id: string, list: Item[]) {
    return list.find((x) => x.id === id)?.name || "—";
  }

  function openAddForm() {
    setForm({
      ...emptyForm,
      product_id: mathchampsId,
      program_id: mathchampsPrograms[0]?.id || "",
      rombel_id: mathchampsRombels[0]?.id || "",
      branch_id: branches[0]?.id || "",
      mt_id: mts[0]?.id || "",
    });
    setAdmin({ attendance: false, teacher_notes: false });
    setMessage("");
    setShowForm(true);
  }

  async function saveSession(e: FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (!mathchampsId) {
      setMessage("Produk Mathchamps belum tersedia di master data.");
      return;
    }

    if (!form.branch_id || !form.mt_id || !form.program_id || !form.rombel_id) {
      setMessage("Lengkapi Tanggal, Jam, Cabang, MT, Produk, dan Rombel.");
      return;
    }

    if (!mathchampsPrograms.some((p) => p.id === form.program_id)) {
      setMessage("Produk Mathchamps hanya SG Math atau Sempoa.");
      return;
    }

    if (!mathchampsRombels.some((r) => r.id === form.rombel_id)) {
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
        product_id: mathchampsId,
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
            disabled={loading}
          >
            ＋ Tambah Sesi
          </button>
        </div>
      </section>

      <div className="product-strip">
        <button
          type="button"
          className={filterProduct === "all" ? "product-pill active" : "product-pill"}
          onClick={() => setFilterProduct("all")}
        >
          Semua Produk
        </button>
        {mathchampsPrograms.map((p) => (
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

      <div className="session-kpis">
        <div className="card"><span>Total Sesi</span><strong>{stats.total}</strong></div>
        <div className="card"><span>Lengkap</span><strong>{stats.complete}</strong><small>{stats.total ? Math.round(stats.complete / stats.total * 100) : 0}% compliance</small></div>
        <div className="card"><span>Attendance</span><strong>{stats.attendance}/{stats.total}</strong></div>
        <div className="card"><span>Teacher Notes</span><strong>{stats.notes}/{stats.total}</strong></div>
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
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
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
                  <td><span className="program-badge">{label(s.program_id || "", programs)}</span></td>
                  <td>{label(s.rombel_id, rombels)}</td>
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
                  {mathchampsPrograms.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              <label>Rombel
                <select value={form.rombel_id} onChange={(e) => setField("rombel_id", e.target.value)} required>
                  <option value="">Pilih rombel</option>
                  {mathchampsRombels.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
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
        .product-strip{display:flex;gap:8px;margin:18px 0;flex-wrap:wrap}.product-pill{border:1px solid #e2e8f0;background:#fff;border-radius:999px;padding:9px 14px;color:#64748b;font-weight:700;font-size:12px;cursor:pointer}.product-pill.active{background:#eff6ff;border-color:#bfdbfe;color:#2563eb}
        .session-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}.session-kpis .card{padding:17px 19px;display:flex;flex-direction:column;gap:4px}.session-kpis span{font-size:11px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.session-kpis strong{font-size:27px;letter-spacing:-.04em;color:#172033}.session-kpis small{font-size:11px;color:#2563eb;font-weight:700}
        .session-panel{padding:18px}.session-toolbar{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:16px}.session-toolbar h2{margin:0;color:#172033;font-size:19px}.session-toolbar p{margin:5px 0 0;color:#64748b;font-size:12px}.session-filters{display:flex;gap:8px}.session-filters input{height:40px;border:1px solid #d8e0ea;border-radius:10px;padding:0 11px;background:#f8fafc;font-size:12px}.session-filters .search{width:220px}.session-table-wrap{overflow:auto}.session-table-wrap table{min-width:980px}.session-table-wrap input[type=checkbox]{width:17px;height:17px;accent-color:#2563eb;cursor:pointer}.program-badge{display:inline-flex;padding:5px 8px;border-radius:7px;background:#f1f5f9;color:#334155;font-size:10px;font-weight:800}.status-complete,.status-incomplete{font-size:11px;font-weight:800;white-space:nowrap}.status-complete{color:#16a34a}.status-incomplete{color:#d97706}.notice{margin-bottom:12px;padding:11px 13px;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-size:12px}.empty-state{text-align:center;padding:34px;color:#94a3b8;font-size:12px}
        .modal-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(15,23,42,.52);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:18px}.session-modal{width:min(760px,100%);max-height:calc(100vh - 36px);overflow:auto;background:#fff;border-radius:20px;box-shadow:0 30px 90px rgba(15,23,42,.28);padding:24px}.modal-head{display:flex;justify-content:space-between;gap:18px;padding-bottom:18px;border-bottom:1px solid #eef2f7;margin-bottom:18px}.modal-head h2{margin:2px 0 5px;font-size:22px;color:#172033}.modal-head p{margin:0;color:#64748b;font-size:12px}.close-btn{width:34px;height:34px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;font-size:20px;color:#475569;cursor:pointer}
        .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.form-grid label{display:flex;flex-direction:column;gap:7px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.05em}.form-grid input,.form-grid select{height:43px;box-sizing:border-box;border:1px solid #d8e0ea;border-radius:10px;background:#f8fafc;padding:0 12px;font-size:13px;color:#172033;outline:none}.admin-box{margin-top:18px;border:1px solid #dbeafe;background:#f8fbff;border-radius:14px;padding:15px}.admin-box>div{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}.admin-box b{font-size:13px;color:#172033}.admin-box span{font-size:11px;color:#64748b}.check-row{display:inline-flex;align-items:center;gap:9px;margin-right:18px;font-size:12px;font-weight:700;color:#334155;cursor:pointer}.check-row input{width:17px;height:17px;accent-color:#2563eb}.modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:20px;padding-top:17px;border-top:1px solid #eef2f7}.secondary-btn{height:40px;padding:0 14px;border:1px solid #d8e0ea;border-radius:10px;background:#fff;color:#475569;font-weight:700;cursor:pointer}.primary-btn{height:40px;padding:0 15px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:800;cursor:pointer}.primary-btn:disabled,.secondary-btn:disabled{opacity:.55;cursor:not-allowed}
        @media(max-width:900px){.session-kpis{grid-template-columns:repeat(2,1fr)}.session-toolbar{align-items:stretch;flex-direction:column}.session-filters{width:100%}.session-filters .search{flex:1;width:auto}}@media(max-width:620px){.session-kpis{grid-template-columns:1fr 1fr}.session-filters{flex-direction:column}.form-grid{grid-template-columns:1fr}.session-modal{padding:18px;border-radius:16px}.admin-box .check-row{display:flex;margin:9px 0}}
      `}</style>
    </div>
  );
}
