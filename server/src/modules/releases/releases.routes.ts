import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  CreateReleaseController,
  DeleteReleaseController,
  GetReleasesController,
  renameReleaseController,
} from "./releases.controller";

const router = Router();

router.get("/:projectId", authMiddleware, GetReleasesController);
router.post("/new", authMiddleware, CreateReleaseController);
router.delete("/:releaseId", DeleteReleaseController);
router.put("/rename/:releaseId", authMiddleware, renameReleaseController);

export default router;
