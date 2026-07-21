const express = require('express');
const app = express()
const routes = require("./routes/router.js")
const env = require('./config/env')
const mongooseConnection = require('./database/index.js')
const logger = require("logger")

app.use(express.json())
app.use(routes)

async function startServer() {
    await mongooseConnection()
    app.listen(env.PORT, () => {
        logger.info(`server started on port ${env.PORT}`)
    })
}

startServer()

