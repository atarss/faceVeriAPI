// processQueue.js
// process library

// check for apiUtils avaliability
if (typeof(apiUtils) == "undefined") {
	apiUtils = require("./utils.js");
}

var processQueue = function(){
	this.timerInterval = 100; // default 100 ms for a tick.
	this.queue = [];
	this.currentPosition = 0;
	this.hasStarted = false; //not started

	this.maxWorkers = 1; // 1 worker at default, set to 0 means no delay(it's danger)
	this.runningWorkers = 0; // 0 at first... nobody is working now.

	this._timerId = -1; //no timer ID at first
	return this;
}

processQueue.prototype.push = function(processFunc) {
	// Your Function 'processFunc' should have callback() part in it.
	// When 'processFunc' is done, callback() will be triggered and this library will know a job is done.

	var queueObj = {
		func : processFunc,
		isDone : false,
		isStarted : false
	};

	this.queue.push(queueObj);
};

processQueue.prototype.getQueueLength = function() {
	return this.queue.length;
};

processQueue.prototype._processor = function() {
	var that = this;
	var timerId = setInterval(function(){
		if (that.currentPosition < that.queue.length) {
			if (that.runningWorkers < that.maxWorkers) {
				// then process a job
				var currentPos = that.currentPosition
				that.currentPosition = currentPos + 1;
				that.runningWorkers++;

				// start worker
				that.queue[currentPos].isStarted = true;
				that.queue[currentPos].func(function(){
					// callback for worker
					that.queue[currentPos].isStarted = false;
					that.queue[currentPos].isDone = true;
					that.runningWorkers--;
				});
			}
		}
	}, that.timerInterval);
	return timerId;
};

processQueue.prototype.startQueue = function() {
	this._timerId = this._processor();
	this.hasStarted = true;
};

processQueue.prototype.stopQueue = function() {
	apiUtils.sysLog("Warning : 'stopQueue' method is violent.");

	clearInterval(this._timerId);
	this.hasStarted = false;
}

processQueue.prototype.setTimerInterval = function(_timerInt) {	
	this.timerInterval = _timerInt;
};

processQueue.prototype.setMaxWorker = function(_worker) {
	this.maxWorkers = _worker;
};


//===========================================
// DEMONSTRATION
//===========================================

// var queue = new processQueue();

// for (i = 0; i<2; i++) {
// 	queue.push(function(callback){
// 		console.log(i);
// 		callback();
// 	});
// }

// queue.startQueue();

exports.processQueue = processQueue;
