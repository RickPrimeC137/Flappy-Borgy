// public/js/ui/LeaderboardPopup.js
// Popup de leaderboard pour Flappy Borgy

import leaderboardManager, { SCOPES } from '../managers/LeaderboardManager.js';
import i18nManager from '../i18n/i18nManager.js';

const ROWS_COUNT = 10;

export default class LeaderboardPopup extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ isHard?: boolean, scope?: string, onClose?: Function }} options
   */
  constructor(scene, options = {}) {
    const { width, height } = scene.scale;

    super(scene, width / 2, height / 2);

    this.scene = scene;
    this.isHard = !!options.isHard;
    this.scope = options.scope || SCOPES.ALL;
    this.onClose = options.onClose || null;

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
      .rectangle(0, 0, width, height, 0x000000, 0.45)
      .setOrigin(0.5);

    bg.setInteractive(); // bloque les clics dessous

    this.add(bg);
  }

  _createPanel() {
    const panelWidth = 460;
    const panelHeight = 520;

    const panel = this.scene.add
      .rectangle(0, 0, panelWidth, panelHeight, 0x111827, 0.95)
      .setStrokeStyle(2, 0xfbbf24) // bord doré léger
      .setOrigin(0.5);

    this.add(panel);

    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
  }

  _createHeader() {
    const titleKey = 'ui.leaderboard.title';
    const titleText =
      i18nManager?.t?.(titleKey) || '🏆 Leaderboard';

    this.title = this.scene.add
      .text(0, -this.panelHeight / 2 + 40, titleText, {
        fontFamily: 'Arial',
        fontSize: '26px',
        color: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5);

    this.add(this.title);
  }

  _createRows() {
    this.rows = [];

    const startY = -this.panelHeight / 2 + 80;
    const lineHeight = 34;

    for (let i = 0; i < ROWS_COUNT; i++) {
      const rankTxt = this.scene.add
        .text(-180, startY + i * lineHeight, `${String(i + 1).padStart(2, '0')}.`, {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#fbbf24'
        })
        .setOrigin(0, 0.5);

      const nameTxt = this.scene.add
        .text(-130, startY + i * lineHeight, '-', {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#ffffff'
        })
        .setOrigin(0, 0.5);

      const scoreTxt = this.scene.add
        .text(180, startY + i * lineHeight, '-', {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#a5b4fc'
        })
        .setOrigin(1, 0.5);

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
      [SCOPES.WEEK]: i18nManager?.t?.('ui.leaderboard.scope_week') || 'Semaine',
      [SCOPES.MONTH]: i18nManager?.t?.('ui.leaderboard.scope_month') || 'Mois'
    };

    const scopes = [SCOPES.ALL, SCOPES.WEEK, SCOPES.MONTH];

    this.scopeButtons = {};
    const baseY = this.panelHeight / 2 - 60;
    const baseX = -120;
    const stepX = 120;

    scopes.forEach((scope, index) => {
      const btnBg = this.scene.add
        .rectangle(
          baseX + index * stepX,
          baseY,
          100,
          32,
          0x1f2937,
          scope === this.scope ? 0.95 : 0.8
        )
        .setOrigin(0.5)
        .setStrokeStyle(1, scope === this.scope ? 0xfbbf24 : 0x6b7280);

      const btnLabel = this.scene.add
        .text(btnBg.x, btnBg.y, labels[scope], {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: scope === this.scope ? '#fbbf24' : '#e5e7eb'
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
    const btn = this.scene.add
      .text(this.panelWidth / 2 - 24, -this.panelHeight / 2 + 24, '✕', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#ffffff'
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
    this.rows.forEach((row, index) => {
      row.nameTxt.setText('-');
      row.scoreTxt.setText('-');
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
      row.nameTxt.setText(entry.name || 'Player');
      row.scoreTxt.setText(entry.scoreDisplay ?? String(entry.score ?? 0));
    });
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

