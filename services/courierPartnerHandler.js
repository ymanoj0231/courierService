
const urbaneBolt = require("./courier1/index.js");
const mock = require("./mock.js");

const courierPartners = {
    urbaneBolt,
    mock,
};

const getCourier = (courierPartner) => {

    const courier = courierPartners[courierPartner]
    if (!courier) {
        throw new Error(
            `Unsupported courier partner: ${courierPartner}`
        );
    }

    return courier;
}

module.exports = {
    getCourier
}