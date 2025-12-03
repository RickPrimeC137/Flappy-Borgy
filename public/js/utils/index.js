/**
 * Utils Index - Point d'entrée pour les utilitaires
 * 
 * Ce fichier réexporte toutes les fonctions utilitaires du jeu.
 * 
 * @module utils
 */

// ============================================================
// EXPORTS - HELPERS
// ============================================================

export {
  // Mathématiques
  clamp,
  randomBetween,
  randomFloat,
  lerp,
  
  // Formatage
  formatNumber,
  formatCompact,
  formatDuration,
  formatPercent,
  
  // Dates
  getTodayKey,
  isToday,
  
  // Images
  getVisibleBounds,
  
  // Validation
  isValidNumber,
  isValidString,
  
  // Utilitaires
  delay,
  debounce,
  throttle,
  generateId,
  
  // Export par défaut
  default as helpers
} from './helpers.js';