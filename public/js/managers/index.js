/**
 * Managers Index - Point d'entrée pour tous les managers
 * 
 * Ce fichier réexporte tous les managers du jeu pour une importation simplifiée.
 * 
 * @module managers
 */

// ============================================================
// EXPORTS - STORAGE MANAGER
// ============================================================

export { default as storageManager, StorageManager } from './StorageManager.js';

// ============================================================
// EXPORTS - AUDIO MANAGER
// ============================================================

export { default as audioManager, AudioManager } from './AudioManager.js';

// ============================================================
// EXPORTS - COIN MANAGER
// ============================================================

export { default as coinManager, CoinManager } from './CoinManager.js';

// ============================================================
// EXPORTS - SKIN MANAGER
// ============================================================

export { default as skinManager, SkinManager } from './SkinManager.js';

// ============================================================
// EXPORTS - QUEST MANAGER
// ============================================================

export { default as questManager, QuestManager } from './QuestManager.js';

// ============================================================
// EXPORTS - LEADERBOARD MANAGER
// ============================================================

export { default as leaderboardManager, LeaderboardManager } from './LeaderboardManager.js';

// ============================================================
// MANAGER INSTANCES (Convenience exports)
// ============================================================

/**
 * Objet contenant toutes les instances de managers
 * @type {Object}
 */
import storageManager from './StorageManager.js';
import audioManager from './AudioManager.js';
import coinManager from './CoinManager.js';
import skinManager from './SkinManager.js';
import questManager from './QuestManager.js';
import leaderboardManager from './LeaderboardManager.js';

export const MANAGERS = {
  storage: storageManager,
  audio: audioManager,
  coin: coinManager,
  skin: skinManager,
  quest: questManager,
  leaderboard: leaderboardManager
};

export default MANAGERS;