import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const DEMO_ORG_ID = "demo-org-1"

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Cannot run seed.")
  }
  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  await prisma.organization.upsert({
    where: { id: DEMO_ORG_ID },
    create: { id: DEMO_ORG_ID, name: "Demo Organization" },
    update: {},
  })

  console.log(`Seed complete: organization "${DEMO_ORG_ID}" exists.`)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
