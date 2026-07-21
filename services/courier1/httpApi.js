const unirest = require("unirest");

async function request(method, url, headers = {}, body = null) {
    let req = unirest(method, url).headers(headers);

    if (body) {
        req = req.send(body);
    }

    const response = await req;

    if (response.status >= 400) {
        throw new Error(response.body?.message || "Request failed");
    }

    return response;
}

module.exports = {
    request,
};