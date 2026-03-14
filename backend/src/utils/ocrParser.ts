import Tesseract from "tesseract.js"
import fs from "fs"

export async function runOCR(imagePaths: string[]) {
  let text = ""

  for (const imgPath of imagePaths) {
    const result = await Tesseract.recognize(fs.readFileSync(imgPath), "eng")

    text += result.data.text + "\n"
  }

  return text
}
