import Fastify from "fastify"
import cors from "@fastify/cors"
import multipart from "@fastify/multipart"

const fastify = Fastify({ logger: true })

fastify.register(multipart)
fastify.register(cors)

fastify.get("/health", async (req, res) => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "freight-document-intelligence",
  }
})

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: "0.0.0.0" })
    console.log(`Server is running on port 4000`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
