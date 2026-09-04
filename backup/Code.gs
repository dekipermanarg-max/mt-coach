const BACKUP_FOLDER_ID = '1TRHf0Wa3gBn2I5KdSvBJabSMGFJKy7og';
const BACKUP_USER_AGENT = 'MT-Coach-Backup/1.0';

/** Web App endpoint for backup and Google Sheets export. */
function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);

    if (payload.action === 'export_performance_sheet') {
      return jsonResponse_(createPerformanceSheet_(payload.report || {}));
    }
    if (payload.action === 'export_monitoring_sheet') {
      return jsonResponse_(createMonitoringSheet_(payload.report || {}));
    }
    if (payload.action === 'export_performance_slides') {
      return jsonResponse_(createPerformanceSlides_(payload.report || {}));
    }

    const folder = DriveApp.getFolderById(BACKUP_FOLDER_ID);
    const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = 'MT-Coach_Backup_' + date + '.json';
    folder.createFile(filename, raw, MimeType.JSON);
    return jsonResponse_({ success: true, filename: filename });
  } catch (error) {
    return jsonResponse_({ success: false, error: error.message });
  }
}

/** GET endpoint used by the static GitHub Pages dashboard. */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : '';
    const payload = e && e.parameter && e.parameter.payload ? JSON.parse(e.parameter.payload) : {};
    let result;

    if (action === 'export_performance_sheet') {
      result = createPerformanceSheet_(payload);
    } else if (action === 'export_monitoring_sheet') {
      result = createMonitoringSheet_(payload);
    } else if (action === 'export_performance_slides') {
      result = createPerformanceSlides_(payload);
    } else {
      return HtmlService.createHtmlOutput('<h3>MT Coach Backup</h3><p>Web App aktif.</p>');
    }

    const safeUrl = String(result.url || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const html = '<!doctype html><html><head><base target="_top"></head><body style="font-family:Arial;padding:30px"><h3>Export berhasil.</h3><p>Membuka Google Sheets…</p><p><a href="' + safeUrl + '" target="_top">Klik di sini jika belum terbuka</a></p><script>window.top.location.href=' + JSON.stringify(String(result.url || '')) + ';</script></body></html>';
    return HtmlService.createHtmlOutput(html);
  } catch (error) {
    return HtmlService.createHtmlOutput('<h3>Export gagal</h3><p>' + escapeHtml_(error.message) + '</p>');
  }
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Create a Google Sheet containing the current Performance filter and ranking. */
function createPerformanceSheet_(report) {
  const title = String(report.title || 'MT Performance');
  const startDate = String(report.startDate || '');
  const endDate = String(report.endDate || '');
  const branch = String(report.branch || 'Semua Cabang');
  const rows = Array.isArray(report.rows) ? report.rows : [];
  const attention = Array.isArray(report.attention) ? report.attention : [];
  const top = report.top || null;
  const auvi = report.auvi || {};
  const ld = report.ld || {};

  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
  const ss = SpreadsheetApp.create(title + ' · ' + stamp);
  const sheet = ss.getSheets()[0];
  sheet.setName('Performance');

  const summary = [
    ['MT PERFORMANCE', ''],
    ['Periode', formatReportDate_(startDate) + ' – ' + formatReportDate_(endDate)],
    ['Cabang Sesi', branch],
    ['Average Session', String(report.avgSession || '0.0') + '%'],
    ['Top MT', top ? String(top.name || '—') : '—'],
    ['Needs Attention', attention.length],
    ['Total Finalized', Number(report.plannedTotal || 0)],
    ['AuVi TV', String(auvi.realized || 0) + ' / ' + String(auvi.target || 0) + ' sesi (' + String(auvi.pct || 0) + '%)'],
    ['LD', String(ld.realized || 0) + ' / ' + String(ld.target || 0) + ' rombel · eligible ' + String(ld.eligible || 0)],
    ['Generated', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMMM yyyy, HH:mm')],
    ['', ''],
    ['RANKING MT', '', '', '', '', '', ''],
    ['#', 'MT', 'Base', 'Finalized', 'Attendance', 'Session', 'Admin', 'LD', 'Status']
  ];

  const ranking = rows.map(function(r, i) {
    const status = Number(r.session || 0) >= 90 && Number(r.admin || 0) >= 90 ? (Number(r.session || 0) >= 95 && Number(r.admin || 0) >= 95 ? 'Excellent' : 'Good') : (Number(r.session || 0) < 50 || Number(r.admin || 0) < 50 ? 'Critical' : 'Attention');
    return [i + 1, String(r.name || '—'), String(r.base || '—'), Number(r.planned || 0), Number(r.realized || 0), Number(r.session || 0) / 100, Number(r.admin || 0) / 100, r.ld === null || r.ld === undefined ? '' : Number(r.ld) / 100, status];
  });

  sheet.getRange(1, 1, summary.length, 9).setValues(summary.map(function(row) { const out = row.slice(); while (out.length < 9) out.push(''); return out; }));
  if (ranking.length) sheet.getRange(summary.length + 1, 1, ranking.length, 9).setValues(ranking);

  styleSheetHeader_(sheet.getRange('A1:I1'));
  styleSheetHeader_(sheet.getRange('A12:I12'));
  styleSheetHeader_(sheet.getRange('A13:I13'));
  if (ranking.length) {
    sheet.getRange(summary.length + 1, 6, ranking.length, 2).setNumberFormat('0%');
    sheet.getRange(summary.length + 1, 8, ranking.length, 1).setNumberFormat('0%');
    sheet.getRange(summary.length + 1, 1, ranking.length, 9).createFilter();
  }
  sheet.setFrozenRows(13);
  sheet.autoResizeColumns(1, 9);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidth(9, 110);

  if (attention.length) {
    const attentionSheet = ss.insertSheet('Needs Attention');
    attentionSheet.getRange(1, 1, 1, 4).setValues([['MT', 'Base', 'Session', 'Admin']]);
    attentionSheet.getRange(2, 1, attention.length, 4).setValues(attention.map(function(r) { return [String(r.name || '—'), String(r.base || '—'), Number(r.session || 0) / 100, Number(r.admin || 0) / 100]; }));
    styleSheetHeader_(attentionSheet.getRange('A1:D1'));
    attentionSheet.getRange(2, 3, attention.length, 2).setNumberFormat('0%');
    attentionSheet.autoResizeColumns(1, 4);
  }

  return { success: true, spreadsheetId: ss.getId(), url: ss.getUrl(), filename: ss.getName() };
}

/** Create a Google Sheet containing the current Monitoring filter and all visible sessions. */
function createMonitoringSheet_(report) {
  const title = String(report.title || 'Kelengkapan Administrasi Monitoring');
  const rows = Array.isArray(report.rows) ? report.rows : [];
  const summary = report.summary || {};
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
  const ss = SpreadsheetApp.create(title + ' · ' + stamp);
  const sheet = ss.getSheets()[0];
  sheet.setName('Monitoring');

  const info = [
    ['MONITORING · KELENGKAPAN ADMINISTRASI', ''],
    ['Periode', formatReportDate_(report.startDate) + ' – ' + formatReportDate_(report.endDate)],
    ['Cabang', String(report.branch || 'Semua Cabang')],
    ['MT', String(report.mt || 'Semua MT')],
    ['Pencarian', String(report.search || '—')],
    ['Total Sesi', Number(summary.total || 0)],
    ['Lengkap', Number(summary.complete || 0)],
    ['Belum Lengkap', Number(summary.incomplete || 0)],
    ['Average Admin', Number(summary.avgAdmin || 0) / 100],
    ['Generated', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMMM yyyy, HH:mm')],
    ['', ''],
  ];
  const headers = ['Tanggal', 'Cabang', 'MT', 'Rombel', 'Mapel', 'Jenis Sesi', 'Topik/Subtopik', 'Topik ✓', 'Attendance', 'Starchamps', 'Activity Score', 'Report Sessions', 'Foto KBM', 'Report WA', 'AuVi TV', 'LD', 'Admin %', 'Status'];
  const data = rows.map(function(r) {
    return [r.tanggal || '', r.cabang || '', r.mt || '', r.rombel || '', r.mapel || '', r.jenisSesi || '', r.topikSubtopik || '', r.topikSubtopikDone ? '✓' : '—', r.attendance ? '✓' : '—', r.starchamps ? '✓' : '—', r.activityScore ? '✓' : '—', r.reportSessions ? '✓' : '—', r.fotoKbm ? '✓' : '—', r.reportWa ? '✓' : '—', r.auviTvStatus || '', r.ldStatus || '', Number(r.adminPercent || 0) / 100, r.status || 'Belum lengkap'];
  });

  sheet.getRange(1, 1, info.length, 18).setValues(info.map(function(row) { const out = row.slice(); while (out.length < 18) out.push(''); return out; }));
  sheet.getRange(info.length + 1, 1, 1, headers.length).setValues([headers]);
  if (data.length) sheet.getRange(info.length + 2, 1, data.length, headers.length).setValues(data);

  styleSheetHeader_(sheet.getRange('A1:R1'));
  styleSheetHeader_(sheet.getRange('A12:R12'));
  if (data.length) {
    sheet.getRange(info.length + 2, 17, data.length, 1).setNumberFormat('0%');
    sheet.getRange(info.length + 1, 1, data.length + 1, headers.length).createFilter();
  }
  sheet.setFrozenRows(info.length + 1);
  sheet.autoResizeColumns(1, headers.length);
  sheet.setColumnWidth(2, 190);
  sheet.setColumnWidth(3, 190);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 150);
  sheet.setColumnWidth(7, 240);
  sheet.setColumnWidth(18, 120);

  return { success: true, spreadsheetId: ss.getId(), url: ss.getUrl(), filename: ss.getName() };
}

function styleSheetHeader_(range) {
  range.setFontWeight('bold').setBackground('#E8F0FE').setFontColor('#172033');
}

/** Existing Google Slides export kept for backward compatibility. */
function createPerformanceSlides_(report) {
  const title = String(report.title || 'MT Performance');
  const startDate = String(report.startDate || '');
  const endDate = String(report.endDate || '');
  const branch = String(report.branch || 'Semua Cabang');
  const rows = Array.isArray(report.rows) ? report.rows : [];
  const attention = Array.isArray(report.attention) ? report.attention : [];
  const top = report.top || null;
  const auvi = report.auvi || {};
  const ld = report.ld || {};

  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
  const presentation = SlidesApp.create(title + ' · ' + stamp);
  const first = presentation.getSlides()[0];
  clearSlide_(first);

  addTitle_(first, title);
  addText_(first, 'Laporan Performance MT', 55, 105, 620, 35, 20, '#64748B', false);
  addText_(first, 'Periode: ' + formatReportDate_(startDate) + ' – ' + formatReportDate_(endDate), 55, 175, 620, 30, 16, '#172033', true);
  addText_(first, 'Cabang sesi: ' + branch, 55, 215, 620, 30, 14, '#475569', false);
  addText_(first, 'Generated: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMMM yyyy, HH:mm'), 55, 330, 620, 24, 11, '#94A3B8', false);

  const kpiSlide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  addTitle_(kpiSlide, 'Performance Summary');
  addKpi_(kpiSlide, 'Average Session', String(report.avgSession || '0.0') + '%', 45, 105);
  addKpi_(kpiSlide, 'Top MT', top ? String(top.name || '—') : '—', 215, 105);
  addKpi_(kpiSlide, 'Needs Attention', String(attention.length), 385, 105);
  addKpi_(kpiSlide, 'Total Finalized', String(report.plannedTotal || 0), 555, 105);
  addText_(kpiSlide, 'Weekly Target', 45, 230, 650, 28, 17, '#172033', true);
  addText_(kpiSlide, 'AuVi TV: ' + String(auvi.realized || 0) + ' / ' + String(auvi.target || 0) + ' sesi (' + String(auvi.pct || 0) + '%)', 45, 275, 650, 25, 14, '#334155', false);
  addText_(kpiSlide, 'LD: ' + String(ld.realized || 0) + ' / ' + String(ld.target || 0) + ' rombel · eligible ' + String(ld.eligible || 0), 45, 310, 650, 25, 14, '#334155', false);

  const rankingSlide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  addTitle_(rankingSlide, 'Ranking MT');
  const rankingRows = Math.min(rows.length, 12);
  const table = rankingSlide.insertTable(rankingRows + 1, 7, 35, 100, 650, 360);
  ['#', 'MT', 'Base', 'Finalized', 'Attendance', 'Session', 'Admin'].forEach((h, c) => table.getCell(0, c).getText().setText(h));
  for (let i = 0; i < rankingRows; i++) {
    const r = rows[i] || {};
    [String(i + 1), String(r.name || '—'), String(r.base || '—'), String(r.planned || 0), String(r.realized || 0), String(r.session || 0) + '%', String(r.admin || 0) + '%'].forEach((v, c) => table.getCell(i + 1, c).getText().setText(v));
  }
  styleTable_(table, rankingRows + 1, 7);
  if (rows.length > rankingRows) addText_(rankingSlide, 'Menampilkan 12 MT teratas. Lihat dashboard untuk ranking lengkap.', 35, 475, 650, 20, 10, '#94A3B8', false);

  const attentionSlide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  addTitle_(attentionSlide, 'Needs Attention');
  if (!attention.length) {
    addText_(attentionSlide, '✓ All good', 55, 135, 600, 35, 22, '#16A34A', true);
    addText_(attentionSlide, 'Tidak ada MT yang perlu diperhatikan pada filter yang dipilih.', 55, 185, 600, 30, 14, '#475569', false);
  } else {
    const limit = Math.min(attention.length, 10);
    for (let i = 0; i < limit; i++) {
      const r = attention[i] || {};
      addText_(attentionSlide, (i + 1) + '. ' + String(r.name || '—'), 55, 115 + i * 34, 600, 22, 14, '#172033', true);
      addText_(attentionSlide, 'Session ' + String(r.session || 0) + '% · Admin ' + String(r.admin || 0) + '% · ' + String(r.base || '—'), 75, 136 + i * 34, 580, 18, 10, '#64748B', false);
    }
    if (attention.length > limit) addText_(attentionSlide, 'Dan ' + (attention.length - limit) + ' MT lainnya.', 55, 115 + limit * 34 + 10, 600, 20, 10, '#94A3B8', false);
  }

  DriveApp.getFileById(presentation.getId()).moveTo(DriveApp.getFolderById(BACKUP_FOLDER_ID));
  return { success: true, presentationId: presentation.getId(), url: presentation.getUrl(), filename: presentation.getName() };
}

function clearSlide_(slide) { slide.getPageElements().forEach(function(element) { element.remove(); }); }
function addTitle_(slide, text) { addText_(slide, text, 35, 30, 650, 45, 25, '#172033', true); }
function addText_(slide, text, left, top, width, height, fontSize, color, bold) {
  const shape = slide.insertTextBox(String(text), left, top, width, height);
  shape.getText().getTextStyle().setFontFamily('Arial').setFontSize(fontSize).setForegroundColor(color).setBold(bold);
  return shape;
}
function addKpi_(slide, label, value, left, top) {
  const box = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE, left, top, 150, 90);
  box.getFill().setSolidFill('#F8FAFC'); box.getLine().setSolidFill('#E2E8F0');
  box.getText().setText(String(label) + '\n' + String(value));
  box.getText().getTextStyle().setFontFamily('Arial').setForegroundColor('#172033').setFontSize(13);
  box.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  return box;
}
function styleTable_(table, rowCount, colCount) {
  for (let r = 0; r < rowCount; r++) for (let c = 0; c < colCount; c++) {
    const cell = table.getCell(r, c);
    cell.getText().getTextStyle().setFontFamily('Arial').setFontSize(r === 0 ? 9 : 8).setForegroundColor('#172033');
    if (r === 0) cell.getFill().setSolidFill('#E2E8F0');
  }
}
function formatReportDate_(value) {
  if (!value) return '—';
  try { return Utilities.formatDate(new Date(value + 'T00:00:00'), Session.getScriptTimeZone(), 'dd MMM yyyy'); }
  catch (e) { return value; }
}

function testSupabaseConnection() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL'); const key = props.getProperty('SUPABASE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL atau SUPABASE_KEY belum tersimpan.');
  const response = UrlFetchApp.fetch(url + '/rest/v1/branches?select=*&limit=1', { method: 'get', headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'User-Agent': BACKUP_USER_AGENT, 'Accept': 'application/json' }, muteHttpExceptions: true });
  Logger.log('STATUS: ' + response.getResponseCode()); Logger.log(response.getContentText());
}

function backupSupabaseToDrive() {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL'); const supabaseKey = props.getProperty('SUPABASE_KEY');
  if (!supabaseUrl) throw new Error('SUPABASE_URL belum disimpan.');
  if (!supabaseKey) throw new Error('SUPABASE_KEY belum disimpan.');
  const tables = ['audit_log', 'branches', 'master_mapel', 'master_mt', 'master_rombel', 'weekly_planning', 'master_product', 'master_program', 'sessions', 'session_admin'];
  const backup = { backup_at: new Date().toISOString(), source: 'Supabase', tables: {} };
  tables.forEach(function(table) { Logger.log('Mengambil tabel: ' + table); backup.tables[table] = getAllSupabaseRows(supabaseUrl, supabaseKey, table); });
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
  const filename = 'MT-Coach-Backup_' + timestamp + '.json';
  DriveApp.getFolderById(BACKUP_FOLDER_ID).createFile(filename, JSON.stringify(backup, null, 2), MimeType.JSON);
  Logger.log('BACKUP BERHASIL: ' + filename);
}

function getAllSupabaseRows(supabaseUrl, supabaseKey, table) {
  const allRows = []; const pageSize = 1000; let offset = 0;
  while (true) {
    const url = supabaseUrl + '/rest/v1/' + table + '?select=*&limit=' + pageSize + '&offset=' + offset;
    const response = UrlFetchApp.fetch(url, { method: 'get', headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey, 'User-Agent': BACKUP_USER_AGENT, 'Accept': 'application/json' }, muteHttpExceptions: true });
    const status = response.getResponseCode(); const body = response.getContentText();
    if (status < 200 || status >= 300) throw new Error('Gagal mengambil tabel ' + table + '. HTTP ' + status + ': ' + body);
    const rows = JSON.parse(body); if (!rows || rows.length === 0) break;
    allRows.push.apply(allRows, rows); if (rows.length < pageSize) break; offset += pageSize;
  }
  Logger.log(table + ': ' + allRows.length + ' data'); return allRows;
}
