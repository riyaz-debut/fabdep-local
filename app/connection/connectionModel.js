const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const connectionSchema = new Schema({
    hostname: { type: String },
    username: { type: String },
    password: { type: String },
    port: { type: Number, default: 0 },
    status: { type: Number, default: 1 },
    is_deleted: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('connections', connectionSchema);


