import { prisma } from "../db/prisma"

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
