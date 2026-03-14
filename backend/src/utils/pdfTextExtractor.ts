import { execFile } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import os from "os"

const execFileAsync = promisify(execFile)

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const tmpDir = os.tmpdir()

  const inputPath = path.join(tmpDir, `input-${Date.now()}.pdf`)
  const outputPath = path.join(tmpDir, `output-${Date.now()}.txt`)

  fs.writeFileSync(inputPath, buffer)

  try {
    await execFileAsync("pdftotext", ["-layout", inputPath, outputPath])

    const text = fs.readFileSync(outputPath, "utf8")

    return text
  } catch (err) {
    console.error("pdftotext failed", err)

    return ""
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
  }
}
