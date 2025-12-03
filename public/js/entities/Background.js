/**
 * Background.js - Gestionnaire d'arrière-plan
 * 
 * Classe gérant l'affichage de l'arrière-plan du jeu selon le thème actif.
 * Supporte également l'effet de neige pour le mode Noël.
 * 
 * @module entities/Background
 */

import { BG_KEY, BG_HARD_KEY, BG_XMAS_KEY } from '../config/constants.js';
import { BACKGROUNDS } from '../config/skinConfig.js';

/**
 * Types de thèmes d'arrière-plan
 * @enum {string}
 */
export const BackgroundTheme = {
  /** Thème par défaut (montagnes) */
  DEFAULT: 'default',
  /** Thème mode Hard (volcan) */
  HARD: 'hard',
  /** Thème mode Noël */
  XMAS: 'xmas'
};

/**
 * Classe gérant l'arrière-plan du jeu
 */
export class Background {
  /**
   * Crée un gestionnaire d'arrière-plan
   * @param {Phaser.Scene} scene - La scène Phaser parente
   * @param {Object} [config={}] - Configuration
   * @param {string} [config.theme=BackgroundTheme.DEFAULT] - Thème initial
   * @param {boolean} [config.isHard=false] - Mode Hard activé
   * @param {boolean} [config.isXmas=false] - Mode Noël activé
   */
  constructor(scene, config = {}) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {boolean} */
    this.isHard = config.isHard || false;
    
    /** @type {boolean} */
    this.isXmas = config.isXmas || false;
    
    /** @type {string} */
    this.currentTheme = this._determineTheme(config);
    
    /** @type {Phaser.GameObjects.Image|null} */
    this.image = null;
    
    /** @type {Phaser.GameObjects.Particles.ParticleEmitter|null} */
    this.snowEmitter = null;
  }

  /**
   * Détermine le thème à utiliser selon la configuration
   * @private
   * @param {Object} config - Configuration
   * @returns {string} Clé du thème
   */
  _determineTheme(config) {
    if (config.isXmas) {
      return BackgroundTheme.XMAS;
    }
    if (config.isHard) {
      return BackgroundTheme.HARD;
    }
    return config.theme || BackgroundTheme.DEFAULT;
  }

  /**
   * Récupère la clé de texture pour le thème actuel
   * @private
   * @returns {string} Clé de la texture
   */
  _getTextureKey() {
    switch (this.currentTheme) {
      case BackgroundTheme.XMAS:
        return BG_XMAS_KEY;
      case BackgroundTheme.HARD:
        return BG_HARD_KEY;
      default:
        return BG_KEY;
    }
  }

  /**
   * Crée et affiche l'arrière-plan
   * @returns {Background} L'instance pour le chaînage
   */
  create() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    
    // Récupération de la clé de texture
    let textureKey = this._getTextureKey();
    
    // Vérification que la texture existe
    if (!this.scene.textures.exists(textureKey)) {
      console.warn(`Background texture "${textureKey}" not found, falling back to default`);
      textureKey = BG_KEY;
    }
    
    // Création de l'image d'arrière-plan
    this.image = this.scene.add.image(W / 2, H / 2, textureKey)
      .setDepth(-10)
      .setScrollFactor(0);
    
    // Scale pour couvrir l'écran
    const scaleX = W / this.image.width;
    const scaleY = H / this.image.height;
    this.image.setScale(Math.max(scaleX, scaleY));
    
    // Effet de neige en mode Noël
    if (this.currentTheme === BackgroundTheme.XMAS) {
      this._createSnowEffect();
    }
    
    return this;
  }

  /**
   * Crée l'effet de neige pour le mode Noël
   * @private
   */
  _createSnowEffect() {
    const W = this.scene.scale.width;
    
    // Vérification que la texture de flocon existe
    if (!this.scene.textures.exists('snow_flake')) {
      console.warn('Snow flake texture not found, skipping snow effect');
      return;
    }
    
    // Création de l'émetteur de particules
    this.snowEmitter = this.scene.add.particles(0, 0, 'snow_flake', {
      x: { min: 0, max: W },
      y: -10,
      lifespan: 4000,
      speedY: { min: 60, max: 120 },
      scale: { start: 0.7, end: 0.3 },
      quantity: 3,
      frequency: 120,
      angle: { min: 80, max: 100 }
    });
    
    this.snowEmitter.setDepth(9);
  }

  /**
   * Change le thème de l'arrière-plan
   * @param {string} theme - Nouveau thème (DEFAULT, HARD, XMAS)
   * @returns {Background} L'instance pour le chaînage
   */
  setTheme(theme) {
    if (this.currentTheme === theme) return this;
    
    this.currentTheme = theme;
    this.isXmas = (theme === BackgroundTheme.XMAS);
    this.isHard = (theme === BackgroundTheme.HARD);
    
    // Mise à jour de l'image
    if (this.image) {
      const textureKey = this._getTextureKey();
      
      if (this.scene.textures.exists(textureKey)) {
        this.image.setTexture(textureKey);
        
        // Recalcul du scale
        const W = this.scene.scale.width;
        const H = this.scene.scale.height;
        const scaleX = W / this.image.width;
        const scaleY = H / this.image.height;
        this.image.setScale(Math.max(scaleX, scaleY));
      }
    }
    
    // Gestion de l'effet de neige
    if (this.currentTheme === BackgroundTheme.XMAS && !this.snowEmitter) {
      this._createSnowEffect();
    } else if (this.currentTheme !== BackgroundTheme.XMAS && this.snowEmitter) {
      this._destroySnowEffect();
    }
    
    return this;
  }

  /**
   * Arrête et détruit l'effet de neige
   * @private
   */
  _destroySnowEffect() {
    if (this.snowEmitter) {
      this.snowEmitter.stop();
      this.snowEmitter.destroy();
      this.snowEmitter = null;
    }
  }

  /**
   * Active le thème selon les modes de jeu
   * @param {boolean} isHard - Mode Hard
   * @param {boolean} isXmas - Mode Noël
   * @returns {Background} L'instance pour le chaînage
   */
  updateFromGameModes(isHard, isXmas) {
    let newTheme = BackgroundTheme.DEFAULT;
    
    // Priorité : Noël > Hard > Défaut
    if (isXmas) {
      newTheme = BackgroundTheme.XMAS;
    } else if (isHard) {
      newTheme = BackgroundTheme.HARD;
    }
    
    return this.setTheme(newTheme);
  }

  /**
   * Met en pause l'effet de neige
   */
  pauseSnow() {
    if (this.snowEmitter) {
      this.snowEmitter.pause();
    }
  }

  /**
   * Reprend l'effet de neige
   */
  resumeSnow() {
    if (this.snowEmitter) {
      this.snowEmitter.resume();
    }
  }

  /**
   * Récupère l'image d'arrière-plan
   * @returns {Phaser.GameObjects.Image|null} L'image
   */
  getImage() {
    return this.image;
  }

  /**
   * Récupère le thème actuel
   * @returns {string} Clé du thème
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Vérifie si le mode Noël est actif
   * @returns {boolean} True si mode Noël
   */
  isXmasMode() {
    return this.currentTheme === BackgroundTheme.XMAS;
  }

  /**
   * Vérifie si le mode Hard est actif
   * @returns {boolean} True si mode Hard
   */
  isHardMode() {
    return this.currentTheme === BackgroundTheme.HARD;
  }

  /**
   * Détruit l'arrière-plan et libère les ressources
   */
  destroy() {
    // Destruction de l'effet de neige
    this._destroySnowEffect();
    
    // Destruction de l'image
    if (this.image) {
      this.image.destroy();
      this.image = null;
    }
  }
}

/**
 * Factory pour créer des arrière-plans préconfigurés
 */
export class BackgroundFactory {
  /**
   * Crée un arrière-plan pour le menu
   * @param {Phaser.Scene} scene - La scène
   * @returns {Background} L'arrière-plan créé
   */
  static createForMenu(scene) {
    return new Background(scene, { theme: BackgroundTheme.DEFAULT }).create();
  }

  /**
   * Crée un arrière-plan pour le jeu
   * @param {Phaser.Scene} scene - La scène
   * @param {Object} gameState - État du jeu
   * @param {boolean} gameState.isHard - Mode Hard
   * @param {boolean} gameState.isXmas - Mode Noël
   * @returns {Background} L'arrière-plan créé
   */
  static createForGame(scene, gameState) {
    return new Background(scene, {
      isHard: gameState.isHard,
      isXmas: gameState.isXmas
    }).create();
  }
}

export default Background;