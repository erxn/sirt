/**
 * SIRT - Sistem Informasi RT
 * Utility Functions (Global)
 * 
 * @fileoverview Shared utility functions for the application
 */

/**
 * Includes an HTML file content (for templating)
 * @param {string} filename - The name of the file to include
 * @returns {string} - The file content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Capitalizes the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} - The capitalized string
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Gets the web app URL
 * @returns {string} - The web app URL
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Generates a UUID
 * @returns {string} - A UUID string
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * Gets current timestamp in ISO format
 * @returns {string} - ISO timestamp
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Formats date to Indonesian locale
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDateID(date) {
  const options = { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  };
  return new Date(date).toLocaleDateString('id-ID', options);
}

/**
 * Formats currency to Indonesian Rupiah
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
function formatCurrencyID(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Hashes a password using SHA-256
 * @param {string} password - The password to hash
 * @returns {string} - The hashed password
 */
function hashPassword(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
}

/**
 * Compares a password with its hash
 * @param {string} password - The plain password
 * @param {string} hash - The hashed password
 * @returns {boolean} - True if passwords match
 */
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

/**
 * Logs debug messages
 * @param {string} message - The message to log
 * @param {*} data - Optional data to log
 */
function debugLog(message, data = null) {
  Logger.log('[SIRT DEBUG] ' + message);
  if (data) {
    Logger.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Logs errors
 * @param {string} message - The error message
 * @param {Error} error - The error object
 */
function errorLog(message, error = null) {
  Logger.log('[SIRT ERROR] ' + message);
  if (error) {
    Logger.log(error.message);
    Logger.log(error.stack);
  }
}
