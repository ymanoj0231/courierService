require('../database/index.js')

const trackOrder = (request, response) => {
    console.log("inside function trackOrder ")
}

const cancelOrder = (request, response) => {
    console.log("inside function cancelOrder ")

}

const placeOrder = (request, response) => {
    console.log("inside function placeOrder ")

}

const bulkOrderUpdate = (request, response) => {
    console.log("inside function bulkUpdate ")

}

module.exports = {
    trackOrder,
    cancelOrder,
    placeOrder,
    bulkOrderUpdate
}
