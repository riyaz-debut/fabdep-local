
'use strict';

const config = require('../../config');
let shell = require('shelljs');
const { exec } = require('child_process');
const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs-extra');
const exceptions = require('../errors/errors');
const utils = require('../../utils/utils.js');

// package chaincode
function packageChaincode(peer, orderernode, chaincode, ccPath) {
    const orgPath = utils.getBasePath(peer.networkId.namespace, peer.orgId.name, peer.caId.name);
    const peerOrgPath = `${orgPath}/${peer.peer_enroll_id}`;
    const ordererOrgPath = utils.getBasePath(peer.networkId.namespace, orderernode.orgId.name, orderernode.caId.name);
    const orgMsp = peer.orgId.mspId
    const peerPort = `${peer.peer_enroll_id}:${peer.peerport}`
    
    const path = `${os.homedir}/fabric-samples/bin:$PATH`
    const fabric_cfg_path = `${ordererOrgPath}/channel-artifacts/`
    
    const core_peer_tls_enabled = "true"
    const core_peer_localmspid = `${orgMsp}`
    const core_peer_tls_rootcert_file=`${peerOrgPath}/tls/ca.crt`
    const core_peer_mspconfigpath = `${orgPath}/admin/msp`
    const core_peer_address=`${peerPort}`

    const CC_NAME = chaincode.name
    const CC_SRC_PATH = `${ccPath}/chaincode-go`
    const CC_RUNTIME_LANGUAGE = chaincode.type
    const CC_VERSION = chaincode.version
    
    let status = 'initial'; 
    if (chaincode) {
        shell.exec(`echo ${CC_SRC_PATH} ${CC_NAME} ${CC_RUNTIME_LANGUAGE} ${CC_VERSION}`)
        if (shell.exec(`export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && peer lifecycle chaincode package ./${CC_NAME}.tar.gz --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} --label ${CC_NAME}_${CC_VERSION}`).code !== 0) {
            shell.echo('Error: while package chaincode');
            throw new exceptions.ChaincodeException('Error: while package chaincode');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

// install chaincode
function installChaincode(peers, orderernode, chaincode) {
    let status = 'initial';
    let installedOn = [],
        failedOn = [];
    peers.forEach(peer => {
        const orgPath = utils.getBasePath(peer.networkId.namespace, peer.orgId.name, peer.caId.name);
        const peerOrgPath = `${orgPath}/${peer.peer_enroll_id}`;
        const ordererOrgPath = utils.getBasePath(peer.networkId.namespace, orderernode.orgId.name, orderernode.caId.name);
        const orgMsp = peer.orgId.mspId
        const peerPort = `${peer.peer_enroll_id}:${peer.peerport}`
        
        const path = `${os.homedir}/fabric-samples/bin:$PATH`
        const fabric_cfg_path = `${ordererOrgPath}/channel-artifacts/`
        
        const core_peer_tls_enabled = "true"
        const core_peer_localmspid = `${orgMsp}`
        const core_peer_tls_rootcert_file=`${peerOrgPath}/tls/ca.crt`
        const core_peer_mspconfigpath = `${orgPath}/admin/msp`
        const core_peer_address=`${peerPort}`

        const CC_NAME = chaincode.name
        
        if (chaincode) {
                if (shell.exec(`export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && peer lifecycle chaincode install ./${CC_NAME}.tar.gz`).code !== 0) {
                shell.echo('Error: while install chaincode');
                    failedOn.push(peer._id);
                throw new exceptions.ChaincodeException('Error: while install chaincode');
            }
        } 
            installedOn.push(peer._id);
    });
    status = 'SUCCESS'
    return ({status : status, installedOn : installedOn, failedOn : failedOn })
}

// query installed chaincode
function queryInstallChaincode(peers, orderernode, chaincode, ccPath) {
    let status = 'initial';
    peers.forEach(peer => {
        const orgPath = utils.getBasePath(peer.networkId.namespace, peer.orgId.name, peer.caId.name);
        const peerOrgPath = `${orgPath}/${peer.peer_enroll_id}`;
        const ordererOrgPath = utils.getBasePath(peer.networkId.namespace, orderernode.orgId.name, orderernode.caId.name);
        const orgMsp = peer.orgId.mspId
        const peerPort = `${peer.peer_enroll_id}:${peer.peerport}`
        
        const path = `${os.homedir}/fabric-samples/bin:$PATH`
        const fabric_cfg_path = `${ordererOrgPath}/channel-artifacts/`
        
        const core_peer_tls_enabled = "true"
        const core_peer_localmspid = `${orgMsp}`
        const core_peer_tls_rootcert_file=`${peerOrgPath}/tls/ca.crt`
        const core_peer_mspconfigpath = `${orgPath}/admin/msp`
        const core_peer_address=`${peerPort}`
        
        const cc_data_path = `${ccPath}/chaincodeData`
        if (!fs.existsSync(cc_data_path)) {
            fs.mkdirSync(cc_data_path);
        }

        let QUERY_PATH =`${cc_data_path}/cc_package_id.txt`
        if (chaincode) {
                const { stdout, stderr } = shell.exec(`export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && peer lifecycle chaincode queryinstalled`)
            if (stderr) {
                shell.echo('Error: while query install chaincode');
                throw new exceptions.ChaincodeException('Error: while query install chaincode');
            }
            fs.writeFileSync(QUERY_PATH, stdout);
            
        } 
        });
    status = 'SUCCESS'
    return ({status : status})
}

// approve chaincode for the organization
function approveChaincode(peer, orderernode, chaincode, channelName, ccPath) {
    const orgPath = utils.getBasePath(peer.networkId.namespace, peer.orgId.name, peer.caId.name);
    const peerOrgPath = `${orgPath}/${peer.peer_enroll_id}`;
    const ordererOrgPath = utils.getBasePath(peer.networkId.namespace, orderernode.orgId.name, orderernode.caId.name);
    const ordererNodePath = `${ordererOrgPath}/${orderernode.name}`;
    const orgMsp = peer.orgId.mspId
    const peerPort = `${peer.peer_enroll_id}:${peer.peerport}`
    const ordererPort = `${orderernode.name}:${orderernode.port}`
    
    const path = `${os.homedir}/fabric-samples/bin:$PATH`
    const fabric_cfg_path = `${ordererOrgPath}/channel-artifacts/`
    
    const core_peer_tls_enabled = "true"
    const core_peer_localmspid = `${orgMsp}`
    const core_peer_tls_rootcert_file=`${peerOrgPath}/tls/ca.crt`
    const core_peer_mspconfigpath = `${orgPath}/admin/msp`
    const core_peer_address=`${peerPort}`
    const ordererAddress = `${ordererPort}`
    const ordererCA = `${ordererNodePath}/crypto/msp/tlscacerts/tlsca.pem`

    const CC_NAME = chaincode.name
    const CC_VERSION = chaincode.version
    const CC_SEQUENCE = chaincode.sequence
    
    // optional (add these 3 env variables in approve command after sequence and change their values as per requirement according to data provided by UI)
    const INIT_REQUIRED="--init-required"
    const CC_END_POLICY="NA"
    const CC_COLL_CONFIG="NA"
    
    let QUERY_PATH = `${ccPath}/chaincodeData/cc_package_id.txt`
    const sedCommand = `sed -n "/${CC_NAME}_${CC_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" ${QUERY_PATH}`;
    const PACKAGE_ID = execSync(sedCommand).toString().trim();
    
    let status = 'initial'; 
    if (chaincode) {
        if (shell.exec(` set -x export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && peer lifecycle chaincode approveformyorg -o ${ordererAddress} --tls --cafile ${ordererCA} --channelID ${channelName} --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}`).code !== 0) {
            shell.echo('Error: while approve chaincode');
            throw new exceptions.ChaincodeException('Error: while approve chaincode');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

// checkCommitReadiness of chancode
function checkCommitReadiness(peer, orderernode, chaincode, channelName) {
    const orgPath = utils.getBasePath(peer.networkId.namespace, peer.orgId.name, peer.caId.name);
    const peerOrgPath = `${orgPath}/${peer.peer_enroll_id}`;
    const ordererOrgPath = utils.getBasePath(peer.networkId.namespace, orderernode.orgId.name, orderernode.caId.name);
    const orgMsp = peer.orgId.mspId
    const peerPort = `${peer.peer_enroll_id}:${peer.peerport}`
    
    const path = `${os.homedir}/fabric-samples/bin:$PATH`
    const fabric_cfg_path = `${ordererOrgPath}/channel-artifacts/`
    
    const core_peer_tls_enabled = "true"
    const core_peer_localmspid = `${orgMsp}`
    const core_peer_tls_rootcert_file=`${peerOrgPath}/tls/ca.crt`
    const core_peer_mspconfigpath = `${orgPath}/admin/msp`
    const core_peer_address=`${peerPort}`

    const CC_NAME = chaincode.name
    const CC_VERSION = chaincode.version
    const CC_SEQUENCE = chaincode.sequence
    
    // optional (add these 3 env variables in commit readiness command after sequence and change their values as per requirement according to data provided by UI)
    const INIT_REQUIRED="--init-required"
    const CC_END_POLICY="NA"
    const CC_COLL_CONFIG="NA"
    
    let status = 'initial'; 
    if (chaincode) {
        if (shell.exec(` set -x export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && peer lifecycle chaincode checkcommitreadiness --channelID ${channelName} --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE}`).code !== 0) {
            shell.echo('Error: while check commit readiness');
            throw new exceptions.ChaincodeException('Error: while check commit readiness');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

// commit chaincode 
function commitChaincode(peer, orderernode, chaincode, channelName) {
    const orgPath = utils.getBasePath(peer.networkId.namespace, peer.orgId.name, peer.caId.name);
    const peerOrgPath = `${orgPath}/${peer.peer_enroll_id}`;
    const ordererOrgPath = utils.getBasePath(peer.networkId.namespace, orderernode.orgId.name, orderernode.caId.name);
    const ordererNodePath = `${ordererOrgPath}/${orderernode.name}`;
    const orgMsp = peer.orgId.mspId
    const peerPort = `${peer.peer_enroll_id}:${peer.peerport}`
    const ordererPort = `${orderernode.name}:${orderernode.port}`
    
    const path = `${os.homedir}/fabric-samples/bin:$PATH`
    const fabric_cfg_path = `${ordererOrgPath}/channel-artifacts/`
    
    const core_peer_tls_enabled = "true"
    const core_peer_localmspid = `${orgMsp}`
    const core_peer_tls_rootcert_file=`${peerOrgPath}/tls/ca.crt`
    const core_peer_mspconfigpath = `${orgPath}/admin/msp`
    const core_peer_address=`${peerPort}`
    const ordererAddress = `${ordererPort}`
    const ordererCA = `${ordererNodePath}/crypto/msp/tlscacerts/tlsca.pem`

    const CC_NAME = chaincode.name
    const CC_VERSION = chaincode.version
    const CC_SEQUENCE = chaincode.sequence
    
    // optional (add these 3 env variables in commit chaincode command after sequence and change their values as per requirement according to data provided by UI)
    const INIT_REQUIRED="--init-required"
    const CC_END_POLICY="NA"
    const CC_COLL_CONFIG="NA"
    
    let status = 'initial'; 
    if (chaincode) {
        if (shell.exec(` set -x export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && peer lifecycle chaincode commit -o ${ordererAddress} --tls --cafile ${ordererCA} --channelID ${channelName} --name ${CC_NAME} --peerAddresses ${core_peer_address} --tlsRootCertFiles ${core_peer_tls_rootcert_file} --version ${CC_VERSION} --sequence ${CC_SEQUENCE}`).code !== 0) {
            shell.echo('Error: while commit chaincode');
            throw new exceptions.ChaincodeException('Error: while commit chaincode');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

// query committed chaincode queryCommitted
function queryCommittedChaincode(peer, orderernode, chaincode, channelName) {
    const orgPath = utils.getBasePath(peer.networkId.namespace, peer.orgId.name, peer.caId.name);
    const peerOrgPath = `${orgPath}/${peer.peer_enroll_id}`;
    const ordererOrgPath = utils.getBasePath(peer.networkId.namespace, orderernode.orgId.name, orderernode.caId.name);
    const orgMsp = peer.orgId.mspId
    const peerPort = `${peer.peer_enroll_id}:${peer.peerport}`
    
    const path = `${os.homedir}/fabric-samples/bin:$PATH`
    const fabric_cfg_path = `${ordererOrgPath}/channel-artifacts/`
    
    const core_peer_tls_enabled = "true"
    const core_peer_localmspid = `${orgMsp}`
    const core_peer_tls_rootcert_file=`${peerOrgPath}/tls/ca.crt`
    const core_peer_mspconfigpath = `${orgPath}/admin/msp`
    const core_peer_address=`${peerPort}`
    const CC_NAME = chaincode.name

    // optional (add these 3 env variables in query committed chaincode command after sequence and change their values as per requirement according to data provided by UI)
    const INIT_REQUIRED="--init-required"
    const CC_END_POLICY="NA"
    const CC_COLL_CONFIG="NA"
    
    let status = 'initial'; 
    if (chaincode) {
        if (shell.exec(` set -x export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && peer lifecycle chaincode querycommitted --channelID ${channelName} --name ${CC_NAME}`).code !== 0) {
            shell.echo('Error: while query committed chaincode');
            throw new exceptions.ChaincodeException('Error: while query committed chaincode');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

function getPeersObject(peers) {
    let peerObj = {};
    peers.forEach(peerData => {
        peerObj[peerData.peer_enroll_id] = {
            url: `grpcs://localhost:${peerData.peerport}`,
            tlsCACerts: {
                path: `${os.homedir}/Documents/${peerData.networkId.namespace}/${peerData.orgId.name}-${peerData.caId.name}/msp/tlscacerts/tlsca.pem`,
            },
            grpcOptions: {
                'ssl-target-name-override': `${peerData.peer_enroll_id}`,
                'grpc.keepalive_timeout_ms': 20000
            }
        };
    });

    return peerObj;
}

function connectionFile(peers) {
    try {
        let peerData = peers[0];
        // console.log('****************');
        // console.log(peerData);
        let peerObj = {
            name: peerData.orgId.name,
            version: '1.0.0',
            client: {
                organization: peerData.orgId.name,
                connection: {
                    timeout: {
                        peer: {
                            endorser: '3000',
                        },
                        orderer: '3000',
                    },
                },
            },
            organizations: {
                [peerData.orgId.name]: {
                    mspid: peerData.orgId.mspId,
                    peers: [peerData.peer_enroll_id]
                }
            },
            peers: getPeersObject(peers)
        };
        return Promise.resolve(peerObj);

    } catch (error) {
        return Promise.reject(error);
    }

}

module.exports = { 
    connectionFile,
    packageChaincode,
    installChaincode,
    queryInstallChaincode,
    approveChaincode,
    checkCommitReadiness,
    commitChaincode,
    queryCommittedChaincode
};