import { logInfo } from "../utils/logger"
import { runOCR } from "../utils/ocrParser"
import { extractTextFromPdf } from "../utils/pdfTextExtractor"
import { normalizeText } from "../utils/textNormalizer"
import { generateDocumentFingerprint } from "../utils/fingerprint"
import { convertPdfToImages } from "../utils/pdfToImage"

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

export async function processDocument(
  input: ProcessDocumentInput,
): Promise<ProcessDocumentResult> {
  /** Future Pipeline Implementation */
  logInfo(`Processing document: ${input.fileName}`)

  let extractedText = ""
  if (input.mimeType == "application/pdf") {
    logInfo("Running pdf to text extraction")
    extractedText = await extractTextFromPdf(input.fileBuffer)
  }

  if (!extractedText || extractedText.length < 100) {
    logInfo("Triggering OCR pipeline")
    const images = await convertPdfToImages(input.fileBuffer)
    extractedText = await runOCR(images)
  }

  const normalizedText = normalizeText(extractedText)
  const fingerprint = generateDocumentFingerprint(normalizedText)

  logInfo(`Document fingerprint: ${fingerprint}`)

  /** Future Pipeline Implementation */
  return {
    extractedText: normalizedText,
    fingerprint,
    structuredData: null,
  }
}
