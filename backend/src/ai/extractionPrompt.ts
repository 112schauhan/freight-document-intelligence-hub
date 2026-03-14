export function buildExtractionPrompt(documentText: string) {
  return `
You are an expert logistics document parser.

Your task is to extract structured information from freight and shipping documents.

IMPORTANT RULES:
- Return ONLY valid JSON
- Do NOT include markdown
- Do NOT wrap the response in \`\`\`json
- Do NOT include explanations
- If a field is missing return null
- Ensure the response is strictly valid JSON

JSON structure to return:

{
  "shipper_name": string | null,
  "shipper_address": string | null,
  "consignee_name": string | null,
  "consignee_address": string | null,
  "commodity_description": string | null,
  "quantity": string | null,
  "unit": string | null,
  "gross_weight": string | null,
  "net_weight": string | null,
  "country_of_origin": string | null,
  "invoice_value": string | null,
  "currency": string | null,
  "incoterms": string | null,
  "document_date": string | null,
  "reference_number": string | null
}

Document text:
${documentText}
`
}
