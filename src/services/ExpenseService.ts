import { getDb } from '../config/database';

interface SplitRequest {
    userId: number;
    amount?: number;
    percentage?: number;
}

export class ExpenseService {
    static async addExpense(
        groupId: number,
        payerId: number,
        amount: number,
        description: string,
        splitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE',
        splits: SplitRequest[]
    ) {
        // 1. Validate total amount vs splits
        await this.validateSplits(amount, splitType, splits);

        const db = await getDb();

        // 2. Insert Expense
        const expenseResult = await db.run(
            `INSERT INTO expenses (group_id, payer_id, amount, description, split_type)
       VALUES (?, ?, ?, ?, ?)`,
            [groupId, payerId, amount, description, splitType]
        );
        const expenseId = expenseResult.lastID;

        // 3. Insert Splits
        for (const split of splits) {
            let splitAmount = 0;
            if (splitType === 'EQUAL') {
                // Calculation happens in validate/pre-process, but here we expect the split object to strictly carry the calculated amount? 
                // Actually, for EQUAL, the API might just send userIds.
                // Let's refine the logic: helper should return the finalized array of splits with amounts.
                // For now, let's assume this method receives calculated splits or we recalculate here.
                // Better approach: Calculate amounts here before insertion.
            }
        }

        // Let's refactor: separate calculation/validation from insertion.
        // However, since I'm implementing it now, let's do it in one go or use a helper.
        const finalSplits = this.calculateSplitAmounts(amount, splitType, splits);

        for (const split of finalSplits) {
            await db.run(
                `INSERT INTO expense_splits (expense_id, user_id, amount, percentage)
          VALUES (?, ?, ?, ?)`,
                [expenseId, split.userId, split.amount, split.percentage || null]
            );
        }

        return { expenseId, splits: finalSplits };
    }

    private static calculateSplitAmounts(totalAmount: number, splitType: string, splits: SplitRequest[]): { userId: number, amount: number, percentage?: number }[] {
        const finalSplits: { userId: number, amount: number, percentage?: number }[] = [];

        if (splitType === 'EQUAL') {
            const count = splits.length;
            const baseAmount = Math.floor((totalAmount / count) * 100) / 100;
            let remainder = Math.round((totalAmount - (baseAmount * count)) * 100) / 100;

            splits.forEach((split, index) => {
                let amount = baseAmount;
                if (remainder > 0) {
                    amount += 0.01;
                    remainder -= 0.01;
                }
                // fix floating point precision
                amount = Math.round(amount * 100) / 100;
                finalSplits.push({ userId: split.userId, amount });
            });

        } else if (splitType === 'EXACT') {
            let sum = 0;
            splits.forEach(split => {
                if (!split.amount) throw new Error('Amount required for EXACT split');
                sum += split.amount;
                finalSplits.push({ userId: split.userId, amount: split.amount });
            });
            if (Math.abs(sum - totalAmount) > 0.01) throw new Error(`Splits sum ${sum} does not match total ${totalAmount}`);

        } else if (splitType === 'PERCENTAGE') {
            let sum = 0;
            splits.forEach(split => {
                if (!split.percentage) throw new Error('Percentage required for PERCENTAGE split');
                sum += split.percentage;
                const amount = Math.round((totalAmount * (split.percentage / 100)) * 100) / 100;
                finalSplits.push({ userId: split.userId, amount, percentage: split.percentage });
            });
            if (Math.abs(sum - 100) > 0.01) throw new Error(`Percentages sum ${sum} must be 100`);
        }

        return finalSplits;
    }

    private static async validateSplits(amount: number, splitType: string, splits: SplitRequest[]) {
        // Basic validation is handled in calculateSplitAmounts implicitly by throwing errors
        // Additional validation could be checking if users exist or are part of the group, 
        // but for this simplified version, we rely on calculations.
        if (!splits || splits.length === 0) throw new Error('Splits required');
    }
}
