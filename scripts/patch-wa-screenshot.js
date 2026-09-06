const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

const stateNeedle = '  const [waDate, setWaDate] = useState(() => new Date().toISOString().slice(0, 10));';
const stateAdd = '\n  const [reportImage, setReportImage] = useState<string | null>(null);\n  const [generatingReportImage, setGeneratingReportImage] = useState(false);';
if (!s.includes('const [reportImage, setReportImage]')) {
  if (!s.includes(stateNeedle)) throw new Error('WA date state marker not found');
  s = s.replace(stateNeedle, stateNeedle + stateAdd);
}

const fnNeedle = '  async function copyWaReport() {';
const fnAdd = `  async function generateReportImage() {
    if (!reportRows.length) { setMessage("Tidak ada sesi pada tanggal yang dipilih untuk dibuatkan screenshot."); return; }
    setGeneratingReportImage(true); setMessage("");
    try {
      const width = 1080;
      const rowH = 76;
      const headerH = 210;
      const tableHeadH = 72;
      const footerH = 92;
      const height = headerH + tableHeadH + reportRows.length * rowH + footerH;
      const canvas = document.createElement("canvas");
      canvas.width = width * 2; canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Browser tidak mendukung pembuatan gambar.");
      ctx.scale(2, 2);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#172033"; ctx.font = "800 30px Arial"; ctx.fillText("REPORT KELENGKAPAN ADMINISTRASI MT", 42, 52);
      ctx.fillStyle = "#64748b"; ctx.font = "600 18px Arial"; ctx.fillText(formatDate(waDate), 42, 82);
      ctx.fillText(branchId === "all" ? "Semua Cabang" : nameOf(branches, branchId), 42, 110);
      ctx.fillText(reportCompleteCount + " lengkap · " + reportIncompleteCount + " belum lengkap · " + reportRows.length + " sesi", 42, 138);
      ctx.fillStyle = "#eff6ff"; ctx.fillRect(42, 158, width - 84, 30);
      ctx.fillStyle = "#2563eb"; ctx.font = "700 13px Arial"; ctx.fillText("Checklist: Topik · Att · Star · Score · Sess · Foto · WA · AuVi · LD", 54, 178);

      const cols = [
        ["MT", 170], ["Rombel", 105], ["Mapel", 105], ["Topik", 70], ["Att", 60], ["Star", 60], ["Score", 70], ["Sess", 65], ["Foto", 65], ["WA", 55], ["AuVi", 70], ["LD", 55], ["Status", 100]
      ];
      let x = 42; const tableY = headerH;
      ctx.fillStyle = "#f1f5f9"; ctx.fillRect(42, tableY, width - 84, tableHeadH);
      ctx.strokeStyle = "#dbe3ec"; ctx.lineWidth = 1;
      const colX = [x]; cols.forEach(c => { x += c[1]; colX.push(x); });
      cols.forEach((c, i) => { ctx.fillStyle = "#334155"; ctx.font = "800 13px Arial"; ctx.fillText(c[0], colX[i] + 8, tableY + 42); });
      ctx.beginPath(); colX.forEach(cx => { ctx.moveTo(cx, tableY); ctx.lineTo(cx, height - footerH); }); ctx.stroke();

      const mark = (ok: boolean, cx: number, cy: number) => { ctx.fillStyle = ok ? "#15803d" : "#dc2626"; ctx.font = "800 22px Arial"; ctx.textAlign = "center"; ctx.fillText(ok ? "✓" : "×", cx, cy); ctx.textAlign = "left"; };
      const trunc = (v: string, max: number) => v.length > max ? v.slice(0, max - 1) + "…" : v;
      reportRows.forEach((row, index) => {
        const y = tableY + tableHeadH + index * rowH;
        if (index % 2 === 1) { ctx.fillStyle = "#fafcff"; ctx.fillRect(42, y, width - 84, rowH); }
        ctx.strokeStyle = "#e5e7eb"; ctx.beginPath(); ctx.moveTo(42, y + rowH); ctx.lineTo(width - 42, y + rowH); ctx.stroke();
        const values = [nameOf(mts, row.mt_id), nameOf(rombels, row.rombel_id), nameOf(mapels, row.mapel_id)];
        ctx.fillStyle = "#172033"; ctx.font = "700 13px Arial";
        values.forEach((v, i) => ctx.fillText(trunc(v, i === 0 ? 22 : 14), colX[i] + 8, y + 31));
        const checks = [row.topik_sub_topik_done, row.attendance, row.starchamps, row.activity_score, row.report_sessions, row.foto_kbm, row.report_wa, Boolean(row.auvi_tv_status), Boolean(row.ld_status)];
        checks.forEach((ok, i) => { const center = colX[3 + i] + cols[3 + i][1] / 2; mark(Boolean(ok), center, y + 34); });
        const complete = adminDone(row) === adminTotal(row);
        ctx.fillStyle = complete ? "#166534" : "#b91c1c"; ctx.font = "800 12px Arial"; ctx.fillText(complete ? "LENGKAP" : (adminDone(row) + "/" + adminTotal(row)), colX[12] + 8, y + 31);
      });
      ctx.fillStyle = "#f8fafc"; ctx.fillRect(42, height - footerH, width - 84, footerH);
      ctx.fillStyle = "#475569"; ctx.font = "600 13px Arial"; ctx.fillText("✓ Lengkap    × Belum lengkap", 54, height - 56);
      ctx.fillText("Generated dari Monitoring · Dashboard Administrasi MT Regional Sumbar", 54, height - 30);
      setReportImage(canvas.toDataURL("image/png"));
    } catch (e) {
      setMessage("Gagal membuat screenshot: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally { setGeneratingReportImage(false); }
  }

  async function shareReportImage() {
    if (!reportImage) return;
    try {
      const blob = await (await fetch(reportImage)).blob();
      const file = new File([blob], "report-admin-" + waDate + ".png", { type: "image/png" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: "Report Administrasi MT", files: [file] });
      else { const a = document.createElement("a"); a.href = reportImage; a.download = file.name; a.click(); }
    } catch (e) { if ((e as Error)?.name !== "AbortError") setMessage("Gambar sudah siap. Silakan gunakan tombol Simpan Gambar."); }
  }

  function downloadReportImage() {
    if (!reportImage) return;
    const a = document.createElement("a"); a.href = reportImage; a.download = "report-admin-" + waDate + ".png"; a.click();
  }

`;
if (!s.includes('async function generateReportImage')) {
  if (!s.includes(fnNeedle)) throw new Error('copy WA function marker not found');
  s = s.replace(fnNeedle, fnAdd + fnNeedle);
}

const buttonNeedle = '<button type="button" className="primary-btn" onClick={copyWaReport}';
const buttonAdd = '<button type="button" className="secondary-btn" onClick={generateReportImage} disabled={generatingReportImage}>{generatingReportImage ? "⏳ Membuat gambar..." : "🖼️ Buat Screenshot"}</button>';
if (!s.includes('onClick={generateReportImage}')) {
  if (!s.includes(buttonNeedle)) throw new Error('copy WA button marker not found');
  s = s.replace(buttonNeedle, buttonAdd + buttonNeedle);
}

const modalNeedle = '    {showWaReport && <div className="wa-modal-backdrop"';
const imageModal = `    {reportImage && <div className="wa-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setReportImage(null); }}><section className="wa-modal report-image-modal" role="dialog" aria-modal="true" aria-labelledby="report-image-title"><div className="wa-modal-head"><div><div className="eyebrow">MONITORING · VISUAL REPORT</div><h2 id="report-image-title">🖼️ Screenshot Report</h2><p>Checklist lengkap dan belum lengkap siap dikirim ke WhatsApp.</p></div><button type="button" className="wa-close" onClick={() => setReportImage(null)} aria-label="Tutup">×</button></div><div className="report-image-wrap"><img src={reportImage} alt="Report kelengkapan administrasi MT" /></div><div className="wa-modal-actions"><button type="button" className="secondary-btn" onClick={downloadReportImage}>💾 Simpan Gambar</button><button type="button" className="primary-btn" onClick={shareReportImage}>📤 Bagikan</button></div></section></div>}\n`;
if (!s.includes('report-image-modal')) {
  if (!s.includes(modalNeedle)) throw new Error('WA modal marker not found');
  s = s.replace(modalNeedle, imageModal + modalNeedle);
}

const styleNeedle = '<style>{`';
const styleAdd = '.report-image-modal{width:min(1120px,100%)}.report-image-wrap{margin-top:16px;padding:10px;border:1px solid #e5e7eb;border-radius:14px;background:#f8fafc;overflow:auto;text-align:center}.report-image-wrap img{display:block;width:100%;height:auto;max-height:68vh;object-fit:contain;margin:auto;border-radius:8px}.report-image-modal .wa-modal-actions{justify-content:flex-end}@media(max-width:700px){.report-image-modal{padding:14px}.report-image-wrap img{max-height:62vh}}';
if (!s.includes('report-image-modal')) throw new Error('image modal marker not inserted');
s = s.replace(styleNeedle, styleNeedle + styleAdd);

fs.writeFileSync(file, s);
console.log('Patched WhatsApp screenshot report:', file);
