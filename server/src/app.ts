import express from 'express'
import { corsMiddleware } from './middlewares/cors'
import testCaseRoutes from './modules/testcases/routes'

export const app = express()

app.use(corsMiddleware)
app.use(express.json())

// rejestracja modułów
app.use('/testcases', testCaseRoutes)
