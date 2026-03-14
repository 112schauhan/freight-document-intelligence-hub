import { createCanvas, DOMMatrix, ImageData } from "canvas"
;(global as any).DOMMatrix = DOMMatrix
;(global as any).ImageData = ImageData
;(global as any).Path2D = class {}

export async function renderPdfPagesToImages(buffer: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const { getDocument } = pdfjs
  const loadingTask = getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise
  const images: Buffer[] = []

  for (let i = 1; i <= Math.min(pdf.numPages, 2); i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = createCanvas(viewport.width, viewport.height)
    const context = canvas.getContext("2d")
    await page.render({
      canvasContext: context as any,
      canvas: canvas as any,
      viewport,
    }).promise

    images.push(canvas.toBuffer())
  }

  return images
}
