import express, { Request, Response } from 'express';
import { PromptModel } from './PromptModel';
import { UserModel } from './UserModel';

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

routes.get('/prompt', (req: Request, res: Response) => {
    const userId = extractUserId(req);
    if (!userId) {
        res.status(400).send('Missing user id in request header');
        return;
    }

    const userModel = new UserModel();
    const ratedPrompts = userModel.getRatedPromptsFor(userId);

    const promptModel = new PromptModel();
    const allPrompts = promptModel.getAllPrompts();

    const unratedPrompts = allPrompts.filter((prompt) => {
        return !ratedPrompts.includes(prompt.id);
    });

    // Putting the less rated ones first
    unratedPrompts.sort((a, b) => {
        return a.rating_amount - b.rating_amount;
    });

    if (!unratedPrompts.length) {
        // All prompts have been rated already
        res.status(404).send('No prompt found');
        return;
    }

    res.send({
        id: unratedPrompts[0].id,
        text: unratedPrompts[0].text,
        category: unratedPrompts[0].category
    });
});

routes.put('/prompt/:id', (req: Request, res: Response) => {
    // Is the user id valid?
    const userId = extractUserId(req);
    if (!userId) {
        res.status(400).send('Missing user id in request header');
        return;
    }

    // Is the rating valid?
    const rating = +req.body.rating;
    if (isNaN(rating) || rating == null || rating < 0 || rating > 5) {
        res.status(400).send('Invalid rating');
        return;
    }

    // Has the prompt been rated already?
    const userModel = new UserModel();
    const ratedPrompts = userModel.getRatedPromptsFor(userId);

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
    promptModel.ratePrompt(req.params.id, rating);
    userModel.markPromptAsRatedFor(userId, req.params.id);

    res.status(200).send('Success');
});

export default routes;
