const BACKUP_FOLDER_ID = '1TRHf0Wa3gBn2I5KdSvBJabSMGFJKy7og';

const BACKUP_USER_AGENT = 'MT-Coach-Backup/1.0';

function doPost(e) {
  try {
    const folder = DriveApp.getFolderById(BACKUP_FOLDER_ID);
    const data = e.postData.contents;
    const timestamp = new Date();
    const date = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `MT-Coach_Backup_${date}.json`;

    folder.createFile(filename, data, MimeType.JSON);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, filename: filename }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function testSupabaseConnection() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_KEY');

  if (!url || !key) {
    throw new Error('SUPABASE_URL atau SUPABASE_KEY belum tersimpan.');
  }

  const testUrl = url + '/rest/v1/branches?select=*&limit=1';
  const response = UrlFetchApp.fetch(testUrl, {
    method: 'get',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'User-Agent': BACKUP_USER_AGENT,
      'Accept': 'application/json'
    },
    muteHttpExceptions: true
  });

  Logger.log('STATUS: ' + response.getResponseCode());
  Logger.log(response.getContentText());
}

function backupSupabaseToDrive() {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_KEY');

  if (!supabaseUrl) throw new Error('SUPABASE_URL belum disimpan.');
  if (!supabaseKey) throw new Error('SUPABASE_KEY belum disimpan.');

  const tables = [
    'audit_log',
    'branches',
    'master_mapel',
    'master_mt',
    'master_rombel',
    'weekly_planning',
    // Mathchamps
    'master_product',
    'master_program',
    'sessions',
    'session_admin'
  ];

  const backup = {
    backup_at: new Date().toISOString(),
    source: 'Supabase',
    tables: {}
  };

  tables.forEach(function(table) {
    Logger.log('Mengambil tabel: ' + table);
    backup.tables[table] = getAllSupabaseRows(supabaseUrl, supabaseKey, table);
  });

  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
  const filename = 'MT-Coach-Backup_' + timestamp + '.json';
  const folder = DriveApp.getFolderById(BACKUP_FOLDER_ID);

  folder.createFile(filename, JSON.stringify(backup, null, 2), MimeType.JSON);
  Logger.log('BACKUP BERHASIL: ' + filename);
}

function getAllSupabaseRows(supabaseUrl, supabaseKey, table) {
  const allRows = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const url = supabaseUrl + '/rest/v1/' + table + '?select=*&limit=' + pageSize + '&offset=' + offset;
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'User-Agent': BACKUP_USER_AGENT,
        'Accept': 'application/json'
      },
      muteHttpExceptions: true
    });

    const status = response.getResponseCode();
    const body = response.getContentText();

    if (status < 200 || status >= 300) {
      throw new Error('Gagal mengambil tabel ' + table + '. HTTP ' + status + ': ' + body);
    }

    const rows = JSON.parse(body);
    if (!rows || rows.length === 0) break;

    allRows.push.apply(allRows, rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  Logger.log(table + ': ' + allRows.length + ' data');
  return allRows;
}
