'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoUpdateModel = new Schema({
    autoUpdateStatus: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
module.exports = mongoose.model('AutoupdateModel', autoUpdateModel);

