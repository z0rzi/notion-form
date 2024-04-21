import Database from './Db';
import PromptDeamon from './PromptDeamon';
import { Prompt } from './notion-helper';

type RawPrompt = Prompt;

export class PromptModel {
    private db = Database.getInstance();

    private deamon = PromptDeamon.getInstance();

    private parseRawPrompt(prompt: RawPrompt): Prompt {
        return { ...prompt };
    }

    /**
     * Get all the prompts from the DB
     */
    getAllPrompts(): Prompt[] {
        const prompts = this.db.all<Prompt>('SELECT * FROM prompts');
        return prompts.map(this.parseRawPrompt);
    }

    getPrompt(id: string): Prompt {
        const prompt = this.db.get<Prompt>('SELECT * FROM prompts WHERE id = ?', [id]);
        return this.parseRawPrompt(prompt);
    }

    usePrompt(id: string): void {
        this.db.run(
            'UPDATE prompts SET timesUsed = timesUsed + 1 WHERE id = ?'
        );

        const prompt = this.getPrompt(id);

        this.deamon.addUpdate(prompt);
    }

    skipPrompt(id: string): void {
        this.db.run(
            'UPDATE prompts SET timesSkipped = timesSkipped + 1 WHERE id = ?'
        );

        const prompt = this.getPrompt(id);

        this.deamon.addUpdate(prompt);
    }
}
