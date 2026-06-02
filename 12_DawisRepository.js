/**
 * Dawis Repository
 * Data access layer for Dawis (Dasa Wisma) management
 */

// =============================================================================
// DAWIS REPOSITORY
// =============================================================================

function DawisRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.DAWIS);
}

DawisRepository.prototype = Object.create(BaseRepository.prototype);
DawisRepository.prototype.constructor = DawisRepository;

/**
 * Find Dawis by name
 */
DawisRepository.prototype.findByName = function(namaDawis) {
  return this.findOne({ nama_dawis: namaDawis });
};

/**
 * Check if Dawis name exists
 */
DawisRepository.prototype.nameExists = function(namaDawis, excludeId) {
  var existing = this.findByName(namaDawis);
  if (!existing) return false;
  if (excludeId && existing.dawis_id === excludeId) return false;
  return true;
};

/**
 * Get all active Dawis
 */
DawisRepository.prototype.findAllActive = function() {
  return this.findAll({ is_active: true });
};

/**
 * Get Dawis with Rumah count
 */
DawisRepository.prototype.findAllWithStats = function() {
  var dawisData = this.findAllActive();
  var rumahRepo = getRumahRepository();
  
  return dawisData.map(function(dawis) {
    var rumahCount = rumahRepo.countByDawis(dawis.dawis_id);
    dawis.jumlah_rumah = rumahCount;
    return dawis;
  });
};

/**
 * Create new Dawis
 */
DawisRepository.prototype.createDawis = function(data, userId) {
  var now = new Date().toISOString();
  var dawisData = {
    dawis_id: generateUUID(),
    nama_dawis: data.nama_dawis,
    ketua_dawis: data.ketua_dawis || '',
    rt: data.rt || '',
    rw: data.rw || '',
    keterangan: data.keterangan || '',
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: userId,
    updated_by: userId
  };
  
  return this.create(dawisData);
};

/**
 * Update Dawis
 */
DawisRepository.prototype.updateDawis = function(dawisId, data, userId) {
  var updateData = {
    updated_at: new Date().toISOString(),
    updated_by: userId
  };
  
  if (data.nama_dawis !== undefined) updateData.nama_dawis = data.nama_dawis;
  if (data.ketua_dawis !== undefined) updateData.ketua_dawis = data.ketua_dawis;
  if (data.rt !== undefined) updateData.rt = data.rt;
  if (data.rw !== undefined) updateData.rw = data.rw;
  if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  
  return this.update(dawisId, updateData, 'dawis_id');
};

/**
 * Soft delete Dawis
 */
DawisRepository.prototype.softDelete = function(dawisId, userId) {
  return this.updateDawis(dawisId, { is_active: false }, userId);
};

// Lazy-load singleton
var _dawisRepositoryInstance = null;

function getDawisRepository() {
  if (!_dawisRepositoryInstance) {
    _dawisRepositoryInstance = new DawisRepository();
  }
  return _dawisRepositoryInstance;
}
