import { getDB } from '../../database/Db';
import PromptDeamon from './PromptDeamon';
import { Prompt } from './notion-helper';

type RawPrompt = Prompt;

export class PromptModel {
    private db = getDB();

    private deamon = PromptDeamon.getInstance();

    private parseRawPrompt(prompt: RawPrompt): Prompt {
        return { ...prompt };
    }

    /**
     * Get all the prompts from the DB
     */
    getAllPrompts(): Prompt[] {
        const stmt = this.db.prepare('SELECT * FROM prompts');
        const prompts = stmt.all();
        return prompts.map(this.parseRawPrompt);
    }

    getPrompt(id: string): Prompt {
        const stmt = this.db.prepare('SELECT * FROM prompts WHERE id = ?');
        const prompt = stmt.get(id) as RawPrompt;
        return this.parseRawPrompt(prompt);
    }

    usePrompt(id: string): void {
        const stmt = this.db.prepare(
            'UPDATE prompts SET timesUsed = timesUsed + 1 WHERE id = ?'
        );
        stmt.run(id);

        const prompt = this.getPrompt(id);

        this.deamon.addUpdate(prompt);
    }

    skipPrompt(id: string): void {
        const stmt = this.db.prepare(
            'UPDATE prompts SET timesSkipped = timesSkipped + 1 WHERE id = ?'
        );
        stmt.run(id);

        const prompt = this.getPrompt(id);

        this.deamon.addUpdate(prompt);
    }
}
