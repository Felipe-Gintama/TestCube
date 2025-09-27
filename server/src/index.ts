import express from 'express'
import { pool } from './config/db'
import cors from 'cors'

const app = express()

app.use(cors({
  origin: 'http://localhost:5173'
}))

app.use(express.json())

app.get('/testcases', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, title, description FROM testcases ORDER BY id')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Błąd połączenia z bazą' })
  }
})

app.listen(4000, () => console.log('Server running on http://localhost:4000'))

