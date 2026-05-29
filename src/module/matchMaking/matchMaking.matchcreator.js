const { EventEmitter } = require("ws");
const { redisKeys } = require("../../common/names/redis.names");
const { redisClient } = require("../../config/redis.client");
const userModel = require("../users/users.mode")
const emitter = new EventEmitter();

const createMatch = async (main_id, partner_id) => {
    const session = await userModel.startSession();
    session.startTransaction()
    try {
        const user1 = await userModel.findOne({ chat_id: main_id })
        const user2 = await userModel.findOne({ chat_id: partner_id })
        if (!user1 || !user2) {
            console.log("user not found");
            return false
        }
        if (user1?.partner_id || user2?.partner_id) {
            console.log('a user has partner in the moment')
            return false
        }

        user1.partner_id = user2.chat_id
        user2.partner_id = user1.chat_id
        user1.state = "chatting"
        user2.state = "chatting"
        await Promise.all([user1.save(), user2.save()]);
        await redisClient.set(redisKeys.partner(user1.chat_id), user1.partner_id)
        await redisClient.set(redisKeys.partner(user2.chat_id), user2.partner_id)
        await redisClient.set(redisKeys.profile(user1.chat_id), JSON.stringify({
            "نام": user1.name,
            "جنسیت": user1.gender,
            "سن": user1.age,
            "شهر": user1.city,
            profileId : user1.profileId
        },null,4))
        await redisClient.set(redisKeys.profile(user2.chat_id), JSON.stringify({
            "نام": user2.name,
            "جنسیت": user2.gender,
            "سن": user2.age,
            "شهر": user2.city,
            profileId : user2.profileId
        },null,4))
        emitter.emit("matched", {
            chatId_user1 : user1.chat_id,
            chatId_user2 : user2.chat_id,
            message : "ی نفر پیدا شد لطفا بهش سلام کن",
            keyboard : [
                [{text : "دیدن پروفایل کاربر"}, {text : "اتمام چت"}]
            ]
        })
        await session.commitTransaction()
        console.log('Match Found')
        return true
    } catch (err) {
        await session.abortTransaction()
        if (err) console.log({ createMatchError: err.message });

    }

}


module.exports = {
    createMatch,
    emitter
}