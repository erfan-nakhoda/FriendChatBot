const {Schema, model} = require("mongoose");

const userSchema = new Schema({
    chat_id : {type : String, unique : true, required : true},
    name : {type : String, required : true},
    age : {type : String , required : true},
    city : {type : String, required : true},
    partner_id : {type : String, default : null},

})

const userModel = model('users', userSchema);
module.exports = userModel;