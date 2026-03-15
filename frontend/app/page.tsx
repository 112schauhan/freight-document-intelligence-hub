import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Freight Document Intelligence Hub
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-10">
        Upload logistics documents (invoices, packing lists, bills of lading), review AI-extracted data, and search or filter your processed documents.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/upload"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 font-medium hover:opacity-90 transition-opacity"
        >
          Upload document
        </Link>
        <Link
          href="/documents"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 px-6 py-3 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          View documents
        </Link>
      </div>
    </div>
  );
}
