"use strict";

const express = require("express");
const router = express.Router();
const caController = require("./caController");
const CAValidator = require("./caValidator");
const caValidator = new CAValidator();

router.post(
  "/addCertificateAuthority",
  caValidator.addCa,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.addCertificateAuthority(req.body);
      res
        .status(200)
        .send({ message: result.message, status: 1, data: result.data });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/getCertificateAuthority",
  caValidator.getCa,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.getCertificateAuthority(req.body);
      res
        .status(200)
        .send({ message: result.message, status: 1, data: result.data });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/getAllCertificateAuthority",
  caValidator.getCaByNetworkId,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.getAllCertificateAuthority(req.body);
      res
        .status(200)
        .send({ message: result.message, status: 1, data: result.data });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/createCaService",
  caValidator.caRequest,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.CreateCaService(req.body);
      res.status(200).send({ message: result.message, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/createCaDeployment",
  caValidator.caRequest,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.CreateCaDeployment(req.body);
      res.status(200).send({ message: result.message, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);




router.post(
  "/writeConnectionConfigs",
  caValidator.caRequest,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.writeConnectionConfigs(req.body);
      res.status(200).send({ message: result.message, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/enrollRegistrar",
  caValidator.caRequest,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.enrollRegistrar(req.body);
      res
        .status(200)
        .send({ message: result.message, data: result.data, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/registerCaAdmin",
  caValidator.registerAdminRequest,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.registerCaAdmin(req.body);
      res
        .status(200)
        .send({ message: result.message, data: result.data, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/enrollCaAdmin",
  caValidator.getCa,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.enrollCaAdmin(req.body);
      res
        .status(200)
        .send({ message: result.message, data: result.data, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/fetchCaTlsCertificatesFromNFS",
  caValidator.caRequest,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.fetchCaTlsCertificatesFromNFS(req.body);
      res
        .status(200)
        .send({ message: result.message, data: result.data, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/getAdminByCa",
  caValidator.getCa,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.getAdminByCa(req.body);
      res
        .status(200)
        .send({ message: result.message, data: result.data, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/getAllIdentitiesByCa",
  caValidator.getCa,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.getAllIdentitiesByCa(req.body);
      res
        .status(200)
        .send({ message: result.message, data: result.data, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/getAllIdentitiesByNetwork",
  caValidator.getNetwork,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.getAllIdentitiesByNetwork(req.body);
      res
        .status(200)
        .send({ message: result.message, data: result.data, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);


router.post(
  "/writeCAConfigsTesting",
  caValidator.getCa,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.writeCAConfigsTesting(req.body);
      res
        .status(200)
        .send({ message: result.message, data: result.data, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.get(
  "/getIdentityDetail",
  caValidator.getWalletIdentityDetail,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.getIdentityDetail(req.query);
      res
        .status(200)
        .send({ message: result.message, data: result.data, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);

router.post(
  "/writeCaKubernetesFiles",
  caValidator.caRequest,
  caValidator.validateHandler,
  async function (req, res, next) {
    try {
      let result = await caController.writeCaKubernetesFiles(req.body);
      res.status(200).send({ message: result.message, status: 1 });
    } catch (err) {
      res
        .status(err.httpStatus || 500)
        .send({ message: err.message, status: 0 });
    }
  }
);
module.exports = router;
