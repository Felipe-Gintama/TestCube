import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { 
    AddTestCasePoint,
    GetTestCasePoints,
    UpdateTestCasePoint,
    DeleteTestCasePoint,
    GetTestCasePoint
} from './test_case_points.service';
import { pool } from '../../config/db';

export async function AddTestCasePointController(req: Request, res: Response) {
    try {
        const { test_case_id, description, position } = req.body;

        if (!test_case_id || !description || !position)
            return res.status(400).json({error: "Missing required fields!"});
            
        const result = await AddTestCasePoint(test_case_id, description, position ?? 0);
        res.status(201).json(result);
    }   
    catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Błąd pobierania test cases' })
    }
}

export async function GetTestCasePointsController(req: Request, res: Response) {
  try {
    const test_case_id = Number(req.params.testCaseId);
    if (!test_case_id)
      return res.status(400).json({ error: "Missing required id!" });

    const points = await GetTestCasePoints(test_case_id);

    res.status(200).json(points);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd pobierania test cases" });
  }
}

export async function UpdateTestCasePointController(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const { description, position } = req.body;
            
        const result = await UpdateTestCasePoint(description, position, id);
        res.status(200).json(result);
    }   
    catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Błąd pobierania test cases' })
    }
}

export async function DeleteTestCasePointController(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const result = await DeleteTestCasePoint(id);
        res.status(204).json(result);
    }   
    catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Błąd pobierania test cases' })
    }
}

export async function GetTestCasePointController(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ error: "Missing required id!" });

        const result = await GetTestCasePoint(id);

        // if (result.rows.length === 0) {
        //     return res.status(404).json({ error: "Test case point not found" });
        // }

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}