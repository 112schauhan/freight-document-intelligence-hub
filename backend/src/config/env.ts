import dotenv from "dotenv"
import { logWarning } from "../utils/logger"

dotenv.config()

/** Cloud Postgres (e.g. Render, Neon) often require SSL; pg driver needs sslmode in the URL. */
function normalizeDatabaseUrl(url: string): string {
  if (!url) return url
  if (url.toLowerCase().includes("sslmode=")) return url
  const needsSsl =
    /render\.com|neon\.tech|supabase\.co|railway\.app/i.test(url)
  if (!needsSsl) return url
  try {
    const u = new URL(url)
    u.searchParams.set("sslmode", "require")
    return u.toString()
  } catch {
    return url
  }
}

const rawDatabaseUrl = process.env.DATABASE_URL || ""

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  DATABASE_URL: normalizeDatabaseUrl(rawDatabaseUrl) || rawDatabaseUrl,
  /** Directory for final stored documents (after approval). Relative to cwd or absolute. */
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  /** Directory for pending uploads (before approval). Relative to cwd or absolute. */
  PENDING_UPLOAD_DIR: process.env.PENDING_UPLOAD_DIR || "uploads/pending",
}

if (!env.ANTHROPIC_API_KEY) {
  logWarning("ANTHROPIC_API_KEY is not set. AI extraction will not work.")
}
