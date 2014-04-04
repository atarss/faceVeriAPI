//// N-TRAIN API SERVER 
// main.js
// Version : 1.0

var currentDirectory = "/home/liuyuxuan/dev/node/nTrain/";
var serverIP = "10.193.251.172";
var serverPort = 8082;
var serverApiPath = '/ntrain_api';
var socketServerIP = "10.193.251.172";
var socketServerPort = 8888;

//Requirements here
var http = require('http');
var net = require('net');
var fs = require('fs');
var formidable = require('formidable');
var urlParser = require('url').parse;
var util = require('util');
var sys = require("sys");
var spawn = require('child_process').spawn;
var htmlparser = require('htmlparser');

var sessionQueue = new Array();

//Send an array here
function constructDetectXmlFile (imgPathStr) {
  var resultStr = '<?xml version = "1.0"?><input><path>';
  resultStr += imgPathStr;
  resultStr += "</path></input>";
  return resultStr;
}

function parseXmlImgData (imgDomObj) {
  var resultArr = new Array();
  var facenum = parseInt(imgDomObj[1].children[0].data);
  for (i=0;i<facenum;i++){
    var tmpArr = imgDomObj[2+i].children;
    var tx = parseInt(tmpArr[0].children[0].data);
    var ty = parseInt(tmpArr[1].children[0].data);
    var tw = parseInt(tmpArr[2].children[0].data);
    var th = parseInt(tmpArr[3].children[0].data);
    var tpoints = new Array();
    for (j=0;j<27;j++){
      var p_x = parseInt(tmpArr[4+j].children[0].children[0].data)
      var p_y = parseInt(tmpArr[4+j].children[1].children[0].data)
      tpoints.push({ x : p_x, y : p_y });
    }

    resultArr.push({
      rectId : i,
      x : tx, y : ty, w: tw, h : th,
      points : tpoints
    });
  }

  return resultArr;
}

http.createServer(function (req, res) {
  if (req.method.toLowerCase() == "post") {
    var urlPath = urlParser(req.url).pathname;
    if (urlPath == serverApiPath) {
      var form = new formidable.IncomingForm();
      form.uploadDir = "./images/";
      form.encoding = 'utf-8';
      form.keepExtensions = true;

      form.parse(req, function(err, fields, files) {
        res.writeHead(200, {'content-type': 'text/plain', 'Access-Control-Allow-Origin': '*'});

        if (! fields.method) {
          res.end("You have to specify an API method !");
          return;
        }

        switch (fields.method) {
          case 'create_session' :
            var new_id = sessionQueue.length;
            sessionQueue.push({id : new_id});
            fs.mkdir('/home/liuyuxuan/dev/node/nTrain/session/'+new_id, function(){
              res.end(JSON.stringify({
                sessionId : new_id
              }));
              sessionQueue[new_id].sessionPath = '/home/liuyuxuan/dev/node/nTrain/session/'+new_id;
              sessionQueue[new_id].imgArr = new Array();
              fs.mkdir('/home/liuyuxuan/dev/node/nTrain/session/'+new_id+'/images', function(){
                fs.mkdir('/home/liuyuxuan/dev/node/nTrain/session/'+new_id+'/xml', function(){} );
              });
            })
            return;

          case 'upload_image' :
            if (! files.imgfile){
              res.end("File not uploaded, use 'imgfile' field.");
              return;
            }

            if (! fields.session_id) {
              res.end("Please provide a session ID.");
              return;
            };

            var thisSessionId = parseInt(fields.session_id);
            console.log("thisSessionId : " + thisSessionId);
            if (thisSessionId < 0 || thisSessionId >= sessionQueue.length) {
              res.end("Illegal Session ID.");
              return;
            }

            var imgId = sessionQueue[thisSessionId].imgArr.length;
            var newImgPath = currentDirectory + "session/" + thisSessionId + "/" + files.imgfile.path;
            fs.rename(currentDirectory + files.imgfile.path, newImgPath, function(){
              var imgObj = {
                id : imgId,
                fileName : newImgPath,
                fileSize : files.imgfile.size,
                addedTime : (Date()),
                result : null
              };

              sessionQueue[thisSessionId].imgArr.push(imgObj);
              var xmlStr = constructDetectXmlFile(newImgPath);
              var inputXmlFileName = currentDirectory + "session/" + thisSessionId + "/xml/" + imgId + ".input.xml";
              var outputXmlFileName = currentDirectory + "session/" + thisSessionId + "/xml/" + imgId + ".output.xml";
              fs.writeFile(inputXmlFileName,xmlStr, function(){
                //start program
                var startDate = new Date(); //check time here

                var connection = new net.Socket();
                var connectionBody = '';
                connection.connect(socketServerPort,socketServerIP);
                connection.write(inputXmlFileName + "#" + outputXmlFileName + "#" + "detect");
                connection.on('data', function(d){connectionBody += d});
                connection.on('close', function(){
                  //program end
                  connection.destroy();
                  console.log(Date());
                  console.log(connectionBody);
                  var endDate = new Date();
                  console.log("Time : "+(endDate-startDate)+"ms");
                  fs.readFile(outputXmlFileName, function(err, outputXmlStr) {
                    if (err) {
                      console.log("ERR : "+Date());
                      console.log(err);
                      res.end("Read Output File ERROR : "+outputXmlFileName);
                      return;
                    } else {
                      //start xml parser
                      var xmlHandler = new htmlparser.DefaultHandler(function (error, dom){ }, { verbose: false, ignoreWhitespace: true });
                      var xmlParser = new htmlparser.Parser(xmlHandler);
                      xmlParser.parseComplete(outputXmlStr);
                      var imgResult = parseXmlImgData(xmlHandler.dom[1].children[0].children);
                      // var imgResult2 = parseXmlImgData(xmlHandler.dom[1].children[1].children);
                      // console.log(xmlHandler.dom[1].children[1].children)
                      // console.log(imgResult1);
                      //queue[imgId1].result = imgResult1;

                      responseObj = {
                        id : imgId, 
                        result : imgResult, 
                        time : (endDate-startDate)
                      };
                      
                      res.end(JSON.stringify(responseObj));
                    }
                  });
                });
              });
            });

            return;

          // case 'compare_image' :
          //   var imgId1 = parseInt(fields.img_id_1);
          //   var imgId2 = parseInt(fields.img_id_2);
          //   if ((imgId1 >= currentQueueId) || (imgId2 >= currentQueueId)) {
          //     res.end("Illegal Image ID"); return;
          //   }

          //   var rectId1 = parseInt(fields.rect_id_1);
          //   var rectId2 = parseInt(fields.rect_id_2);
          //   if ((rectId1 >= queue[imgId1].result.length) || (rectId2 >= queue[imgId2].result.length)) {
          //     res.end("Illegal RECT ID"); return;
          //   }

          //   var XmlStr = constructRecXmlFile(imgId1, rectId1, imgId2, rectId2);
          //   var recInputXmlFileName = currentDirectory + "xml/rec.input.xml";
          //   var recOutputFileName = currentDirectory + "xml/rec.output.txt";
          //   fs.writeFileSync(recInputXmlFileName,XmlStr);
          //   console.log(XmlStr);

          //   var startDate = new Date();
          //   var connection = new net.Socket();
          //   var connectionBody = '';
          //   connection.connect(socketServerPort,socketServerIP);
          //   connection.write(recInputXmlFileName + "#" + recOutputFileName + "#" + "recognition");
          //   connection.on('data', function(d){connectionBody += d});

          //   connection.on('close',function(){
          //     connection.destroy();
          //     console.log(connectionBody);
          //     var endDate = new Date();
          //     console.log("Time : "+(endDate-startDate)+"ms");
          //     fs.readFile(recOutputFileName, function(err, outputStr){
          //       console.log("start read file 2");
          //       if (err) {
          //         console.log("ERR : "+Date());
          //         console.log(err);
          //         res.end("Read Output File ERROR : " + recOutputFileName);
          //         return;
          //       } else {
          //         var resultNumber = parseFloat(outputStr + "");
          //         console.log("Result : " + resultNumber);

          //         responseObj = {
          //           result : resultNumber,
          //           time : (endDate-startDate)
          //         };

          //         res.end(JSON.stringify(responseObj));
          //       }
          //     });
          //   });
          //   return;

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

console.log('Socket API server running at http://' + serverIP + ":" + serverPort + serverApiPath);
