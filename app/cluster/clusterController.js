"use strict";

const mongoose = require("mongoose"); //orm for database
const clusters = require("./clusterModel"); // require model users
const ansiblerepositry = require("../repositry/ansiblerepositry");
const ansibleRepoObj = new ansiblerepositry();
const FileHandlerRepositry = require("../repositry/filehandlerrepositry");
const filehandlerobj = new FileHandlerRepositry();
const VM = require("../vm/vmModel");
const orgModel = require("./../orgManager/orgModel");
const caModel = require("./../caManager/caModel");
const Exceptions = require("../errors/errors");
const ErrorHandler = require("../repositry/errorhandler");
const logger = require("../repositry/utils").getLogger("ClusterController");

class ClusterController {
	static async checkIfIpBoundtoCluser(vmId) {
		const method = "checkIfIpBoundtoCluser";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, vmId);
		try {
			const cluster = await clusters.findOne({
				$or: [{ master_node: vmId }, { worker_node: { $in: vmId } }],
			});
			if (cluster) {
				return Promise.resolve(true);
			}
			return Promise.resolve(false);
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, status: 0 });
		}
	}
	/**
	 * Add the cluster
	 * @param {*} data
	 */
	async addCluster(data) {
		const method = "addCluster";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, data);

		try {
			const existingCluster = await clusters.findOne({
				$or: [{ master_node: data.master_node }, { name: data.name }],
			});
			if (existingCluster) {
				throw new Error(
					"Cluster alreday exists with the same name or  master node"
				);
			}
			// Prepare the data
			let clusterData = {
				name: data.name,
				master_node: data.master_node,
				// worker_node: data.worker_node,
				description: data.description,
				status: 1,
			};

			// Save it to db
			const cluster = await clusters.create(clusterData);
			logger.debug("%s - Cluster information saved to database", method);
			logger.debug("%s - Cluster information %j", cluster);
			logger.debug("%s - Cluster information updated in database", method);

			return {
				status: 200,
				data: {
					message: "Cluster has been created!",
					data: cluster,
				},
			};
		} catch (error) {
			return ErrorHandler.handleError(error);
		}
	}

	/**
	 * Setup Cluster dashboard
	 */
	async setupDashboard(data) {
		const method = "setupDashboard";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, data);

		try {
			// fetch cluster
			let cluster = await clusters.findById(data.clusterId);
			logger.debug("%s - Cluster fetched from the database", method);

			if (!cluster) {
			    throw new Exceptions.ClusterNotFound();
			}

			logger.debug('%s - Cluster: %j', method, cluster);

			// fetch master VM
			let master_vm = await VM.findOne({
			    _id: cluster.master_node,
			    type: 1
			});

			if (!master_vm) {
			    throw new Exceptions.VMNotFound();
			}

			// Get the total number of clusters
			// const totalClusters = await clusters.find({}, "dashboard_port");

			let dashboardPort = 9000;
			if (totalClusters.length) {
				var excludedPorts = totalClusters.map(
					({ dashboard_port }) => dashboard_port
				);
				dashboardPort = this.getFreePort(excludedPorts);
			}

			logger.debug('%s - Dashboard port: %s', method, dashboardPort);
            logger.debug('%s - master_vm: %s', method, master_vm)
			cluster.dashboard_port = dashboardPort;
			cluster.dashboard_url = `http://localhost:${dashboardPort}/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/`;
			await ansibleRepoObj.deployDashboardToCluster(cluster, master_vm);

			await cluster.save();
			logger.debug('%s - Cluster information updated in database', method);

			return {
			    status: 200,
			    data: {
			        message: 'Dashboard has been deployed successfully!'
			    }
			};
		} catch (error) {
			return ErrorHandler.handleError(error);
		}
	}

	/**
	 * Cluster list
	 */
	async listCluster() {
		const method = "listCluster";
		logger.debug("%s - start", method);
		try {
			const allClusters = await clusters.aggregate([
				{ $project: { configuration: 0 } },
				{
					$lookup: {
						from: "vms",
						as: "masterNode",
						let: { masterNode: "$master_node" },
						pipeline: [
							{ $match: { $expr: { $eq: ["$_id", "$$masterNode"] } } },
						],
					},
				},
				{
					$lookup: {
						from: "vms",
						as: "workerNodes",
						let: { workerNode: "$worker_node" },
						pipeline: [
							{ $match: { $expr: { $in: ["$_id", "$$workerNode"] } } },
						],
					},
				},
				{ $unwind: "$masterNode" },
			]);
			logger.debug("%s - Clusters information returned.", method);

			return {
				status: 200,
				data: {
					message: "List of networks!",
					data: allClusters,
				},
			};
		} catch (error) {
			return ErrorHandler.handleError(error);
		}
	}

	/**
	 * Setup Master to the cluster
	 * @param {*} data
	 */
	async setupMaster(data) {
		try {
			// fetch cluster
			let cluster = await clusters.findOne({
				_id: data.cluster_id,
			});

			if (!cluster) {
				throw new Exceptions.ClusterNotFound();
			}

			// find the master VM
			let master_vm = await VM.findOne({
				_id: cluster.master_node,
				type: 1,
			});

			if (!master_vm) {
				throw new Exceptions.VMNotFound();
			}

			// Setup the master node
			await ansibleRepoObj.addMasterToCluster(cluster, master_vm);

			// Change the config file
			const configrationFile = filehandlerobj.changeKubeConfig(master_vm);
			cluster.configuration = configrationFile;

			await cluster.save();

			return {
				status: 200,
				data: {
					data: cluster,
					message: "The master node has been configured!",
				},
			};
		} catch (error) {
			return ErrorHandler.handleError(error);
		}
	}

	/**
	 * Setup worker
	 * @param {*} data
	 */
	async setupWorkers(data) {
		try {
			// fetch cluster
			let cluster = await clusters.findOne({
				_id: data.cluster_id,
			});

			if (!cluster) {
				throw new Exceptions.ClusterNotFound();
			}

			// find the master VM
			let master_vm = await VM.findOne({
				_id: cluster.master_node,
				type: 1,
			});

			if (!master_vm) {
				throw new Exceptions.VMNotFound();
			}

			// check the workers node
			let worker_vms = await VM.find({
				_id: {
					$in: cluster.worker_node,
				},
				type: 2,
			});

			// Setup the workers
			await ansibleRepoObj.addWorkersToCluster(
				cluster,
				master_vm,
				worker_vms
			);

			return {
				status: 200,
				data: {
					data: cluster,
					message: "The worker nodes has been setup successfully!",
				},
			};
		} catch (error) {
			return ErrorHandler.handleError(error);
		}
	}

	/**
	 * Add the worker into cluster
	 */
	async addWorker(data) {
		const method = "addWorker";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, data);
		try {
			// fetch cluster
			let cluster = await clusters.findById(data.cluster_id);
			logger.debug("%s - Cluster fetched from the database", method);

			if (!cluster) {
				throw new Exceptions.ClusterNotFound();
			}

			logger.debug("%s - Cluster: %j", method, cluster);

			// fetch VM
			let worker_vm = await VM.findOne({
				_id: data.worker_vm_id,
				type: 2,
			});

			logger.debug("%s - Worker VM fetched from the database", method);

			if (!worker_vm) {
				throw new Exceptions.VMNotFound();
			}

			logger.debug("%s - Worker VM: %j", method, worker_vm);

			let index = cluster.worker_node.indexOf(data.worker_vm_id);
			if (index > -1) {
				logger.error(
					"%s - Worker VM already exists in the cluster",
					method
				);
				return {
					status: 400,
					data: {
						message: "Worker node already exists in the cluster!",
					},
				};
			}

			// find the master VM
			let master_vm = await VM.findOne({
				_id: cluster.master_node,
				type: 1,
			});

			logger.debug("%s - Master VM fetched from the database", method);

			if (!master_vm) {
				throw new Exceptions.VMNotFound();
			}

			logger.debug("%s - Master VM: %j", method, master_vm);

			await ansibleRepoObj.addWorkersToCluster(cluster, master_vm, [
				worker_vm,
			]);

			// Update the cluster details
			cluster.worker_node.push(data.worker_vm_id);
			await cluster.save();
			logger.debug("%s - Cluster information updated in database", method);

			return {
				status: 200,
				data: {
					message: "Worker node has been added to the cluster!",
					data: cluster,
				},
			};
		} catch (error) {
			return ErrorHandler.handleError(error);
		}
	}

	/**
	 * Delete the worker from cluster
	 * * @param {*} data
	 */
	async deleteWorker(data) {
		const method = "deleteWorker";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, data);
		try {
			// fetch cluster
			let cluster = await clusters.findById(data.cluster_id);
			logger.debug("%s - Cluster fetched from the database", method);

			if (!cluster) {
				throw new Exceptions.ClusterNotFound();
			}

			logger.debug("%s - Cluster: %j", method, cluster);

			// fetch VM
			let worker_vm = await VM.findOne({
				_id: data.worker_vm_id,
				type: 2,
			});

			logger.debug("%s - Worker VM fetched from the database", method);

			if (!worker_vm) {
				throw new Exceptions.VMNotFound();
			}

			logger.debug("%s - Worker VM: %j", method, worker_vm);

			// find the master VM
			let master_vm = await VM.findOne({
				_id: cluster.master_node,
				type: 1,
			});

			logger.debug("%s - Master VM fetched from the database", method);

			if (!master_vm) {
				throw new Exceptions.VMNotFound();
			}

			logger.debug("%s - Master VM: %j", method, master_vm);

			// Cluster minimum nodes
			if (cluster.worker_node.length === 1) {
				logger.error(
					"%s - Cluster must have minimum 1 worker nodes",
					method
				);
				return {
					status: 400,
					data: {
						message: "Cluster must have minimum 1 worker node!",
					},
				};
			}

			let index = cluster.worker_node.indexOf(data.worker_vm_id);
			if (index > -1) {
				await ansibleRepoObj.deleteWorkerFromCluster(
					cluster,
					master_vm,
					worker_vm
				);
				cluster.worker_node.splice(index, 1);
			} else {
				logger.error(
					"%s - Worker VM does not exists in the cluster",
					method
				);
				return {
					status: 400,
					data: {
						message: "Worker node is not part of this cluster!",
					},
				};
			}

			// Update the cluster details
			await cluster.save();
			logger.debug("%s - Cluster information updated in database", method);

			return {
				status: 200,
				data: {
					message: "Worker node has been removed from the cluster!",
					data: cluster,
				},
			};
		} catch (error) {
			return ErrorHandler.handleError(error);
		}
	}

	/**
	 * Delete the cluster
	 * @param {*} body
	 */
	async deleteCluster(body) {
		const method = "deleteCluster";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %j", method, body);
		try {
			// find the cluster
			const cluster = await this.getCluster(body.clusterId);
			logger.debug(
				"%s - Fetched the cluster information from database",
				method
			);

			if (!cluster) {
				throw new Exceptions.ClusterNotFound();
			}

			let caCount = await caModel.ca.count({ clusterId: body.clusterId });
			if (caCount > 0) {
				return {
					status: 400,
					data: {
						message:
							"Cluster is used in Certificate Authority, delete certificate Authority  first",
					},
				};
			}

			let orgCount = await orgModel.count({ clusterId: body.clusterId });
			if (orgCount > 0) {
				return {
					status: 400,
					data: {
						message:
							"Cluster is used in Organisation, delete organisation first",
					},
				};
			}

			// Destry the cluster
			await ansibleRepoObj.removeCluster(cluster);

			if (!cluster.remove()) {
				logger.error(
					"%s - Unable to delete the cluster from the database",
					method
				);
				return {
					status: 400,
					data: {
						message: "Unable to delete the cluster from the database!",
					},
				};
			}
			logger.debug("%s - Cluster deleted from the database", method);
			return {
				status: 200,
				data: {
					message: "Cluster has been deleted successfully!",
				},
			};
		} catch (error) {
			return ErrorHandler.handleError(error);
		}
	}

	async getCluster(clusterid) {
		const method = "getCluster";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %s", method, clusterid);
		try {
			let clusterData = await clusters
				.findOne({ _id: mongoose.Types.ObjectId(clusterid) })
				.populate({
					path: "master_node",
					select: "ip username password description",
					match: {
						status: { $eq: 1 },
					},
				})
				.populate({
					path: "worker_node",
					select: "ip username password description",
					match: { status: { $eq: 1 } },
				});
			logger.debug(
				"%s - Fetched the cluster infromation from database",
				method
			);
			if (!clusterData) {
				return Promise.reject({
					message: "Cluster does not exists",
					status: 0,
				});
			}
			return Promise.resolve(clusterData);
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, status: 0 });
		}
	}

	async updateCluster(body) {
		const method = "updateCluster";
		logger.debug("%s - start", method);
		logger.debug("%s - has received the parameters %s", method, body);
		try {
			let requestData = {
				name: body.name,
				description: body.description,
			};
			let clusterUpdate = await clusters.update(
				{ _id: mongoose.Types.ObjectId(body.clusterid) },
				requestData
			);
			logger.debug(
				"%s - Cluster infromation updated in the datanbase",
				method
			);
			return Promise.resolve(clusterUpdate);
		} catch (err) {
			logger.error("%s - Error: %s", method, err.message);
			return Promise.reject({ message: err.message, status: 0 });
		}
	}

	/**
	 * Get the free ports
	 * * @param {*} excludedPorts
	 */
	getFreePort(excludedPorts) {
		const method = "getFreePort";
		logger.debug("%s - start", method);
		logger.debug(
			"%s - has received the parameters %j",
			method,
			excludedPorts
		);
		let port;

		for (let i = 9000; i <= 9999; i++) {
			if (!excludedPorts.includes(i)) {
				port = i;
				break;
			}
		}

		return port;
	}
}

module.exports = ClusterController;
