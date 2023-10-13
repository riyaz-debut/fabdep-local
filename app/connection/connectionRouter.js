const express = require("express");
const router = express.Router();
const check = require('express-validator');

const conController = require("./connectionController");
const conControllerObj = new conController();
const conValidator = require("./connectionValidator");
const conValidatorObj = new conValidator();


router.get('/',
  async (req, res, next) => {
    try {
      const result = await conControllerObj.listConnections();
      res.status(200).send({ message: "success", status: 1, data: result });
    } catch (error) {
      res.status(400).send({ message: error.message, status: error.status || 0 });
    }
  });




router.get('/:connectionId',
  async (req, res, next) => {
    try {
      const result = await conControllerObj.getConnection(req.params.connectionId);
      res.status(200).send({ message: "success", status: 1, data: result });
    } catch (error) {
      res.status(400).send({ message: error.message, status: error.status || 0 });
    }
  });



router.post('/',
  conValidatorObj.connectionCreateRequest,
  conValidatorObj.validateHandler,
  async (req, res, next) => {
    try {
      const result = await conControllerObj.addConnection(req.body);
      res.status(200).send({ message: "success", status: 1 });
    } catch (error) {
      res.status(400).send({ message: error.message, status: error.status || 0 });
    }
  });

router.put('/',
  conValidatorObj.connectionUpdateRequest,
  conValidatorObj.validateHandler,
  async (req, res, next) => {
    try {
      const result = await conControllerObj.updateConnection(req.body);
      res.status(200).send({ message: "success", status: 1, data: result });
    } catch (error) {
      res.status(400).send({ message: error.message, status: error.status || 0 });
    }
  });


router.delete('/',
  conValidatorObj.connectionDeleteRequest,
  conValidatorObj.validateHandler,
  async (req, res, next) => {
    try {
      const result = await conControllerObj.deleteConnection(req.body);
      res.status(200).send({ message: "success", status: 1, data: result });
    } catch (error) {
      res.status(400).send({ message: error.message, status: error.status || 0 });
    }
  });



module.exports = router;
