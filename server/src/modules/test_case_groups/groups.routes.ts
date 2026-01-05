import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  CreateTestGroupsController,
  AddSubGroupController,
  DeleteGroupWithTestCasesController,
  DisplayAllTestCasesAndAssignedGroupsController,
  DisplayGroupTreeController,
  DisplayCountOfTestCasesInEachGroupController,
  DisplayCountOfTestCasesInProjectController,
  FullTreeWithGropusAndTestCasesController,
  EditTestGroupsController,
  FullTreeWithGropusAndTestCasesForRunController,
} from "./groups.controller";

const router = Router();

router.post(
  "/projects/:projectId/groups",
  authMiddleware,
  CreateTestGroupsController
);
router.post("/:parentId/subgroup", authMiddleware, AddSubGroupController);
router.delete("/:id", authMiddleware, DeleteGroupWithTestCasesController);
router.get(
  "/projects/:projectId/groups/flat",
  authMiddleware,
  DisplayAllTestCasesAndAssignedGroupsController
);
router.get(
  "/projects/:projectId/groups/tree",
  authMiddleware,
  DisplayGroupTreeController
);
router.get(
  "/testCases/count",
  authMiddleware,
  DisplayCountOfTestCasesInEachGroupController
);
router.get(
  "/projects/:projectId/groups/testCases/count",
  authMiddleware,
  DisplayCountOfTestCasesInProjectController
);
router.get(
  "/projects/:projectId/groups/testCases/tree",
  authMiddleware,
  FullTreeWithGropusAndTestCasesController
);
router.get(
  "/:runId/groups/testCases/tree",
  authMiddleware,
  FullTreeWithGropusAndTestCasesForRunController
);
router.patch("/:groupId", authMiddleware, EditTestGroupsController);

export default router;
