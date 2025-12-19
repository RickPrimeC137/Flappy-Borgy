/**
 * GameScene.js - Scène principale de jeu
 *
 * Scène responsable de :
 * - Initialiser les entités (Player, Pipes, Clouds, etc.)
 * - Gérer la boucle de jeu
 * - Collisions, scoring, bonus, pièces, bots
 * - Affichage du Game Over et restart
 *
 * @module scenes/GameScene
 */

import {
  GAME_W,
  GAME_H,
  GAME_ZOOM,
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
  constructor() {
    super('GameScene');

    // Options de jeu
    this._hardMode = false;
    this._xmasMode = false;
    this._goldPipesMode = false;

    // État
    this._gameStarted = false;
    this._gameOver = false;
    this._score = 0;
    this._bestScore = 0;
    this._scoreMultiplier = 1;
    this._reviveUsed = false;
    this._coinsCollected = 0;

    // Entités
    this._player = null;
    this._pipeFactory = null;
    this._bonusManager = null;
    this._coinEntityManager = null;
    this._botManager = null;
    this._cloudManager = null;
    this._background = null;

    // UI
    this._scoreText = null;
    this._startText = null;
    this._gameOverPopup = null;

    // Timers
    this._pipeTimer = null;
    this._bonusTimer = null;
    this._coinTimer = null;
    this._botTimer = null;

    // Effets visuels
    this._snowEmitter = null;
    this._damageTween = null;
    this._visualEffects = null;
    this._isNewRecord = false;
  }

  /**
   * Initialisation avec les données passées depuis MenuScene
   */
  init(data) {
    this._hardMode = data.hardMode || false;
    this._xmasMode = data.xmasMode || false;
    this._goldPipesMode = data.goldPipesMode || false;

    // Reset état
    this._gameStarted = false;
    this._gameOver = false;
    this._score = 0;
    this._scoreMultiplier = 1;
    this._reviveUsed = false;
    this._coinsCollected = 0;

    // Best score
    this._bestScore = storageManager.loadLocalBestScore();
  }

  /**
   * Création de la scène de jeu
   */
  create() {
    // === Caméra & zoom global ===
    const cam = this.cameras.main;
    if (cam) {
      const zoom = GAME_ZOOM || 1;
      cam.setZoom(zoom);
      cam.centerOn(GAME_W / 2, GAME_H / 2);
    }

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // Effets visuels
    this._visualEffects = getVisualEffects(this);

    // Arrière-plan
    this._createBackground(W, H);

    // Effets de neige (mode Noël)
    if (this._xmasMode) {
      this._createSnowEffect(W);
    }

    // Groupes
    this._pipesGroup = this.physics.add.group();
    this._sensorsGroup = this.physics.add.group();
    this._bonusGroup = this.physics.add.group();
    this._coinsGroup = this.add.group(); // non-physique
    this._botsGroup = this.physics.add.group();

    // Nuages (limites)
    this._cloudManager = new CloudManager(this, { isHard: this._hardMode });
    this._cloudManager.create();

    // Factory de tuyaux
    this._pipeFactory = new PipeFactory(this, {
      pipesGroup: this._pipesGroup,
      sensorsGroup: this._sensorsGroup,
      isHard: this._hardMode,
      isXmas: this._xmasMode,
      isGold: this._goldPipesMode
    });

    // Managers d’entités
    this._bonusManager = new BonusManager(this, this._bonusGroup);
    this._coinEntityManager = new BorgyCoinManager(this, this._coinsGroup);
    this._botManager = new BotManager(this, this._botsGroup, { isXmas: this._xmasMode });

    // Joueur
    this._createPlayer(cx, H);

    // UI
    this._createUI(cx, H);

    // Contrôles
    this._setupControls();

    // Audio
    if (this._hardMode) {
      audioManager.playHardModeBGM(this);
    } else {
      audioManager.ensureBGM(this);
    }

    // Load SFX into cache
    audioManager.loadSFX(this, 'sfx_flap');
    audioManager.loadSFX(this, 'sfx_score');
    audioManager.loadSFX(this, 'sfx_coin');
    audioManager.loadSFX(this, 'sfx_gameover');
  }

  // ============================================================
  // BACKGROUND & NEIGE
  // ============================================================

  _createBackground(W, H) {
    this._background = BackgroundFactory.createForGame(this, {
      isHard: this._hardMode,
      isXmas: this._xmasMode
    });
  }

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

  // ============================================================
  // JOUEUR
  // ============================================================

  _createPlayer(cx, H) {
    const skinKey = skinManager.getSkinKeyForMode(this._xmasMode);
    const skinScale = skinManager.computeSkinScale(this.textures, skinKey);

    this._player = new Player(this, cx - 80, H * 0.35, skinKey, {
      scale: skinScale,
      hardMode: this._hardMode
    });
  }

  // ============================================================
  // COLLISIONS
  // ============================================================

  _setupCollisions() {
    console.log('[GameScene] _setupCollisions called after 500ms delay');
    console.log(
      `[GameScene] Player position at collision setup: x=${this._player.sprite.x}, y=${this._player.sprite.y}`
    );

    const topCloud = this._cloudManager.getTopCloud();
    const bottomCloud = this._cloudManager.getBottomCloud();
    if (topCloud && this.physics.overlap(this._player.sprite, topCloud.getGameObject())) {
      console.log('[GameScene] Player overlaps top cloud at setup!');
    }
    if (bottomCloud && this.physics.overlap(this._player.sprite, bottomCloud.getGameObject())) {
      console.log('[GameScene] Player overlaps bottom cloud at setup!');
    }

    // Joueur <-> tuyaux
    this.physics.add.collider(
      this._player.sprite,
      this._pipesGroup,
      (player, pipe) => {
        console.log('[GameScene] Pipe collision detected!');
        console.log(`[GameScene] Player pos: x=${player.x}, y=${player.y}`);
        console.log(
          `[GameScene] Pipe pos: x=${pipe.x}, y=${pipe.y}, width=${pipe.width}, height=${pipe.height}`
        );
        console.log(
          `[GameScene] Pipe visible: ${pipe.visible}, active: ${pipe.active}, depth: ${pipe.depth}`
        );
        this._handlePipeCollision();
      }
    );

    // Joueur <-> bonus
    this.physics.add.overlap(
      this._player.sprite,
      this._bonusGroup,
      (player, bonus) => this._handleBonusCollect(bonus)
    );

    // Joueur <-> bots
    this.physics.add.collider(
      this._player.sprite,
      this._botsGroup,
      () => this._handleBotCollision()
    );

    // World bounds
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this._player.sprite.setCollideWorldBounds(true);
    this.physics.world.on('worldbounds', (body, up, down, left, right) => {
      if (body.gameObject === this._player.sprite && (up || down)) {
        this._triggerGameOver();
      }
    });
  }

  // ============================================================
  // UI
  // ============================================================

  _createUI(cx, H) {
    // Score
    this._scoreText = this.add.text(cx, 40, '0', {
      fontFamily: 'monospace',
      fontSize: 48,
      color: '#fff',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(200);

    // Texte "tap to start"
    this._startText = this.add.text(cx, H * 0.6, i18n.t('game.tapToStart'), {
      fontFamily: 'monospace',
      fontSize: 22,
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: this._startText,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1
    });
  }

  // ============================================================
  // CONTRÔLES
  // ============================================================

  _setupControls() {
    this.input.on('pointerdown', () => this._handleInput());
    this.input.keyboard.on('keydown-SPACE', () => this._handleInput());
    this.input.keyboard.on('keydown-UP', () => this._handleInput());
  }

  _handleInput() {
    if (this._gameOver) return;

    if (!this._gameStarted) {
      this._startGame();
    } else {
      this._player.flap();
    }
  }

  _startGame() {
    this._gameStarted = true;

    if (this._startText) {
      this._startText.destroy();
      this._startText = null;
    }

    this._player.startPhysics();
    this._player.flap();

    // collisions avant les spawners
    this._setupCollisions();
    this._startSpawners();
  }

  // ============================================================
  // SPAWNERS
  // ============================================================

  _startSpawners() {
    const diff = this._hardMode ? DIFF.HARD : DIFF.NORMAL;

    // Premier tuyau
    this.time.delayedCall(1500, () => {
      this._spawnPipe();
    });

    this._pipeTimer = this.time.addEvent({
      delay: diff.PIPE_SPAWN_DELAY,
      callback: () => this._spawnPipe(),
      loop: true,
      startAt: diff.PIPE_SPAWN_DELAY
    });

    this._bonusTimer = this.time.addEvent({
      delay: diff.BONUS_SPAWN_DELAY || 8000,
      callback: () => this._spawnBonus(),
      loop: true
    });

    this.time.delayedCall(1500, () => {
      this._spawnCoin();
    });

    this._coinTimer = this.time.addEvent({
      delay: diff.COIN_SPAWN_DELAY || 3000,
      callback: () => this._spawnCoin(),
      loop: true
    });

    if (this._hardMode) {
      this._botTimer = this.time.addEvent({
        delay: diff.BOT_SPAWN_DELAY || 10000,
        callback: () => this._spawnBot(),
        loop: true
      });
    }
  }

  _spawnPipe() {
    if (this._gameOver || !this._pipeFactory) return;

    try {
      const pipe = this._pipeFactory.spawn({
        speed: PROFILE.pipeSpeed,
        gap: PROFILE.gap
      });

      console.log('[GameScene] Pipe spawned successfully:');
      console.log(`[GameScene] - Pipe X position: ${pipe.x}`);
      console.log(
        `[GameScene] - Active pipes count: ${this._pipeFactory.getActivePipes().length}`
      );
      console.log(`[GameScene] - Physics velocity: ${PROFILE.pipeSpeed}`);
    } catch (e) {
      console.error('[GameScene] Erreur spawn pipe:', e);
    }
  }

  _spawnBonus() {
    if (this._gameOver) return;

    const W = this.scale.width;
    const H = this.scale.height;

    const x = W - 100;
    const minY = 100;
    const maxY = H - 100;
    const y = Phaser.Math.Between(minY, maxY);
    const speed = PROFILE.pipeSpeed;

    this._bonusManager.spawn(x, y, speed);
  }

  _spawnCoin() {
    if (this._gameOver) return;

    const W = this.scale.width;
    const H = this.scale.height;

    const x = W - 100;
    const minY = 100;
    const maxY = H - 100;
    const y = Phaser.Math.Between(minY, maxY);
    const speed = PROFILE.pipeSpeed;

    console.log('[GameScene] Spawning coin at x:', x, 'y:', y);
    this._coinEntityManager.spawn(x, y, speed);
  }

  _spawnBot() {
    if (this._gameOver) return;

    const W = this.scale.width;
    const H = this.scale.height;
    const x = W - 100;
    const minY = 100;
    const maxY = H - 100;
    const centerY = Phaser.Math.Between(minY + 50, maxY - 50);

    const pipeData = {
      x: x,
      topY: centerY - PROFILE.gap / 2,
      bottomY: centerY + PROFILE.gap / 2
    };

    const speed = -PROFILE.pipeSpeed;
    this._botManager.spawn(pipeData, speed);
  }

  // ============================================================
  // UPDATE
  // ============================================================

  update(time, delta) {
    if (!this._gameStarted || this._gameOver) return;

    if (this._player.sprite.body && time % 1000 < 16) {
      console.log(
        `[GameScene] Player pos: x=${this._player.sprite.x.toFixed(
          2
        )}, y=${this._player.sprite.y.toFixed(2)}, vel_y=${
          this._player.sprite.body.velocity.y
        }`
      );
    }

    if (this.physics.world.isPaused) {
      this.physics.world.resume();
      console.log('[GameScene] Physics world was paused, resumed');
    }

    this._player.update(time, delta);

    const activePipes = this._pipeFactory.getActivePipes();
    if (activePipes.length > 0) {
      console.log(
        `[GameScene] Pipes: ${activePipes.map(p => p.x.toFixed(2)).join(', ')}`
      );
    }

    this._pipeFactory.update(KILL_MARGIN);

    activePipes.forEach(pipe => {
      const deltaX = pipe.speed * (delta / 1000);
      if (pipe.topPipe) pipe.topPipe.x += deltaX;
      if (pipe.bottomPipe) pipe.bottomPipe.x += deltaX;
      if (pipe.sensor) pipe.sensor.x += deltaX;
    });

    const activeCoins = this._coinEntityManager.coins.filter(c => c.active);
    activeCoins.forEach(coin => {
      if (coin.sprite) {
        const deltaX = coin.speed * (delta / 1000);
        coin.sprite.x += deltaX;

        const dx = coin.sprite.x - this._player.sprite.x;
        const dy = coin.sprite.y - this._player.sprite.y;
        const distanceSq = dx * dx + dy * dy;
        const pickupRadius = 60 * (coin.sprite.scaleX / 0.08);

        if (distanceSq <= pickupRadius * pickupRadius) {
          this._handleCoinCollect(coin.sprite);
        }
      }
    });

    const activeBonuses = this._bonusManager.bonuses.filter(b => b.active);
    activeBonuses.forEach(bonus => {
      if (bonus.sprite) {
        const deltaX = bonus.speed * (delta / 1000);
        bonus.sprite.x += deltaX;
      }
    });

    this._checkPipePass();

    this._bonusManager.update(this._player, KILL_MARGIN);
    this._coinEntityManager.update(
      this._player,
      { isHardMode: this._hardMode, isGoldSkin: skinManager.isGoldSkin() },
      KILL_MARGIN
    );
    this._botManager.update(KILL_MARGIN);

    console.log(
      `[GameScene] Active coins: ${
        this._coinEntityManager.coins.filter(c => c.active).length
      }`
    );
  }

  _checkPipePass() {
    const pipes = this._pipeFactory.getActivePipes();
    const playerX = this._player.sprite.x;

    pipes.forEach(pipe => {
      if (pipe.sensor && pipe.sensor.isScore && !pipe.sensor.triggered) {
        console.log(
          `[GameScene] Checking sensor: sensor.x=${pipe.sensor.x}, player.x=${playerX}, triggered=${pipe.sensor.triggered}`
        );
        if (pipe.sensor.x < playerX) {
          pipe.sensor.triggered = true;
          console.log('[GameScene] Score triggered by sensor!');
          this._incrementScore();
        }
      }
    });
  }

  _incrementScore() {
    const pointsGained = this._scoreMultiplier;
    this._score += pointsGained;
    this._scoreText.setText(`${this._score}`);

    audioManager.playSFX('sfx_score');

    questManager.updateFromEvent('score', 1);

    this.tweens.add({
      targets: this._scoreText,
      scale: 1.3,
      duration: 100,
      yoyo: true
    });

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

  _handlePipeCollision() {
    const playerX = this._player.sprite.x;
    const playerY = this._player.sprite.y;
    const activePipes = this._pipeFactory.getActivePipes();

    console.log('[GameScene] === PIPE COLLISION DETECTED ===');
    console.log(`[GameScene] Player pos: x=${playerX.toFixed(2)}, y=${playerY.toFixed(2)}`);
    console.log(`[GameScene] Active pipes count: ${activePipes.length}`);

    activePipes.forEach((pipe, index) => {
      if (pipe.topPipe && pipe.bottomPipe) {
        console.log(
          `[GameScene] Pipe ${index}: topY=${pipe.topPipe.y.toFixed(
            2
          )}, bottomY=${pipe.bottomPipe.y.toFixed(2)}, x=${pipe.x.toFixed(2)}`
        );
        console.log(
          `[GameScene] Pipe ${index}: visible=${pipe.topPipe.visible}, active=${pipe.topPipe.active}, depth=${pipe.topPipe.depth}`
        );

        const playerInPipeZone =
          playerX > pipe.x - 50 && playerX < pipe.x + 50;
        if (playerInPipeZone) {
          console.log(
            `[GameScene] Pipe ${index}: Player is in pipe collision zone!`
          );
        }
      }
    });

    console.log('[GameScene] ================================');

    this._triggerGameOver();
  }

  _handleBotCollision() {
    this._triggerGameOver();
  }

  _handleBonusCollect(bonus) {
    console.log('[GameScene] _handleBonusCollect called with bonus:', bonus);
    console.log(
      '[GameScene] _bonusManager methods:',
      Object.getOwnPropertyNames(Object.getPrototypeOf(this._bonusManager))
    );

    const skinKey = skinManager.getSelectedKey();
    const skinDef = SKINS_DEF.find(s => s.key === skinKey);
    let multiplier = 2;

    if (skinDef && skinDef.perk === '3x bonus') {
      multiplier = 3;
    }

    this._scoreMultiplier = multiplier;
    this._bonusManager.collect(bonus);

    questManager.updateFromEvent('bonus', 1);

    if (this._visualEffects) {
      this._visualEffects.showBonusActivate(
        this._player.sprite.x,
        this._player.sprite.y,
        multiplier
      );
    } else {
      this._showMultiplierEffect(multiplier);
    }

    this.time.delayedCall(5000, () => {
      this._scoreMultiplier = 1;
    });
  }

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

  _handleCoinCollect(coin) {
    console.log('[GameScene] Coin collected');

    const skinKey = skinManager.getSelectedKey();
    const skinDef = SKINS_DEF.find(s => s.key === skinKey);
    let coinValue = 1;

    if (skinDef && skinDef.perk === '5x coins') {
      coinValue = 5;
    }

    if (this._hardMode) {
      coinValue *= 2;
    }

    this._coinsCollected += coinValue;
    coinManager.add(coinValue, 'coin_collect');
    this._coinEntityManager.collect(coin);

    audioManager.playSFX('sfx_coin');

    questManager.updateFromEvent('coin', coinValue);

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

  _triggerGameOver() {
    if (!this._reviveUsed && this._canRevive()) {
      this._useRevive();
      return;
    }

    this._gameOver = true;
    this._stopSpawners();

    if (this._visualEffects) {
      this._visualEffects.showDamage();
    }

    this._player.die();
    audioManager.playSFX('sfx_gameover');

    this._saveGameResults();

    this.time.delayedCall(1000, () => {
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

  _canRevive() {
    const skinKey = skinManager.getSelectedKey();
    const skinDef = SKINS_DEF.find(s => s.key === skinKey);
    return skinDef && skinDef.perk === '1 revive';
  }

  _useRevive() {
    this._reviveUsed = true;

    const cx = this.scale.width / 2 - 80;
    const cy = this.scale.height * 0.45;

    this._player.revive(cx, cy, (success) => {
      if (success) {
        if (this._visualEffects) {
          this._visualEffects.showRevive(
            this.scale.width / 2,
            this.scale.height / 2
          );
        } else {
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

  _stopSpawners() {
    if (this._pipeTimer) this._pipeTimer.destroy();
    if (this._bonusTimer) this._bonusTimer.destroy();
    if (this._coinTimer) this._coinTimer.destroy();
    if (this._botTimer) this._botTimer.destroy();
  }

  _saveGameResults() {
    storageManager.saveLocalLastScore(this._score);

    if (this._score > this._bestScore) {
      this._isNewRecord = true;
      this._bestScore = this._score;
      storageManager.saveLocalBestScore(this._score);
    } else {
      this._isNewRecord = false;
    }

    questManager.updateFromEvent('game', 1);
    leaderboardManager.postScore(this._score, 'Player');
  }

  _showGameOverPopup() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const container = this.add.container(cx, H / 2);
    container.setDepth(1000);
    this._gameOverPopup = container;

    const overlay = this.add.rectangle(0, 0, W * 2, H * 2, 0x000000, 0.8);
    container.add(overlay);

    const panel = this.add.rectangle(0, 0, 320, 380, 0x222222, 0.95)
      .setStrokeStyle(3, 0xff6b6b);
    container.add(panel);

    const title = this.add.text(0, -150, i18n.t('game.gameOver'), {
      fontFamily: 'monospace',
      fontSize: 32,
      color: '#ff6b6b'
    }).setOrigin(0.5);
    container.add(title);

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

    const coinsLabel = this.add.text(
      0,
      55,
      `💰 +${this._coinsCollected} ${i18n.t('game.coins')}`,
      {
        fontFamily: 'monospace',
        fontSize: 16,
        color: '#ffd700'
      }
    ).setOrigin(0.5);
    container.add(coinsLabel);

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

  _hasTelegramShare() {
    return (
      typeof window !== 'undefined' &&
      window.Telegram &&
      window.Telegram.WebApp
    );
  }

  _shareScore() {
    if (this._hasTelegramShare()) {
      const text = `🎮 I scored ${this._score} in Flappy Borgy! Can you beat me?`;
      window.Telegram.WebApp.switchInlineQuery(text, ['users', 'groups', 'channels']);
    }
  }

  _restartGame() {
    this.scene.restart({
      hardMode: this._hardMode,
      xmasMode: this._xmasMode,
      goldPipesMode: this._goldPipesMode
    });
  }

  _goToMenu() {
    this.scene.start('MenuScene');
  }
}

export default GameScene;
