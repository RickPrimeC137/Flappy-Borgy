/**
 * gameConfig.js - Configuration Phaser du jeu Flappy Borgy
 * 
 * Ce fichier contient la configuration de base pour initialiser Phaser.
 * Il sera utilisé par main.js pour créer l'instance du jeu.
 */

import { GAME_W, GAME_H } from './constants.js';

/**
 * Configuration de base Phaser
 * @type {Phaser.Types.Core.GameConfig}
 */
export const phaserConfig = {
  // Type de rendu automatique (WebGL ou Canvas selon le navigateur)
  type: Phaser.AUTO,
  
  // Élément DOM parent pour le canvas de jeu
  parent: "game-root",
  
  // Couleur de fond du canvas
  backgroundColor: "#9edff1",
  
  // Configuration du scaling
  scale: {
    // Mode de scale : RESIZE = redimensionne le canvas selon la fenêtre (meilleur pour mobile)
    mode: Phaser.Scale.RESIZE,
    // Centre automatique horizontal et vertical
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Dimensions du jeu (sera ajusté automatiquement)
    width: GAME_W,
    height: GAME_H,
    // Limites min/max pour éviter déformation excessive
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: GAME_W,
      height: GAME_H
    }
  },
  
  // Configuration de la physique
  physics: {
    // Système de physique par défaut
    default: "arcade",
    arcade: {
      // Gravité globale (0 car gérée par entité)
      gravity: { y: 0 },
      // Mode debug désactivé
      debug: false
    }
  },
  
  // Les scènes seront ajoutées dynamiquement dans main.js
  scene: [],
  
  // Active le mode pixel art pour des sprites nets
  pixelArt: true,
  
  // Configuration des FPS
  fps: {
    target: 60,
    min: 30,
    forceSetTimeOut: false
  }
};

/**
 * Crée une configuration Phaser complète avec les scènes fournies
 * @param {Phaser.Scene[]} scenes - Tableau des scènes du jeu
 * @returns {Phaser.Types.Core.GameConfig} Configuration Phaser complète
 */
export function createGameConfig(scenes) {
  return {
    ...phaserConfig,
    scene: scenes
  };
}