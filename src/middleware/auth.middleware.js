import SessionManager from "../services/session/SessionManager.js";

export const requireAuth = async (req, res, next) => {

    try {

        const sessionId = req.headers["x-session-id"];

        if (!sessionId) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }

        const session = await SessionManager.get(sessionId);

        if (!session) {
            return res.status(401).json({
                error: "Invalid session"
            });
        }

        req.sessionId = sessionId;

        next();

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Errore durante l'autenticazione"
        });
    }
};