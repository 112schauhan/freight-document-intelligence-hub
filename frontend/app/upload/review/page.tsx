"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { approveDocument } from "@/lib/api"
import type { UploadResponse, FieldValues } from "@/lib/api"
import { EXTRACTION_FIELDS } from "@/lib/extraction-fields"
import { ExtractionForm } from "@/components/upload/ExtractionForm"

export default function UploadReviewPage() {
  const router = useRouter()
  const [upload, setUpload] = useState<UploadResponse | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("freight-upload-result")
        : null
    if (!raw) {
      setUpload(null)
      return
    }
    try {
      const data = JSON.parse(raw) as UploadResponse
      setUpload(data)
      const extraction = data.extraction ?? {}
      const initial: Record<string, string> = {}
      for (const key of EXTRACTION_FIELDS) {
        const v = extraction[key]
        initial[key] = v != null ? String(v) : ""
      }
      setFormValues(initial)
    } catch {
      setUpload(null)
    }
  }, [])

  const setField = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const getCorrectedFields = useCallback((): FieldValues => {
    if (!upload?.extraction) return {}
    const extraction = upload.extraction
    const corrected: FieldValues = {}
    for (const key of EXTRACTION_FIELDS) {
      const orig = extraction[key]
      const origStr = orig != null ? String(orig) : ""
      const current = formValues[key] ?? ""
      if (current !== origStr) {
        corrected[key] = current || null
      }
    }
    return corrected
  }, [upload, formValues])

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!upload?.uploadId || !upload.fileName || upload.fingerprint == null) {
      setError("Missing upload data. Please upload again.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const correctedFields = getCorrectedFields()
      const { documentId } = await approveDocument({
        uploadId: upload.uploadId,
        fileName: upload.fileName,
        extraction: upload.extraction ?? {},
        correctedFields,
        fingerprint: upload.fingerprint,
        documentType: upload.documentType ?? undefined,
      })
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("freight-upload-result")
      }
      router.push(`/documents/${documentId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed.")
    } finally {
      setLoading(false)
    }
  }

  if (upload === null) {
    return (
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Review and approve
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            No upload result found. Please{" "}
            <Link
              href="/upload"
              className="text-zinc-900 dark:text-zinc-100 underline font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2 rounded"
            >
              upload a document
            </Link>{" "}
            first.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-block text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2 rounded"
        >
          Back to upload
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Review and approve
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Edit any extracted fields below, then approve to save the document.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 sm:p-8 bg-zinc-50/50 dark:bg-zinc-800/30">
        <ExtractionForm
          values={formValues}
          onFieldChange={setField}
          onSubmit={handleApprove}
          loading={loading}
          error={error}
          submitLabel="Approve"
          cancelHref="/upload"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  )
}
