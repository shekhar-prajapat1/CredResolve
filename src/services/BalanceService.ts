import { getDb } from '../config/database';

interface Balance {
    userId: number;
    amount: number; // Positive = Credit (get back), Negative = Debt (owe)
}

interface Transaction {
    from: number;
    to: number;
    amount: number;
}

export class BalanceService {
    static async getGroupBalance(groupId: number): Promise<Transaction[]> {
        const db = await getDb();

        // 1. Get all expenses in the group
        const expenses = await db.all('SELECT * FROM expenses WHERE group_id = ?', [groupId]);
        const expenseIds = expenses.map(e => e.id);

        if (expenseIds.length === 0) return [];

        const placeHolder = expenseIds.map(() => '?').join(',');
        const splits = await db.all(
            `SELECT * FROM expense_splits WHERE expense_id IN (${placeHolder})`,
            expenseIds
        );

        // 2. Calculate Net Balances
        const balances: Record<number, number> = {};

        // Credit the payer
        expenses.forEach(expense => {
            balances[expense.payer_id] = (balances[expense.payer_id] || 0) + expense.amount;
        });

        // Debit the split users
        splits.forEach(split => {
            balances[split.user_id] = (balances[split.user_id] || 0) - split.amount;
        });

        // 3. Simplify
        return this.simplifyDebts(balances);
    }

    private static simplifyDebts(balances: Record<number, number>): Transaction[] {
        const debtors: { userId: number, amount: number }[] = [];
        const creditors: { userId: number, amount: number }[] = [];

        for (const [userId, amount] of Object.entries(balances)) {
            if (Math.abs(amount) < 0.01) continue; // Floating point threshold
            if (amount > 0) {
                creditors.push({ userId: parseInt(userId), amount });
            } else {
                debtors.push({ userId: parseInt(userId), amount: -amount }); // Store positive debt amount
            }
        }

        const transactions: Transaction[] = [];
        let i = 0; // debtor index
        let j = 0; // creditor index

        // Simple Greedy Approach
        // Ideally, we might want to sort by amount to minimize transactions further,
        // but standard greedy works well enough for simple cases.
        // Let's sort to optimize slightly: Largest amounts first often resolves things quicker.
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            const amount = Math.min(debtor.amount, creditor.amount);

            transactions.push({
                from: debtor.userId,
                to: creditor.userId,
                amount: Math.round(amount * 100) / 100
            });

            debtor.amount -= amount;
            creditor.amount -= amount;

            if (Math.abs(debtor.amount) < 0.01) i++;
            if (Math.abs(creditor.amount) < 0.01) j++;
        }

        return transactions;
    }
}
