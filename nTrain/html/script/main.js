/////full.js
var apiAddress = "http://10.193.251.188:8082/ntrain_api";

var pictureList = new Array();
var currentActiveItem = -1;
var hasSessionId = false;
var sessionId = -1;
var sessionAlias = "";
var selectedPicId = -1;
var compareDetecting = 0;
var checkIntervelId = -1;
var testDetecting = false;
var testComparing = false;
var defaultAnimationLength = 500;
var compareImgObj, existModelList;

function jqxConsole(log) {
  $("#jqx_console").jqxPanel('append', $("<span>"+log+"</span><br />"));
}

function spaceN(n){
  var str = "";
  for (i=0;i<n;i++){
    str += "&nbsp;";
  }
  return str;
}

function resultFormat(obj) {
	var str = "";
	for (i=0; i<5; i++){
		str += ("<br />" + worddata[obj.id[i]] + " : " + obj.number[i]);
	}
	return str;
}

function loadExistModels() {
  $.post(apiAddress, {
    method : 'get_model_list',
  }, function(data){
    if (data.length) {
      existModelList = data;
      for (i=0; i<data.length; i++) {
        var listName = "Name: " + data[i].alias + " ID: " + data[i].id;
        $("#jqx_model_list").jqxListBox('addItem', listName);
      } 
    } else {
      $("#jqx_model_list").jqxListBox('addItem', "No Exist Face Models... Please create a new model.");
      $("#jqx_model_list").jqxListBox({ disabled: true }); 
    }
  }, 'json');
}

function chooseModelSelectFunc(event){
  var thisIndex = event.args.index;
  var sessionId = existModelList[thisIndex].id;

  if ($(".demo_img_box").css('display') == "none") {
    //animate to display it 
    $(".demo_img_box").css('display', 'block');
    $(".demo_img_box").animate({height : '116px'}, defaultAnimationLength);
  }

  for (i=0;i<8;i++) {
    $("#demo_img_"+i).attr('src', '');
    $.post(apiAddress, {
      method : "get_img_base64",
      session_id : sessionId,
      img_id : i
    }, function(data){
      var imgId = data.img_id;
      $("#demo_img_"+imgId).attr('src', "data:image/jpeg;base64,"+data.base64_str);
    }, 'json');
  }
}

function chooseSelectedModel(){
  var selectedModelIndex = $("#jqx_model_list").jqxListBox("selectedIndex");
  sessionId = existModelList[selectedModelIndex].id;
  sessionAlias = existModelList[selectedModelIndex].alias;

  $("#test_model_div").text($("#test_model_div").text() + "[Name : " + sessionAlias + "]");
  $("#form_session_id").attr('value', selectedModelIndex);

  //animation here
  $(".choose_box").animate({
    height : "0px"
  }, function(){
    $(this).css('display', 'none');
  }); 

  $(".compare_face_box").css('display', 'block').animate({
    height : '700px'
  });
}

function newSessionWithAlias() {
  var aliasStr = $("#alias_name")[0].value;
  $("#new_session_button").text("Loading...");
  $("#choose_model_box").animate({
    height : 0 ,
    padding : 0
  }, 500, function(){ $("#choose_model_box").css("display", "none"); });
  $.post(apiAddress, {
    alias : aliasStr,
    method : "create_session"
  }, function(result){
    sessionId = result.sessionId;
    sessionAlias = result.alias;
    $('new_session_button').text("Submit");
    $('#form_session_id').attr('value', sessionId);
    hasSessionId = true;

    // $("#upload_panel_title").html("1. Add face samples of <strong>" + sessionAlias +"</strong>");
    $("#upload_panel_text").html("You can upload 8 to 20 pictures with faces of <strong>" + sessionAlias + "</strong> to train his/her face model. ");
    //animate to display train panel
    $(".out_frame").css("display","block");
    $(".choose_box").animate({
      height : '0px'
    }, defaultAnimationLength, function(){
      $(".choose_box").css('display', 'none');
    });

    $(".out_frame").animate({ height : '750px' }, defaultAnimationLength);
    $(".submit_face_box").css('display', 'block').animate({ height : '50px'}, defaultAnimationLength);
  }, 'json');
}

function listBoxSelectFunction(event) {
  var args = event.args;
  if (args) {
    selectedPicId = parseInt(args.index);
    $("#paper_container").html('');

    $("#file_img").attr('src', pictureList[selectedPicId].src);
    var leftOffset = parseInt((600 - $("#file_img").width())/2);
    var picScale = $("#file_img").width() / pictureList[selectedPicId].originalWidth;
    $("#paper_container").css("left", leftOffset+"px");

    $("#result_console").html("");

    //insert canvas boxes
    if (! pictureList[selectedPicId].result) {
      // waiting for result
      $("#result_console").html("<h4 style='text-align : center'>Detection not done... Please choose this file again.</h4>");
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
              tmpStr += "<br />Click the face again to cancel face selection.";
              tmpStr += "</p>";

              $("#result_console").html(tmpStr);
              $("#jqx_listbox").jqxListBox('getItems')[selectedPicId].label = "[√] " + pictureList[selectedPicId].fileName;
              $("#jqx_listbox").jqxListBox('invalidate');
            } else {
              //unselect this face
              pictureList[selectedPicId].selectedId = -1;
              $("#jqx_listbox").jqxListBox('getItems')[selectedPicId].label = "[X] " + pictureList[selectedPicId].fileName;
              $("#jqx_listbox").jqxListBox('invalidate');
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
          tmpStr += "<br />Click the face again to cancel face selection.";
          tmpStr += "</p>";

          $("#result_console").html(tmpStr);
        } else {
          // TODO:
          // First Click Checking.
          $("#result_console").html("<p style='text-align : center'>Please Select a Face...</p>");
        }
      }
    }
  }
}

function checkTrainingInfo(){
  $.post(apiAddress, {
    method : 'check_session_status',
    session_id : sessionId
  }, function(data){
    if (data.status == 1){
      //refresh page
      // location.reload();
    } /*else {
      // jqxConsole("Still Training... "+Date());
    }*/
  }, 'json');
}

function submitFile() {
  var imgFile = $("#img_file")[0].files[0];
  if (imgFile && (pictureList.length < 20)) {
    var picReader = new FileReader();
    picReader.readAsDataURL($("#img_file")[0].files[0]);

    picReader.onloadend = function(){
      // Add result to list
      var imgFileName = imgFile.name;
      $("#jqx_listbox").jqxListBox('addItem', "[X] " + imgFileName);
      $("#jqx_listbox").jqxListBox('invalidate');
      var thisId = pictureList.length;
      var tmpOriginalWidth, tmpOriginalHeight;

      var tmpImg = new Image();
      tmpImg.onload = function(){
        tmpOriginalWidth = this.width;
        tmpOriginalHeight = this.height;
        pictureList.push({
          id : thisId,
          src : picReader.result,
          fileName : imgFileName,
          originalWidth : tmpOriginalWidth,
          originalHeight : tmpOriginalHeight,
          selectedId : -1
        });

        $("#upload_form").ajaxSubmit({
          dataType : 'json',
          success : function(resp, status, xhr, jq){
            pictureList[thisId].result = resp.result;
            pictureList[thisId].time = resp.time;

            if (parseInt($("#jqx_listbox").jqxListBox("selectedIndex")) == thisId) {
              //It is chosen
              console.log('chosen');
              if (resp.result.length == 0) {
                // NO FACES FOUND.
                $("#result_console").html("<h3 style='text-align : center; color : red;'>No faces found. </h3>");
              } else {
                // add face chooser.
                var picScale = $("#file_img").width() / pictureList[thisId].originalWidth;
                $("#result_console").html("<p style='text-align : center'>Please Select a Face...</p>");
                for (i=0; i<resp.result.length; i++){
                  $("#paper_container").prepend("<div class='pic_paper_container' id='pic_box_container_"+i+"'></div>");
                  $("#pic_box_container_"+i).prepend("<div class='pic_paper_box' id='pic_box_"+i+"'></div>");

                  $("#pic_box_"+i).width(parseInt(resp.result[i].w*picScale)).height(parseInt(resp.result[i].h*picScale));
                  $("#pic_box_"+i).css('left',parseInt(resp.result[i].x*picScale)).css('top',parseInt(resp.result[i].y*picScale));

                  $("#pic_box_"+i).prepend("<canvas id='canvas_"+i+"' width="+parseInt(resp.result[i].w*picScale)+" height="+parseInt(resp.result[i].h*picScale)+" />");
                  var tmpCanvas = document.getElementById('canvas_'+i).getContext("2d");
                  for (j=0;j<27;j++){
                    var transX = (resp.result[i].points[j].x - resp.result[i].x)*picScale;
                    var transY = (resp.result[i].points[j].y - resp.result[i].y)*picScale;
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
                      tmpStr += "<br />Click the face again to cancel face selection.";
                      tmpStr += "</p>";

                      $("#result_console").html(tmpStr);
                      $("#jqx_listbox").jqxListBox('getItems')[selectedPicId].label = "[√] " + pictureList[selectedPicId].fileName;
                      $("#jqx_listbox").jqxListBox('invalidate');
                    } else {
                      //unselect this face
                      pictureList[selectedPicId].selectedId = -1;
                      $("#jqx_listbox").jqxListBox('getItems')[selectedPicId].label = "[X] " + pictureList[selectedPicId].fileName;
                      $("#jqx_listbox").jqxListBox('invalidate');
                      $(this).css('border-color','black');
                      $("#result_console").html("<p style='text-align : center'>Please Select a Face...</p>");
                    }
                  });
                }
              }
            }
          }
        });
      }
      tmpImg.src = this.result;
    }
  }
}

function submitCompareFile() {
  if (! testDetecting){
    $("#compare_paper_container").html("");
    var imgFile = $("#compare_img_file")[0].files[0];
    if (imgFile) {
      var picReader = new FileReader();
      picReader.readAsDataURL($("#compare_img_file")[0].files[0]);

      picReader.onloadend = function(){
        // Add result to list
        var tmpOriginalWidth, tmpOriginalHeight;

        var tmpImg = new Image();
        tmpImg.onload = function(){
          tmpOriginalWidth = this.width;
          tmpOriginalHeight = this.height;
          compareImgObj = {
            src : picReader.result,
            originalWidth : tmpOriginalWidth,
            originalHeight : tmpOriginalHeight,
            selectedId : -1
          };

          $("#compare_console").html("");
          $("#compare_img").attr('src',compareImgObj.src);
          compareImgObj.scale = $("#compare_img").width() / compareImgObj.originalWidth;
          
          testDetecting = true;
          $("#compare_form").ajaxSubmit({
            dataType : 'json',
            success : function(resp, status, xhr, jq){
              $("#compare_upload").text("Choose File");
              compareImgObj.result = resp.result;
              compareImgObj.time = resp.time;
              compareImgObj.serverId = resp.id;

              if (compareImgObj.result.length == 0) {
                $("#compare_console").html("<h3 style='text-align : center; color : red;'>No faces found. </h3>");
              } else {
                var leftOffset = parseInt((600 - $("#compare_img").width())/2);
                $("#compare_paper_container").css('left',leftOffset+"px");

                //draw face boxes here
                var thisScale = compareImgObj.scale;
                for (i=0; i<compareImgObj.result.length; i++){
                  $("#compare_paper_container").prepend("<div class='pic_paper_container' id='compare_box_container_"+i+"'></div>");
                  $("#compare_box_container_"+i).prepend("<div class='pic_paper_box' id='compare_box_"+i+"'></div>");

                  $("#compare_box_"+i).width(parseInt(compareImgObj.result[i].w*thisScale)).height(parseInt(compareImgObj.result[i].h*thisScale));
                  $("#compare_box_"+i).css('left',parseInt(compareImgObj.result[i].x*thisScale)).css('top',parseInt(compareImgObj.result[i].y*thisScale));

                  $("#compare_box_"+i).prepend("<canvas id='compare_canvas_"+i+"' width="+parseInt(compareImgObj.result[i].w*thisScale)+" height="+parseInt(compareImgObj.result[i].h*thisScale)+" />");
                  var tmpCanvas = document.getElementById('compare_canvas_'+i).getContext("2d");
                  for (j=0;j<27;j++){
                    var transX = (compareImgObj.result[i].points[j].x - compareImgObj.result[i].x)*thisScale;
                    var transY = (compareImgObj.result[i].points[j].y - compareImgObj.result[i].y)*thisScale;
                    tmpCanvas.beginPath();
                    tmpCanvas.arc(transX, transY, 1, 0, 2*Math.PI);
                    tmpCanvas.fillStyle = 'red';
                    tmpCanvas.fill();
                  }

                  $("#compare_box_"+i).mouseenter(function(){
                    var thisId = parseInt($(this).attr("id").slice(12));
                    if (compareImgObj.selectedId != thisId) {
                      $(this).css('background-color','rgba(255,255,255,0.5)');
                      $(this).find("canvas").css("display", "inline-block");
                    }
                  }).mouseleave(function(){
                    var thisId = parseInt($(this).attr("id").slice(12));
                    if (compareImgObj.selectedId != thisId) {
                      $(this).css('background-color','transparent');
                      $(this).find("canvas").css("display", "none");
                    }
                  }).click(function(){
                    var thisId = parseInt($(this).attr("id").slice(12));
                    if (compareImgObj.selectedId != thisId) {
                      // select this face
                      $("#compare_box_"+compareImgObj.selectedId).css('border-color','black').css('background-color','transparent').find('canvas').css('display','none');
                      $(this).css('border-color','red').css('background-color','rgba(255,255,255,0.5)');
                      $(this).find("canvas").css("display", "inline-block");
                      compareImgObj.selectedId = thisId;

                      var tmpStr = "<p>";
                      tmpStr += "Picture Size : "+compareImgObj.originalWidth+"x"+compareImgObj.originalHeight;
                      tmpStr += spaceN(10);
                      tmpStr += "Face Size : "+compareImgObj.result[thisId].w+"x"+compareImgObj.result[thisId].h;
                      tmpStr += spaceN(10);
                      tmpStr += "Detection Time : "+compareImgObj.time+"ms";
                      tmpStr += "<br/></p>";

                      $("#compare_console").html(tmpStr);
                    } else {
                      // unselect this face
                      compareImgObj.selectedId = -1;
                      $(this).css('border-color','black');
                      $("#compare_console").html("<p style='text-align : center'>Please Select a Face...</p>");
                    }
                  });

                }
              }

              testDetecting = false;

              //auto click
              if (compareImgObj.result.length == 1) {
                $("#compare_box_0").click();
                $("#compare_start").click();
              }
            }
          });

          $("#compare_upload").text("Detecting...");
        }
        tmpImg.src = this.result;
      }
    } else {
      // user canceled choosing a file...
      $("#compare_console").html("<h3>Please choose a picture again...</h3>");
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
  // jqxConsole("[INFO] " + validFacesNumber());
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
    $.post(apiAddress, {
      method : "submit_face",
      json_data : jsonStr,
      session_id : sessionId
    }, function(data){
      //set checkIntervelId
      $("#submit_face_button").text("Training...");
      // Add a window here
      dhtmlx.modalbox({ 
        title : "Training...", 
        text : "Training process will spend about 15 seconds, please be patient.<br /> <img style='margin-left : 225px;' src='./image/loading.gif' width='50px' height='50px'>",
        width : "550px",
        height : "150px"
      });
      checkIntervelId = setInterval(checkTrainingInfo, 1000);
    }, 'json');

  } else {
    dhtmlx.alert("[ERROR] No enough faces. Please choose more than 8 faces");
  }
}

function testSelectedFace(){
  $("#temp_score_box").remove();
  var imgId = compareImgObj.serverId;
  var faceId = compareImgObj.selectedId;
  var postObj = {
    method : "compare_image",
    face_id : faceId,
    img_id : imgId,
    session_id : sessionId
  };

  $("#compare_start").text("Scoring...");
  $.post(apiAddress, postObj, function(data, textStatus, jqXHR){
    $("#compare_console").find("p").append($("<span id='temp_score_box'>Score: "+data.result+" Time: "+data.time+"ms</span>").css('font-size', 'x-large')[0]);
    $("#compare_start").text("Compare");
  }, 'json');
}

