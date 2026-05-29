const {Schema, model} = require("mongoose");

const userSchema = new Schema({
    chat_id : {type : String, unique : true, required : true},
    name : {type : String, default : null},
    gender : {type : String, enum : ["male", "female"]},
    age : {type : String , default : null},
    city : {type : String, default : null},
    coins : {type : Number, default : 5},
    partner_id : {type : String, default : null},
    state : {type : String , enum : ['waiting_name', "waiting_age", 'waiting_city',"waiting_gender", "in_queue", "idle", "edit_name", "edit_age", "edit_city","chatting", "edit_profile"], default : "waiting_name"},
    profileId : {type : String, default : null}

})

const userModel = model('users', userSchema);
module.exports = userModel;