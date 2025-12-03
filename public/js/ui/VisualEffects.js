/**
 * VisualEffects.js - Système d'effets visuels améliorés
 * 
 * Fournit des effets visuels pour améliorer l'UX :
 * - Animation de score flottant (+1, +5)
 * - Effet de tremblement à la collision
 * - Transitions fluides
 * - Célébrations et récompenses
 * 
 * @module ui/VisualEffects
 */

/**
 * Classe VisualEffects - Singleton pour les effets visuels
 */
export class VisualEffects {
  /**
   * @param {Phaser.Scene} scene - La scène Phaser
   */
  constructor(scene) {
    this.scene = scene;
    this._scorePopups = [];
    this._particleEmitters = {};
  }

  /**
   * Affiche un texte de score flottant (+1, +5, etc.)
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string|number} value - Valeur à afficher
   * @param {Object} options - Options d'affichage
   * @param {string} options.color - Couleur du texte (hex)
   * @param {number} options.fontSize - Taille de police
   * @param {string} options.prefix - Préfixe (ex: '+')
   * @param {string} options.suffix - Suffixe (ex: ' coins')
   * @param {number} options.duration - Durée de l'animation (ms)
   */
  showFloatingScore(x, y, value, options = {}) {
    const {
      color = '#ffd700',
      fontSize = 24,
      prefix = '+',
      suffix = '',
      duration = 1000
    } = options;

    const text = this.scene.add.text(x, y, `${prefix}${value}${suffix}`, {
      fontFamily: 'monospace',
      fontSize: fontSize,
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(500);

    // Animation de montée + disparition
    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      scale: { from: 1, to: 1.5 },
      duration: duration,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });

    // Animation de rebond initial
    this.scene.tweens.add({
      targets: text,
      scale: { from: 0.5, to: 1.2 },
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut'
    });

    this._scorePopups.push(text);
    return text;
  }

  /**
   * Affiche un effet de pièce collectée avec particules
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} value - Valeur de la pièce
   */
  showCoinCollect(x, y, value = 1) {
    // Texte flottant
    this.showFloatingScore(x, y, value, {
      color: '#ffd700',
      fontSize: value > 1 ? 28 : 22,
      prefix: '+',
      suffix: ' 🪙'
    });

    // Particules dorées
    this._emitParticles(x, y, {
      color: 0xffd700,
      count: value > 1 ? 15 : 8,
      speed: 150,
      lifespan: 600
    });
  }

  /**
   * Affiche un effet de bonus activé
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} multiplier - Multiplicateur (2x, 3x, etc.)
   */
  showBonusActivate(x, y, multiplier = 2) {
    // Texte du multiplicateur
    const text = this.scene.add.text(x, y, `x${multiplier}`, {
      fontFamily: 'monospace',
      fontSize: 48,
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(500);

    // Animation d'expansion
    this.scene.tweens.add({
      targets: text,
      scale: { from: 0, to: 2 },
      alpha: { from: 1, to: 0 },
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });

    // Particules vertes
    this._emitParticles(x, y, {
      color: 0x00ff88,
      count: 20,
      speed: 200,
      lifespan: 800
    });

    // Aura circulaire
    this._showAuraRing(x, y, '#00ff88');
  }

  /**
   * Affiche un effet de tremblement de la caméra
   * @param {number} intensity - Intensité du tremblement (0-1)
   * @param {number} duration - Durée en ms
   */
  shake(intensity = 0.02, duration = 200) {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /**
   * Affiche un flash de couleur
   * @param {string} color - Couleur hex
   * @param {number} duration - Durée en ms
   */
  flash(color = '#ff0000', duration = 200) {
    // Convertir hex en nombre
    const hexColor = parseInt(color.replace('#', ''), 16);
    this.scene.cameras.main.flash(duration, 
      (hexColor >> 16) & 0xff,  // R
      (hexColor >> 8) & 0xff,   // G
      hexColor & 0xff           // B
    );
  }

  /**
   * Affiche un effet de dégâts (flash rouge + shake)
   */
  showDamage() {
    this.flash('#aa0000', 400);
    this.shake(0.01, 250);
  }

  /**
   * Affiche un effet de célébration (nouveau skin, achievement, etc.)
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} text - Texte à afficher
   */
  showCelebration(x, y, text = '🎉') {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    
    // Texte principal
    const celebText = this.scene.add.text(x || W/2, y || H/2, text, {
      fontFamily: 'monospace',
      fontSize: 64,
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(600);

    // Animation
    this.scene.tweens.add({
      targets: celebText,
      scale: { from: 0, to: 1.5 },
      angle: { from: -10, to: 10 },
      duration: 600,
      ease: 'Elastic.easeOut',
      yoyo: true,
      hold: 500,
      onComplete: () => {
        this.scene.tweens.add({
          targets: celebText,
          alpha: 0,
          y: celebText.y - 50,
          duration: 300,
          onComplete: () => celebText.destroy()
        });
      }
    });

    // Confettis
    this._emitConfetti(W/2, -20, 50);
  }

  /**
   * Affiche un effet de nouveau record
   * @param {number} score - Le nouveau score record
   */
  showNewRecord(score) {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;

    // Bannière "NEW RECORD"
    const banner = this.scene.add.text(W/2, H * 0.3, '🏆 NEW RECORD! 🏆', {
      fontFamily: 'monospace',
      fontSize: 32,
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(600);

    // Score
    const scoreText = this.scene.add.text(W/2, H * 0.4, `${score}`, {
      fontFamily: 'monospace',
      fontSize: 56,
      color: '#ffffff',
      stroke: '#ffd700',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(600);

    // Animation de la bannière
    this.scene.tweens.add({
      targets: banner,
      scale: { from: 0, to: 1.2 },
      duration: 500,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 2000,
      onComplete: () => banner.destroy()
    });

    // Animation du score
    this.scene.tweens.add({
      targets: scoreText,
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 600,
      delay: 300,
      ease: 'Elastic.easeOut'
    });

    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: scoreText,
        alpha: 0,
        duration: 300,
        onComplete: () => scoreText.destroy()
      });
    });

    // Confettis dorés
    this._emitConfetti(W/2, -20, 100, 0xffd700);
  }

  /**
   * Affiche un effet d'achat réussi
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} skinName - Nom du skin acheté
   */
  showPurchaseSuccess(x, y, skinName) {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;

    // Overlay
    const overlay = this.scene.add.rectangle(W/2, H/2, W, H, 0x000000, 0.7)
      .setDepth(550);

    // Texte "UNLOCKED"
    const unlockText = this.scene.add.text(W/2, H * 0.35, '✨ DÉBLOQUÉ ✨', {
      fontFamily: 'monospace',
      fontSize: 36,
      color: '#00ff88',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(600);

    // Nom du skin
    const nameText = this.scene.add.text(W/2, H * 0.45, skinName, {
      fontFamily: 'monospace',
      fontSize: 28,
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(600);

    // Animation
    const elements = [overlay, unlockText, nameText];
    elements.forEach(el => el.setAlpha(0));

    this.scene.tweens.add({
      targets: elements,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.scene.time.delayedCall(1500, () => {
          this.scene.tweens.add({
            targets: elements,
            alpha: 0,
            duration: 300,
            onComplete: () => elements.forEach(el => el.destroy())
          });
        });
      }
    });

    // Confettis
    this._emitConfetti(W/2, -20, 60);
  }

  /**
   * Affiche un indicateur de revive
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  showRevive(x, y) {
    const text = this.scene.add.text(x, y, '💎 REVIVE!', {
      fontFamily: 'monospace',
      fontSize: 42,
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(500);

    // Animation pulsante
    this.scene.tweens.add({
      targets: text,
      scale: { from: 0, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });

    // Aura cyan
    this._showAuraRing(x, y, '#00ffff', 100);

    // Particules
    this._emitParticles(x, y, {
      color: 0x00ffff,
      count: 25,
      speed: 180,
      lifespan: 1000
    });
  }

  /**
   * Émet des particules à une position
   * @private
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {Object} options - Options des particules
   */
  _emitParticles(x, y, options = {}) {
    const {
      color = 0xffffff,
      count = 10,
      speed = 100,
      lifespan = 500,
      scale = 0.5
    } = options;

    // Créer des cercles comme particules
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.5 + Math.random() * 0.5);
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      const particle = this.scene.add.circle(x, y, 4, color)
        .setDepth(400)
        .setScale(scale);

      this.scene.tweens.add({
        targets: particle,
        x: x + vx * (lifespan / 1000),
        y: y + vy * (lifespan / 1000),
        alpha: 0,
        scale: 0,
        duration: lifespan,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * Affiche un anneau d'aura expansif
   * @private
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} color - Couleur hex
   * @param {number} size - Taille finale
   */
  _showAuraRing(x, y, color = '#ffffff', size = 80) {
    const hexColor = parseInt(color.replace('#', ''), 16);
    
    const ring = this.scene.add.circle(x, y, 10, hexColor, 0)
      .setStrokeStyle(3, hexColor)
      .setDepth(350);

    this.scene.tweens.add({
      targets: ring,
      radius: size,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  /**
   * Émet des confettis
   * @private
   * @param {number} x - Position X de départ
   * @param {number} y - Position Y de départ
   * @param {number} count - Nombre de confettis
   * @param {number} color - Couleur (null = multicolore)
   */
  _emitConfetti(x, y, count = 30, color = null) {
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffd700];
    const H = this.scene.scale.height;

    for (let i = 0; i < count; i++) {
      const confettiColor = color || colors[Math.floor(Math.random() * colors.length)];
      const confetti = this.scene.add.rectangle(
        x + (Math.random() - 0.5) * 200,
        y,
        8,
        12,
        confettiColor
      ).setDepth(600);

      const targetX = x + (Math.random() - 0.5) * 400;
      const targetY = H + 50;
      const duration = 2000 + Math.random() * 1000;

      this.scene.tweens.add({
        targets: confetti,
        x: targetX,
        y: targetY,
        angle: Math.random() * 720 - 360,
        duration: duration,
        ease: 'Quad.easeIn',
        onComplete: () => confetti.destroy()
      });
    }
  }

  /**
   * Nettoie tous les effets
   */
  cleanup() {
    this._scorePopups.forEach(popup => {
      if (popup && popup.destroy) popup.destroy();
    });
    this._scorePopups = [];
  }
}

/**
 * Instance singleton
 * @type {VisualEffects|null}
 */
let instance = null;

/**
 * Obtient l'instance de VisualEffects pour une scène
 * @param {Phaser.Scene} scene - La scène
 * @returns {VisualEffects}
 */
export function getVisualEffects(scene) {
  if (!instance || instance.scene !== scene) {
    instance = new VisualEffects(scene);
  }
  return instance;
}

export default VisualEffects;