/**
 * Bot.js - Entité des robots ennemis
 * 
 * Classe représentant les robots SwissBorg qui sortent des tuyaux
 * et causent une mort instantanée au contact du joueur.
 * Apparaît tous les 15 tuyaux environ.
 * 
 * @module entities/Bot
 */

import { ROBOT_CONFIGS } from '../config/skinConfig.js';

/**
 * Position de spawn du robot
 * @enum {string}
 */
export const BotPosition = {
  /** Robot sortant du tuyau du haut */
  TOP: 'top',
  /** Robot sortant du tuyau du bas */
  BOTTOM: 'bottom'
};

/**
 * Classe représentant un robot ennemi
 */
export class Bot {
  /**
   * Crée un robot ennemi
   * @param {Phaser.Scene} scene - La scène Phaser parente
   * @param {Object} config - Configuration du robot
   * @param {number} config.x - Position X
   * @param {number} config.pipeY - Position Y du bord du tuyau
   * @param {string} config.position - Position (TOP ou BOTTOM)
   * @param {number} config.speed - Vitesse de déplacement horizontal
   * @param {boolean} [config.isXmas=false] - Mode Noël activé
   */
  constructor(scene, config) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {string} */
    this.position = config.position || BotPosition.BOTTOM;
    
    /** @type {number} */
    this.speed = config.speed || 0;
    
    /** @type {number} */
    this.pipeY = config.pipeY;
    
    /** @type {boolean} */
    this.isXmas = config.isXmas || false;
    
    /** @type {number} */
    this.scale = 0.14;
    
    // Sélection du sprite selon le mode
    const spriteKey = this.isXmas ? ROBOT_CONFIGS.xmas : ROBOT_CONFIGS.default;
    
    // Création du sprite physique
    /** @type {Phaser.Physics.Arcade.Image} */
    this.sprite = scene.physics.add.image(config.x, config.pipeY, spriteKey)
      .setDepth(5)
      .setScale(this.scale)
      .setImmovable(true);
    
    // Flip si le robot sort du haut
    if (this.position === BotPosition.TOP) {
      this.sprite.setFlipY(true);
    }
    
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setVelocityX(this.speed);
    
    // Configuration de la hitbox
    this._setupHitbox();
    
    // Animation de va-et-vient
    /** @type {Phaser.Tweens.Tween|null} */
    this.animationTween = null;
    this._startAnimation();
  }

  /**
   * Configure la hitbox du robot
   * @private
   */
  _setupHitbox() {
    const bw = this.sprite.displayWidth * 0.65;
    const bh = this.sprite.displayHeight * 0.9;
    this.sprite.body.setSize(bw, bh, true);
  }

  /**
   * Démarre l'animation de va-et-vient
   * @private
   */
  _startAnimation() {
    const h = this.sprite.displayHeight;
    
    let yHidden, yShown;
    
    if (this.position === BotPosition.BOTTOM) {
      yHidden = this.pipeY + h * 0.6;
      yShown = this.pipeY;
    } else {
      yHidden = this.pipeY - h * 0.6;
      yShown = this.pipeY;
    }
    
    // Position initiale cachée
    this.sprite.y = yHidden;
    
    // Animation yoyo
    this.animationTween = this.scene.tweens.add({
      targets: this.sprite,
      y: { from: yHidden, to: yShown },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  /**
   * Met à jour la vitesse du robot
   * @param {number} newSpeed - Nouvelle vitesse
   */
  setSpeed(newSpeed) {
    this.speed = newSpeed;
    if (this.sprite?.body) {
      this.sprite.body.setVelocityX(newSpeed);
    }
  }

  /**
   * Met à jour le robot (appelé chaque frame)
   * @param {number} killMargin - Marge pour la destruction hors écran
   */
  update(killMargin) {
    if (!this.sprite || !this.sprite.active) return;
    
    // Destruction si hors écran
    if (this.sprite.x < -killMargin) {
      this.destroy();
    }
  }

  /**
   * Vérifie si le robot est actif
   * @returns {boolean} True si actif
   */
  get active() {
    return this.sprite?.active || false;
  }

  /**
   * Récupère la position X
   * @returns {number} Position X
   */
  get x() {
    return this.sprite?.x || 0;
  }

  /**
   * Récupère la position Y
   * @returns {number} Position Y
   */
  get y() {
    return this.sprite?.y || 0;
  }

  /**
   * Détruit le robot et libère les ressources
   */
  destroy() {
    // Arrêt de l'animation
    if (this.animationTween) {
      try {
        this.animationTween.stop();
        this.animationTween.remove();
      } catch (e) {}
      this.animationTween = null;
    }
    
    // Destruction du sprite
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}

/**
 * Gestionnaire des robots ennemis
 */
export class BotManager {
  /**
   * Crée un gestionnaire de robots
   * @param {Phaser.Scene} scene - La scène Phaser
   * @param {Phaser.Physics.Arcade.Group} botsGroup - Groupe physique des robots
   * @param {Object} [config={}] - Configuration
   * @param {boolean} [config.isXmas=false] - Mode Noël
   * @param {number} [config.spawnInterval=15] - Intervalle de spawn (en nombre de paires)
   */
  constructor(scene, botsGroup, config = {}) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {Phaser.Physics.Arcade.Group} */
    this.botsGroup = botsGroup;
    
    /** @type {Bot[]} */
    this.bots = [];
    
    /** @type {boolean} */
    this.isXmas = config.isXmas || false;
    
    /** @type {number} */
    this.spawnInterval = config.spawnInterval || 15;
  }

  /**
   * Vérifie si un robot doit être spawné
   * @param {number} pairsSpawned - Nombre de paires de tuyaux spawnées
   * @returns {boolean} True si un robot doit être spawné
   */
  shouldSpawn(pairsSpawned) {
    return pairsSpawned > 0 && pairsSpawned % this.spawnInterval === 0;
  }

  /**
   * Spawn un robot sur un tuyau
   * @param {Object} pipeData - Données du tuyau
   * @param {number} pipeData.x - Position X du tuyau
   * @param {number} pipeData.topY - Position Y du bord du tuyau du haut
   * @param {number} pipeData.bottomY - Position Y du bord du tuyau du bas
   * @param {number} speed - Vitesse de déplacement
   * @returns {Bot} Le robot créé
   */
  spawn(pipeData, speed) {
    // Position aléatoire : haut ou bas
    const fromBottom = Phaser.Math.Between(0, 1) === 0;
    
    const position = fromBottom ? BotPosition.BOTTOM : BotPosition.TOP;
    const pipeY = fromBottom ? pipeData.bottomY : pipeData.topY;
    
    const bot = new Bot(this.scene, {
      x: pipeData.x,
      pipeY: pipeY,
      position: position,
      speed: speed,
      isXmas: this.isXmas
    });
    
    this.bots.push(bot);
    this.botsGroup.add(bot.sprite);
    
    return bot;
  }

  /**
   * Spawn un robot forcé sur une position spécifique
   * @param {number} x - Position X
   * @param {number} pipeY - Position Y du bord du tuyau
   * @param {string} position - TOP ou BOTTOM
   * @param {number} speed - Vitesse
   * @returns {Bot} Le robot créé
   */
  spawnAt(x, pipeY, position, speed) {
    const bot = new Bot(this.scene, {
      x: x,
      pipeY: pipeY,
      position: position,
      speed: speed,
      isXmas: this.isXmas
    });
    
    this.bots.push(bot);
    this.botsGroup.add(bot.sprite);
    
    return bot;
  }

  /**
   * Met à jour la vitesse de tous les robots
   * @param {number} speed - Nouvelle vitesse
   */
  setSpeed(speed) {
    this.bots.forEach(bot => bot.setSpeed(speed));
  }

  /**
   * Met à jour le gestionnaire (appelé chaque frame)
   * @param {number} killMargin - Marge pour la destruction
   */
  update(killMargin) {
    this.bots = this.bots.filter(bot => {
      if (!bot.active) return false;
      bot.update(killMargin);
      return bot.active;
    });
  }

  /**
   * Nettoie tous les robots
   */
  clear() {
    this.bots.forEach(bot => bot.destroy());
    this.bots = [];
  }

  /**
   * Détruit le gestionnaire
   */
  destroy() {
    this.clear();
  }
}

export default Bot;