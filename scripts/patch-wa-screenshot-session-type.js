const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

const oldCols = 'const cols: Array<[string, number]> = [["MT",170],["Rombel",125],["Mapel",135],["Topik / Subtopik",190],["Attendance",95],["Starchamps",95],["Activity Score",105],["Report Sessions",110],["Foto KBM",90],["Report WA",90],["AuVi TV",90],["LD",65]];';
const newCols = 'const cols: Array<[string, number]> = [["MT",150],["Rombel",115],["Mapel",120],["Jenis Sesi",115],["Topik / Subtopik",175],["Attendance",85],["Starchamps",85],["Activity Score",95],["Report Sessions",100],["Foto KBM",85],["Report WA",85],["AuVi TV",85],["LD",65]];';

if (s.includes(oldCols)) s = s.replace(oldCols, newCols);
else if (!s.includes(newCols)) throw new Error("Screenshot columns marker not found");

const loopStart = s.indexOf('      reportRows.forEach((row, index) => {');
const loopEnd = s.indexOf('      ctx.restore();', loopStart);
if (loopStart < 0 || loopEnd < 0) throw new Error("Screenshot table row block not found");

const newLoop = `      reportRows.forEach((row, index) => {
        const y = tableY + tableHeadH + index * rowH;
        const simple = isSimpleSession(row);
        const complete = adminDone(row) === adminTotal(row);

        ctx.fillStyle = index % 2 === 1 ? "#fbfdff" : "#ffffff";
        ctx.fillRect(tableX, y, tableW, rowH);
        ctx.fillStyle = complete ? "#20b486" : "#ef4444";
        ctx.fillRect(tableX, y + 12, 4, rowH - 24);
        ctx.strokeStyle = "#e8eef5"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tableX, y + rowH); ctx.lineTo(tableX + tableW, y + rowH); ctx.stroke();

        const mtName = nameOf(mts, row.mt_id);
        const rombelName = nameOf(rombels, row.rombel_id);
        const mapelName = nameOf(mapels, row.mapel_id);
        const sessionType = row.jenis_sesi || "—";

        // MT: remove the initials/avatar circle; keep the name and completion percentage.
        ctx.fillStyle = "#172033"; ctx.font = "800 13px Arial"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        const mtLines = wrapText(mtName, cols[0][1] - 22, 2);
        const mtStart = y + (mtLines.length === 1 ? 39 : 30);
        mtLines.forEach((line, j) => ctx.fillText(line, colX[0] + 12, mtStart + j * 16));
        drawPill(colX[0] + 12, y + 61, 54, 18, complete ? "100%" : String(adminPercent(row)) + "%", complete ? "#e5f8ef" : "#fff0f0", complete ? "#138a63" : "#c92f2f", "800 10px Arial");

        drawPill(colX[1] + 9, y + 34, Math.min(cols[1][1] - 18, 96), 25, String(rombelName).slice(0, 16), "#eef6fb", "#17658a", "800 10px Arial");
        ctx.fillStyle = "#172033"; ctx.font = "700 12px Arial";
        const mapelLines = wrapText(mapelName, cols[2][1] - 20, 2);
        const mapelStart = y + (mapelLines.length === 1 ? 52 : 43);
        mapelLines.forEach((line, j) => ctx.fillText(line, colX[2] + 10, mapelStart + j * 15));

        // Jenis Sesi is now a dedicated column immediately after Mapel.
        const sessionBg = sessionType === "Klinik PR" ? "#dbeafe" : sessionType === "Trial Class" ? "#fef3c7" : "#e5f8ef";
        const sessionColor = sessionType === "Klinik PR" ? "#1d4ed8" : sessionType === "Trial Class" ? "#b45309" : "#047857";
        drawPill(colX[3] + 8, y + 34, cols[3][1] - 16, 25, sessionType, sessionBg, sessionColor, "800 10px Arial");

        const states: Array<"na" | "ok" | "no"> = simple
          ? ["na", row.attendance ? "ok" : "no", "na", "na", "na", "na", "na", "na", "na"]
          : [row.topik_sub_topik_done ? "ok" : "no", row.attendance ? "ok" : "no", row.starchamps ? "ok" : "no", row.activity_score ? "ok" : "no", row.report_sessions ? "ok" : "no", row.foto_kbm ? "ok" : "no", row.report_wa ? "ok" : "no", (row.auvi_tv_status && row.auvi_tv_status !== "Tidak connect ke TV") ? "ok" : "no", (row.ld_status && row.ld_status !== "Belum report ke CMS") ? "ok" : "no"];
        states.forEach((state, i) => {
          const colIndex = 4 + i;
          const col = cols[colIndex];
          const x = colX[colIndex];
          if (!col || x == null) return;
          drawCheck(x + col[1] / 2, y + rowH / 2, state);
        });
      });
`;

s = s.slice(0, loopStart) + newLoop + s.slice(loopEnd);
fs.writeFileSync(file, s);
console.log("Updated BAC screenshot: removed MT initials and added Jenis Sesi after Mapel.");
