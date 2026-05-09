const axios = require('axios')
require("dotenv").config()
const eventEmitter = require("events");
const emitter = new eventEmitter();
new AbortController()
class BotService {
    #api_root;
    #token;
    #offset;
    attempt;
    delay;
    queue;
    // ctx;
    constructor(bot_token) {
        this.#api_root = 'https://botapi.rubika.ir/v3'
        this.#token = bot_token
        this.attempt = 0;
        this.delay = 5;
        this.queue = [];
    }
    startPolling() {
        const url = `${this.#api_root}/${this.#token}/getUpdates`
        let controller = null;
        // let stopped = false;
        console.log("start polling");

        const poll = async () => {
            let lastUser;
            if (controller) controller.abort();
            controller = new AbortController();
            try {
                // console.log(this.#offset);

                const { data } = await axios({
                    method: 'POST',
                    url,
                    data: JSON.stringify({ offset_id: this.#offset }),
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    timeout: 5000

                })
                // console.log(data.data.updates.length > 0);
                if (data.data.updates.length > 0) {
                    lastUser = data.data.updates[data.data.updates.length - 1];
                    emitter.emit("newData", lastUser)
                }

                // if (this.#lastUser?.new_message.time === data.data.updates[data.data.updates.length - 1])
                else this.attempt++;
                if (lastUser !== undefined) this.#offset = data.data.next_offset_id

                if (this.attempt > 3) this.delay += 5;
                // emitter.on("newData", data => {
                //     this.addToQueue(data)
                // })
                setTimeout(async () => await poll(), this.delay * 1000)
            } catch (err) {
                if (axios.isCancel(err)) console.log("Request is canceled");
                else if (err.code == "ECONNABORTED") console.log("Request Timed out");
                else console.log(`Polling error : ${err.message}`);
                // await new Promise(res => setTimeout(res, 5000))

            }
        }
        poll()

        return {
            stop() {
                stopped = true;
                if (controller) controller.abort()
            }
        }
    }

    addToQueue() {
        emitter.on('newData', data => {
             this.queue.push(data) 
             console.log(`Job is added To queue : ${data.chat_id}`);
            });

    }

    async start(data) {
        if (data?.new_message.text == "/start") this.reply(data.chat_id, "به ربات دوست یابی خوش آمدید")



    }

    async worker() {
        if (this.queue?.length) {
            const data = this.queue.shift();
            console.log(`worker is doing its work : ${data.chat_id}`);
            
            if (data?.new_message?.text == "/start") await this.start(data);
            
        }
        setTimeout(async () => await this.worker(), 100)
    }

    async reply(chat_id, text) {
        const url = `${this.#api_root}/${this.#token}/sendMessage`
        await axios({
            method: "POST",
            url,
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                chat_id,
                text

            })
        })
    }

    launch() {
        this.startPolling()
        this.addToQueue()
        this.worker()

    }
}
module.exports = new BotService(process.env.BOT_TOKEN)