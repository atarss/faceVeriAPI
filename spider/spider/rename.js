//rename.js
//rename filename to MD5 Hash

var crypto = require('crypto');
var fs = require('fs');
var md5 = function(name){return crypto.createHash('md5').update(name).digest('hex')}

var filePath = "/home/andy/Pictures/pic_jiang/"

var fileList = fs.readdirSync(filePath);

for (i in fileList) {
	var fullPath = filePath + fileList[i];
	var buffer = fs.readFileSync(fullPath);
	var newFileName = filePath + md5(buffer) + ".jpg";
	fs.rename(fullPath, newFileName, function(err){
		if (err) {
			console.log("RENAME FAILED. (Onaji Fairu Desu.)");
		}
	})
}