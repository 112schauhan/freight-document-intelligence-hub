import type { FastifyInstance } from "fastify"
import { processDocument } from "../services/documentProcessor"
import { logError } from "../utils/logger"

export default async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post("/upload", async (request, reply) => {
    try {
      const file = await request.file()

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

      /**
       * Convert stream to buffer
       */
      const buffer = await file.toBuffer()

      /**
       * Send file to document processing pipeline
       */
      const result = await processDocument({
        fileBuffer: buffer,
        fileName: file.filename,
        mimeType: file.mimetype,
      })

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
