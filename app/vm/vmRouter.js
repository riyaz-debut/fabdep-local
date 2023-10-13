'use strict';
const express = require('express');
const router = express.Router();
const check = require('express-validator');

const vmController = require('./vmController');
const vmControllerObj = new vmController();
const vmValidator = require('./vmValidator');
const vmValidatorObj = new vmValidator();


router.get('/',
    async (req, res, next) => {
        try {
            const result = await vmControllerObj.listVms();
            res.status(200).send({ message: 'success', status: 1, data: result });
        } catch (error) {
            res.status(400).send({ message: error.message, status: error.status || 0 });
        }
    });


router.get('/connection/:vmId',
    vmValidatorObj.vmgetRequest,
    vmValidatorObj.validateHandler,
    async (req, res, next) => {
        try {
            const result = await vmControllerObj.checkconnectionVm(req.params.vmId);
            res.status(200).send({ message: 'success', status: 1, data: result });
        } catch (error) {
            res.status(400).send({ message: error.message, status: error.status || 0 });
        }
    });



router.get('/:vmId',
    vmValidatorObj.vmgetRequest,
    vmValidatorObj.validateHandler,
    async (req, res, next) => {
        try {
            const result = await vmControllerObj.getVm(req.params.vmId);
            res.status(200).send({ message: 'success', status: 1, data: result });
        } catch (error) {
            res.status(400).send({ message: error.message, status: error.status || 0 });
        }
    });



router.post('/',
    vmValidatorObj.createvmRequest,
    vmValidatorObj.validateHandler,
    async (req, res, next) => {
        try {
            const result = await vmControllerObj.addVm(req.body);
            res.status(200).send({ message: 'success', status: 1, data: result });
        } catch (error) {
            res.status(400).send({ message: error.message, status: error.status || 0 });
        }
    });

router.put('/',
    vmValidatorObj.updatevmRequest,
    vmValidatorObj.validateHandler,
    async (req, res, next) => {
        try {
            const result = await vmControllerObj.updateVm(req.body);
            res.status(200).send({ message: 'success', status: 1, data: result });
        } catch (error) {
            res.status(400).send({ message: error.message, status: error.status || 0 });
        }
    });


router.delete('/',
    vmValidatorObj.vmdeleteRequest,
    vmValidatorObj.validateHandler,
    async (req, res, next) => {
        try {
            const result = await vmControllerObj.deleteVm(req.body);
            res.status(200).send({ message: 'success', status: 1, data: result });
        } catch (error) {
            res.status(400).send({ message: error.message, status: error.status || 0 });
        }
    });



module.exports = router;
