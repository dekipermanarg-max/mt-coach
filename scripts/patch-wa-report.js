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
  "      \"Apresiasi juga untuk MT yang sudah melengkapi administrasi tepat waktu. 👏\",",
  "      \"\",",
  "      \"Untuk MT yang administrasinya masih belum lengkap, mohon segera dilengkapi ya agar seluruh pelaksanaan KBM/Klinik PR dapat terpantau dengan baik.\",",
  "      \"\",",
  "    ];",
  "    if (!reportIncompleteRows.length) {",
  "      lines.push(\"Terima kasih sudah melengkapi seluruh administrasi KBM/Klinik PR kemarin. 🙌\", \"\", \"Apresiasi untuk kerja sama, tanggung jawab, dan komitmen teman-teman dalam menjaga administrasi tetap tertib. 👏\", \"\", \"Semoga konsisten terus ke depannya ya!\", \"Semangat mengajar hari ini! 💙🔥\");",
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
