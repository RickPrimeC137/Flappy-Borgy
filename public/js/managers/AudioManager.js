/**
 * AudioManager.js - Gestionnaire audio singleton
 * 
 * Ce module gère toute la partie audio du jeu :
 * - Musique de fond (BGM) avec alternance et modes
 * - Effets sonores (SFX)
 * - Gestion du mute global
 * - Gestion du focus/blur de l'application
 * 
 * @module AudioManager
 */

/**
 * Configuration par défaut des pistes audio
 */
const DEFAULT_BGM_KEYS = ['bgm', 'bgm_alt'];
const BGM_HARD_KEY = 'bgm_hard';
const DEFAULT_BGM_VOLUME = 0.35;
const REDUCED_BGM_VOLUME = 0.15;

/**
 * Classe singleton pour gérer l'audio du jeu
 * @class
 */
class AudioManager {
  /**
   * Crée une instance de l'AudioManager
   */
  constructor() {
    if (AudioManager._instance) {
      return AudioManager._instance;
    }
    AudioManager._instance = this;

    /**
     * Référence au jeu Phaser
     * @type {Phaser.Game|null}
     * @private
     */
    this._game = null;

    /**
     * Référence à la musique de fond actuelle
     * @type {Phaser.Sound.BaseSound|null}
     * @private
     */
    this._bgm = null;

    /**
     * Liste des clés BGM disponibles
     * @type {string[]}
     * @private
     */
    this._bgmKeys = [...DEFAULT_BGM_KEYS];

    /**
     * Index courant dans la rotation des BGM
     * @type {number}
     * @private
     */
    this._bgmIndex = 0;

    /**
     * État du mute
     * @type {boolean}
     * @private
     */
    this._muted = false;

    /**
     * Cache des effets sonores chargés
     * @type {Map<string, Phaser.Sound.BaseSound>}
     * @private
     */
    this._sfxCache = new Map();

    /**
     * Volume par défaut de la BGM
     * @type {number}
     * @private
     */
    this._bgmVolume = DEFAULT_BGM_VOLUME;
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  /**
   * Initialise l'AudioManager avec une référence au jeu Phaser
   * @param {Phaser.Game} game - L'instance du jeu Phaser
   */
  init(game) {
    this._game = game;
    
    // Restaurer l'état du mute depuis les données du jeu si disponible
    if (typeof game._muted !== 'undefined') {
      this._muted = game._muted;
    }
  }

  /**
   * Configure les gestionnaires d'événements focus/blur pour la scène
   * @param {Phaser.Scene} scene - La scène Phaser active
   */
  setupFocusHandlers(scene) {
    if (!scene || !scene.game) return;

    // Supprimer les anciens handlers
    scene.game.events.off(Phaser.Core.Events.BLUR);
    scene.game.events.off(Phaser.Core.Events.FOCUS);

    // Ajouter les nouveaux handlers
    scene.game.events.on(Phaser.Core.Events.BLUR, () => {
      this.pauseBGM();
    });

    scene.game.events.on(Phaser.Core.Events.FOCUS, () => {
      if (!scene.sound.locked) {
        this.resumeBGM();
      }
    });
  }

  // ============================================================
  // GESTION DE LA MUSIQUE DE FOND (BGM)
  // ============================================================

  /**
   * Assure la lecture de la musique de fond
   * @param {Phaser.Scene} scene - La scène Phaser active
   * @param {Object} [options={}] - Options de configuration
   * @param {string} [options.forceKey] - Force une clé BGM spécifique
   * @param {number} [options.volume] - Volume de la BGM (0-1)
   */
  ensureBGM(scene, options = {}) {
    if (!scene || !scene.sound) {
      console.warn('[AudioManager] Scene ou sound manager invalide');
      return;
    }

    const game = scene.game;
    this._game = game;

    // Déterminer la clé BGM à utiliser
    let wantedKey = options.forceKey
      ? options.forceKey
      : this._bgmKeys[this._bgmIndex % this._bgmKeys.length];

    // Incrémenter l'index si pas de forceKey
    if (!options.forceKey) {
      this._bgmIndex = (this._bgmIndex + 1) % this._bgmKeys.length;
    }

    // Si une BGM différente joue déjà, l'arrêter
    if (this._bgm && this._bgm.key !== wantedKey) {
      this.stopBGM();
    }

    // Créer la nouvelle BGM si nécessaire
    if (!this._bgm || this._bgm.destroyed === true) {
      const volume = options.volume ?? this._bgmVolume;
      this._bgm = scene.sound.add(wantedKey, { 
        loop: true, 
        volume: volume 
      });
      
      if (this._muted) {
        this._bgm.setMute(true);
      }
    }

    // Gérer le démarrage (avec unlock audio si nécessaire)
    const startBGM = () => {
      if (!this._bgm?.isPlaying) {
        this._bgm?.play();
      }
    };

    if (scene.sound.locked) {
      // Attendre une interaction utilisateur pour déverrouiller l'audio
      scene.input.once('pointerdown', startBGM);
      scene.input.keyboard?.once('keydown-SPACE', startBGM);
    } else {
      startBGM();
    }

    // Configurer les handlers de focus
    this.setupFocusHandlers(scene);

    // Stocker la référence dans le jeu pour compatibilité
    game._bgm = this._bgm;
    game._muted = this._muted;
  }

  /**
   * Joue la musique du mode Hard
   * @param {Phaser.Scene} scene - La scène Phaser active
   */
  playHardModeBGM(scene) {
    this.ensureBGM(scene, { forceKey: BGM_HARD_KEY });
  }

  /**
   * Joue la BGM (démarre ou reprend)
   */
  playBGM() {
    if (this._bgm && !this._bgm.isPlaying && !this._bgm.destroyed) {
      this._bgm.play();
    }
  }

  /**
   * Met en pause la BGM
   */
  pauseBGM() {
    if (this._bgm && !this._bgm.destroyed) {
      try {
        this._bgm.pause();
      } catch (e) {
        // Ignorer les erreurs de pause
      }
    }
  }

  /**
   * Reprend la lecture de la BGM
   */
  resumeBGM() {
    if (this._bgm && !this._muted && !this._bgm.destroyed) {
      try {
        this._bgm.resume();
      } catch (e) {
        // Ignorer les erreurs de reprise
      }
    }
  }

  /**
   * Arrête la BGM
   */
  stopBGM() {
    if (this._bgm) {
      try {
        this._bgm.stop();
      } catch (e) {
        // Ignorer les erreurs d'arrêt
      }
      try {
        this._bgm.destroy();
      } catch (e) {
        // Ignorer les erreurs de destruction
      }
      this._bgm = null;
    }
  }

  /**
   * Définit le volume de la BGM
   * @param {number} volume - Volume entre 0 et 1
   */
  setBGMVolume(volume) {
    this._bgmVolume = Math.max(0, Math.min(1, volume));
    if (this._bgm && !this._bgm.destroyed) {
      this._bgm.setVolume(this._bgmVolume);
    }
  }

  /**
   * Réduit temporairement le volume de la BGM
   */
  reduceBGMVolume() {
    if (this._bgm && !this._bgm.destroyed) {
      this._bgm.setVolume(REDUCED_BGM_VOLUME);
    }
  }

  /**
   * Restaure le volume normal de la BGM
   */
  restoreBGMVolume() {
    if (this._bgm && !this._bgm.destroyed && !this._muted) {
      this._bgm.setVolume(this._bgmVolume);
    }
  }

  // ============================================================
  // GESTION DES EFFETS SONORES (SFX)
  // ============================================================

  /**
   * Charge un effet sonore
   * @param {Phaser.Scene} scene - La scène Phaser
   * @param {string} key - La clé de l'effet sonore
   * @param {Object} [config={}] - Configuration optionnelle
   * @returns {Phaser.Sound.BaseSound|null} L'effet sonore chargé
   */
  loadSFX(scene, key, config = {}) {
    if (!scene || !scene.sound) return null;

    if (this._sfxCache.has(key)) {
      return this._sfxCache.get(key);
    }

    // Configuration par défaut : permettre les lectures multiples pour éviter les blocages
    const defaultConfig = {
      volume: 0.6,
      overlap: true  // Permet de jouer plusieurs instances du même son simultanément
    };

    const sfx = scene.sound.add(key, {
      ...defaultConfig,
      ...config
    });

    this._sfxCache.set(key, sfx);
    return sfx;
  }

  /**
   * Joue un effet sonore
   * @param {string} key - La clé de l'effet sonore
   * @param {Object} [config={}] - Configuration optionnelle
   */
  playSFX(key, config = {}) {
    if (this._muted) return;

    const sfx = this._sfxCache.get(key);
    if (sfx && !sfx.destroyed) {
      sfx.play(config);
    }
  }

  /**
   * Joue un effet sonore avec callback de fin
   * @param {string} key - La clé de l'effet sonore
   * @param {Function} onComplete - Callback appelé à la fin
   */
  playSFXWithCallback(key, onComplete) {
    if (this._muted) {
      onComplete?.();
      return;
    }

    const sfx = this._sfxCache.get(key);
    if (sfx && !sfx.destroyed) {
      sfx.once('complete', () => {
        onComplete?.();
      });
      sfx.play();
    } else {
      onComplete?.();
    }
  }

  // ============================================================
  // GESTION DU MUTE
  // ============================================================

  /**
   * Bascule l'état du mute
   * @returns {boolean} Le nouvel état du mute
   */
  toggleMute() {
    this._muted = !this._muted;
    
    if (this._bgm && !this._bgm.destroyed) {
      this._bgm.setMute(this._muted);
    }

    // Mettre à jour la référence du jeu
    if (this._game) {
      this._game._muted = this._muted;
    }

    return this._muted;
  }

  /**
   * Active le mute
   */
  mute() {
    this._muted = true;
    
    if (this._bgm && !this._bgm.destroyed) {
      this._bgm.setMute(true);
    }

    if (this._game) {
      this._game._muted = true;
    }
  }

  /**
   * Désactive le mute
   */
  unmute() {
    this._muted = false;
    
    if (this._bgm && !this._bgm.destroyed) {
      this._bgm.setMute(false);
    }

    if (this._game) {
      this._game._muted = false;
    }
  }

  /**
   * Retourne l'état actuel du mute
   * @returns {boolean} true si muté
   */
  isMuted() {
    return this._muted;
  }

  // ============================================================
  // MÉTHODES UTILITAIRES
  // ============================================================

  /**
   * Nettoie tous les sons et libère les ressources
   */
  cleanup() {
    this.stopBGM();
    
    this._sfxCache.forEach((sfx, key) => {
      try {
        if (sfx && !sfx.destroyed) {
          sfx.destroy();
        }
      } catch (e) {
        // Ignorer les erreurs
      }
    });
    
    this._sfxCache.clear();
    this._bgmIndex = 0;
  }

  /**
   * Retourne l'icône du bouton mute selon l'état
   * @returns {string} L'emoji correspondant
   */
  getMuteIcon() {
    return this._muted ? '🔇' : '🔊';
  }

  /**
   * Vérifie si une BGM est en cours de lecture
   * @returns {boolean} true si une BGM joue
   */
  isBGMPlaying() {
    return this._bgm && !this._bgm.destroyed && this._bgm.isPlaying;
  }

  /**
   * Retourne la clé de la BGM actuelle
   * @returns {string|null} La clé ou null
   */
  getCurrentBGMKey() {
    return this._bgm?.key ?? null;
  }
}

// Instance singleton
const audioManager = new AudioManager();

export default audioManager;
export { AudioManager };