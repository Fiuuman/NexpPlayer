import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const __dirname = import.meta.dirname;
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'music.db');

let db = null;

export async function connectDatabase() {
  if (db) return db;

  try {
    console.log('🔧 Подключение к SQLite...');

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('✅ База данных подключена:', dbPath);
    return db;
  } catch (error) {
    console.error('❌ Ошибка подключения к БД:', error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('База данных не инициализирована. Вызовите connectDatabase() первым.');
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
    console.log('📴 База данных отключена');
  }
}
