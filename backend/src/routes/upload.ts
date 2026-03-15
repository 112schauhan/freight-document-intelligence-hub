import type { FastifyInstance } from "fastify"
import { processDocumentExtractionOnly } from "../services/documentProcessor"
import { logError } from "../utils/logger"
import path from "path"
import fs from "fs"
import { pipeline } from "stream/promises"
import { randomUUID } from "crypto"
import { env } from "../config/env"

/** Infer document type from filename (e.g. commercial invoice, packing list, bill of lading). */
function inferDocumentTypeFromFileName(fileName: string): string | null {
  const lower = fileName.toLowerCase()
  const hasInvoice = lower.includes("invoice")
  const hasPacking = lower.includes("packing")
  const hasBillOfLading = lower.includes("bill") && lower.includes("lading")
  const hasBol = lower.includes("bol") || lower.includes("b/l")
  if (hasBillOfLading || hasBol) return "bill_of_lading"
  if (hasInvoice && hasPacking) return "commercial_invoice_packing_list"
  if (hasInvoice) return "commercial_invoice"
  if (hasPacking) return "packing_list"
  return null
}

/** Infer document type from extracted text (e.g. commodity or other fields mention doc type). */
function inferDocumentTypeFromExtraction(extraction: Record<string, string | null> | null): string | null {
  if (!extraction || typeof extraction !== "object") return null
  const combined = Object.values(extraction)
    .filter((v): v is string => v != null && v.length > 0)
    .join(" ")
    .toLowerCase()
  if (combined.includes("bill of lading") || combined.includes("b/l")) return "bill_of_lading"
  if (combined.includes("packing list") && combined.includes("invoice")) return "commercial_invoice_packing_list"
  if (combined.includes("commercial invoice") || combined.includes("invoice")) return "commercial_invoice"
  if (combined.includes("packing list")) return "packing_list"
  return null
}

function inferDocumentType(fileName: string, extraction: Record<string, string | null> | null): string | null {
  return inferDocumentTypeFromExtraction(extraction) ?? inferDocumentTypeFromFileName(fileName)
}

/** Remove pending files older than 24h to avoid filling disk (e.g. on hosted/ephemeral backends). */
const PENDING_STALE_MS = 24 * 60 * 60 * 1000

async function cleanupStalePendingFiles(pendingDir: string): Promise<void> {
  try {
    if (!fs.existsSync(pendingDir)) return
    const entries = await fs.promises.readdir(pendingDir, { withFileTypes: true })
    const now = Date.now()
    for (const e of entries) {
      if (!e.isFile()) continue
      const full = path.join(pendingDir, e.name)
      try {
        const stat = await fs.promises.stat(full)
        if (now - stat.mtimeMs > PENDING_STALE_MS) await fs.promises.unlink(full)
      } catch {
        /* ignore per-file errors */
      }
    }
  } catch {
    /* ignore */
  }
}

export default async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post("/upload", async (request, reply) => {
    try {
      const file = await request.file({
        limits: {
          fileSize: 30 * 1024 * 1024, // 30MB
        },
      })

      if (!file) {
        return reply.status(400).send({
          error: "No file uploaded",
        })
      }

      const allowedTypes = ["application/pdf", "image/png", "image/jpeg"]
      if (!allowedTypes.includes(file.mimetype)) {
        return reply.status(400).send({
          error: "Unsupported file type. Only PDF, PNG, JPG allowed.",
        })
      }

      const uploadId = randomUUID()
      const ext = path.extname(file.filename) || ".bin"
      const pendingDir = path.isAbsolute(env.PENDING_UPLOAD_DIR)
        ? env.PENDING_UPLOAD_DIR
        : path.join(process.cwd(), env.PENDING_UPLOAD_DIR)
      await fs.promises.mkdir(pendingDir, { recursive: true })
      await cleanupStalePendingFiles(pendingDir)
      const filePath = path.join(pendingDir, `${uploadId}${ext}`)

      await pipeline(file.file, fs.createWriteStream(filePath))
      const buffer = await fs.promises.readFile(filePath)

      const result = await processDocumentExtractionOnly({
        fileBuffer: buffer,
        fileName: file.filename,
        mimeType: file.mimetype,
        filePath,
      })

      const documentType = inferDocumentType(file.filename, result.structuredData ?? null)

      return reply.send({
        uploadId,
        fileName: file.filename,
        documentType,
        extraction: result.structuredData ?? null,
        fingerprint: result.fingerprint ?? undefined,
      })
    } catch (error) {
      logError("Upload processing failed", error)
      return reply.status(500).send({
        error: "File processing failed",
      })
    }
  })
}
