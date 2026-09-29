class SessionManager {
    constructor() {
        this.sessions = new Map();
    }

    create(userId, session) {
        this.sessions.set(userId,session);
    }

    get(userId) {
        return this.sessions.get(userId);
    }

    has(userId) {
        return this.sessions.has(userId);
    }

    remove(userId) {
        this.sessions.delete(userId);
    }
}

export default new SessionManager();