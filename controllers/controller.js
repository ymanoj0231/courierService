const logger = require('logger')
const { v4: uuid } = require("uuid")
const helpers = require('../helpers')
const { chunk } = require("lodash")
const { getCourier } = require('../services/courierPartnerHandler.js')
const OrderSchema = require("../database/schemas/orders.js")
const TrackingHistory = require("../database/schemas/trackingHistory.js")
const Batch = require("../database/schemas/batch.js")
const CHUNK_SIZE = 10;

const trackOrder = async (request, response) => {
    logger.info("inside trackOrder")
    const orderId = request.params.orderId;;
    try {
        const existingOrder = await OrderSchema.findOne({ orderId })
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
        const existingOrder = await OrderSchema.findOne({ orderId })
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
            OrderSchema.findOneAndUpdate({ orderId }, { status: "CANCELLED", updatedAt: timestamp }),
            //Add tracking for order
            TrackingHistory.create({
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
        const existingOrder = await OrderSchema.findOne({ orderId: orderId })
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
        // const { body = {} } = await courierPartner.validatePincodes([customer.address.pincode, shipping.address.pincode])
        // if (body.errorPincodes.length) {
        //     logger.error("Invalid customer address or shipping address ")
        //     return response.status(400).send({ message: `Invalid customer address or shipping address` })
        // }

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
                OrderSchema.create({
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
                TrackingHistory.create({
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
    const existingOrders = await OrderSchema.find({ orderId: { $in: orderIds } }, { _id: 0, orderId: 1 })
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
                OrderSchema.create({
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
                TrackingHistory.create({
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

const bulkOrderCreateV2 = async (request, response) => {
    const reqBody = request.body, batchId = uuid(), responseBody = {}, failedCount = 0, dbPromises = [];
    var ordersToBeProcessed = []
    try {
        if (reqBody.length > 100) {
            return response.status(400).send({ "message": "Can't process more than 100 records at a time." })
        }
        const orderIds = _getOrderIds(reqBody)

        //get existing orders
        const existingOrders = await OrderSchema.find({ orderId: { $in: orderIds } }, { _id: 0, orderId: 1 })
        const existingOrderIds = _getOrderIds(existingOrders)

        //get orders with invalid courier_partner
        const invalidOrders = reqBody.filter(order => { return !helpers.courierPartners.includes(order.courier_partner) })
        const invalidOrderIds = _getOrderIds(invalidOrders)

        // filterOut the orders that are already existing or with invalid courierPartner
        if ([...existingOrderIds, ...invalidOrderIds].length) {
            ordersToBeProcessed = reqBody.filter(i => { return !([...existingOrderIds, ...invalidOrderIds].includes(i.orderId)) })
            if (existingOrderIds.length)
                responseBody["existingOrders"] = {
                    orderIds: existingOrderIds,
                    message: `OrderIds already exists.`
                }

            if (invalidOrders.length)
                responseBody["invalidOrders"] = {
                    orderIds: invalidOrderIds,
                    message: `Invalid courier partner.`
                }
        } else {
            ordersToBeProcessed = reqBody
        }

        await Batch.create({
            batchId,
            status: "PROCESSING",
            totalOrders: reqBody.length,
            processedOrders: ordersToBeProcessed.length,
            createdAt: new Date().getTime(),
            updatedAt: new Date().getTime()
        })

        response.status(200).send({
            batchId,
            status: "PROCESSING",
            NumberOfOrdersBeingProcessed: orderIds.length - existingOrderIds.length - invalidOrderIds.length,
            ...responseBody
        })


        //Process the orders
        const courierRequests = ordersToBeProcessed.map(order => {
            const courierRequest = helpers.buildServicePayload(order)
            return getCourier(order.courier_partner).createOrder(courierRequest)
        })

        // Process orders in chunks of 10 to reduce load on the service
        const courierResponses = await processRequestsIntoChunks(courierRequests)

        for (let i = 0; i < courierResponses.length; i++) {
            const courierRequest = helpers.buildServicePayload(ordersToBeProcessed[i])

            if (courierResponses[i].status === "rejected") {
                dbPromises.push(...prepareDbRequests("FAILED", batchId, ordersToBeProcessed[i], courierResponses[i].reason))
                failedCount++;
            } else {
                const { body: { successResponse: [{ awbNumber } = {}] = [], errorResponse = [] } = {} } = courierResponses[i].value
                if (errorResponse.length) failedCount++;
                dbPromises.push(...prepareDbRequests("CREATED", batchId, ordersToBeProcessed[i], courierResponses[i].value))
            }
        }

        await processRequestsIntoChunks(dbPromises);
        await Batch.findOneAndUpdate(
            { batchId },
            {
                status: "COMPLETED",
                successOrders: ordersToBeProcessed.length - failedCount,
                failedOrders: failedCount,
                updatedAt: new Date().getTime()
            })
    } catch (error) {
        logger.error("Error in bulkOrderCreateV2 ", error)
        // return response.status(error.statusCode || 500).send({ message: `Error creating bulk order` })
    }
}

const getOrdersByBatchId = async (request, response) => {
    const batchId = request.params.batchId;
    try {
        const batch = await Batch.findOne({ batchId })

        if (!batch) {
            logger.error(`batchId ${batchId} not found`)
            return response.status(400).send({ message: `Invalid batchId` })
        }

        const { status = "", totalOrders = 0, processedOrders = 0, successOrders = 0, failedOrders = 0 } = batch

        if (batch.status === "PROCESSING") {
            logger.error(`batchId ${batchId} is still in PROCESSING state`)
            return response.status(200).send({ message: `batchId ${batchId} is still in PROCESSING state` })
        }

        const orders = await OrderSchema.find({ batchId })

        return response.status(200).send({
            batchId,
            status,
            totalOrders,
            processedOrders,
            successOrders: {
                count: successOrders,
                orderIds: orders.filter(i => i.status !== "FAILED").map(i => i.orderId)
            },
            failedOrders: {
                count: failedOrders,
                orderIds: orders.filter(i => i.status === "FAILED").map(({ orderId, courierResponse: reason }) => { return { orderId, reason } })
            }
        })

    } catch (error) {
        logger.error("Error in getOrdersByBatchId ", error.message || error)
        return response.status(error.statusCode || 500).send({ message: `Error getting orders by batchId ${batchId}` })
    }
}


const _getOrderIds = (arr) => {
    return arr.map((order) => { return order.orderId })
}

const processRequestsIntoChunks = async (requests) => {

    if (!requests.length)
        return [];
    const resultsArray = [], chunks = chunk(requests, CHUNK_SIZE);

    for (const chunk of chunks) {
        let res = await Promise.allSettled(chunk)
        resultsArray.push(...res);
        // wait for 500 ms before initiating another chunk
        await helpers.sleep(500)
    }

    return resultsArray
}

const prepareDbRequests = (status, batchId, order, courierResponse) => {
    const courierRequest = helpers.buildServicePayload(order), timestamp = new Date().getTime();
    const { orderId } = order;
    var awb;

    if (status === "CREATED") {
        const { body: { successResponse: [{ awbNumber } = {}] = [], errorResponse = [] } = {} } = courierResponse
        if (errorResponse.length) {
            status = "FAILED"
        } else {
            awb = awbNumber
        }
    }

    return [
        //create order 
        OrderSchema.create({
            ...order,
            batchId,
            ...(status !== "FAILED" && { awbNumber: awb, courierOrderId: orderId, }),
            status,
            courierRequest,
            courierResponse,
            createdAt: timestamp,
            updatedAt: timestamp
        }),
        // create tracking history
        TrackingHistory.create({
            orderId,
            status,
            courierRequest,
            courierResponse,
            createdAt: timestamp
        })]
}


module.exports = {
    trackOrder,
    cancelOrder,
    placeOrder,
    bulkOrderCreate,
    bulkOrderCreateV2,
    getOrdersByBatchId
}
