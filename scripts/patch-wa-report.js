const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

s = s.replace("📲 Generate Report WA Hari Ini", "📲 Generate Pesan WA Hari Ini");

const start = s.indexOf("  const waReport = useMemo(() => {");
const end = s.indexOf("\n\n  async function copyWaReport", start);
if (start === -1 || end === -1) throw new Error("WA report block marker not found in Monitoring page");

const replacement = [
  "  const waReport = useMemo(() => {",
  "    const byMt = new Map<string, MonitoringRow[]>();",
  "    reportIncompleteRows.forEach(row => {",
  "      const key = row.mt_id || \"unknown\";",
  "      if (!byMt.has(key)) byMt.set(key, []);",
  "      byMt.get(key)!.push(row);",
  "    });",
  "    const lines: string[] = [",
  "      \"Selamat pagi, teman-teman MT! ☀️\",",
  "      \"\",",
  "      \"Terima kasih untuk semangat dan effort teman-teman dalam menjalankan KBM/Klinik PR kemarin. 🙌\",",
  "      \"Apresiasi untuk MT yang sudah melengkapi seluruh administrasi tepat waktu. 👏\",",
  "      \"\",",
  "      \"Untuk MT yang administrasinya masih belum lengkap, mohon segera dilengkapi ya agar seluruh pelaksanaan KBM/Klinik PR dapat terpantau dengan baik.\",",
  "      \"\",",
  "    ];",
  "    if (!reportIncompleteRows.length) {",
  "      lines.push(\"Semoga konsisten terus ke depannya ya!\", \"\", \"Semangat mengajar hari ini! 💙🔥\");",
  "      return lines.join(\"\\n\");",
  "    }",
  "    lines.push(\"🔎 *Yang masih perlu dilengkapi:*\", \"\");",
  "    let number = 1;",
  "    Array.from(byMt.entries()).sort((a, b) => nameOf(mts, a[0]).localeCompare(nameOf(mts, b[0]))).forEach(([mtId, mtRows]) => {",
  "      lines.push(`*${nameOf(mts, mtId)}*`);",
  "      mtRows.forEach(row => {",
  "        const missing = isSimpleSession(row) ? (!row.attendance ? [\"Attendance\"] : []) : [",
  "          !row.topik_sub_topik_done && \"Topik/Subtopik\", !row.attendance && \"Attendance\", !row.starchamps && \"Starchamps\",",
  "          !row.activity_score && \"Activity Score\", !row.report_sessions && \"Report Sessions\", !row.foto_kbm && \"Foto KBM\",",
  "          !row.report_wa && \"Report WA\", !row.auvi_tv_status && \"AuVi TV\", !row.ld_status && \"LD\",",
  "        ].filter(Boolean) as string[];",
  "        lines.push(",
  "          `${number++}. ${nameOf(rombels, row.rombel_id)} · ${nameOf(mapels, row.mapel_id)} · ${row.jenis_sesi}`,",
  "          `   ❌ ${missing.join(\" · \")}`,",
  "          \"👉 Bantu kerjakan drill ... soal benar dan share bukti pengerjaannya di grup ini.\",",
  "          \"\",",
  "        );",
  "      });",
  "    });",
  "    lines.push(\"🙏 *Yuk, segera dilengkapi agar administrasi sesi tercatat lengkap.*\");",
  "    return lines.join(\"\\n\");",
  "  }, [reportIncompleteRows, waDate, reportCompleteCount, reportIncompleteCount, mts, branches, rombels, mapels, branchId]);",
].join("\n");

s = s.slice(0, start) + replacement + s.slice(end);
fs.writeFileSync(file, s);
console.log("Applied agreed WhatsApp report wording:", file);

function patchAdminCompleteness(targetFile, addLdField = false) {
  const target = path.join(process.cwd(), targetFile);
  let source = fs.readFileSync(target, "utf8");

  if (addLdField) {
    source = source.replace(
      'attendance: boolean; topik_sub_topik_done: boolean;',
      'attendance: boolean; ld: boolean; topik_sub_topik_done: boolean;'
    );
    source = source.replace(
      'jenis_sesi,attendance,topik_sub_topik_done,starchamps,activity_score,report_sessions,foto_kbm,report_wa,auvi_tv_status,ld_status',
      'jenis_sesi,attendance,ld,topik_sub_topik_done,starchamps,activity_score,report_sessions,foto_kbm,report_wa,auvi_tv_status,ld_status'
    );
  }

  const oldCondition = '(s.ld_status === "Bukan sesi LD" || s.ld_status === "Sudah report di CMS")';
  const newCondition = '(!s.ld || s.ld_status === "Sudah report di CMS")';
  if (!source.includes(oldCondition)) throw new Error(`LD admin condition marker not found in ${targetFile}`);
  source = source.replace(oldCondition, newCondition);
  fs.writeFileSync(target, source);
  console.log("Applied LD admin completeness fix:", targetFile);
}

patchAdminCompleteness("app/page.tsx", false);
patchAdminCompleteness("app/performance/page.tsx", true);
