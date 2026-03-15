/** Standard extraction field keys (snake_case) used by the API and forms. */
export const EXTRACTION_FIELDS = [
  "shipper_name",
  "shipper_address",
  "consignee_name",
  "consignee_address",
  "commodity_description",
  "quantity",
  "unit",
  "gross_weight",
  "net_weight",
  "country_of_origin",
  "invoice_value",
  "currency",
  "incoterms",
  "document_date",
  "reference_number",
] as const;

export type ExtractionFieldKey = (typeof EXTRACTION_FIELDS)[number];

export function fieldLabel(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
