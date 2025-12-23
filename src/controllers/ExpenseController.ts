import { Request, Response } from 'express';
import { ExpenseService } from '../services/ExpenseService';

export const addExpense = async (req: Request, res: Response) => {
    try {
        const { groupId, payerId, amount, description, splitType, splits } = req.body;

        // Basic payload validation
        if (!groupId || !payerId || !amount || !splitType || !splits) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await ExpenseService.addExpense(groupId, payerId, amount, description, splitType, splits);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};
