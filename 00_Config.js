/**
 * SIRT - Sistem Informasi RT
 * Configuration File
 * 
 * @fileoverview Application configuration and constants
 */

// =============================================================================
// SPREADSHEET CONFIGURATION
// =============================================================================

const CONFIG = {
  // Sheet Names
  SHEETS: {
    USERS: 'Users',
    ROLES: 'Roles',
    PERMISSIONS: 'Permissions',
    ROLE_PERMISSIONS: 'RolePermissions',
    DAWIS: 'Dawis',
    RUMAH: 'Rumah',
    KK: 'KK',
    WARGA: 'Warga',
    PENGURUS: 'Pengurus',
    JENIS_IURAN: 'JenisIuran',
    TAGIHAN_IURAN: 'TagihanIuran',
    PEMBAYARAN_IURAN: 'PembayaranIuran',
    PENERIMAAN: 'Penerimaan',
    PENGELUARAN: 'Pengeluaran',
    SURAT: 'Surat',
    PENGUMUMAN: 'Pengumuman',
    AUDIT_LOG: 'AuditLog',
    SETTINGS: 'Settings'
  },
  
  // Role IDs
  ROLES: {
    SUPER_ADMIN: 'ROLE_001',
    KETUA_RT: 'ROLE_002',
    SEKRETARIS: 'ROLE_003',
    BENDAHARA: 'ROLE_004',
    WARGA: 'ROLE_005'
  },
  
  // Role Names
  ROLE_NAMES: {
    'ROLE_001': 'Super Admin',
    'ROLE_002': 'Ketua RT',
    'ROLE_003': 'Sekretaris',
    'ROLE_004': 'Bendahara',
    'ROLE_005': 'Warga'
  },
  
  // Permission Codes
  PERMISSIONS: {
    // Dashboard
    DASHBOARD_VIEW: 'dashboard.view',
    DASHBOARD_MANAGE: 'dashboard.manage',
    
    // Warga
    WARGA_VIEW: 'warga.view',
    WARGA_CREATE: 'warga.create',
    WARGA_UPDATE: 'warga.update',
    WARGA_DELETE: 'warga.delete',
    
    // KK
    KK_VIEW: 'kk.view',
    KK_CREATE: 'kk.create',
    KK_UPDATE: 'kk.update',
    KK_DELETE: 'kk.delete',
    
    // Rumah
    RUMAH_VIEW: 'rumah.view',
    RUMAH_CREATE: 'rumah.create',
    RUMAH_UPDATE: 'rumah.update',
    RUMAH_DELETE: 'rumah.delete',
    
    // Dawis
    DAWIS_VIEW: 'dawis.view',
    DAWIS_CREATE: 'dawis.create',
    DAWIS_UPDATE: 'dawis.update',
    DAWIS_DELETE: 'dawis.delete',
    
    // Iuran
    IURAN_VIEW: 'iuran.view',
    IURAN_CREATE: 'iuran.create',
    IURAN_UPDATE: 'iuran.update',
    IURAN_DELETE: 'iuran.delete',
    
    // Keuangan
    KEUANGAN_VIEW: 'keuangan.view',
    KEUANGAN_CREATE: 'keuangan.create',
    KEUANGAN_UPDATE: 'keuangan.update',
    KEUANGAN_DELETE: 'keuangan.delete',
    
    // Surat
    SURAT_VIEW: 'surat.view',
    SURAT_CREATE: 'surat.create',
    SURAT_UPDATE: 'surat.update',
    SURAT_DELETE: 'surat.delete',
    SURAT_APPROVE: 'surat.approve',
    SURAT_REQUEST: 'surat.request',
    
    // Pengumuman
    PENGUMUMAN_VIEW: 'pengumuman.view',
    PENGUMUMAN_CREATE: 'pengumuman.create',
    PENGUMUMAN_UPDATE: 'pengumuman.update',
    PENGUMUMAN_DELETE: 'pengumuman.delete',
    
    // Audit Log
    AUDIT_VIEW: 'audit.view',
    
    // User Management
    USER_VIEW: 'user.view',
    USER_CREATE: 'user.create',
    USER_UPDATE: 'user.update',
    USER_DELETE: 'user.delete'
  },
  
  // Session Configuration
  SESSION: {
    TIMEOUT_MINUTES: 480, // 8 hours
    PROPERTY_KEY: 'USER_SESSION'
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
  },
  
  // Status Warga
  STATUS_WARGA: {
    AKTIF: 'Aktif',
    PINDAH: 'Pindah',
    MENINGGAL: 'Meninggal'
  },
  
  // Jenis Kelamin
  JENIS_KELAMIN: {
    LAKI: 'Laki-laki',
    PEREMPUAN: 'Perempuan'
  },
  
  // Status Pembayaran
  STATUS_PEMBAYARAN: {
    BELUM_BAYAR: 'Belum Bayar',
    LUNAS: 'Lunas',
    SEBAGIAN: 'Sebagian'
  },
  
  // Status Surat
  STATUS_SURAT: {
    DRAFT: 'Draft',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected'
  },
  
  // Audit Actions
  AUDIT_ACTIONS: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    APPROVE: 'APPROVE',
    REJECT: 'REJECT'
  }
};

/**
 * Gets configuration value
 * @param {string} key - The configuration key (dot notation supported)
 * @returns {*} - The configuration value
 */
function getConfig(key) {
  const keys = key.split('.');
  let value = CONFIG;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
}
