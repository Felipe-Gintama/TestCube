// import express from 'express'
// import { pool } from './config/db'
// import cors from 'cors'

// import { Router } from 'express';
// import usersRoutes from './modules/users/users.routes';
// import authRoutes from './modules/auth/auth.routes';

// const app = express()

// app.use(cors({
//   origin: 'http://localhost:5173'
// }))

// app.use(express.json())

// app.use('/api/users', usersRoutes);
// app.use('/api/auth', authRoutes);

// app.get('/testcases', async (_req, res) => {
//   try {
//     const result = await pool.query('SELECT id, title, description FROM testcases ORDER BY id')
//     res.json(result.rows)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: 'Błąd połączenia z bazą' })
//   }
// })

//app.listen(4000, () => console.log('Server running on http://localhost:4000'))

import express from 'express';
import usersRouter from './modules/users/users.routes';
import authRouter from './modules/auth/auth.routes';
import testCasesRouter from './modules/test_cases/test_cases.routes';
import projectsRouter from './modules/projects/projects.routes';
import groupsRouter from './modules/test_case_groups/groups.routes';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/test_cases', testCasesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/groups', groupsRouter);

app.listen(4000, () => console.log('Server running on http://localhost:4000'));


