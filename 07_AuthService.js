/**
 * SIRT - Sistem Informasi RT
 * Authentication Service
 * 
 * @fileoverview Handles user authentication
 */

const AuthService = {
  /**
   * Simple password hashing using SHA-256
   * Note: For production, consider using a more secure method
   * @param {string} password - Plain text password
   * @returns {string} - Hashed password
   */
  hashPassword: function(password) {
    const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
    return rawHash.map(function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
  },
  
  /**
   * Verifies password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Stored hashed password
   * @returns {boolean} - True if matches
   */
  verifyPassword: function(plainPassword, hashedPassword) {
    return this.hashPassword(plainPassword) === hashedPassword;
  },
  
  /**
   * Authenticates a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} - Result with success, message, and user data
   */
  login: function(email, password) {
    try {
      // Find user by email
      const user = getUserRepository().findByEmail(email);
      
      if (!user) {
        return {
          success: false,
          message: 'Email atau password salah'
        };
      }
      
      // Check if user is active
      if (!user.is_active) {
        return {
          success: false,
          message: 'Akun Anda tidak aktif. Hubungi administrator.'
        };
      }
      
      // Verify password
      if (!this.verifyPassword(password, user.password)) {
        return {
          success: false,
          message: 'Email atau password salah'
        };
      }
      
      // Create session
      const session = SessionService.createSession(user);
      
      // Update last login
      getUserRepository().updateLastLogin(user.user_id);
      
      // Log the login
      getAuditLogRepository().logLogin(user.user_id, user.email);
      
      return {
        success: true,
        message: 'Login berhasil',
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role_id: user.role_id,
          role_name: CONFIG.ROLE_NAMES[user.role_id]
        }
      };
    } catch (error) {
      Logger.log('Login error: ' + error.message);
      return {
        success: false,
        message: 'Terjadi kesalahan sistem. Silakan coba lagi.'
      };
    }
  },
  
  /**
   * Logs out the current user
   * @returns {Object} - Result with success and message
   */
  logout: function() {
    try {
      const user = SessionService.getCurrentUser();
      
      if (user) {
        // Log the logout
        getAuditLogRepository().logLogout(user.user_id);
      }
      
      // Destroy session
      SessionService.destroySession();
      
      return {
        success: true,
        message: 'Logout berhasil'
      };
    } catch (error) {
      Logger.log('Logout error: ' + error.message);
      return {
        success: false,
        message: 'Terjadi kesalahan saat logout'
      };
    }
  },
  
  /**
   * Changes user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} - Result with success and message
   */
  changePassword: function(currentPassword, newPassword) {
    try {
      const currentUser = SessionService.getCurrentUser();
      
      if (!currentUser) {
        return {
          success: false,
          message: 'Anda harus login terlebih dahulu'
        };
      }
      
      const user = getUserRepository().findByUserId(currentUser.user_id);
      
      // Verify current password
      if (!this.verifyPassword(currentPassword, user.password)) {
        return {
          success: false,
          message: 'Password saat ini salah'
        };
      }
      
      // Validate new password
      if (newPassword.length < 6) {
        return {
          success: false,
          message: 'Password baru minimal 6 karakter'
        };
      }
      
      // Update password
      const hashedPassword = this.hashPassword(newPassword);
      getUserRepository().updatePassword(user.user_id, hashedPassword);
      
      // Log the action
      getAuditLogRepository().log(
        user.user_id,
        CONFIG.AUDIT_ACTIONS.UPDATE,
        'User',
        user.user_id,
        null,
        null,
        'Password changed'
      );
      
      return {
        success: true,
        message: 'Password berhasil diubah'
      };
    } catch (error) {
      Logger.log('Change password error: ' + error.message);
      return {
        success: false,
        message: 'Terjadi kesalahan saat mengubah password'
      };
    }
  },
  
  /**
   * Registers a new user (admin only)
   * @param {Object} userData - User data
   * @returns {Object} - Result with success, message, and user data
   */
  register: function(userData) {
    try {
      // Check if email already exists
      if (getUserRepository().emailExists(userData.email)) {
        return {
          success: false,
          message: 'Email sudah terdaftar'
        };
      }
      
      // Validate required fields
      if (!userData.name || !userData.email || !userData.password) {
        return {
          success: false,
          message: 'Nama, email, dan password wajib diisi'
        };
      }
      
      // Validate password
      if (userData.password.length < 6) {
        return {
          success: false,
          message: 'Password minimal 6 karakter'
        };
      }
      
      // Hash password
      userData.password = this.hashPassword(userData.password);
      
      // Create user
      const user = getUserRepository().createUser(userData);
      
      // Log the action
      const currentUser = SessionService.getCurrentUser();
      if (currentUser) {
        getAuditLogRepository().logCreate(
          currentUser.user_id,
          'User',
          user.user_id,
          { name: user.name, email: user.email, role_id: user.role_id }
        );
      }
      
      return {
        success: true,
        message: 'User berhasil ditambahkan',
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role_id: user.role_id
        }
      };
    } catch (error) {
      Logger.log('Register error: ' + error.message);
      return {
        success: false,
        message: 'Terjadi kesalahan saat mendaftarkan user'
      };
    }
  },
  
  /**
   * Gets current user info
   * @returns {Object} - Current user data or null
   */
  getCurrentUser: function() {
    return SessionService.getCurrentUser();
  },
  
  /**
   * Checks if user is logged in
   * @returns {boolean} - True if logged in
   */
  isLoggedIn: function() {
    return SessionService.isLoggedIn();
  }
};

// =============================================================================
// CLIENT-CALLABLE FUNCTIONS
// =============================================================================

/**
 * Login function callable from client
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} - Login result
 */
function login(email, password) {
  return AuthService.login(email, password);
}

/**
 * Logout function callable from client
 * @returns {Object} - Logout result
 */
function logout() {
  return AuthService.logout();
}

/**
 * Change password function callable from client
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} - Result
 */
function changePassword(currentPassword, newPassword) {
  return AuthService.changePassword(currentPassword, newPassword);
}

/**
 * Get current user function callable from client
 * @returns {Object|null} - Current user data
 */
function getCurrentUser() {
  return AuthService.getCurrentUser();
}

/**
 * Check if logged in callable from client
 * @returns {boolean} - True if logged in
 */
function isLoggedIn() {
  return AuthService.isLoggedIn();
}
