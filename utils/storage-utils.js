/**
 * @fileoverview Storage utilities for LiveEdit extension
 * @module storage-utils
 */

'use strict';

const STORAGE_KEYS = {
  CHANGES: 'liveEditChanges',
  SETTINGS: 'liveEditSettings',
  EDIT_MODE: 'liveEditMode'
};

const DEFAULT_SETTINGS = {
  autoApply: false,
  highlightColor: '#0066ff',
  maxHistoryItems: 10,
  maxChangesPerPage: 100
};

/**
 * Get data from Chrome storage
 * @param {string} key - Storage key
 * @returns {Promise<any>} Stored data
 */
async function getStorageData(key) {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key];
  } catch (error) {
    console.error('Error getting storage data:', error);
    return null;
  }
}

/**
 * Set data in Chrome storage
 * @param {string} key - Storage key
 * @param {any} value - Data to store
 * @returns {Promise<boolean>} Success status
 */
async function setStorageData(key, value) {
  try {
    await chrome.storage.local.set({ [key]: value });
    return true;
  } catch (error) {
    console.error('Error setting storage data:', error);
    return false;
  }
}

/**
 * Get changes for current domain
 * @returns {Promise<Array>} Array of change objects
 */
async function getChangesForDomain() {
  try {
    const domain = window.location.hostname;
    const allChanges = await getStorageData(STORAGE_KEYS.CHANGES) || {};
    return allChanges[domain] || [];
  } catch (error) {
    console.error('Error getting changes for domain:', error);
    return [];
  }
}

/**
 * Save changes for current domain
 * @param {Array} changes - Array of change objects
 * @returns {Promise<boolean>} Success status
 */
async function saveChangesForDomain(changes) {
  try {
    const domain = window.location.hostname;
    const allChanges = await getStorageData(STORAGE_KEYS.CHANGES) || {};
    
    // Limit changes per domain
    const maxChanges = DEFAULT_SETTINGS.maxChangesPerPage;
    if (changes.length > maxChanges) {
      changes = changes.slice(-maxChanges);
    }
    
    allChanges[domain] = changes.map(change => ({
      ...change,
      lastModified: Date.now()
    }));
    
    return await setStorageData(STORAGE_KEYS.CHANGES, allChanges);
  } catch (error) {
    console.error('Error saving changes for domain:', error);
    return false;
  }
}

/**
 * Add a single change for current domain
 * @param {Object} change - Change object
 * @returns {Promise<boolean>} Success status
 */
async function addChange(change) {
  try {
    const existingChanges = await getChangesForDomain();
    
    // Remove existing change for same element if exists
    const filteredChanges = existingChanges.filter(c => c.elementId !== change.elementId);
    
    // Add new change
    filteredChanges.push({
      ...change,
      timestamp: Date.now(),
      applied: false
    });
    
    return await saveChangesForDomain(filteredChanges);
  } catch (error) {
    console.error('Error adding change:', error);
    return false;
  }
}

/**
 * Remove change by element ID
 * @param {string} elementId - Element ID
 * @returns {Promise<boolean>} Success status
 */
async function removeChange(elementId) {
  try {
    const existingChanges = await getChangesForDomain();
    const filteredChanges = existingChanges.filter(c => c.elementId !== elementId);
    return await saveChangesForDomain(filteredChanges);
  } catch (error) {
    console.error('Error removing change:', error);
    return false;
  }
}

/**
 * Get settings
 * @returns {Promise<Object>} Settings object
 */
async function getSettings() {
  try {
    const settings = await getStorageData(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings
 * @param {Object} settings - Settings object
 * @returns {Promise<boolean>} Success status
 */
async function saveSettings(settings) {
  try {
    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings, ...settings };
    return await setStorageData(STORAGE_KEYS.SETTINGS, newSettings);
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * Get edit mode status
 * @returns {Promise<boolean>} Edit mode status
 */
async function getEditMode() {
  try {
    const editMode = await getStorageData(STORAGE_KEYS.EDIT_MODE);
    return editMode === true;
  } catch (error) {
    console.error('Error getting edit mode:', error);
    return false;
  }
}

/**
 * Set edit mode status
 * @param {boolean} enabled - Edit mode status
 * @returns {Promise<boolean>} Success status
 */
async function setEditMode(enabled) {
  try {
    return await setStorageData(STORAGE_KEYS.EDIT_MODE, enabled);
  } catch (error) {
    console.error('Error setting edit mode:', error);
    return false;
  }
}

/**
 * Clear all data for current domain
 * @returns {Promise<boolean>} Success status
 */
async function clearDomainData() {
  try {
    const domain = window.location.hostname;
    const allChanges = await getStorageData(STORAGE_KEYS.CHANGES) || {};
    
    if (allChanges[domain]) {
      delete allChanges[domain];
      return await setStorageData(STORAGE_KEYS.CHANGES, allChanges);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing domain data:', error);
    return false;
  }
}

/**
 * Get storage usage info
 * @returns {Promise<Object>} Storage usage information
 */
async function getStorageUsage() {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const quota = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB default
    
    return {
      used: bytesInUse,
      total: quota,
      percentage: Math.round((bytesInUse / quota) * 100)
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return { used: 0, total: 5242880, percentage: 0 };
  }
}

// Export functions for use in other modules
window.LiveEditStorageUtils = {
  getStorageData,
  setStorageData,
  getChangesForDomain,
  saveChangesForDomain,
  addChange,
  removeChange,
  getSettings,
  saveSettings,
  getEditMode,
  setEditMode,
  clearDomainData,
  getStorageUsage,
  STORAGE_KEYS,
  DEFAULT_SETTINGS
};