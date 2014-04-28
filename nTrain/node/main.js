//// N-TRAIN API SERVER 
// main.js
// Version : 1.0

var currentDirectory = "/home/demoweb/face/node/nTrain/";
var trainDirectory = '/home/demoweb/face/Identification/project/HFeature/';
var compareDirectory = '/home/demoweb/face/Identification/project/recognize';
var serverIP = "10.193.251.188";
var serverPort = 8082;
var serverApiPath = '/ntrain_api';
var socketServerIP = "10.193.251.188";
var socketServerPort = 8888;

var dbFileName = currentDirectory + "queue.db";

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
var crypto = require('crypto');
function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
};

var queueJsonStr = fs.readFileSync(dbFileName) + "";
var sessionQueue = eval(queueJsonStr);
console.log("[INFO] Load queue.db file, LEN:" + queueJsonStr.length);

var tmpImageQueue = new Array();

//Save When Exit or Crashed
function saveQueueData() {
  var DBSTR = JSON.stringify(sessionQueue);
  fs.writeFileSync(dbFileName, DBSTR);
  console.log("[INFO] saved to " + dbFileName + " ; LEN:"+DBSTR.length);
  process.exit(0);
}

process.on('uncaughtException', function(err){
  console.log("[ERR] : " + JSON.stringify(err));
  saveQueueData();
});
process.on("SIGINT", saveQueueData);

function constructDetectXmlFile (imgPathStr) {
  var resultStr = '<?xml version = "1.0"?><input><path>';
  resultStr += imgPathStr;
  resultStr += "</path></input>";
  return resultStr;
}

function constructFaceXmlFile (faceObj, sessionId) {
  var resultStr = '<?xml version = "1.0"?><input>';
  for (i=0; i<faceObj.length; i++) {
    var thisPic = sessionQueue[sessionId].imgArr[faceObj[i].picId];
    var faceId = faceObj[i].faceId;
    resultStr += "<face><path>";
    resultStr += thisPic.fileName;
    resultStr += "</path><rec>";

    resultStr += ("<x>" + thisPic.result[faceId].x + "</x>");
    resultStr += ("<y>" + thisPic.result[faceId].y + "</y>");
    resultStr += ("<w>" + thisPic.result[faceId].w + "</w>");
    resultStr += ("<h>" + thisPic.result[faceId].h + "</h>");

    for (j=0; j<27; j++) {
      resultStr += "<point><x>";
      resultStr += thisPic.result[faceId].points[j].x;
      resultStr += "</x><y>";
      resultStr += thisPic.result[faceId].points[j].y;
      resultStr += "</y></point>";
    }

    resultStr += "</rec></face>";
  }

  resultStr += "</input>";
  return resultStr;
}

function constructTmpDetectXmlFile(imgObj, faceId) {
  var resultStr = '<?xml version = "1.0"?><input><face><path>';
  console.log("[DEBUG] "+JSON.stringify(imgObj));
  resultStr += imgObj.path;
  resultStr += "</path><rec>";

  resultStr += ("<x>" + imgObj.result[faceId].x + "</x>");
  resultStr += ("<y>" + imgObj.result[faceId].y + "</y>");
  resultStr += ("<w>" + imgObj.result[faceId].w + "</w>");
  resultStr += ("<h>" + imgObj.result[faceId].h + "</h>");

  for (j=0; j<27; j++) {
    resultStr += "<point><x>";
    resultStr += imgObj.result[faceId].points[j].x;
    resultStr += "</x><y>";
    resultStr += imgObj.result[faceId].points[j].y;
    resultStr += "</y></point>";
  }

  resultStr += "</rec></face></input>";
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

function getIdByAlias(aliasStr){
  for (i=0; i<sessionQueue.length; i++){
    if (sessionQueue[i].alias == aliasStr) return i;
  }
  return -1; // Not Found.
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

        switch (fields.method) { // input alias
          case 'get_id_by_alias' : 
            var sessionAlias = fields.alias;
            var sessionId = getIdByAlias(sessionAlias);
            res.end(JSON.stringify({alias : sessionAlias, id : sessionId})); // -1 means not found.
            return;

          case 'get_model_list' :
            var modelArr = new Array();
            for (i=0; i<sessionQueue.length; i++){
              if (sessionQueue[i].training >= 0) {
                modelArr.push({ id : i, alias : sessionQueue[i].alias });
              }
            }
            res.end(JSON.stringify(modelArr));
            return;

          case 'create_session' :
            var sessionAlias, new_id = sessionQueue.length;
            if (!fields.alias) {
              sessionAlias = "" + new_id;
            } else {
              sessionAlias = fields.alias;
            }
            
            sessionQueue.push({
              id : new_id,
              alias : sessionAlias,
              training : -1 // -1:not have been trained, 0:training, 1:trained
            });
            fs.mkdir(currentDirectory + 'session/' + new_id, function(){
              res.end(JSON.stringify({ sessionId : new_id , alias : sessionAlias}));

              sessionQueue[new_id].sessionPath = currentDirectory + 'session/' + new_id;
              sessionQueue[new_id].imgArr = new Array();
              fs.mkdir(currentDirectory + 'session/' + new_id + '/images', function(){
                fs.mkdir(currentDirectory + 'session/' + new_id + '/xml', function(){
                  fs.mkdir(currentDirectory + 'session/' + new_id + '/model', function(){});
                });
              });
            });

            console.log("[DATE] "+Date());
            console.log("[INFO] Create Session. ID:"+new_id+", Alias:"+sessionAlias);
            return;

          case 'check_session_status' :
            var thisSessionId = parseInt(fields.session_id);
            if (thisSessionId >=0 && thisSessionId < sessionQueue.length){
              res.end(JSON.stringify({
                id : thisSessionId,
                status : sessionQueue[thisSessionId].training
              }));
            } else {
              res.end("Illegal Session ID.");
            }
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
                  console.log("[INFO] " + connectionBody);
                  var endDate = new Date();
                  console.log("[INFO] Detection Time : "+(endDate-startDate)+"ms");
                  fs.readFile(outputXmlFileName, function(err, outputXmlStr) {
                    if (err) {
                      console.log("[ERR] : "+Date());
                      console.log(err);
                      res.end("[ERR] Read Output File ERROR : "+outputXmlFileName);
                      return;
                    } else {
                      //start xml parser
                      var xmlHandler = new htmlparser.DefaultHandler(function (error, dom){ }, { verbose: false, ignoreWhitespace: true });
                      var xmlParser = new htmlparser.Parser(xmlHandler);
                      xmlParser.parseComplete(outputXmlStr);
                      var imgResult = parseXmlImgData(xmlHandler.dom[1].children[0].children);
                      // var imgResult2 = parseXmlImgData(xmlHandler.dom[1].children[1].children);
                      //queue[imgId1].result = imgResult1;
                      sessionQueue[thisSessionId].imgArr[imgId].result = imgResult;
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

          case 'submit_face' :
            if (! fields.session_id) {
              res.end("Please provide a session ID.");
              return;
            };
            if (! fields.json_data) {
              res.end("Please provide JSON Object.");
              return;
            };

            var jsonObj = eval(fields.json_data);
            var thisSessionId = parseInt(fields.session_id);

            if (thisSessionId<0 || thisSessionId >= sessionQueue.length){
              res.end("Illegal Session ID.");
              return;
            }

            console.log(fields.json_data);

            var xmlStr = constructFaceXmlFile(jsonObj, thisSessionId);
            var xmlPath = currentDirectory + 'session/' + thisSessionId + "/xml/" + 'face.xml';
            // console.log(JSON.stringify(jsonObj));
            sessionQueue[thisSessionId].trainPics = jsonObj;
            fs.writeFile(xmlPath, xmlStr, function(){
              // console.log(xmlStr);
              var HPPath = currentDirectory + "session/" + thisSessionId + "/model/hparas";
              var HMPath = currentDirectory + "session/" + thisSessionId + "/model/hmodel";
              var HPBPath = currentDirectory + "session/" + thisSessionId + "/model/hparas.bin";
              var HMBPath = currentDirectory + "session/" + thisSessionId + "/model/hmodel.bin";

              var startDate = new Date();
              process.chdir(trainDirectory);
              console.log([ xmlPath, HPPath, HMPath, HPBPath, HMBPath, thisSessionId ]);
              var newTrainProcess = spawn("./process.sh", [ xmlPath, HPPath, HMPath, HPBPath, HMBPath, thisSessionId ]);
              process.chdir(currentDirectory);

              res.end(JSON.stringify({result : 1}));

              sessionQueue[thisSessionId].training = 0;
              newTrainProcess.stdout.on('data', function(data){
                console.log("[SHELL] " + data);
              });
              newTrainProcess.stderr.on('data', function(data){
                console.log("[STDERR] : " + data);
              });

              newTrainProcess.on('close', function(){
                var endDate = new Date();
                console.log('[INFO] train end. Time: ' + (endDate - startDate) + "ms");
                sessionQueue[thisSessionId].training = 1;
              });

            });
            return;

          case 'detect_tmp_face' :
            if (! files.imgfile){
              res.end("File not uploaded, use 'imgfile' field.");
              return;
            }

            var tmpImgId = tmpImageQueue.length;
            tmpImageQueue[tmpImgId] = {};
            var tmpImgPath = currentDirectory + files.imgfile.path;
            tmpImageQueue[tmpImgId].path = tmpImgPath;
            var tmpInputXmlPath = currentDirectory + "tmpxml/" + tmpImgId + ".input.xml";
            var tmpOutputXmlPath = currentDirectory + "tmpxml/" + tmpImgId + ".output.xml";
            fs.writeFile(tmpInputXmlPath, constructDetectXmlFile(tmpImgPath), function(){
              var startDate = new Date(); //check time here

              var connection = new net.Socket();
              var connectionBody = '';
              connection.connect(socketServerPort,socketServerIP);
              connection.write(tmpInputXmlPath + "#" + tmpOutputXmlPath + "#" + "detect");
              connection.on('data', function(d){connectionBody += d});
              connection.on('close', function(){
                //program end
                connection.destroy();
                // console.log(Date());
                // console.log(connectionBody);
                var endDate = new Date();
                console.log("[INFO] Detection Time : "+(endDate-startDate)+"ms");
                fs.readFile(tmpOutputXmlPath, function(err, outputXmlStr) {
                  if (err) {
                    console.log("[ERR] : "+Date());
                    console.log(err);
                    res.end("[ERR] Read Output File ERROR : "+tmpOutputXmlPath);
                    return;
                  } else {
                    //start xml parser
                    var xmlHandler = new htmlparser.DefaultHandler(function (error, dom){ }, { verbose: false, ignoreWhitespace: true });
                    var xmlParser = new htmlparser.Parser(xmlHandler);
                    xmlParser.parseComplete(outputXmlStr);
                    var imgResult = parseXmlImgData(xmlHandler.dom[1].children[0].children);
                    tmpImageQueue[tmpImgId].result = imgResult;
                    // sessionQueue[thisSessionId].imgArr[imgId].result = imgResult;
                    responseObj = {
                      id : tmpImgId, 
                      result : imgResult, 
                      time : (endDate-startDate)
                    };
                    
                    res.end(JSON.stringify(responseObj));
                  }
                });
              });
            });

            return;

          case 'compare_image' :
            var sessionId = parseInt(fields.session_id);
            if ((sessionId >= sessionQueue.length) || (sessionId < 0)) {
              res.end("Illegal Session ID"); return;
            }
            if (sessionQueue[sessionId].training < 1) {
              res.end("Model not Trained."); return; 
            }

            var imgId = parseInt(fields.img_id);
            if ((imgId >= tmpImageQueue.length) || (imgId < 0)) {
              res.end("Illegal Image ID"); return;
            }
            var faceId = parseInt(fields.face_id);
            if ((faceId >= tmpImageQueue[imgId].result.length) || (faceId < 0)) {
              res.end("Illegal Face ID"); return;
            }
            
            var hash = md5(Date());
            var xmlStr = constructTmpDetectXmlFile(tmpImageQueue[imgId], faceId);
            var recInputXmlFileName = currentDirectory + "tmpxml/rec.input."+hash+".xml";
            var recOutputFileName = currentDirectory + "tmpxml/rec.output."+hash+".txt";
            console.log("[XML] " + recInputXmlFileName + " : " + xmlStr);
            fs.writeFileSync(recInputXmlFileName, xmlStr);

            var HPBPath = currentDirectory + "session/" + sessionId + "/model/hparas.bin";
            var HMBPath = currentDirectory + "session/" + sessionId + "/model/hmodel.bin";
            console.log("HPBPath " + HPBPath);
            console.log("HMBPath " + HMBPath);

            var startDate = new Date();
            process.chdir(compareDirectory);
            var compareProcess = spawn("perl", [ "single.pl", recInputXmlFileName, HMBPath, HPBPath, recOutputFileName ]);
            process.chdir(currentDirectory);
            compareProcess.stdout.on('data', function(data){
              console.log("[SHELL] " + data);
            });
            compareProcess.stderr.on('data', function(data){
              console.log("[STDERR] : " + data);
            });

            compareProcess.on('close', function(){
              var endDate = new Date();
              console.log('[INFO] compare end. Time: ' + (endDate - startDate) + "ms");
              var resultStr = fs.readFileSync(recOutputFileName);
              console.log("" + resultStr);
              var resultNumber = parseFloat(resultStr + "");
              res.end(JSON.stringify({
                result : resultNumber,
                time : (endDate - startDate)
              }));
            });

            return;
          case 'get_img_base64' : 
            var sessionId = parseInt(fields.session_id);
            var oldImgId = parseInt(fields.img_id);
            var imgId = sessionQueue[sessionId].trainPics[oldImgId].picId;
            var imgPath = sessionQueue[sessionId].imgArr[imgId].fileName;
            // console.log("[INFO] get img : "+imgPath);

            fs.readFile(imgPath, function(err, imgBuf){
              if (err) throw err;
              var base64Str = imgBuf.toString("base64");
              res.end(JSON.stringify({
                session_id : sessionId,
                img_id : imgId,
                base64_str : base64Str
              }));
            });

            return;

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

console.log('[INFO] Socket API server running at http://' + serverIP + ":" + serverPort + serverApiPath);
