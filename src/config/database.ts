import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const dbPromise = open({
    filename: './database.sqlite',
    driver: sqlite3.Database
});

export const getDb = async (): Promise<Database> => {
    return dbPromise;
};

export const initDb = async () => {
    const db = await getDb();
    await db.exec('PRAGMA foreign_keys = ON;');

    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile TEXT
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      payer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      split_type TEXT NOT NULL, -- 'EQUAL', 'EXACT', 'PERCENTAGE'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (payer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS expense_splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      percentage REAL, -- Optional, used for percentage splits
      FOREIGN KEY (expense_id) REFERENCES expenses(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
    console.log('Database initialized');
};
