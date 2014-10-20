// api.js
// API Framework for facepp
// by Andy 2014

var apiList = require("./apilist.js").list;
var http = require("http");
var urlParser = require('url').parse;

function listen(address, port) {
	http.createServer(function(req, resp){
		// TODO: Logging All Req to DB or files.

		var urlPath = urlParser(req.url).pathname.slice(1);

		// TODO: get parameters here and pass to worker.
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