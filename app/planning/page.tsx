"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getMTs, getRombels, MT, Rombel, Session } from "../../lib/store";

const DAYS = [
  { name: "Senin", date: "31 Agu 2026" }, { name: "Selasa", date: "1 Sep 2026" },
  { name: "Rabu", date: "2 Sep 2026" }, { name: "Kamis", date: "3 Sep 2026" },
  { name: "Jumat", date: "4 Sep 2026" }, { name: "Sabtu", date: "5 Sep 2026" },
  { name: "Minggu", date: "6 Sep 2026" },
];
const BRANCHES = [
  "Bukittinggi - Jambu Air", "Bukittinggi - Manggis Ganting", "Painan - Pagaruyung",
  "Payakumbuh - Simpang Benteng", "Solok - Pandan", "Padang - Gajah Mada",
  "Padang - S. Parman", "Padang - Sutomo", "Padang - Tarandam", "Padang - Ujung Gurun",
];
const DRAFT_KEY = "mt-coach-weekly-planning-draft-v2";

export default function PlanningPage() {
  const [day, setDay] = useState(DAYS[0].name);
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mts, setMts] = useState<MT[]>([]);
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [status, setStatus] = useState<"Draft" | "Finalized">("Draft");
  const [mt, setMt] = useState("");
  const [rombel, setRombel] = useState("");
  const [mapel, setMapel] = useState("");
  const [type, setType] = useState("KBM");
  const [auviTv, setAuviTv] = useState(false);
  const [ld, setLd] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const activeMTs = getMTs().filter((item) => item.status === "Active");
    const activeRombels = getRombels().filter((item) => item.status === "Active");
    setMts(activeMTs); setRombels(activeRombels);
    if (activeMTs[0]) setMt(activeMTs[0].name);
    if (activeRombels[0]) setRombel(activeRombels[0].name);
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { sessions?: Session[]; status?: "Draft" | "Finalized" };
        if (Array.isArray(parsed.sessions)) setSessions(parsed.sessions);
        if (parsed.status === "Finalized") setStatus("Finalized");
      }
    } catch {}
  }, []);

  const selectedDay = DAYS.find((item) => item.name === day) ?? DAYS[0];
  const visibleSessions = useMemo(() => sessions.filter((s) => s.date === day && (s as Session & { branch?: string }).branch === branch), [sessions, day, branch]);
  const branchSessions = useMemo(() => sessions.filter((s) => (s as Session & { branch?: string }).branch === branch), [sessions, branch]);
  const totalRombels = new Set(branchSessions.map((s) => s.rombel)).size;
  const auviRombels = new Set(branchSessions.filter((s) => s.auviTv).map((s) => s.rombel)).size;
  const auviCoverage = totalRombels ? Math.round((auviRombels / totalRombels) * 100) : 0;
  const ldCount = branchSessions.filter((s) => s.ld).length;

  function addSession(e: FormEvent) {
    e.preventDefault();
    if (status === "Finalized" || !mt || !rombel || !mapel.trim()) return;
    const next = {
      id: Date.now(), date: day, time: "", mt, rombel, type: type === "KBM" ? mapel.trim() : type,
      status: "Planned" as const, auviTv, ld, branch,
    } as Session & { branch: string };
    setSessions((prev) => [...prev, next]);
    setMapel(""); setAuviTv(false); setLd(false); setMessage("");
  }

  function deleteSession(id: number) {
    if (status !== "Finalized") setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ sessions, status: "Draft", savedAt: new Date().toISOString() }));
    setStatus("Draft"); setMessage("Draft berhasil disimpan.");
  }

  function finalize() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ sessions, status: "Finalized", savedAt: new Date().toISOString() }));
    setStatus("Finalized"); setMessage("Weekly Planning berhasil difinalisasi.");
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div><h1>Weekly Planning</h1><p>Coach input seluruh sesi secara manual, lalu simpan sebagai Draft.</p></div>
        <span className={`badge ${status === "Draft" ? "yellow" : "green"}`} style={{ padding: "9px 14px" }}>{status === "Draft" ? "📝 Draft" : "🔒 Finalized"}</span>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <label>Cabang<select value={branch} onChange={(e) => setBranch(e.target.value)} disabled={status === "Finalized"}>{BRANCHES.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>

      <div className="grid" style={{ marginBottom: 18 }}>
        <div className="card"><div className="kpi-label">Total Session</div><div className="kpi-value">{branchSessions.length}</div><div className="kpi-note">Input manual</div></div>
        <div className="card"><div className="kpi-label">AuVi TV Coverage</div><div className="kpi-value">{auviCoverage}%</div><div className="kpi-note">{auviRombels}/{totalRombels} rombel · target ≥ 50%</div></div>
        <div className="card"><div className="kpi-label">LD</div><div className="kpi-value">{ldCount}/10</div><div className="kpi-note">Target 10 sesi</div></div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="modal-head" style={{ marginBottom: 14 }}><div><h2>Pilih Hari</h2><p>Pilih hari sekaligus melihat tanggalnya.</p></div></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DAYS.map((item) => <button key={item.name} onClick={() => setDay(item.name)} className={day === item.name ? "primary-btn" : "secondary-btn"} disabled={status === "Finalized" && day !== item.name}><strong>{item.name}</strong><span style={{ display: "block", fontSize: 12, opacity: .8 }}>{item.date}</span></button>)}
        </div>
      </div>

      <form className="card" onSubmit={addSession} style={{ marginBottom: 18 }}>
        <div className="modal-head" style={{ marginBottom: 14 }}><div><h2>Input Sesi — {selectedDay.name}, {selectedDay.date}</h2><p>Semua sesi diinput manual. Jam tidak diperlukan.</p></div></div>
        <div className="planning-filters" style={{ marginBottom: 0 }}>
          <label>MT<select value={mt} onChange={(e) => setMt(e.target.value)} disabled={status === "Finalized"} required>{mts.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
          <label>Rombel<select value={rombel} onChange={(e) => setRombel(e.target.value)} disabled={status === "Finalized"} required>{rombels.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
          <label>Mapel<input value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Contoh: Matematika" disabled={status === "Finalized"} required /></label>
          <label>Jenis Sesi<select value={type} onChange={(e) => setType(e.target.value)} disabled={status === "Finalized"}><option>KBM</option><option>AuVi TV</option><option>LD</option><option>Other</option></select></label>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={auviTv} onChange={(e) => setAuviTv(e.target.checked)} disabled={status === "Finalized"} /> AuVi TV</label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={ld} onChange={(e) => setLd(e.target.checked)} disabled={status === "Finalized"} /> LD</label>
        </div>
        <button className="primary-btn" type="submit" disabled={status === "Finalized"} style={{ marginTop: 16 }}>＋ Tambah Sesi</button>
      </form>

      <div className="planning-table-wrap">
        <table><thead><tr><th>Hari / Tanggal</th><th>MT</th><th>Rombel</th><th>Mapel / Jenis</th><th>AuVi TV</th><th>LD</th><th>Aksi</th></tr></thead>
          <tbody>{visibleSessions.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 36, color: "#64748b" }}>Belum ada sesi untuk {selectedDay.name}. Silakan input sesi di atas.</td></tr> : visibleSessions.map((session) => <tr key={session.id}><td>{selectedDay.name}<br /><small>{selectedDay.date}</small></td><td><strong>{session.mt}</strong></td><td>{session.rombel}</td><td>{session.type}</td><td><span className={`badge ${session.auviTv ? "green" : "blue"}`}>{session.auviTv ? "✓ Assigned" : "—"}</span></td><td><span className={`badge ${session.ld ? "green" : "blue"}`}>{session.ld ? "✓ Assigned" : "—"}</span></td><td><button onClick={() => deleteSession(session.id)} disabled={status === "Finalized"} style={{ color: "#dc2626" }}>Hapus</button></td></tr>)}</tbody>
        </table>
      </div>

      <div className="finalize-bar" style={{ marginTop: 18 }}><div><strong>{branch} · Planning Mingguan</strong><small>{message || "Setelah input sesi, simpan sebagai Draft."}</small></div><div style={{ display: "flex", gap: 10 }}><button type="button" className="secondary-btn" onClick={saveDraft} disabled={status === "Finalized"}>📝 Simpan sebagai Draft</button><button type="button" className="primary-btn" onClick={finalize} disabled={status === "Finalized" || sessions.length === 0}>🔒 Finalize Planning</button></div></div>
    </div>
  );
}
