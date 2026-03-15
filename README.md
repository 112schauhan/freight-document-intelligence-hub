# Freight Document Intelligence Hub

Upload logistics documents (invoices, packing lists, bills of lading), review AI-extracted data, and manage your freight documents with search, filters, and correction history.

## Tech stack

- **Backend:** Node.js, Fastify, Prisma 7, PostgreSQL, Anthropic Claude, Tesseract.js, Poppler (pdftotext / pdftoppm)
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Database:** PostgreSQL (e.g. database name: `freight-ai`)

## Prerequisites

- Node.js (v18+)
- PostgreSQL
- Poppler utils (`pdftotext`, `pdftoppm`) on PATH for PDF text extraction and PDF-to-image (OCR fallback)

## Environment variables

### Backend (`backend/.env`)

Copy from `backend/.env.example`:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `4000`) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude extraction |
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/freight-ai`) |
| `UPLOAD_DIR` | Directory for approved document files (default `uploads`) |
| `PENDING_UPLOAD_DIR` | Directory for pending uploads before approval (default `uploads/pending`) |

### Frontend (`frontend/.env.local`)

Copy from `frontend/.env.example`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:4000`) |

## How to run

1. **Database:** Create a PostgreSQL database (e.g. `freight-ai`) and run migrations and seed from the backend:

   ```bash
   cd backend
   npm install
   npx prisma migrate deploy
   npm run db:seed
   ```

2. **Backend:**

   ```bash
   cd backend
   npm run dev
   ```

   API runs at `http://localhost:4000` (or your `PORT`).

3. **Frontend:**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   App runs at [http://localhost:3000](http://localhost:3000). Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to your backend URL.

## Architecture

- **Two-phase upload:** Upload sends the file to the backend; the backend runs OCR + Claude extraction and returns `uploadId`, `extraction`, etc. **No** document is saved to the DB until the user reviews and clicks **Approve** on the frontend. Approve moves the file from pending storage to final storage and creates `Document`, `DocumentField`, and `CorrectionHistory` records.
- **OCR:** PDFs use `pdftotext` first; if too little text is found, pages are converted to images via `pdftoppm` and sent to Tesseract. Images (PNG/JPEG) go straight to Tesseract.
- **Extraction:** Extracted text is sent to Claude; structured fields (shipper, consignee, commodity, etc.) are returned and stored per document. Users can correct values; only changed fields are sent as `correctedFields` and recorded in `CorrectionHistory`.
- **Data model:** Organizations → Documents (with `fileName`, `filePath`, `fingerprint`, `documentType`) → DocumentFields (`aiValue`, `correctedValue`) and CorrectionHistory for audit.

## Bonus feature: Export to CSV (Deliverable 4)

The **Documents** dashboard includes an **Export CSV** button that downloads the current filtered list as a CSV file. Logistics and customs teams often need to share document summaries in spreadsheets (Excel, Google Sheets) or feed them into other systems; exporting the list with document type, file name, upload date, shipper, consignee, commodity, and reference number in one click avoids manual copy-paste and respects the active search and filters.

## Tradeoffs / notes

- **PDF handling:** The backend uses Poppler (`pdftotext`, `pdftoppm`) for PDF text extraction and page-to-image conversion; these must be installed on the host. Alternative pure-JS PDF rendering exists in the codebase but is not used in the main pipeline.
- **Demo org:** The app uses a fixed demo organization ID (`demo-org-1`); the seed ensures this org exists. Multi-tenant org selection can be added later.

## Project structure

```
backend/          # Fastify API, Prisma, OCR, Claude extraction
frontend/         # Next.js app (upload, review, documents list/detail)
docs/             # Backend and frontend commit/verification notes
```
