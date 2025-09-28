import {Request, Response} from 'express';
import { createUser } from './users.service';

export async function register (req: Request, res: Response) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const user = await createUser(name, email, password);
        console.log('User created', user);
        return res.status(201).json(user);
    }
    catch (err: any){
        console.error(err);
        return res.status(500).json({ error: 'Nie udało się zarejestrować użytkownika' });
    }
};