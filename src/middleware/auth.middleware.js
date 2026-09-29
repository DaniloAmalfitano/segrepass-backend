import crypto from "crypto";

const sessions = new Map();

export const createAuthSession = (userId) => {

    const sessionId = crypto.randomUUID();

    sessions.set(sessionId, {
        userId,
        createdAt: Date.now()
    });

    return sessionId;
};

export const destroyAuthSession = (sessionId) => {
    sessions.delete(sessionId);
};

export const requireAuth = (req, res, next) => {

    const sessionId = req.headers["x-session-id"];

    if (!sessionId) {
        return res.status(401).json({
            error: "Authentication required"
        });
    }

    const session = sessions.get(sessionId);

    if (!session) {
        return res.status(401).json({
            error: "Invalid session"
        });
    }

    req.userId = session.userId;

    next();
};

export const getSessionIdByUserId = (userId) => {
    for (const [sessionId, session] of sessions) {
        if (session.userId === userId) {
            return sessionId;
        }
    }
    return null;
};