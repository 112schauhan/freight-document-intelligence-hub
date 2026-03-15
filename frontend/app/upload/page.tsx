"use client"

import { useState, useCallback } from "react"
import { uploadFile } from "@/lib/api"
import type { UploadResponse } from "@/lib/api"
import { FileDropZone } from "@/components/upload/FileDropZone"
import { UploadSuccessView } from "@/components/upload/UploadSuccessView"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResponse | null>(null)

  const handleFileChange = useCallback((f: File | null) => {
    setFile(f)
    setError(null)
    setResult(null)
  }, [])

  const handleValidationError = useCallback((message: string) => {
    setError(message || null)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file.")
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await uploadFile(file)
      setResult(data)
      if (typeof window !== "undefined") {
        sessionStorage.setItem("freight-upload-result", JSON.stringify(data))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setLoading(false)
    }
  }

  const reset = useCallback(() => {
    setFile(null)
    setResult(null)
    setError(null)
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("freight-upload-result")
    }
  }, [])

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Upload document
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload a PDF or image (PNG, JPEG) of a logistics document. We’ll
          extract fields for you to review.
        </p>
      </div>

      {!result ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 sm:p-8 bg-zinc-50/50 dark:bg-zinc-800/30"
        >
          <FileDropZone
            file={file}
            onFileChange={handleFileChange}
            onValidationError={handleValidationError}
            disabled={loading}
          />

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
          >
            {loading ? "Uploading…" : "Upload"}
          </button>
        </form>
      ) : (
        <UploadSuccessView result={result} onUploadAnother={reset} />
      )}
    </div>
  )
}
