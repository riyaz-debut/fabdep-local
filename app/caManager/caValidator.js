"use strict";
const { check, validationResult } = require("express-validator");

class CaValidator {
  validateHandler(req, res, next) {
    let errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
    } else {
      res.status(422).send({ message: errors.errors[0].msg, status: 0 });
    }
  }
  get addCa() {
    return [
      check("name")
        .not()
        .isEmpty()
        .withMessage("Enter CA name.")
        .isString(),
      check("clusterId")
        .not()
        .isEmpty()
        .withMessage("Enter Cluster id")
        .isString(),
      check("networkId")
        .not()
        .isEmpty()
        .withMessage("Enter Network id")
        .isString(),
      check("admnId")
        .not()
        .isEmpty()
        .withMessage("Enter admin enrollment id")
        .isString(),
      check("admnSecret")
        .not()
        .isEmpty()
        .withMessage("Enter Admin Secret")
        .isString(),
      check("isTLS")
        .not()
        .isEmpty()
        .withMessage("Enter this is a tls CA or not")
        .isNumeric()
    ];
  }
  get getCa() {
    return [
      check("_id")
        .not()
        .isEmpty()
        .withMessage("Enter CA id.")
        .isString()
    ];
  }

  get getNetwork() {
    return [
      check("network_id")
        .not()
        .isEmpty()
        .withMessage("Enter Network id.")
        .isString()
    ];
  }

  get caRequest() {
    return [
      check("caId")
        .not()
        .isEmpty()
        .withMessage("Enter CA id.")
        .isString()
    ];
  }

  get enrollCaAdminRequest() {
    return [
      check("orgId")
        .not()
        .isEmpty()
        .withMessage("Enter Org id.")
        .isString()
    ];
  }

  get registerAdminRequest() {
    return [
      check("caId")
        .not()
        .isEmpty()
        .withMessage("Enter ca id")
        .isString(),
      check("admnId")
        .not()
        .isEmpty()
        .withMessage("Enter admin enrollment id")
        .isString(),
      check("admnSecret")
        .not()
        .isEmpty()
        .withMessage("Enter Admin Secret")
        .isString()
    ];
  }
  get getCaByNetworkId() {
    return [
      check("networkId")
        .not()
        .isEmpty()
        .withMessage("Enter Nework id.")
        .isString()
    ];
  }
  get getWalletIdentityDetail() {
    return [
      check("walletId")
        .not()
        .isEmpty()
        .withMessage("Enter Wallet id.")
        .isString()
    ];
  }
}
module.exports = CaValidator;
