var MBP = function(){
	this.functionList = [];
	this.currentPos = 0;
	return this;
}

MBP.prototype.pushFunction = function(fun) {
	this.functionList.push(fun);
}

MBP.prototype.printFunctionList = function() {
	var thisFunctionList = this.functionList;
	for (index in thisFunctionList) {
		console.log(thisFunctionList[index].toString());
	}
}


//ver1 max stack 9651
MBP.prototype.processFunction = function(MBP_Object) {
	if (MBP_Object.currentPos == MBP_Object.functionList.length - 1) {
		MBP_Object.currentPos++;
		return function(){
			MBP_Object.functionList[MBP_Object.currentPos - 1](function(){})
		};
	} else if (MBP_Object.currentPos < MBP_Object.functionList.length - 1){
		MBP_Object.currentPos++;
		return function() {
			MBP_Object.functionList[MBP_Object.currentPos - 1](MBP_Object.processFunction(MBP_Object));
		};
	} else {
		return function(){};
	}
}


//---------------------------------------------

//ver 2 max stack 6603
MBP.prototype.processFunction = function(MBP_Object) {
	if (MBP_Object.currentPos == MBP_Object.functionList.length - 1) {
		MBP_Object.functionList[MBP_Object.currentPos](function(){MBP_Object.currentPos++;})
	} else if (MBP_Object.currentPos < MBP_Object.functionList.length - 1){
		MBP_Object.functionList[MBP_Object.currentPos](function(){
			MBP_Object.currentPos++;
			MBP_Object.processFunction(MBP_Object);
		});
	} 
}

MBP.prototype.startProcess = function() {
	var that = this;
	this.processFunction(that);
}

var obj = new MBP();

for (i=0; i<10000; i++) {
	var tmp_function = (function(index){ 
		return function(__callback__){
			console.log(index);
			__callback__();
		};
	})(i);

	obj.pushFunction(tmp_function);
}

setInterval(function(){
	obj.startProcess();
	console.log("Pos : " + obj.currentPos);
}, 1000);
// setInterval(function(){obj2.startProcess()}, 1000);