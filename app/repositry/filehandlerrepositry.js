'use strict';

const userHome = require('user-home');
const fs = require('fs');
const util = require('util');
const yaml = require('js-yaml');
const writeFile = util.promisify(fs.writeFile);
const logger = require('./utils').getLogger('FileHandlerRepositry');

class FileHandlerRepositry {

    /**
     * Creates the Cluster inventory file
     * File will have two groups i.e masters, workers
     * File name will Cluster ID
     * @param {*} clusterData
     */
    async createClusterInventory(clusterData) {
        const method = 'createClusterInventory';
        logger.debug('%s - start', method);
        // File name
        let inventoryFilePath = './scripts/inventory/' + clusterData._id;
        logger.debug('%s - File to be created: %s', method, inventoryFilePath);

        // Start building file
        let connectionString = '[masters]';
        let master_node_password = `'${clusterData.master_node.password}'`
        connectionString += '\n';
        connectionString += clusterData.master_node.ip + ' ansible_host=' + clusterData.master_node.ip + '  ansible_user=' + clusterData.master_node.username + '   ansible_password=' + master_node_password + '   ansible_become_password=' + master_node_password + '  ansible_port=22';
        connectionString += '\n';

        connectionString += '[workers]';

        connectionString += '\n';

        clusterData.worker_node.forEach(element => {
            let worker_node_password = `'${element.password}'`
            connectionString += element.ip + ' ansible_host=' + element.ip + '  ansible_user=' + element.username + '   ansible_password=' + worker_node_password + '   ansible_become_password=' + worker_node_password + '  ansible_port=22';
            connectionString += '\n';
        });

        await writeFile(inventoryFilePath, connectionString);

        return { path: inventoryFilePath };
    }

    /**
     * Creates a Inventort file for VM
     * @param {*} vmdata
     */
    async createhostfile(vmdata) {
        const method = 'createhostfile';
        logger.debug('%s - start', method);
        logger.debug('%s - has received parameters %j', method, vmdata);
        let hostfilepath = './scripts/inventory/' + vmdata.ip;
        logger.debug('%s - creating the file at path: %s', method, hostfilepath);
        let password = `'${vmdata.password}'`

        let connectionString = vmdata.ip + ' ansible_host=' + vmdata.ip + '  ansible_user=' + vmdata.username + '   ansible_password=' + password + '  ansible_port=22 ansible_become_password=' + password;

        console.log("#################### in filehandlerrepository #######################")
        console.log(connectionString)

        await writeFile(hostfilepath, connectionString);

        return { path: hostfilepath };
    }

    async deleteInventory(filePath) {
        const method = 'deleteInventory';
        logger.debug('%s - start', method);
        logger.debug('%s - has received parameters filepath: %s', method, filePath);
        try {
            let inventoryFilePath = './scripts/inventory/' + filePath;
            logger.debug('%s - File to be deleted: %s', method, inventoryFilePath);
            let deleteFile = await fs.unlinkSync(inventoryFilePath);
            logger.debug('%s - File %s has been deleted', method, inventoryFilePath);
            return Promise.resolve({ message: 'success', status: 1, data: deleteFile });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, status: 0 });
        }
    }

    /*  async createhostfile2(vmdata) {
         return new Promise((resolve, reject) => {
             try {

                 // file write object
                 let hostfilepath = ".app/scripts/hosts/" + vmdata.ip;
                 let connectionString = vmdata.ip + " ansible_host=" + vmdata.ip + "  ansible_user=" + vmdata.username + "   ansible_password=" + vmdata.password + "  ansible_port=22";


                 var writeStream = fs.createWriteStream(hostfilepath);
                 writeStream.write(connectionString);
                 writeStream.end();

                 writeStream.on('error', function (err) {
                     reject({ message: err.message, status: 0 });
                 });

                 writeStream.on('finish', function () {
                     resolve({ message: "success", status: 1, path: hostfilepath });
                 });

             } catch (err) {
                 reject({ message: err.message, status: 0 });
             }
         })


     }
    */

    /**
     * Change the kubeconfig file master server address
     * @param {*} master
     */
    changeKubeConfig(master) {
        const method = 'changeKubeConfig';
        logger.debug('%s - start', method);
        logger.debug('%s - has received parameters: %j', method, master);

        const filePath = userHome + '/' + master.ip.trim() + '/home/' + master.username + '/.kube/config';
        const hostAddress = 'https://' + master.ip.trim() + ':6443';

        logger.debug('%s - filePath: %s', method, filePath);
        logger.debug('%s - hostAddress: %s', method, hostAddress);

        let fileData = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
        fileData.clusters[0].cluster.server = hostAddress;
        return fileData;
    }

    /**
     * Delete a file at given path
     * @param {*} path
     */
    async deleteFile(path) {
        const method = 'deleteFile';
        logger.debug('%s - start', method);
        logger.debug('%s - has received parameters path: %s', method, path);

        if (fs.existsSync(path)) {
            await fs.unlinkSync(path);
        }

        return true;
    }
}

module.exports = FileHandlerRepositry;
