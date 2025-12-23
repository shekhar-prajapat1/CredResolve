import { Request, Response } from 'express';
import { BalanceService } from '../services/BalanceService';

export const getGroupBalance = async (req: Request, res: Response) => {
    try {
        const groupId = parseInt(req.params.id);
        if (isNaN(groupId)) return res.status(400).json({ error: 'Invalid group ID' });

        const transactions = await BalanceService.getGroupBalance(groupId);
        res.json({ transactions });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
