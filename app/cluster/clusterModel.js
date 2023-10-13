'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const connectionSchema = new Schema({
    name: { type: String },
    description: { type: String },
    configuration: { type: Object },
    dashboard_port: { type: Number },
    dashboard_url: { type: String },
    worker_node: [{ type: Schema.Types.ObjectId, ref: 'vms' }],
    master_node: { type: Schema.Types.ObjectId, ref: 'vms' },
    status: { type: Number, default: 0 },    //NOTE 0=> deactive, 1=> active
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


module.exports = mongoose.model('cluster', connectionSchema);


