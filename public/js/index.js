/**
 * Entities Index - Point d'entrée pour toutes les entités du jeu
 * 
 * Ce fichier réexporte toutes les entités (sprites, objets de jeu)
 * pour une importation simplifiée.
 * 
 * @module entities
 */

// ============================================================
// EXPORTS - PLAYER
// ============================================================

export { Player, default as PlayerDefault } from './Player.js';

// ============================================================
// EXPORTS - PIPES
// ============================================================

export { Pipe, PipeFactory } from './Pipe.js';

// ============================================================
// EXPORTS - BONUS
// ============================================================

export { Bonus, BonusManager } from './Bonus.js';

// ============================================================
// EXPORTS - BORGY COIN
// ============================================================

export { BorgyCoin, BorgyCoinManager } from './BorgyCoin.js';

// ============================================================
// EXPORTS - BOT (ROBOT)
// ============================================================

export { Bot, BotManager } from './Bot.js';

// ============================================================
// EXPORTS - CLOUD
// ============================================================

export { Cloud, CloudManager } from './Cloud.js';

// ============================================================
// EXPORTS - BACKGROUND
// ============================================================

export { Background, BackgroundFactory } from './Background.js';

// ============================================================
// ALL ENTITIES LIST
// ============================================================

/**
 * Liste de toutes les classes d'entités disponibles
 * @type {Object}
 */
export const ENTITIES = {
  Player,
  Pipe,
  PipeFactory,
  Bonus,
  BonusManager,
  BorgyCoin,
  BorgyCoinManager,
  Bot,
  BotManager,
  Cloud,
  CloudManager,
  Background,
  BackgroundFactory
};

import { Player } from './Player.js';
import { Pipe, PipeFactory } from './Pipe.js';
import { Bonus, BonusManager } from './Bonus.js';
import { BorgyCoin, BorgyCoinManager } from './BorgyCoin.js';
import { Bot, BotManager } from './Bot.js';
import { Cloud, CloudManager } from './Cloud.js';
import { Background, BackgroundFactory } from './Background.js';

export default ENTITIES;