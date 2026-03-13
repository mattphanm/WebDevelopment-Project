import express from "express";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { getEnvVar } from "./getEnvVar.js";

const PORT = Number.parseInt(getEnvVar("PORT", false), 10) || 3000;
const MARKET_API_BASE = (
  getEnvVar("MARKET_API_BASE", false) || "https://financialmodelingprep.com/api/v3"
).replace(/\/$/, "");
const MARKET_API_KEY = getEnvVar("MARKET_API_KEY", false);
const JWT_SECRET = getEnvVar("AUTH_JWT_SECRET", false) || "dev-only-secret-change-me";
const DEFAULT_SYMBOLS = ["SGOV", "AOR", "SCHD"];
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = getEnvVar("AUTH_DB_PATH", false) || join(__dirname, "../data/auth.sqlite");
const dailySnapshotPath =
  getEnvVar("MARKET_DAILY_SNAPSHOT_PATH", false) || join(__dirname, "../data/daily-market-snapshot.json");

mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

const app = express();

const fallbackDailySnapshot = {
  updatedAt: "2026-03-13",
  source: "manual",
  quotes: [
    { symbol: "SGOV", name: "Treasury Bond Ladder", price: 100.56, changePercent: 0.09 },
    { symbol: "AOR", name: "Balanced Index Portfolio", price: 60.44, changePercent: 0.37 },
    { symbol: "SCHD", name: "Dividend Growth Basket", price: 82.15, changePercent: 0.38 },
  ],
};

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, salt, expectedHash) {
  const computedHash = scryptSync(password, salt, 64).toString("hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");
  if (expectedBuffer.length !== computedBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, computedBuffer);
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = normalized.length % 4;
  const padded = remainder ? normalized.padEnd(normalized.length + (4 - remainder), "=") : normalized;
  return Buffer.from(padded, "base64").toString("utf8");
}

function signJwt(payload, expiresInSeconds = 2 * 60 * 60) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token) {
  try {
    const [encodedHeader, encodedPayload, signature] = String(token || "").split(".");
    if (!encodedHeader || !encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = createHmac("sha256", JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");
    if (expectedBuffer.length !== signatureBuffer.length) {
      return null;
    }
    if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (!payload?.exp || Math.floor(Date.now() / 1000) >= payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function findUserByEmail(email) {
  return db.prepare("SELECT id, email, password_hash, password_salt FROM users WHERE email = ?").get(email);
}

function findUserById(id) {
  return db.prepare("SELECT id, email FROM users WHERE id = ?").get(id);
}

function createUser(email, passwordHash, passwordSalt) {
  return db
    .prepare("INSERT INTO users (email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?)")
    .run(email, passwordHash, passwordSalt, new Date().toISOString());
}

function getBearerToken(req) {
  const header = String(req.headers.authorization || "");
  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return header.slice(7).trim();
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Market API request failed: HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function requireMarketApiKey(res) {
  if (!MARKET_API_KEY) {
    res.status(500).json({ error: "MARKET_API_KEY is not configured." });
    return false;
  }

  return true;
}

function loadDailySnapshot() {
  if (!existsSync(dailySnapshotPath)) {
    return fallbackDailySnapshot;
  }

  try {
    const parsed = JSON.parse(readFileSync(dailySnapshotPath, "utf8"));
    const quotes = Array.isArray(parsed?.quotes) ? parsed.quotes : [];
    if (quotes.length === 0) {
      return fallbackDailySnapshot;
    }

    return {
      updatedAt: String(parsed.updatedAt || fallbackDailySnapshot.updatedAt),
      source: String(parsed.source || "manual"),
      quotes: quotes
        .filter((item) => item?.symbol)
        .map((item) => ({
          symbol: String(item.symbol).toUpperCase(),
          name: item.name || item.symbol,
          price: Number(item.price) || 0,
          changePercent: Number(item.changePercent) || 0,
        })),
    };
  } catch {
    return fallbackDailySnapshot;
  }
}

app.get("/hello", (req, res) => {
  res.send("Hello, World");
});

app.get("/api/market/daily-snapshot", (req, res) => {
  res.json(loadDailySnapshot());
});

app.post("/api/auth/register", (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Provide a valid email address." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    res.status(409).json({ error: "User already exists." });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const insertResult = createUser(email, hash, salt);
  const user = { id: Number(insertResult.lastInsertRowid), email };
  const token = signJwt({ sub: String(user.id), email });

  res.status(201).json({ token, user });
});

app.post("/api/auth/login", (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!isValidEmail(email) || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const token = signJwt({ sub: String(user.id), email: user.email });
  res.json({ token, user: { id: user.id, email: user.email } });
});

app.get("/api/auth/me", (req, res) => {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  const payload = verifyJwt(token);
  if (!payload?.sub) {
    res.status(401).json({ error: "Invalid or expired token." });
    return;
  }

  const user = findUserById(Number(payload.sub));
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  res.json({ user });
});

app.get("/api/market/etfs", async (req, res) => {
  if (!requireMarketApiKey(res)) {
    return;
  }

  const rawSymbols = String(req.query.symbols || DEFAULT_SYMBOLS.join(","));
  const symbols = rawSymbols
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 15);

  if (symbols.length === 0) {
    res.status(400).json({ error: "Provide at least one ETF symbol." });
    return;
  }

  const url = `${MARKET_API_BASE}/quote/${symbols.join(",")}?apikey=${encodeURIComponent(MARKET_API_KEY)}`;

  try {
    const payload = await fetchJson(url);
    const quotes = Array.isArray(payload)
      ? payload.map((item) => ({
          symbol: item.symbol,
          name: item.name || item.symbol,
          price: Number(item.price) || 0,
          changePercent: Number(item.changesPercentage) || 0,
        }))
      : [];

    res.json({ quotes });
  } catch (error) {
    res.status(502).json({ error: "Failed to fetch ETF quotes.", detail: String(error?.message || error) });
  }
});

app.get("/api/market/etfs/:symbol/history", async (req, res) => {
  if (!requireMarketApiKey(res)) {
    return;
  }

  const symbol = String(req.params.symbol || "").trim().toUpperCase();
  const points = Math.min(Math.max(Number.parseInt(String(req.query.points || "30"), 10) || 30, 2), 90);

  if (!symbol) {
    res.status(400).json({ error: "ETF symbol is required." });
    return;
  }

  const url = `${MARKET_API_BASE}/historical-price-full/${encodeURIComponent(symbol)}?timeseries=${points}&serietype=line&apikey=${encodeURIComponent(MARKET_API_KEY)}`;

  try {
    const payload = await fetchJson(url);
    const historicalRows = Array.isArray(payload?.historical) ? payload.historical : [];
    const history = historicalRows
      .map((row) => Number(row.close))
      .filter((value) => Number.isFinite(value))
      .reverse();

    res.json({ symbol, history });
  } catch (error) {
    res.status(502).json({ error: "Failed to fetch ETF history.", detail: String(error?.message || error) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}.  CTRL+C to stop.`);
});
