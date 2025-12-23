import { Request, Response } from 'express';
import { getDb } from '../config/database';
import { User, Group } from '../models/types';

export const createUser = async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const { name, email, mobile } = req.body;
        const result = await db.run(
            'INSERT INTO users (name, email, mobile) VALUES (?, ?, ?)',
            [name, email, mobile]
        );
        const user: User = { id: result.lastID, name, email, mobile };
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const createGroup = async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const { name, memberIds } = req.body; // memberIds is array of userIds

        const result = await db.run('INSERT INTO groups (name) VALUES (?)', [name]);
        const groupId = result.lastID;

        if (memberIds && Array.isArray(memberIds)) {
            for (const userId of memberIds) {
                await db.run(
                    'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
                    [groupId, userId]
                );
            }
        }

        const group: Group = { id: groupId, name };
        res.status(201).json({ group, memberIds });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
