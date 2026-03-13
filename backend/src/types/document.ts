export interface ExtractedDocumentData {
  shipperName?: string
  shipperAddress?: string

  consigneeName?: string
  consigneeAddress?: string

  commodityDescription?: string

  quantity?: number
  unit?: string

  grossWeight?: number
  netWeight?: number

  countryOfOrigin?: string

  invoiceValue?: number
  currency?: string

  incoterms?: string

  documentDate?: string
  referenceNumber?: string
}
