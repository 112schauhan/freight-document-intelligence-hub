import { logError } from "../utils/logger"
import { anthropic } from "./anthropicClient"
import { buildExtractionPrompt } from "./extractionPrompt"
import { z } from "zod"

const extractionSchema = z.object({
  shipper_name: z.string().nullable(),
  shipper_address: z.string().nullable(),
  consignee_name: z.string().nullable(),
  consignee_address: z.string().nullable(),
  commodity_description: z.string().nullable(),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
  gross_weight: z.string().nullable(),
  net_weight: z.string().nullable(),
  country_of_origin: z.string().nullable(),
  invoice_value: z.string().nullable(),
  currency: z.string().nullable(),
  incoterms: z.string().nullable(),
  document_date: z.string().nullable(),
  reference_number: z.string().nullable(),
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
