/**
 * KK (Kartu Keluarga) Repository
 * Data access layer for KK management
 */

// =============================================================================
// KK REPOSITORY
// =============================================================================

function KKRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.KK, [
    'kk_id',
    'rumah_id',
    'no_kk',
    'kepala_keluarga',
    'tanggal_terdaftar',
    'status_tinggal',
    'keterangan',
    'is_active',
    'created_at',
    'updated_at',
    'created_by',
    'updated_by'
  ]);
}

KKRepository.prototype = Object.create(BaseRepository.prototype);
KKRepository.prototype.constructor = KKRepository;

/**
 * Find KK by Rumah ID
 */
KKRepository.prototype.findByRumah = function(rumahId) {
  return this.findAll({ rumah_id: rumahId, is_active: true });
};

/**
 * Count KK by Rumah ID
 */
KKRepository.prototype.countByRumah = function(rumahId) {
  return this.findByRumah(rumahId).length;
};

/**
 * Find by No KK
 */
KKRepository.prototype.findByNoKK = function(noKK) {
  return this.findOne({ no_kk: noKK });
};

/**
 * Check if No KK exists
 */
KKRepository.prototype.noKKExists = function(noKK, excludeId) {
  var existing = this.findByNoKK(noKK);
  if (!existing) return false;
  if (excludeId && existing.kk_id === excludeId) return false;
  return true;
};

/**
 * Get all active KK
 */
KKRepository.prototype.findAllActive = function() {
  return this.findAll({ is_active: true });
};

/**
 * Get KK with Warga count and Rumah info
 */
KKRepository.prototype.findAllWithStats = function() {
  var kkData = this.findAllActive();
  var wargaRepo = getWargaRepository();
  var rumahRepo = getRumahRepository();
  var dawisRepo = getDawisRepository();
  
  return kkData.map(function(kk) {
    var wargaCount = wargaRepo.countByKK(kk.kk_id);
    var rumah = rumahRepo.findById(kk.rumah_id, 'rumah_id');
    var dawis = rumah ? dawisRepo.findById(rumah.dawis_id, 'dawis_id') : null;
    
    kk.jumlah_warga = wargaCount;
    kk.alamat_rumah = rumah ? (rumah.blok + '-' + rumah.nomor) : '-';
    kk.nama_dawis = dawis ? dawis.nama_dawis : '-';
    return kk;
  });
};

/**
 * Create new KK
 */
KKRepository.prototype.createKK = function(data, userId) {
  var now = new Date().toISOString();
  var kkData = {
    kk_id: generateUUID(),
    rumah_id: data.rumah_id,
    no_kk: data.no_kk,
    kepala_keluarga: data.kepala_keluarga || '',
    tanggal_terdaftar: data.tanggal_terdaftar || now.split('T')[0],
    status_tinggal: data.status_tinggal || 'tetap',
    keterangan: data.keterangan || '',
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId
  };
  
  return this.create(kkData);
};

/**
 * Update KK
 */
KKRepository.prototype.updateKK = function(kkId, data, userId) {
  var updateData = {
    updated_at: new Date().toISOString(),
    updated_by: userId
  };
  
  if (data.rumah_id !== undefined) updateData.rumah_id = data.rumah_id;
  if (data.no_kk !== undefined) updateData.no_kk = data.no_kk;
  if (data.kepala_keluarga !== undefined) updateData.kepala_keluarga = data.kepala_keluarga;
  if (data.tanggal_terdaftar !== undefined) updateData.tanggal_terdaftar = data.tanggal_terdaftar;
  if (data.status_tinggal !== undefined) updateData.status_tinggal = data.status_tinggal;
  if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  
  return this.update(kkId, updateData, 'kk_id');
};

/**
 * Soft delete KK
 */
KKRepository.prototype.softDelete = function(kkId, userId) {
  return this.updateKK(kkId, { is_active: false }, userId);
};

// Lazy-load singleton
var _kkRepositoryInstance = null;

function getKKRepository() {
  if (!_kkRepositoryInstance) {
    _kkRepositoryInstance = new KKRepository();
  }
  return _kkRepositoryInstance;
}
