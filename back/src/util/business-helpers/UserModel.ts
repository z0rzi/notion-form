import { getDB } from '../../database/Db';

export type User = {
    id: number;
    prompts: string[];
};

export class UserModel {
    private db = getDB();

    private getAllUsers(): User[] {
        const stmt = this.db.prepare('SELECT * FROM users');
        const allUsers = stmt.all() as { id: number; prompts: string }[];
        return allUsers.map((rawUser) => {
            return {
                id: rawUser.id,
                prompts: rawUser.prompts.split(',')
            };
        });
    }

    getUnusedUserId(): number {
        const allUsers = this.getAllUsers();
        let id = 1;
        while (allUsers.some((user) => user.id === id)) {
            id++;
        }
        return id;
    }

    getSeenPromptsFor(userId: number): string[] {
        const allUsers = this.getAllUsers();
        const user = allUsers.find((user) => user.id === userId);
        if (!user) {
            return [];
        }
        return user.prompts;
    }

    markPromptAsSeenFor(userId: number, promptId: string) {
        const allUsers = this.getAllUsers();
        const user = allUsers.find((user) => user.id === userId);
        if (!user) {
            const stmt = this.db.prepare('INSERT INTO users (id, prompts) VALUES (?, ?)');
            stmt.run(userId, promptId);
            return;
        }

        user.prompts.push(promptId);
        const stmt = this.db.prepare('UPDATE users SET prompts = ? WHERE id = ?');
        stmt.run(user.prompts.join(','), userId);
    }
}
