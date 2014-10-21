// API : detection/detect.js
// By Andy 2014
var util = require('util');

exports.worker = function(req, resp) {
	resp.end(util.inspect(req));
}
