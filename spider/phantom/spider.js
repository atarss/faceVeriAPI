//Spider for google images using Phantom.js
//Andy 2014-09-16 01:46 CST(GMT+8)

var page = require('webpage').create();
var system = require('system');
var args = system.args;

var queryStr = "";
if (args.length < 2) {
    console.log('usage : phantomjs spider.js Google Key Word"');
} else {
    for (i=1; i<args.length-1; i++) {
        queryStr += args[i];
        queryStr += " ";
    }
    queryStr += args[args.length-1];
}

var googleUrl = "https://www.google.com.hk/search?newwindow=1&safe=strict&biw=1920&bih=948&tbm=isch&q=" + encodeURIComponent(queryStr);

page.settings.userAgent = "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36"

page.open(googleUrl, function(status){
    if (status !== 'success') {
        console.log('Unable to access network');
    } else {
        var str = page.evaluate(function(){
            var s="";
            var arr = document.querySelectorAll(".rg_i");

            for (i=0; i<arr.length; i++) {
                var nodeUrl = arr[i].parentNode.href;
                
                //process string
                nodeUrl = nodeUrl.slice(39) // google.com.hk
                var index = nodeUrl.indexOf("&imgrefurl=");
                if (index > 0) nodeUrl = nodeUrl.slice(0,index);

                if (nodeUrl.indexOf(".jpg") > 0) {
                    nodeUrl = nodeUrl.slice(0,nodeUrl.indexOf(".jpg")+4);
                    s += nodeUrl;
                    s += "\n";
                } else {
                    //Throw it! Do not need png or bmp...
                }
                
            }

            return s.slice(0,s.length-1);
        });

        console.log(str);
    }
    phantom.exit();
});
