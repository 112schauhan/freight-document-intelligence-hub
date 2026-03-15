export function buildExtractionPrompt(documentText: string) {
  return `You are an expert logistics document parser. Extract structured data from the following freight document.

Document types you may see: commercial invoice, packing list, bill of lading, or combined (e.g. "Commercial Invoice & Packing List"). Use the same field mapping for all.

Field mapping (extract exactly as written; use null if absent or unreadable):
- shipper_name, shipper_address — from "Shipper", "Exporter", "Seller", or "From" (name and full address).
- consignee_name, consignee_address — from "Consignee", "Buyer", "Importer", or "To" (name and full address).
- commodity_description — from "Description", "Description of goods", "Commodity", or item list; use main description or first line; combine multiple lines into one string if needed.
- quantity — numeric or alphanumeric quantity (e.g. "10580", "6 PKGS"); omit unit text here.
- unit — unit of measure (e.g. "units", "PCS", "PKGS", "CTNS").
- gross_weight — as shown (e.g. "39.070 KGS", "100 KGS").
- net_weight — as shown; null if not present.
- country_of_origin — from "Country of origin", "Origin", "Made in", or similar.
- invoice_value — declared value, invoice amount, or total (number only or with decimals; omit currency symbol).
- currency — currency code (e.g. "USD", "EUR").
- incoterms — terms such as FOB, CIF, EXW, DDP (include place if given, e.g. "FOB XINGANG TIANJIN").
- document_date — invoice date, document date, or date of issue (any clear date format).
- reference_number — invoice number, PI number, reference, order number, or document ID (e.g. "25HE5130032", "PI1693").

Rules:
- Return ONLY a single JSON object. No markdown, no \`\`\`json, no explanation.
- Use null for any field that is missing, blank, or cannot be determined.
- Preserve exact wording and formatting from the document (including spacing and units). Do not summarize or paraphrase.
- If text is from OCR and contains errors, use the best interpretation you can; use null only when the value is truly absent.
- For combined documents (e.g. invoice + packing list), prefer invoice-level data (one shipper/consignee, main totals); for quantity/commodity you may use the main line or first item.

Output this JSON only:
{"shipper_name":null,"shipper_address":null,"consignee_name":null,"consignee_address":null,"commodity_description":null,"quantity":null,"unit":null,"gross_weight":null,"net_weight":null,"country_of_origin":null,"invoice_value":null,"currency":null,"incoterms":null,"document_date":null,"reference_number":null}

Document text:
${documentText}`
}
