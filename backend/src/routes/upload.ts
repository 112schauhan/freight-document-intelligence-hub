import type { FastifyInstance } from "fastify"
import { processDocument } from "../services/documentProcessor"
import { logError } from "../utils/logger"
import path from "path"
import fs from "fs"
import { pipeline } from "stream/promises"

export default async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post("/upload", async (request, reply) => {
    try {
      const file = await request.file({
        limits: {
          fileSize: 30 * 1024 * 1024, // 30MB
        },
      })

      if (!file) {
        return reply.status(400).send({
          error: "No file uploaded",
        })
      }

      /**
       * Validate file type
       */
      const allowedTypes = ["application/pdf", "image/png", "image/jpeg"]

      if (!allowedTypes.includes(file.mimetype)) {
        return reply.status(400).send({
          error: "Unsupported file type. Only PDF, PNG, JPG allowed.",
        })
      }

      /**To ensure the upload directory exists */

      const uploadDir = path.join(process.cwd(), "tmp")
      await fs.promises.mkdir(uploadDir, { recursive: true })
      /** Create file path */
      const uniqueName = `${Date.now()}-${file.filename}`
      const filePath = path.join(uploadDir, uniqueName)

      /**Save stream to disk */
      await pipeline(file.file, fs.createWriteStream(filePath))

      /**
       * Convert stream to buffer
       */
      const buffer = await fs.promises.readFile(filePath)
      /**
       * Send file to document processing pipeline
       */
      const result = await processDocument({
        fileBuffer: buffer,
        fileName: file.filename,
        mimeType: file.mimetype,
        filePath,
      })

      /** Clean up temporary files */
      await fs.promises.unlink(filePath)

      return reply.send({
        message: "File uploaded successfully",
        fileName: file.filename,
        processingResult: result,
      })
    } catch (error) {
      logError("Upload processing failed", error)

      return reply.status(500).send({
        error: "File processing failed",
      })
    }
  })
}
