import crypto from "crypto"

export function generateDocumentFingerprint(text: string) {
  const normalized = text.toLowerCase().replace(/\s+/g, " ")
  return crypto.createHash("sha256").update(normalized).digest("hex")
}
