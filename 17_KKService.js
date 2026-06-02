/**
 * KK Service
 * Business logic for KK (Kartu Keluarga) management
 */

var KKService = {
  
  /**
   * Get all KK with statistics
   */
  getAll: function() {
    try {
      var data = getKKRepository().findAllWithStats();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      Logger.log('KKService.getAll error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil data KK'
      };
    }
  },
  
  /**
   * Get KK by ID
   */
  getById: function(kkId) {
    try {
      var kk = getKKRepository().findById(kkId, 'kk_id');
      if (!kk) {
        return {
          success: false,
          message: 'KK tidak ditemukan'
        };
      }
      
      // Add related info
      var rumah = getRumahRepository().findById(kk.rumah_id, 'rumah_id');
      var dawis = rumah ? getDawisRepository().findById(rumah.dawis_id, 'dawis_id') : null;
      kk.alamat_rumah = rumah ? (rumah.blok + '-' + rumah.nomor) : '-';
      kk.nama_dawis = dawis ? dawis.nama_dawis : '-';
      
      return {
        success: true,
        data: kk
      };
    } catch (error) {
      Logger.log('KKService.getById error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil data KK'
      };
    }
  },
  
  /**
   * Get KK by Rumah
   */
  getByRumah: function(rumahId) {
    try {
      var data = getKKRepository().findByRumah(rumahId);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      Logger.log('KKService.getByRumah error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil data KK'
      };
    }
  },
  
  /**
   * Create new KK
   */
  create: function(data) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }
      
      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'kk', 'create')) {
        return { success: false, message: 'Anda tidak memiliki akses untuk menambah KK' };
      }
      
      // Validate
      if (!data.rumah_id) {
        return { success: false, message: 'Rumah wajib dipilih' };
      }
      
      if (!data.no_kk || data.no_kk.trim() === '') {
        return { success: false, message: 'Nomor KK wajib diisi' };
      }
      
      // Validate No KK format (16 digits)
      if (!/^\d{16}$/.test(data.no_kk)) {
        return { success: false, message: 'Nomor KK harus 16 digit angka' };
      }
      
      // Check Rumah exists
      var rumah = getRumahRepository().findById(data.rumah_id, 'rumah_id');
      if (!rumah || !rumah.is_active) {
        return { success: false, message: 'Rumah tidak valid' };
      }
      
      // Check duplicate No KK
      if (getKKRepository().noKKExists(data.no_kk)) {
        return { success: false, message: 'Nomor KK sudah terdaftar' };
      }
      
      // Create
      var kk = getKKRepository().createKK(data, user.user_id);
      
      // Audit log
      getAuditLogRepository().logCreate(user.user_id, 'KK', kk.kk_id, {
        no_kk: kk.no_kk
      });
      
      return {
        success: true,
        message: 'KK berhasil ditambahkan',
        data: kk
      };
    } catch (error) {
      Logger.log('KKService.create error: ' + error.message);
      return {
        success: false,
        message: 'Gagal menambahkan KK'
      };
    }
  },
  
  /**
   * Update KK
   */
  update: function(kkId, data) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }
      
      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'kk', 'update')) {
        return { success: false, message: 'Anda tidak memiliki akses untuk mengubah KK' };
      }
      
      // Check exists
      var existing = getKKRepository().findById(kkId, 'kk_id');
      if (!existing) {
        return { success: false, message: 'KK tidak ditemukan' };
      }
      
      // Validate No KK format if provided
      if (data.no_kk && !/^\d{16}$/.test(data.no_kk)) {
        return { success: false, message: 'Nomor KK harus 16 digit angka' };
      }
      
      // Check duplicate No KK
      if (data.no_kk && getKKRepository().noKKExists(data.no_kk, kkId)) {
        return { success: false, message: 'Nomor KK sudah terdaftar' };
      }
      
      // Update
      var updated = getKKRepository().updateKK(kkId, data, user.user_id);
      
      // Audit log
      getAuditLogRepository().logUpdate(user.user_id, 'KK', kkId, existing, updated);
      
      return {
        success: true,
        message: 'KK berhasil diperbarui',
        data: updated
      };
    } catch (error) {
      Logger.log('KKService.update error: ' + error.message);
      return {
        success: false,
        message: 'Gagal memperbarui KK'
      };
    }
  },
  
  /**
   * Delete KK (soft delete)
   */
  delete: function(kkId) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }
      
      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'kk', 'delete')) {
        return { success: false, message: 'Anda tidak memiliki akses untuk menghapus KK' };
      }
      
      // Check exists
      var existing = getKKRepository().findById(kkId, 'kk_id');
      if (!existing) {
        return { success: false, message: 'KK tidak ditemukan' };
      }
      
      // Check if has Warga
      var wargaCount = getWargaRepository().countByKK(kkId);
      if (wargaCount > 0) {
        return { success: false, message: 'Tidak dapat menghapus KK yang masih memiliki data Warga' };
      }
      
      // Soft delete
      getKKRepository().softDelete(kkId, user.user_id);
      
      // Audit log
      getAuditLogRepository().logDelete(user.user_id, 'KK', kkId, existing);
      
      return {
        success: true,
        message: 'KK berhasil dihapus'
      };
    } catch (error) {
      Logger.log('KKService.delete error: ' + error.message);
      return {
        success: false,
        message: 'Gagal menghapus KK'
      };
    }
  },
  
  /**
   * Get KK for dropdown
   */
  getDropdownList: function(rumahId) {
    try {
      var data = rumahId
        ? getKKRepository().findByRumah(rumahId)
        : getKKRepository().findAllActive();
      
      return {
        success: true,
        data: data.map(function(k) {
          return { value: k.kk_id, label: k.no_kk + ' - ' + k.kepala_keluarga };
        })
      };
    } catch (error) {
      Logger.log('KKService.getDropdownList error: ' + error.message);
      return { success: false, data: [] };
    }
  }
};

// =============================================================================
// PUBLIC API FUNCTIONS
// =============================================================================

function getKKList() {
  return KKService.getAll();
}

function getKKById(kkId) {
  return KKService.getById(kkId);
}

function getKKByRumah(rumahId) {
  return KKService.getByRumah(rumahId);
}

function createKK(data) {
  return KKService.create(data);
}

function updateKK(kkId, data) {
  return KKService.update(kkId, data);
}

function deleteKK(kkId) {
  return KKService.delete(kkId);
}

function getKKDropdown(rumahId) {
  return KKService.getDropdownList(rumahId);
}
