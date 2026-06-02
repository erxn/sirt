/**
 * SIRT - Sistem Informasi RT
 * Audit Log Repository
 * 
 * @fileoverview Data access layer for Audit Logs
 */

/**
 * AuditLogRepository constructor
 */
function AuditLogRepository() {
  BaseRepository.call(this, CONFIG.SHEETS.AUDIT_LOG);
}

AuditLogRepository.prototype = Object.create(BaseRepository.prototype);
AuditLogRepository.prototype.constructor = AuditLogRepository;

/**
 * Creates an audit log entry
 * @param {string} userId
 * @param {string} action
 * @param {string} entity
 * @param {string} entityId
 * @param {Object} oldData
 * @param {Object} newData
 * @param {string} description
 * @returns {Object}
 */
AuditLogRepository.prototype.log = function(userId, action, entity, entityId, oldData, newData, description) {
  var logEntry = {
    log_id: generateUUID(),
    user_id: userId,
    action: action,
    entity: entity,
    entity_id: entityId || '',
    old_data: oldData ? JSON.stringify(oldData) : '',
    new_data: newData ? JSON.stringify(newData) : '',
    description: description || '',
    ip_address: '',
    user_agent: '',
    timestamp: getCurrentTimestamp()
  };
  
  return this.create(logEntry);
};

/**
 * Logs a login event
 * @param {string} userId
 * @param {string} email
 * @returns {Object}
 */
AuditLogRepository.prototype.logLogin = function(userId, email) {
  return this.log(
    userId,
    CONFIG.AUDIT_ACTIONS.LOGIN,
    'User',
    userId,
    null,
    { email: email },
    'User logged in'
  );
};

/**
 * Logs a logout event
 * @param {string} userId
 * @returns {Object}
 */
AuditLogRepository.prototype.logLogout = function(userId) {
  return this.log(
    userId,
    CONFIG.AUDIT_ACTIONS.LOGOUT,
    'User',
    userId,
    null,
    null,
    'User logged out'
  );
};

/**
 * Logs a create event
 * @param {string} userId
 * @param {string} entity
 * @param {string} entityId
 * @param {Object} data
 * @returns {Object}
 */
AuditLogRepository.prototype.logCreate = function(userId, entity, entityId, data) {
  return this.log(
    userId,
    CONFIG.AUDIT_ACTIONS.CREATE,
    entity,
    entityId,
    null,
    data,
    'Created ' + entity
  );
};

/**
 * Logs an update event
 * @param {string} userId
 * @param {string} entity
 * @param {string} entityId
 * @param {Object} oldData
 * @param {Object} newData
 * @returns {Object}
 */
AuditLogRepository.prototype.logUpdate = function(userId, entity, entityId, oldData, newData) {
  return this.log(
    userId,
    CONFIG.AUDIT_ACTIONS.UPDATE,
    entity,
    entityId,
    oldData,
    newData,
    'Updated ' + entity
  );
};

/**
 * Logs a delete event
 * @param {string} userId
 * @param {string} entity
 * @param {string} entityId
 * @param {Object} data
 * @returns {Object}
 */
AuditLogRepository.prototype.logDelete = function(userId, entity, entityId, data) {
  return this.log(
    userId,
    CONFIG.AUDIT_ACTIONS.DELETE,
    entity,
    entityId,
    data,
    null,
    'Deleted ' + entity
  );
};

/**
 * Gets logs for a specific user
 * @param {string} userId
 * @returns {Object[]}
 */
AuditLogRepository.prototype.getLogsForUser = function(userId) {
  return this.findBy({ user_id: userId });
};

/**
 * Gets logs for a specific entity
 * @param {string} entity
 * @param {string} entityId
 * @returns {Object[]}
 */
AuditLogRepository.prototype.getLogsForEntity = function(entity, entityId) {
  return this.findBy({ entity: entity, entity_id: entityId });
};

/**
 * Gets logs by action type
 * @param {string} action
 * @returns {Object[]}
 */
AuditLogRepository.prototype.getLogsByAction = function(action) {
  return this.findBy({ action: action });
};

/**
 * Gets recent logs
 * @param {number} limit
 * @returns {Object[]}
 */
AuditLogRepository.prototype.getRecentLogs = function(limit) {
  limit = limit || 50;
  var all = this.getAll();
  all.sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  return all.slice(0, limit);
};

// Lazy-load singleton
var _auditLogRepositoryInstance = null;

function getAuditLogRepository() {
  if (!_auditLogRepositoryInstance) {
    _auditLogRepositoryInstance = new AuditLogRepository();
  }
  return _auditLogRepositoryInstance;
}
