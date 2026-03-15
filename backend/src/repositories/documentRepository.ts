import { prisma } from "../db/prisma"

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
 * - DocumentField: aiValue from extraction, correctedValue from correctedFields (or extraction if unchanged).
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
    const correctedValue = correctedFields[fieldName] ?? extractionResult[fieldName] ?? null
    return {
      documentId,
      fieldName,
      aiValue: aiValue != null ? String(aiValue) : null,
      correctedValue: correctedValue != null ? String(correctedValue) : null,
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
