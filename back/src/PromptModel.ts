import { getDB } from './Db';
import PromptDeamon from './PromptDeamon';
import { Prompt } from './notion-helper';

export class PromptModel {
    private db = getDB();

    private deamon = PromptDeamon.getInstance();

    /**
     * Get all the prompts from the DB
     */
    getAllPrompts(): Prompt[] {
        const stmt = this.db.prepare('SELECT * FROM prompts');
        return stmt.all() as Prompt[];
    }

    /**
     * Rate a prompt
     *
     * @param id The prompt id
     * @param rating The rating
     */
    ratePrompt(id: string, rating: number): void {
        const stmt = this.db.prepare(
            'UPDATE prompts SET rating = (rating * rating_amount + ?) / (rating_amount + 1), rating_amount = rating_amount + 1 WHERE id = ? RETURNING *'
        );
        const prompt = stmt.get(rating, id) as Prompt;

        this.deamon.addUpdate(prompt);
    }
}
