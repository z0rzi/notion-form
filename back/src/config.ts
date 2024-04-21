import fs from 'fs';
import path from 'path';

export function loadDotEnv() {
    let wd = __dirname;

    while (!fs.existsSync(path.join(wd, '.env'))) {
        wd = path.dirname(wd);
        if (wd === '/') return;
    }

    const contents = fs.readFileSync(path.join(wd, '.env'), {
        encoding: 'utf8'
    });
    const lines = contents.split(/\n/g).filter((line) => !!line.trim());
    lines.forEach((line) => {
        const elems = line.split('=');
        process.env[elems[0]] = elems.slice(1).join('=');
    });
}

loadDotEnv()

export default {
    notion_secret: process.env.NOTION_SECRET,
    notion_database_id: process.env.NOTION_DB_ID,
    db_path: path.join(__dirname, '../prompts.sqlite')
};
