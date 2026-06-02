/**
 * Rumah Service
 * Business logic for Rumah management
 */

var RumahService = {
  
  /**
   * Get all Rumah with statistics
   */
  getAll: function() {
    try {
      var data = getRumahRepository().findAllWithStats();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      Logger.log('RumahService.getAll error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil data Rumah'
      };
    }
  },
  
  /**
   * Get Rumah by ID
   */
  getById: function(rumahId) {
    try {
      var rumah = getRumahRepository().findById(rumahId, 'rumah_id');
      if (!rumah) {
        return {
          success: false,
          message: 'Rumah tidak ditemukan'
        };
      }
      
      // Add Dawis name
      var dawis = getDawisRepository().findById(rumah.dawis_id, 'dawis_id');
      rumah.nama_dawis = dawis ? dawis.nama_dawis : '-';
      
      return {
        success: true,
        data: rumah
      };
    } catch (error) {
      Logger.log('RumahService.getById error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil data Rumah'
      };
    }
  },
  
  /**
   * Get Rumah by Dawis
   */
  getByDawis: function(dawisId) {
    try {
      var data = getRumahRepository().findByDawis(dawisId);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      Logger.log('RumahService.getByDawis error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil data Rumah'
      };
    }
  },
  
  /**
   * Create new Rumah
   */
  create: function(data) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }
      
      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'rumah', 'create')) {
        return { success: false, message: 'Anda tidak memiliki akses untuk menambah Rumah' };
      }
      
      // Validate
      if (!data.dawis_id) {
        return { success: false, message: 'Dawis wajib dipilih' };
      }
      
      if (!data.blok || !data.nomor) {
        return { success: false, message: 'Blok dan Nomor wajib diisi' };
      }
      
      // Check Dawis exists
      var dawis = getDawisRepository().findById(data.dawis_id, 'dawis_id');
      if (!dawis || !dawis.is_active) {
        return { success: false, message: 'Dawis tidak valid' };
      }
      
      // Check duplicate
      if (getRumahRepository().blokNomorExists(data.blok, data.nomor)) {
        return { success: false, message: 'Blok dan Nomor sudah terdaftar' };
      }
      
      // Create
      var rumah = getRumahRepository().createRumah(data, user.user_id);
      
      // Audit log
      getAuditLogRepository().logCreate(user.user_id, 'Rumah', rumah.rumah_id, {
        blok: rumah.blok,
        nomor: rumah.nomor
      });
      
      return {
        success: true,
        message: 'Rumah berhasil ditambahkan',
        data: rumah
      };
    } catch (error) {
      Logger.log('RumahService.create error: ' + error.message);
      return {
        success: false,
        message: 'Gagal menambahkan Rumah'
      };
    }
  },
  
  /**
   * Update Rumah
   */
  update: function(rumahId, data) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }
      
      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'rumah', 'update')) {
        return { success: false, message: 'Anda tidak memiliki akses untuk mengubah Rumah' };
      }
      
      // Check exists
      var existing = getRumahRepository().findById(rumahId, 'rumah_id');
      if (!existing) {
        return { success: false, message: 'Rumah tidak ditemukan' };
      }
      
      // Check duplicate Blok+Nomor
      if (data.blok && data.nomor && getRumahRepository().blokNomorExists(data.blok, data.nomor, rumahId)) {
        return { success: false, message: 'Blok dan Nomor sudah terdaftar' };
      }
      
      // Update
      var updated = getRumahRepository().updateRumah(rumahId, data, user.user_id);
      
      // Audit log
      getAuditLogRepository().logUpdate(user.user_id, 'Rumah', rumahId, existing, updated);
      
      return {
        success: true,
        message: 'Rumah berhasil diperbarui',
        data: updated
      };
    } catch (error) {
      Logger.log('RumahService.update error: ' + error.message);
      return {
        success: false,
        message: 'Gagal memperbarui Rumah'
      };
    }
  },
  
  /**
   * Delete Rumah (soft delete)
   */
  delete: function(rumahId) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }
      
      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'rumah', 'delete')) {
        return { success: false, message: 'Anda tidak memiliki akses untuk menghapus Rumah' };
      }
      
      // Check exists
      var existing = getRumahRepository().findById(rumahId, 'rumah_id');
      if (!existing) {
        return { success: false, message: 'Rumah tidak ditemukan' };
      }
      
      // Check if has KK
      var kkCount = getKKRepository().countByRumah(rumahId);
      if (kkCount > 0) {
        return { success: false, message: 'Tidak dapat menghapus Rumah yang masih memiliki data KK' };
      }
      
      // Soft delete
      getRumahRepository().softDelete(rumahId, user.user_id);
      
      // Audit log
      getAuditLogRepository().logDelete(user.user_id, 'Rumah', rumahId, existing);
      
      return {
        success: true,
        message: 'Rumah berhasil dihapus'
      };
    } catch (error) {
      Logger.log('RumahService.delete error: ' + error.message);
      return {
        success: false,
        message: 'Gagal menghapus Rumah'
      };
    }
  },
  
  /**
   * Get Rumah for dropdown
   */
  getDropdownList: function(dawisId) {
    try {
      var data = dawisId 
        ? getRumahRepository().findByDawis(dawisId)
        : getRumahRepository().findAllActive();
      
      return {
        success: true,
        data: data.map(function(r) {
          return { value: r.rumah_id, label: r.blok + '-' + r.nomor };
        })
      };
    } catch (error) {
      Logger.log('RumahService.getDropdownList error: ' + error.message);
      return { success: false, data: [] };
    }
  }
};

// =============================================================================
// PUBLIC API FUNCTIONS
// =============================================================================

function getRumahList() {
  return RumahService.getAll();
}

function getRumahById(rumahId) {
  return RumahService.getById(rumahId);
}

function getRumahByDawis(dawisId) {
  return RumahService.getByDawis(dawisId);
}

function createRumah(data) {
  return RumahService.create(data);
}

function updateRumah(rumahId, data) {
  return RumahService.update(rumahId, data);
}

function deleteRumah(rumahId) {
  return RumahService.delete(rumahId);
}

function getRumahDropdown(dawisId) {
  return RumahService.getDropdownList(dawisId);
}
