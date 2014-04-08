/////full.js
var apiAddress = "http://10.193.251.172:8082/ntrain_api";

var pictureList = new Array();
var currentActiveItem = -1;
var hasSessionId = false;
var sessionId = -1;
var selectedPicId = -1;

function jqxConsole(log){
  $("#jqx_console").jqxPanel('append', $("<span>"+log+"</span><br />"));
}

function resultFormat (obj) {
	var str = "";
	for (i=0; i<5; i++){
		str += ("<br />" + worddata[obj.id[i]] + " : " + obj.number[i]);
	}
	return str;
}

function listBoxSelectFunction(event) {
  var args = event.args;
  if (args) {
    selectedPicId = parseInt(args.index);
    jqxConsole("selected Id:" + selectedPicId);

    $("#file_img").attr('src', pictureList[selectedPicId].src);
    var leftOffset = parseInt((600 - $("#file_img").width())/2);
    var picScale = $("#file_img").width() / pictureList[selectedPicId].originalWidth;
    jqxConsole("picScale : "+picScale);
    $("#paper_container").css("left", leftOffset+"px");

    //insert canvas boxes

  }
}

function submitFile() {
  var imgFile = $("#img_file")[0].files[0];
  if (imgFile && (pictureList.length < 20)) {
    var picReader = new FileReader();
    picReader.readAsDataURL($("#img_file")[0].files[0]);

    picReader.onloadend = function(){
      // Add result to list
      jqxConsole(imgFile.name + " load end.");
      $("#jqx_listbox").jqxListBox('addItem', imgFile.name);
      var thisId = pictureList.length;
      var tmpOriginalWidth;

      var tmpImg = new Image();
      tmpImg.onload = function(){
        tmpOriginalWidth = this.width;
        pictureList.push({
          id : thisId,
          src : picReader.result,
          originalWidth : tmpOriginalWidth,
          selectedId : -1
        });

        console.log(this.width);

        $("#upload_form").ajaxSubmit({
          dataType : 'json',
          success : function(resp, status, xhr, jq){
            jqxConsole("Uploaded : "+JSON.stringify(resp));
            pictureList[thisId].result = resp.result;
            pictureList[thisId].time = resp.time;
          }
        });
      }
      tmpImg.src = this.result;
    }
  }
}

// if (imgFile && (pictureList.length < 20)) {
//   $("#upload_form").ajaxSubmit({
//     dataType : 'json',
//     success : function(resp,status,xhr,jq){
//     	var newIdNumber = pictureList.length;
//     	var picReader = new FileReader();
//     	picReader.readAsDataURL($("#img_file")[0].files[0]);

//     	picReader.onloadend = function(){
//       	// Add result to list
//       	var newArrObj = {
//       		domId : "pic_"+newIdNumber,
//       		serverId : eval(resp).id,
//       		picData : picReader.result,
//       		fileName : imgFile.name
//       	};
//       	pictureList.push(newArrObj);

//       	//create new DOM node
//       	var newDomId = newArrObj.domId;
//       	var newDomText = "#"+(newIdNumber+1)+": "+newArrObj.fileName;
//       	$("#picture_list").append("<a id='"+newDomId+"' class='list-group-item' href='#'>"+newDomText+"</a>");

//       	$("#"+newDomId).click(function(){
//       		if (currentActiveItem >= 0) $("#pic_"+currentActiveItem).attr('class', 'list-group-item');
//       		$(this).attr('class', 'list-group-item active');
//       		currentActiveItem = newIdNumber;
//       		var index = parseInt(newDomId.slice(4));
//       		$("#file_name").text(pictureList[index].fileName);
//       		$("#file_img").attr("src",pictureList[index].picData);
//       		$("#file_status").text("Loading...");
//       		$.post("http://123.127.237.160:8080/image_api",{
//         		'version' : '1.0',
//         		'method' : 'check_image',
//         		'id' : pictureList[index].serverId
//       		}, function(d){
//         		$("#file_status").text(d.status);
//         		if (d.status.toLowerCase() == 'done') {
//           			$("#file_result").text(resultFormat(d.result));
//         		} else {
//           			$("#file_result").text("---");
//         		}
//       		}, 'json');
//       	});
//     	};
//     }
//   });
// }
