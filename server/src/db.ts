import express from 'express'
import * as dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const app = express()
app.use(express.json())

// test połączenia z bazą
app.get('/users', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now')
    res.json({ message: 'Baza działa!', time: result.rows[0].now })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Błąd połączenia z bazą' })
  }
})

app.listen(4000, () => console.log('Server running on http://localhost:4000'))
