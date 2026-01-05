import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import {
  AddUserToRun,
  GetAllTestRuns,
  GetRunsAssignedToUser,
  StartTestRun,
} from "./test_runs.service";

export async function StartTestRunController(req: AuthRequest, res: Response) {
  try {
    const releasetId = req.params.releaseId;
    const planId = req.params.planId;

    if (!releasetId && !planId) {
      return res.status(400).json({ error: "release and plan id is required" });
    }

    const result = await StartTestRun(Number(releasetId), Number(planId));
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function GetAllRunsController(req: AuthRequest, res: Response) {
  try {
    const result = await GetAllTestRuns();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function GetAllRunsForUserController(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = Number(req.params.userId);
    const result = await GetRunsAssignedToUser(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function AddUserToRunController(req: AuthRequest, res: Response) {
  try {
    const { userId, runId } = req.body;
    const result = await AddUserToRun(runId, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}
