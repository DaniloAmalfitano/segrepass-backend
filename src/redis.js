/*import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});

await redisClient.connect();

console.log("Connected to Redis");

export default redisClient;*/
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || process.env.KV_URL || "redis://localhost:6379";

const redisClient = createClient({
    url: redisUrl
});

redisClient.on("error", (err) => {
    console.error("Redis client error:", err);
});

async function getConnectedRedisClient() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
    return redisClient;
}

getConnectedRedisClient().catch((err) => {
    console.error("Errore connessione iniziale Redis:", err);
});

export { getConnectedRedisClient };
export default redisClient;