/**
 * LeaderboardManager.js - Gestionnaire du classement
 *
 * Ce module gère la communication avec l'API backend pour :
 * - Soumission des scores
 * - Récupération du classement (paginé)
 * - Filtrage par période (global, semaine, mois)
 * - Support des modes Normal et Hard
 *
 * @module LeaderboardManager
 */

import { API_BASE } from '../config/constants.js';

/**
 * Référence au Telegram WebApp (si disponible)
 */
const TG = window.Telegram?.WebApp || null;

/**
 * Scopes de filtrage disponibles
 */
const SCOPES = {
  ALL: 'all',
  WEEK: 'week',
  MONTH: 'month'
};

/**
 * Modes de jeu
 */
const MODES = {
  NORMAL: 'normal',
  HARD: 'hard'
};

/**
 * Classe singleton pour gérer le leaderboard
 * @class
 */
class LeaderboardManager {
  /**
   * Crée une instance du LeaderboardManager
   */
  constructor() {
    if (LeaderboardManager._instance) {
      return LeaderboardManager._instance;
    }
    LeaderboardManager._instance = this;

    /**
     * Cache du leaderboard
     * @type {Map<string, {data: Array, timestamp: number}>}
     * @private
     */
    this._cache = new Map();

    /**
     * Durée de validité du cache en ms (30 secondes)
     * @type {number}
     * @private
     */
    this._cacheDuration = 30000;

    /**
     * État de chargement
     * @type {boolean}
     * @private
     */
    this._loading = false;

    /**
     * Dernière erreur
     * @type {Error|null}
     * @private
     */
    this._lastError = null;
  }

  // ============================================================
  // MÉTHODES PRIVÉES
  // ============================================================

  /**
   * Retourne les données d'initialisation Telegram
   * @returns {string|null} Les données ou null
   * @private
   */
  _getTelegramInitData() {
    try {
      return TG?.initData || null;
    } catch {
      return null;
    }
  }

  /**
   * Génère une clé de cache
   * @param {boolean} isHard - Mode Hard
   * @param {number} page - Numéro de page
   * @param {string} scope - Scope temporel
   * @returns {string} La clé de cache
   * @private
   */
  _getCacheKey(isHard, page, scope) {
    return `${isHard ? 'hard' : 'normal'}_${scope}_${page}`;
  }

  /**
   * Vérifie si le cache est valide
   * @param {string} key - La clé de cache
   * @returns {boolean} true si le cache est valide
   * @private
   */
  _isCacheValid(key) {
    const cached = this._cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this._cacheDuration;
  }

  /**
   * Récupère les données du cache
   * @param {string} key - La clé de cache
   * @returns {Array|null} Les données ou null
   * @private
   */
  _getFromCache(key) {
    if (this._isCacheValid(key)) {
      return this._cache.get(key).data;
    }
    return null;
  }

  /**
   * Stocke les données dans le cache
   * @param {string} key - La clé de cache
   * @param {Array} data - Les données à stocker
   * @private
   */
  _setCache(key, data) {
    this._cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Normalise UNE entrée de leaderboard pour que
   * le front ait toujours les mêmes champs:
   *   - name
   *   - best   (score)
   *   - rank
   *
   * @param {Object} entry - Entrée brute renvoyée par l'API
   * @param {number} index - Index dans la liste (0-based)
   * @returns {Object} Entrée normalisée
   * @private
   */
  _normalizeEntry(entry, index) {
    // On essaie plein de noms de champs possibles
    const score =
      entry.best ??
      entry.best_score ??
      entry.score ??
      entry.points ??
      entry.value ??
      entry.max_score ??
      entry.highscore ??
      0;

    const name =
      entry.name ??
      entry.username ??
      entry.user ??
      entry.telegram_username ??
      entry.tg_username ??
      entry.handle ??
      `Player ${index + 1}`;

    const rank =
      entry.rank ??
      entry.position ??
      entry.place ??
      index + 1;

    const normalized = {
      ...entry,
      name,
      best: score,
      rank
    };

    // Log debug pour vérifier ce qui arrive de l'API
    console.log('[LeaderboardManager] raw entry:', entry, '=> normalized:', normalized);

    return normalized;
  }

  /**
   * Normalise une liste d'entrées
   * @param {Array} list
   * @returns {Array}
   * @private
   */
  _normalizeList(list) {
    return list.map((e, i) => this._normalizeEntry(e, i));
  }

  // ============================================================
  // SOUMISSION DES SCORES
  // ============================================================

  /**
   * Soumet un score au serveur
   * @param {number} score - Le score à soumettre
   * @param {boolean} [isHard=false] - Mode Hard
   * @returns {Promise<{success: boolean, error?: string}>} Résultat de la soumission
   */
  async postScore(score, isHard = false) {
    const initData = this._getTelegramInitData();

    if (!initData) {
      console.warn('[LeaderboardManager] Pas de données Telegram, score non soumis');
      return { success: false, error: 'no_telegram_data' };
    }

    try {
      this._loading = true;
      this._lastError = null;

      const response = await fetch(`${API_BASE}/api/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score,
          initData,
          mode: isHard ? MODES.HARD : MODES.NORMAL
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Invalider le cache après soumission
      this.clearCache();

      return { success: true };
    } catch (error) {
      console.warn('[LeaderboardManager] Erreur soumission score:', error);
      this._lastError = error;
      return { success: false, error: error.message };
    } finally {
      this._loading = false;
    }
  }

  // ============================================================
  // RÉCUPÉRATION DU CLASSEMENT
  // ============================================================

  /**
   * Récupère le classement depuis l'API
   * @param {Object} options - Options de requête
   * @param {number} [options.limit=10] - Nombre d'entrées par page
   * @param {boolean} [options.isHard=false] - Mode Hard
   * @param {number} [options.page=1] - Numéro de page
   * @param {string} [options.scope='all'] - Scope temporel ('all', 'week', 'month')
   * @param {boolean} [options.useCache=true] - Utiliser le cache
   * @returns {Promise<Array>} Liste des entrées du classement (normalisées)
   */
  async fetchLeaderboard(options = {}) {
    const {
      limit = 10,
      isHard = false,
      page = 1,
      scope = SCOPES.ALL,
      useCache = true
    } = options;

    // Vérifier le cache
    const cacheKey = this._getCacheKey(isHard, page, scope);
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      this._loading = true;
      this._lastError = null;

      const url = new URL(`${API_BASE}/api/leaderboard`);
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('page', page.toString());
      url.searchParams.set('scope', scope);
      if (isHard) {
        url.searchParams.set('mode', MODES.HARD);
      }
      // Anti-cache pour éviter les résultats stales
      url.searchParams.set('_', Date.now().toString());

      const response = await fetch(url.toString(), {
        cache: 'no-store'
      });

      if (!response.ok) {
        console.warn('[LeaderboardManager] Réponse non-OK:', response.status);
        return [];
      }

      const json = await response.json().catch(() => null);

      if (json?.ok && Array.isArray(json.list)) {
        // Normaliser pour que le front ait toujours .name et .best
        const normalized = this._normalizeList(json.list);
        this._setCache(cacheKey, normalized);
        return normalized;
      }

      return [];
    } catch (error) {
      console.warn('[LeaderboardManager] Erreur fetch leaderboard:', error);
      this._lastError = error;
      return [];
    } finally {
      this._loading = false;
    }
  }

  /**
   * Récupère le classement global (toutes périodes)
   */
  async getGlobalLeaderboard(limit = 10, isHard = false, page = 1) {
    return this.fetchLeaderboard({
      limit,
      isHard,
      page,
      scope: SCOPES.ALL
    });
  }

  /**
   * Récupère le classement de la semaine
   */
  async getWeeklyLeaderboard(limit = 10, isHard = false, page = 1) {
    return this.fetchLeaderboard({
      limit,
      isHard,
      page,
      scope: SCOPES.WEEK
    });
  }

  /**
   * Récupère le classement du mois
   */
  async getMonthlyLeaderboard(limit = 10, isHard = false, page = 1) {
    return this.fetchLeaderboard({
      limit,
      isHard,
      page,
      scope: SCOPES.MONTH
    });
  }

  // ============================================================
  // NAVIGATION PAGINÉE
  // ============================================================

  createPaginator(isHard = false, pageSize = 10) {
    let currentPage = 1;
    let currentScope = SCOPES.ALL;
    let lastResultLength = 0;

    return {
      loadPage: async (page) => {
        currentPage = Math.max(1, page);
        const result = await this.fetchLeaderboard({
          limit: pageSize,
          isHard,
          page: currentPage,
          scope: currentScope
        });
        lastResultLength = result.length;
        return result;
      },

      loadFirst: async () => {
        currentPage = 1;
        const result = await this.fetchLeaderboard({
          limit: pageSize,
          isHard,
          page: currentPage,
          scope: currentScope
        });
        lastResultLength = result.length;
        return result;
      },

      loadPrevious: async () => {
        if (currentPage > 1) {
          currentPage--;
          const result = await this.fetchLeaderboard({
            limit: pageSize,
            isHard,
            page: currentPage,
            scope: currentScope
          });
          lastResultLength = result.length;
          return result;
        }
        return [];
      },

      loadNext: async () => {
        currentPage++;
        const result = await this.fetchLeaderboard({
          limit: pageSize,
          isHard,
          page: currentPage,
          scope: currentScope
        });
        lastResultLength = result.length;
        return result;
      },

      setScope: async (scope) => {
        currentScope = scope;
        currentPage = 1;
        const result = await this.fetchLeaderboard({
          limit: pageSize,
          isHard,
          page: 1,
          scope: currentScope
        });
        lastResultLength = result.length;
        return result;
      },

      getCurrentPage: () => currentPage,
      getCurrentScope: () => currentScope,
      hasPrevious: () => currentPage > 1,
      hasNext: () => lastResultLength >= pageSize
    };
  }

  // ============================================================
  // ÉTAT ET CACHE
  // ============================================================

  isLoading() {
    return this._loading;
  }

  getLastError() {
    return this._lastError;
  }

  clearCache() {
    this._cache.clear();
  }

  setCacheDuration(duration) {
    this._cacheDuration = Math.max(0, duration);
  }

  // ============================================================
  // FORMATAGE POUR L'UI (si tu l'utilises)
  // ============================================================

  formatEntry(entry, rank) {
    const best =
      entry.best ??
      entry.best_score ??
      entry.score ??
      entry.points ??
      entry.value ??
      0;

    const name =
      entry.name ??
      entry.username ??
      entry.user ??
      entry.telegram_username ??
      entry.tg_username ??
      `Player ${rank}`;

    return {
      rank,
      rankDisplay: String(rank).padStart(2, '0') + '.',
      name,
      score: best,
      scoreDisplay: String(best)
    };
  }

  formatEntries(entries, startRank = 1) {
    return entries.map((entry, index) =>
      this.formatEntry(entry, startRank + index)
    );
  }
}

// Instance singleton
const leaderboardManager = new LeaderboardManager();

export default leaderboardManager;
export { LeaderboardManager, SCOPES, MODES };
