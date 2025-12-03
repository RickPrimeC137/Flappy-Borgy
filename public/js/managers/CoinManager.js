/**
 * CoinManager.js - Gestionnaire des Borgy Coins
 * 
 * Ce module gère la monnaie virtuelle du jeu :
 * - Suivi du solde de coins
 * - Ajout et retrait de coins
 * - Calcul des gains selon les modes (Hard, skins spéciaux)
 * - Sauvegarde automatique via StorageManager
 * 
 * @module CoinManager
 */

import storageManager from './StorageManager.js';

/**
 * Classe singleton pour gérer les Borgy Coins
 * @class
 */
class CoinManager {
  /**
   * Crée une instance du CoinManager
   */
  constructor() {
    if (CoinManager._instance) {
      return CoinManager._instance;
    }
    CoinManager._instance = this;

    /**
     * Solde actuel de coins (cache)
     * @type {number}
     * @private
     */
    this._balance = 0;

    /**
     * Multiplicateur de coins actif
     * @type {number}
     * @private
     */
    this._multiplier = 1;

    /**
     * Historique des transactions de la session
     * @type {Array<{type: string, amount: number, timestamp: number}>}
     * @private
     */
    this._history = [];

    // Charger le solde initial
    this._loadBalance();
  }

  // ============================================================
  // MÉTHODES PRIVÉES
  // ============================================================

  /**
   * Charge le solde depuis le stockage
   * @private
   */
  _loadBalance() {
    this._balance = storageManager.loadBorgyCoins();
  }

  /**
   * Sauvegarde le solde dans le stockage
   * @private
   */
  _saveBalance() {
    storageManager.saveBorgyCoins(this._balance);
  }

  /**
   * Ajoute une entrée à l'historique
   * @param {string} type - Type de transaction
   * @param {number} amount - Montant (positif ou négatif)
   * @private
   */
  _addToHistory(type, amount) {
    this._history.push({
      type,
      amount,
      timestamp: Date.now()
    });

    // Garder seulement les 100 dernières transactions
    if (this._history.length > 100) {
      this._history.shift();
    }
  }

  // ============================================================
  // MÉTHODES DE SOLDE
  // ============================================================

  /**
   * Retourne le solde actuel de coins
   * @returns {number} Le nombre de coins
   */
  getBalance() {
    return this._balance;
  }

  /**
   * Recharge le solde depuis le stockage
   * @returns {number} Le solde mis à jour
   */
  refresh() {
    this._loadBalance();
    return this._balance;
  }

  /**
   * Définit directement le solde (à utiliser avec précaution)
   * @param {number} amount - Le nouveau solde
   */
  setBalance(amount) {
    const oldBalance = this._balance;
    this._balance = Math.max(0, amount | 0);
    this._saveBalance();
    this._addToHistory('set', this._balance - oldBalance);
  }

  // ============================================================
  // MÉTHODES D'AJOUT/RETRAIT
  // ============================================================

  /**
   * Ajoute des coins au solde
   * @param {number} amount - Le nombre de coins à ajouter
   * @param {string} [source='generic'] - La source des coins
   * @returns {number} Le nouveau solde
   */
  add(amount, source = 'generic') {
    if (amount <= 0) return this._balance;

    const effectiveAmount = Math.max(0, amount | 0) * this._multiplier;
    this._balance += effectiveAmount;
    this._saveBalance();
    this._addToHistory(source, effectiveAmount);

    return this._balance;
  }

  /**
   * Retire des coins du solde
   * @param {number} amount - Le nombre de coins à retirer
   * @param {string} [source='generic'] - La raison du retrait
   * @returns {{success: boolean, newBalance: number}} Résultat de l'opération
   */
  remove(amount, source = 'generic') {
    if (amount <= 0) {
      return { success: true, newBalance: this._balance };
    }

    const effectiveAmount = Math.max(0, amount | 0);
    
    if (this._balance < effectiveAmount) {
      return { success: false, newBalance: this._balance };
    }

    this._balance -= effectiveAmount;
    this._saveBalance();
    this._addToHistory(source, -effectiveAmount);

    return { success: true, newBalance: this._balance };
  }

  /**
   * Vérifie si le joueur peut dépenser un montant
   * @param {number} amount - Le montant à vérifier
   * @returns {boolean} true si le joueur a assez de coins
   */
  canAfford(amount) {
    return this._balance >= amount;
  }

  // ============================================================
  // GAINS EN JEU
  // ============================================================

  /**
   * Calcule et ajoute les gains d'une pièce collectée en jeu
   * @param {Object} options - Options de gain
   * @param {boolean} [options.isHardMode=false] - Mode Hard activé
   * @param {boolean} [options.isGoldSkin=false] - Skin Gold équipé
   * @returns {{gain: number, newBalance: number}} Le gain et le nouveau solde
   */
  collectCoin(options = {}) {
    const { isHardMode = false, isGoldSkin = false } = options;

    let gain;
    if (isGoldSkin) {
      // Skin Gold : toujours x5
      gain = 5;
    } else {
      // Hard mode : x2, sinon x1
      gain = isHardMode ? 2 : 1;
    }

    this.add(gain, 'coin_collect');

    return {
      gain,
      newBalance: this._balance
    };
  }

  /**
   * Ajoute les coins d'une récompense de quête
   * @param {number} baseAmount - Le montant de base de la récompense
   * @param {boolean} [isHardMode=false] - Mode Hard activé (x2)
   * @returns {{gain: number, newBalance: number}} Le gain et le nouveau solde
   */
  addQuestReward(baseAmount, isHardMode = false) {
    const multiplier = isHardMode ? 2 : 1;
    const gain = baseAmount * multiplier;

    this.add(gain, 'quest_reward');

    return {
      gain,
      newBalance: this._balance
    };
  }

  // ============================================================
  // DÉPENSES
  // ============================================================

  /**
   * Achète un item (skin, etc.)
   * @param {number} price - Le prix de l'item
   * @param {string} [itemId='unknown'] - L'identifiant de l'item
   * @returns {{success: boolean, newBalance: number, reason?: string}} Résultat de l'achat
   */
  purchase(price, itemId = 'unknown') {
    if (price <= 0) {
      return { success: true, newBalance: this._balance };
    }

    if (!this.canAfford(price)) {
      return { 
        success: false, 
        newBalance: this._balance,
        reason: 'not_enough_coins'
      };
    }

    const result = this.remove(price, `purchase_${itemId}`);
    return {
      success: result.success,
      newBalance: result.newBalance
    };
  }

  // ============================================================
  // MULTIPLICATEURS
  // ============================================================

  /**
   * Définit un multiplicateur de gain temporaire
   * @param {number} multiplier - Le multiplicateur (1 = normal)
   */
  setMultiplier(multiplier) {
    this._multiplier = Math.max(1, multiplier);
  }

  /**
   * Réinitialise le multiplicateur à 1
   */
  resetMultiplier() {
    this._multiplier = 1;
  }

  /**
   * Retourne le multiplicateur actuel
   * @returns {number} Le multiplicateur
   */
  getMultiplier() {
    return this._multiplier;
  }

  // ============================================================
  // HISTORIQUE
  // ============================================================

  /**
   * Retourne l'historique des transactions de la session
   * @returns {Array<{type: string, amount: number, timestamp: number}>}
   */
  getHistory() {
    return [...this._history];
  }

  /**
   * Retourne le total gagné pendant la session
   * @returns {number} Le total des gains
   */
  getSessionEarnings() {
    return this._history
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Retourne le total dépensé pendant la session
   * @returns {number} Le total des dépenses (valeur positive)
   */
  getSessionSpending() {
    return Math.abs(
      this._history
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );
  }

  /**
   * Efface l'historique de la session
   */
  clearHistory() {
    this._history = [];
  }

  // ============================================================
  // FORMATAGE
  // ============================================================

  /**
   * Formate le solde pour l'affichage
   * @param {boolean} [withEmoji=true] - Ajouter l'emoji 🪙
   * @returns {string} Le solde formaté
   */
  formatBalance(withEmoji = true) {
    const formatted = this._balance.toLocaleString();
    return withEmoji ? `🪙 ${formatted}` : formatted;
  }

  /**
   * Formate un montant pour l'affichage
   * @param {number} amount - Le montant à formater
   * @param {boolean} [showSign=false] - Afficher le signe +/-
   * @returns {string} Le montant formaté
   */
  formatAmount(amount, showSign = false) {
    const formatted = Math.abs(amount).toLocaleString();
    if (showSign) {
      return amount >= 0 ? `+${formatted}` : `-${formatted}`;
    }
    return formatted;
  }
}

// Instance singleton
const coinManager = new CoinManager();

export default coinManager;
export { CoinManager };