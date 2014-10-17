// 64d341bbc108ca9ffc2db7f943e38a6f
// Magic Code for shutting down service.
// Only for Testing.

// Documentation can be put here.

exports.worker = function(reqParaObj, resp) {
	resp.end("Shutting Down......");
	console.log("Shutting Down......");
	process.exit(255);
}