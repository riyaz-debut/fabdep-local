'use strict';

const config = require('../../config');
let shell = require('shelljs');
const { exec } = require('child_process');
const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs-extra');
const exceptions = require('../errors/errors');
const utils = require('../../utils/utils.js');

// fetch recent config block for the channel
function fetchConfigBlock(peer, orderernode, channelName) {
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

    const config_block_path = `${fabric_cfg_path}${channelName}_config_block.pb`
    
    let status = 'initial'; 
    if (channelName) {
        if (shell.exec(` set -x export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && peer channel fetch config ${config_block_path} -o ${ordererAddress} -c ${channelName} --tls --cafile ${ordererCA}`).code !== 0) {
            shell.echo('Error: while fetch config block');
            throw new exceptions.AddNewOrgException('Error: while fetch config block');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

// Decode this channel configuration block into JSON format
function decodeConfigBlockToJson(peer, orderernode, channelName) {
    console.log(" in decodeConfigBlockToJson")
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

    const config_block_path = `${fabric_cfg_path}${channelName}_config_block.pb`

    const config_block_json_path = `${fabric_cfg_path}${channelName}_config_block.json`
    const config_json_path = `${fabric_cfg_path}${channelName}_config.json`
    
    let status = 'initial'; 
    if (channelName) {
        if (shell.exec(` set -x export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && cd ${fabric_cfg_path} && configtxlator proto_decode --input ${config_block_path} --type common.Block --output ${config_block_json_path} && jq .data.data[0].payload.data.config ${config_block_json_path} > ${config_json_path}`).code !== 0) {
            shell.echo('Error: while decode config block to json');
            throw new exceptions.AddNewOrgException('Error: while decode config block to json');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

// Append the new organisation configuration definition
function appendNewOrgConfig(peer, orderernode, channelName) {
    console.log(" in appendNewOrgConfig")
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
    
    const config_json_path = `${fabric_cfg_path}${channelName}_config.json`
    const modified_config_json_path = `${fabric_cfg_path}${channelName}_modified_config.json`
    let newOrg_config_path = `${os.homedir}/go/src/osqo2.json`;
    
    let status = 'initial'; 
    if (channelName) {
        if (shell.exec(` set -x export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && cd ${fabric_cfg_path} && jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"osqoMSP":.[1]}}}}}' ${config_json_path} ${newOrg_config_path} > ${modified_config_json_path}`).code !== 0) {
            shell.echo('Error: while append new organisation config');
            throw new exceptions.AddNewOrgException('Error: while append new organisation config');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

// Now translate configuration back into a protobuf and calculate delta b/w them
function encodeDecodeConfiguration(peer, orderernode, channelName) {
    console.log(" in encodeDecodeConfiguration")
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
    
    const config_json_path = `${fabric_cfg_path}${channelName}_config.json`
    const config_pb_path = `${fabric_cfg_path}${channelName}_config.pb`

    const modified_config_json_path = `${fabric_cfg_path}${channelName}_modified_config.json`
    const modified_config_pb_path = `${fabric_cfg_path}${channelName}_modified_config.pb`

    const newOrg_update_pb_path = `${fabric_cfg_path}${channelName}_update.pb`
    const newOrg_update_json_path = `${fabric_cfg_path}${channelName}_update.json`
    
    let status = 'initial'; 
    if (channelName) {
        if (shell.exec(` set -x export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && cd ${fabric_cfg_path} && configtxlator proto_encode --input ${config_json_path} --type common.Config --output ${config_pb_path} && configtxlator proto_encode --input ${modified_config_json_path} --type common.Config --output ${modified_config_pb_path} && configtxlator compute_update --channel_id ${channelName} --original ${config_pb_path} --updated ${modified_config_pb_path} --output ${newOrg_update_pb_path} && configtxlator proto_decode --input ${newOrg_update_pb_path} --type common.ConfigUpdate --output ${newOrg_update_json_path}`).code !== 0) {
            shell.echo('Error: while encode and decode configuration');
            throw new exceptions.AddNewOrgException('Error: while encode and decode configuration');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

// Create Envelope configuration
function createEnvelopeConfiguration(peer, orderernode, channelName) {
    console.log(" in createEnvelopeConfiguration")
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
    
    const config_json_path = `${fabric_cfg_path}${channelName}_config.json`
    const config_pb_path = `${fabric_cfg_path}${channelName}_config.pb`

    const modified_config_json_path = `${fabric_cfg_path}${channelName}_modified_config.json`
    const modified_config_pb_path = `${fabric_cfg_path}${channelName}_modified_config.pb`

    const newOrg_update_pb_path = `${fabric_cfg_path}${channelName}_update.pb`
    const newOrg_update_json_path = `${fabric_cfg_path}${channelName}_update.json`

    const newOrg_update_envelope_json_path = `${fabric_cfg_path}${channelName}_update_in_envelope.json`
    const newOrg_update_envelope_pb_path = `${fabric_cfg_path}${channelName}_update_in_envelope.pb`
    
    let status = 'initial'; 
    if (channelName) {
        if (shell.exec(` set -x export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && cd ${fabric_cfg_path} && echo '{"payload":{"header":{"channel_header":{"channel_id":"'${channelName}'", "type":2}},"data":{"config_update":'$(cat ${newOrg_update_json_path})'}}}' | jq . > ${newOrg_update_envelope_path} && configtxlator proto_encode --input ${newOrg_update_envelope_json_path} --type common.Envelope --output ${newOrg_update_envelope_pb_path}`).code !== 0) {
            shell.echo('Error: while create envelope configuration');
            throw new exceptions.AddNewOrgException('Error: while create envelope configuration');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

// Create Envelope configuration
function signUpdate(peer, orderernode, channelName) {
    console.log(" in signUpdate")
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
    
    const config_json_path = `${fabric_cfg_path}${channelName}_config.json`
    const config_pb_path = `${fabric_cfg_path}${channelName}_config.pb`

    const modified_config_json_path = `${fabric_cfg_path}${channelName}_modified_config.json`
    const modified_config_pb_path = `${fabric_cfg_path}${channelName}_modified_config.pb`

    const newOrg_update_pb_path = `${fabric_cfg_path}${channelName}_update.pb`
    const newOrg_update_json_path = `${fabric_cfg_path}${channelName}_update.json`

    const newOrg_update_envelope_json_path = `${fabric_cfg_path}${channelName}_update_in_envelope.json`
    const newOrg_update_envelope_pb_path = `${fabric_cfg_path}${channelName}_update_in_envelope.pb`
    
    let status = 'initial'; 
    if (channelName) {
        if (shell.exec(` set -x export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && peer channel signconfigtx -f ${newOrg_update_envelope_pb_path} && peer channel update -f ${newOrg_update_envelope_pb_path} -c ${channelName} -o ${ordererAddress} --tls --cafile ${ordererCA}`).code !== 0) {
            shell.echo('Error: while sign update');
            throw new exceptions.AddNewOrgException('Error: while sign update');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

// fetch recent config block for the channel
function fetchUpdatedChannelBlock(peer, orderernode, channelName) {
    console.log("in fetchUpdatedChannelBlock")
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

    const updated_config_block_path = `${fabric_cfg_path}${channelName}.block`
    
    let status = 'initial'; 
    if (channelName) {
        if (shell.exec(` set -x export PATH=${path} && export FABRIC_CFG_PATH=${fabric_cfg_path} && export CORE_PEER_TLS_ENABLED=${core_peer_tls_enabled} && export CORE_PEER_LOCALMSPID=${core_peer_localmspid} && export CORE_PEER_TLS_ROOTCERT_FILE=${core_peer_tls_rootcert_file} && export CORE_PEER_MSPCONFIGPATH=${core_peer_mspconfigpath} && export CORE_PEER_ADDRESS=${core_peer_address} && peer channel fetch 0 ${updated_config_block_path} -o ${ordererAddress} -c ${channelName} --tls --cafile ${ordererCA}`).code !== 0) {
            shell.echo('Error: while fetch updated channel block');
            throw new exceptions.AddNewOrgException('Error: while fetch updated channel block');
        }
        status = 'SUCCESS'
    } 
    return ({status : status})
}

module.exports = { 
    fetchConfigBlock,
    decodeConfigBlockToJson,
    appendNewOrgConfig,
    encodeDecodeConfiguration,
    createEnvelopeConfiguration,
    signUpdate,
    fetchUpdatedChannelBlock
};