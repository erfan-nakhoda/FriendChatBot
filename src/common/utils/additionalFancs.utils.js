const { redisClient } = require("../../config/redis.client")
const addToMatchQueue = require("../../module/matchMaking/matchMaking.queue")
const userModel = require("../../module/users/users.mode")
const { BotMessages } = require("../messages/bot.message")
const { redisKeys } = require("../names/redis.names")
const fs = require('fs')

const sendMenuPanel = ctx => {
    return ctx.reply(BotMessages.whatCanIDo, {
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

const abandonMessage = ctx => {
    return ctx.reply(BotMessages.abandonMessage)
}

const sendProfilePanel = (ctx, user) => {
    if (user.profileId) return ctx.replyWithPhoto(user.profileId, {
        caption: JSON.stringify({
            "نام": user.name,
            "جنسیت": user.gender,
            "سن": user.age,
            "شهر": user.city,
            "سکه ها": user.coins
        }, null, 4),
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "افزایش تعداد سکه ها", callback_data: "addCoins" },
                    { text: "تغییر نام", callback_data: "changeName" },
                ],
                [
                    { text: "تغییر سن", callback_data: "changeAge" },
                    { text: "تغییر شهر", callback_data: "changeCity" },
                    { text: "تغییر عکس پروفایل", callback_data: "changeProfile" }
                ],
                [{ text: "بازگشت به منو", callback_data: "returnToMenu" }]
            ]
        }
    })
    else return ctx.replyWithPhoto({source : fs.createReadStream('./public/photo/user.png')}, {
        caption: JSON.stringify({
            "نام": user.name,
            "جنسیت": user.gender,
            "سن": user.age,
            "شهر": user.city,
            "سکه ها": user.coins
        }, null, 4),
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "افزایش تعداد سکه ها", callback_data: "addCoins" },
                    { text: "تغییر نام", callback_data: "changeName" },
                ],
                [
                    { text: "تغییر سن", callback_data: "changeAge" },
                    { text: "تغییر شهر", callback_data: "changeCity" },
                    { text: "تغییر عکس پروفایل", callback_data: "changeProfile" }
                ],
                [{ text: "بازگشت به منو", callback_data: "returnToMenu" }]
            ]
        }
    })
}

const selectGender = ctx => {
    return ctx.reply("جنسیت خود را انتخاب کنید", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "مرد", callback_data: "male" },
                    { text: "زن", callback_data: "female" }
                ]
            ]
        }
    })
}
const userGuard = async (ctx, next) => {
    const chat_id = ctx.chat.id;
    const user = await userModel.findOne({ chat_id })
    if (!user) {
        return ctx.reply("/start بزن رو ")
    }
    ctx.state.user = user
    next()
}
const saveGender = async (ctx, gender, user) => {
    user.gender = gender;
    user.state = "waiting_age";
    await user.save();
    return ctx.reply("لطفا سن خود را وارد کنید")
}

const handleChatRequest = async (user, ctx) => {
    if (user.state === "chatting") return ctx.reply(BotMessages.alreadyInChat)
    else if (user.state === "in_queue") return ctx.reply(BotMessages.alreadySearching, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "لغو درخواست", callback_data: "cancelRequest" }]
            ]
        }
    })
    if (user.coins < 2) return ctx.reply(BotMessages.notEnoughCoin, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "افزایش تعداد سکه ها", callback_data: "addCoins" }]
            ]
        }
    })
    user.state = "in_queue";
    user.coins -= 2
    await user.save()
    ctx.reply(BotMessages.queue)
    const result = await addToMatchQueue(user.chat_id, user.gender);
    if (result) return ctx.reply(BotMessages.foundMatch, {
        reply_markup: {
            keyboard: [
                [{ text: "دیدن پروفایل کاربر" },
                { text: "اتمام چت" }
                ]
            ]
        }
    })
}
const getPartnerId = async userId => {
    const checkExist = await redisClient.get(redisKeys.partner(userId));
    if (!checkExist) {
        const user = await userModel.findOne({ chat_id: userId });
        await redisClient.set(redisKeys.partner(userId), user.partner_id);
        return user.partner_id
    }
    return checkExist;
}
const chat = async (userId, message, telegram) => {
    try {
        const partnerId = await getPartnerId(userId);
        telegram.sendMessage(partnerId, message)
        console.log("message sent successfully")
    } catch (err) {
        if (err) console.log({ chatError: { err } })
    }

}
const getPartnerProfile = async userId => {
    const partnerId = await getPartnerId(userId);
    const profile = redisClient.get(redisKeys.profile(partnerId));
    if (!profile) {
        const user = await userModel.findOne({ chat_id: partnerId });
        return JSON.stringify({
            "نام": user.name,
            "جنسیت": user.gender,
            "سن": user.age,
            "شهر": user.city,
            profileId: user.profileId
        }, null, 4)
    }
    return profile

}
const seePartnerProfile = async (userId, ctx) => {
    const profile = await getPartnerProfile(userId)
    const { profileId, ...rest } = JSON.parse(profile);
    if (profileId) return ctx.replyWithPhoto(profileId, {
        caption: JSON.stringify(rest, null, 4)
    })
    else return ctx.replyWithPhoto({ source: fs.createReadStream('./public/photo/user.png') }, {
        caption: JSON.stringify(rest, null, 4)
    })
}

const closeChat = async (userId, ctx) => {
    const user = await userModel.findOne({ chat_id: userId })
    const partner = await userModel.findOne({ chat_id: user.partner_id });
    user.state = "idle"
    partner.state = "idle"
    user.partner_id = null
    partner.partner_id = null;
    await Promise.all([user.save(), partner.save()]);
    await redisClient.del([redisKeys.partner(userId), redisKeys.partner(partner.chat_id), redisKeys.profile(userId), redisKeys.profile(partner.chat_id)])
    const youOrMe = userId === user.chat_id ? "شما" : "کاربر مقابل"
    const secondYouOrMe = !youOrMe
    ctx.telegram.sendMessage(user.chat_id, BotMessages.closeChat(youOrMe), {
        reply_markup: {
            remove_keyboard: true,
            inline_keyboard: [
                [
                    { text: "پروفایل", callback_data: "profile" },
                    { text: "درخواست چت", callback_data: "chatRequest" }
                ]
            ]
        }
    });
    ctx.telegram.sendMessage(partner.chat_id, BotMessages.closeChat(secondYouOrMe),
        {
            reply_markup: {
                remove_keyboard: true,
                inline_keyboard: [
                    [
                        { text: "پروفایل", callback_data: "profile" },
                        { text: "درخواست چت", callback_data: "chatRequest" }
                    ]
                ]
            }
        });
}


const strandedUsersRecovery = async () => {
    const users = await userModel.find({state : "in_queue"})
    // console.log(users)
    if(users.length) {
        for(const user of users) {
            const userInCash = await redisClient.get(redisKeys.wait(user.chat_id));
            if(!userInCash) user.state = "idle";
            await user.save()

        }
    }
}
module.exports = {
    sendMenuPanel,
    sendProfilePanel,
    selectGender,
    abandonMessage,
    userGuard,
    saveGender,
    handleChatRequest,
    chat,
    closeChat,
    seePartnerProfile,
    strandedUsersRecovery
}