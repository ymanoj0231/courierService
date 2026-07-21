const express = require('express');
const app = express()
const routes = require("./routes/router.js")
const env = require('./config/env')

app.use(express.json())
app.use(routes)


app.listen(env.PORT, () => {
    console.log(`server started on port ${env.PORT}`)
})
