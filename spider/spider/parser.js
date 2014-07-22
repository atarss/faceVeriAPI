//parser.js
var fs = require("fs");

var dbName = '/home/andy/result.json';
var jsonStr = "" + fs.readFileSync(dbName);

var mainObj = eval("(" + jsonStr + ")");

for (i in mainObj) {
	var thisObj = mainObj[i];
	if (thisObj.result) {
		if (thisObj.result.length == 0) {
			fs.unlinkSync(thisObj.fileName);
			console.log("Deleted : " + thisObj.fileName);
		}
	} else {
		fs.unlinkSync(thisObj.fileName);
		console.log("Deleted : " + thisObj.fileName);
	}
}