'use strict';

const { check, param, validationResult } = require('express-validator');

class UserValidator {
    /**
     * Handle the validation errors
     */
    validateHandler(req, res, next) {
        let errors = validationResult(req);
        if (errors.isEmpty()) {
            next();
        } else {
            res.status(422).send({ message: errors.errors[0].msg, status: 0 });
        }
    }

    /**
* Validates the podlogs
*/
    get getToken() {
        return [
            check('clientKey')
                .not().isEmpty().withMessage('The clientKey field is required.')
                .isString().withMessage('The clientKey must be a string.')
        ];
    }
    /**
* Validates the podlogs
*/
    get autoUpdate() {
        return [
            check('autoUpdateStatus')
                .not().isEmpty().withMessage('The autoUpdateStatus field is required.')
                .isBoolean().withMessage('The autoUpdateStatus must be a boolean.')
        ];
    }
}

module.exports = UserValidator;
