'use strict';

// Import dependencies
const express = require('express');
const router = express.Router();
const NewOrgController = require('./orgController');
const multer = require('multer');
const os = require('os');
const fs = require('fs');
const shell = require('shelljs');
const config = require('../../config');
const path = require('path');
const uploadPath = `${os.homedir}/go/src/`;
const Validator = require('./orgValidator');
const NewOrgValidator = new Validator();

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadPath)) {
            shell.mkdir('-p', uploadPath);
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, path.basename(file.originalname, path.extname(file.originalname)) + path.extname(file.originalname));
    }
});

let upload = multer({
    storage: storage
});

// Upload chaincode
router.post('/uploadNewOrgConfig',
    upload.single('file'),
    NewOrgValidator.uploadNewOrganizationConfig,
    NewOrgValidator.handleError,
    (req, res) => {
        NewOrgController.uploadNewOrganization(req.body, req.file)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

// Install the chaincode on all peers
router.post('/addNewOrganisation',
    NewOrgValidator.addNewOrganization,
    NewOrgValidator.handleError,
    (req, res) => {
        NewOrgController.addNewOrganization(req.body)
            .then((result) => {
                res.status(result.status).json(result.data);
            });
    });

module.exports = router;