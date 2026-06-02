/**
 * SIRT - Sistem Informasi RT
 * Session Service
 * 
 * @fileoverview Handles user session management
 */

const SessionService = {
  /**
   * Session storage key
   */
  SESSION_KEY: 'SIRT_USER_SESSION',
  
  /**
   * Creates a new session for a user
   * @param {Object} user - The user object
   * @returns {Object} - Session data
   */
  createSession: function(user) {
    const session = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role_id: user.role_id,
      role_name: CONFIG.ROLE_NAMES[user.role_id] || 'Unknown',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + CONFIG.SESSION.TIMEOUT_MINUTES * 60 * 1000).toISOString()
    };
    
    // Store session in User Properties (per user)
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(this.SESSION_KEY, JSON.stringify(session));
    
    return session;
  },
  
  /**
   * Gets the current user session
   * @returns {Object|null} - Session data or null if not logged in
   */
  getSession: function() {
    try {
      const userProperties = PropertiesService.getUserProperties();
      const sessionData = userProperties.getProperty(this.SESSION_KEY);
      
      if (!sessionData) {
        return null;
      }
      
      const session = JSON.parse(sessionData);
      
      // Check if session has expired
      if (new Date(session.expires_at) < new Date()) {
        this.destroySession();
        return null;
      }
      
      return session;
    } catch (error) {
      Logger.log('Error getting session: ' + error.message);
      return null;
    }
  },
  
  /**
   * Gets the current logged-in user
   * @returns {Object|null} - User data or null
   */
  getCurrentUser: function() {
    const session = this.getSession();
    
    if (!session) {
      return null;
    }
    
    return {
      user_id: session.user_id,
      email: session.email,
      name: session.name,
      role_id: session.role_id,
      role_name: session.role_name
    };
  },
  
  /**
   * Destroys the current session (logout)
   */
  destroySession: function() {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty(this.SESSION_KEY);
  },
  
  /**
   * Refreshes the session expiry
   * @returns {Object|null} - Updated session or null
   */
  refreshSession: function() {
    const session = this.getSession();
    
    if (!session) {
      return null;
    }
    
    session.expires_at = new Date(Date.now() + CONFIG.SESSION.TIMEOUT_MINUTES * 60 * 1000).toISOString();
    
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(this.SESSION_KEY, JSON.stringify(session));
    
    return session;
  },
  
  /**
   * Checks if user is logged in
   * @returns {boolean} - True if logged in
   */
  isLoggedIn: function() {
    return this.getSession() !== null;
  },
  
  /**
   * Gets remaining session time in minutes
   * @returns {number} - Minutes remaining, 0 if not logged in
   */
  getSessionTimeRemaining: function() {
    const session = this.getSession();
    
    if (!session) {
      return 0;
    }
    
    const remaining = new Date(session.expires_at) - new Date();
    return Math.max(0, Math.floor(remaining / 60000));
  }
};
