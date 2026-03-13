import type { FastifyInstance } from "fastify"

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (req, res) => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "freight-document-intelligence",
    }
  })
}
