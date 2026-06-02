/**
 * SIRT - Sistem Informasi RT
 * Base Repository
 * 
 * @fileoverview Abstract base for data access layer using function/prototype pattern
 */

/**
 * BaseRepository constructor for common CRUD operations
 * @param {string} sheetName - The name of the sheet to operate on
 */
function BaseRepository(sheetName) {
  this.sheetName = sheetName;
  this.spreadsheet = null;
  this.sheet = null;
}

/**
 * Gets the spreadsheet instance
 * @returns {Spreadsheet}
 */
BaseRepository.prototype.getSpreadsheet = function() {
  if (!this.spreadsheet) {
    var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) {
      throw new Error('SPREADSHEET_ID not configured in Script Properties');
    }
    this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  }
  return this.spreadsheet;
};

/**
 * Gets the sheet instance
 * @returns {Sheet}
 */
BaseRepository.prototype.getSheet = function() {
  if (!this.sheet) {
    this.sheet = this.getSpreadsheet().getSheetByName(this.sheetName);
    if (!this.sheet) {
      throw new Error('Sheet "' + this.sheetName + '" not found');
    }
  }
  return this.sheet;
};

/**
 * Gets all column headers
 * @returns {string[]}
 */
BaseRepository.prototype.getHeaders = function() {
  var sheet = this.getSheet();
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
};

/**
 * Gets all data as array of objects
 * @returns {Object[]}
 */
BaseRepository.prototype.getAll = function() {
  var sheet = this.getSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow <= 1 || lastCol === 0) return [];
  
  var headers = this.getHeaders();
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  return data.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  }).filter(function(row) {
    return row[headers[0]] !== '';
  });
};

/**
 * Finds a record by ID
 * @param {string} id
 * @param {string} idColumn
 * @returns {Object|null}
 */
BaseRepository.prototype.findById = function(id, idColumn) {
  var headers = this.getHeaders();
  var searchColumn = idColumn || headers[0];
  var data = this.getAll();
  
  for (var i = 0; i < data.length; i++) {
    if (data[i][searchColumn] === id) {
      return data[i];
    }
  }
  return null;
};

/**
 * Finds records matching criteria
 * @param {Object} criteria
 * @returns {Object[]}
 */
BaseRepository.prototype.findBy = function(criteria) {
  var data = this.getAll();
  
  return data.filter(function(row) {
    var keys = Object.keys(criteria);
    for (var i = 0; i < keys.length; i++) {
      if (row[keys[i]] !== criteria[keys[i]]) {
        return false;
      }
    }
    return true;
  });
};

/**
 * Finds a single record matching criteria
 * @param {Object} criteria
 * @returns {Object|null}
 */
BaseRepository.prototype.findOneBy = function(criteria) {
  var results = this.findBy(criteria);
  return results.length > 0 ? results[0] : null;
};

/**
 * Creates a new record
 * @param {Object} data
 * @returns {Object}
 */
BaseRepository.prototype.create = function(data) {
  var sheet = this.getSheet();
  var headers = this.getHeaders();
  
  var row = headers.map(function(header) {
    return data[header] !== undefined ? data[header] : '';
  });
  sheet.appendRow(row);
  
  return data;
};

/**
 * Updates a record by ID
 * @param {string} id
 * @param {Object} data
 * @param {string} idColumn
 * @returns {Object|null}
 */
BaseRepository.prototype.update = function(id, data, idColumn) {
  var sheet = this.getSheet();
  var headers = this.getHeaders();
  var searchColumn = idColumn || headers[0];
  var columnIndex = headers.indexOf(searchColumn);
  
  if (columnIndex === -1) {
    throw new Error('Column "' + searchColumn + '" not found');
  }
  
  var lastRow = sheet.getLastRow();
  var idValues = sheet.getRange(2, columnIndex + 1, lastRow - 1, 1).getValues();
  
  for (var i = 0; i < idValues.length; i++) {
    if (idValues[i][0] === id) {
      var rowIndex = i + 2;
      var self = this;
      
      headers.forEach(function(header, colIndex) {
        if (data[header] !== undefined) {
          sheet.getRange(rowIndex, colIndex + 1).setValue(data[header]);
        }
      });
      
      return this.findById(id, searchColumn);
    }
  }
  
  return null;
};

/**
 * Deletes a record by ID
 * @param {string} id
 * @param {string} idColumn
 * @returns {boolean}
 */
BaseRepository.prototype.delete = function(id, idColumn) {
  var sheet = this.getSheet();
  var headers = this.getHeaders();
  var searchColumn = idColumn || headers[0];
  var columnIndex = headers.indexOf(searchColumn);
  
  if (columnIndex === -1) {
    throw new Error('Column "' + searchColumn + '" not found');
  }
  
  var lastRow = sheet.getLastRow();
  var idValues = sheet.getRange(2, columnIndex + 1, lastRow - 1, 1).getValues();
  
  for (var i = 0; i < idValues.length; i++) {
    if (idValues[i][0] === id) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  
  return false;
};

/**
 * Counts all records
 * @returns {number}
 */
BaseRepository.prototype.count = function() {
  return this.getAll().length;
};

/**
 * Counts records matching criteria
 * @param {Object} criteria
 * @returns {number}
 */
BaseRepository.prototype.countBy = function(criteria) {
  return this.findBy(criteria).length;
};

/**
 * Checks if a record exists
 * @param {string} id
 * @param {string} idColumn
 * @returns {boolean}
 */
BaseRepository.prototype.exists = function(id, idColumn) {
  return this.findById(id, idColumn) !== null;
};

/**
 * Gets paginated results
 * @param {number} page
 * @param {number} pageSize
 * @param {Object} criteria
 * @returns {Object}
 */
BaseRepository.prototype.paginate = function(page, pageSize, criteria) {
  page = page || 1;
  pageSize = pageSize || CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;
  
  var data = criteria ? this.findBy(criteria) : this.getAll();
  var total = data.length;
  var totalPages = Math.ceil(total / pageSize);
  var startIndex = (page - 1) * pageSize;
  
  data = data.slice(startIndex, startIndex + pageSize);
  
  return {
    data: data,
    total: total,
    page: page,
    pageSize: pageSize,
    totalPages: totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

/**
 * Alias for getAll - for compatibility
 * @param {Object} criteria - optional filter criteria
 * @returns {Object[]}
 */
BaseRepository.prototype.findAll = function(criteria) {
  if (criteria) {
    return this.findBy(criteria);
  }
  return this.getAll();
};

/**
 * Alias for findOneBy - for compatibility
 * @param {Object} criteria
 * @returns {Object|null}
 */
BaseRepository.prototype.findOne = function(criteria) {
  return this.findOneBy(criteria);
};
