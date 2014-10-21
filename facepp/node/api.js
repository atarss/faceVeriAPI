// api.js
// API Framework for facepp
// by Andy 2014

//Load API List from indexFolder.
var http = require("http");
var urlParser = require('url').parse;
var formidable = require("formidable");

var fileList = apiUtils.getFileFromDirByPattern(apiConfig.indexFolder,".js");
var apiList = {};
for (index in fileList){
	var fullPath = fileList[index];
	var apiMethodName = fullPath.slice(0,fullPath.length-3).slice(apiConfig.indexFolder.length);
	var tmpModule = require(fullPath);
	if (tmpModule.worker) {
		apiList[apiMethodName] = tmpModule;
		apiUtils.sysLog("API Method '" + apiMethodName + "' is loaded.");
	} else {
		apiUtils.sysErr("Error loading API method '" + apiMethodName + "' : 'worker' function is not defined");
	}
}

function listen(address, port) {
	http.createServer(function(req, resp){
		// TODO: Logging All Req to DB or files.

		var urlPath = urlParser(req.url).pathname.slice(1);

		if (apiList[urlPath]) {
			var workerFunc = apiList[urlPath].worker;
			if (req.method.toLowerCase() == "post") {
				// assuming file uploaded.
				// using formidable Lib.
				var newForm = new formidable.IncomingForm();

				newForm.parse(req, function(err, fields, files){
					workerFunc({
						query : fields,
						file : files
					}, resp);
				});
			} else { 
				//assuming get method.
				var requestObj = urlParser(req.url, true).query;
				workerFunc({query : requestObj}, resp);
			}
		} else {
			apiUtils.sysErr("No such API method : " + urlPath);
			resp.end("No such API method : " + urlPath);
		}

	}).listen(port, address);
	apiUtils.sysLog("Start Listening HTTP Server");
	apiUtils.sysLog("on http://" + address + ":" + port + "/");

}

exports.listen = listen;