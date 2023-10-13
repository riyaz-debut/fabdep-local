'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orgSchema = new Schema({
    name: { type: String },
    mspId: { type: String },
    peers: {
        type : Number
    },
    file: { type: Buffer, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
module.exports = mongoose.model('NewOrganisation', orgSchema);



