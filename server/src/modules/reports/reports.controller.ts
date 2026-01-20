import { Request, Response } from "express";
import * as service from "./reports.service";

export async function getRunReport(req: Request, res: Response) {
  try {
    const runId = Number(req.params.runId);
    if (!runId) return res.status(400).json({ error: "runId required" });

    const [summary, byUser, tests] = await Promise.all([
      service.getRunSummary(runId),
      service.getRunByUser(runId),
      service.getRunTests(runId),
    ]);

    res.json({ summary, byUser, tests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}
