'use strict';

const ServiceRepository = require('./servicerepository');
const Cluster = require('../../cluster/clusterModel'); // require model users
const ansiblerepositry = require('../ansiblerepositry');
const ansibleRepoObj = new ansiblerepositry();
const os = require('os');
const config = require('../../../config');
const exceptions = require('../../errors/errors');
const logger = require('../utils').getLogger('KubernetesOrdererRepository');

class KubernetesOrdererRepository extends ServiceRepository {
    /**
     * Deploy  the Kubernetes Orderer service to the kubernetes
     * cluster
     */
    async createOrdererService(data, nameSpace) {
        const method = 'createOrdererService';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, data);

        const cluster = await Cluster.findById(data.orgId.clusterId);

        if (!cluster) {
            throw new exceptions.ClusterNotFound();
        }

        logger.debug('%s - nameSpace: %s', method, nameSpace);
        logger.debug('%s - cluster: %j', method, cluster);

        this.setClient(cluster.configuration);

        const serviceData = {
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
                name: data.name
            },
            spec: {
                ports: [{
                    port: data.port,
                    targetPort: data.port,
                    nodePort: data.port
                }],
                type: 'NodePort',
                selector: {
                    app: data.name
                }
            }
        };

        logger.debug('%s - serviceData: %j', method, serviceData);
        const serviceResponce = await this.addService(nameSpace, serviceData);
        return {
            service: serviceResponce
        };
    }

    /**
     * Deploy  the Kubernetes Orderer service to the kubernetes
     * cluster
     */
    async getOrdererService(data) {

        return {
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
                name: data.name
            },
            spec: {
                ports: [{
                    port: data.port,
                    targetPort: data.port,
                    nodePort: data.port
                }],
                type: 'NodePort',
                selector: {
                    app: data.name
                }
            }
        };


    }

    /**
     * Deploy the Kubernetes Orderer Deployment to the kubernetes
     * cluster
     */
    async createOrdererDeployment(data, nameSpace) {
        const method = 'createOrdererDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, data);

        const cluster = await Cluster.findById(data.orgId.clusterId);

        if (!cluster) {
            throw new exceptions.ClusterNotFound();
        }

        logger.debug('%s - nameSpace: %s', method, nameSpace);
        logger.debug('%s - cluster: %j', method, cluster);

        this.setClient(cluster.configuration);
        const deploymentData = this.getOrdererdeployment(data, nameSpace);
        const deploymentResponce = await this.addDeployment(deploymentData, nameSpace);
        return {
            deployment: deploymentResponce
        };
    }


    /**
     * get  orderer Deployment from the  kubernetes
     * cluster
     */
    async fetchOrdererDeployment(orderernode, nameSpace) {
        const method = 'fetchOrdererDeployment';
        this.setClient(orderernode.organisation.cluster.configuration);
        const deploymentResponce = await this.getDeployment(orderernode.name, nameSpace);
        return deploymentResponce;
    }



    async updateOrdererDeployment(orderernode, nameSpace, body) {
        // const method = 'getOrdererDeployment';
        this.setClient(orderernode.organisation.cluster.configuration);
        const deploymentResponce = await this.updateDeployment(nameSpace, body, orderernode.name);
        return deploymentResponce;
    }





    /**
     * Copy crypto material to the nFS
     */
    async copyCryptoMaterialToNfs(data, nameSpace, vmdetails) {
        const method = 'copyCryptoMaterialToNfs';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);
        logger.debug('%s - has received the parameters vmdetails: %j', method, vmdetails);

        const cluster = await Cluster.findById(data.caId.clusterId);
        if (!cluster) {
            throw new exceptions.ClusterNotFound();
        }
        const sourcepath = `${os.homedir}/${config.home}/${nameSpace}/${data.orgId.name}-${data.caId.name}/${data.name}`;
        let destinationpath = `/home/export/${nameSpace}/`;
        logger.debug('%s - nameSpace: %s', method, nameSpace);
        logger.debug('%s - sourcepath: %s', method, sourcepath);
        logger.debug('%s - destinationpath: %s', method, destinationpath);

        await ansibleRepoObj.transferFilesToCluster(vmdetails, sourcepath, destinationpath);
        return destinationpath;
    }

    /**
     * Copy channnel artifacts to the NFS
     */
    async copyChannelArtifactsToNfs(data, nameSpace, vmdetails) {
        const method = 'copyChannelArtifactsToNfs';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);
        logger.debug('%s - has received the parameters vmdetails: %j', method, vmdetails);

        const cluster = await Cluster.findById(data.caId.clusterId);
        if (!cluster) {
            throw new exceptions.ClusterNotFound();
        }

        const sourcepath = `${os.homedir}/${config.home}/${nameSpace}/${data.orgId.name}-${data.caId.name}/channel-artifacts`;
        let destinationpath = `/home/export/${nameSpace}/`;
        logger.debug('%s - nameSpace: %s', method, nameSpace);
        logger.debug('%s - sourcepath: %s', method, sourcepath);
        logger.debug('%s - destinationpath: %s', method, destinationpath);

        await ansibleRepoObj.transferFilesToCluster(vmdetails, sourcepath, destinationpath);
        return destinationpath;
    }

    /**
     * delete Orderer
     */
    async deleteOrderer(data) {
        const nameSpace = data.caId.networkId.namespace;
        const deploymentResponce = await this.deleteDeployment(nameSpace, data.name);
        const serviceResponce = await this.deleteService(nameSpace, data.name);

        return {
            service: serviceResponce,
            deployment: deploymentResponce
        };
    }

    /**
     * Generate  the Kubernetes Orderer Deployment file
     */
    getOrdererdeployment(data, namespace) {
        const method = 'getOrdererdeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, data);

        const ordererKubefile = {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
                name: data.name
            },
            spec: {
                selector: {
                    matchLabels: {
                        app: data.name
                    }
                },
                strategy: {
                    type: 'Recreate'
                },
                template: {
                    metadata: {
                        labels: {
                            app: data.name
                        }
                    },
                    spec: {
                        containers: [{
                            image: `hyperledger/fabric-orderer:${config.fabricVersion.version}`,
                            name: data.name,
                            command: ['orderer'],
                            env: [{
                                name: 'FABRIC_LOGGING_SPEC',
                                value: `${config.FABRIC_LOGGING_SPEC}`
                            },
                            {
                                name: 'ORDERER_GENERAL_GENESISFILE',
                                value: '/var/hyperledger/orderer/orderer.genesis.block'
                            },
                            {
                                name: 'ORDERER_GENERAL_GENESISMETHOD',
                                value: 'file'
                            },
                            {
                                name: 'ORDERER_GENERAL_LISTENADDRESS',
                                value: '0.0.0.0'
                            },
                            {
                                name: 'ORDERER_GENERAL_LISTENPORT',
                                value: `${data.port}`
                            },
                            {
                                name: 'ORDERER_GENERAL_LOCALMSPDIR',
                                value: '/var/hyperledger/orderer/msp'
                            },
                            {
                                name: 'ORDERER_GENERAL_LOCALMSPID',
                                value: data.orgId.mspId
                            },
                            {
                                name: 'ORDERER_GENERAL_TLS_CERTIFICATE',
                                value: '/var/hyperledger/orderer/tls/server.crt'
                            },
                            {
                                name: 'ORDERER_GENERAL_TLS_ENABLED',
                                value: 'true'
                            },
                            {
                                name: 'ORDERER_GENERAL_TLS_PRIVATEKEY',
                                value: '/var/hyperledger/orderer/tls/server.key'
                            },
                            {
                                name: 'ORDERER_GENERAL_TLS_ROOTCAS',
                                value: '[/var/hyperledger/orderer/tls/ca.crt]'
                            },
                            {
                                name: 'CORE_PEER_ADDRESSAUTODETECT',
                                value: 'true'
                            },
                            {
                                name: 'ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE',
                                value: '/var/hyperledger/orderer/tls/server.crt'
                            },
                            {
                                name: 'ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY',
                                value: '/var/hyperledger/orderer/tls/server.key'
                            },
                            {
                                name: 'ORDERER_GENERAL_CLUSTER_ROOTCAS',
                                value: '[/var/hyperledger/orderer/tls/ca.crt]'
                            }
                            ],
                            ports: [{
                                containerPort: data.port,
                            }],
                            volumeMounts: [{
                                mountPath: '/var/hyperledger/production/orderer',
                                name: 'nfs-pvc',
                                subPath: data.name
                            },
                            {
                                mountPath: '/var/hyperledger/orderer/orderer.genesis.block',
                                name: 'nfs-pvc',
                                subPath: 'channel-artifacts/genesis.block'
                            },
                            {
                                mountPath: '/var/hyperledger/orderer',
                                name: 'nfs-pvc',
                                subPath: `${data.name}/crypto`
                            }
                            ],
                            workingDir: '/opt/gopath/src/github.com/hyperledger/fabric'
                        }],
                        volumes: [{
                            name: 'nfs-pvc',
                            persistentVolumeClaim: {
                                claimName: `nfs-pvc-${namespace}`
                            }
                        }]
                    }
                }
            }
        };
        logger.debug('%s - ordererKubefile: %j', method, ordererKubefile);
        return ordererKubefile;
    }
}

module.exports = KubernetesOrdererRepository;