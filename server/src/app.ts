import express from 'express';
import { corsMiddleware } from './middlewares/cors';
import testCaseRoutes from './modules/test_cases/test_cases.routes';
//import cors from 'cors';

export const app = express();

//app.use(cors());
app.use(express.json());

// rejestracja modułów
app.use('/test_cases', testCaseRoutes);
