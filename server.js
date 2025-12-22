// server.js — FlappyBorgy Leaderboard (Express + Telegram WebApp + Supabase)
// ES Modules (package.json: "type": "module")

import express from "express";
import cors from "cors";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/* ---------- ENV ---------- */
const PORT = process.env.PORT || 8080;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN manquant");
if (!SUPABASE_URL) throw new Error("SUPABASE_URL manquant");
if (!SUPABASE_SERVICE_ROLE) throw new Error("SUPABASE_SERVICE_ROLE manquant");

/* ---------- Supabase ---------- */
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ---------- App & CORS ---------- */
const app = express();
app.set("trust proxy", 1);
app.set("etag", false);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

const ALLOWED_ORIGINS_RE = [
  /^https?:\/\/localhost(?::\d+)?$/i,
  /^https:\/\/flappyborgy.*\.onrender\.com$/i,
  /^https:\/\/rickprimec137-flappyborgyv15\.onrender\.com$/i,
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = ALLOWED_ORIGINS_RE.some((re) => re.test(origin));
      return cb(ok ? null : new Error("CORS not allowed"), ok);
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  })
);
app.options("*", cors());

app.use(express.json({ limit: "512kb" }));

/* ---------- Helpers ---------- */
function verifyInitData(initDataRaw, botToken) {
  if (!initDataRaw) return null;

  const url = new URLSearchParams(initDataRaw);
  const hash = url.get("hash");
  url.delete("hash");

  const dataCheck = [...url.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(dataCheck).digest("hex");
  if (hmac !== hash) return null;

  try {
    const obj = Object.fromEntries(new URLSearchParams(initDataRaw).entries());
    return JSON.parse(obj.user || "{}");
  } catch {
    return null;
  }
}

function sanitizeName(s) {
  if (!s) return "Player";
  return String(s).replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 32);
}

function normMode(m) {
  return typeof m === "string" && m.toLowerCase() === "hard" ? "hard" : "normal";
}

// Compat: scope=all|week|month OU period=global|week|month
function parsePeriod(q) {
  const scopeRaw = typeof q.scope === "string" ? q.scope : null;
  const periodRaw = typeof q.period === "string" ? q.period : null;

  if (periodRaw && ["global", "week", "month"].includes(periodRaw)) return periodRaw;
  if (scopeRaw && ["all", "week", "month"].includes(scopeRaw))
    return scopeRaw === "all" ? "global" : scopeRaw;
  return "global";
}

/**
 * ✅ Fenêtres CALENDRIER en UTC (sans dépendance)
 * - week  : depuis lundi 00:00 UTC (semaine ISO)
 * - month : depuis le 1er du mois 00:00 UTC
 *
 * ⚠️ Si tu veux “semaine/mois” selon l’heure France (Europe/Paris),
 * il faut une lib timezone (ex: luxon). Ici c’est UTC.
 */
function periodFromDateISO(period) {
  const now = new Date();

  if (period === "week") {
    // on part d'aujourd'hui à 00:00 UTC
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    let day = d.getUTCDay(); // 0=dimanche..6=samedi
    if (day === 0) day = 7;  // 7=dimanche pour logique ISO
    // recule jusqu'à lundi
    d.setUTCDate(d.getUTCDate() - (day - 1));
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  if (period === "month") {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  // global: pas utilisé (global lit la table "scores"), mais safe
  return new Date(0).toISOString();
}

/* ---------- Routes ---------- */
app.get("/", (_req, res) => res.json({ ok: true, service: "flappyborgy-leaderboard" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// POST /api/score { score:number, initData:string, mode?: "hard"|"normal" }
app.post("/api/score", async (req, res) => {
  try {
    const { score, initData, mode: modeRaw } = req.body || {};
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
      return res.status(400).json({ ok: false, error: "score invalide" });
    }

    const mode = normMode(modeRaw);
    const user = verifyInitData(initData, BOT_TOKEN);
    if (!user || !user.id) {
      return res.status(401).json({ ok: false, error: "initData invalide" });
    }

    const uid = String(user.id);
    const name =
      (user.username && "@" + user.username) ||
      sanitizeName([user.first_name, user.last_name].filter(Boolean).join(" ")) ||
      "Player";

    const val = Math.floor(score);

    // ✅ Historique: enregistre TOUJOURS le run
    {
      const { error: runErr } = await supabase.from("score_runs").insert({
        user_id: uid,
        mode,
        score: val,
      });
      if (runErr) {
        console.error("[DB] score_runs insert error", runErr);
        return res.status(500).json({ ok: false, error: "db insert run" });
      }
    }

    // All-time best
    const { data: row, error: selErr } = await supabase
      .from("scores")
      .select("best")
      .eq("user_id", uid)
      .eq("mode", mode)
      .maybeSingle();

    if (selErr) {
      console.error("[DB] select error", selErr);
      return res.status(500).json({ ok: false, error: "db select" });
    }

    if (!row) {
      const { error: insErr } = await supabase.from("scores").insert({
        user_id: uid,
        name,
        best: val,
        mode,
      });
      if (insErr) {
        console.error("[DB] insert error", insErr);
        return res.status(500).json({ ok: false, error: "db insert" });
      }
      console.log(`[SCORE][NEW] uid=${uid} mode=${mode} best=${val}`);
    } else if (val > row.best) {
      const { error: updErr } = await supabase
        .from("scores")
        .update({ best: val, name, updated_at: new Date().toISOString() })
        .eq("user_id", uid)
        .eq("mode", mode);

      if (updErr) {
        console.error("[DB] update error", updErr);
        return res.status(500).json({ ok: false, error: "db update" });
      }
      console.log(`[SCORE][UPD] uid=${uid} mode=${mode} best=${val}`);
    } else {
      const { error: updNameErr } = await supabase
        .from("scores")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("user_id", uid)
        .eq("mode", mode);

      if (updNameErr) console.warn("[DB] update name warn", updNameErr);
      console.log(`[SCORE][KEEP] uid=${uid} mode=${mode} best stays`);
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("POST /api/score error", e);
    return res.status(500).json({ ok: false, error: "server" });
  }
});

/**
 * GET /api/leaderboard
 * ?limit=10&page=1&mode=hard|normal
 * ?period=global|week|month  (ou scope=all|week|month)
 */
app.get("/api/leaderboard", async (req, res) => {
  try {
    const limitRaw = Number(req.query.limit) || 10;
    const pageRaw = Number(req.query.page) || 1;

    const limit = Math.min(100, Math.max(1, limitRaw));
    const page = Math.max(1, pageRaw);

    const mode = normMode(req.query.mode);
    const period = parsePeriod(req.query);

    const offset = (page - 1) * limit;

    // GLOBAL = all-time best depuis "scores"
    if (period === "global") {
      const from = offset;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from("scores")
        .select("user_id,name,best,updated_at,mode")
        .eq("mode", mode)
        .order("best", { ascending: false })
        .order("updated_at", { ascending: true })
        .range(from, to);

      if (error) {
        console.error("[DB] leaderboard global error", error);
        return res.status(500).json({ ok: false, error: "db" });
      }
      return res.json({ ok: true, list: data || [] });
    }

    // WEEK/MONTH = meilleur score réalisé dans la fenêtre (RPC SQL)
    const fromDate = periodFromDateISO(period);

    const { data: agg, error: aggErr } = await supabase.rpc("leaderboard_runs", {
      p_mode: mode,
      p_from: fromDate,
      p_limit: limit,
      p_offset: offset,
    });

    if (aggErr) {
      console.error("[DB] leaderboard runs error", aggErr);
      return res.status(500).json({ ok: false, error: "db" });
    }

    const ids = (agg || []).map((r) => r.user_id);

    // noms depuis "scores" (nom courant)
    let nameById = {};
    if (ids.length) {
      const { data: names, error: namesErr } = await supabase
        .from("scores")
        .select("user_id,name")
        .eq("mode", mode)
        .in("user_id", ids);

      if (namesErr) {
        console.warn("[DB] leaderboard names warn", namesErr);
      } else {
        nameById = Object.fromEntries((names || []).map((x) => [x.user_id, x.name]));
      }
    }

    const list = (agg || []).map((r) => ({
      user_id: r.user_id,
      name: nameById[r.user_id] || "Player",
      best: r.max_score ?? 0,
      updated_at: r.last_run,
      mode,
    }));

    return res.json({ ok: true, list });
  } catch (e) {
    console.error("GET /api/leaderboard error", e);
    return res.status(500).json({ ok: false, error: "server" });
  }
});

// GET /api/me?initData=...&mode=hard|normal
app.get("/api/me", async (req, res) => {
  try {
    const user = verifyInitData(req.query.initData, BOT_TOKEN);
    if (!user || !user.id) return res.status(401).json({ ok: false, error: "initData invalide" });

    const uid = String(user.id);
    const mode = normMode(req.query.mode);

    const { data, error } = await supabase
      .from("scores")
      .select("user_id,name,best,updated_at,mode")
      .eq("user_id", uid)
      .eq("mode", mode)
      .maybeSingle();

    if (error) {
      console.error("[DB] me error", error);
      return res.status(500).json({ ok: false, error: "db" });
    }

    return res.json({ ok: true, me: data || null });
  } catch (e) {
    console.error("GET /api/me error", e);
    return res.status(500).json({ ok: false, error: "server" });
  }
});

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log("Leaderboard server (Supabase) on port", PORT);
});
