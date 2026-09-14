const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Some later screenshot/report patches can reintroduce calls to isTopikDone()
// after patch-monitoring-topik-checkbox.js has already run. The helper may not
// exist in the generated Monitoring variant, so eliminate dangling references
// immediately before the production build.
const hasHelper = /\b(?:const|let|var|function)\s+isTopikDone\s*=|\bfunction\s+isTopikDone\s*\(/.test(s);

if (!hasHelper) {
  s = s.replace(/isTopikDone\(row\)/g, 'Boolean((row.topik_sub_topik || "").trim()) || Boolean(row.topik_sub_topik_done)');
  s = s.replace(/isTopikDone\(r\)/g, 'Boolean((r.topik_sub_topik || "").trim()) || Boolean(r.topik_sub_topik_done)');
}

fs.writeFileSync(file, s);
console.log(hasHelper
  ? "Monitoring build safety check: isTopikDone helper is defined."
  : "Monitoring build safety check: removed dangling isTopikDone references.");
