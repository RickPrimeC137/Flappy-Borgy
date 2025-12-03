/**
 * StorageManager.js - Gestionnaire centralisé du localStorage
 * 
 * Ce module fournit une abstraction pour toutes les opérations de stockage local.
 * Il gère la persistance des données utilisateur : scores, coins, skins, quêtes, préférences.
 * 
 * @module StorageManager
 */

import {
  BORGY_COINS_KEY,
  LOCAL_BEST_KEY,
  LOCAL_LAST_KEY,
  WELCOME_POPUP_KEY,
  XMAS_MODE_KEY,
  GOLD_PIPES_KEY,
  QUEST_STORAGE_KEY,
  SKINS_STORAGE_KEY,
  LANG_STORAGE_KEY,
  HARD_MODE_KEY,
  SUPPORTED_LANGS,
  DEFAULT_LANG
} from '../config/constants.js';

/**
 * Classe singleton pour gérer le localStorage
 * @class
 */
class StorageManager {
  /**
   * Crée une instance du StorageManager
   */
  constructor() {
    if (StorageManager._instance) {
      return StorageManager._instance;
    }
    StorageManager._instance = this;
  }

  // ============================================================
  // MÉTHODES GÉNÉRIQUES
  // ============================================================

  /**
   * Récupère une valeur du localStorage
   * @param {string} key - La clé de stockage
   * @param {*} [defaultValue=null] - Valeur par défaut si la clé n'existe pas
   * @returns {*} La valeur stockée ou la valeur par défaut
   */
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      return value;
    } catch (e) {
      console.warn(`[StorageManager] Erreur lecture ${key}:`, e);
      return defaultValue;
    }
  }

  /**
   * Stocke une valeur dans le localStorage
   * @param {string} key - La clé de stockage
   * @param {string} value - La valeur à stocker
   * @returns {boolean} true si succès, false sinon
   */
  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[StorageManager] Erreur écriture ${key}:`, e);
      return false;
    }
  }

  /**
   * Récupère une valeur JSON du localStorage
   * @param {string} key - La clé de stockage
   * @param {*} [defaultValue=null] - Valeur par défaut si parsing échoue
   * @returns {*} L'objet parsé ou la valeur par défaut
   */
  getJSON(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[StorageManager] Erreur parsing JSON ${key}:`, e);
      return defaultValue;
    }
  }

  /**
   * Stocke une valeur JSON dans le localStorage
   * @param {string} key - La clé de stockage
   * @param {*} value - L'objet à stocker
   * @returns {boolean} true si succès, false sinon
   */
  setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[StorageManager] Erreur stringify JSON ${key}:`, e);
      return false;
    }
  }

  /**
   * Récupère une valeur numérique du localStorage
   * @param {string} key - La clé de stockage
   * @param {number} [defaultValue=0] - Valeur par défaut
   * @returns {number} La valeur numérique ou la valeur par défaut
   */
  getNumber(key, defaultValue = 0) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : defaultValue;
    } catch (e) {
      console.warn(`[StorageManager] Erreur lecture nombre ${key}:`, e);
      return defaultValue;
    }
  }

  /**
   * Stocke une valeur numérique dans le localStorage
   * @param {string} key - La clé de stockage
   * @param {number} value - La valeur numérique
   * @returns {boolean} true si succès, false sinon
   */
  setNumber(key, value) {
    try {
      localStorage.setItem(key, String(value | 0));
      return true;
    } catch (e) {
      console.warn(`[StorageManager] Erreur écriture nombre ${key}:`, e);
      return false;
    }
  }

  /**
   * Récupère une valeur booléenne du localStorage
   * @param {string} key - La clé de stockage
   * @param {boolean} [defaultValue=false] - Valeur par défaut
   * @returns {boolean} La valeur booléenne
   */
  getBoolean(key, defaultValue = false) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) === true;
    } catch (e) {
      console.warn(`[StorageManager] Erreur lecture booléen ${key}:`, e);
      return defaultValue;
    }
  }

  /**
   * Stocke une valeur booléenne dans le localStorage
   * @param {string} key - La clé de stockage
   * @param {boolean} value - La valeur booléenne
   * @returns {boolean} true si succès, false sinon
   */
  setBoolean(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(!!value));
      return true;
    } catch (e) {
      console.warn(`[StorageManager] Erreur écriture booléen ${key}:`, e);
      return false;
    }
  }

  /**
   * Supprime une clé du localStorage
   * @param {string} key - La clé à supprimer
   * @returns {boolean} true si succès, false sinon
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[StorageManager] Erreur suppression ${key}:`, e);
      return false;
    }
  }

  /**
   * Vérifie si une clé existe dans le localStorage
   * @param {string} key - La clé à vérifier
   * @returns {boolean} true si la clé existe
   */
  has(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch (e) {
      return false;
    }
  }

  // ============================================================
  // MÉTHODES SPÉCIFIQUES AU JEU
  // ============================================================

  /**
   * Charge la langue actuelle
   * @returns {string} Le code de langue ('fr' ou 'en')
   */
  loadLang() {
    const lang = this.get(LANG_STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(lang)) return lang;
    return DEFAULT_LANG;
  }

  /**
   * Sauvegarde la langue
   * @param {string} lang - Le code de langue à sauvegarder
   */
  saveLang(lang) {
    if (SUPPORTED_LANGS.includes(lang)) {
      this.set(LANG_STORAGE_KEY, lang);
    }
  }

  /**
   * Charge le meilleur score local
   * @returns {number} Le meilleur score
   */
  loadLocalBestScore() {
    const n = this.getNumber(LOCAL_BEST_KEY, 0);
    return Math.max(0, n);
  }

  /**
   * Sauvegarde le meilleur score local (seulement si supérieur)
   * @param {number} score - Le score à sauvegarder
   * @returns {boolean} true si le score a été sauvegardé (nouveau record)
   */
  saveLocalBestScore(score) {
    const current = this.loadLocalBestScore();
    if (score > current) {
      const success = this.setNumber(LOCAL_BEST_KEY, score);
      if (!success) {
        console.error('[StorageManager] Échec de sauvegarde du meilleur score:', score);
      } else {
        console.log('[StorageManager] Nouveau meilleur score sauvegardé:', score);
      }
      return success;
    }
    return false;
  }

  /**
   * Charge le dernier score local
   * @returns {number} Le dernier score
   */
  loadLocalLastScore() {
    const n = this.getNumber(LOCAL_LAST_KEY, 0);
    return Math.max(0, n);
  }

  /**
   * Sauvegarde le dernier score local
   * @param {number} score - Le score à sauvegarder
   * @returns {boolean} true si succès
   */
  saveLocalLastScore(score) {
    const success = this.setNumber(LOCAL_LAST_KEY, Math.max(0, score));
    if (!success) {
      console.error('[StorageManager] Échec de sauvegarde du dernier score:', score);
    } else {
      console.log('[StorageManager] Dernier score sauvegardé:', score);
    }
    return success;
  }

  /**
   * Charge le solde de Borgy Coins
   * @returns {number} Le nombre de coins
   */
  loadBorgyCoins() {
    const n = this.getNumber(BORGY_COINS_KEY, 0);
    return Math.max(0, n);
  }

  /**
   * Sauvegarde le solde de Borgy Coins
   * @param {number} amount - Le montant à sauvegarder
   */
  saveBorgyCoins(amount) {
    this.setNumber(BORGY_COINS_KEY, Math.max(0, amount | 0));
  }

  /**
   * Charge le mode Hard
   * @returns {boolean} true si le mode Hard est activé
   */
  loadHardMode() {
    return this.getBoolean(HARD_MODE_KEY, false);
  }

  /**
   * Sauvegarde le mode Hard
   * @param {boolean} enabled - true pour activer le mode Hard
   */
  saveHardMode(enabled) {
    this.setBoolean(HARD_MODE_KEY, enabled);
  }

  /**
   * Charge le mode Noël
   * @returns {boolean} true si le mode Noël est activé
   */
  loadXmasMode() {
    return this.getBoolean(XMAS_MODE_KEY, false);
  }

  /**
   * Sauvegarde le mode Noël
   * @param {boolean} enabled - true pour activer le mode Noël
   */
  saveXmasMode(enabled) {
    this.setBoolean(XMAS_MODE_KEY, enabled);
  }

  /**
   * Charge le mode tuyaux dorés
   * @returns {boolean} true si les tuyaux dorés sont activés
   */
  loadGoldPipes() {
    return this.getBoolean(GOLD_PIPES_KEY, false);
  }

  /**
   * Sauvegarde le mode tuyaux dorés
   * @param {boolean} enabled - true pour activer les tuyaux dorés
   */
  saveGoldPipes(enabled) {
    this.setBoolean(GOLD_PIPES_KEY, enabled);
  }

  /**
   * Charge l'état de la popup de bienvenue
   * @returns {boolean} true si la popup a été vue
   */
  loadWelcomeSeen() {
    return this.getBoolean(WELCOME_POPUP_KEY, false);
  }

  /**
   * Marque la popup de bienvenue comme vue
   */
  saveWelcomeSeen() {
    this.setBoolean(WELCOME_POPUP_KEY, true);
  }

  /**
   * Charge les données des quêtes
   * @returns {Object|null} Les données des quêtes ou null
   */
  loadQuests() {
    return this.getJSON(QUEST_STORAGE_KEY, null);
  }

  /**
   * Sauvegarde les données des quêtes
   * @param {Object} data - Les données des quêtes
   */
  saveQuests(data) {
    this.setJSON(QUEST_STORAGE_KEY, data);
  }

  /**
   * Charge l'état des skins
   * @returns {Object|null} L'état des skins ou null
   */
  loadSkinState() {
    return this.getJSON(SKINS_STORAGE_KEY, null);
  }

  /**
   * Sauvegarde l'état des skins
   * @param {Object} data - L'état des skins
   */
  saveSkinState(data) {
    this.setJSON(SKINS_STORAGE_KEY, data);
  }

  // ============================================================
  // MÉTHODES UTILITAIRES
  // ============================================================

  /**
   * Efface toutes les données du jeu
   * @returns {boolean} true si succès
   */
  clearAll() {
    try {
      const keys = [
        BORGY_COINS_KEY,
        LOCAL_BEST_KEY,
        LOCAL_LAST_KEY,
        WELCOME_POPUP_KEY,
        XMAS_MODE_KEY,
        GOLD_PIPES_KEY,
        QUEST_STORAGE_KEY,
        SKINS_STORAGE_KEY,
        LANG_STORAGE_KEY,
        HARD_MODE_KEY
      ];
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (e) {
      console.warn('[StorageManager] Erreur clearAll:', e);
      return false;
    }
  }

  /**
   * Exporte toutes les données du jeu
   * @returns {Object} Un objet contenant toutes les données
   */
  exportData() {
    return {
      lang: this.loadLang(),
      bestScore: this.loadLocalBestScore(),
      lastScore: this.loadLocalLastScore(),
      coins: this.loadBorgyCoins(),
      hardMode: this.loadHardMode(),
      xmasMode: this.loadXmasMode(),
      goldPipes: this.loadGoldPipes(),
      welcomeSeen: this.loadWelcomeSeen(),
      quests: this.loadQuests(),
      skins: this.loadSkinState()
    };
  }

  /**
   * Importe des données du jeu
   * @param {Object} data - Les données à importer
   */
  importData(data) {
    if (!data || typeof data !== 'object') return;

    if (data.lang) this.saveLang(data.lang);
    if (typeof data.bestScore === 'number') this.setNumber(LOCAL_BEST_KEY, data.bestScore);
    if (typeof data.lastScore === 'number') this.setNumber(LOCAL_LAST_KEY, data.lastScore);
    if (typeof data.coins === 'number') this.saveBorgyCoins(data.coins);
    if (typeof data.hardMode === 'boolean') this.saveHardMode(data.hardMode);
    if (typeof data.xmasMode === 'boolean') this.saveXmasMode(data.xmasMode);
    if (typeof data.goldPipes === 'boolean') this.saveGoldPipes(data.goldPipes);
    if (typeof data.welcomeSeen === 'boolean') this.setBoolean(WELCOME_POPUP_KEY, data.welcomeSeen);
    if (data.quests) this.saveQuests(data.quests);
    if (data.skins) this.saveSkinState(data.skins);
  }
}

// Instance singleton
const storageManager = new StorageManager();

export default storageManager;
export { StorageManager };