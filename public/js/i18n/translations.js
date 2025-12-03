/**
 * translations.js - Traductions du jeu Flappy Borgy
 * 
 * Ce fichier contient toutes les traductions du jeu en français et anglais.
 * Les traductions sont organisées par catégorie pour une meilleure lisibilité.
 */

// ============================================================
// TRADUCTIONS FRANÇAISES
// ============================================================

export const FR = {
  // ---- Menu principal ----
  MENU_PLAY: "Jouer",
  MENU_LEADERBOARD: "Leaderboard",
  MENU_QUESTS: "Quêtes 🔥",
  MENU_SHOP: "Borgy Coins Shop",
  MENU_VOTE: "🗳️ Voter pour Borgy",
  MENU_BUY: "Buy Borgy",
  MENU_HARD_ON: "Mode Hard : ON",
  MENU_HARD_OFF: "Mode Hard : OFF",

  // ---- Popup de bienvenue ----
  WELCOME_TITLE: "Bienvenue dans le jeu Flappy-Borgy !!!",
  WELCOME_L1: "L'objectif est de passer entre les tuyaux pour faire des points\net battre le record ;",
  WELCOME_L2: "- Utilise la touche espace ou le clic de la souris si tu es sur Telegram PC.\n  Si tu es sur mobile, un pouce suffit mais je te conseille les deux ;)",
  WELCOME_L3: "- Récupère des Borgy Coins pour acheter des skins.",
  WELCOME_L4: "- Des quêtes évolutives et journalières sont disponibles\n  (elles s'adaptent le lendemain en fonction de ton score).",
  WELCOME_L5: "- Le logo bonus vert apparaît de temps en temps et double le score\n  pendant un temps limité.",
  WELCOME_L6: "- Attention au robot vert qui sort des tuyaux.",
  WELCOME_L7: "- Si tu es bouillant, essaye le mode Hard : clique sur le bouton\n  Mode Hard ON/OFF, puis sur Jouer (les Borgy Coins sont doublés\n  dans ce mode).",
  WELCOME_END: "Voilà, fais-toi plaisir et LFG BORGY <3\n\nFait par un fan dévoué corps et âme à la team BORGY <3",
  WELCOME_OK: "OK, c'est parti !",
  WELCOME_MESSAGE: "Bienvenue ! Prêt à voler avec Borgy ?",
  
  // Aliases pour compatibilité (clés dotées → SNAKE_CASE)
  MENU_HARDMODE: "Mode Hard",

  // ---- Boutons de langue ----
  LANG_BTN_FR: "FR",
  LANG_BTN_EN: "EN",

  // ---- HUD / Infos en jeu ----
  HUD_SCORE: "Score :",
  HUD_COINS: "Borgy Coins :",
  FOOTER_TIP: "Tap/Espace pour sauter — évite les tuyaux",

  // ---- Quêtes ----
  QUESTS_TITLE: "Quêtes du jour",
  QUESTS_HARD_HINT: "(Récompenses x2 en Hard)",
  QUESTS_REWARD_LABEL: "Récompense :",
  QUESTS_TOTAL_COINS: "Total Borgy Coins :",

  // ---- Shop ----
  SHOP_TITLE: "Borgy Coins Shop",
  SHOP_CURRENT_COINS: "Tu as actuellement :",
  SHOP_CHOOSE_SKIN: "Choisis ton skin Borgy :",
  SHOP_BTN_BUY: "Acheter",
  SHOP_BTN_SELECTED: "Sélectionné",
  SHOP_BTN_USE: "Utiliser",
  SHOP_NOT_ENOUGH_COINS: "Pas assez de Borgy Coins !",
  SHOP_PRICE_FREE: "Gratuit",
  SHOP_PERK_GOLD: "Borgy Coins x5",
  SHOP_PERK_EMERALD: "Bonus SwissBorg x3",
  SHOP_PERK_DIAMOND: "1 vie supplémentaire",

  // ---- Commun ----
  COMMON_CLOSE: "Fermer",
  COMMON_OK: "OK",

  // ---- Leaderboard ----
  LEADERBOARD_TITLE: "Leaderboard",
  LEADERBOARD_TITLE_HARD: "Leaderboard (Hard)",
  LEADERBOARD_SCOPE_GLOBAL: "Global",
  LEADERBOARD_SCOPE_WEEK: "Semaine",
  LEADERBOARD_SCOPE_MONTH: "Mois",
  LEADERBOARD_PAGE_LABEL: "Page",

  // ---- Game Over ----
  GAME_OVER_TITLE: "Game Over",
  GAME_OVER_SCORE: "Score :",
  GAME_OVER_SHARE: "Partager mon score",
  GAME_OVER_REPLAY: "Rejouer",
  GAME_OVER_MENU: "Menu principal",

  // ---- Partage ----
  SHARE_TITLE: "Partager ton score",
  SHARE_HINT: "Choisis une plateforme ou copie le texte :",
  SHARE_COPY: "Copier le texte",
  SHARE_COPIED: "Copié !",
  SHARE_CLOSE: "Fermer",

  // ---- Réanimation ----
  REVIVE_TEXT: "Réanimation !",

  // ---- In-game (GameScene) ----
  GAME_TAPTOSTART: "Appuie pour commencer",
  GAME_GAMEOVER: "Game Over",
  GAME_SCORE: "Score",
  GAME_BESTSCORE: "Meilleur score",
  GAME_COINS: "pièces",
  GAME_PLAYAGAIN: "Rejouer",
  GAME_BACKTOMENU: "Menu",

  // ---- Tutoriel multi-step ----
  TUTORIAL_STEP1_TITLE: "Bienvenue dans \nFlappy Borgy !",
  TUTORIAL_STEP1_CONTENT: "Aide Borgy à voler entre les obstacles pour marquer des points.\n\nTap sur l'écran ou appuie sur ESPACE pour faire voler Borgy.",
  TUTORIAL_STEP2_TITLE: "Évite les obstacles",
  TUTORIAL_STEP2_CONTENT: "Passe entre les tuyaux verts pour marquer des points.\n\n⚠️ Attention aux nuages en haut et en bas !\n⚠️ Les robots verts sont dangereux !",
  TUTORIAL_STEP3_TITLE: "Collecte des bonus",
  TUTORIAL_STEP3_CONTENT: "🪙 Borgy Coins : Collecte-les pour acheter des skins\n\n✨ Bonus SwissBorg : Score x2 pendant 5 secondes\n\n🛡️ Certains skins ont des pouvoirs spéciaux !",
  TUTORIAL_STEP4_TITLE: "Quêtes & Classement",
  TUTORIAL_STEP4_CONTENT: "📜 Complète des quêtes quotidiennes pour gagner des coins\n\n🏆 Grimpe dans le classement mondial\n\n🔥 Mode Hard = Récompenses x2 !",
  TUTORIAL_SKIP: "Passer ✕",
  TUTORIAL_NEXT: "Suivant →",
  TUTORIAL_PREV: "← Précédent",
  TUTORIAL_START: "🚀 C'est parti !",

  // ---- Onboarding Shop ----
  SHOP_NEW_BADGE: "NOUVEAU",
  SHOP_UNLOCKED: "DÉBLOQUÉ",
  SHOP_PREVIEW: "Aperçu",
  
  // ---- Effets visuels ----
  EFFECT_NEW_RECORD: "NOUVEAU RECORD !",
  EFFECT_REVIVE: "REVIVE !"
};

// ============================================================
// TRADUCTIONS ANGLAISES
// ============================================================

export const EN = {
  // ---- Main menu ----
  MENU_PLAY: "Play",
  MENU_LEADERBOARD: "Leaderboard",
  MENU_QUESTS: "Quests 🔥",
  MENU_SHOP: "Borgy Coins Shop",
  MENU_VOTE: "🗳️ Vote for Borgy",
  MENU_BUY: "Buy Borgy",
  MENU_HARD_ON: "Hard Mode : ON",
  MENU_HARD_OFF: "Hard Mode : OFF",

  // ---- Welcome popup ----
  WELCOME_TITLE: "Welcome to Flappy-Borgy !!!",
  WELCOME_L1: "The goal is to fly between the pipes to score points\nand beat the high score;",
  WELCOME_L2: "- Use SPACE or mouse click if you're on Telegram PC.\n  On mobile, one thumb is enough but two are safer ;)",
  WELCOME_L3: "- Collect Borgy Coins to buy skins.",
  WELCOME_L4: "- You have daily and evolving quests\n  (they adapt the next day depending on your score).",
  WELCOME_L5: "- The green bonus logo appears sometimes and doubles your score\n  for a limited time.",
  WELCOME_L6: "- Beware of the green robot coming out of the pipes.",
  WELCOME_L7: "- If you're a degen, try Hard mode: toggle Hard Mode ON/OFF,\n  then press Play (Borgy Coins are doubled in this mode).",
  WELCOME_END: "Enjoy and LFG BORGY <3\n\nMade by a fan fully dedicated to the BORGY team <3",
  WELCOME_OK: "OK, let's go!",
  WELCOME_MESSAGE: "Welcome! Ready to fly with Borgy?",
  
  // Aliases for compatibility (dotted keys → SNAKE_CASE)
  MENU_HARDMODE: "Hard Mode",

  // ---- Language buttons ----
  LANG_BTN_FR: "FR",
  LANG_BTN_EN: "EN",

  // ---- HUD / In-game info ----
  HUD_SCORE: "Score:",
  HUD_COINS: "Borgy Coins:",
  FOOTER_TIP: "Tap/Space to jump — avoid the pipes",

  // ---- Quests ----
  QUESTS_TITLE: "Daily quests",
  QUESTS_HARD_HINT: "(Rewards x2 in Hard)",
  QUESTS_REWARD_LABEL: "Reward:",
  QUESTS_TOTAL_COINS: "Total Borgy Coins:",

  // ---- Shop ----
  SHOP_TITLE: "Borgy Coins Shop",
  SHOP_CURRENT_COINS: "You currently have:",
  SHOP_CHOOSE_SKIN: "Choose your Borgy skin:",
  SHOP_BTN_BUY: "Buy",
  SHOP_BTN_SELECTED: "Selected",
  SHOP_BTN_USE: "Use",
  SHOP_NOT_ENOUGH_COINS: "Not enough Borgy Coins!",
  SHOP_PRICE_FREE: "Free",
  SHOP_PERK_GOLD: "Borgy Coins x5",
  SHOP_PERK_EMERALD: "SwissBorg bonus x3",
  SHOP_PERK_DIAMOND: "1 extra life",

  // ---- Common ----
  COMMON_CLOSE: "Close",
  COMMON_OK: "OK",

  // ---- Leaderboard ----
  LEADERBOARD_TITLE: "Leaderboard",
  LEADERBOARD_TITLE_HARD: "Leaderboard (Hard)",
  LEADERBOARD_SCOPE_GLOBAL: "Global",
  LEADERBOARD_SCOPE_WEEK: "Week",
  LEADERBOARD_SCOPE_MONTH: "Month",
  LEADERBOARD_PAGE_LABEL: "Page",

  // ---- Game Over ----
  GAME_OVER_TITLE: "Game Over",
  GAME_OVER_SCORE: "Score:",
  GAME_OVER_SHARE: "Share my score",
  GAME_OVER_REPLAY: "Play again",
  GAME_OVER_MENU: "Main menu",

  // ---- Share ----
  SHARE_TITLE: "Share your score",
  SHARE_HINT: "Pick a platform or copy the text:",
  SHARE_COPY: "Copy text",
  SHARE_COPIED: "Copied!",
  SHARE_CLOSE: "Close",

  // ---- Revive ----
  REVIVE_TEXT: "Revive!",

  // ---- In-game (GameScene) ----
  GAME_TAPTOSTART: "Tap to start",
  GAME_GAMEOVER: "Game Over",
  GAME_SCORE: "Score",
  GAME_BESTSCORE: "Best score",
  GAME_COINS: "coins",
  GAME_PLAYAGAIN: "Play again",
  GAME_BACKTOMENU: "Menu",

  // ---- Multi-step tutorial ----
  TUTORIAL_STEP1_TITLE: "Welcome to Flappy Borgy!",
  TUTORIAL_STEP1_CONTENT: "Help Borgy fly between obstacles to score points.\n\nTap the screen or press SPACE to make Borgy fly.",
  TUTORIAL_STEP2_TITLE: "Avoid obstacles",
  TUTORIAL_STEP2_CONTENT: "Pass between green pipes to score points.\n\n⚠️ Watch out for clouds at top and bottom!\n⚠️ Green robots are dangerous!",
  TUTORIAL_STEP3_TITLE: "Collect bonuses",
  TUTORIAL_STEP3_CONTENT: "🪙 Borgy Coins: Collect them to buy skins\n\n✨ SwissBorg Bonus: Score x2 for 5 seconds\n\n🛡️ Some skins have special powers!",
  TUTORIAL_STEP4_TITLE: "Quests & Leaderboard",
  TUTORIAL_STEP4_CONTENT: "📜 Complete daily quests to earn coins\n\n🏆 Climb the global leaderboard\n\n🔥 Hard Mode = x2 Rewards!",
  TUTORIAL_SKIP: "Skip ✕",
  TUTORIAL_NEXT: "Next →",
  TUTORIAL_PREV: "← Previous",
  TUTORIAL_START: "🚀 Let's go!",

  // ---- Shop Onboarding ----
  SHOP_NEW_BADGE: "NEW",
  SHOP_UNLOCKED: "UNLOCKED",
  SHOP_PREVIEW: "Preview",
  
  // ---- Visual effects ----
  EFFECT_NEW_RECORD: "NEW RECORD!",
  EFFECT_REVIVE: "REVIVE!"
};

// ============================================================
// OBJET REGROUPANT TOUTES LES TRADUCTIONS
// ============================================================

/**
 * Objet contenant toutes les traductions indexées par code langue
 * @type {Object.<string, Object>}
 */
export const I18N = {
  fr: FR,
  en: EN
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default I18N;