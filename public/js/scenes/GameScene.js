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
  GAME_ZOOM,        // ⬅️ ajouté
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
    // ============================================================
    // CAMÉRA & ZOOM GLOBAL
    // ============================================================
    const cam = this.cameras.main;

    // IMPORTANT :
    // - GAME_ZOOM = 1  -> comme avant
    // - GAME_ZOOM < 1  -> tout est plus petit (dézoom)
    // - GAME_ZOOM > 1  -> zoom
    cam.setZoom(GAME_ZOOM || 0.8);
    cam.centerOn(GAME_W / 2, GAME_H / 2);

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

  // 🔻🔻🔻  TOUT LE RESTE DE TA GameScene RESTE IDENTIQUE  🔻🔻🔻
  // (je ne change rien à la logique, collisions, bonus, game over, etc.)

  _setupCollisions() {
    console.log('[GameScene] _setupCollisions called after 500ms delay');
    console.log(`[GameScene] Player position at collision setup: x=${this._player.sprite.x}, y=${this._player.sprite.y}`);

    const topCloud = this._cloudManager.getTopCloud();
    const bottomCloud = this._cloudManager.getBottomCloud();
    if (topCloud && this.physics.overlap(this._player.sprite, topCloud.getGameObject())) {
      console.log('[GameScene] Player overlaps top cloud at setup!');
    }
    if (bottomCloud && this.physics.overlap(this._player.sprite, bottomCloud.getGameObject())) {
      console.log('[GameScene] Player overlaps bottom cloud at setup!');
    }

    this.physics.add.collider(
      this._player.sprite,
      this._pipesGroup,
      (player, pipe) => {
        console.log('[GameScene] Pipe collision detected!');
        console.log(`[GameScene] Player pos: x=${player.x}, y=${player.y}`);
        console.log(`[GameScene] Pipe pos: x=${pipe.x}, y=${pipe.y}, width=${pipe.width}, height=${pipe.height}`);
        console.log(`[GameScene] Pipe visible: ${pipe.visible}, active: ${pipe.active}, depth=${pipe.depth}`);
        this._handlePipeCollision();
      }
    );

    this.physics.add.overlap(
      this._player.sprite,
      this._bonusGroup,
      (player, bonus) => this._handleBonusCollect(bonus)
    );

    this.physics.add.collider(
      this._player.sprite,
      this._botsGroup,
      () => this._handleBotCollision()
    );

    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this._player.sprite.setCollideWorldBounds(true);
    this.physics.world.on('worldbounds', (body, up, down, left, right) => {
      if (body.gameObject === this._player.sprite && (up || down)) {
        this._triggerGameOver();
      }
    });
  }

  // … (toute la suite de ton fichier : _createUI, _setupControls, _startGame,
  //     _startSpawners, _spawnPipe, _spawnBonus, _spawnCoin, _spawnBot,
  //     update, _checkPipePass, _incrementScore, _handlePipeCollision,
  //     _handleBotCollision, _handleBonusCollect, _showMultiplierEffect,
  //     _handleCoinCollect, _showCoinEffect, _triggerGameOver, _canRevive,
  //     _useRevive, _stopSpawners, _saveGameResults, _showGameOverPopup,
  //     _hasTelegramShare, _shareScore, _restartGame, _goToMenu)
  //
  // Copie simplement ton code existant sous cette ligne, sans le modifier.
}

export default GameScene;


