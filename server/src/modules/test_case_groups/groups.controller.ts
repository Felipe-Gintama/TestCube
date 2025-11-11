import { Request, Response } from 'express'
import { AuthRequest } from '../../middlewares/authMiddleware'
import { 
    CreateTestGroups,
    AddSubGroup,
    DeleteGroupWithTestCases,
    DisplayAllTestCasesAndAssignedGroups,
    DisplayGroupTree,
    DisplayCountOfTestCasesInEachGroup,
    DisplayCountOfTestCasesInProject,
    FullTreeWithGropusAndTestCases,
    EditTestGroups
} from './groups.service'

export async function EditTestGroupsController(req: AuthRequest, res: Response) {
    try {
        const groupId = Number(req.params.groupId);
        let { name, description } = req.body;

        if (!groupId) {
            return res.status(400).json({ error: "GROUP ID ,NAME, DESCRIPTION is required" });
        }

        name = name?.trim() === "" ? null : name;
        description = description?.trim() === "" ? null : description;

        if (name === null && description === null) {
            return res.status(400).json({ error: "At least NAME or DESCRIPTION is required" });
        }

        const result = await EditTestGroups(name, description, groupId);
        res.status(200).json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
}

export async function CreateTestGroupsController(req: AuthRequest, res: Response) {

    try {
        const projectId = Number(req.params.projectId);
        const { name }  = req.body;

        if (!name || !projectId) {
            return res.status(400).json({ error: "ID or NAME is required" });
        }
        const newTestGroup = await CreateTestGroups(name, projectId);
        res.status(201).json(newTestGroup);
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ error: 'internal server error' });
    }
}

export async function AddSubGroupController(req: AuthRequest, res: Response) {
    try {
        const parentId = Number(req.params.parentId);
        const { name } = req.body;

        if (!name || !parentId) {
            return res.status(400).json({ error: "All variables is required" });
        }

        const newSubGroup = await AddSubGroup(name, parentId);
        res.status(200).json(newSubGroup);
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ error: 'internal server error' })
    }
}

export async function DeleteGroupWithTestCasesController(req: AuthRequest, res: Response) {
    try {
        const groupId = Number(req.params.id);

        if (!groupId) {
            return res.status(400).json({ error: "ID is required" });
        }

        const deleteGroup = await DeleteGroupWithTestCases(groupId);
        res.status(200).json(deleteGroup);
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ error: 'internal server error' })
    }
}

export async function DisplayAllTestCasesAndAssignedGroupsController(req: AuthRequest, res: Response) {
    try {
        const projectId = Number(req.params.projectId);
        console.log(projectId);

        if (!projectId) {
            return res.status(400).json({ error: "ID is required" });
        }

        const result = await DisplayAllTestCasesAndAssignedGroups(projectId);
        res.status(200).json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
}

export async function DisplayGroupTreeController(req: AuthRequest, res: Response) {
    try {
        const projectId = Number(req.params.projectId);

        if (!projectId) {
            return res.status(400).json({ error: "ID is required" });
        }

        const display = await DisplayGroupTree(Number(projectId));
        res.status(200).json(display);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
}

export async function DisplayCountOfTestCasesInEachGroupController(req: AuthRequest, res: Response) {
    try {
        const display = await DisplayCountOfTestCasesInEachGroup();
        res.status(200).json(display);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
}

export async function DisplayCountOfTestCasesInProjectController(req: AuthRequest, res: Response) {
    try {
        const projectId = Number(req.params.projectId);

        if (!projectId) {
            return res.status(400).json({ error: "ID is required" });
        }

        const display = await DisplayCountOfTestCasesInProject(projectId);
        res.status(200).json(display);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
}

export async function FullTreeWithGropusAndTestCasesController(req: AuthRequest, res: Response) {
    try {
        const projectId = Number(req.params.projectId);

        if (!projectId) {
            return res.status(400).json({ error: "Project ID is required" });
        }

        const result = await FullTreeWithGropusAndTestCases(projectId);
        res.status(200).json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
}