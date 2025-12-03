/**
 * PreloadScene.js - Scène de chargement des assets
 * 
 * Cette scène est responsable de :
 * - Charger tous les assets du jeu (images, audio, vidéo)
 * - Afficher une vidéo d'introduction pendant le chargement
 * - Afficher une barre de progression
 * - Transitionner vers le menu une fois le chargement terminé
 * 
 * @module scenes/PreloadScene
 */

import { GAME_W, GAME_H, BG_KEY, BG_HARD_KEY, BG_XMAS_KEY } from '../config/constants.js';
import { SKINS_DEF } from '../config/skinConfig.js';

/**
 * Scène de préchargement des assets
 * @extends Phaser.Scene
 */
export class PreloadScene extends Phaser.Scene {
  /**
   * Crée la scène de préchargement
   */
  constructor() {
    super('PreloadScene');
    
    /**
     * Référence à l'élément vidéo de chargement
     * @type {HTMLVideoElement|null}
     * @private
     */
    this._loadingVideoEl = null;
  }

  /**
   * Initialisation de la scène
   * Crée et affiche la vidéo d'introduction
   */
  init() {
    // Suppression immédiate du texte de chargement
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
      loadingText.remove();
    }

    // Création de l'élément vidéo HTML pour l'intro
    const root = document.getElementById('game-root') || document.body;
    
    const vid = document.createElement('video');
    vid.src = 'assets/intro.mp4';
    vid.autoplay = true;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    
    Object.assign(vid.style, {
      position: 'absolute',
      left: '50%',
      top: '25%',
      transform: 'translateX(-50%)',
      width: '62%',
      maxWidth: '520px',
      borderRadius: '14px',
      zIndex: '9999',
      pointerEvents: 'none'
    });
    
    root.appendChild(vid);
    this._loadingVideoEl = vid;
  }

  /**
   * Préchargement de tous les assets du jeu
   */
  preload() {
    const W = this.scale.width;
    const H = this.scale.height;
    
    // Définir le chemin de base des assets
    this.load.setPath('assets');

    // ============================================================
    // CRÉATION DES TEXTURES GÉNÉRÉES
    // ============================================================
    
    // Texture de flocon pour le mode Noël
    this._createSnowFlakeTexture();

    // ============================================================
    // CHARGEMENT DES ARRIÈRE-PLANS
    // ============================================================
    
    this.load.image(BG_KEY, 'bg_mountains.png');
    this.load.image(BG_HARD_KEY, 'bg_volcano.png');
    this.load.image(BG_XMAS_KEY, 'bg_noel.png');

    // ============================================================
    // CHARGEMENT DES NUAGES (LIMITES HAUT/BAS)
    // ============================================================
    
    this.load.image('cloud_top', 'cloud_top.png');
    this.load.image('cloud_bottom', 'cloud_bottom.png');

    // ============================================================
    // CHARGEMENT DES SPRITES JOUEUR
    // ============================================================
    
    // Sprite de base
    this.load.image('borgy_ingame', 'borgy_ingame.png');

    // Chargement de tous les skins définis
    SKINS_DEF.forEach(skin => {
      if (skin.key !== 'borgy') {
        this.load.image(skin.key, `${skin.key}.png`);
      }
    });
    
    // Skin Noël (spécial, non dans le shop)
    this.load.image('borgy_xmas', 'borgy_xmas.png');

    // ============================================================
    // CHARGEMENT DES TUYAUX
    // ============================================================
    
    // Tuyaux par défaut
    this.load.image('pipe_top', 'pipe_light_top.png');
    this.load.image('pipe_bottom', 'pipe_light_bottom.png');
    
    // Tuyaux dorés (mode normal + option)
    this.load.image('pipe_top_gold', 'pipe_gold_top.png');
    this.load.image('pipe_bottom_gold', 'pipe_gold_bottom.png');
    
    // Décorations de tuyaux mode Noël
    this.load.image('pipe_bottom_snow', 'pipe_bottom_snow.png');
    this.load.image('pipe_top_ice', 'pipe_top_ice.png');

    // ============================================================
    // CHARGEMENT DES COLLECTABLES
    // ============================================================

    // Bonus SwissBorg
    this.load.image('bonus_sb', 'sb_token_user.png');

    // Pièces Borgy
    this.load.image('borgy_coin', 'borgy_coin.png');

    // Logo Borgy pour le popup de bienvenue
    this.load.image('logo_borgy_horizontal', 'LOGO_BORGY-HORIZONTAL.png');

    // ============================================================
    // CHARGEMENT DES ENNEMIS
    // ============================================================
    
    // Robot SwissBorg
    this.load.image('sb_robot', 'sb_robot.png');
    this.load.image('sb_robot_xmas', 'sb_robot_xmas.png');

    // ============================================================
    // CHARGEMENT AUDIO - MUSIQUE
    // ============================================================
    
    this.load.audio('bgm', 'bgm.mp3');
    this.load.audio('bgm_alt', 'audio_a19c0824bd.mp3');
    this.load.audio('bgm_hard', 'turbulence-246380.mp3');

    // ============================================================
    // CHARGEMENT AUDIO - EFFETS SONORES
    // ============================================================
    
    this.load.audio('sfx_gameover', 'flappy-borgy-game-over-C.wav');
    this.load.audio('sfx_score', 'flappy_borgy_wouf_chiot_0_2s.wav');
    this.load.audio('sfx_coin', 'jackpot_metal_realistic_0_5s.wav');

    // ============================================================
    // AFFICHAGE DE LA BARRE DE PROGRESSION
    // ============================================================
    
    this._createProgressBar(W, H);
  }

  /**
   * Crée la texture de flocon de neige pour le mode Noël
   * @private
   */
  _createSnowFlakeTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('snow_flake', 8, 8);
    g.destroy();
  }

  /**
   * Crée la barre de progression du chargement
   * @private
   * @param {number} W - Largeur de l'écran
   * @param {number} H - Hauteur de l'écran
   */
  _createProgressBar(W, H) {
    // Fond de la barre
    const bgBar = this.add.rectangle(
      W / 2, 
      H * 0.8, 
      W * 0.52, 
      12, 
      0x000000, 
      0.25
    ).setOrigin(0.5);
    
    // Barre de progression
    const fgBar = this.add.rectangle(
      W * 0.24, 
      H * 0.8, 
      2, 
      12, 
      0x17a689
    ).setOrigin(0, 0.5);
    
    // Texte de pourcentage
    const pct = this.add.text(
      W / 2, 
      H * 0.8 + 26, 
      '0%', 
      {
        fontFamily: 'monospace',
        fontSize: 18,
        color: '#fff'
      }
    ).setOrigin(0.5);

    // Mise à jour de la progression
    this.load.on('progress', (progress) => {
      fgBar.width = (W * 0.52) * progress;
      pct.setText(Math.round(progress * 100) + '%');
    });
  }

  /**
   * Création de la scène après le chargement
   * Supprime la vidéo et démarre le menu
   */
  create() {
    // Suppression de la vidéo d'introduction
    if (this._loadingVideoEl) {
      this._loadingVideoEl.remove();
      this._loadingVideoEl = null;
    }

    // Suppression du texte de chargement
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
      loadingText.remove();
    }

    // Transition vers la scène de menu
    this.scene.start('MenuScene');
  }
}

export default PreloadScene;