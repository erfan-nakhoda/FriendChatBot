const express = require('express')
require('dotenv').config()
const main = () => {
    const app = express();
    const port = process.env.PORT ?? 4500
    app.listen(port, err => {
       if(err) console.log(err);
        
    })
}