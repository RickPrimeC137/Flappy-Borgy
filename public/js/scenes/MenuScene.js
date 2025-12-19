/**
 * MenuScene.js - Scène du menu principal
 *
 * Cette scène est responsable de :
 * - Afficher le menu principal avec logo et boutons
 * - Gérer la musique de fond
 * - Afficher les statistiques utilisateur (coins, best score)
 * - Gérer les différents popups (shop, quêtes, leaderboard, etc.)
 * - Permettre le changement de langue et de mode
 *
 * @module scenes/MenuScene
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

/**
 * Scène du menu principal
 * @extends Phaser.Scene
 */
export class MenuScene extends Phaser.Scene {
  /**
   * Crée la scène du menu
   */
  constructor() {
    super('MenuScene');

    /**
     * Mode de jeu (normal/hard)
     * @type {boolean}
     * @private
     */
    this._hardMode = false;

    /**
     * Mode Noël activé
     * @type {boolean}
     * @private
     */
    this._xmasMode = false;

    /**
     * Mode tuyaux dorés activé
     * @type {boolean}
     * @private
     */
    this._goldPipesMode = false;

    /**
     * Langue actuelle
     * @type {string}
     * @private
     */
    this._currentLang = 'en';

    /**
     * Index de la langue actuelle
     * @type {number}
     * @private
     */
    this._currentLangIdx = 0;

    /**
     * Référence au conteneur du popup actif
     * @type {Phaser.GameObjects.Container|null}
     * @private
     */
    this._activePopup = null;

    /**
     * Texte d'affichage des coins
     * @type {Phaser.GameObjects.Text|null}
     * @private
     */
    this._coinText = null;

    /**
     * Texte d'affichage du best score
     * @type {Phaser.GameObjects.Text|null}
     * @private
     */
    this._bestScoreText = null;

    /**
     * Bouton du mode Hard
     * @type {Phaser.GameObjects.Text|null}
     * @private
     */
    this._hardModeBtn = null;

    /**
     * Bouton du mode Noël
     * @type {Phaser.GameObjects.Text|null}
     * @private
     */
    this._xmasBtn = null;

    /**
     * Bouton des tuyaux dorés
     * @type {Phaser.GameObjects.Text|null}
     * @private
     */
    this._goldPipesBtn = null;

    /**
     * Bouton de langue
     * @type {Phaser.GameObjects.Text|null}
     * @private
     */
    this._langBtn = null;

    /**
     * Image d'arrière-plan
     * @type {Phaser.GameObjects.Image|null}
     * @private
     */
    this._bgImage = null;

    /**
     * Badge "NOUVEAU" sur le shop
     * @type {Phaser.GameObjects.Text|null}
     * @private
     */
    this._shopBadge = null;

    /**
     * Instance des effets visuels
     * @type {VisualEffects|null}
     * @private
     */
    this._visualEffects = null;
  }

  /**
   * Création de la scène du menu
   */
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // Initialiser les effets visuels
    this._visualEffects = getVisualEffects(this);

    // Charger les préférences sauvegardées
    this._loadPreferences();

    // Initialiser le système i18n
    this._initI18n();

    // ============================================================
    // ARRIÈRE-PLAN
    // ============================================================
    this._createBackground(W, H);

    // ============================================================
    // LOGO / TITRE
    // ============================================================
    this._createTitle(cx);

    // ============================================================
    // AFFICHAGE DES STATS
    // ============================================================
    this._createStatsDisplay(W);

    // ============================================================
    // BOUTONS PRINCIPAUX
    // ============================================================
    this._createMainButtons(cx, H);

    // ============================================================
    // BOUTONS SECONDAIRES
    // ============================================================
    this._createSecondaryButtons(W, H);

    // ============================================================
    // BOUTON MUTE
    // ============================================================
    this._createMuteButton(W);

    // ============================================================
    // DÉMARRAGE DE LA MUSIQUE
    // ============================================================
    this._initAudio();

    // ============================================================
    // AFFICHAGE DU POPUP DE BIENVENUE MULTI-STEP (première session)
    // ============================================================
    this._checkFirstSession(cx, H);

    // ============================================================
    // GESTION DES TOUCHES
    // ============================================================
    this.input.keyboard.on('keydown-ESC', () => {
      this._closeActivePopup();
    });
  }

  /**
   * Charge les préférences depuis le stockage
   * @private
   */
  _loadPreferences() {
    this._hardMode = storageManager.loadHardMode();
    this._xmasMode = storageManager.loadXmasMode();
    this._goldPipesMode = storageManager.loadGoldPipes();
    this._currentLang = storageManager.loadLang();
    this._currentLangIdx = LANG_OPTIONS.findIndex(l => l.code === this._currentLang);
    if (this._currentLangIdx < 0) this._currentLangIdx = 0;
  }

  /**
   * Initialise le système d'internationalisation
   * @private
   */
  _initI18n() {
    i18n.setLang(this._currentLang);
  }

  /**
   * Crée l'image d'arrière-plan
   * @private
   * @param {number} W - Largeur de l'écran
   * @param {number} H - Hauteur de l'écran
   */
  _createBackground(W, H) {
    const bgKey = this._xmasMode ? BG_XMAS_KEY : (this._hardMode ? BG_HARD_KEY : BG_KEY);
    this._bgImage = this.add.image(W / 2, H / 2, bgKey)
      .setDisplaySize(W, H)
      .setDepth(-1);
  }

  /**
   * Crée le titre du jeu
   * @private
   * @param {number} cx - Centre X
   */
  _createTitle(cx) {
    this.add.text(cx, 60, 'FLAPPY BORGY', {
      fontFamily: 'monospace',
      fontSize: 38,
      color: '#fff',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);
  }

  /**
   * Crée l'affichage des statistiques (coins, best score)
   * @private
   * @param {number} W - Largeur de l'écran
   */
  _createStatsDisplay(W) {
    const startY = 110;
    const coins = coinManager.getBalance();
    const bestScore = storageManager.loadLocalBestScore();

    // Icône coin
    this.add.image(W - 85, startY, 'borgy_coin')
      .setDisplaySize(24, 24)
      .setOrigin(0.5);

    // Texte coins
    this._coinText = this.add.text(W - 65, startY, `${coins}`, {
      fontFamily: 'monospace',
      fontSize: 18,
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    // Best score
    this._bestScoreText = this.add.text(W - 85, startY + 30, `🏆 ${bestScore}`, {
      fontFamily: 'monospace',
      fontSize: 16,
      color: '#fff'
    }).setOrigin(0, 0.5);
  }

  /**
   * Crée les boutons principaux du menu
   * @private
   * @param {number} cx - Centre X
   * @param {number} H - Hauteur de l'écran
   */
  _createMainButtons(cx, H) {
    const btnStyle = {
      fontFamily: 'monospace',
      fontSize: 28,
      color: '#fff',
      backgroundColor: '#17a689',
      padding: { x: 32, y: 14 }
    };

    // Bouton PLAY
    const playBtn = this.add.text(cx, H * 0.42, i18n.t('menu.play'), btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._startGame());

    // Hard Mode Toggle
    this._hardModeBtn = this.add.text(cx, H * 0.55, this._getHardModeLabel(), {
      fontFamily: 'monospace',
      fontSize: 18,
      color: this._hardMode ? '#ff6b6b' : '#fff',
      backgroundColor: this._hardMode ? '#4a0000' : '#333',
      padding: { x: 18, y: 8 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._toggleHardMode());

    // Bouton SHOP avec badge "NOUVEAU" pour les nouveaux joueurs
    const shopBtn = this.add.text(cx, H * 0.66, `🛒 ${i18n.t('menu.shop')}`, {
      fontFamily: 'monospace',
      fontSize: 20,
      color: '#fff',
      backgroundColor: '#5a3d7a',
      padding: { x: 24, y: 10 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // Cacher le badge au premier clic
        if (this._shopBadge) {
          this._shopBadge.destroy();
          this._shopBadge = null;
          storageManager.set('shop_visited', true);
        }
        this._showShopPopup();
      });

    // Badge "NOUVEAU" si le shop n'a jamais été visité
    if (!storageManager.get('shop_visited') && !storageManager.loadWelcomeSeen()) {
      this._shopBadge = this.add.text(cx + 85, H * 0.66 - 18, i18n.t('SHOP_NEW_BADGE') || 'NEW', {
        fontFamily: 'monospace',
        fontSize: 10,
        color: '#fff',
        backgroundColor: '#ff3366',
        padding: { x: 6, y: 3 }
      }).setOrigin(0.5).setDepth(100);

      // Animation pulsante du badge
      this.tweens.add({
        targets: this._shopBadge,
        scale: { from: 1, to: 1.15 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Bouton QUESTS
    const questBtn = this.add.text(cx, H * 0.76, `📜 ${i18n.t('menu.quests')}`, {
      fontFamily: 'monospace',
      fontSize: 20,
      color: '#fff',
      backgroundColor: '#3d5a7a',
      padding: { x: 24, y: 10 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._showQuestsPopup());

    // Bouton LEADERBOARD
    const lbBtn = this.add.text(cx, H * 0.86, `🏆 ${i18n.t('menu.leaderboard')}`, {
      fontFamily: 'monospace',
      fontSize: 20,
      color: '#fff',
      backgroundColor: '#7a5a3d',
      padding: { x: 24, y: 10 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._showLeaderboardPopup());
  }

  /**
   * Crée les boutons secondaires (langue, xmas, gold pipes, vote, buy)
   * @private
   * @param {number} W - Largeur de l'écran
   * @param {number} H - Hauteur de l'écran
   */
  _createSecondaryButtons(W, H) {
    const smallBtnStyle = {
      fontFamily: 'monospace',
      fontSize: 14,
      color: '#fff',
      backgroundColor: '#444',
      padding: { x: 10, y: 6 }
    };

    // Bouton Langue
    this._langBtn = this.add.text(20, H - 30, `🌐 ${LANG_OPTIONS[this._currentLangIdx].label}`, smallBtnStyle)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._toggleLanguage());

    // Bouton Xmas Mode
    this._xmasBtn = this.add.text(20, H - 60, this._xmasMode ? '🎄 XMAS' : '🎄 Xmas', {
      ...smallBtnStyle,
      color: this._xmasMode ? '#00ff00' : '#fff'
    })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._toggleXmasMode());

    // Bouton Gold Pipes
    this._goldPipesBtn = this.add.text(20, H - 90, this._goldPipesMode ? '🪙 GOLD' : '🪙 Gold', {
      ...smallBtnStyle,
      color: this._goldPipesMode ? '#ffd700' : '#fff'
    })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._toggleGoldPipes());

    // Bouton Vote
    const voteBtn = this.add.text(W - 20, H - 60, '⭐ Vote', smallBtnStyle)
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._openVoteLink());

    // Bouton Buy
    const buyBtn = this.add.text(W - 20, H - 30, '💎 Buy', smallBtnStyle)
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._openBuyLink());
  }

  /**
   * Crée le bouton mute
   * @private
   * @param {number} W - Largeur de l'écran
   */
  _createMuteButton(W) {
    const isMuted = audioManager.isMuted();
    const muteBtn = this.add.text(W - 20, 20, isMuted ? '🔇' : '🔊', {
      fontFamily: 'monospace',
      fontSize: 28,
      color: '#fff'
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        audioManager.toggleMute();
        muteBtn.setText(audioManager.isMuted() ? '🔇' : '🔊');
      });
  }

  /**
   * Initialise l'audio de la scène
   * @private
   */
  _initAudio() {
    audioManager.ensureBGM(this, this._hardMode);
  }

  /**
   * Vérifie si c'est la première session et affiche le popup de bienvenue multi-step
   * @private
   * @param {number} cx - Centre X
   * @param {number} H - Hauteur de l'écran
   */
  _checkFirstSession(cx, H) {
    if (!storageManager.loadWelcomeSeen()) {
      // Afficher le nouveau popup multi-step
      const welcomePopup = new WelcomePopup(this, {
        onComplete: () => {
          // Animation de célébration à la fin du tutoriel
          if (this._visualEffects) {
            this._visualEffects.showCelebration(null, null, '🎮');
          }
        }
      });
      welcomePopup.show();
    }
  }

  /**
   * Retourne le label du bouton Hard Mode
   * @private
   * @returns {string}
   */
  _getHardModeLabel() {
    return this._hardMode ? `🔥 ${i18n.t('menu.hardMode')} ON` : `💤 ${i18n.t('menu.hardMode')} OFF`;
  }

  /**
   * Toggle le mode Hard
   * @private
   */
  _toggleHardMode() {
    this._hardMode = !this._hardMode;
    storageManager.saveHardMode(this._hardMode);

    // Mettre à jour le bouton
    this._hardModeBtn.setText(this._getHardModeLabel());
    this._hardModeBtn.setColor(this._hardMode ? '#ff6b6b' : '#fff');
    this._hardModeBtn.setBackgroundColor(this._hardMode ? '#4a0000' : '#333');

    // Mettre à jour l'arrière-plan
    this._updateBackground();

    // Mettre à jour la musique
    audioManager.ensureBGM(this, this._hardMode);
  }

  /**
   * Toggle le mode Noël
   * @private
   */
  _toggleXmasMode() {
    this._xmasMode = !this._xmasMode;
    storageManager.saveXmasMode(this._xmasMode);

    // Mettre à jour le bouton
    this._xmasBtn.setText(this._xmasMode ? '🎄 XMAS' : '🎄 Xmas');
    this._xmasBtn.setColor(this._xmasMode ? '#00ff00' : '#fff');

    // Mettre à jour l'arrière-plan
    this._updateBackground();
  }

  /**
   * Toggle le mode tuyaux dorés
   * @private
   */
  _toggleGoldPipes() {
    this._goldPipesMode = !this._goldPipesMode;
    storageManager.saveGoldPipes(this._goldPipesMode);

    // Mettre à jour le bouton
    this._goldPipesBtn.setText(this._goldPipesMode ? '🪙 GOLD' : '🪙 Gold');
    this._goldPipesBtn.setColor(this._goldPipesMode ? '#ffd700' : '#fff');
  }

  /**
   * Toggle la langue
   * @private
   */
  _toggleLanguage() {
    this._currentLangIdx = (this._currentLangIdx + 1) % LANG_OPTIONS.length;
    this._currentLang = LANG_OPTIONS[this._currentLangIdx].code;
    storageManager.saveLang(this._currentLang);
    i18n.setLang(this._currentLang);

    // Recharger la scène pour appliquer les traductions
    this.scene.restart();
  }

  /**
   * Met à jour l'image d'arrière-plan
   * @private
   */
  _updateBackground() {
    const bgKey = this._xmasMode ? BG_XMAS_KEY : (this._hardMode ? BG_HARD_KEY : BG_KEY);
    this._bgImage.setTexture(bgKey);
  }

  /**
   * Ouvre le lien de vote
   * @private
   */
  _openVoteLink() {
    window.open('https://borg.vote', '_blank');
  }

  /**
   * Ouvre le lien d'achat
   * @private
   */
  _openBuyLink() {
    window.open('https://swissborg.com/buy-borg', '_blank');
  }

  /**
   * Démarre le jeu
   * @private
   */
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

  /**
   * Ferme le popup actif
   * @private
   */
  _closeActivePopup() {
    if (this._activePopup) {
      // Animation de fermeture
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

  /**
   * Crée un conteneur popup de base
   * @private
   * @param {number} width - Largeur du popup (optionnel, calculé automatiquement)
   * @param {number} height - Hauteur du popup (optionnel, calculé automatiquement)
   * @returns {Phaser.GameObjects.Container}
   */
  _createPopupContainer(width, height) {
    const W = this.scale.width;
    const H = this.scale.height;

    this._closeActivePopup();

    // Dimensions responsives
    const popupWidth = width || Math.min(W * 0.95 * 4.875, 650);
    const popupHeight = height || Math.min(H * 0.85 * 4.875, 812);

    const container = this.add.container(W / 2, H / 2);
    container.setDepth(1000);

    // Animation d'ouverture
    container.setScale(0.8);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });

    // Fond semi-transparent
    const overlay = this.add.rectangle(0, 0, W * 2, H * 2, 0x000000, 0.7)
      .setInteractive()
      .on('pointerdown', () => this._closeActivePopup());
    container.add(overlay);

    // Panneau du popup avec coins arrondis et ombre
    const panel = this.add.graphics();
    panel.fillStyle(0x222222, 0.95);
    panel.fillRoundedRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 15);
    panel.lineStyle(3, 0x17a689, 1);
    panel.strokeRoundedRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 15);

    // Ajouter une ombre subtile
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-popupWidth / 2 + 5, -popupHeight / 2 + 5, popupWidth, popupHeight, 15);
    container.add(shadow);
    container.add(panel);

    // Bouton fermer amélioré
    const closeBtn = this.add.text(popupWidth / 2 - 20, -popupHeight / 2 + 20, '✕', {
      fontFamily: 'monospace',
      fontSize: 24,
      color: '#ff6b6b',
      backgroundColor: '#333',
      padding: { x: 8, y: 4 }
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

  /**
   * Affiche le popup de bienvenue (version legacy - remplacée par WelcomePopup multi-step)
   * @private
   * @param {number} cx - Centre X
   * @param {number} H - Hauteur de l'écran
   * @deprecated Utiliser WelcomePopup à la place
   */
  _showWelcomePopup(cx, H) {
    // Utiliser le nouveau popup multi-step à la place
    const welcomePopup = new WelcomePopup(this, {
      onComplete: () => {
        if (this._visualEffects) {
          this._visualEffects.showCelebration(null, null, '🎮');
        }
      }
    });
    welcomePopup.show();
  }

  /**
   * Affiche le popup du shop
   * @private
   */
  _showShopPopup() {
    const container = this._createPopupContainer();

    const popupHeight = Math.min(this.scale.height * 0.8, 500);
    const titleY = -popupHeight / 2 + 40;

    const title = this.add.text(0, titleY, `🛒 ${i18n.t('shop.title')}`, {
      fontFamily: 'monospace',
      fontSize: 24,
      color: '#17a689',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(title);

    // Coins disponibles avec icône améliorée
    const coinsY = titleY + 45;
    const coinsText = this.add.text(0, coinsY, `💰 ${coinManager.getBalance()} coins`, {
      fontFamily: 'monospace',
      fontSize: 16,
      color: '#ffd700',
      backgroundColor: '#333',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5);
    container.add(coinsText);

    // Ligne séparatrice
    const separatorY = coinsY + 30;
    const separator = this.add.graphics();
    separator.lineStyle(2, 0x17a689, 0.5);
    separator.moveTo(-150, separatorY);
    separator.lineTo(150, separatorY);
    container.add(separator);

    // Liste des skins avec scroll virtuel (ajuster si nécessaire)
    const selectedId = skinManager.getSelectedId();
    let yPos = separatorY + 40;
    const spacing = 65;
    const maxItems = Math.floor((popupHeight - yPos - 60) / spacing);

    SKINS_DEF.slice(0, maxItems).forEach((skin) => {
      const owned = skinManager.isOwned(skin.id);
      const isSelected = skin.id === selectedId;
      const canAfford = coinManager.getBalance() >= skin.price;

      // Fond pour chaque item
      const itemBg = this.add.graphics();
      itemBg.fillStyle(isSelected ? 0x17a689 : 0x333333, 0.3);
      itemBg.fillRoundedRect(-160, yPos - 25, 320, 50, 8);
      container.add(itemBg);

      // Icône du skin
      const icon = this.add.image(-140, yPos, skin.key)
        .setDisplaySize(45, 45);
      container.add(icon);

      // Nom et prix
      const priceLabel =
        skin.price === 0
          ? (i18n.t('shop.free') || 'FREE')
          : `${skin.price} 🪙`;

      const info = this.add.text(
        -90,
        yPos - 8,
        skin.name,
        {
          fontFamily: 'monospace',
          fontSize: 14,
          color: '#fff',
          fontStyle: 'bold'
        }
      ).setOrigin(0, 0.5);
      container.add(info);

      const priceText = this.add.text(
        -90,
        yPos + 8,
        priceLabel,
        {
          fontFamily: 'monospace',
          fontSize: 12,
          color: skin.price === 0 ? '#17a689' : '#ffd700'
        }
      ).setOrigin(0, 0.5);
      container.add(priceText);

      // Perk si défini
      if (skin.perk) {
        const perkText = this.add.text(0, yPos, skin.perk, {
          fontFamily: 'monospace',
          fontSize: 11,
          color: '#ccc',
          fontStyle: 'italic'
        }).setOrigin(0, 0.5);
        container.add(perkText);
      }

      // Bouton d'action amélioré
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
        fontSize: 12,
        color: '#fff',
        backgroundColor: btnColor,
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5);

      if (clickable) {
        btn.setInteractive({ useHandCursor: true })
          .on('pointerover', () => btn.setBackgroundColor(Phaser.Display.Color.GetColor(btnColor) + 0x222222))
          .on('pointerout', () => btn.setBackgroundColor(btnColor))
          .on('pointerdown', async () => {
            if (owned) {
              // Juste sélectionner
              skinManager.selectSkin(skin.id);
            } else {
              // Achat + sélection via SkinManager (gère coins + sauvegarde)
              const result = skinManager.buyAndSelect(skin.id);
              if (!result.ok) {
                // pas assez de coins ou autre erreur -> on ne fait rien
                return;
              }

              // Effet de célébration pour l'achat
              if (this._visualEffects) {
                this._visualEffects.showPurchaseSuccess(
                  this.scale.width / 2,
                  this.scale.height / 2,
                  skin.name
                );
              }
            }

            // Mettre à jour l'affichage des coins (menu + popup)
            this._updateCoinDisplay();
            coinsText.setText(`💰 ${coinManager.getBalance()} coins`);

            // Rafraîchir le popup après un petit délai (pour laisser l'anim se jouer)
            this.time.delayedCall(300, () => {
              this._showShopPopup();
            });
          });
      }

      container.add(btn);
      yPos += spacing;
    });
  }

     /**
      * Affiche le popup des quêtes
      * @private
      */
     _showQuestsPopup() {
       const container = this._createPopupContainer();

       const popupHeight = Math.min(this.scale.height * 0.8, 500);
       const titleY = -popupHeight / 2 + 40;
   
       const title = this.add.text(0, titleY, `📜 ${i18n.t('quests.title')}`, {
         fontFamily: 'monospace',
         fontSize: 24,
         color: '#17a689',
         fontStyle: 'bold'
       }).setOrigin(0.5);
       container.add(title);
   
       // Sous-titre
       const subtitleY = titleY + 35;
       const subtitle = this.add.text(0, subtitleY, i18n.t('quests.subtitle') || 'Complete quests to earn coins!', {
         fontFamily: 'monospace',
         fontSize: 14,
         color: '#ccc'
       }).setOrigin(0.5);
       container.add(subtitle);
   
       // Ligne séparatrice
       const separatorY = subtitleY + 25;
       const separator = this.add.graphics();
       separator.lineStyle(2, 0x17a689, 0.5);
       separator.moveTo(-150, separatorY);
       separator.lineTo(150, separatorY);
       container.add(separator);
   
       const quests = questManager.getQuests();
       let yPos = separatorY + 40;
       const spacing = 70;
       const maxItems = Math.floor((popupHeight - yPos - 60) / spacing);
   
       quests.slice(0, maxItems).forEach((quest, idx) => {
         // --- Normalisation des données pour éviter les "undefined" ---
   
         // Nom : on essaye plusieurs champs possibles
         const displayName =
           quest.name ||
           quest.title ||
           (quest.id ? i18n.t(`quests.${quest.id}.title`, quest.id) : null) ||
           `Quête #${idx + 1}`;
   
         // Objectif (goal)
         const goal =
           quest.goal ??
           quest.target ??
           quest.required ??
           quest.max ??
           1;
   
         // Récompense en coins
         const rewardCoins =
           quest.reward ??
           quest.rewardCoins ??
           quest.coins ??
           0;
   
         // Progression actuelle via le manager
         const progress = questManager.getQuestProgress
           ? questManager.getQuestProgress(quest.id)
           : (quest.progress ?? 0);
   
         const isComplete = progress >= goal;
   
         // Fond pour chaque quête
         const questBg = this.add.graphics();
         questBg.fillStyle(isComplete ? 0x17a689 : 0x333333, isComplete ? 0.2 : 0.1);
         questBg.fillRoundedRect(-160, yPos - 25, 320, 50, 8);
         container.add(questBg);
   
         // Icône de statut
         const statusIcon = this.add.text(-140, yPos, isComplete ? '✅' : '⏳', {
           fontSize: 20
         }).setOrigin(0.5);
         container.add(statusIcon);
   
         // Nom de la quête
         const name = this.add.text(-120, yPos - 8, displayName, {
           fontFamily: 'monospace',
           fontSize: 14,
           color: isComplete ? '#17a689' : '#fff',
           fontStyle: isComplete ? 'bold' : 'normal'
         }).setOrigin(0, 0.5);
         container.add(name);
   
         // Barre de progression
         const progressBarBg = this.add.graphics();
         progressBarBg.fillStyle(0x555555, 1);
         progressBarBg.fillRoundedRect(-120, yPos + 5, 100, 8, 4);
         container.add(progressBarBg);
   
         const progressPercent = Math.min(progress / goal, 1);
         const progressBar = this.add.graphics();
         progressBar.fillStyle(isComplete ? 0x17a689 : 0xffd700, 1);
         progressBar.fillRoundedRect(-120, yPos + 5, 100 * progressPercent, 8, 4);
         container.add(progressBar);
   
         const progressText = this.add.text(-120 + 50, yPos + 9, `${progress}/${goal}`, {
           fontFamily: 'monospace',
           fontSize: 10,
           color: '#fff'
         }).setOrigin(0.5);
         container.add(progressText);
   
         // Récompense
         const reward = this.add.text(80, yPos, `+${rewardCoins} 🪙`, {
           fontFamily: 'monospace',
           fontSize: 14,
           color: '#ffd700',
           fontStyle: 'bold'
         }).setOrigin(0, 0.5);
         container.add(reward);
   
         // Bouton Claim si complété
         const canClaim =
           isComplete &&
           questManager.isRewardClaimed &&
           !questManager.isRewardClaimed(quest.id);
   
         if (canClaim) {
           const claimBtn = this.add.text(140, yPos, i18n.t('quests.claim'), {
             fontFamily: 'monospace',
             fontSize: 12,
             color: '#fff',
             backgroundColor: '#17a689',
             padding: { x: 12, y: 6 }
           })
             .setOrigin(0.5)
             .setInteractive({ useHandCursor: true })
             .on('pointerover', () => claimBtn.setBackgroundColor('#4CAF50'))
             .on('pointerout', () => claimBtn.setBackgroundColor('#17a689'))
             .on('pointerdown', () => {
               // Validation de la récompense
               if (questManager.claimReward) {
                 questManager.claimReward(quest.id);
               }
               coinManager.addCoins(rewardCoins);
   
               // Rafraîchir le popup
               this._showQuestsPopup();
   
               // Mettre à jour les coins dans le menu
               this._updateCoinDisplay();
             });
   
           container.add(claimBtn);
         }
   
         yPos += spacing;
       });
     }

  /**
   * Affiche le popup du leaderboard
   * @private
   */
  async _showLeaderboardPopup() {
    const container = this._createPopupContainer();

    const popupHeight = Math.min(this.scale.height * 0.8, 500);
    const titleY = -popupHeight / 2 + 40;

    const title = this.add.text(0, titleY, `🏆 ${i18n.t('leaderboard.title')}`, {
      fontFamily: 'monospace',
      fontSize: 24,
      color: '#17a689',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(title);

    // Mode actuel
    const modeText = this.add.text(0, titleY + 35, this._hardMode ? '🔥 Hard Mode' : '💤 Normal Mode', {
      fontFamily: 'monospace',
      fontSize: 14,
      color: this._hardMode ? '#ff6b6b' : '#17a689'
    }).setOrigin(0.5);
    container.add(modeText);

    // Ligne séparatrice
    const separatorY = titleY + 60;
    const separator = this.add.graphics();
    separator.lineStyle(2, 0x17a689, 0.5);
    separator.moveTo(-150, separatorY);
    separator.lineTo(150, separatorY);
    container.add(separator);

    // En-têtes
    const headersY = separatorY + 25;
    const rankHeader = this.add.text(-140, headersY, 'Rank', {
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#ccc',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    container.add(rankHeader);

    const nameHeader = this.add.text(-80, headersY, 'Player', {
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#ccc',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    container.add(nameHeader);

    const scoreHeader = this.add.text(140, headersY, 'Score', {
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#ccc',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);
    container.add(scoreHeader);

    // Chargement
    const loadingText = this.add.text(0, 0, i18n.t('common.loading') || 'Loading...', {
      fontFamily: 'monospace',
      fontSize: 16,
      color: '#aaa'
    }).setOrigin(0.5);
    container.add(loadingText);

    try {
      // On récupère 10 entrées, en tenant compte du mode hard/normal
      const raw = await leaderboardManager.fetchLeaderboard({
        limit: 10,
        isHard: this._hardMode
      });

      loadingText.destroy();

      if (!raw || raw.length === 0) {
        const noData = this.add.text(0, 0, i18n.t('leaderboard.noData') || 'No scores yet', {
          fontFamily: 'monospace',
          fontSize: 14,
          color: '#aaa'
        }).setOrigin(0.5);
        container.add(noData);
        return;
      }

      const entries = leaderboardManager.formatEntries(raw, 1);

      let yPos = headersY + 40;
      const spacing = 40;
      const maxItems = Math.floor((popupHeight - yPos - 60) / spacing);

      entries.slice(0, maxItems).forEach((entry) => {
        const rank = entry.rank;
        const medal =
          rank === 1 ? '🥇' :
          rank === 2 ? '🥈' :
          rank === 3 ? '🥉' :
          `${String(rank).padStart(2, '0')}.`;

        // Fond alterné pour les lignes
        const rowBg = this.add.graphics();
        rowBg.fillStyle(rank <= 3 ? 0xffd700 : 0x333333, rank <= 3 ? 0.1 : 0.05);
        rowBg.fillRoundedRect(-160, yPos - 15, 320, 30, 5);
        container.add(rowBg);

        const rankText = this.add.text(-140, yPos, medal, {
          fontFamily: 'monospace',
          fontSize: 16,
          color: rank <= 3 ? '#ffd700' : '#fff'
        }).setOrigin(0, 0.5);
        container.add(rankText);

        const nameText = this.add.text(-80, yPos, entry.name || 'Anonymous', {
          fontFamily: 'monospace',
          fontSize: 14,
          color: rank <= 3 ? '#ffd700' : '#fff'
        }).setOrigin(0, 0.5);
        container.add(nameText);

        const scoreText = this.add.text(140, yPos, `${entry.scoreDisplay}`, {
          fontFamily: 'monospace',
          fontSize: 14,
          color: '#17a689',
          fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        container.add(scoreText);

        yPos += spacing;
      });
    } catch (error) {
      loadingText.setText(i18n.t('leaderboard.error') || 'Error loading leaderboard');
    }
  }

  /**
   * Met à jour l'affichage des coins
   * @private
   */
  _updateCoinDisplay() {
    if (this._coinText) {
      this._coinText.setText(`${coinManager.getBalance()}`);
    }
  }
}

export default MenuScene;



