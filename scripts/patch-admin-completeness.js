const fs = require("fs");
const path = require("path");

const root = process.cwd();
const monitoringPath = path.join(root, "app/monitoring/page.tsx");
const performancePath = path.join(root, "app/performance/page.tsx");

function ensureImport(source, importLine) {
  if (source.includes('from "../../lib/session-admin"')) return source;
  const anchor = 'import { supabase } from "../../lib/supabase";';
  if (!source.includes(anchor)) throw new Error("Supabase import anchor not found");
  return source.replace(anchor, `${anchor}\n${importLine}`);
}

function patchMonitoring() {
  let source = fs.readFileSync(monitoringPath, "utf8");
  source = ensureImport(
    source,
    'import { getAdminDone, getAdminPercent, getAdminTotal, getMissingAdmin, isAdminComplete, isAuviComplete, isLdComplete, isSimpleSession, isSessionAdminComplete } from "../../lib/session-admin";'
  );

  source = source.replace(
    'const ADMIN_KEYS = ["topik_sub_topik_done", "attendance", "starchamps", "activity_score", "report_sessions", "foto_kbm", "report_wa"] as const;\n',
    ""
  );

  const start = source.indexOf('  const isSimpleSession = (r: MonitoringRow) =>');
  const end = source.indexOf('  const filtered = useMemo(() => rows.filter(r =>', start);
  if (start < 0 || end < 0) throw new Error("Monitoring completeness block not found");

  const replacement = `  const adminDone = (r: MonitoringRow) => getAdminDone(r);\n  const adminTotal = (r: MonitoringRow) => getAdminTotal(r);\n  const adminPercent = (r: MonitoringRow) => getAdminPercent(r);\n  const isAdminComplete = (r: MonitoringRow) => isSessionAdminComplete(r);\n\n`;
  source = source.slice(0, start) + replacement + source.slice(end);

  source = source.replace(/adminDone\(r\) === adminTotal\(r\)/g, "isAdminComplete(r)");
  source = source.replace(/adminDone\(row\) === adminTotal\(row\)/g, "isAdminComplete(row)");

  // The shared helper is imported under the same function names used by the JSX below.
  fs.writeFileSync(monitoringPath, source, "utf8");
}

function patchPerformance() {
  let source = fs.readFileSync(performancePath, "utf8");
  source = ensureImport(
    source,
    'import { getAdminPercent, isSessionAdminComplete, normalizeStatus } from "../../lib/session-admin";'
  );

  const start = source.indexOf('function isSimpleSession(s: Session)');
  const end = source.indexOf('function getBranchTargetKey', start);
  if (start < 0 || end < 0) throw new Error("Performance completeness block not found");

  const replacement = `function adminComplete(s: Session) { return isSessionAdminComplete(s); }\nfunction adminPercent(s: Session) { return getAdminPercent(s); }\n`;
  source = source.slice(0, start) + replacement + source.slice(end);

  source = source.replace(
    'const auviRealized = filtered.filter(s => s.auvi_tv_status && s.auvi_tv_status !== "Bukan sesi AuVi TV").length;',
    'const auviRealized = filtered.filter(s => { const status = normalizeStatus(s.auvi_tv_status); return status && status !== "Bukan sesi AuVi TV"; }).length;'
  );

  fs.writeFileSync(performancePath, source, "utf8");
}

patchMonitoring();
patchPerformance();
console.log("✓ Shared admin completeness logic applied to Monitoring + Performance for all MTs.");
