/**
 * Bonus.js - Entité des bonus collectables
 * 
 * Classe représentant les bonus SwissBorg qui apparaissent dans le jeu.
 * Ces bonus activent un multiplicateur de score temporaire.
 * 
 * @module entities/Bonus
 */

import { BONUS_DURATION, BONUS_EVERY } from '../config/constants.js';

/**
 * Types de bonus disponibles
 * @enum {string}
 */
export const BonusType = {
  /** Multiplicateur de score x2 (x3 avec skin émeraude) */
  MULTIPLIER: 'multiplier',
  /** Bouclier temporaire (non implémenté) */
  SHIELD: 'shield',
  /** Ralentissement du jeu (non implémenté) */
  SLOW: 'slow'
};

/**
 * Classe représentant un bonus collectable
 */
export class Bonus {
  /**
   * Crée un bonus
   * @param {Phaser.Scene} scene - La scène Phaser parente
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {Object} [config={}] - Configuration du bonus
   * @param {string} [config.type=BonusType.MULTIPLIER] - Type de bonus
   * @param {number} [config.duration=BONUS_DURATION] - Durée de l'effet en ms
   * @param {number} [config.speed=0] - Vitesse de déplacement horizontal
   */
  constructor(scene, x, y, config = {}) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {string} */
    this.type = config.type || BonusType.MULTIPLIER;
    
    /** @type {number} */
    this.duration = config.duration || BONUS_DURATION;
    
    /** @type {number} */
    this.speed = config.speed || 0;
    
    /** @type {boolean} */
    this.isCollected = false;
    
    /** @type {boolean} */
    this.isActive = false;
    
    /** @type {number} */
    this.activeUntil = 0;
    
    // Création du sprite physique
    /** @type {Phaser.Physics.Arcade.Image} */
    this.sprite = scene.physics.add.image(x, y, 'bonus_sb')
      .setDepth(7)
      .setScale(0.55)
      .setImmovable(true);
    
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setVelocityX(this.speed);
    
    // Hitbox plus grande pour faciliter la collection
    this.sprite.body.setSize(
      this.sprite.displayWidth * 3.0,
      this.sprite.displayHeight * 3.0,
      true
    );
  }

  /**
   * Spawn le bonus (activation du sprite)
   * @param {number} speed - Vitesse de déplacement
   * @returns {Bonus} L'instance pour le chaînage
   */
  spawn(speed) {
    this.speed = speed;
    this.sprite.body.setVelocityX(speed);
    return this;
  }

  /**
   * Collecte le bonus (appelé lors de la collision avec le joueur)
   * @returns {boolean} True si le bonus a été collecté, false sinon
   */
  collect() {
    if (this.isCollected) return false;
    
    this.isCollected = true;
    
    // Détruire le sprite
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    
    return true;
  }

  /**
   * Active l'effet du bonus
   * @param {Object} [context={}] - Contexte d'activation
   * @param {boolean} [context.isEmeraldSkin=false] - Si le joueur a le skin émeraude
   * @returns {Object} Informations sur l'activation
   */
  activate(context = {}) {
    if (this.isActive) {
      // Renouveler la durée si déjà actif
      this.activeUntil = this.scene.time.now + this.duration;
      return { 
        multiplier: this._getMultiplier(context.isEmeraldSkin),
        extended: true 
      };
    }
    
    this.isActive = true;
    this.activeUntil = this.scene.time.now + this.duration;
    
    return {
      multiplier: this._getMultiplier(context.isEmeraldSkin),
      duration: this.duration,
      extended: false
    };
  }

  /**
   * Désactive l'effet du bonus
   */
  deactivate() {
    this.isActive = false;
    this.activeUntil = 0;
  }

  /**
   * Récupère le multiplicateur selon le type et le contexte
   * @private
   * @param {boolean} isEmeraldSkin - Si le joueur a le skin émeraude
   * @returns {number} Valeur du multiplicateur
   */
  _getMultiplier(isEmeraldSkin) {
    if (this.type === BonusType.MULTIPLIER) {
      return isEmeraldSkin ? 3 : 2;
    }
    return 1;
  }

  /**
   * Vérifie si l'effet est toujours actif
   * @returns {boolean} True si actif
   */
  isEffectActive() {
    if (!this.isActive) return false;
    
    const now = this.scene.time.now;
    if (now >= this.activeUntil) {
      this.deactivate();
      return false;
    }
    
    return true;
  }

  /**
   * Récupère le temps restant de l'effet
   * @returns {number} Temps restant en ms
   */
  getRemainingTime() {
    if (!this.isActive) return 0;
    return Math.max(0, this.activeUntil - this.scene.time.now);
  }

  /**
   * Vérifie si le bonus doit clignoter (fin imminente)
   * @param {number} [threshold=3000] - Seuil en ms pour commencer à clignoter
   * @returns {boolean} True si doit clignoter
   */
  shouldBlink(threshold = 3000) {
    return this.isActive && this.getRemainingTime() <= threshold;
  }

  /**
   * Met à jour le bonus (appelé chaque frame)
   * @param {number} killMargin - Marge pour la destruction hors écran
   */
  update(killMargin) {
    // Destruction si hors écran
    if (this.sprite && this.sprite.active && this.sprite.x < -killMargin) {
      this.destroy();
    }
  }

  /**
   * Vérifie si le sprite est actif
   * @returns {boolean} True si le sprite est actif
   */
  get active() {
    return this.sprite?.active && !this.isCollected;
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
   * Détruit le bonus et libère les ressources
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    this.isCollected = true;
    this.isActive = false;
  }
}

/**
 * Gestionnaire des bonus actifs et de leurs effets
 */
export class BonusManager {
  /**
   * Crée un gestionnaire de bonus
   * @param {Phaser.Scene} scene - La scène Phaser
   * @param {Phaser.Physics.Arcade.Group} bonusGroup - Groupe physique des bonus
   */
  constructor(scene, bonusGroup) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {Phaser.Physics.Arcade.Group} */
    this.bonusGroup = bonusGroup;
    
    /** @type {Bonus[]} */
    this.bonuses = [];
    
    /** @type {boolean} */
    this.multiplierActive = false;
    
    /** @type {number} */
    this.multiplierUntil = 0;
    
    /** @type {number} */
    this.currentMultiplier = 1;
    
    /** @type {Phaser.GameObjects.Image|null} */
    this.follower = null;
    
    /** @type {number} */
    this.spawnCounter = 0;
  }

  /**
   * Spawn un bonus à la position donnée
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} speed - Vitesse de déplacement
   * @returns {Bonus} Le bonus créé
   */
  spawn(x, y, speed) {
    const bonus = new Bonus(this.scene, x, y, { speed });
    
    this.bonuses.push(bonus);
    this.bonusGroup.add(bonus.sprite);
    
    return bonus;
  }

  /**
   * Vérifie si un bonus doit être spawné
   * @param {number} pairsSpawned - Nombre de paires de tuyaux spawnées
   * @returns {boolean} True si un bonus doit être spawné
   */
  shouldSpawn(pairsSpawned) {
    return pairsSpawned > 0 && pairsSpawned % BONUS_EVERY === 0;
  }

  /**
   * Active le multiplicateur de score
   * @param {Object} [context={}] - Contexte d'activation
   * @param {boolean} [context.isEmeraldSkin=false] - Si le joueur a le skin émeraude
   * @param {Object} [context.player] - Référence au joueur pour le follower
   */
  activateMultiplier(context = {}) {
    this.multiplierActive = true;
    this.multiplierUntil = this.scene.time.now + BONUS_DURATION;
    this.currentMultiplier = context.isEmeraldSkin ? 3 : 2;
    
    // Création du follower visuel
    if (this.follower) {
      this.follower.destroy();
    }
    
    if (context.player) {
      this.follower = this.scene.add.image(
        context.player.x - context.player.displayWidth * 0.9,
        context.player.y,
        'bonus_sb'
      ).setDepth(9).setScale(0.4);
    }
    
    // Timer pour désactiver
    this.scene.time.delayedCall(BONUS_DURATION, () => {
      this.deactivateMultiplier();
    });
  }

  /**
   * Désactive le multiplicateur de score
   */
  deactivateMultiplier() {
    this.multiplierActive = false;
    this.currentMultiplier = 1;
    this.multiplierUntil = 0;
    
    if (this.follower) {
      this.follower.destroy();
      this.follower = null;
    }
  }

  /**
   * Met à jour le gestionnaire (appelé chaque frame)
   * @param {Object} player - Référence au joueur
   * @param {number} killMargin - Marge pour la destruction
   */
  update(player, killMargin) {
    // Mise à jour des bonus
    this.bonuses = this.bonuses.filter(bonus => {
      if (!bonus.active) return false;
      bonus.update(killMargin);
      return bonus.active;
    });
    
    // Mise à jour du follower
    if (this.multiplierActive && this.follower && player?.active) {
      this.follower.x = player.x - player.displayWidth * 0.9;
      this.follower.y = player.y;
      
      // Clignotement si fin imminente
      const remaining = this.multiplierUntil - this.scene.time.now;
      if (remaining <= 3000) {
        this.follower.setVisible(Math.floor(this.scene.time.now / 150) % 2 === 0);
      } else {
        this.follower.setVisible(true);
      }
    }
  }

  /**
   * Collecte un bonus via son sprite (appelé par overlap)
   * @param {Phaser.Physics.Arcade.Image} bonusSprite - Sprite du bonus
   */
  collect(bonusSprite) {
    const index = this.bonuses.findIndex(b => b.sprite === bonusSprite);
    if (index !== -1) {
      const bonus = this.bonuses[index];
      bonus.collect();
      this.bonuses.splice(index, 1);
    }
  }

  /**
   * Récupère le multiplicateur actuel
   * @returns {number} Valeur du multiplicateur (1 si inactif)
   */
  getMultiplier() {
    return this.multiplierActive ? this.currentMultiplier : 1;
  }

  /**
   * Nettoie tous les bonus
   */
  clear() {
    this.bonuses.forEach(bonus => bonus.destroy());
    this.bonuses = [];
    this.deactivateMultiplier();
  }

  /**
   * Détruit le gestionnaire
   */
  destroy() {
    this.clear();
  }
}

export default Bonus;