'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const peerSchema = new Schema({
    name: { type: String },
    peer_enroll_id: { type: String },
    peer_enroll_secret: { type: String },
    peerport: { type: Number, default: 0 },
    chaincodeport: { type: Number, default: 0 },
    couchdbport: { type: Number, default: 0 },
    couchdbUsername: { type: String },
    couchdbPassword: { type: String },
    isCouchDbPublic: { type: Boolean, default: false },
    orgId: {
        type: Schema.Types.ObjectId,
        ref: 'Organisation'
    },
    caId: {
        type: Schema.Types.ObjectId,
        ref: 'Ca'
    },
    cacets: { type: String },
    primaryKey: { type: String },
    signCert: { type: String },
    tlsCaId: {
        type: Schema.Types.ObjectId,
        ref: 'Ca'
    },
    tlsCacerts: { type: String },
    tlsPrimaryKey: { type: String },
    tlsSignCert: { type: String },
    // networkId: String,
    networkId: {
        type: Schema.Types.ObjectId,
        ref: 'networks'
    },
    //clusterId: String,
    clusterId: {
        type: Schema.Types.ObjectId,
        ref: 'cluster'
    },
    type: { type: Number, default: 0 }, //(0) Endorser or (1) Committer
    is_deleted: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

peerSchema.index({ couchdbport: -1 });
module.exports = mongoose.model('Peer', peerSchema);



