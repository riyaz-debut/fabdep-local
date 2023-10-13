const { check, validationResult } = require('express-validator');

class ConnectionValidator {
    validateHandler(req, res, next) {
        let errors = validationResult(req);
        if (errors.isEmpty()) {
            next();
        } else {
            res.status(422).send({ message: "Validation Errors", status: 0, errors: errors });
        }
    };



    get connectionCreateRequest() {
        return [
            check("hostname").not().isEmpty().withMessage("hostname  is required.").isLength({ min: 10, max: 30 }).withMessage("hostname length must be from 10 to 30."),
            check("username").not().isEmpty().withMessage("username  is required.").isLength({ min: 3, max: 50 }).withMessage("username length must be from 3 to 50."),
            check("password").not().isEmpty().withMessage("password is required.").isLength({ min: 3, max: 20 }).withMessage("Password length should be from 3 to 20."),
            check("port").not().isEmpty().withMessage("port is required.").isLength({ min: 3, max: 10 }).withMessage("port length should be from 3 to 10.").isNumeric().withMessage("port should be numeric only."),
        ]
    }

    get connectionUpdateRequest() {
        return [
            check("hostname").not().isEmpty().withMessage("hostname  is required.").isLength({ min: 10, max: 30 }).withMessage("hostname length must be from 10 to 30."),
            check("username").not().isEmpty().withMessage("username  is required.").isLength({ min: 3, max: 50 }).withMessage("username length must be from 3 to 50."),
            check("password").not().isEmpty().withMessage("password is required.").isLength({ min: 3, max: 20 }).withMessage("Password length should be from 3 to 20."),
            check("port").not().isEmpty().withMessage("port is required.").isLength({ min: 3, max: 10 }).withMessage("port length should be from 3 to 10.").isNumeric().withMessage("port should be numeric only."),
        ]
    }


    get connectionDeleteRequest() {
        return [
            check("connectionid").not().isEmpty().withMessage("hostname  is required."),
        ]
    }


}

module.exports = ConnectionValidator;

