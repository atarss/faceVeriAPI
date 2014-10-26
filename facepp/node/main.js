// main.js
// Starting point for API
// by Andy 2014

var apiUtils = require("./utils.js");
global.apiUtils = apiUtils;
apiUtils.sysLog("Utils Loaded");
apiUtils.registerSigint();

var mainConfigObj = require("./config.js").config;
global.apiConfig = mainConfigObj;
apiUtils.sysLog("Configuration File Loaded ('config.js')");

var processQueue = require("./processQueue.js").processQueue;

var apiDb = require("./db.js");
apiDb.testAddress(mainConfigObj.mongoServerUrl);
global.apiDb = apiDb;
apiUtils.sysLog("Database Driver Loaded.");
apiUtils.sysLog("Mongodb URI: " + apiConfig.mongoServerUrl);

var apiFrame = require("./api.js");
apiFrame.listen(apiConfig.serverAddress, apiConfig.serverPort);
apiUtils.sysLog("HTTP Server Ready.");

var queue = new processQueue();

for (i = 0; i<2; i++) {
	queue.push(function(callback){
		console.log(i);
		callback();
	});
}

queue.startQueue();