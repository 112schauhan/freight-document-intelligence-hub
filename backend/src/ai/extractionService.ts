import { logError } from "../utils/logger"
import { anthropic } from "./anthropicClient"
import { buildExtractionPrompt } from "./extractionPrompt"
import { z } from "zod"

const stringOrNull = z
  .string()
  .nullable()
  .transform((v) => (v === "" || v == null ? null : v))

const extractionSchema = z.object({
  shipper_name: stringOrNull,
  shipper_address: stringOrNull,
  consignee_name: stringOrNull,
  consignee_address: stringOrNull,
  commodity_description: stringOrNull,
  quantity: stringOrNull,
  unit: stringOrNull,
  gross_weight: stringOrNull,
  net_weight: stringOrNull,
  country_of_origin: stringOrNull,
  invoice_value: stringOrNull,
  currency: stringOrNull,
  incoterms: stringOrNull,
  document_date: stringOrNull,
  reference_number: stringOrNull,
})

export async function extractStructuredData(documentText: string) {
  try {
    const prompt = buildExtractionPrompt(documentText)

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === "text")

    if (!textBlock || !("text" in textBlock))
      throw logError("Claude response does not contain text output")
    let rawText = textBlock.text.trim()
    rawText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) throw logError("No JSON found in Claude response")

    const parsed = JSON.parse(jsonMatch[0])
    const validated = extractionSchema.parse(parsed)

    return validated
  } catch (error) {
    logError("Claude extraction failed", error)
    return null
  }
}
