'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, label, printf } = format;

module.exports.getLogger = function (name) {
    const myFormat = printf(({ level, message, label, timestamp }) => {
        if (name) {
            return `${timestamp} [${label}] ${level}: ${message}`;
        }

        return `${timestamp} ${level}: ${message}`;
    });

    let config = {
        level: 'debug',
        format: combine(
            format.splat(),
            format.simple(),
            format.colorize({ all: true }),
            format.timestamp(),
            format.align(),
            label({ label: name }),
            myFormat
        ),
        transports: [
            new transports.File({ filename: 'combined.log' }),
            new transports.File({ filename: 'error.log', level: 'error' }),
            new transports.Console()
        ]
    };
    let logger = createLogger(config);
    return logger;
};

const loggerr = this.getLogger();

module.exports.handleAnsibleInfo = function (data) {
    loggerr.info(data.toString());
};

module.exports.handleAnsibleError = function (data) {
    loggerr.error(data.toString());
};