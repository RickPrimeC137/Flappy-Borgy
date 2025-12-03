/**
 * main.js - Point d'entrée principal du jeu Flappy Borgy
 * 
 * Ce fichier est le point d'entrée ES6 module pour le jeu.
 * Il :
 * - Importe tous les modules nécessaires
 * - Initialise les managers
 * - Configure Telegram WebApp si disponible
 * - Crée l'instance Phaser avec les scènes modulaires
 * - Lance le jeu au chargement de la page
 * 
 * @module main
 */

// ============================================================
// IMPORTS - CONFIGURATION
// ============================================================

import { GAME_W, GAME_H } from './config/constants.js';
import { createGameConfig } from './config/gameConfig.js';
import { SKINS_DEF, BACKGROUNDS, PIPE_CONFIGS } from './config/skinConfig.js';

// ============================================================
// IMPORTS - SCENES
// ============================================================

import { PreloadScene, MenuScene, GameScene, SCENE_LIST } from './scenes/index.js';

// ============================================================
// IMPORTS - MANAGERS
// ============================================================

import storageManager from './managers/StorageManager.js';
import audioManager from './managers/AudioManager.js';
import coinManager from './managers/CoinManager.js';
import skinManager from './managers/SkinManager.js';
import questManager from './managers/QuestManager.js';
import leaderboardManager from './managers/LeaderboardManager.js';

// ============================================================
// IMPORTS - INTERNATIONALISATION
// ============================================================

import i18n, { t, setLang, currentLang } from './i18n/i18nManager.js';
import { I18N } from './i18n/translations.js';

// Alias pour compatibilité
const setLanguage = setLang;
const getLanguage = currentLang;

// ============================================================
// EXPORTS GLOBAUX (pour compatibilité avec code existant)
// ============================================================

/**
 * Expose les fonctions i18n sur window pour la compatibilité
 * avec le code existant pendant la transition
 */
if (typeof window !== 'undefined') {
  window.LANG = I18N;
  window.t = t;
  window.currentLang = currentLang;
  window.setLang = setLang;
  
  // Expose également les managers pour le débogage
  window.FlappyBorgy = {
    managers: {
      storage: storageManager,
      audio: audioManager,
      coin: coinManager,
      skin: skinManager,
      quest: questManager,
      leaderboard: leaderboardManager
    },
    config: {
      GAME_W,
      GAME_H,
      SKINS_DEF,
      BACKGROUNDS,
      PIPE_CONFIGS
    },
    i18n: {
      t,
      setLanguage,
      getLanguage,
      I18N
    }
  };
}

// ============================================================
// INTÉGRATION TELEGRAM WEBAPP
// ============================================================

/**
 * Référence à l'API Telegram WebApp si disponible
 * @type {Object|null}
 */
const TG = (typeof window !== 'undefined' && window.Telegram?.WebApp) || null;

/**
 * Initialise Telegram WebApp si disponible
 * @returns {boolean} true si Telegram a été initialisé
 */
function initTelegramWebApp() {
  if (TG) {
    try {
      TG.ready();
      TG.expand();
      
      // Obtenir les données d'initialisation si disponibles
      const initData = TG.initData || '';
      const user = TG.initDataUnsafe?.user || null;
      
      if (user) {
        console.log('[Flappy Borgy] Utilisateur Telegram:', user.first_name);
      }
      
      console.log('[Flappy Borgy] Telegram WebApp initialisé');
      return true;
    } catch (e) {
      console.warn('[Flappy Borgy] Erreur initialisation Telegram:', e);
      return false;
    }
  }
  return false;
}

/**
 * Retourne les données d'initialisation Telegram
 * @returns {string|null} Les données d'init ou null
 */
function getTelegramInitData() {
  try {
    return TG?.initData || null;
  } catch {
    return null;
  }
}

// ============================================================
// INITIALISATION DES MANAGERS
// ============================================================

/**
 * Initialise tous les managers du jeu
 */
function initManagers() {
  console.log('[Flappy Borgy] Initialisation des managers...');
  
  // Charger les préférences de langue
  const savedLang = storageManager.loadLang();
  setLang(savedLang);
  console.log(`[Flappy Borgy] Langue: ${savedLang}`);
  
  // Charger les coins
  const coins = coinManager.getBalance();
  console.log(`[Flappy Borgy] Borgy Coins: ${coins}`);
  
  // Charger les skins
  const selectedSkin = skinManager.getSelectedKey();
  console.log(`[Flappy Borgy] Skin sélectionné: ${selectedSkin}`);
  
  // Charger les quêtes (génère de nouvelles quêtes si nécessaire)
  const quests = questManager.getQuests();
  console.log(`[Flappy Borgy] Quêtes du jour: ${quests.length}`);
  
  console.log('[Flappy Borgy] Managers initialisés');
}

// ============================================================
// INITIALISATION DU JEU
// ============================================================

/**
 * Instance du jeu Phaser
 * @type {Phaser.Game|null}
 */
let gameInstance = null;

/**
 * Initialise et lance le jeu Phaser
 * 
 * @param {Array<typeof Phaser.Scene>} [scenes] - Liste des scènes (optionnel)
 * @returns {Phaser.Game} L'instance du jeu créée
 */
function initGame(scenes = SCENE_LIST) {
  // Empêcher la création de plusieurs instances
  if (gameInstance) {
    console.warn('[Flappy Borgy] Le jeu est déjà initialisé');
    return gameInstance;
  }
  
  // Crée la configuration Phaser avec les scènes fournies
  const config = createGameConfig(scenes);
  
  // Crée l'instance du jeu
  gameInstance = new Phaser.Game(config);
  
  // Log d'initialisation
  console.log('[Flappy Borgy] Jeu initialisé avec succès');
  console.log(`[Flappy Borgy] Dimensions: ${GAME_W}x${GAME_H}`);
  console.log(`[Flappy Borgy] Scènes: ${scenes.map(s => s.name || 'Scene').join(', ')}`);
  console.log(`[Flappy Borgy] Skins disponibles: ${SKINS_DEF.length}`);
  
  // Exposer l'instance pour le débogage
  if (typeof window !== 'undefined') {
    window.FlappyBorgy.game = gameInstance;
  }
  
  return gameInstance;
}

/**
 * Détruit l'instance du jeu (pour nettoyage)
 */
function destroyGame() {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
    console.log('[Flappy Borgy] Jeu détruit');
  }
}

/**
 * Retourne l'instance du jeu actuelle
 * @returns {Phaser.Game|null}
 */
function getGameInstance() {
  return gameInstance;
}

// ============================================================
// EXPORTS
// ============================================================

/**
 * Export des fonctions principales pour utilisation externe
 */
export {
  // Initialisation
  initGame,
  destroyGame,
  getGameInstance,
  initTelegramWebApp,
  getTelegramInitData,
  initManagers,
  
  // Telegram
  TG,
  
  // Scènes (pour import direct si nécessaire)
  PreloadScene,
  MenuScene,
  GameScene,
  SCENE_LIST,
  
  // Managers (pour import direct si nécessaire)
  storageManager,
  audioManager,
  coinManager,
  skinManager,
  questManager,
  leaderboardManager,
  
  // i18n
  i18n,
  t,
  setLang,
  currentLang,
  setLanguage, // alias
  getLanguage, // alias
  I18N
};

// ============================================================
// AUTO-INITIALISATION AU CHARGEMENT DE LA PAGE
// ============================================================

/**
 * Point d'entrée principal
 * S'exécute automatiquement au chargement de la page
 */
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('[Flappy Borgy] Démarrage du jeu...');
    
    // Initialise Telegram WebApp si disponible
    initTelegramWebApp();
    
    // Initialise les managers
    initManagers();
    
    // Lance le jeu avec les scènes modulaires
    initGame([PreloadScene, MenuScene, GameScene]);
    
    console.log('[Flappy Borgy] Module main.js chargé et jeu lancé');
  });
}

// ============================================================
// LOG DE CHARGEMENT DU MODULE
// ============================================================

console.log('[Flappy Borgy] Module main.js importé');
console.log('[Flappy Borgy] Phase 5 (finale) de la refactorisation');
console.log('[Flappy Borgy] Modules disponibles:');
console.log('  - config/ (constants, gameConfig, skinConfig)');
console.log('  - i18n/ (translations, i18nManager)');
console.log('  - managers/ (Storage, Audio, Coin, Skin, Quest, Leaderboard)');
console.log('  - entities/ (Player, Pipe, Bonus, BorgyCoin, Bot, Cloud, Background)');
console.log('  - scenes/ (PreloadScene, MenuScene, GameScene)');
console.log('  - utils/ (helpers)');