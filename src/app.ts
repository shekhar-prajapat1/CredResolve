import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { initDb } from './config/database';
import { createUser, createGroup } from './controllers/BaseController';
import { addExpense } from './controllers/ExpenseController';
import { getGroupBalance } from './controllers/BalanceController';

import path from 'path';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve Static Frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

const PORT = process.env.PORT || 3000;

// Initialize DB
initDb().then(() => {
    console.log('Database ready');
}).catch(err => {
    console.error('Failed to init DB', err);
});

// Routes
// Note: We remove the root '/' route so index.html is served instead
app.post('/users', createUser);
app.post('/groups', createGroup);
app.post('/expenses', addExpense);
app.get('/groups/:id/balance', getGroupBalance);

// Only listen if run directly (not imported)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

export default app;
