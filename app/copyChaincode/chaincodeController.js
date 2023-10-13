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
const Chaincode = require("./chaincodeModel");
const ChannelModel = require("../channel/channelModel");
const networkModel = require("./../network/networkmodel");

const ChaincodeInstantiated = require("./instantiatedChaincodeModel");
const CA = require("../caManager/caModel");
const Peer = require("../peerManager/peerModel");
const Organisation = require("../orgManager/orgModel");
const Exception = require("../errors/errors");
const channelModel = require("../channel/channelModel");

const ErrorHandler = require("../repositry/errorhandler");
const logger = require("../repositry/utils").getLogger("ChaincodeController");
const connectionFileConfig = require("./chaincodeConfig");

const ordererModel = require('../orderingService/ordererModel');
const channelConfigtx = require('../channel/channelConfigtx');
class ChaincodeController {
  /**
   * Upload the chaincode to the NSF
   * @param {*} data
   * @param {*} chaincodeFile
   */
  static async uploadChaincode(data, chaincodeFile) {

    // contain more organizations than the chaincode endorsement policy because peers 
    // must have the private data to endorse transactions.For example, in a channel 
    // with ten organizations,five of the organizations are included in a private data 
    // collection policy, but the endorsement policy requires three organizations to endorse
    //  a transaction.
    console.log("upload chaincode fx")
    const method = "uploadChaincode";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters data: %j", method, data);
    logger.debug(
      "%s - has received the parameters chaincodeFile: %j",
      method,
      chaincodeFile
    );
    try {
      let mainpaths = "";

      let savedChaincode = await Chaincode.findOne({
        name: data.name,
        version: data.version
      });
      if (savedChaincode) {
        logger.error(
          "%s - Chaincode already exists with same name and version",
          method
        );
        throw new Error("Chaincode already exists with same name and version");
      }

      // Check the chaincode file
      await ChaincodeController.validateChaincode(chaincodeFile);

      let chaincodeMainPath = `${chaincodeFile.destination}`;
      
      let fileName = chaincodeFile.originalname.replace('.zip', "")

      logger.debug("%s - chaincodeMainPath: %s", method, chaincodeMainPath);
      // ChaincodeAlreadyInPath 
      /* if (fs.existsSync(`${chaincodeMainPath}${fileName}`)) {
      //   throw new Exception.ChaincodeAlreadyInPath();
      } */

      // find the main path
      if (zip.isZipSync(chaincodeFile.path)) {
        logger.debug("%s - Uploaded file is zip", method);

        // extract the files
        await shell.exec(
          `unzip -o -d ${chaincodeMainPath} ${chaincodeFile.path}`
        );

        logger.debug("%s - File unzipped", method, chaincodeMainPath);
        let sourcefolderPath = `${chaincodeMainPath}${fileName}`
        if (data.type == config.GOLANG) {
          shell.exec(`cd ${sourcefolderPath} && GO111MODULE=on go mod vendor`)
          mainpaths = await shell
            .exec(`grep -liR 'shim.start' ${sourcefolderPath}`)
            .split("\n")
            .filter(Boolean);

          if (!mainpaths.length) {
            throw new Exception.ChaincodeMainFunctionNotFound();
          }
          else if (mainpaths.length !== 1) {
            throw new Exception.ChaincodeMainMoreThanOne();
          }
          mainpaths = path.dirname(mainpaths[0].replace(chaincodeMainPath, ""));
          logger.debug("%s - mainpaths: %j", method, mainpaths);

        }
        else {
          mainpaths = sourcefolderPath
        }
        // Get the folder name where the main package is stored
      } else {
        throw new Exception.ChaincodeOnlySupportsZipFiles();
      }

      // Save the chaincode to the database
      const chaincodeData = {
        name: data.name,
        type: data.type,
        version: data.version,
        sequence: data.sequence,
        path: chaincodeFile.filename,
        networkId: data.networkId,
        mainPath: mainpaths,
        installedOn: []
      };

      // Save to db
      const result = await Chaincode.create(chaincodeData);
      logger.debug("%s - Chaincode added into database", method);

      return {
        status: 200,
        data: {
          message: "Chaincode has been uploaded successfully!",
          data: result
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  }

  /**
   * File is valid or not
   * @param {*} chaincodeFile
   */
  static async validateChaincode(chaincodeFile) {
    const method = "validateChaincode";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, chaincodeFile);

    // If the file is not uploaded
    if (!chaincodeFile) {
      throw new Exception.UploadChaincde();
    }

    // Uploaded file exists?
    if (!fs.existsSync(chaincodeFile.path)) {
      throw new Exception.UploadChaincde();
    }

    const extension = path.extname(chaincodeFile.path);

    // Check for the extensions
    if (!(zip.isZipSync(chaincodeFile.path) || extension === ".go")) {
      throw new Exception.ChaincdoeFileFormat();
    }

    return true;
  }

  /**
   * List the uploaded chaincodes
   * @param {*} orgId
   */
  static async queryUploadedChaincodes(data) {
    const method = "queryUploadedChaincodes";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      const pageOptions = {
        page: Number.parseInt(data.page) || 1,
        limit: Number.parseInt(data.limit) || 10
      };

      const organisation = await Organisation.findById(data.orgId);
      console.log("organisation :", organisation)
      if (!organisation) {
        throw new Exception.OrganisationNotFound();
      }

      logger.debug(
        "%s - Organisation fetched from database %j",
        method,
        organisation
      );

      let filter = {};
      filter.orgId = data.orgId;
      console.log("filter :", filter)
      if (data.hasOwnProperty("installed")) {
        if (data.installed) {
          filter.installedOn = {
            $exists: true,
            $ne: []
          };
        } else {
          filter.installedOn = {
            $exists: true,
            $eq: []
          };
        }
      }

      logger.debug("%s - filter: %j", method, filter);

      const result = await Chaincode.find(filter)
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit);
      logger.debug("%s - Chaincode returned from database", method);
      console.log("result :", result)
      return {
        status: 200,
        data: {
          message: "List of chaincodes!",
          data: result
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  }

  /**
   * List the uploaded chaincodes
   * @param {*} orgId
   * */

  static async listInstalledChaincodesByNetwork(data) {
    const method = "queryUploadedChaincodes";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      let existingnetwork = await networkModel.findById({
        _id: mongoose.Types.ObjectId(data.networkId)
      });
      if (!existingnetwork) {
        throw new Error("Network does not exist");
      }

      const listchaincodes = await Chaincode.aggregate([
        {
          $match: {
            networkId: mongoose.Types.ObjectId(data.networkId)
          }
        },
        {
          $lookup: {
            from: "peers",
            as: "peers",
            let: {
              allpeer: "$installedOn"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$allpeer"]
                  }
                }
              },
              {
                $lookup: {
                  from: "organisations",
                  as: "organisation",
                  let: {
                    orgId: "$orgId"
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ["$_id", "$$orgId"]
                        }
                      }
                    }
                  ]
                }
              },
              {
                $unwind: "$organisation"
              }
            ]
          }
        },
        {
          $lookup: {
            from: "networks",
            as: "network",
            let: {
              networkId: "$networkId"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$networkId"]
                  }
                }
              }
            ]
          }
        },
        {
          $unwind: "$network"
        }
      ]);
      return {
        status: 200,
        data: {
          message: "List of chaincodes!",
          data: listchaincodes
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  }

  /**
   * List the uploaded chaincodes
   * @param {*} orgId
   * */

  static async listInstalledChaincodesByNe(data) {
    const method = "queryUploadedChaincodes";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      let existingnetwork = await networkModel.findById({
        _id: mongoose.Types.ObjectId(data.networkId)
      });
      if (!existingnetwork) {
        throw new Error("Network does not exist");
      }

      const listchaincodes = await Chaincode.aggregate([
        {
          $match: {
            networkId: mongoose.Types.ObjectId(data.networkId)
          }
        },
        {
          $lookup: {
            from: "peers",
            as: "peers",
            let: {
              allpeer: "$installedOn"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$allpeer"]
                  }
                }
              },
              {
                $lookup: {
                  from: "organisations",
                  as: "organisation",
                  let: {
                    orgId: "$orgId"
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ["$_id", "$$orgId"]
                        }
                      }
                    }
                  ]
                }
              },
              {
                $unwind: "$organisation"
              }
            ]
          }
        },
        {
          $lookup: {
            from: "networks",
            as: "network",
            let: {
              networkId: "$networkId"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$networkId"]
                  }
                }
              }
            ]
          }
        },
        {
          $unwind: "$network"
        }
      ]);
      return {
        status: 200,
        data: {
          message: "List of chaincodes!",
          data: listchaincodes
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  }

  /**
   * List the uploaded chaincodes
   * @param {*} orgId
   * */

  static async chainCodeDetail(data) {
    const method = "queryUploadedChaincodes";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      const listchaincodes = await Chaincode.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(data.chaincodeId)
          }
        },
        {
          $lookup: {
            from: "peers",
            as: "peers",
            let: {
              allpeer: "$installedOn"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$allpeer"]
                  }
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: "networks",
            as: "network",
            let: {
              networkId: "$networkId"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$networkId"]
                  }
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: "instantiated_chaincodes",
            as: "instantiated",
            let: {
              chaincodeId: "$_id"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$chaincodeId", "$$chaincodeId"]
                  }
                }
              }
            ]
          }
        },
        {
          $unwind: "$network"
        }
      ]);
      if (!listchaincodes.length) {
        throw new Error("Chaincode not found");
      }
      return {
        status: 200,
        data: {
          message: "Success",
          data: listchaincodes[0]
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
  static async installChaincode(data) {
    console.log("in installCC Fx")
    const method = "installChaincode";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      const chaincode = await Chaincode.findById(data.chaincodeId);
      if (!chaincode) {
        throw new Exception.ChaincodeNotFound();
      }

      logger.debug(
        "%s - Chaincode fetched from database %j",
        method,
        chaincode
      );
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
      const walletPath = `${basePath}/wallet`;
      
      //changes according to fabric version 2.x
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      logger.debug("%s - basePath: %s", method, basePath);

      await ChaincodeController.userExists(wallet, orgAdmin.admnId);

      const ccp = await connectionFileConfig.connectionFile(peers);

      // Gateway
      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: orgAdmin.admnId,
        discovery: {
          enabled: true,
          asLocalhost: true
        }
      });

      // path where to install chaincode
      let goPath = `${os.homedir}/go/src`;

      /**
       * chaincode changes according to fabric version 2.x
       */
      let message = "";
      
      // chaincode processes(package, install, approve, commit readiness, commit)
      let packageCCResult = await connectionFileConfig.packageChaincode(peer, orderernode, chaincode, goPath)
      if (packageCCResult.status === 'SUCCESS') {
        logger.debug('%s - success %j', method, packageCCResult);
        let installCCResult = await connectionFileConfig.installChaincode(peers, orderernode, chaincode)
        if (installCCResult.status === 'SUCCESS') {
          logger.debug('%s - success %j', method, installCCResult);
          let installedOn = installCCResult.installedOn,
          failedOn = installCCResult.failedOn;
          if (installedOn.length === 0) {
            message = "Chaincode has not been installed in any peer";
          } else if (failedOn.length) {
            message = "Chaincode has been installed on some peers";
          } else {
            chaincode.installedOn = installedOn.concat(chaincode.installedOn);
            await chaincode.save();
            message = "Chaincode has been installed on all peers";
          }
          let queryInstallCCResult = await connectionFileConfig.queryInstallChaincode(peers, orderernode, chaincode, goPath)
          if (queryInstallCCResult.status === 'SUCCESS') {
            logger.debug('%s - success %j', method, queryInstallCCResult);
            let approveCCResult = await connectionFileConfig.approveChaincode(peer, orderernode, chaincode, channelDetail.name, goPath)
            if (approveCCResult.status === 'SUCCESS') {
              logger.debug('%s - success %j', method, approveCCResult);
              let checkCommitCCResult = await connectionFileConfig.checkCommitReadiness(peer, orderernode, chaincode, channelDetail.name)
              if (checkCommitCCResult.status === 'SUCCESS') {
                logger.debug('%s - success %j', method, checkCommitCCResult);
                let commitChaincodeResult = await connectionFileConfig.commitChaincode(peer, orderernode, chaincode, channelDetail.name)
                if (commitChaincodeResult.status === 'SUCCESS') {
                  logger.debug('%s - success %j', method, commitChaincodeResult);
                  message = "commit chaincode on peer successfully";
                  await gateway.disconnect();
                  
                  return {
                    status: 200,
                    data: {
                      message: message,
                      installedOn: installedOn,
                      failedOn: failedOn
                    }
                  };
                }
                return ErrorHandler.handleError(error);
              }
              return ErrorHandler.handleError(error); 
            }
            return ErrorHandler.handleError(error);
          }
          return ErrorHandler.handleError(error);
        }
        return ErrorHandler.handleError(error);
      }
      return ErrorHandler.handleError(error);
    
    } catch (error) {
      console.log(
        "##################################################################"
      );
      return ErrorHandler.handleError(error);
    }
  }

  /**
   * List of Installed chaincode
   * @param {*} peerId
   */
  static async queryInstalledChaincodes(data) {
    const method = "queryInstalledChaincodes";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      const peer = await Peer.findById(data.peerId)
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

      if (!peer) {
        throw new Exception.PeerNotFound();
      }

      logger.debug("%s - Peers fetched from database %j", method, peer);

      const orgAdmin = await CA.orgAdmin.findOne({
        _id: peer.orgId.adminId
      });

      if (!orgAdmin) {
        throw new Exception.OrgAdminNotFound();
      }

      logger.debug(
        "%s - Org Admin information fetched from database %j",
        method,
        orgAdmin
      );

      const basePath = utils.getBasePath(
        peer.networkId.namespace,
        peer.orgId.name,
        peer.caId.name
      );
      // const basePath = `${os.homedir}/${config.home}/${peer.orgId.name}-${peer.caId.name}`;
      // const wallet = new FileSystemWallet(`${basePath}/wallet`);

      //changes according to fabric version 2.x
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      logger.debug("%s - basePath: %s", method, basePath);
      await ChaincodeController.userExists(wallet, orgAdmin.admnId);
      const ccp = await connectionFileConfig.connectionFile(peer);
      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: orgAdmin.admnId,
        discovery: {
          enabled: true,
          asLocalhost: false
        }
      });

      const client = gateway.getClient();
      const fabricPeer = client.getPeer(peer.peer_enroll_id);

      let result = await client.queryInstalledChaincodes(fabricPeer, true);
      logger.debug("%s - Chaincode list returned", method);
      await gateway.disconnect();

      return {
        status: 200,
        data: {
          message: "Chaincode has been installed successfully!",
          data: result
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  }

  /**
   * Instantiate the chaincode on network`
   * @param {*} data
   */
  static async instantiateChaincode(data) {
    const method = "instantiateChaincode";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      const chaincode = await Chaincode.findById(data.chaincodeId).populate(
        "orgId"
      );

      if (!chaincode) {
        throw new Error("Chaincode not found");
      }


      logger.debug(
        "%s - Chaincode information fetched from database %j",
        method,
        chaincode
      );

      const targetPeer = await Peer.findById(data.peerId)
        .populate("orgId")
        .populate("networkId");
      if (!targetPeer) {
        throw new Error("Target peer not found");
      }

      logger.debug(
        "%s - Chaincode information fetched from database %j",
        method,
        chaincode
      );

      const channel = await ChannelModel.channel.findById(data.channelId);

      if (!channel) {
        throw new Exception.ChannelNotFound();
      }

      logger.debug(
        "%s - Channel information fetched from database %j",
        method,
        channel
      );

      const chaincodeInstantiated = await ChaincodeInstantiated.findOne({ chaincodeId: data.chaincodeId, channelId: data.channelId })
      if (chaincodeInstantiated) {
        throw new Error("Chaincode already instantiated install higher version and retry");
      }
      /* let instantiatedChaincode = await ChaincodeInstantiated.findOne({
                channelId: channel._id,
                orgId: chaincode.orgId,
                name: chaincode.name,
                status: 1
            });

            if (instantiatedChaincode) {
                throw new Exception.ChaincodeAlreadyInstantiated();
            } */

      const ca = await CA.ca.findById(targetPeer.orgId.caId);

      if (!ca) {
        throw new Exception.CANotFound();
      }

      logger.debug("%s - CA information fetched from database %j", method, ca);

      const orgAdmin = await CA.orgAdmin.findOne({
        _id: targetPeer.orgId.adminId
      });

      if (!orgAdmin) {
        throw new Exception.OrgAdminNotFound();
      }

      logger.debug(
        "%s - Org Admin information fetched from database %j",
        method,
        orgAdmin
      );

      /* const peers = await Peer.find({
                orgId: chaincode.orgId._id,
                _id: {
                    $in: chaincode.installedOn
                }
            });

            const targetPeers = peers.map((peer) => {
                return peer.peer_enroll_id;
            }); */

      // const basePath = `${os.homedir}/${config.home}/${targetPeer.orgId.name}-${ca.name}`;

      const basePath = utils.getBasePath(
        targetPeer.networkId.namespace,
        targetPeer.orgId.name,
        ca.name
      );
      // const wallet = new FileSystemWallet(`${basePath}/wallet`);

      //changes according to fabric version 2.x
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      logger.debug("%s - basePath: %s", method, basePath);

      await ChaincodeController.userExists(wallet, orgAdmin.admnId);

      const ccpPath = `${os.homedir}/${config.home}/channel/${channel.name}/${targetPeer.orgId.name}/config.json`;
      const ccpJSON = fs.readFileSync(ccpPath, "utf8");
      const ccp = JSON.parse(ccpJSON);
      logger.debug("%s - ccpPath: %s", method, ccpPath);

      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: orgAdmin.admnId,
        discovery: {
          enabled: true,
          asLocalhost: false
        }
      });
      const client = gateway.getClient();
      const fabricChannel = client.getChannel(channel.name);
      const tx_id = client.newTransactionID(true);

      let proposalResponse = await fabricChannel.sendInstantiateProposal({
        //targets: targetPeers,
        chaincodeId: chaincode.name,
        chaincodeVersion: chaincode.version,
        chaincodeType: chaincode.type,
        txId: tx_id,
        fcn: data.fcn ? data.fcn : "init",
        args: data.args ? data.args : [],
        "endorsement-policy": data.endorsement,
        'collections-config': data.pvDataConfig

      });

      const proposalResponses = proposalResponse[0];
      const proposal = proposalResponse[1];

      // check the results to decide if we should send the endorsment to be orderered
      if (proposalResponses[0] instanceof Error) {
        logger.error("%s - Proposal failed", method);
        throw proposalResponses[0];
      }

      if (
        !(
          proposalResponses[0].response &&
          proposalResponses[0].response.status === 200
        )
      ) {
        const error_message = util.format(
          "Invoke chaincode proposal:: %j",
          proposalResponses[0]
        );
        logger.error("%s - Proposal failed %s", method, error_message);
        throw new Error(error_message);
      }

      logger.debug("%s - Proposal sent successfully!", method);

      const result = await fabricChannel.sendTransaction({
        proposalResponses: proposalResponses,
        proposal: proposal
      });

      logger.debug("%s - Transaction sent to orderer!", method);

      await gateway.disconnect();

      // Save the entry for this organisation
      await ChaincodeInstantiated.create({
        channelId: channel._id,
        chaincodeId: chaincode._id,
        name: chaincode.name,
        endorsement_policy: data.endorsement,
        status: 1
      });
      logger.debug(
        "%s - Chaincode instanntiation record added in database!",
        method
      );

      return {
        status: 200,
        data: {
          message: "Chaincode has been instantiated successfully!",
          data: result
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  }

  /**
   * Upgrade the chaincode on network
   * @param {*} data
   */
  static async upgradeChaincode(data) {
    const method = "instantiateChaincode";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      const chaincode = await Chaincode.findById(data.chaincodeId).populate(
        "orgId"
      );

      if (!chaincode) {
        throw new Error("Chaincode not found");
      }

      logger.debug(
        "%s - Chaincode information fetched from database %j",
        method,
        chaincode
      );
      const channel = await ChannelModel.channel.findById(data.channelId);

      if (!channel) {
        throw new Exception.ChannelNotFound();
      }

      logger.debug(
        "%s - Channel information fetched from database %j",
        method,
        channel
      );

      const chaincodeInstantiated = await ChaincodeInstantiated.findOne({ chaincodeId: data.chaincodeId, channelId: data.channelId })
      if (chaincodeInstantiated) {
        throw new Error("Chaincode already upgraded install higher version and retry");
      }

      const targetPeer = await Peer.findById(data.peerId)
        .populate("orgId")
        .populate("networkId");
      if (!targetPeer) {
        throw new Error("Target peer not found");
      }
      const ca = await CA.ca.findById(targetPeer.orgId.caId);

      if (!ca) {
        throw new Exception.CANotFound();
      }

      logger.debug("%s - CA information fetched from database %j", method, ca);

      let instantiatedChaincode = await ChaincodeInstantiated.findOne({
        channelId: channel._id,
        name: chaincode.name,
        status: 1
      });

      if (!instantiatedChaincode) {
        throw new Exception.ChaincodeNotInstantiated();
      }

      logger.debug(
        "%s - Instantiated chaincode information fetched from database %j",
        method,
        instantiatedChaincode
      );

      const orgAdmin = await CA.orgAdmin.findById(targetPeer.orgId.adminId);

      if (!orgAdmin) {
        throw new Exception.OrgAdminNotFound();
      }

      logger.debug(
        "%s - Org Admin information fetched from database %j",
        method,
        orgAdmin
      );

      //  const basePath = `${os.homedir}/${config.home}/${targetPeer.orgId.name}-${ca.name}`;

      const basePath = utils.getBasePath(
        targetPeer.networkId.namespace,
        targetPeer.orgId.name,
        ca.name
      );

      // const wallet = new FileSystemWallet(`${basePath}/wallet`);

      //changes according to fabric version 2.x
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      logger.debug("%s - basePath: %s", method, basePath);

      await ChaincodeController.userExists(wallet, orgAdmin.admnId);

      const ccpPath = `${os.homedir}/${config.home}/channel/${channel.name}/${targetPeer.orgId.name}/config.json`;
      const ccpJSON = fs.readFileSync(ccpPath, "utf8");
      const ccp = JSON.parse(ccpJSON);
      logger.debug("%s - ccpPath: %s", method, ccpPath);

      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: orgAdmin.admnId,
        discovery: {
          enabled: true,
          asLocalhost: false
        }
      });
      const client = gateway.getClient();
      const fabricChannel = client.getChannel(channel.name);
      const tx_id = client.newTransactionID(true);

      let proposalResponse = await fabricChannel.sendUpgradeProposal({
        //targets: targetPeers,
        chaincodeId: chaincode.name,
        chaincodeVersion: chaincode.version,
        chaincodeType: chaincode.type,
        txId: tx_id,
        fcn: data.fcn ? data.fcn : "init",
        args: data.args ? data.args : [],
        "endorsement-policy": data.endorsement,
        'collections-config': data.pvDataConfig
      });

      const proposalResponses = proposalResponse[0];
      const proposal = proposalResponse[1];

      // check the results to decide if we should send the endorsment to be orderered
      if (proposalResponses[0] instanceof Error) {
        logger.error("%s - Proposal failed", method);
        throw proposalResponses[0];
      }

      if (
        !(
          proposalResponses[0].response &&
          proposalResponses[0].response.status === 200
        )
      ) {
        const error_message = util.format(
          "Invoke chaincode proposal:: %j",
          proposalResponses[0]
        );
        logger.error("%s - Proposal failed %s", method, error_message);
        throw new Error(error_message);
      }

      logger.debug("%s - Proposal sent successfully!", method);

      const result = await fabricChannel.sendTransaction({
        proposalResponses: proposalResponses,
        proposal: proposal
      });

      logger.debug("%s - Transaction sent to orderer!", method);

      instantiatedChaincode.status = 0;
      await instantiatedChaincode.save();

      // Save the entry for this organisation
      await ChaincodeInstantiated.create({
        channelId: channel._id,
        chaincodeId: chaincode._id,
        name: chaincode.name,
        endorsement_policy: data.endorsement,
        status: 1
      });

      logger.debug(
        "%s - Upgrade chaincode information added in the database",
        method
      );

      await gateway.disconnect();

      return {
        status: 200,
        data: {
          message: "Chaincode has been upgraded successfully!",
          data: result
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  }

  /**
   * List of Instantiated chaincode
   * @param {*} data
   */
  static async queryInstantiatedChaincodes(data) {
    const method = "queryInstantiatedChaincodes";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      // find the peer
      let peer = await Peer.findById(data.peerId)
        .populate("caId")
        .populate("orgId")
        .populate("networkId");

      if (!peer) {
        throw new Exception.PeerNotFound();
      }

      logger.debug(
        "%s - Peer information fetched from database %j",
        method,
        peer
      );

      let channel = await ChannelModel.channel.findById(data.channelId);

      if (!channel) {
        throw new Exception.ChannelNotFound();
      }

      logger.debug(
        "%s - Channel information fetched from database %j",
        method,
        channel
      );

      const orgAdmin = await CA.orgAdmin.findOne({
        _id: peer.orgId.adminId
      });

      if (!orgAdmin) {
        throw new Exception.OrgAdminNotFound();
      }

      logger.debug(
        "%s - Org Admin information fetched from database %j",
        method,
        orgAdmin
      );

      // const basePath = `${os.homedir}/${config.home}/${peer.orgId.name}-${peer.caId.name}`;

      const basePath = utils.getBasePath(
        peer.networkId.namespace,
        peer.orgId.name,
        peer.caId.name
      );

      logger.debug("%s - basePath: %s", method, basePath);
      // const wallet = new FileSystemWallet(`${basePath}/wallet`);
      
      //changes according to fabric version 2.x
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      await ChaincodeController.userExists(wallet, orgAdmin.admnId);

      const ccpPath = `${os.homedir}/${config.home}/channel/${channel.name}/${peer.orgId.name}/config.json`;
      const ccpJSON = fs.readFileSync(ccpPath, "utf8");
      const ccp = JSON.parse(ccpJSON);
      logger.debug("%s - ccpPath: %s", method, ccpPath);

      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: orgAdmin.admnId,
        discovery: {
          enabled: true,
          asLocalhost: false
        }
      });
      const client = gateway.getClient();
      const fabricPeer = client.getPeer(peer.peer_enroll_id);
      const fabricChannel = client.getChannel(channel.name);
      let result = await fabricChannel.queryInstantiatedChaincodes(
        fabricPeer,
        true
      );

      await gateway.disconnect();
      logger.debug("%s - Chaincode returned", method);
      return {
        status: 200,
        data: {
          message: "List of chaincodes instantiated on this channel!",
          data: result
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  }

  static async instantiatedChainCodeChannelList(data) {
    const method = "instantiatedChainCodeOnChannel";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      const result = await ChaincodeInstantiated.aggregate([
        {
          $match: {
            chaincodeId: mongoose.Types.ObjectId(data.chaincodeId)
          }
        },
        {
          $lookup: {
            from: "channels",
            as: "channel",
            let: {
              channelId: "$channelId"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$channelId"]
                  }
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: "channelpeers",
            as: "channelOrg",
            let: {
              channelId: "$channelId"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$channelId", "$$channelId"]
                  }
                }
              },
              {
                $lookup: {
                  from: "peers",
                  as: "peers",
                  let: {
                    joinedpeer: "$joinedpeer"
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $in: ["$_id", "$$joinedpeer"]
                        }
                      }
                    }
                  ]
                }
              },
              {
                $lookup: {
                  from: "organisations",
                  as: "organisation",
                  let: {
                    orgId: "$orgId"
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ["$_id", "$$orgId"]
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]);
      return {
        status: 200,
        data: {
          message: "List of chaincodes!",
          data: result
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  }

  static async instantiateChainCodeTargetPeer(data) {
    const method = "instantiatedChainCodeOnChannel";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      let targetPeers = await channelModel.channelPeer.aggregate([
        {
          $facet: {
            joinedPeers: [
              {
                $match: { channelId: mongoose.Types.ObjectId(data.channelId) }
              },
              {
                $project: { joinedpeer: 1, _id: 0 }
              },
              { $unwind: "$joinedpeer" }
            ],
            installedPeers: [
              { $limit: 1 },
              {
                $lookup: {
                  from: "chaincodes",
                  as: "installedPeers",
                  pipeline: [
                    {
                      $match: { _id: mongoose.Types.ObjectId(data.chaincodeId) }
                    },
                    {
                      $project: {
                        installedOn: 1,
                        _id: 0
                      }
                    }
                  ]
                }
              },
              { $project: { _id: 0, installedPeers: 1 } },
              { $unwind: "$installedPeers" },
              { $project: { installedOn: "$installedPeers.installedOn" } },
              { $unwind: "$installedOn" }
            ]
          }
        },
        {
          $addFields: {
            targetPeers: {
              $filter: {
                input: "$joinedPeers",
                cond: {
                  $in: ["$$this.joinedpeer", "$installedPeers.installedOn"]
                }
              }
            }
          }
        },
        { $project: { targetPeers: 1 } }
      ]);
      return {
        status: 200,
        data: {
          message: "List of target peers!",
          data: targetPeers[0]
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  }

  /**
   * List the uploaded chaincodes
   * @param {*} orgId
   */
  static async instantiatedChaincodeDB(data) {
    const method = "instantiatedChaincodeDB";
    logger.debug("%s - start", method);
    logger.debug("%s - has received the parameters %j", method, data);

    try {
      const pageOptions = {
        page: Number.parseInt(data.page) || 1,
        limit: Number.parseInt(data.limit) || 100
      };

      let channel = await ChannelModel.channel.findById(data.channelId);

      if (!channel) {
        throw new Exception.ChannelNotFound();
      }

      logger.debug(
        "%s - Channel information fetched from database %j",
        method,
        channel
      );

      const result = await ChaincodeInstantiated.find({
        channelId: channel._id
      })
        .populate("chaincodeId")
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit);
      logger.debug("%s - Chaincode returned form database", method);
      return {
        status: 200,
        data: {
          message: "List of chaincodes!",
          data: result
        }
      };
    } catch (error) {
      return ErrorHandler.handleError(error);
    }
  }

  /**
   * Checks whether a user exists in the wallet or not
   * @param {*} wallet
   * @param {*} user
   */
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

module.exports = ChaincodeController;
