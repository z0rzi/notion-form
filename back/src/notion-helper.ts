import { Client } from '@notionhq/client';
import config from './config';
import { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';

type NotionProperty = {
    Corrected: {
        id: string;
        type: string;
        checkbox: boolean;
    };
    Category: {
        id: string;
        type: string;
        select: {
            id: string;
            name: string;
            color: string;
        };
    };
    'Depth /10': {
        id: string;
        type: string;
        number: number;
    };
    TimesSkipped: {
        id: string;
        type: string;
        number: number;
    };
    TimesUsed: {
        id: string;
        type: string;
        number: number;
    };
    Location: {
        id: string;
        type: string;
        select: {
            id: string;
            name: string;
            color: string;
        };
    };
    Prompt: {
        id: string;
        type: string;
        title: {
            type: string;
            text: {
                content: string;
                link: null;
            };
            annotations: {
                bold: boolean;
                italic: boolean;
                strikethrough: boolean;
                underline: boolean;
                code: boolean;
                color: string;
            };
            plain_text: string;
            href: null;
        }[] /* x1 */;
    };
};

export type Prompt = {
    id: string;
    text: string;
    category: string;
    timesUsed: number;
    timesSkipped: number;
    corrected?: boolean;
};

// Tutorial: https://developers.notion.com/docs/create-a-notion-integration#step-3-save-the-database-id

export default class NotionHelper {
    notion: Client;

    constructor() {
        if (!config.notion_secret) {
            throw new Error(
                'Notion secret not found. Please set NOTION_SECRET in your .env file.'
            );
        }
        this.notion = new Client({
            auth: config.notion_secret
        });
    }

    /**
     * Gets all the prompts from the Notion database
     */
    async getAllPrompts(): Promise<Prompt[]> {
        if (!config.notion_database_id) {
            throw new Error(
                'Notion database ID not found. Please set NOTION_DB_ID in your .env file.'
            );
        }
        let rawPrompts = [] as QueryDatabaseResponse['results'];
        let nextCursor = null as string | null;
        while (true) {
            const res = await this.notion.databases.query({
                database_id: config.notion_database_id,
                // expanding the limit
                page_size: 100,
                start_cursor: nextCursor || undefined
            });
            nextCursor = res.next_cursor;
            rawPrompts.push(...res.results);
            if (!res.has_more) break;
        }

        console.log('Retrieved %d prompts from notion', rawPrompts.length);

        const prompts: (Prompt | null)[] = rawPrompts.map((res) => {
            if (res.object !== 'page') {
                return null;
            }

            const properlyTypedRes = res as unknown as {
                properties: NotionProperty;
            };

            const corrected = properlyTypedRes.properties.Corrected.checkbox;

            let category = '';
            try {
                category = properlyTypedRes.properties.Category.select.name;
            } catch (e) {
                category = '';
            }
            if (!category) category = '';

            const timesUsed = properlyTypedRes.properties.TimesUsed.number || 0;
            const timesSkipped =
                properlyTypedRes.properties.TimesSkipped.number || 0;

            try {
                const title = properlyTypedRes.properties.Prompt.title;
                return {
                    id: res.id,
                    text: title[0].plain_text,
                    category,
                    timesUsed,
                    timesSkipped,
                    corrected
                };
            } catch (e) {
                return null;
            }
        });

        return prompts.filter((prompt) => prompt !== null) as Prompt[];
    }

    /**
     * Updates the usage of a prompt in Notion (times used and times skipped)
     */
    async updatePromptUsage(
        id: string,
        usage: { used: number; skipped: number }
    ) {
        await this.notion.pages.update({
            page_id: id,
            properties: {
                TimesUsed: { number: usage.used },
                TimesSkipped: { number: usage.skipped }
            }
        });
    }

    /**
     * Modify the notion entry to rectify the prompt, category and depth
     */
    async enrichPrompt(
        id: string,
        prompt: string,
        category: string,
        deapth: number
    ) {
        await this.notion.pages.update({
            page_id: id,
            properties: {
                Prompt: {
                    // @ts-ignore
                    title: [{ type: 'text', text: { content: prompt } }]
                },
                Category: {
                    // @ts-ignore
                    select: { name: category.toLowerCase() }
                },
                'Depth /10': {
                    // @ts-ignore
                    number: deapth
                },
                Corrected: {
                    // @ts-ignore
                    checkbox: true
                }
            }
        });
    }
}
