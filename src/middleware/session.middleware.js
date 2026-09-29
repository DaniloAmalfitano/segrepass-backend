import SessionManager from "../services/session/SessionManager";

export function requireSessionmiddleware(req, res, next) {
    const userId = req.userId;

    if(!userId || !SessionManager.has(userId)) {
        return res.status(401).json({
            error: "No active session"
        });
        next();
    }
}