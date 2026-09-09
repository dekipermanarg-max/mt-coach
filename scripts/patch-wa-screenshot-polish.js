const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

const start = s.indexOf("  async function generateReportImage() {");
const end = s.indexOf("  async function copyWaReport()", start);
if (start < 0 || end < 0) throw new Error("Screenshot generator markers not found");

let fn = s.slice(start, end);

const helpers = `      const drawPill = (x: number, y: number, w: number, h: number, text: string, bg: string, fg: string, font = "800 11px Arial") => {\n        fillRound(x, y, w, h, h / 2, bg);\n        ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "middle";\n        ctx.fillText(text, x + w / 2, y + h / 2 + 1);\n        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";\n      };\n      const initials = (name: unknown): string => String(name || "MT").split(/\\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();\n\n`;

if (!fn.includes("const drawPill = (x: number, y: number, w: number, h: number, text: string, bg: string, fg: string")) {
  const loopMarker = fn.indexOf("      reportRows.forEach((row, index) => {");
  if (loopMarker < 0) throw new Error("Screenshot table row block not found");
  fn = fn.slice(0, loopMarker) + helpers + fn.slice(loopMarker);
}

const loopStart = fn.indexOf("      reportRows.forEach((row, index) => {");
const loopEnd = fn.indexOf("      ctx.restore();", loopStart);
if (loopStart < 0 || loopEnd < 0) throw new Error("Screenshot table row block not found after helper insertion");

const newLoop = `      reportRows.forEach((row, index) => {\n        const y = tableY + tableHeadH + index * rowH;\n        const simple = isSimpleSession(row);\n        const complete = adminDone(row) === adminTotal(row);\n        ctx.fillStyle = index % 2 === 1 ? "#fbfdff" : "#ffffff"; ctx.fillRect(tableX, y, tableW, rowH);\n        ctx.fillStyle = complete ? "#20b486" : "#ef4444"; ctx.fillRect(tableX, y + 12, 4, rowH - 24);\n        ctx.strokeStyle = "#e8eef5"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tableX, y + rowH); ctx.lineTo(tableX + tableW, y + rowH); ctx.stroke();\n\n        const mtName = nameOf(mts, row.mt_id); const rombelName = nameOf(rombels, row.rombel_id); const mapelName = nameOf(mapels, row.mapel_id); const topic = row.topik_sub_topik || "";\n        ctx.beginPath(); ctx.arc(colX[0] + 29, y + rowH / 2, 20, 0, Math.PI * 2); ctx.fillStyle = complete ? "#e5f8ef" : "#fff0f0"; ctx.fill();\n        ctx.fillStyle = complete ? "#138a63" : "#c92f2f"; ctx.font = "900 12px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(initials(mtName), colX[0] + 29, y + rowH / 2 + 1); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";\n        ctx.fillStyle = "#172033"; ctx.font = "800 13px Arial"; const mtLines = wrapText(mtName, cols[0][1] - 62, 2); const mtStart = y + (mtLines.length === 1 ? 40 : 31); mtLines.forEach((line, j) => ctx.fillText(line, colX[0] + 57, mtStart + j * 16));\n        drawPill(colX[0] + 57, y + 61, 54, 18, complete ? "100%" : String(adminPercent(row)) + "%", complete ? "#e5f8ef" : "#fff0f0", complete ? "#138a63" : "#c92f2f", "800 10px Arial");\n        drawPill(colX[1] + 9, y + 34, Math.min(cols[1][1] - 18, 106), 25, String(rombelName).slice(0, 17), "#eef6fb", "#17658a", "800 10px Arial");\n        ctx.fillStyle = "#172033"; ctx.font = "700 12px Arial"; const mapelLines = wrapText(mapelName, cols[2][1] - 20, 2); const mapelStart = y + (mapelLines.length === 1 ? 52 : 43); mapelLines.forEach((line, j) => ctx.fillText(line, colX[2] + 10, mapelStart + j * 15));\n        if (topic) { ctx.fillStyle = "#334155"; ctx.font = "700 12px Arial"; const topicLines = wrapText(topic, cols[3][1] - 22, 2); const topicStart = y + (topicLines.length === 1 ? 52 : 42); topicLines.forEach((line, j) => ctx.fillText(line, colX[3] + 11, topicStart + j * 16)); }\n\n        // cols[3] is Topik/Subtopik itself. Its checklist marker belongs in that same cell.\n        // The remaining eight administration markers map to cols[4]..cols[11].\n        const states: Array<"na" | "ok" | "no"> = simple\n          ? ["na", row.attendance ? "ok" : "no", "na", "na", "na", "na", "na", "na", "na"]\n          : [row.topik_sub_topik_done ? "ok" : "no", row.attendance ? "ok" : "no", row.starchamps ? "ok" : "no", row.activity_score ? "ok" : "no", row.report_sessions ? "ok" : "no", row.foto_kbm ? "ok" : "no", row.report_wa ? "ok" : "no", (row.auvi_tv_status && row.auvi_tv_status !== "Tidak connect ke TV") ? "ok" : "no", (row.ld_status && row.ld_status !== "Belum report ke CMS") ? "ok" : "no"];\n        states.forEach((state, i) => {\n          const colIndex = 3 + i;\n          const col = cols[colIndex];\n          const x = colX[colIndex];\n          if (!col || x == null) return;\n          drawCheck(x + col[1] / 2, y + rowH / 2, state);\n        });\n      });\n`;

fn = fn.slice(0, loopStart) + newLoop + fn.slice(loopEnd);
fn = fn.replace('ctx.fillStyle = "#17355f"; ctx.font = "800 13px Arial"; ctx.textAlign = i >= 4 ? "center" : "left";', 'ctx.fillStyle = "#132d57"; ctx.font = "900 12px Arial"; ctx.textAlign = i >= 4 ? "center" : "left";');
fn = fn.replace('const headGrad = ctx.createLinearGradient(0, tableY, 0, tableY + tableHeadH); headGrad.addColorStop(0, "#edf5fc"); headGrad.addColorStop(1, "#f7fafc"); ctx.fillStyle = headGrad; ctx.fillRect(tableX, tableY, tableW, tableHeadH);', 'const headGrad = ctx.createLinearGradient(0, tableY, 0, tableY + tableHeadH); headGrad.addColorStop(0, "#e9f4fb"); headGrad.addColorStop(1, "#f8fbfd"); ctx.fillStyle = headGrad; ctx.fillRect(tableX, tableY, tableW, tableHeadH); ctx.fillStyle = "#20b486"; ctx.fillRect(tableX, tableY, tableW, 4);');

s = s.slice(0, start) + fn + s.slice(end);
fs.writeFileSync(file, s);
console.log("Polished BAC screenshot table with safe runtime column mapping");
