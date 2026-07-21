const logger = require('logger')

const trackOrder = (request, response) => {
    logger.info("inside trackOrder")
}

const cancelOrder = (request, response) => {
    logger.info("inside function cancelOrder ")

}

const placeOrder = (request, response) => {
    logger.info("inside function placeOrder ")

}

const bulkOrderUpdate = (request, response) => {
    logger.info("inside function bulkUpdate ")

}

module.exports = {
    trackOrder,
    cancelOrder,
    placeOrder,
    bulkOrderUpdate
}
