'use strict';

const express = require('express');
const router = express.Router();
const clusController = require('./clusterController');
const clusControllerrObj = new clusController();
const clusValidator = require('./clusterValidator');
const clusValidatorObj = new clusValidator();

// Add Cluster
router.post('/',
    clusValidatorObj.createClusRequest,
    clusValidatorObj.validateHandler,
    (req, res) => {
        clusControllerrObj.addCluster(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    }
);

// Add Cluster
router.post('/setup-dashboard',
    clusValidatorObj.deleteClusRequest,
    clusValidatorObj.validateHandler,
    (req, res) => {
        clusControllerrObj.setupDashboard(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    }
);

// List of clusters
router.get('/',
    (req, res, ) => {
        clusControllerrObj.listCluster()
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// View Cluster
router.get('/:clusterid',
    clusValidatorObj.getClusRequest,
    clusValidatorObj.validateHandler,
    async (req, res, next) => {
        try {
            const result = await clusControllerrObj.getCluster(req.params.clusterid);
            res.status(200).send({ message: 'success', status: 1, data: result });
        } catch (error) {
            res.status(400).send({ message: error.message, status: error.status || 0 });
        }
    });

// Update Cluster
router.put('/',
    clusValidatorObj.updateClusRequest,
    clusValidatorObj.validateHandler,
    async (req, res, next) => {
        try {
            const result = await clusControllerrObj.updateCluster(req.body);
            res.status(200).send({ message: 'success', status: 1, data: result });
        } catch (error) {
            res.status(400).send({ message: error.message, status: error.status || 0 });
        }
    });

// Delete cluster
router.delete('/',
    clusValidatorObj.deleteClusRequest,
    clusValidatorObj.validateHandler,
    (req, res) => {
        clusControllerrObj.deleteCluster(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// Set master
router.post('/setup-master',
    clusValidatorObj.setUpNodeRequest,
    clusValidatorObj.validateHandler,
    (req, res) => {
        clusControllerrObj.setupMaster(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// // Set Workers
// router.post('/setup-workers',
//     clusValidatorObj.setUpNodeRequest,
//     clusValidatorObj.validateHandler,
//     (req, res) => {
//         clusControllerrObj.setupWorkers(req.body)
//             .then((result) => {
//                 res.status(result.status).json(result.data);
//             });
//     });

// Add Worker
router.post('/worker',
    clusValidatorObj.addWorkerRequest,
    clusValidatorObj.validateHandler,
    (req, res) => {
        clusControllerrObj.addWorker(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// Delete Worker
router.delete('/worker',
    clusValidatorObj.addWorkerRequest,
    clusValidatorObj.validateHandler,
    (req, res) => {
        clusControllerrObj.deleteWorker(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

module.exports = router;
