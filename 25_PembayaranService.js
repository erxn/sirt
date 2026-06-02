/**
 * =====================================================
 * PEMBAYARAN SERVICE
 * =====================================================
 * Business logic for Pembayaran Iuran management
 */

var PembayaranService = {
  
  /**
   * Get all pembayaran with related data
   */
  getAll: function(filters) {
    try {
      var items = getPembayaranRepository().findAll();
      
      // Apply filters
      if (filters) {
        if (filters.tagihan_id) {
          items = items.filter(function(item) { return item.tagihan_id === filters.tagihan_id; });
        }
        if (filters.periode) {
          items = items.filter(function(item) {
            return item.tanggal_bayar && item.tanggal_bayar.substring(0, 7) === filters.periode;
          });
        }
        if (filters.metode_bayar) {
          items = items.filter(function(item) { return item.metode_bayar === filters.metode_bayar; });
        }
      }
      
      // Enrich with tagihan data
      var tagihanRepo = getTagihanRepository();
      var kkRepo = getKKRepository();
      var jenisIuranRepo = getJenisIuranRepository();
      
      items = items.map(function(item) {
        var tagihan = tagihanRepo.findById(item.tagihan_id);
        var kk = tagihan ? kkRepo.findById(tagihan.kk_id) : null;
        var jenisIuran = tagihan ? jenisIuranRepo.findById(tagihan.jenis_iuran_id) : null;
        
        return {
          pembayaran_id: item.pembayaran_id,
          tagihan_id: item.tagihan_id,
          no_kk: kk ? kk.no_kk : '-',
          kepala_keluarga: kk ? kk.kepala_keluarga : '-',
          jenis_iuran: jenisIuran ? jenisIuran.nama : '-',
          periode: tagihan ? tagihan.periode : '-',
          tanggal_bayar: item.tanggal_bayar,
          jumlah: item.jumlah,
          metode_bayar: item.metode_bayar,
          keterangan: item.keterangan,
          created_at: item.created_at
        };
      });
      
      return { success: true, data: items };
    } catch (error) {
      Logger.log('PembayaranService.getAll error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Get pembayaran by tagihan ID
   */
  getByTagihanId: function(tagihanId) {
    try {
      var items = getPembayaranRepository().findByTagihanId(tagihanId);
      return { success: true, data: items };
    } catch (error) {
      Logger.log('PembayaranService.getByTagihanId error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Create pembayaran
   */
  create: function(data) {
    try {
      // Validation
      if (!data.tagihan_id) {
        return { success: false, message: 'Tagihan wajib dipilih' };
      }
      if (!data.jumlah || isNaN(parseFloat(data.jumlah)) || parseFloat(data.jumlah) <= 0) {
        return { success: false, message: 'Jumlah pembayaran harus berupa angka positif' };
      }
      if (!data.tanggal_bayar) {
        return { success: false, message: 'Tanggal bayar wajib diisi' };
      }
      
      // Get tagihan
      var tagihan = getTagihanRepository().findById(data.tagihan_id);
      if (!tagihan) {
        return { success: false, message: 'Tagihan tidak ditemukan' };
      }
      
      // Check if already lunas
      if (tagihan.status === 'LUNAS') {
        return { success: false, message: 'Tagihan sudah lunas' };
      }
      
      // Calculate total paid
      var totalPaid = getPembayaranRepository().getTotalByTagihanId(data.tagihan_id);
      var newTotal = totalPaid + parseFloat(data.jumlah);
      var nominal = parseFloat(tagihan.nominal);
      
      // Check if overpaid
      if (newTotal > nominal) {
        return { success: false, message: 'Jumlah pembayaran melebihi sisa tagihan. Sisa: Rp ' + formatNumber(nominal - totalPaid) };
      }
      
      var user = SessionService.getCurrentUser();
      var now = new Date().toISOString();
      
      var newPembayaran = {
        pembayaran_id: generateUUID(),
        tagihan_id: data.tagihan_id,
        tanggal_bayar: data.tanggal_bayar,
        jumlah: parseFloat(data.jumlah),
        metode_bayar: data.metode_bayar || 'TUNAI',
        keterangan: data.keterangan || '',
        created_by: user ? user.user_id : '',
        created_at: now,
        updated_at: now,
        deleted_at: ''
      };
      
      var created = getPembayaranRepository().create(newPembayaran);
      
      // Update tagihan status
      var newStatus = newTotal >= nominal ? 'LUNAS' : 'SEBAGIAN';
      getTagihanRepository().update(data.tagihan_id, {
        status: newStatus,
        updated_at: now
      });
      
      // Audit log
      if (user) {
        getAuditLogRepository().logCreate(user.user_id, 'Pembayaran', created.pembayaran_id, {
          tagihan_id: data.tagihan_id,
          jumlah: data.jumlah,
          metode: data.metode_bayar
        });
      }
      
      return {
        success: true,
        message: 'Pembayaran berhasil dicatat. Status tagihan: ' + newStatus,
        data: created
      };
    } catch (error) {
      Logger.log('PembayaranService.create error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Delete pembayaran
   */
  delete: function(id) {
    try {
      var existing = getPembayaranRepository().findById(id);
      if (!existing) {
        return { success: false, message: 'Pembayaran tidak ditemukan' };
      }
      
      var tagihanId = existing.tagihan_id;
      var jumlah = parseFloat(existing.jumlah);
      
      // Soft delete pembayaran
      getPembayaranRepository().softDelete(id);
      
      // Recalculate tagihan status
      var totalPaid = getPembayaranRepository().getTotalByTagihanId(tagihanId);
      var tagihan = getTagihanRepository().findById(tagihanId);
      
      if (tagihan) {
        var nominal = parseFloat(tagihan.nominal);
        var newStatus = totalPaid <= 0 ? 'BELUM_BAYAR' : (totalPaid >= nominal ? 'LUNAS' : 'SEBAGIAN');
        
        getTagihanRepository().update(tagihanId, {
          status: newStatus,
          updated_at: new Date().toISOString()
        });
      }
      
      // Audit log
      var user = SessionService.getCurrentUser();
      if (user) {
        getAuditLogRepository().logDelete(user.user_id, 'Pembayaran', id, existing);
      }
      
      return { success: true, message: 'Pembayaran berhasil dihapus' };
    } catch (error) {
      Logger.log('PembayaranService.delete error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Get statistics
   */
  getStats: function(periode) {
    try {
      var stats = periode 
        ? getPembayaranRepository().getStatsByPeriode(periode)
        : getPembayaranRepository().getStats();
      return { success: true, data: stats };
    } catch (error) {
      Logger.log('PembayaranService.getStats error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Get dashboard data for iuran
   */
  getDashboardData: function(periode) {
    try {
      var tagihanStats = getTagihanRepository().getStatsByPeriode(periode);
      var pembayaranStats = getPembayaranRepository().getStatsByPeriode(periode);
      
      return {
        success: true,
        data: {
          totalTagihan: tagihanStats.total,
          totalNominal: tagihanStats.totalNominal,
          belumBayar: tagihanStats.belumBayar,
          sebagian: tagihanStats.sebagian,
          lunas: tagihanStats.lunas,
          totalPembayaran: pembayaranStats.total,
          totalTerbayar: pembayaranStats.totalJumlah,
          persentaseTerbayar: tagihanStats.totalNominal > 0 
            ? Math.round((pembayaranStats.totalJumlah / tagihanStats.totalNominal) * 100) 
            : 0
        }
      };
    } catch (error) {
      Logger.log('PembayaranService.getDashboardData error: ' + error.message);
      return { success: false, message: error.message };
    }
  }
};

// API functions
function getPembayaranList(filters) {
  return PembayaranService.getAll(filters);
}

function getPembayaranByTagihanId(tagihanId) {
  return PembayaranService.getByTagihanId(tagihanId);
}

function createPembayaran(data) {
  return PembayaranService.create(data);
}

function deletePembayaran(id) {
  return PembayaranService.delete(id);
}

function getPembayaranStats(periode) {
  return PembayaranService.getStats(periode);
}

function getIuranDashboardData(periode) {
  return PembayaranService.getDashboardData(periode);
}
