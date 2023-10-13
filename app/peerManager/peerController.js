'use strict';
const peerModel = require('./peerModel');
const caModel = require('./../caManager/caModel');
const orgModel = require('./../orgManager/orgModel');
const Cluster = require('../cluster/clusterModel');
const pathJoin = require("path");
let shell = require("shelljs");
const peerKubeRepos = require('../repositry/kubernetes/peerKubeRepos');
const { channelPeer } = require('../channel/channelModel'); // require model users
const mongoose = require('mongoose');
const FabricCAServices = require('fabric-ca-client');
const config = require('../../config');
const fs = require('fs-extra');
const os = require('os');
const utils = require('../../utils/utils');
const { Wallets, FileSystemWallet, Gateway } = require('fabric-network');
const logger = require('../repositry/utils').getLogger('peerController');
const NetworkController = require('../network/networkController');
// const forge = require("node-forge");
const exceptions = require("../errors/errors");
const { readFile } = require("fs");


class PeerController {

    static async addPeer(peerParam) {
        const method = 'addPeer';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerParam);

        try {
            let existingOrg = await orgModel.findById({ _id: peerParam.orgId })
                .populate('caId')
                .populate('tlsCaId');
            if (!existingOrg) {
                logger.error('%s - Organisation does exists', method);
                return Promise.reject({ message: 'Organisation does not exists', httpStatus: 400 });
            }

            let peerPort = config.ports.peerPort;
            let countPeer = await peerModel.findOne({}, { couchdbport: 1 }).sort({ couchdbport: -1 });

            if (countPeer && countPeer.couchdbport !== null && countPeer.couchdbport > 0) {
                peerPort = countPeer.couchdbport + 1;
            }
            const networkDetail = await NetworkController.getNetWorkDetail(existingOrg.networkId);
            logger.debug('%s - Network fetched from database: %j', method, networkDetail);

            peerParam.name = peerParam.name.toLowerCase();
            peerParam.peer_enroll_id = `${peerParam.name}-${existingOrg.name}`.toLowerCase();
            peerParam.peerport = peerPort;
            peerParam.chaincodeport = ++peerPort; // plus 1
            peerParam.couchdbport = ++peerPort; // plus 2
            peerParam.caId = existingOrg.caId._id;
            peerParam.tlsCaId = existingOrg.tlsCaId._id;
            peerParam.networkId = existingOrg.networkId;
            peerParam.clusterId = existingOrg.clusterId;
            let existingPeer = await peerModel.findOne({ name: peerParam.name, orgId: peerParam.orgId });
            if (existingPeer) {
                logger.error('%s - Peer already exists with this organisation', method);
                return Promise.reject({ message: 'Peer already exists', httpStatus: 400 });
            }

            let savePeer = await peerModel.create(peerParam);
            logger.debug('%s - Peer infomation added into database', method);
            return Promise.resolve({ message: 'Peer added successfully', data: savePeer, httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    static async listPeersByNetwork(data) {
        const method = 'listPeersByNetwork';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, data);

        try {
            let peerList = await peerModel.aggregate([
                { $match: { networkId: mongoose.Types.ObjectId(data.networkId) } },
                {
                    $project: {
                        tlsCacerts: 0, tlsPrimaryKey: 0, tlsSignCert: 0,
                        cacets: 0, primaryKey: 0, signCert: 0
                    }
                },
                {
                    $lookup: {
                        from: 'organisations',
                        as: 'organisation',
                        let: { orgId: '$orgId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$orgId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'cas',
                        as: 'ca',
                        let: { caId: '$caId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$caId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'cas',
                        as: 'tlsCa',
                        let: { tlsCaId: '$tlsCaId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$tlsCaId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'networks',
                        as: 'network',
                        let: { networkId: '$networkId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$networkId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'clusters',
                        as: 'cluster',
                        let: { clusterId: '$clusterId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$clusterId'] } } },
                            { $project: { configuration: 0 } }
                        ]
                    }
                },
                { $unwind: '$ca' },
                { $unwind: '$organisation' },
                { $unwind: '$tlsCa' },
                { $unwind: '$cluster' },
                { $unwind: '$network' },
            ]);
            logger.debug('%s - Peer information returned from database', method);

            return Promise.resolve({ message: 'Success', data: peerList, httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    static async listPeersByCluster(data) {
        const method = 'listPeersByCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, data);


        try {
            let peerList = await peerModel.aggregate([
                { $match: { clusterId: mongoose.Types.ObjectId(data.clusterId) } },
                {
                    $project: {
                        tlsCacerts: 0, tlsPrimaryKey: 0, tlsSignCert: 0,
                        cacets: 0, primaryKey: 0, signCert: 0
                    }
                },
                {
                    $lookup: {
                        from: 'organisations',
                        as: 'organisation',
                        let: { orgId: '$orgId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$orgId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'cas',
                        as: 'ca',
                        let: { caId: '$caId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$caId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'cas',
                        as: 'tlsCa',
                        let: { tlsCaId: '$tlsCaId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$tlsCaId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'networks',
                        as: 'network',
                        let: { networkId: '$networkId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$networkId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'clusters',
                        as: 'cluster',
                        let: { clusterId: '$clusterId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$clusterId'] } } },
                            { $project: { configuration: 0 } }
                        ]
                    }
                },
                { $unwind: '$ca' },
                { $unwind: '$organisation' },
                { $unwind: '$tlsCa' },
                { $unwind: '$cluster' },
                { $unwind: '$network' },
            ]);
            return Promise.resolve({ message: 'Success', data: peerList, httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }
    static async listPeersByOrganisation(data) {
        const method = 'listPeersByCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, data);


        try {
            let peerList = await peerModel.aggregate([
                { $match: { orgId: mongoose.Types.ObjectId(data.orgId) } },
                {
                    $project: {
                        tlsCacerts: 0, tlsPrimaryKey: 0, tlsSignCert: 0,
                        cacets: 0, primaryKey: 0, signCert: 0
                    }
                },
                {
                    $lookup: {
                        from: 'organisations',
                        as: 'organisation',
                        let: { orgId: '$orgId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$orgId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'cas',
                        as: 'ca',
                        let: { caId: '$caId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$caId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'cas',
                        as: 'tlsCa',
                        let: { tlsCaId: '$tlsCaId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$tlsCaId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'networks',
                        as: 'network',
                        let: { networkId: '$networkId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$networkId'] } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'clusters',
                        as: 'cluster',
                        let: { clusterId: '$clusterId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$clusterId'] } } },
                            { $project: { configuration: 0 } }
                        ]
                    }
                },
                { $unwind: '$ca' },
                { $unwind: '$organisation' },
                { $unwind: '$tlsCa' },
                { $unwind: '$cluster' },
                { $unwind: '$network' },
            ]);
            return Promise.resolve({ message: 'Success', data: peerList, httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }
    static async getPeer(peerParam) {
        const method = 'getPeer';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerParam);

        try {
            let peerDetail = await peerModel.findOne({ _id: peerParam.peerId }, {
                tlsCacerts: 0, tlsPrimaryKey: 0, tlsSignCert: 0, cacets: 0, primaryKey: 0, signCert: 0
            })
                .populate('orgId')
                .populate('caId')
                .populate('tlsCaId')
                .populate('networkId');
            //.populate('clusterId');
            if (!peerDetail) {
                logger.error('%s - Peer does not exists', method);
                return Promise.reject({ message: 'Peer does not exist', httpStatus: 400 });
            }
            logger.debug('%s - Peer information returned from database', method);
            return Promise.resolve({ message: 'Success', data: peerDetail, httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    static deletePeer(peerid) {
        try {
            return new Promise(async (resolve, reject) => {


                let existingPeerId = await peerModel.findOne({ _id: peerid });
                if (!existingPeerId) { reject({ message: 'Peer does not exist', httpStatus: 400 }); }

                let PeerChannelCount = await channelPeer.count({ joinedpeer: peerid });
                if (PeerChannelCount > 0) {
                    logger.error('%s - Peer exist in the channel ', method);
                    reject({ message: 'Peer exist in the channel, Remove peer from the channel first ', httpStatus: 400 });
                }
                let savePeer = await peerModel.deleteOne({ _id: peerid });
                if (!savePeer) { reject({ message: 'Delete operation did not work', httpStatus: 400 }); }
                /*  let peerCount = await peerModel.count({ orgId: existingPeerId.orgId });
     
                 if (peerCount < 1) {
                     let deleteOrg = await orgModel.deleteOne({ _id: existingPeerId.orgId });
 
                     if (!deleteOrg) { reject({ message: 'Delete operation did not work for organisation', httpStatus: 400 }); } */


                resolve({ message: 'Peer deleted successfully', data: PeerChannelCount, httpStatus: 200 });
            });
        } catch (err) {
            return reject({ message: err.message, httpStatus: 400 });
        }
    }

    // Register Peer
    static async registerPeer(peerRegisterRequest) {
		const method = "registerPeer";
		logger.debug("%s - start", method);
		logger.debug(
			"%s - has received the parameters %j",
			method,
			peerRegisterRequest
		);

		try {
			let savedPeer = await peerModel
				.findById({ _id: peerRegisterRequest._id })
				.populate({
					path: "caId",
					populate: { path: "networkId" },
				})
				.populate({
					path: "tlsCaId",
					populate: { path: "networkId" },
				})
				.populate({
					path: "orgId",
				});

			if (!savedPeer) {
				logger.error("%s - Peer does not exists", method);
				return Promise.reject({
					message: "Peer does not exists",
					httpStatus: 400,
				});
			}

			let savedcaId = savedPeer.caId._id;
			let savedcaName = savedPeer.caId.name;
			let admnId = savedPeer.caId.admnId;
			let namespace = savedPeer.caId.networkId.namespace;
			/* If ca is of tls type change the above variables with the values from the tls ca*/
			if (peerRegisterRequest.isTLS) {
				logger.debug("%s - Request for TLS CA", method);
				savedcaId = savedPeer.tlsCaId._id;
				savedcaName = savedPeer.tlsCaId.name;
				admnId = savedPeer.tlsCaId.admnId;
				namespace = savedPeer.tlsCaId.networkId.namespace;
			}

			logger.debug("%s - savedcaId: %s", method, savedcaId);
			logger.debug("%s - savedcaName: %s", method, savedcaName);
			logger.debug("%s - admnId: %s", method, admnId);

			let savedAdmin = await caModel.caAdmin.findOne({ caId: savedcaId });
			if (!savedAdmin) {
				logger.error("%s - Organisation Admin does not exists", method);
				return Promise.reject({
					message: "Organisation Admin does not exists or not registered",
					httpStatus: 400,
				});
			}

			const basePath = `${utils.getCaBasePath(namespace, savedcaName)}`;
            console.log("basePath", basePath)
			const ccpPath = `${basePath}/config.json`;
			const ccpJSON = fs.readFileSync(ccpPath, "utf8");
			const ccp = JSON.parse(ccpJSON);
			const walletPath = `${basePath}/wallet`;
			const tlsPath = `${basePath}/tls-cert.pem`;

			logger.debug("%s - basePath: %s", method, basePath);
			logger.debug("%s - ccpPath: %s", method, ccpPath);
			logger.debug("%s - walletPath: %s", method, walletPath);
			logger.debug("%s - tlsPath: %s", method, tlsPath);

			// Create a new file system based wallet for managing identities.

            /**
             * changes according to the fabric version 2.x
             */
			// const wallet = new FileSystemWallet(walletPath);
			const wallet = await Wallets.newFileSystemWallet(walletPath);
            console.log("wallet :", wallet)

			// Create a new CA client for interacting with the CA.
			const caInfo = ccp.certificateAuthorities[savedcaName];
			const caTLSCACerts = fs.readFileSync(tlsPath);

			logger.debug("%s - caInfo: %s", method, caInfo);

			const caService = new FabricCAServices(
				caInfo.url,
				{ trustedRoots: caTLSCACerts, verify: false },
				caInfo.caName
			);

			var adminExists = await wallet.get(admnId);

			logger.info(adminExists);

			const provider = wallet
				.getProviderRegistry()
				.getProvider(adminExists.type);
			const adminIdentity = await provider.getUserContext(
				adminExists,
				admnId
			);

			logger.info(adminIdentity);

			const gateway = new Gateway();
			await gateway.connect(ccp, {
				wallet,
				identity: `${admnId}`,
				discovery: { enabled: true, asLocalhost: true },
			});

			// Get the CA client object from the gateway for interacting with the CA.
			// const ca = gateway.getClient().getCertificateAuthority();
			// const adminIdentity = gateway.getCurrentIdentity();

			let errorMessage = "";
			let idType = "peer";
			let register;
			try {
				// Register the peer, enroll the peer, and import the new identity into the wallet.
				register = await caService.register(
					{
						maxEnrollments: -1,
						// affiliation: "org1.department1",
						enrollmentID: savedPeer.peer_enroll_id,
						enrollmentSecret: savedPeer.peer_enroll_secret,
						role: idType,
					},
					adminIdentity
				);
			} catch (err) {
				errorMessage = err.message;
			}
			await gateway.disconnect();
			if (errorMessage.includes("is already registered")) {
				logger.debug(
					"%s - Peer - %s registered with the CA",
					method,
					savedPeer.peer_enroll_id
				);
				return Promise.resolve({
					message: "Successfully registered",
					data: register,
					httpStatus: 200,
				});
			} else if (errorMessage !== "") {
				logger.error("%s - Error: %s", method, errorMessage);
				return Promise.reject({ message: errorMessage, httpStatus: 400 });
			}
			logger.debug(
				"%s - Peer - %s registered with the CA",
				method,
				savedPeer.peer_enroll_id
			);
			return Promise.resolve({
				message: "Successfully registered",
				data: register,
				httpStatus: 200,
			});
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, httpStatus: 400 });
		}
	}

    // =================================================================================================
    // =============================== adding csr in enrolling peer ===================================

    // Enroll Peer
    static async enrollPeer(peerEnrollRequest) {
        const method = "enrollPeer";
        logger.debug("%s - start", method);
        logger.debug(
        "%s - has received the parameters %j",
        method,
        peerEnrollRequest
        );

        try {
        let savedPeer = await peerModel
            .findById({ _id: peerEnrollRequest._id })
            .populate({
            path: "caId",
            populate: { path: "networkId" },
            })
            .populate({
            path: "orgId",
            populate: { path: "networkId" },
            })
            .populate({
            path: "tlsCaId",
            populate: { path: "networkId" },
            });
        if (!savedPeer) {
            logger.error("%s - Peer does not exists", method);
            return Promise.reject({
            message: "Peer does not exists",
            httpStatus: 400,
            });
        }

        // console.log(savedPeer);
        // return;

        let savedcaId = savedPeer.caId._id;
        let savedcaName = savedPeer.caId.name;
        let namespace = savedPeer.caId.networkId.namespace;
        let admnId = savedPeer.caId.admnId;

        let rootCaname = savedPeer.caId.name;
        let caPort = savedPeer.caId.port;

        //always remain same for any ca
        let orgPath = `${utils.getBasePath(
            namespace,
            savedPeer.orgId.name,
            // savedOrderingService.orgId.name,
            savedcaName
        )}`; //network1/tls-ca

        console.log("orgPath ", orgPath);

        /* If ca is of tls type change the above variables with the values from the tls ca*/
        if (peerEnrollRequest.isTLS) {
            logger.debug("%s - Request for TLS CA", method);
            savedcaId = savedPeer.tlsCaId._id;
            savedcaName = savedPeer.tlsCaId.name;
            admnId = savedPeer.tlsCaId.admnId;
            namespace = savedPeer.tlsCaId.networkId.namespace;
            caPort = savedPeer.tlsCaId.port;
        }

        logger.debug("%s - savedcaId: %s", method, savedcaId);
        logger.debug("%s - savedcaName: %s", method, savedcaName);
        logger.debug("%s - admnId: %s", method, admnId);

        let savedAdmin = await caModel.caAdmin.findOne({ caId: savedcaId });
        if (!savedAdmin) {
            logger.error("%s - Organisation Admin does not exists", method);
            return Promise.reject({
            message: "Organisation Admin does not exists or not registered",
            httpStatus: 400,
            });
        }

        const basePath = `${utils.getCaBasePath(namespace, savedcaName)}`;

        console.log("basePath ", basePath);
        const ccpPath = `${basePath}/config.json`;
        const tlsPath = `${basePath}/tls-cert.pem`;
        const ccpJSON = fs.readFileSync(ccpPath, "utf8");
        const ccp = JSON.parse(ccpJSON);

        console.log("@@@@@@@@@@@@ check 1");
        logger.debug("%s - basePath: %s", method, basePath);
        logger.debug("%s - ccpPath: %s", method, ccpPath);
        console.log("tlspath", tlsPath);

        const caInfo = ccp.certificateAuthorities[savedcaName];
        const caTLSCACerts = fs.readFileSync(tlsPath);
        const caService = new FabricCAServices(
            caInfo.url,
            { trustedRoots: caTLSCACerts, verify: false },
            caInfo.caName
        );

        let certs;

        async function readFile(directoryPath) {
            try {
            const files = await fs.promises.readdir(directoryPath);

            if (files.length === 0) {
                console.log("No files found in directory");
                return;
            }

            const filePath = `${directoryPath}/${files[0]}`; // assuming only one file in directory
            const fileContents = await fs.promises.readFile(filePath, "utf8");
            certs = fileContents;

            return certs;

            // console.log(cacerts); // will output the contents of the file
            } catch (err) {
            console.error(`Error reading directory: ${err}`);
            return;
            }
        }

        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ 1");

        let peerNode;
        if (peerEnrollRequest.isTLS) {
            logger.debug(
            "%s - **************** TLS ENABLED ********************",
            method
            );

            // let fabric_ca_client_home = `${os.homedir}/Documents/network1/org5-root-ca/peer0-org5/`;
            let fabric_ca_client_home = `${utils.getBasePath(
            namespace,
            savedPeer.orgId.name,
            // savedOrderingService.orgId.name,
            rootCaname
            )}`; //network1/tls-ca
            let peer_enroll_id = savedPeer.peer_enroll_id;
            let peer_enroll_secret = savedPeer.peer_enroll_secret;
            let ca_port = caPort;
            let ca_name = savedcaName;
            let peer_msp_path = `${fabric_ca_client_home}/${savedPeer.name}-${savedPeer.orgId.name}/enroll-tls`;
            let csr_host1 = savedPeer.peer_enroll_id;
            let csr_host2 = "localhost";
            let url = `https://${peer_enroll_id}:${peer_enroll_secret}@localhost:${ca_port}`;

            const path = `${os.homedir}/fabric-samples/bin:$PATH`;

            console.log("url ", url);
            console.log("peermsp path ", peer_msp_path);

            let whole_command = `export PATH=${path} && export FABRIC_CA_CLIENT_HOME=${fabric_ca_client_home} && fabric-ca-client enroll -u ${url} --caname ${ca_name} -M ${peer_msp_path} --enrollment.profile tls --csr.hosts ${csr_host1} --csr.hosts ${csr_host2} --tls.certfiles ${tlsPath}`;

            console.log("whole command :-       ", whole_command);

            console.log(shell.which("configtxgen"));
            //Raft
            if (
            shell.exec(
                `export PATH=${path} && export FABRIC_CA_CLIENT_HOME=${fabric_ca_client_home} && fabric-ca-client enroll -u ${url} --caname ${ca_name} -M ${peer_msp_path} --enrollment.profile tls --csr.hosts ${csr_host1} --csr.hosts ${csr_host2} --tls.certfiles ${tlsPath}`
            ).code !== 0
            ) {
            shell.echo("Error: while creating genesis block");
            throw new exceptions.EnrollException("Error: while enrolling peer");
            }
            console.log("@@@@@@@@@@@@ check 2 enrolled successfully");

            const orgTlsPath = `${orgPath}/${savedPeer.name}-${savedPeer.orgId.name}/enroll-tls`;

            const peerCertsPath = `${orgTlsPath}/tlscacerts/`;

            console.log("peerCerts path ", peerCertsPath);

            const peerKeystorePath = `${orgTlsPath}/keystore/`;
            const peerSignCertsPath = `${orgTlsPath}/signcerts/`;

            peerNode = {
            // orderer.admnSecret : admnSecret;
            tlsCacerts: await readFile(peerCertsPath),
            tlsPrimaryKey: await readFile(peerKeystorePath),
            tlsSignCert: await readFile(peerSignCertsPath),
            };

            console.log("peer node in tls ", peerNode);
        } else {
            /* If ca is of not of tls type then add the certificates to the other keys*/
            logger.debug(
            "%s - **************** TLS DISABLED ********************",
            method
            );

            let fabric_ca_client_home = `${orgPath}/${savedPeer.name}-${savedPeer.orgId.name}`;
            let peer_enroll_id = savedPeer.peer_enroll_id;
            let peer_enroll_secret = savedPeer.peer_enroll_secret;
            let ca_port = caPort;
            let ca_name = savedcaName;
            let peer_msp_path = `${fabric_ca_client_home}/enroll-msp`;
            let csr_host1 = savedPeer.peer_enroll_id;
            let csr_host2 = "localhost";
            let url = `https://${peer_enroll_id}:${peer_enroll_secret}@localhost:${ca_port}`;

            const path = `${os.homedir}/fabric-samples/bin:$PATH`;

            console.log("url ", url);
            console.log("peermsp path ", peer_msp_path);

            let whole_command = `export PATH=${path} && export FABRIC_CA_CLIENT_HOME=${fabric_ca_client_home} && fabric-ca-client enroll -u ${url} --caname ${ca_name} -M ${peer_msp_path} --csr.hosts ${csr_host1} --csr.hosts ${csr_host2} --tls.certfiles ${tlsPath}`;

            console.log("whole command :-       ", whole_command);

            console.log(shell.which("configtxgen"));

            //Raft
            if (
            shell.exec(
                `export PATH=${path} && export FABRIC_CA_CLIENT_HOME=${fabric_ca_client_home} && fabric-ca-client enroll -u ${url} --caname ${ca_name} -M ${peer_msp_path} --csr.hosts ${csr_host1} --csr.hosts ${csr_host2} --tls.certfiles ${tlsPath}`
            ).code !== 0
            ) {
            shell.echo("Error: while creating genesis block");
            throw new exceptions.EnrollException("Error: while enrolling peer");
            }
            console.log("@@@@@@@@@@@@ check 2 enrolled successfully");

            const orgMspPath = `${orgPath}/${savedPeer.name}-${savedPeer.orgId.name}/enroll-msp`;

            const peerCertsPath = `${orgMspPath}/cacerts/`;

            const peerKeystorePath = `${orgMspPath}/keystore/`;
            const peerSignCertsPath = `${orgMspPath}/signcerts/`;

            console.log("peersigncerts ", await readFile(peerSignCertsPath));

            peerNode = {
            // orderer.admnSecret : admnSecret;
            cacets: await readFile(peerCertsPath),
            primaryKey: await readFile(peerKeystorePath),
            signCert: await readFile(peerSignCertsPath),
            };
        }

        logger.debug(
            "%s - Peer %s enrolled with CA",
            method,
            savedPeer.peer_enroll_id
        );

        // return;

        let updatePeer = await peerModel.findOneAndUpdate(
            { _id: peerEnrollRequest._id },
            peerNode,
            {
            new: true,
            upsert: true, // Make this update into an upsert
            }
        );

        if (!updatePeer) {
            logger.error(
            "%s - Peer %s enrolled but information is not updated in database",
            method,
            savedPeer.peer_enroll_id
            );
            return Promise.reject({
            message: "Peer enrollment failed",
            httpStatus: 400,
            });
        }

        return Promise.resolve({
            message: "Peer enrolled successfully.",
            data: updatePeer,
            httpStatus: 200,
        });
        } catch (err) {
        logger.error("%s - Error: %s", method, err.message);
        return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    
     // Generate Peer MSP
    static async generatePeerMsp(peerMspRequest) {
        const method = "generatePeerMsp";
        logger.debug("%s - start", method);
        logger.debug("%s - has received the parameters %j", method, peerMspRequest);

        try {
        //Fetch orderer list
        let peer = await peerModel
            .findById({ _id: peerMspRequest._id })
            .populate("orgId")
            .populate("caId")
            .populate("tlsCaId")
            .populate("networkId");

        if (!peer) {
            logger.error("%s - Peer does not exists", method);
            return Promise.reject({
            message: "Peer nodes does not exists",
            httpStatus: 400,
            });
        }

        //Fetch orderer organisation admin
        let orgAdmin = await caModel.orgAdmin
            .findOne({ _id: peer.orgId.adminId })
            // .populate('orgId')
            .populate("caId");

        console.log("orgAdmin ", orgAdmin);

        if (!orgAdmin) {
            logger.error("%s - Organisation admin does not exists", method);
            return Promise.reject({
            message: "Organisation admin for ca does not exists",
            httpStatus: 400,
            });
        }

        if (!orgAdmin.cacets) {
            logger.error("%s - Organisation admin is not enrolled", method);
            return Promise.reject({
            message: "Organisation admin is not enrolled",
            httpStatus: 400,
            });
        }

        console.log("peer  ", peer.tlsCacerts);

        if (!peer.cacets || !peer.tlsCacerts) {
            logger.error("%s - Peer is not enrolled", method);
            return Promise.reject({
            message: "Peer must be enrolled to  ORG CA and TLS CA ",
            httpStatus: 400,
            });
        }

        const basePath = utils.getBasePath(
            peer.networkId.namespace,
            peer.orgId.name,
            peer.caId.name
        );

        console.log("basePath  ", basePath);

        const orgMspPath = `${basePath}/msp`;
        const orgClientPath = `${basePath}/admin/msp`;
        const mspPath = `${basePath}/${peer.name}-${peer.orgId.name}/msp`;
        const tlsMspPath = `${basePath}/${peer.name}-${peer.orgId.name}/tls`;

        logger.debug("%s - basePath: %s", method, basePath);
        logger.debug("%s - orgMspPath: %s", method, orgMspPath);
        logger.debug("%s - orgClientPath: %s", method, orgClientPath);
        logger.debug("%s - mspPath: %s", method, mspPath);
        logger.debug("%s - tlsMspPath: %s", method, tlsMspPath);

        console.log("orgMspPath  ", orgMspPath);

        // organisation msp
        fs.outputFileSync(
            `${orgMspPath}/admincerts/admin.pem`,
            orgAdmin.signCert
        );
        fs.outputFileSync(`${orgMspPath}/cacerts/ca.pem`, peer.cacets);
        fs.outputFileSync(`${orgMspPath}/tlscacerts/tlsca.pem`, peer.tlsCacerts);
        await utils.writenodeOUSConfigYaml(`${orgMspPath}/config.yaml`);
        logger.debug("%s - Organisation MSP generated", method);

        // Peer msp
        fs.outputFileSync(`${mspPath}/admincerts/admin.pem`, orgAdmin.signCert);
        fs.outputFileSync(`${mspPath}/cacerts/ca.pem`, peer.cacets);
        fs.outputFileSync(`${mspPath}/keystore/key.pem`, peer.primaryKey);
        fs.outputFileSync(`${mspPath}/signcerts/signcerts.pem`, peer.signCert);
        fs.outputFileSync(`${mspPath}/tlscacerts/tlsca.pem`, peer.tlsCacerts);
        await utils.writenodeOUSConfigYaml(`${mspPath}/config.yaml`);

        // Peer tls msp
        fs.outputFileSync(`${tlsMspPath}/ca.crt`, peer.tlsCacerts);
        fs.outputFileSync(`${tlsMspPath}/server.key`, peer.tlsPrimaryKey);
        fs.outputFileSync(`${tlsMspPath}/server.crt`, peer.tlsSignCert);

        // client msp
        fs.outputFileSync(
            `${orgClientPath}/admincerts/admin.pem`,
            orgAdmin.signCert
        );
        fs.outputFileSync(`${orgClientPath}/cacerts/ca.pem`, orgAdmin.cacets);
        fs.outputFileSync(
            `${orgClientPath}/keystore/key.pem`,
            orgAdmin.primaryKey
        );
        fs.outputFileSync(
            `${orgClientPath}/signcerts/signcerts.pem`,
            orgAdmin.signCert
        );
        fs.outputFileSync(
            `${orgClientPath}/tlscacerts/tlsca.pem`,
            peer.tlsCacerts
        );
        logger.debug("%s - Peer MSP generated", method);
        return Promise.resolve({
            message: "MSP structure successfully generated",
            httpStatus: 200,
        });
        } catch (err) {
        logger.error("%s - Error: %s", method, err.message);
        return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    static async copyPeerMaterislToNfs(peerKubeRequest) {
        const method = 'copyPeerMaterislToNfs';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerKubeRequest);

        try {

            //Fetch peer list
            let peerDetails = await this.peerCompleteDetail(peerKubeRequest._id);

            // Get cluster details
            let clusterData = await Cluster.findOne({ _id: peerDetails.clusterId._id })
                .populate({
                    path: 'master_node',
                    select: 'ip username password',
                    match: {
                        status: { $eq: 1 }
                    }
                });

            if (!clusterData) {
                logger.error('%s - Cluster does not exists!', method);
                return Promise.reject({ message: 'Cluster details are invalid', httpStatus: 400 });
            }

            logger.debug('%s - clusterData: %j', method, clusterData);

            const ServiceResponse = await new peerKubeRepos().copyPeerMaterialToNfs(peerDetails, clusterData.master_node);
            logger.debug('%s - Peer material copied to cluster', method);
            return Promise.resolve({ message: 'Peer material copied to nfs successfully', data: ServiceResponse, httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    static async deletePeerMaterislFromNfs(peerKubeRequest) {
        const method = 'deletePeerMaterislFromNfs';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerKubeRequest);

        try {

            //Fetch peer list
            let peerDetails = await this.peerCompleteDetail(peerKubeRequest._id);
            let PeerChannelCount = await channelPeer.count({ joinedpeer: peerKubeRequest._id });
            if (PeerChannelCount > 0) {
                logger.error('%s - Peer exist in the channel ', method);
                return Promise.reject({ message: 'Peer exist in the channel, Remove peer from the channel first ', httpStatus: 400 });
            }


            // Get cluster details
            let clusterData = await Cluster.findOne({ _id: peerDetails.clusterId._id })
                .populate({
                    path: 'master_node',
                    select: 'ip username password',
                    match: {
                        status: { $eq: 1 }
                    }
                });

            if (!clusterData) {
                logger.error('%s - Cluster does not exists!', method);
                return Promise.reject({ message: 'Cluster details are invalid', httpStatus: 400 });
            }

            logger.debug('%s - clusterData: %j', method, clusterData);

            const ServiceResponse = await new peerKubeRepos().deleteCryptoMaterialFromNfs(peerDetails, clusterData.master_node);
            logger.debug('%s - Peer material deleted from cluster', method);
            return Promise.resolve({ message: 'Peer material deleted from nfs successfully', data: ServiceResponse, httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }



    static async createPeerService(peerKubeRequest) {
        const method = 'createPeerService';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerKubeRequest);

        try {

            //Fetch peer list
            let peerDetails = await peerModel.findById({ _id: peerKubeRequest._id })
                .populate('orgId')
                .populate('caId')
                .populate('clusterId')
                .populate('networkId')
                .populate('tlsCaId');

            if (!peerDetails) {
                logger.error('%s - Peer does not exists', method);
                return Promise.reject({ message: 'Peer nodes does not exists', httpStatus: 400 });
            }

            //Fetch peer organisation admin
            let orgAdmin = await caModel.orgAdmin.findById({ _id: peerDetails.orgId.adminId })
                .populate('orgId')
                .populate('caId')
                .populate('tlsCaId');

            if (!orgAdmin) {
                logger.error('%s - Organisation admin does not exists', method);
                return Promise.reject({ message: 'Organisation admin for ca does not exists', httpStatus: 400 });
            }

            if (!orgAdmin.cacets) {
                logger.error('%s - Organisation admin is not enrolled', method);
                return Promise.reject({ message: 'Organisation admin is not enrolled', httpStatus: 400 });
            }

            if ((!peerDetails.cacets) || (!peerDetails.tlsCacerts)) {
                logger.error('%s - Peer is not enrolled', method);
                return Promise.reject({ message: 'Peer must be enrolled to  ORG CA and TLS CA ', httpStatus: 400 });
            }

            // Get cluster details
            const ServiceResponse = await new peerKubeRepos().createPeerService(peerDetails);
            logger.debug('%s - Peer service deployed on cluster', method);
            return Promise.resolve({ message: 'peer service created Successfully', data: ServiceResponse, httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }


    static async deletePeerService(peerKubeRequest) {
        const method = 'deletePeerService';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerKubeRequest);

        try {

            //Fetch peer list
            let peerDetails = await this.peerCompleteDetail(peerKubeRequest._id);
            let PeerChannelCount = await channelPeer.count({ joinedpeer: peerKubeRequest._id });
            if (PeerChannelCount > 0) {
                logger.error('%s - Peer exist in the channel ', method);
                return Promise.reject({ message: 'Peer exist in the channel, Remove peer from the channel first ', httpStatus: 400 });
            }

            // Get cluster details
            let servicename = `${peerDetails.name}-${peerDetails.orgId.name}`.toLowerCase();
            const config = peerDetails.clusterId.configuration;
            const namespace = peerDetails.networkId.namespace;
            let peerKubeReposObj = new peerKubeRepos();
            peerKubeReposObj.setClient(config);
            const peerserviceResponce = await peerKubeReposObj.deleteService(namespace, servicename);
            logger.debug('%s - Peer service deleted on cluster', method);
            return Promise.resolve({ message: 'peer service deleted Successfully', data: peerserviceResponce, httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }




    static async createPeerDeployment(peerKubeRequest) {
        const method = 'createPeerDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerKubeRequest);

        try {

            //Fetch peer list
            let peerDetails = await this.peerCompleteDetail(peerKubeRequest._id);

            // Get cluster details
            let clusterData = await Cluster.findOne({ _id: peerDetails.clusterId._id })
                .populate({
                    path: 'master_node',
                    select: 'ip username password',
                    match: {
                        status: { $eq: 1 }
                    }
                });
            if (!clusterData) {
                logger.error('%s - Cluster does not exists', method);
                return Promise.reject({ message: 'Cluster details are invalid', httpStatus: 400 });
            }

            const ServiceResponse = await new peerKubeRepos().createPeerDeployment(peerDetails, clusterData.master_node);
            logger.debug('%s - Peer deployment deployed on cluster', method);
            return Promise.resolve({ message: 'Peer deployment created successfully', data: ServiceResponse, httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }


    static async deletePeerDeployment(peerKubeRequest) {
        const method = 'deletePeerDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerKubeRequest);

        try {

            //Fetch peer list
            let peerDetails = await this.peerCompleteDetail(peerKubeRequest._id);
            let PeerChannelCount = await channelPeer.count({ joinedpeer: peerKubeRequest._id });
            if (PeerChannelCount > 0) {
                logger.error('%s - Peer exist in the channel ', method);
                return Promise.reject({ message: 'Peer exist in the channel, Remove peer from the channel first ', httpStatus: 400 });
            }

            let servicename = `${peerDetails.name}-${peerDetails.orgId.name}`.toLowerCase();
            const config = peerDetails.clusterId.configuration;
            const namespace = peerDetails.networkId.namespace;
            let peerKubeReposObj = new peerKubeRepos();
            peerKubeReposObj.setClient(config);
            const peerDeploymentResponce = await peerKubeReposObj.deleteDeployment(namespace, servicename);

            logger.debug('%s - Peer deployment deleted successfully', method);
            return Promise.resolve({ message: 'Peer deployment deleted successfully', data: peerDeploymentResponce, httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }




    static async createPeerCouchService(peerKubeRequest) {
        const method = 'createPeerCouchService';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerKubeRequest);

        try {

            //Fetch peer list

            let peerDetails = await this.peerCompleteDetail(peerKubeRequest._id);
            let serviceType = config.peer.CLUSTER_IP
            if (peerKubeRequest.isPublic) {
                serviceType = config.peer.NODE_PORT
            }

            // Get cluster details
            const ServiceResponse = await new peerKubeRepos().createPeerCouchService(peerDetails, serviceType);
            await peerModel.update({ _id: mongoose.Types.ObjectId(peerKubeRequest._id) }, { $set: { isCouchDbPublic: peerKubeRequest.isPublic } });
            logger.debug('%s - Peer CouchDB service deployed on cluster', method);
            return Promise.resolve({ message: 'peer couch service created Successfully', data: ServiceResponse, httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    static async updatePeerCouchService(peerKubeRequest) {
        const method = 'updatePeerCouchService';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerKubeRequest);

        try {

            //Fetch peer list

            let peerDetails = await this.peerCompleteDetail(peerKubeRequest._id);
            let serviceType = config.peer.CLUSTER_IP
            if (peerKubeRequest.isPublic) {
                serviceType = config.peer.NODE_PORT
            }
            // Get cluster details
            const ServiceResponse = await new peerKubeRepos().updateCouchService(peerDetails, serviceType);
            await peerModel.update({ _id: mongoose.Types.ObjectId(peerKubeRequest._id) }, { $set: { isCouchDbPublic: peerKubeRequest.isPublic } });
            logger.debug('%s - Peer CouchDB service deployed on cluster', method);
            return Promise.resolve({ message: 'peer couch service updated Successfully', data: ServiceResponse, httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }



    static async deletePeerCouchService(peerKubeRequest) {
        const method = 'deletePeerCouchService';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerKubeRequest);

        try {

            //Fetch peer list
            let peerDetails = await this.peerCompleteDetail(peerKubeRequest._id);
            let PeerChannelCount = await channelPeer.count({ joinedpeer: peerKubeRequest._id });
            if (PeerChannelCount > 0) {
                logger.error('%s - Peer exist in the channel ', method);
                return Promise.reject({ message: 'Peer exist in the channel, Remove peer from the channel first ', httpStatus: 400 });
            }

            // Get cluster details
            let servicename = `${peerDetails.name}-couch-${peerDetails.orgId.name}`.toLowerCase();
            const config = peerDetails.clusterId.configuration;
            const namespace = peerDetails.networkId.namespace;
            let peerKubeReposObj = new peerKubeRepos();
            peerKubeReposObj.setClient(config);
            const serviceCouchResponce = await peerKubeReposObj.deleteService(namespace, servicename);
            logger.debug('%s - Peer CouchDB service deleted from cluster', method);
            return Promise.resolve({ message: 'peer couch service deleted Successfully', data: serviceCouchResponce, httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    static async createPeerCouchDeployment(peerKubeRequest) {
        const method = 'createPeerCouchDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerKubeRequest);

        try {

            //Fetch peer list
            let peerDetails = await this.peerCompleteDetail(peerKubeRequest._id);


            // Get cluster details
            let clusterData = await Cluster.findOne({ _id: peerDetails.clusterId._id })
                .populate({
                    path: 'master_node',
                    select: 'ip username password',
                    match: {
                        status: { $eq: 1 }
                    }
                });
            if (!clusterData) {
                logger.error('%s - Cluster does not exists', method);
                return Promise.reject({ message: 'Cluster details are invalid', httpStatus: 400 });
            }

            const ServiceResponse = await new peerKubeRepos().createPeerCouchDeployment(peerDetails, clusterData.master_node);
            logger.debug('%s - Peer CouchDB deployment deployed on cluster', method);
            return Promise.resolve({ message: 'Peer  couch deployment created successfully', data: ServiceResponse, httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }





    static async deletePeerCouchDeployment(peerKubeRequest) {
        const method = 'deletePeerCouchDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, peerKubeRequest);

        try {

            let peerDetails = await this.peerCompleteDetail(peerKubeRequest._id);

            let PeerChannelCount = await channelPeer.count({ joinedpeer: peerKubeRequest._id });
            if (PeerChannelCount > 0) {
                logger.error('%s - Peer exist in the channel ', method);
                return Promise.reject({ message: 'Peer exist in the channel, Remove peer from the channel first ', httpStatus: 400 });
            }

            let servicename = `${peerDetails.name}-couch-${peerDetails.orgId.name}`.toLowerCase();
            const config = peerDetails.clusterId.configuration;
            const namespace = peerDetails.networkId.namespace;
            let peerKubeReposObj = new peerKubeRepos();
            peerKubeReposObj.setClient(config);
            await peerKubeReposObj.deleteDeployment(namespace, servicename);
            logger.debug('%s - Peer CouchDB deployment deployed on cluster', method);
            return Promise.resolve({ message: 'Peer  couch deployment deleted successfully', data: PeerChannelCount, httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }



    static async peerCompleteDetail(peerId) {
        const method = 'peerCompleteDetail';
        try {
            //Fetch peer list
            let peerDetails = await peerModel.findById({ _id: peerId })
                .populate('orgId')
                .populate('caId')
                .populate('clusterId')
                .populate('networkId')
                .populate('tlsCaId');

            if (!peerDetails) {
                logger.error('%s - Peer does not exists', method);
                return Promise.reject({ message: 'Peer nodes does not exists', httpStatus: 400 });
            }

            //Fetch peer organisation admin
            let orgAdmin = await caModel.orgAdmin.findById({ _id: peerDetails.orgId.adminId })
                .populate('orgId')
                .populate('caId')
                .populate('tlsCaId');

            if (!orgAdmin) {
                logger.error('%s - Organisation admin does not exists', method);
                return Promise.reject({ message: 'Organisation admin for ca does not exists', httpStatus: 400 });
            }

            if (!orgAdmin.cacets) {
                logger.error('%s - Organisation admin is not enrolled', method);
                return Promise.reject({ message: 'Organisation admin is not enrolled', httpStatus: 400 });
            }

            if ((!peerDetails.cacets) || (!peerDetails.tlsCacerts)) {
                logger.error('%s - Peer is not enrolled', method);
                return Promise.reject({ message: 'Peer must be enrolled to  ORG CA and TLS CA ', httpStatus: 400 });
            }

            // Get cluster details
            let clusterData = await Cluster.findOne({ _id: peerDetails.clusterId._id })
                .populate({
                    path: 'master_node',
                    select: 'ip username password',
                    match: {
                        status: { $eq: 1 }
                    }
                });
            if (!clusterData) {
                logger.error('%s - Cluster does not exists', method);
                return Promise.reject({ message: 'Cluster details are invalid', httpStatus: 400 });
            }

            return Promise.resolve(peerDetails);
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }

    }
    
    static async writePeerKubernetesFiles(peerKubeRequest) {
        const method = 'writePeerKubernetesFiles';
        try {
            //Fetch peer list
            let peerDetails = await this.peerCompleteDetail(peerKubeRequest._id);

            // Get cluster details
            let clusterData = await Cluster.findOne({ _id: peerDetails.clusterId._id })
                .populate({
                    path: 'master_node',
                    select: 'ip username password',
                    match: {
                        status: { $eq: 1 }
                    }
                });
            if (!clusterData) {
                logger.error('%s - Cluster does not exists', method);
                return Promise.reject({ message: 'Cluster details are invalid', httpStatus: 400 });
            }
            let kubefiles = await new peerKubeRepos().getPeerKubernetesFiles(peerDetails, clusterData)

            const peerDeployment = `${os.homedir}/kubefiles/${peerDetails.orgId.name}/${peerDetails.name}-deployment.yaml`;
            const peerSvc = `${os.homedir}/kubefiles/${peerDetails.orgId.name}/${peerDetails.name}-svc.yaml`;
            const peerCouchDeplyment = `${os.homedir}/kubefiles/${peerDetails.orgId.name}/${peerDetails.name}-couch-deplyment.yaml`;
            const peerCouchSvc = `${os.homedir}/kubefiles/${peerDetails.orgId.name}/${peerDetails.name}-couch-svc.yaml`;

            await utils.writeYaml2(peerDeployment, kubefiles.deploymentPeer);
            await utils.writeYaml2(peerSvc, kubefiles.servicePeer);
            await utils.writeYaml2(peerCouchDeplyment, kubefiles.deploymentCouch);
            await utils.writeYaml2(peerCouchSvc, kubefiles.serviceCouch);
            return Promise.resolve(peerDetails);
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }

    }




}

module.exports = PeerController;