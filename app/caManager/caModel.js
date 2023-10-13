'use strict';
let mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Certificate authority model
let caModel = new Schema({
    name: String,
    clusterId: { type: Schema.Types.ObjectId, ref: 'cluster' },
    networkId: { type: Schema.Types.ObjectId, ref: 'networks' },
    port: { type: Number, default: 0 },
    admnId: String,//admin registeration id
    admnSecret: String,//admin registeration secret
    isTLS: { type: Number, default: 0 }, //  0 normal 1 tls
    is_deleted: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Certificate authority admin model
let adminModel = new Schema({
    caId: {//Certificate authority id
        type: Schema.Types.ObjectId,
        ref: 'Ca'
    },
    cacets: { type: String },//cacets received from the ca
    primaryKey: { type: String },//primaryKey received from the ca
    signCert: { type: String },//signcert received from the ca
    identityType: String,
    is_deleted: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Organisation admin model
let orgAdminModel = new Schema({
    caId: { //Certificate authority id
        type: Schema.Types.ObjectId,
        ref: 'Ca'
    },
    admnId: String,//admin registeration id
    admnSecret: String,//admin registeration secret
    cacets: { type: String },//cacets received from the ca
    primaryKey: { type: String },//primaryKey received from the ca
    signCert: { type: String },//signcert received from the ca
    status: { type: Number, default: 0 }, //0 = registered 1= enrolled
    tlsCacerts: { type: String },
    tlsPrimaryKey: { type: String },
    tlsSignCert: { type: String },
    identityType: String,
    is_deleted: { type: Number, default: 0 },//Organisation id
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

let ca = mongoose.model('Ca', caModel);
let caAdmin = mongoose.model('Admin', adminModel);
let orgAdmin = mongoose.model('OrgAdmin', orgAdminModel);

module.exports = {
    ca,
    caAdmin,
    orgAdmin
};
