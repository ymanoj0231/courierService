const unirest = require("unirest");
const logger = require("logger")

async function request({ method, url, headers = {}, body = null }) {
    logger.info(`[request] ${url} headers : ${JSON.stringify(headers)}`)
    let req = unirest(method, url).headers(headers);

    if (body) {
        req = req.send(body);
    }

    const response = await req;

    if (response.status >= 400) {
        logger.error(`[response] ${url} `, response.body?.message || response.body)
        throw new Error(response.body?.message || "Request failed");
    }

    return response;
}

module.exports = {
    request,
};