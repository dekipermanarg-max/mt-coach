const BACKUP_FOLDER_ID = '1TRHf0Wa3gBn2I5KdSvBJabSMGFJKy7og';
const BACKUP_USER_AGENT = 'MT-Coach-Backup/1.0';

/** Web App endpoint for backup POST and Google Slides export GET/POST. */
function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);
    if (payload.action === 'export_performance_slides') return jsonResponse_(createPerformanceSlides_(payload.report || {}));

    const folder = DriveApp.getFolderById(BACKUP_FOLDER_ID);
    const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = 'MT-Coach_Backup_' + date + '.json';
    folder.createFile(filename, raw, MimeType.JSON);
    return jsonResponse_({ success: true, filename: filename });
  } catch (error) {
    return jsonResponse_({ success: false, error: error.message });
  }
}

/** GET endpoint used by the static GitHub Pages dashboard for Export ke Google Slides. */
function doGet(e) {
  try {
    if (!e || !e.parameter || e.parameter.action !== 'export_performance_slides') {
      return HtmlService.createHtmlOutput('<h3>MT Coach Backup</h3><p>Web App aktif.</p>');
    }

    const payload = e.parameter.payload ? JSON.parse(e.parameter.payload) : {};
    const result = createPerformanceSlides_(payload);
    const safeUrl = String(result.url || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const html = '<!doctype html><html><head><base target="_top"><meta http-equiv="refresh" content="0;url=' + safeUrl + '"></head><body style="font-family:Arial;padding:30px"><h3>Google Slides berhasil dibuat.</h3><p>Membuka presentasi…</p><p><a href="' + safeUrl + '" target="_top">Klik di sini jika belum terbuka</a></p></body></html>';
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

/** Membuat Google Slides dari data Performance yang sedang terlihat di dashboard. */
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
