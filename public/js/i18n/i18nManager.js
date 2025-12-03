/**
 * i18nManager.js - Gestionnaire d'internationalisation pour Flappy Borgy
 * 
 * Ce module gère :
 * - Le chargement et la sauvegarde de la langue préférée
 * - La récupération des traductions
 * - Le changement de langue à la volée
 */

import { I18N, FR } from './translations.js';
import { LANG_STORAGE_KEY, SUPPORTED_LANGS, DEFAULT_LANG } from '../config/constants.js';

// ============================================================
// ÉTAT INTERNE
// ============================================================

/**
 * Langue actuellement sélectionnée
 * Stockée dans window pour pouvoir être partagée entre les modules
 * @type {string|null}
 */
let currentLanguage = null;

/**
 * EventTarget pour émettre les événements de changement de langue
 * @type {EventTarget}
 */
let eventTarget = null;

// ============================================================
// FONCTIONS DE GESTION DU STOCKAGE
// ============================================================

/**
 * Charge la langue depuis le localStorage
 * @returns {string} Code langue (fr ou en)
 */
export function loadLang() {
  try {
    const storedLang = localStorage.getItem(LANG_STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(storedLang)) {
      return storedLang;
    }
  } catch (e) {
    console.warn('[i18n] Erreur lors du chargement de la langue:', e);
  }
  return DEFAULT_LANG;
}

/**
 * Sauvegarde la langue dans le localStorage
 * @param {string} lang - Code langue à sauvegarder
 */
export function saveLang(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (e) {
    console.warn('[i18n] Erreur lors de la sauvegarde de la langue:', e);
  }
}

// ============================================================
// FONCTIONS DE GESTION DE LA LANGUE
// ============================================================

/**
 * Récupère la langue actuellement sélectionnée
 * Si aucune langue n'est définie, charge depuis le localStorage
 * @returns {string} Code langue actuel
 */
export function currentLang() {
  if (!currentLanguage) {
    currentLanguage = loadLang();
  }
  return currentLanguage;
}

/**
 * Change la langue actuelle
 * @param {string} lang - Nouvelle langue (doit être dans SUPPORTED_LANGS)
 * @returns {boolean} True si le changement a réussi
 */
export function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) {
    console.warn(`[i18n] Langue non supportée: ${lang}`);
    return false;
  }
  
  const oldLang = currentLanguage;
  currentLanguage = lang;
  saveLang(lang);
  
  // Émettre un événement de changement de langue
  if (eventTarget) {
    eventTarget.dispatchEvent(new CustomEvent('languageChanged', {
      detail: {
        newLang: lang,
        oldLang: oldLang
      }
    }));
  }
  
  return true;
}

/**
 * Bascule vers la langue suivante dans la liste
 * @returns {string} Nouvelle langue sélectionnée
 */
export function toggleLang() {
  const current = currentLang();
  const currentIndex = SUPPORTED_LANGS.indexOf(current);
  const nextIndex = (currentIndex + 1) % SUPPORTED_LANGS.length;
  const nextLang = SUPPORTED_LANGS[nextIndex];
  setLang(nextLang);
  return nextLang;
}

/**
 * Initialise le système d'événements pour les changements de langue
 * @private
 */
function _initEventSystem() {
  if (!eventTarget) {
    eventTarget = new EventTarget();
  }
}

/**
 * Récupère l'EventTarget pour écouter les changements de langue
 * @returns {EventTarget} EventTarget du gestionnaire i18n
 */
export function getEventTarget() {
  if (!eventTarget) {
    _initEventSystem();
  }
  return eventTarget;
}

/**
 * Ajoute un écouteur d'événement pour les changements de langue
 * @param {Function} callback - Fonction à appeler lors du changement
 * @returns {Function} Fonction pour supprimer l'écouteur
 */
export function addLanguageChangeListener(callback) {
  if (!eventTarget) {
    _initEventSystem();
  }
  
  eventTarget.addEventListener('languageChanged', callback);
  
  // Retourne une fonction pour supprimer l'écouteur
  return () => {
    eventTarget.removeEventListener('languageChanged', callback);
  };
}

// ============================================================
// FONCTIONS DE TRADUCTION
// ============================================================

/**
 * Convertit une clé dotée (menu.play) en clé SNAKE_CASE (MENU_PLAY)
 * @param {string} key - Clé au format "section.name"
 * @returns {string} Clé au format "SECTION_NAME"
 */
function normalizeKey(key) {
  // Si déjà en SNAKE_CASE (contient des underscores ou est tout en majuscules)
  if (key.includes('_') || key === key.toUpperCase()) {
    return key;
  }
  // Convertir menu.play -> MENU_PLAY
  return key.replace(/\./g, '_').toUpperCase();
}

/**
 * Récupère une traduction par sa clé
 * Supporte les clés dotées (menu.play) et SNAKE_CASE (MENU_PLAY)
 * Fallback sur le français si la clé n'existe pas dans la langue actuelle
 * @param {string} key - Clé de traduction
 * @returns {string} Texte traduit ou la clé si non trouvée
 */
export function t(key) {
  const lang = currentLang();
  const translations = I18N[lang];
  const normalizedKey = normalizeKey(key);
  
  // Cherche d'abord dans la langue actuelle
  if (translations && translations[normalizedKey]) {
    return translations[normalizedKey];
  }
  
  // Fallback sur le français
  if (FR[normalizedKey]) {
    return FR[normalizedKey];
  }
  
  // Retourne la clé si aucune traduction trouvée
  console.warn(`[i18n] Clé de traduction manquante: ${key}`);
  return key;
}

/**
 * Récupère toutes les traductions pour la langue actuelle
 * @returns {Object} Objet contenant toutes les traductions
 */
export function getAllTranslations() {
  const lang = currentLang();
  return I18N[lang] || FR;
}

/**
 * Vérifie si une clé de traduction existe
 * @param {string} key - Clé à vérifier
 * @returns {boolean} True si la clé existe
 */
export function hasTranslation(key) {
  const lang = currentLang();
  const translations = I18N[lang];
  return !!(translations && translations[key]) || !!FR[key];
}

// ============================================================
// CLASSE I18NMANAGER (ALTERNATIVE POO)
// ============================================================

/**
 * Classe singleton pour gérer l'internationalisation
 * Alternative orientée objet aux fonctions exportées
 */
export class I18nManager {
  constructor() {
    if (I18nManager.instance) {
      return I18nManager.instance;
    }
    I18nManager.instance = this;
    this._lang = loadLang();
  }

  /**
   * Récupère la langue actuelle
   * @returns {string} Code langue
   */
  get lang() {
    return this._lang;
  }

  /**
   * Définit la langue actuelle
   * @param {string} value - Nouveau code langue
   */
  set lang(value) {
    if (SUPPORTED_LANGS.includes(value)) {
      this._lang = value;
      saveLang(value);
    }
  }

  /**
   * Récupère une traduction
   * Supporte les clés dotées (menu.play) et SNAKE_CASE (MENU_PLAY)
   * @param {string} key - Clé de traduction
   * @returns {string} Texte traduit
   */
  t(key) {
    const translations = I18N[this._lang];
    // Convertir menu.play -> MENU_PLAY si nécessaire
    const normalizedKey = key.includes('_') || key === key.toUpperCase()
      ? key
      : key.replace(/\./g, '_').toUpperCase();
    
    if (translations && translations[normalizedKey]) {
      return translations[normalizedKey];
    }
    if (FR[normalizedKey]) {
      return FR[normalizedKey];
    }
    console.warn(`[i18n] Clé de traduction manquante: ${key}`);
    return key;
  }

  /**
   * Bascule vers la langue suivante
   * @returns {string} Nouvelle langue
   */
  toggle() {
    const currentIndex = SUPPORTED_LANGS.indexOf(this._lang);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGS.length;
    this.lang = SUPPORTED_LANGS[nextIndex];
    return this._lang;
  }

  /**
   * Récupère l'instance singleton
   * @returns {I18nManager} Instance unique
   */
  static getInstance() {
    if (!I18nManager.instance) {
      new I18nManager();
    }
    return I18nManager.instance;
  }
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

// Export des fonctions principales pour une utilisation simple
export default {
  t,
  currentLang,
  setLang,
  toggleLang,
  loadLang,
  saveLang,
  hasTranslation,
  getAllTranslations,
  getEventTarget,
  addLanguageChangeListener,
  I18nManager
};