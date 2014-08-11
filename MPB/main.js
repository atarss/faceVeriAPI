var MBP = function(){
	this.functionList = [];
	this.currentPos = 0;
	return this;
}

MBP.prototype.pushFunction = function(fun) {
	this.functionList.push(fun);
}

//ver1 max stack 9658
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

//ver 2 max stack 6608
MBP.prototype.processFunction_ver2 = function(MBP_Object) {
	if (MBP_Object.currentPos == MBP_Object.functionList.length - 1) {
		MBP_Object.functionList[MBP_Object.currentPos](function(){MBP_Object.currentPos++;})
	} else if (MBP_Object.currentPos < MBP_Object.functionList.length - 1){
		MBP_Object.functionList[MBP_Object.currentPos](function(){
			MBP_Object.currentPos++;
			MBP_Object.processFunction_ver2(MBP_Object);
		});
	} 
}

MBP.prototype.startProcess = function() {
	this.processFunction(this)();
}

MBP.prototype.startProcess_ver2 = function() {
	this.processFunction_ver2(this);
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

obj.startProcess();
// obj.startProcess_ver2();