/**
 * Index Global - Point d'entrée principal pour tous les modules
 * 
 * Ce fichier réexporte tous les modules principaux de Flappy Borgy
 * pour faciliter les imports dans d'autres projets ou composants.
 * 
 * @module FlappyBorgy
 * 
 * @example
 * // Import sélectif
 * import { GAME_W, GAME_H } from './js/index.js';
 * import { storageManager, audioManager } from './js/index.js';
 * import { PreloadScene, MenuScene, GameScene } from './js/index.js';
 * 
 * @example
 * // Import complet
 * import * as FlappyBorgy from './js/index.js';
 * console.log(FlappyBorgy.GAME_W); // 1024
 */

// ============================================================
// CONFIGURATION
// ============================================================

export * from './config/index.js';

// ============================================================
// MANAGERS
// ============================================================

export * from './managers/index.js';

// ============================================================
// ENTITIES
// ============================================================

export * from './entities/index.js';

// ============================================================
// SCENES
// ============================================================

export * from './scenes/index.js';

// ============================================================
// INTERNATIONALISATION
// ============================================================

export {
  default as i18n,
  t,
  setLang,
  currentLang,
  toggleLang,
  loadLang,
  saveLang,
  hasTranslation,
  getAllTranslations,
  I18nManager
} from './i18n/i18nManager.js';

// Alias pour compatibilité
export { setLang as setLanguage, currentLang as getLanguage } from './i18n/i18nManager.js';

export { I18N, FR, EN } from './i18n/translations.js';

// ============================================================
// UTILITAIRES
// ============================================================

export * from './utils/index.js';

// ============================================================
// MAIN / INIT
// ============================================================

export { initGame, initTelegramWebApp, TG } from './main.js';