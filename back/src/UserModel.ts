import Database from "./Db";

export type User = {
    id: number;
    prompts: string[];
};

export class UserModel {
    private db = Database.getInstance();

    private getAllUsers(): User[] {
        const allUsers = this.db.all<{ id: number; prompts: string }>('SELECT * FROM users');
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
            this.db.run('INSERT INTO users (id, prompts) VALUES (?, ?)', [promptId]);
            return;
        }

        user.prompts.push(promptId);
        this.db.run('UPDATE users SET prompts = ? WHERE id = ?', [userId]);
    }
}
