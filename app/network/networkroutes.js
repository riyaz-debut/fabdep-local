'use strict';

// Import dependencies
const express = require('express');
const router = express.Router();
const NetworkController = require('./networkController');
const Validator = require('./networkvalidator');
const NetworkValidator = new Validator();

router.post('/', NetworkValidator.addNetwork, NetworkValidator.handleError, (req, res) => {
    NetworkController.addNetwork(req.body)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});

router.post('/podlist', NetworkValidator.getPodlist, NetworkValidator.handleError, (req, res) => {
    NetworkController.getPodList(req.body)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});


router.post('/podlogs', NetworkValidator.getPodlogs, NetworkValidator.handleError, (req, res) => {
    NetworkController.getPodLogs(req.body)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});


router.get('/', (req, res) => {
    NetworkController.listNetwork(req.query)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});




router.get('/:id', NetworkValidator.getNetwork, NetworkValidator.handleError, (req, res) => {
    NetworkController.getNetwork(req.params.id)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});





router.put('/:id', NetworkValidator.updateNetwork, NetworkValidator.handleError, (req, res) => {
    NetworkController.updateNetwork(req.params.id, req.body)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});

router.patch('/:id', NetworkValidator.getNetwork, NetworkValidator.handleError, (req, res) => {
    NetworkController.updateNetworkStatus(req.params.id)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});

router.delete('/:id', NetworkValidator.getNetwork, NetworkValidator.handleError, (req, res) => {
    NetworkController.deleteNetwork(req.params.id)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});


router.post('/addClusterToNetwork',
    NetworkValidator.addClusterToNetwork, NetworkValidator.handleError,
    async function (req, res, next) {
        try {
            let result = await NetworkController.addClusterToNetwork(req.body);
            res.status(result.httpStatus).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });
module.exports = router;
