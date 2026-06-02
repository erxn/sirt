/**
 * =====================================================
 * JENIS IURAN SERVICE
 * =====================================================
 * Business logic for Jenis Iuran management
 */

var JenisIuranService = {
  
  /**
   * Get all jenis iuran
   */
  getAll: function() {
    try {
      var items = getJenisIuranRepository().findAll();
      return {
        success: true,
        data: items
      };
    } catch (error) {
      Logger.log('JenisIuranService.getAll error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Get all active jenis iuran
   */
  getAllActive: function() {
    try {
      var items = getJenisIuranRepository().findAllActive();
      return {
        success: true,
        data: items
      };
    } catch (error) {
      Logger.log('JenisIuranService.getAllActive error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Get by ID
   */
  getById: function(id) {
    try {
      var item = getJenisIuranRepository().findById(id);
      if (!item) {
        return { success: false, message: 'Jenis iuran tidak ditemukan' };
      }
      return { success: true, data: item };
    } catch (error) {
      Logger.log('JenisIuranService.getById error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Create new jenis iuran
   */
  create: function(data) {
    try {
      // Validation
      if (!data.nama || !data.nama.trim()) {
        return { success: false, message: 'Nama iuran wajib diisi' };
      }
      if (!data.nominal || isNaN(parseFloat(data.nominal)) || parseFloat(data.nominal) <= 0) {
        return { success: false, message: 'Nominal harus berupa angka positif' };
      }
      
      // Check duplicate nama
      if (getJenisIuranRepository().namaExists(data.nama.trim())) {
        return { success: false, message: 'Nama iuran sudah ada' };
      }
      
      var now = new Date().toISOString();
      var newItem = {
        jenis_iuran_id: generateUUID(),
        nama: data.nama.trim(),
        nominal: parseFloat(data.nominal),
        deskripsi: data.deskripsi || '',
        is_active: true,
        created_at: now,
        updated_at: now,
        deleted_at: ''
      };
      
      var created = getJenisIuranRepository().create(newItem);
      
      // Audit log
      var user = SessionService.getCurrentUser();
      if (user) {
        getAuditLogRepository().logCreate(user.user_id, 'JenisIuran', created.jenis_iuran_id, {
          nama: created.nama,
          nominal: created.nominal
        });
      }
      
      return {
        success: true,
        message: 'Jenis iuran berhasil ditambahkan',
        data: created
      };
    } catch (error) {
      Logger.log('JenisIuranService.create error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Update jenis iuran
   */
  update: function(id, data) {
    try {
      var existing = getJenisIuranRepository().findById(id);
      if (!existing) {
        return { success: false, message: 'Jenis iuran tidak ditemukan' };
      }
      
      // Validation
      if (data.nama && !data.nama.trim()) {
        return { success: false, message: 'Nama iuran tidak boleh kosong' };
      }
      if (data.nominal !== undefined && (isNaN(parseFloat(data.nominal)) || parseFloat(data.nominal) <= 0)) {
        return { success: false, message: 'Nominal harus berupa angka positif' };
      }
      
      // Check duplicate nama
      if (data.nama && getJenisIuranRepository().namaExists(data.nama.trim(), id)) {
        return { success: false, message: 'Nama iuran sudah ada' };
      }
      
      var oldData = JSON.parse(JSON.stringify(existing));
      
      var updateData = {
        nama: data.nama ? data.nama.trim() : existing.nama,
        nominal: data.nominal !== undefined ? parseFloat(data.nominal) : existing.nominal,
        deskripsi: data.deskripsi !== undefined ? data.deskripsi : existing.deskripsi,
        is_active: data.is_active !== undefined ? data.is_active : existing.is_active,
        updated_at: new Date().toISOString()
      };
      
      var updated = getJenisIuranRepository().update(id, updateData);
      
      // Audit log
      var user = SessionService.getCurrentUser();
      if (user) {
        getAuditLogRepository().logUpdate(user.user_id, 'JenisIuran', id, oldData, updateData);
      }
      
      return {
        success: true,
        message: 'Jenis iuran berhasil diupdate',
        data: updated
      };
    } catch (error) {
      Logger.log('JenisIuranService.update error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Delete jenis iuran (soft delete)
   */
  delete: function(id) {
    try {
      var existing = getJenisIuranRepository().findById(id);
      if (!existing) {
        return { success: false, message: 'Jenis iuran tidak ditemukan' };
      }
      
      // Check if used in tagihan
      var tagihan = getTagihanRepository().findByJenisIuranId(id);
      if (tagihan && tagihan.length > 0) {
        return { success: false, message: 'Jenis iuran tidak dapat dihapus karena sudah digunakan dalam tagihan' };
      }
      
      var deleted = getJenisIuranRepository().softDelete(id);
      
      // Audit log
      var user = SessionService.getCurrentUser();
      if (user) {
        getAuditLogRepository().logDelete(user.user_id, 'JenisIuran', id, existing);
      }
      
      return {
        success: true,
        message: 'Jenis iuran berhasil dihapus'
      };
    } catch (error) {
      Logger.log('JenisIuranService.delete error: ' + error.message);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Get statistics
   */
  getStats: function() {
    try {
      var stats = getJenisIuranRepository().getStats();
      return { success: true, data: stats };
    } catch (error) {
      Logger.log('JenisIuranService.getStats error: ' + error.message);
      return { success: false, message: error.message };
    }
  }
};

// API functions for client-side calls
function getJenisIuranList() {
  return JenisIuranService.getAll();
}

function getActiveJenisIuranList() {
  return JenisIuranService.getAllActive();
}

function getJenisIuranById(id) {
  return JenisIuranService.getById(id);
}

function createJenisIuran(data) {
  return JenisIuranService.create(data);
}

function updateJenisIuran(id, data) {
  return JenisIuranService.update(id, data);
}

function deleteJenisIuran(id) {
  return JenisIuranService.delete(id);
}
