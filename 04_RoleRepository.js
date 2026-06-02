/**
 * SIRT - Sistem Informasi RT
 * Role Repository
 * 
 * @fileoverview Data access layer for Roles and Permissions
 */

/**
 * RoleRepository constructor
 */
function RoleRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.ROLES);
}

RoleRepository.prototype = Object.create(BaseRepository.prototype);
RoleRepository.prototype.constructor = RoleRepository;

/**
 * Finds a role by role_id
 * @param {string} roleId
 * @returns {Object|null}
 */
RoleRepository.prototype.findByRoleId = function(roleId) {
  return this.findById(roleId, 'role_id');
};

/**
 * Gets role name
 * @param {string} roleId
 * @returns {string}
 */
RoleRepository.prototype.getRoleName = function(roleId) {
  var role = this.findByRoleId(roleId);
  return role ? role.role_name : 'Unknown';
};

/**
 * PermissionRepository constructor
 */
function PermissionRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.PERMISSIONS);
}

PermissionRepository.prototype = Object.create(BaseRepository.prototype);
PermissionRepository.prototype.constructor = PermissionRepository;

/**
 * Finds a permission by code
 * @param {string} code
 * @returns {Object|null}
 */
PermissionRepository.prototype.findByCode = function(code) {
  return this.findOneBy({ code: code });
};

/**
 * RolePermissionRepository constructor
 */
function RolePermissionRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.ROLE_PERMISSIONS);
}

RolePermissionRepository.prototype = Object.create(BaseRepository.prototype);
RolePermissionRepository.prototype.constructor = RolePermissionRepository;

/**
 * Gets all permissions for a role
 * @param {string} roleId
 * @returns {string[]}
 */
RolePermissionRepository.prototype.getPermissionsForRole = function(roleId) {
  var mappings = this.findBy({ role_id: roleId });
  return mappings.map(function(m) { return m.permission_code; });
};

/**
 * Checks if role has permission
 * @param {string} roleId
 * @param {string} permissionCode
 * @returns {boolean}
 */
RolePermissionRepository.prototype.hasPermission = function(roleId, permissionCode) {
  var permissions = this.getPermissionsForRole(roleId);
  return permissions.indexOf(permissionCode) !== -1;
};

/**
 * Assigns permission to role
 * @param {string} roleId
 * @param {string} permissionCode
 * @returns {Object}
 */
RolePermissionRepository.prototype.assignPermission = function(roleId, permissionCode) {
  if (this.hasPermission(roleId, permissionCode)) {
    return { role_id: roleId, permission_code: permissionCode };
  }
  
  return this.create({
    role_id: roleId,
    permission_code: permissionCode
  });
};

/**
 * Removes permission from role
 * @param {string} roleId
 * @param {string} permissionCode
 * @returns {boolean}
 */
RolePermissionRepository.prototype.removePermission = function(roleId, permissionCode) {
  var sheet = this.getSheet();
  var data = this.getAll();
  
  for (var i = 0; i < data.length; i++) {
    if (data[i].role_id === roleId && data[i].permission_code === permissionCode) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  
  return false;
};

// Lazy-load singletons
var _roleRepositoryInstance = null;
var _permissionRepositoryInstance = null;
var _rolePermissionRepositoryInstance = null;

function getRoleRepository() {
  if (!_roleRepositoryInstance) {
    _roleRepositoryInstance = new RoleRepository();
  }
  return _roleRepositoryInstance;
}

function getPermissionRepository() {
  if (!_permissionRepositoryInstance) {
    _permissionRepositoryInstance = new PermissionRepository();
  }
  return _permissionRepositoryInstance;
}

function getRolePermissionRepository() {
  if (!_rolePermissionRepositoryInstance) {
    _rolePermissionRepositoryInstance = new RolePermissionRepository();
  }
  return _rolePermissionRepositoryInstance;
}
