"use client";

import Link from "next/link";
import type { UploadResponse } from "@/lib/api";

interface UploadSuccessViewProps {
  result: UploadResponse;
  onUploadAnother: () => void;
}

export function UploadSuccessView({ result, onUploadAnother }: UploadSuccessViewProps) {
  return (
    <div className="space-y-6">
      <p className="text-green-600 dark:text-green-400 font-medium">
        Upload successful. Extraction complete.
      </p>
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
      <div className="flex gap-3 pt-2">
        <Link
          href="/upload/review"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 font-medium hover:opacity-90 transition-opacity inline-block"
        >
          Review and approve
        </Link>
        <button
          type="button"
          onClick={onUploadAnother}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 px-6 py-2.5 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Upload another
        </button>
      </div>
    </div>
  );
}
