var sysLog = function(str) {
	console.log(Date() + " [LOG] " + str);
};

var sysErr = function(str) {
	console.log(Date() + " [ERR] " + str);
};

process.on("SIGINT", function(){
	sysLog("Got SIGINT, quit now.");
	process.exit(0);
});


exports.sysLog = sysLog;
exports.sysErr = sysErr;