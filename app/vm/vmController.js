'use strict';
const mongoose = require('mongoose');
const vms = require('./vmModel');
const ansiblerepositry = require('../repositry/ansiblerepositry');
const ansibleRepoObj = new ansiblerepositry();
const FileHandlerRepositry = require('../repositry/filehandlerrepositry');
const filehandlerobj = new FileHandlerRepositry();
const clusterController = require('../cluster/clusterController')
const logger = require('../repositry/utils').getLogger('VMController');

class VmController {

    async addVm(body) {
        const method = 'addVm';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, body);

        try {
            let vmData = {
                ip: body.ip,
                username: body.username,
                password: body.password,
                description: body.description,
                type: body.type,
                status: 1,
            };
            if (body.clusterId) { vmData.clusterId = body.clusterId; }

            // Delete the SSH
            await ansibleRepoObj.clearSSHKey();
            let connection = await ansibleRepoObj.checkConnection(vmData);
            console.log("############## in vmController ##############")
            console.log(connection)
            if (connection) {
                console.log("###################### in connection block (vmController) ####################")
                let vm = await vms.findOne({ ip: body.ip })
                if (vm) {
                    logger.debug('%s - Check if vm is already attached to the cluster or not.', method);
                    let isIpBound = await clusterController.checkIfIpBoundtoCluser(vm._id)
                    if (isIpBound) {
                        return Promise.reject({ message: 'Ip is already bound to Other Cluster!', status: 0 });
                    }
                }
                logger.debug('%s - VM connection established.', method);
                let vmInsert = await vms.findOneAndUpdate({ ip: body.ip }, vmData, {
                    new: true,
                    upsert: true
                });
                logger.debug('%s - VM information saved to database.', method);
                return Promise.resolve(vmInsert);
            }

            logger.error('%s - VM connection not established.', method);

            return Promise.reject({ message: 'Please check the VM details!', status: 0 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, status: 0 });
        }
    }

    async updateVm(body) {
        const method = 'updateVm';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, body);

        try {
            let vmData = {
                ip: body.ip,
                username: body.username,
                password: body.password,
                description: body.description,
                type: body.type,
                status: 1,
            };

            if (body.clusterId) {
                vmData.clusterId = body.clusterId;
            }

            let connection = await ansibleRepoObj.checkConnection(vmData);

            if (connection) {
                logger.debug('%s - VM connection established.', method);
                await vms.update({ _id: mongoose.Types.ObjectId(body.vmid) }, vmData);
                logger.debug('%s - VM information saved to database.', method);
                return Promise.resolve(connection);
            }

            logger.error('%s - VM connection not established.', method);

            return Promise.reject({ message: err.message, status: 0 });
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, status: 0 });
        }
    }

    async listVms() {
        const method = 'listVms';
        logger.debug('%s - start', method);
        try {
            let allVms = await vms.find({});
            logger.debug('%s - VM information returned.', method);
            return Promise.resolve(allVms);
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, status: 0 });
        }
    }

    async getVm(vmId) {
        const method = 'listVms';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters vmId:%s', method, vmId);
        try {
            let vmData = await vms.findOne({ _id: mongoose.Types.ObjectId(vmId) });
            logger.debug('%s - VM information returned.', method);
            return Promise.resolve(vmData);
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, status: 0 });
        }
    }

    async deleteVm(body) {
        const method = 'listVms';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters %j', method, body);
        try {
            let vmData = await this.getVm(body.vmId);
            logger.debug('%s - Fetched VM information from database %j', method, vmData);
            await vms.find({ _id: mongoose.Types.ObjectId(body.vmId) }).remove();
            logger.debug('%s - VM %s deleted from database.', method, vmData._id);
            let Filedelete = await filehandlerobj.deleteInventory(vmData.ip);
            return Promise.resolve(Filedelete);
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, status: 0 });
        }
    }

    async checkconnectionVm(vmId) {
        const method = 'checkconnectionVm';
        logger.debug('%s - start', method);
        logger.debug('%s - has received the parameters vmId: %s', method, vmId);

        try {
            let vmData = await vms.findOne({ _id: mongoose.Types.ObjectId(vmId) });
            logger.debug('%s - Fetched VM information from database %j', method, vmData);
            let connection = await ansibleRepoObj.checkConnection(vmData);
            logger.debug('%s - VM connection established.', method);
            return Promise.resolve(connection);
        } catch (err) {
            logger.error('%s - Error: %s', method, err.message);
            return Promise.reject({ message: err.message, status: 0 });
        }
    }
}

module.exports = VmController;
