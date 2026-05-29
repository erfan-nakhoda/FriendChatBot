const { Telegraf } = require("telegraf");
require("dotenv").config()

const bot = new Telegraf(process.env.BOT_TOKEN, {
    telegram: { apiRoot: "https://tapi.bale.ai" }
})
module.exports = bot