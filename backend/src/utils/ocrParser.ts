import Tesseract from "tesseract.js"
import fs from "fs"

/** Run OCR on multiple images in parallel to reduce total time. */
export async function runOCR(imagePaths: string[]): Promise<string> {
  if (imagePaths.length === 0) return ""

  const results = await Promise.all(
    imagePaths.map((imgPath) =>
      Tesseract.recognize(fs.readFileSync(imgPath), "eng"),
    ),
  )

  return results.map((r) => r.data.text).join("\n")
}
