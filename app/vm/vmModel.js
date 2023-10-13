'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const vmSchema = new Schema({
    ip: { type: String },
    username: { type: String },
    password: { type: String },
    description: { type: String },
    clusterId: {
        type: Schema.Types.ObjectId,
        ref: 'clusters'
    },
    type: { type: Number, default: 2 }, //NOTE 1=> master, 2 => worker, 3=> nfs
    status: { type: Number, default: 0 }, //NOTE 0=> disbaled, 1=> connected, 2 => disconnected
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


module.exports = mongoose.model('vms', vmSchema);


