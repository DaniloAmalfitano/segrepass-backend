import SessionManager from "../services/session/SessionManager.js";

export async function requireSessionmiddleware(req, res, next) {
    const userId = req.userId;

    if (!userId || !(await SessionManager.has(userId))) {
        return res.status(401).json({
            error: "No active session"
        });
    }

    next();
}