"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { uploadFile } from "@/lib/api";
import type { UploadResponse } from "@/lib/api";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";
const MAX_SIZE_MB = 30;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (f: File): string | null => {
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowed.includes(f.type)) {
      return "Only PDF, PNG, and JPEG files are allowed.";
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `File must be under ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFile = useCallback(
    (f: File | null) => {
      setError(null);
      setResult(null);
      if (!f) {
        setFile(null);
        return;
      }
      const err = validateFile(f);
      if (err) {
        setError(err);
        setFile(null);
        return;
      }
      setFile(f);
    },
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    handleFile(f ?? null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await uploadFile(file);
      setResult(data);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("freight-upload-result", JSON.stringify(data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("freight-upload-result");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Upload document
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        Upload a PDF or image (PNG, JPEG) of a logistics document. We’ll extract fields for you to review.
      </p>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
              dragActive
                ? "border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800/50"
                : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
            }`}
          >
            <input
              type="file"
              accept={ACCEPT}
              onChange={handleInputChange}
              className="hidden"
              id="file-input"
              disabled={loading}
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer block text-zinc-600 dark:text-zinc-400"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {file ? file.name : "Choose a file"}
              </span>
              <span className="block mt-1 text-sm">
                or drag and drop here (PDF, PNG, JPEG, max {MAX_SIZE_MB}MB)
              </span>
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {loading ? "Uploading…" : "Upload"}
          </button>
        </form>
      ) : (
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
              <dd className="text-zinc-900 dark:text-zinc-100 font-mono text-xs">{result.uploadId}</dd>
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
                  <li className="text-zinc-500">… and {Object.keys(result.extraction).length - 6} more fields</li>
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
              onClick={reset}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 px-6 py-2.5 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Upload another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
