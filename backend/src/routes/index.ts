import type { FastifyInstance } from "fastify"
import healthRoutes from "./health"
import uploadRoutes from "./upload"

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes)
  await fastify.register(uploadRoutes)
}
