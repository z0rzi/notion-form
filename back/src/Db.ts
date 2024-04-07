import Database, { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dirname = __dirname;

const dbExists = fs.existsSync(path.join(dirname, '../prompts.sqlite'));
if (!dbExists) {
    fs.writeFileSync(path.join(dirname, '../prompts.sqlite'), '');
}

const db = new Database(
    path.join(dirname, '../prompts.sqlite'),
    // { verbose: console.log }
);

function isDbReady(): boolean {
    try {
        const stmt = db.prepare('SELECT * FROM prompts');
        stmt.run();
    } catch (err) {
        // console.error(err);
        return false;
    }

    return true;
}

/**
 * Reloads all the prompts, but keeps the users.
 */
export function resetDb() {
    const schema_txt = fs.readFileSync(
        path.join(dirname, '../db-schema.sql'),
        { encoding: 'utf8' }
    );
    db.exec(schema_txt);
}

let dbIsReady = false;
export function getDB(): DatabaseType {
    if (!dbIsReady && !isDbReady()) {
        resetDb();
        dbIsReady = true;
    }
    return db;
}
