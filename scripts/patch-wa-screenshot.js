const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// AuVi / LD rules: only the explicit incomplete status is incomplete.
s = s.replace(
  'const adminDone = (r: MonitoringRow) => isSimpleSession(r) ? (r.attendance ? 1 : 0) : ADMIN_KEYS.filter(k => Boolean(r[k])).length + (r.auvi_tv_status ? 1 : 0) + (r.ld_status ? 1 : 0);',
  'const adminDone = (r: MonitoringRow) => isSimpleSession(r) ? (r.attendance ? 1 : 0) : ADMIN_KEYS.filter(k => Boolean(r[k])).length + (r.auvi_tv_status && r.auvi_tv_status !== "Tidak connect ke TV" ? 1 : 0) + (r.ld_status && r.ld_status !== "Belum report ke CMS" ? 1 : 0);'
);
s = s.replace(
  '!row.auvi_tv_status && "AuVi TV", !row.ld_status && "LD",',
  '(row.auvi_tv_status === "Tidak connect ke TV" || !row.auvi_tv_status) && "AuVi TV", (row.ld_status === "Belum report ke CMS" || !row.ld_status) && "LD",'
);

const stateNeedle = '  const [waDate, setWaDate] = useState(() => new Date().toISOString().slice(0, 10));';
if (!s.includes('const [reportImage, setReportImage]')) {
  if (!s.includes(stateNeedle)) throw new Error("WA date state marker not found");
  s = s.replace(stateNeedle, stateNeedle + '\n  const [reportImage, setReportImage] = useState<string | null>(null);\n  const [generatingReportImage, setGeneratingReportImage] = useState(false);\n  const [reportImageError, setReportImageError] = useState<string | null>(null);');
}

// Replace the generator with a wider, cleaner report card layout.
const fnStart = s.indexOf('  async function generateReportImage() {');
const fnEnd = s.indexOf('\n  async function shareReportImage()', fnStart);
if (fnStart < 0 || fnEnd < 0) throw new Error("Screenshot generator markers not found");
const fn = [
  '  async function generateReportImage() {',
  '    if (!reportRows.length) { setReportImageError("Tidak ada sesi pada tanggal yang dipilih untuk dibuatkan screenshot."); return; }',
  '    setGeneratingReportImage(true); setReportImageError(null); setMessage("");',
  '    try {',
  '      const width = 1600;',
  '      const margin = 50;',
  '      const rowH = 88;',
  '      const headerH = 300;',
  '      const tableHeadH = 78;',
  '      const footerH = 128;',
  '      const height = headerH + tableHeadH + reportRows.length * rowH + footerH + 40;',
  '      const canvas = document.createElement("canvas");',
  '      canvas.width = width * 2; canvas.height = height * 2;',
  '      const ctx = canvas.getContext("2d");',
  '      if (!ctx) throw new Error("Browser tidak mendukung pembuatan gambar.");',
  '      ctx.scale(2, 2);',
  '      const roundRect = (x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };',
  '      const fillRound = (x: number, y: number, w: number, h: number, r: number, fill: string) => { ctx.fillStyle = fill; roundRect(x, y, w, h, r); ctx.fill(); };',
  '      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height);',
  '      fillRound(20, 20, width - 40, height - 40, 24, "#ffffff");',
  '      ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2; roundRect(20, 20, width - 40, height - 40, 24); ctx.stroke();',
  '      ctx.fillStyle = "#172033"; ctx.font = "800 42px Arial"; ctx.fillText("REPORT KELENGKAPAN ADMINISTRASI MT", margin, 78);',
  '      ctx.fillStyle = "#64748b"; ctx.font = "600 22px Arial"; ctx.fillText(formatDate(waDate), margin, 118);',
  '      ctx.fillText(branchId === "all" ? "Semua Cabang" : nameOf(branches, branchId), margin, 151);',
  '      ctx.fillStyle = "#16a34a"; ctx.font = "800 22px Arial"; ctx.fillText(reportCompleteCount + " lengkap", margin, 198);',
  '      ctx.fillStyle = "#94a3b8"; ctx.font = "700 22px Arial"; ctx.fillText("·", margin + 150, 198);',
  '      ctx.fillStyle = "#dc2626"; ctx.font = "800 22px Arial"; ctx.fillText(reportIncompleteCount + " belum lengkap", margin + 180, 198);',
  '      ctx.fillStyle = "#94a3b8"; ctx.font = "700 22px Arial"; ctx.fillText("·", margin + 405, 198);',
  '      ctx.fillStyle = "#475569"; ctx.font = "700 22px Arial"; ctx.fillText(reportRows.length + " sesi", margin + 435, 198);',
  '      ctx.fillStyle = "#f8fafc"; fillRound(margin, 224, width - margin * 2, 48, 12, "#f8fafc");',
  '      ctx.fillStyle = "#64748b"; ctx.font = "600 15px Arial"; ctx.fillText("Checklist administrasi sesi · tanda hijau = lengkap · tanda merah = belum lengkap", margin + 18, 255);',
  '      const cols: Array<[string, number]> = [["MT",260],["Rombel",150],["Mapel",150],["Topik",95],["Att",80],["Star",80],["Score",90],["Sess",80],["Foto",80],["WA",70],["AuVi",90],["LD",80],["Status",115]];',
  '      const tableW = cols.reduce((sum, c) => sum + c[1], 0);',
  '      const tableX = (width - tableW) / 2;',
  '      const tableY = headerH;',
  '      fillRound(tableX, tableY, tableW, tableHeadH + reportRows.length * rowH, 18, "#ffffff");',
  '      ctx.save(); roundRect(tableX, tableY, tableW, tableHeadH + reportRows.length * rowH, 18); ctx.clip();',
  '      ctx.fillStyle = "#f1f5f9"; ctx.fillRect(tableX, tableY, tableW, tableHeadH);',
  '      const colX: number[] = [tableX]; cols.forEach(c => colX.push(colX[colX.length - 1] + c[1]));',
  '      ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1;',
  '      for (let i = 1; i < colX.length - 1; i++) { ctx.beginPath(); ctx.moveTo(colX[i], tableY); ctx.lineTo(colX[i], tableY + tableHeadH + reportRows.length * rowH); ctx.stroke(); }',
  '      cols.forEach((c, i) => { ctx.fillStyle = "#334155"; ctx.font = "800 15px Arial"; ctx.textAlign = "left"; ctx.fillText(c[0], colX[i] + 18, tableY + 47); });',
  '      const mark = (ok: boolean, cx: number, cy: number) => { ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fillStyle = ok ? "#eaf8ef" : "#fff0f0"; ctx.fill(); ctx.fillStyle = ok ? "#16a34a" : "#dc2626"; ctx.font = "900 25px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ok ? "✓" : "×", cx, cy + 1); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; };',
  '      const trunc = (v: string, max: number) => v.length > max ? v.slice(0, max - 1) + "…" : v;',
  '      reportRows.forEach((row, index) => {',
  '        const y = tableY + tableHeadH + index * rowH;',
  '        if (index % 2 === 1) { ctx.fillStyle = "#fbfdff"; ctx.fillRect(tableX, y, tableW, rowH); }',
  '        ctx.strokeStyle = "#e2e8f0"; ctx.beginPath(); ctx.moveTo(tableX, y + rowH); ctx.lineTo(tableX + tableW, y + rowH); ctx.stroke();',
  '        const values = [nameOf(mts, row.mt_id), nameOf(rombels, row.rombel_id), nameOf(mapels, row.mapel_id)];',
  '        ctx.fillStyle = "#172033"; ctx.font = "700 16px Arial";',
  '        values.forEach((v, i) => ctx.fillText(trunc(v, i === 0 ? 27 : 18), colX[i] + 18, y + 54));',
  '        const checks = [row.topik_sub_topik_done, row.attendance, row.starchamps, row.activity_score, row.report_sessions, row.foto_kbm, row.report_wa, Boolean(row.auvi_tv_status && row.auvi_tv_status !== "Tidak connect ke TV"), Boolean(row.ld_status && row.ld_status !== "Belum report ke CMS")];',
  '        checks.forEach((ok, i) => { const center = colX[3 + i] + cols[3 + i][1] / 2; mark(Boolean(ok), center, y + rowH / 2); });',
  '        const complete = adminDone(row) === adminTotal(row);',
  '        const statusText = complete ? "LENGKAP" : (adminDone(row) + "/" + adminTotal(row));',
  '        fillRound(colX[12] + 14, y + 24, cols[12][1] - 28, 40, 20, complete ? "#eaf8ef" : "#fff0f0");',
  '        ctx.fillStyle = complete ? "#15803d" : "#b91c1c"; ctx.font = "800 15px Arial"; ctx.textAlign = "center"; ctx.fillText(statusText, colX[12] + cols[12][1] / 2, y + 50); ctx.textAlign = "left";',
  '      });',
  '      ctx.restore();',
  '      const footerY = tableY + tableHeadH + reportRows.length * rowH + 24;',
  '      fillRound(tableX, footerY, tableW, footerH - 24, 18, "#f8fafc");',
  '      ctx.fillStyle = "#16a34a"; ctx.beginPath(); ctx.arc(tableX + 40, footerY + 38, 16, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ffffff"; ctx.font = "900 18px Arial"; ctx.textAlign = "center"; ctx.fillText("✓", tableX + 40, footerY + 44);',
  '      ctx.fillStyle = "#475569"; ctx.font = "700 18px Arial"; ctx.textAlign = "left"; ctx.fillText("Lengkap", tableX + 66, footerY + 45);',
  '      ctx.fillStyle = "#dc2626"; ctx.beginPath(); ctx.arc(tableX + 210, footerY + 38, 16, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ffffff"; ctx.font = "900 18px Arial"; ctx.textAlign = "center"; ctx.fillText("×", tableX + 210, footerY + 44);',
  '      ctx.fillStyle = "#475569"; ctx.font = "700 18px Arial"; ctx.textAlign = "left"; ctx.fillText("Belum lengkap", tableX + 236, footerY + 45);',
  '      ctx.fillStyle = "#cbd5e1"; ctx.fillRect(tableX + 700, footerY + 18, 2, 52);',
  '      ctx.fillStyle = "#64748b"; ctx.font = "600 15px Arial"; ctx.fillText("Generated dari Monitoring", tableX + 730, footerY + 37);',
  '      ctx.fillText("Dashboard Administrasi MT Regional Sumbar", tableX + 730, footerY + 61);',
  '      setReportImage(canvas.toDataURL("image/png")); setShowWaReport(false);',
  '    } catch (e) {',
  '      setReportImageError("Gagal membuat screenshot: " + (e instanceof Error ? e.message : "Unknown error"));',
  '    } finally { setGeneratingReportImage(false); }',
  '  }'
].join("\n");
s = s.slice(0, fnStart) + fn + s.slice(fnEnd);

// Keep screenshot button explicit.
s = s.replace('onClick={generateReportImage} disabled={generatingReportImage}', 'onClick={() => { void generateReportImage(); }} disabled={generatingReportImage}');
if (!s.includes('🖼️ Buat Screenshot')) {
  const actionsNeedle = '<div className="wa-modal-actions"><button type="button" className="secondary-btn" onClick={copyWaReport}>';
  const actionsReplacement = '<div className="wa-modal-actions"><button type="button" className="secondary-btn" onClick={() => { void generateReportImage(); }} disabled={generatingReportImage}>{generatingReportImage ? "⏳ Membuat gambar..." : "🖼️ Buat Screenshot"}</button><button type="button" className="secondary-btn" onClick={copyWaReport}>';
  if (!s.includes(actionsNeedle)) throw new Error("WA modal actions marker not found");
  s = s.replace(actionsNeedle, actionsReplacement);
}

// Keep the existing preview modal; add it if needed.
if (!s.includes('report-image-modal')) {
  const modalEnd = '    {showWaReport && <div className="wa-modal-backdrop"';
  const imageModal = '    {reportImage && <div className="wa-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setReportImage(null); }}><section className="wa-modal report-image-modal" role="dialog" aria-modal="true" aria-labelledby="report-image-title"><div className="wa-modal-head"><div><div className="eyebrow">MONITORING · VISUAL REPORT</div><h2 id="report-image-title">🖼️ Screenshot Report</h2><p>Checklist lengkap dan belum lengkap siap dikirim ke WhatsApp.</p></div><button type="button" className="wa-close" onClick={() => setReportImage(null)} aria-label="Tutup">×</button></div><div className="report-image-wrap"><img src={reportImage} alt="Report kelengkapan administrasi MT" /></div><div className="wa-modal-actions"><button type="button" className="secondary-btn" onClick={downloadReportImage}>💾 Simpan Gambar</button><button type="button" className="primary-btn" onClick={shareReportImage}>📤 Bagikan</button></div></section></div>}\n';
  if (!s.includes(modalEnd)) throw new Error("WA modal marker not found");
  s = s.replace(modalEnd, imageModal + modalEnd);
}

const styleNeedle = '<style>{`';
const styleAdd = '.report-image-error{margin-top:10px;padding:10px 12px;border:1px solid #fecaca;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:12px}.report-image-error:empty{display:none}.report-image-modal{width:min(1680px,100%);position:relative;z-index:1101}.report-image-wrap{margin-top:16px;padding:12px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;overflow:auto;text-align:center}.report-image-wrap img{display:block;width:100%;height:auto;max-height:76vh;object-fit:contain;margin:auto;border-radius:10px}.report-image-modal .wa-modal-actions{justify-content:flex-end}@media(max-width:700px){.report-image-modal{padding:14px}.report-image-wrap img{max-height:64vh}}';
if (!s.includes('report-image-css-marker')) {
  if (!s.includes(styleNeedle)) throw new Error("Monitoring style marker not found");
  s = s.replace(styleNeedle, styleNeedle + styleAdd);
  s = s.replace('`}</style>', '/* report-image-css-marker */`}</style>');
}

if (!s.includes('report-image-error')) {
  const actionsNeedle = '<div className="wa-modal-actions"><button type="button" className="secondary-btn" onClick={copyWaReport}>';
  const replacement = '<div className="report-image-error" role="alert">{reportImageError}</div><div className="wa-modal-actions"><button type="button" className="secondary-btn" onClick={copyWaReport}>';
  if (!s.includes(actionsNeedle)) throw new Error("WA modal actions marker not found");
  s = s.replace(actionsNeedle, replacement);
}

fs.writeFileSync(file, s);
console.log("Patched WhatsApp screenshot report UI:", file);
