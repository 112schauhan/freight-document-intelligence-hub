# Freight Document Intelligence Hub

A web application where users upload logistics documents (commercial invoice, packing list, or bill of lading). AI extracts structured data; results are shown in an editable form for human-in-the-loop review, then stored and made searchable in a dashboard.

## Features

### Document upload and AI extraction

- **Upload:** PDF or image (PNG, JPEG) of a logistics document. File is processed on the server (OCR + Claude extraction). Supported document types: commercial invoice, packing list, bill of lading (inferred from filename or content).
- **Extracted fields:** Shipper name and address, consignee name and address, commodity description, quantity and unit, gross and net weight, country of origin, invoice value and currency, Incoterms (if present), document date, reference number.
- **Review and approve:** After upload, extraction results are shown in an editable form. User can correct any field before saving. Only on “Approve” is the document stored in the database (two-phase flow). If extraction fails or is partial, the UI shows clear messages (“We couldn’t extract data automatically…”, “X fields could not be extracted”) so the user can fill in manually.
- **Duplicate detection:** Uploads are fingerprinted by content. If the same document is already stored, the app shows a duplicate warning and link to the existing document; approve returns 409 so a second copy is not saved.

### Dashboard and document list

- **List:** All processed documents in a table (document type, file name, upload date, shipper, consignee, reference). Each row links to the document detail page.
- **Search:** Full-text search on shipper, consignee, commodity description, and reference number (debounced).
- **Filters:** Document type (dropdown), date range (from/to), country of origin. Date filters use a calendar date picker (react-day-picker) with light/dark theme.
- **Sort:** Sort by upload date (newest or oldest), document type (A–Z / Z–A), or file name (A–Z / Z–A).
- **Pagination:** Page size 10, 25, or 50; Previous/Next; “Page X of Y” and total count. Export CSV exports the current page (respects filters and pagination).

### Document detail

- **Metadata:** File name, document type, upload date.
- **Extracted fields:** All fields with display value (corrected value if set, else AI value). Fields that were user-corrected show “(corrected)” and the original AI value. If the document was added with no extracted data (manual entry), a short message is shown.
- **Correction history:** List of fields that were corrected, with previous AI value, corrected value, and timestamp.
- **Original file:** Link to view or download the uploaded PDF/image.

### Bonus features

- **Export to CSV:** Download the current document list (current page) as CSV (document type, file name, upload date, shipper, consignee, commodity description, reference number, document ID). Respects active search and filters.
- **Duplicate document detection:** Content fingerprint (SHA-256); duplicate warning at upload and 409 on approve with link to existing document.

## Setup instructions

**Prerequisites:** Node.js (v18+), PostgreSQL, Poppler on PATH (`pdftotext`, `pdftoppm`).

**Backend** (`backend/.env` — copy from `backend/.env.example`): `PORT`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, optional `UPLOAD_DIR` / `PENDING_UPLOAD_DIR`.

**Frontend** (`frontend/.env.local` — copy from `frontend/.env.example`): `NEXT_PUBLIC_API_URL` (backend base URL).

1. Create a PostgreSQL database (e.g. `freight_ai`). From `backend/`: `npm install`, `npx prisma migrate deploy`, `npm run db:seed`.
2. Backend: `cd backend && npm run dev` (API at `http://localhost:4000`).
3. Frontend: `cd frontend && npm install && npm run dev` (app at `http://localhost:3000`).

To run the backend in Docker (Poppler included): from `backend/`, `docker compose up --build`. Use `host.docker.internal` instead of `localhost` in `DATABASE_URL` if PostgreSQL runs on the host.

## Architecture decisions

- **Two-phase upload and human-in-the-loop:** Upload runs OCR and Claude extraction and returns extraction results; the document is not saved until the user reviews the editable form and clicks Approve. Approve moves the file from pending to final storage and creates the document, fields, and correction history.
- **Structured extraction and storage:** Extracted text is sent to Claude; structured fields are returned and stored relationally (per-field rows), not as a JSON blob. Only changed fields are sent as `correctedFields` and written to a correction-history table for an audit trail.
- **OCR pipeline:** PDFs use `pdftotext` first; if too little text is found, pages are converted via `pdftoppm` and sent to Tesseract. Images (PNG/JPEG) go directly to Tesseract.
- **Data model:** Organizations (with `org_id`) → Documents (file reference, upload timestamp, document type) → DocumentFields (`aiValue`, `correctedValue`) and CorrectionHistory. Indexes on `Document` (orgId + uploadTimestamp, orgId + fingerprint) support list queries and duplicate lookup. Multi-tenant ready via `org_id`.

## Tradeoffs

- **PDF handling:** Poppler (`pdftotext`, `pdftoppm`) is used for PDF text and page-to-image; it must be on the host or use the backend Docker image. A pure-JS PDF path exists in the codebase but is not used in the main pipeline for consistency.
- **Demo org:** A fixed demo organization ID is used; schema and APIs include `org_id` so multi-tenant use can be added later.
- **CORS:** The backend allows all origins by default; in production this would be restricted to the frontend origin.
