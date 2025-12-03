// public/js/config/gameConfig.js

import { GAME_W, GAME_H } from './constants.js';

/**
 * Crée la configuration Phaser du jeu.
 * @param {Array<typeof Phaser.Scene>} scenes
 * @returns {Phaser.Types.Core.GameConfig}
 */
export function createGameConfig(scenes = []) {
  return {
    type: Phaser.AUTO,

    // <div id="game-container"> dans index.html
    parent: 'game-container',

    // Taille “logique” du jeu (celle que tu utilises partout)
    width: GAME_W,
    height: GAME_H,

    backgroundColor: '#000000',

    scale: {
      // Adapte au mobile / navigateur en gardant le ratio
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },

    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 }, // la vraie gravité est gérée dans GameScene
        debug: false
      }
    },

    render: {
      pixelArt: true,
      antialias: true
    },

    scene: scenes
  };
}

export default createGameConfig;
