export interface User {
    id?: number;
    name: string;
    email: string;
    mobile?: string;
}

export interface Group {
    id?: number;
    name: string;
}

export interface Expense {
    id?: number;
    group_id: number;
    payer_id: number;
    amount: number;
    description?: string;
    split_type: 'EQUAL' | 'EXACT' | 'PERCENTAGE';
    created_at?: string;
}

export interface ExpenseSplit {
    id?: number;
    expense_id: number;
    user_id: number;
    amount: number;
    percentage?: number;
}
