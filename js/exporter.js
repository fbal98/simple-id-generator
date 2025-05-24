// Export module for Simple ID Generator
// Handles downloading single files and ZIP archives

import { CONFIG, getMessage } from './config.js';

export class Exporter {
  constructor() {
    this.isExporting = false;
    this.jsZipAvailable = this._checkJSZipAvailability();
  }

  /**
   * Downloads a single PNG file
   * @param {Object} idData - ID data with name and dataUrl
   * @param {string} filename - Optional custom filename
   * @returns {Promise<boolean>} Success status
   */
  async exportSinglePNG(idData, filename = null) {
    try {
      if (!idData || !idData.dataUrl) {
        throw new Error('Invalid ID data: missing dataUrl');
      }

      const downloadName = filename || idData.name || 'generated-id.png';
      await this._downloadFile(idData.dataUrl, downloadName);
      return true;

    } catch (error) {
      console.error('Error exporting single PNG:', error);
      throw new Error(`Failed to export PNG: ${error.message}`);
    }
  }

  /**
   * Downloads multiple IDs as a ZIP archive
   * @param {Array} idsData - Array of ID objects with name and dataUrl
   * @param {string} zipFilename - ZIP filename
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<boolean>} Success status
   */
  async exportZIP(idsData, zipFilename = CONFIG.FILES.ZIP_FILENAME, onProgress = null) {
    if (!this.jsZipAvailable) {
      throw new Error(getMessage('NO_JSZIP'));
    }

    if (!Array.isArray(idsData) || idsData.length === 0) {
      throw new Error('No IDs provided for ZIP export');
    }

    if (idsData.length === 1) {
      throw new Error('ZIP export requires at least 2 IDs. Use single PNG export for one ID.');
    }

    try {
      this.isExporting = true;

      // Create ZIP instance
      const zip = new window.JSZip();

      // Add files to ZIP
      let processedCount = 0;
      for (const idData of idsData) {
        if (!idData || !idData.dataUrl || !idData.name) {
          console.warn('Skipping invalid ID data:', idData);
          continue;
        }

        try {
          // Extract base64 data from data URL
          const base64Data = this._extractBase64FromDataURL(idData.dataUrl);
          zip.file(idData.name, base64Data, { base64: true });
          
          processedCount++;
          if (onProgress) {
            onProgress({
              current: processedCount,
              total: idsData.length,
              phase: 'adding'
            });
          }
        } catch (error) {
          console.error(`Error adding ${idData.name} to ZIP:`, error);
          // Continue with other files even if one fails
        }
      }

      if (processedCount === 0) {
        throw new Error('No valid IDs could be added to ZIP');
      }

      // Generate ZIP blob
      if (onProgress) {
        onProgress({ phase: 'generating' });
      }

      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download ZIP file
      if (onProgress) {
        onProgress({ phase: 'downloading' });
      }

      const zipUrl = URL.createObjectURL(zipBlob);
      await this._downloadFile(zipUrl, zipFilename);
      
      // Clean up object URL
      URL.revokeObjectURL(zipUrl);

      if (onProgress) {
        onProgress({ 
          phase: 'complete',
          total: processedCount 
        });
      }

      return true;

    } catch (error) {
      console.error('Error exporting ZIP:', error);
      throw new Error(`Failed to export ZIP: ${error.message}`);
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * Exports data as JSON file for backup/sharing
   * @param {Object} exportData - Data to export
   * @param {string} filename - JSON filename
   * @returns {Promise<boolean>} Success status
   */
  async exportJSON(exportData, filename = 'id-generator-data.json') {
    try {
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const dataUrl = URL.createObjectURL(blob);
      
      await this._downloadFile(dataUrl, filename);
      URL.revokeObjectURL(dataUrl);
      
      return true;
    } catch (error) {
      console.error('Error exporting JSON:', error);
      throw new Error(`Failed to export JSON: ${error.message}`);
    }
  }

  /**
   * Creates a shareable data URL for an ID
   * @param {Object} idData - ID data with dataUrl
   * @returns {string} Data URL for sharing
   */
  createShareableURL(idData) {
    if (!idData || !idData.dataUrl) {
      throw new Error('Invalid ID data for sharing');
    }
    return idData.dataUrl;
  }

  /**
   * Validates export data
   * @param {Array} idsData - Array of ID data
   * @returns {Object} Validation result
   */
  validateExportData(idsData) {
    if (!Array.isArray(idsData)) {
      return { 
        valid: false, 
        error: 'Export data must be an array',
        validCount: 0,
        invalidCount: 0
      };
    }

    let validCount = 0;
    let invalidCount = 0;
    const errors = [];

    idsData.forEach((idData, index) => {
      if (!idData) {
        invalidCount++;
        errors.push(`ID at index ${index} is null/undefined`);
        return;
      }

      if (!idData.dataUrl) {
        invalidCount++;
        errors.push(`ID at index ${index} missing dataUrl`);
        return;
      }

      if (!idData.name) {
        invalidCount++;
        errors.push(`ID at index ${index} missing name`);
        return;
      }

      if (!this._isValidDataURL(idData.dataUrl)) {
        invalidCount++;
        errors.push(`ID at index ${index} has invalid dataUrl format`);
        return;
      }

      validCount++;
    });

    return {
      valid: validCount > 0 && invalidCount === 0,
      validCount,
      invalidCount,
      errors: errors.length > 0 ? errors : null,
      canExportSingle: validCount >= 1,
      canExportZIP: validCount >= 2 && this.jsZipAvailable
    };
  }

  /**
   * Gets export capabilities based on current state
   * @returns {Object} Export capabilities
   */
  getCapabilities() {
    return {
      canExportPNG: true,
      canExportZIP: this.jsZipAvailable,
      canExportJSON: true,
      isExporting: this.isExporting,
      jsZipAvailable: this.jsZipAvailable,
      supportedFormats: [
        CONFIG.FILES.EXPORT_FORMATS.PNG,
        'application/zip',
        'application/json'
      ]
    };
  }

  // Private helper methods

  /**
   * Downloads a file using a temporary anchor element
   * @private
   */
  async _downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
      try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = 'none';
        
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        
        // Small delay to ensure download starts
        setTimeout(resolve, 100);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Extracts base64 data from a data URL
   * @private
   */
  _extractBase64FromDataURL(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') {
      throw new Error('Invalid data URL');
    }

    const parts = dataUrl.split(',');
    if (parts.length !== 2) {
      throw new Error('Malformed data URL');
    }

    return parts[1];
  }

  /**
   * Validates data URL format
   * @private
   */
  _isValidDataURL(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') {
      return false;
    }

    // Basic data URL format check
    return dataUrl.startsWith('data:') && dataUrl.includes(',');
  }

  /**
   * Checks if JSZip library is available
   * @private
   */
  _checkJSZipAvailability() {
    return typeof window !== 'undefined' && typeof window.JSZip !== 'undefined';
  }
}

export class ExportError extends Error {
  constructor(message, code = null, details = null) {
    super(message);
    this.name = 'ExportError';
    this.code = code;
    this.details = details;
  }
}

// Create and export singleton instance
export const exporter = new Exporter();
export default exporter;