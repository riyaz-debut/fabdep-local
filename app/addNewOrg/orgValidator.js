'use strict';

const {
    check,
    validationResult
} = require('express-validator');

class NewOrgValidator {
    /**
     * Handle the validation errors
     */
    handleError(req, res, next) {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).send({ message: errors.errors[0].msg, status: 0 });
        } else {
            next();
        }
    }

    /**
     * upload new organization config
     */
    
    get uploadNewOrganizationConfig() {
        return [
            check('name').not().isEmpty().withMessage('Organisation name is required.').isString(),
            check('mspId').not().isEmpty().withMessage('OrgMsp  is required.').isString(),
            check('peers').not().isEmpty().withMessage('Peers count is required.').isNumeric(),
        ];
    }

    /**
     *  add new organization
     */
     get addNewOrganization() {
        return [
            check('peerIds')
                .not().isEmpty().withMessage('The peerIds field is required.')
                .isArray().withMessage('The peerIds must be a array of peer ids.'),
            check('channelId')
                .not().isEmpty().withMessage('The chaincodeId field is required.')
                .isString().withMessage('The chaincodeId must be a string.'),
        ];
    }
    
}

module.exports = NewOrgValidator;