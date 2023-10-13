'use strict';

const {
    check,
    validationResult
} = require('express-validator');

class ChaincodeValidator {
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
     * Upload chaincode
     */
    get uploadChaincode() {
        return [
            check('name')
                .not().isEmpty().withMessage('The name field is required.')
                .isString().withMessage('The name must be a string.')
                .isLength({
                    min: 3,
                    max: 50
                }).withMessage('The name must be between 3 and 50 characters.'),
            check('type')
                .not().isEmpty().withMessage('The type field is required.')
                .isString().withMessage('The type must be a string.')
                .isLength({
                    max: 500
                }).withMessage('The type may not be greater than 500 characters.'),
            check('version')
                .not().isEmpty().withMessage('version field is required.')
                .isFloat().withMessage('version must be a float.')
                .isLength({
                    max: 5
                }).withMessage('The type may not be greater than 5 characters.'),
            check('sequence')
                .not().isEmpty().withMessage('sequence field is required.')
                .isFloat().withMessage('sequence must be a number.')
                .isLength({
                    max: 5
                }).withMessage('The type may not be greater than 5 number.'),
            check('networkId')
                .not().isEmpty().withMessage('The chaincodeId field is required.')
                .isString().withMessage('The chaincodeId must be a string.'),
        ];
    }

    /**
     * Install chaincode
     */
    get installChaincode() {
        return [
            check('chaincodeId')
                .not().isEmpty().withMessage('The chaincodeId field is required.')
                .isString().withMessage('The chaincodeId must be a string.'),
            check('peerIds')
                .not().isEmpty().withMessage('The peerIds field is required.')
                .isArray().withMessage('The peerIds must be a array of peer ids.'),
            check('channelId')
                .not().isEmpty().withMessage('The chaincodeId field is required.')
                .isString().withMessage('The chaincodeId must be a string.'),
        ];
    }

    /**
    * Install chaincode
    */
    get getChainCodeDetail() {
        return [
            check('chaincodeId')
                .not().isEmpty().withMessage('The chaincodeId field is required.')
                .isString().withMessage('The chaincodeId must be a string.')
        ];
    }

    /**
     * Installed Chaincodes
     */
    get installedChaincode() {
        return [
            check('peerId')
                .not().isEmpty().withMessage('The peerId field is required.')
                .isString().withMessage('The peerId must be a string.'),
        ];
    }

    /**
     * Uploaded chaincodes
     */
    get getChaincode() {
        return [
            check('orgId')
                .not().isEmpty().withMessage('The orgId field is required.')
                .isString().withMessage('The orgId must be a string.'),
        ];
    }

    /**
     * Upgrade chaincode
     */
    get upgradeChaincode() {
        return [
            check('chaincodeId')
                .not().isEmpty().withMessage('The chaincodeId field is required.')
                .isString().withMessage('The chaincodeId must be a string.'),
            check('channelId')
                .not().isEmpty().withMessage('The channelId field is required.')
                .isString().withMessage('The channelId must be a string.'),
            check('peerId')
                .not().isEmpty().withMessage('The peerId field is required.')
                .isString().withMessage('The peerId must be a string.'),
            check('fcn')
                .not().isEmpty().withMessage('The fcn field is required.')
                .isString().withMessage('The fcn must be a string.'),
            check('args')
                //.not().isEmpty().withMessage('The agrs field is required.')
                .isArray().withMessage('The args must be a array.'),
            check('endorsement')
                .not().isEmpty().withMessage('The endorsement field is required.')
            //.isJSON().withMessage('The endorsement must be valid JSON.'),
        ];
    }

    /**
     * Instantiated Chaincodes
     */
    get instantiatedChaincode() {
        return [
            check('peerId')
                .not().isEmpty().withMessage('The peerId field is required.')
                .isString().withMessage('The peerId must be a string.'),
            check('channelId')
                .not().isEmpty().withMessage('The channelId field is required.')
                .isString().withMessage('The channelId must be a string.'),
        ];
    }

    /**
     * Instantiated Chaincodes
     */
    get networkChaincode() {
        return [
            check('networkId')
                .not().isEmpty().withMessage('The networkId field is required.')
                .isString().withMessage('The networkId must be a string.')
        ];
    }




    /**
     * Instantiated Chaincodes
     */
    get instantiatedChaincodeDB() {
        return [
            check('channelId')
                .not().isEmpty().withMessage('The channelId field is required.')
                .isString().withMessage('The channelId must be a string.'),
        ];
    }
}

module.exports = ChaincodeValidator;