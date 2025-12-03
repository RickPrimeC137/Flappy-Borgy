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
      this._activePopup.destroy();
      this._activePopup = null;
    }
  }

  /**
   * Crée un conteneur popup de base
   * @private
   * @param {number} width - Largeur du popup
   * @param {number} height - Hauteur du popup
   * @returns {Phaser.GameObjects.Container}
   */
  _createPopupContainer(width, height) {
    const W = this.scale.width;
    const H = this.scale.height;

    this._closeActivePopup();

    const container = this.add.container(W / 2, H / 2);
    container.setDepth(1000);

    // Fond semi-transparent
    const overlay = this.add.rectangle(0, 0, W * 2, H * 2, 0x000000, 0.7)
      .setInteractive()
      .on('pointerdown', () => this._closeActivePopup());
    container.add(overlay);

    // Panneau du popup
    const panel = this.add.rectangle(0, 0, width, height, 0x222222, 0.95)
      .setStrokeStyle(2, 0x17a689);
    container.add(panel);

    // Bouton fermer
    const closeBtn = this.add.text(width / 2 - 20, -height / 2 + 20, '✕', {
      fontFamily: 'monospace',
      fontSize: 24,
      color: '#ff6b6b'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._closeActivePopup());
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
    const container = this._createPopupContainer(350, 450);

    const title = this.add.text(0, -190, `🛒 ${i18n.t('shop.title')}`, {
      fontFamily: 'monospace',
      fontSize: 22,
      color: '#17a689'
    }).setOrigin(0.5);
    container.add(title);

    // Coins disponibles
    const coinsText = this.add.text(0, -155, `💰 ${coinManager.getBalance()} coins`, {
      fontFamily: 'monospace',
      fontSize: 14,
      color: '#ffd700'
    }).setOrigin(0.5);
    container.add(coinsText);

    // Liste des skins
    const selectedKey = skinManager.getSelectedKey();
    let yPos = -120;
    const spacing = 55;

    SKINS_DEF.forEach((skin, idx) => {
      const owned = skinManager.isSkinOwned(skin.key);
      const isSelected = skin.key === selectedKey;
      const canAfford = coinManager.getBalance() >= skin.price;

      // Icône du skin
      const icon = this.add.image(-130, yPos, skin.key)
        .setDisplaySize(40, 40);
      container.add(icon);

      // Nom et prix
      const info = this.add.text(-95, yPos, `${skin.name}\n${skin.price === 0 ? i18n.t('shop.free') : skin.price + ' 🪙'}`, {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#fff'
      }).setOrigin(0, 0.5);
      container.add(info);

      // Perk si défini
      if (skin.perk) {
        const perkText = this.add.text(25, yPos, skin.perk, {
          fontFamily: 'monospace',
          fontSize: 10,
          color: '#aaa'
        }).setOrigin(0, 0.5);
        container.add(perkText);
      }

      // Bouton d'action
      let btnText = '';
      let btnColor = '#666';
      let clickable = false;

      if (isSelected) {
        btnText = i18n.t('shop.equipped');
        btnColor = '#17a689';
      } else if (owned) {
        btnText = i18n.t('shop.select');
        btnColor = '#3d7a5a';
        clickable = true;
      } else if (canAfford) {
        btnText = i18n.t('shop.buy');
        btnColor = '#7a5a3d';
        clickable = true;
      } else {
        btnText = i18n.t('shop.locked');
        btnColor = '#4a4a4a';
      }

      const btn = this.add.text(130, yPos, btnText, {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#fff',
        backgroundColor: btnColor,
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5);

      if (clickable) {
        btn.setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            if (owned) {
              skinManager.selectSkin(skin.key);
            } else {
              if (coinManager.spendCoins(skin.price)) {
                skinManager.unlockSkin(skin.key);
                skinManager.selectSkin(skin.key);
                
                // Effet de célébration pour l'achat
                if (this._visualEffects) {
                  this._visualEffects.showPurchaseSuccess(
                    this.scale.width / 2,
                    this.scale.height / 2,
                    skin.name
                  );
                }
              }
            }
            // Rafraîchir le popup après un délai pour l'animation
            this.time.delayedCall(owned ? 0 : 1800, () => {
              this._showShopPopup();
            });
            // Mettre à jour le texte des coins dans le menu
            this._updateCoinDisplay();
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
    const container = this._createPopupContainer(350, 400);

    const title = this.add.text(0, -170, `📜 ${i18n.t('quests.title')}`, {
      fontFamily: 'monospace',
      fontSize: 22,
      color: '#17a689'
    }).setOrigin(0.5);
    container.add(title);

    const quests = questManager.getQuests();
    let yPos = -120;
    const spacing = 60;

    quests.forEach((quest, idx) => {
      const progress = questManager.getQuestProgress(quest.id);
      const isComplete = progress >= quest.goal;

      // Nom de la quête
      const name = this.add.text(-150, yPos, quest.name, {
        fontFamily: 'monospace',
        fontSize: 14,
        color: isComplete ? '#17a689' : '#fff'
      }).setOrigin(0, 0.5);
      container.add(name);

      // Progression
      const progressText = this.add.text(60, yPos, `${progress}/${quest.goal}`, {
        fontFamily: 'monospace',
        fontSize: 12,
        color: isComplete ? '#17a689' : '#aaa'
      }).setOrigin(0, 0.5);
      container.add(progressText);

      // Récompense
      const reward = this.add.text(120, yPos, `+${quest.reward} 🪙`, {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#ffd700'
      }).setOrigin(0, 0.5);
      container.add(reward);

      // Bouton Claim si complété
      if (isComplete && !questManager.isRewardClaimed(quest.id)) {
        const claimBtn = this.add.text(0, yPos + 20, i18n.t('quests.claim'), {
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#fff',
          backgroundColor: '#17a689',
          padding: { x: 10, y: 4 }
        })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            questManager.claimReward(quest.id);
            coinManager.addCoins(quest.reward);
            this._showQuestsPopup();
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
    const container = this._createPopupContainer(350, 450);

    const title = this.add.text(0, -195, `🏆 ${i18n.t('leaderboard.title')}`, {
      fontFamily: 'monospace',
      fontSize: 22,
      color: '#17a689'
    }).setOrigin(0.5);
    container.add(title);

    // Chargement
    const loadingText = this.add.text(0, 0, i18n.t('common.loading'), {
      fontFamily: 'monospace',
      fontSize: 16,
      color: '#aaa'
    }).setOrigin(0.5);
    container.add(loadingText);

    try {
      const data = await leaderboardManager.fetchLeaderboard();
      loadingText.destroy();

      if (!data || data.length === 0) {
        const noData = this.add.text(0, 0, i18n.t('leaderboard.noData'), {
          fontFamily: 'monospace',
          fontSize: 14,
          color: '#aaa'
        }).setOrigin(0.5);
        container.add(noData);
        return;
      }

      let yPos = -150;
      const spacing = 35;

      data.slice(0, 10).forEach((entry, idx) => {
        const rank = idx + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

        const row = this.add.text(-140, yPos, `${medal} ${entry.name || 'Anonymous'}`, {
          fontFamily: 'monospace',
          fontSize: 14,
          color: rank <= 3 ? '#ffd700' : '#fff'
        }).setOrigin(0, 0.5);
        container.add(row);

        const score = this.add.text(140, yPos, `${entry.score}`, {
          fontFamily: 'monospace',
          fontSize: 14,
          color: '#17a689'
        }).setOrigin(1, 0.5);
        container.add(score);

        yPos += spacing;
      });
    } catch (error) {
      loadingText.setText(i18n.t('leaderboard.error'));
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