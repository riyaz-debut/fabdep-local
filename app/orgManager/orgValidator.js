'use strict';
const { check, param, validationResult } = require('express-validator');

class OrgValidator {
    validateHandler(req, res, next) {
        let errors = validationResult(req);
        if (errors.isEmpty()) {
            next();
        } else {
            res.status(422).send({ message: errors.errors[0].msg, status: 0 });
        }
    }
    get addOrganizationRequest() {
        return [
            check('name').not().isEmpty().withMessage('Organisation name is required.').isString(),
            check('adminId').not().isEmpty().withMessage('adminId is required.').isString(),
            check('mspId').not().isEmpty().withMessage('OrgMsp  is required.').isString(),
            check('caId').not().isEmpty().withMessage('CA id required.').isString(),
            check('networkId').not().isEmpty().withMessage('Network id is required.').isString(),
            check('clusterId').not().isEmpty().withMessage('Cluster id is required.').isString(),
            check('tlsCaId').not().isEmpty().withMessage('TLS CA id required.').isString(),
            check('type').not().isEmpty().withMessage('Org type is required.').isNumeric(),
        ];
    }

    get importOrganisationRequest() {
        return [
            check('name').not().isEmpty().withMessage('Organisation name is required.').isString(),
            check('networkId').not().isEmpty().withMessage('Network id is required.').isString(),
            check('peerport').not().isEmpty().withMessage('peerport is required.').isNumeric(),
            check('mspId').not().isEmpty().withMessage('OrgMsp  is required.').isString(),
            check('peer_enroll_id').not().isEmpty().withMessage('peer enroll id is required.').isString(),
            check('tlsCacerts').not().isEmpty().withMessage('Organisation name is required.').isString(),
            check('cacets').not().isEmpty().withMessage('Organisation name is required.').isString(),
            check('admincerts').not().isEmpty().withMessage('Organisation name is required.').isString(),
            check('clusterIp').not().isEmpty().withMessage('clusterIp is required.').isString(),

        ];
    }



    get createWallet() {
        return [
            check('admnId').not().isEmpty().withMessage('Enter admin id.').isString(),
        ];
    }
    get getOrganizationRequest() {
        return [
            check('_id').not().isEmpty().withMessage('Organisation id  is required.').isString(),
        ];
    }
    get deleteOrganizationRequest() {
        return [
            param('id')
                .not().isEmpty().withMessage('The id field is required.')
                .isString().withMessage('The id must be a string.'),
        ];
    }


    get getorganisationByCluster() {
        return [
            check('clusterId')
                .not().isEmpty().withMessage('The clusterId field is required.')
                .isString().withMessage('The clusterId must be a string.'),
        ];
    }

    get getorganisationByNetwork() {
        return [
            check('networkId')
                .not().isEmpty().withMessage('The networkId field is required.')
                .isString().withMessage('The networkId must be a string.'),
        ];
    }

}
module.exports = OrgValidator;