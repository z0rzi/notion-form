import { Client } from '@notionhq/client';
import config from './config';

type NotionProperty = {
    Status: {
        id: string;
        type: string;
        select: {
            id: string;
            name: string;
            color: string;
        };
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
    '#1': {
        id: string;
        type: string;
        number: number;
    };
    '#2': {
        id: string;
        type: string;
        number: number;
    };
    '#3': {
        id: string;
        type: string;
        number: number;
    };
    '#4': {
        id: string;
        type: string;
        number: number;
    };
    '#5': {
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
    ratings: number[];
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

    private parsePromptRatings(properties: NotionProperty): number[] {
        const out: number[] = [];
        for (let i = 1; i <= 5; i++) {
            const key = `#${i}` as '#1';
            const rating = properties[key].number;
            if (isNaN(rating) || !rating) {
                out.push(0);
            } else {
                out.push(rating);
            }
        }
        return out;
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
        const promptPage = await this.notion.databases.query({
            database_id: config.notion_database_id
        });

        const prompts: (Prompt | null)[] = promptPage.results.map((res) => {
            if (res.object !== 'page') {
                return null;
            }

            const properlyTypedRes = res as unknown as {
                properties: NotionProperty;
            };

            const ratings = this.parsePromptRatings(
                properlyTypedRes.properties
            );

            let category = '';
            try {
                category = properlyTypedRes.properties.Category.select.name;
            } catch (e) {
                category = '';
            }
            if (!category) category = '';

            try {
                const title = properlyTypedRes.properties.Prompt.title;
                return {
                    id: res.id,
                    text: title[0].plain_text,
                    category,
                    ratings: ratings
                };
            } catch (e) {
                return null;
            }
        });

        return prompts.filter((prompt) => prompt !== null) as Prompt[];
    }

    async updatePrompt_old(id: string, rating: number, rating_amount: number) {
        await this.notion.pages.update({
            page_id: id,
            properties: {
                Rating: {
                    number: rating
                },
                'Rating amount': {
                    number: rating_amount
                }
            }
        });
    }

    /**
     * Updates a prompt in Notion
     */
    async updatePrompt(id: string, ratings: number[]) {
        const properties = {} as Record<string, { number: number }>;
        for (let i = 1; i <= 5; i++) {
            properties[`#${i}`] = {
                number: ratings[i - 1]
            };
        }
        await this.notion.pages.update({
            page_id: id,
            properties
        });
    }
}
