import express, { Request, Response } from 'express';
import { PromptModel } from '../util/business-helpers/PromptModel';
import { UserModel } from '../util/business-helpers/UserModel';

const routes = express.Router();

function extractUserId(req: Request): number | null {
    const userId = Number(req.headers['x-user-id'] as string);
    if (userId == null || isNaN(userId)) {
        return null;
    }
    return userId;
}

routes.get('/user-id', (_req: Request, res: Response) => {
    const userModel = new UserModel();
    const userId = userModel.getUnusedUserId();
    return res.status(200).send(userId.toString());
});

routes.get('/prompts', (req: Request, res: Response) => {
    const userId = extractUserId(req);
    const amount = Number(req.query.amount) || 5;
    const excludedPromptsRaw = req.query.exclude as string;
    const excludedPromptsIds = [] as string[];
    if (excludedPromptsRaw) {
        excludedPromptsIds.push(...excludedPromptsRaw.split(','));
    }

    if (!userId) {
        res.status(400).send('Missing user id in request header');
        return;
    }

    const userModel = new UserModel();
    const seenPromptsIds = userModel.getSeenPromptsFor(userId);
    seenPromptsIds.push(...excludedPromptsIds);

    const promptModel = new PromptModel();
    const allPrompts = promptModel.getAllPrompts();

    /** The prompts which haven't been seen yet by this user */
    const unseenPrompts = allPrompts.filter((prompt) => {
        return !seenPromptsIds.includes(prompt.id);
    });

    if (!unseenPrompts.length) {
        // All prompts have been already seen by the user.
        // Let's return random prompts!

        const shuffledPrompts = [...allPrompts];
        shuffledPrompts.sort(() => Math.random() - 0.5);

        const prompts = shuffledPrompts.slice(0, amount);

        res.send(
            prompts.map((prompt) => ({
                id: prompt.id,
                text: prompt.text,
                category: prompt.category
            }))
        );
    }

    // Putting the less rated ones first
    unseenPrompts.sort((a, b) => {
        const aSeenAmount = a.timesSkipped + a.timesUsed;
        const bSeenAmount = b.timesSkipped + b.timesUsed;
        return aSeenAmount - bSeenAmount;
    });

    if (!unseenPrompts.length) {
        // All prompts have been rated already
        res.status(404).send('No prompt found');
        return;
    }

    const prompts = unseenPrompts.slice(0, amount);

    res.send(
        prompts.map((prompt) => ({
            id: prompt.id,
            text: prompt.text,
            category: prompt.category
        }))
    );
});

routes.put('/prompt/:id/:action(skip|use)', (req: Request, res: Response) => {
    // Is the user id valid?
    const userId = extractUserId(req);
    if (!userId) {
        res.status(400).send('Missing user id in request header');
        return;
    }

    // Is the action valid?
    const action = req.params.action;
    if (action !== 'skip' && action !== 'use') {
        res.status(400).send(
            'Invalid action. Only "skip" or "use" are allowed'
        );
        return;
    }

    // Has the prompt been rated already?
    const userModel = new UserModel();
    const ratedPrompts = userModel.getSeenPromptsFor(userId);

    if (ratedPrompts.includes(req.params.id)) {
        res.status(400).send('This prompt has already been rated');
        return;
    }

    // The prompt exists in the DB?
    const promptModel = new PromptModel();
    const allPrompts = promptModel.getAllPrompts();

    if (!allPrompts.find((prompt) => prompt.id === req.params.id)) {
        res.status(404).send('Prompt not found');
        return;
    }

    // Everything OK. We can update the prompt
    if (action === 'skip') {
        promptModel.skipPrompt(req.params.id);
    } else {
        promptModel.usePrompt(req.params.id);
    }

    userModel.markPromptAsSeenFor(userId, req.params.id);

    res.status(200).send('Success');
});

export default routes;
