"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getMTs, getRombels, getSessions, saveSessions, MT, Rombel, Session } from "../../lib/store";

export default function PlanningPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mts, setMts] = useState<MT[]>([]);
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [mtFilter, setMtFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mt, setMt] = useState("");
  const [rombel, setRombel] = useState("");
  const [date, setDate] = useState("2026-08-31");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:30");

  useEffect(() => {
    const loadedMTs = getMTs().filter((item) => item.status === "Active");
    const loadedRombels = getRombels().filter((item) => item.status === "Active");
    setMts(loadedMTs); setRombels(loadedRombels); setSessions(getSessions());
    if (loadedMTs[0]) setMt(loadedMTs[0].name);
    if (loadedRombels[0]) setRombel(loadedRombels[0].name);
  }, []);

  const visibleSessions = useMemo(() => sessions.filter((s) =>
    (mtFilter === "all" || s.mt === mtFilter) && (statusFilter === "all" || s.status === statusFilter)
  ), [sessions, mtFilter, statusFilter]);

  const auviCount = sessions.filter((s) => s.auviTv && s.status !== "Cancelled").length;
  const activeRombels = rombels.length;
  const auviCoverage = activeRombels ? Math.round((new Set(sessions.filter(s => s.auviTv && s.status !== "Cancelled").map(s => s.rombel)).size / activeRombels) * 100) : 0;
  const ldCount = sessions.filter((s) => s.ld && s.status !== "Cancelled").length;

  function persist(next: Session[]) { setSessions(next); saveSessions(next); }

  function addSession(e: FormEvent) {
    e.preventDefault();
    if (!mt || !rombel) return;
    const label = new Date(`${date}T12:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "short" }).replace(/\./g, "");
    const next = [...sessions, { id: Date.now(), date: label, time: `${start.replace(":", ".")}–${end.replace(":", ".")}`, mt, rombel, type: "KBM", status: "Planned" as const, auviTv: false, ld: false }];
    persist(next); setShowForm(false);
  }

  function cancelSession(id: number) {
    persist(sessions.map((session) => session.id === id ? { ...session, status: "Cancelled" as const } : session));
  }

  function toggleAssignment(id: number, field: "auviTv" | "ld") {
    persist(sessions.map((session) => session.id === id ? { ...session, [field]: !session[field] } : session));
  }

  return (
    <div className="page-wrap">
      <div className="page-head"><div><h1>Weekly Planning</h1><p>Atur jadwal, assignment AuVi TV, dan LD untuk minggu berjalan.</p></div><button className="primary-btn" onClick={() => setShowForm(true)}>＋ Tambah Sesi</button></div>
      <div className="planning-filters"><label>Week<select><option>Week 36 · 31 Aug – 6 Sep 2026</option><option>Week 35 · 24 – 30 Aug 2026</option></select></label><label>Cabang<select><option>Tarandam</option><option>Semua Cabang</option></select></label><label>MT<select value={mtFilter} onChange={(e) => setMtFilter(e.target.value)}><option value="all">Semua MT</option>{mts.map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label>Status<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Semua Status</option><option value="Planned">Planned</option><option value="Realized">Realized</option><option value="Changed">Changed</option><option value="Cancelled">Cancelled</option></select></label></div>
      <div className="planning-summary"><span><strong>{visibleSessions.length}</strong> Sessions</span><span><b className="dot green-dot" /> {sessions.filter(s => s.status === "Planned").length} Planned</span><span><b className="dot yellow-dot" /> {sessions.filter(s => s.status === "Changed").length} Changed</span><span><b className="dot red-dot" /> {sessions.filter(s => s.status === "Cancelled").length} Cancelled</span></div>
      <div className="grid" style={{marginBottom: 18}}><div className="card"><div className="kpi-label">AuVi TV Coverage</div><div className="kpi-value">{auviCoverage}%</div><div className="kpi-note">Target ≥ 50% rombel · {auviCount} assignment</div></div><div className="card"><div className="kpi-label">LD</div><div className="kpi-value">{ldCount}/10</div><div className="kpi-note">Target 10 sesi</div></div><div className="card"><div className="kpi-label">Rombel Active</div><div className="kpi-value">{activeRombels}</div><div className="kpi-note">Assignment minggu ini</div></div></div>
      <div className="planning-table-wrap"><table><thead><tr><th>Tanggal</th><th>Jam</th><th>MT</th><th>Rombel</th><th>Jenis</th><th>AuVi TV</th><th>LD</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{visibleSessions.map((session) => <tr key={session.id} className={session.status === "Cancelled" ? "muted-row" : ""}><td>{session.date}</td><td>{session.time}</td><td><strong>{session.mt}</strong></td><td>{session.rombel}</td><td>{session.type}</td><td><button className={`badge ${session.auviTv ? "green" : "blue"}`} onClick={() => toggleAssignment(session.id, "auviTv")}>{session.auviTv ? "✓ Assigned" : "+ Assign"}</button></td><td><button className={`badge ${session.ld ? "green" : "blue"}`} onClick={() => toggleAssignment(session.id, "ld")}>{session.ld ? "✓ Assigned" : "+ Assign"}</button></td><td><span className={`badge ${session.status === "Planned" ? "green" : session.status === "Changed" ? "yellow" : session.status === "Realized" ? "blue" : "red"}`}>{session.status}</span></td><td><div className="row-actions"><button onClick={() => setShowForm(true)}>Edit</button><button onClick={() => cancelSession(session.id)} disabled={session.status === "Cancelled"}>Cancel</button></div></td></tr>)}</tbody></table></div>
      <div className="finalize-bar"><div><strong>Planning Week 36</strong><small>Pastikan assignment AuVi TV & LD sudah sesuai sebelum finalisasi.</small></div><button className="secondary-btn">🔒 Finalize Week</button></div>
      {showForm && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}><form className="modal" onSubmit={addSession}><div className="modal-head"><div><h2>Tambah Session</h2><p>Data MT dan rombel diambil dari menu Data.</p></div><button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button></div><label>Tanggal<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label><div className="two-cols"><label>Mulai<input type="time" value={start} onChange={(e) => setStart(e.target.value)} required /></label><label>Selesai<input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required /></label></div><label>MT<select value={mt} onChange={(e) => setMt(e.target.value)} required>{mts.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><label>Rombel<select value={rombel} onChange={(e) => setRombel(e.target.value)} required>{rombels.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="primary-btn">Simpan</button></div></form></div>}
    </div>
  );
}
