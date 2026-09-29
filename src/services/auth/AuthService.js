class AuthService {

    constructor() {
        this.users = new Map();
        this.nextUserId = 1;
    }

    login(username, password) {

        const user = {
            id: this.nextUserId++,
            username,
            password
        };

        this.users.set(user.id, user);

        return {
            id: user.id,
            username: user.username
        };
    }

    getUser(userId) {
        return this.users.get(userId);
    }

    getUserByUsername(username) {
        return [...this.users.values()]
            .find(user => user.username === username);
    }
}

export default new AuthService();