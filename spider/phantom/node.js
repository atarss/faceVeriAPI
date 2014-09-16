var fs = require("fs");
var spawn = require('child_process').spawn;
var filename = "name_list";

var fileStr = fs.readFileSync("name_list_uniq") + "";

var nameArr = [];
var failedArr = [];

var intervalCounter, doneCounter = 0, globalLock=0;

var workingCount = 0;
var doneCount = 0;
var maxWorkingCount = 10;

while (fileStr.indexOf("\n") > 0) {
	var index = fileStr.indexOf("\n");
	var tmpName = fileStr.slice(0,index);

	nameArr.push(tmpName);

	fileStr = fileStr.slice(index+1);
}

// Names already in nameArr

function singleWorker(index){
	workingCount += 1;
	doneCount += 1;
	
	var newSpawn = spawn("phantomjs", ["--ignore-ssl-errors=true" , "--proxy=10.193.118.30:3128" , "spider.js" , nameArr[index] ]);

	//If timeout...
	var isKilled = false;
	var timer = setInterval(function(){
		failedArr.push(nameArr[index]);
		newSpawn.kill();
		console.log("[LOG] Killed [" + index + "]" + nameArr[index]);
		isKilled = true;
		clearInterval(timer);
	}, 60*1000); // 60s for timeout.

	var stdoutStr = "";
	newSpawn.stdout.on('data', function(data){
    	stdoutStr += data;
    });
	newSpawn.stderr.on('data', function(data){
		console.log("[STDERR] : " + data);
	});

	newSpawn.on('close', function(){
		clearInterval(timer);
		if (isKilled) {
			console.log("Kill and trigged 'close' callback function");
		}

		console.log(Date() + " [" + index + "]" + nameArr[index] + " is done.");

		//write to file 
		if (! fs.existsSync(nameArr[index])) {
			fs.mkdirSync(nameArr[index]);
		}
		fs.writeFileSync(nameArr[index]+"/list.txt", stdoutStr);

		workingCount -= 1;
	});

}

var timer = setInterval(function(){
	if (doneCount < nameArr.length) {
		if (workingCount < maxWorkingCount) {
			singleWorker(doneCount);
		}
	} else {
		if (workingCount == 0) {
			clearInterval(timer);

			// finalFunc();
			var failedStr = "";
			for (i in failedArr) {
				failedStr += failedArr[i];
				failedStr += "\n";
			}
			fs.writeFileSync("failed.txt", failedStr);

		}
	}
}, 30);
