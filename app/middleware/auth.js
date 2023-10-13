const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
const config = require("../../config");

//user authentication and redirection
router.use(async (req, res, next) => {
	try {
		// check header or url parameters or post parameters for token
		let token = req.headers["token"];
		// decode token
		if (token) {
			// verifies secret and checks exp
			jwt.verify(
				token,
				config.secret,
				{
					ignoreExpiration: false,
				},
				(err, decoded) => {
					if (err) {
						console.log(err);
						res.status(400).send({ status: 1, message: err.message });
					} else {
						console.log(decoded);
						try {
							next();
						} catch (err) {
							console.log(err);
							return next({ message: err.message });
						}
					}
				}
			);
		} else {
			// if there is no token return an error
			// next({ status: 401, message: 'No token provided' });
			next();
		}
	} catch (err) {
		console.log(err);
		next({ message: err.message });
	}
});

module.exports = router;
