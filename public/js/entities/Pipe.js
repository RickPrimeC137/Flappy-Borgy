/**
 * Pipe.js - Entité des tuyaux (obstacles)
 * 
 * Classe représentant une paire de tuyaux (haut et bas) formant un obstacle.
 * Gère la création, le redimensionnement, le mouvement et les animations.
 * 
 * @module entities/Pipe
 */

import {
  GAME_H,
  PAD,
  PIPE_W_DISPLAY,
  PIPE_OVERSCAN,
  JOINT_OVERLAP,
  PLAYFIELD_TOP_PCT,
  PLAYFIELD_BOT_PCT,
  PIPE_RIM_MAX_PCT,
  PROFILE,
  HARD_DOOR_AMPLITUDE_PX,
  HARD_DOOR_HALF_PERIOD,
  SPAWN_X_OFFSET
} from '../config/constants.js';

import { PIPE_CONFIGS } from '../config/skinConfig.js';

/**
 * Classe représentant une paire de tuyaux (obstacle)
 */
export class Pipe {
  /**
   * Crée une paire de tuyaux
   * @param {Phaser.Scene} scene - La scène Phaser parente
   * @param {Object} config - Configuration de la paire
   * @param {number} config.gapY - Position Y centrale du gap
   * @param {number} config.gap - Taille du gap entre les tuyaux
   * @param {number} config.speed - Vitesse de déplacement (négatif = vers la gauche)
   * @param {boolean} [config.isHard=false] - Mode Hard activé
   * @param {boolean} [config.isXmas=false] - Mode Noël activé
   * @param {boolean} [config.isGold=false] - Tuyaux dorés activés
   * @param {Phaser.Physics.Arcade.Group} config.pipesGroup - Groupe physique pour les tuyaux
   * @param {Phaser.Physics.Arcade.Group} config.sensorsGroup - Groupe physique pour les sensors de score
   */
  constructor(scene, config) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {number} */
    this.gapY = config.gapY;
    
    /** @type {number} */
    this.gap = config.gap;
    
    /** @type {number} */
    this.speed = config.speed;
    
    /** @type {boolean} */
    this.isHard = config.isHard || false;
    
    /** @type {boolean} */
    this.isXmas = config.isXmas || false;
    
    /** @type {boolean} */
    this.isGold = config.isGold || false;
    
    /** @type {Phaser.Physics.Arcade.Group} */
    this.pipesGroup = config.pipesGroup;
    
    /** @type {Phaser.Physics.Arcade.Group} */
    this.sensorsGroup = config.sensorsGroup;
    
    /** @type {Phaser.Physics.Arcade.Image|null} */
    this.topPipe = null;
    
    /** @type {Phaser.Physics.Arcade.Image|null} */
    this.bottomPipe = null;
    
    /** @type {Phaser.GameObjects.Rectangle|null} */
    this.sensor = null;
    
    /** @type {Phaser.Tweens.Tween|null} */
    this.doorTween = null;
    
    /** @type {number} */
    this.yTopRim = 0;
    
    /** @type {number} */
    this.yBottomRim = 0;
    
    /** @type {number} */
    this.scaleXTop = 1;
    
    /** @type {number} */
    this.scaleXBottom = 1;
    
    /** @type {boolean} */
    this.isActive = true;
  }

  /**
   * Spawn la paire de tuyaux à la position donnée
   * @param {number} x - Position X de spawn
   * @param {boolean} [silentFirst=false] - Si true, le sensor ne compte pas pour le score
   * @returns {Pipe} L'instance actuelle pour le chaînage
   */
  spawn(x, silentFirst = false) {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    
    // Sélection des sprites selon le mode
    const { topKey, bottomKey } = this._getPipeKeys();
    
    console.log(`[Pipe] Spawning at x=${x}`);

    // Vérifier que les textures existent
    if (!this.scene.textures.exists(topKey)) {
      console.error(`[Pipe] Texture ${topKey} not found! Available textures:`, Object.keys(this.scene.textures.list));
    }
    if (!this.scene.textures.exists(bottomKey)) {
      console.error(`[Pipe] Texture ${bottomKey} not found! Available textures:`, Object.keys(this.scene.textures.list));
    }

    // Création des images physiques
    this.topPipe = this.scene.physics.add.image(x, 0, topKey)
      .setDepth(100) // Augmenté pour être bien visible au-dessus du background
      .setOrigin(0.5, 1);

    this.bottomPipe = this.scene.physics.add.image(x, 0, bottomKey)
      .setDepth(100) // Augmenté pour être bien visible au-dessus du background
      .setOrigin(0.5, 0);
    
    // Calcul des scales
    this.scaleXTop = PIPE_W_DISPLAY / this.topPipe.width;
    this.scaleXBottom = PIPE_W_DISPLAY / this.bottomPipe.width;

    // Calcul des scales
    
    // Calcul des positions des bords
    this.yTopRim = Math.round(this.gapY - this.gap / 2 + (PAD - JOINT_OVERLAP));
    this.yBottomRim = Math.round(this.gapY + this.gap / 2 - (PAD - JOINT_OVERLAP));
    
    // Redimensionnement et positionnement
    this._resizePipeToRim(this.topPipe, true, this.yTopRim, this.scaleXTop);
    this._resizePipeToRim(this.bottomPipe, false, this.yBottomRim, this.scaleXBottom);

    // Redimensionnement terminé

    // Teinte en mode Hard
    if (this.isHard) {
      this.topPipe.setTint(0x6d1f12);
      this.bottomPipe.setTint(0x6d1f12);
    } else {
      this.topPipe.clearTint();
      this.bottomPipe.clearTint();
    }
    
    // Ajout aux groupes physiques
    this.pipesGroup.add(this.topPipe);
    this.pipesGroup.add(this.bottomPipe);
    
    // Création du sensor de score
    this._createSensor(x, silentFirst);
    
    // Animation "portes" en mode Hard
    if (this.isHard) {
      this._startDoorAnimation();
    }
    
    return this;
  }

  /**
   * Récupère les clés des textures de tuyaux selon le mode
   * @private
   * @returns {Object} {topKey, bottomKey}
   */
  _getPipeKeys() {
    let topKey, bottomKey;
    
    if (this.isXmas) {
      topKey = PIPE_CONFIGS.xmas.top;
      bottomKey = PIPE_CONFIGS.xmas.bottom;
    } else if (this.isGold) {
      topKey = PIPE_CONFIGS.gold.top;
      bottomKey = PIPE_CONFIGS.gold.bottom;
    } else {
      topKey = PIPE_CONFIGS.default.top;
      bottomKey = PIPE_CONFIGS.default.bottom;
    }
    
    return { topKey, bottomKey };
  }

  /**
   * Redimensionne un tuyau pour atteindre le bord spécifié
   * @private
   * @param {Phaser.Physics.Arcade.Image} img - Image du tuyau
   * @param {boolean} isTop - True si c'est le tuyau du haut
   * @param {number} rimY - Position Y du bord
   * @param {number} scaleX - Scale X à appliquer
   */
  _resizePipeToRim(img, isTop, rimY, scaleX) {
    const H = this.scene.scale.height;

    // Les tuyaux doivent remplir verticalement la zone entre rimY et les bords de l'écran
    const targetH = H;

    const texW = img.width;
    const texH = img.height;

    const scaleY = targetH / texH;
    img.setScale(scaleX, scaleY);
    img.y = rimY;

    // Redimensionnement appliqué

    img.body.setAllowGravity(false);
    img.body.setMass(1000); // Masse élevée pour éviter d'être poussé par le joueur

    // Configuration de la hitbox (réduction de l'embouchure)
    const MOUTH_PCT = 0.20;
    const mouthTexH = texH * MOUTH_PCT;
    const halfMouth = mouthTexH * 0.5;

    if (isTop) {
      const bodyHeight = texH - halfMouth;
      img.body.setSize(texW, bodyHeight, false);
      img.body.setOffset(0, 0);
    } else {
      const bodyHeight = texH - halfMouth;
      img.body.setSize(texW, bodyHeight, false);
      img.body.setOffset(0, halfMouth);
    }
  }

  /**
   * Crée le sensor de détection de score
   * @private
   * @param {number} x - Position X
   * @param {boolean} silentFirst - Si true, ne compte pas pour le score
   */
  _createSensor(x, silentFirst) {
    const H = this.scene.scale.height;
    const sensorX = x + (PIPE_W_DISPLAY * 0.92) / 2 + 6;
    
    this.sensor = this.scene.add.rectangle(sensorX, H * 0.5, 8, H, 0x000000, 0);
    this.sensor.setVisible(false);
    
    this.scene.physics.add.existing(this.sensor, false);
    this.sensor.body.setAllowGravity(false);
    this.sensor.body.setImmovable(true);
    
    /** @type {boolean} */
    this.sensor.isScore = !silentFirst;
    
    this.sensorsGroup.add(this.sensor);
  }

  /**
   * Démarre l'animation "portes" en mode Hard
   * @private
   */
  _startDoorAnimation() {
    const H = this.scene.scale.height;
    const TOP_BAND = Math.round(H * PLAYFIELD_TOP_PCT);
    const BOT_BAND = Math.round(H * PLAYFIELD_BOT_PCT);
    const RIM_LIMIT = Math.round(H * PIPE_RIM_MAX_PCT);
    
    const MIN_GAP = 90;
    const maxClose = Math.max(0, Math.floor((this.gap - MIN_GAP) / 2) - 2);
    const amp = Math.min(HARD_DOOR_AMPLITUDE_PX, maxClose);

    if (amp <= 0) return;

    const driver = { delta: 0 };
    
    this.doorTween = this.scene.tweens.add({
      targets: driver,
      delta: amp,
      duration: HARD_DOOR_HALF_PERIOD,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
      onUpdate: () => {
        if (!this.topPipe || !this.bottomPipe) return;
        if (!this.topPipe.active || !this.bottomPipe.active) return;
        
        const d = driver.delta;
        const newTop = this.yTopRim + d;
        const newBottom = this.yBottomRim - d;
        
        const topClamped = Phaser.Math.Clamp(newTop, TOP_BAND + 10, RIM_LIMIT - 10);
        const bottomClamped = Phaser.Math.Clamp(newBottom, TOP_BAND + 10, BOT_BAND - 10);

        this._resizePipeToRim(this.topPipe, true, topClamped, this.scaleXTop);
        this._resizePipeToRim(this.bottomPipe, false, bottomClamped, this.scaleXBottom);
      }
    });

    // Nettoyage du tween quand les tuyaux sont détruits
    const stopTween = () => {
      if (this.doorTween) {
        try {
          this.doorTween.stop();
          this.doorTween.remove();
        } catch (e) {}
        this.doorTween = null;
      }
    };
    
    this.topPipe.once('destroy', stopTween);
    this.bottomPipe.once('destroy', stopTween);
  }

  /**
   * Met à jour la vélocité des tuyaux
   * @param {number} newSpeed - Nouvelle vitesse
   */
  setSpeed(newSpeed) {
    this.speed = newSpeed;
  }

  /**
   * Récupère la position X de la paire
   * @returns {number} Position X
   */
  get x() {
    return this.topPipe?.x || 0;
  }

  /**
   * Récupère la position Y centrale du gap
   * @returns {number} Position Y du centre du gap
   */
  get gapCenterY() {
    if (this.topPipe && this.bottomPipe) {
      return (this.topPipe.y + this.bottomPipe.y) / 2;
    }
    return this.gapY;
  }

  /**
   * Vérifie si la paire est toujours active
   * @returns {boolean} True si active
   */
  get active() {
    return this.isActive && 
           this.topPipe?.active && 
           this.bottomPipe?.active;
  }

  /**
   * Met à jour l'état de la paire (appelé chaque frame)
   * @param {number} killMargin - Marge pour la destruction hors écran
   */
  update(killMargin) {
    if (!this.active) return;

    // Destruction si hors écran
    if (this.topPipe && this.topPipe.x + this.topPipe.displayWidth * 0.5 < -killMargin) {
      this.destroy();
    }
  }

  /**
   * Détruit la paire de tuyaux et libère les ressources
   */
  destroy() {
    this.isActive = false;
    
    // Arrêt du tween d'animation
    if (this.doorTween) {
      try {
        this.doorTween.stop();
        this.doorTween.remove();
      } catch (e) {}
      this.doorTween = null;
    }
    
    // Destruction des tuyaux
    if (this.topPipe) {
      this.topPipe.destroy();
      this.topPipe = null;
    }
    
    if (this.bottomPipe) {
      this.bottomPipe.destroy();
      this.bottomPipe = null;
    }
    
    // Destruction du sensor
    if (this.sensor) {
      this.sensor.destroy();
      this.sensor = null;
    }
  }
}

/**
 * Factory pour créer des paires de tuyaux avec calcul automatique du gap
 */
export class PipeFactory {
  /**
   * Crée une factory de tuyaux
   * @param {Phaser.Scene} scene - La scène Phaser
   * @param {Object} config - Configuration globale
   * @param {Phaser.Physics.Arcade.Group} config.pipesGroup - Groupe des tuyaux
   * @param {Phaser.Physics.Arcade.Group} config.sensorsGroup - Groupe des sensors
   * @param {boolean} [config.isHard=false] - Mode Hard
   * @param {boolean} [config.isXmas=false] - Mode Noël
   * @param {boolean} [config.isGold=false] - Tuyaux dorés
   */
  constructor(scene, config) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {Phaser.Physics.Arcade.Group} */
    this.pipesGroup = config.pipesGroup;
    
    /** @type {Phaser.Physics.Arcade.Group} */
    this.sensorsGroup = config.sensorsGroup;
    
    /** @type {boolean} */
    this.isHard = config.isHard || false;
    
    /** @type {boolean} */
    this.isXmas = config.isXmas || false;
    
    /** @type {boolean} */
    this.isGold = config.isGold || false;
    
    /** @type {number} */
    this.pairsSpawned = 0;
    
    /** @type {Pipe[]} */
    this.pipes = [];
  }

  /**
   * Spawn une nouvelle paire de tuyaux
   * @param {Object} options - Options de spawn
   * @param {number} options.speed - Vitesse actuelle
   * @param {number} options.gap - Taille du gap
   * @param {boolean} [options.silentFirst=false] - Ne pas compter pour le score
   * @returns {Pipe} La paire créée
   */
  spawn(options) {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    
    const TOP_BAND = Math.round(H * PLAYFIELD_TOP_PCT);
    const BOT_BAND = Math.round(H * PLAYFIELD_BOT_PCT);
    const RIM_LIMIT = Math.round(H * PIPE_RIM_MAX_PCT);
    
    const playable = Math.max(40, BOT_BAND - TOP_BAND);
    const MIN_GAP = 90;
    const GAP = Math.round(Phaser.Math.Clamp(options.gap ?? PROFILE.gap, MIN_GAP, playable - 40));
    
    // Calcul de la position Y du gap
    let minY = TOP_BAND + Math.floor(GAP / 2);
    let maxY = Math.min(BOT_BAND - Math.floor(GAP / 2), RIM_LIMIT - Math.floor(GAP / 2) + PAD);
    if (maxY < minY) {
      const c = Math.round((TOP_BAND + BOT_BAND) / 2);
      minY = maxY = c;
    }
    const gapY = Phaser.Math.Between(minY, maxY);
    
    const x = W + SPAWN_X_OFFSET;
    
    // Création de la paire
    const pipe = new Pipe(this.scene, {
      gapY: gapY,
      gap: GAP,
      speed: options.speed,
      isHard: this.isHard,
      isXmas: this.isXmas,
      isGold: this.isGold,
      pipesGroup: this.pipesGroup,
      sensorsGroup: this.sensorsGroup
    });
    
    pipe.spawn(x, options.silentFirst || false);
    
    this.pipes.push(pipe);
    this.pairsSpawned++;
    
    return pipe;
  }

  /**
   * Met à jour toutes les paires de tuyaux
   * @param {number} killMargin - Marge pour la destruction
   */
  update(killMargin) {
    // Mise à jour et nettoyage des paires inactives
    this.pipes = this.pipes.filter(pipe => {
      if (!pipe.active) return false;
      pipe.update(killMargin);
      return pipe.active;
    });
  }

  /**
   * Met à jour la vitesse de toutes les paires
   * @param {number} speed - Nouvelle vitesse
   */
  setSpeed(speed) {
    this.pipes.forEach(pipe => pipe.setSpeed(speed));
  }

  /**
   * Récupère les paires actives
   * @returns {Pipe[]} Liste des paires actives
   */
  getActivePipes() {
    return this.pipes.filter(p => p.active);
  }

  /**
   * Nettoie toutes les paires
   */
  clear() {
    this.pipes.forEach(pipe => pipe.destroy());
    this.pipes = [];
    this.pairsSpawned = 0;
  }

  /**
   * Détruit la factory
   */
  destroy() {
    this.clear();
  }
}

export default Pipe;