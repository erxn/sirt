/**
 * =====================================================
 * PEMBAYARAN REPOSITORY
 * =====================================================
 * Data access layer for Pembayaran Iuran (payments)
 */

function PembayaranRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.PEMBAYARAN_IURAN, [
    'pembayaran_id',
    'tagihan_id',
    'tanggal_bayar',
    'jumlah',
    'metode_bayar',
    'keterangan',
    'created_by',
    'created_at',
    'updated_at',
    'deleted_at'
  ]);
}

PembayaranRepository.prototype = Object.create(BaseRepository.prototype);
PembayaranRepository.prototype.constructor = PembayaranRepository;

/**
 * Find by Tagihan ID
 */
PembayaranRepository.prototype.findByTagihanId = function(tagihanId) {
  var all = this.findAll();
  return all.filter(function(item) {
    return item.tagihan_id === tagihanId;
  });
};

/**
 * Get total pembayaran for a tagihan
 */
PembayaranRepository.prototype.getTotalByTagihanId = function(tagihanId) {
  var pembayaran = this.findByTagihanId(tagihanId);
  var total = 0;
  for (var i = 0; i < pembayaran.length; i++) {
    total += parseFloat(pembayaran[i].jumlah) || 0;
  }
  return total;
};

/**
 * Find by date range
 */
PembayaranRepository.prototype.findByDateRange = function(startDate, endDate) {
  var all = this.findAll();
  return all.filter(function(item) {
    var tanggal = new Date(item.tanggal_bayar);
    return tanggal >= new Date(startDate) && tanggal <= new Date(endDate);
  });
};

/**
 * Find by periode (YYYY-MM)
 */
PembayaranRepository.prototype.findByPeriode = function(periode) {
  var all = this.findAll();
  return all.filter(function(item) {
    return item.tanggal_bayar && item.tanggal_bayar.substring(0, 7) === periode;
  });
};

/**
 * Get statistics
 */
PembayaranRepository.prototype.getStats = function() {
  var all = this.findAll();
  var stats = {
    total: all.length,
    totalJumlah: 0,
    byMetode: {}
  };
  
  for (var i = 0; i < all.length; i++) {
    var jumlah = parseFloat(all[i].jumlah) || 0;
    stats.totalJumlah += jumlah;
    
    var metode = all[i].metode_bayar || 'TUNAI';
    if (!stats.byMetode[metode]) {
      stats.byMetode[metode] = { count: 0, total: 0 };
    }
    stats.byMetode[metode].count++;
    stats.byMetode[metode].total += jumlah;
  }
  
  return stats;
};

/**
 * Get statistics by periode
 */
PembayaranRepository.prototype.getStatsByPeriode = function(periode) {
  var pembayaran = this.findByPeriode(periode);
  var stats = {
    total: pembayaran.length,
    totalJumlah: 0
  };
  
  for (var i = 0; i < pembayaran.length; i++) {
    stats.totalJumlah += parseFloat(pembayaran[i].jumlah) || 0;
  }
  
  return stats;
};

// Lazy-load singleton
var _pembayaranRepositoryInstance = null;

function getPembayaranRepository() {
  if (!_pembayaranRepositoryInstance) {
    _pembayaranRepositoryInstance = new PembayaranRepository();
  }
  return _pembayaranRepositoryInstance;
}
