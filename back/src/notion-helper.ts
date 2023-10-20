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
    'Rating amount': {
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
    Rating: {
        id: string;
        type: string;
        number: number;
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
    rating: number;
    rating_amount: number;
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

            let category = properlyTypedRes.properties.Category.select.name;
            let rating = +properlyTypedRes.properties.Rating.number;
            let rating_amount =
                +properlyTypedRes.properties['Rating amount'].number;

            if (!category) category = '';
            if (isNaN(rating)) rating = 0;
            if (isNaN(rating_amount)) rating_amount = 0;

            try {
                const title = properlyTypedRes.properties.Prompt.title;
                return {
                    id: res.id,
                    text: title[0].plain_text,
                    category,
                    rating,
                    rating_amount
                };
            } catch (e) {
                return null;
            }
        });

        return prompts.filter((prompt) => prompt !== null) as Prompt[];
    }

    async updatePrompt(id: string, rating: number, rating_amount: number) {
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
}
