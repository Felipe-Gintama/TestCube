import { Request, Response } from 'express'
import { AuthRequest } from '../../middlewares/authMiddleware'
import { createRelease, deleteReleaseById, GetAllReleasesFromProject } from './releases.service'

export async function GetReleasesController(req: AuthRequest, res: Response) {
    try {
        const projectId  = Number(req.params.projectId);

        if (!projectId) {
            return res.status(400).json({ error: "ID is required" });
        }

        const releases = await GetAllReleasesFromProject(projectId);
        console.error(releases);
        res.status(200).json(releases);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
}

export async function CreateReleaseController(req: Request, res: Response) {
  try {
    const { projectId, version, description, releasedAt } = req.body;

    if (!projectId || !version) {
      return res.status(400).json({ error: "projectId i version są wymagane" });
    }

    const release = await createRelease( projectId, version, description, releasedAt );

    return res.status(201).json(release);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Błąd serwera przy tworzeniu release" });
  }
}

export async function DeleteReleaseController(req: Request, res: Response) {
  try {
    const { releaseId } = req.params;

    if (!releaseId) {
      return res.status(400).json({ error: "Brak releaseId w parametrach" });
    }

    const deleted = await deleteReleaseById(Number(releaseId));

    if (!deleted) {
      return res.status(404).json({ error: "Release nie istnieje" });
    }

    return res.status(200).json({ message: "Release usunięty", deleted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Błąd serwera" });
  }
}

