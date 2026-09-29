import SessionManager from "../services/session/SessionManager.js";

export async function logout(req, res) {

    try {

        const sessionId = req.sessionId;

        if (!sessionId) {
            return res.status(401).json({
                error: "Sessione non valida"
            });
        }

        await SessionManager.remove(sessionId);

        return res.status(200).json({
            message: "Logout effettuato"
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Errore durante il logout"
        });
    }
}