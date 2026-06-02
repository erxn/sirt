/**
 * SIRT - Sistem Informasi RT
 * User Repository
 * 
 * @fileoverview Data access layer for Users
 */

/**
 * UserRepository constructor
 */
function UserRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.USERS);
}

// Inherit from BaseRepository
UserRepository.prototype = Object.create(BaseRepository.prototype);
UserRepository.prototype.constructor = UserRepository;

/**
 * Finds a user by email
 * @param {string} email
 * @returns {Object|null}
 */
UserRepository.prototype.findByEmail = function(email) {
  return this.findOneBy({ email: email.toLowerCase() });
};

/**
 * Finds a user by user_id
 * @param {string} userId
 * @returns {Object|null}
 */
UserRepository.prototype.findByUserId = function(userId) {
  return this.findById(userId, 'user_id');
};

/**
 * Creates a new user
 * @param {Object} userData
 * @returns {Object}
 */
UserRepository.prototype.createUser = function(userData) {
  var user = {
    user_id: generateUUID(),
    name: userData.name,
    email: userData.email.toLowerCase(),
    password: userData.password,
    role_id: userData.role_id || CONFIG.ROLES.WARGA,
    is_active: userData.is_active !== undefined ? userData.is_active : true,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
    last_login: ''
  };
  
  return this.create(user);
};

/**
 * Updates user's last login
 * @param {string} userId
 * @returns {Object|null}
 */
UserRepository.prototype.updateLastLogin = function(userId) {
  return this.update(userId, {
    last_login: getCurrentTimestamp()
  }, 'user_id');
};

/**
 * Updates user password
 * @param {string} userId
 * @param {string} newPassword
 * @returns {Object|null}
 */
UserRepository.prototype.updatePassword = function(userId, newPassword) {
  return this.update(userId, {
    password: newPassword,
    updated_at: getCurrentTimestamp()
  }, 'user_id');
};

/**
 * Activates/Deactivates a user
 * @param {string} userId
 * @param {boolean} isActive
 * @returns {Object|null}
 */
UserRepository.prototype.setActiveStatus = function(userId, isActive) {
  return this.update(userId, {
    is_active: isActive,
    updated_at: getCurrentTimestamp()
  }, 'user_id');
};

/**
 * Gets all active users
 * @returns {Object[]}
 */
UserRepository.prototype.getActiveUsers = function() {
  return this.findBy({ is_active: true });
};

/**
 * Gets users by role
 * @param {string} roleId
 * @returns {Object[]}
 */
UserRepository.prototype.getUsersByRole = function(roleId) {
  return this.findBy({ role_id: roleId });
};

/**
 * Checks if email exists
 * @param {string} email
 * @param {string} excludeUserId
 * @returns {boolean}
 */
UserRepository.prototype.emailExists = function(email, excludeUserId) {
  var user = this.findByEmail(email);
  if (!user) return false;
  if (excludeUserId && user.user_id === excludeUserId) return false;
  return true;
};

// Lazy-load singleton
var _userRepositoryInstance = null;

function getUserRepository() {
  if (!_userRepositoryInstance) {
    _userRepositoryInstance = new UserRepository();
  }
  return _userRepositoryInstance;
}
