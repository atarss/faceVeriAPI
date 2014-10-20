// apilist.js
//
// A List for All Available API Methods

var list = {};

function addList(apiMethodName) {
	list[apiMethodName] = require("./public/" + apiMethodName + ".js");
}

//For Testing Here
addList("64d341bbc108ca9ffc2db7f943e38a6f");

exports.list = list;
