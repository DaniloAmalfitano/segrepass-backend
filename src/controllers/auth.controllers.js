import AuthService from "../services/auth/AuthService.js";
import SessionManager from "../services/session/SessionManager.js";
import {createAuthSession, destroyAuthSession, getSessionIdByUserId} from "../middleware/auth.middleware.js";

export function login(req, res) {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "Username e password sono obbligatori"
        });
    }

    const existingUser = AuthService.getUserByUsername(username);

    if (existingUser) {

        const sessionId = getSessionIdByUserId(existingUser.id);

        if (sessionId) {
            return res.json({
                message: "Utente già loggato",
                sessionId
            });
        }
    }
    const user = existingUser || AuthService.login(username, password);
    const sessionId = createAuthSession(user.id);

    return res.json({
        message: "Login effettuato",
        sessionId
    });
}

export async function logout(req, res) {

    try {
        const sessionId =req.headers["x-session-id"];

        const userId =req.userId;
        if (userId) {
            SessionManager.remove(userId);
        }

        if (sessionId) {
            destroyAuthSession(sessionId);
        }
        return res.status(200).json({
            message:"Logout effettuato"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error:
                "Errore durante il logout"
        });
    }
}