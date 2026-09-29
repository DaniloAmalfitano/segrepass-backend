import { CookieJar } from "tough-cookie";
import redisClient from "../../redis.js";

const SESSION_PREFIX = "segrepass:session:";
const USER_PREFIX = "segrepass:user:";

const SESSION_TTL = 60 * 60; 

class SessionManager {

    async create(sessionId, username, session) {

        const sessionKey = `${SESSION_PREFIX}${sessionId}`;
        const userKey = `${USER_PREFIX}${username}`;

        // Controlliamo se esiste già una sessione per questo username
        const existingSessionId = await redisClient.get(userKey);

        if (existingSessionId) {

            // Verifichiamo che la sessione associata esista davvero
            const sessionExists =
                await redisClient.exists(
                    `${SESSION_PREFIX}${existingSessionId}`
                );

            if (sessionExists) {
                return false;
            }

            // L'associazione era rimasta senza sessione valida
            await redisClient.del(userKey);
        }

        const serialized = await session.jar.serialize();

        // Salviamo la sessione
        await redisClient.set(
            sessionKey,
            JSON.stringify(serialized),
            {
                EX: SESSION_TTL
            }
        );

        // Salviamo la relazione username → sessionId
        await redisClient.set(
            userKey,
            sessionId,
            {
                EX: SESSION_TTL
            }
        );

        return true;
    }

    async get(sessionId) {

        const data = await redisClient.get(
            `${SESSION_PREFIX}${sessionId}`
        );

        if (!data) {
            return null;
        }

        const serialized = JSON.parse(data);
        const jar = await CookieJar.deserialize(serialized);

        return { jar };
    }

    async has(sessionId) {

        return await redisClient.exists(
            `${SESSION_PREFIX}${sessionId}`
        ) === 1;
    }

    async remove(sessionId) {

        const sessionKey = `${SESSION_PREFIX}${sessionId}`;

        // Recuperiamo la sessione per trovare lo username.
        // Per ora il username non è salvato nella sessione,
        // quindi questa parte verrà completata nel controller
        // oppure possiamo salvare lo username nella sessione.
        await redisClient.del(sessionKey);
    }

    async hasUserSession(username) {

        const userKey = `${USER_PREFIX}${username}`;

        const sessionId = await redisClient.get(userKey);

        if (!sessionId) {
            return null;
        }

        const sessionExists = await redisClient.exists(
            `${SESSION_PREFIX}${sessionId}`
        );

        if (!sessionExists) {
            await redisClient.del(userKey);
            return null;
        }

        return sessionId;
    }
}

export default new SessionManager();