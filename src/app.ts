import express from 'express';
import bodyParser from 'body-parser';
import { initDb } from './config/database';
import { createUser, createGroup } from './controllers/BaseController';
import { addExpense } from './controllers/ExpenseController';
import { getGroupBalance } from './controllers/BalanceController';

const app = express();
app.use(bodyParser.json());

const PORT = 3000;

// Initialize DB
initDb().then(() => {
    console.log('Database ready');
}).catch(err => {
    console.error('Failed to init DB', err);
});

// Routes
app.get('/', (req, res) => {
    res.send('<h1>Expense Sharing API is running</h1><p>Try POST /users, /groups, /expenses</p>');
});
app.post('/users', createUser);
app.post('/groups', createGroup);
app.post('/expenses', addExpense);
app.get('/groups/:id/balance', getGroupBalance);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
