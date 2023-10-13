'use strict';

const { check, param, validationResult } = require('express-validator');

class ClusterValidator {

    validateHandler(req, res, next) {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).send({ message: 'Validation Errors', status: 0, errors: errors });
        } else {
            next();
        }
    }

    get createClusRequest() {
        return [
            check('name')
                .not().isEmpty().withMessage('The name field is required.')
                .isString().withMessage('The name must be a string.')
                .isLength({ min: 3, max: 50 }).withMessage('The name must be between 3 and 50 characters.'),
            check('description')
                .not().isEmpty().withMessage('The description field is required.')
                .isString().withMessage('The description must be a string.')
                .isLength({ max: 500 }).withMessage('The description may not be greater than 500 characters.'),
            check('master_node')
                .not().isEmpty().withMessage('The master_node field is required.')
                .isString().withMessage('The master_node must be a string.')
                .isLength({ min: 3, max: 50 }).withMessage('The master_node must be between 3 and 50 characters.'),
            // check('worker_node')
            //     .not().isEmpty().withMessage('The worker_node field is required.')
            //     .isArray({ min: 1, max: 10 }).withMessage('The wokrer_node must be array of length between 1 to 10.')
        ];
    }

    get addWorkerRequest() {
        return [
            check('cluster_id')
                .not().isEmpty().withMessage('The cluster_id field is required.')
                .isString().withMessage('The cluster_id must be a string.'),
            check('worker_vm_id')
                .not().isEmpty().withMessage('The worker_vm_id field is required.')
                .isString().withMessage('The worker_vm_id must be a string.'),
        ];
    }

    get setUpNodeRequest() {
        return [
            check('cluster_id')
                .not().isEmpty().withMessage('The cluster_id field is required.')
                .isString().withMessage('The cluster_id must be a string.'),
        ];
    }

    get updateClusRequest() {
        return [
            check('name').not().isEmpty().withMessage('name of cluster  is required.').isLength({ min: 3, max: 50 }).withMessage('username length must be from 3 to 50.'),
            check('description').isLength({ max: 500 }).withMessage('description  length must be  500.'),
            check('clusterid').not().isEmpty().withMessage('ckusterid is required.'),
        ];
    }

    get deleteClusRequest() {
        return [
            check('clusterId')
                .not().isEmpty().withMessage('The clusterId field is required.')
                .isString().withMessage('The clusterId must be a string.'),
        ];
    }

    get getClusRequest() {
        return [
            param('clusterid').not().isEmpty().withMessage('clusterid  is required.'),
        ];
    }

}

module.exports = ClusterValidator;
