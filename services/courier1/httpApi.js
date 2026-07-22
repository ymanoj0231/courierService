const unirest = require("unirest");
const logger = require("logger")

async function request({ method, url, headers = {}, body = null }) {
    logger.info(`[request] ${method} ${url} headers : ${JSON.stringify(headers)}`)
    let req = unirest(method, url).headers(headers);

    if (body) {
        req = req.send(body);
    }

    const response = await req;

    if (response.status >= 400) {
        logger.error(`[response] ${url} `, response)
        throw new Error(response.body?.message || "Request failed");
    }
    logger.info(`[response] ${method} ${url} `, response)

    return response;
}

module.exports = {
    request,
};