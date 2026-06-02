/**
 * SIRT - Sistem Informasi RT
 * Setup Script
 */

/**
 * Main setup function - Run this first to initialize the system
 */
function setupSystem() {
  var ui = SpreadsheetApp.getUi();
  
  var response = ui.alert(
    'Setup Sistem',
    'Apakah Anda yakin ingin menginisialisasi sistem? Ini akan membuat sheet yang diperlukan dan data default.',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
    
    createSheets();
    initializeDefaultData();
    
    ui.alert('Setup Berhasil', 'Sistem berhasil diinisialisasi. Silakan deploy sebagai Web App.', ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', 'Gagal setup sistem: ' + error.message, ui.ButtonSet.OK);
    Logger.log('Setup error: ' + error.message);
  }
}

/**
 * Creates all required sheets
 */
function createSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheetsConfig = {
    'Users': ['user_id', 'name', 'email', 'password', 'role_id', 'is_active', 'created_at', 'updated_at', 'last_login'],
    'Roles': ['role_id', 'role_name', 'description'],
    'Permissions': ['permission_id', 'code', 'name', 'description'],
    'RolePermissions': ['role_id', 'permission_code'],
    'Dawis': ['dawis_id', 'nama_dawis', 'ketua_dawis', 'rt', 'rw', 'keterangan', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
    'Rumah': ['rumah_id', 'dawis_id', 'alamat', 'blok', 'nomor', 'rt', 'rw', 'status_rumah', 'keterangan', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
    'KK': ['kk_id', 'rumah_id', 'no_kk', 'kepala_keluarga', 'tanggal_terdaftar', 'status_tinggal', 'keterangan', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
    'Warga': ['warga_id', 'kk_id', 'nik', 'nama', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'agama', 'pendidikan', 'pekerjaan', 'status_perkawinan', 'status_dalam_kk', 'status_warga', 'no_telepon', 'email', 'keterangan', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
    'Pengurus': ['pengurus_id', 'warga_id', 'jabatan', 'periode_mulai', 'periode_selesai', 'is_active', 'created_at', 'updated_at'],
    'JenisIuran': ['jenis_iuran_id', 'nama', 'nominal', 'deskripsi', 'is_active', 'created_at', 'updated_at', 'deleted_at'],
    'TagihanIuran': ['tagihan_id', 'kk_id', 'jenis_iuran_id', 'periode', 'nominal', 'status', 'tanggal_jatuh_tempo', 'created_at', 'updated_at', 'deleted_at'],
    'PembayaranIuran': ['pembayaran_id', 'tagihan_id', 'tanggal_bayar', 'jumlah', 'metode_bayar', 'keterangan', 'created_by', 'created_at', 'updated_at', 'deleted_at'],
    'Penerimaan': ['penerimaan_id', 'tanggal', 'kategori', 'deskripsi', 'jumlah', 'sumber', 'created_by', 'created_at', 'updated_at'],
    'Pengeluaran': ['pengeluaran_id', 'tanggal', 'kategori', 'deskripsi', 'jumlah', 'penerima', 'bukti', 'created_by', 'created_at', 'updated_at'],
    'Surat': ['surat_id', 'nomor_surat', 'jenis_surat', 'perihal', 'tanggal_surat', 'pengirim', 'penerima', 'isi', 'status', 'approved_by', 'approved_at', 'file_url', 'created_by', 'created_at', 'updated_at'],
    'Pengumuman': ['pengumuman_id', 'judul', 'isi', 'kategori', 'is_popup', 'expired_at', 'created_by', 'created_at', 'updated_at'],
    'AuditLog': ['log_id', 'user_id', 'action', 'entity', 'entity_id', 'old_data', 'new_data', 'description', 'ip_address', 'user_agent', 'timestamp'],
    'Settings': ['key', 'value', 'description', 'updated_at']
  };
  
  for (var sheetName in sheetsConfig) {
    var headers = sheetsConfig[sheetName];
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    if (headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    }
    
    sheet.setFrozenRows(1);
  }
  
  var sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && sheet1.getLastRow() === 0) {
    ss.deleteSheet(sheet1);
  }
  
  Logger.log('Sheets created successfully');
}

/**
 * Initializes default data
 */
function initializeDefaultData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Initialize Roles
  var rolesSheet = ss.getSheetByName('Roles');
  if (rolesSheet.getLastRow() <= 1) {
    var roles = [
      ['super_admin', 'Super Admin', 'Full access to all features'],
      ['ketua_rt', 'Ketua RT', 'RT leader with approval rights'],
      ['sekretaris', 'Sekretaris', 'Secretary with data management rights'],
      ['bendahara', 'Bendahara', 'Treasurer with finance management rights'],
      ['warga', 'Warga', 'Regular resident with limited access']
    ];
    rolesSheet.getRange(2, 1, roles.length, 3).setValues(roles);
  }
  
  // Initialize default admin user
  var usersSheet = ss.getSheetByName('Users');
  if (usersSheet.getLastRow() <= 1) {
    var plainPassword = 'admin123';
    var hashedPassword = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plainPassword, Utilities.Charset.UTF_8);
    var hashedHex = hashedPassword.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
    
    var now = new Date().toISOString();
    
    var users = [
      [
        generateUUID(),
        'Administrator',
        'admin@sirt.local',
        hashedHex,
        'super_admin',
        true,
        now,
        now,
        ''
      ]
    ];
    usersSheet.getRange(2, 1, users.length, 9).setValues(users);
  }
  
  // Initialize default settings
  var settingsSheet = ss.getSheetByName('Settings');
  if (settingsSheet.getLastRow() <= 1) {
    var now = new Date().toISOString();
    var settings = [
      ['rt_name', 'RT 001', 'Nama RT', now],
      ['rw_name', 'RW 001', 'Nama RW', now],
      ['kelurahan', 'Kelurahan', 'Nama Kelurahan', now],
      ['kecamatan', 'Kecamatan', 'Nama Kecamatan', now],
      ['kota', 'Kota', 'Nama Kota', now],
      ['provinsi', 'Provinsi', 'Nama Provinsi', now]
    ];
    settingsSheet.getRange(2, 1, settings.length, 4).setValues(settings);
  }
  
  Logger.log('Default data initialized successfully');
}

/**
 * Creates custom menu in spreadsheet
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('SIRT')
    .addItem('Setup Sistem', 'setupSystem')
    .addItem('Reset Password Admin', 'resetAdminPassword')
    .addSeparator()
    .addItem('Buka Aplikasi', 'openWebApp')
    .addItem('Deploy Info', 'showDeployInfo')
    .addToUi();
}

/**
 * Opens the web app
 */
function openWebApp() {
  var url = ScriptApp.getService().getUrl();
  
  if (url) {
    var html = HtmlService.createHtmlOutput(
      '<script>window.open("' + url + '", "_blank");google.script.host.close();</script>'
    ).setWidth(200).setHeight(50);
    SpreadsheetApp.getUi().showModalDialog(html, 'Membuka aplikasi...');
  } else {
    SpreadsheetApp.getUi().alert(
      'Web App belum di-deploy',
      'Silakan deploy aplikasi terlebih dahulu melalui menu Extensions > Apps Script > Deploy > New deployment',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Shows deployment information
 */
function showDeployInfo() {
  var url = ScriptApp.getService().getUrl();
  var spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
  
  var message = url
    ? 'Web App URL:\n' + url + '\n\nSpreadsheet ID:\n' + spreadsheetId + '\n\nDefault Login:\nEmail: admin@sirt.local\nPassword: admin123'
    : 'Web App belum di-deploy.\n\nSpreadsheet ID:\n' + spreadsheetId + '\n\nDefault Login (setelah deploy):\nEmail: admin@sirt.local\nPassword: admin123';
  
  SpreadsheetApp.getUi().alert('Informasi Deployment', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Resets admin password
 */
function resetAdminPassword() {
  var ui = SpreadsheetApp.getUi();
  
  var response = ui.alert(
    'Reset Password Admin',
    'Apakah Anda yakin ingin mereset password admin ke "admin123"?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  try {
    var plainPassword = 'admin123';
    var hashedPassword = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plainPassword, Utilities.Charset.UTF_8);
    var hashedHex = hashedPassword.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
    
    var usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    var data = usersSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][2] === 'admin@sirt.local') {
        usersSheet.getRange(i + 1, 4).setValue(hashedHex);
        usersSheet.getRange(i + 1, 8).setValue(new Date().toISOString());
        ui.alert('Berhasil', 'Password admin berhasil direset.', ui.ButtonSet.OK);
        return;
      }
    }
    
    ui.alert('Gagal', 'User admin tidak ditemukan.', ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', 'Gagal reset password: ' + error.message, ui.ButtonSet.OK);
  }
}
