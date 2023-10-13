'use strict';

// Import dependencies
const express = require('express');
const router = express.Router();
const Validator = require('./validator');
const userValidator = new Validator();
const authentication = require('./controller')

// Get Token
router.post('/getToken',
    async (req, res, next) => {
        try {
            const result = await authentication.getToken(req.body);
            res.status(200).send({ message: 'success', status: 1, data: result.data });
        } catch (error) {
            res.status(400).send({ message: error.message, status: error.status || 0 });
        }
    });

// update autoupdate status
router.put('/autoUpdate',
    userValidator.autoUpdate,
    userValidator.validateHandler,
    async (req, res, next) => {
        try {
            const result = await authentication.autoUpdateStatus(req.body);
            res.status(200).send({ message: 'success', status: 1, data: result });
        } catch (error) {
            res.status(400).send({ message: error.message, status: error.status || 0 });
        }
    });

// Check update available
router.get('/checkUpdateAvailable',
    async (req, res, next) => {
        try {
            const result = await authentication.checkUpdateAvailable();
            res.status(200).send({ message: 'success', status: 1, data: result });
        } catch (error) {
            res.status(400).send({ message: error.message, status: error.status || 0 });
        }
    });

module.exports = router;
