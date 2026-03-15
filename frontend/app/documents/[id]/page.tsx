"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  if (!resolvedParams) return <div className="max-w-2xl mx-auto px-4 py-10">Loading…</div>;

  const { id } = resolvedParams;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Document detail
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        Document ID: <span className="font-mono text-sm">{id}</span>
      </p>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Full document detail with fields, correction history, and file link will be implemented in Commit F6.
      </p>
      <Link
        href="/documents"
        className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        Back to documents
      </Link>
    </div>
  );
}
