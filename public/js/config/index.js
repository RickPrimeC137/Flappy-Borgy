/**
 * Config Index - Point d'entrée pour toutes les configurations
 * 
 * Ce fichier réexporte toutes les constantes et configurations du jeu.
 * 
 * @module config
 */

// ============================================================
// EXPORTS - CONSTANTS
// ============================================================

export {
  // Dimensions du jeu
  GAME_W,
  GAME_H,
  
  // Profil de jeu (gravité, saut, etc.)
  PROFILE,
  
  // Limites du terrain de jeu
  PAD,
  PLAYFIELD_TOP_PCT,
  PLAYFIELD_BOT_PCT,
  PIPE_RIM_MAX_PCT,
  
  // Configuration des tuyaux
  PIPE_BODY_W,
  PIPE_W_DISPLAY,
  PIPE_HITBOX_W,
  PIPE_OVERSCAN,
  JOINT_OVERLAP,
  KILL_MARGIN,
  MIN_PAIR_DIST_PX,
  SPAWN_X_OFFSET,
  
  // Configuration du joueur
  PLAYER_SCALE,
  
  // Clés des arrière-plans
  BG_KEY,
  BG_HARD_KEY,
  BG_XMAS_KEY,
  
  // Configuration des nuages
  CLOUD_TOP_HEIGHT_PCT,
  CLOUD_BOTTOM_HEIGHT_PCT,
  CLOUD_EXTRA_SCALE_X,
  BOTTOM_CLOUD_HITBOX_OFFSET_PX,
  
  // Configuration des bonus
  ENABLE_BONUS,
  BONUS_EVERY,
  BONUS_DURATION,
  
  // Mode Hard - animation portes
  HARD_DOOR_AMPLITUDE_PX,
  HARD_DOOR_HALF_PERIOD,
  
  // Difficulté progressive
  DIFF,
  
  // Clés de stockage
  BORGY_COINS_KEY,
  LOCAL_BEST_KEY,
  WELCOME_POPUP_KEY,
  XMAS_MODE_KEY,
  GOLD_PIPES_KEY,
  QUEST_STORAGE_KEY,
  SKINS_STORAGE_KEY,
  LANG_STORAGE_KEY,
  HARD_MODE_KEY,
  
  // Langues
  SUPPORTED_LANGS,
  DEFAULT_LANG,
  LANG_OPTIONS,
  
  // Configuration de l'API
  API_BASE,
  
  // Clés des assets
  STORAGE_KEYS
} from './constants.js';

// ============================================================
// EXPORTS - GAME CONFIG
// ============================================================

export {
  createGameConfig,
  getDefaultGameConfig,
  PHASER_CONFIG
} from './gameConfig.js';

// ============================================================
// EXPORTS - SKIN CONFIG
// ============================================================

export {
  SKINS_DEF,
  BACKGROUNDS,
  PIPE_CONFIGS,
  getSkinById,
  getSkinByKey,
  getDefaultSkin,
  getBackgroundConfig,
  getPipeConfig
} from './skinConfig.js';