import React from 'react';

export default function Performance(){
  return <div className="performance-page">
    {/* Existing Performance content remains here. */}
    <section className="status-legend" aria-label="Legenda status performance">
      <div className="status-legend__header">
        <div>
          <h3>📊 Legenda Status</h3>
          <p>Status otomatis berdasarkan skor Performance.</p>
        </div>
      </div>
      <div className="status-legend__grid">
        <div className="status-item status-item--excellent"><span>🟢</span><div><strong>Excellent</strong><small>≥ 90% · Performa sangat baik</small></div></div>
        <div className="status-item status-item--good"><span>🔵</span><div><strong>Good</strong><small>75–89% · Baik, masih bisa ditingkatkan</small></div></div>
        <div className="status-item status-item--attention"><span>🟡</span><div><strong>Attention</strong><small>50–74% · Perlu diperhatikan</small></div></div>
        <div className="status-item status-item--critical"><span>🔴</span><div><strong>Critical</strong><small>&lt; 50% · Perlu coaching/intervensi</small></div></div>
        <div className="status-item status-item--nodata"><span>⚪</span><div><strong>No Data</strong><small>Tidak ada sesi pada periode terpilih</small></div></div>
      </div>
    </section>
  </div>;
}

/* Add to the existing page stylesheet:
.status-legend{margin-top:20px;padding:18px 20px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 2px 8px rgba(15,23,42,.04)}
.status-legend__header h3{margin:0;font-size:16px;color:#172033}.status-legend__header p{margin:4px 0 14px;font-size:12px;color:#64748b}
.status-legend__grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.status-item{display:flex;align-items:center;gap:9px;padding:11px 12px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc}.status-item>span{font-size:16px}.status-item strong{display:block;font-size:12px;color:#172033}.status-item small{display:block;margin-top:2px;font-size:10px;line-height:1.35;color:#64748b}.status-item--excellent{border-left:3px solid #22c55e}.status-item--good{border-left:3px solid #3b82f6}.status-item--attention{border-left:3px solid #f59e0b}.status-item--critical{border-left:3px solid #ef4444}.status-item--nodata{border-left:3px solid #94a3b8}
@media(max-width:900px){.status-legend__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.status-legend__grid{grid-template-columns:1fr}}
*/
