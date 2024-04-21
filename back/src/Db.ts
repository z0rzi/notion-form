import SqliteDB, { Database as SqlDBType } from 'better-sqlite3';
import fs from 'fs';
import config from './config';

export function checkDbExistsOnFilesystem(dbPath: string): boolean {
    if (!dbPath.endsWith('.sqlite')) return false;
    if (!fs.existsSync(dbPath)) return false;

    return true;
}

/**
 * Indicates if the Db is ready for use, meaning the structure is correct.
 */
export function isDbReady(db: SqlDBType): boolean {
    try {
        const stmt = db.prepare('SELECT * FROM prompts');
        stmt.run();
    } catch (err) {
        // console.error(err);
        return false;
    }

    return true;
}

export type DbQueryParams = (string | Date | boolean | number | null);

export default class Database {
    private static instance: Database;
    private db: SqlDBType;

    private constructor(private readonly dbPath: string) {
        if (!checkDbExistsOnFilesystem(dbPath)) {
            console.log('Database file does not exist. Creating a new one.');
            fs.writeFileSync(dbPath, '');
        }

        this.db = new SqliteDB(dbPath);
        if (!isDbReady(this.db)) {
            this.buildSchema();
        }
    }

    public static getInstance(dbPath = config.db_path): Database {
        if (!Database.instance) {
            Database.instance = new Database(dbPath);
        }

        if (dbPath !== Database.instance.dbPath) {
            throw new Error('Cannot create a new instance with a different path');
        }

        return Database.instance;
    }

    all<T = unknown>(query: string, params: DbQueryParams[] = []): T[] {
        return this.db.prepare(query).all(...params) as T[];
    }

    get<T>(query: string, params: DbQueryParams[] = []): T {
        return this.db.prepare(query).get(...params) as T;
    }

    run(query: string, params: DbQueryParams[] = []): void {
        this.db.prepare(query).run(...params);
    }

    /**
     * Reloads all the prompts, but keeps the users.
     */
    clearPrompts() {
        const sqlQuery = `
            DROP TABLE IF EXISTS prompts;

            CREATE TABLE IF NOT EXISTS prompts (
                id text PRIMARY KEY,
                text text NOT NULL,
                category text,
                timesUsed number,
                timesSkipped number
            );
        `;

        this.db.exec(sqlQuery);
    }

    buildSchema() {
        const sqlQuery = `
            DROP TABLE IF EXISTS prompts;
            DROP TABLE IF EXISTS users;

            CREATE TABLE IF NOT EXISTS prompts (
                id text PRIMARY KEY,
                text text NOT NULL,
                category text,
                timesUsed number,
                timesSkipped number
            );

            CREATE TABLE IF NOT EXISTS users (
                id number PRIMARY KEY,
                prompts text
            );
        `;

        this.db.exec(sqlQuery);
    }
}
