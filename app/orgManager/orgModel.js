'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orgSchema = new Schema({
    name: { type: String },
    mspId: { type: String },
    caId: {
        type: Schema.Types.ObjectId,
        ref: 'Ca'
    },
    tlsCaId: {
        type: Schema.Types.ObjectId,
        ref: 'Ca'
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'OrgAdmin'
    },
    clusterId: {
        type: Schema.Types.ObjectId,
        ref: 'cluster'
    },
    networkId: { type: Schema.Types.ObjectId, ref: 'networks' },
    extras: {
        tlsCacerts: String,
        cacets: String,
        admincerts: String,
        peer_enroll_id: String,
        peerport: Number,
    },
    type: { type: Number }, //(0) peer org or (1) Ordere org (2) peer org imported
    is_deleted: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
module.exports = mongoose.model('Organisation', orgSchema);



