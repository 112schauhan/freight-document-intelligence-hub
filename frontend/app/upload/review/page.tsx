"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { approveDocument } from "@/lib/api";
import type { UploadResponse, FieldValues } from "@/lib/api";
import { EXTRACTION_FIELDS } from "@/lib/extraction-fields";
import { ExtractionForm } from "@/components/upload/ExtractionForm";

export default function UploadReviewPage() {
  const router = useRouter();
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("freight-upload-result")
        : null;
    if (!raw) {
      setUpload(null);
      return;
    }
    try {
      const data = JSON.parse(raw) as UploadResponse;
      setUpload(data);
      const extraction = data.extraction ?? {};
      const initial: Record<string, string> = {};
      for (const key of EXTRACTION_FIELDS) {
        const v = extraction[key];
        initial[key] = v != null ? String(v) : "";
      }
      setFormValues(initial);
    } catch {
      setUpload(null);
    }
  }, []);

  const setField = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const getCorrectedFields = useCallback((): FieldValues => {
    if (!upload?.extraction) return {};
    const extraction = upload.extraction;
    const corrected: FieldValues = {};
    for (const key of EXTRACTION_FIELDS) {
      const orig = extraction[key];
      const origStr = orig != null ? String(orig) : "";
      const current = formValues[key] ?? "";
      if (current !== origStr) {
        corrected[key] = current || null;
      }
    }
    return corrected;
  }, [upload, formValues]);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upload?.uploadId || !upload.fileName || upload.fingerprint == null) {
      setError("Missing upload data. Please upload again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const correctedFields = getCorrectedFields();
      const { documentId } = await approveDocument({
        uploadId: upload.uploadId,
        fileName: upload.fileName,
        extraction: upload.extraction ?? {},
        correctedFields,
        fingerprint: upload.fingerprint,
        documentType: upload.documentType ?? undefined,
      });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("freight-upload-result");
      }
      router.push(`/documents/${documentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed.");
    } finally {
      setLoading(false);
    }
  };

  if (upload === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Review and approve
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          No upload result found. Please{" "}
          <Link
            href="/upload"
            className="text-zinc-900 dark:text-zinc-100 underline font-medium"
          >
            upload a document
          </Link>{" "}
          first.
        </p>
        <Link
          href="/upload"
          className="inline-block mt-6 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Back to upload
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Review and approve
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Edit any extracted fields below, then approve to save the document.
      </p>

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
  );
}
