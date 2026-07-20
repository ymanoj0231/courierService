const mongoose = require("mongoose");

async function connect() {
    try {
        console.log("connecting to mongodb")
        await mongoose.connect(`mongodb+srv://courierServiceUser01:${encodeURIComponent("Passw0rd@1234")}@cluster02.kctdri9.mongodb.net/?appName=Cluster02`)
        console.log("connection successful");
    } catch (error) {
        console.log("error connecting mongodb", error)
        throw error
    }

}

connect();