'use strict';
const express = require('express');
const router = express.Router();
const orgController = require('./orgController');
const OrgValidator = require('./orgValidator');
const orgValidatorObj = new OrgValidator();

//Add new organisation

router.post('/addOrganisation',
    orgValidatorObj.addOrganizationRequest,
    orgValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await orgController.addOrganisation(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            console.log('Error on org add');
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

// Function to import other tool Msp details
router.post('/importOrganisation',
    orgValidatorObj.importOrganisationRequest,
    orgValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await orgController.importOrganisation(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            console.log('Error on org add');
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });



//Generate org msp
router.post('/exportOrganisation',
    orgValidatorObj.getOrganizationRequest,
    orgValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await orgController.exportOrganisation(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });





//List organisations by cluster

router.get('/listOrganisationsByCluster',
    orgValidatorObj.getorganisationByCluster,
    orgValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await orgController.listOrganisationsByCluster(req.query);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

//List organisations by cluster

router.get('/listOrganisationsByNetwork',
    orgValidatorObj.getorganisationByNetwork,
    orgValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await orgController.listOrganisationsByNetwork(req.query);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });


//Get  organisation detail
router.post('/organisationDetail',
    orgValidatorObj.getOrganizationRequest,
    orgValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await orgController.getOrganisation(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

//Generate org msp
router.post('/generateOrgMsp',
    orgValidatorObj.getOrganizationRequest,
    orgValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await orgController.generateOrgMsp(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });


//Delete organisation
router.delete('/:id',
    orgValidatorObj.deleteOrganizationRequest,
    orgValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await orgController.deleteOrganisation(req.params.id);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

//Get  organisation detail
router.post('/createWallet',
    orgValidatorObj.getOrganizationRequest,
    orgValidatorObj.validateHandler,
    async function (req, res, next) {
        try {
            let result = await orgController.createWallet(req.body);
            res.status(200).send({ message: result.message, status: 1, data: result.data });
        } catch (err) {
            res.status(err.httpStatus || 500).send({ message: err.message, status: 0 });
        }
    });

module.exports = router;

