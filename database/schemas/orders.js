const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
    {
        address: {
            type: String,
            default: "",
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        }

    },
    {
        _id: false,
    }
);

const addressSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        mobile: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            lowercase: true,
        },
        address: locationSchema
    },
    {
        _id: false,
    }

);

const Orders = new mongoose.Schema({

    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    customerCode: {
        type: String,
        required: true,
    },
    courier_partner: {
        type: String,
        required: true,
        enum: ["urbaneBolt", "mock"],
    },
    courierOrderId: {
        type: String,
        default: null,
    },
    awbNumber: {
        type: String,
        required: true,
        index: true,
    },
    batchId: {
        type: String,
        index: true,
    },
    status: {
        type: String,
        enum: [
            "CREATED",
            "PICKED_UP",
            "IN_TRANSIT",
            "DELIVERED",
            "CANCELLED",
            "FAILED",
        ],
        default: "CREATED",
        index: true,
    },
    paymentMode: {
        type: String,
        enum: ["COD", "PPD"],
        default: "PPD",
    },
    customer: addressSchema,
    shipping: addressSchema,
    itemDescription: {
        type: String
    },
    quantity: {
        type: Number
    },
    courierRequest: {
        type: Object,
        required: true
    },
    courierResponse: {
        type: Object,
        required: true
    },
    createdAt: {
        type: Number,
        required: true,
    },
    updatedAt: {
        type: Number,
        required: true
    },
})

module.exports = mongoose.model("Orders", Orders)
