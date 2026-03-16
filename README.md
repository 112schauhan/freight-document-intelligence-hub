# Freight Document Intelligence Hub

A web application where users upload logistics documents (commercial invoice, packing list, or bill of lading). AI extracts structured data; results are shown in an editable form for human-in-the-loop review, then stored and made searchable in a dashboard.

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
- **Data model:** Organizations (with `org_id`) → Documents (file reference, upload timestamp, document type) → DocumentFields (`aiValue`, `correctedValue`) and CorrectionHistory. This supports the audit trail and multi-tenant context.

## Bonus features

**Export to CSV:** The Documents dashboard has an **Export CSV** button that downloads the current filtered list as a CSV. Logistics and customs teams often need to share document summaries in spreadsheets or feed them into other systems; this avoids manual copy-paste and respects the active search and filters.

**Duplicate document detection:** Uploads are fingerprinted by content (SHA-256 of normalized extracted text). If the same document is uploaded again, the app detects it: the upload response includes a `duplicateOf` reference to the existing document, the UI shows a warning and a link to view it, and the approve endpoint returns 409 Conflict so a second copy is not saved. This keeps the document list free of duplicates and avoids double-counting in exports.

## Tradeoffs

- **PDF handling:** Poppler (`pdftotext`, `pdftoppm`) is used for PDF text and page-to-image; it must be on the host or use the backend Docker image. A pure-JS PDF path exists in the codebase but is not used in the main pipeline for consistency.
- **Demo org:** A fixed demo organization ID is used; schema and APIs include `org_id` so multi-tenant use can be added later.
- **CORS:** The backend allows all origins by default; in production this would be restricted to the frontend origin.
