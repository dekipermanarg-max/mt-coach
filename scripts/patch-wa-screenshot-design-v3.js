const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

const start = s.indexOf("  async function generateReportImage() {");
const end = s.indexOf("  async function copyWaReport()", start);
if (start < 0 || end < 0) throw new Error("Screenshot generator markers not found");

const block = `  async function generateReportImage() {
    if (!reportRows.length) { setReportImageError("Tidak ada sesi pada tanggal yang dipilih untuk dibuatkan screenshot."); return; }
    setGeneratingReportImage(true); setReportImageError(null); setMessage("");
    try {
      const width = 1600;
      const margin = 44;
      const rowH = 92;
      const headerH = 285;
      const tableHeadH = 82;
      const footerH = 128;
      const height = headerH + tableHeadH + reportRows.length * rowH + footerH + 54;
      const canvas = document.createElement("canvas");
      canvas.width = width * 2; canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Browser tidak mendukung pembuatan gambar.");
      ctx.scale(2, 2);

      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.lineTo(x + w - rr, y);
        ctx.arcTo(x + w, y, x + w, y + rr, rr); ctx.lineTo(x + w, y + h - rr);
        ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr); ctx.lineTo(x + rr, y + h);
        ctx.arcTo(x, y + h, x, y + h - rr, rr); ctx.lineTo(x, y + rr);
        ctx.arcTo(x, y, x + rr, y, rr); ctx.closePath();
      };
      const fillRound = (x: number, y: number, w: number, h: number, r: number, fill: string) => { ctx.fillStyle = fill; roundRect(x, y, w, h, r); ctx.fill(); };
      const wrapText = (text: string, maxWidth: number, maxLines = 2) => {
        const words = String(text || "—").split(/\\s+/); const lines: string[] = []; let line = "";
        words.forEach(word => {
          const next = line ? line + " " + word : word;
          if (ctx.measureText(next).width <= maxWidth) line = next;
          else { if (line) lines.push(line); line = word; }
        });
        if (line) lines.push(line);
        if (lines.length > maxLines) { const last = lines[maxLines - 1]; lines.length = maxLines; lines[maxLines - 1] = last.length > 1 ? last.slice(0, Math.max(1, last.length - 1)) + "…" : last + "…"; }
        return lines;
      };
      const drawCheck = (cx: number, cy: number, state: "ok" | "no" | "na") => {
        if (state === "na") { ctx.fillStyle = "#94a3b8"; ctx.font = "800 24px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("—", cx, cy); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; return; }
        ctx.beginPath(); ctx.arc(cx, cy, 21, 0, Math.PI * 2); ctx.fillStyle = state === "ok" ? "#e4f8ed" : "#fee7e7"; ctx.fill();
        ctx.fillStyle = state === "ok" ? "#16a34a" : "#dc2626"; ctx.font = "900 25px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(state === "ok" ? "✓" : "×", cx, cy + 1); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      };
      const drawStat = (x: number, y: number, w: number, h: number, bg: string, icon: string, value: string, label: string) => {
        fillRound(x, y, w, h, 16, bg); ctx.fillStyle = bg === "#effaf4" ? "#16a34a" : bg === "#fff0f0" ? "#dc2626" : "#1677a8";
        ctx.beginPath(); ctx.arc(x + 32, y + h / 2, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "900 18px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(icon, x + 32, y + h / 2 + 1); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#172033"; ctx.font = "800 20px Arial"; ctx.fillText(value, x + 62, y + 30);
        ctx.fillStyle = "#64748b"; ctx.font = "600 13px Arial"; ctx.fillText(label, x + 62, y + 51);
      };

      // Canvas background and main card.
      const bg = ctx.createLinearGradient(0, 0, width, height); bg.addColorStop(0, "#f8fbff"); bg.addColorStop(1, "#ffffff"); ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
      fillRound(18, 18, width - 36, height - 36, 24, "#ffffff");
      ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1.5; roundRect(18, 18, width - 36, height - 36, 24); ctx.stroke();

      // BAC brand block.
      const brandX = margin, brandY = 46;
      ctx.save(); ctx.translate(brandX + 30, brandY + 24); ctx.rotate(Math.PI / 6);
      ctx.fillStyle = "#f6b500"; ctx.beginPath(); ctx.moveTo(0,-25); ctx.lineTo(22,-12); ctx.lineTo(22,12); ctx.lineTo(0,25); ctx.lineTo(-22,12); ctx.lineTo(-22,-12); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = "#1597aa"; ctx.font = "800 13px Arial"; ctx.fillText("BRAIN", brandX + 64, brandY + 13); ctx.fillText("ACADEMY", brandX + 64, brandY + 29); ctx.fillText("CENTER", brandX + 64, brandY + 45);
      ctx.fillStyle = "#64748b"; ctx.font = "600 10px Arial"; ctx.fillText("By Ruangguru", brandX + 64, brandY + 61);
      ctx.strokeStyle = "#dbe4ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(brandX + 178, brandY - 4); ctx.lineTo(brandX + 178, brandY + 68); ctx.stroke();

      ctx.fillStyle = "#132d57"; ctx.font = "900 38px Arial"; ctx.fillText("REPORT KELENGKAPAN", brandX + 202, brandY + 28); ctx.fillText("ADMINISTRASI MT", brandX + 202, brandY + 69);
      ctx.fillStyle = "#64748b"; ctx.font = "700 17px Arial"; ctx.fillText(formatDate(waDate), brandX + 204, brandY + 98);
      ctx.fillStyle = "#1677a8"; ctx.font = "700 17px Arial"; ctx.fillText("•", brandX + 320, brandY + 98);
      ctx.fillStyle = "#64748b"; ctx.fillText(branchId === "all" ? "Semua Cabang" : nameOf(branches, branchId), brandX + 342, brandY + 98);

      // Right-side accent.
      fillRound(width - 430, 42, 350, 106, 20, "#f1f7fd");
      ctx.fillStyle = "#132d57"; ctx.font = "800 17px Arial"; ctx.fillText("Checklist administrasi sesi", width - 395, 76);
      ctx.fillStyle = "#64748b"; ctx.font = "600 13px Arial"; ctx.fillText("✓ lengkap   ·   × belum lengkap   ·   — tidak berlaku", width - 395, 101);
      ctx.fillStyle = "#1677a8"; ctx.font = "800 13px Arial"; ctx.fillText("Dashboard Administrasi MT Regional Sumbar", width - 395, 124);

      // Summary cards.
      const statY = 165, statW = 250, statH = 72, gap = 14;
      drawStat(margin, statY, statW, statH, "#effaf4", "✓", String(reportCompleteCount), "sesi lengkap");
      drawStat(margin + statW + gap, statY, statW, statH, "#fff0f0", "×", String(reportIncompleteCount), "belum lengkap");
      drawStat(margin + (statW + gap) * 2, statY, statW, statH, "#eef7fc", "•", String(reportRows.length), "total sesi");
      fillRound(margin + (statW + gap) * 3, statY, 488, statH, 16, "#f8fafc");
      ctx.fillStyle = "#475569"; ctx.font = "700 14px Arial"; ctx.fillText("Kelengkapan administrasi", margin + (statW + gap) * 3 + 20, statY + 28);
      const totalChecks = reportRows.reduce((sum, r) => sum + adminTotal(r), 0); const doneChecks = reportRows.reduce((sum, r) => sum + adminDone(r), 0); const pct = totalChecks ? Math.round(doneChecks / totalChecks * 100) : 0;
      ctx.fillStyle = "#132d57"; ctx.font = "900 24px Arial"; ctx.fillText(pct + "%", margin + (statW + gap) * 3 + 20, statY + 54);
      ctx.fillStyle = "#dbe4ee"; ctx.fillRect(margin + (statW + gap) * 3 + 86, statY + 47, 360, 8); ctx.fillStyle = "#20b486"; ctx.fillRect(margin + (statW + gap) * 3 + 86, statY + 47, 360 * pct / 100, 8);

      const cols: Array<[string, number]> = [["MT",170],["Rombel",125],["Mapel",135],["Topik / Subtopik",190],["Attendance",95],["Starchamps",95],["Activity Score",105],["Report Sessions",110],["Foto KBM",90],["Report WA",90],["AuVi TV",90],["LD",65]];
      const tableW = cols.reduce((sum, c) => sum + c[1], 0); const tableX = (width - tableW) / 2; const tableY = headerH;
      const totalTableH = tableHeadH + reportRows.length * rowH;
      fillRound(tableX, tableY, tableW, totalTableH, 18, "#ffffff");
      ctx.save(); roundRect(tableX, tableY, tableW, totalTableH, 18); ctx.clip();
      const headGrad = ctx.createLinearGradient(0, tableY, 0, tableY + tableHeadH); headGrad.addColorStop(0, "#edf5fc"); headGrad.addColorStop(1, "#f7fafc"); ctx.fillStyle = headGrad; ctx.fillRect(tableX, tableY, tableW, tableHeadH);
      const colX: number[] = [tableX]; cols.forEach(c => colX.push(colX[colX.length - 1] + c[1]));
      ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1;
      for (let i = 1; i < colX.length - 1; i++) { ctx.beginPath(); ctx.moveTo(colX[i], tableY); ctx.lineTo(colX[i], tableY + totalTableH); ctx.stroke(); }
      cols.forEach((c, i) => {
        ctx.fillStyle = "#17355f"; ctx.font = "800 13px Arial"; ctx.textAlign = i >= 4 ? "center" : "left";
        const lines = wrapText(c[0], c[1] - 18, 3); const baseY = tableY + (lines.length === 1 ? 45 : 35);
        lines.forEach((line, j) => ctx.fillText(line, i >= 4 ? colX[i] + c[1] / 2 : colX[i] + 12, baseY + j * 17));
      });

      reportRows.forEach((row, index) => {
        const y = tableY + tableHeadH + index * rowH;
        if (index % 2 === 1) { ctx.fillStyle = "#fbfdff"; ctx.fillRect(tableX, y, tableW, rowH); }
        ctx.strokeStyle = "#e8eef5"; ctx.beginPath(); ctx.moveTo(tableX, y + rowH); ctx.lineTo(tableX + tableW, y + rowH); ctx.stroke();
        ctx.fillStyle = "#172033"; ctx.font = "700 14px Arial"; ctx.textAlign = "left";
        const values = [nameOf(mts, row.mt_id), nameOf(rombels, row.rombel_id), nameOf(mapels, row.mapel_id), row.topik_sub_topik || "—"];
        values.forEach((v, i) => { const lines = wrapText(v, cols[i][1] - 22, 2); const startY = y + (lines.length === 1 ? 52 : 40); lines.forEach((line, j) => ctx.fillText(line, colX[i] + 12, startY + j * 18)); });
        const simple = isSimpleSession(row);
        const states: ("ok" | "no" | "na")[] = simple
          ? ["na", row.attendance ? "ok" : "no", "na", "na", "na", "na", "na", "na", "na"]
          : [row.topik_sub_topik_done ? "ok" : "no", row.attendance ? "ok" : "no", row.starchamps ? "ok" : "no", row.activity_score ? "ok" : "no", row.report_sessions ? "ok" : "no", row.foto_kbm ? "ok" : "no", row.report_wa ? "ok" : "no", (row.auvi_tv_status && row.auvi_tv_status !== "Tidak connect ke TV") ? "ok" : "no", (row.ld_status && row.ld_status !== "Belum report ke CMS") ? "ok" : "no"];
        states.forEach((state, i) => drawCheck(colX[4 + i] + cols[4 + i][1] / 2, y + rowH / 2, state));
      });
      ctx.restore();

      const footerY = tableY + totalTableH + 22;
      fillRound(tableX, footerY, tableW, footerH, 18, "#f7fafc");
      drawCheck(tableX + 28, footerY + 34, "ok"); ctx.fillStyle = "#334155"; ctx.font = "700 15px Arial"; ctx.fillText("Lengkap", tableX + 55, footerY + 39);
      drawCheck(tableX + 170, footerY + 34, "no"); ctx.fillText("Belum lengkap", tableX + 197, footerY + 39);
      drawCheck(tableX + 335, footerY + 34, "na"); ctx.fillText("Tidak berlaku (Klinik PR)", tableX + 360, footerY + 39);
      ctx.strokeStyle = "#dbe4ee"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tableX + 620, footerY + 14); ctx.lineTo(tableX + 620, footerY + 72); ctx.stroke();
      ctx.fillStyle = "#64748b"; ctx.font = "600 12px Arial"; ctx.fillText("Generated dari Monitoring", tableX + 650, footerY + 31); ctx.fillText("Dashboard Administrasi MT Regional Sumbar", tableX + 650, footerY + 51);
      ctx.fillStyle = "#1597aa"; ctx.font = "800 12px Arial"; ctx.fillText("BRAIN ACADEMY CENTER  •  BY RUANGGURU", tableX + 650, footerY + 72);

      // Subtle BAC wave accent.
      ctx.fillStyle = "#dff5f3"; ctx.beginPath(); ctx.moveTo(18, height - 18); ctx.bezierCurveTo(360, height - 76, 640, height - 2, 940, height - 36); ctx.bezierCurveTo(1210, height - 66, 1390, height - 8, width - 18, height - 42); ctx.lineTo(width - 18, height - 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#f8e6a9"; ctx.beginPath(); ctx.moveTo(880, height - 18); ctx.bezierCurveTo(1120, height - 54, 1320, height - 10, width - 18, height - 48); ctx.lineTo(width - 18, height - 18); ctx.closePath(); ctx.fill();

      setReportImage(canvas.toDataURL("image/png")); setShowWaReport(false);
    } catch (e) {
      setReportImageError("Gagal membuat screenshot: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally { setGeneratingReportImage(false); }
  }

`;

s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(file, s);
console.log("Applied BAC-branded WhatsApp report screenshot v3");
