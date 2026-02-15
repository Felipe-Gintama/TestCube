import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  AddPlanToReleaseController,
  CreateTestPlanController,
  GetReleasesTestPlansByProjectController,
  GetTestPlansByProjectController,
  GetTestPlansController,
  RemovePlanFromReleaseController,
  cloneTestPlanController,
  deleteTestPlanController,
  renameTestPlanController,
} from "./test_plans.controller";

const router = Router();

router.get("/:releaseId/plans", authMiddleware, GetTestPlansController);
router.post("/new/:releaseId", authMiddleware, CreateTestPlanController);
router.post("/:planId/clone", authMiddleware, cloneTestPlanController);
router.get("/:projectId", authMiddleware, GetTestPlansByProjectController);
router.get(
  "/:projectId/releases",
  authMiddleware,
  GetReleasesTestPlansByProjectController,
);
router.delete("/:planId", authMiddleware, deleteTestPlanController);
router.put("/:planId", authMiddleware, renameTestPlanController);
router.post("/addPlan", authMiddleware, AddPlanToReleaseController);
router.delete(
  "/:planId/:releaseId",
  authMiddleware,
  RemovePlanFromReleaseController,
);

export default router;
