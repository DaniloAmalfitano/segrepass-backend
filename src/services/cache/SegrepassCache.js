import redisClient from "../../redis.js";

const DATA_PREFIX = "segrepass:data:";
const TRANSCRIPT_TTL = 10 * 60; // 10 minuti
const STUDY_PLAN_TTL = 10 * 60;
const STUDENT_SUMMARY_TTL = 10 * 60;

class SegrepassCache {

    async getTranscript(username) {
        const key = `${DATA_PREFIX}${username}:transcript`;

        const data = await redisClient.get(key);

        if (!data) {
            return null;
        }

        return JSON.parse(data);
    }

    async setTranscript(username, transcript) {
        const key = `${DATA_PREFIX}${username}:transcript`;

        await redisClient.set(
            key,
            JSON.stringify(transcript),
            {
                EX: TRANSCRIPT_TTL
            }
        );
    }


    async getStudyPlan(username) {
        const key = `${DATA_PREFIX}${username}:study-plan`;

        const data = await redisClient.get(key);

        if (!data) {
            return null;
        }

        return JSON.parse(data);
    }

    async setStudyPlan(username, studyPlan) {
        const key = `${DATA_PREFIX}${username}:study-plan`;

        await redisClient.set(
            key,
            JSON.stringify(studyPlan),
            {
                EX: STUDY_PLAN_TTL
            }
        );
    }


    async getStudentSummary(username) {
        const key = `${DATA_PREFIX}${username}:student-summary`;

        const data = await redisClient.get(key);

        if (!data) {
            return null;
        }

        return JSON.parse(data);
    }

    async setStudentSummary(username, summary) {
        const key = `${DATA_PREFIX}${username}:student-summary`;

        await redisClient.set(
            key,
            JSON.stringify(summary),
            {
                EX: STUDENT_SUMMARY_TTL
            }
        );
    }


    async clear(username) {
        await redisClient.del(
            `${DATA_PREFIX}${username}:transcript`,
            `${DATA_PREFIX}${username}:study-plan`,
            `${DATA_PREFIX}${username}:student-summary`
        );
    }
}

export default new SegrepassCache();