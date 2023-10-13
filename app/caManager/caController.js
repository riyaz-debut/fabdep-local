/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";
const utils = require("../../utils/utils.js");
const caModel = require("./caModel");
const os = require("os");
const config = require("../../config");
const fs = require("fs-extra");
// const {
// 	FileSystemWallet,
// 	X509WalletMixin,
// 	Gateway,
// } = require("fabric-network");
const { Wallets, X509WalletMixin, Gateway } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const logger = require("../repositry/utils").getLogger("CAController");
const mongoose = require("mongoose"); //orm for database

const KubernetesRepository = require("../repositry/kubernetes/cakubernetesrepository");
const Cluster = require("../cluster/clusterModel");
const NetworkController = require("../network/networkController");
const ansiblerepositry = require("../repositry/ansiblerepositry");

class CAController {
	// Adds new certification authority to the system
	static async addCertificateAuthority(caDetail) {
		const method = "addCertificateAuthority";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, caDetail);
		try {
			let networkDetail = await NetworkController.getNetWorkDetail(
				caDetail.networkId
			);
			logger.debug(
				"%s - Network fetched from database: %j",
				method,
				networkDetail
			);
			let isClusterPartOfNetwork = false;
			for (let i = 0; i < networkDetail[0].clusters.length; i++) {
				let objId = networkDetail[0].clusters[i];
				if (objId.equals(mongoose.Types.ObjectId(caDetail.clusterId))) {
					isClusterPartOfNetwork = true;
				}
			}
			if (!isClusterPartOfNetwork) {
				return Promise.reject({
					message: "Cluster is not part of the network",
					httpStatus: 400,
				});
			}
			let savedCA = await caModel.ca.findOne({
				name: caDetail.name,
				networkId: caDetail.networkId,
			});
			if (savedCA) {
				logger.error(
					"%s - CA already exists with the same name: %j",
					method,
					savedCA
				);
				return Promise.reject({
					message: "Ca already exists with same name",
					httpStatus: 400,
				});
			}

			let savedCAs = await caModel.ca.find({});
			caDetail.port = config.ports.caPort + 1 * savedCAs.length;

			let caValue = await caModel.ca.create(caDetail);
			logger.debug("%s - CA saved in database", method);
			return Promise.resolve({
				message: `${caDetail.name} added Successfully`,
				data: caValue,
				httpStatus: 200,
			});
		} catch (err) {
			console.log(method);
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	// Get saved certification authority based on the id
	static async getCertificateAuthority(caRequest) {
		const method = "getCertificateAuthority";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, caRequest);
		try {
			let savedCA = await caModel.ca
				.findById({ _id: caRequest._id })
				.populate("networkId")
				.populate("clusterId");
			if (!savedCA) {
				logger.error("%s - CA does not exists", method);
				return Promise.reject({
					message: "Ca does not exists",
					httpStatus: 400,
				});
			}
			logger.debug("%s - CA fetched from database: %j", method, savedCA);

			return Promise.resolve({
				message: "Success",
				data: savedCA,
				httpStatus: 200,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	// Get all the saved certification authorities with in a network
	static async getAllCertificateAuthority(caRequest) {
		const method = "getAllCertificateAuthority";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, caRequest);
		try {
			const networkDetail = await NetworkController.getNetWorkDetail(
				caRequest.networkId
			);
			logger.debug(
				"%s - Network fetched from database: %j",
				method,
				caRequest
			);
			return Promise.resolve({
				message: "Success",
				data: networkDetail[0].cas,
				httpStatus: 200,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	// Create CA configuration file and upload CA service and deployment on the cluster
	static async CreateCaService(caRequest) {
		const method = "CreateCaService";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, caRequest);
		try {
			let savedCA = await caModel.ca
				.findById(caRequest.caId)
				.populate("networkId");
			if (!savedCA) {
				logger.error("%s - CA does not exists", method);
				return Promise.reject({
					message: "Ca does not exists",
					httpStatus: 400,
				});
			}

			logger.debug("%s - CA fetched from database %j", method, savedCA);

			let clusterData = await Cluster.findOne({
				_id: savedCA.clusterId,
			}).populate({
				path: "master_node",
				select: "ip username password",
				match: {
					status: { $eq: 1 },
				},
			});

			logger.debug(
				"%s - Cluster fetched from database %j",
				method,
				clusterData
			);

			const networkDetail = await NetworkController.getNetWorkDetail(
				savedCA.networkId._id
			);
			logger.debug(
				"%s - Network fetched from database: %j",
				method,
				networkDetail
			);

			// Create CA configuration file
			await writeCAFile(savedCA);

			// Change service parameters on their template
			let KubernetesRepoObj = new KubernetesRepository();
			KubernetesRepoObj.setClient(clusterData.configuration);
			const serviceData = KubernetesRepoObj.getcaservice(savedCA);

			// Create service on cluster
			await KubernetesRepoObj.addService(
				networkDetail[0].namespace,
				serviceData
			);
			logger.debug("%s - CA Service deployed to cluster", method);

			return Promise.resolve({
				message: "Success",
				httpStatus: 200,
				data: serviceData,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	static async CreateCaDeployment(caRequest) {
		const method = "CreateCaDeployment";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, caRequest);
		try {
			let savedCA = await caModel.ca
				.findById({ _id: caRequest.caId })
				.populate("networkId");
			if (!savedCA) {
				logger.error("%s - CA does not exists", method);
				return Promise.reject({
					message: "Ca does not exists",
					httpStatus: 400,
				});
			}

			logger.debug("%s - CA fetched from database %j", method, savedCA);

			let clusterData = await Cluster.findOne({
				_id: savedCA.clusterId,
			}).populate({
				path: "master_node",
				select: "ip username password",
				match: {
					status: { $eq: 1 },
				},
			});

			logger.debug(
				"%s - Cluster fetched from database %j",
				method,
				clusterData
			);

			const networkDetail = await NetworkController.getNetWorkDetail(
				savedCA.networkId._id
			);
			logger.debug(
				"%s - Network fetched from database: %j",
				method,
				networkDetail
			);
			// Move CA  configuration file on Cluster
			let KubernetesRepoObj = new KubernetesRepository();
			KubernetesRepoObj.setClient(clusterData.configuration);
			await KubernetesRepoObj.moveCaConfig(
				savedCA,
				networkDetail[0].namespace,
				clusterData.master_node
			);

			// Change deployment parameters on their template
			const deploymentData = KubernetesRepoObj.getcadeployment(
				savedCA,
				networkDetail[0].namespace
			);

			// Create deployment on cluster
			await KubernetesRepoObj.addDeployment(
				deploymentData,
				networkDetail[0].namespace
			);
			logger.debug("%s - CA deployment deployed to cluster", method);

			return Promise.resolve({ message: "Success", httpStatus: 200 });
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	// Create connection files for the Organisation using CA
	static async writeConnectionConfigs(caRequest) {
		const method = "writeConnectionConfigs";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, caRequest);
		try {
			let savedCA = await caModel.ca
				.findById({ _id: caRequest.caId })
				.populate("networkId");
			if (!savedCA) {
				logger.error("%s - CA does not exists", method);
				return Promise.reject({
					message: "Ca does not exists",
					httpStatus: 400,
				});
			}

			logger.debug("%s - CA fetched from database %j", method, savedCA);

			let clusterData = await Cluster.findOne({
				_id: savedCA.clusterId,
			}).populate({
				path: "master_node",
				select: "ip username password",
				match: {
					status: { $eq: 1 },
				},
			}).populate({
				path: "worker_node",
				select: "ip username password",
				match: {
					status: { $eq: 1 },
				},
			});

			logger.debug(
				"%s - Cluster fetched from database %j",
				method,
				clusterData
			);
			
			console.log("clusterData :", clusterData)
			console.log("worker Data :", clusterData.worker_node[0].ip)
			// function to create connectioin file
			await writeConnectionJson(savedCA, clusterData);

			logger.debug("%s - Connection profile has been written", method);
			return Promise.resolve({ message: "Success", httpStatus: 200 });
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	/*
     ********************************************************
     * Writes all the configration required for the ca execution
       Testing purpose only
     ********************************************************
     */
	static async writeCAConfigsTesting(caRequest) {
		try {
			let ca = await caModel.ca.findById({ _id: caRequest._id });
			if (!ca) {
				return Promise.reject({
					message: "Ca does not exists",
					httpStatus: 400,
				});
			}

			await writeCAFile(ca);
			await writeDockerCompose(ca);
			await writeConnectionJsonTesting(ca);
			return Promise.resolve({ message: "Success", httpStatus: 200 });
		} catch (err) {
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	//Fetch tls certfile
	static async fetchCaTlsCertificatesFromNFS(caRequest) {
		const method = "fetchCaTlsCertificatesFromNFS";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, caRequest);
		try {
			let savedCA = await caModel.ca
				.findById({ _id: caRequest.caId })
				.populate("networkId");
			if (!savedCA) {
				logger.error("%s - CA does not exists", method);
				return Promise.reject({
					message: "Ca does not exists",
					httpStatus: 400,
				});
			}

			logger.debug("%s - CA fetched from database %j", method, savedCA);

			let clusterData = await Cluster.findOne({
				_id: savedCA.clusterId,
			}).populate({
				path: "master_node",
				select: "ip username password",
				match: {
					status: { $eq: 1 },
				},
			});

			logger.debug(
				"%s - Cluster fetched from database %j",
				method,
				clusterData
			);
			const networkDetail = await NetworkController.getNetWorkDetail(
				savedCA.networkId._id
			);
			logger.debug(
				"%s - Network fetched from database: %j",
				method,
				networkDetail
			);

			// Copy file from Live to local
			let destinationpath = `${os.homedir}/`;
			let sourcepath = `/home/export/${networkDetail[0].namespace}/${savedCA.name}/tls-cert.pem`;

			logger.debug("%s - sourcepath: %s", method, sourcepath);
			logger.debug("%s - destinationpath: %s", method, destinationpath);

			await new ansiblerepositry().fetchFilesFromCluster(
				clusterData.master_node,
				sourcepath,
				destinationpath
			);

			const tlsPath = `${utils.getCaBasePath(
				savedCA.networkId.namespace,
				savedCA.name
			)}/tls-cert.pem`;
			const tlspemPath =
				destinationpath + clusterData.master_node.ip + sourcepath;

			logger.debug("%s - tlsPath: %s", method, tlsPath);
			logger.debug("%s - tlspemPath: %s", method, tlspemPath);
			fs.copyFile(tlspemPath, tlsPath);
			logger.debug(
				"%s - Copied file from %s to %s",
				method,
				tlspemPath,
				tlsPath
			);
			return Promise.resolve({ message: "Success", httpStatus: 200 });
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	//Enroll the admin that is registered as default admin in the configration files
	static async enrollRegistrar(caRequest) {
		const method = "enrollRegistrar";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, caRequest);

		try {
			let savedCA = await caModel.ca
				.findById({ _id: caRequest.caId })
				.populate("networkId");
			if (!savedCA) {
				logger.error("%s - CA does not exists", method);
				return Promise.reject({
					message: "Ca does not exists",
					httpStatus: 400,
				});
			}

			logger.debug("%s - CA fetched from database %j", method, savedCA);

			const basePath = `${utils.getCaBasePath(
				savedCA.networkId.namespace,
				savedCA.name
			)}`;

			const ccpPath = `${basePath}/config.json`;
			const tlsPath = `${basePath}/tls-cert.pem`;
			const ccpJSON = fs.readFileSync(ccpPath, "utf8");
			const ccp = JSON.parse(ccpJSON);
			const walletPath = `${basePath}/wallet`;

			logger.debug("%s - basePath: %s", method, basePath);
			logger.debug("%s - ccpPath: %s", method, ccpPath);
			logger.debug("%s - tlsPath: %s", method, tlsPath);
			logger.debug("%s - walletPath: %s", method, walletPath);

			// Create a new CA client for interacting with the CA.
			const caInfo = ccp.certificateAuthorities[savedCA.name];
			const caTLSCACerts = fs.readFileSync(tlsPath);

			const ca = new FabricCAServices(
				caInfo.url,
				{ trustedRoots: caTLSCACerts, verify: false },
				caInfo.caName
			);

			/*
			 *
			 * ############################## Fabric 2.x Version changes here ##############################
			 * Now imports will be like this -------- const { Wallets, X509WalletMixin } = require('fabric-network');
			 * And will be used like below --------
			 *
			 */

			// Create a new file system based wallet for managing identities.
			// const wallet = new FileSystemWallet(walletPath);
			const wallet = await Wallets.newFileSystemWallet(walletPath);

			/*
			 *
			 * ############################## Fabric 2.x Version changes here ##############################
			 * Now the wallet exists check will be like below with fabric 2.x --------
			 *
			 */

			// Check to see if we've already enrolled the admin user.
			// const adminExists = await wallet.exists(`${savedCA.admnId}`);
			const adminExists = await wallet.get(`${savedCA.admnId}`);

			if (adminExists) {
				logger.error(
					"%s - User %s already exists in wallet %s",
					method,
					savedCA.admnId,
					walletPath
				);
				return Promise.reject({
					message: `An identity for the ${savedCA.admnId} user "admin" already exists in the wallet`,
					httpStatus: 400,
				});
			}

			logger.debug("%s - Enrollig user %s", method, savedCA.admnId);

			// Enroll the admin user, and import the new identity into the wallet.
			const enrollment = await ca.enroll({
				enrollmentID: savedCA.admnId,
				enrollmentSecret: savedCA.admnSecret,
			});

			/*
			 *
			 * ############################## Fabric 2.x Version changes here ##############################
			 * Now the new identity will be created like below with fabric 2.x --------
			 *
			 */

			// const identity = X509WalletMixin.createIdentity(
			// 	savedCA.name,
			// 	enrollment.certificate,
			// 	enrollment.key.toBytes()
			// );

			const identity = {
				credentials: {
					certificate: enrollment.certificate,
					privateKey: enrollment.key.toBytes(),
				},
				mspId: "dummy", // mspId will be mentioned here
				type: "X.509",
			};

			logger.debug(
				"%s - Importing user %s into wallet",
				method,
				savedCA.admnId
			);

			/*
			 *
			 * ############################## Fabric 2.x Version changes here ##############################
			 * New identity will be imported to wallet like below with fabric 2.x --------
			 *
			 */

			// await wallet.import(savedCA.admnId, identity);
			await wallet.put(savedCA.admnId, identity);

			let admin = {
				caId: savedCA._id,
				admnId: savedCA.admnId,
				admnSecret: savedCA.admnSecret,
				cacets: enrollment.rootCertificate,
				primaryKey: enrollment.key.toBytes(),
				signCert: enrollment.certificate,
			};

			let adminSavedValue = await caModel.caAdmin.create(admin);
			logger.debug(
				"%s - Saved the information about user %s in database",
				method,
				savedCA.admnId
			);
			return Promise.resolve({
				message: "Successfully enrolled",
				data: adminSavedValue,
				httpStatus: 200,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	// Register the organisation admin
	static async registerCaAdmin(adminRequest) {
		const method = "registerCaAdmin";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, adminRequest);

		try {
			let ca = await caModel.ca
				.findById({ _id: adminRequest.caId })
				.populate("networkId");
			if (!ca) {
				logger.error("%s - CA does not exists", method);
				return Promise.reject({
					message: "Ca does not exists",
					httpStatus: 400,
				});
			}
			logger.debug("%s - CA fetched from database %j", method, ca);

			let savedRegistrar = await caModel.caAdmin.findOne({ caId: ca._id });
			if (!savedRegistrar) {
				logger.error("%s - CA registrar not exists", method);
				return Promise.reject({
					message: "Enroll ca registrar first",
					httpStatus: 400,
				});
			}

			let existingAdmin = await caModel.orgAdmin.findOne({
				caId: ca._id,
				admnId: adminRequest.admnId,
			});

			if (existingAdmin) {
				logger.error("%s - Admin already registered with ca", method);
				return Promise.reject({
					message: "Admin already registered with ca",
					httpStatus: 400,
				});
			}
			logger.debug(
				"%s - CA registrar fetched from database %j",
				method,
				savedRegistrar
			);

			const basePath = `${utils.getCaBasePath(
				ca.networkId.namespace,
				ca.name
			)}`;

			const ccpPath = `${basePath}/config.json`;
			const ccpJSON = fs.readFileSync(ccpPath, "utf8");
			const ccp = JSON.parse(ccpJSON);
			const walletPath = `${basePath}/wallet`;

			logger.debug("%s - basePath: %s", method, basePath);
			logger.debug("%s - ccpPath: %s", method, ccpPath);
			logger.debug("%s - walletPath: %s", method, walletPath);

			const tlsPath = `${basePath}/tls-cert.pem`;

			/*
			 *
			 * ############################## Fabric 2.x Version changes here ##############################
			 * Now imports will be like this -------- const { Wallets, X509WalletMixin } = require('fabric-network');
			 * And will be used like below --------
			 *
			 */

			// Create a new file system based wallet for managing identities.
			// const wallet = new FileSystemWallet(walletPath);
			const wallet = await Wallets.newFileSystemWallet(walletPath);

			/*
			 *
			 * ############################## Fabric 2.x Version changes here ##############################
			 * Now the wallet exists check will be like below with fabric 2.x --------
			 *
			 */

			// Check to see if we've already enrolled the admin user.
			// const adminExists = await wallet.exists(`${ca.admnId}`);
			var adminExists = await wallet.get(`${ca.admnId}`);

			if (!adminExists) {
				logger.error(
					"%s - User %s does not exists in wallet %s",
					method,
					ca.admnId,
					walletPath
				);
				return Promise.reject({
					message: `An identity for the ${ca.admnId}  "admin" does not exists  in the wallet`,
					httpStatus: 400,
				});
			}

			const gateway = new Gateway();
			await gateway.connect(ccp, {
				wallet,
				identity: `${ca.admnId}`,
				discovery: { enabled: true, asLocalhost: true },
			});

			// Get the CA client object from the gateway for interacting with the CA.
			// const caService = gateway.getClient().getCertificateAuthority();
			// const adminIdentity = gateway.getCurrentIdentity();

			// const caService = gateway.getOptions();

			// Create a new CA client for interacting with the CA.
			const caInfo = ccp.certificateAuthorities[ca.name];
			const caTLSCACerts = fs.readFileSync(tlsPath);

			const caService = new FabricCAServices(
				caInfo.url,
				{ trustedRoots: caTLSCACerts, verify: false },
				caInfo.caName
			);

			const provider = wallet
				.getProviderRegistry()
				.getProvider(adminExists.type);
			const adminIdentity = await provider.getUserContext(
				adminExists,
				`${ca.admnId}`
			);

			// Register the user, enroll the user, and import the new identity into the wallet.
			let idType = "admin";
			let attributes = [
				{
					name: "hf.Registrar.Roles",
					value: idType,
				},
				{
					name: "hf.Registrar.Attributes",
					value: "*",
				},
				{
					name: "hf.Revoker",
					value: "true",
				},
				{
					name: "hf.GenCRL",
					value: "true",
				},
				{
					name: "admin",
					value: "true:ecert",
				},
				{
					name: "abac.init",
					value: "true:ecert",
				},
			];
			let errorMessage = "";
			try {
				logger.debug("%s - Register user %s", method, adminRequest.admnId);
				const secret = await caService.register(
					{
						maxEnrollments: -1,
						// affiliation: "org1.department1",
						enrollmentID: adminRequest.admnId,
						enrollmentSecret: adminRequest.admnSecret,
						attrs: attributes,
						role: idType,
					},
					adminIdentity
				);

				logger.info(secret);
				// await caService.register(
				// 	{
				// 		maxEnrollments: -1,
				// 		enrollmentID: adminRequest.admnId,
				// 		enrollmentSecret: adminRequest.admnSecret,
				// 		attrs: attributes,
				// 	},
				// 	adminIdentity
				// );
			} catch (err) {
				errorMessage = err.message;
			}
			if (
				errorMessage !== "" &&
				!errorMessage.includes("is already registered")
			) {
				logger.error("%s - Error: %s", method, errorMessage);
				return Promise.reject({ message: errorMessage, httpStatus: 400 });
			}
			let admin = {
				caId: ca._id,
				admnId: adminRequest.admnId,
				admnSecret: adminRequest.admnSecret,
				identityType: idType,
				status: 0,
			};

			let adminSavedValue = await caModel.orgAdmin.findOneAndUpdate(
				{ caId: ca._id, admnId: adminRequest.admnId },
				admin,
				{
					new: true,
					upsert: true, // Make this update into an upsert
				}
			);
			await gateway.disconnect();
			logger.debug(
				"%s - Saved user %s into database",
				method,
				adminRequest.admnId
			);
			return Promise.resolve({
				message: "Successfully registered",
				data: adminSavedValue,
				httpStatus: 200,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	//========================== changes according to fabric 2.x =======================================

	// Register the organisation admin
	static async registerOrgAdmin(adminRequest) {
		const method = "registerCaAdmin";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, adminRequest);

		try {
			let ca = await caModel.ca
				.findById({ _id: adminRequest.caId })
				.populate("networkId");
			if (!ca) {
				logger.error("%s - CA does not exists", method);
				return Promise.reject({
					message: "Ca does not exists",
					httpStatus: 400,
				});
			}
			logger.debug("%s - CA fetched from database %j", method, ca);

			let savedRegistrar = await caModel.caAdmin.findOne({ caId: ca._id });
			if (!savedRegistrar) {
				logger.error("%s - CA registrar not exists", method);
				return Promise.reject({
					message: "Enroll ca registrar first",
					httpStatus: 400,
				});
			}

			let existingAdmin = await caModel.orgAdmin.findOne({
				caId: ca._id,
				admnId: adminRequest.admnId,
			});

			if (existingAdmin) {
				logger.error("%s - Admin already registered with ca", method);
				return Promise.reject({
					message: "Admin already registered with ca",
					httpStatus: 400,
				});
			}
			logger.debug(
				"%s - CA registrar fetched from database %j",
				method,
				savedRegistrar
			);

			const basePath = `${utils.getCaBasePath(
				ca.networkId.namespace,
				ca.name
			)}`;

			const ccpPath = `${basePath}/config.json`;
			const ccpJSON = fs.readFileSync(ccpPath, "utf8");
			const ccp = JSON.parse(ccpJSON);
			const walletPath = `${basePath}/wallet`;

			logger.debug("%s - basePath: %s", method, basePath);
			logger.debug("%s - ccpPath: %s", method, ccpPath);
			logger.debug("%s - walletPath: %s", method, walletPath);

			const tlsPath = `${basePath}/tls-cert.pem`;

			/*
			 *
			 * ############################## Fabric 2.x Version changes here ##############################
			 * Now imports will be like this -------- const { Wallets, X509WalletMixin } = require('fabric-network');
			 * And will be used like below --------
			 *
			 */

			// Create a new file system based wallet for managing identities.
			// const wallet = new FileSystemWallet(walletPath);
			const wallet = await Wallets.newFileSystemWallet(walletPath);

			/*
			 *
			 * ############################## Fabric 2.x Version changes here ##############################
			 * Now the wallet exists check will be like below with fabric 2.x --------
			 *
			 */

			// Check to see if we've already enrolled the admin user.
			// const adminExists = await wallet.exists(`${ca.admnId}`);
			var adminExists = await wallet.get(`${ca.admnId}`);

			if (!adminExists) {
				logger.error(
					"%s - User %s does not exists in wallet %s",
					method,
					ca.admnId,
					walletPath
				);
				return Promise.reject({
					message: `An identity for the ${ca.admnId}  "admin" does not exists  in the wallet`,
					httpStatus: 400,
				});
			}

			const gateway = new Gateway();
			await gateway.connect(ccp, {
				wallet,
				identity: `${ca.admnId}`,
				discovery: { enabled: true, asLocalhost: true },
			});

			// Get the CA client object from the gateway for interacting with the CA.
			// const caService = gateway.getClient().getCertificateAuthority();
			// const adminIdentity = gateway.getCurrentIdentity();

			// const caService = gateway.getOptions();

			// Create a new CA client for interacting with the CA.
			const caInfo = ccp.certificateAuthorities[ca.name];
			const caTLSCACerts = fs.readFileSync(tlsPath);

			const caService = new FabricCAServices(
				caInfo.url,
				{ trustedRoots: caTLSCACerts, verify: false },
				caInfo.caName
			);

			const provider = wallet
				.getProviderRegistry()
				.getProvider(adminExists.type);
			const adminIdentity = await provider.getUserContext(
				adminExists,
				`${ca.admnId}`
			);

			// Register the user, enroll the user, and import the new identity into the wallet.
			let idType = "admin";
			let attributes = [
				{
					name: "hf.Registrar.Roles",
					value: idType,
				},
				{
					name: "hf.Registrar.Attributes",
					value: "*",
				},
				{
					name: "hf.Revoker",
					value: "true",
				},
				{
					name: "hf.GenCRL",
					value: "true",
				},
				{
					name: "admin",
					value: "true:ecert",
				},
				{
					name: "abac.init",
					value: "true:ecert",
				},
			];
			let errorMessage = "";
			try {
				logger.debug("%s - Register user %s", method, adminRequest.admnId);
				const secret = await caService.register(
					{
						maxEnrollments: -1,
						// affiliation: "org1.department1",
						enrollmentID: adminRequest.admnId,
						enrollmentSecret: adminRequest.admnSecret,
						attrs: attributes,
						role: idType,
					},
					adminIdentity
				);

				logger.info(secret);
				// await caService.register(
				// 	{
				// 		maxEnrollments: -1,
				// 		enrollmentID: adminRequest.admnId,
				// 		enrollmentSecret: adminRequest.admnSecret,
				// 		attrs: attributes,
				// 	},
				// 	adminIdentity
				// );
			} catch (err) {
				errorMessage = err.message;
			}
			if (
				errorMessage !== "" &&
				!errorMessage.includes("is already registered")
			) {
				logger.error("%s - Error: %s", method, errorMessage);
				return Promise.reject({ message: errorMessage, httpStatus: 400 });
			}
			let admin = {
				caId: ca._id,
				admnId: adminRequest.admnId,
				admnSecret: adminRequest.admnSecret,
				identityType: idType,
				status: 0,
			};

			let adminSavedValue = await caModel.orgAdmin.findOneAndUpdate(
				{ caId: ca._id, admnId: adminRequest.admnId },
				admin,
				{
					new: true,
					upsert: true, // Make this update into an upsert
				}
			);
			await gateway.disconnect();
			logger.debug(
				"%s - Saved user %s into database",
				method,
				adminRequest.admnId
			);
			return Promise.resolve({
				message: "Successfully registered",
				data: adminSavedValue,
				httpStatus: 200,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}




	// Enroll admin  registered with the organisation
	static async enrollCaAdmin(adminRequest) {
		const method = "enrollCaAdmin";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, adminRequest);

		try {
			let savedAdmin = await caModel.orgAdmin
				.findById({ _id: adminRequest._id })
				.populate({
					path: "caId",
					populate: {
						path: "networkId",
					},
				});

			if (!savedAdmin) {
				logger.error("%s - Admin user does not exists", method);
				return Promise.reject({
					message: "Admin does not exists",
					httpStatus: 400,
				});
			}
			let ca = savedAdmin.caId;

			const basePath = `${utils.getCaBasePath(
				ca.networkId.namespace,
				ca.name
			)}`;
			const ccpPath = `${basePath}/config.json`;
			const tlsPath = `${basePath}/tls-cert.pem`;
			const ccpJSON = fs.readFileSync(ccpPath, "utf8");
			const ccp = JSON.parse(ccpJSON);
			const walletPath = `${basePath}/wallet`;

			logger.debug("%s - basePath: %s", method, basePath);
			logger.debug("%s - ccpPath: %s", method, ccpPath);
			logger.debug("%s - tlsPath: %s", method, tlsPath);
			logger.debug("%s - walletPath: %s", method, walletPath);

			// const wallet = new FileSystemWallet(walletPath);
			const wallet = await Wallets.newFileSystemWallet(walletPath);

			// Check to see if we've already enrolled the admin user.
			// const adminExists = await wallet.exists(`${savedAdmin.admnId}`);
			console.log("test saved ca")
			console.log("savedCA value :", savedAdmin.admnId)
			const adminExists = await wallet.get(`${savedAdmin.admnId}`);
			if (adminExists) {
				logger.error(
					"%s - User %s already exists in wallet %s",
					method,
					savedAdmin.admnId,
					walletPath
				);
				return Promise.reject({
					message: `An identity for the ${savedAdmin.admnId} user "admin" already exists in the wallet`,
					httpStatus: 400,
				});
			}

			// Create a new CA client for interacting with the CA.
			const caInfo = ccp.certificateAuthorities[ca.name];
			const caTLSCACerts = fs.readFileSync(tlsPath);
			const caService = new FabricCAServices(
				caInfo.url,
				{ trustedRoots: caTLSCACerts, verify: false },
				caInfo.caName
			);

			logger.debug("%s - Enrollig user %s", method, savedAdmin.admnId);
			// Enroll the admin user, and import the new identity into the wallet.
			const enrollment = await caService.enroll({
				enrollmentID: savedAdmin.admnId,
				enrollmentSecret: savedAdmin.admnSecret,
			});

			let admin = {
				caId: savedAdmin.caId,
				orgId: savedAdmin.orgId,
				admnId: savedAdmin.admnId,
				admnSecret: savedAdmin.admnSecret,
				cacets: enrollment.rootCertificate,
				primaryKey: enrollment.key.toBytes(),
				signCert: enrollment.certificate,
				status: 1,
			};

			let adminSavedValue = await caModel.orgAdmin.findByIdAndUpdate(
				savedAdmin._id,
				admin,
				{ new: true }
			);
			logger.debug(
				"%s - Saved the information about user %s in database",
				method,
				savedAdmin.admnId
			);
			return Promise.resolve({
				message: "Successfully enrolled",
				data: adminSavedValue,
				httpStatus: 200,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	//Get ca admin by the certification id
	static async getWalletIdentityDetail(adminRequest) {
		const method = "getWalletIdentityDetail";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, adminRequest);

		try {
			let admin = await caModel.orgAdmin.findById({ _id: adminRequest._id });
			if (!admin) {
				logger.error("%s - Admin does not exists", method);
				return Promise.reject({
					message: "Admin does not exists",
					httpStatus: 400,
				});
			}
			logger.debug("%s - Admin information returned from database", method);

			return Promise.resolve({
				message: "Success",
				data: admin,
				httpStatus: 200,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	//Get all  by the admins registered/enrolled with ca
	static async getAllIdentitiesByCa(adminRequest) {
		const method = "getAllIdentitiesByCa";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, adminRequest);

		try {
			let admins = await caModel.orgAdmin.aggregate([
				{ $match: { caId: mongoose.Types.ObjectId(adminRequest._id) } },
				{
					$project: {
						tlsCacerts: 0,
						tlsPrimaryKey: 0,
						tlsSignCert: 0,
						cacets: 0,
						primaryKey: 0,
						signCert: 0,
					},
				},
				{
					$lookup: {
						from: "cas",
						as: "ca",
						let: { caId: "$caId" },
						pipeline: [
							{ $match: { $expr: { $eq: ["$_id", "$$caId"] } } },
						],
					},
				},
				{ $unwind: "$ca" },
			]);
			if (!admins.length) {
				logger.error("%s - Admins does not exists", method);
				return Promise.reject({
					message: "Admins does not exists",
					httpStatus: 400,
				});
			}
			logger.debug("%s - Admin information returned from database", method);
			return Promise.resolve({
				message: "Success",
				data: admins,
				httpStatus: 200,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	//Get all  by the admins registered/enrolled with ca
	static async getAllIdentitiesByNetwork(adminRequest) {
		const method = "getAllIdentitiesByNetwork";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, adminRequest);

		try {
			let admins = await caModel.orgAdmin.aggregate([
				// { $match: { caId: mongoose.Types.ObjectId(adminRequest._id) } },
				{
					$project: {
						tlsCacerts: 0,
						tlsPrimaryKey: 0,
						tlsSignCert: 0,
						cacets: 0,
						primaryKey: 0,
						signCert: 0,
					},
				},
				{
					$lookup: {
						from: "cas",
						as: "ca",
						let: { caId: "$caId" },
						pipeline: [
							{ $match: { $expr: { $eq: ["$_id", "$$caId"] } } },
							{
								$match: {
									$expr: {
										$eq: [
											"$networkId",
											mongoose.Types.ObjectId(
												adminRequest.network_id
											),
										],
									},
								},
							},
						],
					},
				},
				{ $unwind: "$ca" },
			]);

			if (!admins.length) {
				logger.error("%s - Wallet Identity does not exists", method);
				return Promise.reject({
					message: "Wallet Identity does not exists",
					httpStatus: 400,
				});
			}

			logger.debug("%s - Admin information returned from database", method);

			return Promise.resolve({
				message: "Success",
				data: admins,
				httpStatus: 200,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	//Get all  by the admins registered/enrolled with ca
	static async getIdentityDetail(data) {
		const method = "getIdentityDetail";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, data);

		try {
			let wallets = await caModel.orgAdmin.findById(data.walletId).populate({
				path: "caId",
				populate: {
					path: "clusterId",
				},
				populate: {
					path: "networkId",
				},
			});
			if (!wallets) {
				logger.error("%s - Wallet does not exists", method);
				return Promise.reject({
					message: "Wallet does not exists",
					httpStatus: 400,
				});
			}

			logger.debug("%s - Wallet information returned from database", method);

			return Promise.resolve({
				message: "Success",
				data: wallets,
				httpStatus: 200,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

	static async writeCaKubernetesFiles(caRequest) {
		const method = "writeCaKubernetesFiles";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, caRequest);
		try {
			let savedCA = await caModel.ca
				.findById({ _id: caRequest.caId })
				.populate("networkId");
			if (!savedCA) {
				logger.error("%s - CA does not exists", method);
				return Promise.reject({
					message: "Ca does not exists",
					httpStatus: 400,
				});
			}

			logger.debug("%s - CA fetched from database %j", method, savedCA);

			let clusterData = await Cluster.findOne({
				_id: savedCA.clusterId,
			}).populate({
				path: "master_node",
				select: "ip username password",
				match: {
					status: { $eq: 1 },
				},
			});

			logger.debug(
				"%s - Cluster fetched from database %j",
				method,
				clusterData
			);

			const networkDetail = await NetworkController.getNetWorkDetail(
				savedCA.networkId._id
			);
			logger.debug(
				"%s - Network fetched from database: %j",
				method,
				networkDetail
			);
			let kubeRepo = new KubernetesRepository();
			// Change deployment parameters on their template
			const deploymentData = kubeRepo.getcadeployment(
				savedCA,
				networkDetail[0].namespace
			);
			const serviceData = kubeRepo.getcaservice(savedCA);
			const deploymentPath = `${os.homedir}/kubefiles/cas/${savedCA.name}/${savedCA.name}-deployment.yaml`;
			const svcPath = `${os.homedir}/kubefiles/cas/${savedCA.name}/${savedCA.name}-svc.yaml`;

			await utils.writeYaml2(deploymentPath, deploymentData);
			await utils.writeYaml2(svcPath, serviceData);
			return Promise.resolve(deploymentPath);
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}
}

async function writeCAFile(data) {
	const method = "writeCAFile";
	logger.debug("%s - start", method);
	logger.debug("%s - has received the parameters %j", method, data);

	try {
		let caObjet = {
			version: config.fabricVersion.version,
			port: data.port,
			cors: {
				enabled: false,
				origins: ["*"],
			},
			debug: false,
			crlsizelimit: 512000,

			//Tls settings
			tls: {
				enabled: true,
				certfile: null,
				keyfile: null,
				clientauth: {
					type: "noclientcert",
					certfiles: null,
				},
			},

			//Ca settings
			ca: {
				name: data.name,
				keyfile: null,
				certfile: null,
				chainfile: null,
			},

			//certificate revocation list
			crl: {
				expiry: "87600h",
			},
			registry: {
				maxenrollments: -1,
				identities: [
					{
						name: data.admnId,
						pass: data.admnSecret,
						type: "client",
						maxenrollments: -1,
						affiliation: "",
						attrs: {
							"hf.Registrar.Roles": "*",
							"hf.Registrar.DelegateRoles": "*",
							"hf.Revoker": true,
							"hf.IntermediateCA": true,
							"hf.GenCRL": true,
							"hf.Registrar.Attributes": "*",
							"hf.AffiliationMgr": true,
						},
					},
				],
			},

			//DB details
			db: {
				type: "sqlite3",
				datasource: "fabric-ca-server.db",
				tls: {
					enabled: true,
					certfiles: null,
					client: {
						certfile: null,
						keyfile: null,
					},
				},
			},

			//Affiliation
			affiliations: {
				org1: ["department1"],
				org2: ["department1"],
			},

			//Signing
			signing: {
				default: {
					usage: ["digital signature"],
					expiry: "87600h",
				},
				profiles: {
					ca: {
						usage: ["cert sign", "crl sign"],
						expiry: "87600h",
						caconstraint: {
							isca: true,
							maxpathlen: 0,
						},
					},
					tls: {
						usage: [
							"signing",
							"key encipherment",
							"server auth",
							"client auth",
							"key agreement",
						],
						expiry: "87600h",
					},
				},
			},

			//CSR Configuration
			csr: {
				cn: "fabric-ca-server",
				keyrequest: {
					algo: "ecdsa",
					size: 256,
				},
				names: [
					{
						C: "US",
						ST: "North Carolina",
						L: null,
						O: "Hyperledger",
						OU: "Fabric",
					},
				],
				hosts: ["localhost"],
				ca: {
					expiry: "175200h",
					pathlength: 1,
				},
			},

			//Idemix data
			idemix: {
				rhpoolsize: 1000,
				nonceexpiration: "15s",
				noncesweepinterval: "15m",
			},

			//BCCSP
			bccsp: {
				default: "SW",
				sw: {
					hash: "SHA2",
					security: 256,
					filekeystore: {
						keystore: "msp/keystore",
					},
				},
			},
			cacount: null,
			cafiles: null,
			intermediate: {
				parentserver: {
					url: null,
					caname: null,
				},
				enrollment: {
					hosts: null,
					profile: null,
					label: null,
				},
				tls: {
					certfiles: null,
					client: {
						certfile: null,
						keyfile: null,
					},
				},
			},
			cfg: {
				identities: {
					passwordattempts: 10,
				},
			},
			operations: {
				listenAddress: "127.0.0.1:9443",
				tls: {
					enabled: false,
					cert: {
						file: null,
					},
					key: {
						file: null,
					},
					clientAuthRequired: false,
					clientRootCAs: {
						files: [],
					},
				},
			},
			metrics: {
				provider: "disabled",
				statsd: {
					network: "udp",
					address: "127.0.0.1:8125",
					writeInterval: "10s",
					prefix: "server",
				},
			},
		};

		const filePath = `${utils.getCaBasePath(
			data.networkId.namespace,
			data.name
		)}/fabric-ca-server-config.yaml`;
		await utils.writeYaml2(filePath, caObjet);
		logger.debug("%s - Storing the CA config in file: %s", method, filePath);

		return Promise.resolve();
	} catch (error) {
		logger.error("%s - Error: %s", method, error.message);
		return Promise.reject(error);
	}
}

function writeConnectionJson(caData, clusterData) {
	const method = "writeConnectionJson";
	logger.debug("%s - start", method);
	logger.debug("%s - has received the parameters caData: %j", method, caData);
	logger.debug(
		"%s - has received the parameters clusterData: %j",
		method,
		clusterData
	);
	try {
		let caObj = {
			name: caData.name,
			version: "1.0.0",
			client: {
				organization: "dummy",
				connection: {
					timeout: {
						peer: {
							endorser: "3000",
						},
						orderer: "3000",
					},
				},
			},
			organizations: {
				dummy: {
					mspId: "dummy",
					certificateAuthorities: [caData.name],
				},
			},
			certificateAuthorities: {
				[caData.name]: {
					url: `https://${clusterData.master_node.ip}:${caData.port}`,
					caName: `${caData.name}`,
					tlsCACerts: {
						path: `${utils.getCaBasePath(
							caData.networkId.namespace,
							caData.name
						)}/tls-cert.pem`,
					},
					httpOptions: {
						verify: false,
					},
				},
			},
		};
		logger.debug("%s - caObj: : %j", method, caObj);
		let stringObj = JSON.stringify(caObj);
		const filePath = `${utils.getCaBasePath(
			caData.networkId.namespace,
			caData.name
		)}/config.json`;
		fs.outputFileSync(filePath, stringObj);
		logger.debug(
			"%s - Written Connection profile in file: %s",
			method,
			filePath
		);
		return Promise.resolve();
	} catch (error) {
		logger.error("%s - Error: %s", method, error.message);
		return Promise.reject(error);
	}
}

module.exports = CAController;
