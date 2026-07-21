const logger = require("logger");
const { request } = require("./httpApi.js");
const config = require("../../config/env")
const moduleNameForLogging = "[urbanebolt] "

const BASE_URL = config.urbanebolt.baseUrl;

let accessToken = null;

/**
 * Authenticate with urbanebolt
 */
async function authenticate() {

    const response = await request({
        method: "POST",
        url: `${BASE_URL}/auth/getToken`,
        body: {
            username: config.urbanebolt.username,
            password: config.urbanebolt.password,
        },
    });

    if (response.status >= 400) {
        throw new Error("urbanebolt authentication failed");
    }

    accessToken = response.body.token;

    logger.info(moduleNameForLogging + "urbanebolt authenticated");

    return accessToken;
}

/**
 * Returns auth headers
 */
async function getHeaders() {

    if (!accessToken) {
        await authenticate();
    }

    return {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Cookie": config.urbanebolt.cookie
    };
}

/**
 * Executes request.
 * If token expired, re-authenticates once.
 */
async function execute(requestOptions) {

    let response = await request({
        ...requestOptions,
        headers: {
            ...(await getHeaders()),
        },
    });

    if (response.status === 401) {

        logger.info("Refreshing urbanebolt token");

        await authenticate();

        response = await request({
            ...requestOptions,
            headers: {
                ...(requestOptions.headers || {}),
                ...(await getHeaders()),
            },
        });
    }

    if (response.status >= 400) {

        logger.error("urbanebolt API Error", {
            status: response.status,
            response: response.body,
        });

        throw new Error(
            response.body?.message || "urbanebolt request failed"
        );
    }

    return response.body;
}

/**
 * Create Shipment
 */
async function createOrder(order) {
    logger.info(moduleNameForLogging + "urbanebolt createOrder response ", order)

    const response = await execute({
        method: "POST",
        url: `${BASE_URL}/orders`,
        body: [order],
    });

    logger.info("urbanebolt createOrder response ", response)

    console.log("===response===", response)
    return {
        courierOrderId: response.order_id,
        awbNumber: response.awb_number,
        status: response.status,
        rawResponse: response.body,
    };
}

/**
 * Track Shipment
 */
async function trackOrder(order) {

    const response = await execute({
        method: "GET",
        url: `${BASE_URL}/orders/${order.courierOrderId}/track`,
    });

    return {
        status: response.status,
        rawPayload: response,
    };
}

/**
 * Cancel Shipment
 */
async function cancelOrder(order) {

    const response = await execute({
        method: "POST",
        url: `${BASE_URL}/orders/${order.courierOrderId}/cancel`,
    });

    return {
        status: response.status,
        rawPayload: response,
    };
}

module.exports = {
    createOrder,
    trackOrder,
    cancelOrder,
};