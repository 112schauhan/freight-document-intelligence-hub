/**
 * API client for Freight Document Intelligence Hub backend.
 * Base URL from NEXT_PUBLIC_API_URL (e.g. http://localhost:4000).
 */

const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) return "http://localhost:4000"
  return url.replace(/\/$/, "")
}

export type FieldValues = Record<string, string | null>

export interface UploadResponse {
  uploadId: string
  fileName: string
  documentType: string | null
  extraction: FieldValues | null
  fingerprint?: string
}

/** Thrown when upload is rejected because the document is a duplicate (409). */
export class DuplicateDocumentError extends Error {
  constructor(
    message: string,
    public readonly duplicateOf: { id: string; fileName: string },
  ) {
    super(message)
    this.name = "DuplicateDocumentError"
  }
}

export interface ApproveResponse {
  documentId: string
}

export interface DocumentListItem {
  id: string
  fileName: string
  documentType: string | null
  uploadTimestamp: string
  shipper: string | null
  consignee: string | null
  commodityDescription: string | null
  referenceNumber: string | null
}

export interface DocumentsListResponse {
  documents: DocumentListItem[]
  total: number
}

export type DocumentSortBy = "uploadTimestamp" | "documentType" | "fileName"
export type DocumentSortOrder = "asc" | "desc"

export interface DocumentField {
  fieldName: string
  aiValue: string | null
  correctedValue: string | null
}

export interface CorrectionHistoryItem {
  fieldName: string
  aiValue: string | null
  correctedValue: string | null
  correctedAt: string
}

export interface DocumentDetailResponse {
  id: string
  fileName: string
  documentType: string | null
  uploadTimestamp: string
  fingerprint: string
  fields: DocumentField[]
  correctionHistory: CorrectionHistoryItem[]
}

export interface ListDocumentsParams {
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

/** POST /upload — upload file for extraction (no DB write). Rejects with DuplicateDocumentError on 409. */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const base = getBaseUrl()
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${base}/upload`, {
    method: "POST",
    body: form,
  })
  const body = await res.json().catch(() => ({})) as { error?: string; duplicateOf?: { id: string; fileName: string } }
  if (!res.ok) {
    if (res.status === 409 && body.duplicateOf) {
      throw new DuplicateDocumentError(body.error ?? "Duplicate document", body.duplicateOf)
    }
    throw new Error(body.error ?? `Upload failed: ${res.status}`)
  }
  return body as UploadResponse
}

/** POST /documents/approve — save document and corrections. */
export async function approveDocument(body: {
  uploadId: string
  fileName: string
  extraction: FieldValues
  correctedFields: FieldValues
  fingerprint: string
  documentType?: string | null
}): Promise<ApproveResponse> {
  const base = getBaseUrl()
  const res = await fetch(`${base}/documents/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string; existingDocumentId?: string }
    const e = new Error(err.error ?? `Approve failed: ${res.status}`)
    if (res.status === 409 && err.existingDocumentId) {
      (e as Error & { existingDocumentId: string }).existingDocumentId = err.existingDocumentId
    }
    throw e
  }
  return res.json() as Promise<ApproveResponse>
}

/** GET /documents — list documents with optional search/filters, pagination, and sort. */
export async function getDocuments(params?: ListDocumentsParams): Promise<DocumentsListResponse> {
  const base = getBaseUrl()
  const search = new URLSearchParams()
  if (params?.q) search.set("q", params.q)
  if (params?.documentType) search.set("documentType", params.documentType)
  if (params?.dateFrom) search.set("dateFrom", params.dateFrom)
  if (params?.dateTo) search.set("dateTo", params.dateTo)
  if (params?.countryOfOrigin) search.set("countryOfOrigin", params.countryOfOrigin)
  if (params?.limit != null) search.set("limit", String(params.limit))
  if (params?.offset != null) search.set("offset", String(params.offset))
  if (params?.sortBy) search.set("sortBy", params.sortBy)
  if (params?.sortOrder) search.set("sortOrder", params.sortOrder)
  const qs = search.toString()
  const url = qs ? `${base}/documents?${qs}` : `${base}/documents`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`List documents failed: ${res.status}`)
  return res.json() as Promise<DocumentsListResponse>
}

/** GET /documents/:id — document detail. */
export async function getDocumentById(id: string): Promise<DocumentDetailResponse> {
  const base = getBaseUrl()
  const res = await fetch(`${base}/documents/${id}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error("Document not found")
    throw new Error(`Get document failed: ${res.status}`)
  }
  return res.json() as Promise<DocumentDetailResponse>
}

/** URL for document file (open in new tab or download). */
export function getDocumentFileUrl(id: string): string {
  return `${getBaseUrl()}/documents/${id}/file`
}
