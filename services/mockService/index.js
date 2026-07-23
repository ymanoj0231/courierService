async function trackOrder(order) {
    return new Promise((resolve, reject) => {
        resolve({
            statusCode: 200,
            body: {
                "status": "Success",
                "successResponse": [
                    {
                        "status": "Success",
                        "orderNumber": order.orderNumber,
                        "awbNumber": 1234567890,
                        "routeCode": "GGN/DLHH",
                        "shippingLabel": "https://api.uat.urbanebolt.in/api/v1/services/print-label/?key=himPHMijuCAmot7VZq835VeCMum75BZACtvUGyIQzGY25LrwZvc5pNnW16Pj4RA5",
                        "customerCode": "UEBCUS0008"
                    }
                ],
                "errorResponse": []
            }
        })
    })
}
async function createOrder(order) {
    return new Promise((resolve, reject) => {
        resolve({
            statusCode: 200,
            body: {
                "status": "Success",
                "successResponse": [
                    {
                        "status": "Success",
                        "orderNumber": order.orderNumber,
                        "awbNumber": 1234567890,
                        "routeCode": "GGN/DLHH",
                        "shippingLabel": "https://api.uat.urbanebolt.in/api/v1/services/print-label/?key=himPHMijuCAmot7VZq835VeCMum75BZACtvUGyIQzGY25LrwZvc5pNnW16Pj4RA5",
                        "customerCode": "UEBCUS0008"
                    }
                ],
                "errorResponse": []
            }
        })
    })


}
async function cancelOrder(order) {
    return new Promise((resolve, reject) => {
        resolve({
            statusCode: 200,
            body: {
                "status": "Success",
                "successResponse": [
                    {
                        "status": "Success",
                        "orderNumber": order.orderNumber,
                        "awbNumber": 1234567890,
                        "routeCode": "GGN/DLHH",
                        "shippingLabel": "https://api.uat.urbanebolt.in/api/v1/services/print-label/?key=himPHMijuCAmot7VZq835VeCMum75BZACtvUGyIQzGY25LrwZvc5pNnW16Pj4RA5",
                        "customerCode": "UEBCUS0008"
                    }
                ],
                "errorResponse": []
            }
        })
    })
}


module.exports = {
    createOrder,
    trackOrder,
    cancelOrder,
};