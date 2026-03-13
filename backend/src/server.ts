import Fastify from "fastify"
import cors from "@fastify/cors"
import multipart from "@fastify/multipart"
import { registerRoutes } from "./routes"
import { logError, logInfo } from "./utils/logger"

const fastify = Fastify({ logger: true })

fastify.register(multipart)
fastify.register(cors)

const start = async () => {
  try {
    await registerRoutes(fastify)
    await fastify.listen({ port: 4000, host: "0.0.0.0" })
    logInfo(`Server is running on port 4000`)
  } catch (err) {
    logError("Failed to start server", err)
    process.exit(1)
  }
}

start()
