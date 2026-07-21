const mongoose = require("mongoose");
const config = require("../config/env.js")

async function connect() {
    try {
        console.log("connecting to mongodb")
        const { database: { user, password, clusterName } = {} } = config
        await mongoose.connect(`mongodb+srv://${user}:${encodeURIComponent(password)}@${clusterName}.kctdri9.mongodb.net/?appName=Cluster02`)
        console.log("connection successful");
    } catch (error) {
        console.log("error connecting mongodb", error)
        throw error
    }

}

connect();