/**
 * SIRT - Sistem Informasi RT
 * Main Entry Point
 * 
 * @fileoverview Main application entry for Google Apps Script Web App
 */

const APP_NAME = 'Sistem Informasi RTRW';
const APP_VERSION = '1.0.0';

// =============================================================================
// WEB APP ENTRY POINTS
// =============================================================================

/**
 * Handles GET requests to the web app
 * @param {Object} e - Event object containing request parameters
 * @returns {HtmlOutput} - The HTML page to display
 */
function doGet(e) {
  var page = e.parameter.page || 'login';
  var user = SessionService.getCurrentUser();
  
  // If user is logged in and trying to access login page, redirect to dashboard
  if (user && page === 'login') {
    page = 'Dashboard';
  }
  
  // If user is not logged in and trying to access protected page, redirect to login
  if (!user && page !== 'login') {
    page = 'Login';
  }
  
  // Use page name as-is (files are case-sensitive)
  var pageName = page;
  
  // Route to appropriate page using template (supports scriptlets)
  try {
    var template = HtmlService.createTemplateFromFile(pageName);
    template.user = user;
    template.appName = APP_NAME;
    template.appVersion = APP_VERSION;
    
    return template.evaluate()
      .setTitle(APP_NAME + ' - ' + pageName)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    Logger.log('Error loading page: ' + error.message);
    var loginTemplate = HtmlService.createTemplateFromFile('Login');
    loginTemplate.user = null;
    loginTemplate.appName = APP_NAME;
    loginTemplate.appVersion = APP_VERSION;
    
    return loginTemplate.evaluate()
      .setTitle(APP_NAME + ' - Login')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
}

/**
 * Handles POST requests (not used in this implementation)
 * @param {Object} e - Event object
 * @returns {TextOutput} - JSON response
 */
function doPost(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'POST requests are not supported'
  })).setMimeType(ContentService.MimeType.JSON);
}

// =============================================================================
// NAVIGATION
// =============================================================================

/**
 * Returns the web app URL with optional page parameter
 * @param {string} page - Page to navigate to
 * @returns {string} - Full URL with page parameter
 */
function getPageUrl(page) {
  var url = ScriptApp.getService().getUrl();
  if (page) {
    url += '?page=' + page;
  }
  return url;
}

/**
 * Navigate to a specific page (called from client-side)
 * This reloads the web app with the new page parameter
 * @param {string} page - Page name to navigate to
 */
function navigateTo(page) {
  // This function is called from client-side after successful login
  // The actual navigation happens via the returned URL
  return getPageUrl(page);
}

/**
 * Returns the web app base URL (called from client-side)
 * @returns {string} - Base URL of the web app
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Returns current user info (called from client-side)
 * @returns {Object|null} - User info or null
 */
function getCurrentUserInfo() {
  var user = SessionService.getCurrentUser();
  if (user) {
    return {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      role_name: CONFIG.ROLE_NAMES[user.role_id] || user.role_id
    };
  }
  return null;
}
