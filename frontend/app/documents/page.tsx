"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { getDocuments } from "@/lib/api"
import type {
  DocumentListItem,
  ListDocumentsParams,
  DocumentSortBy,
  DocumentSortOrder,
} from "@/lib/api"
import { documentsToCsv, downloadCsv } from "@/lib/csvExport"

const DEBOUNCE_MS = 300

const DOCUMENT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "commercial_invoice", label: "Commercial invoice" },
  { value: "packing_list", label: "Packing list" },
  { value: "bill_of_lading", label: "Bill of lading" },
  {
    value: "commercial_invoice_packing_list",
    label: "Commercial invoice / Packing list",
  },
]

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

const SORT_OPTIONS: { value: `${DocumentSortBy}-${DocumentSortOrder}`; label: string }[] = [
  { value: "uploadTimestamp-desc", label: "Upload date (newest first)" },
  { value: "uploadTimestamp-asc", label: "Upload date (oldest first)" },
  { value: "documentType-asc", label: "Document type (A–Z)" },
  { value: "documentType-desc", label: "Document type (Z–A)" },
  { value: "fileName-asc", label: "File name (A–Z)" },
  { value: "fileName-desc", label: "File name (Z–A)" },
]

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [documentType, setDocumentType] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [countryOfOrigin, setCountryOfOrigin] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sortBy, setSortBy] = useState<DocumentSortBy>("uploadTimestamp")
  const [sortOrder, setSortOrder] = useState<DocumentSortOrder>("desc")

  // Debounce search input -> q
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchWithFilters = useCallback(() => {
    const params: ListDocumentsParams = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      sortBy,
      sortOrder,
    }
    if (debouncedQ) params.q = debouncedQ
    if (documentType) params.documentType = documentType
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    if (countryOfOrigin.trim()) params.countryOfOrigin = countryOfOrigin.trim()
    return getDocuments(params)
  }, [debouncedQ, documentType, dateFrom, dateTo, countryOfOrigin, page, pageSize, sortBy, sortOrder])

  useEffect(() => {
    let cancelled = false
    fetchWithFilters()
      .then((res) => {
        if (!cancelled) {
          setDocuments(res.documents)
          setTotal(res.total)
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load documents",
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [fetchWithFilters])

  const onFilterChange = useCallback(() => {
    setPage(1)
    setLoading(true)
    setError(null)
  }, [])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  const handleSortChange = useCallback((value: string) => {
    const [by, order] = value.split("-") as [DocumentSortBy, DocumentSortOrder]
    setSortBy(by)
    setSortOrder(order)
    setPage(1)
    setLoading(true)
    setError(null)
  }, [])

  const handleExportCsv = useCallback(() => {
    const csv = documentsToCsv(documents)
    const filename = `documents-export-${new Date().toISOString().slice(0, 10)}.csv`
    downloadCsv(csv, filename)
  }, [documents])

  const inputFocusClass =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Documents
        </h1>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={documents.length === 0}
            className="cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
            title="Export current list to CSV"
          >
            Export CSV
          </button>
          <Link
            href="/upload"
            className="cursor-pointer rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
          >
            Upload document
          </Link>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-800/30">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <label
              htmlFor="search"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1"
            >
              Search (shipper, consignee, commodity, reference)
            </label>
            <input
              id="search"
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                onFilterChange()
              }}
              placeholder="Type to search…"
              className={`w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm ${inputFocusClass}`}
            />
          </div>
          <div>
            <label
              htmlFor="documentType"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1"
            >
              Document type
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => {
                setDocumentType(e.target.value)
                onFilterChange()
              }}
              className={`w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm ${inputFocusClass}`}
            >
              {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="dateFrom"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1"
            >
              Date from
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                onFilterChange()
              }}
              className={`w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm ${inputFocusClass}`}
            />
          </div>
          <div>
            <label
              htmlFor="dateTo"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1"
            >
              Date to
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                onFilterChange()
              }}
              className={`w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm ${inputFocusClass}`}
            />
          </div>
        </div>
        <div className="max-w-xs">
          <label
            htmlFor="countryOfOrigin"
            className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1"
          >
            Country of origin
          </label>
          <input
            id="countryOfOrigin"
            type="text"
            value={countryOfOrigin}
            onChange={(e) => {
              setCountryOfOrigin(e.target.value)
              onFilterChange()
            }}
            placeholder="e.g. China, India"
            className={`w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm ${inputFocusClass}`}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label
            htmlFor="sort"
            className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1"
          >
            Sort by
          </label>
          <select
            id="sort"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => handleSortChange(e.target.value)}
            className={`w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm ${inputFocusClass}`}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="pageSize"
            className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1"
          >
            Per page
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
              setLoading(true)
              setError(null)
            }}
            className={`w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm ${inputFocusClass}`}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="text-zinc-600 dark:text-zinc-400">Loading documents…</p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && documents.length === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">
          No documents match the current filters.
          {debouncedQ ||
          documentType ||
          dateFrom ||
          dateTo ||
          countryOfOrigin.trim() ? (
            <> Try adjusting search or filters.</>
          ) : (
            <>
              {" "}
              <Link
                href="/upload"
                className="text-zinc-900 dark:text-zinc-100 underline font-medium"
              >
                Upload a document
              </Link>{" "}
              to get started.
            </>
          )}
        </p>
      )}

      {!loading && !error && documents.length > 0 && (
        <div
          className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700 min-w-0"
          role="region"
          aria-label="Documents table"
        >
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  Document type
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  File name
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  Upload date
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  Shipper
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  Consignee
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2 rounded"
                    >
                      {doc.documentType ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2 rounded"
                    >
                      {doc.fileName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {formatDate(doc.uploadTimestamp)}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-[140px] truncate"
                    title={doc.shipper ?? undefined}
                  >
                    {doc.shipper ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-[140px] truncate"
                    title={doc.consignee ?? undefined}
                  >
                    {doc.consignee ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-[120px] truncate"
                    title={doc.referenceNumber ?? undefined}
                  >
                    {doc.referenceNumber ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && documents.length > 0 && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {page} of {totalPages}
            {total > 0 && (
              <span className="ml-1">
                ({(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total})
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPage((p) => Math.max(1, p - 1))
                setLoading(true)
                setError(null)
              }}
              disabled={!canPrev}
              className="cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1))
                setLoading(true)
                setError(null)
              }}
              disabled={!canNext}
              className="cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
