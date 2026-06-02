/**
 * =====================================================
 * TAGIHAN REPOSITORY
 * =====================================================
 * Data access layer for Tagihan Iuran (invoices)
 */

function TagihanRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.TAGIHAN_IURAN, [
    'tagihan_id',
    'kk_id',
    'jenis_iuran_id',
    'periode',
    'nominal',
    'status',
    'tanggal_jatuh_tempo',
    'created_at',
    'updated_at',
    'deleted_at'
  ]);
}

TagihanRepository.prototype = Object.create(BaseRepository.prototype);
TagihanRepository.prototype.constructor = TagihanRepository;

/**
 * Find by KK ID
 */
TagihanRepository.prototype.findByKKId = function(kkId) {
  var all = this.findAll();
  return all.filter(function(item) {
    return item.kk_id === kkId;
  });
};

/**
 * Find by Jenis Iuran ID
 */
TagihanRepository.prototype.findByJenisIuranId = function(jenisIuranId) {
  var all = this.findAll();
  return all.filter(function(item) {
    return item.jenis_iuran_id === jenisIuranId;
  });
};

/**
 * Find by periode
 */
TagihanRepository.prototype.findByPeriode = function(periode) {
  var all = this.findAll();
  return all.filter(function(item) {
    return item.periode === periode;
  });
};

/**
 * Find by status
 */
TagihanRepository.prototype.findByStatus = function(status) {
  var all = this.findAll();
  return all.filter(function(item) {
    return item.status === status;
  });
};

/**
 * Find unpaid tagihan
 */
TagihanRepository.prototype.findUnpaid = function() {
  var all = this.findAll();
  return all.filter(function(item) {
    return item.status === 'BELUM_BAYAR' || item.status === 'SEBAGIAN';
  });
};

/**
 * Check if tagihan exists for KK and periode and jenis
 */
TagihanRepository.prototype.exists = function(kkId, jenisIuranId, periode) {
  var all = this.findAll();
  for (var i = 0; i < all.length; i++) {
    if (all[i].kk_id === kkId && 
        all[i].jenis_iuran_id === jenisIuranId && 
        all[i].periode === periode) {
      return true;
    }
  }
  return false;
};

/**
 * Get statistics
 */
TagihanRepository.prototype.getStats = function() {
  var all = this.findAll();
  var stats = {
    total: all.length,
    belumBayar: 0,
    sebagian: 0,
    lunas: 0,
    totalNominal: 0,
    totalTerbayar: 0
  };
  
  for (var i = 0; i < all.length; i++) {
    var nominal = parseFloat(all[i].nominal) || 0;
    stats.totalNominal += nominal;
    
    if (all[i].status === 'BELUM_BAYAR') {
      stats.belumBayar++;
    } else if (all[i].status === 'SEBAGIAN') {
      stats.sebagian++;
    } else if (all[i].status === 'LUNAS') {
      stats.lunas++;
      stats.totalTerbayar += nominal;
    }
  }
  
  return stats;
};

/**
 * Get statistics by periode
 */
TagihanRepository.prototype.getStatsByPeriode = function(periode) {
  var tagihan = this.findByPeriode(periode);
  var stats = {
    total: tagihan.length,
    belumBayar: 0,
    sebagian: 0,
    lunas: 0,
    totalNominal: 0
  };
  
  for (var i = 0; i < tagihan.length; i++) {
    stats.totalNominal += parseFloat(tagihan[i].nominal) || 0;
    if (tagihan[i].status === 'BELUM_BAYAR') stats.belumBayar++;
    else if (tagihan[i].status === 'SEBAGIAN') stats.sebagian++;
    else if (tagihan[i].status === 'LUNAS') stats.lunas++;
  }
  
  return stats;
};

// Lazy-load singleton
var _tagihanRepositoryInstance = null;

function getTagihanRepository() {
  if (!_tagihanRepositoryInstance) {
    _tagihanRepositoryInstance = new TagihanRepository();
  }
  return _tagihanRepositoryInstance;
}
