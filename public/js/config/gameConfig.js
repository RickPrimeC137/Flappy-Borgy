// public/js/config/gameConfig.js

import { GAME_W, GAME_H } from './constants.js';

/**
 * Crée la configuration Phaser du jeu.
 * @param {Array<typeof Phaser.Scene>} scenes - Liste des scènes à charger.
 * @returns {Phaser.Types.Core.GameConfig}
 */
export function createGameConfig(scenes = []) {
  return {
    type: Phaser.AUTO,
    backgroundColor: '#000000',

    // Gestion du scale / responsive
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,

      // Taille “logique” de ton jeu
      width: GAME_W,
      height: GAME_H,

      // Limites mini / maxi pour adapter au mobile
      min: {
        width: 320,
        height: 480,
      },
      max: {
        width: GAME_W,
        height: GAME_H,
      }
    },

    // Physique
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 }, // La vraie gravité est gérée dans le GameScene
        debug: false
      }
    },

    // Rendu
    render: {
      pixelArt: true,
      antialias: true
    },

    // Scènes
    scene: scenes
  };
}

// Export par défaut (optionnel mais propre)
export default createGameConfig;
