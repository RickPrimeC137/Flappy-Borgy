/**
 * Cloud.js - Entité des nuages décoratifs
 * 
 * Classe représentant les nuages qui servent de limites visuelles et physiques
 * en haut et en bas de l'écran de jeu. Collision mortelle avec le joueur.
 * 
 * @module entities/Cloud
 */

import {
  CLOUD_TOP_HEIGHT_PCT,
  CLOUD_BOTTOM_HEIGHT_PCT,
  CLOUD_EXTRA_SCALE_X
} from '../config/constants.js';

/**
 * Type de nuage
 * @enum {string}
 */
export const CloudType = {
  /** Nuage du haut */
  TOP: 'top',
  /** Nuage du bas */
  BOTTOM: 'bottom'
};

/**
 * Classe représentant un nuage limite
 */
export class Cloud {
  /**
   * Crée un nuage
   * @param {Phaser.Scene} scene - La scène Phaser parente
   * @param {Object} config - Configuration du nuage
   * @param {string} config.type - Type de nuage (TOP ou BOTTOM)
   * @param {boolean} [config.isHard=false] - Mode Hard activé (nuages plus sombres)
   */
  constructor(scene, config) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {string} */
    this.type = config.type || CloudType.BOTTOM;
    
    /** @type {boolean} */
    this.isHard = config.isHard || false;
    
    const W = scene.scale.width;
    const H = scene.scale.height;
    
    // Calcul des dimensions
    const heightPct = this.type === CloudType.TOP ? 
      CLOUD_TOP_HEIGHT_PCT : CLOUD_BOTTOM_HEIGHT_PCT;
    
    /** @type {number} */
    this.cloudHeight = H * heightPct;
    
    // Multiplicateur visuel pour un meilleur rendu
    const visualMultiplier = this.type === CloudType.TOP ? 1.6 : 1.8;
    
    /** @type {number} */
    this.visualHeight = this.cloudHeight * visualMultiplier;
    
    // Calcul de la position Y
    let cloudY;
    if (this.type === CloudType.TOP) {
      cloudY = this.cloudHeight - this.visualHeight / 2;
    } else {
      cloudY = H - this.cloudHeight - this.visualHeight / 2;
    }
    
    // Sélection de la texture
    const textureKey = this.type === CloudType.TOP ? 'cloud_top' : 'cloud_bottom';
    
    // Création de l'image
    /** @type {Phaser.GameObjects.Image} */
    this.image = scene.add.image(W / 2, cloudY, textureKey).setDepth(5);
    
    // Calcul des scales
    const scaleX = (W * CLOUD_EXTRA_SCALE_X) / this.image.width;
    const scaleY = this.visualHeight / this.image.height;
    this.image.setScale(scaleX, scaleY);
    
    // Ajout de la physique (corps statique)
    scene.physics.add.existing(this.image, true);
    
    // Configuration de la hitbox
    this._setupHitbox(W);
    
    // Teinte en mode Hard
    if (this.isHard) {
      this._applyHardModeTint();
    }
    
    /** @type {number|null} */
    this.baseTint = null;
  }

  /**
   * Configure la hitbox du nuage
   * @private
   * @param {number} W - Largeur de l'écran
   */
  _setupHitbox(W) {
    const visualWidth = W * CLOUD_EXTRA_SCALE_X;
    this.image.body.setSize(visualWidth, 10, true);

    if (this.type === CloudType.TOP) {
      this.image.body.setOffset(0, -this.visualHeight / 2 + 5);
    } else {
      this.image.body.setOffset(0, this.visualHeight / 2 - 5);
    }
  }

  /**
   * Applique la teinte du mode Hard
   * @private
   */
  _applyHardModeTint() {
    if (this.type === CloudType.TOP) {
      this.baseTint = 0x4b5563;
    } else {
      this.baseTint = 0x111827;
    }
    this.image.setTint(this.baseTint);
  }

  /**
   * Effet de flash d'orage (mode Hard uniquement)
   */
  flashStorm() {
    if (!this.isHard || !this.image) return;
    
    // Teinte claire temporaire
    const flashTint = this.type === CloudType.TOP ? 0xe5e7eb : 0x1f2937;
    this.image.setTint(flashTint);
    
    // Retour à la teinte normale après un court délai
    this.scene.time.delayedCall(120, () => {
      if (this.image) {
        this.image.setTint(this.baseTint);
      }
    });
  }

  /**
   * Récupère l'image du nuage (pour les collisions)
   * @returns {Phaser.GameObjects.Image} L'image du nuage
   */
  getGameObject() {
    return this.image;
  }

  /**
   * Récupère le body physique du nuage
   * @returns {Phaser.Physics.Arcade.Body|null} Le body physique
   */
  get body() {
    return this.image?.body || null;
  }

  /**
   * Détruit le nuage et libère les ressources
   */
  destroy() {
    if (this.image) {
      this.image.destroy();
      this.image = null;
    }
  }
}

/**
 * Gestionnaire des nuages limites (haut et bas)
 */
export class CloudManager {
  /**
   * Crée un gestionnaire de nuages
   * @param {Phaser.Scene} scene - La scène Phaser
   * @param {Object} [config={}] - Configuration
   * @param {boolean} [config.isHard=false] - Mode Hard activé
   */
  constructor(scene, config = {}) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {boolean} */
    this.isHard = config.isHard || false;
    
    /** @type {Cloud|null} */
    this.topCloud = null;
    
    /** @type {Cloud|null} */
    this.bottomCloud = null;
    
    /** @type {Phaser.Time.TimerEvent|null} */
    this.stormTimer = null;
  }

  /**
   * Crée les nuages haut et bas
   * @returns {CloudManager} L'instance pour le chaînage
   */
  create() {
    // Nuage du haut
    this.topCloud = new Cloud(this.scene, {
      type: CloudType.TOP,
      isHard: this.isHard
    });
    
    // Nuage du bas
    this.bottomCloud = new Cloud(this.scene, {
      type: CloudType.BOTTOM,
      isHard: this.isHard
    });
    
    // Timer d'orage en mode Hard
    if (this.isHard) {
      this._startStormEffect();
    }
    
    return this;
  }

  /**
   * Démarre l'effet d'orage périodique
   * @private
   */
  _startStormEffect() {
    this.stormTimer = this.scene.time.addEvent({
      delay: 4200,
      loop: true,
      callback: () => {
        // 30% de chance de flash
        if (Phaser.Math.Between(0, 100) < 30) {
          this.flashStorm();
        }
      }
    });
  }

  /**
   * Déclenche un flash d'orage sur tous les nuages
   */
  flashStorm() {
    if (this.topCloud) {
      this.topCloud.flashStorm();
    }
    if (this.bottomCloud) {
      this.bottomCloud.flashStorm();
    }
    
    // Flash de la caméra
    this.scene.cameras.main.flash(90, 210, 220, 240, false);
  }

  /**
   * Configure les collisions avec le joueur
   * @param {Object} player - Le sprite ou objet du joueur
   * @param {Function} callback - Callback appelé lors de la collision
   * @returns {CloudManager} L'instance pour le chaînage
   */
  setupCollisions(player, callback) {
    if (this.topCloud) {
      this.scene.physics.add.overlap(
        player,
        this.topCloud.getGameObject(),
        callback,
        null,
        this.scene
      );
    }
    
    if (this.bottomCloud) {
      this.scene.physics.add.overlap(
        player,
        this.bottomCloud.getGameObject(),
        callback,
        null,
        this.scene
      );
    }
    
    return this;
  }

  /**
   * Récupère le nuage du haut
   * @returns {Cloud|null} Le nuage du haut
   */
  getTopCloud() {
    return this.topCloud;
  }

  /**
   * Récupère le nuage du bas
   * @returns {Cloud|null} Le nuage du bas
   */
  getBottomCloud() {
    return this.bottomCloud;
  }

  /**
   * Détruit le gestionnaire et les nuages
   */
  destroy() {
    // Arrêt du timer d'orage
    if (this.stormTimer) {
      this.stormTimer.remove();
      this.stormTimer = null;
    }
    
    // Destruction des nuages
    if (this.topCloud) {
      this.topCloud.destroy();
      this.topCloud = null;
    }
    
    if (this.bottomCloud) {
      this.bottomCloud.destroy();
      this.bottomCloud = null;
    }
  }
}

export default Cloud;