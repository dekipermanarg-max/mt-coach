"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Key = "mt" | "rombel" | "mapel";
type Item = { id: string; name: string };

const labels: Record<Key, string> = {
  mt: "List MT",
  rombel: "List Rombel",
  mapel: "List Mapel",
};
const icons: Record<Key, string> = { mt: "👤", rombel: "🏫", mapel: "📚" };
const tables: Record<Key, string> = {
  mt: "master_mt",
  rombel: "master_rombel",
  mapel: "master_mapel",
};

export default function MasterDataPage() {
  const [data, setData] = useState<Record<Key, Item[]>>({ mt: [], rombel: [], mapel: [] });
  const [values, setValues] = useState<Record<Key, string>>({ mt: "", rombel: "", mapel: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Key | null>(null);

  async function load() {
    setLoading(true);
    const [mt, rombel, mapel] = await Promise.all([
      supabase.from("master_mt").select("id,name").eq("active", true).order("name"),
      supabase.from("master_rombel").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mapel").select("id,name").eq("active", true).order("name"),
    ]);
    if (mt.error || rombel.error || mapel.error) {
      setMessage("Gagal mengambil master data dari database.");
    }
    setData({ mt: mt.data || [], rombel: rombel.data || [], mapel: mapel.data || [] });
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function add(key: Key) {
    const name = values[key].trim();
    if (!name || saving) return;
    if (data[key].some((x) => x.name.toLowerCase() === name.toLowerCase())) {
      setMessage(`${labels[key]} "${name}" sudah ada.`);
      return;
    }
    setSaving(key);
    setMessage("");
    const { error } = await supabase.from(tables[key]).insert({ name, active: true });
    setSaving(null);
    if (error) {
      setMessage(`Gagal menambah ${labels[key].toLowerCase()}: ${error.message}`);
      return;
    }
    setValues((v) => ({ ...v, [key]: "" }));
    setMessage(`${labels[key]} berhasil ditambahkan.`);
    await load();
  }

  async function remove(key: Key, item: Item) {
    if (!window.confirm(`Hapus "${item.name}" dari ${labels[key].toLowerCase()}?`)) return;
    const { error } = await supabase.from(tables[key]).update({ active: false }).eq("id", item.id);
    if (error) {
      setMessage(`Gagal menghapus ${item.name}: ${error.message}`);
      return;
    }
    setMessage(`${item.name} berhasil dihapus dari pilihan aktif.`);
    await load();
  }

  function renderList(key: Key) {
    return (
      <section className="card" style={{ padding: 18, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
          <div style={{ fontWeight: 800, color: "#14213d", fontSize: 15 }}>
            {icons[key]} {labels[key]}
          </div>
          <span className="section-chip">{data[key].length}</span>
        </div>

        <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
          <input
            value={values[key]}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && add(key)}
            placeholder={`Tambah ${key === "mt" ? "nama MT" : key}...`}
            disabled={loading || saving !== null}
            style={{ flex: 1, minWidth: 0, border: "1px solid #dbe2ea", borderRadius: 10, padding: "9px 10px", outline: "none", fontSize: 12 }}
          />
          <button className="primary-btn" onClick={() => add(key)} disabled={loading || saving !== null || !values[key].trim()} style={{ whiteSpace: "nowrap", padding: "9px 11px" }}>
            {saving === key ? "..." : "＋ Tambah"}
          </button>
        </div>

        <div style={{ maxHeight: 390, overflowY: "auto", border: "1px solid #eef2f7", borderRadius: 10 }}>
          {loading ? (
            <div style={{ padding: 28, textAlign: "center", color: "#64748b", fontSize: 12 }}>Memuat...</div>
          ) : data[key].length === 0 ? (
            <div style={{ padding: 28, textAlign: "center", color: "#64748b", fontSize: 12 }}>Belum ada data.</div>
          ) : (
            <table style={{ width: "100%" }}>
              <thead>
                <tr><th style={{ width: 42 }}>#</th><th>{key === "mt" ? "Nama MT" : key === "rombel" ? "Rombel" : "Mapel"}</th><th style={{ width: 72, textAlign: "right" }}>Aksi</th></tr>
              </thead>
              <tbody>
                {data[key].map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td><span className="table-primary">{item.name}</span></td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="row-delete"
                        title={`Hapus ${item.name}`}
                        aria-label={`Hapus ${item.name}`}
                        onClick={() => remove(key, item)}
                        style={{
                          border: "1px solid #fecaca",
                          background: "#fff7f7",
                          color: "#dc2626",
                          borderRadius: 8,
                          padding: "6px 9px",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 700,
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    );
  }

  return (
    <main className="page-wrap">
      <section className="planning-hero">
        <div className="planning-hero-row">
          <div>
            <div className="eyebrow">MT COACH · MANAGEMENT</div>
            <h1>Data</h1>
            <p>Kelola List MT, List Rombel, dan List Mapel yang digunakan di seluruh modul.</p>
          </div>
          <span className="badge planning-status">⚙️ Master Data</span>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: "#14213d", fontSize: 20 }}>Kelola Master Data</h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>Tambah atau hapus item yang tersedia pada Weekly Planning.</p>
          </div>
          <button className="secondary-btn" onClick={load} disabled={loading}>↻ Refresh</button>
        </div>

        {message && (
          <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 10, background: message.startsWith("Gagal") ? "#fef2f2" : "#ecfdf5", color: message.startsWith("Gagal") ? "#b91c1c" : "#047857", fontSize: 13, fontWeight: 600 }}>
            {message}
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", alignItems: "start" }}>
          {renderList("mt")}
          {renderList("rombel")}
          {renderList("mapel")}
        </div>

        <div style={{ marginTop: 14, padding: "11px 13px", borderRadius: 10, background: "#f8fafc", color: "#64748b", fontSize: 11 }}>
          Sumber data awal: sheet Validasi — MT kolom A, Rombel kolom F, Mapel kolom H. Cabang tidak dikelola sebagai master karena MT dapat mengajar di semua cabang.
        </div>
      </section>
    </main>
  );
}