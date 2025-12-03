/**
 * BorgyCoin.js - Entité des pièces collectables
 * 
 * Classe représentant les Borgy Coins que le joueur peut collecter.
 * Ces pièces s'ajoutent à la monnaie du joueur et permettent d'acheter des skins.
 * 
 * @module entities/BorgyCoin
 */

/**
 * Classe représentant une pièce Borgy Coin
 */
export class BorgyCoin {
  /**
   * Crée une pièce
   * @param {Phaser.Scene} scene - La scène Phaser parente
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {Object} [config={}] - Configuration
   * @param {number} [config.speed=0] - Vitesse de déplacement horizontal
   * @param {number} [config.scale=0.09] - Scale du sprite
   */
  constructor(scene, x, y, config = {}) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {number} */
    this.speed = config.speed || -220;
    
    /** @type {number} */
    this.baseScale = config.scale || 0.08;
    
    /** @type {boolean} */
    this.isCollected = false;
    
    // Création du sprite (non-physique pour éviter les conflits)
    /** @type {Phaser.GameObjects.Image} */
    this.sprite = scene.add.image(x, y, 'borgy_coin')
      .setDepth(8)
      .setScale(this.baseScale);

    // Note: Velocity désactivée car le mouvement est géré manuellement dans GameScene

    // Debug: Vérifier la création du sprite
    console.log('[BorgyCoin] Created coin sprite, texture exists:', scene.textures.exists('borgy_coin'), 'sprite active:', this.sprite.active, 'visible:', this.sprite.visible);

    // Configuration de la hitbox (similaire au bonus SwissBorg)
    this._setupHitbox();

    // Animation de rotation/pulsation
    /** @type {Phaser.Tweens.Tween|null} */
    this.animationTween = this._createAnimation();
  }

  /**
   * Configure la zone de collision pour faciliter la collection
   * @private
   */
  _setupHitbox() {
    // Pas de body physique - la collision est gérée par overlap dans GameScene
    // La zone de pickup est gérée par la méthode isPlayerNearby()
  }

  /**
   * Crée l'animation de pulsation
   * @private
   * @returns {Phaser.Tweens.Tween} Le tween créé
   */
  _createAnimation() {
    return this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.11,
      scaleY: 0.11,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }



  /**
   * Collecte la pièce et retourne le gain
   * @param {Object} [context={}] - Contexte de collection
   * @param {boolean} [context.isHardMode=false] - Mode Hard activé
   * @param {boolean} [context.isGoldSkin=false] - Skin Gold équipé
   * @returns {Object} Informations sur la collection {collected, gain}
   */
  collect(context = {}) {
    if (this.isCollected) {
      return { collected: false, gain: 0 };
    }
    
    this.isCollected = true;
    
    // Calcul du gain
    let gain;
    if (context.isGoldSkin) {
      gain = 5; // x5 avec skin Gold
    } else {
      gain = context.isHardMode ? 2 : 1; // x2 en mode Hard
    }
    
    // Position avant destruction (pour l'effet visuel)
    const x = this.sprite.x;
    const y = this.sprite.y;
    
    // Destruction du sprite
    this.destroy();
    
    return { 
      collected: true, 
      gain,
      x,
      y
    };
  }

  /**
   * Vérifie si le joueur est proche de la pièce (pour collection anticipée)
   * @param {Object} player - Référence au joueur
   * @param {number} [pickupRadius=130] - Rayon de pickup
   * @returns {boolean} True si dans le rayon
   */
  isPlayerNearby(player, pickupRadius = 130) {
    if (!this.sprite || !this.sprite.active || !player) return false;
    
    const dx = this.sprite.x - player.x;
    const dy = this.sprite.y - player.y;
    const distSq = dx * dx + dy * dy;
    
    return distSq <= pickupRadius * pickupRadius;
  }

  /**
   * Met à jour la pièce (appelé chaque frame)
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
   * Vérifie si la pièce est active
   * @returns {boolean} True si active
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
   * Détruit la pièce et libère les ressources
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
    
    this.isCollected = true;
  }
}

/**
 * Gestionnaire des Borgy Coins dans le jeu
 */
export class BorgyCoinManager {
  /**
   * Crée un gestionnaire de pièces
   * @param {Phaser.Scene} scene - La scène Phaser
   * @param {Phaser.Physics.Arcade.Group} coinsGroup - Groupe physique des pièces
   */
  constructor(scene, coinsGroup) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    
    /** @type {Phaser.Physics.Arcade.Group} */
    this.coinsGroup = coinsGroup;
    
    /** @type {BorgyCoin[]} */
    this.coins = [];
    
    /** @type {number} */
    this.nextCoinAt = Phaser.Math.Between(3, 7);
    
    /** @type {Function|null} */
    this.onCollect = null;
  }

  /**
   * Spawn une pièce à la position donnée
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} speed - Vitesse de déplacement
   * @returns {BorgyCoin} La pièce créée
   */
  spawn(x, y, speed) {
    const coin = new BorgyCoin(this.scene, x, y, { speed });
    
    this.coins.push(coin);
    this.coinsGroup.add(coin.sprite);
    
    return coin;
  }

  /**
   * Vérifie si une pièce doit être spawnée
   * @param {number} pairsSpawned - Nombre de paires de tuyaux spawnées
   * @returns {boolean} True si une pièce doit être spawnée
   */
  shouldSpawn(pairsSpawned) {
    if (pairsSpawned >= this.nextCoinAt) {
      this.nextCoinAt += Phaser.Math.Between(3, 6);
      return true;
    }
    return false;
  }

  /**
   * Tente de collecter une pièce proche du joueur
   * @param {Object} player - Référence au joueur
   * @param {Object} context - Contexte de collection
   * @returns {Object|null} Résultat de la collection ou null
   */
  tryCollectNearby(player, context) {
    for (const coin of this.coins) {
      if (!coin.active) continue;
      
      if (coin.isPlayerNearby(player)) {
        const result = coin.collect(context);
        if (result.collected) {
          return result;
        }
      }
    }
    return null;
  }

  /**
   * Met à jour le gestionnaire (appelé chaque frame)
   * @param {Object} player - Référence au joueur
   * @param {Object} context - Contexte (isHardMode, isGoldSkin)
   * @param {number} killMargin - Marge pour la destruction
   */
  update(player, context, killMargin) {
    // Mise à jour des pièces
    this.coins = this.coins.filter(coin => {
      if (!coin.active) return false;

      coin.update(killMargin);
      return coin.active;
    });
  }

  /**
   * Collecte une pièce via son sprite (appelé par overlap)
   * @param {Phaser.Physics.Arcade.Image} coinSprite - Sprite de la pièce
   */
  collect(coinSprite) {
    const index = this.coins.findIndex(c => c.sprite === coinSprite);
    if (index !== -1) {
      const coin = this.coins[index];
      coin.destroy();
      this.coins.splice(index, 1);
    }
  }

  /**
   * Crée l'effet visuel flottant de gain
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} gain - Montant gagné
   */
  showGainEffect(x, y, gain) {
    const floatTxt = this.scene.add.text(x, y, `+${gain}`, {
      fontFamily: 'monospace',
      fontSize: 32,
      color: '#ffffaa',
      stroke: '#000000',
      strokeThickness: 4
    }).setDepth(30).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: floatTxt,
      y: y - 60,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.out',
      onComplete: () => floatTxt.destroy()
    });
  }

  /**
   * Nettoie toutes les pièces
   */
  clear() {
    this.coins.forEach(coin => coin.destroy());
    this.coins = [];
    this.nextCoinAt = Phaser.Math.Between(3, 7);
  }

  /**
   * Détruit le gestionnaire
   */
  destroy() {
    this.clear();
    this.onCollect = null;
  }
}

export default BorgyCoin;