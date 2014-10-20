// api.js
// API Framework for facepp
// by Andy 2014

//Load API List from indexFolder.
var http = require("http");
var urlParser = require('url').parse;

var fileList = apiUtils.getFileFromDirByPattern(apiConfig.indexFolder,".js");
var apiList = {};
for (index in fileList){
	var fullPath = fileList[index];
	var apiMethodName = fullPath.slice(0,fullPath.length-3).slice(apiConfig.indexFolder.length);
	apiList[apiMethodName] = require(fullPath);
	apiUtils.sysLog("API Method '" + apiMethodName + "' is loaded.");
}

function listen(address, port) {
	http.createServer(function(req, resp){
		// TODO: Logging All Req to DB or files.

		var urlPath = urlParser(req.url).pathname.slice(1);

		// TODO: get parameters here and pass to worker.
		// temperorily using formidable Library.
		var reqParaObj = {};

		if (apiList[urlPath]) {
			apiList[urlPath].worker(reqParaObj, resp);
		} else {
			apiUtils.sysErr("No such API method : " + urlPath);
			resp.end("No such API method : " + urlPath);
		}

	}).listen(port, address);
	apiUtils.sysLog("Start Listening HTTP Server");
	apiUtils.sysLog("on http://" + address + ":" + port + "/");

}

exports.listen = listen;