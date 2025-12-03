// config/gameConfig.js
import { GAME_W, GAME_H } from './constants.js';

/**
 * Crée la configuration Phaser du jeu
 * @param {Array<typeof Phaser.Scene>} scenes
 * @returns {Phaser.Types.Core.GameConfig}
 */
export function createGameConfig(scenes = []) {
  return {
    type: Phaser.AUTO,
    parent: 'game',               // <div id="game"></div> dans index.html
    backgroundColor: '#000000',
    pixelArt: true,

    // ⭐ Partie importante pour le mobile
    scale: {
      mode: Phaser.Scale.FIT,             // adapte au viewport
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_W,                      // résolution virtuelle
      height: GAME_H
    },

    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 1700 },             // ce que tu avais déjà
        debug: false
      }
    },

    scene: scenes
  };
}

export default createGameConfig;
