/**
 * LeaderboardManager.js - Gestionnaire du classement
 *
 * Gère la communication avec l'API backend pour :
 * - Soumission des scores
 * - Récupération du classement (paginé)
 * - Filtrage par période (global, semaine, mois)
 * - Support des modes Normal et Hard
 */

import { API_BASE } from '../config/constants.js';

// Référence au Telegram WebApp (si disponible)
const TG = window.Telegram?.WebApp || null;

// Scopes de filtrage disponibles
const SCOPES = {
  ALL: 'all',
  WEEK: 'week',
  MONTH: 'month'
};

// Modes de jeu
const MODES = {
  NORMAL: 'normal',
  HARD: 'hard'
};

class LeaderboardManager {
  constructor () {
    if (LeaderboardManager._instance) {
      return LeaderboardManager._instance;
    }

    LeaderboardManager._instance = this;

    this._cache = new Map();
    this._cacheDuration = 30000; // 30s
    this._loading = false;
    this._lastError = null;
  }

  // ============================================================
  // PRIVÉ
  // ============================================================

  _getTelegramInitData () {
    try {
      return TG?.initData || null;
    } catch {
      return null;
    }
  }

  _getCacheKey (isHard, page, scope) {
    return `${isHard ? 'hard' : 'normal'}_${scope}_${page}`;
  }

  _isCacheValid (key) {
    const cached = this._cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this._cacheDuration;
  }

  _getFromCache (key) {
    if (this._isCacheValid(key)) {
      return this._cache.get(key).data;
    }
    return null;
  }

  _setCache (key, data) {
    this._cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // ============================================================
  // SOUMISSION SCORE
  // ============================================================

  async postScore (score, isHard = false) {
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

      // On invalide le cache après envoi
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
  // RÉCUPÉRATION BRUTE (non formatée)
  // ============================================================

  async fetchLeaderboard (options = {}) {
    const {
      limit = 10,
      isHard = false,
      page = 1,
      scope = SCOPES.ALL,
      useCache = true
    } = options;

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
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('page', String(page));
      url.searchParams.set('scope', scope);
      if (isHard) {
        url.searchParams.set('mode', MODES.HARD);
      }
      url.searchParams.set('_', String(Date.now())); // anti-cache

      const response = await fetch(url.toString(), {
        cache: 'no-store'
      });

      if (!response.ok) {
        console.warn('[LeaderboardManager] Réponse non-OK:', response.status);
        return [];
      }

      const json = await response.json().catch(() => null);

      if (json?.ok && Array.isArray(json.list)) {
        this._setCache(cacheKey, json.list);
        return json.list;
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

  // ============================================================
  // ACCÈS FORMATÉ (ce que ton UI devrait utiliser)
  // ============================================================

  /**
   * Formate une entrée du leaderboard pour l'affichage
   */
  formatEntry (entry, rank) {
    return {
      rank,
      rankDisplay: String(rank).padStart(2, '0') + '.',
      name: entry.name || 'Player',
      score: entry.best || 0,
      scoreDisplay: String(entry.best || 0)
    };
  }

  /**
   * Formate une liste d'entrées avec les rangs
   */
  formatEntries (entries, startRank = 1) {
    return entries.map((entry, index) =>
      this.formatEntry(entry, startRank + index)
    );
  }

  /**
   * Classement global (formaté)
   */
  async getGlobalLeaderboard (limit = 10, isHard = false, page = 1) {
    const raw = await this.fetchLeaderboard({
      limit,
      isHard,
      page,
      scope: SCOPES.ALL
    });

    // On calcule le rang de départ (utile si tu ajoutes la pagination plus tard)
    const startRank = (page - 1) * limit + 1;
    return this.formatEntries(raw, startRank);
  }

  /**
   * Classement semaine (formaté)
   */
  async getWeeklyLeaderboard (limit = 10, isHard = false, page = 1) {
    const raw = await this.fetchLeaderboard({
      limit,
      isHard,
      page,
      scope: SCOPES.WEEK
    });
    const startRank = (page - 1) * limit + 1;
    return this.formatEntries(raw, startRank);
  }

  /**
   * Classement mois (formaté)
   */
  async getMonthlyLeaderboard (limit = 10, isHard = false, page = 1) {
    const raw = await this.fetchLeaderboard({
      limit,
      isHard,
      page,
      scope: SCOPES.MONTH
    });
    const startRank = (page - 1) * limit + 1;
    return this.formatEntries(raw, startRank);
  }

  // ============================================================
  // PAGINATION (formatée aussi)
  // ============================================================

  createPaginator (isHard = false, pageSize = 10) {
    let currentPage = 1;
    let currentScope = SCOPES.ALL;
    let lastResultLength = 0;

    const loadCurrent = async () => {
      const raw = await this.fetchLeaderboard({
        limit: pageSize,
        isHard,
        page: currentPage,
        scope: currentScope
      });
      lastResultLength = raw.length;
      const startRank = (currentPage - 1) * pageSize + 1;
      return this.formatEntries(raw, startRank);
    };

    return {
      loadPage: async (page) => {
        currentPage = Math.max(1, page);
        return loadCurrent();
      },

      loadFirst: async () => {
        currentPage = 1;
        return loadCurrent();
      },

      loadPrevious: async () => {
        if (currentPage > 1) {
          currentPage--;
          return loadCurrent();
        }
        return [];
      },

      loadNext: async () => {
        currentPage++;
        return loadCurrent();
      },

      setScope: async (scope) => {
        currentScope = scope;
        currentPage = 1;
        return loadCurrent();
      },

      getCurrentPage: () => currentPage,
      getCurrentScope: () => currentScope,
      hasPrevious: () => currentPage > 1,
      hasNext: () => lastResultLength >= pageSize
    };
  }

  // ============================================================
  // ÉTAT / CACHE
  // ============================================================

  isLoading () {
    return this._loading;
  }

  getLastError () {
    return this._lastError;
  }

  clearCache () {
    this._cache.clear();
  }

  setCacheDuration (duration) {
    this._cacheDuration = Math.max(0, duration);
  }
}

const leaderboardManager = new LeaderboardManager();

export default leaderboardManager;
export { LeaderboardManager, SCOPES, MODES };
