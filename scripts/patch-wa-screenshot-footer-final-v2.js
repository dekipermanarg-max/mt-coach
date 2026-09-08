const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

const fnStart = s.indexOf("  async function generateReportImage() {");
const fnEnd = s.indexOf("  async function copyWaReport()", fnStart);
if (fnStart < 0 || fnEnd < 0) throw new Error("Screenshot generator markers not found");

const fn = s.slice(fnStart, fnEnd);
const footer = `\n      const footerY = tableY + totalTableH + 22;\n      fillRound(tableX, footerY, tableW, footerH, 18, "#f7fafc");\n\n      const legendTop = footerY + 30;\n      const legendCols = [\n        { x: tableX + 28, title: "Lengkap", desc: "Semua dokumen/sesi terpenuhi", state: "ok" as const },\n        { x: tableX + 430, title: "Belum lengkap", desc: "Masih ada administrasi yang belum terpenuhi", state: "no" as const },\n        { x: tableX + 880, title: "Tidak berlaku", desc: "Tidak wajib untuk sesi Klinik PR", state: "na" as const },\n      ];\n      legendCols.forEach(item => {\n        drawCheck(item.x, legendTop, item.state);\n        ctx.fillStyle = "#17355f"; ctx.font = "800 15px Arial";\n        ctx.fillText(item.title, item.x + 32, legendTop - 3);\n        ctx.fillStyle = "#64748b"; ctx.font = "600 11px Arial";\n        ctx.fillText(item.desc, item.x + 32, legendTop + 16);\n      });\n\n      ctx.strokeStyle = "#dbe4ee"; ctx.lineWidth = 1;\n      ctx.beginPath(); ctx.moveTo(tableX + 20, footerY + 76); ctx.lineTo(tableX + tableW - 20, footerY + 76); ctx.stroke();\n      ctx.fillStyle = "#1677a8"; ctx.font = "800 11px Arial";\n      ctx.textAlign = "center";\n      ctx.fillText("BRAIN ACADEMY CENTER  •  BY RUANGGURU", tableX + tableW / 2, footerY + 98);\n      ctx.fillStyle = "#64748b"; ctx.font = "600 10px Arial";\n      ctx.fillText("Dashboard Administrasi MT Regional Sumbar", tableX + tableW / 2, footerY + 114);\n      ctx.textAlign = "left";\n`;

let nextFn;
const footerStart = fn.search(/\n\s*const footerY\s*=\s*tableY\s*\+\s*totalTableH\s*\+\s*\d+;/);
if (footerStart >= 0) {
  const absoluteStart = footerStart;
  const decorative = fn.indexOf("// Decorative bottom wave.", absoluteStart);
  if (decorative >= 0) {
    nextFn = fn.slice(0, absoluteStart) + footer + fn.slice(decorative);
  } else {
    const dataUrl = fn.search(/\n\s*const dataUrl\s*=\s*canvas\.toDataURL/);
    if (dataUrl >= 0) {
      nextFn = fn.slice(0, absoluteStart) + footer + fn.slice(dataUrl);
    } else {
      throw new Error("Existing screenshot footer found but insertion end marker is missing");
    }
  }
} else {
  const dataUrl = fn.search(/\n\s*const dataUrl\s*=\s*canvas\.toDataURL/);
  if (dataUrl >= 0) {
    nextFn = fn.slice(0, dataUrl) + footer + fn.slice(dataUrl);
  } else {
    const restores = [...fn.matchAll(/\n\s*ctx\.restore\(\);/g)];
    if (!restores.length) throw new Error("Could not locate screenshot table footer insertion point");
    const pos = restores[restores.length - 1].index;
    nextFn = fn.slice(0, pos) + fn.slice(pos) + footer;
  }
}

// Give the footer a little more vertical breathing room when the design still uses 128px.
nextFn = nextFn.replace(/const footerH = 128;/, "const footerH = 148;");

s = s.slice(0, fnStart) + nextFn + s.slice(fnEnd);
fs.writeFileSync(file, s);
console.log("Final screenshot footer layout patched robustly");
