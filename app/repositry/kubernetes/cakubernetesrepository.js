'use strict';

const KubernetesRepository = require('../kubernetesrepository');
const ansiblerepositry = require('../ansiblerepositry');
const ansibleRepoObj = new ansiblerepositry();

const config = require('../../../config');
const logger = require('../utils').getLogger('KubernetesCaRepository');
const utils = require('../../../utils/utils.js');

class KubernetesCaRepository extends KubernetesRepository {

    // move ca configuration to the cluster
    async moveCaConfig(data, namespace, vmdetails) {
        const method = 'moveCaConfig';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters data: %j', method, data);
        logger.debug('%s - has received the parameters vmdetails: %j', method, vmdetails);

        let sourcepath = `${utils.getCaBasePath(data.networkId.namespace, data.name)}/`;
        let destinationpath = `/home/export/${namespace}/${data.name}/`;
        logger.debug('%s - sourcepath: %s', method, sourcepath);
        logger.debug('%s - destinationpath: %s', method, destinationpath);
        console.log('********************************' + sourcepath);

        return await ansibleRepoObj.transferFilesToCluster(vmdetails, sourcepath, destinationpath);
    }

    /*
    * delete CA server
    */
    async  deletecaserver(data) {
        const deploymentResponce = await this.deleteDeployment('default', data.name);
        const serviceResponce = await this.deleteService('default', data.name);
        return {
            service: serviceResponce,
            deployment: deploymentResponce

        };
    }

    /**
       Deployment template for the CA server
     */
    getcadeployment(data, namespace) {
        const method = 'getcadeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, data);

        const CaDeploymentConfig = {
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
                replicas: 1,
                template: {
                    metadata: {
                        labels: {
                            app: data.name
                        }
                    },
                    spec: {
                        containers: [
                            {
                                image: `hyperledger/fabric-ca:${config.fabricVersion.version}`,
                                name: data.name,
                                imagePullPolicy: 'IfNotPresent',
                                command: [
                                    'sh',
                                    '-c',
                                    `fabric-ca-server start -d -b  ${data.admnId}:${data.admnSecret} --port ${data.port}`
                                ],
                                env: [
                                    {
                                        name: 'FABRIC_CA_SERVER_HOME',
                                        value: '/tmp/hyperledger/fabric-ca'
                                    },
                                    {
                                        name: 'FABRIC_CA_SERVER_CSR_CN',
                                        value: data.name
                                    },
                                    {
                                        name: 'FABRIC_CA_SERVER_CSR_HOSTS',
                                        value: '0.0.0.0'
                                    },
                                    {
                                        name: 'FABRIC_CA_SERVER_DEBUG',
                                        value: 'true'
                                    }
                                ],
                                ports: [
                                    {
                                        containerPort: data.port
                                    }
                                ],
                                volumeMounts: [
                                    {
                                        name: 'nfs-pvc',
                                        mountPath: '/tmp/hyperledger/fabric-ca',
                                        subPath: data.name
                                    }
                                ]
                            }
                        ],
                        volumes: [
                            {
                                name: 'nfs-pvc',
                                persistentVolumeClaim: {
                                    claimName: `nfs-pvc-${namespace}`
                                }
                            }
                        ]
                    }
                }
            }
        };
        logger.debug('%s - CaDeploymentConfig: %j', method, CaDeploymentConfig);
        return CaDeploymentConfig;
    }

    /**
       Service template for the CA server
     */
    getcaservice(data) {
        const method = 'getcaservice';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, data);

        const CaServiceConfig = {
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
                name: data.name
            },
            spec: {
                ports: [
                    {
                        port: data.port,
                        targetPort: data.port,
                        nodePort: data.port
                    }
                ],
                type: 'NodePort',
                selector: {
                    app: data.name
                }
            }
        };
        logger.debug('%s - CaServiceConfig: %j', method, CaServiceConfig);
        return CaServiceConfig;
    }
}

module.exports = KubernetesCaRepository;
