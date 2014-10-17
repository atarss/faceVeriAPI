// database.js
// Database Driver for API
// Using mongodb as database backend.

var mongo = require("mongodb");
exports.mongo = mongo;

function simpleConnection(mongoAddress, callback) {
	mongo.MongoClient.connect(mongoAddress, function(err, db){
		if (err) {
			apiUtils.sysErr("Warning : cannot connect to mongodb server. Daemon is down?");
		} else {
			callback(db);
		}
	});	
}

function testAddress(mongoAddress) {
	simpleConnection(mongoAddress, function(db){
		apiUtils.sysLog("Test DB Server : Connection Success");
		db.close();
	});
}

function insertSingleDocument(mongoAddress, collectionName, documentObj, callback) { // callback(result)
	simpleConnection(mongoAddress, function(db){
		var dbCollection = db.collection(collectionName);
		dbCollection.insert([documentObj] , function(err, result) {
			if (err) {
				apiUtils.sysErr(err);
			} else {
				callback(result);
			}
		})
	})
}

exports.simpleConnection = simpleConnection;
exports.testAddress = testAddress;