import { getDB } from './Db';
import NotionHelper, { Prompt } from './notion-helper';

export default class PromptDeamon {
    private static instance = null as PromptDeamon | null;
    static getInstance() {
        if (!PromptDeamon.instance) {
            PromptDeamon.instance = new PromptDeamon();
        }
        return PromptDeamon.instance;
    }

    private constructor() {}

    private notionHelper = new NotionHelper();
    private db = getDB();

    /**
     * The queue of prompts to update
     *
     * Using a queue because the notion API might not like receiving too many
     * requests at once
     */
    private updateQueue = [] as Prompt[];

    /**
     * Add a prompt to the update queue.
     * If the prompt is already in the queue, it will be replaced.
     */
    addUpdate(prompt: Prompt) {
        const idx = this.updateQueue.findIndex((p) => p.id === prompt.id);

        if (idx >= 0) {
            // The prompt is already in the queue
            this.updateQueue[idx] = prompt;
        } else {
            // The prompt is not in the queue
            this.updateQueue.push(prompt);
        }
    }

    /**
     * Picks the first prompt in the queue and updates it in Notion
     */
    private updatePrompt() {
        const prompt = this.updateQueue.shift();
        if (!prompt) return;

        this.notionHelper.updatePrompt(prompt.id, prompt.ratings);
    }

    /**
     * Removes every prompt from the DB and re-populates it with the prompts
     * from Notion.
     *
     * If a prompt is in the update queue, it will be used instead of the one
     * from Notion.
     */
    private refreshPromptsDb() {
        this.notionHelper.getAllPrompts().then((prompts) => {
            this.db.prepare('DELETE FROM prompts').run();

            const stmt = this.db.prepare(
                'INSERT INTO prompts (id, text, category, ratings) VALUES (?, ?, ?, ?)'
            );

            prompts.forEach((prompt) => {
                const queuePrompt = this.updateQueue.find(
                    (p) => p.id === prompt.id
                );
                if (queuePrompt) prompt = queuePrompt;

                stmt.run(
                    prompt.id,
                    prompt.text,
                    prompt.category,
                    prompt.ratings.join(',')
                );
            });
        });
    }

    private refreshPromptId = null as NodeJS.Timeout | null;
    private updatePromptId = null as NodeJS.Timeout | null;

    /**
     * Runs the deamon
     */
    run() {
        if (this.refreshPromptId) clearInterval(this.refreshPromptId);
        if (this.updatePromptId) clearInterval(this.updatePromptId);

        this.refreshPromptsDb();
        this.refreshPromptId = setInterval(() => {
            // Running every hour
            this.refreshPromptsDb();
        }, 1000 * 60 * 60);

        this.updatePrompt();
        this.updatePromptId = setInterval(() => {
            // Running every 10 seconds
            this.updatePrompt();
        }, 1000 * 10);
    }
}
