const redisKeys = Object.freeze({
    maleQueue : "queue:male",
    femaleQueue : "queue:female",
    partner : userId => `user:${userId}:partner`,
    profile : userId => `user:${userId}:profile`,
    wait : userId => `user:${userId}:inQueue`,
 })
 
 module.exports ={
    redisKeys
 }