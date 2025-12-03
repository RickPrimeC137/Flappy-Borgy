/**
 * Player.js - Entité du joueur Borgy
 * 
 * Classe représentant le personnage contrôlé par le joueur.
 * Gère le sprite, la physique, les animations et les états du joueur.
 * 
 * @module entities/Player
 */

import { PROFILE, PLAYER_SCALE, PLAYFIELD_TOP_PCT, PLAYFIELD_BOT_PCT } from '../config/constants.js';

/**
 * Retourne le rectangle utile (sans les marges transparentes) d'une image
 * @param {HTMLImageElement} img - Image source
 * @returns {Object|null} Bounds {x, y, w, h} ou null si erreur
 */
function getVisibleBounds(img) {
  try {
    const w = img.width | 0;
    const h = img.height | 0;
    if (!w || !h) return null;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
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
    console.warn("getVisibleBounds error", e);
    return null;
  }
}

/**
 * Calcule un scale pour qu'un skin ait la même taille VISUELLE que le borgy de base
 * @param {Phaser.Textures.TextureManager} textures - Gestionnaire de textures Phaser
 * @param {string} skinKey - Clé de la texture du skin
 * @returns {number} Scale calculé
 */
function computeSkinScale(textures, skinKey) {
  const baseKey = "borgy"; // borgy_ingame.png (sprite de référence)

  try {
    const baseTex = textures.get(baseKey);
    const curTex = textures.get(skinKey);
    if (!baseTex || !curTex) return PLAYER_SCALE;

    const baseImg = baseTex.getSourceImage();
    const curImg = curTex.getSourceImage();
    if (!baseImg || !curImg) return PLAYER_SCALE;

    const baseBounds = getVisibleBounds(baseImg);
    const curBounds = getVisibleBounds(curImg);

    let ratio;
    if (baseBounds && curBounds) {
      ratio = (baseBounds.h || baseImg.height) / (curBounds.h || curImg.height);
    } else {
      ratio = baseImg.height / curImg.height;
    }

    let scale = PLAYER_SCALE * ratio;
    if (!Number.isFinite(scale)) scale = PLAYER_SCALE;

    scale = Phaser.Math.Clamp(scale, PLAYER_SCALE * 0.6, PLAYER_SCALE * 1.8);
    return scale;

  } catch (e) {
    console.warn("computeSkinScale error", e);
    return PLAYER_SCALE;
  }
}

/**
 * Classe représentant le joueur Borgy
 */
export class Player {
  /**
   * Crée une instance du joueur
   * @param {Phaser.Scene} scene - La scène Phaser parente
   * @param {number} x - Position X initiale
   * @param {number} y - Position Y initiale
   * @param {string} skinKey - Clé de la texture du skin à utiliser
   * @param {Object} [options={}] - Options supplémentaires
   * @param {number} [options.scale] - Scale du sprite (calculé automatiquement si non fourni)
   * @param {boolean} [options.hardMode] - Mode Hard activé
   */
  constructor(scene, x, y, skinKey = 'borgy', options = {}) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {string} */
    this.skinKey = skinKey;

    /** @type {number} */
    this.scale = options.scale || computeSkinScale(scene.textures, skinKey);
    
    /** @type {boolean} */
    this.isAlive = true;
    
    /** @type {boolean} */
    this.isInvincible = false;
    
    /** @type {boolean} */
    this.canRevive = false;
    
    // Détection des perks spéciaux du skin
    /** @type {boolean} */
    this.skinIsGold = (skinKey === "borgy_gold");
    
    /** @type {boolean} */
    this.skinIsEmerald = (skinKey === "borgy_emeraude");
    
    /** @type {boolean} */
    this.skinIsDiamond = (skinKey === "borgy_diamant");
    
    // Le skin diamant permet une résurrection
    if (this.skinIsDiamond) {
      this.canRevive = true;
    }
    
    // Création du sprite physique
    /** @type {Phaser.Physics.Arcade.Sprite} */
    this.sprite = scene.physics.add.sprite(x, y, skinKey)
      .setScale(this.scale)
      .setDepth(10)
      .setCollideWorldBounds(true);

    // Debug: Vérifier la création du sprite joueur
    console.log('[Player] Created player sprite with skin:', skinKey, 'texture exists:', scene.textures.exists(skinKey), 'sprite active:', this.sprite.active, 'visible:', this.sprite.visible, 'alpha:', this.sprite.alpha);

    // Configuration initiale de la physique (pas de gravité au départ)
    this.sprite.body.setAllowGravity(false);
    this.sprite.setGravityY(0);

    // Augmenter la vélocité maximale pour permettre une chute continue
    this.sprite.body.setMaxVelocity(0, 50000);

    // Application de la hitbox standardisée
    this._applyHitbox();
  }

  /**
   * Applique la hitbox standardisée basée sur les pixels visibles du sprite
   * @private
   */
  _applyHitbox() {
    try {
      if (!this.sprite || !this.sprite.body) return;

      const tex = this.scene.textures.get(this.skinKey);
      if (!tex) return;
      const img = tex.getSourceImage?.();
      if (!img) return;

      const bounds = getVisibleBounds(img);
      if (!bounds) return;

      const s = this.sprite.scaleX || 1;

      // Paramètres de réduction de la hitbox
      const shrinkX = 0.60;
      const shrinkY = 0.60;
      const downFactor = 0.06;

      const visW = bounds.w * s;
      const visH = bounds.h * s;

      const boxW_world = visW * shrinkX;
      const boxH_world = visH * shrinkY;

      const boxX_world = (bounds.x * s) + (visW - boxW_world) / 2;
      const boxY_world = (bounds.y * s) + (visH - boxH_world) / 2 + visH * downFactor;

      const invScaleX = 1 / (this.sprite.scaleX || 1);
      const invScaleY = 1 / (this.sprite.scaleY || 1);

      const boxW_local = boxW_world * invScaleX;
      const boxH_local = boxH_world * invScaleY;
      const boxX_local = boxX_world * invScaleX;
      const boxY_local = boxY_world * invScaleY;

      this.sprite.body.setSize(boxW_local, boxH_local, false);
      this.sprite.body.setOffset(boxX_local, boxY_local);

    } catch (e) {
      console.warn("Player._applyHitbox error", e);
    }
  }

  /**
   * Active la physique du joueur (gravité)
   * Appelé au premier tap pour démarrer le jeu
   */
  startPhysics() {
    if (this.sprite && this.sprite.body) {
      this.sprite.body.setAllowGravity(true);
      this.sprite.setGravityY(PROFILE.gravity);
    }
  }

  /**
   * Fait sauter le joueur (flap)
   * Applique une vélocité verticale négative
   */
  flap() {
    if (this.sprite && this.sprite.active) {
      this.sprite.setVelocityY(PROFILE.jump);
    }
  }

  /**
   * Met à jour la rotation du joueur en fonction de sa vélocité
   * Appelé à chaque frame dans la boucle de jeu
   */
  update(time, delta) {
    if (!this.sprite || !this.sprite.body || !this.isAlive) return;

    const vy = this.sprite.body.velocity.y;

    // Debug: Log occasionnel (toutes les 60 frames)
    if (time % 1000 < 16) {
      console.log(`[Player] Pos: x=${this.sprite.x.toFixed(2)}, y=${this.sprite.y.toFixed(2)}, vel_y=${this.sprite.body.velocity.y}`);
    }

    // Rotation : monte = -16°, descend = +20°, stable = 0°
    if (vy < -40) {
      this.sprite.setAngle(-16);
    } else if (vy > 140) {
      this.sprite.setAngle(20);
    } else {
      this.sprite.setAngle(0);
    }
  }

  /**
   * Gère la mort du joueur
   * @returns {boolean} True si le joueur peut être ressuscité, false sinon
   */
  die() {
    if (!this.isAlive) return false;
    
    // Si invincible, ignorer la mort
    if (this.isInvincible) return false;
    
    // Si peut ressusciter (skin diamant), retourner true
    if (this.canRevive) {
      this.canRevive = false; // Une seule résurrection
      return true;
    }
    
    this.isAlive = false;
    return false;
  }

  /**
   * Ressuscite le joueur à une position donnée
   * @param {number} targetX - Position X cible
   * @param {number} targetY - Position Y cible
   * @param {Function} [onComplete] - Callback appelé à la fin de l'animation
   */
  revive(targetX, targetY, onComplete) {
    if (!this.sprite || !this.sprite.body) {
      if (onComplete) onComplete(false);
      return;
    }

    // Phase d'invincibilité
    this.isInvincible = true;

    // Désactiver la physique pendant l'animation
    this.sprite.body.enable = false;
    this.sprite.setVelocity(0, 0);

    const startScaleX = this.sprite.scaleX;
    const startScaleY = this.sprite.scaleY;

    // Animation de disparition
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: startScaleX * 0.7,
      scaleY: startScaleY * 0.7,
      duration: 200,
      ease: "Cubic.in",
      onComplete: () => {
        // Téléportation
        this.sprite.setPosition(targetX, targetY);
        this.sprite.setAngle(0);
        this.sprite.body.enable = true;
        this.sprite.setVelocity(0, 0);

        // Animation de réapparition
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 1,
          scaleX: startScaleX,
          scaleY: startScaleY,
          duration: 220,
          ease: "Cubic.out"
        });

        // Fin de l'invincibilité après 2 secondes
        this.scene.time.delayedCall(2000, () => {
          this.isInvincible = false;
        });

        if (onComplete) onComplete(true);
      }
    });
  }

  /**
   * Réinitialise le joueur à sa position de départ
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  reset(x, y) {
    if (!this.sprite) return;
    
    this.isAlive = true;
    this.isInvincible = false;
    this.canRevive = this.skinIsDiamond;
    
    this.sprite.setPosition(x, y);
    this.sprite.setAngle(0);
    this.sprite.setVelocity(0, 0);
    this.sprite.body.setAllowGravity(false);
    this.sprite.setGravityY(0);
    this.sprite.setAlpha(1);
    this.sprite.setScale(this.scale);
  }

  /**
   * Change le skin du joueur
   * @param {string} newSkinKey - Clé du nouveau skin
   */
  changeSkin(newSkinKey) {
    if (!this.sprite || !this.scene.textures.exists(newSkinKey)) return;
    
    this.skinKey = newSkinKey;
    this.scale = computeSkinScale(this.scene.textures, newSkinKey);
    
    this.sprite.setTexture(newSkinKey);
    this.sprite.setScale(this.scale);
    
    // Mise à jour des perks
    this.skinIsGold = (newSkinKey === "borgy_gold");
    this.skinIsEmerald = (newSkinKey === "borgy_emeraude");
    this.skinIsDiamond = (newSkinKey === "borgy_diamant");
    this.canRevive = this.skinIsDiamond;
    
    // Réappliquer la hitbox
    this._applyHitbox();
  }

  /**
   * Récupère la position X du joueur
   * @returns {number} Position X
   */
  get x() {
    return this.sprite?.x || 0;
  }

  /**
   * Récupère la position Y du joueur
   * @returns {number} Position Y
   */
  get y() {
    return this.sprite?.y || 0;
  }

  /**
   * Récupère la largeur affichée du sprite
   * @returns {number} Largeur
   */
  get displayWidth() {
    return this.sprite?.displayWidth || 0;
  }

  /**
   * Récupère la hauteur affichée du sprite
   * @returns {number} Hauteur
   */
  get displayHeight() {
    return this.sprite?.displayHeight || 0;
  }

  /**
   * Vérifie si le sprite est actif
   * @returns {boolean} True si actif
   */
  get active() {
    return this.sprite?.active || false;
  }

  /**
   * Récupère le body physique du sprite
   * @returns {Phaser.Physics.Arcade.Body|null} Body physique
   */
  get body() {
    return this.sprite?.body || null;
  }

  /**
   * Détruit le joueur et libère les ressources
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}

export default Player;