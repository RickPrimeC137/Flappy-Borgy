/**
 * MenuScene.js - Scène du menu principal (version UI responsive mobile)
 *
 * Correctif principal :
 * - Avec Phaser.Scale.FIT, le canvas est réduit sur mobile => textes minuscules.
 * - On calcule un multiplicateur UI = 1 / scaleFit, puis on applique sur fontSize/padding/stroke.
 */

import {
  GAME_W,
  GAME_H,
  BG_KEY,
  BG_HARD_KEY,
  BG_XMAS_KEY,
  PROFILE,
  LANG_OPTIONS,
  STORAGE_KEYS
} from '../config/constants.js';
import { SKINS_DEF } from '../config/skinConfig.js';
import storageManager from '../managers/StorageManager.js';
import audioManager from '../managers/AudioManager.js';
import skinManager from '../managers/SkinManager.js';
import coinManager from '../managers/CoinManager.js';
import questManager from '../managers/QuestManager.js';
import leaderboardManager from '../managers/LeaderboardManager.js';
import i18n from '../i18n/i18nManager.js';
import { WelcomePopup } from '../ui/WelcomePopup.js';
import LeaderboardPopup from '../ui/LeaderboardPopup.js';
import { getVisualEffects } from '../ui/VisualEffects.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');

    this._hardMode = false;
    this._xmasMode = false;
    this._goldPipesMode = false;

    this._currentLang = 'en';
    this._currentLangIdx = 0;

    this._activePopup = null;

    this._coinText = null;
    this._bestScoreText = null;

    this._hardModeBtn = null;
    this._xmasBtn = null;
    this._goldPipesBtn = null;
    this._langBtn = null;

    this._bgImage = null;
    this._shopBadge = null;

    this._visualEffects = null;

    // UI scaling
    this._uiMul = 1;
  }

  create() {
    // 1) Calcule le multiplicateur UI (compense Phaser FIT)
    this._uiMul = this._computeUIMultiplier();

    // (Optionnel mais utile) si l’utilisateur tourne l’écran, on relayout en restart
    // => évite des tailles incohérentes après un resize/orientation change
    this.scale.off('resize', this._onResize, this);
    this.scale.on('resize', this._onResize, this);

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    this._visualEffects = getVisualEffects(this);

    this._loadPreferences();
    this._initI18n();

    this._createBackground(W, H);
    this._createTitle(cx);
    this._createStatsDisplay(W);
    this._createMainButtons(cx, H);
    this._createSecondaryButtons(W, H);
    this._createMuteButton(W);
    this._initAudio();
    this._checkFirstSession(cx, H);

    this.input.keyboard.on('keydown-ESC', () => {
      this._closeActivePopup();
    });
  }

  _onResize() {
    // Recalcule proprement les tailles UI
    this.scene.restart();
  }

  /**
   * Multiplie les tailles UI pour compenser la réduction FIT
   * Exemple : base=1024, display=420 => s~0.41 => uiMul~2.43 => textes lisibles
   */
  _computeUIMultiplier() {
    const baseW = this.scale.baseSize?.width ?? GAME_W;
    const baseH = this.scale.baseSize?.height ?? GAME_H;

    const dispW = this.scale.displaySize?.width ?? this.scale.width;
    const dispH = this.scale.displaySize?.height ?? this.scale.height;

    const sW = dispW / (baseW || 1);
    const sH = dispH / (baseH || 1);
    const s = Math.max(0.0001, Math.min(sW, sH)); // scale FIT (souvent < 1 sur mobile)

    // uiMul = inverse du FIT scale
    // clamp pour éviter d’exploser sur très petits écrans ou être inutile sur desktop
    return Phaser.Math.Clamp(1 / s, 1, 2.8);
  }

  // Helpers UI (font / padding / stroke)
  _fs(px, min = 10, max = 96) {
    return Phaser.Math.Clamp(Math.round(px * this._uiMul), min, max);
  }

  _pad(x, y) {
    return { x: Math.round(x * this._uiMul), y: Math.round(y * this._uiMul) };
  }

  _stroke(px, min = 0, max = 20) {
    return Phaser.Math.Clamp(Math.round(px * this._uiMul), min, max);
  }

  _loadPreferences() {
    this._hardMode = storageManager.loadHardMode();
    this._xmasMode = storageManager.loadXmasMode();
    this._goldPipesMode = storageManager.loadGoldPipes();
    this._currentLang = storageManager.loadLang();
    this._currentLangIdx = LANG_OPTIONS.findIndex(l => l.code === this._currentLang);
    if (this._currentLangIdx < 0) this._currentLangIdx = 0;
  }

  _initI18n() {
    i18n.setLang(this._currentLang);
  }

  _createBackground(W, H) {
    const bgKey = this._xmasMode ? BG_XMAS_KEY : (this._hardMode ? BG_HARD_KEY : BG_KEY);
    this._bgImage = this.add.image(W / 2, H / 2, bgKey)
      .setDisplaySize(W, H)
      .setDepth(-1);
  }

  _createTitle(cx) {
    this.add.text(cx, this._fs(60, 40, 120), 'FLAPPY BORGY', {
      fontFamily: 'monospace',
      fontSize: this._fs(38, 20, 80),
      color: '#fff',
      stroke: '#000',
      strokeThickness: this._stroke(6, 2, 18)
    }).setOrigin(0.5);
  }

  _createStatsDisplay(W) {
    const startY = this._fs(110, 80, 180);
    const coins = coinManager.getBalance();
    const bestScore = storageManager.loadLocalBestScore();

    // Icône coin
    this.add.image(W - this._fs(85, 55, 120), startY, 'borgy_coin')
      .setDisplaySize(this._fs(24, 18, 36), this._fs(24, 18, 36))
      .setOrigin(0.5);

    // Texte coins
    this._coinText = this.add.text(W - this._fs(65, 40, 100), startY, `${coins}`, {
      fontFamily: 'monospace',
      fontSize: this._fs(18, 14, 34),
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    // Best score
    this._bestScoreText = this.add.text(W - this._fs(85, 55, 120), startY + this._fs(30, 20, 60), `🏆 ${bestScore}`, {
      fontFamily: 'monospace',
      fontSize: this._fs(16, 12, 30),
      color: '#fff'
    }).setOrigin(0, 0.5);
  }

  _createMainButtons(cx, H) {
    const btnStyle = {
      fontFamily: 'monospace',
      fontSize: this._fs(28, 18, 54),
      color: '#fff',
      backgroundColor: '#17a689',
      padding: this._pad(32, 14)
    };

    // Bouton PLAY
    this.add.text(cx, H * 0.42, i18n.t('menu.play'), btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._startGame());

    // Hard Mode Toggle
    this._hardModeBtn = this.add.text(cx, H * 0.55, this._getHardModeLabel(), {
      fontFamily: 'monospace',
      fontSize: this._fs(18, 14, 34),
      color: this._hardMode ? '#ff6b6b' : '#fff',
      backgroundColor: this._hardMode ? '#4a0000' : '#333',
      padding: this._pad(18, 8)
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._toggleHardMode());

    // SHOP
    const shopBtn = this.add.text(cx, H * 0.66, `🛒 ${i18n.t('menu.shop')}`, {
      fontFamily: 'monospace',
      fontSize: this._fs(20, 15, 40),
      color: '#fff',
      backgroundColor: '#5a3d7a',
      padding: this._pad(24, 10)
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this._shopBadge) {
          this._shopBadge.destroy();
          this._shopBadge = null;
          storageManager.set('shop_visited', true);
        }
        this._showShopPopup();
      });

    // Badge NEW
    if (!storageManager.get('shop_visited') && !storageManager.loadWelcomeSeen()) {
      this._shopBadge = this.add.text(cx + this._fs(85, 60, 140), H * 0.66 - this._fs(18, 12, 30), i18n.t('SHOP_NEW_BADGE') || 'NEW', {
        fontFamily: 'monospace',
        fontSize: this._fs(10, 10, 22),
        color: '#fff',
        backgroundColor: '#ff3366',
        padding: this._pad(6, 3)
      }).setOrigin(0.5).setDepth(100);

      this.tweens.add({
        targets: this._shopBadge,
        scale: { from: 1, to: 1.15 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // QUESTS
    this.add.text(cx, H * 0.76, `📜 ${i18n.t('menu.quests')}`, {
      fontFamily: 'monospace',
      fontSize: this._fs(20, 15, 40),
      color: '#fff',
      backgroundColor: '#3d5a7a',
      padding: this._pad(24, 10)
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._showQuestsPopup());

    // LEADERBOARD
    this.add.text(cx, H * 0.86, `🏆 ${i18n.t('menu.leaderboard')}`, {
      fontFamily: 'monospace',
      fontSize: this._fs(20, 15, 40),
      color: '#fff',
      backgroundColor: '#7a5a3d',
      padding: this._pad(24, 10)
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._showLeaderboardPopup());
  }

  _createSecondaryButtons(W, H) {
    const smallBtnStyle = {
      fontFamily: 'monospace',
      fontSize: this._fs(14, 12, 26),
      color: '#fff',
      backgroundColor: '#444',
      padding: this._pad(10, 6)
    };

    this._langBtn = this.add.text(this._fs(20, 12, 40), H - this._fs(30, 18, 60), `🌐 ${LANG_OPTIONS[this._currentLangIdx].label}`, smallBtnStyle)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._toggleLanguage());

    this._xmasBtn = this.add.text(this._fs(20, 12, 40), H - this._fs(60, 35, 100), this._xmasMode ? '🎄 XMAS' : '🎄 Xmas', {
      ...smallBtnStyle,
      color: this._xmasMode ? '#00ff00' : '#fff'
    })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._toggleXmasMode());

    this._goldPipesBtn = this.add.text(this._fs(20, 12, 40), H - this._fs(90, 52, 140), this._goldPipesMode ? '🪙 GOLD' : '🪙 Gold', {
      ...smallBtnStyle,
      color: this._goldPipesMode ? '#ffd700' : '#fff'
    })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._toggleGoldPipes());

    this.add.text(W - this._fs(20, 12, 40), H - this._fs(60, 35, 100), '⭐ Vote', smallBtnStyle)
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._openVoteLink());

    this.add.text(W - this._fs(20, 12, 40), H - this._fs(30, 18, 60), '💎 Buy', smallBtnStyle)
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._openBuyLink());
  }

  _createMuteButton(W) {
    const isMuted = audioManager.isMuted();
    const muteBtn = this.add.text(W - this._fs(20, 12, 40), this._fs(20, 12, 40), isMuted ? '🔇' : '🔊', {
      fontFamily: 'monospace',
      fontSize: this._fs(28, 18, 56),
      color: '#fff'
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        audioManager.toggleMute();
        muteBtn.setText(audioManager.isMuted() ? '🔇' : '🔊');
      });
  }

  _initAudio() {
    audioManager.ensureBGM(this, this._hardMode);
  }

  _checkFirstSession(cx, H) {
    if (!storageManager.loadWelcomeSeen()) {
      const welcomePopup = new WelcomePopup(this, {
        onComplete: () => {
          if (this._visualEffects) {
            this._visualEffects.showCelebration(null, null, '🎮');
          }
        }
      });
      welcomePopup.show();
    }
  }

  _getHardModeLabel() {
    return this._hardMode ? `🔥 ${i18n.t('menu.hardMode')} ON` : `💤 ${i18n.t('menu.hardMode')} OFF`;
  }

  _toggleHardMode() {
    this._hardMode = !this._hardMode;
    storageManager.saveHardMode(this._hardMode);

    this._hardModeBtn.setText(this._getHardModeLabel());
    this._hardModeBtn.setColor(this._hardMode ? '#ff6b6b' : '#fff');
    this._hardModeBtn.setBackgroundColor(this._hardMode ? '#4a0000' : '#333');

    this._updateBackground();
    audioManager.ensureBGM(this, this._hardMode);
  }

  _toggleXmasMode() {
    this._xmasMode = !this._xmasMode;
    storageManager.saveXmasMode(this._xmasMode);

    this._xmasBtn.setText(this._xmasMode ? '🎄 XMAS' : '🎄 Xmas');
    this._xmasBtn.setColor(this._xmasMode ? '#00ff00' : '#fff');

    this._updateBackground();
  }

  _toggleGoldPipes() {
    this._goldPipesMode = !this._goldPipesMode;
    storageManager.saveGoldPipes(this._goldPipesMode);

    this._goldPipesBtn.setText(this._goldPipesMode ? '🪙 GOLD' : '🪙 Gold');
    this._goldPipesBtn.setColor(this._goldPipesMode ? '#ffd700' : '#fff');
  }

  _toggleLanguage() {
    this._currentLangIdx = (this._currentLangIdx + 1) % LANG_OPTIONS.length;
    this._currentLang = LANG_OPTIONS[this._currentLangIdx].code;
    storageManager.saveLang(this._currentLang);
    i18n.setLang(this._currentLang);
    this.scene.restart();
  }

  _updateBackground() {
    const bgKey = this._xmasMode ? BG_XMAS_KEY : (this._hardMode ? BG_HARD_KEY : BG_KEY);
    this._bgImage.setTexture(bgKey);
  }

  _openVoteLink() {
    window.open('https://borg.vote', '_blank');
  }

  _openBuyLink() {
    window.open('https://swissborg.com/buy-borg', '_blank');
  }

  _startGame() {
    this.scene.start('GameScene', {
      hardMode: this._hardMode,
      xmasMode: this._xmasMode,
      goldPipesMode: this._goldPipesMode
    });
  }

  // ============================================================
  // POPUPS
  // ============================================================

  _closeActivePopup() {
    if (this._activePopup) {
      this.tweens.add({
        targets: this._activePopup,
        scale: 0.8,
        alpha: 0,
        duration: 150,
        ease: 'Back.easeIn',
        onComplete: () => {
          this._activePopup.destroy();
          this._activePopup = null;
        }
      });
    }
  }

  _createPopupContainer(width, height) {
    const W = this.scale.width;
    const H = this.scale.height;

    this._closeActivePopup();

    // Dimensions responsives (sans multiplier étrange)
    const popupWidth = width || Math.min(W * 0.92, this._fs(650, 420, 740));
    const popupHeight = height || Math.min(H * 0.86, this._fs(540, 360, 820));

    const container = this.add.container(W / 2, H / 2);
    container.setDepth(1000);

    container.setScale(0.8);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });

    const overlay = this.add.rectangle(0, 0, W * 2, H * 2, 0x000000, 0.7)
      .setInteractive()
      .on('pointerdown', () => this._closeActivePopup());
    container.add(overlay);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-popupWidth / 2 + 5, -popupHeight / 2 + 5, popupWidth, popupHeight, 15);
    container.add(shadow);

    const panel = this.add.graphics();
    panel.fillStyle(0x222222, 0.95);
    panel.fillRoundedRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 15);
    panel.lineStyle(this._stroke(3, 2, 8), 0x17a689, 1);
    panel.strokeRoundedRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 15);
    container.add(panel);

    const closeBtn = this.add.text(popupWidth / 2 - this._fs(20, 14, 40), -popupHeight / 2 + this._fs(20, 14, 40), '✕', {
      fontFamily: 'monospace',
      fontSize: this._fs(24, 18, 40),
      color: '#ff6b6b',
      backgroundColor: '#333',
      padding: this._pad(8, 4)
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._closeActivePopup())
      .on('pointerover', () => closeBtn.setBackgroundColor('#555'))
      .on('pointerout', () => closeBtn.setBackgroundColor('#333'));
    container.add(closeBtn);

    this._activePopup = container;
    return container;
  }

  _showShopPopup() {
    const container = this._createPopupContainer();

    const popupHeight = Math.min(this.scale.height * 0.8, this._fs(520, 360, 820));
    const titleY = -popupHeight / 2 + this._fs(40, 26, 70);

    const title = this.add.text(0, titleY, `🛒 ${i18n.t('shop.title')}`, {
      fontFamily: 'monospace',
      fontSize: this._fs(24, 18, 44),
      color: '#17a689',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(title);

    const coinsY = titleY + this._fs(45, 30, 80);
    const coinsText = this.add.text(0, coinsY, `💰 ${coinManager.getBalance()} coins`, {
      fontFamily: 'monospace',
      fontSize: this._fs(16, 13, 28),
      color: '#ffd700',
      backgroundColor: '#333',
      padding: this._pad(12, 6)
    }).setOrigin(0.5);
    container.add(coinsText);

    const separatorY = coinsY + this._fs(30, 20, 60);
    const separator = this.add.graphics();
    separator.lineStyle(this._stroke(2, 1, 6), 0x17a689, 0.5);
    separator.moveTo(-150, separatorY);
    separator.lineTo(150, separatorY);
    container.add(separator);

    const selectedId = skinManager.getSelectedId();
    let yPos = separatorY + this._fs(40, 26, 70);
    const spacing = this._fs(65, 48, 90);
    const maxItems = Math.floor((popupHeight - yPos - this._fs(60, 40, 90)) / spacing);

    SKINS_DEF.slice(0, maxItems).forEach((skin) => {
      const owned = skinManager.isOwned(skin.id);
      const isSelected = skin.id === selectedId;
      const canAfford = coinManager.getBalance() >= skin.price;

      const itemBg = this.add.graphics();
      itemBg.fillStyle(isSelected ? 0x17a689 : 0x333333, 0.3);
      itemBg.fillRoundedRect(-160, yPos - this._fs(25, 18, 40), 320, this._fs(50, 38, 70), 8);
      container.add(itemBg);

      const icon = this.add.image(-140, yPos, skin.key)
        .setDisplaySize(this._fs(45, 32, 60), this._fs(45, 32, 60));
      container.add(icon);

      const priceLabel =
        skin.price === 0
          ? (i18n.t('shop.free') || 'FREE')
          : `${skin.price} 🪙`;

      const info = this.add.text(-90, yPos - this._fs(8, 6, 14), skin.name, {
        fontFamily: 'monospace',
        fontSize: this._fs(14, 12, 26),
        color: '#fff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      container.add(info);

      const priceText = this.add.text(-90, yPos + this._fs(8, 6, 14), priceLabel, {
        fontFamily: 'monospace',
        fontSize: this._fs(12, 11, 22),
        color: skin.price === 0 ? '#17a689' : '#ffd700'
      }).setOrigin(0, 0.5);
      container.add(priceText);

      if (skin.perk) {
        const perkText = this.add.text(0, yPos, skin.perk, {
          fontFamily: 'monospace',
          fontSize: this._fs(11, 10, 20),
          color: '#ccc',
          fontStyle: 'italic'
        }).setOrigin(0, 0.5);
        container.add(perkText);
      }

      let btnText = '';
      let btnColor = '#666';
      let clickable = false;

      if (isSelected) {
        btnText = i18n.t('shop.equipped') || 'Equipped';
        btnColor = '#17a689';
      } else if (owned) {
        btnText = i18n.t('shop.select') || 'Select';
        btnColor = '#4CAF50';
        clickable = true;
      } else if (canAfford) {
        btnText = i18n.t('shop.buy') || 'Buy';
        btnColor = '#FF9800';
        clickable = true;
      } else {
        btnText = i18n.t('shop.locked') || 'Locked';
        btnColor = '#666';
      }

      const btn = this.add.text(130, yPos, btnText, {
        fontFamily: 'monospace',
        fontSize: this._fs(12, 11, 22),
        color: '#fff',
        backgroundColor: btnColor,
        padding: this._pad(10, 5)
      }).setOrigin(0.5);

      if (clickable) {
        btn.setInteractive({ useHandCursor: true })
          .on('pointerdown', async () => {
            if (owned) {
              skinManager.selectSkin(skin.id);
            } else {
              const result = skinManager.buyAndSelect(skin.id);
              if (!result.ok) return;

              if (this._visualEffects) {
                this._visualEffects.showPurchaseSuccess(
                  this.scale.width / 2,
                  this.scale.height / 2,
                  skin.name
                );
              }
            }

            this._updateCoinDisplay();
            coinsText.setText(`💰 ${coinManager.getBalance()} coins`);

            this.time.delayedCall(300, () => {
              this._showShopPopup();
            });
          });
      }

      container.add(btn);
      yPos += spacing;
    });
  }

  _showQuestsPopup() {
    const container = this._createPopupContainer();

    const popupHeight = Math.min(this.scale.height * 0.8, this._fs(520, 360, 820));
    const titleY = -popupHeight / 2 + this._fs(40, 26, 70);

    const title = this.add.text(0, titleY, `📜 ${i18n.t('quests.title')}`, {
      fontFamily: 'monospace',
      fontSize: this._fs(24, 18, 44),
      color: '#17a689',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(title);

    const subtitleY = titleY + this._fs(35, 22, 60);
    const subtitle = this.add.text(0, subtitleY, i18n.t('quests.subtitle') || 'Complete quests to earn coins!', {
      fontFamily: 'monospace',
      fontSize: this._fs(14, 12, 26),
      color: '#ccc'
    }).setOrigin(0.5);
    container.add(subtitle);

    const separatorY = subtitleY + this._fs(25, 16, 45);
    const separator = this.add.graphics();
    separator.lineStyle(this._stroke(2, 1, 6), 0x17a689, 0.5);
    separator.moveTo(-150, separatorY);
    separator.lineTo(150, separatorY);
    container.add(separator);

    const quests = questManager.getQuests();
    let yPos = separatorY + this._fs(40, 26, 70);
    const spacing = this._fs(70, 52, 95);
    const maxItems = Math.floor((popupHeight - yPos - this._fs(60, 40, 90)) / spacing);

    quests.slice(0, maxItems).forEach((quest, idx) => {
      const displayName =
        quest.name ||
        quest.title ||
        (quest.id ? i18n.t(`quests.${quest.id}.title`, quest.id) : null) ||
        `Quête #${idx + 1}`;

      const goal = quest.goal ?? quest.target ?? quest.required ?? quest.max ?? 1;
      const rewardCoins = quest.reward ?? quest.rewardCoins ?? quest.coins ?? 0;

      const progress = questManager.getQuestProgress
        ? questManager.getQuestProgress(quest.id)
        : (quest.progress ?? 0);

      const isComplete = progress >= goal;

      const questBg = this.add.graphics();
      questBg.fillStyle(isComplete ? 0x17a689 : 0x333333, isComplete ? 0.2 : 0.1);
      questBg.fillRoundedRect(-160, yPos - this._fs(25, 18, 40), 320, this._fs(50, 38, 70), 8);
      container.add(questBg);

      const statusIcon = this.add.text(-140, yPos, isComplete ? '✅' : '⏳', {
        fontFamily: 'monospace',
        fontSize: this._fs(20, 16, 34)
      }).setOrigin(0.5);
      container.add(statusIcon);

      const name = this.add.text(-120, yPos - this._fs(8, 6, 14), displayName, {
        fontFamily: 'monospace',
        fontSize: this._fs(14, 12, 26),
        color: isComplete ? '#17a689' : '#fff',
        fontStyle: isComplete ? 'bold' : 'normal'
      }).setOrigin(0, 0.5);
      container.add(name);

      const progressBarBg = this.add.graphics();
      progressBarBg.fillStyle(0x555555, 1);
      progressBarBg.fillRoundedRect(-120, yPos + this._fs(5, 3, 10), 100, this._fs(8, 6, 14), 4);
      container.add(progressBarBg);

      const progressPercent = Math.min(progress / goal, 1);
      const progressBar = this.add.graphics();
      progressBar.fillStyle(isComplete ? 0x17a689 : 0xffd700, 1);
      progressBar.fillRoundedRect(-120, yPos + this._fs(5, 3, 10), 100 * progressPercent, this._fs(8, 6, 14), 4);
      container.add(progressBar);

      const progressText = this.add.text(-120 + 50, yPos + this._fs(9, 6, 16), `${progress}/${goal}`, {
        fontFamily: 'monospace',
        fontSize: this._fs(10, 10, 20),
        color: '#fff'
      }).setOrigin(0.5);
      container.add(progressText);

      const reward = this.add.text(80, yPos, `+${rewardCoins} 🪙`, {
        fontFamily: 'monospace',
        fontSize: this._fs(14, 12, 26),
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      container.add(reward);

      const canClaim =
        isComplete &&
        questManager.isRewardClaimed &&
        !questManager.isRewardClaimed(quest.id);

      if (canClaim) {
        const claimBtn = this.add.text(140, yPos, i18n.t('quests.claim'), {
          fontFamily: 'monospace',
          fontSize: this._fs(12, 11, 22),
          color: '#fff',
          backgroundColor: '#17a689',
          padding: this._pad(12, 6)
        })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => claimBtn.setBackgroundColor('#4CAF50'))
          .on('pointerout', () => claimBtn.setBackgroundColor('#17a689'))
          .on('pointerdown', () => {
            if (questManager.claimReward) {
              questManager.claimReward(quest.id);
            }
            coinManager.addCoins(rewardCoins);
            this._showQuestsPopup();
            this._updateCoinDisplay();
          });

        container.add(claimBtn);
      }

      yPos += spacing;
    });
  }

  async _showLeaderboardPopup() {
    const container = this._createPopupContainer();

    const popupHeight = Math.min(this.scale.height * 0.8, this._fs(520, 360, 820));
    const titleY = -popupHeight / 2 + this._fs(40, 26, 70);

    const title = this.add.text(0, titleY, `🏆 ${i18n.t('leaderboard.title')}`, {
      fontFamily: 'monospace',
      fontSize: this._fs(24, 18, 44),
      color: '#17a689',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(title);

    const modeText = this.add.text(0, titleY + this._fs(35, 22, 60), this._hardMode ? '🔥 Hard Mode' : '💤 Normal Mode', {
      fontFamily: 'monospace',
      fontSize: this._fs(14, 12, 26),
      color: this._hardMode ? '#ff6b6b' : '#17a689'
    }).setOrigin(0.5);
    container.add(modeText);

    const separatorY = titleY + this._fs(60, 40, 90);
    const separator = this.add.graphics();
    separator.lineStyle(this._stroke(2, 1, 6), 0x17a689, 0.5);
    separator.moveTo(-150, separatorY);
    separator.lineTo(150, separatorY);
    container.add(separator);

    const headersY = separatorY + this._fs(25, 16, 45);

    container.add(this.add.text(-140, headersY, 'Rank', {
      fontFamily: 'monospace',
      fontSize: this._fs(12, 11, 22),
      color: '#ccc',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5));

    container.add(this.add.text(-80, headersY, 'Player', {
      fontFamily: 'monospace',
      fontSize: this._fs(12, 11, 22),
      color: '#ccc',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5));

    container.add(this.add.text(140, headersY, 'Score', {
      fontFamily: 'monospace',
      fontSize: this._fs(12, 11, 22),
      color: '#ccc',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5));

    const loadingText = this.add.text(0, 0, i18n.t('common.loading') || 'Loading...', {
      fontFamily: 'monospace',
      fontSize: this._fs(16, 13, 30),
      color: '#aaa'
    }).setOrigin(0.5);
    container.add(loadingText);

    try {
      const raw = await leaderboardManager.fetchLeaderboard({
        limit: 10,
        isHard: this._hardMode
      });

      loadingText.destroy();

      if (!raw || raw.length === 0) {
        container.add(this.add.text(0, 0, i18n.t('leaderboard.noData') || 'No scores yet', {
          fontFamily: 'monospace',
          fontSize: this._fs(14, 12, 26),
          color: '#aaa'
        }).setOrigin(0.5));
        return;
      }

      const entries = leaderboardManager.formatEntries(raw, 1);

      let yPos = headersY + this._fs(40, 26, 70);
      const spacing = this._fs(40, 30, 60);
      const maxItems = Math.floor((popupHeight - yPos - this._fs(60, 40, 90)) / spacing);

      entries.slice(0, maxItems).forEach((entry) => {
        const rank = entry.rank;
        const medal =
          rank === 1 ? '🥇' :
          rank === 2 ? '🥈' :
          rank === 3 ? '🥉' :
          `${String(rank).padStart(2, '0')}.`;

        const rowBg = this.add.graphics();
        rowBg.fillStyle(rank <= 3 ? 0xffd700 : 0x333333, rank <= 3 ? 0.1 : 0.05);
        rowBg.fillRoundedRect(-160, yPos - this._fs(15, 11, 22), 320, this._fs(30, 24, 44), 5);
        container.add(rowBg);

        container.add(this.add.text(-140, yPos, medal, {
          fontFamily: 'monospace',
          fontSize: this._fs(16, 13, 30),
          color: rank <= 3 ? '#ffd700' : '#fff'
        }).setOrigin(0, 0.5));

        container.add(this.add.text(-80, yPos, entry.name || 'Anonymous', {
          fontFamily: 'monospace',
          fontSize: this._fs(14, 12, 26),
          color: rank <= 3 ? '#ffd700' : '#fff'
        }).setOrigin(0, 0.5));

        container.add(this.add.text(140, yPos, `${entry.scoreDisplay}`, {
          fontFamily: 'monospace',
          fontSize: this._fs(14, 12, 26),
          color: '#17a689',
          fontStyle: 'bold'
        }).setOrigin(1, 0.5));

        yPos += spacing;
      });
    } catch (error) {
      loadingText.setText(i18n.t('leaderboard.error') || 'Error loading leaderboard');
    }
  }

  _updateCoinDisplay() {
    if (this._coinText) {
      this._coinText.setText(`${coinManager.getBalance()}`);
    }
  }
}

export default MenuScene;
