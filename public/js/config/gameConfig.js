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
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: GAME_W,
  height: GAME_H,
  min: {
    width: 320,
    height: 480
  },
  max: {
    width: 1024,
    height: 1536
  }
},
render: {
  pixelArt: true,
  antialias: true
},

export default createGameConfig;

