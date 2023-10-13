'use strict';

const KubernetesRepository = require('../kubernetesrepository');

class KubernetesSecretRepository extends KubernetesRepository {
    /**
     *
     * @param {*} data
     */
    getConfig(data) {
        const config = {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: {
                name: data.name
            },
            type: 'Opaque',
            data: data.data
        };

        return config;
    }

    /**
     * Create Service
     */
    async createSecretInCluster(namespace, data) {
        return this.addSecret(namespace, this.getConfig(data));
    }

    /**
     * Delete Service
     */
    async deleteSecretInCluster(namespace, name) {
        return this.deleteSecret(namespace, name);
    }
}

module.exports = KubernetesSecretRepository;

