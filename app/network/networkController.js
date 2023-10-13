'use strict';

const Network = require('./networkmodel');
const Cluster = require('../cluster/clusterModel');
const Exceptions = require('../errors/errors');
const ErrorHandler = require('../repositry/errorhandler');
const ClusterController = require('../cluster/clusterController');
const KubernetesRepository = require('../repositry/kubernetesrepository');
const KubernetesPVRepository = require('../repositry/kubernetes/pvrepository');
const mongoose = require('mongoose');
const ClusterControllerObj = new ClusterController();
const logger = require('../repositry/utils').getLogger('NetworkController');

class NetworkController {

    /**
     * Adds the network to the db
     */
    static async addNetwork(data) {

        const method = 'addNetwork';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, data);

        try {
            const networkData = {
                name: data.name,
                description: data.description,
                cluster_id: data.cluster_id
            };

            networkData.namespace = data.name.replace(/\s/g, '');
            console.log(networkData.cluster_id);

            // Check cluster exists or not
            // const cluster = await ClusterControllerObj.getCluster(networkData.cluster_id);

            // check if the network with the same name  is already exists, then return error
            if (await NetworkController.networkInUse(networkData.namespace)) {
                throw new Exceptions.NetworkInUse();
            }

            // // check if the network with the same cluser id already exists, then return error
            // if (await NetworkController.clusterInUse(networkData.cluster_id)) {
            //     throw new Exceptions.ClusterInUse();
            // }

            const result = await Network.create(networkData);
            logger.debug('%s - Network information saved to database', method);



            logger.debug('%s - All operations related to network performed', method);
            return {
                status: 200,
                data: {
                    message: 'Network has been created successfully!',
                    data: result
                }
            };
        } catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    static async addClusterToNetwork(data) {
        try {
            const KuberRepoObj = new KubernetesRepository();
            const KuberPVObj = new KubernetesPVRepository();
            const method = 'addClusterToNetwork';
            logger.debug('%s - start', method);
            logger.debug('%s - has received the parameters %j', method, data);

            let network = await Network.findOne({
                _id: data.networkid,
                clusters: {
                    $in: [mongoose.Types.ObjectId(data.cluster_id)]
                }
            });
            if (network) {
                logger.error('%s - Cluster already a part of network %j', method, network);
                return Promise.reject({
                    message: 'Cluster already a part of network',
                    httpStatus: 400
                });
            }

            let networkData = await Network.findOne({
                _id: data.networkid
            });
            if (!networkData) {
                logger.error('%s - Network does not exists %j', method, networkData);
                return Promise.reject({
                    message: 'Network does not exists',
                    httpStatus: 400
                });
            }

            // Check cluster exists or not
            const cluster = await ClusterControllerObj.getCluster(data.cluster_id);
            if (!cluster) {
                logger.error('%s - Cluster does not exists %j', method, cluster);
                return Promise.reject({
                    message: 'Cluster does not exists',
                    httpStatus: 400
                });
            }
            // Create the namespace
            KuberRepoObj.setClient(cluster.configuration);
            await KuberRepoObj.addNamespace(networkData.namespace);

            // Create the pv
            const pvData = {
                name: `nfs-pv-${networkData.namespace}`,
                path: networkData.namespace,
            };
            KuberPVObj.setClient(cluster.configuration);
            await KuberPVObj.addPvToCluster(pvData);

            // Create the PVC for the PV
            const pvcData = {
                name: `nfs-pvc-${networkData.namespace}`,
                pvName: pvData.name
            };
            await KuberPVObj.addPvcToCluster(networkData.namespace, pvcData);
            networkData.clusters.push(data.cluster_id);
            await networkData.save();
            return Promise.resolve({
                message: 'Successfully created',
                data: networkData,
                httpStatus: 200
            });
        } catch (error) {
            return Promise.reject({
                message: error.message,
                httpStatus: 400
            });
        }
    }

    /**
     * Check whether the cluster id is already used or not
     */
    static async clusterInUse(clusterID) {
        const method = 'clusterInUse';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters clusterID: %s', method, clusterID);
        const result = await Network.find({
            cluster_id: clusterID
        });
        return result.length;
    }

    /**
     * Check whether the cluster id is already used or not
     */
    static async getNetWorkByCluster(clusterID) {
        const method = 'getNetWorkByCluster';
        let network = await Network.findOne({
            clusters: {
                $in: [mongoose.Types.ObjectId(clusterID)]
            }
        });
        if (!network) {
            logger.error('%s - Cluster is not part of a network %j', method, network);
            return Promise.reject({
                message: 'Cluster is not part of a network',
                httpStatus: 400
            });

        }
        return Promise.resolve(network);
    }

    /**
     * Check whether the cluster id is already used or not
     */

    static async getNetWorkDetail(networkId) {
        try {
            const method = 'getNetWorkDetail';
            let network = await Network.aggregate([{
                $match: {
                    _id: mongoose.Types.ObjectId(networkId)
                }
            },
            {
                $lookup: {
                    from: 'cas',
                    as: 'cas',
                    let: {
                        networkId: '$_id'
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $eq: ['$networkId', '$$networkId']
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'networks',
                            as: 'network',
                            let: {
                                networkId: '$networkId'
                            },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$networkId']
                                    }
                                }
                            }]
                        }
                    },
                    {
                        $lookup: {
                            from: 'clusters',
                            as: 'cluster',
                            let: {
                                clusterId: '$clusterId'
                            },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$clusterId']
                                    }
                                }
                            },
                            {
                                $project: {
                                    configuration: 0
                                }
                            }
                            ]
                        }
                    },
                    {
                        $unwind: '$cluster'
                    },
                    {
                        $unwind: '$network'
                    },

                    ]
                }
            }
            ]);
            if (!network.length) {
                logger.error('%s - Network does not exists %j', method, network);
                return Promise.reject({
                    message: 'Network does not exists',
                    httpStatus: 400
                });
            }
            return Promise.resolve(network);
        } catch (err) {
            return Promise.reject({
                message: err.message,
                httpStatus: 400
            });
        }

    }


    /**
     * Check whether the cluster id is already used or not
     */

    static async getOrgListingFromNetwork(networkId) {
        try {
            const method = 'getOrgListingFromNetwork';
            let network = await Network.aggregate([{
                $match: {
                    _id: mongoose.Types.ObjectId(networkId)
                }
            },
            {
                $lookup: {
                    from: 'organisations',
                    as: 'organisations',
                    let: {
                        networkId: '$_id'
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $eq: ['$networkId', '$$networkId']
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'cas',
                            as: 'ca',
                            let: {
                                caId: '$caId'
                            },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$caId']
                                    }
                                }
                            }]
                        }
                    },
                    {
                        $lookup: {
                            from: 'cas',
                            as: 'tlsCa',
                            let: {
                                tlsCaId: '$tlsCaId'
                            },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$tlsCaId']
                                    }
                                }
                            }]
                        }
                    },
                    {
                        $lookup: {
                            from: 'peers',
                            as: 'peer',
                            let: {
                                orgId: '$_id'
                            },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $eq: ['$orgId', '$$orgId']
                                    }
                                }
                            }]
                        }
                    },
                    {
                        $lookup: {
                            from: 'networks',
                            as: 'network',
                            let: {
                                networkId: '$networkId'
                            },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$networkId']
                                    }
                                }
                            }]
                        }
                    },
                    {
                        $lookup: {
                            from: 'clusters',
                            as: 'cluster',
                            let: {
                                clusterId: '$clusterId'
                            },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$clusterId']
                                    }
                                }
                            },
                            {
                                $project: {
                                    configuration: 0
                                }
                            }
                            ]
                        }
                    },
                    {
                        $unwind: {
                            "path": "$network",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        $unwind: {
                            "path": "$ca",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        $unwind: {
                            "path": "$tlsCa",
                            "preserveNullAndEmptyArrays": true
                        }
                    },

                    ]
                }
            }
            ]);

            if (!network.length) {
                logger.error('%s - Network does not exists %j', method, network);
                return Promise.reject({
                    message: 'Network does not exists',
                    httpStatus: 400
                });
            }
            return Promise.resolve(network);
        } catch (error) {
            return Promise.reject({
                message: error.message,
                httpStatus: 400
            });
        }

    }


    /**
     * Check whether the cluster id is already used or not
     */
    static async networkInUse(networkname) {
        const method = 'networkInUse';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters networkname: %s', method, networkname);
        const result = await Network.find({
            name: networkname
        });
        return result.length;
    }

    /**
     * List the network
     */
    static async listNetwork(data) {
        const method = 'listNetwork';
        logger.debug('%s - start', method);
        try {
            // const pageOptions = {
            //     page: Number.parseInt(data.page) || 1,
            //     limit: Number.parseInt(data.limit) || 10
            // };

            const result = await Network.aggregate([{
                $lookup: {
                    from: 'ordererservices',
                    as: 'orderingservices',
                    let: {
                        networkId: '$_id'
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $eq: ['$networkId', '$$networkId']
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'channels',
                            as: 'channels',
                            let: {
                                orderingservicesId: '$_id'
                            },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $eq: ['$ordererserviceId', '$$orderingservicesId']
                                    }
                                }
                            },]

                        }
                    }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'organisations',
                    as: 'organisations',
                    let: {
                        networkId: '$_id'
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $eq: ['$networkId', '$$networkId']
                            }
                        }
                    },

                    {
                        $lookup: {
                            from: 'peers',
                            as: 'peers',
                            let: {
                                organisation: '$_id'
                            },
                            pipeline: [{
                                $project: {
                                    cacets: 0,
                                    primaryKey: 0,
                                    signCert: 0,
                                    tlsCacerts: 0,
                                    tlsPrimaryKey: 0,
                                    tlsSignCert: 0
                                }
                            },
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$orgId', '$$organisation']
                                    }
                                }
                            },
                            ]

                        }
                    }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'clusters',
                    as: 'clustersDetail',
                    let: {
                        clusters: '$clusters'
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $in: ['$_id', '$$clusters']
                            }
                        }
                    },
                    {
                        $project: {
                            configuration: 0
                        }
                    },
                    {
                        $lookup: {
                            from: 'vms',
                            as: 'masterNode',
                            let: {
                                masterNode: '$master_node'
                            },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$masterNode']
                                    }
                                }
                            },

                            ]
                        }
                    },
                    {

                        $lookup: {
                            from: 'vms',
                            as: 'workerNodes',
                            let: {
                                workerNode: '$worker_node'
                            },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $in: ['$_id', '$$workerNode']
                                    }
                                }
                            },]
                        }
                    },
                    {
                        $unwind: '$masterNode'
                    }
                    ],

                }
            }
            ]);
            //  .skip((pageOptions.page - 1) * pageOptions.limit)
            //  .limit(pageOptions.limit);
            logger.debug('%s - Networks information returned.', method);

            return {
                status: 200,
                data: {
                    message: 'List of networks!',
                    data: result
                }
            };
        } catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    /**
     * Get network by id
     */
    static async getNetwork(id) {
        const method = 'getNetwork';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters id: %s', method, id);
        try {

            let networkall = await Network.aggregate([{
                $match: {
                    _id: mongoose.Types.ObjectId(id)
                }
            },
            {
                $lookup: {
                    from: 'clusters',
                    as: 'cluster',
                    let: {
                        clusterId: '$clusters'
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $in: ['$_id', '$$clusterId']
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'vms',
                            as: 'master_node',
                            let: {
                                master_node: '$master_node'
                            },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$master_node']
                                    }
                                },

                            },
                            {
                                $project: {
                                    ip: 1,
                                    password: 1
                                }
                            }
                            ]
                        }
                    },
                    {
                        $unwind: '$master_node'
                    },
                    {
                        $project: {
                            configuration: 0
                        }
                    }
                    ]
                }
            },
            ]);

            if (!networkall.length) {
                throw new Exceptions.NetworkNotFound();
            }

            return {
                status: 200,
                data: {
                    message: 'List of networks!',
                    data: networkall[0]
                }
            };

        } catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    /**
     * Update the network
     */
    static async updateNetwork(id, data) {
        const method = 'updateNetwork';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters id: %s', method, id);
        logger.debug('%s - has received the parameters data: %j', method, data);

        try {
            let result = await Network.findById(id);
            logger.debug('%s - Fetched the network infromation from database', method);

            if (!result) {
                throw new Exceptions.NetworkNotFound();
            }

            logger.debug('%s - Network: %j', method, result);

            result.description = data.description;
            await result.save();
            logger.debug('%s - Network information updated in the database', method);
            return {
                status: 200,
                data: {
                    message: 'Network has been updated successfully!',
                    data: result
                }
            };
        } catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    /**
     * Change the status of the network
     */
    static async updateNetworkStatus(id) {
        try {
            let result = await Network.findById(id);

            if (!result) {
                throw new Exceptions.NetworkNotFound();
            }

            result.status = !result.status;
            await result.save();

            return {
                status: 200,
                data: {
                    message: 'Network status has been updated successfully!',
                    data: result
                }
            };
        } catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    /**
     * Delete the network
     */
    static async deleteNetwork(id) {
        const method = 'deleteNetwork';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters id: %s', method, id);
        const KuberRepoObj = new KubernetesRepository();
        const KuberPVObj = new KubernetesPVRepository();
        try {
            let result = await Network.findById(id);
            logger.debug('%s - Fetched the network infromation from database', method);

            if (!result) {
                throw new Exceptions.NetworkNotFound();
            }

            logger.debug('%s - Network: %j', method, result);

            // Check cluster exists or not
            const cluster = await Cluster.findById(result.cluster_id);
            logger.debug('%s - Fetched the cluster infromation from database', method);

            if (!cluster) {
                throw new Exceptions.ClusterNotFound();
            }

            logger.debug('%s - Cluster: %j', method, cluster);

            // delete the namespace
            KuberRepoObj.setClient(cluster.configuration);
            await KuberRepoObj.deleteNamespace(result.namespace);

            // delete the pv
            const pvName = `nfs-pv-${result.namespace}`;
            KuberPVObj.setClient(cluster.configuration);
            await KuberPVObj.deletePvFromCluster(pvName);

            // Delete the network
            await result.delete();
            logger.debug('%s - Network deleted from database', method);

            return {
                status: 200,
                data: {
                    message: 'Network has been deleted successfully!'
                }
            };
        } catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    /**
     * Get list of pods in the network
     */
    static async getPodList(body) {
        try {
            const KuberRepoObj = new KubernetesRepository();
            const result = await Network.findById(body.networkid);

            if (!result) {
                throw new Exceptions.NetworkNotFound();
            }
            const cluster = await Cluster.findById(result.cluster_id);
            KuberRepoObj.setClient(cluster.configuration);
            let podlist = await KuberRepoObj.getPodList(result.namespace);

            // check if pods exists of not
            if (podlist.statusCode !== 200) {
                throw new Exceptions.PodlistNotFound();
            }


            // filter name and status from array
            let list = [];
            podlist.body.items.forEach(element => {
                let SinglPod = {
                    name: element.metadata.name,
                    status: element.status.phase,
                    creationTime: element.metadata.creationTimestamp,
                    containers: element.spec.containers
                };
                list.push(SinglPod);
            });

            // Responce
            return {
                status: 200,
                data: {
                    message: 'Pods found successfully!',
                    data: list
                    //         all :  podlist.body.items.
                }
            };
        } catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    /**
     * Get list of pods in the network
     */
    static async getPodLogs(body) {
        try {
            const result = await Network.findById(body.networkid);

            if (!result) {
                throw new Exceptions.NetworkNotFound();
            }
            const cluster = await Cluster.findById(result.cluster_id);
            KuberRepoObj.setClient(cluster.configuration);

            let container;
            let numberoflines;

            if (body.containername) {
                container = body.containername;
            }
            if (body.numberoflines) {
                numberoflines = body.numberoflines;
            }

            let podLogs = await KuberRepoObj.getPodLog(result.namespace, body.podname, container, numberoflines);

            // Responce
            return {
                status: 200,
                data: {
                    message: 'Pods logs found successfully!',
                    data: podLogs
                }
            };
        } catch (error) {
            return ErrorHandler.handleError(error);
        }
    }
}

module.exports = NetworkController;