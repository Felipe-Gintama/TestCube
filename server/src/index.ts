import express from 'express'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()
const app = express()
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.get('/testcases', async (_req, res) => {
  const cases = await prisma.testCase.findMany()
  res.json(cases)
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Server listening on port ${port}`))
