"use strict";

const logger = require("../repositry/utils").getLogger("Error.js");

class NetworkNotFound extends Error {
  constructor(message = "Network does not exists!") {
    super(message);
    const method = "NetworkNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}

class ClusterNotFound extends Error {
  constructor(message = "Cluster does not exists!") {
    super(message);
    const method = "ClusterNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}



class ClusterInUse extends Error {
  constructor(message = "Network with the cluster already exists!") {
    super(message);
    const method = "ClusterInUse";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 409;
  }
}

class NetworkInUse extends Error {
  constructor(message = "Network with same name is already exists!") {
    super(message);
    const method = "NetworkInUse";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 409;
  }
}

class PeerNotFound extends Error {
  constructor(message = "Peer does not exists!") {
    super(message);
    const method = "PeerNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}
class EnrollException extends Error {
  constructor(message = "Enrolling error") {
    super(message);
    const method = "EnrollException";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}
class PeerAlreadyJoinedChannel extends Error {
  constructor(message = "Peer already joined!") {
    super(message);
    const method = "PeerAlreadyJoinedChannel";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}
class OrganisationNotFound extends Error {
  constructor(message = "Organisation does not exists!") {
    super(message);
    const method = "OrganisationNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}
class OrganisationAlreadyexists extends Error {
  constructor(message = "Organisation already  exists!") {
    super(message);
    const method = "OrganisationAlreadyexists";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}

class OrganisationAlreadyexistsInChannel extends Error {
  constructor(message = "Organisation already  exists in channel!") {
    super(message);
    const method = "OrganisationAlreadyexistsInChannel";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}

class ChaincodeMainFunctionNotFound extends Error {
  constructor(
    message = "Uploaded chaincode does not contains the main function!"
  ) {
    super(message);
    const method = "ChaincodeMainFunctionNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}

class OrgAdminNotFound extends Error {
  constructor(message = "Org Admin does not exists!") {
    super(message);
    const method = "OrgAdminNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}

class VMNotFound extends Error {
  constructor(message = "VM does not exists!") {
    super(message);
    const method = "VMNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}

class GenesisException extends Error {
  constructor(message = "Geenesis block generation error") {
    super(message);
    const method = "GenesisException";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}

class ChannelException extends Error {
  constructor(message = "create channel error") {
    super(message);
    const method = "ChannelException";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}

class ChaincodeException extends Error {
  constructor(message = "chaincode error") {
    super(message);
    const method = "ChaincodeException";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}

class AddNewOrgException extends Error {
  constructor(message = "Add New Org error") {
    super(message);
    const method = "AddNewOrgException";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}

class PodlistNotFound extends Error {
  constructor(message = "Podlist does not exists!") {
    super(message);
    const method = "PodlistNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}

class UploadChaincde extends Error {
  constructor(message = "Please upload the chaincode file!") {
    super(message);
    const method = "UploadChaincde";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}

class ChaincdoeFileFormat extends Error {
  constructor(message = "The chaincode file must be a zip or go file!") {
    super(message);
    const method = "ChaincdoeFileFormat";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}

class ChaincodeMainMoreThanOne extends Error {
  constructor(
    message = "The chaincode file contains more than one main function!"
  ) {
    super(message);
    const method = "ChaincodeMainMoreThanOne";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}

class ChannelNotFound extends Error {
  constructor(message = "The channel does not exists!") {
    super(message);
    const method = "ChannelNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}

class ChannelAlreadyExists extends Error {
  constructor(message = "The channel with same name already exists!") {
    super(message);
    const method = "ChannelAlreadyExists";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}

class ChannelWithoutOrganization extends Error {
  constructor(message = "The channel shluld contain atleast one organisation!") {
    super(message);
    const method = "ChannelWithoutOrganization";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}

class ChaincodeAlreadyInPath extends Error {
  constructor(message = "Chaincode with same folder structure already exists in the go path") {
    super(message);
    const method = "ChaincodeAlreadyInPath";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}
class ChaincodeAlreadyInstantiated extends Error {
  constructor(
    message = "Chaincode has been installed already with the same name!"
  ) {
    super(message);
    const method = "ChaincodeAlreadyInstantiated";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}

class CANotFound extends Error {
  constructor(message = "CA does not exists!") {
    super(message);
    const method = "CANotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}
class ChaincodeNotFound extends Error {
  constructor(message = "Chanocode does not exists!") {
    super(message);
    const method = "ChaincodeNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 404;
  }
}
class ChaincodeNotInstantiated extends Error {
  constructor(message = "Chaincode is not instantiated on the channel!") {
    super(message);
    const method = "ChaincodeNotInstantiated";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}
class ChaincodeOnlySupportsZipFiles extends Error {
  constructor(message = "Chaincode only supports zip files") {
    super(message);
    const method = "ChaincodeOnlySupportsZipFiles";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}
class ImportedChannelError extends Error {
  constructor(message = "Imported channnel can't be exported") {
    super(message);
    const method = "ExportedChannelError";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}
class OrdererNodesNotFound extends Error {
  constructor(message = "No orderer nodes found exception") {
    super(message);
    const method = "OrdererNodesNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);

    this.name = this.constructor.name;
    this.status = 400;
  }
}
class ChannelConfigError extends Error {
  constructor(message = "ChannelConfigError") {
    super(message);
    const method = "ChannelConfigError";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);
    this.name = this.constructor.name;
    this.status = 403;
  }
}
class OrdereringServiceNotFound extends Error {
  constructor(message = "OrdereringService not found exception") {
    super(message);
    const method = "OrdereringServiceNotFound";
    logger.debug("%s - start", method);
    logger.error("%s - %s", method, message);
    this.name = this.constructor.name;
    this.status = 400;
  }
}
module.exports = {
  NetworkNotFound,
  ClusterInUse,
  ClusterNotFound,
  VMNotFound,
  GenesisException,
  ChannelException,
  ChaincodeException,
  AddNewOrgException,
  NetworkInUse,
  PodlistNotFound,
  PeerNotFound,
  EnrollException,
  PeerAlreadyJoinedChannel,
  OrganisationNotFound,
  OrgAdminNotFound,
  ChaincdoeFileFormat,
  UploadChaincde,
  ChaincodeMainFunctionNotFound,
  ChaincodeMainMoreThanOne,
  ChannelNotFound,
  ChannelAlreadyExists,
  ChaincodeAlreadyInstantiated,
  CANotFound,
  ChaincodeNotInstantiated,
  ChaincodeAlreadyInPath,
  ChaincodeNotFound,
  ChaincodeOnlySupportsZipFiles,
  OrganisationAlreadyexists,
  ImportedChannelError,
  OrdererNodesNotFound,
  OrganisationAlreadyexistsInChannel,
  ChannelWithoutOrganization,
  OrdereringServiceNotFound,
  ChannelConfigError

};
