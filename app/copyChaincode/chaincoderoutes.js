'use strict';

// Import dependencies
const express = require('express');
const router = express.Router();
const ChaincodeController = require('./chaincodeController');
const multer = require('multer');
const os = require('os');
const fs = require('fs');
const shell = require('shelljs');
const config = require('../../config');
const path = require('path');
const uploadPath = `${os.homedir}/go/src/`;
const Validator = require('./chaincodeValidator');
const ChaincdoeValidator = new Validator();

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadPath)) {
            shell.mkdir('-p', uploadPath);
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, path.basename(file.originalname, path.extname(file.originalname)) + '-' + Date.now() + path.extname(file.originalname));
    }
});

let upload = multer({
    storage: storage
});

// Upload chaincode
router.post('/upload',
    upload.single('chaincode'),
    ChaincdoeValidator.uploadChaincode,
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.uploadChaincode(req.body, req.file)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// List of uploaded chaincodes
router.post('/uploaded',
    ChaincdoeValidator.getChaincode,
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.queryUploadedChaincodes(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// Install the chaincode on all peers
router.post('/install',
    ChaincdoeValidator.installChaincode,
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.installChaincode(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// Install the chaincode on all peers
router.post('/instantiateChainCodeTargetPeer',
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.instantiateChainCodeTargetPeer(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });



// Installed chaincodes on a peer
router.get('/installed',
    ChaincdoeValidator.installedChaincode,
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.queryInstalledChaincodes(req.query)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// Installed chaincodes on a peer
router.get('/',
    ChaincdoeValidator.getChainCodeDetail,
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.chainCodeDetail(req.query)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

router.post('/instantiate',
    ChaincdoeValidator.upgradeChaincode,
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.instantiateChaincode(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

router.post('/upgrade',
    ChaincdoeValidator.upgradeChaincode,
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.upgradeChaincode(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// Instantiated chaincodes
router.get('/instantiated/peer',
    ChaincdoeValidator.instantiatedChaincode,
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.queryInstantiatedChaincodes(req.query)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// Instantiated chaincodes
router.get('/listInstalledChaincodesByNetwork',
    ChaincdoeValidator.networkChaincode,
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.listInstalledChaincodesByNetwork(req.query)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// Instantiated chaincodes on channel
router.get('/instantiatedChainCodeChannelList',
    ChaincdoeValidator.getChainCodeDetail,
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.instantiatedChainCodeChannelList(req.query)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// Instantiated chaincodes
router.get('/instantiated',
    ChaincdoeValidator.instantiatedChaincodeDB,
    ChaincdoeValidator.handleError,
    (req, res) => {
        ChaincodeController.instantiatedChaincodeDB(req.query)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

module.exports = router;