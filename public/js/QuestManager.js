/**
 * QuestManager.js - Gestionnaire des quêtes
 * 
 * Ce module gère le système de quêtes du jeu :
 * - Génération des quêtes quotidiennes
 * - Suivi de la progression
 * - Vérification des conditions de complétion
 * - Attribution des récompenses
 * 
 * @module QuestManager
 */

import storageManager from './StorageManager.js';
import coinManager from './CoinManager.js';

/**
 * Types de quêtes disponibles
 */
const QUEST_TYPES = {
  SCORE: 'score',
  BONUS: 'bonus',
  GAME: 'game'
};

/**
 * Classe singleton pour gérer les quêtes
 * @class
 */
class QuestManager {
  /**
   * Crée une instance du QuestManager
   */
  constructor() {
    if (QuestManager._instance) {
      return QuestManager._instance;
    }
    QuestManager._instance = this;

    /**
     * Données des quêtes (cache)
     * @type {Object|null}
     * @private
     */
    this._data = null;

    /**
     * Clé du jour actuel
     * @type {string}
     * @private
     */
    this._todayKey = this._generateTodayKey();

    // Charger les quêtes
    this._loadQuests();
  }

  // ============================================================
  // MÉTHODES PRIVÉES - UTILITAIRES
  // ============================================================

  /**
   * Génère la clé du jour actuel (format YYYY-MM-DD)
   * @returns {string} La clé du jour
   * @private
   */
  _generateTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Charge les quêtes depuis le stockage
   * @private
   */
  _loadQuests() {
    const saved = storageManager.loadQuests();
    this._todayKey = this._generateTodayKey();

    if (saved && saved.dayKey === this._todayKey && Array.isArray(saved.quests)) {
      this._data = saved;
    } else {
      // Générer de nouvelles quêtes quotidiennes
      this._data = this._generateDailyQuests();
      this._saveQuests();
    }
  }

  /**
   * Sauvegarde les quêtes dans le stockage
   * @private
   */
  _saveQuests() {
    if (this._data) {
      storageManager.saveQuests(this._data);
    }
  }

  /**
   * Génère les quêtes quotidiennes basées sur le meilleur score
   * @returns {Object} Les données des quêtes
   * @private
   */
  _generateDailyQuests() {
    const best = storageManager.loadLocalBestScore() || 20;
    const day = this._todayKey;

    // Calcul des objectifs adaptatifs
    const q1Target = Math.max(20, Math.round(best * 0.4));
    const q2Target = Math.max(q1Target + 30, Math.round(best * 1.1));
    const bonusCount = best < 80 ? 1 : (best < 150 ? 2 : 3);

    const quests = [
      {
        id: `score_q1_${day}`,
        title: `Atteins ${q1Target} points`,
        titleKey: 'QUEST_SCORE',
        titleParams: { target: q1Target },
        type: QUEST_TYPES.SCORE,
        target: q1Target,
        progress: 0,
        done: false,
        reward: `+${q1Target} BorgyCoins`,
        coins: q1Target,
        _rewardGiven: false
      },
      {
        id: `score_q2_${day}`,
        title: `Atteins ${q2Target} points`,
        titleKey: 'QUEST_SCORE',
        titleParams: { target: q2Target },
        type: QUEST_TYPES.SCORE,
        target: q2Target,
        progress: 0,
        done: false,
        reward: `+${q2Target} BorgyCoins`,
        coins: q2Target,
        _rewardGiven: false
      },
      {
        id: `bonus_q_${day}`,
        title: `Ramasse ${bonusCount} bonus`,
        titleKey: 'QUEST_BONUS',
        titleParams: { count: bonusCount },
        type: QUEST_TYPES.BONUS,
        target: bonusCount,
        progress: 0,
        done: false,
        reward: `+${bonusCount * 25} BorgyCoins`,
        coins: bonusCount * 25,
        _rewardGiven: false
      }
    ];

    return { dayKey: day, quests };
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Retourne les données complètes des quêtes
   * @returns {Object} Les données des quêtes
   */
  getData() {
    if (!this._data || this._data.dayKey !== this._generateTodayKey()) {
      this._loadQuests();
    }
    return { ...this._data };
  }

  /**
   * Retourne la liste des quêtes
   * @returns {Array} Les quêtes du jour
   */
  getQuests() {
    return this.getData().quests || [];
  }

  /**
   * Retourne une quête par son ID
   * @param {string} questId - L'ID de la quête
   * @returns {Object|null} La quête ou null
   */
  getQuestById(questId) {
    return this.getQuests().find(q => q.id === questId) || null;
  }

  /**
   * Retourne les quêtes complétées
   * @returns {Array} Les quêtes complétées
   */
  getCompletedQuests() {
    return this.getQuests().filter(q => q.done);
  }

  /**
   * Retourne les quêtes en cours
   * @returns {Array} Les quêtes non complétées
   */
  getPendingQuests() {
    return this.getQuests().filter(q => !q.done);
  }

  /**
   * Retourne le nombre de quêtes complétées
   * @returns {number}
   */
  getCompletedCount() {
    return this.getCompletedQuests().length;
  }

  /**
   * Retourne le nombre total de quêtes
   * @returns {number}
   */
  getTotalCount() {
    return this.getQuests().length;
  }

  /**
   * Vérifie si toutes les quêtes sont complétées
   * @returns {boolean}
   */
  areAllCompleted() {
    const quests = this.getQuests();
    return quests.length > 0 && quests.every(q => q.done);
  }

  // ============================================================
  // MISE À JOUR DE LA PROGRESSION
  // ============================================================

  /**
   * Met à jour la progression des quêtes en fonction d'un événement
   * @param {string} event - Type d'événement ('score', 'bonus', 'game')
   * @param {number} value - Valeur de l'événement
   * @returns {boolean} true si au moins une quête a été mise à jour
   */
  updateFromEvent(event, value) {
    if (!this._data) {
      this._loadQuests();
    }

    let changed = false;

    for (const quest of this._data.quests) {
      if (quest.done) continue;

      if (quest.type === QUEST_TYPES.SCORE && event === 'score') {
        // Pour les quêtes de score, on garde le maximum
        const newProgress = Math.max(quest.progress, value);
        if (newProgress !== quest.progress) {
          quest.progress = newProgress;
          if (quest.progress >= quest.target) {
            quest.done = true;
          }
          changed = true;
        }
      }

      if (quest.type === QUEST_TYPES.BONUS && event === 'bonus') {
        // Pour les bonus, on incrémente
        quest.progress += value;
        if (quest.progress >= quest.target) {
          quest.done = true;
        }
        changed = true;
      }

      if (quest.type === QUEST_TYPES.GAME && event === 'game') {
        // Pour les parties, on incrémente
        quest.progress += value;
        if (quest.progress >= quest.target) {
          quest.done = true;
        }
        changed = true;
      }
    }

    if (changed) {
      this._saveQuests();
    }

    return changed;
  }

  /**
   * Met à jour la progression d'une quête de score
   * @param {number} score - Le score atteint
   * @returns {boolean} true si mise à jour effectuée
   */
  updateScore(score) {
    return this.updateFromEvent('score', score);
  }

  /**
   * Incrémente le compteur de bonus collectés
   * @param {number} [count=1] - Nombre de bonus collectés
   * @returns {boolean} true si mise à jour effectuée
   */
  collectBonus(count = 1) {
    return this.updateFromEvent('bonus', count);
  }

  /**
   * Incrémente le compteur de parties jouées
   * @returns {boolean} true si mise à jour effectuée
   */
  playGame() {
    return this.updateFromEvent('game', 1);
  }

  // ============================================================
  // RÉCOMPENSES
  // ============================================================

  /**
   * Applique les récompenses des quêtes complétées
   * @param {boolean} [isHardMode=false] - Mode Hard (récompenses x2)
   * @returns {{totalGained: number, newBalance: number}} Résultat
   */
  applyRewards(isHardMode = false) {
    if (!this._data) {
      this._loadQuests();
    }

    let totalGained = 0;
    const multiplier = isHardMode ? 2 : 1;

    for (const quest of this._data.quests) {
      if (quest.done && !quest._rewardGiven && typeof quest.coins === 'number') {
        const gain = quest.coins * multiplier;
        totalGained += gain;
        quest._rewardGiven = true;
      }
    }

    if (totalGained > 0) {
      coinManager.add(totalGained, 'quest_reward');
      this._saveQuests();
    }

    return {
      totalGained,
      newBalance: coinManager.getBalance()
    };
  }

  /**
   * Vérifie si une quête a déjà été récompensée
   * @param {string} questId - L'ID de la quête
   * @returns {boolean} true si déjà récompensée
   */
  isRewarded(questId) {
    const quest = this.getQuestById(questId);
    return quest?._rewardGiven || false;
  }

  /**
   * Retourne le total des récompenses en attente
   * @param {boolean} [isHardMode=false] - Mode Hard (x2)
   * @returns {number} Le total des coins en attente
   */
  getPendingRewardsTotal(isHardMode = false) {
    const multiplier = isHardMode ? 2 : 1;
    
    return this.getQuests()
      .filter(q => q.done && !q._rewardGiven)
      .reduce((sum, q) => sum + (q.coins || 0) * multiplier, 0);
  }

  /**
   * Retourne le total des récompenses de toutes les quêtes
   * @param {boolean} [isHardMode=false] - Mode Hard (x2)
   * @returns {number} Le total possible
   */
  getTotalRewards(isHardMode = false) {
    const multiplier = isHardMode ? 2 : 1;
    
    return this.getQuests()
      .reduce((sum, q) => sum + (q.coins || 0) * multiplier, 0);
  }

  // ============================================================
  // AFFICHAGE ET FORMATAGE
  // ============================================================

  /**
   * Retourne les données formatées pour l'affichage
   * @param {boolean} [isHardMode=false] - Mode Hard
   * @returns {Array} Quêtes avec données de présentation
   */
  getDisplayData(isHardMode = false) {
    const multiplier = isHardMode ? 2 : 1;

    return this.getQuests().map(quest => ({
      id: quest.id,
      title: quest.title,
      type: quest.type,
      progress: quest.progress,
      target: quest.target,
      done: quest.done,
      percentage: Math.min(1, quest.progress / quest.target),
      reward: isHardMode ? `${quest.reward} (x2)` : quest.reward,
      coins: quest.coins * multiplier,
      rewarded: quest._rewardGiven
    }));
  }

  /**
   * Retourne la progression globale des quêtes
   * @returns {{completed: number, total: number, percentage: number}}
   */
  getOverallProgress() {
    const quests = this.getQuests();
    const completed = quests.filter(q => q.done).length;
    const total = quests.length;
    
    return {
      completed,
      total,
      percentage: total > 0 ? completed / total : 0
    };
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  /**
   * Force le rechargement des quêtes depuis le stockage
   */
  refresh() {
    this._loadQuests();
  }

  /**
   * Réinitialise les quêtes (génère de nouvelles quêtes)
   */
  reset() {
    this._todayKey = this._generateTodayKey();
    this._data = this._generateDailyQuests();
    this._saveQuests();
  }

  /**
   * Vérifie si les quêtes sont du jour actuel
   * @returns {boolean} true si les quêtes sont à jour
   */
  isUpToDate() {
    return this._data?.dayKey === this._generateTodayKey();
  }

  /**
   * Retourne la clé du jour actuel
   * @returns {string} Format YYYY-MM-DD
   */
  getTodayKey() {
    return this._generateTodayKey();
  }
}

// Instance singleton
const questManager = new QuestManager();

export default questManager;
export { QuestManager, QUEST_TYPES };