/**
 * Dawis Service
 * Business logic for Dawis management
 */

var DawisService = {
  
  /**
   * Get all Dawis with statistics
   */
  getAll: function() {
    try {
      var data = getDawisRepository().findAllWithStats();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      Logger.log('DawisService.getAll error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil data Dawis'
      };
    }
  },
  
  /**
   * Get Dawis by ID
   */
  getById: function(dawisId) {
    try {
      var dawis = getDawisRepository().findById(dawisId, 'dawis_id');
      if (!dawis) {
        return {
          success: false,
          message: 'Dawis tidak ditemukan'
        };
      }
      return {
        success: true,
        data: dawis
      };
    } catch (error) {
      Logger.log('DawisService.getById error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil data Dawis'
      };
    }
  },
  
  /**
   * Create new Dawis
   */
  create: function(data) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }

      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'dawis', 'create')) {      
        return { success: false, message: 'Anda tidak memiliki akses untuk menambah Dawis' };
      }
      
      // Validate
      if (!data.nama_dawis || data.nama_dawis.trim() === '') {
        return { success: false, message: 'Nama Dawis wajib diisi' };
      }
      
      // Check duplicate
      if (getDawisRepository().nameExists(data.nama_dawis)) {
        return { success: false, message: 'Nama Dawis sudah terdaftar' };
      }
      
      // Create
      var dawis = getDawisRepository().createDawis(data, user.user_id);
      
      // Audit log
      getAuditLogRepository().logCreate(user.user_id, 'Dawis', dawis.dawis_id, {
        nama_dawis: dawis.nama_dawis
      });
      
      return {
        success: true,
        message: 'Dawis berhasil ditambahkan',
        data: dawis
      };
    } catch (error) {
      Logger.log('DawisService.create error: ' + error.message);
      return {
        success: false,
        message: 'Gagal menambahkan Dawis'
      };
    }
  },
  
  /**
   * Update Dawis
   */
  update: function(dawisId, data) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }
      
      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'dawis', 'update')) {
        return { success: false, message: 'Anda tidak memiliki akses untuk mengubah Dawis' };
      }
      
      // Check exists
      var existing = getDawisRepository().findById(dawisId, 'dawis_id');
      if (!existing) {
        return { success: false, message: 'Dawis tidak ditemukan' };
      }
      
      // Check duplicate name
      if (data.nama_dawis && getDawisRepository().nameExists(data.nama_dawis, dawisId)) {
        return { success: false, message: 'Nama Dawis sudah terdaftar' };
      }
      
      // Update
      var updated = getDawisRepository().updateDawis(dawisId, data, user.user_id);
      
      // Audit log
      getAuditLogRepository().logUpdate(user.user_id, 'Dawis', dawisId, existing, updated);
      
      return {
        success: true,
        message: 'Dawis berhasil diperbarui',
        data: updated
      };
    } catch (error) {
      Logger.log('DawisService.update error: ' + error.message);
      return {
        success: false,
        message: 'Gagal memperbarui Dawis'
      };
    }
  },
  
  /**
   * Delete Dawis (soft delete)
   */
  delete: function(dawisId) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }
      
      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'dawis', 'delete')) {
        return { success: false, message: 'Anda tidak memiliki akses untuk menghapus Dawis' };
      }
      
      // Check exists
      var existing = getDawisRepository().findById(dawisId, 'dawis_id');
      if (!existing) {
        return { success: false, message: 'Dawis tidak ditemukan' };
      }
      
      // Check if has Rumah
      var rumahCount = getRumahRepository().countByDawis(dawisId);
      if (rumahCount > 0) {
        return { success: false, message: 'Tidak dapat menghapus Dawis yang masih memiliki data Rumah' };
      }
      
      // Soft delete
      getDawisRepository().softDelete(dawisId, user.user_id);
      
      // Audit log
      getAuditLogRepository().logDelete(user.user_id, 'Dawis', dawisId, existing);
      
      return {
        success: true,
        message: 'Dawis berhasil dihapus'
      };
    } catch (error) {
      Logger.log('DawisService.delete error: ' + error.message);
      return {
        success: false,
        message: 'Gagal menghapus Dawis'
      };
    }
  },
  
  /**
   * Get Dawis for dropdown
   */
  getDropdownList: function() {
    try {
      var data = getDawisRepository().findAllActive();
      return {
        success: true,
        data: data.map(function(d) {
          return { value: d.dawis_id, label: d.nama_dawis };
        })
      };
    } catch (error) {
      Logger.log('DawisService.getDropdownList error: ' + error.message);
      return { success: false, data: [] };
    }
  }
};

// =============================================================================
// PUBLIC API FUNCTIONS (callable from client-side)
// =============================================================================

function getDawisList() {
  return DawisService.getAll();
}

function getDawisById(dawisId) {
  return DawisService.getById(dawisId);
}

function createDawis(data) {
  return DawisService.create(data);
}

function updateDawis(dawisId, data) {
  return DawisService.update(dawisId, data);
}

function deleteDawis(dawisId) {
  return DawisService.delete(dawisId);
}

function getDawisDropdown() {
  return DawisService.getDropdownList();
}
