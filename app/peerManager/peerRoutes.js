'use strict';
const express = require('express');
const router = express.Router();
const peerController = require('./peerController');
const PeerValidator = require('./peerValidator');
const peerValidatorObj = new PeerValidator();

//Add new Peer

router.post('/peer',
    peerValidatorObj.addPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.addPeer(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            console.log('Error on peer add');
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

//List Peers by network

router.get('/listPeersByNetwork',
    peerValidatorObj.getPeerByNetwork,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.listPeersByNetwork(req.query);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });
//List Peers by cluster

router.get('/listPeersByCluster',
    peerValidatorObj.getPeerByCluster,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.listPeersByCluster(req.query);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

//List Peers by cluster

router.get('/listPeersByOrganisation',
    peerValidatorObj.getPeerByOrganisation,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.listPeersByOrganisation(req.query);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

//Get  Peer detail
router.get('/',
    peerValidatorObj.getPeerDetail,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            console.log('Peer Route');
            console.log(req.body);
            let result = await peerController.getPeer(req.query);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

//Delete Peer
router.delete('/:id',
    peerValidatorObj.deletePeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.deletePeer(req.params.id);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

router.post('/registerPeer',
    peerValidatorObj.registerPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.registerPeer(req.body);
            res.status(200).send({ message: result.message, data: result.data, status: 1 });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

router.post('/enrollPeer',
    peerValidatorObj.registerPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.enrollPeer(req.body);
            res.status(200).send({ message: result.message, data: result.data, status: 1 });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

// Generate ordering service msp
router.post('/generatePeerMsp',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.generatePeerMsp(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

// Generate peer deployment config files in yaml.
router.post('/copyPeerMaterislToNfs',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.copyPeerMaterislToNfs(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });


router.post('/deletePeerMaterislFromNfs',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.deletePeerMaterislFromNfs(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });



router.post('/createPeerService',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.createPeerService(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

router.post('/deletePeerService',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.deletePeerService(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });



router.post('/createPeerDeployment',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.createPeerDeployment(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });


router.post('/deletePeerDeployment',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.deletePeerDeployment(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });



router.post('/createPeerCouchService',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.createPeerCouchService(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

router.post('/updatePeerCouchService',
    peerValidatorObj.updateCouchPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.updatePeerCouchService(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

router.post('/createPeerCouchDeployment',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.createPeerCouchDeployment(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });


router.post('/deletePeerCouchDeployment',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.deletePeerCouchDeployment(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });


router.post('/deletePeerCouchService',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.deletePeerCouchService(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

router.post('/writePeerKubernetesFiles',
    peerValidatorObj.getPeerRequest,
    peerValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await peerController.writePeerKubernetesFiles(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });



module.exports = router;

