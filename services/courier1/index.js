const logger = require("logger");
const { request } = require("./httpApi.js");
const config = require("../../config/env")
const moduleNameForLogging = "[urbaneBolt] "

const BASE_URL = config.urbaneBolt.baseUrl;
let accessToken = null

async function authenticate() {
    logger.info(`${moduleNameForLogging} authenticate request`);

    const response = await request({
        method: "POST",
        url: `${BASE_URL}/auth/getToken/`,
        headers: {
            "Content-Type": "application/json",
            "Cookie": config.urbaneBolt.cookie
        },
        body: {
            username: config.urbaneBolt.username,
            password: config.urbaneBolt.password,
        },
    });

    if (response.status >= 400) {
        throw new Error("urbaneBolt authentication failed");
    }

    accessToken = response.body.access_token;
    logger.info(`${moduleNameForLogging} authenticate response`, accessToken);
    return accessToken;
}

async function getHeaders() {
    logger.info(`${moduleNameForLogging} getHeaders`);

    if (!accessToken) {
        await authenticate();
    }

    return {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Cookie": config.urbaneBolt.cookie
    };
}

// Executes request. If token expired, re-authenticates once.
async function execute(requestOptions) {

    let response = await request({
        ...requestOptions,
        headers: {
            ...(await getHeaders()),
        },
    });

    if (response.status === 401) {

        logger.info("Refreshing urbaneBolt token");

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

        logger.error("urbaneBolt API Error", {
            statusCode: response.statusCode,
            body: response.body,
        });

        throw new Error(
            response.body?.message || "urbaneBolt request failed"
        );
    }

    return response;
}

async function createOrder(order) {
    logger.info(`${moduleNameForLogging} createOrder request body`, order)
    const response = await execute({
        method: "POST",
        url: `${BASE_URL}/services/manifest/`,
        body: [order],
    });

    logger.info(moduleNameForLogging + " createOrder response ", response)

    return {
        statusCode: response.statusCode,
        body: response.body
    };
}

async function trackOrder(order) {
    logger.info(`${moduleNameForLogging} trackOrder request body`, order)
    const response = await execute({
        method: "GET",
        url: `${BASE_URL}/services/tracking-pub/?awb=${order.awbNumber}`,
    });
    logger.info(`${moduleNameForLogging} trackOrder response `, response)
    return {
        statusCode: response.statusCode,
        body: response.body
    };
}

async function cancelOrder(order) {
    logger.info(`${moduleNameForLogging} cnacelOrder request body`, order)
    const response = await execute({
        method: "POST",
        url: `${BASE_URL}/services/cancel/`,
        body: { "awbs": order.awbNumber }
    });
    logger.info(`${moduleNameForLogging} cancelOrder response `, response)

    return {
        statusCode: response.statusCode,
        body: response.body
    }
}

async function validatePincodes(pincodes) {
    logger.info(`${moduleNameForLogging} validatePincodes request body`, pincodes)
    const response = await execute({
        method: "GET",
        url: `${BASE_URL}/location/pincodes/?pincodes=${pincodes.join(",")}`,
    });
    logger.info(`${moduleNameForLogging} validatePincodes response `, response)

    return {
        statusCode: response.statusCode,
        body: response.body
    }
}

module.exports = {
    createOrder,
    trackOrder,
    cancelOrder,
    validatePincodes,
};