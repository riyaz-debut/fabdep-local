'use strict';

const mongoose = require('../../connection');
const Schema = mongoose.Schema;

// Define schema
const networkSchema = new Schema({
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    clusters: [{
        type: Schema.Types.ObjectId,
        ref: 'cluster',
        required: true,
        default: []
    }],
    namespace: { type: String, default: '' },
    status: { type: Number, default: 1 },
    is_deleted: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('networks', networkSchema);
