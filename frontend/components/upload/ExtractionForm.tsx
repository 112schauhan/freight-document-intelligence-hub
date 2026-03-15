"use client";

import Link from "next/link";
import { EXTRACTION_FIELDS, fieldLabel } from "@/lib/extraction-fields";
import { ExtractionField } from "./ExtractionField";

export interface ExtractionFormProps {
  values: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
  cancelHref?: string;
  cancelLabel?: string;
}

export function ExtractionForm({
  values,
  onFieldChange,
  onSubmit,
  loading = false,
  error = null,
  submitLabel = "Approve",
  cancelHref = "/upload",
  cancelLabel = "Cancel",
}: ExtractionFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        {EXTRACTION_FIELDS.map((key) => (
          <ExtractionField
            key={key}
            name={key}
            label={fieldLabel(key)}
            value={values[key] ?? ""}
            onChange={(value) => onFieldChange(key, value)}
            placeholder={`${fieldLabel(key)}…`}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 px-6 py-2.5 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors inline-block"
        >
          {cancelLabel}
        </Link>
      </div>
    </form>
  );
}
