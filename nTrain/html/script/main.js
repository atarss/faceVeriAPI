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
    $("#paper_container").html('');

    $("#file_img").attr('src', pictureList[selectedPicId].src);
    var leftOffset = parseInt((600 - $("#file_img").width())/2);
    var picScale = $("#file_img").width() / pictureList[selectedPicId].originalWidth;
    jqxConsole("picScale : "+picScale);
    $("#paper_container").css("left", leftOffset+"px");

    $("#result_console").html("");

    //insert canvas boxes
    if (! pictureList[selectedPicId].result) {
      // waiting for result
      $("#result_console").html("<p style='text-align : center'>Loading...</p>");
    } else {
      if (pictureList[selectedPicId].result.length == 0) {
        $("#result_console").html("<h3 style='text-align : center; color : red;'>No faces found. </h3>");
      } else {
        for (i=0; i<pictureList[selectedPicId].result.length; i++){
          $("#paper_container").prepend("<div class='pic_paper_container' id='pic_box_container_"+i+"'></div>");
          $("#pic_box_container_"+i).prepend("<div class='pic_paper_box' id='pic_box_"+i+"'></div>");

          $("#pic_box_"+i).width(parseInt(pictureList[selectedPicId].result[i].w*picScale)).height(parseInt(pictureList[selectedPicId].result[i].h*picScale));
          $("#pic_box_"+i).css('left',parseInt(pictureList[selectedPicId].result[i].x*picScale)).css('top',parseInt(pictureList[selectedPicId].result[i].y*picScale));

          $("#pic_box_"+i).prepend("<canvas id='canvas_"+i+"' width="+parseInt(pictureList[selectedPicId].result[i].w*picScale)+" height="+parseInt(pictureList[selectedPicId].result[i].h*picScale)+" />");
          var tmpCanvas = document.getElementById('canvas_'+i).getContext("2d");
          for (j=0;j<27;j++){
            var transX = (pictureList[selectedPicId].result[i].points[j].x - pictureList[selectedPicId].result[i].x)*picScale;
            var transY = (pictureList[selectedPicId].result[i].points[j].y - pictureList[selectedPicId].result[i].y)*picScale;
            tmpCanvas.beginPath();
            tmpCanvas.arc(transX, transY, 1, 0, 2*Math.PI);
            tmpCanvas.fillStyle = 'red';
            tmpCanvas.fill();
          }

          $("#pic_box_"+i).mouseenter(function(){
            var thisId = parseInt($(this).attr("id").slice(8));
            if (pictureList[selectedPicId].selectedId != thisId) {
              $(this).css('background-color','rgba(255,255,255,0.5)');
              $(this).find("canvas").css("display", "inline-block");
            }
          }).mouseleave(function(){
            var thisId = parseInt($(this).attr("id").slice(8));
            if (pictureList[selectedPicId].selectedId != thisId) {
              $(this).css('background-color','transparent');
              $(this).find("canvas").css("display", "none");
            }
          }).click(function(){
            var thisId = parseInt($(this).attr("id").slice(8));
            if (pictureList[selectedPicId].selectedId != thisId) {
              // select this face
              $("#pic_box_"+pictureList[selectedPicId].selectedId).css('border-color','black').css('background-color','transparent').find('canvas').css('display','none');
              $(this).css('border-color','red').css('background-color','rgba(255,255,255,0.5)');
              $(this).find("canvas").css("display", "inline-block");
              pictureList[selectedPicId].selectedId = thisId;

              var tmpStr = "<p>";
              tmpStr += "Picture Size : "+pictureList[selectedPicId].originalWidth+"x"+pictureList[selectedPicId].originalHeight;
              tmpStr += '<br />';
              tmpStr += "Face Size : "+pictureList[selectedPicId].result[thisId].w+"x"+pictureList[selectedPicId].result[thisId].h;
              tmpStr += "<br />";
              tmpStr += "Detection Time : "+pictureList[selectedPicId].time+"ms";
              tmpStr += "</p>";

              $("#result_console").html(tmpStr);
            } else {
              pictureList[selectedPicId].selectedId = -1;
              $(this).css('border-color','black');
              $("#result_console").html("<p style='text-align : center'>Please Select a Face...</p>");
            }
          });
        }

        //check selected face
        if (pictureList[selectedPicId].selectedId >= 0) {
          var selectedFaceId = pictureList[selectedPicId].selectedId;
          $("#pic_box_"+selectedFaceId).css('border-color','red').css('background-color','rgba(255,255,255,0.5)');
          $("#pic_box_"+selectedFaceId).find('canvas').css('display','inline-block');

          var tmpStr = "<p>";
          tmpStr += "Picture Size : "+pictureList[selectedPicId].originalWidth+"x"+pictureList[selectedPicId].originalHeight;
          tmpStr += '<br />';
          tmpStr += "Face Size : "+pictureList[selectedPicId].result[selectedFaceId].w+"x"+pictureList[selectedPicId].result[selectedFaceId].h;
          tmpStr += "<br />";
          tmpStr += "Detection Time : "+pictureList[selectedPicId].time+"ms";
          tmpStr += "</p>";

          $("#result_console").html(tmpStr);
        } else {
          if (pictureList[selectedPicId].result.length == 1) {
            $("#pic_box_0").click();
          } else {
            $("#result_console").html("<p style='text-align : center'>Please Select a Face...</p>");
          }
        }
      }
    }
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
      var tmpOriginalWidth, tmpOriginalHeight;

      var tmpImg = new Image();
      tmpImg.onload = function(){
        tmpOriginalWidth = this.width;
        tmpOriginalHeight = this.height;
        pictureList.push({
          id : thisId,
          src : picReader.result,
          originalWidth : tmpOriginalWidth,
          originalHeight : tmpOriginalHeight,
          selectedId : -1
        });

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

function validFacesNumber(){
  var sum = 0;
  for (index=0; index<pictureList.length; index++){
    if (pictureList[index].selectedId >= 0) sum++;
  }

  return sum;
}

function submitFaces(){
  jqxConsole("[INFO] " + validFacesNumber());
  if (validFacesNumber() >= 8) {
    var faceArr = new Array();
    for (i=0; i<pictureList.length; i++){
      if (pictureList[i].selectedId >= 0){
        faceArr.push({
          picId : i,
          faceId : pictureList[i].selectedId
        });
      }
    }

    var jsonStr = JSON.stringify(faceArr);
    jqxConsole("[JSON] " + jsonStr);

    $.post(apiAddress, {
      method : "submit_face",
      json_data : jsonStr,
      session_id : sessionId
    }, function(data, textStatus, jqXHR){
      jqxConsole(JSON.stringify(data));
    }, 'json');

  } else {
    jqxConsole("[ERR] No enough faces...");
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
