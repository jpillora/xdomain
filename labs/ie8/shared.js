
$(function() {

  $("#domain").html( document.domain );

  $("#send").click(function() {
    var msg = $("#msg").val();
    var frame = window.targetFrame;
    if(!frame)
      alert('target frame not set');
    frame.postMessage(msg, $("#target").val());  
  });

});

var handleMessage = null;

function gotMessage(e) {
  var msg = $("<div/>");
  msg.html(e.origin + " says: "+e.data+"\r\n");
  msg.appendTo("#messages");

  if(handleMessage)
    handleMessage(e);
}

if (document.addEventListener)
    window.addEventListener("message", gotMessage);
else
    window.attachEvent("onmessage", gotMessage);