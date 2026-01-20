import { Router } from "express";
import { getRunReport } from "./reports.controller";

const router = Router();

router.get("/run/:runId", getRunReport);

export default router;
