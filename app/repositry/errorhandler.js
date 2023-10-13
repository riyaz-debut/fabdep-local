'use strict';
const logger = require('./utils').getLogger('ErrorHandler');

class ErrorHandler {

    /**
     * Handle the errors
     */
    static handleError(error) {
        logger.error('Error %s', error.message);

        return {
            status: error.status || 500,
            message: error.message,
            data: {
                message: error.message
            }
        };
    }
}

module.exports = ErrorHandler;