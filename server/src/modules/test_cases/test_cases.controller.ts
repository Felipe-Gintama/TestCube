import { Request, Response } from 'express'
import { getAllTestCases, addTestCase, editTestCase, getTestCasesByUser } from './test_cases.service'
import { AuthRequest } from '../../middlewares/authMiddleware'

export async function getTestCases(_req: Request, res: Response) {
  try {
    const testcases = await getAllTestCases()
    res.json(testcases)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Błąd pobierania test cases' })
  }
}

export async function createTestCase(req: AuthRequest, res: Response) {

  if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

  try {
    const userId = req.user.userId;
    const { title, description, expected_result, project_id } = req.body;
    const newCase = await addTestCase( title, description, expected_result, project_id, userId );
    res.status(201).json(newCase);
  }
  catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: 'Błąd dodawania przypadku testowego' })
  }
}

export async function updateTestCase(req: AuthRequest, res: Response) {
  if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({ error: "ID is required" });
    }
    const id = parseInt(idParam, 10);

    const updates = req.body;

    const updatedCase = await editTestCase(id, updates);
    res.status(200).json(updatedCase);
  }
  catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji przypadku testowego' })
  }
}

export async function getUserTestCases(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
  try {
      const userId = req.user.userId;
      const testCases = await getTestCasesByUser(userId);
      res.json(testCases);
  } catch (err) {
      res.status(500).json({ error: "Cannot fetch test cases" });
  }
}
