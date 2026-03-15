import type { FastifyInstance } from "fastify"
import healthRoutes from "./health"
import uploadRoutes from "./upload"
import documentsRoutes from "./documents"

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes)
  await fastify.register(uploadRoutes)
  await fastify.register(documentsRoutes)
}
