'use strict';

const mongoose = require('../../connection');
const Schema = mongoose.Schema;

// Define schema
const chaincodeSchema = new Schema({
    chaincodeId: { type: Schema.Types.ObjectId, ref: 'chaincodes' },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organisation' },
    channelId: { type: Schema.Types.ObjectId, ref: 'channel' },
    name: { type: String, default: '' },
    status: { type: Number, default: 1 },
    endorsement_policy: { type: Object },
    is_deleted: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('instantiated_chaincodes', chaincodeSchema);
