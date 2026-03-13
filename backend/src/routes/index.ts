import type { FastifyInstance } from "fastify"
import healthRoutes from "./health"

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes)
}
