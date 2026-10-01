import SegrepassParser from "../services/parser/SegrepassParser.js";
import SegrepassClient from "../services/segrepass/SegrepassClient.js";
import SessionManager from "../services/session/SessionManager.js";
import SegrepassCache from "../services/cache/SegrepassCache.js";
import crypto from "crypto";

export async function connect(req, res) {

    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "Username e password sono obbligatori"
            });
        }


        const sessionId = crypto.randomUUID();

        const session = SegrepassClient.createSession();

        await SegrepassClient.login(session, username, password);

        await SessionManager.create(sessionId, username, session);

        return res.status(200).json({
            message: "Connessione a Segrepass riuscita",
            sessionId
        });

    } catch (error) {

        console.error(error);

        return res.status(401).json({error: "Login a Segrepass fallito"});}
}


export async function getTranscript(req, res) {

    try {

        const sessionId = req.sessionId;
        const session = await SessionManager.get(sessionId);

        if (!session) {
            return res.status(401).json({
                error: "Sessione Segrepass non attiva"});
        }

        const cached = await SegrepassCache.getTranscript(session.username);

        if (cached && cached.length > 0) {
            return res.status(200).json({
                transcript: cached});
        }
        
        const html = await SegrepassClient.getTranscript(session);
        const transcript = await SegrepassParser.parseTranscript(html);

        await SegrepassCache.setTranscript(session.username, transcript);

        return res.status(200).json({
            transcript
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Errore nel recupero del libretto"
        });
    }
}

export async function getStudyPlan(req, res) {

    try {

        const sessionId = req.sessionId;
        const session = await SessionManager.get(sessionId);

        if (!session) {
            return res.status(401).json({
                error: "Nessuna connessione a Segrepass"
            });
        }

        const cached = await SegrepassCache.getStudyPlan(session.username);

        if (cached && cached.length > 0) {
            return res.status(200).json({
                pianoDiStudi: cached
            });
        }   

        const html = await SegrepassClient.getStudyPlan(session);
        const pianoDiStudi =
            await SegrepassParser.parseStudyPlan(html);

        await SegrepassCache.setStudyPlan(session.username, pianoDiStudi);

        return res.status(200).json({
            pianoDiStudi
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Errore durante il recupero del piano di studi"
        });
    }
}


export async function getStudentSummary(req, res) {

    try {

        const sessionId = req.sessionId;
        const session = await SessionManager.get(sessionId);

        if (!session) {
            return res.status(401).json({
                error: "Nessuna connessione a Segrepass"
            });
        }

        const cached = await SegrepassCache.getStudentSummary(session.username);
        
        if (cached && cached.length > 0) {
            return res.status(200).json({
                studentSummary: cached
            });
        }

        const html = await SegrepassClient.getStudentSummary(session);
        const studentSummary = await SegrepassParser.parseStudentSummary(html);

        await SegrepassCache.setStudentSummary(session.username, studentSummary);

        return res.status(200).json({
            studentSummary
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Errore durante il recupero del riepilogo studente"
        });
    }
}

export async function getStudentName(req, res) {
    try{
        const sessionId = req.sessionId;
        const session = await SessionManager.get(sessionId);

        if (!session) {
            return res.status(401).json({
                error: "Nessuna connessione a Segrepass"
            });
        }

        const html = await SegrepassClient.getStudentName(session);
        const studentName = await SegrepassParser.parseStudentName(html);

        return res.status(200).json({
            studentName
        });
    } catch (error) {
        console.error(error);
        
        return res.status(500).json({
            error: "Errore durante il recupero del nome studente"
        });
    }   
}

export async function getStudentId(req, res) {
    try {
        const sessionId = req.sessionId;
        const session = await SessionManager.get(sessionId);

        if (!session) {
            return res.status(401).json({
                error: "Nessuna connessione a Segrepass"
            });
        }

        const html = await SegrepassClient.getStudentId(session);
        const studentId = await SegrepassParser.parseStudentId(html);

        return res.status(200).json({
            studentId
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Errore durante il recupero dell'ID studente"
        });
    }
}

export async function getDegreeCourse(req, res) {
    try {
        const sessionId = req.sessionId;
        const session = await SessionManager.get(sessionId);

        if (!session) {
            return res.status(401).json({
                error: "Nessuna connessione a Segrepass"
            });
        }

        const html = await SegrepassClient.getDegreeCourse(session);
        const degreeCourse = await SegrepassParser.parseDegreeCourse(html);

        return res.status(200).json({
            degreeCourse
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Errore durante il recupero dell'ID studente"
        });
    }

}   
