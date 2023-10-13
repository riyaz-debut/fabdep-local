'use strict';

const Client = require('kubernetes-client').Client;
const KubeConfig = require('kubernetes-client').KubeConfig;
const Request = require('kubernetes-client/backends/request');
const namespaceFormat = {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: {
        name: 'custom-namespace'
    }
};
const logger = require('../repositry/utils').getLogger('KubernetesRepository');

class KubernetesRepository {

    /**
     * Setup the client
     * @param {*} config
     */
    setClient(config) {
        const kubeconfig = new KubeConfig();
        kubeconfig.loadFromString(JSON.stringify(config));
        const backend = new Request({ kubeconfig });
        this.client = new Client({ backend, version: '1.13' });
    }

    /**
     * Add the PV
     * @param {*} body
     */
    async addPv(body) {
        const method = 'addPv';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, body);
        return await this.client.api.v1.persistentvolumes.post({
            body: body
        });
    }

    /**
     * Delete the PV
     * @param {*} name
     */
    async deletePv(name) {
        const method = 'deletePv';
        logger.debug('%s - start', method);
        return this.client.api.v1.persistentvolumes(name).delete();
    }

    /**
     * Add PVC
     * @param {*} namespace
     * @param {*} body
     */
    async addPvc(namespace, body) {
        const method = 'addPvc';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters namespace: %s', method, namespace);
        logger.debug('%s - has received the parameters data: %j', method, body);
        return this.client.api.v1.namespaces(namespace).persistentvolumeclaims.post({
            body: body
        });
    }

    /**
     * Delete PVC
     * @param {*} namespace
     * @param {*} body
     */
    async deletePvc(namespace, name) {
        const method = 'deletePvc';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters namespace: %s', method, namespace);
        logger.debug('%s - has received the parameters name: %s', method, name);
        return this.client.api.v1.namespaces(namespace).persistentvolumeclaims(name).delete();
    }

    /**
     * Creates a service
     * @param {*} namespace
     * @param {*} body
     */
    async addService(namespace, body) {
        const method = 'addService';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters namespace: %s', method, namespace);
        logger.debug('%s - has received the parameters body: %j', method, body);
        return this.client.api.v1.namespaces(namespace).services.post({
            body: body
        });
    }

    /**
     * upate a service
     * @param {*} namespace
     * @param {*} body
     * @param {*} servicename
     */
    async updateService(namespace, body, servicename) {

        return this.client.api.v1.namespaces(namespace).services(servicename).patch({
            body: body
        });
    }

    /**
     * Delete a service
     * @param {*} namespace
     * @param {*} name
     */
    async deleteService(namespace, name) {
        return await this.client.api.v1.namespaces(namespace).services(name).delete();
    }
    /**
       * Delete a service
       * @param {*} namespace
       * @param {*} name
       */
    async fetchService(namespace, name) {
        return this.client.api.v1.namespaces(namespace).services(name).get();
    }

    /**
     * Creates a secret
     * @param {*} namespace
     * @param {*} body
     */
    async addSecret(namespace, body) {
        return this.client.api.v1.namespaces(namespace).secrets.post({
            body: body
        });
    }

    /**
     * Delete a secret
     * @param {*} namespace
     * @param {*} body
     */
    async deleteSecret(namespace, name) {
        return this.client.api.v1.namespaces(namespace).secrets(name).delete();
    }

    /**
    * Add  a deployment
    * To create a new Deployment in the specified namespace
    * @param {*} namespace
    * @param {*} body
    */
    async addDeployment(body, namespace) {
        const method = 'addDeployment';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters namespace: %s', method, namespace);
        logger.debug('%s - has received the parameters body: %j', method, body);
        return this.client.apis.apps.v1.namespaces(namespace).deployments.post({
            body: body
        });
    }





    /**
  * Add  a deployment
  * @param {*} namespace
  * @param {*} body
  */
    async getDeployment(name, namespace) {
        const method = 'getDeployment';
        return this.client.apis.apps.v1.namespaces(namespace).deployments(name).get();

    }

    /**
    * update  a deployment
    * @param {*} namespace
    * @param {*} body
    * @param {*} deploymentname
    */
    async updateDeployment(namespace, body, deploymentname) {
        return this.client.apis.apps.v1.namespaces(namespace).deployments(deploymentname).patch({
            body: body
        });
    }

    async deleteDeployment(namespace, name) {
        return await this.client.apis.apps.v1.namespaces(namespace).deployments(name).delete();
    }

    async addNamespace(name) {
        const method = 'addNamespace';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters name: %s', method, name);
        namespaceFormat.metadata.name = name;

        return await this.client.api.v1.namespaces.post({
            body: namespaceFormat
        });
    }

    async deleteNamespace(name) {
        const method = 'deleteNamespace';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters name: %s', method, name);
        return await this.client.api.v1.namespaces(name).delete();
    }

    async getPodList(namespace) {
        return await this.client.api.v1.namespaces(namespace).pods.get({
            qs: {
                pretty: true
            }
        });
    }

    async getPodLog(namespace, podname, Containername, numberoflines) {
        let query = {
            pretty: true,
            timestamps: true
        };
        if (Containername) { query.container = Containername; }
        if (numberoflines) { query.tailLines = numberoflines; }

        return await this.client.api.v1.namespaces(namespace).pods(podname).log.get({
            qs: query
        });
    }
}

module.exports = KubernetesRepository;
