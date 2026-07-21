const logger = require('logger')
const helpers = require('../helpers')
const { getCourier } = require('../services/courierPartnerHandler.js')
const orderSchema = require("../database/schemas/orders.js")

const trackOrder = async (request, response) => {
    logger.info("inside trackOrder")
}

const cancelOrder = async (request, response) => {
    logger.info("inside function cancelOrder ")

}

const placeOrder = async (request, response) => {

    try {
        logger.info("inside function placeOrder ", request.body)
        var courierPartner, courierResponse
        const courierPartnerName = request.body?.courier_partner

        try {
            courierPartner = getCourier(courierPartnerName)

        } catch (error) {
            logger.error("Error placing order ", error.message || error)
            return response.status(400).send({ message: `Invalid courier partner ${courierPartnerName}` })

        }

        //create order in courier service
        try {
            const servicePayload = helpers.buildServicePayload(request.body)
            courierResponse = await courierPartner.createOrder(servicePayload)

        } catch (error) {
            logger.error("Error creating shipment ", error.message || error)
            return response.status(error.statusCode || 500).send({ message: `Error creating shipMent with partner ${courierPartnerName}` })

        }


        //insert DB record;
        try {
            // const orderPayload = helpers.buildDBPayload(request.body, courierResponse)
            // const order = await orderSchema.find({}).sort({ createdAt: -1 }).limit(1);
            // const timestamp = new Date().getTime()
            // let dbRecord = {
            //     ...request.body,
            //     awbNumber: courierResponse.awbNumber,
            //     courierOrderId: courierResponse.awbNumber,
            //     status: "CREATED",
            //     orderId: "00001",
            //     createdAt: timestamp,
            //     updatedAt: timestamp
            // }
            // console.log("===dbrecord===", dbRecord)

            // await orderSchema.create(dbRecord)

        } catch (error) {

        }




        return response.status(response.status).send({ orderId: response.courierOrderId })
    } catch (error) {
        logger.error("Error placing order ", error.message || error)
        return response.status(error.statusCode || 500).send({ message: `Error placing order. Please try Again` })

    }

}

const bulkOrderUpdate = async (request, response) => {
    logger.info("inside function bulkUpdate ")

}

module.exports = {
    trackOrder,
    cancelOrder,
    placeOrder,
    bulkOrderUpdate
}
