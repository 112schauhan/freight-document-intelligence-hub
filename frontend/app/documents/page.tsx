"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getDocuments } from "@/lib/api";
import type { DocumentListItem, ListDocumentsParams } from "@/lib/api";

const DEBOUNCE_MS = 300;

const DOCUMENT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "commercial_invoice", label: "Commercial invoice" },
  { value: "packing_list", label: "Packing list" },
  { value: "bill_of_lading", label: "Bill of lading" },
  { value: "commercial_invoice_packing_list", label: "Commercial invoice / Packing list" },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");

  // Debounce search input -> q
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchWithFilters = useCallback(() => {
    const params: ListDocumentsParams = {};
    if (debouncedQ) params.q = debouncedQ;
    if (documentType) params.documentType = documentType;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (countryOfOrigin.trim()) params.countryOfOrigin = countryOfOrigin.trim();
    return getDocuments(params);
  }, [debouncedQ, documentType, dateFrom, dateTo, countryOfOrigin]);

  useEffect(() => {
    let cancelled = false;
    fetchWithFilters()
      .then((res) => {
        if (!cancelled) setDocuments(res.documents);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load documents");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchWithFilters]);

  const onFilterChange = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Documents
        </h1>
        <Link
          href="/upload"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Upload document
        </Link>
      </div>

      <div className="mb-6 space-y-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50/50 dark:bg-zinc-800/30">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <label htmlFor="search" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Search (shipper, consignee, commodity, reference)
            </label>
            <input
              id="search"
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                onFilterChange();
              }}
              placeholder="Type to search…"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            />
          </div>
          <div>
            <label htmlFor="documentType" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Document type
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => {
                setDocumentType(e.target.value);
                onFilterChange();
              }}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            >
              {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dateFrom" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Date from
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                onFilterChange();
              }}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Date to
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                onFilterChange();
              }}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            />
          </div>
        </div>
        <div className="max-w-xs">
          <label htmlFor="countryOfOrigin" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Country of origin
          </label>
          <input
            id="countryOfOrigin"
            type="text"
            value={countryOfOrigin}
            onChange={(e) => {
              setCountryOfOrigin(e.target.value);
              onFilterChange();
            }}
            placeholder="e.g. China, India"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
          />
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
          {(debouncedQ || documentType || dateFrom || dateTo || countryOfOrigin.trim()) ? (
            <> Try adjusting search or filters.</>
          ) : (
            <>
              {" "}
              <Link href="/upload" className="text-zinc-900 dark:text-zinc-100 underline font-medium">
                Upload a document
              </Link>{" "}
              to get started.
            </>
          )}
        </p>
      )}

      {!loading && !error && documents.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Document type
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  File name
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Upload date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Shipper
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Consignee
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                    >
                      {doc.documentType ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <Link href={`/documents/${doc.id}`} className="hover:underline">
                      {doc.fileName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {formatDate(doc.uploadTimestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-[140px] truncate" title={doc.shipper ?? undefined}>
                    {doc.shipper ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-[140px] truncate" title={doc.consignee ?? undefined}>
                    {doc.consignee ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-[120px] truncate" title={doc.referenceNumber ?? undefined}>
                    {doc.referenceNumber ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
