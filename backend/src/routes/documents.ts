import type { FastifyInstance } from "fastify"
import path from "path"
import fs from "fs"
import { randomUUID } from "crypto"
import { env } from "../config/env"
import { logError } from "../utils/logger"
import {
  createDocumentWithFieldsAndCorrections,
  type FieldValues,
} from "../repositories/documentRepository"
import { prisma } from "../db/prisma"

const DEMO_ORG_ID = "demo-org-1"

interface ApproveBody {
  uploadId: string
  fileName: string
  extraction: FieldValues
  correctedFields: FieldValues
  fingerprint: string
  documentType?: string | null
}

function getPendingDir(): string {
  return path.isAbsolute(env.PENDING_UPLOAD_DIR)
    ? env.PENDING_UPLOAD_DIR
    : path.join(process.cwd(), env.PENDING_UPLOAD_DIR)
}

function getUploadDir(): string {
  return path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.join(process.cwd(), env.UPLOAD_DIR)
}

/** Find pending file by uploadId (file name is {uploadId}{ext}). */
function findPendingFilePath(uploadId: string): string | null {
  const pendingDir = getPendingDir()
  if (!fs.existsSync(pendingDir)) return null
  const files = fs.readdirSync(pendingDir)
  const found = files.find((f) => f.startsWith(uploadId))
  return found ? path.join(pendingDir, found) : null
}

export default async function documentsRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ApproveBody }>("/documents/approve", async (request, reply) => {
    try {
      const body = request.body
      const { uploadId, fileName, extraction, correctedFields, fingerprint, documentType } = body

      if (!uploadId || typeof uploadId !== "string") {
        return reply.status(400).send({ error: "uploadId is required" })
      }
      if (!fileName || typeof fileName !== "string") {
        return reply.status(400).send({ error: "fileName is required" })
      }
      if (!extraction || typeof extraction !== "object") {
        return reply.status(400).send({ error: "extraction is required" })
      }
      const corrections = correctedFields && typeof correctedFields === "object" ? correctedFields : {}
      if (!fingerprint || typeof fingerprint !== "string") {
        return reply.status(400).send({ error: "fingerprint is required" })
      }

      const pendingFilePath = findPendingFilePath(uploadId)
      if (!pendingFilePath) {
        return reply.status(404).send({
          error: "Pending upload not found",
          uploadId,
        })
      }

      await prisma.organization.upsert({
        where: { id: DEMO_ORG_ID },
        create: { id: DEMO_ORG_ID, name: "Demo Organization" },
        update: {},
      })

      const documentId = randomUUID()
      const ext = path.extname(pendingFilePath) || path.extname(fileName) || ".bin"
      const uploadDir = getUploadDir()
      const orgDir = path.join(uploadDir, DEMO_ORG_ID)
      await fs.promises.mkdir(orgDir, { recursive: true })
      const finalPath = path.join(orgDir, `${documentId}${ext}`)

      await fs.promises.rename(pendingFilePath, finalPath)

      await createDocumentWithFieldsAndCorrections(
        DEMO_ORG_ID,
        documentId,
        {
          fileName,
          filePath: finalPath,
          fingerprint,
          documentType: documentType ?? null,
        },
        extraction,
        corrections,
      )

      return reply.status(201).send({ documentId })
    } catch (error) {
      logError("Approve document failed", error)
      return reply.status(500).send({
        error: "Failed to approve document",
      })
    }
  })
}
