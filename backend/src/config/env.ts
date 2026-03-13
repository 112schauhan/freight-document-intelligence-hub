import dotenv from "dotenv"
import { logWarning } from "../utils/logger"

dotenv.config()

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
}

if (!env.ANTHROPIC_API_KEY) {
  logWarning("ANTHROPIC_API_KEY is not set. AI extraction will not work.")
}
