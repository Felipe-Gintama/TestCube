import express from 'express';
import usersRouter from './modules/users/users.routes';
import authRouter from './modules/auth/auth.routes';
import testCasesRouter from './modules/test_cases/test_cases.routes';
import projectsRouter from './modules/projects/projects.routes';
import groupsRouter from './modules/test_case_groups/groups.routes';
import testCasePointsRouter from './modules/test_case_points/test_case_points.routes';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/test_cases', testCasesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/test_case_points', testCasePointsRouter);

app.listen(4000, () => console.log('Server running on http://localhost:4000'));


