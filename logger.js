const { createLogger, format: { combine, timestamp, errors, printf }, transports } = require("winston");

const logger = createLogger({
    level: "debug",

    format: combine(
        timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        errors({ stack: true }),
        printf(({ timestamp, level, message, stack, ...meta }) => {
            const log = {
                timestamp,
                level: level.toUpperCase(),
                message,
                ...meta,
            };

            if (stack) {
                log.stack = stack;
            }

            return JSON.stringify(log);
        })
    ),

    transports: [
        new transports.Console(),
    ],
});

module.exports = logger;