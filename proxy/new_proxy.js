//////////
var http = require('http');
var urlParser = require('url').parse;

http.createServer(function (req, res) {
    // console.log(req);
    if (req.method.toLowerCase() == "get"){
        res.writeHead(200, {
            'Content-Type' : 'text/plain',
            'Access-Control-Allow-Origin' : '*'
        });
        res.end('{ "error" : "PLEASE USE HTTP POST METHOD"}');
    } else if (req.method.toLowerCase() == "post"){
        var fullData = new Buffer("",'utf-8');
        var dataParts = 0;

        req.on('data',function(d){
            fullData = Buffer.concat([fullData, d]);
            console.log("Got a Part. LEN:" + d.length);
            dataParts++;
        });

        req.on('end',function(){
            console.log("Data in " + dataParts + " parts...");
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin' : '*'
            });

            var urlPath = urlParser(this.url).pathname;
            //POST DATA
            var postOptions = {
                hostname: '10.193.251.172',
                port: 8080,
                path: '/image_api',
                method: 'POST',
                headers : req.headers
            };
            if (urlPath == "/face_api") {
                postOptions.port = 8081;
                postOptions.path = '/face_api';
            }


            var postReq = http.request(postOptions, function(postRes) {
                // console.log('STATUS: ' + postRes.statusCode);
                // console.log('HEADERS: ' + JSON.stringify(res.headers));
                postRes.setEncoding('utf8');
                var postResult = "";
                postRes.on('data', function (chunk) {
                    res.write(chunk);
                });

                postRes.on('end',function(){
                    res.end();
                });
            });
            // console.log(fullData);
            postReq.write(fullData);
            postReq.end();

            postReq.on('error', function(e) {
                console.log('problem with request: ' + e.message);
            });
        });
    } else {
        res.end();
    }
}).listen(8080, '192.168.12.160');

console.log("start proxy...");