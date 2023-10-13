"use strict";

require("./connection");
let createError = require("http-errors");
let express = require("express");
const cors = require("cors");
let path = require("path");
const cookieParser = require("cookie-parser");
const middleware = require("./app/middleware/auth");
let connectionRouter = require("./app/connection/connectionRouter");
let clusterRouter = require("./app/cluster/clusterRouter");
const networkRouter = require("./app/network/networkroutes");
let vmRouter = require("./app/vm/vmRouter");
const kubernetesRouter = require("./app/kubernetes/kubernetesroutes");
//var caRoutes = require('./certificate_manager/routes/ca_client');
let certificateManagerRoute = require("./app/caManager/caRoutes");
let orgManagerRoutes = require("./app/orgManager/orgRoutes");
let addNewOrgRoutes = require("./app/addNewOrg/orgRoutes");
let peerManagerRoutes = require("./app/peerManager/peerRoutes");
let ordererRoutes = require("./app/orderingService/ordererRoutes");
const chaincodeRouter = require("./app/chaincode/chaincoderoutes");
let authRouter = require("./app/subscriptionManager/routes");

let channelRoutes = require("./app/channel/channelRoutes");
let app = express();
app.use(cors());
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/auth", authRouter);
app.use("/", middleware);
// All Modules
app.use("/connection", connectionRouter);
app.use("/cluster", clusterRouter);
app.use("/network", networkRouter);
app.use("/vm", vmRouter);
app.use("/kubernetes", kubernetesRouter);
app.use("/ca", certificateManagerRoute);
app.use("/org", orgManagerRoutes);
app.use("/newOrg", addNewOrgRoutes);
app.use("/peer", peerManagerRoutes);
app.use("/orderer", ordererRoutes);
app.use("/chaincode", chaincodeRouter);
app.use("/channel", channelRoutes);

app.use(function (req, res, next) {
	var err = new Error("Not Found");
	err.status = 404;
	next(err);
});

// error handler
app.use(function (err, req, res, next) {
	console.log(err);
	res.status(err.status || 500);
	res.send({
		message: err.message,
		status: err.status,
	});
});
module.exports = app;
