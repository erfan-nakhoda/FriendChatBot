const {BotMessages} = require("../../common/messages/bot.message");
const bot = require("../../config/bot.config");
const { redisClient } = require("../../config/redis.client");
const userModel = require("../users/users.mode")

const updateUsersToIdle = async array => {
    try {

        await userModel.updateMany({ chat_id: { $in: array }, state: "in_queue" }, { $set: { state: "idle" }, $inc: { coins: 2 } });
    } catch (err) {
        console.log({ UpdateUserToIdleError: err })
    }
}

const notifyExpiredMembers = async array => {
    for (const userId of array) {
        await bot.telegram.sendMessage(userId, BotMessages.notifyExpiredMem, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "پروفایل", callback_data: "profile" },
                        { text: "درخواست چت", callback_data: "chatRequest" }
                    ]
                ]
            }
        })
    }
}

const handleExpiredMem = async redisKey => {
    try {
        const now = Date.now();
        const expired = await redisClient.zRangeByScore(redisKey, 0, now);
        // console.log(expired);

        if (expired.length) {
            await redisClient.zRem(redisKey, ...expired)
            await updateUsersToIdle(expired);
            await notifyExpiredMembers(expired)
        }
        else return null;
        console.log("All expired members handled.");
        return true
    } catch (err) {
        console.log({ HandleExpiredMemError: err })
    }


}

module.exports = {
    updateUsersToIdle,
    notifyExpiredMembers,
    handleExpiredMem
}