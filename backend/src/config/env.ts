import dotenv from "dotenv"
import { logWarning } from "../utils/logger"

dotenv.config()

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  DATABASE_URL: process.env.DATABASE_URL || "",
  /** Directory for final stored documents (after approval). Relative to cwd or absolute. */
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  /** Directory for pending uploads (before approval). Relative to cwd or absolute. */
  PENDING_UPLOAD_DIR: process.env.PENDING_UPLOAD_DIR || "uploads/pending",
}

if (!env.ANTHROPIC_API_KEY) {
  logWarning("ANTHROPIC_API_KEY is not set. AI extraction will not work.")
}
