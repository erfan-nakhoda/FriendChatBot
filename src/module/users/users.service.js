const userModel = require("./users.mode");

class userService {
    #model;
    constructor() {
        this.#model = userModel
    }

    async userFindByChatId(chat_id) {
        const user = await this.#model.findOne({chat_id});
        if (!user) return null
        return user;
    }

    async createUserByChatId(chat_id){
        try {
            await this.#model.create({chat_id});
            return true
            
        } catch (err) {
            if(err) console.log({savingError : err.message});
            
        }
    }

    async updateUserField(chat_id,key, value) {
        try {

        await this.#model.updateOne({chat_id}, {[key] : value});
        return true
        } catch (err) {
            if(err) console.log({updatingError : err.message})
        }

    }
}

module.exports = new userService();