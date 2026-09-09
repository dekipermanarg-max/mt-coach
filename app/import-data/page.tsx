"use client";

import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type ImportType = "TKA" | "UTBK" | "STUDENT";
type PreviewRow = { key: string; eventKey: string | null; email: string; name: string; branch: string; school: string; payload: Record<string, unknown>; action: "NEW" | "CHANGE" | "DUPLICATE"; oldPayload?: Record<string, unknown> };

const TKA_KEYS = ["MAT","B.IND","ENG","MAT LANJ","B.IND LANJ","ENG LANJ","FIS","KIM","BIO","EKO","GEO","SOS","SEJ","PPKN"];
const UTBK_KEYS = ["PU","PPU","PBM","PK","LBI Saintek","LBI Soshum","LBE","PM"];

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) { row.push(cell); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some(x => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function clean(v: unknown) { return String(v ?? "").trim(); }
function emailKey(v: unknown) { return clean(v).toLowerCase(); }
function rowObject(headers: string[], values: string[]) { return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""])); }
function detectType(headers: string[]): ImportType | null {
  const h = new Set(headers);
  if (h.has("Nama Event") && h.has("Email") && TKA_KEYS.some(k => h.has(k))) return "TKA";
  if (h.has("Nama Event") && h.has("Email") && UTBK_KEYS.some(k => h.has(k))) return "UTBK";
  if (h.has("Nama Siswa") && h.has("Email")) return "STUDENT";
  return null;
}
function eventKeyFor(type: ImportType, r: Record<string, unknown>) {
  if (type === "STUDENT") return null;
  return `${emailKey(r.Email)}|${clean(r["Nama Event"])}`;
}
function recordKeyFor(type: ImportType, r: Record<string, unknown>) {
  if (type === "STUDENT") return emailKey(r.Email);
  return eventKeyFor(type, r);
}
function jsonEqual(a: Record<string, unknown>, b: Record<string, unknown>) { return JSON.stringify(a) === JSON.stringify(b); }

export default function ImportDataPage() {
  const [fileName, setFileName] = useState("");
  const [type, setType] = useState<ImportType | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    setLoading(true); setMessage(""); setConfirmed(false); setPreview([]); setInvalid([]); setFileName(file.name); setType(null);
    try {
      if (!file.name.toLowerCase().endsWith(".csv")) throw new Error("Untuk tahap ini gunakan file CSV.");
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length < 2) throw new Error("File kosong atau hanya berisi header.");
      const headers = parsed[0].map(x => clean(x));
      const detected = detectType(headers);
      if (!detected) throw new Error("Format file tidak dikenali. Gunakan file TKA, UTBK, atau Master Siswa sesuai kolom sumber.");
      setType(detected);
      const rows = parsed.slice(1).map(v => rowObject(headers, v));
      const invalidRows: string[] = [];
      const prepared = rows.map((r, idx) => {
        const email = emailKey(r.Email);
        const name = clean(detected === "STUDENT" ? r["Nama Siswa"] : r.Nama);
        const branch = clean(r.Cabang);
        const school = clean(r.Sekolah);
        const key = recordKeyFor(detected, r);
        if (!email || !key || !name) invalidRows.push(`Baris ${idx + 2}: Email/Nama tidak lengkap`);
        return { key, eventKey: eventKeyFor(detected, r), email, name, branch, school, payload: r };
      }).filter(x => x.key && x.email && x.name);
      if (!prepared.length) throw new Error("Tidak ada baris valid yang bisa dipreview.");
      const keys = [...new Set(prepared.map(x => x.key))];
      const existing: Record<string, { payload: Record<string, unknown> }> = {};
      for (let i = 0; i < keys.length; i += 500) {
        const chunk = keys.slice(i, i + 500);
        const { data, error } = await supabase.from("assessment_records").select("record_key,payload").eq("import_type", detected).in("record_key", chunk);
        if (error) throw error;
        for (const item of data || []) existing[item.record_key] = { payload: item.payload || {} };
      }
      const seen = new Set<string>();
      const finalPreview: PreviewRow[] = prepared.map(x => {
        if (seen.has(x.key)) return { ...x, action: "DUPLICATE" as const };
        seen.add(x.key);
        if (!existing[x.key]) return { ...x, action: "NEW" as const };
        return { ...x, action: jsonEqual(existing[x.key].payload, x.payload) ? "DUPLICATE" as const : "CHANGE" as const, oldPayload: existing[x.key].payload };
      });
      setInvalid(invalidRows);
      setPreview(finalPreview);
    } catch (e) {
      setMessage(`Gagal membaca file: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally { setLoading(false); }
  }

  const counts = useMemo(() => ({
    total: preview.length,
    new: preview.filter(x => x.action === "NEW").length,
    change: preview.filter(x => x.action === "CHANGE").length,
    duplicate: preview.filter(x => x.action === "DUPLICATE").length,
  }), [preview]);

  async function confirmUpdate() {
    if (!type || !preview.length || confirming) return;
    setConfirming(true); setMessage("");
    try {
      const { data: batch, error: batchError } = await supabase.from("assessment_import_batches").insert({ file_name: fileName, import_type: type, status: "CONFIRMED", row_count: counts.total, inserted_count: counts.new, changed_count: counts.change, duplicate_count: counts.duplicate, error_count: invalid.length }).select("id").single();
      if (batchError) throw batchError;
      const actionable = preview.filter(x => x.action !== "DUPLICATE");
      const records = actionable.map(x => ({ import_batch_id: batch.id, import_type: type, record_key: x.key, event_key: x.eventKey, email: x.email, student_name: x.name, branch: x.branch, school: x.school, payload: x.payload, source_file_name: fileName }));
      for (let i = 0; i < records.length; i += 250) {
        const chunk = records.slice(i, i + 250);
        const { error } = await supabase.from("assessment_records").upsert(chunk, { onConflict: "import_type,record_key" });
        if (error) throw error;
      }
      setConfirmed(true);
      setMessage(`Update berhasil. ${counts.new} data baru dan ${counts.change} data berubah masuk database. ${counts.duplicate} data sama dilewati.`);
    } catch (e) {
      setMessage(`Update gagal: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally { setConfirming(false); }
  }

  return <div className="page-wrap">
    <section className="planning-hero">
      <div className="planning-hero-row">
        <div><div className="eyebrow">MT COACH · DATA MANAGEMENT</div><h1>Import Data</h1><p>Upload file terbaru, cek perubahan, lalu konfirmasi sebelum database diperbarui.</p></div>
        <span className="badge planning-status">🛡️ Preview first</span>
      </div>
    </section>

    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div><h2 style={{ margin: 0, fontSize: 18 }}>1. Upload file</h2><p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 12 }}>CSV TKA, UTBK, atau Master Siswa. Sistem mendeteksi jenis file dari nama kolom.</p></div>
        <label className="primary-btn" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>
          {loading ? "Membaca…" : "↑ Pilih CSV"}
          <input type="file" accept=".csv,text/csv" style={{ display: "none" }} disabled={loading || confirming} onChange={e => void handleFile(e.target.files?.[0])} />
        </label>
      </div>
      {fileName && <div style={{ marginTop: 14, padding: 12, background: "#f8fafc", borderRadius: 10, fontSize: 12 }}><strong>{fileName}</strong>{type && <span style={{ marginLeft: 10, color: "#2563eb", fontWeight: 800 }}>Detected: {type}</span>}</div>}
    </div>

    {preview.length > 0 && <>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div><h2 style={{ margin: 0, fontSize: 18 }}>2. Preview perubahan</h2><p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 12 }}>Belum ada perubahan ke database sampai tombol konfirmasi ditekan.</p></div>
          <button className="primary-btn" disabled={confirming || confirmed || counts.new + counts.change === 0} onClick={() => void confirmUpdate()}>{confirming ? "Memperbarui…" : confirmed ? "✓ Sudah dikonfirmasi" : "✓ Confirm Update"}</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginTop: 16 }}>
          <Stat label="Total" value={counts.total} /> <Stat label="Data baru" value={counts.new} /> <Stat label="Berubah" value={counts.change} /> <Stat label="Sama / duplikat" value={counts.duplicate} />
        </div>
        {invalid.length > 0 && <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#fff7ed", color: "#9a3412", fontSize: 12 }}><strong>⚠ {invalid.length} baris dilewati:</strong> {invalid.slice(0,5).join(" · ")}{invalid.length > 5 ? " …" : ""}</div>}
        <div style={{ marginTop: 16, overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr>{["Status","Nama","Email","Cabang","Sekolah","Key"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{preview.slice(0,200).map((r,i) => <tr key={`${r.key}-${i}`}><td style={td}><span style={{ ...pill, ...(r.action === "NEW" ? { background: "#ecfdf5", color: "#047857" } : r.action === "CHANGE" ? { background: "#eff6ff", color: "#1d4ed8" } : { background: "#f1f5f9", color: "#64748b" }) }}>{r.action === "NEW" ? "BARU" : r.action === "CHANGE" ? "BERUBAH" : "SAMA"}</span></td><td style={td}>{r.name}</td><td style={td}>{r.email}</td><td style={td}>{r.branch || "—"}</td><td style={td}>{r.school || "—"}</td><td style={{ ...td, color: "#64748b", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.key}</td></tr>)}</tbody></table>{preview.length > 200 && <div style={{ padding: 12, color: "#64748b", fontSize: 11 }}>Menampilkan 200 dari {preview.length} baris preview.</div>}</div>
      </div>
    </>}

    {message && <div className="card" style={{ padding: 14, marginBottom: 16, fontSize: 12 }}>{message}</div>}
    {!preview.length && !loading && <div className="card" style={{ padding: 20, color: "#64748b", fontSize: 12 }}><strong style={{ color: "#172033" }}>Cara kerja:</strong> upload → sistem validasi & membandingkan dengan database → kamu review perubahan → <strong style={{ color: "#172033" }}>Confirm Update</strong> → baru data disimpan.</div>}
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div style={{ padding: 13, background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 11 }}><div style={{ color: "#64748b", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div><div style={{ marginTop: 5, color: "#172033", fontSize: 22, fontWeight: 800 }}>{value}</div></div>; }
const th: React.CSSProperties = { textAlign: "left", padding: "9px 8px", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: ".04em" };
const td: React.CSSProperties = { padding: "9px 8px", borderBottom: "1px solid #eef2f7", verticalAlign: "top" };
const pill: React.CSSProperties = { display: "inline-flex", padding: "4px 7px", borderRadius: 999, fontSize: 9, fontWeight: 800, letterSpacing: ".04em" };
