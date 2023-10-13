'use strict';
const { check, param, validationResult } = require('express-validator');
const vms = require('./vmModel');


class VmValidator {
    validateHandler(req, res, next) {
        let errors = validationResult(req);
        if (errors.isEmpty()) {
            next();
        } else {
            res.status(422).send({ message: 'Validation Errors', status: 0, errors: errors });
        }
    }



    get createvmRequest() {
        return [
            check('ip').not().isEmpty().withMessage('ip  is required.').isLength({ min: 8, max: 50 }).withMessage('ip length must be from 8 to 50.'),
            check('username').not().isEmpty().withMessage('username  is required.').isLength({ min: 3, max: 50 }).withMessage('username length must be from 3 to 50.'),
            check('password').not().isEmpty().withMessage('password is required.').isLength({ min: 3, max: 100 }).withMessage('Password length should be from 3 to 100.'),
            check('description').isLength({ max: 500 }).withMessage('description  length must be  500.'),
            check('clusterId').optional({ checkFalsy: true }).isLength({ min: 3, max: 200 }).withMessage('clusterId length must be from 3 to 200.'),
            check('type').isIn(['1', '2', '3']).withMessage('choose type from 1,2 and 3.'),
            check('status').optional({ checkFalsy: true }).isIn(['0', '1', '2']).withMessage('choose status from 0,1 and .'),
        ];
    }



    get updatevmRequest() {
        return [
            check('ip').not().isEmpty().withMessage('ip  is required.').isLength({ min: 8, max: 50 }).withMessage('ip length must be from 8 to 50.'),
            check('username').not().isEmpty().withMessage('username  is required.').isLength({ min: 3, max: 50 }).withMessage('username length must be from 3 to 50.'),
            check('password').not().isEmpty().withMessage('password is required.').isLength({ min: 3, max: 100 }).withMessage('Password length should be from 3 to 100.'),
            check('description').optional({ checkFalsy: true }).isLength({ min: 5, max: 500 }).withMessage('description  length must be  500.'),
            check('clusterId').optional({ checkFalsy: true }).isLength({ min: 3, max: 200 }).withMessage('clusterId length must be from 3 to 200.'),
            check('vmid').not().isEmpty().withMessage('vmid is required.'),
            check('type').isIn(['1', '2', '3']).withMessage('choose type from 1,2 and 3.'),
            check('status').optional({ checkFalsy: true }).isIn(['0', '1', '2']).withMessage('choose status from 0,1 and .'),
        ];
    }

    get vmgetRequest() {
        return [
            param('vmId').not().isEmpty().withMessage('vmid  is required.'),
        ];
    }
    get vmdeleteRequest() {
        return [
            check('vmId').not().isEmpty().withMessage('vmid  is required.'),
        ];
    }

}

module.exports = VmValidator;

