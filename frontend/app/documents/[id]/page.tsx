"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getDocumentById, getDocumentFileUrl } from "@/lib/api"
import type { DocumentDetailResponse } from "@/lib/api"
import { fieldLabel } from "@/lib/extraction-fields"

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function displayValue(field: {
  aiValue: string | null
  correctedValue: string | null
}): string {
  const v = field.correctedValue ?? field.aiValue
  return v ?? "—"
}

export default function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null,
  )
  const [doc, setDoc] = useState<DocumentDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => {
      setResolvedParams(p)
      if (p?.id) {
        setLoading(true)
        setError(null)
      }
    })
  }, [params])

  useEffect(() => {
    if (!resolvedParams?.id) return
    let cancelled = false
    getDocumentById(resolvedParams.id)
      .then((data) => {
        if (!cancelled) setDoc(data)
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load document",
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [resolvedParams?.id])

  if (!resolvedParams) {
    return (
      <div className="w-full space-y-4">
        <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    )
  }

  const { id } = resolvedParams

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <p className="text-zinc-600 dark:text-zinc-400">Loading document…</p>
        <Link
          href="/documents"
          className="inline-block text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2 rounded"
        >
          Back to documents
        </Link>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="w-full space-y-4">
        <p className="text-red-600 dark:text-red-400">
          {error ?? "Document not found."}
        </p>
        <Link
          href="/documents"
          className="inline-block text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2 rounded"
        >
          Back to documents
        </Link>
      </div>
    )
  }

  const fileUrl = getDocumentFileUrl(id)

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Document detail
        </h1>
        <Link
          href="/documents"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2 rounded shrink-0"
        >
          Back to documents
        </Link>
      </div>

      <section className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Metadata
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">File name</dt>
            <dd className="text-zinc-900 dark:text-zinc-100 mt-0.5 wrap-break-word">
              {doc.fileName}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Document type</dt>
            <dd className="text-zinc-900 dark:text-zinc-100 mt-0.5">
              {doc.documentType ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Upload date</dt>
            <dd className="text-zinc-900 dark:text-zinc-100 mt-0.5">
              {formatDate(doc.uploadTimestamp)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Extracted fields
        </h2>
        <dl className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          {doc.fields.map((field) => {
            const value = displayValue(field)
            const wasCorrected =
              field.correctedValue != null &&
              field.correctedValue !== field.aiValue
            return (
              <div key={field.fieldName} className="min-w-0">
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">
                  {fieldLabel(field.fieldName)}
                  {wasCorrected && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      (corrected)
                    </span>
                  )}
                </dt>
                <dd className="text-zinc-900 dark:text-zinc-100 wrap-break-word">
                  {value}
                  {wasCorrected && field.aiValue != null && (
                    <span className="block mt-1 text-zinc-500 dark:text-zinc-400 text-xs">
                      AI value: {field.aiValue}
                    </span>
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
      </section>

      {doc.correctionHistory.length > 0 && (
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Correction history
          </h2>
          <ul className="space-y-3 text-sm">
            {doc.correctionHistory.map((item, i) => (
              <li
                key={`${item.fieldName}-${i}`}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/50 dark:bg-zinc-800/30"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {fieldLabel(item.fieldName)}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 mx-2">→</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {item.correctedValue ?? "—"}
                </span>
                {item.aiValue != null && (
                  <span className="block mt-1 text-zinc-500 dark:text-zinc-400 text-xs">
                    Previously: {item.aiValue}
                  </span>
                )}
                <span className="block mt-1 text-zinc-400 dark:text-zinc-500 text-xs">
                  {formatDate(item.correctedAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 p-5 sm:p-6 space-y-3">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Original file
        </h2>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
        >
          View / Download original file
        </a>
      </section>
    </div>
  )
}
