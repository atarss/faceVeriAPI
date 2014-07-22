//tester.js

var filePath = "/home/andy/Pictures/pubfig_gray/";

var fs = require('fs');
var request = require('request');
var fileList = fs.readdirSync(filePath);
var availableList = [];
var listLength = fileList.length;

var workingCount = 0;
var doneCount = 0;
var maxWorkingCount = 15;

for (var i=0; i<listLength; i++) {
	var fileName = fileList[i];
	fileList[i] = {
		fileName : fileName,
		result : undefined
	}
}

var finalFunc = function(){
	var dataStr = JSON.stringify(availableList);
	fs.writeFileSync("/home/andy/result.gray.json", dataStr);
}

var testPic = function(index){
	workingCount += 1;
	doneCount += 1;
	var fileName = fileList[index].fileName;
	console.log("==== " + fileName);
	var base64Str = fs.readFileSync(filePath + fileName).toString('base64');
	request.post({
		url : "http://10.193.251.188:8100/face_rec_api",
		form : {
			method : "upload_image_base64",
			base64_str : base64Str
		}
	}, function(err, resp, body){
		if (err) {
			console.log("[ERR] " + err);
		} else {
			if (body.indexOf("ERROR") < 0) {
				var respObj = eval( "(" + body + ")" );
				console.log("[INFO] #ID:" + index + "/" + listLength + " serverID:" + respObj.id);
				var resultObj = respObj.result;
				for (j in resultObj) {
					delete resultObj[j].rectId;
				}

				console.log("[INFO] " + fileName + " : " + resultObj.length);
				console.log("workingCount : " + workingCount + ", doneCount : " + doneCount);

				availableList.push({
					fileName : fileName,
					result : resultObj
				});
			}
		}

		workingCount -= 1;
	})
}

var timer = setInterval(function(){
	if (doneCount < fileList.length) {
		if (workingCount < maxWorkingCount) {
			testPic(doneCount);
		}
	} else {
		if (workingCount == 0) {
			finalFunc();
			clearInterval(timer);
		}
	}
}, 30);
