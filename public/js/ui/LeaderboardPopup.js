// public/js/ui/LeaderboardPopup.js
// Popup de leaderboard simplifiée pour Flappy Borgy

import leaderboardManager, { SCOPES } from '../managers/LeaderboardManager.js';
import i18nManager from '../i18n/i18nManager.js';

const ROWS_COUNT = 8;

export default class LeaderboardPopup extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ isHard?: boolean, scope?: string, onClose?: Function }} options
   */
  constructor(scene, options = {}) {
    const { width, height } = scene.scale;

    super(scene, width / 1.5, height / 1.5);

    this.scene = scene;
    this.isHard = !!options.isHard;
    this.scope = options.scope || SCOPES.ALL;
    this.onClose = options.onClose || null;

    // Dimensions responsives = 80% de l'écran avec max raisonnable
    const canvasWidth = this.scene.scale.width;
    const canvasHeight = this.scene.scale.height;

    this.popupWidth = Math.min(1150, canvasWidth * 0.9 * 4.5);
    this.popupHeight = Math.min(950, canvasHeight * 0.85 * 4.5);

    // Tailles de police adaptatives basées sur popupWidth
    this.titleFontSize = Math.max(24, Math.floor(this.popupWidth * 0.07));
    this.rowFontSize = Math.max(18, Math.floor(this.popupWidth * 0.05));
    this.buttonFontSize = Math.max(16, Math.floor(this.popupWidth * 0.04));
    this.closeFontSize = Math.max(20, Math.floor(this.popupWidth * 0.06));

    // Espacements généreux pour éviter les chevauchements
    this.margin = Math.max(30, Math.floor(this.popupWidth * 0.06));
    this.lineHeight = Math.max(40, Math.floor(this.popupWidth * 0.08));
    this.buttonWidth = Math.max(150, Math.floor(this.popupWidth * 0.3));
    this.buttonHeight = Math.max(45, Math.floor(this.popupWidth * 0.07));

    scene.add.existing(this);
    this.setDepth(1000); // au-dessus de tout

    this._createBackground(width, height);
    this._createPanel();
    this._createHeader();
    this._createRows();
    this._createScopeButtons();
    this._createCloseButton();

    // Charger les données
    this.reload();
  }

  // ============================================================
  // Création de l'UI
  // ============================================================

  _createBackground(width, height) {
    // voile semi-transparent derrière la popup
    const bg = this.scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.85) // Overlay plus opaque
      .setOrigin(0.5);

    bg.setInteractive(); // bloque les clics dessous

    this.add(bg);
     
    // Animation d'entrée améliorée
    this.setScale(0.8);
    this.setAlpha(0);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  _createPanel() {
    const panel = this.scene.add
      .rectangle(0, 0, this.popupWidth, this.popupHeight, 0x111827, 0.95)
      .setStrokeStyle(3, 0xfbbf24)
      .setOrigin(0.5);

    this.add(panel);

    this.panelWidth = this.popupWidth;
    this.panelHeight = this.popupHeight;
  }

  _createHeader() {
    const titleText = i18nManager?.t?.('leaderboard.title') || '🏆 Leaderboard';

    // Position avec plus d'espace
    const titleY = -this.panelHeight / 2 + this.margin * 1.5;

    this.title = this.scene.add
      .text(0, titleY, titleText, {
        fontFamily: 'Arial',
        fontSize: `${this.titleFontSize}px`,
        color: '#fbbf24',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3
      })
      .setOrigin(0.5);

    this.add(this.title);
  }

  _createRows() {
    // Supprimer les lignes existantes
    if (this.rows) {
      this.rows.forEach(row => {
        row.rankTxt.destroy();
        row.nameTxt.destroy();
        row.scoreTxt.destroy();
      });
    }
    this.rows = [];

    // Positions avec plus d'espace vertical
    const startY = -this.panelHeight / 2 + this.margin * 2.5;
    
    // Calculer les positions des colonnes avec plus d'espace
    const availableWidth = this.panelWidth - (this.margin * 2);
    const rankWidth = this.panelWidth * 0.12;
    const scoreWidth = this.panelWidth * 0.18;
    const nameWidth = availableWidth - rankWidth - scoreWidth;
    
    const rankX = -availableWidth / 2 + this.margin + rankWidth / 2;
    const nameX = rankX + rankWidth / 2 + nameWidth / 2;
    const scoreX = availableWidth / 2 - this.margin;
    
    for (let i = 0; i < ROWS_COUNT; i++) {
      const rowY = startY + i * this.lineHeight;
      
      const rankTxt = this.scene.add
        .text(rankX, rowY, `${String(i + 1).padStart(2, '0')}.`, {
          fontFamily: 'Arial',
          fontSize: `${this.rowFontSize}px`,
          color: '#fbbf24'
        })
        .setOrigin(0.5, 0.5);

      const nameTxt = this.scene.add
        .text(nameX, rowY, i18nManager?.t?.('ui.leaderboard.emptySlot') || '-', {
          fontFamily: 'Arial',
          fontSize: `${this.rowFontSize}px`,
          color: '#ffffff',
          wordWrap: {
            width: nameWidth,
            useAdvancedWrap: true
          }
        })
        .setOrigin(0.5, 0.5);

      const scoreTxt = this.scene.add
        .text(scoreX, rowY, i18nManager?.t?.('ui.leaderboard.emptySlot') || '-', {
          fontFamily: 'Arial',
          fontSize: `${this.rowFontSize}px`,
          color: '#fbbf24'
        })
        .setOrigin(0.5, 0.5);

      this.add(rankTxt);
      this.add(nameTxt);
      this.add(scoreTxt);

      this.rows.push({
        rankTxt,
        nameTxt,
        scoreTxt
      });
    }
  }

  _createScopeButtons() {
    const labels = {
      [SCOPES.ALL]: i18nManager?.t?.('ui.leaderboard.scope_all') || 'Global',
      [SCOPES.WEEK]: i18nManager?.t?.('ui.leaderboard.scope_week') || 'Week',
      [SCOPES.MONTH]: i18nManager?.t?.('ui.leaderboard.scope_month') || 'Month'
    };

    const scopes = [SCOPES.ALL, SCOPES.WEEK, SCOPES.MONTH];

    this.scopeButtons = {};
    
    // Positions avec plus d'espace
    const baseY = this.panelHeight / 2 - this.margin * 1.5;
    const totalButtonsWidth = this.buttonWidth * scopes.length;
    const spacing = (this.panelWidth - totalButtonsWidth) / (scopes.length + 1);
    const baseX = -this.panelWidth / 2 + spacing + this.buttonWidth / 2;

    scopes.forEach((scope, index) => {
      const btnBg = this.scene.add
        .rectangle(
          baseX + index * (this.buttonWidth + spacing),
          baseY,
          this.buttonWidth,
          this.buttonHeight,
          0x1f2937,
          scope === this.scope ? 0.95 : 0.8
        )
        .setOrigin(0.5)
        .setStrokeStyle(2, scope === this.scope ? 0xfbbf24 : 0x6b7280);

      const btnLabel = this.scene.add
        .text(btnBg.x, btnBg.y, labels[scope], {
          fontFamily: 'Arial',
          fontSize: `${this.buttonFontSize}px`,
          color: scope === this.scope ? '#fbbf24' : '#ffffff'
        })
        .setOrigin(0.5);

      btnBg.setInteractive({ useHandCursor: true }).on('pointerup', () => {
        if (this.scope !== scope) {
          this.scope = scope;
          this._updateScopeButtons();
          this.reload();
        }
      });

      this.add(btnBg);
      this.add(btnLabel);

      this.scopeButtons[scope] = { bg: btnBg, label: btnLabel };
    });
  }

  _updateScopeButtons() {
    Object.entries(this.scopeButtons).forEach(([scope, { bg, label }]) => {
      const active = scope === this.scope;
      bg.setFillStyle(0x1f2937, active ? 0.95 : 0.8);
      bg.setStrokeStyle(1, active ? 0xfbbf24 : 0x6b7280);
      label.setColor(active ? '#fbbf24' : '#e5e7eb');
    });
  }

  _createCloseButton() {
    // Position avec plus d'espace
    const btn = this.scene.add
      .text(this.panelWidth / 2 - this.margin * 1.2, -this.panelHeight / 2 + this.margin * 1.2, i18nManager?.t?.('ui.leaderboard.closeBtn') || '✕', {
        fontFamily: 'Arial',
        fontSize: `${this.closeFontSize}px`,
        color: '#ff6b6b',
        backgroundColor: '#4a0000',
        padding: { x: 12, y: 8 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerup', () => {
      this.close();
    });

    this.add(btn);
  }

  // ============================================================
  // Chargement des données
  // ============================================================

  async reload() {
    // Effacer les lignes
    const emptySlot = i18nManager?.t?.('ui.leaderboard.emptySlot') || '-';
    this.rows.forEach((row, index) => {
      row.nameTxt.setText(emptySlot);
      row.scoreTxt.setText(emptySlot);
    });

   const rawList = await leaderboardManager.fetchLeaderboard({
     limit: ROWS_COUNT,
     isHard: this.isHard,
     page: 1,
     scope: this.scope,
     useCache: false
   });

   // Utilise le formatage du LeaderboardManager (important : best / name)
   const formatted = leaderboardManager.formatEntries(rawList, 1);

   formatted.forEach((entry, index) => {
     if (!this.rows[index]) return;

     const row = this.rows[index];

     row.rankTxt.setText(entry.rankDisplay);
     // Appliquer la troncature avec ellipsis pour les noms longs
     const truncatedName = this._truncatePlayerName(entry.name || 'Player', row.nameTxt);
     row.nameTxt.setText(truncatedName);
     row.scoreTxt.setText(entry.scoreDisplay ?? String(entry.score ?? 0));
   });
 }

  /**
   * Tronque les noms de joueurs longs avec des points de suspension
   * @private
   */
  _truncatePlayerName(name, nameTextElement) {
   if (!nameTextElement || !nameTextElement.wordWrap || !nameTextElement.wordWrap.width) {
     return name;
   }

   const maxWidth = nameTextElement.wordWrap.width;
   const originalName = name;
   
   // Si le nom tient déjà dans la largeur, le retourner tel quel
   if (nameTextElement.width <= maxWidth) {
     return originalName;
   }
   
   // Tronquer le texte mot par mot avec plus de marge
   let truncatedName = originalName;
   nameTextElement.setText(truncatedName);
   
   while (nameTextElement.width > maxWidth && truncatedName.length > 0) {
     truncatedName = truncatedName.slice(0, -1);
     nameTextElement.setText(truncatedName + '...');
   }
   
   // Si c'est encore trop long, forcer la troncature avec plus de marge
   if (nameTextElement.width > maxWidth) {
     let charCount = Math.floor((maxWidth / nameTextElement.width) * truncatedName.length);
     charCount = Math.max(0, charCount - 5); // Plus de place pour "..."
     truncatedName = originalName.slice(0, charCount) + '...';
     nameTextElement.setText(truncatedName);
   }
   
   return nameTextElement.text;
 }

  // ============================================================
  // Fermeture
  // ============================================================

  close() {
    this.destroy(true);
    if (typeof this.onClose === 'function') {
      this.onClose();
    }
  }
}
