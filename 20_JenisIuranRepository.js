/**
 * =====================================================
 * JENIS IURAN REPOSITORY
 * =====================================================
 * Data access layer for Jenis Iuran (fee types)
 */

function JenisIuranRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.JENIS_IURAN, [
    'jenis_iuran_id',
    'nama',
    'nominal',
    'deskripsi',
    'is_active',
    'created_at',
    'updated_at',
    'deleted_at'
  ]);
}

JenisIuranRepository.prototype = Object.create(BaseRepository.prototype);
JenisIuranRepository.prototype.constructor = JenisIuranRepository;

/**
 * Find all active jenis iuran
 */
JenisIuranRepository.prototype.findAllActive = function() {
  var all = this.findAll();
  return all.filter(function(item) {
    return item.is_active === true || item.is_active === 'TRUE';
  });
};

/**
 * Find by nama
 */
JenisIuranRepository.prototype.findByNama = function(nama) {
  var all = this.findAll();
  for (var i = 0; i < all.length; i++) {
    if (all[i].nama && all[i].nama.toLowerCase() === nama.toLowerCase()) {
      return all[i];
    }
  }
  return null;
};

/**
 * Check if nama exists (excluding specific ID)
 */
JenisIuranRepository.prototype.namaExists = function(nama, excludeId) {
  var existing = this.findByNama(nama);
  if (!existing) return false;
  if (excludeId && existing.jenis_iuran_id === excludeId) return false;
  return true;
};

/**
 * Get statistics
 */
JenisIuranRepository.prototype.getStats = function() {
  var all = this.findAll();
  var active = 0;
  var inactive = 0;
  var totalNominal = 0;
  
  for (var i = 0; i < all.length; i++) {
    if (all[i].is_active === true || all[i].is_active === 'TRUE') {
      active++;
      totalNominal += parseFloat(all[i].nominal) || 0;
    } else {
      inactive++;
    }
  }
  
  return {
    total: all.length,
    active: active,
    inactive: inactive,
    totalNominal: totalNominal
  };
};

// Lazy-load singleton
var _jenisIuranRepositoryInstance = null;

function getJenisIuranRepository() {
  if (!_jenisIuranRepositoryInstance) {
    _jenisIuranRepositoryInstance = new JenisIuranRepository();
  }
  return _jenisIuranRepositoryInstance;
}
