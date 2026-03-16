import type { Prisma } from "@prisma/client"
import { prisma } from "../db/prisma"

export type DocumentSortBy = "uploadTimestamp" | "documentType" | "fileName"
export type DocumentSortOrder = "asc" | "desc"

export interface ListDocumentsFilters {
  orgId: string
  q?: string
  documentType?: string
  dateFrom?: string
  dateTo?: string
  countryOfOrigin?: string
  limit?: number
  offset?: number
  sortBy?: DocumentSortBy
  sortOrder?: DocumentSortOrder
}

const SEARCH_FIELD_NAMES = [
  "shipper_name",
  "consignee_name",
  "commodity_description",
  "reference_number",
] as const

export interface DocumentMeta {
  fileName: string
  filePath: string
  fingerprint: string
  documentType?: string | null
}

export type FieldValues = Record<string, string | null>

/**
 * Creates a document with all extracted fields and correction history in a single transaction.
 * Use when the user has approved (and optionally corrected) the extraction from the upload flow.
 * - DocumentField: aiValue from extraction; correctedValue only when the client sent a value for that field in correctedFields (otherwise null).
 *   Display value is correctedValue ?? aiValue.
 * - CorrectionHistory: one row per field where the user changed the value (correctedValue !== aiValue).
 */
export async function createDocumentWithFieldsAndCorrections(
  orgId: string,
  documentId: string,
  documentMeta: DocumentMeta,
  extractionResult: FieldValues,
  correctedFields: FieldValues,
) {
  const fieldNames = new Set<string>([
    ...Object.keys(extractionResult),
    ...Object.keys(correctedFields),
  ])

  const documentFieldsData = Array.from(fieldNames).map((fieldName) => {
    const aiValue = extractionResult[fieldName] ?? null
    const rawCorrected = correctedFields[fieldName]
    const correctedValue =
      rawCorrected !== undefined && rawCorrected !== null ? String(rawCorrected) : null
    return {
      documentId,
      fieldName,
      aiValue: aiValue != null ? String(aiValue) : null,
      correctedValue,
    }
  })

  const correctionsData = documentFieldsData
    .filter((f) => f.correctedValue !== f.aiValue)
    .map(({ documentId: docId, fieldName, aiValue, correctedValue }) => ({
      documentId: docId,
      fieldName,
      aiValue,
      correctedValue,
    }))

  return prisma.$transaction(async (tx) => {
    await tx.document.create({
      data: {
        id: documentId,
        orgId,
        fileName: documentMeta.fileName,
        filePath: documentMeta.filePath,
        fingerprint: documentMeta.fingerprint,
        documentType: documentMeta.documentType ?? null,
      },
    })
    if (documentFieldsData.length > 0) {
      await tx.documentField.createMany({
        data: documentFieldsData,
      })
    }
    if (correctionsData.length > 0) {
      await tx.correctionHistory.createMany({
        data: correctionsData,
      })
    }
    return { documentId }
  })
}

/**
 * Build Prisma where clause for document list with optional search and filters.
 */
function buildListWhere(filters: ListDocumentsFilters): Prisma.DocumentWhereInput {
  const conditions: Prisma.DocumentWhereInput[] = [{ orgId: filters.orgId }]

  if (filters.documentType) {
    conditions.push({ documentType: { equals: filters.documentType, mode: "insensitive" } })
  }
  if (filters.dateFrom) {
    conditions.push({ uploadTimestamp: { gte: new Date(filters.dateFrom) } })
  }
  if (filters.dateTo) {
    conditions.push({ uploadTimestamp: { lte: new Date(filters.dateTo) } })
  }
  if (filters.countryOfOrigin) {
    conditions.push({
      fields: {
        some: {
          fieldName: "country_of_origin",
          OR: [
            { correctedValue: { equals: filters.countryOfOrigin, mode: "insensitive" } },
            { aiValue: { equals: filters.countryOfOrigin, mode: "insensitive" } },
          ],
        },
      },
    })
  }
  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim()
    conditions.push({
      fields: {
        some: {
          fieldName: { in: [...SEARCH_FIELD_NAMES] },
          OR: [
            { correctedValue: { contains: q, mode: "insensitive" } },
            { aiValue: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    })
  }

  return { AND: conditions }
}

function buildListOrderBy(
  sortBy: DocumentSortBy = "uploadTimestamp",
  sortOrder: DocumentSortOrder = "desc",
): Prisma.DocumentOrderByWithRelationInput {
  return { [sortBy]: sortOrder }
}

export async function findDocumentsWithFilters(filters: ListDocumentsFilters) {
  const where = buildListWhere(filters)
  const sortBy = filters.sortBy ?? "uploadTimestamp"
  const sortOrder = filters.sortOrder ?? "desc"
  const orderBy = buildListOrderBy(sortBy, sortOrder)
  const limit = Math.min(Math.max(1, filters.limit ?? 25), 100)
  const offset = Math.max(0, filters.offset ?? 0)

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: { fields: true },
    }),
    prisma.document.count({ where }),
  ])
  return { documents, total }
}

export async function findDocumentById(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      fields: true,
      corrections: { orderBy: { correctedAt: "asc" } },
    },
  })
}

/** Find an existing document with the same content fingerprint (same org). Used for duplicate detection. */
export async function findDocumentByFingerprint(
  orgId: string,
  fingerprint: string,
): Promise<{ id: string; fileName: string } | null> {
  const doc = await prisma.document.findFirst({
    where: { orgId, fingerprint },
    select: { id: true, fileName: true },
  })
  return doc
}

export async function createDocument(data: {
  orgId: string
  fileName: string
  filePath: string
  fingerprint: string
}) {
  return prisma.document.create({
    data,
  })
}

export async function saveExtractedFields(
  documentId: string,
  structuredData: Record<string, any>,
) {
  const fields = Object.entries(structuredData).map(([key, value]) => ({
    documentId,
    fieldName: key,
    aiValue: value ? String(value) : null,
  }))

  return prisma.documentField.createMany({
    data: fields,
  })
}
