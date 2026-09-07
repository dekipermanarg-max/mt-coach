const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// The BAC screenshot has 8 checklist columns after the descriptive Topik/Subtopik column.
// Render Topik/Subtopik completion inside its own cell, then map the remaining 8 states to
// Attendance, Starchamps, Activity Score, Report Sessions, Foto KBM, Report WA, AuVi TV, LD.
const oldStates = `        const states: ("ok" | "no" | "na")[] = simple
          ? ["na", row.attendance ? "ok" : "no", "na", "na", "na", "na", "na", "na", "na"]
          : [row.topik_sub_topik_done ? "ok" : "no", row.attendance ? "ok" : "no", row.starchamps ? "ok" : "no", row.activity_score ? "ok" : "no", row.report_sessions ? "ok" : "no", row.foto_kbm ? "ok" : "no", row.report_wa ? "ok" : "no", (row.auvi_tv_status && row.auvi_tv_status !== "Tidak connect ke TV") ? "ok" : "no", (row.ld_status && row.ld_status !== "Belum report ke CMS") ? "ok" : "no"];
        states.forEach((state, i) => drawCheck(colX[4 + i] + cols[4 + i][1] / 2, y + rowH / 2, state));`;

const newStates = `        drawCheck(colX[3] + cols[3][1] - 30, y + rowH / 2, simple ? "na" : (row.topik_sub_topik_done ? "ok" : "no"));
        const states: ("ok" | "no" | "na")[] = simple
          ? [row.attendance ? "ok" : "no", "na", "na", "na", "na", "na", "na", "na"]
          : [row.attendance ? "ok" : "no", row.starchamps ? "ok" : "no", row.activity_score ? "ok" : "no", row.report_sessions ? "ok" : "no", row.foto_kbm ? "ok" : "no", row.report_wa ? "ok" : "no", (row.auvi_tv_status && row.auvi_tv_status !== "Tidak connect ke TV") ? "ok" : "no", (row.ld_status && row.ld_status !== "Belum report ke CMS") ? "ok" : "no"];
        states.forEach((state, i) => drawCheck(colX[4 + i] + cols[4 + i][1] / 2, y + rowH / 2, state));`;

if (!s.includes(oldStates)) throw new Error("Screenshot state block not found");
s = s.replace(oldStates, newStates);
fs.writeFileSync(file, s);
console.log("Fixed WhatsApp screenshot runtime column mapping");
