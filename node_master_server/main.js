var serverList = require("./server_list.js").list;
var serverObject = new Array();
var sigintTriggerArr = new Array();

var serverCount = serverList.length;
var startTime = new Date();
for (index = 0; index < serverCount; index++) {
  console.log("========");
  var thisData = serverList[index];
  var thisServerStr = "http://" + thisData.serverAddress + ":" + thisData.serverPort + "/" + thisData.httpApiName;
  console.log("[MAIN INFO] Server ID<" + (index+1) + "> Found : " + thisServerStr);
  console.log("[MAIN INFO] Loading Server Modules : " + thisData.fileName + "  ......");
  serverObject.push(require(thisData.fileName));
  console.log("[MAIN INFO] Load Success.");
  console.log("[MAIN INFO] Start Server by Calling Function " + thisData.functionName);

  (serverObject[index][thisData.functionName])(thisData.serverAddress, thisData.serverPort);
  //Call Main Server Function

  if (thisData.sigintTrigger) {
    sigintTriggerArr.push(serverObject[index][thisData.sigintTrigger]);
  }

  console.log("[MAIN INFO] Server Started " + thisServerStr);
}

var endTime = new Date();
console.log("=====================");

console.log("[MAIN INFO] Binding SIGINT Trigger...." + sigintTriggerArr.length + " in total.");
process.on("SIGINT",function(){
  for (index in sigintTriggerArr) {
    (sigintTriggerArr[index])();
  }

  process.exit(255);
})

console.log("[MAIN INFO] All Server Started. Time : " + (endTime - startTime) + "ms");
