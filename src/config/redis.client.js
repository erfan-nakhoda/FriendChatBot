const {createClient} = require("redis");
const redisClient = createClient({
    url : "redis://localhost:6379"
})
const initRedis = async () => {

    redisClient.on("error", err => console.log("Redis error :", err));
    await redisClient.connect()
    console.log("redis is connected");
    
}

module.exports = {
    initRedis,
    redisClient
}