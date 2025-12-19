/**
 * skinConfig.js - Configuration des skins du jeu Flappy Borgy
 * 
 * Ce fichier contient :
 * - La définition de tous les skins joueur disponibles
 * - La configuration des backgrounds du jeu
 * - Les perks spéciaux associés à certains skins
 */

// ============================================================
// DÉFINITION DES SKINS JOUEUR
// ============================================================

/**
 * Liste des skins disponibles dans le jeu
 * 
 * @property {string} id - Identifiant unique du skin
 * @property {string} key - Clé de la texture Phaser
 * @property {string} name - Nom affiché dans le shop
 * @property {number} price - Prix en Borgy Coins (0 = gratuit)
 * @property {boolean} ownedByDefault - Si le skin est possédé par défaut
 * @property {string} [perk] - Perk spécial du skin (optionnel)
 */
export const SKINS_DEF = [
  { 
    id: "borgy_default",  
    key: "borgy",           
    name: "Borgy Classique",  
    price: 0,    
    ownedByDefault: true  
  },
  { 
    id: "borgy_knight",   
    key: "borgy_knight",    
    name: "Borgy Chevalier",  
    price: 1000, 
    ownedByDefault: false 
  },
  { 
    id: "borgy_dragon",   
    key: "borgy_dragon",    
    name: "Borgy Dragon",     
    price: 1500, 
    ownedByDefault: false 
  },
  { 
    id: "borgy_space",    
    key: "borgy_space",     
    name: "Borgy Astronaute", 
    price: 2000, 
    ownedByDefault: false 
  },
  { 
    id: "borgy_cyber",    
    key: "borgy_cyber",     
    name: "Borgy Cyber",      
    price: 2500, 
    ownedByDefault: false 
  },
  { 
    id: "borgy_cowboy",   
    key: "borgy_cowboy",    
    name: "Borgy Cow-boy",    
    price: 3000, 
    ownedByDefault: false 
  },
  { 
    id: "borgy_gold",     
    key: "borgy_gold",      
    name: "Borgy Gold",       
    price: 10000, 
    ownedByDefault: false,
    perk: "SHOP_PERK_GOLD" // Borgy Coins x5
  },
  { 
    id: "borgy_emeraude", 
    key: "borgy_emeraude",  
    name: "Borgy Émeraude",   
    price: 15000, 
    ownedByDefault: false,
    perk: "SHOP_PERK_EMERALD" // Bonus SwissBorg x3
  },
  { 
    id: "borgy_diamant",  
    key: "borgy_diamant",   
    name: "Borgy Diamant",    
    price: 20000, 
    ownedByDefault: false,
    perk: "SHOP_PERK_DIAMOND" // 1 vie supplémentaire
  }
  // NB : le skin Noël "borgy_xmas" n'est PAS dans le shop, il est automatique en mode Noël
];

// ============================================================
// SKIN SPÉCIAL NOËL
// ============================================================

/**
 * Configuration du skin Noël (utilisé automatiquement en mode Noël)
 */
export const XMAS_SKIN = {
  id: "borgy_xmas",
  key: "borgy_xmas",
  name: "Borgy Noël",
  price: 0,
  ownedByDefault: false, // Non acheté, automatique en mode Noël
  isSpecial: true
};

// ============================================================
// CONFIGURATION DES BACKGROUNDS
// ============================================================

/**
 * Configuration des backgrounds disponibles
 */
export const BACKGROUNDS = {
  // Background par défaut (montagnes)
  default: {
    key: "bg_mountains",
    file: "bg_mountains.png"
  },
  // Background mode Hard (volcan)
  hard: {
    key: "bg_volcano",
    file: "bg_volcano.png"
  },
  // Background mode Noël
  xmas: {
    key: "bg_noel",
    file: "bg_noel.png"
  }
};

// ============================================================
// CONFIGURATION DES TUYAUX PAR MODE
// ============================================================

/**
 * Configuration des sprites de tuyaux selon le mode
 */
export const PIPE_CONFIGS = {
  // Tuyaux par défaut
  default: {
    top: "pipe_top",
    bottom: "pipe_bottom"
  },
  // Tuyaux dorés (mode normal uniquement)
  gold: {
    top: "pipe_top_gold",
    bottom: "pipe_bottom_gold"
  },
  // Tuyaux mode Noël
  xmas: {
    top: "pipe_top_ice",
    bottom: "pipe_bottom_snow"
  }
};

// ============================================================
// CONFIGURATION DU ROBOT
// ============================================================

/**
 * Configuration des sprites de robot selon le mode
 */
export const ROBOT_CONFIGS = {
  default: "sb_robot",
  xmas: "sb_robot_xmas"
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Récupère la définition d'un skin par son ID
 * @param {string} skinId - ID du skin à rechercher
 * @returns {Object|null} Définition du skin ou null si non trouvé
 */
export function getSkinById(skinId) {
  return SKINS_DEF.find(s => s.id === skinId) || null;
}

/**
 * Récupère la définition d'un skin par sa clé de texture
 * @param {string} skinKey - Clé de texture du skin
 * @returns {Object|null} Définition du skin ou null si non trouvé
 */
export function getSkinByKey(skinKey) {
  return SKINS_DEF.find(s => s.key === skinKey) || null;
}

/**
 * Récupère tous les skins possédés par défaut
 * @returns {Object[]} Liste des skins possédés par défaut
 */
export function getDefaultOwnedSkins() {
  return SKINS_DEF.filter(s => s.ownedByDefault);
}

/**
 * Vérifie si un skin a un perk spécial
 * @param {string} skinId - ID du skin
 * @returns {boolean} True si le skin a un perk
 */
export function skinHasPerk(skinId) {
  const skin = getSkinById(skinId);
  return skin && !!skin.perk;
}

/**
 * Récupère le perk d'un skin
 * @param {string} skinId - ID du skin
 * @returns {string|null} Clé du perk ou null
 */
export function getSkinPerk(skinId) {
  const skin = getSkinById(skinId);
  return skin?.perk || null;
}