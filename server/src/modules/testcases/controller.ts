import { Request, Response } from 'express'
import { getAllTestCases } from './service'

export async function getTestCases(_req: Request, res: Response) {
  try {
    const testcases = await getAllTestCases()
    res.json(testcases)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Błąd pobierania test cases' })
  }
}
