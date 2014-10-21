// database.js
// Database Driver for API
// Using mongodb as database backend.

var mongo = require("mongodb");
var defaultMongoAddress = apiConfig.mongoServerUrl;
var isWorking = false;

function simpleConnection(mongoAddress, callback) {
	mongo.MongoClient.connect(mongoAddress, function(err, db){
		if (err) {
			apiUtils.sysErr("Error connecting to mongodb server. Daemon is down?");
		} else {
			callback(db);
		}
	});
}

function testAddress(mongoAddress) {
	simpleConnection(mongoAddress, function(db){
		apiUtils.sysLog("Test DB Server : Connection Success");
		defaultMongoAddress = mongoAddress;
		db.close();
	});
}

function insertDocumentsArray(collectionName, documentObjArr, callback) { // callback(result)
	simpleConnection(defaultMongoAddress, function(db){
		var dbCollection = db.collection(collectionName);
		dbCollection.insert(documentObjArr , function(err, result) {
			db.close();
			
			if (err) {
				apiUtils.sysErr(err);
			} else {
				if (callback) {
					callback(result);
				}
			}
		});
	});
}

function insertSingleDocument(collectionName, documentObj, callback) { // callback(result)
	insertDocumentsArray(collectionName, [documentObj], callback);
}

exports.mongo = mongo;
exports.simpleConnection = simpleConnection;
exports.testAddress = testAddress;
exports.insertSingleDocument = insertSingleDocument;