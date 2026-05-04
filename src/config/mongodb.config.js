const {default : mongoose} = require("mongoose");
require("dotenv").config();
module.exports = mongodbConfig = () => {
    mongoose.connect(process.env.MONGODB_URL).then(() => console.log(`mongodb connected`)).catch(err => {
        if(err) console.log(err)
        
    })
}