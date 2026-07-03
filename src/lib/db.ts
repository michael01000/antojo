import { PrismaClient } from '@prisma/client'
// Cargar .env explícitamente (Turbopack no siempre lo hace antes de Prisma).
// En Vercel las vars ya están inyectadas, así que esto es solo para dev local.
import { config } from 'dotenv'
config()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
