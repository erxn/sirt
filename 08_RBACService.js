/**
 * SIRT - Sistem Informasi RT
 * RBAC Service
 * 
 * @fileoverview Role-Based Access Control service
 */

const RBACService = {
  /**
   * Permission matrix based on RBAC document
   * Role -> Module -> Permissions
   */
  PERMISSION_MATRIX: {
    'ROLE_001': { // Super Admin
      dashboard: ['view', 'manage'],
      warga: ['view', 'create', 'update', 'delete'],
      kk: ['view', 'create', 'update', 'delete'],
      rumah: ['view', 'create', 'update', 'delete'],
      dawis: ['view', 'create', 'update', 'delete'],
      iuran: ['view', 'create', 'update', 'delete'],
      keuangan: ['view', 'create', 'update', 'delete'],
      surat: ['view', 'create', 'update', 'delete', 'approve'],
      pengumuman: ['view', 'create', 'update', 'delete'],
      audit: ['view'],
      user: ['view', 'create', 'update', 'delete']
    },
    'ROLE_002': { // Ketua RT
      dashboard: ['view'],
      warga: ['view', 'create', 'update', 'delete'],
      kk: ['view', 'create', 'update', 'delete'],
      rumah: ['view', 'create', 'update', 'delete'],
      dawis: ['view', 'create', 'update', 'delete'],
      iuran: ['view'],
      keuangan: ['view'],
      surat: ['view', 'approve'],
      pengumuman: ['view', 'create', 'update', 'delete'],
      audit: ['view'],
      user: ['view']
    },
    'ROLE_003': { // Sekretaris
      dashboard: ['view'],
      warga: ['view', 'create', 'update', 'delete'],
      kk: ['view', 'create', 'update', 'delete'],
      rumah: ['view', 'create', 'update', 'delete'],
      dawis: ['view', 'create', 'update', 'delete'],
      iuran: ['view'],
      keuangan: ['view'],
      surat: ['view', 'create', 'update', 'delete'],
      pengumuman: ['view', 'create', 'update', 'delete'],
      audit: [],
      user: ['view']
    },
    'ROLE_004': { // Bendahara
      dashboard: ['view'],
      warga: ['view'],
      kk: ['view'],
      rumah: ['view'],
      dawis: ['view'],
      iuran: ['view', 'create', 'update', 'delete'],
      keuangan: ['view', 'create', 'update', 'delete'],
      surat: ['view'],
      pengumuman: ['view'],
      audit: [],
      user: []
    },
    'ROLE_005': { // Warga
      dashboard: ['view'],
      warga: ['view'],
      kk: [],
      rumah: [],
      dawis: [],
      iuran: ['view'],
      keuangan: [],
      surat: ['view', 'request'],
      pengumuman: ['view'],
      audit: [],
      user: []
    }
  },
  
  /**
   * Gets permissions for a role
   * @param {string} roleId - The role ID
   * @returns {Object} - Permissions object
   */
  getRolePermissions: function(roleId) {
    return this.PERMISSION_MATRIX[roleId] || {};
  },
  
  /**
   * Checks if a role has permission for a module action
   * @param {string} roleId - The role ID
   * @param {string} module - The module name
   * @param {string} action - The action (view, create, update, delete, etc.)
   * @returns {boolean} - True if has permission
   */
  hasPermission: function(roleId, module, action) {
    const permissions = this.PERMISSION_MATRIX[roleId];
    
    if (!permissions) {
      return false;
    }
    
    const modulePermissions = permissions[module];
    
    if (!modulePermissions) {
      return false;
    }
    
    return modulePermissions.includes(action);
  },
  
  /**
   * Checks if current user has permission
   * @param {string} module - The module name
   * @param {string} action - The action
   * @returns {boolean} - True if has permission
   */
  currentUserHasPermission: function(module, action) {
    const user = SessionService.getCurrentUser();
    
    if (!user) {
      return false;
    }
    
    return this.hasPermission(user.role_id, module, action);
  },
  
  /**
   * Gets accessible modules for a role
   * @param {string} roleId - The role ID
   * @returns {string[]} - Array of module names
   */
  getAccessibleModules: function(roleId) {
    const permissions = this.PERMISSION_MATRIX[roleId];
    
    if (!permissions) {
      return [];
    }
    
    return Object.keys(permissions).filter(module => {
      return permissions[module] && permissions[module].length > 0;
    });
  },
  
  /**
   * Gets accessible modules for current user
   * @returns {string[]} - Array of module names
   */
  getCurrentUserModules: function() {
    const user = SessionService.getCurrentUser();
    
    if (!user) {
      return [];
    }
    
    return this.getAccessibleModules(user.role_id);
  },
  
  /**
   * Checks if user can access a module (has any permission)
   * @param {string} roleId - The role ID
   * @param {string} module - The module name
   * @returns {boolean} - True if can access
   */
  canAccessModule: function(roleId, module) {
    const permissions = this.PERMISSION_MATRIX[roleId];
    
    if (!permissions || !permissions[module]) {
      return false;
    }
    
    return permissions[module].length > 0;
  },
  
  /**
   * Checks if current user can access a module
   * @param {string} module - The module name
   * @returns {boolean} - True if can access
   */
  currentUserCanAccessModule: function(module) {
    const user = SessionService.getCurrentUser();
    
    if (!user) {
      return false;
    }
    
    return this.canAccessModule(user.role_id, module);
  },
  
  /**
   * Requires permission (throws error if not authorized)
   * @param {string} module - The module name
   * @param {string} action - The action
   * @throws {Error} - If not authorized
   */
  requirePermission: function(module, action) {
    if (!this.currentUserHasPermission(module, action)) {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini');
    }
  },
  
  /**
   * Gets menu items based on user role
   * @param {string} roleId - The role ID
   * @returns {Object[]} - Menu items
   */
  getMenuItems: function(roleId) {
    const menuConfig = [
      { id: 'dashboard', label: 'Dashboard', icon: 'home', module: 'dashboard' },
      { id: 'warga', label: 'Data Warga', icon: 'users', module: 'warga' },
      { id: 'kk', label: 'Data KK', icon: 'users', module: 'kk' },
      { id: 'rumah', label: 'Data Rumah', icon: 'home', module: 'rumah' },
      { id: 'dawis', label: 'Data Dawis', icon: 'map', module: 'dawis' },
      { id: 'iuran', label: 'Iuran', icon: 'credit-card', module: 'iuran' },
      { id: 'keuangan', label: 'Keuangan', icon: 'dollar-sign', module: 'keuangan' },
      { id: 'surat', label: 'Surat Menyurat', icon: 'mail', module: 'surat' },
      { id: 'pengumuman', label: 'Pengumuman', icon: 'bell', module: 'pengumuman' },
      { id: 'audit', label: 'Audit Log', icon: 'file-text', module: 'audit' },
      { id: 'user', label: 'Manajemen User', icon: 'settings', module: 'user' }
    ];
    
    return menuConfig.filter(item => this.canAccessModule(roleId, item.module));
  },
  
  /**
   * Gets menu items for current user
   * @returns {Object[]} - Menu items
   */
  getCurrentUserMenuItems: function() {
    const user = SessionService.getCurrentUser();
    
    if (!user) {
      return [];
    }
    
    return this.getMenuItems(user.role_id);
  },
  
  /**
   * Checks if user is admin (Super Admin or Ketua RT)
   * @param {string} roleId - The role ID
   * @returns {boolean} - True if admin
   */
  isAdmin: function(roleId) {
    return roleId === CONFIG.ROLES.SUPER_ADMIN || roleId === CONFIG.ROLES.KETUA_RT;
  },
  
  /**
   * Checks if current user is admin
   * @returns {boolean} - True if admin
   */
  currentUserIsAdmin: function() {
    const user = SessionService.getCurrentUser();
    
    if (!user) {
      return false;
    }
    
    return this.isAdmin(user.role_id);
  },
  
  /**
   * Checks if user is Super Admin
   * @param {string} roleId - The role ID
   * @returns {boolean} - True if Super Admin
   */
  isSuperAdmin: function(roleId) {
    return roleId === CONFIG.ROLES.SUPER_ADMIN;
  },
  
  /**
   * Checks if current user is Super Admin
   * @returns {boolean} - True if Super Admin
   */
  currentUserIsSuperAdmin: function() {
    const user = SessionService.getCurrentUser();
    
    if (!user) {
      return false;
    }
    
    return this.isSuperAdmin(user.role_id);
  }
};

// =============================================================================
// CLIENT-CALLABLE FUNCTIONS
// =============================================================================

/**
 * Checks permission callable from client
 * @param {string} module - The module name
 * @param {string} action - The action
 * @returns {boolean} - True if has permission
 */
function checkPermission(module, action) {
  return RBACService.currentUserHasPermission(module, action);
}

/**
 * Gets menu items for current user callable from client
 * @returns {Object[]} - Menu items
 */
function getMenuItems() {
  return RBACService.getCurrentUserMenuItems();
}

/**
 * Gets accessible modules callable from client
 * @returns {string[]} - Module names
 */
function getAccessibleModules() {
  return RBACService.getCurrentUserModules();
}

/**
 * Checks if current user is admin callable from client
 * @returns {boolean} - True if admin
 */
function isAdmin() {
  return RBACService.currentUserIsAdmin();
}

/**
 * Checks if current user is Super Admin callable from client
 * @returns {boolean} - True if Super Admin
 */
function isSuperAdmin() {
  return RBACService.currentUserIsSuperAdmin();
}
