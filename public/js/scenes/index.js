/**
 * Scenes Index - Point d'entrée pour toutes les scènes Phaser
 * 
 * Ce fichier exporte toutes les scènes du jeu pour une importation simplifiée.
 * 
 * @module scenes
 */

export { PreloadScene } from './PreloadScene.js';
export { MenuScene } from './MenuScene.js';
export { GameScene } from './GameScene.js';

/**
 * Liste ordonnée de toutes les scènes pour la configuration Phaser
 * @type {Array<typeof Phaser.Scene>}
 */
import { PreloadScene } from './PreloadScene.js';
import { MenuScene } from './MenuScene.js';
import { GameScene } from './GameScene.js';

export const SCENE_LIST = [
  PreloadScene,
  MenuScene,
  GameScene
];

export default SCENE_LIST;