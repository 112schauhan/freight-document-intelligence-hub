import Link from "next/link"

export default function Home() {
  return (
    <div className="w-full">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/40 p-8 sm:p-10 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Freight Document Intelligence Hub
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed max-w-2xl">
            Upload logistics documents (invoices, packing lists, bills of
            lading), review AI-extracted data, and search or filter your
            processed documents.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
          >
            Upload document
          </Link>
          <Link
            href="/documents"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 px-6 py-3 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
          >
            View documents
          </Link>
        </div>
      </div>
    </div>
  )
}
