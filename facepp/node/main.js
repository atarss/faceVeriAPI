// main.js
// Starting point for API
// by Andy 2014

var apiUtils = require("./utils.js");
global.apiUtils = apiUtils;
apiUtils.sysLog("Utils Loaded");

var mainConfigObj = require("./config.js").config;
global.mainConfigObj = mainConfigObj;
apiUtils.sysLog("Configuration File Loaded ('config.js')");

var apiDb = require("./database/db.js");
apiDb.testAddress(mainConfigObj.mongoServerUrl);
global.apiDb = apiDb;
apiUtils.sysLog("Database Driver Loaded.");
apiUtils.sysLog("Mongodb URI: " + mainConfigObj.mongoServerUrl);

var apiFrame = require("./api/api.js");
apiFrame.listen(mainConfigObj.serverAddress, mainConfigObj.serverPort);
apiUtils.sysLog("HTTP Server Ready.");