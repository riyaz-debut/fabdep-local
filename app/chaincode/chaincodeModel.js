'use strict';

const mongoose = require('../../connection');
const Schema = mongoose.Schema;

// Define schema
const chaincodeSchema = new Schema({
    name: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: 'golang'
    },
    version: {
        type: String,
        default: ''
    },
    sequence: {
        type: Number,
        default: 1
    },
    networkId: {
        type: Schema.Types.ObjectId,
        ref: 'networks'
    },
    path: {
        type: String,
        default: ''
    },
    mainPath: {
        type: String,
        default: ''
    },

    isPrivateDataCollection: {
        type: Boolean,
        default: false
    },
    installedOn: [{
        type: Schema.Types.ObjectId,
        ref: 'Peer'
    }],
    status: {
        type: Number,
        default: 1
    },
    is_deleted: {
        type: Number,
        default: 0
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('chaincodes', chaincodeSchema);