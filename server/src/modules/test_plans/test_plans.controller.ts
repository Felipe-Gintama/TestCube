import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import {
  createTestPlan,
  getReleaseById,
  GetTestPlans,
  cloneTestPlan,
  GetTestPlansByProject,
  deleteTestPlan,
  renameTestPlanService,
} from "./test_plans.service";

export async function GetTestPlansController(req: AuthRequest, res: Response) {
  try {
    const releasetId = req.params.releaseId;

    if (!releasetId) {
      return res.status(400).json({ error: "release id is required" });
    }

    const result = await GetTestPlans(Number(releasetId));
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function CreateTestPlanController(
  req: AuthRequest,
  res: Response
) {
  try {
    const { releaseId } = req.params;
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const release = await getReleaseById(Number(releaseId));
    if (!release) {
      return res.status(404).json({ error: "Release not found" });
    }

    const projectId = release.project_id;

    const userId = req.user?.userId || null;

    const created = await createTestPlan(
      Number(releaseId),
      name,
      description || "",
      projectId,
      userId
    );

    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function cloneTestPlanController(req: Request, res: Response) {
  try {
    const planId = Number(req.params.planId);
    const { releaseId } = req.body;

    if (!planId || !releaseId) {
      return res
        .status(400)
        .json({ error: "planId and releaseId are required" });
    }

    const cloned = await cloneTestPlan(planId, releaseId);

    return res.status(201).json(cloned);
  } catch (err) {
    console.error("Clone plan error:", err);
    return res
      .status(500)
      .json({ error: "Server error while cloning test plan" });
  }
}

export async function GetTestPlansByProjectController(
  req: Request,
  res: Response
) {
  try {
    const projectId = Number(req.params.projectId);
    if (!projectId)
      return res.status(400).json({ error: "projectId is required" });

    const plans = await GetTestPlansByProject(projectId);

    // Opcjonalnie pogrupowanie po release
    const grouped = plans.reduce((acc: any, plan: any) => {
      const releaseId = plan.release_id;
      if (!acc[releaseId]) {
        acc[releaseId] = {
          releaseId,
          releaseVersion: plan.release_version,
          plans: [],
        };
      }
      acc[releaseId].plans.push({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        created_by: plan.created_by,
        created_at: plan.created_at,
      });
      return acc;
    }, {});

    res.status(200).json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function deleteTestPlanController(
  req: AuthRequest,
  res: Response
) {
  try {
    const planId = Number(req.params.planId);

    if (!planId) {
      return res.status(400).json({ error: "planId is required" });
    }

    const deleted = await deleteTestPlan(planId);

    if (!deleted) {
      return res.status(404).json({ error: "Plan not found" });
    }

    return res.status(200).json({ message: "Plan deleted" });
  } catch (err) {
    console.error("Delete plan error:", err);
    return res
      .status(500)
      .json({ error: "Server error while deleting test plan" });
  }
}

export async function renameTestPlanController(
  req: AuthRequest,
  res: Response
) {
  const planId = Number(req.params.planId);
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "New plan name is required" });
  }

  try {
    const result = await renameTestPlanService(planId, name);

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(404).json({ message: "Test plan not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("renameTestPlan error:", err);
    res.status(500).json({ message: "Failed to rename test plan" });
  }
}
