"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function UploadReviewPage() {
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("freight-upload-result") : null;
    setHasData(!!raw);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Review and approve
      </h1>
      {hasData ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          The editable extraction form and approve flow will be implemented in the next commit (F3).
          Upload result is stored and ready for the form.
        </p>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">
          No upload result found. Please{" "}
          <Link href="/upload" className="text-zinc-900 dark:text-zinc-100 underline font-medium">
            upload a document
          </Link>{" "}
          first.
        </p>
      )}
      <Link
        href="/upload"
        className="inline-block mt-6 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        Back to upload
      </Link>
    </div>
  );
}
