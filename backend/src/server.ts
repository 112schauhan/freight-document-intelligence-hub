import Fastify from "fastify"
import cors from "@fastify/cors"
import multipart from "@fastify/multipart"

const fastify = Fastify({ logger: true })

fastify.register(multipart)
fastify.register(cors)

fastify.get("/", async () => {
  return { hello: "world" }
})

const start = async () => {
  await fastify.listen({ port: 4000 })
}

start()
