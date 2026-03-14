import { execFile } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import os from "os"

const execFileAsync = promisify(execFile)

export async function convertPdfToImages(buffer: Buffer): Promise<string[]> {
  const tmpDir = os.tmpdir()

  const inputPath = path.join(tmpDir, `input-${Date.now()}.pdf`)
  const outputPrefix = path.join(tmpDir, `page-${Date.now()}`)

  fs.writeFileSync(inputPath, buffer)

  try {
    await execFileAsync("pdftoppm", ["-png", inputPath, outputPrefix])

    const files = fs.readdirSync(tmpDir)

    const images = files
      .filter((file) => file.startsWith(path.basename(outputPrefix)))
      .map((file) => path.join(tmpDir, file))

    return images
  } catch (err) {
    console.error("pdftoppm failed", err)

    return []
  }
}
