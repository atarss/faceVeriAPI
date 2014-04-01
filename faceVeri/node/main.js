//// FACE RECOGNIZATION API SERVER 
// main.js
// Version : 1.0

var currentDirectory = "/home/liuyuxuan/dev/node/face_api_plus/";
var serverIP = "10.193.251.172";
var serverPort = 8082;
var socketServerIP = "10.193.251.173";
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

var queue = new Array();
var currentQueueId = 0;

function constructDetectXmlFile (imgPath1, imgPath2) {
  var resultStr = '<?xml version = "1.0"?><input><path>';
  resultStr += imgPath1;
  resultStr += "</path><path>";
  resultStr += imgPath2;
  resultStr += "</path></input>"
  return resultStr;
}

function constructRecXmlFile (imgId1, rectId1, imgId2, rectId2) {
  // console.log(rectId1 + ", " + rectId2);

  var resultStr = '<?xml version = "1.0"?><output><result><path>';
  resultStr += queue[imgId1].fileName;
  resultStr += "</path><rec><x>";
  resultStr += queue[imgId1].result[rectId1].x;
  resultStr += "</x><y>";
  resultStr += queue[imgId1].result[rectId1].y;
  resultStr += "</y><w>";
  resultStr += queue[imgId1].result[rectId1].w;
  resultStr += "</w><h>";
  resultStr += queue[imgId1].result[rectId1].h;
  resultStr += "</h>";
  for (i=0; i<27; i++) {
    resultStr += ("<point><x>" + queue[imgId1].result[rectId1].points[i].x + "</x>");
    resultStr += ("<y>" + queue[imgId1].result[rectId1].points[i].y + "</y></point>");
  }

  resultStr += "</rec></result><result><path>"
  resultStr += queue[imgId2].fileName;
  resultStr += "</path><rec><x>";
  resultStr += queue[imgId2].result[rectId2].x;
  resultStr += "</x><y>";
  resultStr += queue[imgId2].result[rectId2].y;
  resultStr += "</y><w>";
  resultStr += queue[imgId2].result[rectId2].w;
  resultStr += "</w><h>";
  resultStr += queue[imgId2].result[rectId2].h;
  resultStr += "</h>";
  for (i=0; i<27; i++) {
    resultStr += ("<point><x>" + queue[imgId2].result[rectId2].points[i].x + "</x>");
    resultStr += ("<y>" + queue[imgId2].result[rectId2].points[i].y + "</y></point>");
  }  

  resultStr += "</rec></result></output>";

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
    if (urlPath == "/face_api") {
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
          case 'upload_image' :
          //upload two images here
            if (! files.img_file_1){
              res.end("File not uploaded, use 'img_file_1' field.");
              return;
            }
            if (! files.img_file_2){
              res.end("File not uploaded, use 'img_file_2' field.");
              return;
            }

            if ((files.img_file_1.size <= 0) || (files.img_file_2.size <= 0)) {
              res.end("Illegal File Size"); 
              return;
            }

            var imgId1 = currentQueueId;    
            var imgId2 = currentQueueId+1;
            currentQueueId+=2;

            var imgObj1 = {
              id : imgId1,
              fileName : currentDirectory + files.img_file_1.path,
              fileSize : files.img_file_1.size,
              addedTime : (Date()),
              result : null
            };

            var imgObj2 = {
              id : imgId2,
              fileName : currentDirectory + files.img_file_2.path,
              fileSize : files.img_file_2.size,
              addedTime : (Date()),
              result : null 
            };

            queue.push(imgObj1);
            queue.push(imgObj2);

            var xmlStr = constructDetectXmlFile(imgObj1.fileName, imgObj2.fileName);
            var inputXmlFileName = currentDirectory + "xml/"+imgId1+".input.xml";
            var outputXmlFileName = currentDirectory + "xml/"+imgId1+".output.xml";
            fs.writeFileSync(inputXmlFileName,xmlStr);
            console.log(xmlStr);

            //start program
            var startDate = new Date(); //check time here

            var connection = new net.Socket();
            var connectionBody = '';
            connection.connect(socketServerPort,socketServerIP);
            connection.write(inputXmlFileName + "#" + outputXmlFileName + "#" + "detect");
            connection.on('data', function(d){connectionBody += d});

            // var newExec = spawn('/home/liuyuxuan/dev/xml_interface/project/detxml' , 
            //   [inputXmlFileName, 
            //    outputXmlFileName, 
            //    '/home/liuyuxuan/dev/faceDet/project/Models/f_cascade.xml', 
            //    '/home/liuyuxuan/dev/faceDet/project/Models/models.file']
            // );

            connection.on('close', function(){
              //program end
              connection.destroy();
              console.log(connectionBody);
              var endDate = new Date();
              console.log("Time : "+(endDate-startDate)+"ms");
              var outputXmlStr = fs.readFileSync(outputXmlFileName);

              //start xml parser
              var xmlHandler = new htmlparser.DefaultHandler(function (error, dom){ }, { verbose: false, ignoreWhitespace: true });
              var xmlParser = new htmlparser.Parser(xmlHandler);
              xmlParser.parseComplete(outputXmlStr);
              // console.log(xmlHandler.dom[1].children[0].children[1]);
              var imgResult1 = parseXmlImgData(xmlHandler.dom[1].children[0].children);
              var imgResult2 = parseXmlImgData(xmlHandler.dom[1].children[1].children);
              // console.log(xmlHandler.dom[1].children[1].children)
              // console.log(imgResult1);
              queue[imgId1].result = imgResult1;
              queue[imgId2].result = imgResult2;
              
              responseObj = {
                img1 : { id : imgId1 , result : imgResult1 } , 
                img2 : { id : imgId2 , result : imgResult2 } ,
                time : (endDate-startDate)
              };
              res.end(JSON.stringify(responseObj));
            });

            return;

          case 'compare_image' :
            var imgId1 = parseInt(fields.img_id_1);
            var imgId2 = parseInt(fields.img_id_2);
            if ((imgId1 >= currentQueueId) || (imgId2 >= currentQueueId)) {
              res.end("Illegal Image ID"); return;
            }

            var rectId1 = parseInt(fields.rect_id_1);
            var rectId2 = parseInt(fields.rect_id_2);
            if ((rectId1 >= queue[imgId1].result.length) || (rectId2 >= queue[imgId2].result.length)) {
              res.end("Illegal RECT ID"); return;
            }

            var XmlStr = constructRecXmlFile(imgId1, rectId1, imgId2, rectId2);
            var recInputXmlFileName = currentDirectory + "xml/rec.input.xml";
            var recOutputFileName = currentDirectory + "xml/rec.output.txt";
            fs.writeFileSync(recInputXmlFileName,XmlStr);
            console.log(XmlStr);

            var startDate = new Date();
            var connection = new net.Socket();
            var connectionBody = '';
            connection.connect(8888,'10.193.251.173');
            connection.write(recInputXmlFileName + "#" + recOutputFileName + "#" + "recognition");
            connection.on('data', function(d){connectionBody += d});

            // var recExec = spawn('/home/liuyuxuan/dev/xml_interface/project/recxml',[
            //   recInputXmlFileName,
            //   '/home/liuyuxuan/dev/xml_interface/project/Models/f_cascade.xml',
            //   '/home/liuyuxuan/dev/xml_interface/project/Models/models.file',
            //   '/home/liuyuxuan/dev/xml_interface/project/rModels/model.bin',
            //   '/home/liuyuxuan/dev/xml_interface/project/rModels/paras.bin',
            //   '/home/liuyuxuan/dev/xml_interface/project/rModels/hmodel.bin',
            //   '/home/liuyuxuan/dev/xml_interface/project/rModels/hparas.bin',
            //   recOutputFileName
            // ]);

            connection.on('close',function(){
              connection.destroy();
              console.log(connectionBody);
              var endDate = new Date();
              console.log("Time : "+(endDate-startDate)+"ms");
              var outputStr = fs.readFileSync(recOutputFileName);
              var resultNumber = parseFloat(outputStr);
              console.log("Result : " + resultNumber);

              responseObj = {
                result : resultNumber,
                time : (endDate-startDate)
              };

              res.end(JSON.stringify(responseObj));
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

console.log('Socket API server running at http://' + serverIP ":" + serverPort + '/face_api');
