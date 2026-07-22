const mongoose = require('mongoose');

const TrackingHistory = new mongoose.Schema({

    orderId: {
        type: String,
        required: true,
        index: true,
    },
    status: {
        type: String,
        required: true
    },
    courierRequest: {
        type: Object,
    },
    courierResponse: {
        type: Object,
    },
    createdAt: {
        type: Number,
        required: true
    },
})

module.exports = mongoose.model("TrackingHistory", TrackingHistory)