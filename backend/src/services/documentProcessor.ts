import fs from "fs"
import path from "path"
import os from "os"
import { logInfo } from "../utils/logger"
import { runOCR } from "../utils/ocrParser"
import { extractTextFromPdf } from "../utils/pdfTextExtractor"
import { normalizeText } from "../utils/textNormalizer"
import { generateDocumentFingerprint } from "../utils/fingerprint"
import { convertPdfToImages } from "../utils/pdfToImage"
import { extractStructuredData } from "../ai/extractionService"
import {
  createDocument,
  saveExtractedFields,
} from "../repositories/documentRepository"

export interface ProcessDocumentInput {
  fileBuffer: Buffer
  fileName: string
  mimeType: string
  filePath?: string
}

export interface ProcessDocumentResult {
  extractedText?: string
  structuredData?: unknown
  fingerprint?: string
}

/** Result of extraction-only pipeline (no DB writes). */
export interface ExtractionOnlyResult {
  extractedText?: string
  structuredData?: Record<string, string | null> | null
  fingerprint?: string
}

/**
 * Runs OCR + Claude extraction only. Does not create Document or DocumentField rows.
 * Used by the upload route for human-in-the-loop: return extraction to client, save to DB only on approve.
 */
export async function processDocumentExtractionOnly(
  input: ProcessDocumentInput,
): Promise<ExtractionOnlyResult> {
  const { normalizedText, fingerprint, structuredData } =
    await runExtractionPipeline(input)
  return {
    extractedText: normalizedText,
    structuredData: structuredData ?? null,
    fingerprint,
  }
}

/**
 * Shared pipeline: OCR (or PDF text) + normalize + fingerprint + Claude extraction.
 * No side effects (no DB writes).
 */
async function runExtractionPipeline(input: ProcessDocumentInput): Promise<{
  normalizedText: string
  fingerprint: string
  structuredData: Record<string, string | null> | null
}> {
  logInfo(`Processing document: ${input.fileName}`)

  let extractedText = ""

  if (input.mimeType === "image/png" || input.mimeType === "image/jpeg") {
    logInfo("Running OCR on image upload")
    const tmpDir = os.tmpdir()
    const ext = input.mimeType === "image/png" ? ".png" : ".jpg"
    const tempPath = path.join(tmpDir, `ocr-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
    await fs.promises.writeFile(tempPath, input.fileBuffer)
    try {
      extractedText = await runOCR([tempPath])
    } finally {
      await fs.promises.unlink(tempPath).catch(() => {})
    }
  } else if (input.mimeType === "application/pdf") {
    /* PDF: text extraction first, then fallback to PDF-to-images + OCR; do not use image path. */
    logInfo("Running pdf to text extraction")
    extractedText = await extractTextFromPdf(input.fileBuffer)
    if (!extractedText || extractedText.length < 100) {
      logInfo("Triggering OCR pipeline for PDF (first 3 pages)")
      const images = await convertPdfToImages(input.fileBuffer)
      try {
        extractedText = await runOCR(images)
      } finally {
        for (const p of images) {
          try {
            await fs.promises.unlink(p)
          } catch {
            /* ignore */
          }
        }
      }
    }
  }

  const normalizedText = normalizeText(extractedText)
  const fingerprint = generateDocumentFingerprint(normalizedText)
  logInfo(`Document fingerprint: ${fingerprint}`)

  let structuredData: Record<string, string | null> | null = null
  if (normalizedText && normalizedText.length > 50) {
    logInfo("Running Claude extraction")
    structuredData = await extractStructuredData(normalizedText)
  }

  return { normalizedText, fingerprint, structuredData }
}

export async function processDocument(
  input: ProcessDocumentInput,
): Promise<ProcessDocumentResult> {
  const { normalizedText, fingerprint, structuredData } =
    await runExtractionPipeline(input)

  const orgId = "demo-org-1"
  const document = await createDocument({
    orgId,
    fileName: input.fileName,
    filePath: input.filePath ?? "",
    fingerprint,
  })

  if (structuredData) {
    await saveExtractedFields(document.id, structuredData)
  }

  return {
    extractedText: normalizedText,
    fingerprint,
    structuredData,
  }
}
