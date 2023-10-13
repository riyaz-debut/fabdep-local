'use strict';
const orgModel = require('./orgModel');
const caModel = require('./../caManager/caModel');
const peerModel = require('./../peerManager/peerModel');
const os = require('os');
const config = require('../../config');
const utils = require('../../utils/utils');

// Changes according to v2.x
// const { FileSystemWallet, X509WalletMixin } = require('fabric-network');

const { Wallets, X509WalletMixin } = require('fabric-network');
const logger = require('../repositry/utils').getLogger('OrgController');
const NetworkController = require('../network/networkController');
const Network = require('../network/networkmodel');
const mongoose = require('mongoose'); //orm for database
const fs = require('fs-extra');

class OrgController {

    // Add organisation
    static async addOrganisation(orgParam) {

        const method = 'addOrganisation';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, orgParam);

        try {
            let existingTlsCa = await caModel.ca.findOne({ _id: orgParam.tlsCaId, isTLS: 1 });
            if (!existingTlsCa) {
                logger.error('%s - TLS CA does exists', method);
                return Promise.reject({ message: 'TLS CA does not exists is ORG CA', httpStatus: 400 });
            }

            let tlscaRegistrar = await caModel.caAdmin.findOne({ caId: orgParam.tlsCaId });
            if (!tlscaRegistrar) {
                logger.error('%s - Registrar does exists with TLS CA', method);
                return Promise.reject({ message: 'Registrar does not exists with tlsca', httpStatus: 400 });
            }

            if (!tlscaRegistrar.cacets) {
                logger.error('%s - Registrar is not enrolled with TLS CA', method);
                return Promise.reject({ message: 'Registrar is not enrolled with tlsca', httpStatus: 400 });
            }

            let existingCa = await caModel.ca.findOne({ _id: orgParam.caId, isTLS: 0 });
            if (!existingCa) {
                logger.error('%s - CA does not exists', method);
                return Promise.reject({ message: 'CA does not exists or is TLS CA', httpStatus: 400 });
            }

            let caRegistrar = await caModel.caAdmin.findOne({ caId: orgParam.caId });
            if (!caRegistrar) {
                logger.error('%s - Registrar does exists with CA', method);
                return Promise.reject({ message: 'Registrar does not exists with ca', httpStatus: 400 });
            }

            if (!caRegistrar.cacets) {
                logger.error('%s - Registrar is not enrolled with CA', method);
                return Promise.reject({ message: 'Registrar is not enrolled with ca', httpStatus: 400 });
            }

            let networkDetail = await NetworkController.getNetWorkDetail(orgParam.networkId);
            logger.debug('%s - Network fetched from database: %j', method, networkDetail);
            let isClusterPartOfNetwork = false;
            for (let i = 0; i < networkDetail[0].clusters.length; i++) {
                let objId = networkDetail[0].clusters[i];
                if (objId.equals(mongoose.Types.ObjectId(orgParam.clusterId))) {
                    isClusterPartOfNetwork = true;
                }
            }
            if (!isClusterPartOfNetwork) {
                return Promise.reject({ message: 'Cluster is not part of the network', httpStatus: 400 });
            }

            let existingOrg = await orgModel.findOne({ name: orgParam.name, networkId: orgParam.networkId });
            if (existingOrg) {
                logger.error('%s - Organisation already exists with the same name', method);
                return Promise.reject({ message: 'Organisation already exists', httpStatus: 400 });
            }

            let existingMsp = await orgModel.findOne({ mspId: orgParam.mspId, networkId: orgParam.networkId });
            if (existingMsp) {
                logger.error('%s - MSP ID already exists', method);
                return Promise.reject({ message: 'MSPID  already exists', httpStatus: 400 });
            }

            let savedOrgAdmin = await caModel.orgAdmin.findOne({ _id: orgParam.adminId, caId: orgParam.caId });
            if (!savedOrgAdmin) {
                logger.error('%s - Admin user does not exists with the CA', method);
                return Promise.reject({ message: 'Admin does not exists with ca', httpStatus: 400 });
            }

            if (!savedOrgAdmin.cacets) {
                logger.error('%s - Admin user is not enrolled with the CA', method);
                return Promise.reject({ message: 'Admin is not enrolled with ca', httpStatus: 400 });
            }

            let saveOrg = await orgModel.create(orgParam);
            logger.debug('%s - Organisation added into the database', method);
            return Promise.resolve({ message: 'Organisation added successfully', data: saveOrg, httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }




    // Enroll admin  registered with the organisation
    static async createWallet(orgParam) {
        const method = 'createWallet';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, orgParam);

        try {
            let orgDetail = await orgModel.findOne({ _id: orgParam._id })
                .populate('adminId')
                .populate('caId')
                .populate('networkId');
            if (!orgDetail) {
                logger.error('%s - Organisation does not exists', method);
                return Promise.reject({ message: 'Organisation does not exist', httpStatus: 400 });
            }

            let savedAdmin = orgDetail.adminId;
            if (!savedAdmin) {
                logger.error('%s - Admin user does not exists', method);
                return Promise.reject({ message: 'Admin does not exists', httpStatus: 400 });
            }

            if (!savedAdmin.signCert) {
                logger.error('%s - Admin user is not enrolled', method);
                return Promise.reject({ message: 'Enroll Admin first', httpStatus: 400 });
            }

            const basePath = utils.getBasePath(orgDetail.networkId.namespace, orgDetail.name, orgDetail.caId.name);
            const walletPath = `${basePath}/wallet`;
            
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
            logger.debug('%s - basePath: %s', method, basePath);
            logger.debug('%s - walletPath: %s', method, walletPath);

            /*
			 *
			 * ############################## Fabric 2.x Version changes here ##############################
			 * Now the new identity will be created like below with fabric 2.x --------
			 *
			 */

            // const identity = X509WalletMixin.createIdentity(
            //     orgDetail.mspId, 
            //     savedAdmin.signCert, 
            //     savedAdmin.primaryKey
            // );

			// const identity = {
			// 	credentials: {
			// 		mspId: orgDetail.mspId,
            //         signCert:savedAdmin.signCert,
			// 		primaryKey: savedAdmin.primaryKey,
			// 	},
			// 	mspId: "dummy", // mspId will be mentioned here
			// 	type: "X.509",
			// };

            const identity = {
				credentials: {
                    certificate: savedAdmin.signCert,
					privateKey: savedAdmin.primaryKey,
				},
				mspId: "orderer12msp", // mspId will be mentioned heregjtjg fh
				type: "X.509",
			};

            /*
			 *
			 * ############################## Fabric 2.x Version changes here ##############################
			 * New identity will be imported to wallet like below with fabric 2.x --------
			 *
			 */

            // await wallet.import(savedAdmin.admnId, identity);
            console.log("identity", identity)

            await wallet.put(savedAdmin.admnId, identity);
            logger.debug('%s - %s user imported into wallet.', method, savedAdmin.admnId);
            return Promise.resolve({ message: 'Wallet Successfully created ', httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }


    // List organisation by cluster
    static async listOrganisationsByCluster(data) {
        const method = 'listOrganisationsByCluster';
        logger.debug('%s - start', method);
        try {
            let orgList = await orgModel.aggregate([
                { $match: { clusterId: mongoose.Types.ObjectId(data.clusterId) } },
                {
                    $lookup: {
                        from: 'orgadmins',
                        as: 'admin',
                        let: { adminId: '$adminId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$adminId'] } } },
                            { $project: { cacets: 0, primaryKey: 0, signCert: 0 } }
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
                { $unwind: '$admin' },
                { $unwind: '$ca' },
                { $unwind: '$tlsCa' },
                { $unwind: '$cluster' },
                { $unwind: '$network' },
            ]);
            if (!orgList.length) {
                return Promise.reject({ message: 'Organisations does not exists', httpStatus: 400 });
            }
            return Promise.resolve({ message: 'Success', data: orgList, httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    // List organisation by cluster
    static async listOrganisationsByNetwork(data) {
        const method = 'listOrganisationsByNetwork';
        logger.debug('%s - start', method);

        try {
            const networkDetail = await NetworkController.getOrgListingFromNetwork(data.networkId);
            logger.debug('%s - Organisation information returned from database', method);
            return Promise.resolve({ message: 'Success', data: networkDetail[0].organisations, httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    // Get organisation
    static async getOrganisation(orgParam) {
        const method = 'getOrganisation';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, orgParam);

        try {
            let orgDetail = await orgModel.findOne({ _id: orgParam._id })
                .populate('caId')
                .populate('tlsCaId')
                .populate('adminId')
                .populate('clusterId')
                .populate('networkId');
            if (!orgDetail) {
                logger.error('%s - Organisation does not exists', method);
                return Promise.reject({ message: 'Organisation does not exist', httpStatus: 400 });
            }
            logger.debug('%s - Organisation information returned from database', method);
            return Promise.resolve({ message: 'Success', data: orgDetail, httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }




    // Get organisation
    static async deleteOrganisation(id) {
        const method = 'getOrganisation';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, id);

        try {
            let orgDetail = await orgModel.findOne({ _id: id });
            if (!orgDetail) {
                logger.error('%s - Organisation does not exists', method);
                return Promise.reject({ message: 'Organisation does not exist', httpStatus: 400 });
            }
            let peerCount = await peerModel.count({ orgId: id });
            if (peerCount < 1) {
                let deleteOrg = await orgModel.deleteOne({ _id: id });

                if (!deleteOrg) {
                    return Promise.reject({ message: 'Delete operation did not work for organisation', httpStatus: 400 });
                }

            } else {
                return Promise.reject({ message: 'peer exist for the organisation, delete operation did not work', httpStatus: 400 });


            }

            logger.debug('%s - Organisation deleteed returned from database', method);
            return Promise.resolve({ message: 'Organisation Deleted Successfully', httpStatus: 200 });

        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    // Add organisation
    static async importOrganisation(orgParam) {
        const method = 'importOrganisation';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, orgParam);

        try {
            let networkDetail = await Network.findById(orgParam.networkId);
            if (!networkDetail) {
                return Promise.reject({ message: 'Network Not exist', httpStatus: 400 });
            }
            let existingOrg = await orgModel.findOne({ name: orgParam.name, networkId: orgParam.networkId });
            if (existingOrg) {
                logger.error('%s - Organisation already exists with the same name', method);
                return Promise.reject({ message: 'Organisation already exists', httpStatus: 400 });
            }

            let existingMsp = await orgModel.findOne({ mspId: orgParam.mspId, networkId: orgParam.networkId });
            if (existingMsp) {
                logger.error('%s - MSP ID already exists', method);
                return Promise.reject({ message: 'MSPID  already exists', httpStatus: 400 });
            }

            let orgDetail = {
                name: orgParam.name,
                mspId: orgParam.mspId,
                networkId: orgParam.networkId,
                extras: {
                    tlsCacerts: orgParam.tlsCacerts,
                    cacets: orgParam.cacets,
                    admincerts: orgParam.admincerts,
                    peer_enroll_id: orgParam.peer_enroll_id,
                    peerport: orgParam.peerport,
                    clusterIp: orgParam.clusterIp
                },
                type: 2,
            };
            let saveOrg = await orgModel.create(orgDetail);
            // create organisation msp
            if (saveOrg) {
                const basePath = utils.getExportedOrgBasePath(
                    networkDetail.namespace,
                    saveOrg.name
                );
                const orgMspPath = `${basePath}/msp`;
                fs.outputFileSync(`${orgMspPath}/admincerts/admin.pem`, orgParam.admincerts);
                fs.outputFileSync(`${orgMspPath}/cacerts/ca.pem`, orgParam.cacets);
                fs.outputFileSync(`${orgMspPath}/tlscacerts/tlsca.pem`, orgParam.tlsCacerts);
            }
            logger.debug('%s - Organisation added into the database', method);
            return Promise.resolve({ message: 'Organisation added successfully', data: saveOrg, httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    // export organisation
    static async exportOrganisation(orgParam) {
        const method = 'getOrganisation';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, orgParam);

        try {
            let allDetail = await orgModel.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(orgParam._id), type: 0 } },
                {
                    $lookup: {
                        from: 'orgadmins',
                        as: 'admin',
                        let: { adminId: '$adminId' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$adminId'] } } }
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
                            { $project: { configuration: 0 } },
                            {
                                $lookup: {
                                    from: 'vms',
                                    as: 'masternode',
                                    let: { master_node: '$master_node' },
                                    pipeline: [
                                        {
                                            $match: { $expr: { $eq: ['$_id', '$$master_node'] } },

                                        },
                                        {
                                            $project: { ip: 1, password: 1 }
                                        }
                                    ]
                                }
                            },
                            {
                                $project: { name: 1, masternode: 1 }
                            },
                            { $unwind: '$masternode' },
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'peers',
                        as: 'peers',
                        let: { organisationId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$orgId', '$$organisationId'] } } },
                            { $sort: { created_at: 1 } },
                        ]
                    }
                },
                { $unwind: '$admin' },
                { $unwind: '$ca' },
                { $unwind: '$tlsCa' },
                { $unwind: '$cluster' },
                { $unwind: '$network' },
            ]);
            if (!allDetail.length) {
                return Promise.reject({ message: 'Organisations does not exists', httpStatus: 400 });
            }

            let orgDetail = allDetail[0];
            const basePath = utils.getBasePath(
                orgDetail.network.namespace,
                orgDetail.name,
                orgDetail.ca.name
            );

            const orgMspPath = `${basePath}/msp`;
            if (!orgDetail.peers.length) {
                return Promise.reject({ message: 'No Peer for the Organisations does not exists', httpStatus: 400 });
            }
            if (!fs.existsSync(orgMspPath)) {
                return Promise.reject({ message: 'Organisation must have atleast one peer with msp generated', httpStatus: 400 });
            }
            let peer = orgDetail.peers[0];
            let ExportDetails = {
                name: orgDetail.name,
                mspId: orgDetail.mspId,
                type: 2,
                peer_enroll_id: peer.peer_enroll_id,
                peerport: peer.peerport,
                tlsCacerts: peer.cacets,
                cacets: peer.cacets,
                admincerts: orgDetail.admin.signCert,
                clusterIp: orgDetail.cluster.masternode.ip
            };
            logger.debug('%s - Organisation information returned from database', method);
            return Promise.resolve({ message: 'Success', data: ExportDetails, httpStatus: 200 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }



}
module.exports = OrgController;