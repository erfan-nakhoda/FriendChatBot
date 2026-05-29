require('dotenv').config()
const axios = require('axios');
const userModel = require('./src/module/users/users.mode');
const mongodbConfig = require('./src/config/mongodb.config');
const { sendMenuPanel, sendProfilePanel, selectGender, abandonMessage, userGuard, saveGender, handleChatRequest, chat, closeChat, seePartnerProfile, strandedUsersRecovery, } = require("./src/common/utils/additionalFancs.utils");
const QueueWorker = require('./src/module/matchMaking/matchmaking.worker');
const { initRedis, redisClient } = require('./src/config/redis.client');
const { redisKeys } = require('./src/common/names/redis.names');
const { emitter } = require('./src/module/matchMaking/matchMaking.matchcreator');
const bot = require('./src/config/bot.config');
const {BotMessages, BotData} = require('./src/common/messages/bot.message');

const main = async () => {
    mongodbConfig();
    await initRedis()

    bot.start(async ctx => {
        const chat_id = ctx.chat.id;
        let user = await userModel.findOne({ chat_id });
        if (!user) await userModel.create({ chat_id });

        if (!user) {
            ctx.reply("به ربات دوست یابی خوش آمدید")
            ctx.reply(BotMessages.enterName)
        }
        else {
            ctx.reply("به ربات دوست یابی خوش آمدید")
            return sendMenuPanel(ctx);
        }
    })
    emitter.on("matched", data => {
        bot.telegram.sendMessage(data.chatId_user1, data.message, {
            reply_markup: {
                keyboard: data.keyboard
            }
        })
        bot.telegram.sendMessage(data.chatId_user2, data.message, {
            reply_markup: {
                keyboard: data.keyboard
            }
        })
    })

    bot.command('profile', async ctx => {

        const chat_id = ctx.chat.id
        const user = await userModel.findOne({ chat_id });
        if (!user) {
            return ctx.reply("بزن /start اول روی");
        }
        sendProfilePanel(ctx, user);

    },)
    bot.on('text', userGuard, async ctx => {
        const user = await userModel.findOne({ chat_id: ctx.chat.id });
        const text = ctx.message.text;
        switch (user.state) {
            case "waiting_name":
                user.name = text;
                user.state = "waiting_age";
                await user.save();
                return selectGender(ctx)
            case "waiting_gender":
                return selectGender(ctx)
            case "waiting_age":
                if (isNaN(Number(ctx.message.text))) return ctx.reply(BotMessages.enterAgeNum)
                if (Number(ctx.message.text) <= 0 || Number(ctx.message.text) >= 100) return ctx.reply(BotMessages.enterAgeInRange)
                user.age = text;
                user.state = "waiting_city";
                await user.save()
                return ctx.reply(BotMessages.enterCity);
            case "waiting_city":
                user.city = text
                user.state = "idle"
                await user.save()
                ctx.reply(BotMessages.successSave)
                return sendMenuPanel(ctx)
            case "edit_name":
                user.name = ctx.message.text;
                user.state = "idle";
                await user.save();
                ctx.reply(BotMessages.successChange('نام'))
                return sendProfilePanel(ctx, user)

            case "edit_age":
                if (isNaN(Number(ctx.message.text))) return ctx.reply(BotMessages.enterAgeNum)
                if (Number(ctx.message.text) <= 0 || Number(ctx.message.text) >= 100) return ctx.reply(BotMessages.enterAgeInRange)
                user.age = ctx.message.text;
                user.state = "idle";
                await user.save();
                ctx.reply(BotMessages.successChange("سن"))
                return sendProfilePanel(ctx, user)
            case "edit_city":
                user.city = ctx.message.text;
                user.state = "idle";
                await user.save()
                ctx.reply(BotMessages.successChange('شهر'))
                return sendProfilePanel(ctx, user)
            // case "edit_profile":
            //     console.log(ctx)
            case "idle":
                return abandonMessage(ctx)
            case 'in_queue' :
                return ctx.reply(BotMessages.alreadySearching, {
                    reply_markup : {
                        inline_keyboard : [
                            [{text : "لغو درخواست", callback_data : "cancelRequest"}]
                        ]
                    }
                })
            case "chatting":
                if (ctx.message.text === "دیدن پروفایل کاربر") return seePartnerProfile(ctx.chat.id, ctx)
                else if (ctx.message.text === "اتمام چت") {
                    return closeChat(ctx.chat.id, ctx)
                }
                return await chat(ctx.chat.id, ctx.message.text, ctx.telegram)

        }
    })
    bot.on("photo", userGuard, async ctx => {
        // ctx.replyWithPhoto()
        const user = ctx.state.user;
        if(user.state === "edit_profile"){
            user.profileId = ctx.message.photo[0].file_id;
            user.state = "idle"
            await user.save();
            ctx.reply(BotMessages.ProfileUploaded)
            return sendProfilePanel(ctx, user)

        }
        return abandonMessage(ctx);

    })
    bot.command('menu', userGuard, ctx => {
        return sendMenuPanel(ctx)
        
    })
    bot.action("male", userGuard, async ctx => {
        // await ctx.answerCbQuery(undefined)
        return await saveGender(ctx, 'male', ctx.state.user);
    })
    bot.action("female", userGuard, async ctx => {
        // await ctx.answerCbQuery(undefined)
        return await saveGender(ctx, 'female', ctx.state.user);
    })
    bot.action("addCoins", userGuard, ctx => {
        // await ctx.answerCbQuery(undefined)
        ctx.replyWithInvoice({
            title: BotData.buyCoin.title,
            description: BotData.buyCoin.description,
            payload: "buy_coins",
            currency: BotData.buyCoin.currency,
            provider_token: process.env.BOT_PROVIDER_INVOICE_TOKEN,
            prices: [{
                label: BotData.buyCoin.label,
                amount: BotData.buyCoin.amount
            }]
        })
    })
    bot.action("cancelRequest", userGuard, async ctx => {
        const user = ctx.state.user
        if(user.state !== "in_queue") {
            ctx.reply(BotMessages.chatReqNotFound)
            return sendMenuPanel(ctx)
        }
        const queueKey = user.gender === "male" ? redisKeys.maleQueue : redisKeys.femaleQueue
        user.state = "idle";
        user.coins += 2;
        await redisClient.zPopMax(queueKey);
        console.log(`User ${user.chat_id} left the Queue`)
        await user.save();
        return sendMenuPanel(ctx);
    })
    bot.action('changeName', userGuard, async ctx => {
        // await ctx.answerCbQuery(undefined)
        const user = ctx.state.user
        user.state = "edit_name";
        await user.save()
        ctx.reply(BotMessages.changeName)
    })
    bot.action('changeAge', userGuard, async ctx => {
        // await ctx.answerCbQuery(undefined)
        const user = ctx.state.user
        user.state = "edit_age";
        await user.save()
        ctx.reply(BotMessages.changeAge)
    })
    bot.action('changeProfile', userGuard, async ctx => {
        const user = ctx.state.user;
        user.state = "edit_profile"
        await user.save();
        return ctx.reply(BotMessages.changeProfile)
    })
    bot.action('changeCity', userGuard, async ctx => {
        // await ctx.answerCbQuery(undefined)
        const user = ctx.state.user
        user.state = "edit_city"
        await user.save()
        ctx.reply(BotMessages.changeCity)
    })
    bot.action("profile", userGuard, ctx => {
        // await ctx.answerCbQuery(undefined)
        return sendProfilePanel(ctx, ctx.state.user)
    })

    bot.action("returnToMenu", userGuard, ctx => {
        // await ctx.answerCbQuery(undefined)
        // ctx.sendChatAction('typing')
        return sendMenuPanel(ctx);
    })
    bot.action("chatRequest", userGuard, ctx => {
        // await ctx.answerCbQuery(undefined)
        return handleChatRequest(ctx.state.user, ctx);
    })
    bot.launch()
    QueueWorker();


}
strandedUsersRecovery()
main()