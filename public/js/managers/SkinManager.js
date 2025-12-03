/**
 * SkinManager.js - Gestionnaire des skins du joueur
 *
 * Ce module gère tout ce qui concerne les skins :
 * - Chargement et sauvegarde de l'état des skins
 * - Skin actif du joueur
 * - Skins débloqués
 * - Achat et équipement de skins
 * - Intégration avec CoinManager pour les achats
 *
 * @module SkinManager
 */

import storageManager from './StorageManager.js';
import coinManager from './CoinManager.js';
import {
  SKINS_DEF,
  XMAS_SKIN,
  getSkinById,
  getSkinByKey,
  getSkinPerk
} from '../config/skinConfig.js';
import { PLAYER_SCALE } from '../config/constants.js';

/**
 * Classe singleton pour gérer les skins du joueur
 * @class
 */
class SkinManager {
  /**
   * Crée une instance du SkinManager
   */
  constructor() {
    if (SkinManager._instance) {
      return SkinManager._instance;
    }
    SkinManager._instance = this;

    /**
     * État des skins (cache)
     * @type {Object|null}
     * @private
     */
    this._state = null;

    // Charger l'état initial
    this._loadState();
  }

  // ============================================================
  // MÉTHODES PRIVÉES
  // ============================================================

  /**
   * Charge l'état des skins depuis le stockage
   * @private
   */
  _loadState() {
    const saved = storageManager.loadSkinState();

    if (saved && Array.isArray(saved.skins) && saved.skins.length) {
      // Ajouter les nouveaux skins qui n'existent pas encore
      const existingIds = new Set(saved.skins.map((s) => s.id));

      SKINS_DEF.forEach((def) => {
        if (!existingIds.has(def.id)) {
          saved.skins.push({
            id: def.id,
            key: def.key,
            name: def.name,
            price: def.price,
            owned: !!def.ownedByDefault,
            selected: false
          });
        }
      });

      // Vérifier que le skin sélectionné est valide
      if (
        !saved.selectedId ||
        !saved.skins.some((s) => s.id === saved.selectedId && s.owned)
      ) {
        const fallback = saved.skins.find((s) => s.owned) || saved.skins[0];
        if (fallback) {
          saved.selectedId = fallback.id;
        }
      }

      // Mettre à jour les flags selected
      saved.skins.forEach((s) => {
        s.selected = s.id === saved.selectedId;
      });

      this._state = saved;
      this._saveState();
    } else {
      // Créer un nouvel état par défaut
      this._initDefaultState();
    }
  }

  /**
   * Initialise l'état par défaut des skins
   * @private
   */
  _initDefaultState() {
    const skins = SKINS_DEF.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      price: s.price,
      owned: !!s.ownedByDefault,
      selected: false
    }));

    const selectedId = SKINS_DEF[0].id;
    const first = skins.find((s) => s.id === selectedId);
    if (first) {
      first.selected = true;
    }

    this._state = {
      skins,
      selectedId,
      coinsSpent: 0
    };

    this._saveState();
  }

  /**
   * Sauvegarde l'état des skins
   * @private
   */
  _saveState() {
    if (this._state) {
      storageManager.saveSkinState(this._state);
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Retourne l'état complet des skins
   * @returns {Object} L'état des skins
   */
  getState() {
    if (!this._state) {
      this._loadState();
    }
    return { ...this._state };
  }

  /**
   * Alias de compatibilité avec d’anciens appels éventuels
   * @returns {Object}
   */
  getSkinState() {
    return this.getState();
  }

  /**
   * Retourne la liste de tous les skins
   * @returns {Array} Liste des skins avec leur état
   */
  getAllSkins() {
    return this._state?.skins ? [...this._state.skins] : [];
  }

  /**
   * Retourne la liste des skins possédés
   * @returns {Array} Liste des skins possédés
   */
  getOwnedSkins() {
    return this._state?.skins?.filter((s) => s.owned) || [];
  }

  /**
   * Retourne la liste des skins non possédés
   * @returns {Array} Liste des skins à acheter
   */
  getUnownedSkins() {
    return this._state?.skins?.filter((s) => !s.owned) || [];
  }

  /**
   * Retourne l'ID du skin actuellement sélectionné
   * @returns {string} L'ID du skin sélectionné
   */
  getSelectedId() {
    return this._state?.selectedId || SKINS_DEF[0].id;
  }

  /**
   * Alias de compatibilité : certains fichiers peuvent appeler getSelectedSkinId()
   */
  getSelectedSkinId() {
    return this.getSelectedId();
  }

  /**
   * Retourne la clé de texture du skin actuellement sélectionné
   * @returns {string} La clé de texture
   */
  getSelectedKey() {
    const selected = this._state?.skins?.find(
      (s) => s.id === this._state.selectedId && s.owned
    );

    if (selected) {
      // Dans les assets, le sprite de base est souvent "borgy_ingame"
      return selected.key === 'borgy' ? 'borgy_ingame' : selected.key;
    }

    // Fallback au skin par défaut
    const def = SKINS_DEF[0];
    return def
      ? def.key === 'borgy'
        ? 'borgy_ingame'
        : def.key
      : 'borgy_ingame';
  }

  /**
   * Alias de compatibilité : getSelectedSkinKey()
   */
  getSelectedSkinKey() {
    return this.getSelectedKey();
  }

  /**
   * Retourne le skin actuellement sélectionné
   * @returns {Object|null} Le skin sélectionné
   */
  getSelectedSkin() {
    return (
      this._state?.skins?.find((s) => s.id === this._state.selectedId) || null
    );
  }

  /**
   * Vérifie si un skin est possédé
   * @param {string} skinId - L'ID du skin
   * @returns {boolean} true si possédé
   */
  isOwned(skinId) {
    const skin = this._state?.skins?.find((s) => s.id === skinId);
    return skin?.owned || false;
  }

  /**
   * ✔️ Méthode de compatibilité avec l’ancien code :
   * ancien nom : isSkinOwned(...)
   * @param {string} skinId
   * @returns {boolean}
   */
  isSkinOwned(skinId) {
    return this.isOwned(skinId);
  }

  /**
   * Vérifie si un skin est sélectionné
   * @param {string} skinId - L'ID du skin
   * @returns {boolean} true si sélectionné
   */
  isSelected(skinId) {
    return this._state?.selectedId === skinId;
  }

  // ============================================================
  // SÉLECTION DE SKIN
  // ============================================================

  /**
   * Sélectionne un skin (s'il est possédé)
   * @param {string} skinId - L'ID du skin à sélectionner
   * @returns {{success: boolean, reason?: string}} Résultat de l'opération
   */
  selectSkin(skinId) {
    if (!this._state) {
      this._loadState();
    }

    const skin = this._state.skins.find((s) => s.id === skinId);

    if (!skin) {
      return { success: false, reason: 'skin_not_found' };
    }

    if (!skin.owned) {
      return { success: false, reason: 'skin_not_owned' };
    }

    // Mettre à jour la sélection
    this._state.selectedId = skinId;
    this._state.skins.forEach((s) => {
      s.selected = s.id === skinId;
    });

    this._saveState();

    return { success: true };
  }

  // ============================================================
  // ACHAT DE SKIN
  // ============================================================

  /**
   * Tente d'acheter un skin
   * @param {string} skinId - L'ID du skin à acheter
   * @returns {{ok: boolean, reason: string, coinsLeft: number}} Résultat de l'achat
   */
  tryBuySkin(skinId) {
    if (!this._state) {
      this._loadState();
    }

    const skin = this._state.skins.find((s) => s.id === skinId);

    if (!skin) {
      return {
        ok: false,
        reason: 'unknown_skin',
        coinsLeft: coinManager.getBalance()
      };
    }

    if (skin.owned) {
      return {
        ok: true,
        reason: 'already_owned',
        coinsLeft: coinManager.getBalance()
      };
    }

    // Tenter l'achat via CoinManager
    const result = coinManager.purchase(skin.price, skinId);

    if (!result.success) {
      return {
        ok: false,
        reason: 'not_enough_coins',
        coinsLeft: result.newBalance
      };
    }

    // Achat réussi : débloquer le skin
    skin.owned = true;
    this._state.coinsSpent =
      (this._state.coinsSpent || 0) + skin.price;
    this._saveState();

    return {
      ok: true,
      reason: 'purchased',
      coinsLeft: result.newBalance
    };
  }

  /**
   * Achète et sélectionne un skin en une seule opération
   * @param {string} skinId - L'ID du skin
   * @returns {{ok: boolean, reason: string, coinsLeft: number}} Résultat
   */
  buyAndSelect(skinId) {
    const buyResult = this.tryBuySkin(skinId);

    if (buyResult.ok) {
      this.selectSkin(skinId);
    }

    return buyResult;
  }

  // ============================================================
  // PERKS ET EFFETS SPÉCIAUX
  // ============================================================

  /**
   * Vérifie si le skin sélectionné est le skin Gold
   * @returns {boolean} true si c'est le skin Gold
   */
  isGoldSkin() {
    return this.getSelectedId() === 'borgy_gold';
  }

  /**
   * Vérifie si le skin sélectionné est le skin Émeraude
   * @returns {boolean} true si c'est le skin Émeraude
   */
  isEmeraldSkin() {
    return this.getSelectedId() === 'borgy_emeraude';
  }

  /**
   * Vérifie si le skin sélectionné est le skin Diamant
   * @returns {boolean} true si c'est le skin Diamant
   */
  isDiamondSkin() {
    return this.getSelectedId() === 'borgy_diamant';
  }

  /**
   * Retourne le perk du skin actuellement sélectionné
   * @returns {string|null} Le perk ou null
   */
  getSelectedSkinPerk() {
    return getSkinPerk(this.getSelectedId());
  }

  /**
   * Vérifie si le skin sélectionné a un perk spécifique
   * @param {string} perkKey - La clé du perk à vérifier
   * @returns {boolean} true si le skin a ce perk
   */
  hasPerk(perkKey) {
    return this.getSelectedSkinPerk() === perkKey;
  }

  // ============================================================
  // SKIN NOËL
  // ============================================================

  /**
   * Retourne la configuration du skin Noël
   * @returns {Object} Configuration du skin Noël
   */
  getXmasSkin() {
    return { ...XMAS_SKIN };
  }

  /**
   * Retourne la clé du skin à utiliser en fonction du mode
   * @param {boolean} isXmasMode - Si le mode Noël est activé
   * @returns {string} La clé du skin à utiliser
   */
  getSkinKeyForMode(isXmasMode) {
    if (isXmasMode) {
      return XMAS_SKIN.key;
    }
    return this.getSelectedKey();
  }

  // ============================================================
  // SCALE ET VISUEL
  // ============================================================

  /**
   * Calcule le scale d'un skin pour qu'il ait la même taille visuelle que le skin de base
   * @param {Phaser.Textures.TextureManager} textures - Le gestionnaire de textures Phaser
   * @param {string} skinKey - La clé du skin
   * @returns {number} Le scale à appliquer
   */
  computeSkinScale(textures, skinKey) {
    const baseKey = 'borgy'; // Sprite de référence

    try {
      const baseTex = textures.get(baseKey);
      const curTex = textures.get(skinKey);

      if (!baseTex || !curTex) {
        return PLAYER_SCALE;
      }

      const baseImg = baseTex.getSourceImage();
      const curImg = curTex.getSourceImage();

      if (!baseImg || !curImg) {
        return PLAYER_SCALE;
      }

      const baseBounds = this._getVisibleBounds(baseImg);
      const curBounds = this._getVisibleBounds(curImg);

      let ratio;
      if (baseBounds && curBounds) {
        ratio =
          (baseBounds.h || baseImg.height) /
          (curBounds.h || curImg.height);
      } else {
        ratio = baseImg.height / curImg.height;
      }

      let scale = PLAYER_SCALE * ratio;

      if (!Number.isFinite(scale)) {
        scale = PLAYER_SCALE;
      }

      // Clamp le scale entre 60% et 180% du scale de base
      scale = Math.max(
        PLAYER_SCALE * 0.6,
        Math.min(PLAYER_SCALE * 1.8, scale)
      );

      return scale;
    } catch (e) {
      console.warn('[SkinManager] computeSkinScale error:', e);
      return PLAYER_SCALE;
    }
  }

  /**
   * Retourne le rectangle utile (sans marges transparentes) d'une image
   * @param {HTMLImageElement} img - L'image à analyser
   * @returns {Object|null} Les bounds {x, y, w, h} ou null
   * @private
   */
  _getVisibleBounds(img) {
    try {
      const w = img.width | 0;
      const h = img.height | 0;

      if (!w || !h) return null;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d', {
        willReadFrequently: true
      });
      ctx.drawImage(img, 0, 0);

      const data = ctx.getImageData(0, 0, w, h).data;
      let minX = w;
      let minY = h;
      let maxX = -1;
      let maxY = -1;
      const threshold = 10; // alpha > 10 = pixel visible

      for (let y = 0; y < h; y++) {
        const row = y * w * 4;
        for (let x = 0; x < w; x++) {
          const a = data[row + x * 4 + 3];
          if (a > threshold) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX < minX || maxY < minY) return null;

      return {
        x: minX,
        y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1
      };
    } catch (e) {
      console.warn('[SkinManager] getVisibleBounds error:', e);
      return null;
    }
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  /**
   * Retourne le total des coins dépensés pour les skins
   * @returns {number} Le total dépensé
   */
  getTotalSpent() {
    return this._state?.coinsSpent || 0;
  }

  /**
   * Réinitialise l'état des skins (à utiliser avec précaution)
   */
  reset() {
    this._initDefaultState();
  }

  /**
   * Force le rechargement de l'état depuis le stockage
   */
  refresh() {
    this._loadState();
  }

  /**
   * Retourne les informations sur un skin par son ID
   * @param {string} skinId - L'ID du skin
   * @returns {Object|null} Les informations du skin
   */
  getSkinInfo(skinId) {
    const skinState = this._state?.skins?.find(
      (s) => s.id === skinId
    );
    const skinDef = getSkinById(skinId);

    if (!skinDef) return null;

    return {
      ...skinDef,
      owned: skinState?.owned || false,
      selected: skinState?.selected || false
    };
  }
}

// Instance singleton
const skinManager = new SkinManager();

export default skinManager;
export { SkinManager };
