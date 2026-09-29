import SegrepassParser from "../services/parser/SegrepassParser.js";
import SegrepassClient from "../services/segrepass/SegrepassClient.js";
import SessionManager from "../services/session/SessionManager.js";

export async function connect(req, res) {

    try {
        const {username,password} = req.body;
        if (!username || !password) {
            return res.status(400).json({
                error: "Username e password sono obbligatori"
            });
        }
        const userId =req.userId;
        if (!userId) {
            return res.status(401).json({
                error:"Utente non autenticato"
            });
        }
        if(
            SessionManager.has(userId)){
            SessionManager.remove(userId);
        }
        const session =SegrepassClient.createSession();

        await SegrepassClient.login(session,username,password);

        SessionManager.create(userId,session);

        return res.status(200).json({
            message:"Connessione a Segrepass riuscita"
        });

    } catch (error) {
        console.error(error);
        return res.status(401).json({
            error: "Login a Segrepass fallito"
        });
    }
}


export async function getTranscript(req, res) {

    try {
        const userId =req.userId;
        const session =SessionManager.get(userId);
        if (!session) {
            return res.status(401).json({
                error: "Sessione Segrepass non attiva"
            });
        }

        const html =await SegrepassClient.getTranscript(session);
        const transcript =await SegrepassParser.parseTranscript(html);

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
      const userId = req.userId;
      const session = SessionManager.get(userId);
  
      if (!session) {
        return res.status(401).json({
          error: "Nessuna connessione a Segrepass"
        });
      }

      const html = await SegrepassClient.getStudyPlan(session);
      const pianoDiStudi = await SegrepassParser.parseStudyPlan(html);
      
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
        const userId =req.userId;
        const session =SessionManager.get(userId);
        if (!session) {
            return res.status(401).json({
                error: "Nessuna connessione a Segrepass"
            });
        }

        const html =await SegrepassClient.getStudentSummary(session);
        const studentSummary =await SegrepassParser.parseStudentSummary(html);

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

