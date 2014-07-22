//processor.js

var fs = require("fs");
var spawn = require('child_process').spawn;

var resultFilePath = "/home/andy/result.json";
var queueArr = [];
var intervalCounter, globalLock=0;
var resultObj = eval("(" + fs.readFileSync(resultFilePath) + ")");
var doneCounter = 0;
// console.log(resultObj);

function singleWorker(commandArr){
	globalLock = 1;
	var newSpawn = spawn("/home/andy/dev/opencv/crop/main", commandArr);
	newSpawn.stdout.on('data', function(data){
    	console.log("[SHELL] " + data);
    });
	newSpawn.stderr.on('data', function(data){
		console.log("[STDERR] : " + data);
	});

	newSpawn.on('close', function(){
		console.log(commandArr[1] + " is done.");
		globalLock = 0;
		doneCounter += 1;
	});
}

for (i in resultObj) {
	var thisPicObj = resultObj[i];
	faceCount = thisPicObj.result.length;
	if (faceCount > 0) {
		for (j in thisPicObj.result) {
			var thisResultObj = thisPicObj.result[j];
			var x = thisResultObj.x + "";
			var y = thisResultObj.y + "";
			var w = thisResultObj.w + "";
			var h = thisResultObj.h + "";

			var oldFileName = thisPicObj.fileName
			var newFileName = oldFileName.slice(0, oldFileName.length-4) + "_" + j + ".jpg";
			queueArr.push([oldFileName, newFileName, x, y, w, h]);
		}
	}
}

intervalCounter = setInterval(function(){
	if (globalLock == 0) {
		if (doneCounter >= queueArr.length) {
			clearInterval(intervalCounter);
		} else {
			singleWorker(queueArr[doneCounter]);
		}
	}
}, 50)