/**
 * helpers.js - Fonctions utilitaires partagées
 * 
 * Ce module contient des fonctions utilitaires génériques utilisées
 * dans tout le projet Flappy Borgy.
 * 
 * @module utils/helpers
 */

// ============================================================
// FONCTIONS MATHÉMATIQUES
// ============================================================

/**
 * Limite une valeur entre un minimum et un maximum
 * @param {number} value - La valeur à limiter
 * @param {number} min - La valeur minimale
 * @param {number} max - La valeur maximale
 * @returns {number} La valeur limitée
 * @example
 * clamp(15, 0, 10) // => 10
 * clamp(-5, 0, 10) // => 0
 * clamp(5, 0, 10)  // => 5
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Génère un nombre aléatoire entre deux valeurs (incluses)
 * @param {number} min - La valeur minimale
 * @param {number} max - La valeur maximale
 * @returns {number} Un entier aléatoire entre min et max
 * @example
 * randomBetween(1, 10) // => 1 à 10
 */
export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Génère un nombre flottant aléatoire entre deux valeurs
 * @param {number} min - La valeur minimale
 * @param {number} max - La valeur maximale
 * @returns {number} Un flottant aléatoire entre min et max
 */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Interpolation linéaire entre deux valeurs
 * @param {number} start - Valeur de départ
 * @param {number} end - Valeur d'arrivée
 * @param {number} t - Facteur d'interpolation (0 à 1)
 * @returns {number} La valeur interpolée
 */
export function lerp(start, end, t) {
  return start + (end - start) * clamp(t, 0, 1);
}

// ============================================================
// FONCTIONS DE FORMATAGE
// ============================================================

/**
 * Formate un nombre avec des séparateurs de milliers
 * @param {number} num - Le nombre à formater
 * @param {string} [separator=' '] - Le séparateur de milliers
 * @returns {string} Le nombre formaté
 * @example
 * formatNumber(1234567) // => "1 234 567"
 * formatNumber(1234567, ',') // => "1,234,567"
 */
export function formatNumber(num, separator = ' ') {
  if (!Number.isFinite(num)) return '0';
  return String(Math.floor(num)).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Formate un nombre avec K/M/B pour les grands nombres
 * @param {number} num - Le nombre à formater
 * @param {number} [decimals=1] - Nombre de décimales
 * @returns {string} Le nombre formaté
 * @example
 * formatCompact(1500) // => "1.5K"
 * formatCompact(1500000) // => "1.5M"
 */
export function formatCompact(num, decimals = 1) {
  if (!Number.isFinite(num)) return '0';
  
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (abs >= 1e9) {
    return sign + (abs / 1e9).toFixed(decimals) + 'B';
  }
  if (abs >= 1e6) {
    return sign + (abs / 1e6).toFixed(decimals) + 'M';
  }
  if (abs >= 1e3) {
    return sign + (abs / 1e3).toFixed(decimals) + 'K';
  }
  
  return sign + Math.floor(abs).toString();
}

/**
 * Formate une durée en millisecondes en format lisible
 * @param {number} ms - Durée en millisecondes
 * @returns {string} Durée formatée (ex: "1:30" ou "0:05")
 */
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formate un pourcentage
 * @param {number} value - Valeur (entre 0 et 1 ou 0 et 100)
 * @param {boolean} [normalized=true] - true si la valeur est entre 0 et 1
 * @returns {string} Pourcentage formaté
 */
export function formatPercent(value, normalized = true) {
  const pct = normalized ? value * 100 : value;
  return Math.round(pct) + '%';
}

// ============================================================
// FONCTIONS DE DATE
// ============================================================

/**
 * Retourne la clé du jour actuel (format YYYY-MM-DD)
 * Utilisé pour les quêtes journalières
 * @returns {string} La clé du jour
 */
export function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Vérifie si une date est aujourd'hui
 * @param {string} dateKey - Clé de date au format YYYY-MM-DD
 * @returns {boolean} true si c'est aujourd'hui
 */
export function isToday(dateKey) {
  return dateKey === getTodayKey();
}

// ============================================================
// FONCTIONS D'IMAGE / TEXTURE
// ============================================================

/**
 * Retourne le rectangle visible (sans les marges transparentes) d'une image
 * Utilisé pour calculer les hitbox des sprites
 * @param {HTMLImageElement} img - L'élément image à analyser
 * @returns {Object|null} Les bornes {x, y, w, h} ou null si erreur
 */
export function getVisibleBounds(img) {
  try {
    const w = img.width | 0;
    const h = img.height | 0;
    if (!w || !h) return null;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    const threshold = 10; // alpha > 10 = pixel visible

    for (let y = 0; y < h; y++) {
      let row = y * w * 4;
      for (let x = 0; x < w; x++) {
        const a = data[row + x * 4 + 3];
        if (a > threshold) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) return null;
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };

  } catch (e) {
    console.warn('[helpers] getVisibleBounds error', e);
    return null;
  }
}

// ============================================================
// FONCTIONS DE VALIDATION
// ============================================================

/**
 * Vérifie si une valeur est un nombre fini valide
 * @param {*} value - La valeur à vérifier
 * @returns {boolean} true si c'est un nombre fini
 */
export function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Vérifie si une chaîne est valide (non vide)
 * @param {*} value - La valeur à vérifier
 * @returns {boolean} true si c'est une chaîne non vide
 */
export function isValidString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Délai asynchrone
 * @param {number} ms - Durée en millisecondes
 * @returns {Promise} Promise résolue après le délai
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce une fonction
 * @param {Function} fn - Fonction à debouncer
 * @param {number} wait - Délai en millisecondes
 * @returns {Function} Fonction debouncée
 */
export function debounce(fn, wait) {
  let timeout = null;
  return function(...args) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Throttle une fonction
 * @param {Function} fn - Fonction à throttler
 * @param {number} wait - Délai minimum entre les appels
 * @returns {Function} Fonction throttlée
 */
export function throttle(fn, wait) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

/**
 * Génère un identifiant unique simple
 * @param {string} [prefix=''] - Préfixe optionnel
 * @returns {string} Un identifiant unique
 */
export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix + timestamp + random;
}

// ============================================================
// EXPORTS PAR DÉFAUT
// ============================================================

export default {
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
  generateId
};