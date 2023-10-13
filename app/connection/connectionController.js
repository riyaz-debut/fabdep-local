const mongoose = require('mongoose'); //orm for database
const connections = require("./connectionModel"); // require model users
class ConnectionController {

    async addConnection(body) {
        try {
            let connectionData = {
                hostname: body.hostname,
                username: body.username,
                password: body.password,
                port: body.port,
                status: 1,
            };

            let connectionInsert = await connections.create(connectionData);
            return Promise.resolve(connectionInsert);

        } catch (err) {
            return Promise.reject({ message: err.message, status: 0 });
        }

    }

    async updateConnection(body) {

        try {
            let connectionData = {
                hostname: body.hostname,
                username: body.username,
                password: body.password,
                port: body.port
            };
            let connectionUpdate = await connections.update({ _id: mongoose.Types.ObjectId(body.connectionid) }, connectionData);

            return Promise.resolve(connectionUpdate);

        } catch (err) {
            return Promise.reject({ message: err.message, status: 0 });
        }

    }


    async listConnections() {

        try {

            let allConnections = await connections.find({});

            return Promise.resolve(allConnections);

        } catch (err) {
            return Promise.reject({ message: err.message, status: 0 });
        }

    }
    
    async getConnection(connectionId) {

        try {

            let connectionData = await connections.find({ _id: mongoose.Types.ObjectId(connectionId) });

            return Promise.resolve(connectionData);


        } catch (err) {
            return Promise.reject({ message: err.message, status: 0 });
        }

    }


    async deleteConnection(body) {

        try {

            let connectionDelete = await connections.find({ _id: mongoose.Types.ObjectId(body.connectionid) }).remove();
            return Promise.resolve(connectionDelete);



        } catch (err) {
            return Promise.reject({ message: err.message, status: 0 });
        }

    }
}


module.exports = ConnectionController;
