const express = require('express');
const app = express()
const routes = require("./routes/router.js")

app.use(express.json())
app.use(routes)

app.listen(4000, () => {
    console.log("server started on port 4000")
})
