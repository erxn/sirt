/**
 * Warga Service
 * Business logic for Warga (Citizen) management
 */

var WargaService = {
  
  /**
   * Get all Warga with statistics
   */
  getAll: function() {
    try {
      var data = getWargaRepository().findAllWithStats();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      Logger.log('WargaService.getAll error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil data Warga'
      };
    }
  },
  
  /**
   * Get Warga by ID
   */
  getById: function(wargaId) {
    try {
      var warga = getWargaRepository().findById(wargaId, 'warga_id');
      if (!warga) {
        return {
          success: false,
          message: 'Warga tidak ditemukan'
        };
      }
      
      // Add related info
      var kk = getKKRepository().findById(warga.kk_id, 'kk_id');
      var rumah = kk ? getRumahRepository().findById(kk.rumah_id, 'rumah_id') : null;
      var dawis = rumah ? getDawisRepository().findById(rumah.dawis_id, 'dawis_id') : null;
      
      warga.no_kk = kk ? kk.no_kk : '-';
      warga.alamat_rumah = rumah ? (rumah.blok + '-' + rumah.nomor) : '-';
      warga.nama_dawis = dawis ? dawis.nama_dawis : '-';
      
      return {
        success: true,
        data: warga
      };
    } catch (error) {
      Logger.log('WargaService.getById error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil data Warga'
      };
    }
  },
  
  /**
   * Get Warga by KK
   */
  getByKK: function(kkId) {
    try {
      var data = getWargaRepository().findByKK(kkId);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      Logger.log('WargaService.getByKK error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil data Warga'
      };
    }
  },
  
  /**
   * Search Warga
   */
  search: function(query) {
    try {
      var data = getWargaRepository().search(query);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      Logger.log('WargaService.search error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mencari data Warga'
      };
    }
  },
  
  /**
   * Filter Warga
   */
  filter: function(filters) {
    try {
      var data = getWargaRepository().filter(filters);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      Logger.log('WargaService.filter error: ' + error.message);
      return {
        success: false,
        message: 'Gagal filter data Warga'
      };
    }
  },
  
  /**
   * Create new Warga
   */
  create: function(data) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }
      
      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'warga', 'create')) {
        return { success: false, message: 'Anda tidak memiliki akses untuk menambah Warga' };
      }
      
      // Validate required fields
      if (!data.kk_id) {
        return { success: false, message: 'KK wajib dipilih' };
      }
      
      if (!data.nik || data.nik.trim() === '') {
        return { success: false, message: 'NIK wajib diisi' };
      }
      
      if (!data.nama || data.nama.trim() === '') {
        return { success: false, message: 'Nama wajib diisi' };
      }
      
      // Validate NIK format (16 digits)
      if (!/^\d{16}$/.test(data.nik)) {
        return { success: false, message: 'NIK harus 16 digit angka' };
      }
      
      // Check KK exists
      var kk = getKKRepository().findById(data.kk_id, 'kk_id');
      if (!kk || !kk.is_active) {
        return { success: false, message: 'KK tidak valid' };
      }
      
      // Check duplicate NIK
      if (getWargaRepository().nikExists(data.nik)) {
        return { success: false, message: 'NIK sudah terdaftar' };
      }
      
      // Create
      var warga = getWargaRepository().createWarga(data, user.user_id);
      
      // Audit log
      getAuditLogRepository().logCreate(user.user_id, 'Warga', warga.warga_id, {
        nik: warga.nik,
        nama: warga.nama
      });
      
      return {
        success: true,
        message: 'Warga berhasil ditambahkan',
        data: warga
      };
    } catch (error) {
      Logger.log('WargaService.create error: ' + error.message);
      return {
        success: false,
        message: 'Gagal menambahkan Warga'
      };
    }
  },
  
  /**
   * Update Warga
   */
  update: function(wargaId, data) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }
      
      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'warga', 'update')) {
        return { success: false, message: 'Anda tidak memiliki akses untuk mengubah Warga' };
      }
      
      // Check exists
      var existing = getWargaRepository().findById(wargaId, 'warga_id');
      if (!existing) {
        return { success: false, message: 'Warga tidak ditemukan' };
      }
      
      // Validate NIK format if provided
      if (data.nik && !/^\d{16}$/.test(data.nik)) {
        return { success: false, message: 'NIK harus 16 digit angka' };
      }
      
      // Check duplicate NIK
      if (data.nik && getWargaRepository().nikExists(data.nik, wargaId)) {
        return { success: false, message: 'NIK sudah terdaftar' };
      }
      
      // Update
      var updated = getWargaRepository().updateWarga(wargaId, data, user.user_id);
      
      // Audit log
      getAuditLogRepository().logUpdate(user.user_id, 'Warga', wargaId, existing, updated);
      
      return {
        success: true,
        message: 'Warga berhasil diperbarui',
        data: updated
      };
    } catch (error) {
      Logger.log('WargaService.update error: ' + error.message);
      return {
        success: false,
        message: 'Gagal memperbarui Warga'
      };
    }
  },
  
  /**
   * Delete Warga (soft delete)
   */
  delete: function(wargaId) {
    try {
      var user = SessionService.getCurrentUser();
      if (!user) {
        return { success: false, message: 'Anda harus login terlebih dahulu' };
      }
      
      // Check permission
      if (!RBACService.hasPermission(user.role_id, 'warga', 'delete')) {
        return { success: false, message: 'Anda tidak memiliki akses untuk menghapus Warga' };
      }
      
      // Check exists
      var existing = getWargaRepository().findById(wargaId, 'warga_id');
      if (!existing) {
        return { success: false, message: 'Warga tidak ditemukan' };
      }
      
      // Soft delete
      getWargaRepository().softDelete(wargaId, user.user_id);
      
      // Audit log
      getAuditLogRepository().logDelete(user.user_id, 'Warga', wargaId, existing);
      
      return {
        success: true,
        message: 'Warga berhasil dihapus'
      };
    } catch (error) {
      Logger.log('WargaService.delete error: ' + error.message);
      return {
        success: false,
        message: 'Gagal menghapus Warga'
      };
    }
  },
  
  /**
   * Get statistics
   */
  getStatistics: function() {
    try {
      var stats = getWargaRepository().getStatistics();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      Logger.log('WargaService.getStatistics error: ' + error.message);
      return {
        success: false,
        message: 'Gagal mengambil statistik Warga'
      };
    }
  },
  
  /**
   * Get Warga for dropdown
   */
  getDropdownList: function(kkId) {
    try {
      var data = kkId
        ? getWargaRepository().findByKK(kkId)
        : getWargaRepository().findAllActive();
      
      return {
        success: true,
        data: data.map(function(w) {
          return { value: w.warga_id, label: w.nama + ' (' + w.nik + ')' };
        })
      };
    } catch (error) {
      Logger.log('WargaService.getDropdownList error: ' + error.message);
      return { success: false, data: [] };
    }
  }
};

// =============================================================================
// PUBLIC API FUNCTIONS
// =============================================================================

function getWargaList() {
  return WargaService.getAll();
}

function getWargaById(wargaId) {
  return WargaService.getById(wargaId);
}

function getWargaByKK(kkId) {
  return WargaService.getByKK(kkId);
}

function searchWarga(query) {
  return WargaService.search(query);
}

function filterWarga(filters) {
  return WargaService.filter(filters);
}

function createWarga(data) {
  return WargaService.create(data);
}

function updateWarga(wargaId, data) {
  return WargaService.update(wargaId, data);
}

function deleteWarga(wargaId) {
  return WargaService.delete(wargaId);
}

function getWargaStatistics() {
  return WargaService.getStatistics();
}

function getWargaDropdown(kkId) {
  return WargaService.getDropdownList(kkId);
}
