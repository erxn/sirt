/**
 * Rumah Repository
 * Data access layer for Rumah (House) management
 */

// =============================================================================
// RUMAH REPOSITORY
// =============================================================================

function RumahRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.RUMAH, [
    'rumah_id',
    'dawis_id',
    'alamat',
    'blok',
    'nomor',
    'rt',
    'rw',
    'status_rumah',
    'keterangan',
    'is_active',
    'created_at',
    'updated_at',
    'created_by',
    'updated_by'
  ]);
}

RumahRepository.prototype = Object.create(BaseRepository.prototype);
RumahRepository.prototype.constructor = RumahRepository;

/**
 * Find Rumah by Dawis ID
 */
RumahRepository.prototype.findByDawis = function(dawisId) {
  return this.findAll({ dawis_id: dawisId, is_active: true });
};

/**
 * Count Rumah by Dawis ID
 */
RumahRepository.prototype.countByDawis = function(dawisId) {
  return this.findByDawis(dawisId).length;
};

/**
 * Find by Blok and Nomor
 */
RumahRepository.prototype.findByBlokNomor = function(blok, nomor) {
  var all = this.findAll({ blok: blok, nomor: nomor, is_active: true });
  return all.length > 0 ? all[0] : null;
};

/**
 * Check if Blok+Nomor exists
 */
RumahRepository.prototype.blokNomorExists = function(blok, nomor, excludeId) {
  var existing = this.findByBlokNomor(blok, nomor);
  if (!existing) return false;
  if (excludeId && existing.rumah_id === excludeId) return false;
  return true;
};

/**
 * Get all active Rumah
 */
RumahRepository.prototype.findAllActive = function() {
  return this.findAll({ is_active: true });
};

/**
 * Get Rumah with KK count
 */
RumahRepository.prototype.findAllWithStats = function() {
  var rumahData = this.findAllActive();
  var kkRepo = getKKRepository();
  var dawisRepo = getDawisRepository();
  
  return rumahData.map(function(rumah) {
    var kkCount = kkRepo.countByRumah(rumah.rumah_id);
    var dawis = dawisRepo.findById(rumah.dawis_id, 'dawis_id');
    rumah.jumlah_kk = kkCount;
    rumah.nama_dawis = dawis ? dawis.nama_dawis : '-';
    return rumah;
  });
};

/**
 * Create new Rumah
 */
RumahRepository.prototype.createRumah = function(data, userId) {
  var now = new Date().toISOString();
  var rumahData = {
    rumah_id: generateUUID(),
    dawis_id: data.dawis_id,
    alamat: data.alamat || '',
    blok: data.blok || '',
    nomor: data.nomor || '',
    rt: data.rt || '',
    rw: data.rw || '',
    status_rumah: data.status_rumah || 'dihuni',
    keterangan: data.keterangan || '',
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId
  };
  
  return this.create(rumahData);
};

/**
 * Update Rumah
 */
RumahRepository.prototype.updateRumah = function(rumahId, data, userId) {
  var updateData = {
    updated_at: new Date().toISOString(),
    updated_by: userId
  };
  
  if (data.dawis_id !== undefined) updateData.dawis_id = data.dawis_id;
  if (data.alamat !== undefined) updateData.alamat = data.alamat;
  if (data.blok !== undefined) updateData.blok = data.blok;
  if (data.nomor !== undefined) updateData.nomor = data.nomor;
  if (data.rt !== undefined) updateData.rt = data.rt;
  if (data.rw !== undefined) updateData.rw = data.rw;
  if (data.status_rumah !== undefined) updateData.status_rumah = data.status_rumah;
  if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  
  return this.update(rumahId, updateData, 'rumah_id');
};

/**
 * Soft delete Rumah
 */
RumahRepository.prototype.softDelete = function(rumahId, userId) {
  return this.updateRumah(rumahId, { is_active: false }, userId);
};

// Lazy-load singleton
var _rumahRepositoryInstance = null;

function getRumahRepository() {
  if (!_rumahRepositoryInstance) {
    _rumahRepositoryInstance = new RumahRepository();
  }
  return _rumahRepositoryInstance;
}
