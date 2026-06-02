/**
 * =====================================================
 * TAGIHAN SERVICE
 * =====================================================
 * Business logic for Tagihan Iuran management
 */

var TagihanService = {
  
  /**
   * Get all tagihan with related data
   */
  getAll: function(filters) {
    try {
      var items = getTagihanRepository().findAll();
      
      // Apply filters
      if (filters) {
        if (filters.periode) {
          items = items.filter(function(item) { return item.periode === filters.periode; });
        }
        if (filters.status) {
          items = items.filter(function(item) { return item.status === filters.status; });
        }
        if (filters.kk_id) {
          items = items.filter(function(item) { return item.kk_id === filters.kk_id; });
        }
        if (filters.jenis_iuran_id) {
          items = items.filter(function(item) { return item.jenis_iuran_id === filters.jenis_iuran_id; });
        }
      }
      
      // Enrich with related data
      var kkRepo = getKKRepository();
      var jenisIuranRepo = getJenisIuranRepository();
      
      items = items.map(function(item) {
        var kk = kkRepo.findById(item.kk_id);
        var jenisIuran = jenisIuranRepo.findById(item.jenis_iuran_id);
        return {
          tagihan_id: item.tagihan_id,
          kk_id: item.kk_id,
          no_kk: kk ? kk.no_kk : '-',
          kepala_keluarga: kk ? kk.kepala_keluarga : '-',
          jenis_iuran_id: item.jenis_iuran_id,
          jenis_iuran_nama: jenisIuran ? jenisIuran.nama : '-',
          periode: item.periode,
          nominal: item.nominal,
          status: item.status,
          tanggal_jatuh_tempo: item.tanggal_jatuh_tempo,
          created_at: item.created_at
        };
      });
      
      return { success: true, data: items };
    } catch (error) {
      Logger.log('TagihanService.getAll error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Get by ID
   */
  getById: function(id) {
    try {
      var item = getTagihanRepository().findById(id);
      if (!item) {
        return { success: false, message: 'Tagihan tidak ditemukan' };
      }
      return { success: true, data: item };
    } catch (error) {
      Logger.log('TagihanService.getById error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Generate tagihan for a periode
   */
  generateTagihan: function(jenisIuranId, periode, tanggalJatuhTempo) {
    try {
      // Validate jenis iuran
      var jenisIuran = getJenisIuranRepository().findById(jenisIuranId);
      if (!jenisIuran) {
        return { success: false, message: 'Jenis iuran tidak ditemukan' };
      }
      if (!jenisIuran.is_active) {
        return { success: false, message: 'Jenis iuran tidak aktif' };
      }
      
      // Validate periode format (YYYY-MM)
      if (!periode || !/^\d{4}-\d{2}$/.test(periode)) {
        return { success: false, message: 'Format periode harus YYYY-MM' };
      }
      
      // Get all active KK
      var kkList = getKKRepository().findAll();
      var tagihanRepo = getTagihanRepository();
      var now = new Date().toISOString();
      var created = 0;
      var skipped = 0;
      
      for (var i = 0; i < kkList.length; i++) {
        var kk = kkList[i];
        
        // Check if tagihan already exists
        if (tagihanRepo.exists(kk.kk_id, jenisIuranId, periode)) {
          skipped++;
          continue;
        }
        
        var newTagihan = {
          tagihan_id: generateUUID(),
          kk_id: kk.kk_id,
          jenis_iuran_id: jenisIuranId,
          periode: periode,
          nominal: jenisIuran.nominal,
          status: 'BELUM_BAYAR',
          tanggal_jatuh_tempo: tanggalJatuhTempo || '',
          created_at: now,
          updated_at: now,
          deleted_at: ''
        };
        
        tagihanRepo.create(newTagihan);
        created++;
      }
      
      // Audit log
      var user = SessionService.getCurrentUser();
      if (user) {
        getAuditLogRepository().logCreate(user.user_id, 'Tagihan', 'BATCH', {
          jenis_iuran: jenisIuran.nama,
          periode: periode,
          created: created,
          skipped: skipped
        });
      }
      
      return {
        success: true,
        message: 'Tagihan berhasil digenerate. Dibuat: ' + created + ', Dilewati: ' + skipped,
        data: { created: created, skipped: skipped }
      };
    } catch (error) {
      Logger.log('TagihanService.generateTagihan error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Create single tagihan
   */
  create: function(data) {
    try {
      // Validation
      if (!data.kk_id) {
        return { success: false, message: 'KK wajib dipilih' };
      }
      if (!data.jenis_iuran_id) {
        return { success: false, message: 'Jenis iuran wajib dipilih' };
      }
      if (!data.periode || !/^\d{4}-\d{2}$/.test(data.periode)) {
        return { success: false, message: 'Format periode harus YYYY-MM' };
      }
      
      // Check if already exists
      if (getTagihanRepository().exists(data.kk_id, data.jenis_iuran_id, data.periode)) {
        return { success: false, message: 'Tagihan untuk KK dan periode ini sudah ada' };
      }
      
      var jenisIuran = getJenisIuranRepository().findById(data.jenis_iuran_id);
      if (!jenisIuran) {
        return { success: false, message: 'Jenis iuran tidak ditemukan' };
      }
      
      var now = new Date().toISOString();
      var newTagihan = {
        tagihan_id: generateUUID(),
        kk_id: data.kk_id,
        jenis_iuran_id: data.jenis_iuran_id,
        periode: data.periode,
        nominal: data.nominal || jenisIuran.nominal,
        status: 'BELUM_BAYAR',
        tanggal_jatuh_tempo: data.tanggal_jatuh_tempo || '',
        created_at: now,
        updated_at: now,
        deleted_at: ''
      };
      
      var created = getTagihanRepository().create(newTagihan);
      
      // Audit log
      var user = SessionService.getCurrentUser();
      if (user) {
        getAuditLogRepository().logCreate(user.user_id, 'Tagihan', created.tagihan_id, newTagihan);
      }
      
      return {
        success: true,
        message: 'Tagihan berhasil ditambahkan',
        data: created
      };
    } catch (error) {
      Logger.log('TagihanService.create error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Update tagihan status
   */
  updateStatus: function(id, status) {
    try {
      var existing = getTagihanRepository().findById(id);
      if (!existing) {
        return { success: false, message: 'Tagihan tidak ditemukan' };
      }
      
      var validStatuses = ['BELUM_BAYAR', 'SEBAGIAN', 'LUNAS'];
      if (validStatuses.indexOf(status) === -1) {
        return { success: false, message: 'Status tidak valid' };
      }
      
      var updated = getTagihanRepository().update(id, {
        status: status,
        updated_at: new Date().toISOString()
      });
      
      return {
        success: true,
        message: 'Status tagihan berhasil diupdate',
        data: updated
      };
    } catch (error) {
      Logger.log('TagihanService.updateStatus error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Delete tagihan
   */
  delete: function(id) {
    try {
      var existing = getTagihanRepository().findById(id);
      if (!existing) {
        return { success: false, message: 'Tagihan tidak ditemukan' };
      }
      
      // Check if has pembayaran
      var pembayaran = getPembayaranRepository().findByTagihanId(id);
      if (pembayaran && pembayaran.length > 0) {
        return { success: false, message: 'Tagihan tidak dapat dihapus karena sudah ada pembayaran' };
      }
      
      getTagihanRepository().softDelete(id);
      
      // Audit log
      var user = SessionService.getCurrentUser();
      if (user) {
        getAuditLogRepository().logDelete(user.user_id, 'Tagihan', id, existing);
      }
      
      return { success: true, message: 'Tagihan berhasil dihapus' };
    } catch (error) {
      Logger.log('TagihanService.delete error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Get statistics
   */
  getStats: function(periode) {
    try {
      var stats = periode 
        ? getTagihanRepository().getStatsByPeriode(periode)
        : getTagihanRepository().getStats();
      return { success: true, data: stats };
    } catch (error) {
      Logger.log('TagihanService.getStats error: ' + error.message);
      return { success: false, message: error.message };
    }
  }
};

// API functions
function getTagihanList(filters) {
  return TagihanService.getAll(filters);
}

function getTagihanById(id) {
  return TagihanService.getById(id);
}

function generateTagihanBatch(jenisIuranId, periode, tanggalJatuhTempo) {
  return TagihanService.generateTagihan(jenisIuranId, periode, tanggalJatuhTempo);
}

function createTagihan(data) {
  return TagihanService.create(data);
}

function updateTagihanStatus(id, status) {
  return TagihanService.updateStatus(id, status);
}

function deleteTagihan(id) {
  return TagihanService.delete(id);
}

function getTagihanStats(periode) {
  return TagihanService.getStats(periode);
}
