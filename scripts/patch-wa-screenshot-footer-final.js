const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

const startMarker = "      const footerY = tableY + totalTableH + 22;";
const endMarker = "      // Decorative bottom wave.";
const start = s.indexOf(startMarker);
const end = s.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("Screenshot footer markers not found");

const footer = `      const footerY = tableY + totalTableH + 22;
      fillRound(tableX, footerY, tableW, footerH, 18, "#f7fafc");

      const legendTop = footerY + 32;
      const legendCols = [
        { x: tableX + 28, title: "Lengkap", desc: "Semua dokumen/sesi terpenuhi", state: "ok" as const },
        { x: tableX + 430, title: "Belum lengkap", desc: "Masih ada administrasi yang belum terpenuhi", state: "no" as const },
        { x: tableX + 880, title: "Tidak berlaku", desc: "Tidak wajib untuk sesi Klinik PR", state: "na" as const },
      ];
      legendCols.forEach(item => {
        drawCheck(item.x, legendTop, item.state);
        ctx.fillStyle = "#17355f"; ctx.font = "800 15px Arial";
        ctx.fillText(item.title, item.x + 32, legendTop - 3);
        ctx.fillStyle = "#64748b"; ctx.font = "600 11px Arial";
        ctx.fillText(item.desc, item.x + 32, legendTop + 16);
      });

      ctx.strokeStyle = "#dbe4ee"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tableX + 20, footerY + 78); ctx.lineTo(tableX + tableW - 20, footerY + 78); ctx.stroke();
      ctx.fillStyle = "#1677a8"; ctx.font = "800 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText("BRAIN ACADEMY CENTER  •  BY RUANGGURU", tableX + tableW / 2, footerY + 101);
      ctx.fillStyle = "#64748b"; ctx.font = "600 10px Arial";
      ctx.fillText("Dashboard Administrasi MT Regional Sumbar", tableX + tableW / 2, footerY + 116);
      ctx.textAlign = "left";
`;

s = s.slice(0, start) + footer + s.slice(end);
fs.writeFileSync(file, s);
console.log("Final screenshot footer cleaned and separated");
