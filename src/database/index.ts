import { open } from '@op-engineering/op-sqlite';
import { migrations } from './migrations';

const DB_NAME = 'cinelib.db';

export const db = open({ name: DB_NAME });

export async function runMigrations() {
  try {
    const result = await db.execute('PRAGMA user_version;');
    const currentVersion = Number(result.rows?.[0]?.user_version || 0);

    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        // Split the SQL by semicolon, filter out empty strings, and execute them one by one
        const statements = migration.sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          await db.execute(statement);
        }
        
        await db.execute(`PRAGMA user_version = ${migration.version};`);
        console.log(`Applied migration: ${migration.name}`);
      }
    }
  } catch (error) {
    console.error("MIGRATION FAILED:", error);
    throw error;
  }
}

// Temporary function to force reset the database during development
export async function resetDatabase() {
  try {
    // Drop BOTH tables so we don't get "no such table" errors
    await db.execute('DROP TABLE IF EXISTS files;');
    await db.execute('DROP TABLE IF EXISTS progress;');
    await db.execute('PRAGMA user_version = 0;');
    console.log('Database reset successful. Tables dropped.');
    await runMigrations();
  } catch (error) {
    console.error('Failed to reset database:', error);
  }
}