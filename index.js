const express = require('express');
const botService = require('./src/module/bot/bot.service');
require('dotenv').config()
const main = () => {
    const app = express();

    // botService.start()
    botService.launch()
    const port = process.env.PORT ?? 4500
    app.listen(port, err => {
       if(err) console.log(err);
        
    })
        // setInterval(() => botService.selectLastUser().then(value => console.log(value)), 5000)


}

main()