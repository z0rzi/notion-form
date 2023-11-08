import { getDB } from './Db';
import PromptDeamon from './PromptDeamon';
import { Prompt } from './notion-helper';

type RawPrompt = Prompt & { ratings: string };

export class PromptModel {
    private db = getDB();

    private deamon = PromptDeamon.getInstance();

    private parseRawPrompt(prompt: RawPrompt): Prompt {
        return {
            ...prompt,
            ratings: prompt.ratings.split(',').map(Number)
        };
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

    /**
     * Rate a prompt
     *
     * @param id The prompt id
     * @param rating The rating, from 1 to 5
     */
    ratePrompt(id: string, rating: number): void {
        const oldRating = this.getPrompt(id).ratings;
        oldRating[rating - 1]++;
        const stmt = this.db.prepare(
            'UPDATE prompts SET ratings = ? WHERE id = ? RETURNING *'
        );
        const prompt = stmt.get(oldRating.join(','), id) as RawPrompt;

        this.deamon.addUpdate(this.parseRawPrompt(prompt));
    }
}
