'use strict';

const async = require('async');
const Ansible = require('node-ansible');
const FileHandlerRepositry = require('./filehandlerrepositry');
const filehandlerobj = new FileHandlerRepositry();
const userHome = require('user-home');
const os = require('os');
const config = require('../../config');
const zip = require('is-zip-file');
const logger = require('./utils').getLogger('AnsibleRepositry');
const { handleAnsibleInfo, handleAnsibleError } = require('./utils');

class AnsibleRepositry {

    /**
     * Checks the VM's connection
     * Master and Worker both
     * Crates a inventor with the cluster id
     * @param {*} clusterData
     */
    async checkClusterConnection(clusterData) {
        const inventoryFile = await filehandlerobj.createClusterInventory(clusterData);
        const connectionData = new Ansible.AdHoc().module('ping').hosts('all');
        connectionData.inventory(inventoryFile.path);

        return connectionData.exec({ buffered: true });
    }

    /**
     * Setup the Master Node
     * @param {*} cluster
     * @param {*} master_vm
     */
    async addMasterToCluster(cluster, master_vm) {
        const method = 'addMasterToCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters cluster: %j', method, cluster);
        logger.debug('%s - has received the parameters master_vm: %j', method, master_vm);

        // Check the master vm connection
        const inventoryFile = await filehandlerobj.createhostfile(master_vm);

        // run the ansible playbook
        const playbook = './scripts/playbook/clusterMaster';
        logger.debug('%s - Playbook: %s', method, playbook);
        let ansiblePlaybook = new Ansible.Playbook().playbook(playbook).variables({
            cluster_id: cluster._id
        });
        logger.debug('%s - Inventory file path: %s', method, inventoryFile.path);

        ansiblePlaybook.inventory(inventoryFile.path);
        ansiblePlaybook.on('stdout', handleAnsibleInfo);
        ansiblePlaybook.on('stderr', handleAnsibleError);
        return ansiblePlaybook.exec();
    }

    /**
     * Clean the SSH key
     */
    async clearSSHKey() {
        const method = 'clearSSHKey';
        const playbook = './scripts/playbook/deleteSSHFile';
        logger.debug('%s - start', method);
        logger.debug('%s - Playbook: %s', method, playbook);

        // run the ansible playbook
        let ansiblePlaybook = new Ansible.Playbook().playbook(playbook);
        ansiblePlaybook.on('stdout', handleAnsibleInfo);
        ansiblePlaybook.on('stderr', handleAnsibleError);
        return ansiblePlaybook.exec();
    }

    /**
     * Setup the Master Node
     * @param {*} cluster
     * @param {*} master_vm
     */
    async setUpMasterNode(cluster, master_vm) {
        const method = 'setUpMasterNode';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters cluster: %j', method, cluster);
        logger.debug('%s - has received the parameters master_vm: %j', method, master_vm);

        // Check the master vm connection
        const inventoryFile = await filehandlerobj.createhostfile(master_vm);

        // run the ansible playbook
        const playbook = './scripts/playbook/clusterMaster';
        logger.debug('%s - Playbook: %s', method, playbook);
        let ansiblePlaybook = new Ansible.Playbook().playbook(playbook).variables({
            cluster_id: cluster._id
        });
        logger.debug('%s - Inventory file path: %s', method, inventoryFile.path);

        ansiblePlaybook.inventory(inventoryFile.path);
        ansiblePlaybook.on('stdout', handleAnsibleInfo);
        ansiblePlaybook.on('stderr', handleAnsibleError);
        return ansiblePlaybook.exec();
    }

    /**
     * Deploy the dashboard
     * @param {*} cluster
     * @param {*} master_vm
     */
    async deployDashboardToCluster(cluster, master_vm) {
        const method = 'deployDashboardToCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters cluster: %j', method, cluster);
        logger.debug('%s - has received the parameters master_vm: %j', method, master_vm);
        const inventoryFile = await filehandlerobj.createhostfile(master_vm);
        const playbook = './scripts/playbook/deployDashboard';
        logger.debug('%s - Playbook: %s', method, playbook);

        // run the ansible playbook
        let ansiblePlaybook = new Ansible.Playbook().playbook(playbook).variables({
            master_host: master_vm.ip,
            master_user: master_vm.username,
            master_password: master_vm.password,
            dashboard_port: cluster.dashboard_port
        });
        logger.debug('%s - Inventory file path: %s', method, inventoryFile.path);

        // Set the path for inventory
        ansiblePlaybook.inventory(inventoryFile.path);
        ansiblePlaybook.on('stdout', handleAnsibleInfo);
        ansiblePlaybook.on('stderr', handleAnsibleError);
        return ansiblePlaybook.exec();
    }

    /**
     * Setup the Workers
     * Creates the Inventory with the VM IP
     * @param {*} cluster
     * @param {*} master_vm
     * @param {*} worker_vms
     */
    async addWorkersToCluster(cluster, master_vm, worker_vms) {
        const method = 'addWorkersToCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters cluster: %j', method, cluster);
        logger.debug('%s - has received the parameters master_vm: %j', method, master_vm);
        logger.debug('%s - has received the parameters worker_vms: %j', method, worker_vms);

        await this.updateExportsFile(master_vm, worker_vms);

        return async.each(worker_vms, async function (worker_vm) {
            // create an inventory file for worker nodes
            const inventoryFile = await filehandlerobj.createhostfile(worker_vm);

            const playbook = './scripts/playbook/clusterWorker';
            logger.debug('%s - Playbook: %s', method, playbook);

            let ansiblePlaybook = new Ansible.Playbook().playbook(playbook).variables({
                nfs_server: master_vm.ip,
                cluster_id: cluster._id
            });

            logger.debug('%s - Inventory file path: %s', method, inventoryFile.path);

            ansiblePlaybook.inventory(inventoryFile.path);
            ansiblePlaybook.on('stdout', handleAnsibleInfo);
            ansiblePlaybook.on('stderr', handleAnsibleError);

            await ansiblePlaybook.exec();
        });
    }

    /**
     * Update the Master Node exports file
     * @param {*} master_vm
     * @param {*} worker_vms
     * @param {*} state
     */
    async updateExportsFile(master_vm, worker_vms, state = 'present') {
        const method = 'updateExportsFile';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters state: %s', method, state);
        logger.debug('%s - has received the parameters master_vm: %j', method, master_vm);
        logger.debug('%s - has received the parameters worker_vms: %j', method, worker_vms);
        const playbook = './scripts/playbook/updateExportsFile';
        logger.debug('%s - Playbook: %s', method, playbook);

        const NFSString = this.getNFSString(worker_vms);
        const masterInvetoryFile = await filehandlerobj.createhostfile(master_vm);
        let masterAnsible = new Ansible.Playbook().playbook(playbook)
            .variables({
                line: NFSString,
                state: state
            });

        logger.debug('%s - Inventory file path: %s', method, masterInvetoryFile.path);

        masterAnsible.inventory(masterInvetoryFile.path);
        masterAnsible.on('stdout', handleAnsibleInfo);
        masterAnsible.on('stderr', handleAnsibleError);
        return masterAnsible.exec();
    }

    /**
     *
     * @param {*} worker_vms
     */
    getNFSString(worker_vms) {
        const method = 'getNFSString';
        logger.debug('%s - start', method);
        let line = '';
        async.each(worker_vms, (worker_vm) => {
            line += this.getNFSLine(worker_vm) + '\n';
        });

        // remove the last \n from the string
        line = line.trim();
        return line;
    }

    /**
     * NFS Line
     * @param {*} workerNode
     */
    getNFSLine(workerNode) {
        const method = 'getNFSString';
        logger.debug('%s - start', method);
        return `/home/export ${workerNode.ip}(ro,rw,sync,no_subtree_check,no_root_squash,insecure)`;
    }

    /**
     * Delete the Worker from the Cluster
     * Creates a Inventory files with the VM IP
     * Fetchs the Master NFS exports file and removes the worker entry form it
     * Reupload the file to the Master
     * @param {*} cluster
     * @param {*} master_vm
     * @param {*} worker_vm
     */
    async deleteWorkerFromCluster(cluster, master_vm, worker_vm) {
        const method = 'deleteWorkerFromCluster';
        logger.debug('%s - start', method);
        await this.deleteWorker(cluster, master_vm, worker_vm);
        await this.updateExportsFile(master_vm, [worker_vm], 'absent');
        return true;
    }

    /**
     * Destroy the worker node
     * @param {*} cluster
     * @param {*} master_vm
     * @param {*} worker_vm
     */
    async deleteWorker(cluster, master_vm, worker_vm) {
        const method = 'deleteWorker';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters cluster: %j', method, cluster);
        logger.debug('%s - has received the parameters master_vm: %j', method, master_vm);
        logger.debug('%s - has received the parameters worker_vm: %j', method, worker_vm);
        const playbook = './scripts/playbook/clusterRemoveWorker';
        logger.debug('%s - Playbook: %s', method, playbook);
        // Setup the inventory for worker
        const inventoryFile = await filehandlerobj.createhostfile(worker_vm);
        let ansiblePlaybook = new Ansible.Playbook().playbook(playbook).variables({
            nfs_server: master_vm.ip
        });

        logger.debug('%s - Inventory file path: %s', method, inventoryFile.path);

        ansiblePlaybook.inventory(inventoryFile.path);
        ansiblePlaybook.on('stdout', handleAnsibleInfo);
        ansiblePlaybook.on('stderr', handleAnsibleError);
        await ansiblePlaybook.exec();
    }

    /**
     * Remove NSF line from file data
     * @param {*} fileData
     * @param {*} workerNode
     */
    removeNFSLine(fileData, workerNode) {
        let data_array = fileData.split('\n');
        let lastIndex;

        for (let i = data_array.length - 1; i > -1; i--) {
            if (data_array[i].match(workerNode.ip)) {
                lastIndex = i;
                break;
            }
        }
        delete data_array[lastIndex];

        return data_array.join('\n');
    }

    /**
     * Delete the cluster
     * @param {*} cluster
     */
    async removeCluster(cluster) {
        const method = 'removeCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received parameters %j', method, cluster);

        // Delete the cluster join command file
        await filehandlerobj.deleteFile(`${userHome}/${config.home}/join-command/${cluster._id}`);

        // Destroy the cluster
        await this.destroyCluster(cluster);
        await filehandlerobj.deleteFile(`./scripts/inventory/${cluster._id}`);
        return true;
    }

    /**
     * Destroy the cluster
     * @param {*} cluster
     */
    async destroyCluster(cluster) {
        const method = 'destroyCluster';
        logger.debug('%s - start', method);

        const playbook = './scripts/playbook/clusterDeleteMain';
        logger.debug('%s - Playbook: %s', method, playbook);

        let dashboard_port = cluster.dashboard_port ? cluster.dashboard_port : false;

        let inventoryFilePath = await filehandlerobj.createClusterInventory(cluster);
        let ansiblePlaybook = new Ansible.Playbook().playbook(playbook).variables({
            dashboard_port: dashboard_port
        });

        logger.debug('%s - Inventory file path: %s', method, inventoryFilePath.path);
        ansiblePlaybook.inventory(inventoryFilePath.path);
        ansiblePlaybook.on('stdout', handleAnsibleInfo);
        ansiblePlaybook.on('stderr', handleAnsibleError);
        return ansiblePlaybook.exec();
    }

    /**
     * Upload the chaincode zip file to the NFS server and then extracts it
     * @param {*} network
     * @param {*} cluster
     * @param {*} chaincodeData
     * @param {*} organisation
     */
    async uploadChaincodeToNFS(network, cluster, chaincodeData, organisation) {
        const sourcePath = `${os.homedir}/${config.home}/chaincode/${chaincodeData.path}`;
        const destinationPath = `/home/export/${network.name}/chaincode/${organisation.mspId}/${chaincodeData.name}-${chaincodeData.version}/`;
        await this.transferFilesToCluster(cluster.master_node, sourcePath, destinationPath);

        // check if the file has extension of zip the extract it on server
        if (zip.isZipSync(sourcePath)) {
            const zipPath = `${destinationPath}${chaincodeData.path}`;
            await this.extractZipFileOnServer(cluster.master_node, zipPath, destinationPath, true);
        }

        return true;
    }

    /**
     * Extracta a zip file on the server
     * @param {*} masterNode
     * @param {*} zipFile
     * @param {*} extractTo
     * @param {*} deleteFile
     */
    async extractZipFileOnServer(masterNode, zipFile, extractTo, deleteFile) {
        const inventoryFile = await filehandlerobj.createhostfile(masterNode);
        let ansiblePlaybook = new Ansible.Playbook().playbook('./scripts/playbook/extractZip').variables({
            zipFile: zipFile,
            extractTo: extractTo,
            deleteFile: deleteFile
        });

        ansiblePlaybook.inventory(inventoryFile.path);
        ansiblePlaybook.on('stdout', function (data) { console.info(data.toString()); });
        ansiblePlaybook.on('stderr', function (data) { console.error(data.toString()); });

        return ansiblePlaybook.exec();
    }

    async checkConnection(vmdata) {
        const method = 'checkConnection';
        logger.debug('%s - start', method);
        logger.debug('%s - has received parameters %j', method, vmdata);

        try {
            const hostfile = await filehandlerobj.createhostfile(vmdata);
            console.log("################### host file created ##########################")
            let connectionData = new Ansible.AdHoc().module('ping').hosts(vmdata.ip);
            connectionData.inventory(hostfile.path);
            let connectionResponce = await connectionData.exec({ buffered: true });
            console.log(connectionResponce)
            return Promise.resolve(connectionResponce);
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, status: 0 });
        }
    }

    async createCluster(filePath) {
        try {
            let inventoryFilePath = './scripts/inventory/' + filePath;
            let connectionData = new Ansible.Playbook().playbook('./scripts/playbook/clusterCreatemain');
            connectionData.inventory(inventoryFilePath);
            let connectionResponce = await connectionData.exec();
            return Promise.resolve(connectionResponce);
        } catch (err) {
            return Promise.reject({ message: err.message, status: 0 });
        }
    }

    async transferFilesToCluster(vmdetails, sourcepath, destinationpath) {
        const method = 'transferFilesToCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters sourcepath: %s', method, sourcepath);
        logger.debug('%s - has received the parameters destinationpath: %s', method, destinationpath);
        logger.debug('%s - has received the parameters vmdetails: %j', method, vmdetails);

        const playbook = './scripts/playbook/fileTransfer';
        logger.debug('%s - Playbook: %s', method, playbook);

        const inventoryFile = await filehandlerobj.createhostfile(vmdetails);
        let ansiblePlaybook = new Ansible.Playbook().playbook(playbook).variables({
            source: sourcepath,
            destination: destinationpath
        });

        logger.debug('%s - Inventory file path: %s', method, inventoryFile.path);

        ansiblePlaybook.inventory(inventoryFile.path);
        ansiblePlaybook.on('stdout', handleAnsibleInfo);
        ansiblePlaybook.on('stderr', handleAnsibleError);
        return await ansiblePlaybook.exec();
    }



    async removePeerDirectoryFromCluster(vmdetails, destinationpath) {
        const method = 'transferFilesToCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters destinationpath: %s', method, destinationpath);
        logger.debug('%s - has received the parameters vmdetails: %j', method, vmdetails);
        const playbook = './scripts/playbook/fileDelete';
        logger.debug('%s - Playbook: %s', method, playbook);
        const inventoryFile = await filehandlerobj.createhostfile(vmdetails);
        let ansiblePlaybook = new Ansible.Playbook().playbook(playbook).variables(destinationpath);
        logger.debug('%s - Inventory file path: %s', method, inventoryFile.path);
        ansiblePlaybook.inventory(inventoryFile.path);
        ansiblePlaybook.on('stdout', handleAnsibleInfo);
        ansiblePlaybook.on('stderr', handleAnsibleError);
        return await ansiblePlaybook.exec();
    }


    async fetchFilesFromCluster(vmdetails, sourcepath, destinationpath) {
        const method = 'fetchFilesFromCluster';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters vmdetails: %j', method, vmdetails);
        logger.debug('%s - has received the parameters sourcepath: %s', method, sourcepath);
        logger.debug('%s - has received the parameters destinationpath: %s', method, destinationpath);
        const playbook = './scripts/playbook/fetchfile';
        logger.debug('%s - Playbook: %s', method, playbook);
        const inventoryFile = await filehandlerobj.createhostfile(vmdetails);
        let ansiblePlaybook = new Ansible.Playbook().playbook(playbook).variables({
            source: sourcepath,
            destination: destinationpath
        });
        logger.debug('%s - Inventory file path: %s', method, inventoryFile.path);
        ansiblePlaybook.inventory(inventoryFile.path);
        ansiblePlaybook.on('stdout', handleAnsibleInfo);
        ansiblePlaybook.on('stderr', handleAnsibleError);
        return await ansiblePlaybook.exec();
    }
}

module.exports = AnsibleRepositry;
