const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Make the BAC branding in the generated report screenshot much closer to the
// supplied visual reference: larger mark, stronger hierarchy, and cleaner footer.
const oldBrand = `      // BAC brand block.\n      const brandX = margin, brandY = 46;\n      ctx.save(); ctx.translate(brandX + 30, brandY + 24); ctx.rotate(Math.PI / 6);\n      ctx.fillStyle = "#f6b500"; ctx.beginPath(); ctx.moveTo(0,-25); ctx.lineTo(22,-12); ctx.lineTo(22,12); ctx.lineTo(0,25); ctx.lineTo(-22,12); ctx.lineTo(-22,-12); ctx.closePath(); ctx.fill(); ctx.restore();\n      ctx.fillStyle = "#1597aa"; ctx.font = "800 13px Arial"; ctx.fillText("BRAIN", brandX + 64, brandY + 13); ctx.fillText("ACADEMY", brandX + 64, brandY + 29); ctx.fillText("CENTER", brandX + 64, brandY + 45);\n      ctx.fillStyle = "#64748b"; ctx.font = "600 10px Arial"; ctx.fillText("By Ruangguru", brandX + 64, brandY + 61);\n      ctx.strokeStyle = "#dbe4ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(brandX + 178, brandY - 4); ctx.lineTo(brandX + 178, brandY + 68); ctx.stroke();`;

const newBrand = `      // BAC brand block — enlarged to read like a real logo lockup.\n      const brandX = margin, brandY = 40;\n      ctx.save();\n      ctx.fillStyle = "#f6b500";\n      ctx.beginPath();\n      ctx.moveTo(brandX + 34, brandY); ctx.lineTo(brandX + 58, brandY + 14);\n      ctx.lineTo(brandX + 58, brandY + 42); ctx.lineTo(brandX + 34, brandY + 56);\n      ctx.lineTo(brandX + 10, brandY + 42); ctx.lineTo(brandX + 10, brandY + 14);\n      ctx.closePath(); ctx.fill();\n      ctx.restore();\n      ctx.fillStyle = "#1597aa"; ctx.font = "900 16px Arial";\n      ctx.fillText("BRAIN", brandX + 78, brandY + 15);\n      ctx.fillText("ACADEMY", brandX + 78, brandY + 34);\n      ctx.fillText("CENTER", brandX + 78, brandY + 53);\n      ctx.fillStyle = "#64748b"; ctx.font = "700 11px Arial";\n      ctx.fillText("By Ruangguru", brandX + 78, brandY + 72);\n      ctx.strokeStyle = "#dbe4ee"; ctx.lineWidth = 2;\n      ctx.beginPath(); ctx.moveTo(brandX + 190, brandY - 4); ctx.lineTo(brandX + 190, brandY + 80); ctx.stroke();`;

if (!s.includes(oldBrand)) throw new Error("BAC brand block not found");
s = s.replace(oldBrand, newBrand);

const oldFooter = `      const footerY = tableY + totalTableH + 22;\n      fillRound(tableX, footerY, tableW, footerH, 18, "#f7fafc");\n      drawCheck(tableX + 28, footerY + 34, "ok"); ctx.fillStyle = "#334155"; ctx.font = "700 15px Arial"; ctx.fillText("Lengkap", tableX + 55, footerY + 39);\n      drawCheck(tableX + 170, footerY + 34, "no"); ctx.fillText("Belum lengkap", tableX + 197, footerY + 39);\n      drawCheck(tableX + 335, footerY + 34, "na"); ctx.fillText("Tidak berlaku (Klinik PR)", tableX + 360, footerY + 39);`;

const newFooter = `      const footerY = tableY + totalTableH + 22;\n      fillRound(tableX, footerY, tableW, footerH, 18, "#f7fafc");\n      drawCheck(tableX + 28, footerY + 34, "ok"); ctx.fillStyle = "#334155"; ctx.font = "800 15px Arial"; ctx.fillText("Lengkap", tableX + 58, footerY + 30);\n      ctx.fillStyle = "#64748b"; ctx.font = "600 11px Arial"; ctx.fillText("Semua dokumen/sesi terpenuhi", tableX + 58, footerY + 48);\n      drawCheck(tableX + 255, footerY + 34, "no"); ctx.fillStyle = "#334155"; ctx.font = "800 15px Arial"; ctx.fillText("Belum lengkap", tableX + 285, footerY + 30);\n      ctx.fillStyle = "#64748b"; ctx.font = "600 11px Arial"; ctx.fillText("Masih ada yang belum terpenuhi", tableX + 285, footerY + 48);\n      drawCheck(tableX + 520, footerY + 34, "na"); ctx.fillStyle = "#334155"; ctx.font = "800 15px Arial"; ctx.fillText("Tidak berlaku (Klinik PR)", tableX + 550, footerY + 30);\n      ctx.fillStyle = "#64748b"; ctx.font = "600 11px Arial"; ctx.fillText("Kolom ini tidak wajib untuk sesi ini", tableX + 550, footerY + 48);`;

if (!s.includes(oldFooter)) throw new Error("Screenshot footer block not found");
s = s.replace(oldFooter, newFooter);
fs.writeFileSync(file, s);
console.log("Refined BAC logo and screenshot footer branding");
