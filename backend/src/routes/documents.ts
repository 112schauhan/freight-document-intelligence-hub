import type { FastifyInstance } from "fastify"
import path from "path"
import fs from "fs"
import { randomUUID } from "crypto"
import { env } from "../config/env"
import { logError } from "../utils/logger"
import {
  createDocumentWithFieldsAndCorrections,
  findDocumentByFingerprint,
  findDocumentById,
  findDocumentsWithFilters,
  type FieldValues,
} from "../repositories/documentRepository"
import type { DocumentField } from "@prisma/client"
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

function getFieldDisplayValue(fields: DocumentField[], fieldName: string): string | null {
  const f = fields.find((x) => x.fieldName === fieldName)
  if (!f) return null
  return (f.correctedValue ?? f.aiValue) ?? null
}

/** Resolve file path and ensure it is under the upload dir (safe for streaming). */
function resolveSafeFilePath(filePath: string): string | null {
  const uploadDir = getUploadDir()
  const resolvedUpload = path.resolve(uploadDir)
  const resolvedFile = path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.normalize(path.join(process.cwd(), filePath))
  if (!resolvedFile.startsWith(resolvedUpload)) return null
  return resolvedFile
}

interface ListQuery {
  q?: string
  documentType?: string
  dateFrom?: string
  dateTo?: string
  countryOfOrigin?: string
}

export default async function documentsRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListQuery }>("/documents", async (request, reply) => {
    try {
      const { q, documentType, dateFrom, dateTo, countryOfOrigin } = request.query
      const filters: Parameters<typeof findDocumentsWithFilters>[0] = {
        orgId: DEMO_ORG_ID,
      }
      if (q !== undefined) filters.q = q
      if (documentType !== undefined) filters.documentType = documentType
      if (dateFrom !== undefined) filters.dateFrom = dateFrom
      if (dateTo !== undefined) filters.dateTo = dateTo
      if (countryOfOrigin !== undefined) filters.countryOfOrigin = countryOfOrigin
      const documents = await findDocumentsWithFilters(filters)
      const list = documents.map((doc) => ({
        id: doc.id,
        fileName: doc.fileName,
        documentType: doc.documentType,
        uploadTimestamp: doc.uploadTimestamp.toISOString(),
        shipper: getFieldDisplayValue(doc.fields, "shipper_name"),
        consignee: getFieldDisplayValue(doc.fields, "consignee_name"),
        commodityDescription: getFieldDisplayValue(doc.fields, "commodity_description"),
        referenceNumber: getFieldDisplayValue(doc.fields, "reference_number"),
      }))
      return reply.send({ documents: list })
    } catch (error) {
      logError("List documents failed", error)
      return reply.status(500).send({ error: "Failed to list documents" })
    }
  })

  fastify.get<{ Params: { id: string } }>("/documents/:id/file", async (request, reply) => {
    try {
      const { id } = request.params
      const doc = await findDocumentById(id)
      if (!doc) {
        return reply.status(404).send({ error: "Document not found", id })
      }
      const safePath = resolveSafeFilePath(doc.filePath)
      if (!safePath || !fs.existsSync(safePath)) {
        return reply.status(404).send({ error: "File not found", id })
      }
      const stream = fs.createReadStream(safePath)
      return reply
        .header("Content-Disposition", `attachment; filename="${doc.fileName}"`)
        .send(stream)
    } catch (error) {
      logError("Get document file failed", error)
      return reply.status(500).send({ error: "Failed to get document file" })
    }
  })

  fastify.get<{ Params: { id: string } }>("/documents/:id", async (request, reply) => {
    try {
      const { id } = request.params
      const doc = await findDocumentById(id)
      if (!doc) {
        return reply.status(404).send({ error: "Document not found", id })
      }
      return reply.send({
        id: doc.id,
        fileName: doc.fileName,
        documentType: doc.documentType,
        uploadTimestamp: doc.uploadTimestamp.toISOString(),
        fingerprint: doc.fingerprint,
        fields: doc.fields.map((f) => ({
          fieldName: f.fieldName,
          aiValue: f.aiValue,
          correctedValue: f.correctedValue,
        })),
        correctionHistory: doc.corrections.map((c) => ({
          fieldName: c.fieldName,
          aiValue: c.aiValue,
          correctedValue: c.correctedValue,
          correctedAt: c.correctedAt.toISOString(),
        })),
      })
    } catch (error) {
      logError("Get document failed", error)
      return reply.status(500).send({ error: "Failed to get document" })
    }
  })

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

      const existing = await findDocumentByFingerprint(DEMO_ORG_ID, fingerprint)
      if (existing) {
        return reply.status(409).send({
          error: "Duplicate document",
          existingDocumentId: existing.id,
          existingFileName: existing.fileName,
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
