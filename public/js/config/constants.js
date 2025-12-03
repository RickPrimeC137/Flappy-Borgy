/**
 * constants.js - Constantes globales du jeu Flappy Borgy
 * 
 * Ce fichier centralise toutes les constantes utilisées dans le jeu :
 * - Dimensions et physique
 * - Configuration des éléments visuels
 * - Clés de stockage localStorage
 * - Paramètres de difficulté
 * - Configuration des bonus et récompenses
 */

// ============================================================
// DIMENSIONS DU JEU
// ============================================================

/** Largeur du canvas de jeu (monde logique Phaser) */
export const GAME_W = 1024;

/** Hauteur du canvas de jeu (monde logique Phaser) */
export const GAME_H = 1536;

// ============================================================
// ZOOM GLOBAL DU JEU
// ============================================================

/**
 * Zoom global de la caméra en jeu
 * 1   = taille normale
 * < 1 = dézoomer (tout plus petit, plus d'espace visible)
 * > 1 = zoomer (tout plus gros, moins d'espace visible)
 */
export const GAME_ZOOM = 1; // ajuste entre 0.8 et 1.0 selon ton feeling

// ============================================================
// PROFIL PHYSIQUE DU JEU
// ============================================================

/**
 * Profil physique par défaut du jeu
 * @property {number} gravity - Gravité appliquée au joueur
 * @property {number} jump - Vélocité verticale lors d'un saut (négatif = vers le haut)
 * @property {number} pipeSpeed - Vitesse horizontale des tuyaux (négatif = vers la gauche)
 * @property {number} gap - Espace vertical entre les tuyaux (en pixels)
 * @property {number} spawnDelay - Délai entre chaque spawn de paire de tuyaux (en ms)
 */
export const PROFILE = {
  gravity: 1000,
  jump: -390,
  pipeSpeed: -220,
  // un peu plus de place entre les tuyaux pour respirer sur mobile
  gap: 230,          // avant: 260
  spawnDelay: 2450
};

// ============================================================
// CONFIGURATION DES TUYAUX
// ============================================================

/** Padding général */
export const PAD = 2;

/** Largeur du corps du tuyau (ratio) */
export const PIPE_BODY_W = 0.92;

/** Largeur d'affichage des tuyaux en pixels */
export const PIPE_W_DISPLAY = 168;   // avant: 180 (tuyaux légèrement plus fins)

/** Scale du joueur (légèrement réduit pour bien caser tous les skins) */
export const PLAYER_SCALE = 0.22;    // avant: 0.20 (Borgy plus petit)

/** Largeur de la hitbox des tuyaux (1 = largeur complète, 0.6 = plus serré) */
export const PIPE_HITBOX_W = 0.6;

/** Dépassement des tuyaux au-delà de l'écran */
export const PIPE_OVERSCAN = 160;

/** Chevauchement des joints de tuyaux */
export const JOINT_OVERLAP = 1;

/** Marge pour la destruction des éléments hors écran */
export const KILL_MARGIN = 260;

/** Offset X pour le spawn des tuyaux */
export const SPAWN_X_OFFSET = 100;

/** Distance horizontale minimale entre deux paires de tuyaux */
export const MIN_PAIR_DIST_PX = 360;

// ============================================================
// CLÉS DES ARRIÈRE-PLANS
// ============================================================

/** Clé du fond par défaut (montagnes) */
export const BG_KEY = "bg_mountains";

/** Clé du fond mode Hard (volcan) */
export const BG_HARD_KEY = "bg_volcano";

/** Clé du fond mode Noël */
export const BG_XMAS_KEY = "bg_noel";

// ============================================================
// ZONE DE JEU (PLAYFIELD)
// ============================================================

/** Pourcentage de la hauteur pour le haut de la zone de jeu */
export const PLAYFIELD_TOP_PCT = 0.30;

/** Pourcentage de la hauteur pour le bas de la zone de jeu */
export const PLAYFIELD_BOT_PCT = 0.85;

/** Pourcentage max pour le bord des tuyaux */
export const PIPE_RIM_MAX_PCT = 0.75;

// ============================================================
// CONFIGURATION DES KILL BANDS
// ============================================================

/** Active/désactive les bandes de mort (les nuages font office de murs) */
export const ENABLE_KILL_BANDS = false;

// ============================================================
// CONFIGURATION DES BONUS
// ============================================================

/** Active/désactive les bonus SwissBorg */
export const ENABLE_BONUS = true;

/** Nombre de paires avant l'apparition d'un bonus */
export const BONUS_EVERY = 20;

/** Durée du bonus multiplicateur en millisecondes */
export const BONUS_DURATION = 15000;

// ============================================================
// CONFIGURATION DES NUAGES (BANDES HAUT/BAS)
// ============================================================

/** Hauteur du nuage du haut (% de la hauteur totale) */
export const CLOUD_TOP_HEIGHT_PCT = 0.11;

/** Hauteur du nuage du bas (% de la hauteur totale) */
export const CLOUD_BOTTOM_HEIGHT_PCT = 0.02;

/** Scale X supplémentaire pour éviter les trous sur les côtés */
export const CLOUD_EXTRA_SCALE_X = 1.25;

/** Décalage vers le bas de la hitbox du nuage du bas (en pixels) */
export const BOTTOM_CLOUD_HITBOX_OFFSET_PX = 40;

// ============================================================
// MODE HARD - ANIMATION "PORTES"
// ============================================================

/** Amplitude du mouvement des portes en mode Hard (en pixels) */
export const HARD_DOOR_AMPLITUDE_PX = 70;

/** Demi-période de l'animation des portes (en ms) */
export const HARD_DOOR_HALF_PERIOD = 900;

// ============================================================
// CONFIGURATION DE LA DIFFICULTÉ PROGRESSIVE
// ============================================================

/**
 * Paramètres de difficulté progressive
 * @property {number} stepMs - Intervalle entre chaque augmentation de difficulté
 * @property {number} speedDelta - Augmentation de vitesse par step (négatif = plus rapide)
 * @property {number} delayDelta - Réduction du délai de spawn par step
 * @property {number} minSpeed - Vitesse minimale (la plus rapide)
 * @property {number} minDelay - Délai minimal entre les spawns
 * @property {number} cooldownMs - Cooldown minimal entre deux spawns
 */
export const DIFF = {
  stepMs: 14000,
  speedDelta: -20,
  delayDelta: -150,
  minSpeed: -380,
  minDelay: 1250,
  cooldownMs: 265,
  
  // Configuration Mode Normal
  NORMAL: {
    PIPE_SPAWN_DELAY: 2000,
    BONUS_SPAWN_DELAY: 8000,
    COIN_SPAWN_DELAY: 3000,
    BOT_SPAWN_DELAY: 10000
  },
  
  // Configuration Mode Hard (spawn plus rapide, délais réduits)
  HARD: {
    PIPE_SPAWN_DELAY: 1800,
    BONUS_SPAWN_DELAY: 6000,
    COIN_SPAWN_DELAY: 2500,
    BOT_SPAWN_DELAY: 7000
  }
};

// ============================================================
// CLÉS DE STOCKAGE LOCALSTORAGE
// ============================================================

/** Clé pour stocker les Borgy Coins */
export const BORGY_COINS_KEY = "flappy_borgy_coins_v1";

/** Clé pour stocker le meilleur score local */
export const LOCAL_BEST_KEY = "flappy_borgy_bestscore_v1";

/** Clé pour stocker le dernier score */
export const LOCAL_LAST_KEY = "flappy_borgy_lastscore_v1";

/** Clé pour stocker l'état de la popup de bienvenue */
export const WELCOME_POPUP_KEY = "flappy_borgy_welcome_seen_v1";

/** Clé pour stocker le mode Noël */
export const XMAS_MODE_KEY = "flappy_borgy_xmas_mode_v1";

/** Clé pour stocker les tuyaux dorés */
export const GOLD_PIPES_KEY = "flappy_borgy_goldpipes_v1";

/** Clé pour stocker les quêtes */
export const QUEST_STORAGE_KEY = "flappy_borgy_quests_v1";

/** Clé pour stocker l'état des skins */
export const SKINS_STORAGE_KEY = "flappy_borgy_skins_v1";

/** Clé pour stocker la langue */
export const LANG_STORAGE_KEY = "flappy_borgy_lang_v1";

/** Clé pour stocker le mode Hard */
export const HARD_MODE_KEY = "flappy_borgy_hard";

// ============================================================
// CONFIGURATION DE L'API
// ============================================================

/** URL de base de l'API backend */
export const API_BASE = "https://rickprimec137-flappyborgyv15.onrender.com";

// ============================================================
// LANGUES SUPPORTÉES
// ============================================================

/** Liste des langues supportées */
export const SUPPORTED_LANGS = ["fr", "en"];

/** Langue par défaut */
export const DEFAULT_LANG = "fr";

/**
 * Options de langues avec labels pour l'affichage
 */
export const LANG_OPTIONS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" }
];

// ============================================================
// OBJET DE TOUTES LES CLÉS DE STOCKAGE
// ============================================================

/**
 * Objet regroupant toutes les clés de stockage pour accès facile
 */
export const STORAGE_KEYS = {
  COINS: BORGY_COINS_KEY,
  BEST_SCORE: LOCAL_BEST_KEY,
  LAST_SCORE: LOCAL_LAST_KEY,
  WELCOME: WELCOME_POPUP_KEY,
  XMAS: XMAS_MODE_KEY,
  GOLD_PIPES: GOLD_PIPES_KEY,
  QUESTS: QUEST_STORAGE_KEY,
  SKINS: SKINS_STORAGE_KEY,
  LANG: LANG_STORAGE_KEY,
  HARD_MODE: HARD_MODE_KEY
};





