const { redisKeys } = require("../../common/names/redis.names");
const { createMatch } = require("./matchMaking.matchcreator");
const { redisClient } = require("../../config/redis.client");
const { notifyExpiredMembers, handleExpiredMem } = require("./matchMaking.timeout");

const QueueWorker = async () => {
    try {
        while (true) {
            await handleExpiredMem(redisKeys.maleQueue)
            await handleExpiredMem(redisKeys.femaleQueue)
            const totalMale = await redisClient.zCard(redisKeys.maleQueue)
            const totalFemale = await redisClient.zCard(redisKeys.femaleQueue)
            // console.log(totalMale, totalFemale);
            
            if (totalMale && totalFemale) {
                let {value : boy} = await redisClient.zPopMin(redisKeys.maleQueue);
                let {value : girl} = await redisClient.zPopMin(redisKeys.femaleQueue);
                await redisClient.del(redisKeys.wait(boy), redisKeys.wait(girl))
                return await createMatch(boy, girl)
            }
            else void undefined;

            await new Promise(r => setTimeout(r, 500))
        }
    } catch (err) {
        if (err) console.log({
            QueueWorkerError: {
                err
            }
        })
    }
}

module.exports = QueueWorker