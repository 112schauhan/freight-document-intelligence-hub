"use client";

import Link from "next/link";
import type { UploadResponse } from "@/lib/api";

interface UploadSuccessViewProps {
  result: UploadResponse;
  onUploadAnother: () => void;
}

export function UploadSuccessView({ result, onUploadAnother }: UploadSuccessViewProps) {
  return (
    <div className="space-y-6 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 sm:p-8 bg-zinc-50/50 dark:bg-zinc-800/30">
      {result.duplicateOf ? (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-amber-800 dark:text-amber-200 font-medium">
            This document appears to be a duplicate of one already in the system.
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Existing: {result.duplicateOf.fileName}
          </p>
          <Link
            href={`/documents/${result.duplicateOf.id}`}
            className="inline-block mt-2 text-sm font-medium text-amber-800 dark:text-amber-200 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
          >
            View existing document →
          </Link>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            If you approve below, it will be rejected as a duplicate.
          </p>
        </div>
      ) : (
        <p className="text-green-600 dark:text-green-400 font-medium">
          Upload successful. Extraction complete.
        </p>
      )}
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">File</dt>
          <dd className="text-zinc-900 dark:text-zinc-100">{result.fileName}</dd>
        </div>
        {result.documentType && (
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Document type</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">{result.documentType}</dd>
          </div>
        )}
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Upload ID</dt>
          <dd className="text-zinc-900 dark:text-zinc-100 font-mono text-xs">
            {result.uploadId}
          </dd>
        </div>
      </dl>
      {result.extraction && Object.keys(result.extraction).length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Extracted data (preview)
          </h2>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            {Object.entries(result.extraction).slice(0, 6).map(([key, value]) => (
              <li key={key}>
                <span className="text-zinc-500 dark:text-zinc-500">{key}:</span>{" "}
                {value ?? "—"}
              </li>
            ))}
            {Object.keys(result.extraction).length > 6 && (
              <li className="text-zinc-500">
                … and {Object.keys(result.extraction).length - 6} more fields
              </li>
            )}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/upload/review"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 font-medium hover:opacity-90 transition-opacity inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
        >
          Review and approve
        </Link>
        <button
          type="button"
          onClick={onUploadAnother}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 px-6 py-2.5 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
        >
          Upload another
        </button>
      </div>
    </div>
  );
}
