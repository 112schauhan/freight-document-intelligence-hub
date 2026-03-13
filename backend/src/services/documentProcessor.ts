import { logInfo } from "../utils/logger"

export interface ProcessDocumentInput {
  fileBuffer: Buffer
  fileName: string
  mimeType: string
}

export interface ProcessDocumentResult {
  extractedText?: string
  structuredData?: unknown
}

export async function processDocument(
  input: ProcessDocumentInput,
): Promise<ProcessDocumentResult> {
  /** Future Pipeline Implementation */
  logInfo(`Processing document: ${input.fileName}`)
  return {
    extractedText: "",
    structuredData: null,
  }
}
