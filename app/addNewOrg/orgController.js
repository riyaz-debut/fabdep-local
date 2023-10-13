"use strict";

// const { FileSystemWallet, Gateway } = require("fabric-network");
/**
 * changes according to fabric version 2.x
 */
const { Wallets, X509WalletMixin, Gateway } = require("fabric-network");
const fs = require("fs");
const os = require("os");
const shell = require("shelljs");

const util = require("util");
const utils = require("../../utils/utils");

const zip = require("is-zip-file");
const path = require("path");
const mongoose = require("mongoose"); //orm for database
const config = require("../../config");
const NewOrg = require("./orgModel");
const ChannelModel = require("../channel/channelModel");
const networkModel = require("../network/networkmodel");

const CA = require("../caManager/caModel");
const Peer = require("../peerManager/peerModel");
const Organisation = require("../orgManager/orgModel");
const Exception = require("../errors/errors");
const channelModel = require("../channel/channelModel");

const ErrorHandler = require("../repositry/errorhandler");
const logger = require("../repositry/utils").getLogger("orgController");
const orgConfig = require("./orgConfig");

const ordererModel = require('../orderingService/ordererModel');
const channelConfigtx = require('../channel/channelConfigtx');
class NewOrgController {
  /**
   * Upload the NewOrg to the NSF
   * @param {*} data
   * @param {*} NewOrgFile
   */
  static async uploadNewOrganization(data, orgFile) {
    console.log("Add new org fx")
    console.log("data ;", data)
    console.log("orgFile ;", orgFile)
    const method = "addNewOrganization";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters data: %j", method, data);
    logger.debug(
      "%s - has received the parameters chaincodeFile: %j",
      method,
      orgFile
    );
    try {
      // let mainpaths = "";

      // let savedChaincode = await Chaincode.findOne({
      //   name: data.name,
      //   version: data.version
      // });
      // if (savedChaincode) {
      //   logger.error(
      //     "%s - Chaincode already exists with same name and version",
      //     method
      //   );
      //   throw new Error("Chaincode already exists with same name and version");
      // }

      console.log("in try block")

      // Save the chaincode to the database
      const orgData = {
        name: data.name,
        mspId: data.mspId,
        peers: data.peers,
      };

      console.log("orgData :", orgData)

      // Save to db
      // const result = await Chaincode.create(chaincodeData);
      // logger.debug("%s - Chaincode added into database", method);

      return {
        status: 200,
        data: {
          message: "Org data fetched successfully!",
          data: orgData
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
    
  }

  /**
   * Install the chaincode
   * @param {*} data
   */
   static async addNewOrganization(data) {
    console.log("in addNewOrganization Fx")
    const method = "addNewOrganization";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      const peers = await Peer.find({
        _id: { $in: data.peerIds }
      })
        .populate({
          path: "orgId",
          populate: {
            path: "clusterId",
            populate: {
              path: "master_node"
            }
          }
        })
        .populate("caId")
        .populate("networkId");

      if (!peers.length) {
        throw new Exception.PeerNotFound();
      }
      let peer = peers[0];
      logger.debug("%s - Peers fetched from database %j", method, peers);
      
      // get the peer names on which we have to install the chaincode
      const targetPeers = [];
      peers.forEach(peer => {
        targetPeers.push(peer.peer_enroll_id);
      });
      logger.debug(
        "%s - TargetPeers fetched from database %j",
        method,
        targetPeers
      );
      
      const orgAdmin = await CA.orgAdmin.findOne({
        _id: peer.orgId.adminId
      });
      if (!orgAdmin) {
        throw new Exception.OrgAdminNotFound();
      }

      logger.debug(
        "%s - Organisation Admin fetched from database %j",
        method,
        orgAdmin
      );

      // channel and orderer details
      let channelDetailArray = await channelConfigtx.fetchChannelPrereqsiteData(data);
      if (!channelDetailArray.length) {
        throw new Exception.ChannelNotFound();
      }
      let channelDetail = channelDetailArray[0];
      if (!channelDetail) {
        throw new Exception.ChannelNotFound();
      }
      
      let ordererDetail = await ordererModel.ordererService
        .findById({
            _id: channelDetail.ordererserviceId
        })
        .populate({
            path: 'orgId',
            populate: {
                path: 'adminId'
            },
        })
        .populate('caId')
        .populate('tlsCaId');
      if (!ordererDetail) {
        throw new Exception.OrdereringServiceNotFound();
      }

      let orderernode = await ordererModel.ordererNode.findOne({
          orderingServiceId: ordererDetail._id,
      }).populate('orgId')
          .populate('caId')
          .populate('tlsCaId');

      if (!orderernode) {
        throw new Exception.OrdererNodesNotFound();
      }

      const basePath = utils.getBasePath(
        peer.networkId.namespace,
        peer.orgId.name,
        peer.caId.name
      );
      // const walletPath = `${basePath}/wallet`;
      
      // //changes according to fabric version 2.x
      // const wallet = await Wallets.newFileSystemWallet(walletPath);
      // logger.debug("%s - basePath: %s", method, basePath);

      // await NewOrgController.userExists(wallet, orgAdmin.admnId);

      // const ccp = await connectionFileConfig.connectionFile(peers);

      // // Gateway
      // const gateway = new Gateway();
      // await gateway.connect(ccp, {
      //   wallet,
      //   identity: orgAdmin.admnId,
      //   discovery: {
      //     enabled: true,
      //     asLocalhost: true
      //   }
      // });

      let message = "";
      
      // let configBlockResult = await orgConfig.fetchConfigBlock(peer, orderernode, channelDetail.name)
      // console.log("configBlockResult :", configBlockResult)

      // let configBlockToJsonResult = await orgConfig.decodeConfigBlockToJson(peer, orderernode, channelDetail.name)
      // console.log("configBlockToJsonResult :", configBlockToJsonResult)

      // let appendNewOrgConfigResult = await orgConfig.appendNewOrgConfig(peer, orderernode, channelDetail.name)
      // console.log("appendNewOrgConfigResult :", appendNewOrgConfigResult)
      
      // let encodeDecodeConfigurationResult = await orgConfig.encodeDecodeConfiguration(peer, orderernode, channelDetail.name)
      // console.log("encodeDecodeConfigurationResult :", encodeDecodeConfigurationResult)

      // let createEnvelopeConfigurationResult = await orgConfig.createEnvelopeConfiguration(peer, orderernode, channelDetail.name)
      // console.log("createEnvelopeConfigurationResult :", createEnvelopeConfigurationResult)
      
      // let signUpdateResult = await orgConfig.signUpdate(peer, orderernode, channelDetail.name)
      // console.log("signUpdateResult :", signUpdateResult)

      let fetchUpdatedChannelBlockResult = await orgConfig.fetchUpdatedChannelBlock(peer, orderernode, channelDetail.name)
      console.log("fetchUpdatedChannelBlockResult :", fetchUpdatedChannelBlockResult)

      return {
        status: 200,
        data: fetchUpdatedChannelBlockResult
      };
    
    } catch (error) {
      console.log(
        "##################################################################"
      );
      return ErrorHandler.handleError(error);
    }
  }
  
  static async userExists(wallet, user) {
    const method = "userExists";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %s", method, user);

    // const userExists = await wallet.exists(user);

    const userExists = await wallet.get(`${user}`);

		if (!userExists) {
      logger.error("%s - %s user does not exists in wallet", method, user);
      throw new Error(`Please enroll: ${user}`);
    }

    return true;
  }

}

module.exports = NewOrgController;
