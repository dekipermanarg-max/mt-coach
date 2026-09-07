const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Klinik PR only requires attendance. Other checklist items are not applicable and use an em dash.
const oldChecks = '        const checks = [row.topik_sub_topik_done, row.attendance, row.starchamps, row.activity_score, row.report_sessions, row.foto_kbm, row.report_wa, Boolean(row.auvi_tv_status && row.auvi_tv_status !== "Tidak connect ke TV"), Boolean(row.ld_status && row.ld_status !== "Belum report ke CMS")];\n        checks.forEach((ok, i) => { const center = colX[3 + i] + cols[3 + i][1] / 2; mark(Boolean(ok), center, y + rowH / 2); });';
const newChecks = '        if (isSimpleSession(row)) {\n          // Att is the only applicable checklist item for Klinik PR.\n          for (let i = 0; i < 9; i++) {\n            const center = colX[3 + i] + cols[3 + i][1] / 2;\n            if (i === 1) mark(Boolean(row.attendance), center, y + rowH / 2);\n            else { ctx.fillStyle = "#94a3b8"; ctx.font = "800 24px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("—", center, y + rowH / 2); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; }\n          }\n        } else {\n          const checks = [row.topik_sub_topik_done, row.attendance, row.starchamps, row.activity_score, row.report_sessions, row.foto_kbm, row.report_wa, Boolean(row.auvi_tv_status && row.auvi_tv_status !== "Tidak connect ke TV"), Boolean(row.ld_status && row.ld_status !== "Belum report ke CMS")];\n          checks.forEach((ok, i) => { const center = colX[3 + i] + cols[3 + i][1] / 2; mark(Boolean(ok), center, y + rowH / 2); });\n        }';
if (!s.includes(oldChecks)) throw new Error("Screenshot checklist marker not found");
s = s.replace(oldChecks, newChecks);

const oldLegend = '      ctx.fillStyle = "#475569"; ctx.font = "700 18px Arial"; ctx.textAlign = "left"; ctx.fillText("Belum lengkap", tableX + 236, footerY + 45);';
const newLegend = '      ctx.fillStyle = "#475569"; ctx.font = "700 18px Arial"; ctx.textAlign = "left"; ctx.fillText("Belum lengkap", tableX + 236, footerY + 45);\n      ctx.fillStyle = "#94a3b8"; ctx.font = "900 20px Arial"; ctx.textAlign = "center"; ctx.fillText("—", tableX + 400, footerY + 43); ctx.fillStyle = "#475569"; ctx.font = "700 18px Arial"; ctx.textAlign = "left"; ctx.fillText("Tidak berlaku (Klinik PR)", tableX + 420, footerY + 45);';
if (!s.includes(oldLegend)) throw new Error("Screenshot footer legend marker not found");
s = s.replace(oldLegend, newLegend);

fs.writeFileSync(file, s);
console.log("Applied Klinik PR screenshot marks: attendance only, em dash for non-applicable items");
