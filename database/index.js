const mongoose = require("mongoose");
const config = require("../config/env.js")
const logger = require("logger")

async function mongooseConnection() {
    try {
        logger.info("connecting to mongodb ...")
        const { database: { user, password, clusterName } = {} } = config
        await mongoose.connect(`mongodb+srv://${user}:${encodeURIComponent(password)}@${clusterName}.kctdri9.mongodb.net/?appName=Cluster02`)
        logger.info("MongoDB connection successful");
    } catch (error) {
        console.log("error connecting mongodb", error)
        throw error
    }

}

module.exports = mongooseConnection;