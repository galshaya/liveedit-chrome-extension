/**
 * @fileoverview DOM utilities for LiveEdit extension
 * @module dom-utils
 */

'use strict';

/**
 * Generate unique ID for an element
 * @param {Element} element - The DOM element
 * @returns {string} Unique identifier
 */
function generateElementId(element) {
  try {
    // Try to use existing ID
    if (element.id) {
      return `id-${element.id}`;
    }
    
    // Generate CSS selector path
    const path = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.nodeName.toLowerCase();
      
      if (current.className) {
        selector += '.' + current.className.split(' ').join('.');
      }
      
      if (current.parentNode) {
        const siblings = Array.from(current.parentNode.children);
        const index = siblings.indexOf(current);
        if (siblings.filter(s => s.nodeName === current.nodeName).length > 1) {
          selector += `:nth-child(${index + 1})`;
        }
      }
      
      path.unshift(selector);
      current = current.parentNode;
      
      if (path.length > 5) break; // Limit depth
    }
    
    return 'selector-' + btoa(path.join(' > ')).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
  } catch (error) {
    console.error('Error generating element ID:', error);
    return 'elem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}

/**
 * Check if element is editable
 * @param {Element} element - The DOM element to check
 * @returns {boolean} Whether element can be edited
 */
function isElementEditable(element) {
  try {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    
    // Exclude certain elements
    const excludedTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'HTML'];
    if (excludedTags.includes(element.tagName)) {
      return false;
    }
    
    // Exclude contenteditable elements that are already editable
    if (element.contentEditable === 'true') {
      return false;
    }
    
    // Skip elements inside LiveEdit overlay
    if (element.closest('.live-edit-overlay')) {
      return false;
    }
    
    // Check if element has text content or is an image/input
    const hasTextContent = element.textContent && element.textContent.trim().length > 0;
    const isImage = element.tagName === 'IMG';
    const isInput = ['INPUT', 'TEXTAREA', 'BUTTON'].includes(element.tagName);
    const isLink = element.tagName === 'A';
    
    return hasTextContent || isImage || isInput || isLink;
  } catch (error) {
    console.error('Error checking if element is editable:', error);
    return false;
  }
}

/**
 * Get element type for editing
 * @param {Element} element - The DOM element
 * @returns {string} Element type
 */
function getElementType(element) {
  try {
    if (element.tagName === 'IMG') return 'image';
    if (element.tagName === 'A') return 'link';
    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(element.tagName)) return 'input';
    return 'text';
  } catch (error) {
    console.error('Error getting element type:', error);
    return 'text';
  }
}

/**
 * Get element position relative to viewport
 * @param {Element} element - The DOM element
 * @returns {Object} Position object with x, y, width, height
 */
function getElementPosition(element) {
  try {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
      viewportX: rect.left,
      viewportY: rect.top
    };
  } catch (error) {
    console.error('Error getting element position:', error);
    return { x: 0, y: 0, width: 0, height: 0, viewportX: 0, viewportY: 0 };
  }
}

/**
 * Create CSS selector for element
 * @param {Element} element - The DOM element
 * @returns {string} CSS selector
 */
function createCSSSelector(element) {
  try {
    if (element.id) {
      return `#${element.id}`;
    }
    
    const path = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let selector = current.nodeName.toLowerCase();
      
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }
      
      // Add nth-child if needed
      if (current.parentNode) {
        const siblings = Array.from(current.parentNode.children);
        const sameTagSiblings = siblings.filter(s => s.nodeName === current.nodeName);
        if (sameTagSiblings.length > 1) {
          const index = sameTagSiblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }
      
      path.unshift(selector);
      current = current.parentNode;
      
      if (path.length > 8) break; // Limit selector depth
    }
    
    return path.join(' > ');
  } catch (error) {
    console.error('Error creating CSS selector:', error);
    return '';
  }
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export functions for use in other modules
window.LiveEditDOMUtils = {
  generateElementId,
  isElementEditable,
  getElementType,
  getElementPosition,
  createCSSSelector,
  debounce
};