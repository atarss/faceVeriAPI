////script.js

var leftReader = new FileReader();
var rightReader = new FileReader();
var leftImgObj = {}, rightImgObj = {};
var resultArr = new Array();

var hasClickedDetection = false;
var hasDetected = false;
var isComparing = false;
var leftSelected = -1;
var rightSelected = -1;
var maxDisplayHeight;
var detectionTime;

var consoleMessageStr = "<h3 class='console_message'>Please select a face by clicking on a face.</h3>";
var consoleErrorStr = "<p class='console_error'>ERROR : No faces were found on this picture.</p>";

var apiServer = "http://123.127.237.160:8080/face_api";

leftReader.onloadend = function(){
  $("#left_img").attr("src", this.result);
  var tmpImg = new Image();
  tmpImg.onload = function(){
  	leftImgObj.originalHeight = this.height;
  	leftImgObj.originalWidth = this.width;
  };
  tmpImg.src = this.result;
  leftImgObj.displayHeight = $("#left_img").height();
  leftImgObj.displayWidth = $("#left_img").width();
}; 

rightReader.onloadend = function(){
  $("#right_img").attr("src", this.result);
  var tmpImg = new Image();
  tmpImg.onload = function(){
  	rightImgObj.originalHeight = this.height;
  	rightImgObj.originalWidth = this.width;
  };
  tmpImg.src = this.result;
  rightImgObj.displayHeight = $("#right_img").height();
  rightImgObj.displayWidth = $("#right_img").width();
};

function comparePicMainFunc() {
  // $(this).attr("disabled","disabled")
  // $("#submit_button").attr("value", "Loading......");
  $("#submit_button").css("display", "none");

  leftImgObj.displayHeight = $("#left_img").height();
  leftImgObj.displayWidth = $("#left_img").width();
  rightImgObj.displayHeight = $("#right_img").height();
  rightImgObj.displayWidth = $("#right_img").width();

  $(".buttonbox").css("display", "none");
  $(".submit_box").find("p").prepend("<img src='image/loading.gif' id='loading_gif'>");
  
  $(".file_button").css("display", "none");
  
  if ($("#left_img").height() > $("#right_img").height()) {
    maxDisplayHeight = $("#left_img").height();
  } else {
    maxDisplayHeight = $("#right_img").height();
  }
  $(".picbox").css('height',maxDisplayHeight+"px");
  $(".mainpicbox").css('height',maxDisplayHeight+"px");

  // if (leftImgObj.displayHeight < maxDisplayHeight) {
  //   $("#pic_paper_1").css('top', parseInt((maxDisplayHeight - leftImgObj.displayHeight)/2)+"px");
  //   $("#pic_box_1").css('top', parseInt((maxDisplayHeight - leftImgObj.displayHeight)/2)+"px");
  //  }

  // if (rightImgObj.displayHeight < maxDisplayHeight) {
  //   $("#pic_paper_2").css('top', parseInt((maxDisplayHeight - rightImgObj.displayHeight)/2)+"px");
  //   $("#pic_box_2").css('top', parseInt((maxDisplayHeight - rightImgObj.displayHeight)/2)+"px");
  // }

  console.log("loading...");
  $("#upload_form").ajaxSubmit({
    dataType : "json",
    success : function(resp,status,xhr,jq){
      console.log(resp);
      detectionTime = resp.time;
      hasDetected = true;
      
      leftImgObj.serverId = resp.img1.id;
      leftImgObj.result = resp.img1.result;
      rightImgObj.serverId = resp.img2.id;
      rightImgObj.result = resp.img2.result;
      $("#paper_container_1").prepend("<div id='pic_paper_1' class='pic_paper'></div>");
      $("#pic_paper_1").height(leftImgObj.displayHeight - 1).width(leftImgObj.displayWidth - 1);
      var leftImgOffset = parseInt((580 - leftImgObj.displayWidth) / 2);
      $("#pic_paper_1").css("left",leftImgOffset);
      var leftScale = $("#left_img").width() / leftImgObj.originalWidth;
      for (i=0;i<leftImgObj.result.length;i++) {
        $("#pic_paper_1").prepend("<div class='pic_paper_container' id='left_box_container_"+i+"'></div>");
        $("#left_box_container_"+i).prepend("<div class='pic_paper_box' id='left_box_"+i+"'></div>");

        $("#left_box_"+i).width(parseInt(leftImgObj.result[i].w*leftScale)).height(parseInt(leftImgObj.result[i].h*leftScale));
        $("#left_box_"+i).css('left',parseInt(leftImgObj.result[i].x*leftScale)).css('top',parseInt(leftImgObj.result[i].y*leftScale));
        $("#left_box_"+i).mouseenter(function(){
          var thisId = parseInt($(this).attr("id").slice(9));
          if (leftSelected != thisId) {
            $(this).css('background-color','rgba(255,255,255,0.5)');
            $(this).find("canvas").css("display", "inline-block");
          }
        }).mouseleave(function(){
          var thisId = parseInt($(this).attr("id").slice(9));
          if (leftSelected != thisId) {
            $(this).css('background-color','transparent');
            $(this).find("canvas").css("display", "none");
          }
        });

        $("#left_box_"+i).prepend("<canvas id='left_canvas_"+i+"' width="+parseInt(leftImgObj.result[i].w*leftScale)+" height="+parseInt(leftImgObj.result[i].h*leftScale)+" />");
        var tmpCanvas = document.getElementById('left_canvas_'+i).getContext("2d");
        for (j=0;j<27;j++){
          var transX = (leftImgObj.result[i].points[j].x - leftImgObj.result[i].x)*leftScale;
          var transY = (leftImgObj.result[i].points[j].y - leftImgObj.result[i].y)*leftScale;
          tmpCanvas.beginPath();
          tmpCanvas.arc(transX, transY, 1, 0, 2*Math.PI);
          tmpCanvas.fillStyle = 'red';
          tmpCanvas.fill();
        }
      }


      $("#paper_container_2").prepend("<div id='pic_paper_2' class='pic_paper'></div>");
      $("#pic_paper_2").height(rightImgObj.displayHeight - 1).width(rightImgObj.displayWidth - 1);
      var rightImgOffset = parseInt((580 - rightImgObj.displayWidth) / 2);
      $("#pic_paper_2").css("left",rightImgOffset);
      var rightScale = $("#right_img").width() / rightImgObj.originalWidth;
      for (i=0;i<rightImgObj.result.length;i++) {
        $("#pic_paper_2").prepend("<div class='pic_paper_container' id='right_box_container_"+i+"'></div>");
        $("#right_box_container_"+i).prepend("<div class='pic_paper_box' id='right_box_"+i+"'></div>");

        $("#right_box_"+i).width(parseInt(rightImgObj.result[i].w*rightScale)).height(parseInt(rightImgObj.result[i].h*rightScale));
        $("#right_box_"+i).css('left',parseInt(rightImgObj.result[i].x*rightScale)).css('top',parseInt(rightImgObj.result[i].y*rightScale));
        $("#right_box_"+i).mouseenter(function(){
          var thisId = parseInt($(this).attr("id").slice(10));
          if (rightSelected != thisId) {
            $(this).css('background-color','rgba(255,255,255,0.5)');
            $(this).find("canvas").css("display", "inline-block");
          }
        }).mouseleave(function(){
          var thisId = parseInt($(this).attr("id").slice(10));
          if (rightSelected != thisId) {
            $(this).css('background-color','transparent');
            $(this).find("canvas").css("display", "none");
          }
        });

        $("#right_box_"+i).prepend("<canvas id='right_canvas_"+i+"' width="+parseInt(rightImgObj.result[i].w*rightScale)+" height="+parseInt(rightImgObj.result[i].h*rightScale)+" />");
        var tmpCanvas = document.getElementById('right_canvas_'+i).getContext("2d");
        for (j=0;j<27;j++){
          var transX = (rightImgObj.result[i].points[j].x - rightImgObj.result[i].x)*rightScale;
          var transY = (rightImgObj.result[i].points[j].y - rightImgObj.result[i].y)*rightScale;
          tmpCanvas.beginPath();
          tmpCanvas.arc(transX, transY, 1, 0, 2*Math.PI);
          tmpCanvas.fillStyle = 'red';
          tmpCanvas.fill();
        }
      }
      $(".console_container").css('display','block');
      $("#submit_button").attr('value','Compare').css('display','inline-block').removeAttr("disabled");
      $("#loading_gif").remove();

      //compare faces
      //left first

      for (i=0;i<leftImgObj.result.length;i++){
        $("#left_box_"+i).click(function(){
          var thisId = parseInt($(this).attr("id").slice(9));
          if (leftSelected != thisId){
            $("#left_box_"+leftSelected).css('border-color','black').css('background-color','transparent').find('canvas').css('display','none');

            var tmpStr = "<p>";
            tmpStr += "Picture Size : "+leftImgObj.originalWidth+"x"+leftImgObj.originalHeight;
            tmpStr += '<br />';
            tmpStr += "Face Size : "+leftImgObj.result[thisId].w+"x"+leftImgObj.result[thisId].h;
            tmpStr += "<br />";
            tmpStr += "Pictrue Id: "+leftImgObj.serverId+"     Face Id: "+thisId;
            tmpStr += "</p>";

            $("#left_console_box").html(tmpStr).find("p").css('margin-left','10'); 
            $(this).css('border-color','red');
            $(this).css('background-color','rgba(255,255,255,0.5)');
            $(this).find("canvas").css("display", "inline-block");
            leftSelected = thisId;
          } else {
            leftSelected = -1;
            $("#left_console_box").html(consoleMessageStr);
            $(this).css('border-color','black');
          }
        });
      }

      for (i=0;i<rightImgObj.result.length;i++){
        $("#right_box_"+i).click(function(){
          var thisId = parseInt($(this).attr("id").slice(10));
          if (rightSelected != thisId) {
            $("#right_box_"+rightSelected).css('border-color','black').css('background-color','transparent').find('canvas').css('display','none');

            var tmpStr = "<p>";
            tmpStr += "Picture Size : "+rightImgObj.originalWidth+"x"+rightImgObj.originalHeight;
            tmpStr += '<br />';
            tmpStr += "Face Size : "+rightImgObj.result[thisId].w+"x"+rightImgObj.result[thisId].h;
            tmpStr += "<br />";
            tmpStr += "Pictrue Id: "+rightImgObj.serverId+"     Face Id: "+thisId;
            tmpStr += "</p>";

            $("#right_console_box").html(tmpStr).find("p").css('margin-left','10');
            $(this).css('border-color','red');
            $(this).css('background-color','rgba(255,255,255,0.5)');
            $(this).find("canvas").css("display", "inline-block");
            rightSelected = thisId;
          } else {
            rightSelected = -1;
            $("#right_console_box").html(consoleMessageStr);
            $(this).css('border-color','black');
          }
        });
      }

      //put some instructions into box div
      if (leftImgObj.result.length > 1) { $("#left_console_box").html(consoleMessageStr); }
      if (rightImgObj.result.length > 1) { $("#right_console_box").html(consoleMessageStr); }
      //error for no faces
      if (leftImgObj.result.length == 0) {
        var tmpStr = "<p class='console_error'>ERROR : No faces were found on this picture.</p>";
        $("#left_console_box").html(tmpStr);
      }
      if (rightImgObj.result.length == 0) {
        var tmpStr = "<p class='console_error'>ERROR : No faces were found on this picture.</p>";
        $("#right_console_box").html(tmpStr);
      }
      $(".result_box").css('display','block').height(20);
      $("#result_box_p").text("Dectetion Time : "+detectionTime+"ms");
      $("#result_box_h").css('display','none');
      $("#result_box_h3").css('display','none');

      //auto click for one face
      if (leftImgObj.result.length == 1) { $("#left_box_0").click(); }
      if (rightImgObj.result.length == 1) { $("#right_box_0").click(); }

      //if there is only one face on each pic, compare them automaticly
      if (leftSelected == 0 && rightSelected == 0 && (! isComparing)) {
        //click button
        compareFace(0,0);
      }
    }
  });
}

function compareFace (faceId1, faceId2) {
  $("#submit_button").css("display", "none");
  $(".submit_box").find("p").prepend("<img src='image/loading.gif' id='loading_gif'>");
  console.log(faceId1 + " , " + faceId2);
  
  $.post(apiServer, {
    'method' : 'compare_image',
    'img_id_1' : leftImgObj.serverId,
    'img_id_2' : rightImgObj.serverId,
    'rect_id_1' : faceId1,
    'rect_id_2' : faceId2
  }, function(data, textStatus, jqXHR){
    $(".result_box").css('height','100px');
    $("#result_box_p").css('display','block').html("<p id='result_box_p'>Comparing Time : " + data.time + "ms<br />Detection Time : " + detectionTime + "ms");
    $("#result_box_h").css('display','block').text("Result(0~1) : " + data.result);
    $("#result_box_h3").css('display','block');
    
    $("#submit_button").css('display','inline-block');
    $("#loading_gif").remove();
  }, 'json');
}
