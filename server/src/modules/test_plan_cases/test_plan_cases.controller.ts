import { Request, Response } from 'express'
import { GetAllTestCasesFromPlan, AddTestCaseToPlan, RemoveTestFromPlan } from './test_plan_cases.service'
import { AuthRequest } from '../../middlewares/authMiddleware'

export async function GetAllTestCasesFromPlanController(req: Request, res: Response) {
  try {
    const { planId } = req.params;
    const testcases = await GetAllTestCasesFromPlan(Number(planId));
    console.log("plan test cases: " + testcases);
    res.status(200).json(testcases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd servera' });
  }
}

export async function AddTestCaseToPlanController(req: Request, res: Response) {
  try {
    const { testPlanId, testCaseId } = req.body;
    console.log(req.body);

    if (!testPlanId || !testCaseId) {
      return res.status(400).json({ error: 'Brak wymaganych danych' });
    }

    const inserted = await AddTestCaseToPlan(testPlanId, testCaseId);
    res.status(201).json(inserted);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
}

export async function RemoveTestFromPlanController(req: Request, res: Response) {
  try {
    const { testPlanId, testCaseId } = req.body;

    console.log(req.body);

    if (!testPlanId || !testCaseId) {
      return res.status(400).json({ error: "Brak testPlanId lub testCaseId" });
    }

    const deleted = await RemoveTestFromPlan(Number(testPlanId), Number(testCaseId));

    if (!deleted) {
      return res.status(404).json({ error: "Test nie jest przypisany do planu" });
    }

    return res.status(200).json({ message: "Usunięto", deleted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Błąd serwera" });
  }
}

