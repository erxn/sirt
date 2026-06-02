/**
 * SIRT - Sistem Informasi RT
 * Dashboard Service
 * 
 * @fileoverview Provides dashboard data and statistics
 */

const DashboardService = {
  /**
   * Gets dashboard summary data
   * @returns {Object} - Dashboard data
   */
  getSummary: function() {
    try {
      const wargaCount = this.countWarga();
      const kkCount = this.countKK();
      const rumahCount = this.countRumah();
      const iuranStats = this.getIuranStats();
      const keuanganStats = this.getKeuanganStats();
      
      return {
        totalWarga: wargaCount,
        totalKK: kkCount,
        totalRumah: rumahCount,
        iuranLunas: iuranStats.lunas,
        iuranBelum: iuranStats.belumBayar,
        saldoKas: keuanganStats.saldo,
        pemasukanBulanan: keuanganStats.pemasukanBulanan,
        pengeluaranBulanan: keuanganStats.pengeluaranBulanan
      };
    } catch (error) {
      Logger.log('Error getting dashboard summary: ' + error.message);
      return {
        totalWarga: 0,
        totalKK: 0,
        totalRumah: 0,
        iuranLunas: 0,
        iuranBelum: 0,
        saldoKas: 0,
        pemasukanBulanan: [0, 0, 0, 0, 0, 0],
        pengeluaranBulanan: [0, 0, 0, 0, 0, 0]
      };
    }
  },
  
  /**
   * Counts total warga
   * @returns {number} - Warga count
   */
  countWarga: function() {
    try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CONFIG.SHEETS.WARGA);
      if (!sheet) return 0;
      
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return 0;
      
      // Count only active warga
      const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      const statusCol = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].indexOf('status_warga');
      
      if (statusCol === -1) return data.length;
      
      return data.filter(row => row[0] !== '' && row[statusCol] === CONFIG.STATUS_WARGA.AKTIF).length;
    } catch (error) {
      Logger.log('Error counting warga: ' + error.message);
      return 0;
    }
  },
  
  /**
   * Counts total KK
   * @returns {number} - KK count
   */
  countKK: function() {
    try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CONFIG.SHEETS.KK);
      if (!sheet) return 0;
      
      const lastRow = sheet.getLastRow();
      return Math.max(0, lastRow - 1);
    } catch (error) {
      Logger.log('Error counting KK: ' + error.message);
      return 0;
    }
  },
  
  /**
   * Counts total Rumah
   * @returns {number} - Rumah count
   */
  countRumah: function() {
    try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CONFIG.SHEETS.RUMAH);
      if (!sheet) return 0;
      
      const lastRow = sheet.getLastRow();
      return Math.max(0, lastRow - 1);
    } catch (error) {
      Logger.log('Error counting rumah: ' + error.message);
      return 0;
    }
  },
  
  /**
   * Gets iuran statistics
   * @returns {Object} - Iuran stats
   */
  getIuranStats: function() {
    try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CONFIG.SHEETS.TAGIHAN_IURAN);
      if (!sheet) return { lunas: 0, belumBayar: 0 };
      
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return { lunas: 0, belumBayar: 0 };
      
      const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const statusCol = headers.indexOf('status');
      
      if (statusCol === -1) return { lunas: 0, belumBayar: data.length };
      
      // Get current month/year
      const now = new Date();
      const currentPeriode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const periodeCol = headers.indexOf('periode');
      
      // Filter current month
      const currentMonthData = periodeCol !== -1 
        ? data.filter(row => row[periodeCol] && row[periodeCol].toString().startsWith(currentPeriode))
        : data;
      
      const lunas = currentMonthData.filter(row => row[statusCol] === CONFIG.STATUS_PEMBAYARAN.LUNAS).length;
      const belumBayar = currentMonthData.filter(row => row[statusCol] === CONFIG.STATUS_PEMBAYARAN.BELUM_BAYAR).length;
      
      return { lunas, belumBayar };
    } catch (error) {
      Logger.log('Error getting iuran stats: ' + error.message);
      return { lunas: 0, belumBayar: 0 };
    }
  },
  
  /**
   * Gets keuangan statistics
   * @returns {Object} - Keuangan stats
   */
  getKeuanganStats: function() {
    try {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      
      // Get penerimaan
      const penerimaanSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.PENERIMAAN);
      let totalPenerimaan = 0;
      let pemasukanBulanan = [0, 0, 0, 0, 0, 0];
      
      if (penerimaanSheet && penerimaanSheet.getLastRow() > 1) {
        const penerimaanData = penerimaanSheet.getRange(2, 1, penerimaanSheet.getLastRow() - 1, penerimaanSheet.getLastColumn()).getValues();
        const penerimaanHeaders = penerimaanSheet.getRange(1, 1, 1, penerimaanSheet.getLastColumn()).getValues()[0];
        const jumlahCol = penerimaanHeaders.indexOf('jumlah');
        const tanggalCol = penerimaanHeaders.indexOf('tanggal');
        
        if (jumlahCol !== -1) {
          penerimaanData.forEach(row => {
            const jumlah = parseFloat(row[jumlahCol]) || 0;
            totalPenerimaan += jumlah;
            
            // Calculate monthly data for last 6 months
            if (tanggalCol !== -1 && row[tanggalCol]) {
              const date = new Date(row[tanggalCol]);
              const now = new Date();
              const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
              if (monthDiff >= 0 && monthDiff < 6) {
                pemasukanBulanan[5 - monthDiff] += jumlah;
              }
            }
          });
        }
      }
      
      // Get pengeluaran
      const pengeluaranSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.PENGELUARAN);
      let totalPengeluaran = 0;
      let pengeluaranBulanan = [0, 0, 0, 0, 0, 0];
      
      if (pengeluaranSheet && pengeluaranSheet.getLastRow() > 1) {
        const pengeluaranData = pengeluaranSheet.getRange(2, 1, pengeluaranSheet.getLastRow() - 1, pengeluaranSheet.getLastColumn()).getValues();
        const pengeluaranHeaders = pengeluaranSheet.getRange(1, 1, 1, pengeluaranSheet.getLastColumn()).getValues()[0];
        const jumlahCol = pengeluaranHeaders.indexOf('jumlah');
        const tanggalCol = pengeluaranHeaders.indexOf('tanggal');
        
        if (jumlahCol !== -1) {
          pengeluaranData.forEach(row => {
            const jumlah = parseFloat(row[jumlahCol]) || 0;
            totalPengeluaran += jumlah;
            
            // Calculate monthly data for last 6 months
            if (tanggalCol !== -1 && row[tanggalCol]) {
              const date = new Date(row[tanggalCol]);
              const now = new Date();
              const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
              if (monthDiff >= 0 && monthDiff < 6) {
                pengeluaranBulanan[5 - monthDiff] += jumlah;
              }
            }
          });
        }
      }
      
      return {
        saldo: totalPenerimaan - totalPengeluaran,
        totalPenerimaan,
        totalPengeluaran,
        pemasukanBulanan,
        pengeluaranBulanan
      };
    } catch (error) {
      Logger.log('Error getting keuangan stats: ' + error.message);
      return {
        saldo: 0,
        totalPenerimaan: 0,
        totalPengeluaran: 0,
        pemasukanBulanan: [0, 0, 0, 0, 0, 0],
        pengeluaranBulanan: [0, 0, 0, 0, 0, 0]
      };
    }
  }
};

// =============================================================================
// CLIENT-CALLABLE FUNCTIONS
// =============================================================================

/**
 * Gets dashboard data callable from client
 * @returns {Object} - Dashboard data
 */
function getDashboardData() {
  return DashboardService.getSummary();
}

/**
 * Gets recent activities callable from client
 * @param {number} limit - Number of activities to return
 * @returns {Object[]} - Recent activities
 */
function getRecentActivities(limit) {
  return auditLogRepository.getRecentLogs(limit || 5);
}
