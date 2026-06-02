/**
 * Warga Repository
 * Data access layer for Warga (Citizen) management
 */

// =============================================================================
// WARGA REPOSITORY
// =============================================================================

function WargaRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.WARGA, [
    'warga_id',
    'kk_id',
    'nik',
    'nama',
    'tempat_lahir',
    'tanggal_lahir',
    'jenis_kelamin',
    'agama',
    'pendidikan',
    'pekerjaan',
    'status_perkawinan',
    'status_dalam_kk',
    'status_warga',
    'no_telepon',
    'email',
    'keterangan',
    'is_active',
    'created_at',
    'updated_at',
    'created_by',
    'updated_by'
  ]);
}

WargaRepository.prototype = Object.create(BaseRepository.prototype);
WargaRepository.prototype.constructor = WargaRepository;

/**
 * Find Warga by KK ID
 */
WargaRepository.prototype.findByKK = function(kkId) {
  return this.findAll({ kk_id: kkId, is_active: true });
};

/**
 * Count Warga by KK ID
 */
WargaRepository.prototype.countByKK = function(kkId) {
  return this.findByKK(kkId).length;
};

/**
 * Find by NIK
 */
WargaRepository.prototype.findByNIK = function(nik) {
  return this.findOne({ nik: nik });
};

/**
 * Check if NIK exists
 */
WargaRepository.prototype.nikExists = function(nik, excludeId) {
  var existing = this.findByNIK(nik);
  if (!existing) return false;
  if (excludeId && existing.warga_id === excludeId) return false;
  return true;
};

/**
 * Get all active Warga
 */
WargaRepository.prototype.findAllActive = function() {
  return this.findAll({ is_active: true });
};

/**
 * Get Warga with KK and Rumah info
 */
WargaRepository.prototype.findAllWithStats = function() {
  var wargaData = this.findAllActive();
  var kkRepo = getKKRepository();
  var rumahRepo = getRumahRepository();
  var dawisRepo = getDawisRepository();
  
  return wargaData.map(function(warga) {
    var kk = kkRepo.findById(warga.kk_id, 'kk_id');
    var rumah = kk ? rumahRepo.findById(kk.rumah_id, 'rumah_id') : null;
    var dawis = rumah ? dawisRepo.findById(rumah.dawis_id, 'dawis_id') : null;
    
    warga.no_kk = kk ? kk.no_kk : '-';
    warga.alamat_rumah = rumah ? (rumah.blok + '-' + rumah.nomor) : '-';
    warga.nama_dawis = dawis ? dawis.nama_dawis : '-';
    return warga;
  });
};

/**
 * Search Warga
 */
WargaRepository.prototype.search = function(query) {
  var allData = this.findAllActive();
  var lowerQuery = query.toLowerCase();
  
  return allData.filter(function(warga) {
    return (warga.nama && warga.nama.toLowerCase().indexOf(lowerQuery) !== -1) ||
           (warga.nik && warga.nik.indexOf(query) !== -1) ||
           (warga.no_telepon && warga.no_telepon.indexOf(query) !== -1);
  });
};

/**
 * Filter Warga by criteria
 */
WargaRepository.prototype.filter = function(filters) {
  var allData = this.findAllActive();
  
  return allData.filter(function(warga) {
    var match = true;
    
    if (filters.kk_id && warga.kk_id !== filters.kk_id) match = false;
    if (filters.jenis_kelamin && warga.jenis_kelamin !== filters.jenis_kelamin) match = false;
    if (filters.status_warga && warga.status_warga !== filters.status_warga) match = false;
    if (filters.status_perkawinan && warga.status_perkawinan !== filters.status_perkawinan) match = false;
    if (filters.agama && warga.agama !== filters.agama) match = false;
    
    return match;
  });
};

/**
 * Create new Warga
 */
WargaRepository.prototype.createWarga = function(data, userId) {
  var now = new Date().toISOString();
  var wargaData = {
    warga_id: generateUUID(),
    kk_id: data.kk_id,
    nik: data.nik,
    nama: data.nama,
    tempat_lahir: data.tempat_lahir || '',
    tanggal_lahir: data.tanggal_lahir || '',
    jenis_kelamin: data.jenis_kelamin || 'L',
    agama: data.agama || 'Islam',
    pendidikan: data.pendidikan || '',
    pekerjaan: data.pekerjaan || '',
    status_perkawinan: data.status_perkawinan || 'Belum Kawin',
    status_dalam_kk: data.status_dalam_kk || 'Anggota Keluarga',
    status_warga: data.status_warga || 'tetap',
    no_telepon: data.no_telepon || '',
    email: data.email || '',
    keterangan: data.keterangan || '',
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId
  };
  
  return this.create(wargaData);
};

/**
 * Update Warga
 */
WargaRepository.prototype.updateWarga = function(wargaId, data, userId) {
  var updateData = {
    updated_at: new Date().toISOString(),
    updated_by: userId
  };
  
  var fields = ['kk_id', 'nik', 'nama', 'tempat_lahir', 'tanggal_lahir', 
                'jenis_kelamin', 'agama', 'pendidikan', 'pekerjaan',
                'status_perkawinan', 'status_dalam_kk', 'status_warga',
                'no_telepon', 'email', 'keterangan', 'is_active'];
  
  fields.forEach(function(field) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });
  
  return this.update(wargaId, updateData, 'warga_id');
};

/**
 * Soft delete Warga
 */
WargaRepository.prototype.softDelete = function(wargaId, userId) {
  return this.updateWarga(wargaId, { is_active: false }, userId);
};

/**
 * Get statistics
 */
WargaRepository.prototype.getStatistics = function() {
  var allData = this.findAllActive();
  
  var stats = {
    total: allData.length,
    laki_laki: 0,
    perempuan: 0,
    tetap: 0,
    kontrak: 0,
    kos: 0
  };
  
  allData.forEach(function(warga) {
    if (warga.jenis_kelamin === 'L') stats.laki_laki++;
    else if (warga.jenis_kelamin === 'P') stats.perempuan++;
    
    if (warga.status_warga === 'tetap') stats.tetap++;
    else if (warga.status_warga === 'kontrak') stats.kontrak++;
    else if (warga.status_warga === 'kos') stats.kos++;
  });
  
  return stats;
};

// Lazy-load singleton
var _wargaRepositoryInstance = null;

function getWargaRepository() {
  if (!_wargaRepositoryInstance) {
    _wargaRepositoryInstance = new WargaRepository();
  }
  return _wargaRepositoryInstance;
}
