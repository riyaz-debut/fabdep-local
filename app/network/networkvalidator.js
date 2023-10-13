'use strict';

const { check, param, validationResult } = require('express-validator');

class NetworkValidator {
    /**
     * Handle the validation errors
     */
    handleError(req, res, next) {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).send({ message: 'Validation Errors', status: 0, errors: errors });
        } else {
            next();
        }
    }

    /**
     * Add Network
     */
    get addNetwork() {
        return [
            check('name')
                .not().isEmpty().withMessage('The name field is required.')
                .isString().withMessage('The name must be a string.')
                .isLength({ min: 3, max: 50 }).withMessage('The name must be between 3 and 50 characters.')
                .matches(/^[a-zA-Z0-9-_]+$/),
/*             check('description')
                .not().isEmpty().withMessage('The description field is required.')
                .isString().withMessage('The description must be a string.')
                .isLength({ max: 500 }).withMessage('The description may not be greater than 500 characters.'), */
            // check('cluster_id')
            //     .not().isEmpty().withMessage('The cluster_id field is required.')
            //     .isString().withMessage('The description must be a string.')
            //     .isLength({ min: 24, max: 30 }).withMessage('The name must be between 24 and 30 characters.'),
        ];
    }

    /**
     * Validates the Update network
     */
    get updateNetwork() {
        return [
            param('id')
                .not().isEmpty().withMessage('The id field is required.')
                .isString().withMessage('The id must be a string.'),
            check('description')
                .not().isEmpty().withMessage('The description field is required.')
                .isString().withMessage('The description must be a string.')
                .isLength({ max: 500 }).withMessage('The description may not be greater than 500 characters.'),
        ];
    }

    /**
     * Validates the ID
     */
    get getNetwork() {
        return [
            param('id')
                .not().isEmpty().withMessage('The id field is required.')
                .isString().withMessage('The id must be a string.'),
        ];
    }


    /**
  * Validates the ID
  */
    get getPodlist() {
        return [
            check('networkid')
                .not().isEmpty().withMessage('The networkid field is required.')
                .isString().withMessage('The networkid must be a string.'),
        ];
    }

    /**
* Validates the ID
*/
    get addClusterToNetwork() {
        return [
            check('networkid')
                .not().isEmpty().withMessage('The networkid field is required.')
                .isString().withMessage('The networkid must be a string.'),
            check('cluster_id')
                .not().isEmpty().withMessage('The cluster_id field is required.')
                .isString().withMessage('The description must be a string.')
        ];
    }


    /**
* Validates the podlogs
*/
    get getPodlogs() {
        return [
            check('networkid')
                .not().isEmpty().withMessage('The networkid field is required.')
                .isString().withMessage('The networkid must be a string.'),
            check('podname')
                .not().isEmpty().withMessage('The Podname field is required.')
                .isString().withMessage('Podname must be a string.'),
            check('containername')
                .isString().withMessage('Podname must be a string.'),
            check('numberoflines')
                .not().isEmpty().withMessage('numberoflines field is required.')
                .isNumeric().withMessage('numberoflines must be a number.'),

        ];
    }
}

module.exports = NetworkValidator;
