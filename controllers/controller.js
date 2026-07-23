const logger = require('logger')
const { v4: uuid } = require("uuid")
const helpers = require('../helpers')
const { getCourier } = require('../services/courierPartnerHandler.js')
const orderSchema = require("../database/schemas/orders.js")
const trackingHistory = require("../database/schemas/trackingHistory.js")

const trackOrder = async (request, response) => {
    logger.info("inside trackOrder")
    const orderId = request.params.orderId;;
    try {
        const existingOrder = await orderSchema.findOne({ orderId })
        if (!existingOrder) {
            logger.info(`OrderId ${orderId} NOT found`)
            return response.status(404).send({ message: `OrderId ${orderId} NOT found` })
        }
        const { status, courier_partner, awbNumber } = existingOrder

        const courierPartner = getCourier(courier_partner)
        const courierResponse = await courierPartner.trackOrder({ orderId, awbNumber })

        const { body: { data: { scans: histories = [] } = {} } = {} } = courierResponse
        const tracking = histories.map(({ statusCodeDescription: desc, statusDateTime: time }) => { return { status: desc === "Shipment Manifested" ? "CREATED" : desc.toUpperCase(), time } })
        return response.status(200).send({
            currentStatus: status,
            tracking
        })

    } catch (error) {
        logger.error(`Error getting tracking info of orderId ${orderId} `, error.message || error)
        return response.status(400).send({ message: `Error getting tracking info of orderId ${orderId}` })
    }
}

const cancelOrder = async (request, response) => {
    logger.info("inside function cancelOrder ")
    var courierResponse
    const orderId = request.params.orderId;
    try {
        const existingOrder = await orderSchema.findOne({ orderId })
        if (!existingOrder) {
            logger.info(`OrderId ${orderId} NOT found`)
            return response.status(404).send({ message: `OrderId ${orderId} NOT found` })
        }

        const { status, courier_partner, awbNumber } = existingOrder
        if (["PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(status)) {
            logger.info(`OrderId ${orderId} can't be cancelled. Order is alerady in ${status}`)
            return response.status(404).send({ message: `OrderId ${orderId} can't be cancelled. Order is alerady in ${status}` })
        }

        try {
            const courierPartner = getCourier(courier_partner)
            courierResponse = await courierPartner.cancelOrder({ orderId, awbNumber })

        } catch (error) {
            logger.error(`Error cancelling orderId ${orderId} `, error.message || error)
            return response.status(400).send({ message: `Error cancelling orderId ${orderId}` })

        }
        const timestamp = new Date().getTime()
        await Promise.all([
            //update order status
            orderSchema.findOneAndUpdate({ orderId }, { status: "CANCELLED", updatedAt: timestamp }),
            //Add tracking for order
            trackingHistory.create({
                orderId,
                status: "CANCELLED",
                courierRequest: { orderId, awbNumber },
                courierResponse,
                createdAt: timestamp
            })
        ])
        return response.status(200).send({ message: `OrderId ${orderId} is cancelled successfully` })

    } catch (error) {
        logger.error(`Error cancelling orderId ${orderId} `, error.message || error)
        return response.status(500).send({ message: `Error cancelling orderId ${orderId}` })
    }

}

const placeOrder = async (request, response) => {

    try {
        logger.info("inside function placeOrder ", request.body)
        const { body: { orderId, customer, shipping } } = request;
        if (!orderId) {
            return response.status(400).send({ message: "orderId is missing in payload" })
        }

        var courierPartner, courierResponse, courierRequest
        const courierPartnerName = request.body?.courier_partner

        //check if orderId already exists.
        const existingOrder = await orderSchema.findOne({ orderId: orderId })
        if (existingOrder) {
            logger.info(`OrderId ${orderId} already exists in ${existingOrder.status} state`)
            return response.status(200).send({ orderId: orderId })
        }

        try {
            courierPartner = getCourier(courierPartnerName)

        } catch (error) {
            logger.error("Error placing order ", error.message || error)
            return response.status(400).send({ message: `Invalid courier partner ${courierPartnerName}` })
        }

        //check if the given addresses(pincodes) are valid or not
        const { body = {} } = await courierPartner.validatePincodes([customer.address.pincode, shipping.address.pincode])
        if (body.errorPincodes.length) {
            logger.error("Invalid customer address or shipping address ")
            return response.status(400).send({ message: `Invalid customer address or shipping address` })
        }

        //create order in courier service
        courierRequest = helpers.buildServicePayload(request.body)
        courierResponse = await courierPartner.createOrder(courierRequest)
        const { successResponse: [{ awbNumber }], errorResponse = [] } = courierResponse.body

        if (errorResponse.length) {
            logger.error("Error creating shipment ", courierResponse.body.errorResponse)
            return response.status(courierResponse.statusCode || 500).send({ message: `Error creating shipMent with partner ${courierPartnerName}` })
        }

        try {
            const timestamp = new Date().getTime()

            await Promise.all([
                //create order 
                orderSchema.create({
                    ...request.body,
                    awbNumber: awbNumber,
                    courierOrderId: orderId,
                    status: "CREATED",
                    courierRequest,
                    courierResponse,
                    createdAt: timestamp,
                    updatedAt: timestamp
                }),
                // create tracking history
                trackingHistory.create({
                    orderId,
                    status: "CREATED",
                    courierRequest,
                    courierResponse,
                    createdAt: timestamp
                })
            ])

        } catch (error) {
            logger.error("error inserting a DB record", error)
            throw error
        }

        return response.status(200).send({ orderId })
    } catch (error) {
        logger.error("Error placing order ", error.message || error)
        return response.status(error.statusCode || 500).send({ message: `Error placing order. Please try Again` })
    }

}

const bulkOrderCreate = async (request, response) => {
    logger.info("inside function bulkUpdate ", request.body)
    var ordersToBeProcessed, successOrders = [], failedOrders = [], dbPromises = [];
    const reqBody = request.body, batchId = uuid();

    if (reqBody.length > 100) {
        return response.status(400).send({ "message": "Can't process more than 100 records at a time." })
    }

    const orderIds = _getOrderIds(reqBody)
    const existingOrders = await orderSchema.find({ orderId: { $in: orderIds } }, { _id: 0, orderId: 1 })
    const existingOrderIds = _getOrderIds(existingOrders)
    //orders with invalid courier_partner
    const invalidOrders = reqBody.filter(order => { return !helpers.courierPartners.includes(order.courier_partner) })
    const invalidOrderIds = _getOrderIds(invalidOrders)

    if ([...existingOrderIds, ...invalidOrderIds].length) {
        // filterOut the orders that are already existing or with invalid courierPartner
        ordersToBeProcessed = reqBody.filter(i => { return !([...existingOrderIds, ...invalidOrderIds].includes(i.orderId)) })

    } else {
        ordersToBeProcessed = reqBody
    }

    //create bulk order in courier
    const courierRequests = ordersToBeProcessed.map(order => {
        const courierRequest = helpers.buildServicePayload(order)
        return getCourier(order.courier_partner).createOrder(courierRequest)

    })
    const courierResponses = await Promise.allSettled(courierRequests)

    for (let i = 0; i < courierResponses.length; i++) {

        const { orderId, } = ordersToBeProcessed[i]
        const timestamp = new Date().getTime()

        if (courierResponses[i].status === "rejected") {
            failedOrders.push({ orderId, failureReason: courierResponses[i].reason })
        } else {
            const { body: { successResponse: [{ awbNumber } = {}] = [], errorResponse = [] } = {} } = courierResponses[i].value
            //if errrorResponse, push to failed orders
            if (errorResponse.length) {
                failedOrders.push({ orderId, failureReason: errorResponse[0] })
                continue;
            }

            const courierRequest = helpers.buildServicePayload(ordersToBeProcessed[i])
            successOrders.push(orderId)
            dbPromises.push(...[
                //create order 
                orderSchema.create({
                    ...ordersToBeProcessed[i],
                    batchId,
                    awbNumber,
                    courierOrderId: orderId,
                    status: "CREATED",
                    courierRequest,
                    courierResponse: courierResponses[i].value,
                    createdAt: timestamp,
                    updatedAt: timestamp
                }),
                // create tracking history
                trackingHistory.create({
                    orderId,
                    status: "CREATED",
                    courierRequest,
                    courierResponse: courierResponses[i].value,
                    createdAt: timestamp
                })])
        }
    }
    await Promise.allSettled(dbPromises)
    response.status(200).send({ batchId, successOrders, existingOrders: existingOrderIds, invalidOrders: invalidOrderIds, failedOrders })
}

function _getOrderIds(arr) {
    return arr.map((order) => { return order.orderId })
}

module.exports = {
    trackOrder,
    cancelOrder,
    placeOrder,
    bulkOrderCreate
}
