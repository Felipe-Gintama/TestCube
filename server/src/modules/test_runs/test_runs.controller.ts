import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import {
  AddUserToRun,
  AssignUserToTests,
  FinishRun,
  FinishTestCase,
  getActiveRunsDashboard,
  GetAllTestRuns,
  GetRunsAssignedToUser,
  GetTestRuns,
  RemoveAssignment,
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
export async function GetRunsController(req: AuthRequest, res: Response) {
  try {
    const runId = req.params.runId;
    const result = await GetTestRuns(Number(runId));
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function GetAllRunsForUserController(
  req: AuthRequest,
  res: Response,
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

export async function AssignUserToTestsController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { userId, runId, testIds } = req.body;
    const result = await AssignUserToTests(userId, runId, testIds);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function RemoveAssignmentController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { runId, testIds } = req.body;
    const result = await RemoveAssignment(runId, testIds);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function FinishTestRunController(req: AuthRequest, res: Response) {
  try {
    const runId = Number(req.params.runId);
    console.log("run id ", runId);
    if (!runId) {
      return res.status(400).json({ error: "Run ID is required" });
    }

    const result = await FinishRun(runId);
    res.status(200).json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function FinishTestCaseController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { status, comment, runId, testId } = req.body;
    const result = await FinishTestCase(status, comment, runId, testId);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function getDashboardRuns(req: Request, res: Response) {
  try {
    const runs = await getActiveRunsDashboard();
    res.json(runs);
  } catch (err) {
    console.error("DASHBOARD CONTROLLER ERROR:", err);
    res.status(500).json({ error: "Failed to load dashboard runs" });
  }
}
