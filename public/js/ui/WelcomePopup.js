/**
 * WelcomePopup.js - Popup de bienvenue multi-step
 * 
 * Affiche un tutoriel en plusieurs étapes pour les nouveaux joueurs
 * avec navigation par flèches ou dots.
 * 
 * @module ui/WelcomePopup
 */

import i18n from '../i18n/i18nManager.js';
import storageManager from '../managers/StorageManager.js';

/**
 * Données des étapes du tutoriel
 */
const TUTORIAL_STEPS = [
  {
    key: 'step1',
    icon: '🎮',
    titleKey: 'TUTORIAL_STEP1_TITLE',
    contentKey: 'TUTORIAL_STEP1_CONTENT'
  },
  {
    key: 'step2',
    icon: '🚀',
    titleKey: 'TUTORIAL_STEP2_TITLE',
    contentKey: 'TUTORIAL_STEP2_CONTENT'
  },
  {
    key: 'step3',
    icon: '💎',
    titleKey: 'TUTORIAL_STEP3_TITLE',
    contentKey: 'TUTORIAL_STEP3_CONTENT'
  },
  {
    key: 'step4',
    icon: '🏆',
    titleKey: 'TUTORIAL_STEP4_TITLE',
    contentKey: 'TUTORIAL_STEP4_CONTENT'
  }
];

/**
 * Classe WelcomePopup - Popup de bienvenue multi-step
 */
export class WelcomePopup {
  /**
   * @param {Phaser.Scene} scene - La scène Phaser
   * @param {Object} options - Options de configuration
   * @param {Function} options.onComplete - Callback appelé à la fin du tutoriel
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.onComplete = options.onComplete || (() => {});
    
    this.currentStep = 0;
    this.container = null;
    this.stepElements = [];
    this.dots = [];
    
    // Dimensions du popup
    this.width = 360;
    this.height = 420;
    
    // Écouteur d'événements de changement de langue
    this.languageChangeListener = null;
  }

  /**
   * Affiche le popup
   */
  show() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    // Container principal
    this.container = this.scene.add.container(cx, cy);
    this.container.setDepth(2000);

    // Overlay sombre
    const overlay = this.scene.add.rectangle(0, 0, W * 2, H * 2, 0x000000, 0.85);
    overlay.setInteractive(); // Bloque les clics en dessous
    this.container.add(overlay);

    // Panneau principal avec glow
    const glowBg = this.scene.add.rectangle(0, 0, this.width + 8, this.height + 8, 0x17a689, 0.5);
    this.container.add(glowBg);
    
    const panel = this.scene.add.rectangle(0, 0, this.width, this.height, 0x1a1a2e, 0.98);
    panel.setStrokeStyle(3, 0x17a689);
    this.container.add(panel);

    // Animation d'entrée
    this.container.setScale(0.8);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    // Créer le contenu de l'étape actuelle
    this._createStepContent();

    // Créer les dots de navigation
    this._createNavigationDots();

    // Créer les boutons de navigation
    this._createNavigationButtons();
    
    // Ajouter l'écouteur d'événements pour les changements de langue
    this._addLanguageChangeListener();
  }

  /**
   * Crée le contenu pour l'étape actuelle
   * @private
   */
  _createStepContent() {
    // Supprimer les éléments précédents
    this.stepElements.forEach(el => el.destroy());
    this.stepElements = [];

    const step = TUTORIAL_STEPS[this.currentStep];
    
    // Icône animée
    const icon = this.scene.add.text(0, -160, step.icon, {
      fontSize: 64
    }).setOrigin(0.5);
    this.stepElements.push(icon);
    this.container.add(icon);

    // Animation de l'icône
    this.scene.tweens.add({
      targets: icon,
      y: icon.y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Logo Borgy (uniquement pour la première étape)
    if (this.currentStep === 0) {
      const logo = this.scene.add.image(0, -120, 'logo_borgy_horizontal');
      logo.setScale(0.08); // Ajuster la taille si nécessaire - Optimisé pour s'adapter parfaitement au popup
      this.stepElements.push(logo);
      this.container.add(logo);
    }

    // Titre
    const title = this.scene.add.text(0, -60,
      i18n.t(step.titleKey), {
      fontFamily: 'monospace',
      fontSize: 24,
      color: '#17a689',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.stepElements.push(title);
    this.container.add(title);

    // Contenu
    const content = this.scene.add.text(0, 30,
      i18n.t(step.contentKey), {
      fontFamily: 'monospace',
      fontSize: 14,
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: this.width - 60 },
      lineSpacing: 6
    }).setOrigin(0.5);
    this.stepElements.push(content);
    this.container.add(content);

    // Animation d'entrée du contenu
    title.setAlpha(0);
    content.setAlpha(0);
    this.scene.tweens.add({
      targets: [title, content],
      alpha: 1,
      duration: 300,
      delay: 100
    });

    // Indicateur de progression
    const progressText = this.scene.add.text(0, -180, 
      `${this.currentStep + 1}/${TUTORIAL_STEPS.length}`, {
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#888888'
    }).setOrigin(0.5);
    this.stepElements.push(progressText);
    this.container.add(progressText);
  }

  /**
   * Crée les dots de navigation
   * @private
   */
  _createNavigationDots() {
    // Supprimer les dots existants
    this.dots.forEach(dot => dot.destroy());
    this.dots = [];

    const dotSpacing = 20;
    const startX = -(TUTORIAL_STEPS.length - 1) * dotSpacing / 2;
    const y = 140;

    TUTORIAL_STEPS.forEach((_, idx) => {
      const isActive = idx === this.currentStep;
      const dot = this.scene.add.circle(
        startX + idx * dotSpacing, 
        y, 
        isActive ? 8 : 5, 
        isActive ? 0x17a689 : 0x444444
      );
      
      dot.setInteractive({ useHandCursor: true });
      dot.on('pointerdown', () => this._goToStep(idx));
      dot.on('pointerover', () => {
        if (!isActive) dot.setFillStyle(0x666666);
      });
      dot.on('pointerout', () => {
        if (!isActive) dot.setFillStyle(0x444444);
      });

      this.dots.push(dot);
      this.container.add(dot);
    });
  }

  /**
   * Crée les boutons de navigation
   * @private
   */
  _createNavigationButtons() {
    const y = 175;
    const isFirst = this.currentStep === 0;
    const isLast = this.currentStep === TUTORIAL_STEPS.length - 1;

    // Bouton Précédent
    if (!isFirst) {
      const prevBtn = this.scene.add.text(-80, y, i18n.t('TUTORIAL_PREV'), {
        fontFamily: 'monospace',
        fontSize: 14,
        color: '#888888'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      prevBtn.on('pointerdown', () => this._previousStep());
      prevBtn.on('pointerover', () => prevBtn.setColor('#ffffff'));
      prevBtn.on('pointerout', () => prevBtn.setColor('#888888'));

      this.stepElements.push(prevBtn);
      this.container.add(prevBtn);
    }

    // Bouton Suivant / Commencer
    const nextLabel = isLast ? i18n.t('TUTORIAL_START') : i18n.t('TUTORIAL_NEXT');
    const nextBtn = this.scene.add.text(isFirst ? 0 : 80, y, nextLabel, {
      fontFamily: 'monospace',
      fontSize: isLast ? 18 : 14,
      color: isLast ? '#ffffff' : '#17a689',
      backgroundColor: isLast ? '#17a689' : null,
      padding: isLast ? { x: 20, y: 10 } : null
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    nextBtn.on('pointerdown', () => {
      if (isLast) {
        this._complete();
      } else {
        this._nextStep();
      }
    });
    
    if (!isLast) {
      nextBtn.on('pointerover', () => nextBtn.setColor('#ffffff'));
      nextBtn.on('pointerout', () => nextBtn.setColor('#17a689'));
    }

    this.stepElements.push(nextBtn);
    this.container.add(nextBtn);

    // Bouton Skip (sauf dernière étape)
    if (!isLast) {
      const skipBtn = this.scene.add.text(this.width / 2 - 40, -this.height / 2 + 25, i18n.t('TUTORIAL_SKIP'), {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#666666'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      skipBtn.on('pointerdown', () => this._complete());
      skipBtn.on('pointerover', () => skipBtn.setColor('#ff6b6b'));
      skipBtn.on('pointerout', () => skipBtn.setColor('#666666'));

      this.stepElements.push(skipBtn);
      this.container.add(skipBtn);
    }
  }

  /**
   * Va à l'étape suivante
   * @private
   */
  _nextStep() {
    if (this.currentStep < TUTORIAL_STEPS.length - 1) {
      this.currentStep++;
      this._updateStep();
    }
  }

  /**
   * Va à l'étape précédente
   * @private
   */
  _previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this._updateStep();
    }
  }

  /**
   * Va à une étape spécifique
   * @private
   * @param {number} idx - Index de l'étape
   */
  _goToStep(idx) {
    if (idx >= 0 && idx < TUTORIAL_STEPS.length && idx !== this.currentStep) {
      this.currentStep = idx;
      this._updateStep();
    }
  }

  /**
   * Met à jour l'affichage de l'étape
   * @private
   */
  _updateStep() {
    this._createStepContent();
    this._createNavigationDots();
    this._createNavigationButtons();
  }

  /**
   * Termine le tutoriel
   * @private
   */
  _complete() {
    // Marquer comme vu
    storageManager.saveWelcomeSeen();

    // Animation de sortie
    this.scene.tweens.add({
      targets: this.container,
      scale: 0.8,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.container.destroy();
        this.onComplete();
      }
    });
  }

  /**
   * Ajoute un écouteur d'événements pour les changements de langue
   * @private
   */
  _addLanguageChangeListener() {
    if (this.languageChangeListener) {
      return; // Déjà ajouté
    }
    
    this.languageChangeListener = (event) => {
      // Mettre à jour tous les textes du tutoriel
      this._updateAllTexts();
    };
    
    i18n.getEventTarget().addEventListener('languageChanged', this.languageChangeListener);
  }

  /**
   * Met à jour tous les textes du tutoriel avec les nouvelles traductions
   * @private
   */
  _updateAllTexts() {
    // Recréer le contenu de l'étape pour mettre à jour titre et contenu
    this._createStepContent();
    
    // Recréer les boutons de navigation pour mettre à jour leurs textes
    this._createNavigationDots();
    this._createNavigationButtons();
  }

  /**
   * Détruit le popup
   */
  destroy() {
    // Supprimer l'écouteur d'événements de changement de langue
    if (this.languageChangeListener) {
      i18n.getEventTarget().removeEventListener('languageChanged', this.languageChangeListener);
      this.languageChangeListener = null;
    }
    
    if (this.container) {
      this.container.destroy();
    }
  }
}

export default WelcomePopup;