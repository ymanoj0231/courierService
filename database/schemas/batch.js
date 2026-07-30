const mongoose = require("mongoose");

const Batch = new mongoose.Schema({
    batchId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: [
            "PROCESSING",
            "COMPLETED"
        ],
        required: true,
    },
    totalOrders: {
        type: Number,
        required: true
    },
    processedOrders: {
        type: Number,
    },
    successOrders: {
        type: Number,
    },
    failedOrders: {
        type: Number,
    },
    createdAt: {
        type: Number,
        required: true,
    },
    updatedAt: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model("Batch", Batch)