//spider.js for baidu image
//Andy 2014.07.17
var fs = require("fs");
var request = require("request");

var keyWord = "%E6%B1%9F%E6%B3%BD%E6%B0%91";
var maxPageNum = 60;

var urlArr = [];
var timerCount = 0;
var count = 0;


var callFunc = function (tmpI){
	var thisUrl = "http://image.baidu.com/i?lm=-1&tn=result_pageturn&pv=&word=" + keyWord + "&z=0&pn=" + (i*60) + "&cl=2&ie=utf-8";
    console.log(thisUrl + " Loading...")
    request({
    	url : thisUrl,
    	proxy : "http://10.193.250.16:3128"
    }, function(err, resp, body){
    	console.log("#" + tmpI + " is ready");
    	// var fileName = "/home/andy/dev/node/spider/result/result_"+tmpI+".html";
        // fs.writeFileSync(fileName, body);
        for (i=0;i<60;i++){
            var firstIndex = body.indexOf('"objURL":');
            var endIndex = body.indexOf('     ","fromURL":');
            if (endIndex > 0) {
                var imgUrl = body.slice(firstIndex + 10, endIndex);
                // console.log("URL get : " + imgUrl);
                urlArr.push(imgUrl);
                body = body.slice(endIndex+20);
            }
        }

        count++;
    })
}

var downloadPicFunc = function(index, url){
    console.log("Downloading " + url + " ....");
    request({
        url : url,
        proxy : "http://10.193.250.16:3128"
    }, function(err, resp, body){
        var fileName = "/home/andy/dev/node/spider/pic/img_" + index +""
    })
}

for (i=0; i<maxPageNum; i++){
	callFunc(i);
}

timerCount = setInterval(function(){
    if (count == maxPageNum){
        // spider success
        clearInterval(timerCount);
        //filelist ready in urlArr

        for (var i=0, len=urlArr.length; i<len; i++) {
            console.log(urlArr[i]);
        }
    }
}, 1000);
