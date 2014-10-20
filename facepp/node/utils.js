var fs = require("fs");

var sysLog = function(str) {
	console.log(Date() + " [LOG] " + str);
};

var sysErr = function(str) {
	console.log(Date() + " [ERR] " + str);
};

function strIsEndWith(longStr, shortStr) {
	var longLength = longStr.length;
	var shortLength = shortStr.length;
	if (longStr.slice(longLength - shortLength) == shortStr) {
		return true;
	} else {
		return false;
	}
}

function readDirRec(location, patternStr, fileList) {
	// **ATTENTION**  Location should be end with '/'

	var files = fs.readdirSync(location);
	for (i in files) {
		var thisAbsLocation = location + files[i];
		stat = fs.lstatSync(thisAbsLocation);
		if (stat.isDirectory()){
			readDirRec(thisAbsLocation + "/", patternStr, fileList);
		} else if (strIsEndWith(thisAbsLocation, patternStr)) {
			fileList.push(thisAbsLocation);
		}
	}
}

var getFileFromDirByPattern = function(pathLocation, patternStr) {
	var fileList = new Array();
	readDirRec(pathLocation, patternStr, fileList);
	return fileList;
}

process.on("SIGINT", function(){
	sysLog("Got SIGINT, quit now.");
	process.exit(0);
});

exports.sysLog = sysLog;
exports.sysErr = sysErr;
exports.getFileFromDirByPattern = getFileFromDirByPattern;