"use strict";
const logger = require("../repositry/utils").getLogger(
	"SubscriptionController"
);
const jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
const config = require("../../config");
const macaddress = require("macaddress");
const getos = require("getos");
const crypto = require("crypto");
const fs = require("fs-extra");
const os = require("os");
const algorithm = "aes-256-ctr";
const axios = require("axios");
const autoUpdateModel = require("./autoUpdateModel");
const key = crypto
	.createHash("sha256")
	.update(String(config.secret))
	.digest("base64")
	.substr(0, 32);
const expiryTime = 86400;

const encrypt = (buffer) => {
	try {
		// Create an initialization vector
		const iv = crypto.randomBytes(16);
		// Create a new cipher using the algorithm, key, and iv
		const cipher = crypto.createCipheriv(algorithm, key, iv);
		// Create the new (encrypted) buffer
		const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
		return result;
	} catch (error) {
		return new Error("Encryption Error");
	}
};

const decrypt = (encrypted) => {
	try {
		// Get the iv: the first 16 bytes
		const iv = encrypted.slice(0, 16);
		// Get the rest
		encrypted = encrypted.slice(16);
		// Create a decipher
		const decipher = crypto.createDecipheriv(algorithm, key, iv);
		// Actually decrypt it
		const result = Buffer.concat([
			decipher.update(encrypted),
			decipher.final(),
		]);
		return result;
	} catch (error) {
		return new Error("Decryption Error");
	}
};

const writeFile = (userDetail) => {
	try {
		const userBuffer = JSON.stringify(userDetail);
		fs.outputFileSync(
			`${os.homedir}/${config.home}/key.txt`,
			encrypt(new Buffer(userBuffer))
		);
	} catch (error) {
		return new Error("Decryption Error");
	}
};

// const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
//  fs.outputFileSync(`${orgMspPath}/admincerts/admin.pem`, orgAdmin.signCert);
async function getToken(params) {
	const method = "getToken";
	logger.debug("%s - start", method);
	logger.debug("%s - has received the parameters %j", method, params);
	let mackAddress;
	let osType;
	let userDetail;
	let getTokenRes;
	try {
		if (params.clientKey) {
			mackAddress = await getMacAddress();
			osType = await getOsType();
			userDetail = await getUserDetail(params.clientKey);
			console.log(mackAddress);
			console.log(osType);
			if (
				!userDetail.mac_address
				// userDetail.mac_address != "" 
				// userDetail.mac_address != mackAddress
			) {
				return Promise.reject({
					message:
						"Fabdep key is register with any other system please contact with Fabdep Admin",
					status: 0,
				});
			}
			console.log(userDetail);
			// ################################## CHECK PLAN VALIDITY IS COMMENTED OUT HERE #####################################
			await checkPlanExpired(userDetail)
			getTokenRes = await registerMacWithKey(
				userDetail,
				osType,
				mackAddress,
				params.clientKey
			);
		} else {
			getTokenRes = await createNewSessionForKey();
		}
		return Promise.resolve({
			message: "Success",
			data: getTokenRes,
			status: 0,
		});
	} catch (error) {
		logger.error("%s - Error: %s", method, error.message);
		return Promise.reject({ message: error.message, status: error.status });
	}
}

async function registerMacWithKey(userDetail, osType, mackAddress, clientKey) {
	const method = "registerMacWithKey";
	try {
		let getTokenRes = {};
		getTokenRes.updateAvailable = false;
		getTokenRes.releaseNote = "";
		let jwtToken;
		// Need to be replaced with the api or database connection of fabdep website
		let autoUpdate = await autoUpdateModel.findOne({});
		if (autoUpdate && autoUpdate.autoUpdateStatus) {
			let update = await checkUpdateAvailable();
			if (update.updateAvailable) {
				getTokenRes.updateAvailable = true;
				getTokenRes.releaseNote = update.releaseNote;
			}
		}

		userDetail.osType = osType;
		getTokenRes.message = "Token assigned";

		//Issue jwt token
		try {
			jwtToken = jwt.sign({ id: userDetail }, config.secret, {
				expiresIn: expiryTime,
			});
		} catch (error) {
			return Promise.reject({ message: "Session Error", httpStatus: 1 });
		}
		getTokenRes.token = jwtToken;

		//Update the mac address of the machine
		if (!userDetail.mac_address || userDetail.mac_address === "") {
			userDetail.mac_address = mackAddress;
			// Need to be replaced with the api or database connection of fabdep website
			await updateUserDetail(clientKey, mackAddress, osType);
		}
		// write the key in the encrypted form to the local directory
		writeFile(userDetail);
		return Promise.resolve(getTokenRes);
	} catch (error) {
		logger.error("%s - Error: %s", method, error.message);
		return Promise.reject({ message: error.message, status: error.status });
	}
}

// Create new session from the stored key file
async function createNewSessionForKey() {
	try {
		let getTokenRes = {};
		let jwtToken;
		getTokenRes.updateAvailable = false;
		getTokenRes.releaseNote = "";
		// Read the file from the local directory

		const encryptedBuffer = fs.readFileSync(
			`${os.homedir}/${config.home}/key.txt`
		);
		const keyBuffer = decrypt(encryptedBuffer);
		const userDetail = JSON.parse(keyBuffer.toString());
		if (!userDetail) {
			return Promise.reject({
				message: "Key is corrupted or does not exists",
				status: 9,
			});
		}
		// ################################## CHECK PLAN VALIDITY IS COMMENTED OUT HERE #####################################
		// Check the palns validity
		try {
			await checkPlanExpired(userDetail);
		    // return userDetail
		} catch (error) {
			return Promise.reject({ message: "Plan expired", status: 9 });
		}

		getTokenRes.message = "Token assigned";

		// Need to be replaced with the api or database connection of fabdep website
		let autoUpdate = await autoUpdateModel.findOne({});
		if (autoUpdate && autoUpdate.autoUpdateStatus) {
			let update = await checkUpdateAvailable();
			if (update.updateAvailable) {
				getTokenRes.updateAvailable = true;
				getTokenRes.releaseNote = update.releaseNote;
			}
		}

		// Issue the jwt token to the user
		try {
			jwtToken = jwt.sign({ id: userDetail }, config.secret, {
				expiresIn: expiryTime,
			});
		} catch (error) {
			return Promise.reject({ message: "Session Error", status: 1 });
		}
		getTokenRes.token = jwtToken;
		return Promise.resolve(getTokenRes);
	} catch (error) {
		return Promise.reject({
			message: "Key is corrupted or does not exists",
			status: 9,
		});
	}
}

function checkPlanExpired(userDetail) {
	const method = "userDetail";
	logger.debug("%s - start %j", method, userDetail);
	try {
		let currentTimeUtc = Math.floor(new Date() / 1000);
		let userPlanExpityDate = Math.floor(
			new Date(userDetail.plan_expire) / 1000
		);
		if (userPlanExpityDate < currentTimeUtc) {
			logger.debug("%s - plan %s", method, "Plan expired");
			return Promise.reject({ message: "Plan expired", status: 7 });
		}
		logger.debug("%s - plan %j", method, "Plan is active");
		return Promise.resolve(false);
	} catch (error) {
		logger.debug("%s - Error occured %j", method, error);
		return Promise.reject({ message: error.message, status: 0 });
	}
}

// Fetch mac address of the machine
function getMacAddress() {
	return new Promise(function (resolve, reject) {
		macaddress.one(function (err, mac) {
			if (!err) {
				console.log("Mac address for this host: %s", mac);
				resolve(mac);
			} else {
				console.log(err);
				reject(err);
			}
		});
	});
}

// Fetch ostype of the machine
function getOsType() {
	return new Promise(function (resolve, reject) {
		getos(function (error, os) {
			if (error) {
				reject(error);
			} else {
				if (os.dist) resolve(os.dist);
				reject("Unable to fetch operating system");
			}
		});
	});
}

async function getUserDetail(clientKey) {
	const method = "getUserDetail";
	logger.debug("%s - received params %s", method, clientKey);
	try {
		const response = await axios.post(
			`${config.webrl}/getUserDetails`,
			{
				client_key: clientKey,
			},
			{
				headers: { Accept: "application/json" },
			}
		);
		if (response.status !== 200) {
			logger.debug("%s - Error  %s", method, "user does not exists");
			return Promise.reject(new Error("User does not exists"));
		}
		logger.debug("%s - success  %s", method, response);
		return Promise.resolve(response.data);
	} catch (error) {
		logger.debug("%s - Error  %s", method, error);
		if (
			error.response &&
			error.response.data &&
			error.response.data.message
		) {
			return Promise.reject(new Error(error.response.data.message));
		}
		return Promise.reject(error);
	}
}

async function updateUserDetail(clientKey, macAddress, osType) {
	const method = "updateUserDetail";
	logger.debug("%s - start %s", method);
	try {
		const response = await axios.post(
			`${config.webrl}/updateUserDetails`,
			{
				client_key: clientKey,
				mac_address: macAddress,
				os_type: osType,
			},
			{
				headers: { Accept: "application/json" },
			}
		);
		if (response.status !== 200) {
			logger.debug("%s - Error  %s", method, "Unable to update user");
			return Promise.reject(new Error("Unable to update user"));
		}
		logger.debug("%s - success  %s", method, response);
		return Promise.resolve(response.data);
	} catch (error) {
		logger.debug("%s - Error  %s", method, error);
		if (
			error.response &&
			error.response.data &&
			error.response.data.message
		) {
			return Promise.reject(new Error(error.response.data.message));
		}
		return Promise.reject(error);
	}
}

async function checkUpdateAvailable() {
	const method = "checkUpdateAvailable";
	logger.debug("%s - start", method);
	try {
		const response = await axios.get(`${config.webrl}/getVersionDetails`);
		if (response.status !== 200) {
			return Promise.reject(new Error("Error while fetching version"));
		}
		const currentFabdepVersion = config.version;
		if (currentFabdepVersion < response.data.version) {
			logger.debug("%s - start %s", method, "Update available");
			return Promise.resolve({
				updateAvailable: true,
				releaseNote: response.data.releasenotes,
			});
		}
		logger.debug("%s - start %s", method, "Update available");
		return Promise.resolve({
			updateAvailable: false,
			releaseNote: response.data.releasenotes,
		});
	} catch (error) {
		logger.debug("%s - Error  %s", method, error);
		if (
			error.response &&
			error.response.data &&
			error.response.data.message
		) {
			return Promise.reject(new Error(error.response.data.message));
		}
		return Promise.reject(error);
	}
}

async function autoUpdateStatus(data) {
	try {
		let autoUpdate = await autoUpdateModel.findOne({});
		if (!autoUpdate) {
			autoUpdate = await autoUpdateModel.create(data);
		} else {
			autoUpdate.autoUpdateStatus = data.autoUpdateStatus;
		}
		await autoUpdate.save();
		return Promise.resolve(autoUpdate);
	} catch (error) {
		return Promise.reject({ message: error.message, httpStatus: 0 });
	}
}

module.exports = {
	getToken,
	checkUpdateAvailable,
	autoUpdateStatus,
};
