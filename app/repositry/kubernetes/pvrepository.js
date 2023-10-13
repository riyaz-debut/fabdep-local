'use strict';

const KubernetesRepository = require('../kubernetesrepository');
const logger = require('../utils').getLogger('KubernetesPVRepository');

class KubernetesPVRepository extends KubernetesRepository {

    /**
     * Sets the configuration for the PV
     */
    getPvConfig(data) {
        const method = 'getPvConfig';
        logger.debug('%s - start', method);
        const config = {
            apiVersion: 'v1',
            kind: 'PersistentVolume',
            metadata: {
                name: data.name,
                labels: {
                    name: data.name
                }
            },
            spec: {
                storageClassName: 'normal',
                capacity: {
                    storage: '100Gi'
                },
                accessModes: [
                    'ReadWriteMany'
                ],

                hostPath: {
                    path: '/mnt/worker/' + data.path
                }
            }
        };

        if (Object.prototype.hasOwnProperty.call(data, 'storage')) {
            config.spec.capacity.storage = data.storage;
        }

        return config;
    }

    /**
     * Sets the configuration for the PVC
     */
    getPvcConfig(data) {
        const method = 'getPvcConfig';
        logger.debug('%s - start', method);
        const config = {
            apiVersion: 'v1',
            kind: 'PersistentVolumeClaim',
            metadata: {
                name: data.name
            },
            spec: {
                accessModes: [
                    'ReadWriteMany'
                ],
                storageClassName: 'normal',
                selector: {
                    matchLabels: {
                        name: data.pvName
                    }
                },
                resources: {
                    requests: {
                        storage: '100Gi'
                    }
                }
            }
        };

        if (Object.prototype.hasOwnProperty.call(data, 'storage')) {
            config.spec.resources.requests.storage = data.storage;
        }

        return config;
    }

    /**
     * Add PV
     */
    async addPvToCluster(data) {
        const method = 'addPvToCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, data);
        return this.addPv(this.getPvConfig(data));
    }

    /**
     * Add PVC
     */
    async addPvcToCluster(namespace, data) {
        const method = 'addPvcToCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters namespace: %s', method, namespace);
        logger.debug('%s - has received the parameters data: %j', method, data);
        return this.addPvc(namespace, this.getPvcConfig(data));
    }

    /**
     * Delete PV
     */
    async deletePvFromCluster(name) {
        const method = 'deletePvFromCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters name: %s', method, name);
        return this.deletePv(name);
    }

    /**
     * Delete PVC
     */
    async deletePvcFromCluster(namespace, name) {
        return this.deletePvc(namespace, name);
    }
}

module.exports = KubernetesPVRepository;
