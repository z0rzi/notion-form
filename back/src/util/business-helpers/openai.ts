import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import path from 'path';
import fl from 'fast-levenshtein';

const configuration = new Configuration({
    apiKey: fs
        .readFileSync(
            path.join(process.env['HOME']!, '.config', 'openapi-token.conf'),
            { encoding: 'utf8' }
        )
        .trim()
});

const openai = new OpenAIApi(configuration);

const categories = [
    'gratitude and positivity',
    'love and relationships',
    'creativity and expression',
    'career and goals',
    'self-reflection',
    'actions',
]

/**
 * Request a response from the AI
 *
 * @param question    The question to ask the AI
 * @param maxTokens   The max amount of words returned by the AI
 *
 * @returns A string containing the AI's response
 *
 * @throws An error if the question is `null` or if the request fails
 */
export async function askAI(
    question: string,
    profile: 'code' | 'comments' | 'creative',
    maxTokens = 1000
) {
    let topP = 1;
    let temperature = 1;

    switch (profile) {
        case 'comments':
            temperature = 0.3;
            topP = 0.2;
            break;
        case 'code':
            temperature = 0.2;
            topP = 0.1;
            break;
        case 'creative':
            temperature = 0.6;
            topP = 0.7;
            break;
        default:
            temperature = 0.2;
            topP = 0.1;
            break;
    }

    return openai
        .createCompletion({
            model: 'gpt-3.5-turbo-instruct',
            prompt: question,
            temperature,
            top_p: topP,
            max_tokens: maxTokens
        })
        .then((response) => {
            const textRes = response.data.choices[0].text!.trim();
            return textRes;
        })
        .catch((err) => {
            console.error(err.message);
            return '';
        });
}

export async function enrichPrompt(initalPrompt: string) {
    const aiPrompt = `
    Your role is to correct and classify journaling prompts.

    1. Correcting task
        The prompt should always keep the same meaning. Correct the eventual grammar mistakes, and if necessary, reformulate the prompt to make it sound more natural.
        For example: "What are the 3 important goals I have now?" => "What are 3 important goals I am currently pursuing?"

        Each prompt should be written in the first person ('I', not 'you'). If the prompt starts with an imperative verb (e.g. "Describe", "Explain", or "Write"), the sentence should be modified to make it an "I" sentence.
        For example: 
            "Describe your happiest childhood memory" => "What is my happiest childhood memory?"
            "Who do you trust most? why?" => "Who do I trust most? Why?"

        Here are a few example:
            "Describe a choice you regret making. What did you learn from it?" => "What is a choice I regret making? What did I learn from it?"
            "How do you show compassion for others? How can you extend that same compassion to yourself?" => "How do I show compation for others? How could I extend that same compation to myself?"
            "What is the thing you like the most about yourself? Why?" => "What is the thing I like the most about myself? Why?"
            "Describe the last time you felt guilt, anger or shame. What did you learn from it?" => "When is the last time I felt guilt, anger or shame? What did I learn from it?"

    2. Classification task
        Each prompt should be classified in one of the following category:
            - ${categories.join('\n            - ')}

        "action" is a special category where the player should do something that does not involve journaling.
        For example, "Send a message to a loved one" would be an action prompt.

        Finally, for each prompt, you should indicate how "deap" the prompt is. A deep prompt will often be harder to answer, and require more emotional involvement.
        For example, "What is something that made you happy today?" has a deapth of 2/10. But "What is something you always regreted saying to someone?" has a deapth of 8/10.
    
    Answer using the following format:

    \`\`\`
    {
        "prompt": "The corrected prompt",
        "category": "category name",
        "deapth": "deapth/10"
    }
    \`\`\`

    The prompt I want you to treat now is the following:
    ${initalPrompt}
    `;

    const res = await askAI(aiPrompt, 'creative');

    // finding the JSON in the response
    const jsonStart = res.indexOf('{');
    const jsonEnd = res.lastIndexOf('}') + 1;

    const json = res.substring(jsonStart, jsonEnd);

    const parsed = JSON.parse(json);

    if (!parsed.prompt || !parsed.category || !parsed.deapth) {
        throw new Error('Could not parse the response');
    }

    // parsing the deapth
    const deapthMatches = parsed.deapth.match(/(\d+)/);

    if (!deapthMatches) {
        throw new Error('Could not parse the deapth');
    }

    const deapth = parseInt(deapthMatches[0]);

    if (deapth < 0 || deapth > 10) {
        throw new Error('Deapth must be between 0 and 10');
    }

    let categoriesScores = {} as Record<string, number>;

    for (const category of categories) {
        categoriesScores[category] = fl.get(category, parsed.prompt);
    }

    // Keeping the category with the lowest score
    const sortedCategories = Object.entries(categoriesScores).sort(
        (a, b) => a[1] - b[1]
    );

    let category = sortedCategories[0][0];

    return {
        prompt: parsed.prompt,
        category,
        deapth
    };
}
