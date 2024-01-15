import Notion from './notion-helper';
import { enrichPrompt } from './openai';

const helper = new Notion();

async function main() {
    const allPrompts = await helper.getAllPrompts();

    for (const prompt of allPrompts) {
        // if (prompt.corrected) continue;

        try {
            const enriched = await enrichPrompt(prompt.text);
            await helper.enrichPrompt(prompt.id, enriched.prompt, enriched.category, enriched.deapth)
        } catch (e) {
            console.log('main:16\t>', e);
        }
    }
}

main();
