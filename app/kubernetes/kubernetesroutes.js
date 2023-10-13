'use strict';

// Import dependencies
const express = require('express');
const router = express.Router();
const KubernetesController = require('./kubernetesController');


router.post('/namespace',  async (req, res, next) => {
    KubernetesController.createNamespace(req.body)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});


router.delete('/namespace', (req, res) => {
    KubernetesController.removeNamespace(req.body)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});



router.post('/pv', async (req, res, next) => {
    KubernetesController.createPv(req.body)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});


router.delete('/pv',async (req, res, next) => {
    KubernetesController.deletePv(req.body)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});


router.post('/pvc', async (req, res, next) => {
    KubernetesController.createPvc(req.body)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});


router.delete('/pvc',async (req, res, next) => {
    KubernetesController.deletePvc(req.body)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});




router.post('/:clusterID', (req, res) => {
    KubernetesController.addDeployment(req.params.clusterID)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});

router.put('/:clusterID', (req, res) => {
    KubernetesController.updateDeployment(req.params.clusterID)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});




router.delete('/:clusterID', (req, res) => {
    KubernetesController.deleteDeployment(req.params.clusterID)
        .then((result) => {
            res.status(result.status).json(result.data);
        });
});


module.exports = router;
