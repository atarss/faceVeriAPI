//parser.js for bing image html

var fs = require("fs");

var pathArr = [
	"/home/andy/dev/node/spider/bing/test.html",
	"/home/andy/dev/node/spider/bing/test3.html"
]

for (i in pathArr) {
	var htmlStr = "" + fs.readFileSync(pathArr[i]);
	console.log("\n====" + pathArr[i] + "====");

	count = 0;

	while (htmlStr.indexOf(",imgurl:") >= 0) {
		var startIndex = htmlStr.indexOf(",imgurl:");
		var endIndex = htmlStr.indexOf("&quot;,oh:");
		count++;
		console.log("["+count+"] "+htmlStr.slice(startIndex + 14, endIndex));
		htmlStr = htmlStr.slice(endIndex+2);
	}	
}
