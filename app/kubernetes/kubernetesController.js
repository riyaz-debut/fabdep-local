'use strict';

const Cluster = require('../cluster/clusterModel');
const KubernetesRepository = require('../repositry/kubernetesrepository');
const deploymentFile = require('../../scripts/deployment/nginx-deployment.json');
const serviceFile = require('../../scripts/deployment/nginx-service.json');
const pvFile = require('../../scripts/deployment/nginx-pv.json');
const pvcFile = require('../../scripts/deployment/nginx-pvc.json');
const ErrorHandler = require('../repositry/errorhandler');
const Exceptions = require('../errors/errors');
const KuberRepoObj = new KubernetesRepository();

class KubernetesController {

    /**
     * Adds the network to the db
     */
    static async addDeployment(clusteID) {
        try {
            // Check cluster exists or not
            const cluster = await Cluster.findById(clusteID);

            if (!cluster) {
                throw new Exceptions.ClusterNotFound();
            }

            KuberRepoObj.setClient(cluster.configuration);
            const service = await KuberRepoObj.addService('default', serviceFile);
            const deployment = await KuberRepoObj.addDeployment('default', deploymentFile);

            return {
                status: 200,
                data: {
                    message: 'deployment has been created successfully!',
                    data: {
                        deployment: deployment,
                        service: service
                    }
                }
            };
        }
        catch (error) {
            return ErrorHandler.handleError(error);
        }
    }



    /**
     * Adds the network to the db
     */
    static async updateDeployment(clusteID) {
        try {
            // Check cluster exists or not
            const cluster = await Cluster.findById(clusteID);

            if (!cluster) {
                throw new Exceptions.ClusterNotFound();
            }

            KuberRepoObj.setClient(cluster.configuration);
            const service = await KuberRepoObj.updateService('default', serviceFile, 'nginx');
            const deployment = await KuberRepoObj.updateDeployment('default', deploymentFile, 'nginx-deployment');

            return {
                status: 200,
                data: {
                    message: 'deployment has been created successfully!',
                    data: {
                        deployment: deployment,
                        service: service
                    }
                }
            };
        }
        catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    /**
     * Delete the deployments
     */
    static async deleteDeployment(clusteID) {
        try {
            // Check cluster exists or not
            const cluster = await Cluster.findById(clusteID);

            if (!cluster) {
                throw new Exceptions.ClusterNotFound();
            }

            KuberRepoObj.setClient(cluster.configuration);

            const deployment = await KuberRepoObj.deleteDeployment('default', deploymentFile.metadata.name);
            const service = await KuberRepoObj.deleteService('default', serviceFile.metadata.name);

            return {
                status: 200,
                data: {
                    message: 'deployment has been deleted successfully!',
                    data: {
                        deployment: deployment,
                        service: service
                    }
                }
            };
        }
        catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    /**
     * Delete the deployments
     */
    static async createPv(body) {
        try {
            const cluster = await Cluster.findById(body.clusterId);

            if (!cluster) {
                throw new Exceptions.ClusterNotFound();
            }


            pvFile.metadata.name = body.name;
            KuberRepoObj.setClient(cluster.configuration);
            const pv = await KuberRepoObj.addPv(pvFile);
            return {
                status: 200,
                data: {
                    message: 'pv  has been created successfully!',
                    data: pv
                }
            };
        }
        catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    static async deletePv(body) {
        try {
            const cluster = await Cluster.findById(body.clusterId);

            if (!cluster) {
                throw new Exceptions.ClusterNotFound();
            }
            KuberRepoObj.setClient(cluster.configuration);
            const pv = await KuberRepoObj.deletePv(body.name);
            return {
                status: 200,
                data: {
                    message: 'pv  has been deleted successfully!',
                    data: {
                        pv: pv,
                    }
                }
            };
        }
        catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    static async createPvc(body) {
        try {
            const cluster = await Cluster.findById(body.clusterId);

            if (!cluster) {
                throw new Exceptions.ClusterNotFound();
            }


            pvcFile.metadata.name = body.name;
            KuberRepoObj.setClient(cluster.configuration);
            const pv = await KuberRepoObj.addPvc('default', pvcFile);
            return {
                status: 200,
                data: {
                    message: 'pvc has been created successfully!',
                    data: {
                        pv: pv,
                    }
                }
            };
        }
        catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    static async deletePvc(body) {
        try {
            const cluster = await Cluster.findById(body.clusterId);

            if (!cluster) {
                throw new Exceptions.ClusterNotFound();
            }
            KuberRepoObj.setClient(cluster.configuration);
            const pv = await KuberRepoObj.deletePvc('default', body.name);
            return {
                status: 200,
                data: {
                    message: 'pvc  has been deleted successfully!',
                    data: {
                        pv: pv,
                    }
                }
            };
        }
        catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    static async createNamespace(body) {
        try {
            const cluster = await Cluster.findById(body.clusterId);

            if (!cluster) {
                throw new Exceptions.ClusterNotFound();
            }

            KuberRepoObj.setClient(cluster.configuration);
            const namespace = await KuberRepoObj.addNamespace(body.name);
            return {
                status: 200,
                data: {
                    message: 'Namespace  has been created successfully!',
                    data: namespace
                }
            };
        }
        catch (error) {
            return ErrorHandler.handleError(error);
        }
    }

    static async removeNamespace(body) {
        try {
            const cluster = await Cluster.findById(body.clusterId);

            if (!cluster) {
                throw new Exceptions.ClusterNotFound();
            }

            KuberRepoObj.setClient(cluster.configuration);
            const namespace = await KuberRepoObj.deleteNamespace(body.name);
            return {
                status: 200,
                data: {
                    message: 'Namespace deleted successfully!',
                    data: namespace
                }
            };
        }
        catch (error) {
            return ErrorHandler.handleError(error);
        }
    }
}

module.exports = KubernetesController;
