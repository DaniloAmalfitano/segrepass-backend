import { CookieJar } from "tough-cookie";
import redisClient from "../../redis.js";

const SESSION_PREFIX = "segrepass:session:";

class SessionManager {

    async create(sessionId, session) {

        const serialized = await session.jar.serialize();
        await redisClient.set(`${SESSION_PREFIX}${sessionId}`,JSON.stringify(serialized));
    }

    async get(sessionId) {

        const data = await redisClient.get(`${SESSION_PREFIX}${sessionId}`);

        if (!data) {
            return null;
        }

        const serialized = JSON.parse(data);
        const jar = await CookieJar.deserialize(serialized);

        return { jar };
    }

    async has(sessionId) {
        return await redisClient.exists(`${SESSION_PREFIX}${sessionId}`) === 1;
    }

    async remove(sessionId) {
        await redisClient.del(`${SESSION_PREFIX}${sessionId}`);
    }
}

export default new SessionManager();