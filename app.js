const express = require('express');
const app = express()
const routes = require("./routes/router.js")
const env = require('./config/env')
const mongooseConnection = require('./database/index.js')
const logger = require("logger")

//use logger middleware to log every request
app.use((req, res, next) => {
    logger.info(`[request] ${req.method} ${req.originalUrl} `)
    res.on("finish", () => {
        logger.info(`[response] ${req.method} ${req.originalUrl} ${res.statusCode}`)
    })
    next()
})

app.use(express.json())
app.use("/api/v1", routes)

async function startServer() {
    await mongooseConnection()
    app.listen(env.PORT, () => {
        logger.info(`server started on port ${env.PORT}`)
    })
}

startServer()


