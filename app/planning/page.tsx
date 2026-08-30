"use client";

import { FormEvent, useState } from "react";

type Session = {
  id: number;
  date: string;
  time: string;
  mt: string;
  rombel: string;
  type: string;
  status: "Planned" | "Changed" | "Cancelled";
};

const initialSessions: Session[] = [
  { id: 1, date: "Senin, 31 Aug", time: "08.00–09.30", mt: "Deki", rombel: "6 SD A", type: "KBM", status: "Planned" },
  { id: 2, date: "Senin, 31 Aug", time: "10.00–11.30", mt: "Farah", rombel: "7 SMP A", type: "KBM", status: "Planned" },
  { id: 3, date: "Senin, 31 Aug", time: "13.00–14.30", mt: "Yogi", rombel: "8 SMP A", type: "KBM", status: "Changed" },
  { id: 4, date: "Selasa, 1 Sep", time: "09.00–10.30", mt: "Ariel", rombel: "10 SMA A", type: "KBM", status: "Planned" },
];

export default function PlanningPage() {
  const [sessions, setSessions] = useState(initialSessions);
  const [showForm, setShowForm] = useState(false);
  const [mt, setMt] = useState("Deki");
  const [rombel, setRombel] = useState("6 SD A");
  const [date, setDate] = useState("2026-08-31");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:30");

  function addSession(e: FormEvent) {
    e.preventDefault();
    const label = new Date(`${date}T12:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "short" });
    const newSession: Session = {
      id: Date.now(),
      date: label.replace(/\./g, ""),
      time: `${start.replace(":", ".")}–${end.replace(":", ".")}`,
      mt,
      rombel,
      type: "KBM",
      status: "Planned",
    };
    setSessions((current) => [...current, newSession]);
    setShowForm(false);
  }

  function cancelSession(id: number) {
    setSessions((current) => current.map((session) => session.id === id ? { ...session, status: "Cancelled" } : session));
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1>Weekly Planning</h1>
          <p>Atur jadwal MT untuk minggu berjalan.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowForm(true)}>＋ Tambah Sesi</button>
      </div>

      <div className="planning-filters">
        <label>Week<select><option>Week 36 · 31 Aug – 6 Sep 2026</option><option>Week 35 · 24 – 30 Aug 2026</option></select></label>
        <label>Cabang<select><option>Tarandam</option><option>Semua Cabang</option></select></label>
        <label>MT<select><option>Semua MT</option><option>Deki</option><option>Farah</option><option>Ariel</option><option>Yogi</option></select></label>
      </div>

      <div className="planning-summary">
        <span><strong>{sessions.length}</strong> Sessions</span>
        <span><b className="dot green-dot" /> {sessions.filter(s => s.status === "Planned").length} Planned</span>
        <span><b className="dot yellow-dot" /> {sessions.filter(s => s.status === "Changed").length} Changed</span>
        <span><b className="dot red-dot" /> {sessions.filter(s => s.status === "Cancelled").length} Cancelled</span>
      </div>

      <div className="planning-table-wrap">
        <table>
          <thead><tr><th>Tanggal</th><th>Jam</th><th>MT</th><th>Rombel</th><th>Jenis</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className={session.status === "Cancelled" ? "muted-row" : ""}>
                <td>{session.date}</td><td>{session.time}</td><td><strong>{session.mt}</strong></td><td>{session.rombel}</td><td>{session.type}</td>
                <td><span className={`badge ${session.status === "Planned" ? "green" : session.status === "Changed" ? "yellow" : "red"}`}>{session.status}</span></td>
                <td><div className="row-actions"><button onClick={() => setShowForm(true)}>Edit</button><button onClick={() => cancelSession(session.id)} disabled={session.status === "Cancelled"}>Cancel</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="finalize-bar">
        <div><strong>Planning Week 36</strong><small>Pastikan semua sesi sudah sesuai sebelum finalisasi.</small></div>
        <button className="secondary-btn">🔒 Finalize Week</button>
      </div>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <form className="modal" onSubmit={addSession}>
            <div className="modal-head"><div><h2>Tambah Session</h2><p>Masukkan jadwal mengajar baru.</p></div><button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button></div>
            <label>Tanggal<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
            <div className="two-cols"><label>Mulai<input type="time" value={start} onChange={(e) => setStart(e.target.value)} required /></label><label>Selesai<input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required /></label></div>
            <label>MT<select value={mt} onChange={(e) => setMt(e.target.value)}><option>Deki</option><option>Farah</option><option>Ariel</option><option>Yogi</option></select></label>
            <label>Rombel<select value={rombel} onChange={(e) => setRombel(e.target.value)}><option>6 SD A</option><option>7 SMP A</option><option>8 SMP A</option><option>10 SMA A</option></select></label>
            <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="primary-btn">Simpan</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
