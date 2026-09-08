const fs = require("fs");
const path = require("path");

function addClickToCard(source, label, handler, ariaLabel, classNeedle = "card planning-kpi") {
  const labelIndex = source.indexOf(label);
  if (labelIndex < 0) throw new Error(`Target card label not found: ${label}`);
  const cardMarker = `<div className="${classNeedle}`;
  const cardStart = source.lastIndexOf(cardMarker, labelIndex);
  const tagEnd = source.indexOf(">", cardStart);
  if (cardStart < 0 || tagEnd < 0 || tagEnd > labelIndex) {
    throw new Error(`Target card container not found: ${label}`);
  }
  const tag = source.slice(cardStart, tagEnd);
  if (tag.includes("onClick=")) return source;
  const attrs = ` onClick={() => ${handler}} role="button" tabIndex={0} aria-label="${ariaLabel}" onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") ${handler}; }}`;
  return source.slice(0, cardStart) + tag + attrs + source.slice(tagEnd);
}

function patchMonitoring() {
  const file = path.join(process.cwd(), "app/monitoring/page.tsx");
  let s = fs.readFileSync(file, "utf8");
  const marker = '  const ldProgress = targetLdGoal ? Math.min(100, Math.round((targetLdRombels / targetLdGoal) * 100)) : 0;';
  const fn = [
    '  async function showTargetDetail(kind: "auvi" | "ld") {',
    '    const rows = kind === "auvi"',
    '      ? targetWeekRows.filter(r => r.auvi_tv)',
    '      : targetWeekRows.filter(r => r.ld && r.rombel_id);',
    '    const unique = kind === "ld"',
    '      ? Array.from(new Map(rows.filter(r => !/(^|\\s)(kelas\\s*)?(12|xii)(\\s|$)/i.test(nameOf(rombels, r.rombel_id))).map(r => [r.rombel_id!, r])).values())',
    '      : rows;',
    '    const title = kind === "auvi" ? "🎥 DETAIL TARGET AuVi TV" : "👥 DETAIL TARGET LD";',
    '    const goal = kind === "auvi" ? targetAuviGoal : targetLdGoal;',
    '    const count = kind === "auvi" ? targetAuviSessions : targetLdRombels;',
    '    const lines = unique.length',
    '      ? unique.map((r, i) => (i + 1) + ". " + nameOf(rombels, r.rombel_id) + " — " + nameOf(mts, r.mt_id) + " — " + nameOf(mapels, r.mapel_id) + " — " + formatDate(r.planning_date))',
    '      : ["Belum ada assignment."];',
    '    window.alert([title, targetWeekStartStr + " – " + targetWeekEndStr, count + "/" + goal + " tercapai", "", ...lines, "", "Sisa target: " + Math.max(0, goal - count)].join("\\n"));',
    '  }',
    ''
  ].join("\n");
  if (!s.includes("async function showTargetDetail(kind")) {
    if (!s.includes(marker)) throw new Error("Monitoring target click marker not found");
    s = s.replace(marker, marker + "\n" + fn);
  }
  s = addClickToCard(s, "Target AuVi TV", 'showTargetDetail("auvi")', "Lihat detail assignment AuVi TV", "card planning-kpi monitoring-target-kpi monitoring-auvi-kpi");
  s = addClickToCard(s, "Target LD", 'showTargetDetail("ld")', "Lihat detail assignment LD", "card planning-kpi monitoring-target-kpi monitoring-ld-kpi");
  fs.writeFileSync(file, s);
  console.log("Patched Monitoring target cards with robust click details.");
}

function patchPlanning() {
  const file = path.join(process.cwd(), "app/planning/page.tsx");
  let s = fs.readFileSync(file, "utf8");
  // patch-planning.js runs before this script and makes the date label conditional when no date is selected.
  const marker = '  const selectedDateLabel = date ? formatDate(date) : "";';
  const fn = [
    '  async function showTargetDetail(kind: "auvi" | "ld") {',
    '    if (!branchId || !date) return;',
    '    const base = new Date(date + "T00:00:00");',
    '    const day = base.getDay();',
    '    const diff = day === 0 ? -6 : 1 - day;',
    '    const start = new Date(base);',
    '    start.setDate(base.getDate() + diff);',
    '    const end = new Date(start);',
    '    end.setDate(start.getDate() + 6);',
    '    const startStr = start.toISOString().slice(0, 10);',
    '    const endStr = end.toISOString().slice(0, 10);',
    '    const { data } = await supabase.from("weekly_planning").select("id,planning_date,auvi_tv,ld,mt_id,rombel_id,mapel_id").eq("branch_id", branchId).gte("planning_date", startStr).lte("planning_date", endStr);',
    '    const rows = (data || []) as PlanningRow[];',
    '    const assigned = kind === "auvi"',
    '      ? rows.filter(r => r.auvi_tv)',
    '      : rows.filter(r => r.ld && r.rombel_id && !/(^|\\s)(kelas\\s*)?(12|xii)(\\s|$)/i.test(nameOf(rombelRows, r.rombel_id)));',
    '    const unique = kind === "ld" ? Array.from(new Map(assigned.map(r => [r.rombel_id!, r])).values()) : assigned;',
    '    const goal = kind === "auvi" ? 10 : (weeklyRombelPopulation ? Math.ceil(weeklyRombelPopulation * 0.5) : 0);',
    '    const title = kind === "auvi" ? "🎥 DETAIL TARGET AuVi TV" : "👥 DETAIL TARGET LD";',
    '    const lines = unique.length',
    '      ? unique.map((r, i) => (i + 1) + ". " + nameOf(rombelRows, r.rombel_id) + " — " + nameOf(mtRows, r.mt_id) + " — " + nameOf(mapelRows, r.mapel_id) + " — " + formatDate(r.planning_date))',
    '      : ["Belum ada assignment."];',
    '    window.alert([title, startStr + " – " + endStr, unique.length + "/" + goal + " tercapai", "", ...lines, "", "Sisa target: " + Math.max(0, goal - unique.length)].join("\\n"));',
    '  }',
    ''
  ].join("\n");
  if (!s.includes("async function showTargetDetail(kind")) {
    if (!s.includes(marker)) throw new Error("Planning target click marker not found");
    s = s.replace(marker, fn + marker);
  }
  s = addClickToCard(s, "AuVi TV Mingguan", 'showTargetDetail("auvi")', "Lihat detail assignment AuVi TV");
  s = addClickToCard(s, "LD Mingguan", 'showTargetDetail("ld")', "Lihat detail assignment LD");
  fs.writeFileSync(file, s);
  console.log("Patched Weekly Planning target cards with robust click details.");
}

patchMonitoring();
patchPlanning();
