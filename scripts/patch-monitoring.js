const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// AuVi TV rule: when Planning marks a session as AuVi TV, only a successful TV connection completes the item.
// "Tidak connect ke TV" is explicitly incomplete.
s = s.replace(
  'return ["Tidak connect ke TV", "Connect ke TV", "✅ Connect AuVi TV"].includes(status);',
  'return ["Connect ke TV", "✅ Connect AuVi TV"].includes(status);'
);

const stateNeedle = '  const [waDate, setWaDate] = useState(() => new Date().toISOString().slice(0, 10));';
const stateAdd = `\n  const [editingRow, setEditingRow] = useState<MonitoringRow | null>(null);\n  const [editForm, setEditForm] = useState({ planning_date: "", branch_id: "", mt_id: "", rombel_id: "", mapel_id: "", jenis_sesi: "KBM", auvi_tv: false, ld: false });\n  const [deletingId, setDeletingId] = useState<string | null>(null);`;
if (!s.includes('const [editingRow, setEditingRow]')) {
  if (!s.includes(stateNeedle)) throw new Error('state marker not found');
  s = s.replace(stateNeedle, stateNeedle + stateAdd);
}

const fnNeedle = '  async function saveRow(row: MonitoringRow, patch: Partial<MonitoringRow>) {';
const fnAdd = `  function startEdit(row: MonitoringRow) {\n    setEditingRow(row);\n    setEditForm({ planning_date: row.planning_date, branch_id: row.branch_id, mt_id: row.mt_id || "", rombel_id: row.rombel_id || "", mapel_id: row.mapel_id || "", jenis_sesi: row.jenis_sesi, auvi_tv: row.auvi_tv, ld: row.ld });\n  }\n\n  async function saveSessionEdit() {\n    if (!editingRow) return;\n    setSaving(editingRow.id); setMessage("");\n    const { error } = await supabase.from("weekly_planning").update({\n      planning_date: editForm.planning_date, branch_id: editForm.branch_id, mt_id: editForm.mt_id || null,\n      rombel_id: editForm.rombel_id || null, mapel_id: editForm.mapel_id || null, jenis_sesi: editForm.jenis_sesi,\n      auvi_tv: editForm.auvi_tv, ld: editForm.ld, updated_at: new Date().toISOString(),\n    }).eq("id", editingRow.id).eq("status", "Finalized");\n    if (error) setMessage(\`Gagal memperbarui sesi: \${error.message}\`);\n    else {\n      setRows(prev => prev.map(x => x.id === editingRow.id ? { ...x, ...editForm, mt_id: editForm.mt_id || null, rombel_id: editForm.rombel_id || null, mapel_id: editForm.mapel_id || null } : x));\n      setEditingRow(null); setMessage("Sesi berhasil diperbarui.");\n    }\n    setSaving(null);\n  }\n\n  async function removeFromMonitoring(row: MonitoringRow) {\n    if (!window.confirm(\`Hapus sesi \${nameOf(mts, row.mt_id)} — \${nameOf(rombels, row.rombel_id)} dari Monitoring? Sesi akan dikembalikan ke Draft dan bisa dihapus permanen dari Weekly Planning.\`)) return;\n    setDeletingId(row.id); setMessage("");\n    const { error } = await supabase.from("weekly_planning").update({ status: "Draft", updated_at: new Date().toISOString() }).eq("id", row.id).eq("status", "Finalized");\n    if (error) setMessage(\`Gagal menghapus dari Monitoring: \${error.message}\`);\n    else { setRows(prev => prev.filter(x => x.id !== row.id)); setOpenId(null); setMessage("Sesi dihapus dari Monitoring dan dikembalikan ke Draft."); }\n    setDeletingId(null);\n  }\n\n`;
if (!s.includes('async function saveSessionEdit')) {
  if (!s.includes(fnNeedle)) throw new Error('saveRow marker not found');
  s = s.replace(fnNeedle, fnAdd + fnNeedle);
}

const bodyNeedle = '<div className="monitoring-card-body"><div className="monitoring-admin-title">KELENGKAPAN ADMINISTRASI';
const bodyReplace = '<div className="monitoring-card-body"><div className="monitoring-session-actions"><button type="button" className="secondary-btn" onClick={() => startEdit(row)}>✏️ Edit Sesi</button><button type="button" className="danger-btn" onClick={() => removeFromMonitoring(row)} disabled={deletingId === row.id}>{deletingId === row.id ? "⏳ Menghapus..." : "🗑️ Hapus"}</button></div><div className="monitoring-admin-title">KELENGKAPAN ADMINISTRASI';
const currentActionNeedle = '<div className="monitoring-card-body"><div className="monitoring-session-actions"><span className="badge blue">AuVi: {row.auvi_tv ? "Ya" : "Tidak"} · LD: {row.ld ? "Ya" : "Tidak"}</span></div><div className="monitoring-admin-title">KELENGKAPAN ADMINISTRASI';
if (!s.includes('monitoring-session-actions')) {
  if (!s.includes(bodyNeedle)) throw new Error('card body marker not found');
  s = s.replace(bodyNeedle, bodyReplace);
} else if (s.includes(currentActionNeedle)) {
  s = s.replace(currentActionNeedle, bodyReplace);
}

const beforeWaNeedle = '    {showWaReport && <div className="wa-modal-backdrop"';
const editModal = `    {editingRow && <div className="wa-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setEditingRow(null); }}><section className="wa-modal session-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-session-title"><div className="wa-modal-head"><div><div className="eyebrow">MONITORING · EDIT SESI</div><h2 id="edit-session-title">✏️ Edit Sesi</h2><p>Perubahan tetap berstatus Finalized dan langsung tersimpan ke shared database.</p></div><button type="button" className="wa-close" onClick={() => setEditingRow(null)} aria-label="Tutup">×</button></div><div className="session-edit-grid"><label className="control-box"><span className="control-label">Tanggal</span><input className="date-input" type="date" value={editForm.planning_date} onChange={e => setEditForm(v => ({ ...v, planning_date: e.target.value }))} /></label><label className="control-box"><span className="control-label">Cabang</span><select className="branch-select" value={editForm.branch_id} onChange={e => setEditForm(v => ({ ...v, branch_id: e.target.value }))}>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label className="control-box"><span className="control-label">MT</span><select className="branch-select" value={editForm.mt_id} onChange={e => setEditForm(v => ({ ...v, mt_id: e.target.value }))}>{mts.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label className="control-box"><span className="control-label">Kelas</span><select className="branch-select" value={editForm.rombel_id} onChange={e => setEditForm(v => ({ ...v, rombel_id: e.target.value }))}>{rombels.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label className="control-box"><span className="control-label">Mapel</span><select className="branch-select" value={editForm.mapel_id} onChange={e => setEditForm(v => ({ ...v, mapel_id: e.target.value }))}>{mapels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label className="control-box"><span className="control-label">Jenis Sesi</span><select className="branch-select" value={editForm.jenis_sesi} onChange={e => setEditForm(v => ({ ...v, jenis_sesi: e.target.value }))}><option>KBM</option><option>Klinik PR</option><option>Trial Class</option></select></label><label className="option-pill"><input type="checkbox" checked={editForm.auvi_tv} onChange={e => setEditForm(v => ({ ...v, auvi_tv: e.target.checked }))} /> 🎥 AuVi TV</label><label className="option-pill"><input type="checkbox" checked={editForm.ld} onChange={e => setEditForm(v => ({ ...v, ld: e.target.checked }))} /> 👥 LD</label></div><div className="wa-modal-actions"><button type="button" className="secondary-btn" onClick={() => setEditingRow(null)}>Batal</button><button type="button" className="primary-btn" onClick={saveSessionEdit} disabled={saving === editingRow.id}>{saving === editingRow.id ? "⏳ Menyimpan..." : "💾 Simpan Perubahan"}</button></div></section></div>}\n`;
if (!s.includes('session-edit-modal')) {
  if (!s.includes(beforeWaNeedle)) throw new Error('WA modal marker not found');
  s = s.replace(beforeWaNeedle, editModal + beforeWaNeedle);
}

const styleNeedle = '<style>{`';
const styleAdd = '.monitoring-session-actions{display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #eef2f7}.danger-btn{border:1px solid #fecaca;background:#fff1f2;color:#b91c1c;border-radius:10px;padding:9px 12px;font-weight:700;cursor:pointer}.danger-btn:disabled{opacity:.55;cursor:not-allowed}.session-edit-modal{width:min(760px,100%)}.session-edit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}.session-edit-grid .option-pill{align-self:end}@media(max-width:700px){.session-edit-grid{grid-template-columns:1fr}.monitoring-session-actions{justify-content:stretch}.monitoring-session-actions button{flex:1}}.wa-modal .wa-report-summary{display:grid!important;grid-template-columns:auto auto minmax(180px,220px);gap:10px;align-items:stretch;margin:18px 0 10px}.wa-modal .wa-report-summary>.badge{align-self:center;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;height:36px;min-height:36px;padding:0 12px;flex:0 0 auto}.wa-modal .wa-report-summary>.control-box{min-width:180px!important;margin:0;padding:11px 14px;min-height:64px;display:flex;flex-direction:column;justify-content:center}.wa-modal .wa-report-summary .date-input{min-width:0;width:100%}@media(max-width:700px){.wa-modal .wa-report-summary{grid-template-columns:1fr 1fr}.wa-modal .wa-report-summary>.control-box{grid-column:1/-1;width:100%}}';
if (!s.includes('monitoring-session-actions')) throw new Error('action marker not yet present');
s = s.replace(styleNeedle, styleNeedle + styleAdd);

fs.writeFileSync(file, s);
console.log('Patched monitoring page:', file);