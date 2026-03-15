import type { DocumentListItem } from "./api";

/** Escape a CSV cell (wrap in quotes if it contains comma, newline, or quote). */
function escapeCsvCell(value: string | null): string {
  if (value == null) return "";
  const s = String(value);
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Convert the current documents list to a CSV string.
 * Columns: Document Type, File Name, Upload Date, Shipper, Consignee, Commodity Description, Reference Number, Document ID
 */
function formatDateForCsv(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function documentsToCsv(documents: DocumentListItem[]): string {
  const headers = [
    "Document Type",
    "File Name",
    "Upload Date",
    "Shipper",
    "Consignee",
    "Commodity Description",
    "Reference Number",
    "Document ID",
  ];
  const rows = documents.map((doc) => [
    escapeCsvCell(doc.documentType),
    escapeCsvCell(doc.fileName),
    escapeCsvCell(formatDateForCsv(doc.uploadTimestamp)),
    escapeCsvCell(doc.shipper),
    escapeCsvCell(doc.consignee),
    escapeCsvCell(doc.commodityDescription),
    escapeCsvCell(doc.referenceNumber),
    escapeCsvCell(doc.id),
  ]);
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => row.join(","));
  return [headerLine, ...dataLines].join("\n");
}

/** Trigger download of a string as a CSV file. */
export function downloadCsv(content: string, filename: string = "documents.csv"): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
