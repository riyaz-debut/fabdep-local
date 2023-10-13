'use strict';

const KubernetesRepository = require('../kubernetesrepository');

class KubernetesServiceRepository extends KubernetesRepository {
    /**
     *
     * @param {*} data
     */
    getConfig(data) {
        const config = {
            apiVersion: 'v1',
            kind: 'Service',
            metadata: {
                name: data.name
            },
            spec: {
                ports: this.getPorts(data.ports),
                selector: {
                    app: data.name
                }
            }
        };

        if (Object.prototype.hasOwnProperty.call(data, 'type')) {
            config.spec.type = data.type;
        }

        return config;
    }

    /**
     * returns the port array object
     * @param {*} ports
     */
    getPorts(ports) {
        const portConfig = [];
        let i = 0;

        for (let port of ports) {
            portConfig.push({
                port: Number.parseInt(port),
                targetPort: Number.parseInt(port),
                nodePort: Number.parseInt(port),
                name: `${i}-${port}`
            });
        }

        return portConfig;
    }

    /**
     * Create Service
     */
    async createServcieInCluster(namespace, data) {
        return this.addService(namespace, this.getConfig(data));
    }

    /**
     * Delete Service
     */
    async deleteServcieInCluster(namespace, name) {
        return this.deleteService(namespace, name);
    }
}

module.exports = KubernetesServiceRepository;

