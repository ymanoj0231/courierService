

const buildServicePayload = (reqBody) => {
    var servicePayload = {};

    const {
        customerCode,
        orderId, //TODO : need to be generated based on DB. Can't allow duplicated
        courier_partner,
        customer: {
            name: customerName,
            mobile: customerMobile,
            email: customerEmail,
            address: customerAddress,
        },
        shipping: {
            name: recipientName,
            mobile: recipientMobile,
            email: recipientEmail,
            address: shippingAddress,

        },
        itemDescription,
        quantity,
        paymentMode = "",
        invoice: {
            number: invoiceNumber,
            date: invoiceDate,
            value: invoiceValue
        }
    } = reqBody

    switch (courier_partner) {
        case "urbanebolt":
            servicePayload = {
                "customerCode": customerCode,
                "courier_partner": courier_partner,
                "orderNumber": orderId,
                "declaredValue": invoiceValue,
                "itemDescription": itemDescription,
                "collectableValue": invoiceValue,
                "height": 10,
                "length": 12,
                "pieces": quantity,
                "weight": 1.1,
                "breadth": 10,
                "serviceType": "SDD",
                "payMode": paymentMode,
                "rtnCity": customerAddress.city,
                "rtnName": customerName,
                "consCity": shippingAddress.city,
                "consName": recipientName,
                "rtnEmail": customerEmail,
                "rtnState": customerAddress.state,
                "shprCity": customerAddress.city,
                "shprName": customerName,
                "consEmail": recipientEmail,
                "consState": shippingAddress.state,
                "rtnMobile": customerMobile,
                "shprEmail": customerEmail,
                "shprState": customerAddress.state,
                "consMobile": recipientMobile,
                "rtnAddress": customerAddress.address,
                "rtnAddressType": "Seller",
                "rtnCountry": "INDIA",
                "rtnPincode": customerAddress.pincode,
                "shprMobile": customerMobile,
                "consAddress": shippingAddress.address,
                "consAddressType": "Home",
                "consCountry": "INDIA",
                "consPincode": shippingAddress.pincode,
                "invoiceNumber": invoiceNumber,
                "invoiceDate": invoiceDate,
                "shprAddress": customerAddress.address,
                "shprAddressType": "Seller",
                "shprCountry": "INDIA",
                "shprPincode": customerAddress.pincode,
                "invoiceValue": invoiceValue,
                "itemQuantity": quantity
            }
            break;
        case "mock":
            servicePayload = {}
            break;
        default:
            break;
    }
    console.log("===courier===", courier_partner)

    return servicePayload
}

// const buildDBPayload = (reqBody, courierResponse) => {
//     const { awbNumber } = courierResponse

//     return {
//         ...reqBody,
//         awbNumber
//     }
// }
module.exports = {
    buildServicePayload
}