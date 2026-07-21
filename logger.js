const { createLogger, format: { combine, timestamp, errors, printf }, transports } = require("winston");

const logger = createLogger({
    level: "debug",

    format: combine(
        timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        errors({ stack: true }),
        printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} ${level.toUpperCase()} ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
        })
    ),

    transports: [
        new transports.Console(),
    ],
});

module.exports = logger;