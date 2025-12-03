/**
 * GameScene.js - Scène principale de jeu
 *
 * Cette scène est responsable de :
 * - Initialiser toutes les entités du jeu (Player, Pipes, Clouds, etc.)
 * - Gérer la boucle de jeu principale
 * - Gérer les collisions et le scoring
 * - Gérer les bonus et collectables
 * - Affichage du Game Over et gestion du restart
 *
 * @module scenes/GameScene
 */

import {
  GAME_W,
  GAME_H,
  BG_KEY,
  BG_HARD_KEY,
  BG_XMAS_KEY,
  PROFILE,
  DIFF,
  KILL_MARGIN,
  STORAGE_KEYS
} from '../config/constants.js';
import { SKINS_DEF, PIPE_CONFIGS } from '../config/skinConfig.js';
import storageManager from '../managers/StorageManager.js';
import audioManager from '../managers/AudioManager.js';
import skinManager from '../managers/SkinManager.js';
import coinManager from '../managers/CoinManager.js';
import questManager from '../managers/QuestManager.js';
import leaderboardManager from '../managers/LeaderboardManager.js';
import i18n from '../i18n/i18nManager.js';
import { Player } from '../entities/Player.js';
import { PipeFactory } from '../entities/Pipe.js';
import { BonusManager } from '../entities/Bonus.js';
import { BorgyCoinManager } from '../entities/BorgyCoin.js';
import { BotManager } from '../entities/Bot.js';
import { CloudManager } from '../entities/Cloud.js';
import { BackgroundFactory } from '../entities/Background.js';
import { getVisualEffects } from '../ui/VisualEffects.js';

/**
 * Scène principale de jeu
 * @extends Phaser.Scene
 */
export class GameScene extends Phaser.Scene {
  /**
   * Crée la scène de jeu
   */
  constructor() {
    super('GameScene');

    // ============================================================
    // OPTIONS DE JEU (passées par MenuScene)
    // ============================================================
    
    /**
     * Mode de jeu difficile
     * @type {boolean}
     * @private
     */
    this._hardMode = false;

    /**
     * Mode Noël
     * @type {boolean}
     * @private
     */
    this._xmasMode = false;

    /**
     * Mode tuyaux dorés
     * @type {boolean}
     * @private
     */
    this._goldPipesMode = false;

    // ============================================================
    // ÉTAT DU JEU
    // ============================================================
    
    /**
     * Jeu démarré
     * @type {boolean}
     * @private
     */
    this._gameStarted = false;

    /**
     * Jeu terminé
     * @type {boolean}
     * @private
     */
    this._gameOver = false;

    /**
     * Score actuel
     * @type {number}
     * @private
     */
    this._score = 0;

    /**
     * Meilleur score
     * @type {number}
     * @private
     */
    this._bestScore = 0;

    /**
     * Multiplicateur de score en cours
     * @type {number}
     * @private
     */
    this._scoreMultiplier = 1;

    /**
     * Revive utilisé (1 par partie pour skin Diamant)
     * @type {boolean}
     * @private
     */
    this._reviveUsed = false;

    /**
     * Nombre de pièces collectées cette partie
     * @type {number}
     * @private
     */
    this._coinsCollected = 0;

    // ============================================================
    // ENTITÉS
    // ============================================================
    
    /**
     * Instance du joueur
     * @type {Player|null}
     * @private
     */
    this._player = null;

    /**
     * Factory de tuyaux
     * @type {PipeFactory|null}
     * @private
     */
    this._pipeFactory = null;

    /**
     * Manager des bonus
     * @type {BonusManager|null}
     * @private
     */
    this._bonusManager = null;

    /**
     * Manager des pièces Borgy
     * @type {BorgyCoinManager|null}
     * @private
     */
    this._coinEntityManager = null;

    /**
     * Manager des robots
     * @type {BotManager|null}
     * @private
     */
    this._botManager = null;

    /**
     * Manager des nuages
     * @type {CloudManager|null}
     * @private
     */
    this._cloudManager = null;

    /**
     * Arrière-plan
     * @type {Phaser.GameObjects.Image|null}
     * @private
     */
    this._background = null;

    // ============================================================
    // UI ELEMENTS
    // ============================================================
    
    /**
     * Texte du score
     * @type {Phaser.GameObjects.Text|null}
     * @private
     */
    this._scoreText = null;

    /**
     * Texte d'instruction de démarrage
     * @type {Phaser.GameObjects.Text|null}
     * @private
     */
    this._startText = null;

    /**
     * Conteneur du popup de Game Over
     * @type {Phaser.GameObjects.Container|null}
     * @private
     */
    this._gameOverPopup = null;

    // ============================================================
    // TIMING
    // ============================================================
    
    /**
     * Timer pour le spawn des tuyaux
     * @type {Phaser.Time.TimerEvent|null}
     * @private
     */
    this._pipeTimer = null;

    /**
     * Timer pour le spawn des bonus
     * @type {Phaser.Time.TimerEvent|null}
     * @private
     */
    this._bonusTimer = null;

    /**
     * Timer pour le spawn des pièces
     * @type {Phaser.Time.TimerEvent|null}
     * @private
     */
    this._coinTimer = null;

    /**
     * Timer pour le spawn des robots
     * @type {Phaser.Time.TimerEvent|null}
     * @private
     */
    this._botTimer = null;

    // ============================================================
    // EFFETS VISUELS
    // ============================================================
    
    /**
     * Émetteur de particules de neige
     * @type {Phaser.GameObjects.Particles.ParticleEmitter|null}
     * @private
     */
    this._snowEmitter = null;

    /**
     * Tint rouge pour effets de dégâts
     * @type {Phaser.Tweens.Tween|null}
     * @private
     */
    this._damageTween = null;

    /**
     * Instance des effets visuels
     * @type {VisualEffects|null}
     * @private
     */
    this._visualEffects = null;

    /**
     * Indique si c'est un nouveau record
     * @type {boolean}
     * @private
     */
    this._isNewRecord = false;
  }

  /**
   * Initialisation avec les données passées depuis MenuScene
   * @param {Object} data - Données passées
   * @param {boolean} data.hardMode - Mode difficile
   * @param {boolean} data.xmasMode - Mode Noël
   * @param {boolean} data.goldPipesMode - Tuyaux dorés
   */
  init(data) {
    this._hardMode = data.hardMode || false;
    this._xmasMode = data.xmasMode || false;
    this._goldPipesMode = data.goldPipesMode || false;
    
    // Reset de l'état
    this._gameStarted = false;
    this._gameOver = false;
    this._score = 0;
    this._scoreMultiplier = 1;
    this._reviveUsed = false;
    this._coinsCollected = 0;
    
    // Charger le meilleur score
    this._bestScore = storageManager.loadLocalBestScore();
  }

  /**
   * Création de la scène de jeu
   */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // ============================================================
    // EFFETS VISUELS
    // ============================================================
    this._visualEffects = getVisualEffects(this);

    // ============================================================
    // ARRIÈRE-PLAN
    // ============================================================
    this._createBackground(W, H);

    // ============================================================
    // EFFETS DE NEIGE (Mode Noël)
    // ============================================================
    if (this._xmasMode) {
      this._createSnowEffect(W);
    }

    // ============================================================
    // GROUPES (PHYSIQUES ET NON-PHYSIQUES)
    // ============================================================
    this._pipesGroup = this.physics.add.group();
    this._sensorsGroup = this.physics.add.group();
    this._bonusGroup = this.physics.add.group();
    this._coinsGroup = this.add.group(); // Groupe non-physique pour les pièces
    this._botsGroup = this.physics.add.group();

    // ============================================================
    // NUAGES (LIMITES)
    // ============================================================
    this._cloudManager = new CloudManager(this, { isHard: this._hardMode });
    this._cloudManager.create();

    // ============================================================
    // FACTORY DE TUYAUX
    // ============================================================
    this._pipeFactory = new PipeFactory(this, {
      pipesGroup: this._pipesGroup,
      sensorsGroup: this._sensorsGroup,
      isHard: this._hardMode,
      isXmas: this._xmasMode,
      isGold: this._goldPipesMode
    });

    // ============================================================
    // MANAGERS D'ENTITÉS
    // ============================================================
    this._bonusManager = new BonusManager(this, this._bonusGroup);
    this._coinEntityManager = new BorgyCoinManager(this, this._coinsGroup);
    this._botManager = new BotManager(this, this._botsGroup, { isXmas: this._xmasMode });

    // ============================================================
    // JOUEUR
    // ============================================================
    this._createPlayer(cx, H);

    // Collisions seront activées après le démarrage du jeu

    // ============================================================
    // UI
    // ============================================================
    this._createUI(cx, H);

    // ============================================================
    // CONTRÔLES
    // ============================================================
    this._setupControls();

    // ============================================================
    // AUDIO
    // ============================================================
    if (this._hardMode) {
      audioManager.playHardModeBGM(this);
    } else {
      audioManager.ensureBGM(this);
    }
  }

  /**
   * Crée l'arrière-plan
   * @private
   * @param {number} W - Largeur
   * @param {number} H - Hauteur
   */
  _createBackground(W, H) {
    this._background = BackgroundFactory.createForGame(this, {
      isHard: this._hardMode,
      isXmas: this._xmasMode
    });
  }

  /**
   * Crée l'effet de neige pour le mode Noël
   * @private
   * @param {number} W - Largeur de l'écran
   */
  _createSnowEffect(W) {
    const particles = this.add.particles(0, 0, 'snow_flake', {
      x: { min: 0, max: W },
      y: -10,
      lifespan: 6000,
      speedY: { min: 30, max: 70 },
      speedX: { min: -20, max: 20 },
      scale: { min: 0.3, max: 1 },
      alpha: { start: 1, end: 0 },
      frequency: 100,
      blendMode: 'ADD'
    });
    particles.setDepth(100);
    this._snowEmitter = particles;
  }

  /**
   * Crée le joueur
   * @private
   * @param {number} cx - Centre X
   * @param {number} H - Hauteur
   */
  _createPlayer(cx, H) {
    const skinKey = skinManager.getSkinKeyForMode(this._xmasMode);
    const skinScale = skinManager.computeSkinScale(this.textures, skinKey);

    this._player = new Player(this, cx - 80, H * 0.35, skinKey, {
      scale: skinScale,
      hardMode: this._hardMode
    });
  }

  /**
   * Configure les collisions
   * @private
   */
  _setupCollisions() {
    console.log('[GameScene] _setupCollisions called after 500ms delay');
    console.log(`[GameScene] Player position at collision setup: x=${this._player.sprite.x}, y=${this._player.sprite.y}`);

    // Check for immediate overlaps with clouds
    const topCloud = this._cloudManager.getTopCloud();
    const bottomCloud = this._cloudManager.getBottomCloud();
    if (topCloud && this.physics.overlap(this._player.sprite, topCloud.getGameObject())) {
      console.log('[GameScene] Player overlaps top cloud at setup!');
    }
    if (bottomCloud && this.physics.overlap(this._player.sprite, bottomCloud.getGameObject())) {
      console.log('[GameScene] Player overlaps bottom cloud at setup!');
    }

    // Collision joueur <-> tuyaux
    this.physics.add.collider(
      this._player.sprite,
      this._pipesGroup,
      (player, pipe) => {
        console.log('[GameScene] Pipe collision detected!');
        console.log(`[GameScene] Player pos: x=${player.x}, y=${player.y}`);
        console.log(`[GameScene] Pipe pos: x=${pipe.x}, y=${pipe.y}, width=${pipe.width}, height=${pipe.height}`);
        console.log(`[GameScene] Pipe visible: ${pipe.visible}, active: ${pipe.active}, depth: ${pipe.depth}`);
        this._handlePipeCollision();
      }
    );


    // Overlap joueur <-> bonus
    this.physics.add.overlap(
      this._player.sprite,
      this._bonusGroup,
      (player, bonus) => this._handleBonusCollect(bonus)
    );

    // Note: La collision avec les pièces est gérée manuellement dans update()

    // Collision joueur <-> robots
    this.physics.add.collider(
      this._player.sprite,
      this._botsGroup,
      () => this._handleBotCollision()
    );

    // World bounds collision (top and bottom only)
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this._player.sprite.setCollideWorldBounds(true);
    this.physics.world.on('worldbounds', (body, up, down, left, right) => {
      if (body.gameObject === this._player.sprite && (up || down)) {
        this._triggerGameOver();
      }
    });
  }

  /**
   * Crée l'interface utilisateur
   * @private
   * @param {number} cx - Centre X
   * @param {number} H - Hauteur
   */
  _createUI(cx, H) {
    // Texte du score
    this._scoreText = this.add.text(cx, 40, '0', {
      fontFamily: 'monospace',
      fontSize: 48,
      color: '#fff',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(200);

    // Texte d'instruction de démarrage
    this._startText = this.add.text(cx, H * 0.6, i18n.t('game.tapToStart'), {
      fontFamily: 'monospace',
      fontSize: 22,
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);

    // Animation du texte
    this.tweens.add({
      targets: this._startText,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * Configure les contrôles du jeu
   * @private
   */
  _setupControls() {
    // Contrôle tactile / souris
    this.input.on('pointerdown', () => this._handleInput());

    // Contrôle clavier
    this.input.keyboard.on('keydown-SPACE', () => this._handleInput());
    this.input.keyboard.on('keydown-UP', () => this._handleInput());
  }

  /**
   * Gère l'entrée utilisateur (tap, clic, espace)
   * @private
   */
  _handleInput() {
    if (this._gameOver) return;

    if (!this._gameStarted) {
      this._startGame();
    } else {
      this._player.flap();
    }
  }

  /**
   * Démarre le jeu
   * @private
   */
  _startGame() {
    this._gameStarted = true;

    // Cacher le texte d'instruction
    if (this._startText) {
      this._startText.destroy();
      this._startText = null;
    }

    // Activer la physique du joueur
    this._player.startPhysics();
    this._player.flap();

    // Activer les collisions avant les spawners pour éviter la fenêtre vulnérable
    this._setupCollisions();

    // Démarrer les spawners avec un délai plus court
    this._startSpawners();
  }

  /**
   * Démarre les timers de spawn
   * @private
   */
  _startSpawners() {
    const diff = this._hardMode ? DIFF.HARD : DIFF.NORMAL;

    // Spawn immédiat du premier tuyau avec un petit délai
    this.time.delayedCall(300, () => {
      this._spawnPipe();
    });

    // Timer des tuyaux (commence après le délai initial)
    this._pipeTimer = this.time.addEvent({
      delay: diff.PIPE_SPAWN_DELAY,
      callback: () => this._spawnPipe(),
      loop: true,
      startAt: diff.PIPE_SPAWN_DELAY - 800 // Premier spawn automatique plus tôt
    });

    // Timer des bonus (délai initial avant le premier)
    this._bonusTimer = this.time.addEvent({
      delay: diff.BONUS_SPAWN_DELAY || 8000,
      callback: () => this._spawnBonus(),
      loop: true
    });

    // Timer des pièces (spawn rapide de la première)
    this.time.delayedCall(1500, () => {
      this._spawnCoin();
    });
    
    this._coinTimer = this.time.addEvent({
      delay: diff.COIN_SPAWN_DELAY || 3000,
      callback: () => this._spawnCoin(),
      loop: true
    });

    // Timer des robots (seulement en mode Hard)
    if (this._hardMode) {
      this._botTimer = this.time.addEvent({
        delay: diff.BOT_SPAWN_DELAY || 10000,
        callback: () => this._spawnBot(),
        loop: true
      });
    }
  }

  /**
   * Fait apparaître un tuyau
   * @private
   */
  _spawnPipe() {
    if (this._gameOver) return;
    if (!this._pipeFactory) return;
    
    try {
      const pipe = this._pipeFactory.spawn({
        speed: PROFILE.pipeSpeed,
        gap: PROFILE.gap
      });
      
      // Validation du pipe créé
      console.log('[GameScene] Pipe spawned successfully:');
      console.log(`[GameScene] - Pipe X position: ${pipe.x}`);
      console.log(`[GameScene] - Active pipes count: ${this._pipeFactory.getActivePipes().length}`);
      console.log(`[GameScene] - Physics velocity: ${PROFILE.pipeSpeed}`);
      
    } catch (e) {
      console.error('[GameScene] Erreur spawn pipe:', e);
    }
  }

  /**
   * Fait apparaître un bonus
   * @private
   */
  _spawnBonus() {
    if (this._gameOver) return;

    const W = this.scale.width;
    const H = this.scale.height;
    const diff = this._hardMode ? DIFF.HARD : DIFF.NORMAL;

    // Position X : bord droit de l'écran, mais bien visible
    const x = W - 100;
    // Position Y : aléatoire dans la zone jouable (entre les nuages)
    const minY = 100;
    const maxY = H - 100;
    const y = Phaser.Math.Between(minY, maxY);
    // Vitesse : même que les tuyaux
    const speed = PROFILE.pipeSpeed;

    this._bonusManager.spawn(x, y, speed);
  }

  /**
   * Fait apparaître une pièce
   * @private
   */
  _spawnCoin() {
    if (this._gameOver) return;

    const W = this.scale.width;
    const H = this.scale.height;

    // Position X : bord droit de l'écran, mais bien visible
    const x = W - 100;
    // Position Y : aléatoire dans la zone jouable (entre les nuages)
    const minY = 100;
    const maxY = H - 100;
    const y = Phaser.Math.Between(minY, maxY);
    // Vitesse : même que les tuyaux
    const speed = PROFILE.pipeSpeed;

    console.log('[GameScene] Spawning coin at x:', x, 'y:', y);
    this._coinEntityManager.spawn(x, y, speed);
  }

  /**
   * Fait apparaître un robot
   * @private
   */
  _spawnBot() {
    if (this._gameOver) return;
    
    const W = this.scale.width;
    const H = this.scale.height;
    
    // Position X : bord droit de l'écran, mais bien visible
    const x = W - 100;
    
    // Positions Y pour les tuyaux (simulées)
    const minY = 100;
    const maxY = H - 100;
    const centerY = Phaser.Math.Between(minY + 50, maxY - 50);
    
    // pipeData simule les positions de tuyaux
    const pipeData = {
      x: x,
      topY: centerY - PROFILE.gap / 2,    // Bord inférieur du tuyau du haut
      bottomY: centerY + PROFILE.gap / 2  // Bord supérieur du tuyau du bas
    };
    
    // Vitesse : même que les tuyaux
    const speed = -PROFILE.pipeSpeed;
    
    this._botManager.spawn(pipeData, speed);
  }

  /**
   * Boucle de mise à jour principale
   * @param {number} time - Temps écoulé
   * @param {number} delta - Delta depuis la dernière frame
   */
  update(time, delta) {
    if (!this._gameStarted || this._gameOver) return;

    // Debug: Logs occasionnels pour diagnostiquer la physique (toutes les 60 frames)
    if (this._player.sprite.body && time % 1000 < 16) {
      console.log(`[GameScene] Player pos: x=${this._player.sprite.x.toFixed(2)}, y=${this._player.sprite.y.toFixed(2)}, vel_y=${this._player.sprite.body.velocity.y}`);
    }

    // Vérification optimisée de la physique (seulement si nécessaire)
    if (this.physics.world.isPaused) {
      this.physics.world.resume();
      console.log('[GameScene] Physics world was paused, resumed');
    }

    // Mise à jour du joueur
    this._player.update(time, delta);

    // Debug: Vérifier les tuyaux
    const activePipes = this._pipeFactory.getActivePipes();
    if (activePipes.length > 0) {
      console.log(`[GameScene] Pipes: ${activePipes.map(p => p.x.toFixed(2)).join(', ')}`);
    }

    // Mise à jour des tuyaux (physique Phaser automatique)
    this._pipeFactory.update(KILL_MARGIN);

    // Mouvement manuel des tuyaux pour éviter les conflits de physique
    activePipes.forEach(pipe => {
      const deltaX = pipe.speed * (delta / 1000);
      if (pipe.topPipe) pipe.topPipe.x += deltaX;
      if (pipe.bottomPipe) pipe.bottomPipe.x += deltaX;
      if (pipe.sensor) pipe.sensor.x += deltaX;
    });

    // Mouvement manuel des pièces pour assurer le défilement
    const activeCoins = this._coinEntityManager.coins.filter(c => c.active);
    activeCoins.forEach(coin => {
      if (coin.sprite) {
        const deltaX = coin.speed * (delta / 1000);
        coin.sprite.x += deltaX;

        // Détection de proximité pour collecter la pièce
        const dx = coin.sprite.x - this._player.sprite.x;
        const dy = coin.sprite.y - this._player.sprite.y;
        const distanceSq = dx * dx + dy * dy;
        const pickupRadius = 60 * (coin.sprite.scaleX / 0.08); // Rayon de collecte ajusté à l'échelle

        if (distanceSq <= pickupRadius * pickupRadius) {
          this._handleCoinCollect(coin.sprite);
        }
      }
    });

    // Mouvement manuel des bonus pour assurer le défilement
    const activeBonuses = this._bonusManager.bonuses.filter(b => b.active);
    activeBonuses.forEach(bonus => {
      if (bonus.sprite) {
        const deltaX = bonus.speed * (delta / 1000);
        bonus.sprite.x += deltaX;
      }
    });

    // Vérification du score (passage de tuyaux)
    this._checkPipePass();

    // Mise à jour des managers
    this._bonusManager.update(this._player, KILL_MARGIN);
    this._coinEntityManager.update(this._player, { isHardMode: this._hardMode, isGoldSkin: skinManager.isGoldSkin() }, KILL_MARGIN);
    this._botManager.update(KILL_MARGIN);

    // Debug: Nombre de pièces actives
    console.log(`[GameScene] Active coins: ${this._coinEntityManager.coins.filter(c => c.active).length}`);
  }

  /**
   * Vérifie si le joueur a passé un tuyau
   * @private
   */
  _checkPipePass() {
    const pipes = this._pipeFactory.getActivePipes();
    const playerX = this._player.sprite.x;

    pipes.forEach(pipe => {
      // Utiliser le sensor pour le score
      if (pipe.sensor && pipe.sensor.isScore && !pipe.sensor.triggered) {
        console.log(`[GameScene] Checking sensor: sensor.x=${pipe.sensor.x}, player.x=${playerX}, triggered=${pipe.sensor.triggered}`);
        if (pipe.sensor.x < playerX) {
          pipe.sensor.triggered = true;
          console.log('[GameScene] Score triggered by sensor!');
          this._incrementScore();
        }
      }
    });
  }

  /**
   * Incrémente le score
   * @private
   */
  _incrementScore() {
    const pointsGained = this._scoreMultiplier;
    this._score += pointsGained;
    this._scoreText.setText(`${this._score}`);

    // Effet sonore
    audioManager.playSFX('sfx_score');

    // Mettre à jour les quêtes
    questManager.updateFromEvent('score', 1);

    // Animation du score améliorée
    this.tweens.add({
      targets: this._scoreText,
      scale: 1.3,
      duration: 100,
      yoyo: true
    });

    // Effet visuel de score flottant si multiplicateur actif
    if (this._scoreMultiplier > 1 && this._visualEffects) {
      this._visualEffects.showFloatingScore(
        this._player.sprite.x + 50,
        this._player.sprite.y - 30,
        pointsGained,
        {
          color: '#00ff88',
          fontSize: 20,
          prefix: '+',
          duration: 800
        }
      );
    }
  }

  /**
   * Gère la collision avec un tuyau
   * @private
   */
  _handlePipeCollision() {
    // Logs de validation pour diagnostiquer les pipes invisibles
    const playerX = this._player.sprite.x;
    const playerY = this._player.sprite.y;
    const activePipes = this._pipeFactory.getActivePipes();
    
    console.log('[GameScene] === PIPE COLLISION DETECTED ===');
    console.log(`[GameScene] Player pos: x=${playerX.toFixed(2)}, y=${playerY.toFixed(2)}`);
    console.log(`[GameScene] Active pipes count: ${activePipes.length}`);
    
    // Vérifier chaque pipe active
    activePipes.forEach((pipe, index) => {
      if (pipe.topPipe && pipe.bottomPipe) {
        console.log(`[GameScene] Pipe ${index}: topY=${pipe.topPipe.y.toFixed(2)}, bottomY=${pipe.bottomPipe.y.toFixed(2)}, x=${pipe.x.toFixed(2)}`);
        console.log(`[GameScene] Pipe ${index}: visible=${pipe.topPipe.visible}, active=${pipe.topPipe.active}, depth=${pipe.topPipe.depth}`);
        
        // Vérifier si le joueur est dans la zone du pipe
        const playerInPipeZone = playerX > pipe.x - 50 && playerX < pipe.x + 50;
        if (playerInPipeZone) {
          console.log(`[GameScene] Pipe ${index}: Player is in pipe collision zone!`);
        }
      }
    });
    
    console.log('[GameScene] ================================');
    
    this._triggerGameOver();
  }


  /**
   * Gère la collision avec un robot
   * @private
   */
  _handleBotCollision() {
    this._triggerGameOver();
  }

  /**
   * Gère la collecte d'un bonus
   * @private
   * @param {Phaser.GameObjects.Sprite} bonus - Sprite du bonus
   */
  _handleBonusCollect(bonus) {
    console.log('[GameScene] _handleBonusCollect called with bonus:', bonus);
    console.log('[GameScene] _bonusManager methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this._bonusManager)));

    // Appliquer le multiplicateur
    const skinKey = skinManager.getSelectedKey();
    const skinDef = SKINS_DEF.find(s => s.key === skinKey);
    let multiplier = 2;

    // Bonus Émeraude : 3x bonus au lieu de 2x
    if (skinDef && skinDef.perk === '3x bonus') {
      multiplier = 3;
    }

    this._scoreMultiplier = multiplier;
    this._bonusManager.collect(bonus);

    // Mettre à jour les quêtes
    questManager.updateFromEvent('bonus', 1);

    // Effet visuel amélioré
    if (this._visualEffects) {
      this._visualEffects.showBonusActivate(
        this._player.sprite.x,
        this._player.sprite.y,
        multiplier
      );
    } else {
      this._showMultiplierEffect(multiplier);
    }

    // Timer pour réinitialiser le multiplicateur
    this.time.delayedCall(5000, () => {
      this._scoreMultiplier = 1;
    });
  }

  /**
   * Affiche l'effet du multiplicateur (fallback)
   * @private
   * @param {number} multiplier - Valeur du multiplicateur
   */
  _showMultiplierEffect(multiplier) {
    const text = this.add.text(
      this._player.sprite.x,
      this._player.sprite.y - 50,
      `x${multiplier}`,
      {
        fontFamily: 'monospace',
        fontSize: 28,
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 4
      }
    ).setOrigin(0.5).setDepth(300);

    this.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy()
    });
  }

  /**
   * Gère la collecte d'une pièce
   * @private
   * @param {Phaser.GameObjects.Sprite} coin - Sprite de la pièce
   */
  _handleCoinCollect(coin) {
    console.log('[GameScene] Coin collected');
    // Calcul des coins avec bonus skin Gold (5x)
    const skinKey = skinManager.getSelectedKey();
    const skinDef = SKINS_DEF.find(s => s.key === skinKey);
    let coinValue = 1;

    if (skinDef && skinDef.perk === '5x coins') {
      coinValue = 5;
    }

    // Bonus mode Hard : x2 coins
    if (this._hardMode) {
      coinValue *= 2;
    }

    this._coinsCollected += coinValue;
    coinManager.add(coinValue, 'coin_collect');
    this._coinEntityManager.collect(coin);

    // Effet sonore
    audioManager.playSFX('sfx_coin');

    // Mettre à jour les quêtes
    questManager.updateFromEvent('coin', coinValue);

    // Effet visuel amélioré
    if (this._visualEffects) {
      this._visualEffects.showCoinCollect(
        this._player.sprite.x + 30,
        this._player.sprite.y,
        coinValue
      );
    } else {
      this._showCoinEffect(coinValue);
    }
  }

  /**
   * Affiche l'effet de pièce collectée (fallback)
   * @private
   * @param {number} value - Valeur de la pièce
   */
  _showCoinEffect(value) {
    const text = this.add.text(
      this._player.sprite.x + 30,
      this._player.sprite.y,
      `+${value}`,
      {
        fontFamily: 'monospace',
        fontSize: 20,
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 3
      }
    ).setOrigin(0.5).setDepth(300);

    this.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy()
    });
  }

  /**
   * Déclenche le Game Over
   * @private
   */
  _triggerGameOver() {
    // Vérifier si on peut utiliser le revive (skin Diamant)
    if (!this._reviveUsed && this._canRevive()) {
      this._useRevive();
      return;
    }

    this._gameOver = true;

    // Stopper les timers
    this._stopSpawners();

    // Effet visuel de dégâts
    if (this._visualEffects) {
      this._visualEffects.showDamage();
    }

    // Animation de mort du joueur
    this._player.die();

    // Effet sonore
    audioManager.playSFX('sfx_gameover');

    // Sauvegarder le score et vérifier nouveau record
    this._saveGameResults();

    // Afficher le popup Game Over avec délai
    this.time.delayedCall(1000, () => {
      // Afficher effet nouveau record si applicable
      if (this._isNewRecord && this._visualEffects) {
        this._visualEffects.showNewRecord(this._score);
        this.time.delayedCall(2500, () => {
          this._showGameOverPopup();
        });
      } else {
        this._showGameOverPopup();
      }
    });
  }

  /**
   * Vérifie si le joueur peut utiliser le revive
   * @private
   * @returns {boolean}
   */
  _canRevive() {
    const skinKey = skinManager.getSelectedKey();
    const skinDef = SKINS_DEF.find(s => s.key === skinKey);
    return skinDef && skinDef.perk === '1 revive';
  }

  /**
   * Utilise le revive
   * @private
   */
  _useRevive() {
    this._reviveUsed = true;
    
    // Position de respawn (milieu de l'écran)
    const cx = this.scale.width / 2 - 80;
    const cy = this.scale.height * 0.45;
    
    this._player.revive(cx, cy, (success) => {
      if (success) {
        // Effet visuel de revive amélioré
        if (this._visualEffects) {
          this._visualEffects.showRevive(
            this.scale.width / 2,
            this.scale.height / 2
          );
        } else {
          // Fallback
          const reviveText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            '💎 REVIVE!',
            {
              fontFamily: 'monospace',
              fontSize: 36,
              color: '#00ffff',
              stroke: '#000',
              strokeThickness: 6
            }
          ).setOrigin(0.5).setDepth(500);

          this.tweens.add({
            targets: reviveText,
            scale: 1.5,
            alpha: 0,
            duration: 1500,
            onComplete: () => reviveText.destroy()
          });
        }
      }
    });
  }

  /**
   * Arrête tous les spawners
   * @private
   */
  _stopSpawners() {
    if (this._pipeTimer) this._pipeTimer.destroy();
    if (this._bonusTimer) this._bonusTimer.destroy();
    if (this._coinTimer) this._coinTimer.destroy();
    if (this._botTimer) this._botTimer.destroy();
  }

  /**
   * Sauvegarde les résultats de la partie
   * @private
   */
  _saveGameResults() {
    // Sauvegarder le score actuel à chaque partie
    storageManager.saveLocalLastScore(this._score);

    // Vérifier et sauvegarder le meilleur score si supérieur
    if (this._score > this._bestScore) {
      this._isNewRecord = true;
      this._bestScore = this._score;
      storageManager.saveLocalBestScore(this._score);
    } else {
      this._isNewRecord = false;
    }

    // Mettre à jour les quêtes
    questManager.updateFromEvent('game', 1);

    // Publier le score au leaderboard (le nom vient du profil joueur)
    leaderboardManager.postScore(this._score, 'Player');
  }

  /**
   * Affiche le popup de Game Over
   * @private
   */
  _showGameOverPopup() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const container = this.add.container(cx, H / 2);
    container.setDepth(1000);
    this._gameOverPopup = container;

    // Fond semi-transparent
    const overlay = this.add.rectangle(0, 0, W * 2, H * 2, 0x000000, 0.8);
    container.add(overlay);

    // Panneau
    const panel = this.add.rectangle(0, 0, 320, 380, 0x222222, 0.95)
      .setStrokeStyle(3, 0xff6b6b);
    container.add(panel);

    // Titre
    const title = this.add.text(0, -150, i18n.t('game.gameOver'), {
      fontFamily: 'monospace',
      fontSize: 32,
      color: '#ff6b6b'
    }).setOrigin(0.5);
    container.add(title);

    // Score
    const scoreLabel = this.add.text(0, -90, i18n.t('game.score'), {
      fontFamily: 'monospace',
      fontSize: 18,
      color: '#aaa'
    }).setOrigin(0.5);
    container.add(scoreLabel);

    const scoreValue = this.add.text(0, -55, `${this._score}`, {
      fontFamily: 'monospace',
      fontSize: 42,
      color: '#fff'
    }).setOrigin(0.5);
    container.add(scoreValue);

    // Meilleur score
    const bestLabel = this.add.text(0, -10, i18n.t('game.bestScore'), {
      fontFamily: 'monospace',
      fontSize: 14,
      color: '#aaa'
    }).setOrigin(0.5);
    container.add(bestLabel);

    const bestValue = this.add.text(0, 15, `🏆 ${this._bestScore}`, {
      fontFamily: 'monospace',
      fontSize: 22,
      color: '#ffd700'
    }).setOrigin(0.5);
    container.add(bestValue);

    // Coins collectés
    const coinsLabel = this.add.text(0, 55, `💰 +${this._coinsCollected} ${i18n.t('game.coins')}`, {
      fontFamily: 'monospace',
      fontSize: 16,
      color: '#ffd700'
    }).setOrigin(0.5);
    container.add(coinsLabel);

    // Bouton Rejouer
    const replayBtn = this.add.text(0, 110, `🔄 ${i18n.t('game.playAgain')}`, {
      fontFamily: 'monospace',
      fontSize: 20,
      color: '#fff',
      backgroundColor: '#17a689',
      padding: { x: 24, y: 12 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._restartGame());
    container.add(replayBtn);

    // Bouton Menu
    const menuBtn = this.add.text(0, 165, `🏠 ${i18n.t('game.backToMenu')}`, {
      fontFamily: 'monospace',
      fontSize: 16,
      color: '#fff',
      backgroundColor: '#444',
      padding: { x: 20, y: 10 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._goToMenu());
    container.add(menuBtn);

    // Bouton Partager (si Telegram disponible)
    if (this._hasTelegramShare()) {
      const shareBtn = this.add.text(120, -150, '📤', {
        fontFamily: 'monospace',
        fontSize: 24,
        color: '#fff'
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this._shareScore());
      container.add(shareBtn);
    }
  }

  /**
   * Vérifie si le partage Telegram est disponible
   * @private
   * @returns {boolean}
   */
  _hasTelegramShare() {
    return typeof window !== 'undefined' && 
           window.Telegram && 
           window.Telegram.WebApp;
  }

  /**
   * Partage le score via Telegram
   * @private
   */
  _shareScore() {
    if (this._hasTelegramShare()) {
      const text = `🎮 I scored ${this._score} in Flappy Borgy! Can you beat me?`;
      window.Telegram.WebApp.switchInlineQuery(text, ['users', 'groups', 'channels']);
    }
  }

  /**
   * Redémarre le jeu
   * @private
   */
  _restartGame() {
    this.scene.restart({
      hardMode: this._hardMode,
      xmasMode: this._xmasMode,
      goldPipesMode: this._goldPipesMode
    });
  }

  /**
   * Retourne au menu principal
   * @private
   */
  _goToMenu() {
    this.scene.start('MenuScene');
  }
}

export default GameScene;