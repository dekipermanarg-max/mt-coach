const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

const oldArticle = 'className={`monitoring-session-card ${complete ? "is-complete" : "is-incomplete"}`}';
const newArticle = 'className={`monitoring-session-card ${complete ? "is-complete" : "is-incomplete"} session-type-${row.jenis_sesi === "Klinik PR" ? "klinik-pr" : row.jenis_sesi === "Trial Class" ? "trial-class" : "kbm"}`}';
if (!s.includes(oldArticle)) throw new Error("monitoring session article marker not found");
s = s.replace(oldArticle, newArticle);

const oldSubmeta = '<div className="monitoring-submeta">{nameOf(rombels, row.rombel_id)} · {nameOf(mapels, row.mapel_id)} · {row.jenis_sesi}</div>';
const newSubmeta = '<div className="monitoring-submeta">{nameOf(rombels, row.rombel_id)} · {nameOf(mapels, row.mapel_id)} · <span className="monitoring-session-type-badge">{row.jenis_sesi}</span></div>';
if (!s.includes(oldSubmeta)) throw new Error("monitoring session type label marker not found");
s = s.replace(oldSubmeta, newSubmeta);

const styleMarker = '<style jsx>{`';
if (!s.includes(styleMarker)) throw new Error("monitoring style marker not found");
const css = `
      .monitoring-session-card.session-type-kbm { border-left: 4px solid #2563eb; background: linear-gradient(90deg, #eff6ff 0%, #ffffff 24%); }
      .monitoring-session-card.session-type-klinik-pr { border-left: 4px solid #7c3aed; background: linear-gradient(90deg, #f5f3ff 0%, #ffffff 24%); }
      .monitoring-session-card.session-type-trial-class { border-left: 4px solid #ea580c; background: linear-gradient(90deg, #fff7ed 0%, #ffffff 24%); }
      .monitoring-session-type-badge { display: inline-flex; align-items: center; padding: 2px 8px; margin-left: 2px; border-radius: 999px; font-size: 11px; font-weight: 700; line-height: 1.35; border: 1px solid transparent; }
      .session-type-kbm .monitoring-session-type-badge { color: #1d4ed8; background: #dbeafe; border-color: #bfdbfe; }
      .session-type-klinik-pr .monitoring-session-type-badge { color: #6d28d9; background: #ede9fe; border-color: #ddd6fe; }
      .session-type-trial-class .monitoring-session-type-badge { color: #c2410c; background: #ffedd5; border-color: #fed7aa; }
    `;
s = s.replace(styleMarker, `${styleMarker}${css}`);

fs.writeFileSync(file, s);
console.log("Applied Monitoring session-type colors: KBM blue, Klinik PR purple, Trial Class orange");
