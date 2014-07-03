//// API SERVER
// api.js
// Version : 1.0

var currentApiVersion = "1.0";
var processDir = "/home/bai/demos/deep_classify/engine/testdata/";
var serverIP = "127.0.0.1";
var serverPort = 8080;
var serverApiPath = '/image_api';
// var maxProcessQueueLength = 20; //Process up to 20 images to GPU at a time

//Requirements here
var http = require('http');
var net = require('net');
var fs = require('fs');
var formidable = require('formidable');
var urlParser = require('url').parse;
var util = require('util');

//Read Index File Here
var strToIdArr = new Array(1000);
var idData = "";
idData += fs.readFileSync("./classlist");

for (i=0;i<1000;i++){
	var pos = idData.indexOf("\n");
	strToIdArr[i] = idData.slice(0,pos);
	idData = idData.slice(pos+1);
}

function parseTCP(resultStr,queueLength) {
  var strArr = new Array(queueLength);
  var objArr = new Array(queueLength);

  for (i=0; i<queueLength; i++) {
    var tmpPos = resultStr.indexOf('\n');
    strArr[i] = resultStr.slice(0,tmpPos).slice(13);
    resultStr = resultStr.slice(tmpPos+1);
  }
  for (i=0; i<queueLength; i++) {
    objArr[i] ={
      id : new Array(5),
      number : new Array(5) 
    }; 

    for (j=0; j<5; j++){
      var tmpPos = strArr[i].indexOf(' ');
      var tmpStr = strArr[i].slice(0,tmpPos);
      objArr[i].id[j] = strToIdArr[parseInt(tmpStr)-1];
      strArr[i] = strArr[i].slice(tmpPos+1);

      tmpPos = strArr[i].indexOf(' ');
      var tmpStr = strArr[i].slice(0,tmpPos);
      objArr[i].number[j] = parseFloat(tmpStr);
      strArr[i] = strArr[i].slice(tmpPos+1);
    }
  }
  return objArr;
}

//make a queue here
var queue = new Array();
var queueStartPos = 0;
var currentQueueId = 0;

//set global lock here
var globalLock = 0; //start with unlocked status

//process queue here
setInterval(function(){
  // console.log("A process tick start..." + Date());
  if (! globalLock){
    var currentQueueLength = queue.length - queueStartPos;
    if (currentQueueLength > 0) {
      //start process here
      console.log("Process Queue Start Length: "+currentQueueLength+" "+Date());
      globalLock = 1; //Add Lock

      var newQueue = new Array();
      for (i=0; i<currentQueueLength; i++){
        queue[i + queueStartPos].status = "processing";
        newQueue[i] = queue[i + queueStartPos];
        fs.renameSync(newQueue[i].fileName, processDir + newQueue[i].id + ".JPEG");
        console.log("MV "+newQueue[i].fileName+" "+processDir + newQueue[i].id + ".JPEG "+Date());
      }

      var connection = new net.Socket();
      var connectionBody = '';
      connection.connect(8008,'10.193.251.173');
      connection.write('NewImages');
      connection.on('data', function(d){connectionBody += d});
      connection.on('close', function(){
        connection.destroy();

        var result = connectionBody.slice(16); /*useless data on the first 16 bytes*/
        console.log("SERVER Result : "+result);
        var resultObj = parseTCP(result,currentQueueLength);
        console.log(JSON.stringify(resultObj.length));

        //post-process the queue
        for (i=0; i<currentQueueLength; i++){
          queue[i + queueStartPos].status = "done";
          queue[i + queueStartPos].result = resultObj[i];
        }
        queueStartPos += newQueue.length;

        globalLock = 0; //unlock It
      });
    }
  }
} , 1000*1);

setInterval(function(){
  console.log(Date()+"====Full Length : "+queue.length);
  // console.log(queue);
},1000*30);

http.createServer(function (req, res) {
  if (req.method.toLowerCase() == "post") {
    var urlPath = urlParser(req.url).pathname;
    if (urlPath == serverApiPath) {
      var form = new formidable.IncomingForm();
      form.uploadDir = "./images/";
      form.encoding = 'utf-8';
      form.keepExtensions = false;

      form.parse(req, function(err, fields, files) {
        console.log(""+Date());
	console.log("Version : "+fields.version);

        res.writeHead(200, {'content-type': 'text/plain'});

        if (fields.version != currentApiVersion) {
          res.end("This API is running on version '1.0' !");
          return;
        }
        if (! fields.method) {
          res.end("You have to specify an API method !");
          return;
        }

        var responseObj;
        var resultFormat = 'json'; // default json.

        switch (fields.method) {
          case 'upload_image' :

            if (! files.imgfile){
              res.end("File not uploaded, use 'imgfile' field.");
              return;
            }

            if (files.imgfile.size <= 0) {
              res.end("Illegal File Size"); return;
            }

            var imgId = currentQueueId;    currentQueueId++;
            var imgObj = {
              id : imgId,
              fileName : files.imgfile.path,
              fileSize : files.imgfile.size,
              addedTime : (Date()),
              status : "waiting",
              result : null
              // ...... and more
            };
            queue.push(imgObj);

            responseObj = { id : imgId };
            res.end(JSON.stringify(responseObj));
            return;

          case 'check_image' :

            var imgId = fields.id;
            if (parseInt(imgId) == 0) {
              if (queue.length == 0) {
                res.end("Illegal image ID.");
                return;
              }
            } else if ((! parseInt(imgId)) || imgId < 0 || imgId > currentQueueId) {
              res.end("Illegal image ID.");
              return;
            }

            imgId = parseInt(imgId);
            if (! queue[imgId] ){
              res.end("Illegal image ID.");
              return;
            }

            if (queue[imgId].status.toLowerCase() == "done") {
              res.end(JSON.stringify({
                id : imgId,
                status : queue[imgId].status,
                result : queue[imgId].result   }));
              return;
            } else {
              res.end(JSON.stringify({
                id : imgId,
                status : queue[imgId].status   }));
              return;
            }

          default :
            res.end("Unknown method.");
            return;

          //END CASE
        }
      });
    }
  } else {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('{ "error" : "PLEASE USE HTTP POST METHOD"}');
  }

}).listen(serverPort, serverIP);

console.log('API server running at http://'+serverIP+':'+serverPort+serverApiPath);
