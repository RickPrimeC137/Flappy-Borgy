/**
 * UI Components Index
 * 
 * Exporte tous les composants d'interface utilisateur
 * 
 * @module ui
 */

// Popups
export { WelcomePopup } from './WelcomePopup.js';

// Effets visuels
export { VisualEffects, getVisualEffects } from './VisualEffects.js';

// Export par défaut avec tous les composants
export default {
  WelcomePopup: () => import('./WelcomePopup.js').then(m => m.WelcomePopup),
  VisualEffects: () => import('./VisualEffects.js').then(m => m.VisualEffects)
};