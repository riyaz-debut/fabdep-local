'use strict';
const { check, param, validationResult } = require('express-validator');

class PeerValidator {
    validateHandler(req, res, next) {
        let errors = validationResult(req);
        if (errors.isEmpty()) {
            next();
        } else {
            res.status(422).send({ message: errors.errors[0].msg, status: 0 });
        }
    }
    get addPeerRequest() {
        return [
            check('name').not().isEmpty().withMessage('Peer name is required.').isString(),
            check('peer_enroll_secret').not().isEmpty().withMessage('Peer enroll secret is required.').isString(),
            check('orgId').not().isEmpty().withMessage('Organisation id required.').isString(),
            check('couchdbUsername').not().isEmpty().withMessage('Couchdb Username is required.').isString(),
            check('couchdbPassword').not().isEmpty().withMessage('Couchdb Password  is required.').isString()
        ];
    }
    get getPeerRequest() {
        return [
            check('_id').not().isEmpty().withMessage('Peer id  is required.').isString(),


        ];
    }


    get updateCouchPeerRequest() {
        return [
            check('_id').not().isEmpty().withMessage('Peer id  is required.').isString(),
            check('isPublic').not().isEmpty().withMessage('isPublic flag required.').isBoolean(),
        ];
    }


    get deletePeerRequest() {
        return [
            param('id')
                .not().isEmpty().withMessage('The id field is required.')
                .isString().withMessage('The id must be a string.'),
        ];
    }


    get getPeerDetail() {
        return [
            check('peerId').not().isEmpty().withMessage('Peer id  is required.').isString(),
        ];
    }
    get getPeerByNetwork() {
        return [
            check('networkId').not().isEmpty().withMessage('Network id  is required.').isString(),
        ];
    }
    get getPeerByCluster() {
        return [
            check('clusterId').not().isEmpty().withMessage('Cluster id  is required.').isString(),
        ];
    }

    get getPeerByOrganisation() {
        return [
            check('orgId').not().isEmpty().withMessage('Organisation id  is required.').isString(),
        ];
    }

    get registerPeerRequest() {
        return [
            check('_id').not().isEmpty().withMessage('Enter Peer id.').isString(),
            check('isTLS').not().isEmpty().withMessage('TLS flag is required').isBoolean(),
            // check("caId").not().isEmpty().withMessage('Enter CA id.').isString(),
            // check("orgId").not().isEmpty().withMessage('Enter Organisation id.').isString(),
        ];
    }

}
module.exports = PeerValidator;