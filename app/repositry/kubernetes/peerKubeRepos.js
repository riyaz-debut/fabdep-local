'use strict';

const KubernetesRepository = require('../kubernetesrepository');
const Cluster = require('../../cluster/clusterModel'); // require model users
const ansiblerepositry = require('../ansiblerepositry');
const ansibleRepoObj = new ansiblerepositry();
const os = require('os');
const config = require('../../../config');
const logger = require('../utils').getLogger('KubernetesPeerRepository');

class KubernetesPeerRepository extends KubernetesRepository {

    async copyPeerMaterialToNfs(data, masterNode) {
        const method = 'copyPeerMaterislToNfs';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);
        logger.debug('%s - has received the parameters vmdetails: %j', method, masterNode);

        const configuration = data.clusterId.configuration;
        this.setClient(configuration);
        await this.copyCryptoMaterialToNfs(data, masterNode);
        return Promise.resolve({ data: 'successfully ' });
    }

    async createPeerService(data) {
        const method = 'createPeerService';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);

        try {
            const configuration = data.clusterId.configuration;
            this.setClient(configuration);
            const namespace = data.networkId.namespace;
            const peerServiceData = await this.getPeerService(data);
            const servicePeerResponce = await this.addService(namespace, peerServiceData);
            return Promise.resolve({ data: servicePeerResponce });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, httpStatus: 400 });
        }
    }

    async createPeerDeployment(data, masterNode) {
        const method = 'createPeerDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);
        logger.debug('%s - has received the parameters vmdetails: %j', method, masterNode);

        const configuration = data.clusterId.configuration;
        const namespace = data.networkId.namespace;

        this.setClient(configuration);
        const peerDeploymentData = await this.getPeerDeployment(data, masterNode);
        const deploymentPeerResponce = await this.addDeployment(peerDeploymentData, namespace);
        return Promise.resolve({ data: deploymentPeerResponce });
    }

    async getPeerKubernetesFiles(data, masterNode) {
        const peerDeploymentData = await this.getPeerDeployment(data, masterNode);
        const peerServiceData = await this.getPeerService(data);
        const couchServiceData = await this.getPeerCouchService(data);
        const couchDeploymentData = await this.getPeerCouchDeployment(data);
        return Promise.resolve({
            deploymentPeer: peerDeploymentData, servicePeer: peerServiceData,
            deploymentCouch: couchDeploymentData, serviceCouch: couchServiceData
        });
    }



    async fetchPeerDeployment(data) {
        const method = 'createPeerDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);

        const configuration = data.clusterId.configuration;
        const namespace = data.networkId.namespace;
        this.setClient(configuration);
        const deploymentResponce = await this.getDeployment(data.peer_enroll_id, namespace);
        return deploymentResponce;
    }


    async updatePeerDeployment(data, body) {
        const method = 'createPeerDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);
        const configuration = data.clusterId.configuration;
        const namespace = data.networkId.namespace;
        this.setClient(configuration);
        const deploymentResponce = await this.updateDeployment(namespace, body, data.peer_enroll_id);
        return deploymentResponce;
    }






    async createPeerCouchService(data, serviceType) {
        const method = 'createPeerCouchService';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);
        const configuration = data.clusterId.configuration;
        const namespace = data.networkId.namespace;
        this.setClient(configuration);
        const couchServiceData = await this.getPeerCouchService(data, serviceType);
        const serviceCouchResponce = await this.addService(namespace, couchServiceData);
        return Promise.resolve({ data: serviceCouchResponce });
    }

    async updateCouchService(data, serviceType) {
        const method = 'createPeerCouchService';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);
        const serviceName = `${data.name}-couch-${data.orgId.name}`.toLowerCase();
        const configuration = data.clusterId.configuration;
        const namespace = data.networkId.namespace;
        this.setClient(configuration);
        await this.deleteService(namespace, serviceName);
        const couchServiceData = await this.getPeerCouchService(data, serviceType);
        const serviceCouchResponce = await this.addService(namespace, couchServiceData);
        return Promise.resolve({ data: serviceCouchResponce });
    }

    async createPeerCouchDeployment(data) {
        const method = 'createPeerCouchDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);

        const configuration = data.clusterId.configuration;
        const namespace = data.networkId.namespace;
        this.setClient(configuration);
        const couchDeploymentData = await this.getPeerCouchDeployment(data);
        logger.debug('%s - Couch deploymemnt data: %j', method, couchDeploymentData);
        const deploymentCouchResponce = await this.addDeployment(couchDeploymentData, namespace);
        return Promise.resolve({ data: deploymentCouchResponce });
    }





    /**
        * create CA server
     */

    /*   async createPeerServer(data, masterNode) {
          const namespace = data.networkId.namespace
          await this.copyCryptoMaterialToNfs(data, masterNode);
          console.log(data);
          console.log(namespace);

          const peerServiceData = await this.getPeerService(data);
          const couchServiceData = await this.getPeerCouchService(data);

          const peerDeploymentData = await this.getPeerDeployment(data, masterNode);
          const couchDeploymentData = await this.getPeerCouchDeployment(data);

          console.log('config files done');
          const servicePeerResponce = await this.addService(namespace, peerServiceData);
          const serviceCouchResponce = await this.addService(namespace, couchServiceData);

          const deploymentPeerResponce = await this.addDeployment(namespace, peerDeploymentData);
          const deploymentCouchResponce = await this.addDeployment(namespace, couchDeploymentData);
          let responseData = {
              servicePeerResponce: servicePeerResponce,
              serviceCouchResponce: serviceCouchResponce,
              deploymentPeerResponce: deploymentPeerResponce,
              deploymentCouchResponce: deploymentCouchResponce
          };
          return Promise.resolve({ data: responseData });
      } */

    async copyCryptoMaterialToNfs(data, masterNode) {
        const method = 'copyPeerMaterislToNfs';
        logger.debug('%s - start', method);

        const configuration = data.clusterId.configuration;
        const namespace = data.networkId.namespace;
        const cluster = await Cluster.findById(data.clusterId._id);
        if (!cluster) {
            throw new Error('cluster not found');
        }

        const sourcepath = `${os.homedir}/${config.home}/${namespace}/${data.orgId.name}-${data.caId.name}/${data.name}-${data.orgId.name}`;
        let destinationpath = `/home/export/${namespace}/`;

        logger.debug('%s - namespace: %s', method, namespace);
        logger.debug('%s - sourcepath: %s', method, sourcepath);
        logger.debug('%s - destinationpath: %s', method, destinationpath);

        this.setClient(configuration);
        await ansibleRepoObj.transferFilesToCluster(masterNode, sourcepath, destinationpath);
        return Promise.resolve();
    }


    async deleteCryptoMaterialFromNfs(data, masterNode) {
        const method = 'deleteCryptoMaterialToNfs';
        logger.debug('%s - start', method);
        const configuration = data.clusterId.configuration;
        const namespace = data.networkId.namespace;
        const cluster = await Cluster.findById(data.clusterId._id);
        if (!cluster) {
            throw new exceptions.ClusterNotFound();
        }
        // let destinationpath = `/home/export/${namespace}/${data.name}`;
        let Couchservicename = `${data.name}-couch-${data.orgId.name}`.toLowerCase();
        let peerservicename = `${data.name}-${data.orgId.name}`.toLowerCase();

        let destinationpath = {
            crypto: `/home/export/${namespace}/${data.name}`,
            couch: `/home/export/${namespace}/${Couchservicename}`,
            peer: `/home/export/${namespace}/${peerservicename}`
        };
        logger.debug('%s - namespace: %s', method, namespace);
        logger.debug('%s - destinationpath: %s', method, destinationpath);
        this.setClient(configuration);
        await ansibleRepoObj.removePeerDirectoryFromCluster(masterNode, destinationpath);
        return Promise.resolve();
    }





    /**
    * delete CA server
    */
    async  deletePeerPod(data) {
        const deploymentResponce = await this.deleteDeployment('default', data.name);
        const serviceResponce = await this.deleteService('default', data.name);
        return {
            service: serviceResponce,
            deployment: deploymentResponce

        };
    }

    /**
     * Get deployment configuration for Peer
     */
    async getPeerDeployment(data, masterNode) {
        const method = 'getPeerDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);

        const couchName = `${data.name}-couch-${data.orgId.name}`.toLowerCase();
        const namespace = data.networkId.namespace;
        const PeerDeploymentConfig = {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
                name: data.peer_enroll_id
            },
            spec: {
                selector: {
                    matchLabels: {
                        app: data.peer_enroll_id
                    }
                },
                strategy: {
                    type: 'Recreate'
                },
                template: {
                    metadata: {
                        labels: {
                            app: data.peer_enroll_id
                        }
                    },
                    spec: {
                        // Not required if all peers are of same Kubenetes cluster
                        /*"hostAliases": [
                            {
                                "ip": masterNode.master_node.ip,
                                "hostnames": [
                                    "peer0-debut-com",
                                    "orderer0-debut",
                                    "orderer1-debut",
                                    "orderer2-debut",
                                    "orderer3-debut",
                                    "orderer4-debut"
                                ]
                            },
                            {
                                "ip": masterNode.master_node.ip,
                                "hostnames": [
                                    data.peer_enroll_id
                                ]
                            }
                        ], */
                        containers: [
                            {
                                image: `hyperledger/fabric-peer:${config.fabricVersion.version}`,
                                name: data.peer_enroll_id,
                                workingDir: '/opt/gopath/src/github.com/hyperledger/fabric/peer',
                                command: ['peer', 'node', 'start'],
                                env: [
                                    {
                                        name: 'CORE_PEER_ID',
                                        value: data.peer_enroll_id
                                    },
                                    {
                                        name: 'CORE_PEER_ADDRESS',
                                        value: data.peer_enroll_id + ':' + data.peerport,
                                    },
                                    {
                                        name: 'CORE_PEER_LISTENADDRESS',
                                        value: '0.0.0.0:' + data.peerport,
                                    },
                                    {
                                        name: 'CORE_PEER_CHAINCODELISTENADDRESS',
                                        value: '0.0.0.0:' + data.chaincodeport,
                                    },
                                    {
                                        name: 'CORE_PEER_GOSSIP_BOOTSTRAP',
                                        value: data.peer_enroll_id + ':' + data.peerport,
                                    },
                                    {
                                        name: 'CORE_PEER_GOSSIP_EXTERNALENDPOINT',
                                        value: data.peer_enroll_id + ':' + data.peerport // // peer0-debut-com:30751, Other peer enrollment Id
                                    },
                                    {
                                        name: 'CORE_PEER_LOCALMSPID',
                                        value: data.orgId.mspId

                                    },
                                    {
                                        name: 'CORE_VM_ENDPOINT',
                                        value: 'unix:///host/var/run/docker.sock'
                                    },
                                    {
                                        name: 'FABRIC_LOGGING_SPEC',
                                        value: config.FABRIC_LOGGING_SPEC
                                    },
                                    {
                                        name: 'CORE_PEER_TLS_ENABLED',
                                        value: 'true'
                                    },
                                    {
                                        name: 'CORE_PEER_GOSSIP_USELEADERELECTION',
                                        value: 'true'
                                    },
                                    {
                                        name: 'CORE_PEER_GOSSIP_ORGLEADER',
                                        value: 'false'
                                    },
                                    {
                                        name: 'CORE_PEER_PROFILE_ENABLED',
                                        value: 'true'
                                    },
                                    {
                                        name: 'CORE_PEER_TLS_CERT_FILE',
                                        value: '/etc/hyperledger/fabric/tls/server.crt'
                                    },
                                    {
                                        name: 'CORE_PEER_TLS_KEY_FILE',
                                        value: '/etc/hyperledger/fabric/tls/server.key'
                                    },
                                    {
                                        name: 'CORE_PEER_TLS_ROOTCERT_FILE',
                                        value: '/etc/hyperledger/fabric/tls/ca.crt'
                                    },
                                    {
                                        name: 'CORE_PEER_ADDRESSAUTODETECT',
                                        value: 'true'
                                    },
                                    {
                                        name: 'CORE_LEDGER_STATE_STATEDATABASE',
                                        value: 'CouchDB'
                                    },
                                    {
                                        name: 'CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS',
                                        value: `${couchName}:${data.couchdbport}`
                                    },
                                    {
                                        name: 'CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME',
                                        value: data.couchdbUsername
                                    },
                                    {
                                        name: 'CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD',
                                        value: data.couchdbPassword
                                    },
                                ],  // env


                                ports: [
                                    { containerPort: data.peerport },
                                    { containerPort: data.chaincodeport }
                                ],

                                volumeMounts: [
                                    {
                                        name: 'docker',
                                        mountPath: '/host/var/run/',
                                    },
                                    {
                                        name: 'nfs-pvc-' + namespace,
                                        mountPath: '/etc/hyperledger/fabric/msp',
                                        subPath: data.peer_enroll_id + '/msp',
                                    },
                                    {
                                        name: 'nfs-pvc-' + namespace,
                                        mountPath: '/etc/hyperledger/fabric/tls',
                                        subPath: data.peer_enroll_id + '/tls',
                                    },
                                    {
                                        name: 'nfs-pvc-' + namespace,
                                        mountPath: '/var/hyperledger/production',
                                        subPath: data.peer_enroll_id
                                    }
                                ]

                            } // container loc 115
                        ],  // container loc 114
                        // # CouchDB

                        volumes: [
                            {
                                name: 'nfs-pvc-' + namespace,
                                persistentVolumeClaim: {
                                    claimName: 'nfs-pvc-' + namespace
                                }
                            },
                            {
                                name: 'docker',
                                hostPath: {
                                    path: '/var/run',
                                    type: 'Directory'
                                }
                            }
                        ] // volume loc 339
                    } // spec loc 93
                }  // template
            } // spec loc 78
        };

        logger.debug('%s - couchName: %s', method, couchName);
        logger.debug('%s - namespace: %s', method, namespace);
        logger.debug('%s - PeerDeploymentConfig: %j', method, PeerDeploymentConfig);

        return PeerDeploymentConfig;
    }

    /**
     * Get configuration for CouchDB deployment for Peer
     */
    async getPeerCouchDeployment(data) {
        const method = 'getPeerCouchDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);

        const namespace = data.networkId.namespace;
        const couchName = `${data.name}-couch-${data.orgId.name}`.toLowerCase();
        const CouchDeploymentConfig = {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
                name: couchName
            },
            spec: {
                selector: {
                    matchLabels: {
                        app: couchName
                    }
                },
                strategy: {
                    type: 'Recreate'
                },
                template: {
                    metadata: {
                        labels: {
                            app: couchName
                        }
                    },
                    spec: {
                        containers: [
                            {
                                image: `hyperledger/fabric-couchdb:${config.couchVersion}`,
                                name: couchName,
                                env: [
                                    {
                                        name: 'COUCHDB_USER',
                                        value: data.couchdbUsername
                                    },
                                    {
                                        name: 'COUCHDB_PASSWORD',
                                        value: data.couchdbPassword
                                    }
                                ],
                                ports: [
                                    { containerPort: 5984 }
                                ],
                                volumeMounts: [
                                    {
                                        name: 'nfs-pvc-' + namespace,
                                        mountPath: '/opt/couchdb/data',
                                        subPath: couchName
                                    }
                                ]
                            }
                        ],
                        volumes: [
                            {
                                name: 'nfs-pvc-' + namespace,
                                persistentVolumeClaim: {
                                    claimName: 'nfs-pvc-' + namespace
                                }
                            },
                            {
                                name: 'docker',
                                hostPath: {
                                    path: '/var/run',
                                    type: 'Directory',
                                }
                            }
                        ]
                    } // spec
                } //template
            } // spec
        };

        logger.debug('%s - couchName: %s', method, couchName);
        logger.debug('%s - namespace: %s', method, namespace);
        logger.debug('%s - CouchDeploymentConfig: %j', method, CouchDeploymentConfig);

        return CouchDeploymentConfig;
    }

    /**
     * Get configuration for Peer Service
     */
    async getPeerService(data) {
        const method = 'getPeerService';
        logger.debug('%s - start', method);

        const CPeerServiceConfig = {
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
                name: data.peer_enroll_id
            },
            spec: {
                ports: [
                    {
                        port: data.peerport,
                        targetPort: data.peerport,
                        nodePort: data.peerport,
                        name: data.name + '-address'
                    },
                    {
                        port: data.chaincodeport,
                        targetPort: data.chaincodeport,
                        nodePort: data.chaincodeport,
                        name: data.name + '-chaincode'
                    }
                ],
                type: 'NodePort',
                selector: {
                    app: data.peer_enroll_id
                }
            }
        };
        logger.debug('%s - CPeerServiceConfig: %j', method, CPeerServiceConfig);
        return CPeerServiceConfig;
    }


    /**
     * Get configuration for Couch Service on Peer
     */
    async getPeerCouchService(data, serviceType) {
        const method = 'getPeerCouchService';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);

        const serviceName = `${data.name}-couch-${data.orgId.name}`.toLowerCase();
        let CPeerCouchServiceConfig
        if (serviceType === config.peer.CLUSTER_IP) {
            CPeerCouchServiceConfig = getClusterTypeCouchService(serviceName, data.couchdbport)
        } else {
            CPeerCouchServiceConfig = getNodePortTypeCouchService(serviceName, data.couchdbport)
        }

        logger.debug('%s - CPeerCouchServiceConfig: %j', method, CPeerCouchServiceConfig);
        return CPeerCouchServiceConfig;
    }


}
function getNodePortTypeCouchService(serviceName, couchdbport) {
    return {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: serviceName
        },
        spec: {
            ports: [
                {
                    port: couchdbport,
                    targetPort: 5984,
                    nodePort: couchdbport
                }
            ],
            type: config.peer.NODE_PORT,
            selector: {
                app: serviceName
            }
        }
    };

}
function getClusterTypeCouchService(serviceName, couchdbport) {
    return {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: serviceName
        },
        spec: {
            ports: [
                {
                    port: couchdbport,
                    targetPort: 5984,
                }
            ],
            type: config.peer.CLUSTER_IP,
            selector: {
                app: serviceName
            }
        }
    };

}

module.exports = KubernetesPeerRepository;