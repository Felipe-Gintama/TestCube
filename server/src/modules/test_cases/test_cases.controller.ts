import { Request, Response } from 'express'
import { getAllTestCases, addTestCase, editTestCase, getTestCasesByUser, getTestCase } from './test_cases.service'
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
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const idParam = req.params.id;
    if (!idParam) return res.status(400).json({ error: "ID is required" });

    const id = parseInt(idParam, 10);
    const updates = req.body;

    console.log("Updating test case id:", id, "with updates:", updates);

    const updatedCase = await editTestCase(id, updates);
    res.status(200).json(updatedCase);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("updateTestCase error:", err.message, err.stack);
    res.status(500).json({ error: 'Błąd aktualizacji przypadku testowego' });
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

export async function getTestCaseById(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "ID required" });

    const testCase = await getTestCase(id);
    if (!testCase) return res.status(404).json({ error: "Not found" });

    res.json(testCase);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Error getTestCaseById:", error.message, error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
}