const { redisKeys } = require("../../common/names/redis.names");
const {redisClient} = require("../../config/redis.client")

const addToMatchQueue = async (userId, gender) => {
    try {

        const queueKey = gender === "male" ? redisKeys.maleQueue : redisKeys.femaleQueue
        const expireTime = Date.now() + 120000;
        await redisClient.zAdd(queueKey,{value: userId, score : expireTime})
        await redisClient.set(redisKeys.wait(userId), 1)
        console.log(`User ${userId} joined to Queue to ${queueKey}`)
    } catch (err) {
        if (err) console.log({ MatchQueueError: err.message })
    }
}

module.exports = addToMatchQueue