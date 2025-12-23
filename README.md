# Expense Sharing Application

A backend system for an expense sharing application (similar to Splitwise) built with Node.js, TypeScript, and SQLite.

## 🎯 Objective
Design a system to:
- Create groups and users.
- Add shared expenses (Equal, Exact, Percentage splits).
- Track simplified balances using a debt simplification algorithm.

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Language**: TypeScript (for type safety and maintainability)
- **Database**: SQLite (SQL for structured relational data, file-based for portability)
- **Framework**: Express.js

## 🚀 Setup & Run

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start the Server**
    ```bash
    npm start
    ```
    Server runs at `http://localhost:3000`.

3.  **Run Verification Script**
    To test the full flow (Create User -> Create Group -> Add Expense -> Check Balance):
    ```bash
    npx ts-node test_verification.ts
    ```

## 🧠 Design Decisions

### 1. Data Mode
I chose a relational schema to ensure data integrity:
- **Users**: Core identity.
- **Groups**: Context for sharing expenses.
- **Expenses**: Records the payer and total amount.
- **ExpenseSplits**: Records individual shares (who owes what).

### 2. Balance Simplification Algorithm
To minimize the number of transactions required to settle dues, I implemented a greedy algorithm:
1.  **Calculate Net Balance** for every user (Total Paid - Total Owed).
2.  **Separate** users into Debtors (Net < 0) and Creditors (Net > 0).
3.  **Greedy Matching**: Iteratively match the user with the highest debt to the user with the highest credit. This locally optimal choice tends to produce a near-optimal global reduction in edge count (transactions).

### 3. API Structure
- `POST /users`: Onboard users.
- `POST /groups`: Create expense groups.
- `POST /expenses`: Handles all split logic verification (Equal, Exact, Percentage) validation before persistence.
- `GET /groups/:id/balance`: Computes on-the-fly simplified balances.

## 🧪 Verification
A comprehensive script `test_verification.ts` is included to validate:
- Equal splits (rounding handling).
- Exact amount validation.
- Balance calculation and simplification logic.
